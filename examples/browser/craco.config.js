module.exports = {
  // support aliasing node modules in the browser
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.resolve.alias.stream = 'stream-browserify'
      webpackConfig.resolve.alias.buffer = 'buffer'

      console.log(webpackConfig);
      return webpackConfig;
    }
  },
  // support adding tailwindcss to PostCSS
  style: {
    postcss: {
      plugins: [
        require('tailwindcss'),
        require('autoprefixer'),
      ],
    },
  },
}
