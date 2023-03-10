const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' })

/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode: true,
  webpack: (config) => {

    //to load ts files from the 'shared' folder
    //=========================================
    config.module.rules.push({
      //to load ts files from outside the 'client' folder
      //=================================================
      test: /\.ts?$/,
      use: 'ts-loader',
      //to load the 'shared' folder
      //===========================
      include: [
        path.resolve(__dirname, '../shared')
      ]
    });

    //to load svgs
    //============
    config.module.rules.push({
      test: /\.(png|jp(e*)g|svg|gif)$/,
      type: "asset/resource",
    });

    //to enable using SVGR
    //====================
    config.module.rules.push({
      test: /\.svg$/,
      issuer: /\.[jt]sx?$/,
      use: ['@svgr/webpack'],
    });

    return config;
  },

  //to be able to use environment variables on the client side
  //==========================================================
  env: {
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  },

  compiler: {
    styledComponents: true
  },

  async headers() {
    if (process.env.NODE_ENV === "production") {
      return [
        {
          source: '/(.*)',
          headers: [
            {
              key: 'Content-Security-Policy',
              value: "script-src 'self' https://accounts.google.com",
            },
          ],
        },
      ];
    } else {
      return [];
    }
  },
}

module.exports = nextConfig;
