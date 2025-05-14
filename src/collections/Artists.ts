// src/collections/Artists.ts
import type { CollectionConfig } from 'payload'
import { publicOnly } from '../access/publicOnly'

export const Artists: CollectionConfig = {
  slug: 'artists',
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'updatedAt'],
  },
  access: {
    read: publicOnly,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
    },
    {
      name: 'bio',
      type: 'richText',
      label: 'Biography (Optional)',
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'Artist Image (Optional)',
    },
    {
      name: 'socialLinks',
      type: 'array',
      label: 'Social Media Links (Optional)',
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: [
            { label: 'Instagram', value: 'instagram' },
            { label: 'Twitter / X', value: 'twitter' },
            { label: 'Facebook', value: 'facebook' },
            { label: 'Spotify', value: 'spotify' },
            { label: 'SoundCloud', value: 'soundcloud' },
            // Add more platforms as needed
          ],
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          label: 'URL',
          required: true,
        },
      ],
    },
  ],
}
