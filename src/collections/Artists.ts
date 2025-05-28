/* tslint:disable */
/* eslint-disable */

import type { CollectionConfig } from 'payload'
import { publicOnly } from '../access/publicOnly'

// @ts-ignore
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
      name: 'day',
      type: 'select',
      label: 'Day of the Week',
      options: [
        { label: 'Friday', value: 'friday' },
        { label: 'Saturday', value: 'saturday' },
        { label: 'Sunday', value: 'sunday' },
      ],
    },
    {
      name: 'time',
      type: 'text',
      label: 'Start Time (e.g., 18:00)',
      validate: (value: string | string[] | null | undefined) => {
        if (value === null || value === undefined || value === '') {
          return true
        }
        if (Array.isArray(value)) {
          return 'Invalid input type: Expected a single time string, not multiple values.'
        }
        const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/
        return timePattern.test(value) || 'Invalid time format. Use HH:mm.'
      },
    },
    {
      name: 'endTime',
      type: 'text',
      label: 'End Time (e.g., 20:00)',
      validate: (value: string | string[] | null | undefined) => {
        if (value === null || value === undefined || value === '') {
          return true
        }
        if (Array.isArray(value)) {
          return 'Invalid input type: Expected a single time string, not multiple values.'
        }

        const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/
        return timePattern.test(value) || 'Invalid time format. Use HH:mm.'
      },
    },
    {
      name: 'location',
      type: 'select',
      label: 'Location',
      options: [
        { label: 'Main Stage', value: 'main-stage' },
        { label: 'Outside Stage', value: 'outside-stage' },
        { label: 'Tent Area', value: 'tent-area' },
      ],
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
