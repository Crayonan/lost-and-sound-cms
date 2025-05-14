// src/payload.config.ts
import { postgresAdapter } from '@payloadcms/db-postgres'
import { payloadCloudPlugin } from '@payloadcms/payload-cloud'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users' // Ensure Users.slug is exported and correct
import { Media } from './collections/Media'
import { Artists } from './collections/Artists'
import { GalleryImages } from './collections/GalleryImages'
import { Categories } from './collections/Categories'
import { NewsArticles } from './collections/NewsArticles'
import { FaqItems } from './collections/FaqItems'
import { Pages } from './collections/Pages'
import InstagramPosts from './collections/InstagramPosts'
import FetchLogs from './collections/FetchLogs'

import { Header } from './globals/Header'
import { Footer } from './globals/Footer'

import fetchInstagramPostsEndpoint from './endpoints/fetchInstagramPosts'

const frontendURL = process.env.FRONTEND_URL || 'http://localhost:3001'
const payloadURL = process.env.PAYLOAD_PUBLIC_SERVER_URL || 'http://localhost:3000'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename) // This is 'src' directory if payload.config.ts is in 'src'

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      // This is crucial for resolving component paths like './components/...'
      baseDir: dirname,
    },
  },
  collections: [
    Users,
    Media,
    Artists,
    GalleryImages,
    Categories,
    NewsArticles,
    FaqItems,
    Pages,
    InstagramPosts,
    FetchLogs,
  ],
  globals: [Header, Footer],
  endpoints: [fetchInstagramPostsEndpoint],
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || 'DEV_FALLBACK_SECRET_CHANGE_THIS_IN_PRODUCTION',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI || '',
    },
  }),
  sharp,
  cors: [frontendURL, payloadURL].filter(Boolean),
  csrf: [frontendURL, payloadURL].filter(Boolean),
  serverURL: payloadURL,
  plugins: [payloadCloudPlugin()],
})
