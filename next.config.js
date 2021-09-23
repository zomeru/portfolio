module.exports = {
  reactStrictMode: true,
};

const withPlugins = require('next-compose-plugins');
const withPWA = require('next-pwa');

const pwaConfig = {
  pwa: {
    dest: 'public',
  },
};

const nextConfig = {
  images: {
    domains: ['cdn.sanity.io', 'zomer.xyz', 'raw.githubusercontent.com'],
  },
  async redirects() {
    return [
      {
        source: '/facebook',
        destination: 'https://facebook.com/Zomeru',
        permanent: false,
      },
      {
        source: '/instagram',
        destination: 'https://instagram.com/zomerusama',
        permanent: false,
      },
      {
        source: '/tiktok',
        destination: 'https://tiktok.com/@zomeru_sama',
        permanent: false,
      },
      {
        source: '/twitter',
        destination: 'https://twitter.com/zomeru_sama',
        permanent: false,
      },
      {
        source: '/linkedin',
        destination: 'https://linkedin.com/in/zomergregorio',
        permanent: false,
      },
      {
        source: '/github',
        destination: 'https://github.com/zomeru',
        permanent: false,
      },
    ];
  },
};

// module.exports = withPlugins([[withPWA, pwaConfig]], nextConfig);
module.exports = withPlugins([], nextConfig);
