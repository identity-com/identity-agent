// const alias = require('@rollup/plugin-alias');
const ttypescript = require('ttypescript');
const tsPlugin = require('rollup-plugin-typescript2');

module.exports = {
  rollup(config, options) {
    const tsconfigPath = options.tsconfig || 'tsconfig.json';

    // https://github.com/formium/tsdx/issues/91#issuecomment-754332423
    // Until tsdx supports path aliases out of the box
    // this converts aliased imports e.g.
    // import { Agent } from '@/api/internal';
    // to relative paths
    // import { Agent } from './api/internal';
    // in the build (both ts and js output)
    const tsconfigJSON = ttypescript.readConfigFile(
      tsconfigPath,
      ttypescript.sys.readFile
    ).config;

    const tsCompilerOptions = ttypescript.parseJsonConfigFileContent(
      tsconfigJSON,
      ttypescript.sys,
      './'
    ).options;

    const customRPT2Plugin = tsPlugin({
      typescript: ttypescript,
      tsconfig: options.tsconfig,
      tsconfigDefaults: {
        exclude: [
          // all TS test files, regardless whether co-located or in test/ etc
          '**/*.spec.ts',
          '**/*.test.ts',
          '**/*.spec.tsx',
          '**/*.test.tsx',
          // TS defaults below
          'node_modules',
          'bower_components',
          'jspm_packages',
          'dist',
        ],
        compilerOptions: {
          sourceMap: true,
          declaration: true,
          jsx: 'react',
        },
      },
      tsconfigOverride: {
        compilerOptions: {
          // TS -> esnext, then leave the rest to babel-preset-env
          target: 'esnext',
          // don't output declarations more than once
          ...(!options.writeMeta
            ? { declaration: false, declarationMap: false }
            : {}),
        },
      },
      check: !options.transpileOnly && options.writeMeta,
      useTsconfigDeclarationDir: Boolean(
        tsCompilerOptions && tsCompilerOptions.declarationDir
      ),
    });


    const rpt2Plugin = config.plugins.find(p => p.name === 'rpt2');
    const rpt2PluginIndex = config.plugins.indexOf(rpt2Plugin);

    config.plugins.splice(rpt2PluginIndex, 1, customRPT2Plugin);
    return config;
  },
};
