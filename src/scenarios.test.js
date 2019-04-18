/* eslint-env jest */

const Lrud = require('./index')

describe('test scenarios', () => {
  test('assigning focus to a branch should actually assign focus to the first active child', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { isVerticalIndexAlign: true })
    navigation
      .registerNode('row-1', { orientation: 'horizontal' })
      .registerNode('A', { parent: 'row-1', isFocusable: true })
      .registerNode('B', { parent: 'row-1', isFocusable: true })
      .registerNode('C', { parent: 'row-1', isFocusable: true })
      .registerNode('D', { parent: 'row-1', isFocusable: true })

    navigation.assignFocus('root')
    expect(navigation.currentFocusNodeId).toEqual('A')
  })

  test('navigating around a (mini) keyboard', () => {
    const navigation = new Lrud()

    navigation.registerNode('keyboard', { orientation: 'vertical', isVerticalIndexAlign: true })
    navigation
      .registerNode('row-1', { orientation: 'horizontal' })
      .registerNode('A', { parent: 'row-1', isFocusable: true })
      .registerNode('B', { parent: 'row-1', isFocusable: true })
      .registerNode('C', { parent: 'row-1', isFocusable: true })
      .registerNode('D', { parent: 'row-1', isFocusable: true })
    navigation
      .registerNode('row-2', { orientation: 'horizontal' })
      .registerNode('E', { parent: 'row-2', isFocusable: true })
      .registerNode('F', { parent: 'row-2', isFocusable: true })
      .registerNode('G', { parent: 'row-2', isFocusable: true })
      .registerNode('H', { parent: 'row-2', isFocusable: true })
    navigation
      .registerNode('row-3', { orientation: 'horizontal' })
      .registerNode('I', { parent: 'row-3', isFocusable: true })
      .registerNode('J', { parent: 'row-3', isFocusable: true })
      .registerNode('K', { parent: 'row-3', isFocusable: true })
      .registerNode('L', { parent: 'row-3', isFocusable: true })

    navigation.assignFocus('keyboard')
    expect(navigation.currentFocusNodeId).toEqual('A')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNodeId).toEqual('B')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('F')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNodeId).toEqual('G')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('K')
  })

  test('setting up a keyboard and forgetting to set the keyboard itself as vertical', () => {
    const navigation = new Lrud()

    navigation.registerNode('keyboard', { isVerticalIndexAlign: true })
    navigation
      .registerNode('row-1', { orientation: 'horizontal' })
      .registerNode('A', { parent: 'row-1', isFocusable: true })
      .registerNode('B', { parent: 'row-1', isFocusable: true })
      .registerNode('C', { parent: 'row-1', isFocusable: true })
    navigation
      .registerNode('row-2', { orientation: 'horizontal' })
      .registerNode('D', { parent: 'row-2', isFocusable: true })
      .registerNode('E', { parent: 'row-2', isFocusable: true })
      .registerNode('F', { parent: 'row-2', isFocusable: true })

    navigation.assignFocus('keyboard')
    expect(navigation.currentFocusNodeId).toEqual('A')

    // nothing to bubble to, so should still be on A
    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('A')
  })

  test('keyboard with space and delete', () => {

  })
})
