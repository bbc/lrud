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
      index: 2
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
        index: 2
      })],
      [expect.objectContaining({
        id: 'right',
        parent: 'root',
        index: 2,
        activeChild: 'd',
        children: {
          c: {
            parent: 'right',
            isFocusable: true,
            id: 'c',
            index: 1
          },
          d: {
            parent: 'right',
            isFocusable: true,
            id: 'd',
            index: 2
          }
        }
      })]
    ])

    expect(inactiveSpy.mock.calls).toEqual([
      [expect.objectContaining({
        parent: 'right',
        isFocusable: true,
        id: 'c',
        index: 1
      })],
      [expect.objectContaining({
        id: 'left',
        parent: 'root',
        index: 1,
        activeChild: 'a',
        children: {
          a: {
            parent: 'left',
            isFocusable: true,
            id: 'a',
            index: 1
          },
          b: {
            parent: 'left',
            isFocusable: true,
            id: 'b',
            index: 2
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
        index: 1,
        parent: 'root',
        isFocusable: true
      },
      enter: {
        id: 'b',
        index: 2,
        parent: 'root',
        isFocusable: true
      },
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
        index: 2,
        parent: 'root',
        isFocusable: true
      },
      enter: {
        id: 'a',
        index: 1,
        parent: 'root',
        isFocusable: true
      },
      offset: -1
    })
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
})
