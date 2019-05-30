/* eslint-env jest */

const { Lrud } = require('./index')

describe('handleKeyEvent() - index alignment behaviour', () => {
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

  test('moving between 2 columns (row alignment)', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'horizontal', isIndexAlign: true })
    navigation
      .registerNode('left-col', { parent: 'root', orientation: 'vertical' })
      .registerNode('a', { isFocusable: true, parent: 'left-col' })
      .registerNode('b', { isFocusable: true, parent: 'left-col' })
      .registerNode('c', { isFocusable: true, parent: 'left-col' })

    navigation
      .registerNode('right-col', { parent: 'root', orientation: 'vertical' })
      .registerNode('d', { isFocusable: true, parent: 'right-col' })
      .registerNode('e', { isFocusable: true, parent: 'right-col' })
      .registerNode('f', { isFocusable: true, parent: 'right-col' })

    navigation.assignFocus('a')

    navigation.handleKeyEvent({ direction: 'down' })

    expect(navigation.currentFocusNodeId).toEqual('b')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNodeId).toEqual('e')
  })
})

describe('handleKeyEvent() - index ranges', () => {
  test('2 rows, second row has index range [fig-5]', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'vertical', isIndexAlign: true })
    navigation.registerNode('row-a', { parent: 'root', orientation: 'horizontal' })
    navigation.registerNode('row-a-box-1', { index: 0, parent: 'row-a', isFocusable: true })
    navigation.registerNode('row-a-box-2', { index: 1, parent: 'row-a', isFocusable: true })
    navigation.registerNode('row-a-box-3', { index: 2, parent: 'row-a', isFocusable: true })
    navigation.registerNode('row-a-box-4', { index: 3, parent: 'row-a', isFocusable: true })

    navigation.registerNode('row-b', { parent: 'root', orientation: 'horizontal' })
    navigation.registerNode('row-b-box-1', { parent: 'row-b', indexRange: [0, 1], isFocusable: true })
    navigation.registerNode('row-b-box-2', { parent: 'row-b', indexRange: [2, 3], isFocusable: true })

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
    navigation.registerNode('row-b-box-1', { parent: 'row-b', indexRange: [0, 1], isFocusable: true })
    navigation.registerNode('row-b-box-2', { parent: 'row-b', indexRange: [2, 5], isFocusable: true })
    navigation.assignFocus('row-a-box-6')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('row-b-box-2')

    navigation.handleKeyEvent({ direction: 'up' })
    expect(navigation.currentFocusNodeId).toEqual('row-a-box-6')
  })

  test('2 rows, second row has index range, go from row 1 button 4 to row 2 button 2 [fig-5]', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'vertical', isIndexAlign: true })
    navigation.registerNode('row-a', { parent: 'root', orientation: 'horizontal' })
    navigation.registerNode('row-a-box-1', { index: 0, parent: 'row-a', isFocusable: true })
    navigation.registerNode('row-a-box-2', { index: 1, parent: 'row-a', isFocusable: true })
    navigation.registerNode('row-a-box-3', { index: 2, parent: 'row-a', isFocusable: true })
    navigation.registerNode('row-a-box-4', { index: 3, parent: 'row-a', isFocusable: true })

    navigation.registerNode('row-b', { parent: 'root', orientation: 'horizontal' })
    navigation.registerNode('row-b-box-1', { parent: 'row-b', indexRange: [0, 1], isFocusable: true })
    navigation.registerNode('row-b-box-2', { parent: 'row-b', indexRange: [2, 3], isFocusable: true })

    navigation.assignFocus('row-a-box-4')

    // ...down one puts us on the 2nd item of the 2nd row
    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('row-b-box-2')
  })

  test('2 rows, second row has index range, going from button 2nd button down and back again [fig-5]', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'vertical', isIndexAlign: true })
    navigation.registerNode('row-a', { parent: 'root', orientation: 'horizontal' })
    navigation.registerNode('row-a-box-1', { index: 0, parent: 'row-a', isFocusable: true })
    navigation.registerNode('row-a-box-2', { index: 1, parent: 'row-a', isFocusable: true })
    navigation.registerNode('row-a-box-3', { index: 2, parent: 'row-a', isFocusable: true })
    navigation.registerNode('row-a-box-4', { index: 3, parent: 'row-a', isFocusable: true })

    navigation.registerNode('row-b', { parent: 'root', orientation: 'horizontal' })
    navigation.registerNode('row-b-box-1', { parent: 'row-b', indexRange: [0, 1], isFocusable: true })
    navigation.registerNode('row-b-box-2', { parent: 'row-b', indexRange: [2, 3], isFocusable: true })

    navigation.assignFocus('row-a-box-2')

    // ...down one puts us on the 2nd item of the 2nd row
    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('row-b-box-1')

    // ...down one puts us on the 2nd item of the 2nd row
    navigation.handleKeyEvent({ direction: 'up' })
    expect(navigation.currentFocusNodeId).toEqual('row-a-box-2')
  })
})

describe('moving between nested grids', () => {
  test('moving right between multiple grids that are aligned, and horizontally next to each other', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'horizontal', isIndexAlign: true })

    navigation
      .registerNode('grid1', { parent: 'root', orientation: 'vertical', isIndexAlign: true })
      .registerNode('grid1_row1', { parent: 'grid1', orientation: 'horizontal' })
      .registerNode('grid1_item1', { parent: 'grid1_row1', isFocusable: true })
      .registerNode('grid1_item2', { parent: 'grid1_row1', isFocusable: true })
      .registerNode('grid1_item3', { parent: 'grid1_row1', isFocusable: true })
      .registerNode('grid1_row2', { parent: 'grid1', orientation: 'horizontal' })
      .registerNode('grid1_item4', { parent: 'grid1_row2', isFocusable: true })
      .registerNode('grid1_item5', { parent: 'grid1_row2', isFocusable: true })
      .registerNode('grid1_item6', { parent: 'grid1_row2', isFocusable: true })

    navigation
      .registerNode('grid2', { parent: 'root', orientation: 'vertical', isIndexAlign: true })
      .registerNode('grid2_row1', { parent: 'grid2', orientation: 'horizontal' })
      .registerNode('grid2_item1', { parent: 'grid2_row1', isFocusable: true })
      .registerNode('grid2_item2', { parent: 'grid2_row1', isFocusable: true })
      .registerNode('grid2_item3', { parent: 'grid2_row1', isFocusable: true })
      .registerNode('grid2_row2', { parent: 'grid2', orientation: 'horizontal' })
      .registerNode('grid2_item4', { parent: 'grid2_row2', isFocusable: true })
      .registerNode('grid2_item5', { parent: 'grid2_row2', isFocusable: true })
      .registerNode('grid2_item6', { parent: 'grid2_row2', isFocusable: true })

    navigation.assignFocus('grid1_item6')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNodeId).toEqual('grid2_item4')
  })

  test('moving left between multiple grids that are aligned, and horizontally next to each other', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', { orientation: 'horizontal', isIndexAlign: true })

    navigation
      .registerNode('grid1', { parent: 'root', orientation: 'vertical', isIndexAlign: true })
      .registerNode('grid1_row1', { parent: 'grid1', orientation: 'horizontal' })
      .registerNode('grid1_item1', { parent: 'grid1_row1', isFocusable: true })
      .registerNode('grid1_item2', { parent: 'grid1_row1', isFocusable: true })
      .registerNode('grid1_item3', { parent: 'grid1_row1', isFocusable: true })
      .registerNode('grid1_row2', { parent: 'grid1', orientation: 'horizontal' })
      .registerNode('grid1_item4', { parent: 'grid1_row2', isFocusable: true })
      .registerNode('grid1_item5', { parent: 'grid1_row2', isFocusable: true })
      .registerNode('grid1_item6', { parent: 'grid1_row2', isFocusable: true })

    navigation
      .registerNode('grid2', { parent: 'root', orientation: 'vertical', isIndexAlign: true })
      .registerNode('grid2_row1', { parent: 'grid2', orientation: 'horizontal' })
      .registerNode('grid2_item1', { parent: 'grid2_row1', isFocusable: true })
      .registerNode('grid2_item2', { parent: 'grid2_row1', isFocusable: true })
      .registerNode('grid2_item3', { parent: 'grid2_row1', isFocusable: true })
      .registerNode('grid2_row2', { parent: 'grid2', orientation: 'horizontal' })
      .registerNode('grid2_item4', { parent: 'grid2_row2', isFocusable: true })
      .registerNode('grid2_item5', { parent: 'grid2_row2', isFocusable: true })
      .registerNode('grid2_item6', { parent: 'grid2_row2', isFocusable: true })

    navigation.assignFocus('grid2_item4')

    navigation.handleKeyEvent({ direction: 'left' })

    expect(navigation.currentFocusNodeId).toEqual('grid1_item6')
  })

  test('nested grid, moving vertically down [fig-2]', () => {
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

    navigation.assignFocus('grid-a-row-2-col-2')

    navigation.handleKeyEvent({ direction: 'down' })
    expect(navigation.currentFocusNodeId).toEqual('grid-b-row-1-col-2')
  })

  test('nested grid, moving vertically up [fig-2]', () => {
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

    navigation.assignFocus('grid-b-row-1-col-2')

    navigation.handleKeyEvent({ direction: 'up' })
    expect(navigation.currentFocusNodeId).toEqual('grid-a-row-2-col-2')
  })
})
