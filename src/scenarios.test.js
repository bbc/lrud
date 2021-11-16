/* eslint-env jest */

const { Lrud } = require('./index')

describe('test scenarios', () => {
  test('assigning focus to a branch should actually assign focus to the first active child', () => {
    const navigation = new Lrud()
      .registerNode('root', { isIndexAlign: true })
      .registerNode('row-1', { orientation: 'horizontal' })
      .registerNode('A', { parent: 'row-1', isFocusable: true })
      .registerNode('B', { parent: 'row-1', isFocusable: true })
      .registerNode('C', { parent: 'row-1', isFocusable: true })
      .registerNode('D', { parent: 'row-1', isFocusable: true })

    navigation.assignFocus('root')
    expect(navigation.currentFocusNode.id).toEqual('A')
  })

  test('navigating around a (mini) keyboard', () => {
    const navigation = new Lrud()
      .registerNode('keyboard', { orientation: 'vertical', isIndexAlign: true })
      .registerNode('row-1', { orientation: 'horizontal' })
      .registerNode('A', { parent: 'row-1', isFocusable: true })
      .registerNode('B', { parent: 'row-1', isFocusable: true })
      .registerNode('C', { parent: 'row-1', isFocusable: true })
      .registerNode('D', { parent: 'row-1', isFocusable: true })
      .registerNode('row-2', { orientation: 'horizontal' })
      .registerNode('E', { parent: 'row-2', isFocusable: true })
      .registerNode('F', { parent: 'row-2', isFocusable: true })
      .registerNode('G', { parent: 'row-2', isFocusable: true })
      .registerNode('H', { parent: 'row-2', isFocusable: true })
      .registerNode('row-3', { orientation: 'horizontal' })
      .registerNode('I', { parent: 'row-3', isFocusable: true })
      .registerNode('J', { parent: 'row-3', isFocusable: true })
      .registerNode('K', { parent: 'row-3', isFocusable: true })
      .registerNode('L', { parent: 'row-3', isFocusable: true })

    navigation.assignFocus('keyboard')
    expect(navigation.currentFocusNode.id).toEqual('A')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNode.id).toEqual('B')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNode.id).toEqual('F')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNode.id).toEqual('G')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNode.id).toEqual('K')
  })

  test('setting up a keyboard and forgetting to set the keyboard itself as vertical', () => {
    const navigation = new Lrud()
      .registerNode('keyboard', { isIndexAlign: true })
      .registerNode('row-1', { orientation: 'horizontal' })
      .registerNode('A', { parent: 'row-1', isFocusable: true })
      .registerNode('B', { parent: 'row-1', isFocusable: true })
      .registerNode('C', { parent: 'row-1', isFocusable: true })
      .registerNode('row-2', { orientation: 'horizontal' })
      .registerNode('D', { parent: 'row-2', isFocusable: true })
      .registerNode('E', { parent: 'row-2', isFocusable: true })
      .registerNode('F', { parent: 'row-2', isFocusable: true })

    navigation.assignFocus('keyboard')
    expect(navigation.currentFocusNode.id).toEqual('A')

    // nothing to bubble to, so should still be on A
    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNode.id).toEqual('A')
  })

  test('keyboard with space and delete', () => {
    const navigation = new Lrud()
      .registerNode('keyboard', { orientation: 'vertical', isIndexAlign: true })
      .registerNode('row-1', { orientation: 'horizontal' })
      .registerNode('A', { parent: 'row-1', isFocusable: true })
      .registerNode('B', { parent: 'row-1', isFocusable: true })
      .registerNode('C', { parent: 'row-1', isFocusable: true })
      .registerNode('D', { parent: 'row-1', isFocusable: true })
      .registerNode('E', { parent: 'row-1', isFocusable: true })
      .registerNode('F', { parent: 'row-1', isFocusable: true })
      .registerNode('row-2', { orientation: 'horizontal' })
      .registerNode('G', { parent: 'row-2', isFocusable: true })
      .registerNode('H', { parent: 'row-2', isFocusable: true })
      .registerNode('I', { parent: 'row-2', isFocusable: true })
      .registerNode('J', { parent: 'row-2', isFocusable: true })
      .registerNode('K', { parent: 'row-2', isFocusable: true })
      .registerNode('L', { parent: 'row-2', isFocusable: true })
      .registerNode('row-3', { orientation: 'horizontal' })
      .registerNode('Space', { parent: 'row-3', indexRange: [0, 2], isFocusable: true })
      .registerNode('Delete', { parent: 'row-3', indexRange: [3, 5], isFocusable: true })

    navigation.assignFocus('keyboard')
    expect(navigation.currentFocusNode.id).toEqual('A')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNode.id).toEqual('B')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNode.id).toEqual('H')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNode.id).toEqual('Space')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNode.id).toEqual('Delete')

    navigation.handleKeyEvent({ direction: 'up' })
    expect(navigation.currentFocusNode.id).toEqual('J')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNode.id).toEqual('K')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNode.id).toEqual('Delete')

    // the active child of row-2 is `K`, AND `K` is inside the indexRange we're leaving
    // there we should end up back at `K`
    navigation.handleKeyEvent({ direction: 'up' })
    expect(navigation.currentFocusNode.id).toEqual('K')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNode.id).toEqual('Delete')

    navigation.handleKeyEvent({ direction: 'left' })
    expect(navigation.currentFocusNode.id).toEqual('Space')

    // the activeChild of row-2 is still `K`, and that index is outside of our indexRange we're
    // leaving - therefore, we go to the first value of the index range, which in this case
    // is `G`
    navigation.handleKeyEvent({ direction: 'up' })
    expect(navigation.currentFocusNode.id).toEqual('G')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNode.id).toEqual('H')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNode.id).toEqual('I')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNode.id).toEqual('Space')

    navigation.handleKeyEvent({ direction: 'up' })
    expect(navigation.currentFocusNode.id).toEqual('I')
  })
})
