// src/globals/Header.ts
import type { GlobalConfig } from 'payload'
import { publicOnly } from '../access/publicOnly'

export const Header: GlobalConfig = {
  slug: 'header',
  admin: {
    group: 'Navigation',
  },
  access: {
    read: publicOnly,
  },

  fields: [
    {
      name: 'logo',
      type: 'upload',
      relationTo: 'media', // Assumes 'media' collection exists
    },
    {
      name: 'navItems',
      type: 'array',
      label: 'Navigation Items',
      maxRows: 6,
      fields: [
        {
          name: 'link',
          type: 'group',
          interfaceName: 'HeaderNavItemLink', // Good for clarity in generated types
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
              defaultValue: 'reference',
              admin: {
                layout: 'horizontal',
              },
            },
            {
              name: 'reference',
              label: 'Document to link to',
              type: 'relationship',
              relationTo: 'pages', // Assumes 'pages' collection exists
              required: true,
              admin: {
                condition: (_, siblingData) => siblingData?.type === 'reference',
              },
            },
            {
              name: 'url',
              label: 'Custom URL',
              type: 'text',
              required: true,
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
  ],
}
