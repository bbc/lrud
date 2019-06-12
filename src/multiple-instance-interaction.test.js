/* eslint-env jest */

const { Lrud } = require('./index')

describe('populateFrom()', () => {
  test('populating an instance from another should set that instance to be indentical for state data', () => {
    const instanceA = new Lrud()
    const instanceB = new Lrud()

    instanceB.registerNode('root')
    instanceB.registerNode('a', { isFocusable: true })
    instanceB.registerNode('b', { isFocusable: true })
    instanceB.assignFocus('a')

    instanceA.populateFrom(instanceB)

    expect(instanceA.tree.root.children.a).toBeTruthy()
    expect(instanceA.tree.root.children.b).toBeTruthy()
    expect(instanceA.nodePathList).toEqual([ 'root', 'root.children.a', 'root.children.b' ])
    expect(instanceA.focusableNodePathList).toEqual([ 'root.children.a', 'root.children.b' ])
    expect(instanceA.rootNodeId).toEqual('root')
    expect(instanceA.currentFocusNode).toMatchObject({ isFocusable: true, id: 'a', parent: 'root', index: 0 })
    expect(instanceA.currentFocusNodeId).toEqual('a')
    expect(instanceA.currentFocusNodeIndex).toEqual(0)
    expect(instanceA.currentFocusNodeIndexRange).toEqual(null)
    expect(instanceA.currentFocusNodeIndexRangeLowerBound).toEqual(0)
    expect(instanceA.currentFocusNodeIndexRangeUpperBound).toEqual(0)
    expect(instanceA.isIndexAlignMode).toEqual(false)
    expect(instanceA.overrides).toEqual({})
  })

  test('when populateFrom(), changes to the receiver of data dont affect the original copied object', () => {
    const instanceA = new Lrud()
    const instanceB = new Lrud()

    instanceB.registerNode('root')
    instanceB.registerNode('a', { isFocusable: true })
    instanceB.registerNode('b', { isFocusable: true })
    instanceB.assignFocus('a')

    instanceA.populateFrom(instanceB)

    // now add new, DIFFERENT nodes to each
    instanceA.registerNode('x', { isFocusable: true })
    instanceB.registerNode('y', { isFocusable: true })

    expect(instanceA.tree.root.children.x).toBeTruthy()
    expect(instanceA.tree.root.children.y).not.toBeTruthy()

    expect(instanceB.tree.root.children.x).not.toBeTruthy()
    expect(instanceB.tree.root.children.y).toBeTruthy()
  })
})
