/* eslint-env jest */
export {}
const { Lrud } = require('../src/index')

describe('overrides', () => {
  test('horizontal list with an override - override targets a leaf', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'horizontal' })
    navigation.registerNode('a', { isFocusable: true })
    navigation.registerNode('b', { isFocusable: true })
    navigation.registerNode('c', { isFocusable: true })
    navigation.registerNode('d', { isFocusable: true })
    navigation.assignFocus('c')

    navigation.registerOverride('override-id', {
      id: 'c',
      direction: 'down',
      target: 'a'
    })

    // this would normally do nothing, but our override puts it to a
    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('a')
  })

  test('override targets a branch', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'horizontal' })
    navigation.registerNode('left', { orientation: 'vertical' })
    navigation.registerNode('a', { parent: 'left', isFocusable: true })
    navigation.registerNode('right', { orientation: 'vertical' })
    navigation.registerNode('b', { parent: 'right', isFocusable: true })
    navigation.registerOverride('Z', {
      id: 'a',
      direction: 'right',
      target: 'right'
    })
    navigation.assignFocus('a')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNodeId).toEqual('b')
  })

  test('registering an override without an id should throw an exception', () => {
    const navigation = new Lrud()

    expect(() => {
      navigation.registerOverride(null, {
        id: 'a',
        direction: 'down',
        target: 'b'
      })
    }).toThrow(Error)
  })

  test('registering an override without an internal id should throw an exception', () => {
    const navigation = new Lrud()

    expect(() => {
      navigation.registerOverride('override', {
        direction: 'down',
        target: 'b'
      })
    }).toThrow(Error)
  })

  test('registering an override without an internal direction should throw an exception', () => {
    const navigation = new Lrud()

    expect(() => {
      navigation.registerOverride('override', {
        id: 'a',
        target: 'b'
      })
    }).toThrow(Error)
  })

  test('registering an override without an internal target should throw an exception', () => {
    const navigation = new Lrud()

    expect(() => {
      navigation.registerOverride('override', {
        id: 'a',
        direction: 'down'
      })
    }).toThrow(Error)
  })

  test('multiple overrides with the same id & target - use the first one that was registered', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'horizontal' })
    navigation.registerNode('a', { isFocusable: true })
    navigation.registerNode('b', { isFocusable: true })
    navigation.registerNode('c', { isFocusable: true })
    navigation.registerNode('d', { isFocusable: true })
    navigation.assignFocus('c')

    navigation.registerOverride('override-id', {
      id: 'c',
      direction: 'down',
      target: 'a'
    })

    navigation.registerOverride('override-id-2', {
      id: 'c',
      direction: 'down',
      target: 'b'
    })

    // this would normally do nothing, but our override puts it to a
    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('a')
  })

  test('multiple overrides registered with the same id - throw an exception', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'horizontal' })
    navigation.registerNode('a', { isFocusable: true })
    navigation.registerNode('b', { isFocusable: true })
    navigation.registerNode('c', { isFocusable: true })
    navigation.registerNode('d', { isFocusable: true })
    navigation.assignFocus('c')

    navigation.registerOverride('override-id', {
      id: 'c',
      direction: 'down',
      target: 'a'
    })

    expect(() => {
      navigation.registerOverride('override-id', {
        id: 'c',
        direction: 'down',
        target: 'b'
      })
    }).toThrow(Error)
  })
})
