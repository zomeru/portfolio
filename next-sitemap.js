const siteUrl = 'https://zomer.xyz';

module.exports = {
  siteUrl,
  generateRobotsTxt: true,
  additionalSitemaps: [
    `${siteUrl}/sitemap.xml`,
    `${siteUrl}/server-sitemap.xml`,
  ],
};
