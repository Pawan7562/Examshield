module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Fix WebAssembly compilation issues
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        fs: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        assert: false,
        http: false,
        https: false,
        url: false,
      };
      
      // Suppress ESLint warnings
      webpackConfig.module.rules = webpackConfig.module.rules.map(rule => {
        if (rule.use && rule.use.some(loader => loader.loader && loader.loader.includes('eslint-loader'))) {
          return {
            ...rule,
            use: rule.use.map(loader => {
              if (loader.loader && loader.loader.includes('eslint-loader')) {
                return {
                  ...loader,
                  options: {
                    ...loader.options,
                    emitWarning: false,
                    failOnError: false,
                    failOnWarning: false,
                  }
                };
              }
              return loader;
            })
          };
        }
        return rule;
      });
      
      return webpackConfig;
    },
  },
  devServer: {
    port: 3000,
    open: true,
  },
};
