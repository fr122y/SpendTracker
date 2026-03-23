import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Prevent Turbopack from bundling @reatom/* twice (CJS for SSR + ESM for
  // client).  @reatom/core guards against this with a globalThis.__REATOM
  // check that throws "package duplication" when the module evaluates a
  // second time in the same process.
  serverExternalPackages: ['@reatom/core', '@reatom/react'],
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
}

export default nextConfig
