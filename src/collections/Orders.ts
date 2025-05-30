// src/collections/Orders.ts
import type { CollectionConfig } from 'payload'

export const Orders: CollectionConfig = {
  slug: 'orders',
  admin: {
    useAsTitle: 'id', // Or perhaps a custom order number field
    defaultColumns: ['id', 'user', 'totalAmount', 'status', 'createdAt'],
  },
  access: {
    read: ({ req: { user } }) => !!user, // Only authenticated users (admins or customers if you add customer auth)
    create: () => true, // Allow creation via webhook or frontend logic
    update: ({ req: { user } }) => !!user, // Admins can update
    delete: ({ req: { user } }) => !!user, // Only admins
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users', // Your existing users collection
      // required: true, // Make optional if handling guest checkouts
    },
    {
      name: 'items',
      type: 'array',
      fields: [
        {
          name: 'product',
          type: 'relationship',
          relationTo: 'products',
          required: true,
        },
        {
          name: 'quantity',
          type: 'number',
          required: true,
          min: 1,
        },
        {
          name: 'price', // Price at the time of purchase (in cents)
          type: 'number',
          required: true,
        },
        {
          name: 'name', // Product name snapshot
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'totalAmount', // In cents
      type: 'number',
      required: true,
    },
    {
      name: 'currency',
      type: 'text',
      required: true,
    },
    {
      name: 'stripePaymentIntentID',
      type: 'text',
      index: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Pending', value: 'pending' },
        { label: 'Paid', value: 'paid' },
        { label: 'Failed', value: 'failed' },
        { label: 'Shipped', value: 'shipped' },
        { label: 'Delivered', value: 'delivered' },
        { label: 'Cancelled', value: 'cancelled' },
        { label: 'Refunded', value: 'refunded' },
      ],
      defaultValue: 'pending',
      required: true,
    },
    // Add shipping address, billing address etc. if needed
  ],
}
