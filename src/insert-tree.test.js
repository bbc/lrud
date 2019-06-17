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
})
