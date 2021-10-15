/* eslint-env jest */
const { Lrud } = require('./index')

describe('insertTree()', () => {
  test('should insert a simple tree into an empty instance', () => {
    const navigation = new Lrud()
    const tree = {
      id: 'root',
      orientation: 'horizontal',
      children: [
        { id: 'child_a', isFocusable: true },
        { id: 'child_b', isFocusable: true }
      ]
    }

    navigation.insertTree(tree)
    navigation.assignFocus('child_a')

    const root = navigation.nodes.root
    expect(root).toBeTruthy()
    expect(root.children.length).toEqual(2)
    expect(root.children[0].id).toEqual('child_a')
    expect(root.children[1].id).toEqual('child_b')
    expect(navigation.currentFocusNode.id).toEqual('child_a')
  })

  test('should insert a simple tree into an existing branch of lrud', () => {
    const tree = {
      id: 'alpha',
      orientation: 'horizontal',
      children: [
        { id: 'child_a', isFocusable: true },
        { id: 'child_b', isFocusable: true }
      ]
    }

    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('alpha', { isFocusable: true })
      .registerNode('beta', { isFocusable: true })

    const root = navigation.nodes.root
    expect(root).toBeTruthy()
    expect(root.children.length).toEqual(2)

    let alpha = root.children[0]
    expect(alpha.id).toEqual('alpha')
    expect(alpha.isFocusable).toEqual(true)
    expect(alpha.children).toBeUndefined()

    let beta = root.children[1]
    expect(beta.id).toEqual('beta')
    expect(beta.isFocusable).toEqual(true)
    expect(beta.children).toBeUndefined()

    navigation.insertTree(tree)

    alpha = root.children[0]
    expect(alpha.children.length).toEqual(2)
    expect(alpha.children[0]).toMatchObject({ id: 'child_a', isFocusable: true })
    expect(alpha.children[1]).toMatchObject({ id: 'child_b', isFocusable: true })

    beta = root.children[1]
    expect(beta.children).toBeUndefined()
  })

  test('simple tree, inserting into existing branch, maintain index order', () => {
    const tree = {
      id: 'beta',
      orientation: 'horizontal',
      children: [
        { id: 'child_a', isFocusable: true },
        { id: 'child_b', isFocusable: true }
      ]
    }

    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('alpha', { isFocusable: true })
      .registerNode('beta', { isFocusable: true })
      .registerNode('charlie', { isFocusable: true })

    const root = navigation.nodes.root
    expect(root.children[0]).toMatchObject({ id: 'alpha', index: 0 })
    expect(root.children[1]).toMatchObject({ id: 'beta', index: 1 })
    expect(root.children[2]).toMatchObject({ id: 'charlie', index: 2 })

    navigation.insertTree(tree)

    expect(root.children[0]).toMatchObject({ id: 'alpha', index: 0 })
    expect(root.children[1]).toMatchObject({ id: 'beta', index: 1 })
    expect(root.children[2]).toMatchObject({ id: 'charlie', index: 2 })
  })

  test('simple tree, inserting into existing branch, DONT maintain index order', () => {
    const tree = {
      id: 'beta',
      orientation: 'horizontal',
      children: [
        { id: 'child_a', isFocusable: true },
        { id: 'child_b', isFocusable: true }
      ]
    }

    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('alpha', { isFocusable: true })
      .registerNode('beta', { isFocusable: true })
      .registerNode('charlie', { isFocusable: true })

    const root = navigation.nodes.root
    expect(root.children[0]).toMatchObject({ id: 'alpha', index: 0 })
    expect(root.children[1]).toMatchObject({ id: 'beta', index: 1 })
    expect(root.children[2]).toMatchObject({ id: 'charlie', index: 2 })

    navigation.insertTree(tree, { maintainIndex: false })

    // note that beta is now at the end, as it was picked and re-inserted
    expect(root.children[0]).toMatchObject({ id: 'alpha', index: 0 })
    expect(root.children[1]).toMatchObject({ id: 'charlie', index: 1 })
    expect(root.children[2]).toMatchObject({ id: 'beta', index: 2 })
  })

  test('insert a tree under the root node of the existing tree, as no parent given on the top node of the tree', () => {
    const tree = {
      id: 'charlie',
      orientation: 'horizontal',
      children: [
        { id: 'child_a', isFocusable: true },
        { id: 'child_b', isFocusable: true }
      ]
    }

    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('alpha', { isFocusable: true })
      .registerNode('beta', { isFocusable: true })

    navigation.insertTree(tree)

    const root = navigation.nodes.root
    expect(root.children[0]).toMatchObject({ id: 'alpha', index: 0 })
    expect(root.children[1]).toMatchObject({ id: 'beta', index: 1 })

    const charlie = root.children[2]
    expect(charlie).toMatchObject({ id: 'charlie', index: 2 })
    expect(charlie.children).toBeTruthy()
  })

  test('insert a tree under a branch that ISNT the root node', () => {
    const tree = {
      id: 'charlie',
      parent: 'beta',
      orientation: 'horizontal',
      children: [
        { id: 'child_a', isFocusable: true },
        { id: 'child_b', isFocusable: true }
      ]
    }

    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('alpha', { isFocusable: true })
      .registerNode('beta', { orientation: 'vertical' })

    navigation.insertTree(tree)

    const root = navigation.nodes.root
    expect(root.children[0]).toMatchObject({ id: 'alpha' })
    expect(root.children[1]).toMatchObject({ id: 'beta' })
    expect(root.children[1].children[0]).toMatchObject({ id: 'charlie' })
    expect(root.children[1].children[0].children).toBeTruthy()
  })

  /**
   * @see https://github.com/bbc/lrud/issues/84
   */
  test('should correctly maintain index when replacing first child', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a')
      .registerNode('b')
      .registerNode('c')

    navigation.insertTree({ id: 'a', isFocusable: true })

    // expect top node was replaced with inserted tree
    expect(navigation.getNode('a').isFocusable).toEqual(true)

    // expect index of the top node parent is maintained
    expect(navigation.getNode('a').index).toEqual(0)
  })

  test('coherent index, keep parent\'s children indices coherent if index is not maintained', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a')
      .registerNode('b')
      .registerNode('c')
      .registerNode('d')

    navigation.insertTree({ id: 'c', index: 1, isFocusable: true }, { maintainIndex: false })

    // expect top node was replaced with inserted tree
    expect(navigation.getNode('c').isFocusable).toEqual(true)

    // original 'c' was unregistered, so 'd' was shifted down to '2',
    // but than new 'c' was inserted at '1', so 'd' was shifted up back to '3' and 'b' was shifted up to '2'
    expect(navigation.getNode('a').index).toEqual(0)
    expect(navigation.getNode('b').index).toEqual(2)
    expect(navigation.getNode('c').index).toEqual(1)
    expect(navigation.getNode('d').index).toEqual(3)
  })

  test('coherent index, should maintain original child index overriding provided index', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a')
      .registerNode('b')

    navigation.insertTree({ id: 'a', index: 5, isFocusable: true })

    // expect top node was replaced with inserted tree
    expect(navigation.getNode('a').isFocusable).toEqual(true)

    // existing 'a' node was unregistered, but its index is reassigned and kept by re-registered 'a' node
    expect(navigation.getNode('a').index).toEqual(0)
  })

  test('should not fail when tree is not defined', () => {
    const navigation = new Lrud()
      .registerNode('root')

    expect(() => navigation.insertTree(undefined)).not.toThrow()
  })
})
