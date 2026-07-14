/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ["@lumipuchi/shared", "@lumipuchi/forex", "@lumipuchi/inventory", "@lumipuchi/pricing-engine"]
};

module.exports = nextConfig;
