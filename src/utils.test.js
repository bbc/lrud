/* eslint-env jest */

const {
  closestIndex,
  insertChildNode,
  isNodeFocusable,
  isDirectionAndOrientationMatching,
  getDirectionForKeyCode,
  findChildWithMatchingIndexRange,
  findChildWithClosestIndex,
  prepareNode,
  removeChildNode,
  toValidDirection,
  toValidOrientation,
  traverseNodeSubtree
} = require('./utils')
const { Lrud } = require('./index')

describe('closestIndex()', () => {
  it('find the closest when number exists in array as first value', () => {
    const values = [1, 3, 5, 7, 9]
    const match = closestIndex(values, 1)

    expect(match).toEqual(1)
  })

  it('find the closest when number exists in array as last value', () => {
    const values = [1, 3, 5, 7, 9]
    const match = closestIndex(values, 9)

    expect(match).toEqual(9)
  })

  it('find the closest when number exists in array as middle value', () => {
    const values = [1, 3, 5, 7, 9]
    const match = closestIndex(values, 5)

    expect(match).toEqual(5)
  })

  it('find the closest, number not in array, obviously above a value', () => {
    const values = [1, 10, 20]
    const match = closestIndex(values, 11)

    expect(match).toEqual(10)
  })

  it('find the closest, number not in array, obviously below a value', () => {
    const values = [1, 10, 20]
    const match = closestIndex(values, 9)

    expect(match).toEqual(10)
  })

  it('find the closest, number is between 2 values in array - round down', () => {
    const values = [1, 3, 5]
    const match = closestIndex(values, 2)

    expect(match).toEqual(1)
  })
})

describe('isNodeFocusable()', () => {
  it('node should be focusable, it has a selectAction', () => {
    const node = {
      id: 'node', selectAction: true
    }

    expect(isNodeFocusable(node)).toEqual(true)
  })

  it('node should be focusable, it has isFocusable true', () => {
    const node = {
      id: 'node', isFocusable: true
    }

    expect(isNodeFocusable(node)).toEqual(true)
  })

  it('node should not be focusable, it has isFocusable but its false', () => {
    const node = {
      id: 'node', isFocusable: false
    }

    expect(isNodeFocusable(node)).toEqual(false)
  })

  it('node should not be focusable, it has isFocusable undefined', () => {
    const node = {
      id: 'node', isFocusable: undefined
    }

    expect(isNodeFocusable(node)).toEqual(false)
  })

  it('node should not be focusable, it has isFocusable null', () => {
    const node = {
      id: 'node', isFocusable: null
    }

    expect(isNodeFocusable(node)).toEqual(false)
  })

  it('node should not be focusable, it has neither a selectAction nor isFocusable', () => {
    const node = {
      id: 'node'
    }

    expect(isNodeFocusable(node)).toEqual(false)
  })

  it('node should not be focusable, it has isFocusable false, and a selectAction', () => {
    const node = {
      id: 'node', isFocusable: false, selectAction: true
    }

    expect(isNodeFocusable(node)).toEqual(false)
  })

  test('should not fail when node does not exists', () => {
    const notExistingNode = undefined
    expect(() => isNodeFocusable(notExistingNode)).not.toThrow()
    expect(isNodeFocusable(notExistingNode)).toEqual(false)
  })
})

describe('isDirectionAndOrientationMatching()', () => {
  test('vertical and up is true', () => {
    expect(isDirectionAndOrientationMatching('vertical', 'up')).toEqual(true)
  })
  test('vertical and down is true', () => {
    expect(isDirectionAndOrientationMatching('vertical', 'down')).toEqual(true)
  })
  test('vertical and * is true', () => {
    expect(isDirectionAndOrientationMatching('vertical', '*')).toEqual(true)
  })
  test('horizontal and left is true', () => {
    expect(isDirectionAndOrientationMatching('horizontal', 'left')).toEqual(true)
  })
  test('horizontal and right is true', () => {
    expect(isDirectionAndOrientationMatching('horizontal', 'right')).toEqual(true)
  })
  test('horizontal and * is true', () => {
    expect(isDirectionAndOrientationMatching('horizontal', '*')).toEqual(true)
  })
  test('vertical and left is false', () => {
    expect(isDirectionAndOrientationMatching('vertical', 'left')).toEqual(false)
  })
  test('vertical and right is false', () => {
    expect(isDirectionAndOrientationMatching('vertical', 'right')).toEqual(false)
  })
  test('horizontal and up is false', () => {
    expect(isDirectionAndOrientationMatching('horizontal', 'up')).toEqual(false)
  })
  test('horizontal and down is false', () => {
    expect(isDirectionAndOrientationMatching('horizontal', 'down')).toEqual(false)
  })
  test('undefined orientation and any valid direction is false', () => {
    expect(isDirectionAndOrientationMatching(undefined, '*')).toEqual(false)
  })
  test('any valid orientation and undefined direction is false', () => {
    expect(isDirectionAndOrientationMatching('horizontal', undefined)).toEqual(false)
  })
})

describe('findChildWithMatchingIndexRange()', () => {
  it('has a child with an index range that encompasses the index', () => {
    const node = {
      id: 'a',
      children: [
        { id: 'x', indexRange: [0, 1] },
        { id: 'y', indexRange: [2, 3] }
      ]
    }

    const found = findChildWithMatchingIndexRange(node, 2)

    expect(found.id).toEqual('y')
  })

  it('has a child with an index range that encompasses the index, first child', () => {
    const node = {
      id: 'a',
      children: [
        { id: 'x', indexRange: [0, 1] },
        { id: 'y', indexRange: [2, 3] }
      ]
    }

    const found = findChildWithMatchingIndexRange(node, 0)

    expect(found.id).toEqual('x')
  })

  it('does not have a child with an index range that encompasses the index', () => {
    const node = {
      id: 'a',
      children: [
        { id: 'x', indexRange: [0, 1] },
        { id: 'y', indexRange: [2, 3] }
      ]
    }

    const found = findChildWithMatchingIndexRange(node, 6)

    expect(found).toBeUndefined()
  })

  it('does not have a child', () => {
    const node = {
      id: 'a'
    }

    const found = findChildWithMatchingIndexRange(node, 6)

    expect(found).toBeUndefined()
  })

  test('should not fail when node does not exists', () => {
    const notExistingNode = undefined
    expect(() => findChildWithMatchingIndexRange(notExistingNode, 0)).not.toThrow()
  })
})

describe('findChildWithClosestIndex()', () => {
  it('find the child with the exact index', () => {
    const node = {
      id: 'root',
      children: [
        { id: 'a', index: 0, isFocusable: true },
        { id: 'b', index: 1, isFocusable: true },
        { id: 'c', index: 2, isFocusable: true }
      ]
    }

    const found = findChildWithClosestIndex(node, 1)

    expect(found.id).toEqual('b')
  })

  it('find the child with closest index, lower', () => {
    const node = {
      id: 'root',
      children: [
        { id: 'a', index: 0, isFocusable: true },
        { id: 'b', index: 1, isFocusable: true },
        { id: 'c', index: 2, isFocusable: true }
      ]
    }

    const found = findChildWithClosestIndex(node, 5)

    expect(found.id).toEqual('c')
  })

  it('find the child with closest index, higher', () => {
    const node = {
      id: 'root',
      children: [
        { id: 'a', index: 0, isFocusable: false },
        { id: 'b', index: 1, isFocusable: true },
        { id: 'c', index: 2, isFocusable: true }
      ]
    }

    const found = findChildWithClosestIndex(node, -1)

    expect(found.id).toEqual('b')
  })

  it('find the child via an indexRange, so return the active child (when its focusable)', () => {
    const node = {
      id: 'root',
      children: [
        { id: 'a', isFocusable: true, index: 0 },
        { id: 'b', isFocusable: true, index: 1 },
        { id: 'c', isFocusable: true, index: 2 }
      ]
    }
    node.activeChild = node.children[1]

    const found = findChildWithClosestIndex(node, 0, [1, 2])

    expect(found.id).toEqual('b')
  })

  it('find the child via an indexRange, but the active ISNT in the index range, so do it by the passed index', () => {
    const node = {
      id: 'root',
      children: [
        { id: 'a', index: 0, isFocusable: true },
        { id: 'b', index: 1, isFocusable: true },
        { id: 'c', index: 2, isFocusable: true },
        { id: 'd', index: 5, isFocusable: true }
      ]
    }
    node.activeChild = node.children[0]

    const found = findChildWithClosestIndex(node, 5, [1, 2])

    expect(found.id).toEqual('d')
  })

  it('does not have any children', () => {
    const node = {
      id: 'root'
    }

    const found = findChildWithClosestIndex(node, 1)

    expect(found).toBeUndefined()
  })

  it('should return null if no focusable child', () => {
    const node = {
      id: 'root',
      isFocusable: true,
      children: [
        { id: 'a', index: 0 },
        { id: 'b', index: 1 },
        { id: 'c', index: 2 },
        { id: 'd', index: 3 }
      ]
    }
    node.activeChild = node.children[0]

    const found = findChildWithClosestIndex(node, 1)

    expect(found).toBeUndefined()
  })

  it('should return closest focusable child', () => {
    const node = {
      id: 'root',
      isFocusable: true,
      children: [
        { id: 'a', index: 0 },
        { id: 'b', index: 1 },
        { id: 'c', index: 2 },
        { id: 'd', index: 3, isFocusable: true }
      ]
    }
    node.activeChild = node.children[0]

    const found = findChildWithClosestIndex(node, 1)

    expect(found).toEqual(node.children[3])
  })

  test('should not fail when node does not exists', () => {
    const notExistingNode = undefined
    expect(() => findChildWithClosestIndex(notExistingNode, 0)).not.toThrow()
  })
})

describe('getDirectionForKeyCode()', () => {
  it('get direction for known keycode', () => {
    const direction = getDirectionForKeyCode(4)
    expect(direction).toEqual('left')
  })

  it('get direction for unknown keycode', () => {
    const direction = getDirectionForKeyCode(999999999)
    expect(direction).toBeUndefined()
  })

  test('should not fail when keycode is not defined', () => {
    let direction = '*'

    expect(() => {
      direction = getDirectionForKeyCode(undefined)
    }).not.toThrow()

    expect(direction).toBeUndefined()
  })
})

describe('insertChildNode()', () => {
  test('should not fail when one of the arguments is not defined', () => {
    expect(() => {
      insertChildNode(undefined, { id: 'node' })
    }).not.toThrow()

    expect(() => {
      insertChildNode({ id: 'node' }, undefined)
    }).not.toThrow()
  })

  test('should append child if index is not defined', () => {
    const parent = {
      id: 'parent',
      children: [
        { id: 'child_0', index: 0 },
        { id: 'child_1', index: 1 }
      ]
    }

    const child = {
      id: 'new_child'
    }

    insertChildNode(parent, child)

    expect(child.parent.id).toEqual('parent')
    expect(parent.children).toEqual([
      expect.objectContaining({ id: 'child_0', index: 0 }),
      expect.objectContaining({ id: 'child_1', index: 1 }),
      expect.objectContaining({ id: 'new_child', index: 2 })
    ])
  })

  test('should append child if index is greater than parent\'s children length', () => {
    const parent = {
      id: 'parent',
      children: [
        { id: 'child_0', index: 0 },
        { id: 'child_1', index: 1 }
      ]
    }

    const child = {
      id: 'new_child',
      index: 3
    }

    insertChildNode(parent, child)

    expect(child.parent.id).toEqual('parent')
    expect(parent.children).toEqual([
      expect.objectContaining({ id: 'child_0', index: 0 }),
      expect.objectContaining({ id: 'child_1', index: 1 }),
      expect.objectContaining({ id: 'new_child', index: 2 })
    ])
  })

  test('should shift nodes indices by one', () => {
    const parent = {
      id: 'parent',
      children: [
        { id: 'child_0', index: 0 },
        { id: 'child_1', index: 1 }
      ]
    }

    const child = {
      id: 'new_child',
      index: 1
    }

    insertChildNode(parent, child)

    expect(child.parent.id).toEqual('parent')
    expect(parent.children).toEqual([
      expect.objectContaining({ id: 'child_0', index: 0 }),
      expect.objectContaining({ id: 'new_child', index: 1 }),
      expect.objectContaining({ id: 'child_1', index: 2 })
    ])
  })

  test('should insert node at first position', () => {
    const parent = {
      id: 'parent',
      children: [
        { id: 'child_0', index: 0 },
        { id: 'child_1', index: 1 }
      ]
    }

    const child = {
      id: 'new_child',
      index: 0
    }

    insertChildNode(parent, child)

    expect(child.parent.id).toEqual('parent')
    expect(parent.children).toEqual([
      expect.objectContaining({ id: 'new_child', index: 0 }),
      expect.objectContaining({ id: 'child_0', index: 1 }),
      expect.objectContaining({ id: 'child_1', index: 2 })
    ])
  })
})

describe('removeChildNode()', () => {
  test('should not fail when one of the arguments is not defined', () => {
    expect(() => {
      removeChildNode(undefined, { id: 'root' })
    }).not.toThrow()

    expect(() => {
      removeChildNode({ id: 'root' }, undefined)
    }).not.toThrow()
  })

  test('should not fail and do nothing when parent has no children', () => {
    const parent = {
      id: 'parent'
    }

    expect(() => {
      removeChildNode(parent, { id: 'some_child' })
    }).not.toThrow()
  })

  test('should not fail and do nothing when parent doesn\'t contain removed child', () => {
    const parent = {
      id: 'parent',
      children: [
        { id: 'child', index: 0 }
      ]
    }

    expect(() => {
      removeChildNode(parent, { id: 'some_child' })
    }).not.toThrow()

    expect(parent.children).toBeDefined()
    expect(parent.children[0].id).toEqual('child')
  })

  test('should remove child and reindex left children', () => {
    const parent = {
      id: 'parent',
      children: [
        { id: 'child_0', index: 0 },
        { id: 'child_1', index: 1 },
        { id: 'child_2', index: 2 }
      ]
    }

    expect(() => {
      removeChildNode(parent, parent.children[1])
    }).not.toThrow()

    expect(parent.children).toEqual([
      expect.objectContaining({ id: 'child_0', index: 0 }),
      expect.objectContaining({ id: 'child_2', index: 1 })
    ])
  })
})

describe('toValidDirection()', () => {
  test('should correctly convert to valid direction', () => {
    expect(toValidDirection(undefined)).toBeUndefined()
    expect(toValidDirection('wrong')).toBeUndefined()

    expect(toValidDirection('left')).toEqual('left')
    expect(toValidDirection('LEFT')).toEqual('left')
    expect(toValidDirection('LeFt')).toEqual('left')

    expect(toValidDirection('right')).toEqual('right')
    expect(toValidDirection('RIGHT')).toEqual('right')
    expect(toValidDirection('RiGhT')).toEqual('right')

    expect(toValidDirection('up')).toEqual('up')
    expect(toValidDirection('UP')).toEqual('up')
    expect(toValidDirection('Up')).toEqual('up')

    expect(toValidDirection('down')).toEqual('down')
    expect(toValidDirection('DOWN')).toEqual('down')
    expect(toValidDirection('DoWn')).toEqual('down')

    expect(toValidDirection('enter')).toEqual('enter')
    expect(toValidDirection('ENTER')).toEqual('enter')
    expect(toValidDirection('EnTeR')).toEqual('enter')

    expect(toValidDirection('*')).toEqual('*')
  })
})

describe('toValidOrientation()', () => {
  test('should correctly convert to valid orientation', () => {
    expect(toValidOrientation(undefined)).toBeUndefined()
    expect(toValidOrientation('wrong')).toBeUndefined()

    expect(toValidOrientation('horizontal')).toEqual('horizontal')
    expect(toValidOrientation('HORIZONTAL')).toEqual('horizontal')
    expect(toValidOrientation('HoRiZoNtAl')).toEqual('horizontal')

    expect(toValidOrientation('vertical')).toEqual('vertical')
    expect(toValidOrientation('VERTICAL')).toEqual('vertical')
    expect(toValidOrientation('VeRtIcAl')).toEqual('vertical')
  })
})

describe('prepareNode()', () => {
  test('should correctly create node', () => {
    const baseNode = { id: 'node', parent: undefined, index: undefined, children: undefined, activeChild: undefined }

    expect(() => prepareNode(undefined)).toThrow('Node ID has to be defined')

    expect(prepareNode('node')).toEqual(baseNode)
    expect(prepareNode('node', {})).toEqual(baseNode)
    // parent property is not copied, it's computed in registerNode method
    expect(prepareNode('node', { parent: 'parent' })).toEqual(baseNode)

    expect(prepareNode('node', { index: 'index' })).toEqual(baseNode)
    expect(prepareNode('node', { index: 1 })).toEqual({ ...baseNode, index: 1 })
    expect(prepareNode('node', { orientation: 'horizontal' })).toEqual({ ...baseNode, orientation: 'horizontal' })
    expect(prepareNode('node', { indexRange: [0, 1] })).toEqual({ ...baseNode, indexRange: [0, 1] })
    expect(prepareNode('node', { selectAction: 'action' })).toEqual({ ...baseNode, selectAction: 'action' })
    expect(prepareNode('node', { isFocusable: true })).toEqual({ ...baseNode, isFocusable: true })
    expect(prepareNode('node', { isWrapping: true })).toEqual({ ...baseNode, isWrapping: true })
    expect(prepareNode('node', { isStopPropagate: true })).toEqual({ ...baseNode, isStopPropagate: true })
    expect(prepareNode('node', { isIndexAlign: true })).toEqual({ ...baseNode, isIndexAlign: true })

    const mock = jest.fn()
    expect(prepareNode('node', { onLeave: mock })).toEqual({ ...baseNode, onLeave: mock })
    expect(prepareNode('node', { onEnter: mock })).toEqual({ ...baseNode, onEnter: mock })
    expect(prepareNode('node', { shouldCancelLeave: mock })).toEqual({ ...baseNode, shouldCancelLeave: mock })
    expect(prepareNode('node', { onLeaveCancelled: mock })).toEqual({ ...baseNode, onLeaveCancelled: mock })
    expect(prepareNode('node', { shouldCancelEnter: mock })).toEqual({ ...baseNode, shouldCancelEnter: mock })
    expect(prepareNode('node', { onEnterCancelled: mock })).toEqual({ ...baseNode, onEnterCancelled: mock })
    expect(prepareNode('node', { onSelect: mock })).toEqual({ ...baseNode, onSelect: mock })
    expect(prepareNode('node', { onInactive: mock })).toEqual({ ...baseNode, onInactive: mock })
    expect(prepareNode('node', { onActive: mock })).toEqual({ ...baseNode, onActive: mock })
    expect(prepareNode('node', { onActiveChildChange: mock })).toEqual({ ...baseNode, onActiveChildChange: mock })
    expect(prepareNode('node', { onBlur: mock })).toEqual({ ...baseNode, onBlur: mock })
    expect(prepareNode('node', { onFocus: mock })).toEqual({ ...baseNode, onFocus: mock })
    expect(prepareNode('node', { onMove: mock })).toEqual({ ...baseNode, onMove: mock })
  })
})

describe('traverseNodeSubtree()', () => {
  test('should correctly traverse tree using preorder DFS', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('a', { parent: 'root', orientation: 'horizontal' })
      .registerNode('aa', { parent: 'a', orientation: 'horizontal' })
      .registerNode('aaa', { parent: 'aa' })
      .registerNode('aab', { parent: 'aa' })
      .registerNode('b', { parent: 'root', orientation: 'vertical' })
      .registerNode('ba', { parent: 'b' })
      .registerNode('bb', { parent: 'b' })
      .registerNode('c', { parent: 'root' })

    const nodeProcessor = jest.fn()

    traverseNodeSubtree(navigation.rootNode, nodeProcessor)

    expect(nodeProcessor).toHaveBeenCalledTimes(9)
    expect(nodeProcessor).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 'root' }))
    expect(nodeProcessor).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: 'a' }))
    expect(nodeProcessor).toHaveBeenNthCalledWith(3, expect.objectContaining({ id: 'aa' }))
    expect(nodeProcessor).toHaveBeenNthCalledWith(4, expect.objectContaining({ id: 'aaa' }))
    expect(nodeProcessor).toHaveBeenNthCalledWith(5, expect.objectContaining({ id: 'aab' }))
    expect(nodeProcessor).toHaveBeenNthCalledWith(6, expect.objectContaining({ id: 'b' }))
    expect(nodeProcessor).toHaveBeenNthCalledWith(7, expect.objectContaining({ id: 'ba' }))
    expect(nodeProcessor).toHaveBeenNthCalledWith(8, expect.objectContaining({ id: 'bb' }))
    expect(nodeProcessor).toHaveBeenNthCalledWith(9, expect.objectContaining({ id: 'c' }))
  })

  test('should interrupt traversing tree on node processor result', () => {
    const navigation = new Lrud()
      .registerNode('root', { orientation: 'vertical' })
      .registerNode('a', { parent: 'root', orientation: 'horizontal' })
      .registerNode('aa', { parent: 'a', orientation: 'horizontal' })
      .registerNode('aaa', { parent: 'aa' })
      .registerNode('aab', { parent: 'aa' })
      .registerNode('b', { parent: 'root', orientation: 'vertical' })
      .registerNode('ba', { parent: 'b' })
      .registerNode('bb', { parent: 'b' })
      .registerNode('c', { parent: 'root' })

    // Interrupt when reaching node 'aaa'
    const nodeProcessor = jest.fn().mockImplementation(node => node.id === 'aaa')

    traverseNodeSubtree(navigation.rootNode, nodeProcessor)

    expect(nodeProcessor).toHaveBeenCalledTimes(4)
    expect(nodeProcessor).toHaveBeenNthCalledWith(1, expect.objectContaining({ id: 'root' }))
    expect(nodeProcessor).toHaveBeenNthCalledWith(2, expect.objectContaining({ id: 'a' }))
    expect(nodeProcessor).toHaveBeenNthCalledWith(3, expect.objectContaining({ id: 'aa' }))
    expect(nodeProcessor).toHaveBeenNthCalledWith(4, expect.objectContaining({ id: 'aaa' }))
  })
})
