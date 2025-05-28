import { withPayload } from '@payloadcms/next/withPayload'

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Generate browser source maps for production builds
  productionBrowserSourceMaps: true,

  // Your previous turbo settings go here:
  turbopack: {
    // …e.g. profiling: true, workerThreads: false, etc.
  },

  webpack(config, { isServer }) {
    if (isServer) {
      config.devtool = 'source-map'
    }
    return config
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
