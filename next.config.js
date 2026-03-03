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
        ],
    },
    // Production optimizations
    reactStrictMode: true,
    swcMinify: true,
}

module.exports = nextConfig