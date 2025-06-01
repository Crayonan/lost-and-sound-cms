import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor, FixedToolbarFeature } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { GlobalConfig } from 'payload'
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

// No need to import StripeDashboard here directly for config, path will be used.
// import StripeDashboard from './components/StripeDashboard'

import fetchInstagramPostsEndpoint from './endpoints/fetchInstagramPosts'
import createCheckoutSession from './endpoints/createCheckoutSession'
import createOrder from './endpoints/createOrder'

const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3001'
const payloadURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Define the Stripe Management Global
const StripeManagementGlobal: GlobalConfig = {
  slug: 'stripe-management',
  label: 'Stripe Dashboard',
  admin: {
    group: 'Shop',
    components: {
      views: {
        edit: {
          // 'default' (lowercase) is the standard key for the main edit view/tab
          default: {
            // This key's value must be an EditViewConfig object
            Component: './components/StripeDashboard.tsx', // The string path goes here
            // path: '/', // Optional: You can define a sub-path for this view if needed
          },
        },
      },
    },
    hideAPIURL: true,
  },
  access: {
    read: ({ req: { user } }) => Boolean(user),
    update: () => false,
  },
  fields: [
    {
      name: 'placeholder',
      type: 'text',
      hidden: true,
      admin: {
        hidden: true,
      },
    },
  ],
}

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      // baseDir is set to the directory of payload.config.ts
      // Paths for components will be relative to this directory
      baseDir: dirname,
    },
    // Remove the old custom view and nav link configurations
    // components: {
    //   views: {
    //     StripeDashboardView: {
    //       Component: './components/StripeDashboard.tsx',
    //       path: '/stripe-dashboard',
    //     },
    //   },
    //   afterNavLinks: [
    //     './components/StripeNavLink.tsx',
    //   ],
    // },
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

  globals: [
    Header,
    Footer,
    StripeManagementGlobal, // Add the new Stripe Management Global here
  ],

  endpoints: [fetchInstagramPostsEndpoint, createCheckoutSession, createOrder],

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
      // isTestKey: process.env.STRIPE_SECRET_KEY?.includes('sk_test_'), // isTestKey is deprecated
      stripeWebhooksEndpointSecret: process.env.STRIPE_WEBHOOK_SECRET,
      logs: true, // Enable logging for debugging
      sync: [
        {
          collection: 'products',
          stripeResourceType: 'products',
          stripeResourceTypeSingular: 'product',
          fields: [
            {
              fieldPath: 'name',
              stripeProperty: 'name',
            },
            {
              fieldPath: 'description',
              stripeProperty: 'description',
            },
          ],
        },
      ],
      webhooks: {
        'checkout.session.completed': async ({ event, payload, stripe }) => {
          const session = event.data.object as Stripe.Checkout.Session
          const paymentIntentId =
            typeof session.payment_intent === 'string'
              ? session.payment_intent
              : session.payment_intent?.id

          payload.logger.info(
            `🔔 Stripe Webhook: checkout.session.completed for session ID ${session.id}, Payment Intent ID ${paymentIntentId}`,
          )

          const clientReferenceId = session.client_reference_id

          if (clientReferenceId) {
            try {
              const order = await payload.findByID({
                collection: 'orders',
                id: clientReferenceId,
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
              } else {
                payload.logger.error(
                  `🔔 Order with client_reference_id ${clientReferenceId} not found.`,
                )
              }
            } catch (error: any) {
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
        },
        'payment_intent.payment_failed': async ({ event, payload }) => {
          const paymentIntent = event.data.object as Stripe.PaymentIntent
          payload.logger.error(
            `🔔 Stripe Webhook: payment_intent.payment_failed for ${paymentIntent.id}`,
          )
        },
      },
    }),
  ],
})
