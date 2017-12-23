import builtins from 'rollup-plugin-node-builtins'

export default {
  input: 'src/index.js',
  output: {
    file: 'lib/lrud.js',
    format: 'umd',
    name: 'lrud'
  },
  plugins: [
    builtins()
  ]
}
