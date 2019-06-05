/* eslint-env jest */

const { Lrud } = require('./index')

describe('handleKeyEvent()', () => {
  test('simple horizontal list - move to a sibling', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'horizontal' })
    navigation.registerNode('child_1', { parent: 'root', isFocusable: true })
    navigation.registerNode('child_2', { parent: 'root', isFocusable: true })
    navigation.registerNode('child_3', { parent: 'root', isFocusable: true })

    navigation.assignFocus('child_1')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNodeId).toEqual('child_2')
  })

  test('already focused on the last sibling, and no more branches - leave focus where it is', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'horizontal' })
    navigation.registerNode('child_1', { parent: 'root', isFocusable: true })
    navigation.registerNode('child_2', { parent: 'root', isFocusable: true })
    navigation.registerNode('child_3', { parent: 'root', isFocusable: true })

    navigation.assignFocus('child_3')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNodeId).toEqual('child_3')
  })

  test('already focused on the last sibling, but the parent wraps - focus needs to go to the first sibling', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'horizontal', isWrapping: true })
    navigation.registerNode('child_1', { parent: 'root', isFocusable: true })
    navigation.registerNode('child_2', { parent: 'root', isFocusable: true })
    navigation.registerNode('child_3', { parent: 'root', isFocusable: true })

    navigation.assignFocus('child_3')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNodeId).toEqual('child_1')
  })

  test('already focused on the first sibling, but the parent wraps - focus needs to go to the last sibling', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'horizontal', isWrapping: true })
    navigation.registerNode('child_1', { parent: 'root', isFocusable: true })
    navigation.registerNode('child_2', { parent: 'root', isFocusable: true })
    navigation.registerNode('child_3', { parent: 'root', isFocusable: true })

    navigation.assignFocus('child_1')

    navigation.handleKeyEvent({ direction: 'left' })

    expect(navigation.currentFocusNodeId).toEqual('child_3')
  })

  test('moving across a simple horizontal list twice - fire focus events', () => {
    const navigation = new Lrud()
    const spy = jest.fn()
    navigation.on('focus', spy)
    navigation.registerNode('root', { orientation: 'horizontal' })
    navigation.registerNode('child_1', { parent: 'root', isFocusable: true })
    navigation.registerNode('child_2', { parent: 'root', isFocusable: true })
    navigation.registerNode('child_3', { parent: 'root', isFocusable: true })

    navigation.assignFocus('child_1')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNodeId).toEqual('child_2')

    expect(spy).toHaveBeenCalledWith({
      parent: 'root',
      index: 1,
      id: 'child_2',
      isFocusable: true
    })

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNodeId).toEqual('child_3')

    expect(spy).toHaveBeenCalledWith({
      parent: 'root',
      id: 'child_3',
      index: 2,
      isFocusable: true
    })
  })

  test('moving across a simple horizontal list, forwards then backwards - fire focus events', () => {
    const navigation = new Lrud()
    const spy = jest.fn()
    navigation.on('focus', spy)
    navigation.registerNode('root', { orientation: 'horizontal' })
    navigation.registerNode('child_1', { parent: 'root', isFocusable: true })
    navigation.registerNode('child_2', { parent: 'root', isFocusable: true })
    navigation.registerNode('child_3', { parent: 'root', isFocusable: true })

    navigation.assignFocus('child_1')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNodeId).toEqual('child_2')

    expect(spy).toHaveBeenCalledWith({
      parent: 'root',
      id: 'child_2',
      index: 1,
      isFocusable: true
    })

    navigation.handleKeyEvent({ direction: 'left' })

    expect(navigation.currentFocusNodeId).toEqual('child_1')

    expect(spy).toHaveBeenCalledWith({
      parent: 'root',
      id: 'child_1',
      index: 0,
      isFocusable: true
    })
  })

  test('should jump between activeChild for 2 vertical panes side-by-side', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'horizontal' })
    navigation.registerNode('l', { orientation: 'vertical' })
    navigation.registerNode('l-1', { parent: 'l', isFocusable: true })
    navigation.registerNode('l-2', { parent: 'l', isFocusable: true })
    navigation.registerNode('l-3', { parent: 'l', isFocusable: true })
    navigation.registerNode('r', { orientation: 'vertical' })
    navigation.registerNode('r-1', { parent: 'r', isFocusable: true })
    navigation.registerNode('r-2', { parent: 'r', isFocusable: true })
    navigation.registerNode('r-3', { parent: 'r', isFocusable: true })

    navigation.assignFocus('l-2')

    // go down one...
    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('l-3')

    // jump across to right pane, first focusable...
    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNodeId).toEqual('r-1')

    // go down one...
    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('r-2')

    // go back left again...
    navigation.handleKeyEvent({ direction: 'left' })
    expect(navigation.currentFocusNodeId).toEqual('l-3')
  })

  test('moving between 2 vertical wrappers inside a vertical wrapper, non-index aligned [fig-3]', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'vertical' })
    navigation.registerNode('list-a', { orientation: 'vertical' })
    navigation.registerNode('list-a-box-1', { parent: 'list-a', isFocusable: true })
    navigation.registerNode('list-a-box-2', { parent: 'list-a', isFocusable: true })
    navigation.registerNode('list-a-box-3', { parent: 'list-a', isFocusable: true })

    navigation.registerNode('list-b', { orientation: 'vertical' })
    navigation.registerNode('list-b-box-1', { parent: 'list-b', isFocusable: true })
    navigation.registerNode('list-b-box-2', { parent: 'list-b', isFocusable: true })
    navigation.registerNode('list-b-box-3', { parent: 'list-b', isFocusable: true })

    navigation.assignFocus('list-a-box-1')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('list-a-box-2')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('list-a-box-3')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('list-b-box-1')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('list-b-box-2')
  })
})
