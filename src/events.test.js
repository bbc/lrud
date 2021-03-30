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

    navigation.assignFocus('a')
    navigation.assignFocus('d')

    expect(activeSpy.mock.calls).toEqual([
      // 'a' is focused, 'a' became active
      [{
        parent: 'left',
        isFocusable: true,
        id: 'a',
        index: 0
      }],
      // bubbling to parent of 'a', 'left' became active
      [{
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
      }],
      // changing focus from 'a' to 'd', 'd' became active
      [{
        parent: 'right',
        isFocusable: true,
        id: 'd',
        index: 1
      }],
      // bubbling to parent of 'd', 'right' became active
      [{
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
      }]
    ])

    expect(inactiveSpy.mock.calls).toEqual([
      // changing focus from 'a' to 'd', 'left' (parent of 'a') became inactive, because 'right' (parent of 'd') is active now
      [{
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
      }]
    ])
  })

  test('active events should be fired when recalculating focus', () => {
    const activeSpy = jest.fn()

    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'vertical' })

    navigation
      .registerNode('left')
      .registerNode('a', { parent: 'left', isFocusable: true })
      .registerNode('b', { parent: 'left', isFocusable: true })

    navigation
      .registerNode('right')
      .registerNode('c', { parent: 'right', isFocusable: true })
      .registerNode('d', { parent: 'right', isFocusable: true })

    navigation.assignFocus('b')

    navigation.on('active', activeSpy)
    navigation.unregisterNode('left')

    expect(navigation.currentFocusNodeId).toBe('c')

    // only called once, as `c` is already the activeChild of `right`
    expect(activeSpy).toHaveBeenCalledWith(expect.objectContaining({
      parent: 'root',
      id: 'right',
      index: 0
    }))
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
      direction: 'right',
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
      direction: 'left',
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

  test('node onBlur - unregistering', () => {
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

    navigation.assignFocus('a')

    navigation.unregisterNode('a')

    expect(hasRun).toEqual(true)
    expect(navigation.currentFocusNodeId).toBeUndefined()
  })

  test('node onActive - leaf, parent\'s activeChild not set', () => {
    const navigation = new Lrud()
    let activeChild = null

    navigation
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

    navigation.handleKeyEvent({ direction: 'enter' })

    expect(onSelectMock).toBeCalledTimes(1)
  })

  test('node onMove - forward', () => {
    const onMoveSpy = jest.fn()

    const navigation = new Lrud()

    navigation
      .registerNode('root', { orientation: 'horizontal', onMove: onMoveSpy })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', { isFocusable: true })
      .registerNode('c', { isFocusable: true })

    navigation.assignFocus('b')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(onMoveSpy).toHaveBeenCalledWith({
      node: expect.objectContaining({
        id: 'root',
        orientation: 'horizontal'
      }),
      leave: expect.objectContaining({
        id: 'b',
        index: 1,
        parent: 'root',
        isFocusable: true
      }),
      enter: expect.objectContaining({
        id: 'c',
        index: 2,
        parent: 'root',
        isFocusable: true
      }),
      direction: 'right',
      offset: 1
    })
  })

  test('node onMove - backward', () => {
    const onMoveSpy = jest.fn()

    const navigation = new Lrud()

    navigation
      .registerNode('root', { orientation: 'horizontal', onMove: onMoveSpy })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', { isFocusable: true })
      .registerNode('c', { isFocusable: true })

    navigation.assignFocus('b')

    navigation.handleKeyEvent({ direction: 'left' })

    expect(onMoveSpy).toHaveBeenCalledWith({
      node: expect.objectContaining({
        id: 'root',
        orientation: 'horizontal'
      }),
      leave: expect.objectContaining({
        id: 'b',
        index: 1,
        parent: 'root',
        isFocusable: true
      }),
      enter: expect.objectContaining({
        id: 'a',
        index: 0,
        parent: 'root',
        isFocusable: true
      }),
      direction: 'left',
      offset: -1
    })
  })

  test('instance emit select', () => {
    const navigation = new Lrud()
    const onSelectMock = jest.fn()

    navigation.registerNode('root')
      .registerNode('a', { isFocusable: true })

    navigation.assignFocus('a')
    navigation.on('select', onSelectMock)

    navigation.handleKeyEvent({ direction: 'enter' })

    expect(onSelectMock).toBeCalledTimes(1)
  })

  test('node onSelect & instance emit select', () => {
    const navigation = new Lrud()
    const onSelectMock = jest.fn()

    navigation.registerNode('root')
      .registerNode('a', { isFocusable: true, onSelect: onSelectMock })

    navigation.assignFocus('a')
    navigation.on('select', onSelectMock)

    navigation.handleKeyEvent({ direction: 'enter' })

    expect(onSelectMock).toBeCalledTimes(2)
  })

  test('select not fired on callback when removed', () => {
    const navigation = new Lrud()
    const onSelectMock = jest.fn()

    navigation.registerNode('root')
      .registerNode('a', { isFocusable: true })

    navigation.assignFocus('a')
    navigation.on('select', onSelectMock)

    navigation.handleKeyEvent({ direction: 'enter' })

    navigation.off('select', onSelectMock)

    navigation.handleKeyEvent({ direction: 'enter' })

    expect(onSelectMock).toBeCalledTimes(1)
  })

  test('should do nothing on enter when there\'s no currently focused node', () => {
    const navigation = new Lrud()
    const onSelectMock = jest.fn()

    navigation.registerNode('root')
      .registerNode('a', { isFocusable: true, onSelect: onSelectMock })

    const result = navigation.handleKeyEvent({ direction: 'enter' })

    expect(result).toBeUndefined()
    expect(onSelectMock).not.toBeCalled()
    expect(navigation.currentFocusNodeId).toBeUndefined()
  })
})
