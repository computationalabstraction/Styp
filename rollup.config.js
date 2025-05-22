// rollup.config.js
import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs'; // In case future dependencies are CJS
import { terser } from 'rollup-plugin-terser';

const libraryName = 'styp'; // Global variable name for UMD builds
const inputFile = 'src/index.js'; // Assuming your main source file is here

const commonPlugins = [
  nodeResolve(), // Resolves node_modules
  commonjs(),    // Converts CommonJS modules to ES6
  babel({
    babelHelpers: 'bundled', // Bundles Babel helpers
    exclude: 'node_modules/**', // Don't transpile dependencies
    presets: [
      ['@babel/preset-env', {
        targets: '> 0.25%, not dead, ie 11', // Adjust browser targets as needed
        // modules: false, // Let Rollup handle modules
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
      terser() // Minify the output
    ],
  }
];