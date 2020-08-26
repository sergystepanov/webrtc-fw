import babel from '@rollup/plugin-babel';
import commonjs from '@rollup/plugin-commonjs';
import filesize from 'rollup-plugin-filesize';
import resolve from '@rollup/plugin-node-resolve';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.js',
  output: {
    file: 'dist/bundle.js',
    format: 'es',
  },
  plugins: [
    resolve(),
    commonjs(),
    babel({ babelHelpers: 'bundled', exclude: 'node_modules/**' }),
    filesize(),
    terser(),
  ],
  external: ['webrtc-adapter'],
};
