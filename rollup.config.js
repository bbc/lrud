import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'

export default {
  input: 'lrud.js',
  output: {
    file: 'dist/lrud.js',
    format: 'umd',
    name: 'Lrud'
  },
  plugins: [
    nodeResolve(),
    commonjs()
  ]
}
