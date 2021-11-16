/* eslint-env jest */

const { Lrud } = require('./index')

describe('registerTree()', () => {
  test('register a tree from one instance into another instance', () => {
    const Alpha = new Lrud()
    const Beta = new Lrud()

    // register nodes against A
    Alpha.registerNode('root')
    Alpha.registerNode('a', { isFocusable: true })
    Alpha.registerNode('b', { isFocusable: true })

    // register A's tree against B
    Beta.registerTree(Alpha.getRootNode())

    // B should now have the correct nodes in its tree
    expect(Beta.nodes.root).toBeTruthy()
    expect(Beta.nodes.root.children.length).toEqual(2)
    expect(Beta.nodes.root.children[0].id).toEqual('a')
    expect(Beta.nodes.root.children[1].id).toEqual('b')
  })

  test('should not fail when tree is not defined', () => {
    const navigation = new Lrud()
    navigation.registerNode('root')

    expect(() => navigation.registerTree(undefined)).not.toThrow()
  })
})
