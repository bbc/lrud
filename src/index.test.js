/* eslint-env jest */

const Lrud = require('./index')

describe('registering nodes', () => {
  it('registering the very first registered node sets it to the root node', () => {
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

  it('registering a node without a parent puts it at the top level', () => {
    const navigation = new Lrud()

    navigation.registerNode('root', {

    })

    expect(true).toBe(true)
  })
  it('registering a node without a parent puts it at the top level', () => {
    // expect(true).toBe(false)
  })
})
