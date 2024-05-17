module.exports = {
  globDirectory: 'dist/my-app',
  globPatterns: ['**/*.{html,js,css,png,jpg}'],
  swDest: 'dist/my-app/sw.js',
  clientsClaim: true,
  skipWaiting: true
};
