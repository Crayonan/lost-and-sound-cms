import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor, FixedToolbarFeature } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { stripePlugin } from '@payloadcms/plugin-stripe'
import Stripe from 'stripe'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Artists } from './collections/Artists'
import { Categories } from './collections/Categories'
import { NewsArticles } from './collections/NewsArticles'
import { FaqItems } from './collections/FaqItems'
import { Pages } from './collections/Pages'
import { Products } from './collections/Products'
import { Orders } from './collections/Orders'
import InstagramPosts from './collections/InstagramPosts'
import FetchLogs from './collections/FetchLogs'

import { Header } from './globals/Header'
import { Footer } from './globals/Footer'

import fetchInstagramPostsEndpoint from './endpoints/fetchInstagramPosts'

const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3001'
const payloadURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: dirname,
    },
  },

  collections: [
    Users,
    Media,
    Artists,
    Categories,
    NewsArticles,
    FaqItems,
    Pages,
    InstagramPosts,
    FetchLogs,
    Products,
    Orders,
  ],

  globals: [Header, Footer],

  endpoints: [fetchInstagramPostsEndpoint],

  editor: lexicalEditor({
    features: ({ defaultFeatures }) => [...defaultFeatures, FixedToolbarFeature()],
  }),

  secret: process.env.PAYLOAD_SECRET || 'DEV_FALLBACK_SECRET_CHANGE_THIS_IN_PRODUCTION',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),

  sharp,
  cors: [frontendURL, payloadURL].filter(Boolean),
  csrf: [frontendURL, payloadURL].filter(Boolean),
  serverURL: payloadURL,

  plugins: [
    payloadCloudPlugin(),
    stripePlugin({
      stripeSecretKey: process.env.STRIPE_SECRET_KEY || '',
      isTestKey: process.env.STRIPE_SECRET_KEY?.includes('sk_test_'),
      stripeWebhooksEndpointSecret: process.env.STRIPE_WEBHOOK_SECRET,
      logs: true, // Enable logging for debugging
      sync: [
        {
          collection: 'products',
          stripeResourceType: 'products', // Corresponds to Stripe resource type
          stripeResourceTypeSingular: 'product', // For webhook event matching
          fields: [
            {
              fieldPath: 'name', // Payload field
              stripeProperty: 'name', // Stripe Product property
            },
            {
              fieldPath: 'description',
              stripeProperty: 'description',
            },
            // For price, Stripe creates a Price object associated with the Product
            // The plugin handles this if you map 'price' and 'currency'
            {
              fieldPath: 'price', // Your Payload price field (in cents)
              stripeProperty: 'default_price_data.unit_amount',
            },
            {
              fieldPath: 'currency', // Your Payload currency field
              stripeProperty: 'default_price_data.currency',
            },
            // To sync images, you might need a hook if `productImage` field in Payload
            // does not directly resolve to a URL string that Stripe's `images` array expects.
            // Or, you can manage main product images in Stripe dashboard.
            // For now, let's assume you'll manage main images in Stripe, or the plugin handles it.
          ],
        },
        // You can add sync config for 'users' to 'customers' if desired
        // {
        //   collection: 'users',
        //   stripeResourceType: 'customers',
        //   stripeResourceTypeSingular: 'customer',
        //   fields: [
        //     { fieldPath: 'email', stripeProperty: 'email' },
        //     // { fieldPath: 'name', stripeProperty: 'name' }, // If you have a name field
        //   ],
        // }
      ],
      webhooks: {
        // Handle Stripe events
        'checkout.session.completed': async ({ event, payload, stripe }) => {
          const session = event.data.object as Stripe.Checkout.Session
          const paymentIntentId =
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id

          payload.logger.info(
            `🔔 Stripe Webhook: checkout.session.completed for session ID ${session.id}, Payment Intent ID ${paymentIntentId}`,
          )

          // Example: Find or create an order
          // You'll likely pass an orderId or some identifier in `client_reference_id` or `metadata` when creating the session
          const clientReferenceId = session.client_reference_id // This could be your temporary Order ID from Payload

          if (clientReferenceId) {
            try {
              const order = await payload.findByID({
                collection: 'orders',
                id: clientReferenceId, // Ensure clientReferenceId is the correct type for your Order ID
              })

              if (order) {
                await payload.update({
                  collection: 'orders',
                  id: order.id,
                  data: {
                    status: 'paid',
                    stripePaymentIntentID: paymentIntentId,
                  },
                })
                payload.logger.info(`🔔 Order ${order.id} updated to 'paid'.`)

                // TODO: Implement inventory reduction here
                // for (const item of order.items) {
                //   const product = await payload.findByID({ collection: 'products', id: item.product.id })
                //   if (product && typeof product.stock === 'number') {
                //     await payload.update({
                //       collection: 'products',
                //       id: product.id,
                //       data: { stock: product.stock - item.quantity }
                //     })
                //   }
                // }
              } else {
                payload.logger.error(
                  `🔔 Order with client_reference_id ${clientReferenceId} not found.`,
                )
              }
            } catch (error) {
              payload.logger.error(
                `🔔 Error processing checkout.session.completed: ${error.message}`,
              )
            }
          } else {
            payload.logger.warn(
              `🔔 checkout.session.completed event for session ${session.id} did not have a client_reference_id.`,
            )
          }
        },
        'payment_intent.succeeded': async ({ event, payload }) => {
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          payload.logger.info(`🔔 Stripe Webhook: payment_intent.succeeded for ${paymentIntent.id}`)
          // Additional logic if needed, usually checkout.session.completed is sufficient for order fulfillment.
        },
        'payment_intent.payment_failed': async ({ event, payload }) => {
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          payload.logger.error(
            `🔔 Stripe Webhook: payment_intent.payment_failed for ${paymentIntent.id}`,
          )
          // Update order status to 'failed', handle customer notification, etc.
        },
        // Add more handlers as needed (e.g., for refunds 'charge.refunded')
      },
    }),
  ],
})
