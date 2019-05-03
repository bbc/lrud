import typescript from 'rollup-plugin-typescript2'
import pkg from './package.json'
import nodeResolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'

export default {
  input: 'src/index.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs'
    }
  ],
  external: [
    ...Object.keys(pkg.peerDependencies || {})
  ],
  plugins: [
    commonjs(),
    nodeResolve(),
    typescript({
      typescript: require('typescript')
    })
  ]
}
