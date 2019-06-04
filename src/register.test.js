/* eslint-env jest */

const { Lrud } = require('./index')

describe('registerNode()', () => {
  test('registering the very first registered node sets it to the root node', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', {
      selectAction: true
    })

    expect(navigation.rootNodeId).toEqual('root')

    expect(navigation.tree.root.selectAction).toEqual(true)
  })

  test('registering a node (after the root node) without a parent puts it under the root node', () => {
    const navigation = new Lrud()

    navigation.registerNode('alpha', { z: 1 })
    navigation.registerNode('beta', { x: 1 })
    navigation.registerNode('charlie', { x: 2 })

    expect(navigation.tree.alpha.z).toEqual(1)
    expect(navigation.tree.alpha.children.beta).not.toBeUndefined()
    expect(navigation.tree.alpha.children.charlie).not.toBeUndefined()
  })

  test('registering a node with a nested parent', () => {
    const navigation = new Lrud()

    navigation.registerNode('alpha', { a: 1 })
    navigation.registerNode('beta', { b: 2 })
    navigation.registerNode('charlie', { c: 3, parent: 'beta' })

    expect(navigation.tree.alpha.children.beta.children.charlie.parent).toEqual('beta')
  })

  test('registering a node with a deeply nested parent', () => {
    const navigation = new Lrud()

    navigation.registerNode('root')
    navigation.registerNode('region-a', { parent: 'root' })
    navigation.registerNode('region-b', { parent: 'root' })
    navigation.registerNode('content-grid', { parent: 'region-b' })
    navigation.registerNode('PID-X', { parent: 'content-grid' })
    navigation.registerNode('PID-Y', { parent: 'content-grid' })
    navigation.registerNode('PID-Z', { parent: 'content-grid' })

    expect(navigation.tree.root.children['region-a']).not.toBeUndefined()
    expect(navigation.tree.root.children['region-b']).not.toBeUndefined()
  })

  // reword this
  test('registering a new node with a parent that has no children sets its parent.activeChild to itself', () => {
    const navigation = new Lrud()

    navigation.registerNode('root')
    navigation.registerNode('alpha', { parent: 'root' })
    navigation.registerNode('beta', { parent: 'root' })
    navigation.registerNode('charlie', { parent: 'alpha' })
    navigation.registerNode('delta', { parent: 'charlie' })
    navigation.registerNode('echo', { parent: 'root' })

    // 'root' should have 3 children and its activeChild should be 'alpha'
    // 'alpha' should have 1 children and its activeChild should be 'charlie'
    // 'charlie' should have 1 children and its activeChild should be 'delta'

    expect(navigation.getNode('root').activeChild).toEqual('alpha')
    expect(navigation.getNode('alpha').activeChild).toEqual('charlie')
    expect(navigation.getNode('charlie').activeChild).toEqual('delta')
  })

  test('registering a node should add the index to the node', () => {
    const navigation = new Lrud()

    navigation.registerNode('root')
    navigation.registerNode('a')

    navigation.registerNode('b')
    navigation.registerNode('b-1', { parent: 'b' })
    navigation.registerNode('b-2', { parent: 'b' })

    navigation.registerNode('c')

    expect(navigation.getNode('a').index).toEqual(0)
    expect(navigation.getNode('b').index).toEqual(1)
    expect(navigation.getNode('b-1').index).toEqual(0)
    expect(navigation.getNode('b-2').index).toEqual(1)
    expect(navigation.getNode('c').index).toEqual(2)
  })

  test('can chain registers together', () => {
    const navigation = new Lrud()

    navigation
      .registerNode('root')
      .registerNode('a')
      .registerNode('b')
      .registerNode('c')

    expect(navigation.tree.root.children.a).not.toBeUndefined()
    expect(navigation.tree.root.children.b).not.toBeUndefined()
    expect(navigation.tree.root.children.c).not.toBeUndefined()
  })

  test('registering a node that already exists should throw an error', () => {
    const navigation = new Lrud()

    navigation.registerNode('root')

    const node = navigation.getNode('root')

    expect(node.id).toEqual('root')

    expect(() => {
      navigation.registerNode('root')
    }).toThrow()
  })
})
