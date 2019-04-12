/* eslint-env jest */

const Lrud = require('./index')

describe('lrud', () => {
  describe.only('registerNode()', () => {
    test('registering the very first registered node sets it to the root node', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', {
        selectAction: true
      })

      expect(navigation.getRootNodeId()).toEqual('root')
      expect(navigation.getTree()).toMatchObject({
        root: {
          selectAction: true
        }
      })
    })

    test('registering a node (after the root node) without a parent puts it under the root node', () => {
      const navigation = new Lrud()

      navigation.registerNode('alpha', { z: 1 })
      navigation.registerNode('beta', { x: 1 })
      navigation.registerNode('charlie', { x: 2 })

      expect(navigation.getTree()).toMatchObject({
        alpha: {
          z: 1,
          children: {
            beta: { x: 1 },
            charlie: { x: 2 }
          }
        }
      })
    })

    test('registering a node with a nested parent', () => {
      const navigation = new Lrud()

      navigation.registerNode('alpha', { a: 1 })
      navigation.registerNode('beta', { b: 2 })
      navigation.registerNode('charlie', { c: 3, parent: 'beta' })

      expect(navigation.getTree()).toMatchObject({
        alpha: {
          a: 1,
          children: {
            beta: {
              b: 2,
              parent: 'alpha',
              children: {
                charlie: { c: 3, parent: 'beta' }
              }
            }
          }
        }
      })
    })

    test('registering a node with a deeply nested parent', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('region-a', { parent: 'root' })
      navigation.registerNode('region-b', { parent: 'root' })
      navigation.registerNode('content-grid', { parent: 'region-b' })
      navigation.registerNode('PID-X', { parent: 'content-grid' })
      navigation.registerNode('PID-Y', { parent: 'content-grid' })
      navigation.registerNode('PID-Z', { parent: 'content-grid' })

      expect(navigation.getTree()).toMatchObject({
        root: {
          children: {
            'region-a': {
              parent: 'root'
            },
            'region-b': {
              parent: 'root',
              children: {
                'content-grid': {
                  parent: 'region-b',
                  children: {
                    'PID-X': {
                      parent: 'content-grid'
                    },
                    'PID-Y': {
                      parent: 'content-grid'
                    },
                    'PID-Z': {
                      parent: 'content-grid'
                    }
                  }
                }
              }
            }
          }
        }
      })
    })

    // reword this
    test.only('registering a new node with a parent that has no children sets its parent.activeChild to itself', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('alpha', { parent: 'root' })
      navigation.registerNode('beta', { parent: 'root' })
      navigation.registerNode('charlie', { parent: 'alpha' })
      navigation.registerNode('delta', { parent: 'charlie' })
      navigation.registerNode('echo', { parent: 'root' })

      // 'root' should have 3 children and its activeChild should be 'alpha'
      // 'alpha' should have 1 children and its activeChild should be 'charlie'
      // 'charlie' should have 1 children and its activeChild should be 'delta'

      expect(navigation.getNode('root').activeChild).toEqual('alpha')
      expect(navigation.getNode('alpha').activeChild).toEqual('charlie')
      expect(navigation.getNode('charlie').activeChild).toEqual('delta')
    })
  })

  describe('getNode()', () => {
    test('get a nested node with no children by id', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('region-a', { parent: 'root' })
      navigation.registerNode('region-b', { parent: 'root' })
      navigation.registerNode('content-grid', { parent: 'region-b' })
      navigation.registerNode('PID-X', { action: 1, parent: 'content-grid' })
      navigation.registerNode('PID-Y', { action: 2, parent: 'content-grid' })
      navigation.registerNode('PID-Z', { action: 3, parent: 'content-grid' })

      const node = navigation.getNode('PID-X')

      expect(node).toMatchObject({
        action: 1,
        parent: 'content-grid'
      })
    })

    test('get a nested node with children by id and make sure the entire tree comes with it', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('region-a', { parent: 'root' })
      navigation.registerNode('DEAD-X', { action: 1, parent: 'region-a' })
      navigation.registerNode('DEAD-Y', { action: 2, parent: 'region-a' })
      navigation.registerNode('DEAD-Z', { action: 3, parent: 'region-a' })
      navigation.registerNode('region-b', { parent: 'root' })
      navigation.registerNode('content-grid', { parent: 'region-b' })
      navigation.registerNode('PID-X', { action: 1, parent: 'content-grid' })
      navigation.registerNode('PID-Y', { action: 2, parent: 'content-grid' })
      navigation.registerNode('PID-Z', { action: 3, parent: 'content-grid' })

      const node = navigation.getNode('region-b')

      expect(node).toMatchObject({
        parent: 'root',
        children: {
          'content-grid': {
            parent: 'region-b',
            children: {
              'PID-X': {
                parent: 'content-grid'
              },
              'PID-Y': {
                parent: 'content-grid'
              },
              'PID-Z': {
                parent: 'content-grid'
              }
            }
          }
        }
      })
    })
  })

  describe('unregisterNode()', () => {
    test('unregistering a leaf should remove it (set it to undefined)', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { selectAction: 1 })
      navigation.registerNode('NODE_A', { selectAction: 2 })
      navigation.registerNode('NODE_B', { selectAction: 3 })

      navigation.unregisterNode('NODE_A')

      expect(navigation.getTree()).toMatchObject({
        root: {
          selectAction: 1,
          children: {
            NODE_B: {
              selectAction: 3,
              parent: 'root'
            }
          }
        }
      })

      expect(navigation.getNode('NODE_A')).toEqual(undefined)

      expect(navigation.getNodePathList()).toEqual([
        'root',
        'root.children.NODE_B'
      ])
    })

    test('unregister a whole branch', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { selectAction: 1 })
      navigation.registerNode('BOX_A', { selectAction: 2 })
      navigation.registerNode('BOX_B', { selectAction: 3 })
      navigation.registerNode('NODE_1', { selectAction: 11, parent: 'BOX_A' })
      navigation.registerNode('NODE_2', { selectAction: 12, parent: 'BOX_A' })
      navigation.registerNode('NODE_3', { selectAction: 13, parent: 'BOX_A' })
      navigation.registerNode('NODE_4', { selectAction: 24, parent: 'BOX_B' })
      navigation.registerNode('NODE_5', { selectAction: 25, parent: 'BOX_B' })
      navigation.registerNode('NODE_6', { selectAction: 26, parent: 'BOX_B' })

      navigation.unregisterNode('BOX_B')

      expect(navigation.getTree()).toMatchObject({
        root: {
          selectAction: 1,
          children: {
            BOX_A: {
              selectAction: 2,
              parent: 'root',
              children: {
                NODE_1: {
                  selectAction: 11,
                  parent: 'BOX_A'
                },
                NODE_2: {
                  selectAction: 12,
                  parent: 'BOX_A'
                },
                NODE_3: {
                  selectAction: 13,
                  parent: 'BOX_A'
                }
              }
            }
          }
        }
      })

      expect(navigation.getNode('BOX_B')).toEqual(undefined)

      expect(navigation.getNodePathList()).toEqual([
        'root',
        'root.children.BOX_A',
        'root.children.BOX_A.children.NODE_1',
        'root.children.BOX_A.children.NODE_2',
        'root.children.BOX_A.children.NODE_3'
      ])
    })

    test('if unregistering the focused node, set focus to undefined (focused on the unregistered node)', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('BOX_A', { parent: 'root' })
      navigation.registerNode('BOX_B', { parent: 'root' })
      navigation.registerNode('NODE_1', { parent: 'BOX_A' })
      navigation.registerNode('NODE_2', { parent: 'BOX_A' })
      navigation.registerNode('NODE_3', { parent: 'BOX_A' })
      navigation.registerNode('NODE_4', { parent: 'BOX_B' })
      navigation.registerNode('NODE_5', { parent: 'BOX_B' })
      navigation.registerNode('NODE_6', { parent: 'BOX_B' })

      navigation.currentFocusNodePath = 'root.children.BOX_B'

      navigation.unregisterNode('BOX_B')

      expect(navigation.currentFocusNodePath).toEqual(undefined)
    })

    test('if unregistering the focused node, set focus to undefined (focused on a nested node of the unregistered node)', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('BOX_A', { parent: 'root' })
      navigation.registerNode('BOX_B', { parent: 'root' })
      navigation.registerNode('NODE_1', { parent: 'BOX_A' })
      navigation.registerNode('NODE_2', { parent: 'BOX_A' })
      navigation.registerNode('NODE_3', { parent: 'BOX_A' })
      navigation.registerNode('NODE_4', { parent: 'BOX_B' })
      navigation.registerNode('NODE_5', { parent: 'BOX_B' })
      navigation.registerNode('NODE_6', { parent: 'BOX_B' })

      navigation.currentFocusNodePath = 'root.children.BOX_B.children.NODE_4'
      navigation.unregisterNode('BOX_B')

      expect(navigation.currentFocusNodePath).toEqual(undefined)
    })

    test('unregistering a node should trigger a `blur` event with that node', () => {
      const navigation = new Lrud()
      const spy = jest.fn()
      navigation.on('blur', spy)
      navigation.registerNode('root')
      navigation.registerNode('BOX_A', { parent: 'root' })
      navigation.registerNode('BOX_B', { parent: 'root' })
      navigation.registerNode('NODE_1', { parent: 'BOX_A' })
      navigation.registerNode('NODE_2', { parent: 'BOX_A' })
      navigation.registerNode('NODE_3', { parent: 'BOX_A' })
      navigation.registerNode('NODE_4', { parent: 'BOX_B' })
      navigation.registerNode('NODE_5', { parent: 'BOX_B' })
      navigation.registerNode('NODE_6', { parent: 'BOX_B' })

      navigation.unregisterNode('BOX_B')

      expect(navigation.getTree()).toMatchObject({
        root: {
          children: {
            BOX_A: {
              parent: 'root',
              children: {
                NODE_1: {
                  parent: 'BOX_A'
                },
                NODE_2: {
                  parent: 'BOX_A'
                },
                NODE_3: {
                  parent: 'BOX_A'
                }
              }
            }
          }
        }
      })

      // should trigger with the details of BOX_B
      expect(spy).toHaveBeenCalledWith({
        parent: 'root',
        children: {
          NODE_4: {
            parent: 'BOX_B'
          },
          NODE_5: {
            parent: 'BOX_B'
          },
          NODE_6: {
            parent: 'BOX_B'
          }
        }
      })
    })
  })

  describe('isDirectionAndOrientationMatching()', () => {
    const navigation = new Lrud()
    test('vertical and up is true', () => {
      expect(navigation.isDirectionAndOrientationMatching('vertical', 'up')).toEqual(true)
    })
    test('vertical and down is true', () => {
      expect(navigation.isDirectionAndOrientationMatching('vertical', 'down')).toEqual(true)
    })
    test('horizontal and left is true', () => {
      expect(navigation.isDirectionAndOrientationMatching('horizontal', 'left')).toEqual(true)
    })
    test('horizontal and right is true', () => {
      expect(navigation.isDirectionAndOrientationMatching('horizontal', 'right')).toEqual(true)
    })
    test('vertical and left is false', () => {
      expect(navigation.isDirectionAndOrientationMatching('vertical', 'left')).toEqual(false)
    })
    test('vertical and right is false', () => {
      expect(navigation.isDirectionAndOrientationMatching('vertical', 'right')).toEqual(false)
    })
    test('horizontal and up is false', () => {
      expect(navigation.isDirectionAndOrientationMatching('horizontal', 'up')).toEqual(false)
    })
    test('horizontal and down is false', () => {
      expect(navigation.isDirectionAndOrientationMatching('horizontal', 'down')).toEqual(false)
    })
  })

  describe('pickNode()', () => {
    test('pick a nested node', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { selectAction: 1 })
      navigation.registerNode('BOX_A', { selectAction: 2 })
      navigation.registerNode('NODE_1', { selectAction: 11, parent: 'BOX_A' })
      navigation.registerNode('NODE_2', { selectAction: 12, parent: 'BOX_A' })
      navigation.registerNode('NODE_3', { selectAction: 13, parent: 'BOX_A' })

      const node2 = navigation.pickNode('NODE_2')

      expect(node2).toMatchObject({ selectAction: 12, parent: 'BOX_A' })
      expect(navigation.getTree()).toMatchObject({
        root: {
          selectAction: 1,
          children: {
            BOX_A: {
              selectAction: 2,
              parent: 'root',
              children: {
                NODE_1: {
                  selectAction: 11,
                  parent: 'BOX_A'
                },
                NODE_3: {
                  selectAction: 13,
                  parent: 'BOX_A'
                }
              }
            }
          }
        }
      })
    })
  })

  describe('_isFocusableNode()', () => {
    test('returns true for a node with a select action (`selectAction`)', () => {
      const node = { selectAction: true, parent: 'root' }
      const navigation = new Lrud()

      expect(navigation._isFocusableNode(node)).toEqual(true)
    })

    test('returns true for a node with is focusable (`isFocusable`)', () => {
      const node = { isFocusable: true, parent: 'root' }
      const navigation = new Lrud()

      expect(navigation._isFocusableNode(node)).toEqual(true)
    })

    test('returns false for a node with neither', () => {
      const node = { parent: 'root' }
      const navigation = new Lrud()

      expect(navigation._isFocusableNode(node)).toEqual(false)
    })
  })

  describe.skip('assignFocus()', () => {
    test('assigning focus should set the `activeChild` of all the nodes back up the tree', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('region-a', { parent: 'root' })
      navigation.registerNode('region-b', { parent: 'root' })
      navigation.registerNode('content-grid', { parent: 'region-b' })
      navigation.registerNode('PID-X', { selectAction: 1, parent: 'content-grid' })
      navigation.registerNode('PID-Y', { selectAction: 2, parent: 'content-grid' })
      navigation.registerNode('PID-Z', { selectAction: 3, parent: 'content-grid' })

      navigation.assignFocus('PID-Y')

      expect(navigation.getNode('content-grid').activeChild).toEqual('PID-Y')
      expect(navigation.getNode('region-b').activeChild).toEqual('content-grid')
      expect(navigation.getNode('root').activeChild).toEqual('region-b')
    })
  })

  describe('_findNextActionableNode()', () => {
    test('scan up the tree 1 level', () => {
      const navigation = new Lrud()

      navigation.registerNode('root', { orientation: 'vertical' })
      navigation.registerNode('BOX_A', { parent: 'root', orientation: 'horizontal' })
      navigation.registerNode('BOX_B', { parent: 'root', orientation: 'horizontal' })
      navigation.registerNode('NODE_1', { selectAction: 11, parent: 'BOX_B', order: 1 })
      navigation.registerNode('NODE_2', { selectAction: 12, parent: 'BOX_B', order: 2 })
      navigation.registerNode('NODE_3', { selectAction: 13, parent: 'BOX_B', order: 3 })

      navigation.currentFocusNodePath = 'root.children.BOX_B.children.NODE_2'

      const nextActionableNode = navigation._findNextActionableNode('root.children.BOX_B.children.NODE_2', 'right')

      // the representation of BOX_B
      expect(nextActionableNode).toMatchObject({
        parent: 'root',
        orientation: 'horizontal',
        children: {
          NODE_1: {
            selectAction: 11,
            parent: 'BOX_B',
            order: 1
          },
          NODE_2: {
            selectAction: 12,
            parent: 'BOX_B',
            order: 2
          },
          NODE_3: {
            selectAction: 13,
            parent: 'BOX_B',
            order: 3
          }
        }
      })
    })

    test.only('scan up the tree 2 levels', () => {
      const navigation = new Lrud()
      navigation.registerNode('root', { orientation: 'vertical' })
      navigation.registerNode('page', { id: 'page', parent: 'root', orientation: 'horizontal' })
      navigation.registerNode('BOX_A', { id: 'BOX_A', parent: 'page', orientation: 'vertical' })
      navigation.registerNode('BOX_B', { id: 'BOX_B', parent: 'page', orientation: 'vertical' })
      navigation.registerNode('NODE_1', { selectAction: 11, parent: 'BOX_A', order: 1 })
      navigation.registerNode('NODE_2', { selectAction: 12, parent: 'BOX_A', order: 2 })
      navigation.registerNode('NODE_3', { selectAction: 13, parent: 'BOX_A', order: 3 })
      navigation.registerNode('NODE_4', { selectAction: 21, parent: 'BOX_B', order: 1 })
      navigation.registerNode('NODE_5', { selectAction: 22, parent: 'BOX_B', order: 2 })
      navigation.registerNode('NODE_6', { selectAction: 23, parent: 'BOX_B', order: 3 })
      navigation.currentFocusNodePath = 'root.children.page.children.BOX_A.children.NODE_1'

      const nextActionableNode = navigation._findNextActionableNode('root.children.page.children.BOX_A.children.NODE_1', 'right')

      // the parent of NODE_1 is BOX_A but we couldn't dig up to that because it was horizontal
      // and the next thing that was horizontal was the page
      expect(nextActionableNode.id).toEqual('page')
    })
  })
})
