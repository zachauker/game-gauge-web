// In v11 the Next.js build plugin lives at the /config subpath, not the package root.
const { withSentryConfig } = require('@sentry/nextjs/config')

/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: 'images.igdb.com',
                pathname: '/igdb/image/upload/**',
            },
            {
                protocol: 'https',
                hostname: 'cdn.cloudflare.steamstatic.com',
                pathname: '/steam/apps/**',
            },
            {
                protocol: 'https',
                hostname: 'media.steampowered.com',
                pathname: '/steamcommunity/public/images/**',
            },
            {
                protocol: 'https',
                hostname: 'avatars.steamstatic.com',
                pathname: '/**',
            },
        ],
    },
    // Production optimizations
    reactStrictMode: true,
    swcMinify: true,
}

const commit = process.env.VERCEL_GIT_COMMIT_SHA

module.exports = withSentryConfig(nextConfig, {
    org: 'willowbrook',
    project: 'game-gauge-web',
    authToken: process.env.SENTRY_AUTH_TOKEN,
    // Also upload maps for files outside the default client bundle paths.
    widenClientFileUpload: true,
    // Proxy events through our own origin so ad blockers can't drop them.
    tunnelRoute: '/monitoring',
    silent: !process.env.CI,
    // The default (setCommits: { auto: true }) shells out to git, and a Vercel
    // builder has no .git, so it silently produces a release with no commits.
    // Pass the commit Vercel gives us instead. `repo` must match the repo name
    // as Sentry has it.
    release: commit
        ? {
              setCommits: {
                  repo: 'zachauker/game-gauge-web',
                  commit,
                  ignoreMissing: true,
                  ignoreEmpty: true,
              },
          }
        : undefined,
})
