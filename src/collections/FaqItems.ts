// src/collections/FaqItems.ts
import type { CollectionConfig } from 'payload'
import { publicOnly } from '../access/publicOnly'

export const FaqItems: CollectionConfig = {
  slug: 'faq-items',
  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'order', 'updatedAt'],
  },
  access: {
    read: publicOnly,
  },
  fields: [
    {
      name: 'question',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'answer',
      type: 'richText',
      required: true,
      localized: true,
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
