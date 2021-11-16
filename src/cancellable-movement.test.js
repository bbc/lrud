/* eslint-env jest */

const { Lrud } = require('./index')

describe('cancellable movement - functions on the node', () => {
  it('should cancel movement when leaving via shouldCancelLeave on the leave node and fire onCancelled on the node and on the instance', () => {
    const onCancelledMock = jest.fn()
    const onCancelledNavigationMock = jest.fn()

    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', {
        isFocusable: true,
        shouldCancelLeave: (leave, enter) => {
          if (leave.id === 'b' && enter.id === 'c') {
            return true
          }
        },
        onLeaveCancelled: onCancelledMock
      })
      .registerNode('c', { isFocusable: true })
      .registerNode('d', { isFocusable: true })

    navigation.on('cancelled', onCancelledNavigationMock)

    navigation.assignFocus('b')

    expect(navigation.currentFocusNode.id).toEqual('b')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNode.id).toEqual('b') // still `b`, as the move should have been cancelled
    expect(onCancelledMock.mock.calls.length).toEqual(1)
    expect(onCancelledNavigationMock.mock.calls.length).toEqual(1)
  })

  it('should cancel movement when entering via shouldCancelEnter on the enter node and fire onCancelled on the node and on the instance', () => {
    const onCancelledMock = jest.fn()
    const onCancelledNavigationMock = jest.fn()

    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', {
        isFocusable: true,
        shouldCancelEnter: (leave, enter) => {
          if (leave.id === 'a' && enter.id === 'b') {
            return true
          }
        },
        onEnterCancelled: onCancelledMock
      })

    navigation.on('cancelled', onCancelledNavigationMock)
    navigation.assignFocus('a')

    expect(navigation.currentFocusNode.id).toEqual('a')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNode.id).toEqual('a') // still `b`, as the move should have been cancelled
    expect(onCancelledMock.mock.calls.length).toEqual(1)
    expect(onCancelledNavigationMock.mock.calls.length).toEqual(1)

    // try it again
    navigation.handleKeyEvent({ direction: 'right' })
    expect(onCancelledMock.mock.calls.length).toEqual(2)
    expect(onCancelledNavigationMock.mock.calls.length).toEqual(2)
  })

  it('should not cancel when shouldCancelLeave returns false', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', {
        isFocusable: true,
        shouldCancelLeave: (leave) => {
          if (leave.id === 'x') {
            return true
          }
        }
      })
      .registerNode('c', { isFocusable: true })
      .registerNode('d', { isFocusable: true })

    navigation.assignFocus('a')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNode.id).toEqual('b')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNode.id).toEqual('c')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNode.id).toEqual('d')
  })

  it('should not cancel when shouldCancelEnter returns false', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', {
        isFocusable: true,
        shouldCancelEnter: (leave) => {
          if (leave.id === 'x') {
            return true
          }
        }
      })
      .registerNode('c', { isFocusable: true })
      .registerNode('d', { isFocusable: true })

    navigation.assignFocus('a')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNode.id).toEqual('b')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNode.id).toEqual('c')

    navigation.handleKeyEvent({ direction: 'right' })
    expect(navigation.currentFocusNode.id).toEqual('d')
  })

  it('should cancel when shouldCancelLeave returns true, no onLeaveCancelled callback', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', {
        isFocusable: true,
        shouldCancelLeave: () => true
      })
      .registerNode('c', { isFocusable: true })

    navigation.assignFocus('b')

    navigation.handleKeyEvent({ direction: 'left' })

    expect(navigation.currentFocusNode.id).toEqual('b')
  })

  it('should cancel when shouldEnterLeave returns true, no onEnterCancelled callback', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('a', { isFocusable: true })
      .registerNode('b', {
        isFocusable: true,
        shouldCancelEnter: () => true
      })
      .registerNode('c', { isFocusable: true })

    navigation.assignFocus('a')

    navigation.handleKeyEvent({ direction: 'right' })

    expect(navigation.currentFocusNode.id).toEqual('a')
  })
})
