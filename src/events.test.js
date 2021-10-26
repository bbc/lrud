/* eslint-env jest */

const { Lrud } = require('./index')

describe('event scenarios', () => {
  test('active events should be fired', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('left')
      .registerNode('a', { parent: 'left', isFocusable: true })
      .registerNode('b', { parent: 'left', isFocusable: true })
      .registerNode('right')
      .registerNode('c', { parent: 'right', isFocusable: true })
      .registerNode('d', { parent: 'right', isFocusable: true })

    const activeSpy = jest.fn()
    navigation.on('active', activeSpy)

    navigation.assignFocus('b')

    expect(activeSpy).toHaveBeenCalledTimes(2)
    expect(activeSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 'b' }))
    expect(activeSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: 'left' }))
  })

  test('active & inactive events should be fired - bubbling', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('left')
      .registerNode('a', { parent: 'left', isFocusable: true })
      .registerNode('b', { parent: 'left', isFocusable: true })
      .registerNode('right')
      .registerNode('c', { parent: 'right', isFocusable: true })
      .registerNode('d', { parent: 'right', isFocusable: true })

    const activeSpy = jest.fn()
    navigation.on('active', activeSpy)

    const inactiveSpy = jest.fn()
    navigation.on('inactive', inactiveSpy)

    navigation.assignFocus('a')
    navigation.assignFocus('d')

    expect(activeSpy).toHaveBeenCalledTimes(4)
    // 'a' is focused, 'a' became active
    expect(activeSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 'a' }))
    // bubbling to parent of 'a', 'left' became active
    expect(activeSpy).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: 'left' }))
    // changing focus from 'a' to 'd', 'd' became active
    expect(activeSpy).toHaveBeenNthCalledWith(3, expect.objectContaining({ id: 'd' }))
    // bubbling to parent of 'd', 'right' became active
    expect(activeSpy).toHaveBeenNthCalledWith(4, expect.objectContaining({ id: 'right' }))

    expect(inactiveSpy).toHaveBeenCalledTimes(1)
    // changing focus from 'a' to 'd', 'left' (parent of 'a') became inactive, because 'right' (parent of 'd') is active now
    expect(inactiveSpy).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 'left' }))
  })

  test('active events should be fired when recalculating focus', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('left')
      .registerNode('a', { parent: 'left', isFocusable: true })
      .registerNode('b', { parent: 'left', isFocusable: true })
      .registerNode('right')
      .registerNode('c', { parent: 'right', isFocusable: true })
      .registerNode('d', { parent: 'right', isFocusable: true })

    navigation.assignFocus('b')

    const activeSpy = jest.fn()
    navigation.on('active', activeSpy)
    navigation.unregisterNode('left')

    expect(navigation.currentFocusNode.id).toEqual('c')

    // only called once, as `c` is already the activeChild of `right`
    expect(activeSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'right' }))
  })

  test('`move` should be fired once per key handle - moving right', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', { isFocusable: true })
      .registerNode('c', { isFocusable: true })
      .registerNode('d', { isFocusable: true })

    navigation.assignFocus('a')

    const moveSpy = jest.fn()
    navigation.on('move', moveSpy)

    navigation.handleKeyEvent({ direction: 'right' })

    expect(moveSpy).toHaveBeenCalledWith({
      leave: expect.objectContaining({ id: 'a' }),
      enter: expect.objectContaining({ id: 'b' }),
      direction: 'right',
      offset: 1
    })
  })

  test('`move` should be fired once per key handle - moving left', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', { isFocusable: true })
      .registerNode('c', { isFocusable: true })
      .registerNode('d', { isFocusable: true })

    navigation.assignFocus('b')

    const moveSpy = jest.fn()
    navigation.on('move', moveSpy)

    navigation.handleKeyEvent({ direction: 'left' })

    expect(moveSpy).toHaveBeenCalledWith({
      leave: expect.objectContaining({ id: 'b' }),
      enter: expect.objectContaining({ id: 'a' }),
      direction: 'left',
      offset: -1
    })
  })

  test('standard blur and focus should fire after calling assign focus', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', { isFocusable: true })
      .registerNode('c', { isFocusable: true })
      .registerNode('d', { isFocusable: true })

    const blurSpy = jest.fn()
    navigation.on('blur', blurSpy)

    const focusSpy = jest.fn()
    navigation.on('focus', focusSpy)

    navigation.assignFocus('a')
    expect(focusSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }))

    navigation.assignFocus('b')
    expect(blurSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }))
    expect(focusSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }))
  })

  test('standard blur and focus should fire after doing a move', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', { isFocusable: true })
      .registerNode('c', { isFocusable: true })
      .registerNode('d', { isFocusable: true })

    const blurSpy = jest.fn()
    navigation.on('blur', blurSpy)

    const focusSpy = jest.fn()
    navigation.on('focus', focusSpy)

    navigation.assignFocus('a')
    expect(focusSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }))

    navigation.handleKeyEvent({ direction: 'right' })

    expect(blurSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }))
    expect(focusSpy).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }))
  })

  test('`onLeave` and `onEnter` functions should fire on a node', () => {
    let hasLeft = false
    let hasEntered = false

    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', {
        isFocusable: true,
        onLeave: () => {
          hasLeft = true
        }
      })
      .registerNode('b', {
        isFocusable: true,
        onEnter: () => {
          hasEntered = true
        }
      })

    navigation.assignFocus('a')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(hasLeft).toEqual(true)
    expect(hasEntered).toEqual(true)
  })

  test('node onFocus', () => {
    let hasRun = false

    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', {
        isFocusable: true,
        onFocus: () => {
          hasRun = true
        }
      })

    navigation.assignFocus('a')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(hasRun).toEqual(true)
  })

  test('node onBlur', () => {
    let hasRun = false

    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', {
        isFocusable: true,
        onBlur: () => {
          hasRun = true
        }
      })
      .registerNode('b', {
        isFocusable: true
      })

    navigation.assignFocus('a')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(hasRun).toEqual(true)
    expect(navigation.currentFocusNode.id).toEqual('b')
  })

  test('node onBlur - unregistering', () => {
    let hasRun = false

    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', {
        isFocusable: true,
        onBlur: () => {
          hasRun = true
        }
      })

    navigation.assignFocus('a')

    navigation.unregisterNode('a')

    expect(hasRun).toEqual(true)
    expect(navigation.currentFocusNode).toBeUndefined()
  })

  test('node onActive - leaf, parent\'s activeChild not set', () => {
    let activeChild = null

    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('row-a', { orientation: 'vertical' })
      .registerNode('A', { isFocusable: true, parent: 'row-a' })
      .registerNode('row-b', { orientation: 'vertical' })
      .registerNode('B', { isFocusable: false, parent: 'row-b' })
      .registerNode('C', { isFocusable: true, parent: 'row-b', onActive: () => { activeChild = 'C' } })

    navigation.assignFocus('A')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(activeChild).toEqual('C')
  })

  test('node onActive - leaf, changing current parent\'s activeChild', () => {
    let activeChild = null

    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('row-a', { orientation: 'vertical' })
      .registerNode('A', { isFocusable: true, parent: 'row-a' })
      .registerNode('row-b', { orientation: 'vertical' })
      .registerNode('B', { isFocusable: true, parent: 'row-b' })
      .registerNode('C', { isFocusable: true, parent: 'row-b', onActive: () => { activeChild = 'C' } })

    navigation.assignFocus('A')

    navigation.handleKeyEvent({ direction: 'right' })
    navigation.handleKeyEvent({ direction: 'down' })

    expect(activeChild).toEqual('C')
  })

  test('node onInActive - branch', () => {
    let inactiveChild = null

    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('row-a', { orientation: 'vertical', onInactive: () => { inactiveChild = 'row-a' } })
      .registerNode('A', { isFocusable: true, parent: 'row-a' })
      .registerNode('row-b', { orientation: 'vertical' })
      .registerNode('B', { isFocusable: true, parent: 'row-b' })
      .registerNode('C', { isFocusable: true, parent: 'row-b' })

    navigation.assignFocus('A')

    navigation.handleKeyEvent({ direction: 'right' })
    navigation.handleKeyEvent({ direction: 'down' })

    expect(inactiveChild).toEqual('row-a')
  })

  test('node onSelect', () => {
    const onSelectMock = jest.fn()

    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a', { isFocusable: true, onSelect: onSelectMock })

    navigation.assignFocus('a')

    navigation.handleKeyEvent({ direction: 'enter' })

    expect(onSelectMock).toBeCalledTimes(1)
  })

  test('node onMove - forward', () => {
    const onMoveSpy = jest.fn()

    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal', onMove: onMoveSpy })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', { isFocusable: true })
      .registerNode('c', { isFocusable: true })

    navigation.assignFocus('b')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(onMoveSpy).toHaveBeenCalledWith({
      node: expect.objectContaining({ id: 'root' }),
      leave: expect.objectContaining({ id: 'b' }),
      enter: expect.objectContaining({ id: 'c' }),
      direction: 'right',
      offset: 1
    })
  })

  test('node onMove - backward', () => {
    const onMoveSpy = jest.fn()

    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal', onMove: onMoveSpy })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', { isFocusable: true })
      .registerNode('c', { isFocusable: true })

    navigation.assignFocus('b')

    navigation.handleKeyEvent({ direction: 'left' })

    expect(onMoveSpy).toHaveBeenCalledWith({
      node: expect.objectContaining({ id: 'root' }),
      leave: expect.objectContaining({ id: 'b' }),
      enter: expect.objectContaining({ id: 'a' }),
      direction: 'left',
      offset: -1
    })
  })

  test('instance emit select', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a', { isFocusable: true })

    navigation.assignFocus('a')

    const onSelectMock = jest.fn()
    navigation.on('select', onSelectMock)

    navigation.handleKeyEvent({ direction: 'enter' })

    expect(onSelectMock).toBeCalledTimes(1)
  })

  test('node onSelect & instance emit select', () => {
    const onSelectMock = jest.fn()

    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a', { isFocusable: true, onSelect: onSelectMock })

    navigation.assignFocus('a')
    navigation.on('select', onSelectMock)

    navigation.handleKeyEvent({ direction: 'enter' })

    expect(onSelectMock).toBeCalledTimes(2)
  })

  test('select not fired on callback when removed', () => {
    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a', { isFocusable: true })

    navigation.assignFocus('a')

    const onSelectMock = jest.fn()
    navigation.on('select', onSelectMock)

    navigation.handleKeyEvent({ direction: 'enter' })

    navigation.off('select', onSelectMock)

    navigation.handleKeyEvent({ direction: 'enter' })

    expect(onSelectMock).toBeCalledTimes(1)
  })

  test('should do nothing on enter when there\'s no currently focused node', () => {
    const onSelectMock = jest.fn()

    const navigation = new Lrud()
      .registerNode('root')
      .registerNode('a', { isFocusable: true, onSelect: onSelectMock })

    const result = navigation.handleKeyEvent({ direction: 'enter' })

    expect(result).toBeUndefined()
    expect(onSelectMock).not.toBeCalled()
    expect(navigation.currentFocusNode).toBeUndefined()
  })
})
