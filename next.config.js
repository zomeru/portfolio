module.exports = {
  reactStrictMode: true,
};

const withPlugins = require('next-compose-plugins');
const path = require('path');
const withPWA = require('next-pwa');
// const runtimeCaching = require('next-pwa/cache');

module.exports = withPlugins(
  [
    [
      withPWA,
      {
        pwa: {
          dest: 'public',
          swSrc: 'service-worker.js',
          register: true,
          skipWaiting: true,
          // runtimeCaching,
        },
        webpack: config => {
          config.resolve.modules.push(path.resolve('./'));
          return config;
        },
      },
    ],
  ],
  {
    async redirects() {
      return [
        {
          source: '/facebook',
          destination: 'https://facebook.com/Zomeru',
          permanent: false,
          basePath: false,
        },
        {
          source: '/instagram',
          destination: 'https://instagram.com/zomerusama',
          permanent: false,
          basePath: false,
        },
        {
          source: '/tiktok',
          destination: 'https://tiktok/@zomeru_sama',
          permanent: false,
          basePath: false,
        },
        {
          source: '/twitter',
          destination: 'https://twitter.com/zomeru_sama',
          permanent: false,
          basePath: false,
        },
        {
          source: '/linkedin',
          destination: 'https://linkedin.com/in/zomergregorio',
          permanent: false,
          basePath: false,
        },
        {
          source: '/github',
          destination: 'https://github.com/zomeru',
          permanent: false,
          basePath: false,
        },
      ];
    },
  }
);
