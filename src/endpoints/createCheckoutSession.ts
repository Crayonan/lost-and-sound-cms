import type { Endpoint } from 'payload'
import { addDataAndFileToRequest, type PayloadRequest } from 'payload'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2022-08-01',
})

const createCheckoutSession: Endpoint = {
  path: '/create-checkout-session',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const { payload } = req

    try {
      // Parse the request body
      await addDataAndFileToRequest(req)
      const { items, successUrl, cancelUrl, customerEmail, orderId } = req.data as {
        items?: Array<{ productId: string; quantity: number }>
        successUrl?: string
        cancelUrl?: string
        customerEmail?: string
        orderId?: string
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return Response.json(
          { error: 'Items array is required and must not be empty' },
          { status: 400 },
        )
      }

      // Validate and fetch product details from your database
      const lineItems = []
      let totalAmount = 0

      for (const item of items) {
        const { productId, quantity } = item

        if (!productId || !quantity || quantity < 1) {
          return Response.json(
            { error: 'Each item must have a valid productId and quantity >= 1' },
            { status: 400 },
          )
        }

        // Fetch product from your database
        const product = await payload.findByID({
          collection: 'products',
          id: productId,
        })

        if (!product) {
          return Response.json({ error: `Product with ID ${productId} not found` }, { status: 404 })
        }

        if (!product.stripePriceID) {
          return Response.json(
            { error: `Product ${product.name} does not have a Stripe price configured` },
            { status: 400 },
          )
        }

        // Check stock if applicable
        if (product.stock !== null && product.stock !== undefined && product.stock < quantity) {
          return Response.json(
            {
              error: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${quantity}`,
            },
            { status: 400 },
          )
        }

        lineItems.push({
          price: product.stripePriceID,
          quantity: quantity,
        })

        totalAmount += product.price * quantity
      }

      // Create Stripe Checkout Session
      const sessionParams: Stripe.Checkout.SessionCreateParams = {
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        billing_address_collection: 'required',
        success_url:
          successUrl ||
          `${process.env.FRONTEND_URL || 'http://localhost:3001'}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url:
          cancelUrl || `${process.env.FRONTEND_URL || 'http://localhost:3001'}/checkout/cancel`,
        metadata: {
          orderId: orderId || '',
        },
      }

      // Add customer email if provided
      if (customerEmail) {
        sessionParams.customer_email = customerEmail
      }

      // Add client_reference_id if orderId is provided (for webhook handling)
      if (orderId) {
        sessionParams.client_reference_id = orderId
      }

      const session = await stripe.checkout.sessions.create(sessionParams)

      payload.logger.info(`Checkout session created: ${session.id} for order: ${orderId || 'N/A'}`)

      return Response.json({
        sessionId: session.id,
        url: session.url,
        totalAmount,
      })
    } catch (error: any) {
      payload.logger.error(`Error creating checkout session: ${error.message}`)

      return Response.json(
        { error: 'Failed to create checkout session', details: error.message },
        { status: 500 },
      )
    }
  },
}

export default createCheckoutSession
