// src/collections/Pages.ts
import type { CollectionConfig } from 'payload'
import { publicOnly } from '../access/publicOnly'

export const Pages: CollectionConfig = {
  slug: 'pages',
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'slug', 'status', 'updatedAt'],
  },
  access: {
    read: publicOnly,
  },
  versions: {
    drafts: true,
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      localized: true,
    },
    {
      name: 'slug',
      label: 'Slug',
      type: 'text',
      index: true, // <- MAKE SURE THIS (OR SIMILAR) IS PRESENT AND TRUE
      admin: {
        position: 'sidebar',
      },
      // ... other slug configurations like hooks for generation
    }, // Will generate based on title. Ensure 'home' for homepage.
    {
      name: 'hero',
      type: 'group',
      fields: [
        {
          name: 'type',
          type: 'select',
          options: [
            { label: 'Video Background', value: 'videoBackground' },
            { label: 'Image Background', value: 'imageBackground' },
            { label: 'None', value: 'none' },
          ],
          defaultValue: 'videoBackground',
        },
        {
          name: 'heading',
          type: 'text',
          localized: true,
        },
        {
          name: 'subheading',
          type: 'textarea',
          localized: true,
        },
        {
          name: 'videoUrl',
          label: 'Background Video URL',
          type: 'text',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'videoBackground',
          },
        },
        {
          name: 'backgroundImage',
          label: 'Background Image',
          type: 'upload',
          relationTo: 'media',
          admin: {
            condition: (_, siblingData) => siblingData?.type === 'imageBackground',
          },
        },
      ],
    },
    // Add a layout builder (blocks field) for more flexible page content later if needed
    // {
    //   name: 'layout',
    //   type: 'blocks',
    //   blocks: [ /* ... your block definitions ... */ ]
    // }
  ],
}
