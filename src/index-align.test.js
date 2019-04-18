/* eslint-env jest */

const Lrud = require('./index')

describe('handleKeyEvent() - column alignment behaviour', () => {
  test('moving between two rows should keep column alignment [fig-1]', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'vertical', isIndexAlign: true })
    navigation.registerNode('row-1', { orientation: 'horizontal' })
    navigation.registerNode('row-1-col-1', { parent: 'row-1', isFocusable: true })
    navigation.registerNode('row-1-col-2', { parent: 'row-1', isFocusable: true })
    navigation.registerNode('row-2', { orientation: 'horizontal' })
    navigation.registerNode('row-2-col-1', { parent: 'row-2', isFocusable: true })
    navigation.registerNode('row-2-col-2', { parent: 'row-2', isFocusable: true })
    navigation.assignFocus('row-1-col-2')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('row-2-col-2')
  })

  test('moving between 2 vertical wrappers inside a vertical wrapper [fig-3]', () => {
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

  test('column alignment between 2 higher level grid wrappers [fig-2]', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'vertical', isIndexAlign: true })

    // grid a
    navigation
      .registerNode('grid-a', { parent: 'root', orientation: 'vertical', isIndexAlign: true })
      .registerNode('grid-a-row-1', { parent: 'grid-a', orientation: 'horizontal' })
      .registerNode('grid-a-row-1-col-1', { parent: 'grid-a-row-1', isFocusable: true })
      .registerNode('grid-a-row-1-col-2', { parent: 'grid-a-row-1', isFocusable: true })
      .registerNode('grid-a-row-2', { parent: 'grid-a', orientation: 'horizontal' })
      .registerNode('grid-a-row-2-col-1', { parent: 'grid-a-row-2', isFocusable: true })
      .registerNode('grid-a-row-2-col-2', { parent: 'grid-a-row-2', isFocusable: true })

    // grid-b
    navigation
      .registerNode('grid-b', { parent: 'root', orientation: 'vertical', isIndexAlign: true })
      .registerNode('grid-b-row-1', { parent: 'grid-b', orientation: 'horizontal' })
      .registerNode('grid-b-row-1-col-1', { parent: 'grid-b-row-1', isFocusable: true })
      .registerNode('grid-b-row-1-col-2', { parent: 'grid-b-row-1', isFocusable: true })
      .registerNode('grid-b-row-2', { parent: 'grid-b', orientation: 'horizontal' })
      .registerNode('grid-b-row-2-col-1', { parent: 'grid-b-row-2', isFocusable: true })
      .registerNode('grid-b-row-2-col-2', { parent: 'grid-b-row-2', isFocusable: true })

    navigation.assignFocus('grid-a-row-1-col-1')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNodeId).toEqual('grid-a-row-1-col-2')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('grid-a-row-2-col-2')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('grid-b-row-1-col-2')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('grid-b-row-2-col-2')
  })

  test('with vertical index alignment', () => {

  })
})

describe('handleKeyEvent() - index ranges', () => {
  test('2 rows, second row has index range [fig-5]', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'vertical', isIndexAlign: true })
    navigation.registerNode('row-a', { parent: 'root', orientation: 'horizontal' })
    navigation.registerNode('row-a-box-1', { index: 1, parent: 'row-a', isFocusable: true })
    navigation.registerNode('row-a-box-2', { index: 2, parent: 'row-a', isFocusable: true })
    navigation.registerNode('row-a-box-3', { index: 3, parent: 'row-a', isFocusable: true })
    navigation.registerNode('row-a-box-4', { index: 4, parent: 'row-a', isFocusable: true })

    navigation.registerNode('row-b', { parent: 'root', orientation: 'horizontal' })
    navigation.registerNode('row-b-box-1', { parent: 'row-b', indexRange: [1, 2], isFocusable: true })
    navigation.registerNode('row-b-box-2', { parent: 'row-b', indexRange: [3, 4], isFocusable: true })

    navigation.assignFocus('row-a-box-2')

    // so we go down from the 2nd to land on the 1st of the 2nd row...
    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('row-b-box-1')

    // ...should go back up to 2nd item, as thats the active child and in the index range
    navigation.handleKeyEvent({ direction: 'up' })
    expect(navigation.currentFocusNodeId).toEqual('row-a-box-2')

    // ...3 rights put us at the last item of row 1
    navigation.handleKeyEvent({ direction: 'right' })
    navigation.handleKeyEvent({ direction: 'right' })
    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNodeId).toEqual('row-a-box-4')

    // ...down one puts us on the 2nd item of the 2nd row
    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('row-b-box-2')

    // ...and an up puts us on the 4th item (as thats the activeChild) of the 1st row
    navigation.handleKeyEvent({ direction: 'up' })
    expect(navigation.currentFocusNodeId).toEqual('row-a-box-4')
  })

  test('1 row of 6, 2nd row has uneven index ranges [fig-6]', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'vertical', isIndexAlign: true })
    navigation.registerNode('row-a', { parent: 'root', orientation: 'horizontal' })
    navigation.registerNode('row-a-box-1', { parent: 'row-a', isFocusable: true })
    navigation.registerNode('row-a-box-2', { parent: 'row-a', isFocusable: true })
    navigation.registerNode('row-a-box-3', { parent: 'row-a', isFocusable: true })
    navigation.registerNode('row-a-box-4', { parent: 'row-a', isFocusable: true })
    navigation.registerNode('row-a-box-5', { parent: 'row-a', isFocusable: true })
    navigation.registerNode('row-a-box-6', { parent: 'row-a', isFocusable: true })
    navigation.registerNode('row-b', { parent: 'root', orientation: 'horizontal' })
    navigation.registerNode('row-b-box-1', { parent: 'row-b', indexRange: [1, 2], isFocusable: true })
    navigation.registerNode('row-b-box-2', { parent: 'row-b', indexRange: [3, 6], isFocusable: true })
    navigation.assignFocus('row-a-box-6')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('row-b-box-2')

    navigation.handleKeyEvent({ direction: 'up' })
    expect(navigation.currentFocusNodeId).toEqual('row-a-box-6')
  })
})
