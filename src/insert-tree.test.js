/* eslint-env jest */
const { Lrud } = require('./index')

describe('insertTree()', () => {
  test('insert a simple tree into an empty instance', () => {
    const instance = new Lrud()
    const tree = {
      root: {
        orientation: 'horizontal',
        children: {
          node_a: {
            isFocusable: true
          },
          node_b: {
            isFocusable: true
          }
        }
      }
    }

    instance.insertTree(tree)
    instance.assignFocus('node_a')

    expect(instance.tree['root']).toBeTruthy()
    expect(instance.tree['root'].children['node_a']).toBeTruthy()
    expect(instance.tree['root'].children['node_b']).toBeTruthy()
    expect(instance.currentFocusNodeId).toEqual('node_a')
  })

  test('insert a simple tree into an existing branch of lrud', () => {
    const tree = {
      alpha: {
        orientation: 'horizontal',
        children: {
          node_a: {
            isFocusable: true
          },
          node_b: {
            isFocusable: true
          }
        }
      }
    }

    const instance = new Lrud()

    instance
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('alpha', { isFocusable: true })
      .registerNode('beta', { isFocusable: true })

    expect(instance.tree['root']).toBeTruthy()
    expect(instance.tree['root'].children['alpha']).toBeTruthy()
    expect(instance.tree['root'].children['alpha'].isFocusable).toEqual(true)
    expect(instance.tree['root'].children['alpha'].children).toEqual(undefined)
    expect(instance.tree['root'].children['beta']).toBeTruthy()
    expect(instance.tree['root'].children['beta'].isFocusable).toEqual(true)
    expect(instance.tree['root'].children['beta'].children).toEqual(undefined)

    instance.insertTree(tree)

    expect(instance.tree['root']).toBeTruthy()
    expect(instance.tree['root'].children['alpha']).toBeTruthy()
    expect(instance.tree['root'].children['alpha'].children['node_a'].isFocusable).toEqual(true)
    expect(instance.tree['root'].children['alpha'].children['node_b'].isFocusable).toEqual(true)
    expect(instance.tree['root'].children['beta']).toBeTruthy()
    expect(instance.tree['root'].children['beta'].isFocusable).toEqual(true)
    expect(instance.tree['root'].children['beta'].children).toEqual(undefined)
  })

  test('simple tree, inserting into existing branch, maintain index order', () => {
    const tree = {
      beta: {
        orientation: 'horizontal',
        children: {
          node_a: {
            isFocusable: true
          },
          node_b: {
            isFocusable: true
          }
        }
      }
    }

    const instance = new Lrud()

    instance
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('alpha', { isFocusable: true })
      .registerNode('beta', { isFocusable: true })
      .registerNode('charlie', { isFocusable: true })

    expect(instance.tree['root'].children['alpha'].index).toEqual(0)
    expect(instance.tree['root'].children['beta'].index).toEqual(1)
    expect(instance.tree['root'].children['charlie'].index).toEqual(2)

    instance.insertTree(tree)

    expect(instance.tree['root'].children['alpha'].index).toEqual(0)
    expect(instance.tree['root'].children['beta'].index).toEqual(1)
    expect(instance.tree['root'].children['charlie'].index).toEqual(2)
  })

  test('simple tree, inserting into existing branch, DONT maintain index order', () => {
    const tree = {
      beta: {
        orientation: 'horizontal',
        children: {
          node_a: {
            isFocusable: true
          },
          node_b: {
            isFocusable: true
          }
        }
      }
    }

    const instance = new Lrud()

    instance
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('alpha', { isFocusable: true })
      .registerNode('beta', { isFocusable: true })
      .registerNode('charlie', { isFocusable: true })

    expect(instance.tree['root'].children['alpha'].index).toEqual(0)
    expect(instance.tree['root'].children['beta'].index).toEqual(1)
    expect(instance.tree['root'].children['charlie'].index).toEqual(2)

    instance.insertTree(tree, { maintainIndex: false })

    // note that beta is now at the end, as it was picked and re-inserted
    expect(instance.tree['root'].children['alpha'].index).toEqual(0)
    expect(instance.tree['root'].children['charlie'].index).toEqual(1)
    expect(instance.tree['root'].children['beta'].index).toEqual(2)
  })

  test('insert a tree under the root node of the existing tree, as no parent given on the top node of the tree', () => {
    const tree = {
      charlie: {
        orientation: 'horizontal',
        children: {
          node_a: {
            isFocusable: true
          },
          node_b: {
            isFocusable: true
          }
        }
      }
    }

    const instance = new Lrud()

    instance
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('alpha', { isFocusable: true })
      .registerNode('beta', { isFocusable: true })

    instance.insertTree(tree)

    expect(instance.tree['root'].children['alpha']).toBeTruthy()
    expect(instance.tree['root'].children['beta']).toBeTruthy()
    expect(instance.tree['root'].children['charlie']).toBeTruthy()
    expect(instance.tree['root'].children['charlie'].children).toBeTruthy()

    expect(instance.tree['root'].children['alpha'].index).toEqual(0)
    expect(instance.tree['root'].children['beta'].index).toEqual(1)
    expect(instance.tree['root'].children['charlie'].index).toEqual(2)
  })

  test('insert a tree under a branch that ISNT the root node', () => {
    const tree = {
      charlie: {
        parent: 'beta',
        orientation: 'horizontal',
        children: {
          node_a: {
            isFocusable: true
          },
          node_b: {
            isFocusable: true
          }
        }
      }
    }

    const instance = new Lrud()

    instance
      .registerNode('root', { orientation: 'horizontal' })
      .registerNode('alpha', { isFocusable: true })
      .registerNode('beta', { orientation: 'vertical' })

    instance.insertTree(tree)

    expect(instance.tree['root'].children['alpha']).toBeTruthy()
    expect(instance.tree['root'].children['beta']).toBeTruthy()
    expect(instance.tree['root'].children['beta'].children['charlie']).toBeTruthy()
    expect(instance.tree['root'].children['beta'].children['charlie'].children).toBeTruthy()
  })

  /**
   * @see https://github.com/bbc/lrud/issues/84
   */
  test('should correctly maintain index when replacing first child', () => {
    const navigation = new Lrud()

    navigation.registerNode('root')
    navigation.registerNode('a')
    navigation.registerNode('b')
    navigation.registerNode('c')

    navigation.insertTree({
      a: {
        isFocusable: true
      }
    })

    // expect top node was replaced with inserted tree
    expect(navigation.getNode('a').isFocusable).toEqual(true)

    // expect index of the top node parent is maintained
    expect(navigation.getNode('a').index).toEqual(0)
  })

  test('coherent index, keep parent\'s children indices coherent if index is not maintained', () => {
    const navigation = new Lrud()

    navigation.registerNode('root')
    navigation.registerNode('a')
    navigation.registerNode('b')
    navigation.registerNode('c')
    navigation.registerNode('d')

    navigation.insertTree({
      c: {
        index: 1,
        isFocusable: true
      }
    }, { maintainIndex: false })

    // expect top node was replaced with inserted tree
    expect(navigation.getNode('c').isFocusable).toEqual(true)

    // original 'c' was unregistered, so 'd' was shifted down to '2',
    // but than new 'c' was inserted at '1', so 'd' was shifted up back to '3' and 'b' was shifted up to '2'
    expect(navigation.getNode('a').index).toEqual(0)
    expect(navigation.getNode('b').index).toEqual(2)
    expect(navigation.getNode('c').index).toEqual(1)
    expect(navigation.getNode('d').index).toEqual(3)
  })

  test('coherent index, should maintain original child index overriding provided index', () => {
    const navigation = new Lrud()

    navigation.registerNode('root')
    navigation.registerNode('a')
    navigation.registerNode('b')

    navigation.insertTree({
      a: {
        index: 5,
        isFocusable: true
      }
    })

    // expect top node was replaced with inserted tree
    expect(navigation.getNode('a').isFocusable).toEqual(true)

    // existing 'a' node was unregistered, but its index is reassigned and kept by re-registered 'a' node
    expect(navigation.getNode('a').index).toEqual(0)
  })
})
