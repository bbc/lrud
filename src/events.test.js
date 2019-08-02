/* eslint-env jest */

const { Lrud } = require('./index')

describe('event scenarios', () => {
  test('active events should be fired', () => {
    const activeSpy = jest.fn()

    const navigation = new Lrud()

    navigation.on('active', activeSpy)
    navigation.registerNode('root')

    navigation
      .registerNode('left')
      .registerNode('a', { parent: 'left', isFocusable: true })
      .registerNode('b', { parent: 'left', isFocusable: true })

    navigation
      .registerNode('right')
      .registerNode('c', { parent: 'right', isFocusable: true })
      .registerNode('d', { parent: 'right', isFocusable: true })

    navigation.assignFocus('b')

    // only called once, as `left` is already the activeChild of `root`
    expect(activeSpy).toHaveBeenCalledWith({
      parent: 'left',
      isFocusable: true,
      id: 'b',
      index: 1
    })
  })

  test('active & inactive events should be fired - bubbling', () => {
    const activeSpy = jest.fn()
    const inactiveSpy = jest.fn()

    const navigation = new Lrud()

    navigation.on('active', activeSpy)
    navigation.on('inactive', inactiveSpy)
    navigation.registerNode('root')

    navigation
      .registerNode('left')
      .registerNode('a', { parent: 'left', isFocusable: true })
      .registerNode('b', { parent: 'left', isFocusable: true })

    navigation
      .registerNode('right')
      .registerNode('c', { parent: 'right', isFocusable: true })
      .registerNode('d', { parent: 'right', isFocusable: true })

    navigation.assignFocus('d')

    expect(activeSpy.mock.calls).toEqual([
      [expect.objectContaining({
        parent: 'right',
        isFocusable: true,
        id: 'd',
        index: 1
      })],
      [expect.objectContaining({
        id: 'right',
        parent: 'root',
        index: 1,
        activeChild: 'd',
        children: {
          c: {
            parent: 'right',
            isFocusable: true,
            id: 'c',
            index: 0
          },
          d: {
            parent: 'right',
            isFocusable: true,
            id: 'd',
            index: 1
          }
        }
      })]
    ])

    expect(inactiveSpy.mock.calls).toEqual([
      [expect.objectContaining({
        parent: 'right',
        isFocusable: true,
        id: 'c',
        index: 0
      })],
      [expect.objectContaining({
        id: 'left',
        parent: 'root',
        index: 0,
        activeChild: 'a',
        children: {
          a: {
            parent: 'left',
            isFocusable: true,
            id: 'a',
            index: 0
          },
          b: {
            parent: 'left',
            isFocusable: true,
            id: 'b',
            index: 1
          }
        }
      })]
    ])
  })

  test('`move` should be fired once per key handle - moving right', () => {
    const moveSpy = jest.fn()

    const navigation = new Lrud()

    navigation.on('move', moveSpy)

    navigation
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', { isFocusable: true })
      .registerNode('c', { isFocusable: true })
      .registerNode('d', { isFocusable: true })

    navigation.assignFocus('a')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(moveSpy).toHaveBeenCalledWith({
      leave: {
        id: 'a',
        index: 0,
        parent: 'root',
        isFocusable: true
      },
      enter: {
        id: 'b',
        index: 1,
        parent: 'root',
        isFocusable: true
      },
      direction: 'RIGHT',
      offset: 1
    })
  })

  test('`move` should be fired once per key handle - moving left', () => {
    const moveSpy = jest.fn()

    const navigation = new Lrud()

    navigation.on('move', moveSpy)

    navigation
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', { isFocusable: true })
      .registerNode('c', { isFocusable: true })
      .registerNode('d', { isFocusable: true })

    navigation.assignFocus('b')

    navigation.handleKeyEvent({ direction: 'left' })

    expect(moveSpy).toHaveBeenCalledWith({
      leave: {
        id: 'b',
        index: 1,
        parent: 'root',
        isFocusable: true
      },
      enter: {
        id: 'a',
        index: 0,
        parent: 'root',
        isFocusable: true
      },
      direction: 'LEFT',
      offset: -1
    })
  })

  test('standard blur and focus should fire after calling assign focus', () => {
    const blurSpy = jest.fn()
    const focusSpy = jest.fn()

    const navigation = new Lrud()

    navigation.on('blur', blurSpy)
    navigation.on('focus', focusSpy)

    navigation
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', { isFocusable: true })
      .registerNode('c', { isFocusable: true })
      .registerNode('d', { isFocusable: true })

    navigation.assignFocus('a')
    expect(focusSpy).toHaveBeenCalledWith({ isFocusable: true, id: 'a', parent: 'root', index: 0 })

    navigation.assignFocus('b')
    expect(blurSpy).toHaveBeenCalledWith({ isFocusable: true, id: 'a', parent: 'root', index: 0 })
    expect(focusSpy).toHaveBeenCalledWith({ isFocusable: true, id: 'b', parent: 'root', index: 1 })
  })

  test('standard blur and focus should fire after doing a move', () => {
    const blurSpy = jest.fn()
    const focusSpy = jest.fn()

    const navigation = new Lrud()

    navigation.on('blur', blurSpy)
    navigation.on('focus', focusSpy)

    navigation
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', { isFocusable: true })
      .registerNode('c', { isFocusable: true })
      .registerNode('d', { isFocusable: true })

    navigation.assignFocus('a')
    expect(focusSpy).toHaveBeenCalledWith({ isFocusable: true, id: 'a', parent: 'root', index: 0 })

    navigation.handleKeyEvent({ direction: 'right' })

    expect(blurSpy).toHaveBeenCalledWith({ isFocusable: true, id: 'a', parent: 'root', index: 0 })
    expect(focusSpy).toHaveBeenCalledWith({ isFocusable: true, id: 'b', parent: 'root', index: 1 })
  })

  test('`onLeave` and `onEnter` functions should fire on a node', () => {
    const navigation = new Lrud()

    let hasLeft = false
    let hasEntered = false

    navigation
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
    const navigation = new Lrud()

    let hasRun = false

    navigation
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
    const navigation = new Lrud()

    let hasRun = false

    navigation
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
    expect(navigation.currentFocusNodeId).toEqual('b')
  })

  test('node onActive - leaf', () => {
    const navigation = new Lrud()
    let activeChild = null

    navigation
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
    const navigation = new Lrud()
    let inactiveChild = null

    navigation
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
    const navigation = new Lrud()
    const onSelectMock = jest.fn()

    navigation.registerNode('root')
      .registerNode('a', { isFocusable: true, onSelect: onSelectMock })

    navigation.assignFocus('a')

    navigation.handleKeyEvent({ direction: 'ENTER' })

    expect(onSelectMock.mock.calls.length).toEqual(1)
  })

  test('instance emit select', () => {
    const navigation = new Lrud()
    const onSelectMock = jest.fn()

    navigation.registerNode('root')
      .registerNode('a', { isFocusable: true })

    navigation.assignFocus('a')
    navigation.on('select', onSelectMock)

    navigation.handleKeyEvent({ direction: 'ENTER' })

    expect(onSelectMock.mock.calls.length).toEqual(1)
  })

  test('node onSelect & instance emit select', () => {
    const navigation = new Lrud()
    const onSelectMock = jest.fn()

    navigation.registerNode('root')
      .registerNode('a', { isFocusable: true, onSelect: onSelectMock })

    navigation.assignFocus('a')
    navigation.on('select', onSelectMock)

    navigation.handleKeyEvent({ direction: 'ENTER' })

    expect(onSelectMock.mock.calls.length).toEqual(2)
  })
})
