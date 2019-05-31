import typescript from 'rollup-plugin-typescript2'
import pkg from './package.json'
import nodeResolve from 'rollup-plugin-node-resolve'
export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs'
    }
  ],
  external: [
    ...Object.keys(pkg.peerDependencies || {})
  ],
  plugins: [
    typescript({
      typescript: require('typescript')
    }),
    nodeResolve()
  ]
}
