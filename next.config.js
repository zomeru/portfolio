/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ["cdn.sanity.io", "zomeru.com", "raw.githubusercontent.com"],
  },
  compiler: {
    styledComponents: true,
  },
  async redirects() {
    return [
      {
        source: "/facebook",
        destination: "https://facebook.com/Zomeru",
        permanent: false,
      },
      {
        source: "/instagram",
        destination: "https://instagram.com/zomeruu",
        permanent: false,
      },
      {
        source: "/tiktok",
        destination: "https://tiktok.com/@zomeru_sama",
        permanent: false,
      },
      {
        source: "/twitter",
        destination: "https://twitter.com/zomeru_sama",
        permanent: false,
      },
      {
        source: "/linkedin",
        destination: "https://linkedin.com/in/zomergregorio",
        permanent: false,
      },
      {
        source: "/github",
        destination: "https://github.com/zomeru",
        permanent: false,
      },
    ];
  },
};

const withPWA = require("next-pwa")({
  dest: "public",
});

module.exports =
  process.env.NODE_ENV === "production" ? withPWA(nextConfig) : nextConfig;
