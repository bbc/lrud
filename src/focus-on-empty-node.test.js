/* eslint-env jest */

const { Lrud } = require('./index')

describe('Focusing on empty nodes', () => {
  it('when focusing on branch, should jump to first child with focusable nodes', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('branch1', { orientation: 'horizontal' })
      .registerNode('branch2', { orientation: 'horizontal' })

    navigation.register('item', { parent: 'branch2', isFocusable: true })

    navigation.assignFocus('root')

    expect(navigation.currentFocusNode.id).toEqual('item')
  })

  it('when focusing on branch, should jump to first child with focusable nodes - multiple empty preceding siblings', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('branch1', { orientation: 'horizontal' })
      .registerNode('branch2', { orientation: 'horizontal' })
      .registerNode('branch3', { orientation: 'horizontal' })
      .registerNode('branch4', { orientation: 'horizontal' })

    navigation.register('item', { parent: 'branch4', isFocusable: true })

    navigation.assignFocus('root')

    expect(navigation.currentFocusNode.id).toEqual('item')
  })

  it('find focusable node when dead branches first', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('branch1', { orientation: 'horizontal' })
      .registerNode('branch2', { orientation: 'horizontal', parent: 'branch1' })
      .registerNode('branch3', { orientation: 'horizontal', parent: 'branch2' })

    navigation.registerNode('branch4', { orientation: 'horizontal' })

    navigation.register('item', { parent: 'branch4', isFocusable: true })

    navigation.assignFocus('root')

    expect(navigation.currentFocusNode.id).toEqual('item')
  })

  it('find focusable node when multiple dead branches first', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('branch1', { orientation: 'horizontal' })
      .registerNode('branch2', { orientation: 'horizontal', parent: 'branch1' })
      .registerNode('branch3', { orientation: 'horizontal', parent: 'branch2' })
      .registerNode('branch4', { orientation: 'horizontal' })
      .registerNode('branch5', { orientation: 'horizontal', parent: 'branch4' })
      .registerNode('branch6', { orientation: 'horizontal', parent: 'branch5' })
      .registerNode('branch7', { orientation: 'horizontal' })

    navigation.register('item', { parent: 'branch7', isFocusable: true })

    navigation.assignFocus('root')

    expect(navigation.currentFocusNode.id).toEqual('item')
  })

  it('if assigning focus on a branch that has no focusable children, throw exception', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('branch1', { orientation: 'horizontal' })
      .registerNode('branch2', { orientation: 'horizontal', parent: 'branch1' })
      .registerNode('branch3', { orientation: 'horizontal', parent: 'branch2' })
      .registerNode('branch4', { orientation: 'horizontal' })
      .registerNode('branch5', { orientation: 'horizontal', parent: 'branch4' })
      .registerNode('branch6', { orientation: 'horizontal', parent: 'branch5' })

    expect(() => {
      navigation.assignFocus('root')
    }).toThrow()
  })

  it('should handle a move to an empty branch - vertical - dont change the focus', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('node1', { orientation: 'horizontal', parent: 'root' })
      .registerNode('node2', { orientation: 'horizontal', parent: 'root' })

    navigation.register('item1', { parent: 'node1', selectAction: {} })

    navigation.assignFocus('root')

    navigation.handleKeyEvent({ direction: 'down' })

    expect(navigation.currentFocusNode.id).toEqual('item1')
  })

  it('should handle a move to an empty branch - vertical - dont change the focus', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('node1', { orientation: 'horizontal', parent: 'root' })
      .registerNode('node2', { orientation: 'horizontal', parent: 'root' })

    navigation.register('item1', { parent: 'node1', selectAction: {} })

    navigation.assignFocus('item1')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNode.id).toEqual('item1')
  })

  it('should jump over empty branches when moving - vertical', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('node1', { orientation: 'horizontal', parent: 'root' })
      .registerNode('node2', { orientation: 'horizontal', parent: 'root' })
      .registerNode('node3', { orientation: 'horizontal', parent: 'root' })

    navigation
      .register('item1', { parent: 'node1', isFocusable: true })
      .register('item3', { parent: 'node3', isFocusable: true })

    navigation.assignFocus('item1')

    navigation.handleKeyEvent({ direction: 'down' })

    expect(navigation.currentFocusNode.id).toEqual('item3')
  })

  it('should jump over multiple empty branches - vertical', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('branch1', { orientation: 'horizontal' })
      .registerNode('item1', { parent: 'branch1', isFocusable: true })
      .registerNode('branch2', { orientation: 'horizontal' })
      .registerNode('branch3', { orientation: 'horizontal' })
      .registerNode('branch4', { orientation: 'horizontal' })
      .registerNode('item4', { parent: 'branch4', isFocusable: true })

    navigation.assignFocus('item1')

    navigation.handleKeyEvent({ direction: 'down' })

    expect(navigation.currentFocusNode.id).toEqual('item4')
  })

  it('should jump over multiple empty branches - horizontal', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('branch1', { orientation: 'horizontal' })
      .registerNode('item1', { parent: 'branch1', isFocusable: true })
      .registerNode('branch2', { orientation: 'horizontal' })
      .registerNode('branch3', { orientation: 'horizontal' })
      .registerNode('branch4', { orientation: 'horizontal' })
      .registerNode('item4', { parent: 'branch4', isFocusable: true })

    navigation.assignFocus('item1')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNode.id).toEqual('item4')
  })

  /**
   * @see https://github.com/bbc/lrud/issues/81
   */
  test('should jump to first focusable node in other branch', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('a', { parent: 'root', orientation: 'vertical' })
      .registerNode('aa', { parent: 'a', isFocusable: true })
      .registerNode('ab', { parent: 'a' })
      .registerNode('b', { parent: 'root', orientation: 'vertical' })
      .registerNode('ba', { parent: 'b', isFocusable: true })
      .registerNode('bb', { parent: 'b', isFocusable: true })

    navigation.assignFocus('aa')

    navigation.handleKeyEvent({ direction: 'down' })

    expect(navigation.currentFocusNode.id).toEqual('ba')
  })

  /**
   * @see https://github.com/bbc/lrud/issues/82
   */
  test('should focus node with only non focusable children', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('a', { parent: 'root', isFocusable: true })
      .registerNode('aa', { parent: 'a' })

    navigation.assignFocus('a')

    expect(navigation.currentFocusNode.id).toEqual('a')
  })

  /**
   * @see https://github.com/bbc/lrud/issues/76
   */
  test('should jump over wrong orientation to first focusable node in other branch - vertical', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('a', { parent: 'root', orientation: 'horizontal' })
      .registerNode('aa', { parent: 'a' })
      .registerNode('ab', { parent: 'a', isFocusable: true })
      .registerNode('ac', { parent: 'a' })
      .registerNode('b', { parent: 'root', isFocusable: true })

    navigation.assignFocus('b')

    navigation.handleKeyEvent({ direction: 'up' })

    expect(navigation.currentFocusNode.id).toEqual('ab')
  })

  /**
   * @see https://github.com/bbc/lrud/issues/56
   */
  test('should jump over wrong orientation to first focusable node in other branch - horizontal', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { parent: 'root', orientation: 'vertical' })
      .registerNode('aa', { parent: 'a', isFocusable: true })
      .registerNode('b', { parent: 'root', orientation: 'vertical' })
      .registerNode('ba', { parent: 'b', orientation: 'horizontal' })
      .registerNode('bb', { parent: 'b', orientation: 'horizontal' })
      .registerNode('bba', { parent: 'bb', isFocusable: true })

    navigation.assignFocus('aa')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNode.id).toEqual('bba')
  })
})
