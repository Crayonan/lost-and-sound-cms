// src/fields/slug.ts
import type { Field } from 'payload'
import { formatSlug } from '../utilities/formatSlug' // We'll create this utility

export function slugField(fieldToUse = 'title', overrides?: Partial<Field>): Field {
  return {
    name: 'slug',
    label: 'Slug',
    type: 'text',
    index: true,
    unique: true,
    admin: {
      position: 'sidebar',
      description: '',
      ...(overrides?.admin || {}),
    },
    hooks: {
      beforeValidate: [formatSlug(fieldToUse)],
      ...(overrides?.hooks || {}),
    },
    ...(overrides || {}),
  }
}
