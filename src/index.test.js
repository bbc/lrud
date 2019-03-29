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

    test('registering a node with a parent that doesnt exist should create a node for that parent under the root container', () => {
      const navigation = new Lrud()

      navigation.registerNode('root')
      navigation.registerNode('region-a')
      navigation.registerNode('content-grid', { parent: 'region-b' })
      navigation.registerNode('PID-X', { parent: 'content-grid' })

      expect(navigation.getTree()).toMatchObject({
        root: {
          children: {
            'region-a': {
              parent: 'root'
            },
            'region-b': {
              children: {
                'content-grid': {
                  parent: 'region-b',
                  children: {
                    'PID-X': {
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

      const node = navigation.pickNode('root.region.contentgrid')

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
})
