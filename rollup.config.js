import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';
import clear from 'rollup-plugin-clear';
import multiInput from 'rollup-plugin-multi-input';

export default [
  {
    input: 'src/index.js',
    output: [
      {
        file: 'dist/webrtc-fw.bundle.min.js',
        format: 'es',
      },
    ],
    plugins: [
      resolve(),
      commonjs(),
      babel({ babelHelpers: 'bundled', exclude: 'node_modules/**' }),
      filesize(),
      terser(),
      clear({
        targets: ['dist'],
      }),
    ],
    external: ['webrtc-adapter'],
  },
  {
    input: ['src/**/*.js', '!src/**/*.test.js'],
    output: [
      {
        dir: 'lib',
        format: 'es',
        sourcemap: true,
      },
    ],
    plugins: [
      multiInput(),
      resolve(),
      commonjs(),
      babel({ babelHelpers: 'bundled', exclude: 'node_modules/**' }),
      // terser(),
      clear({
        targets: ['lib'],
      }),
    ],
    external: ['webrtc-adapter'],
  },
];
