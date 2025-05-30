// src/collections/Products.ts
import type { CollectionConfig } from 'payload'

export const Products: CollectionConfig = {
  slug: 'products',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'price', 'stock', 'stripeID'],
  },
  access: {
    read: () => true, // Publicly readable
  },
  fields: [
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
      name: 'price', // This will be in cents (e.g., 1000 for $10.00)
      type: 'number',
      required: true,
      admin: {
        description: 'Price in the smallest currency unit (e.g., cents for USD).',
      },
    },
    {
      name: 'currency',
      type: 'select',
      options: [
        { label: 'USD', value: 'usd' },
        { label: 'EUR', value: 'eur' },
        // Add other currencies as needed
      ],
      defaultValue: 'usd',
      required: true,
    },
    {
      name: 'productImage',
      type: 'upload',
      relationTo: 'media', // Your existing media collection
      required: true,
    },
    {
      name: 'stock',
      type: 'number',
      label: 'Stock Quantity',
      admin: {
        description: 'Leave blank for unlimited stock.',
      },
    },
    // Stripe plugin will add 'stripeID', 'stripePriceID', and 'skipSync' fields
  ],
}
