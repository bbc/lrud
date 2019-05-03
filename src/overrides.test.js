/* eslint-env jest */

const Lrud = require('../dist/index')

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
})
