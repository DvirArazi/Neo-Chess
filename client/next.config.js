import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    config.module.rules.push({
      test: /\.ts?$/,
      use: 'ts-loader',
      include: [
        path.resolve(__dirname, '../shared')
      ]
    });

    return config;
  },
  compiler: {
    styledComponents: true
  }
}

module.exports = nextConfig;
