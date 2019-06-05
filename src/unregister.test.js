/* eslint-env jest */

const { Lrud } = require('./index')

describe('unregisterNode()', () => {
  test('unregistering a leaf should remove it', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'vertical' })
    navigation.registerNode('NODE_A', { isFocusable: true })
    navigation.registerNode('NODE_B', { isFocusable: true })

    expect(navigation.tree.root.children['NODE_A']).not.toBeUndefined()

    navigation.unregisterNode('NODE_A')

    expect(navigation.tree.root.children['NODE_A']).toBeUndefined()

    expect(navigation.getNode('NODE_A')).toEqual(undefined)

    expect(navigation.nodePathList).toEqual([
      'root',
      'root.children.NODE_B'
    ])
  })

  test('unregister a whole branch', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { selectAction: 1 })
    navigation.registerNode('BOX_A', { selectAction: 2 })
    navigation.registerNode('BOX_B', { selectAction: 3 })
    navigation.registerNode('NODE_1', { selectAction: 11, parent: 'BOX_A' })
    navigation.registerNode('NODE_2', { selectAction: 12, parent: 'BOX_A' })
    navigation.registerNode('NODE_3', { selectAction: 13, parent: 'BOX_A' })
    navigation.registerNode('NODE_4', { selectAction: 24, parent: 'BOX_B' })
    navigation.registerNode('NODE_5', { selectAction: 25, parent: 'BOX_B' })
    navigation.registerNode('NODE_6', { selectAction: 26, parent: 'BOX_B' })

    expect(navigation.tree.root.children['BOX_A'].children['NODE_1']).not.toBeUndefined()
    expect(navigation.tree.root.children['BOX_A'].children['NODE_2']).not.toBeUndefined()
    expect(navigation.tree.root.children['BOX_A'].children['NODE_3']).not.toBeUndefined()
    expect(navigation.tree.root.children['BOX_B'].children['NODE_4']).not.toBeUndefined()
    expect(navigation.tree.root.children['BOX_B'].children['NODE_5']).not.toBeUndefined()
    expect(navigation.tree.root.children['BOX_B'].children['NODE_6']).not.toBeUndefined()

    navigation.unregisterNode('BOX_B')

    expect(navigation.tree.root.children['BOX_A'].children['NODE_1']).not.toBeUndefined()
    expect(navigation.tree.root.children['BOX_A'].children['NODE_2']).not.toBeUndefined()
    expect(navigation.tree.root.children['BOX_A'].children['NODE_3']).not.toBeUndefined()
    expect(navigation.tree.root.children['BOX_B']).toBeUndefined()
    expect(navigation.tree.root.children['BOX_B']).toBeUndefined()
    expect(navigation.tree.root.children['BOX_B']).toBeUndefined()

    expect(navigation.nodePathList).toEqual([
      'root',
      'root.children.BOX_A',
      'root.children.BOX_A.children.NODE_1',
      'root.children.BOX_A.children.NODE_2',
      'root.children.BOX_A.children.NODE_3'
    ])
  })

  test('if unregistering the focused node, recalcualte focus', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'horizontal' })
    navigation.registerNode('NODE_1', { parent: 'root', isFocusable: true })
    navigation.registerNode('NODE_2', { parent: 'root', isFocusable: true })
    navigation.registerNode('NODE_3', { parent: 'root', isFocusable: true })

    navigation.assignFocus('NODE_3')

    navigation.unregisterNode('NODE_3')

    expect(navigation.currentFocusNodeId).toEqual('NODE_1')
  })

  test('if unregistering a parent or parent branch of the focused node, recalculate focus', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'vertical' })
    navigation.registerNode('BOX_A', { parent: 'root', orientation: 'vertical' })
    navigation.registerNode('BOX_B', { parent: 'root', orientation: 'vertical' })
    navigation.registerNode('NODE_1', { parent: 'BOX_A', isFocusable: true })
    navigation.registerNode('NODE_2', { parent: 'BOX_A', isFocusable: true })
    navigation.registerNode('NODE_3', { parent: 'BOX_B', isFocusable: true })
    navigation.registerNode('NODE_4', { parent: 'BOX_B', isFocusable: true })

    // so we're focused on the first element of the left pane
    // and we unregister the entire left pane
    // so focus should go to the first element of the right pane
    navigation.assignFocus('NODE_1')
    navigation.unregisterNode('BOX_A')

    expect(navigation.currentFocusNodeId).toEqual('NODE_3')
  })

  test('unregistering a node should trigger a `blur` event with that node', () => {
    const navigation = new Lrud()
    const spy = jest.fn()
    navigation.on('blur', spy)
    navigation.registerNode('root')
    navigation.registerNode('BOX_A', { parent: 'root' })
    navigation.registerNode('BOX_B', { parent: 'root' })
    navigation.registerNode('NODE_1', { parent: 'BOX_A' })
    navigation.registerNode('NODE_2', { parent: 'BOX_A' })
    navigation.registerNode('NODE_3', { parent: 'BOX_A' })
    navigation.registerNode('NODE_4', { parent: 'BOX_B' })
    navigation.registerNode('NODE_5', { parent: 'BOX_B' })
    navigation.registerNode('NODE_6', { parent: 'BOX_B' })

    navigation.unregisterNode('BOX_B')

    // should trigger with the details of BOX_B
    expect(spy).toHaveBeenCalledWith({
      parent: 'root',
      id: 'BOX_B',
      index: 1,
      activeChild: 'NODE_4',
      children: {
        NODE_4: {
          id: 'NODE_4',
          index: 0,
          parent: 'BOX_B'
        },
        NODE_5: {
          id: 'NODE_5',
          index: 1,
          parent: 'BOX_B'
        },
        NODE_6: {
          id: 'NODE_6',
          index: 2,
          parent: 'BOX_B'
        }
      }
    })
  })

  test('unregistering a branch with only 1 leaf should reset focus properly one level up', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'vertical' })
    navigation.registerNode('a', { parent: 'root', orientation: 'vertical' })
    navigation.registerNode('b', { parent: 'root', orientation: 'vertical' })
    navigation.registerNode('a-1', { parent: 'a', isFocusable: true })
    navigation.registerNode('a-2', { parent: 'a', isFocusable: true })
    navigation.registerNode('a-3', { parent: 'a', isFocusable: true })
    navigation.registerNode('b-1', { parent: 'b', isFocusable: true })

    navigation.assignFocus('b-1')

    navigation.unregisterNode('b')

    // so now we should be focused on `a-1`, as its the first relevant thing to be focused on

    expect(navigation.currentFocusNodeId).toEqual('a-1')
  })

  test('unregistering the only leaf of a long line of single branches should reset focus properly [fig-4]', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'vertical' })
    navigation.registerNode('a', { parent: 'root', orientation: 'vertical' })
    navigation.registerNode('a-1', { parent: 'a', isFocusable: true })

    navigation.registerNode('b', { parent: 'root', orientation: 'vertical' })
    navigation.registerNode('c', { parent: 'b', orientation: 'vertical' })
    navigation.registerNode('d', { parent: 'c', orientation: 'vertical' })
    navigation.registerNode('e', { parent: 'd', orientation: 'vertical' })
    navigation.registerNode('e-1', { parent: 'e', isFocusable: true })

    navigation.assignFocus('e-1')

    navigation.unregisterNode('e-1')

    // we have to dig up to the first thing that has children, and then dig down for the next child
    // so basically our focus should now be on `a-1`

    expect(navigation.currentFocusNodeId).toEqual('a-1')
  })

  test('unregistering a node that is the target of an override should unregister the override', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'horizontal' })
    navigation.registerNode('NODE_A', { isFocusable: true })
    navigation.registerNode('NODE_B', { isFocusable: true })
    navigation.registerNode('NODE_C', { isFocusable: true })
    navigation.registerNode('NODE_D', { isFocusable: true })
    navigation.assignFocus('NODE_A')

    navigation.registerOverride('override_a', {
      id: 'NODE_A',
      direction: 'up',
      target: 'NODE_B'
    })

    navigation.registerOverride('override_b', {
      id: 'NODE_C',
      direction: 'up',
      target: 'NODE_D'
    })

    expect(navigation.overrides).toEqual({
      'override_a': {
        id: 'NODE_A',
        direction: 'up',
        target: 'NODE_B'
      },
      'override_b': {
        id: 'NODE_C',
        direction: 'up',
        target: 'NODE_D'
      }
    })

    navigation.unregisterNode('NODE_B')

    expect(navigation.overrides).toEqual({
      'override_b': {
        id: 'NODE_C',
        direction: 'up',
        target: 'NODE_D'
      }
    })
  })

  test('unregistering a node that is the id of an override should unregister the override', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'horizontal' })
    navigation.registerNode('NODE_A', { isFocusable: true })
    navigation.registerNode('NODE_B', { isFocusable: true })
    navigation.registerNode('NODE_C', { isFocusable: true })
    navigation.registerNode('NODE_D', { isFocusable: true })
    navigation.assignFocus('NODE_A')

    navigation.registerOverride('override_a', {
      id: 'NODE_A',
      direction: 'up',
      target: 'NODE_B'
    })

    navigation.registerOverride('override_b', {
      id: 'NODE_C',
      direction: 'up',
      target: 'NODE_D'
    })

    expect(navigation.overrides).toEqual({
      'override_a': {
        id: 'NODE_A',
        direction: 'up',
        target: 'NODE_B'
      },
      'override_b': {
        id: 'NODE_C',
        direction: 'up',
        target: 'NODE_D'
      }
    })

    navigation.unregisterNode('NODE_C')

    expect(navigation.overrides).toEqual({
      'override_a': {
        id: 'NODE_A',
        direction: 'up',
        target: 'NODE_B'
      }
    })
  })

  test('unregistering the root node should leave an empty tree and empty overrides', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'vertical' })
    navigation.registerNode('left', { orientation: 'vertical' })
    navigation.registerNode('right', { orientation: 'vertical' })
    navigation.registerOverride('x', {
      id: 'left',
      direction: 'up',
      target: 'down'
    })
    navigation.unregisterNode('root')

    expect(navigation.tree).toMatchObject({})
    expect(navigation.overrides).toMatchObject({})
  })

  test('unregistering the focused node when there is nothing else that can be focused on', () => {
    const nav = new Lrud()

    nav.registerNode('root', { orientation: 'vertical' })
    nav.registerNode('row1', { orientation: 'horizontal', parent: 'root' })
    nav.registerNode('item1', { isFocusable: true, parent: 'row1' })

    // nothing else to focus on, but we shouldn't throw an exception
    expect(() => {
      nav.unregisterNode('item1')
    }).not.toThrow()

    // root should still have an activeChild of row 1
    expect(nav.getNode('root').activeChild).toEqual('row1')
    expect(nav.getNode('row1').activeChild).toEqual(undefined)
  })

  test('unregistering the focused node when there is nothing else that can be focused on - more nesting', () => {
    const nav = new Lrud()

    nav.registerNode('root', { orientation: 'vertical' })
    nav.registerNode('boxa', { orientation: 'horizontal', parent: 'root' })
    nav.registerNode('boxb', { orientation: 'horizontal', parent: 'boxa' })
    nav.registerNode('boxc', { orientation: 'horizontal', parent: 'boxb' })
    nav.registerNode('item1', { isFocusable: true, parent: 'boxc' })

    // nothing else to focus on, but we shouldn't throw an exception
    expect(() => {
      nav.unregisterNode('item1')
    }).not.toThrow()

    // root should still have an activeChild of row 1
    expect(nav.getNode('root').activeChild).toEqual('boxa')
    expect(nav.getNode('boxa').activeChild).toEqual('boxb')
    expect(nav.getNode('boxb').activeChild).toEqual('boxc')
    expect(nav.getNode('boxc').activeChild).toEqual(undefined)
  })
})
