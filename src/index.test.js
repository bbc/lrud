/* eslint-env jest */

const Lrud = require('./index')

describe('lrud', () => {
  describe('registerNode()', () => {
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

      expect(navigation.getNodeIdList()).toEqual([
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

      expect(navigation.getNodeIdList()).toEqual([
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
})
