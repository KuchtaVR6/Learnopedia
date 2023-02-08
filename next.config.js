/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async redirects() {
    return [
      {
        source: '/mission',
        destination: '/view/35',
        permanent: true,
      },{
        source : '/termsofuse',
        destination : '/view/30',
        permanent: true
      }
    ]
  },
}
module.exports = nextConfig
