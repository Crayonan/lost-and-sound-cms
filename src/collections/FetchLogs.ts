import { CollectionConfig } from 'payload'

const FetchLogs: CollectionConfig = {
  slug: 'fetch-logs',
  admin: {
    useAsTitle: 'date',
    description: 'Logs of Instagram fetch attempts.',
    hidden: () => false,
  },
  access: {
    read: () => true,
    create: () => true, // Endpoint creates these
    update: () => false,
    delete: () => true,
  },
  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users', // Ensure you have a 'users' collection
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'date', // Stores YYYY-MM-DD
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'instagramUsername',
      type: 'text',
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'status',
      type: 'select',
      options: [
        { label: 'Success', value: 'success' },
        { label: 'Failed', value: 'failed' },
        { label: 'Rate Limited User', value: 'rate_limited_user' },
      ],
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: 'message',
      type: 'textarea',
      admin: {
        readOnly: true,
      },
    },
  ],
}

export default FetchLogs
