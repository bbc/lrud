/* eslint-env jest */

const { Lrud } = require('./index')

describe('unregisterNode()', () => {
  test('unregistering a leaf should remove it', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('NODE_A', { isFocusable: true })
      .registerNode('NODE_B', { isFocusable: true })

    expect(navigation.rootNode.children[0]).not.toBeUndefined()
    expect(navigation.rootNode.children[0].id).toEqual('NODE_A')
    expect(navigation.rootNode.children.length).toEqual(2)

    navigation.unregisterNode('NODE_A')

    expect(navigation.rootNode.children[0]).not.toBeUndefined()
    expect(navigation.rootNode.children[0].id).toEqual('NODE_B')
    expect(navigation.rootNode.children.length).toEqual(1)

    expect(navigation.getNode('NODE_A')).toBeUndefined()

    expect(Object.keys(navigation.nodes)).toEqual([
      'root',
      'NODE_B'
    ])
  })

  test('unregister a whole branch', () => {
    const navigation = new Lrud()
      .registerNode('root', { selectAction: 1 })
      .registerNode('BOX_A', { selectAction: 2 })
      .registerNode('BOX_B', { selectAction: 3 })
      .registerNode('NODE_1', { selectAction: 11, parent: 'BOX_A' })
      .registerNode('NODE_2', { selectAction: 12, parent: 'BOX_A' })
      .registerNode('NODE_3', { selectAction: 13, parent: 'BOX_A' })
      .registerNode('NODE_4', { selectAction: 24, parent: 'BOX_B' })
      .registerNode('NODE_5', { selectAction: 25, parent: 'BOX_B' })
      .registerNode('NODE_6', { selectAction: 26, parent: 'BOX_B' })

    expect(navigation.rootNode.children.length).toEqual(2)
    expect(navigation.rootNode.children[0].id).toEqual('BOX_A')
    expect(navigation.rootNode.children[0].children.length).toEqual(3)
    expect(navigation.rootNode.children[0].children).toEqual([
      expect.objectContaining({ id: 'NODE_1' }),
      expect.objectContaining({ id: 'NODE_2' }),
      expect.objectContaining({ id: 'NODE_3' })
    ])
    expect(navigation.rootNode.children[1].id).toEqual('BOX_B')
    expect(navigation.rootNode.children[1].children.length).toEqual(3)
    expect(navigation.rootNode.children[1].children).toEqual([
      expect.objectContaining({ id: 'NODE_4' }),
      expect.objectContaining({ id: 'NODE_5' }),
      expect.objectContaining({ id: 'NODE_6' })
    ])

    navigation.unregisterNode('BOX_B')

    expect(navigation.rootNode.children.length).toEqual(1)
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
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('NODE_1', { parent: 'root', isFocusable: true })
      .registerNode('NODE_2', { parent: 'root', isFocusable: true })
      .registerNode('NODE_3', { parent: 'root', isFocusable: true })

    navigation.assignFocus('NODE_3')

    navigation.unregisterNode('NODE_3')

    expect(navigation.currentFocusNode.id).toEqual('NODE_1')
  })

  test('if unregistering a parent or parent branch of the focused node, recalculate focus', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('BOX_A', { parent: 'root', orientation: 'vertical' })
      .registerNode('BOX_B', { parent: 'root', orientation: 'vertical' })
      .registerNode('NODE_1', { parent: 'BOX_A', isFocusable: true })
      .registerNode('NODE_2', { parent: 'BOX_A', isFocusable: true })
      .registerNode('NODE_3', { parent: 'BOX_B', isFocusable: true })
      .registerNode('NODE_4', { parent: 'BOX_B', isFocusable: true })

    // so we're focused on the first element of the left pane
    // and we unregister the entire left pane
    // so focus should go to the first element of the right pane
    navigation.assignFocus('NODE_1')
    navigation.unregisterNode('BOX_A')

    expect(navigation.currentFocusNode.id).toEqual('NODE_3')
  })

  test('unregistering a node should trigger a `blur` event with that node', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('BOX_A', { parent: 'root' })
      .registerNode('BOX_B', { parent: 'root' })
      .registerNode('NODE_1', { parent: 'BOX_A' })
      .registerNode('NODE_2', { parent: 'BOX_A' })
      .registerNode('NODE_3', { parent: 'BOX_A' })
      .registerNode('NODE_4', { parent: 'BOX_B' })
      .registerNode('NODE_5', { parent: 'BOX_B' })
      .registerNode('NODE_6', { parent: 'BOX_B' })

    const spy = jest.fn()
    navigation.on('blur', spy)

    navigation.unregisterNode('BOX_B')

    // should trigger with the details of BOX_B
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'BOX_B' }))
  })

  test('unregistering a branch with only 1 leaf should reset focus properly one level up', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('a', { parent: 'root', orientation: 'vertical' })
      .registerNode('b', { parent: 'root', orientation: 'vertical' })
      .registerNode('a-1', { parent: 'a', isFocusable: true })
      .registerNode('a-2', { parent: 'a', isFocusable: true })
      .registerNode('a-3', { parent: 'a', isFocusable: true })
      .registerNode('b-1', { parent: 'b', isFocusable: true })

    navigation.assignFocus('b-1')

    navigation.unregisterNode('b')

    // so now we should be focused on `a-1`, as its the first relevant thing to be focused on
    expect(navigation.currentFocusNode.id).toEqual('a-1')
  })

  test('unregistering the only leaf of a long line of single branches should reset focus properly [fig-4]', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('a', { parent: 'root', orientation: 'vertical' })
      .registerNode('a-1', { parent: 'a', isFocusable: true })
      .registerNode('b', { parent: 'root', orientation: 'vertical' })
      .registerNode('c', { parent: 'b', orientation: 'vertical' })
      .registerNode('d', { parent: 'c', orientation: 'vertical' })
      .registerNode('e', { parent: 'd', orientation: 'vertical' })
      .registerNode('e-1', { parent: 'e', isFocusable: true })

    navigation.assignFocus('e-1')

    navigation.unregisterNode('e-1')

    // we have to dig up to the first thing that has children, and then dig down for the next child
    // so basically our focus should now be on `a-1`
    expect(navigation.currentFocusNode.id).toEqual('a-1')
  })

  test('unregistering a node that is the target of an override should unregister the override', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('NODE_A', { isFocusable: true })
      .registerNode('NODE_B', { isFocusable: true })
      .registerNode('NODE_C', { isFocusable: true })
      .registerNode('NODE_D', { isFocusable: true })
      .registerOverride('NODE_A', 'NODE_B', 'up')
      .registerOverride('NODE_A', 'NODE_D', 'down')
      .registerOverride('NODE_C', 'NODE_D', 'up')

    navigation.assignFocus('NODE_A')

    expect(navigation.nodes.NODE_A.overrides.up).toMatchObject({ id: 'NODE_B' })
    expect(navigation.nodes.NODE_A.overrides.down).toMatchObject({ id: 'NODE_D' })
    expect(navigation.nodes.NODE_C.overrides.up).toMatchObject({ id: 'NODE_D' })

    navigation.unregisterNode('NODE_B')

    expect(navigation.nodes.NODE_A.overrides.up).toBeUndefined()
    expect(navigation.nodes.NODE_A.overrides.down).toMatchObject({ id: 'NODE_D' })
    expect(navigation.nodes.NODE_C.overrides.up).toMatchObject({ id: 'NODE_D' })
  })

  /**
   * @see https://github.com/bbc/lrud/issues/86
   */
  test('unregistering a node should unregister the overrides of its children', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a', { parent: 'root' })
      .registerNode('ab', { parent: 'a' })
      .registerNode('b', { parent: 'root' })
      .registerOverride('ab', 'b', 'right')

    expect(navigation.nodes.b.overrideSources)
      .toEqual([{ direction: 'right', node: expect.objectContaining({ id: 'ab' }) }])

    navigation.unregister('a')

    expect(navigation.nodes.b.overrideSources).toBeUndefined()
  })

  test('unregistering a node that is the id of an override should unregister the override', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('NODE_A', { isFocusable: true })
      .registerNode('NODE_B', { isFocusable: true })
      .registerNode('NODE_C', { isFocusable: true })
      .registerNode('NODE_D', { isFocusable: true })
      .registerOverride('NODE_A', 'NODE_B', 'up')
      .registerOverride('NODE_C', 'NODE_D', 'up')

    navigation.assignFocus('NODE_A')

    expect(navigation.nodes.NODE_A.overrides.up).toMatchObject({ id: 'NODE_B' })
    expect(navigation.nodes.NODE_B.overrideSources).toEqual([{ direction: 'up', node: expect.objectContaining({ id: 'NODE_A' }) }])
    expect(navigation.nodes.NODE_C.overrides.up).toMatchObject({ id: 'NODE_D' })
    expect(navigation.nodes.NODE_D.overrideSources).toEqual([{ direction: 'up', node: expect.objectContaining({ id: 'NODE_C' }) }])

    navigation.unregisterNode('NODE_C')

    expect(navigation.nodes.NODE_A.overrides.up).toMatchObject({ id: 'NODE_B' })
    expect(navigation.nodes.NODE_B.overrideSources).toEqual([{ direction: 'up', node: expect.objectContaining({ id: 'NODE_A' }) }])
    expect(navigation.nodes.NODE_D.overrideSources).toBeUndefined()
  })

  test('unregistering the root node should leave an empty tree', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('left', { orientation: 'vertical' })
      .registerNode('right', { orientation: 'vertical' })

    navigation.unregisterNode('root')

    expect(navigation.nodes).toMatchObject({})
  })

  test('unregistering the focused node when there is nothing else that can be focused on', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('row1', { orientation: 'horizontal', parent: 'root' })
      .registerNode('item1', { isFocusable: true, parent: 'row1' })

    navigation.assignFocus('item1')

    // nothing else to focus on, but we shouldn't throw an exception
    expect(() => {
      navigation.unregisterNode('item1')
    }).not.toThrow()

    // activeChild should be cleaned along whole path
    expect(navigation.getNode('root').activeChild).toBeUndefined()
    expect(navigation.getNode('row1').activeChild).toBeUndefined()
  })

  test('unregistering the focused node when there is nothing else that can be focused on - more nesting', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('boxa', { orientation: 'horizontal', parent: 'root' })
      .registerNode('boxb', { orientation: 'horizontal', parent: 'boxa' })
      .registerNode('boxc', { orientation: 'horizontal', parent: 'boxb' })
      .registerNode('item1', { isFocusable: true, parent: 'boxc' })

    navigation.assignFocus('item1')

    // nothing else to focus on, but we shouldn't throw an exception
    expect(() => {
      navigation.unregisterNode('item1')
    }).not.toThrow()

    // activeChild should be cleaned along whole path
    expect(navigation.getNode('root').activeChild).toBeUndefined()
    expect(navigation.getNode('boxa').activeChild).toBeUndefined()
    expect(navigation.getNode('boxb').activeChild).toBeUndefined()
    expect(navigation.getNode('boxc').activeChild).toBeUndefined()
  })

  test('unregistering the focused node when there is other node to focus', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('a', { parent: 'root', orientation: 'horizontal' })
      .registerNode('aa', { parent: 'a', orientation: 'horizontal' })
      .registerNode('aaa', { parent: 'aa' })
      .registerNode('aab', { parent: 'aa', isFocusable: true })
      .registerNode('b', { parent: 'root' })
      .registerNode('c', { parent: 'root', isFocusable: true })

    navigation.assignFocus('aab')

    // there's `c` that might be focused
    expect(() => {
      navigation.unregisterNode('aab')
    }).not.toThrow()

    // expect `c` to be focused
    expect(navigation.currentFocusNode.id).toEqual('c')

    // invalid activeChild on the branch pointing to the unregistered node should be cleared,
    // where invalid activeChild is a node that doesn't lay on currentFocusNode path
    expect(navigation.getNode('root').activeChild).toEqual(expect.objectContaining({ id: 'c' }))
    expect(navigation.getNode('a').activeChild).toBeUndefined()
    expect(navigation.getNode('aa').activeChild).toBeUndefined()
  })

  test('unregistering the root node and re-registering should give a clean tree and internal state', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('node1', { orientation: 'vertical', parent: 'root' })
      .registerNode('container', { orientation: 'vertical', parent: 'node1' })
      .registerNode('item', { selectAction: {}, parent: 'container' })

    navigation.unregisterNode('root')

    navigation
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('node2', { orientation: 'vertical', parent: 'root' })
      .registerNode('container', { orientation: 'vertical', parent: 'node2' })
      .registerNode('item', { selectAction: {}, parent: 'container' })

    expect(navigation.rootNode).toBeTruthy()
    expect(navigation.rootNode.children.length).toEqual(1)
    expect(navigation.rootNode.children[0].id).toEqual('node2')
    expect(navigation.rootNode.children[0].children[0].id).toEqual('container')
    expect(navigation.rootNode.children[0].children[0].children[0].id).toEqual('item')
  })

  test('unregistering nodes that start with the same string', () => {
    const navigation = new Lrud()
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
      .registerNode('root')
      .registerNode('x')
      .registerNode('x-1', { parent: 'x', isFocusable: true })
      .registerNode('x-2', { parent: 'x', isFocusable: true })
      .registerNode('xx')
      .registerNode('xx-1', { parent: 'xx', isFocusable: true })
      .registerNode('xx-2', { parent: 'xx', isFocusable: true })

    // ensure state is correct after registration (for sanity sake...)
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

  test('unregistering a pibling of the focused node should not recalculate focus', () => {
    const navigation = new Lrud()
      .register('root', { orientation: 'horizontal' })
      .register('node1', { orientation: 'vertical', parent: 'root' })
      .register('item1', { parent: 'node1', selectAction: {} })
      .register('node2', { orientation: 'vertical', parent: 'root' })

    const onBlur = jest.fn()
    navigation.register('item2', {
      parent: 'node2',
      selectAction: {},
      onBlur
    })

    navigation.assignFocus('node2')

    expect(navigation.currentFocusNode.id).toEqual('item2')

    navigation.unregisterNode('item1')

    expect(navigation.currentFocusNode.id).toEqual('item2')
    expect(onBlur).not.toBeCalled()
  })

  test('unregistering a pibling of the focused node should not remove focus - forceRefocus false', () => {
    const navigation = new Lrud()
      .register('root', { orientation: 'horizontal' })
      .register('node1', { orientation: 'vertical', parent: 'root' })
      .register('item1', { parent: 'node1', selectAction: {} })
      .register('node2', { orientation: 'vertical', parent: 'root' })
      .register('item2', { parent: 'node2', selectAction: {} })

    navigation.assignFocus('node2')

    expect(navigation.currentFocusNode.id).toEqual('item2')

    navigation.unregisterNode('item1', { forceRefocus: false })

    expect(navigation.currentFocusNode.id).toEqual('item2')
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
    const navigation = new Lrud()
      .register('root')
      .register('node1', { isFocusable: true })
      .register('node2', { isFocusable: true })
      .register('node3', { isFocusable: true })

    navigation.assignFocus('node2')

    navigation.unregisterNode('node2', { forceRefocus: false })

    expect(navigation.currentFocusNode).toBeUndefined()
    expect(navigation.rootNode.activeChild).toBeUndefined()
  })

  test('unregistering with forceRefocus false should not do a refocus - removing parent of focused node', () => {
    const navigation = new Lrud()
      .register('root')
      .register('box1')
      .register('node1', { isFocusable: true, parent: 'box1' })
      .register('node2', { isFocusable: true, parent: 'box1' })
      .register('box2')
      .register('node4', { isFocusable: true, parent: 'box2' })
      .register('node5', { isFocusable: true, parent: 'box2' })

    navigation.assignFocus('node2')

    navigation.unregisterNode('box1', { forceRefocus: false })

    expect(navigation.currentFocusNode).toBeUndefined()
    expect(navigation.rootNode.activeChild).toBeUndefined()
  })

  test('should do nothing when unregistering not existing node', () => {
    const navigation = new Lrud()
      .register('root')
      .register('a')

    let result
    expect(() => {
      result = navigation.unregisterNode('b')
    }).not.toThrow()

    expect(result).toEqual(navigation)
  })
})
