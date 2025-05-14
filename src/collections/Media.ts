// src/collections/Media.ts
import type { CollectionConfig } from 'payload'
import path from 'path'
import { fileURLToPath } from 'url' // <--- Import this
import { publicOnly } from '../access/publicOnly' // Access control for public read

// --- Add these lines ---
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// --- End of added lines ---

export const Media: CollectionConfig = {
  slug: 'media',
  admin: {
    useAsTitle: 'filename',
    description: 'Upload images and videos here.',
  },
  access: {
    read: publicOnly, // Only allow public read access
  },
  upload: {
    staticDir: path.resolve(__dirname, '../../media'), // path to where files are stored on disk. Now __dirname is correctly defined
    mimeTypes: ['image/*', 'video/*'],
    adminThumbnail: ({ doc }) => {
      if (typeof doc.mimeType !== 'string' || !doc.mimeType.startsWith('image/')) {
        return '/payload-icon.svg'
      }
      // Use process.env here as it's available during build/runtime of Payload
      const serverURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'
      return `${serverURL}/media/${doc.filename}`
    },
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
      label: 'Alt Text (for SEO and accessibility)',
    },
  ],
}
