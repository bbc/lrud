import typescriptPlugin from 'rollup-plugin-typescript2'
import nodeResolve from 'rollup-plugin-node-resolve'
import { uglify } from 'rollup-plugin-uglify'

export default [
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/cjs/index.js',
      format: 'cjs'
    },
    plugins: [
      typescriptPlugin({
        useTsconfigDeclarationDir: true
      }),
      nodeResolve()
    ]
  },
  {
    input: 'dist/cjs/index.js',
    output: {
      file: 'dist/cjs/index.min.js',
      format: 'cjs'
    },
    plugins: [
      uglify()
    ]
  },
  {
    input: 'src/index.ts',
    output: {
      file: 'dist/esm/index.js',
      format: 'esm'
    },
    plugins: [
      typescriptPlugin({
        useTsconfigDeclarationDir: true
      }),
      nodeResolve()
    ]
  }
]
