/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  async redirects() {
    return [
      {
        source: '/mission',
        destination: '/view/19',
        permanent: true,
      },{
        source : '/termsofuse',
        destination : '/view/15',
        permanent: true
      }
    ]
  },
}
module.exports = nextConfig
