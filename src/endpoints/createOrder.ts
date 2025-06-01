import type { Endpoint } from 'payload'
import { addDataAndFileToRequest, type PayloadRequest } from 'payload'

const createOrder: Endpoint = {
  path: '/create-order',
  method: 'post',
  handler: async (req: PayloadRequest) => {
    const { payload } = req

    try {
      // Parse the request body
      await addDataAndFileToRequest(req)
      const { items } = req.data as {
        items?: Array<{ productId: string; quantity: number }>
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return Response.json(
          { error: 'Items array is required and must not be empty' },
          { status: 400 },
        )
      }

      // Validate and fetch product details
      const orderItems = []
      let totalAmount = 0
      let currency = 'usd' // Default currency

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

        // Check stock if applicable
        if (product.stock !== null && product.stock !== undefined && product.stock < quantity) {
          return Response.json(
            {
              error: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${quantity}`,
            },
            { status: 400 },
          )
        }

        const itemTotal = product.price * quantity
        totalAmount += itemTotal

        orderItems.push({
          product: parseInt(productId, 10),
          quantity: quantity,
          price: product.price, // Price at time of purchase
          name: product.name, // Product name snapshot
        })

        // Use the currency from the first product (assuming all products have same currency)
        if (orderItems.length === 1) {
          currency = product.currency
        }
      }

      // Create the order
      const orderData = {
        // Convert string to number for user relationship
        items: orderItems,
        totalAmount,
        currency,
        status: 'pending' as const,
      }

      const order = await payload.create({
        collection: 'orders',
        data: orderData,
      })

      payload.logger.info(`Order created: ${order.id} with total: ${totalAmount} ${currency}`)

      return Response.json({
        orderId: order.id,
        totalAmount,
        currency,
        status: 'pending',
        items: orderItems,
      })
    } catch (error: any) {
      payload.logger.error(`Error creating order: ${error.message}`)

      return Response.json(
        { error: 'Failed to create order', details: error.message },
        { status: 500 },
      )
    }
  },
}

export default createOrder
