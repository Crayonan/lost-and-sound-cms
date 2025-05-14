// src/collections/GalleryImages.ts
import type { CollectionConfig } from 'payload'
import { publicOnly } from '../access/publicOnly' // Access control for public read

export const GalleryImages: CollectionConfig = {
  slug: 'gallery-images',
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'image', 'order', 'updatedAt'],
  },
  access: {
    read: publicOnly, // Only allow public read access
  },
  fields: [
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: true,
    },
    {
      name: 'label',
      type: 'text',
      required: true,
    },
    {
      name: 'order',
      type: 'number',
      admin: {
        description: 'Lower numbers appear first.',
      },
    },
  ],
}
