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

  test('if unregistering the focused node, recalculate focus', () => {
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

  test('unregistering the root node and re-registering should give a clean tree and internal state', () => {
    const nav = new Lrud()

    nav.registerNode('root', {
      orientation: 'horizontal'
    })
    nav.registerNode('node1', {
      orientation: 'vertical',
      parent: 'root'
    })
    nav.registerNode('container', {
      orientation: 'vertical',
      parent: 'node1'
    })
    nav.registerNode('item', {
      selectAction: {},
      parent: 'container'
    })

    nav.unregisterNode('root')

    nav.registerNode('root', {
      orientation: 'horizontal'
    })
    nav.registerNode('node2', {
      orientation: 'vertical',
      parent: 'root'
    })
    nav.registerNode('container', {
      orientation: 'vertical',
      parent: 'node2'
    })
    nav.registerNode('item', {
      selectAction: {},
      parent: 'container'
    })

    expect(nav.tree['root']).toBeTruthy()
    expect(nav.tree['root'].children['node2']).toBeTruthy()
    expect(nav.tree['root'].children['node2'].children['container']).toBeTruthy()
    expect(nav.tree['root'].children['node2'].children['container'].children['item']).toBeTruthy()
    expect(nav.tree['root'].children['node1']).toBeFalsy()
  })

  test('unregistering nodes that start with the same string', () => {
    const navigation = new Lrud()

    navigation
      .registerNode('root')
      .registerNode('brand')
      .registerNode('brand-content')

    navigation.unregisterNode('brand')

    expect(navigation.nodePathList).toEqual([
      'root',
      'root.children.brand-content'
    ])

    expect(navigation.getNode('brand-content')).toBeTruthy()
  })

  test('unregistering a node should remove it and all its children from the tree and internal state', () => {
    const navigation = new Lrud()

    navigation
      .registerNode('root')
      .registerNode('x')
      .registerNode('x-1', { parent: 'x', isFocusable: true })
      .registerNode('x-2', { parent: 'x', isFocusable: true })
      .registerNode('xx')
      .registerNode('xx-1', { parent: 'xx', isFocusable: true })
      .registerNode('xx-2', { parent: 'xx', isFocusable: true })

    navigation.unregisterNode('x')

    expect(navigation.nodePathList).toEqual([
      'root',
      'root.children.xx',
      'root.children.xx.children.xx-1',
      'root.children.xx.children.xx-2'
    ])
    expect(navigation.focusableNodePathList).toEqual([
      'root.children.xx.children.xx-1',
      'root.children.xx.children.xx-2'
    ])
    expect(navigation.getNode('xx-2')).toBeTruthy()
  })

  test('unregistering a focusable node should remove it from both the path lists', () => {
    const navigation = new Lrud()

    navigation
      .registerNode('root')
      .registerNode('x')
      .registerNode('x-1', { parent: 'x', isFocusable: true })
      .registerNode('x-2', { parent: 'x', isFocusable: true })
      .registerNode('xx')
      .registerNode('xx-1', { parent: 'xx', isFocusable: true })
      .registerNode('xx-2', { parent: 'xx', isFocusable: true })

    navigation.unregisterNode('x-1')

    expect(navigation.nodePathList).toEqual([
      'root',
      'root.children.x',
      'root.children.x.children.x-2',
      'root.children.xx',
      'root.children.xx.children.xx-1',
      'root.children.xx.children.xx-2'
    ])

    expect(navigation.focusableNodePathList).toEqual([
      'root.children.x.children.x-2',
      'root.children.xx.children.xx-1',
      'root.children.xx.children.xx-2'
    ])
  })

  test('unregistering a node that has children that are focusable should remove and its children from all relevant internal state', () => {
    // the node from the nodePathList, and the children from the nodePathList & focusableNodePathList

    const navigation = new Lrud()

    navigation
      .registerNode('root')
      .registerNode('x')
      .registerNode('x-1', { parent: 'x', isFocusable: true })
      .registerNode('x-2', { parent: 'x', isFocusable: true })
      .registerNode('xx')
      .registerNode('xx-1', { parent: 'xx', isFocusable: true })
      .registerNode('xx-2', { parent: 'xx', isFocusable: true })

    // ensure state is correct after registration (for sanitys sake...)
    expect(navigation.nodePathList).toEqual([
      'root',
      'root.children.x',
      'root.children.x.children.x-1',
      'root.children.x.children.x-2',
      'root.children.xx',
      'root.children.xx.children.xx-1',
      'root.children.xx.children.xx-2'
    ])
    expect(navigation.focusableNodePathList).toEqual([
      'root.children.x.children.x-1',
      'root.children.x.children.x-2',
      'root.children.xx.children.xx-1',
      'root.children.xx.children.xx-2'
    ])

    // now we unregister the parent node, and ensure its children and it are gone from relevant paths
    navigation.unregisterNode('xx')

    expect(navigation.nodePathList).toEqual([
      'root',
      'root.children.x',
      'root.children.x.children.x-1',
      'root.children.x.children.x-2'
    ])
    expect(navigation.focusableNodePathList).toEqual([
      'root.children.x.children.x-1',
      'root.children.x.children.x-2'
    ])
  })

  test('unregistering a pibling of the focused node', () => {
    const nav = new Lrud()

    nav.register('root', {
      orientation: 'horizontal'
    })

    nav.register('node1', {
      orientation: 'vertical',
      parent: 'root'
    })

    nav.register('item1', {
      parent: 'node1',
      selectAction: {}
    })

    nav.register('node2', {
      orientation: 'vertical',
      parent: 'root'
    })

    nav.register('item2', {
      parent: 'node2',
      selectAction: {}
    })

    nav.assignFocus('node2')

    expect(nav.currentFocusNodeId).toEqual('item2')

    nav.unregisterNode('item1')

    expect(nav.currentFocusNodeId).toEqual('item2')
  })
})
