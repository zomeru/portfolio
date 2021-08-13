module.exports = {
  reactStrictMode: true,
};

module.exports = {
  async redirects() {
    return [
      {
        source: '/facebook',
        destination: 'https://facebook.com/Zomeru',
        permanent: true,
      },
      {
        source: '/instagram',
        destination: 'https://instagram.com/zomerusama',
        permanent: true,
      },
      {
        source: '/tiktok',
        destination: 'https://instagram.com/zomerusama',
        permanent: true,
      },
      {
        source: '/twitter',
        destination: 'https://twitter.com/zomeru_sama',
        permanent: true,
      },
      {
        source: '/linkedin',
        destination: 'https://linkedin.com/in/zomergregorio',
        permanent: true,
      },
      {
        source: '/github',
        destination: 'https://github.com/zomeru',
        permanent: true,
      },
    ];
  },
};

const path = require('path');
const withPWA = require('next-pwa');
// const runtimeCaching = require('next-pwa/cache');

module.exports = withPWA({
  pwa: {
    dest: 'public',
    // swSrc: 'sw.js',
    register: true,
    skipWaiting: true,
    // runtimeCaching,
  },
  webpack: config => {
    config.resolve.modules.push(path.resolve('./'));
    return config;
  },
});
