/* eslint-env jest */
export {}
const { Lrud } = require('../src/index')

describe('registerTree()', () => {
  test('register a tree from one instance into another instance', () => {
    const Alpha = new Lrud()
    const Beta = new Lrud()

    // register nodes against A
    Alpha.registerNode('root')
    Alpha.registerNode('a', { isFocusable: true })
    Alpha.registerNode('b', { isFocusable: true })

    // register A's tree against B
    Beta.registerTree(Alpha.tree)

    // B should now have the correct nodes in its tree
    expect(Beta.tree.root).toBeTruthy()
    expect(Beta.tree.root.children.a).toBeTruthy()
    expect(Beta.tree.root.children.b).toBeTruthy()
  })
})
