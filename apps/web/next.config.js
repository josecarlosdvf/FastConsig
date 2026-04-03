/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  transpilePackages: ["@fastconsig/ui", "@fastconsig/types"],
};

module.exports = nextConfig;
