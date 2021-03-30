/* eslint-env jest */

const { Lrud } = require('./index')

describe('unregisterNode()', () => {
  test('unregistering a leaf should remove it', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'vertical' })
    navigation.registerNode('NODE_A', { isFocusable: true })
    navigation.registerNode('NODE_B', { isFocusable: true })

    expect(navigation.nodes.root.children.NODE_A).not.toBeUndefined()

    navigation.unregisterNode('NODE_A')

    expect(navigation.nodes.root.children.NODE_A).toBeUndefined()

    expect(navigation.getNode('NODE_A')).toEqual(undefined)

    expect(Object.keys(navigation.nodes)).toEqual([
      'root',
      'NODE_B'
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

    expect(navigation.nodes.root.children.BOX_A.children.NODE_1).not.toBeUndefined()
    expect(navigation.nodes.root.children.BOX_A.children.NODE_2).not.toBeUndefined()
    expect(navigation.nodes.root.children.BOX_A.children.NODE_3).not.toBeUndefined()
    expect(navigation.nodes.root.children.BOX_B.children.NODE_4).not.toBeUndefined()
    expect(navigation.nodes.root.children.BOX_B.children.NODE_5).not.toBeUndefined()
    expect(navigation.nodes.root.children.BOX_B.children.NODE_6).not.toBeUndefined()

    navigation.unregisterNode('BOX_B')

    expect(navigation.nodes.root.children.BOX_A.children.NODE_1).not.toBeUndefined()
    expect(navigation.nodes.root.children.BOX_A.children.NODE_2).not.toBeUndefined()
    expect(navigation.nodes.root.children.BOX_A.children.NODE_3).not.toBeUndefined()
    expect(navigation.nodes.root.children.BOX_B).toBeUndefined()
    expect(navigation.nodes.root.children.BOX_B).toBeUndefined()
    expect(navigation.nodes.root.children.BOX_B).toBeUndefined()

    expect(Object.keys(navigation.nodes)).toEqual([
      'root',
      'BOX_A',
      'NODE_1',
      'NODE_2',
      'NODE_3'
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
      override_a: {
        id: 'NODE_A',
        direction: 'up',
        target: 'NODE_B'
      },
      override_b: {
        id: 'NODE_C',
        direction: 'up',
        target: 'NODE_D'
      }
    })

    navigation.unregisterNode('NODE_B')

    expect(navigation.overrides).toEqual({
      override_b: {
        id: 'NODE_C',
        direction: 'up',
        target: 'NODE_D'
      }
    })
  })

  /**
   * @see https://github.com/bbc/lrud/issues/86
   */
  test('unregistering a node should unregister the overrides of its children', () => {
    const navigation = new Lrud()

    navigation.registerNode('root')
    navigation.registerNode('a', { parent: 'root' })
    navigation.registerNode('ab', { parent: 'a' })
    navigation.registerNode('b', { parent: 'root' })

    navigation.registerOverride('override_a', {
      id: 'ab',
      direction: 'right',
      target: 'b'
    })

    navigation.unregister('a')

    expect(navigation.overrides).toEqual({})
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
      override_a: {
        id: 'NODE_A',
        direction: 'up',
        target: 'NODE_B'
      },
      override_b: {
        id: 'NODE_C',
        direction: 'up',
        target: 'NODE_D'
      }
    })

    navigation.unregisterNode('NODE_C')

    expect(navigation.overrides).toEqual({
      override_a: {
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

    expect(navigation.nodes).toMatchObject({})
    expect(navigation.overrides).toMatchObject({})
  })

  test('unregistering the focused node when there is nothing else that can be focused on', () => {
    const nav = new Lrud()

    nav.registerNode('root', { orientation: 'vertical' })
    nav.registerNode('row1', { orientation: 'horizontal', parent: 'root' })
    nav.registerNode('item1', { isFocusable: true, parent: 'row1' })

    nav.assignFocus('item1')

    // nothing else to focus on, but we shouldn't throw an exception
    expect(() => {
      nav.unregisterNode('item1')
    }).not.toThrow()

    // activeChild should be cleaned along whole path
    expect(nav.getNode('root').activeChild).toEqual(undefined)
    expect(nav.getNode('row1').activeChild).toEqual(undefined)
  })

  test('unregistering the focused node when there is nothing else that can be focused on - more nesting', () => {
    const nav = new Lrud()

    nav.registerNode('root', { orientation: 'vertical' })
    nav.registerNode('boxa', { orientation: 'horizontal', parent: 'root' })
    nav.registerNode('boxb', { orientation: 'horizontal', parent: 'boxa' })
    nav.registerNode('boxc', { orientation: 'horizontal', parent: 'boxb' })
    nav.registerNode('item1', { isFocusable: true, parent: 'boxc' })

    nav.assignFocus('item1')

    // nothing else to focus on, but we shouldn't throw an exception
    expect(() => {
      nav.unregisterNode('item1')
    }).not.toThrow()

    // activeChild should be cleaned along whole path
    expect(nav.getNode('root').activeChild).toEqual(undefined)
    expect(nav.getNode('boxa').activeChild).toEqual(undefined)
    expect(nav.getNode('boxb').activeChild).toEqual(undefined)
    expect(nav.getNode('boxc').activeChild).toEqual(undefined)
  })

  test('unregistering the focused node when there is other node to focus', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'vertical' })
    navigation.registerNode('a', { parent: 'root', orientation: 'horizontal' })
    navigation.registerNode('aa', { parent: 'a', orientation: 'horizontal' })
    navigation.registerNode('aaa', { parent: 'aa' })
    navigation.registerNode('aab', { parent: 'aa', isFocusable: true })
    navigation.registerNode('b', { parent: 'root' })
    navigation.registerNode('c', { parent: 'root', isFocusable: true })

    navigation.assignFocus('aab')

    // there's `c` that might be focused
    expect(() => {
      navigation.unregisterNode('aab')
    }).not.toThrow()

    // expect `c` to be focused
    expect(navigation.currentFocusNodeId).toEqual('c')

    // invalid activeChild on the branch pointing to the unregistered node should be cleared,
    // where invalid activeChild is a node that doesn't lay on currentFocusNode path
    expect(navigation.getNode('root').activeChild).toEqual('c')
    expect(navigation.getNode('a').activeChild).toEqual(undefined)
    expect(navigation.getNode('aa').activeChild).toEqual(undefined)
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

    expect(nav.nodes.root).toBeTruthy()
    expect(nav.nodes.root.children.node2).toBeTruthy()
    expect(nav.nodes.root.children.node2.children.container).toBeTruthy()
    expect(nav.nodes.root.children.node2.children.container.children.item).toBeTruthy()
    expect(nav.nodes.root.children.node1).toBeFalsy()
  })

  test('unregistering nodes that start with the same string', () => {
    const navigation = new Lrud()

    navigation
      .registerNode('root')
      .registerNode('brand')
      .registerNode('brand-content')

    navigation.unregisterNode('brand')

    expect(Object.keys(navigation.nodes)).toEqual([
      'root',
      'brand-content'
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

    expect(Object.keys(navigation.nodes)).toEqual([
      'root',
      'xx',
      'xx-1',
      'xx-2'
    ])
    expect(navigation.getNode('xx-2')).toBeTruthy()
  })

  test('unregistering a focusable node should remove it from the nodes list', () => {
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

    expect(Object.keys(navigation.nodes)).toEqual([
      'root',
      'x',
      'x-2',
      'xx',
      'xx-1',
      'xx-2'
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
    expect(Object.keys(navigation.nodes)).toEqual([
      'root',
      'x',
      'x-1',
      'x-2',
      'xx',
      'xx-1',
      'xx-2'
    ])

    // now we unregister the parent node, and ensure its children and it are gone from relevant paths
    navigation.unregisterNode('xx')

    expect(Object.keys(navigation.nodes)).toEqual([
      'root',
      'x',
      'x-1',
      'x-2'
    ])
  })

  test('unregistering a sibling of the focused node should not recalculate focus', () => {
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

    const onBlur = jest.fn()
    nav.register('item2', {
      parent: 'node2',
      selectAction: {},
      onBlur
    })

    nav.assignFocus('node2')

    expect(nav.currentFocusNodeId).toEqual('item2')

    nav.unregisterNode('item1')

    expect(nav.currentFocusNodeId).toEqual('item2')
    expect(onBlur).not.toBeCalled()
  })

  test('unregistering a sibling of the focused node should not remove focus - forceRefocus false', () => {
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

    nav.unregisterNode('item1', { forceRefocus: false })

    expect(nav.currentFocusNodeId).toEqual('item2')
  })

  test('unregistering node that was focused but now is not should clean parent\'s activeChild', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a', { parent: 'root' })
      .registerNode('aa', { parent: 'a', isFocusable: true })
      .registerNode('b', { parent: 'root' })
      .registerNode('ba', { parent: 'b', isFocusable: true })

    navigation.assignFocus('aa')
    navigation.assignFocus('ba')

    navigation.unregisterNode('aa')

    expect(navigation.getNode('a').activeChild).toBeUndefined()
  })

  test('unregistering with forceRefocus false should not do a refocus - removing focused node', () => {
    const nav = new Lrud()

    nav.register('root')
      .register('node1', { isFocusable: true })
      .register('node2', { isFocusable: true })
      .register('node3', { isFocusable: true })

    nav.assignFocus('node2')

    nav.unregisterNode('node2', { forceRefocus: false })

    expect(nav.currentFocusNodeId).toEqual(undefined)
    expect(nav.nodes.root.activeChild).toEqual(undefined)
  })

  test('unregistering with forceRefocus false should not do a refocus - removing parent of focused node', () => {
    const nav = new Lrud()

    nav.register('root')
      .register('box1')
      .register('node1', { isFocusable: true, parent: 'box1' })
      .register('node2', { isFocusable: true, parent: 'box1' })
      .register('box2')
      .register('node4', { isFocusable: true, parent: 'box2' })
      .register('node5', { isFocusable: true, parent: 'box2' })

    nav.assignFocus('node2')

    nav.unregisterNode('box1', { forceRefocus: false })

    expect(nav.currentFocusNodeId).toEqual(undefined)
    expect(nav.nodes.root.activeChild).toEqual(undefined)
  })

  test('should do nothing when unregistering not existing node', () => {
    const navigation = new Lrud()

    navigation.register('root')
      .register('a')

    let result
    expect(() => {
      result = navigation.unregisterNode('b')
    }).not.toThrow()

    expect(result).toEqual(navigation)
  })
})
