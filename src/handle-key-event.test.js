/* eslint-env jest */

const { Lrud } = require('./index')

describe('handleKeyEvent()', () => {
  test('simple horizontal list - move to a sibling', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('child_1', { parent: 'root', isFocusable: true })
      .registerNode('child_2', { parent: 'root', isFocusable: true })
      .registerNode('child_3', { parent: 'root', isFocusable: true })

    navigation.assignFocus('child_1')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNode.id).toEqual('child_2')
  })

  test('already focused on the last sibling, and no more branches - leave focus where it is', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('child_1', { parent: 'root', isFocusable: true })
      .registerNode('child_2', { parent: 'root', isFocusable: true })
      .registerNode('child_3', { parent: 'root', isFocusable: true })

    navigation.assignFocus('child_3')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNode.id).toEqual('child_3')
  })

  test('already focused on the last sibling, but the parent wraps - focus needs to go to the first sibling', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal', isWrapping: true })
      .registerNode('child_1', { parent: 'root', isFocusable: true })
      .registerNode('child_2', { parent: 'root', isFocusable: true })
      .registerNode('child_3', { parent: 'root', isFocusable: true })

    navigation.assignFocus('child_3')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNode.id).toEqual('child_1')
  })

  test('already focused on the first sibling, but the parent wraps - focus needs to go to the last sibling', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal', isWrapping: true })
      .registerNode('child_1', { parent: 'root', isFocusable: true })
      .registerNode('child_2', { parent: 'root', isFocusable: true })
      .registerNode('child_3', { parent: 'root', isFocusable: true })

    navigation.assignFocus('child_1')

    navigation.handleKeyEvent({ direction: 'left' })

    expect(navigation.currentFocusNode.id).toEqual('child_3')
  })

  test('moving across a simple horizontal list twice - fire focus events', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('child_1', { parent: 'root', isFocusable: true })
      .registerNode('child_2', { parent: 'root', isFocusable: true })
      .registerNode('child_3', { parent: 'root', isFocusable: true })

    const spy = jest.fn()
    navigation.on('focus', spy)

    navigation.assignFocus('child_1')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNode.id).toEqual('child_2')
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'child_2' }))

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNode.id).toEqual('child_3')
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'child_3' }))
  })

  test('moving across a simple horizontal list, forwards then backwards - fire focus events', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('child_1', { parent: 'root', isFocusable: true })
      .registerNode('child_2', { parent: 'root', isFocusable: true })
      .registerNode('child_3', { parent: 'root', isFocusable: true })

    const spy = jest.fn()
    navigation.on('focus', spy)

    navigation.assignFocus('child_1')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNode.id).toEqual('child_2')
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'child_2' }))

    navigation.handleKeyEvent({ direction: 'left' })

    expect(navigation.currentFocusNode.id).toEqual('child_1')
    expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'child_1' }))
  })

  test('should jump between activeChild for 2 vertical panes side-by-side', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('l', { orientation: 'vertical' })
      .registerNode('l-1', { parent: 'l', isFocusable: true })
      .registerNode('l-2', { parent: 'l', isFocusable: true })
      .registerNode('l-3', { parent: 'l', isFocusable: true })
      .registerNode('r', { orientation: 'vertical' })
      .registerNode('r-1', { parent: 'r', isFocusable: true })
      .registerNode('r-2', { parent: 'r', isFocusable: true })
      .registerNode('r-3', { parent: 'r', isFocusable: true })

    navigation.assignFocus('l-2')

    // go down one...
    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNode.id).toEqual('l-3')

    // jump across to right pane, first focusable...
    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNode.id).toEqual('r-1')

    // go down one...
    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNode.id).toEqual('r-2')

    // go back left again...
    navigation.handleKeyEvent({ direction: 'left' })
    expect(navigation.currentFocusNode.id).toEqual('l-3')
  })

  test('moving between 2 vertical wrappers inside a vertical wrapper, non-index aligned [fig-3]', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('list-a', { orientation: 'vertical' })
      .registerNode('list-a-box-1', { parent: 'list-a', isFocusable: true })
      .registerNode('list-a-box-2', { parent: 'list-a', isFocusable: true })
      .registerNode('list-a-box-3', { parent: 'list-a', isFocusable: true })
      .registerNode('list-b', { orientation: 'vertical' })
      .registerNode('list-b-box-1', { parent: 'list-b', isFocusable: true })
      .registerNode('list-b-box-2', { parent: 'list-b', isFocusable: true })
      .registerNode('list-b-box-3', { parent: 'list-b', isFocusable: true })

    navigation.assignFocus('list-a-box-1')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNode.id).toEqual('list-a-box-2')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNode.id).toEqual('list-a-box-3')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNode.id).toEqual('list-b-box-1')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNode.id).toEqual('list-b-box-2')
  })

  test('no focused node, should not fail and do nothing', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a', { orientation: 'vertical' })
      .registerNode('aa', { parent: 'a' })
      .registerNode('ab', { parent: 'a', isFocusable: true })
      .registerNode('ac', { parent: 'a' })

    expect(() => {
      navigation.handleKeyEvent({ direction: 'down' })
    }).not.toThrow()
    expect(navigation.currentFocusNode).toBeUndefined()
  })

  test('no focused node, should not fail and force focusing first focusable node', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a', { orientation: 'vertical' })
      .registerNode('aa', { parent: 'a' })
      .registerNode('ab', { parent: 'a', isFocusable: true })
      .registerNode('ac', { parent: 'a' })
      .registerNode('b', { isFocusable: true })

    expect(() => {
      navigation.handleKeyEvent({ direction: 'down' }, { forceFocus: true })
    }).not.toThrow()
    expect(navigation.currentFocusNode.id).toEqual('ab')
  })

  test('should not fail when forcing focus, but there\'s no node to be focused', () => {
    const navigation = new Lrud()
      .registerNode('root')

    let focusedNode
    expect(() => {
      focusedNode = navigation.handleKeyEvent({ direction: 'down' }, { forceFocus: true })
    }).not.toThrow()
    expect(focusedNode).toBeUndefined()
  })

  test('should detect direction basing on key event', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { parent: 'root', isFocusable: true })
      .registerNode('b', { parent: 'root', isFocusable: true })

    navigation.assignFocus('a')

    const result = navigation.handleKeyEvent({ keyCode: 5 })

    expect(result.id).toEqual('b')
  })

  test('should do nothing when direction can not be determined', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { parent: 'root', isFocusable: true })
      .registerNode('b', { parent: 'root', isFocusable: true })

    navigation.assignFocus('a')

    const result = navigation.handleKeyEvent({})

    expect(result).toBeUndefined()
    expect(navigation.currentFocusNode.id).toEqual('a')
  })

  test('should do nothing when key event is not defined', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { parent: 'root', isFocusable: true })
      .registerNode('b', { parent: 'root', isFocusable: true })

    navigation.assignFocus('a')

    const result = navigation.handleKeyEvent(undefined)

    expect(result).toBeUndefined()
    expect(navigation.currentFocusNode.id).toEqual('a')
  })

  /*
   * This is very useful feature, it allows to define closed boxes from which focus can not jump out.
   * For example modal popups, that transparently overlays main page and has Ok/Cancel buttons. Focus should stay
   * withing this popup, but the rest of the LRUD tree may stay untouched.
   */
  test('should do nothing when parent orientation is not defined', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: undefined })
      .registerNode('a', { parent: 'root', isFocusable: true })
      .registerNode('b', { parent: 'root', isFocusable: true })
      .registerNode('c', { parent: 'root', isFocusable: true })

    navigation.assignFocus('b')

    expect(navigation.handleKeyEvent({ direction: 'down' })).toBeUndefined()
    expect(navigation.currentFocusNode.id).toEqual('b')

    expect(navigation.handleKeyEvent({ direction: 'up' })).toBeUndefined()
    expect(navigation.currentFocusNode.id).toEqual('b')

    expect(navigation.handleKeyEvent({ direction: 'left' })).toBeUndefined()
    expect(navigation.currentFocusNode.id).toEqual('b')

    expect(navigation.handleKeyEvent({ direction: 'right' })).toBeUndefined()
    expect(navigation.currentFocusNode.id).toEqual('b')

    expect(navigation.handleKeyEvent({ direction: '*' })).toBeUndefined()
    expect(navigation.currentFocusNode.id).toEqual('b')
  })
})
