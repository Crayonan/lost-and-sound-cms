// src/collections/Categories.ts
import type { CollectionConfig } from 'payload' // We'll create this helper field
import { publicOnly } from '../access/publicOnly' // Access control for public read

export const Categories: CollectionConfig = {
  slug: 'categories',
  admin: {
    useAsTitle: 'name',
  },
  access: {
    read: publicOnly, // Only allow public read access
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      localized: true, // If you plan to translate categories
    }, // Reusable slug field based on 'name'
  ],
}
