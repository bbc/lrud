/* eslint-env jest */

const {
  calculateIsFocusableValue,
  closestIndex,
  insertChildNode,
  isNodeFocusable,
  isDirectionAndOrientationMatching,
  getDirectionForKeyCode,
  findChildWithMatchingIndexRange,
  findChildWithClosestIndex,
  findChildWithIndex,
  flattenNode,
  flattenNodeTree,
  removeChildNode,
  toValidDirection,
  toValidOrientation
} = require('./utils')

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
      selectAction: true
    }

    expect(isNodeFocusable(node)).toEqual(true)
  })

  it('node should be focusable, it has isFocusable true', () => {
    const node = {
      isFocusable: true
    }

    expect(isNodeFocusable(node)).toEqual(true)
  })

  it('node should not be focusable, it has isFocusable but its false', () => {
    const node = {
      isFocusable: false
    }

    expect(isNodeFocusable(node)).toEqual(false)
  })

  it('node should not be focusable, it has isFocusable undefined', () => {
    const node = {
      isFocusable: undefined
    }

    expect(isNodeFocusable(node)).toEqual(false)
  })

  it('node should not be focusable, it has isFocusable null', () => {
    const node = {
      isFocusable: null
    }

    expect(isNodeFocusable(node)).toEqual(false)
  })

  it('node should not be focusable, it has neither a selectAction nor isFocusable', () => {
    const node = {
      x: true
    }

    expect(isNodeFocusable(node)).toEqual(false)
  })

  it('node should not be focusable, it has isFocusable false, and a selectAction', () => {
    const node = {
      isFocusable: false,
      selectAction: true
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
      children: {
        x: {
          id: 'x',
          indexRange: [0, 1]
        },
        y: {
          id: 'y',
          indexRange: [2, 3]
        }
      }
    }

    const found = findChildWithMatchingIndexRange(node, 2)

    expect(found.id).toEqual('y')
  })

  it('has a child with an index range that encompasses the index, first child', () => {
    const node = {
      id: 'a',
      children: {
        x: {
          id: 'x',
          indexRange: [0, 1]
        },
        y: {
          id: 'y',
          indexRange: [2, 3]
        }
      }
    }

    const found = findChildWithMatchingIndexRange(node, 0)

    expect(found.id).toEqual('x')
  })

  it('does not have a child with an index range that encompasses the index', () => {
    const node = {
      id: 'a',
      children: {
        x: {
          id: 'x',
          indexRange: [0, 1]
        },
        y: {
          id: 'y',
          indexRange: [2, 3]
        }
      }
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
      children: {
        a: {
          id: 'a',
          index: 0,
          isFocusable: true
        },
        b: {
          id: 'b',
          index: 1,
          isFocusable: true
        },
        c: {
          id: 'c',
          index: 2,
          isFocusable: true
        }
      }
    }

    const found = findChildWithClosestIndex(node, 1)

    expect(found.id).toEqual('b')
  })

  it('find the child with closest index, lower', () => {
    const node = {
      id: 'root',
      children: {
        a: {
          id: 'a',
          index: 0,
          isFocusable: true
        },
        b: {
          id: 'b',
          index: 1,
          isFocusable: true
        },
        c: {
          id: 'c',
          index: 2,
          isFocusable: true
        }
      }
    }

    const found = findChildWithClosestIndex(node, 5)

    expect(found.id).toEqual('c')
  })

  it('find the child with closest index, higher', () => {
    const node = {
      id: 'root',
      children: {
        a: {
          id: 'a',
          index: 0,
          isFocusable: true
        },
        b: {
          id: 'b',
          index: 5,
          isFocusable: true
        },
        c: {
          id: 'c',
          index: 10,
          isFocusable: true
        }
      }
    }

    const found = findChildWithClosestIndex(node, 4)

    expect(found.id).toEqual('b')
  })

  it('find the child via an indexRange, so return the active child (when its focusable)', () => {
    const node = {
      id: 'root',
      activeChild: 'b',
      children: {
        a: {
          id: 'a',
          isFocusable: true,
          index: 0
        },
        b: {
          id: 'b',
          isFocusable: true,
          index: 1
        },
        c: {
          id: 'c',
          isFocusable: true,
          index: 2
        }
      }
    }

    const found = findChildWithClosestIndex(node, 0, [1, 2])

    expect(found.id).toEqual('b')
  })

  it('find the child via an indexRange, but the active ISNT in the index range, so do it by the passed index', () => {
    const node = {
      id: 'root',
      activeChild: 'a',
      children: {
        a: {
          id: 'a',
          index: 0,
          isFocusable: true
        },
        b: {
          id: 'b',
          index: 1,
          isFocusable: true
        },
        c: {
          id: 'c',
          index: 2,
          isFocusable: true
        },
        d: {
          id: 'd',
          index: 5,
          isFocusable: true
        }
      }
    }

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
      activeChild: 'a',
      children: {
        a: {
          id: 'a',
          index: 0
        },
        b: {
          id: 'b',
          index: 1
        },
        c: {
          id: 'c',
          index: 2
        },
        d: {
          id: 'd',
          index: 5
        }
      }
    }

    const found = findChildWithClosestIndex(node, 1)

    expect(found).toBeUndefined()
  })

  it('should return closest focusable child', () => {
    const node = {
      id: 'root',
      isFocusable: true,
      activeChild: 'a',
      children: {
        a: {
          id: 'a',
          index: 0
        },
        b: {
          id: 'b',
          index: 1
        },
        c: {
          id: 'c',
          index: 2
        },
        d: {
          id: 'd',
          index: 5,
          isFocusable: true
        }
      }
    }

    const found = findChildWithClosestIndex(node, 1)

    expect(found).toEqual(node.children.d)
  })

  test('should not fail when node does not exists', () => {
    const notExistingNode = undefined
    expect(() => findChildWithClosestIndex(notExistingNode, 0)).not.toThrow()
  })
})

describe('findChildWithIndex()', () => {
  it('get the child with the index, child exists', () => {
    const node = {
      id: 'root',
      children: {
        a: {
          id: 'a',
          index: 0
        },
        b: {
          id: 'b',
          index: 1
        },
        c: {
          id: 'c',
          index: 2
        }
      }
    }

    const found = findChildWithIndex(node, 1)
    expect(found.id).toEqual('b')
  })

  it('get the child with the index, child exists as first child', () => {
    const node = {
      id: 'root',
      children: {
        a: {
          id: 'a',
          index: 0
        },
        b: {
          id: 'b',
          index: 1
        },
        c: {
          id: 'c',
          index: 2
        }
      }
    }

    const found = findChildWithIndex(node, 0)
    expect(found.id).toEqual('a')
  })

  it('get the child with the index, child exists as last child', () => {
    const node = {
      id: 'root',
      children: {
        a: {
          id: 'a',
          index: 0
        },
        b: {
          id: 'b',
          index: 1
        },
        c: {
          id: 'c',
          index: 2
        }
      }
    }

    const found = findChildWithIndex(node, 2)
    expect(found.id).toEqual('c')
  })

  it('get the child with the index, child does not exist', () => {
    const node = {
      id: 'root',
      children: {
        a: {
          id: 'a',
          index: 0
        },
        b: {
          id: 'b',
          index: 1
        },
        c: {
          id: 'c',
          index: 2
        }
      }
    }

    const found = findChildWithIndex(node, 5)
    expect(found).toBeUndefined()
  })

  it('does not have any children', () => {
    const node = {
      id: 'root'
    }

    const found = findChildWithIndex(node, 1)
    expect(found).toBeUndefined()
  })

  test('should not fail when node does not exists', () => {
    const notExistingNode = undefined
    expect(() => findChildWithIndex(notExistingNode, 0)).not.toThrow()
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
      insertChildNode(undefined, {})
    }).not.toThrow()

    expect(() => {
      insertChildNode({}, undefined)
    }).not.toThrow()
  })

  test('should append child if index is not defined', () => {
    const parent = {
      id: 'parent',
      children: {
        child_0: { id: 'child_0', parent: 'parent', index: 0 },
        child_1: { id: 'child_1', parent: 'parent', index: 1 }
      }
    }

    const child = {
      id: 'new_child',
      parent: 'old_parent'
    }

    insertChildNode(parent, child)

    expect(child.parent).toEqual('parent')
    expect(parent.children).toEqual({
      child_0: { id: 'child_0', parent: 'parent', index: 0 },
      child_1: { id: 'child_1', parent: 'parent', index: 1 },
      new_child: { id: 'new_child', parent: 'parent', index: 2 }
    })
  })

  test('should append child if index is greater than parent\'s children length', () => {
    const parent = {
      id: 'parent',
      children: {
        child_0: { id: 'child_0', parent: 'parent', index: 0 },
        child_1: { id: 'child_1', parent: 'parent', index: 1 }
      }
    }

    const child = {
      id: 'new_child',
      parent: 'old_parent',
      index: 3
    }

    insertChildNode(parent, child)

    expect(child.parent).toEqual('parent')
    expect(parent.children).toEqual({
      child_0: { id: 'child_0', parent: 'parent', index: 0 },
      child_1: { id: 'child_1', parent: 'parent', index: 1 },
      new_child: { id: 'new_child', parent: 'parent', index: 2 }
    })
  })

  test('should shift nodes indices by one', () => {
    const parent = {
      id: 'parent',
      children: {
        child_0: { id: 'child_0', parent: 'parent', index: 0 },
        child_1: { id: 'child_1', parent: 'parent', index: 1 }
      }
    }

    const child = {
      id: 'new_child',
      parent: 'old_parent',
      index: 1
    }

    insertChildNode(parent, child)

    expect(child.parent).toEqual('parent')
    expect(parent.children).toEqual({
      child_0: { id: 'child_0', parent: 'parent', index: 0 },
      new_child: { id: 'new_child', parent: 'parent', index: 1 },
      child_1: { id: 'child_1', parent: 'parent', index: 2 }
    })
  })

  test('should insert node at first position', () => {
    const parent = {
      id: 'parent',
      children: {
        child_0: { id: 'child_0', parent: 'parent', index: 0 },
        child_1: { id: 'child_1', parent: 'parent', index: 1 }
      }
    }

    const child = {
      id: 'new_child',
      parent: 'old_parent',
      index: 0
    }

    insertChildNode(parent, child)

    expect(child.parent).toEqual('parent')
    expect(parent.children).toEqual({
      new_child: { id: 'new_child', parent: 'parent', index: 0 },
      child_0: { id: 'child_0', parent: 'parent', index: 1 },
      child_1: { id: 'child_1', parent: 'parent', index: 2 }
    })
  })
})

describe('removeChildNode()', () => {
  test('should not fail when one of the arguments is not defined', () => {
    expect(() => {
      removeChildNode(undefined, 'root')
    }).not.toThrow()

    expect(() => {
      removeChildNode({}, undefined)
    }).not.toThrow()
  })

  test('should not fail and do nothing when parent has no children', () => {
    const parent = {
      id: 'parent'
    }

    expect(() => {
      removeChildNode(parent, 'some_child')
    }).not.toThrow()
  })

  test('should not fail and do nothing when parent doesn\'t contain removed child', () => {
    const parent = {
      id: 'parent',
      children: {
        child: { id: 'child', parent: 'parent', index: 0 }
      }
    }

    expect(() => {
      removeChildNode(parent, 'some_child')
    }).not.toThrow()

    expect(parent.children.child).toBeDefined()
  })

  test('should remove child and reindex left children', () => {
    const parent = {
      id: 'parent',
      children: {
        child_0: { id: 'child_0', parent: 'parent', index: 0 },
        child_1: { id: 'child_1', parent: 'parent', index: 1 },
        child_2: { id: 'child_2', parent: 'parent', index: 2 }
      }
    }

    expect(() => {
      removeChildNode(parent, 'child_1')
    }).not.toThrow()

    expect(parent.children).toEqual({
      child_0: { id: 'child_0', parent: 'parent', index: 0 },
      child_2: { id: 'child_2', parent: 'parent', index: 1 }
    })
  })
})

describe('flattenNodeTree()', () => {
  test('should not fail and return empty tree when arguments is not defined', () => {
    let flatNodeTree

    expect(() => {
      flatNodeTree = flattenNodeTree(undefined)
    }).not.toThrow()

    expect(flatNodeTree).toEqual({})
  })

  test('should return flatten nodes', () => {
    const tree = {
      root: {
        id: 'root',
        children: {
          a: {
            id: 'a',
            parent: 'root',
            index: 0,
            orientation: 'horizontal',
            children: {
              aa: { id: 'aa', parent: 'a', index: 0, isFocusable: true },
              ab: { id: 'ab', parent: 'a', index: 1, isFocusable: false }
            }
          },
          b: {
            id: 'b',
            parent: 'root',
            index: 1,
            orientation: 'vertical',
            children: {
              ba: { id: 'ba', parent: 'b', index: 0, isFocusable: true },
              bb: { id: 'bb', parent: 'b', index: 1, isFocusable: false }
            }
          }
        }
      }
    }

    expect(flattenNodeTree(tree)).toEqual({
      root: { id: 'root' },
      a: { id: 'a', parent: 'root', index: 0, orientation: 'horizontal' },
      aa: { id: 'aa', parent: 'a', index: 0, isFocusable: true },
      ab: { id: 'ab', parent: 'a', index: 1, isFocusable: false },
      b: { id: 'b', parent: 'root', index: 1, orientation: 'vertical' },
      ba: { id: 'ba', parent: 'b', index: 0, isFocusable: true },
      bb: { id: 'bb', parent: 'b', index: 1, isFocusable: false }
    })
  })

  test('should fulfill missing parent and id fields', () => {
    const tree = {
      root: {
        id: 'root',
        children: {
          a: { id: 'a' },
          b: { parent: 'root' },
          c: {}
        }
      }
    }

    expect(flattenNodeTree(tree)).toEqual({
      root: { id: 'root' },
      a: { id: 'a', parent: 'root' },
      b: { id: 'b', parent: 'root' },
      c: { id: 'c', parent: 'root' }
    })
  })
})

describe('flattenNode()', () => {
  test('should not fail and return empty tree when arguments is not defined', () => {
    let flatNodeTree

    expect(() => {
      flatNodeTree = flattenNode(undefined)
    }).not.toThrow()

    expect(flatNodeTree).toEqual({})
  })

  test('should return flatten nodes', () => {
    const node = {
      id: 'root',
      children: {
        a: {
          id: 'a',
          parent: 'root',
          index: 0,
          orientation: 'horizontal',
          children: {
            aa: { id: 'aa', parent: 'a', index: 0, isFocusable: true },
            ab: { id: 'ab', parent: 'a', index: 1, isFocusable: false }
          }
        },
        b: { id: 'b', parent: 'root', index: 1, orientation: 'vertical' }
      }
    }

    expect(flattenNode(node)).toEqual({
      root: { id: 'root' },
      a: { id: 'a', parent: 'root', index: 0, orientation: 'horizontal' },
      aa: { id: 'aa', parent: 'a', index: 0, isFocusable: true },
      ab: { id: 'ab', parent: 'a', index: 1, isFocusable: false },
      b: { id: 'b', parent: 'root', index: 1, orientation: 'vertical' }
    })
  })

  test('should fulfill missing parent and id fields', () => {
    const node = {
      id: 'root',
      children: {
        a: { id: 'a' },
        b: { parent: 'root' },
        c: {}
      }
    }

    expect(flattenNode(node)).toEqual({
      root: { id: 'root' },
      a: { id: 'a', parent: 'root' },
      b: { id: 'b', parent: 'root' },
      c: { id: 'c', parent: 'root' }
    })
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
