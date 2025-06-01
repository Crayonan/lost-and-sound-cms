// src/collections/Products.ts
import type {
  CollectionConfig,
  CollectionBeforeChangeHook,
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
} from 'payload'
import Stripe from 'stripe'
import { APIError, type PayloadRequest } from 'payload'
import type { Product, Media } from '../payload-types'

const stripeSecretKey = process.env.STRIPE_SECRET_KEY
const payloadServerURL = process.env.PAYLOAD_PUBLIC_SERVER_URL

if (!stripeSecretKey) {
  console.error('Stripe secret key is not configured. Product syncing will fail.')
}
if (!payloadServerURL) {
  console.warn('PAYLOAD_PUBLIC_SERVER_URL is not set. Image URLs for Stripe might be incorrect.')
}

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2022-08-01',
      appInfo: {
        name: 'Lost & Sound CMS Stripe Integration',
        url: payloadServerURL || 'http://localhost:3000',
      },
    })
  : null

const beforeProductChange: CollectionBeforeChangeHook<Product> = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  const { payload } = req

  if (!stripe) {
    payload.logger.warn(
      `Stripe not initialized. Skipping custom Stripe logic for Product ${data.name || originalDoc?.name}.`,
    )
    return data
  }

  if (req.context?.isInternalSkipSyncReset) {
    return data // Do nothing if this is our internal skipSync reset call
  }

  // If plugin's beforeValidate hook (createNewInStripe) already ran and set skipSync,
  // it means the product and initial price were likely created by the plugin.
  // Our job here is primarily to ensure stripePriceID is captured if the plugin didn't,
  // and handle price updates for existing docs.
  if (operation === 'create') {
    if (data.skipSync && data.stripeID) {
      payload.logger.info(
        `Product ${data.name}: Plugin's hook likely created Stripe product ${data.stripeID}. Ensuring stripePriceID is set.`,
      )
      // Plugin should have set stripeID and handled initial price.
      // We just ensure stripePriceID is populated if plugin didn't (or if default_price is an object).
      if (!data.stripePriceID && data.stripeID) {
        try {
          const stripeProduct = await stripe.products.retrieve(data.stripeID as string, {
            expand: ['default_price'],
          })
          if (stripeProduct.default_price && typeof stripeProduct.default_price === 'string') {
            data.stripePriceID = stripeProduct.default_price
          } else if (
            stripeProduct.default_price &&
            typeof stripeProduct.default_price === 'object' &&
            stripeProduct.default_price.id
          ) {
            data.stripePriceID = stripeProduct.default_price.id
          } else {
            // If still no default_price ID, try to fetch the first active price
            const prices = await stripe.prices.list({
              product: data.stripeID,
              active: true,
              limit: 1,
            })
            if (prices.data.length > 0) {
              data.stripePriceID = prices.data[0].id
              payload.logger.info(
                `Fetched and set stripePriceID to ${data.stripePriceID} for new product ${data.stripeID}`,
              )
            } else {
              payload.logger.warn(
                `No active default price ID found for new Stripe product ${data.stripeID} after plugin creation.`,
              )
            }
          }
        } catch (error: any) {
          payload.logger.error(
            `Error retrieving/setting stripePriceID for ${data.stripeID} after plugin creation: ${error.message}`,
          )
        }
      }
      // skipSync remains true, set by plugin
    } else {
      // This block would run if the plugin's createNewInStripe didn't run or didn't set skipSync.
      // This is our original custom creation logic as a fallback.
      payload.logger.info(
        `Product ${data.name}: Creating in Stripe via custom hook (plugin might not have run or set skipSync)...`,
      )
      try {
        const createParams: Stripe.ProductCreateParams = {
          name: data.name,
          description: data.description || undefined,
          default_price_data: { unit_amount: data.price, currency: data.currency },
        }
        if (data.productImage) {
          let imageUrl: string | undefined
          const imageDocID =
            typeof data.productImage === 'number'
              ? data.productImage
              : (data.productImage as Media).id
          const mediaDoc = await payload.findByID({ collection: 'media', id: imageDocID, depth: 0 })
          if (mediaDoc && mediaDoc.url && payloadServerURL) {
            imageUrl = `${payloadServerURL}${mediaDoc.url.startsWith('/') ? mediaDoc.url : '/' + mediaDoc.url}`
            if (!imageUrl.startsWith('http'))
              throw new APIError(`Generated image URL for new product is not absolute: ${imageUrl}`)
            createParams.images = [imageUrl]
          } else if (!payloadServerURL) {
            payload.logger.error(
              'PAYLOAD_PUBLIC_SERVER_URL is not set. Cannot form absolute image URL for Stripe product creation.',
            )
          }
        }

        const stripeProduct = await stripe.products.create(createParams)
        data.stripeID = stripeProduct.id
        if (stripeProduct.default_price && typeof stripeProduct.default_price === 'string') {
          data.stripePriceID = stripeProduct.default_price
        } else {
          const prices = await stripe.prices.list({ product: stripeProduct.id, limit: 1 })
          if (prices.data.length > 0) data.stripePriceID = prices.data[0].id
        }
        payload.logger.info(
          `Product ${data.name}: Custom hook created in Stripe. Product ID: ${data.stripeID}, Price ID: ${data.stripePriceID}.`,
        )
        data.skipSync = true // Signal to subsequent hooks
      } catch (error: any) {
        payload.logger.error(
          `Error in custom hook creating product ${data.name} in Stripe: ${error.message} (Code: ${error.code || 'N/A'})`,
        )
        throw new APIError(`Stripe Product creation failed (custom hook): ${error.message}`)
      }
    }
  }

  if (operation === 'update' && originalDoc && data.stripeID) {
    // Check if price or currency actually changed, if so, our hook needs to manage it.
    if (data.price !== originalDoc.price || data.currency !== originalDoc.currency) {
      payload.logger.info(
        `Product ${data.name} (Stripe ID: ${data.stripeID}): Price/currency changed. Custom hook creating new Stripe Price...`,
      )
      try {
        const newPriceObject = await stripe.prices.create({
          product: data.stripeID,
          unit_amount: data.price,
          currency: data.currency,
        })

        // Update the Stripe Product to use this new price as default
        await stripe.products.update(data.stripeID, { default_price: newPriceObject.id })

        data.stripePriceID = newPriceObject.id // Update Payload with new Price ID
        payload.logger.info(
          `Product ${data.name}: New Stripe Price ID ${newPriceObject.id} created and set as default.`,
        )

        // Archive the old price if it exists and is different
        if (originalDoc.stripePriceID && originalDoc.stripePriceID !== newPriceObject.id) {
          try {
            await stripe.prices.update(originalDoc.stripePriceID, { active: false })
            payload.logger.info(
              `Product ${data.name}: Old Stripe Price ID ${originalDoc.stripePriceID} archived.`,
            )
          } catch (archiveError: any) {
            payload.logger.warn(
              `Could not archive old price ${originalDoc.stripePriceID}: ${archiveError.message}`,
            )
          }
        }
        // Set skipSync to true because we've handled the critical price update.
        // The plugin's syncExistingWithStripe hook (if it runs after this for other fields)
        // should now respect this.
        data.skipSync = true
      } catch (error: any) {
        payload.logger.error(`Error managing Stripe Price for ${data.name}: ${error.message}`)
        throw new APIError(
          `Stripe Price management failed: ${error.message} (Code: ${error.code || 'N/A'})`,
        )
      }
    } else {
      // If price/currency didn't change, let the plugin's syncExistingWithStripe handle other fields (name, desc)
      // based on the payload.config.ts 'sync.fields' mapping.
      // We don't set skipSync = true here, allowing plugin's hook to run.
      payload.logger.info(
        `Product ${data.name}: Price/currency unchanged. Plugin default sync will handle other fields.`,
      )
      data.skipSync = false // Ensure plugin's hook will run for non-price fields
    }

    // Image update logic - if plugin doesn't handle it or if we want more control
    const oldImageId = (originalDoc.productImage as Media | number | null)
      ? typeof originalDoc.productImage === 'number'
        ? originalDoc.productImage
        : (originalDoc.productImage as Media).id
      : null
    const newImageId = (data.productImage as Media | number | null)
      ? typeof data.productImage === 'number'
        ? data.productImage
        : (data.productImage as Media).id
      : null

    if (newImageId !== oldImageId && !data.skipSync) {
      // Only if not already skipped by price change
      payload.logger.info(
        `Product ${data.name}: Image changed. Custom hook updating image in Stripe.`,
      )
      if (newImageId) {
        let newImageUrl: string | undefined
        const imageDocID =
          typeof data.productImage === 'number'
            ? data.productImage
            : (data.productImage as Media).id
        const mediaDoc = await payload.findByID({ collection: 'media', id: imageDocID, depth: 0 })
        if (mediaDoc && mediaDoc.url && payloadServerURL) {
          newImageUrl = `${payloadServerURL}${mediaDoc.url.startsWith('/') ? mediaDoc.url : '/' + mediaDoc.url}`
          if (!newImageUrl.startsWith('http')) {
            payload.logger.error(`Generated image URL for update is not absolute: ${newImageUrl}`)
          } else {
            try {
              await stripe.products.update(data.stripeID, { images: [newImageUrl] })
              payload.logger.info(`Product ${data.name}: Image updated in Stripe.`)
              data.skipSync = true // Image update handled
            } catch (imgErr: any) {
              payload.logger.error(
                `Error updating image in Stripe for ${data.stripeID}: ${imgErr.message}`,
              )
            }
          }
        } else if (!payloadServerURL) {
          payload.logger.error(
            'PAYLOAD_PUBLIC_SERVER_URL is not set. Cannot form absolute image URL for Stripe product update.',
          )
        }
      } else {
        // Image removed
        try {
          await stripe.products.update(data.stripeID, { images: [] })
          payload.logger.info(`Product ${data.name}: Images cleared in Stripe.`)
          data.skipSync = true // Image update handled
        } catch (imgErr: any) {
          payload.logger.error(
            `Error clearing images in Stripe for ${data.stripeID}: ${imgErr.message}`,
          )
        }
      }
    }
  }
  return data
}

const afterProductChange: CollectionAfterChangeHook<Product> = async ({ doc, req, operation }) => {
  if (req.context?.isInternalSkipSyncReset) {
    return doc
  }

  // Reset skipSync if it was set to true by our beforeChange hook for this operation
  // This ensures subsequent plugin hooks (if any) or future manual edits behave as expected.
  if (doc.skipSync === true && (operation === 'create' || operation === 'update')) {
    try {
      // req.payload.logger.info(`Product ${doc.name}: Attempting to reset skipSync flag after ${operation}. Current value: ${doc.skipSync}`);
      await req.payload.update({
        collection: 'products',
        id: doc.id,
        data: {
          skipSync: false,
        },
        overrideAccess: true,
        depth: 0,
        context: { isInternalSkipSyncReset: true, ...req.context },
      })
      // req.payload.logger.info(`Product ${doc.name}: Successfully reset skipSync flag.`);
    } catch (e: any) {
      req.payload.logger.error(`Product ${doc.name}: Failed to reset skipSync flag: ${e.message}`)
    }
  }
  return doc
}

// afterProductDelete hook can remain the same as before.

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'price', 'stock', 'stripeID', 'stripePriceID'],
  },
  access: {
    read: () => true,
  },
  fields: [
    // ... (name, description, price, currency, productImage, stock fields as before)
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'description',
      type: 'textarea',
      localized: true,
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      admin: { description: 'Price in cents.' },
    },
    {
      name: 'currency',
      type: 'select',
      options: [
        { label: 'USD', value: 'usd' },
        { label: 'EUR', value: 'eur' },
      ],
      defaultValue: 'usd',
      required: true,
    },
    {
      name: 'productImage',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'stock',
      type: 'number',
      label: 'Stock Quantity',
      admin: { description: 'Leave blank for unlimited stock.' },
    },
    // stripeID and skipSync are added by the plugin because 'products' is in stripePlugin.sync.
    // We add stripePriceID manually.
    {
      name: 'stripePriceID',
      type: 'text',
      label: 'Stripe Default Price ID',
      admin: {
        readOnly: true,
        position: 'sidebar',
        description: 'Managed by custom hooks / Stripe plugin. ID of the default price in Stripe.',
      },
    },
  ],
  hooks: {
    beforeChange: [beforeProductChange],
    afterChange: [afterProductChange], // Keep this to reset skipSync
    // The plugin's afterDelete hook (from its sync config) should handle Stripe product archival/deletion.
    // If you want custom delete logic, add your afterProductDelete here.
  },
}
