/* eslint-env jest */

const { Lrud } = require('./index')

describe('registerNode()', () => {
  test('registering the very first registered node sets it to the root node', () => {
    const navigation = new Lrud()
      .registerNode('root', { selectAction: true })

    expect(navigation.rootNode.id).toEqual('root')

    expect(navigation.nodes.root.selectAction).toEqual(true)
  })

  test('registering a node (after the root node) without a parent puts it under the root node', () => {
    const navigation = new Lrud()
      .registerNode('alpha', { selectAction: 1 })
      .registerNode('beta', { selectAction: 1 })
      .registerNode('charlie', { selectAction: 2 })

    const root = navigation.rootNode
    expect(root.id).toEqual('alpha')
    expect(root.children[0].id).toEqual('beta')
    expect(root.children[1].id).toEqual('charlie')
  })

  test('registering a node with a nested parent', () => {
    const navigation = new Lrud()
      .registerNode('alpha', { selectAction: 1 })
      .registerNode('beta', { selectAction: 2 })
      .registerNode('charlie', { selectAction: 3, parent: 'beta' })

    const root = navigation.rootNode
    expect(root.id).toEqual('alpha')
    expect(root.children[0].children[0].parent.id).toEqual('beta')
  })

  test('registering a node with a nested parent where the previous node have the same ending', () => {
    const navigation = new Lrud()
      .registerNode('alpha', { selectAction: 1 })
      .registerNode('beta_beta', { selectAction: 3 })
      .registerNode('beta', { selectAction: 2 })
      .registerNode('charlie', { selectAction: 4, parent: 'beta' })

    const root = navigation.rootNode
    expect(root.id).toEqual('alpha')
    expect(root.children[1].id).toEqual('beta')
    expect(root.children[1].children[0].id).toEqual('charlie')
  })

  test('registering a node with a deeply nested parent', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('region-a', { parent: 'root' })
      .registerNode('region-b', { parent: 'root' })
      .registerNode('content-grid', { parent: 'region-b' })
      .registerNode('PID-X', { parent: 'content-grid' })
      .registerNode('PID-Y', { parent: 'content-grid' })
      .registerNode('PID-Z', { parent: 'content-grid' })

    const root = navigation.rootNode
    expect(root.children[0].id).toEqual('region-a')
    expect(root.children[1].id).toEqual('region-b')
  })

  // reword this
  test('registering a new node with a parent that has no children should not set parent.activeChild to itself', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('alpha', { parent: 'root' })
      .registerNode('beta', { parent: 'root' })
      .registerNode('charlie', { parent: 'alpha' })
      .registerNode('delta', { parent: 'charlie' })
      .registerNode('echo', { parent: 'root' })

    expect(navigation.getNode('root').activeChild).toBeUndefined()
    expect(navigation.getNode('alpha').activeChild).toBeUndefined()
    expect(navigation.getNode('charlie').activeChild).toBeUndefined()
  })

  test('registering a node should add the index to the node', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a')
      .registerNode('b')
      .registerNode('b-1', { parent: 'b' })
      .registerNode('b-2', { parent: 'b' })
      .registerNode('c')

    expect(navigation.getNode('a').index).toEqual(0)
    expect(navigation.getNode('b').index).toEqual(1)
    expect(navigation.getNode('b-1').index).toEqual(0)
    expect(navigation.getNode('b-2').index).toEqual(1)
    expect(navigation.getNode('c').index).toEqual(2)
  })

  test('can chain registers together', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a')
      .registerNode('b')
      .registerNode('c')

    const root = navigation.rootNode
    expect(root.children[0].id).toEqual('a')
    expect(root.children[1].id).toEqual('b')
    expect(root.children[2].id).toEqual('c')
  })

  test('registering a node that already exists should throw an error', () => {
    const navigation = new Lrud()
      .registerNode('root')

    const node = navigation.getNode('root')

    expect(node.id).toEqual('root')

    expect(() => {
      navigation.registerNode('root')
    }).toThrow()
  })

  test('coherent index, should assign last index value if no index value provided', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a')
      .registerNode('b')
      .registerNode('c')

    expect(navigation.getNode('c').index).toEqual(2)
  })

  test('coherent index, should assign last index value even if given index is greater than children size', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a')
      .registerNode('b')
      .registerNode('c', { index: 3 })

    expect(navigation.getNode('c').index).toEqual(2)
  })

  test('coherent index, should insert node at a given position', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a')
      .registerNode('b')
      .registerNode('c', { index: 1 })

    expect(navigation.getNode('c').index).toEqual(1)
    expect(navigation.getNode('b').index).toEqual(2)
  })

  test('should force using id given as a method parameter', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a', { id: 'b', parent: 'root' })

    expect(navigation.getNode('a')).toBeDefined()
    expect(navigation.getNode('b')).toBeUndefined()
  })

  test('should ignore children provided in node configuration', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a', {
        parent: 'root',
        children: { aa: { isFocusable: true } }
      })

    expect(navigation.getNode('a').children).toBeUndefined()
  })

  test('should do nothing when registering node under not existing parent', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a')
      .registerNode('b')

    let result
    expect(() => {
      result = navigation.registerNode('c', { index: 1, parent: 'd' })
    }).not.toThrow()

    expect(result).toEqual(navigation)
  })
})
