// src/globals/Footer.ts
import type { GlobalConfig } from 'payload'
import { publicOnly } from '../access/publicOnly'

export const Footer: GlobalConfig = {
  slug: 'footer',
  admin: {
    group: 'Navigation',
  },
  access: {
    read: publicOnly,
  },
  fields: [
    {
      name: 'quickLinks',
      label: 'Quick Links',
      type: 'array',
      fields: [
        {
          name: 'link',
          type: 'group',
          interfaceName: 'FooterQuickLink', // Good for clarity
          fields: [
            {
              name: 'label',
              type: 'text',
              required: true,
              localized: true,
            },
            {
              name: 'type',
              type: 'radio',
              options: [
                { label: 'Internal Page', value: 'reference' },
                { label: 'Custom URL', value: 'custom' },
              ],
              defaultValue: 'custom',
            },
            {
              name: 'reference',
              label: 'Page to link to',
              type: 'relationship',
              relationTo: 'pages', // Assumes 'pages' collection exists
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'reference',
              },
            },
            {
              name: 'url',
              label: 'Custom URL',
              type: 'text',
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'custom',
              },
            },
            {
              name: 'newTab',
              label: 'Open in new tab',
              type: 'checkbox',
              defaultValue: false,
            },
          ],
        },
      ],
    },
    {
      name: 'contactInfo',
      label: 'Contact Information',
      type: 'richText',
      localized: true,
    },
    {
      name: 'socialMediaLinks',
      type: 'array',
      fields: [
        {
          name: 'platform',
          type: 'select',
          options: [
            { label: 'Instagram', value: 'instagram' },
            { label: 'Twitter / X', value: 'twitter' },
            { label: 'Facebook', value: 'facebook' },
            // Add more as needed
          ],
          required: true,
        },
        {
          name: 'url',
          type: 'text',
          required: true,
        },
      ],
    },
    {
      name: 'copyrightText',
      type: 'text',
      localized: true,
      defaultValue: `© ${new Date().getFullYear()} LOST & SOUND Festival. All rights reserved.`,
    },
  ],
}
