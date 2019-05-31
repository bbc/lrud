/* eslint-env jest */

const { Lrud } = require('../dist/index')

describe('build test', () => {
  test('ensure LRUD build is in correct format', () => {
    const tree = new Lrud()

    expect(tree.registerNode).not.toBeUndefined()
  })
})
