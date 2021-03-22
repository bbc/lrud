/* eslint-env jest */

const {
  Closest,
  isNodeFocusable,
  isDirectionAndOrientationMatching,
  getDirectionForKeyCode,
  isNodeIdTheLeafOfPath,
  isNodeIdInTheMiddleOfPath,
  isNodeIdTheRootOfPath,
  isNodeIdInPath,
  _findChildWithMatchingIndexRange,
  _findChildWithClosestIndex,
  _findChildWithIndex,
  isNodeInTree,
  getNodesFromTree
} = require('./utils')

describe('Closest()', () => {
  it('find the closest when number exists in array as first value', () => {
    const values = [1, 3, 5, 7, 9]
    const match = Closest(values, 1)

    expect(match).toEqual(1)
  })

  it('find the closest when number exists in array as last value', () => {
    const values = [1, 3, 5, 7, 9]
    const match = Closest(values, 9)

    expect(match).toEqual(9)
  })

  it('find the closest when number exists in array as middle value', () => {
    const values = [1, 3, 5, 7, 9]
    const match = Closest(values, 5)

    expect(match).toEqual(5)
  })

  it('find the closest, number not in array, obviously above a value', () => {
    const values = [1, 10, 20]
    const match = Closest(values, 11)

    expect(match).toEqual(10)
  })

  it('find the closest, number not in array, obviously below a value', () => {
    const values = [1, 10, 20]
    const match = Closest(values, 9)

    expect(match).toEqual(10)
  })

  it('find the closest, number is between 2 values in array - round down', () => {
    const values = [1, 3, 5]
    const match = Closest(values, 2)

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

describe('isNodeIdTheRootOfPath()', () => {
  test('node id is root of path', () => {
    expect(isNodeIdTheRootOfPath('x.y.z', 'x')).toEqual(true)
  })

  test('node id is not root of path', () => {
    expect(isNodeIdTheRootOfPath('x.y.z', 'y')).toEqual(false)
    expect(isNodeIdTheRootOfPath('x.y.z', 'z')).toEqual(false)
  })

  test('undefined node id is not root of path', () => {
    expect(isNodeIdTheRootOfPath('x.y.z', undefined)).toEqual(false)
  })

  test('undefined path is false', () => {
    expect(isNodeIdTheRootOfPath(undefined, 'x')).toEqual(false)
  })
})

describe('isNodeIdInTheMiddleOfPath()', () => {
  test('node id in the middle of path', () => {
    expect(isNodeIdInTheMiddleOfPath('x.y.z', 'y')).toEqual(true)
  })

  test('node id is not in the middle of path', () => {
    expect(isNodeIdInTheMiddleOfPath('x.y.z', 'x')).toEqual(false)
    expect(isNodeIdInTheMiddleOfPath('x.y.z', 'z')).toEqual(false)
  })

  test('undefined node id is not in the middle of path', () => {
    expect(isNodeIdInTheMiddleOfPath('x.y.z', null)).toEqual(false)
  })

  test('undefined path is false', () => {
    expect(isNodeIdInTheMiddleOfPath(undefined, 'x')).toEqual(false)
  })
})

describe('isNodeIdTheLeafOfPath()', () => {
  test('node id is leaf of path', () => {
    expect(isNodeIdTheLeafOfPath('x.y.z', 'z')).toEqual(true)
  })

  test('node id is not leaf of path', () => {
    expect(isNodeIdTheLeafOfPath('x.y.z', 'x')).toEqual(false)
    expect(isNodeIdTheLeafOfPath('x.y.z', 'y')).toEqual(false)
  })

  test('undefined node id is not leaf of path', () => {
    expect(isNodeIdTheLeafOfPath('x.y.z', undefined)).toEqual(false)
  })

  test('undefined path is false', () => {
    expect(isNodeIdTheLeafOfPath(undefined, 'x')).toEqual(false)
  })
})

describe('isNodeIdInPath()', () => {
  it('node id is halfway through path', () => {
    expect(isNodeIdInPath('x.y.z', 'y')).toEqual(true)
  })

  it('node id is at start of path', () => {
    expect(isNodeIdInPath('x.y.z', 'x')).toEqual(true)
  })

  it('node id is at end of path', () => {
    expect(isNodeIdInPath('x.y.z', 'z')).toEqual(true)
  })

  it('node id is not in path', () => {
    expect(isNodeIdInPath('1.2.3', 'z')).toEqual(false)
  })

  it('node id is not defined', () => {
    expect(isNodeIdInPath('1.2.3', undefined)).toEqual(false)
  })

  it('path is not defined', () => {
    expect(isNodeIdInPath(undefined, 'z')).toEqual(false)
  })
})

describe('_findChildWithMatchingIndexRange()', () => {
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

    const found = _findChildWithMatchingIndexRange(node, 2)

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

    const found = _findChildWithMatchingIndexRange(node, 0)

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

    const found = _findChildWithMatchingIndexRange(node, 6)

    expect(found).toEqual(undefined)
  })

  it('does not have a child', () => {
    const node = {
      id: 'a'
    }

    const found = _findChildWithMatchingIndexRange(node, 6)

    expect(found).toEqual(null)
  })

  test('should not fail when node does not exists', () => {
    const notExistingNode = undefined
    expect(() => _findChildWithMatchingIndexRange(notExistingNode, 0)).not.toThrow()
  })
})

describe('_findChildWithClosestIndex()', () => {
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

    const found = _findChildWithClosestIndex(node, 1)

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

    const found = _findChildWithClosestIndex(node, 5)

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

    const found = _findChildWithClosestIndex(node, 4)

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

    const found = _findChildWithClosestIndex(node, 0, [1, 2])

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

    const found = _findChildWithClosestIndex(node, 5, [1, 2])

    expect(found.id).toEqual('d')
  })

  it('does not have any children', () => {
    const node = {
      id: 'root'
    }

    const found = _findChildWithClosestIndex(node, 1)

    expect(found).toEqual(null)
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

    const found = _findChildWithClosestIndex(node, 1)

    expect(found).toEqual(null)
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

    const found = _findChildWithClosestIndex(node, 1)

    expect(found).toEqual(node.children.d)
  })

  test('should not fail when node does not exists', () => {
    const notExistingNode = undefined
    expect(() => _findChildWithClosestIndex(notExistingNode, 0)).not.toThrow()
  })
})

describe('_findChildWithIndex()', () => {
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

    const found = _findChildWithIndex(node, 1)
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

    const found = _findChildWithIndex(node, 0)
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

    const found = _findChildWithIndex(node, 2)
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

    const found = _findChildWithIndex(node, 5)
    expect(found).toEqual(null)
  })

  it('does not have any children', () => {
    const node = {
      id: 'root'
    }

    const found = _findChildWithIndex(node, 1)
    expect(found).toEqual(null)
  })

  test('should not fail when node does not exists', () => {
    const notExistingNode = undefined
    expect(() => _findChildWithIndex(notExistingNode, 0)).not.toThrow()
  })
})

describe('isNodeInTree()', () => {
  test('node is in tree at top level, return true', () => {
    const tree = {
      root: {
        children: {
          node_a: true,
          node_b: true
        }
      }
    }

    expect(isNodeInTree('root', tree)).toEqual(true)
  })

  test('node is at bottom level, return true', () => {
    const tree = {
      root: {
        children: {
          node_a: true,
          node_b: {
            children: {
              node_c: true,
              node_d: {
                children: {
                  node_e: true
                }
              }
            }
          }
        }
      }
    }

    expect(isNodeInTree('node_e', tree)).toEqual(true)
  })

  test('node is nested, return true', () => {
    const tree = {
      root: {
        children: {
          node_a: true,
          node_b: {
            children: {
              node_c: true,
              node_d: {
                children: {
                  node_e: true
                }
              }
            }
          }
        }
      }
    }

    expect(isNodeInTree('node_c', tree)).toEqual(true)
  })

  test('node is not present, return false', () => {
    const tree = {
      root: {
        children: {
          node_a: true,
          node_b: {
            children: {
              node_c: true,
              node_d: {
                children: {
                  node_e: true
                }
              }
            }
          }
        }
      }
    }

    expect(isNodeInTree('node_x', tree)).toEqual(false)
  })

  test('should not fail when tree is not defined', () => {
    expect(() => isNodeInTree('node_x', undefined)).not.toThrow()
    expect(isNodeInTree('node_x', undefined)).toEqual(false)
  })
})

describe('getDirectionForKeyCode()', () => {
  it('get direction for known keycode', () => {
    const direction = getDirectionForKeyCode(4)
    expect(direction).toEqual('LEFT')
  })
  it('get direction for unknown keycode', () => {
    const direction = getDirectionForKeyCode(999999999)
    expect(direction).toEqual(null)
  })
})

describe('getNodesFromTree()', () => {
  test('should not fail when tree is not defined', () => {
    expect(() => getNodesFromTree(undefined)).not.toThrow()
    expect(getNodesFromTree(undefined)).toEqual([])
  })
})
