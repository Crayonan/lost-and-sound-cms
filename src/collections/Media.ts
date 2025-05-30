import path from 'path'
import type { CollectionConfig } from 'payload'
import { publicOnly } from '../access/publicOnly'

export const Media: CollectionConfig = {
  slug: 'media',
  upload: {
    staticDir: 'media', // Directory where files are stored
    // staticURL: '/media', // URL path to access the files),
    mimeTypes: ['image/*', 'video/*'],
    adminThumbnail: 'thumbnail', // Admin panel shows the generated thumbnail
    imageSizes: [
      {
        name: 'thumbnail',
        width: 400,
        height: 300,
        position: 'centre',
        // Optional: prevent upscaling small images
        withoutEnlargement: true,
      },
      {
        name: 'artist-4x3',
        width: 800,
        height: 600,
        position: 'centre',
        withoutEnlargement: true,
      },
    ],
    formatOptions: {
      format: 'webp', // Convert everything to webp for smaller, faster images
    },
    crop: true,
  },
  admin: {
    useAsTitle: 'filename',
    description: 'Upload images and videos here.',
  },
  access: {
    read: () => true, // Public access, customize if needed
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt Text (for SEO and accessibility)',
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { label: 'Artists', value: 'artists' },
        { label: 'Gallery', value: 'gallery' },
        { label: 'News', value: 'news' },
        { label: 'FAQ', value: 'faq' },
        { label: 'Instagram', value: 'instagram' },
        { label: 'Product', value: 'product' },
      ],
    },
  ],
}
