/* eslint-env jest */

const { Lrud } = require('./index')

describe('onActiveChildChange() tests', () => {
  test('horizontal list, active changes are on leafs', () => {
    const navigation = new Lrud()

    let moveObject
    const onActiveChildChange = (changeData) => {
      moveObject = changeData
    }

    navigation.registerNode('root', { orientation: 'horizontal', onActiveChildChange })
    navigation.registerNode('a', { isFocusable: true })
    navigation.registerNode('b', { isFocusable: true })
    navigation.registerNode('c', { isFocusable: true })
    navigation.registerNode('d', { isFocusable: true })
    navigation.assignFocus('b')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNodeId).toEqual('c')

    expect(moveObject.node.id).toEqual('root')
    expect(moveObject.leave.id).toEqual('b')
    expect(moveObject.enter.id).toEqual('c')
  })

  test('nested changes', () => {
    const navigation = new Lrud()

    const spy = jest.fn()

    navigation.registerNode('root', { orientation: 'horizontal', onActiveChildChange: spy })
    navigation
      .registerNode('left-col', { parent: 'root', orientation: 'vertical', onActiveChildChange: spy })
      .registerNode('a', { isFocusable: true, parent: 'left-col' })
      .registerNode('b', { isFocusable: true, parent: 'left-col' })
      .registerNode('c', { isFocusable: true, parent: 'left-col' })

    navigation
      .registerNode('right-col', { parent: 'root', orientation: 'vertical', onActiveChildChange: spy })
      .registerNode('d', { isFocusable: true, parent: 'right-col' })
      .registerNode('e', { isFocusable: true, parent: 'right-col' })
      .registerNode('f', { isFocusable: true, parent: 'right-col' })

    navigation.assignFocus('a')

    navigation.handleKeyEvent({ direction: 'down' })
    navigation.handleKeyEvent({ direction: 'right' })

    // 1st is by going from a to b
    expect(spy.mock.calls[0][0].node.id).toEqual('left-col')
    expect(spy.mock.calls[0][0].leave.id).toEqual('a')
    expect(spy.mock.calls[0][0].enter.id).toEqual('b')

    // 2nd is by going right to the 2nd column
    expect(spy.mock.calls[1][0].node.id).toEqual('root')
    expect(spy.mock.calls[1][0].leave.id).toEqual('left-col')
    expect(spy.mock.calls[1][0].enter.id).toEqual('right-col')
  })
})
