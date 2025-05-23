// rollup.config.js
import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const libraryName = 'styp';
const inputFile = 'src/index.js';

const commonPlugins = [
  nodeResolve(),
  commonjs(),
  babel({
    babelHelpers: 'bundled',
    exclude: 'node_modules/**',
    presets: [
      ['@babel/preset-env', {
        targets: '> 0.25%, not dead, ie 11',
        // modules: false,
      }]
    ]
  }),
];

export default [
  // ES Module Build (for bundlers and modern Node.js)
  {
    input: inputFile,
    output: {
      file: `dist/${libraryName}.esm.js`,
      format: 'es',
      sourcemap: true,
    },
    plugins: commonPlugins,
  },

  // CommonJS Build (for older Node.js)
  {
    input: inputFile,
    output: {
      file: `dist/${libraryName}.cjs`, // Note: .cjs extension is conventional
      format: 'cjs',
      sourcemap: true,
      exports: 'named', // Important for exporting named functions
    },
    plugins: commonPlugins,
  },

  // UMD Build (for browsers directly, CDN)
  {
    input: inputFile,
    output: {
      file: `dist/${libraryName}.umd.js`,
      format: 'umd',
      name: libraryName, // Global variable name: window.styp
      sourcemap: true,
      exports: 'named',
      globals: {}, // Specify globals if you have external peer dependencies for UMD
    },
    plugins: commonPlugins,
  },

  // UMD Minified Build (for CDN production use)
  {
    input: inputFile,
    output: {
      file: `dist/${libraryName}.umd.min.js`,
      format: 'umd',
      name: libraryName,
      sourcemap: true,
      exports: 'named',
      globals: {},
    },
    plugins: [
      ...commonPlugins,
      terser()
    ],
  }
];