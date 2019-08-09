/* eslint-env jest */

const { Lrud } = require('./index')

describe('Focusing on empty nodes', () => {
  it('when focusing on branch, should jump to first child with focusable nodes', () => {
    const nav = new Lrud()

    nav.registerNode('root', { orientation: 'vertical' })

    nav.registerNode('branch1', { orientation: 'horizontal' })
    nav.registerNode('branch2', { orientation: 'horizontal' })

    nav.register('item', {
      parent: 'branch2',
      isFocusable: true
    })

    nav.assignFocus('root')

    expect(nav.currentFocusNodeId).toEqual('item')
  })

  it('when focusing on branch, should jump to first child with focusable nodes - multiple empty preceding siblings', () => {
    const nav = new Lrud()

    nav.registerNode('root', { orientation: 'vertical' })

    nav.registerNode('branch1', { orientation: 'horizontal' })
    nav.registerNode('branch2', { orientation: 'horizontal' })
    nav.registerNode('branch3', { orientation: 'horizontal' })
    nav.registerNode('branch4', { orientation: 'horizontal' })

    nav.register('item', {
      parent: 'branch4',
      isFocusable: true
    })

    nav.assignFocus('root')

    expect(nav.currentFocusNodeId).toEqual('item')
  })

  it('find focusable node when dead branches first', () => {
    const nav = new Lrud()

    nav.registerNode('root', { orientation: 'vertical' })

    nav.registerNode('branch1', { orientation: 'horizontal' })
    nav.registerNode('branch2', { orientation: 'horizontal', parent: 'branch1' })
    nav.registerNode('branch3', { orientation: 'horizontal', parent: 'branch2' })

    nav.registerNode('branch4', { orientation: 'horizontal' })

    nav.register('item', {
      parent: 'branch4',
      isFocusable: true
    })

    nav.assignFocus('root')

    expect(nav.currentFocusNodeId).toEqual('item')
  })

  it('find focusable node when multiple dead branches first', () => {
    const nav = new Lrud()

    nav.registerNode('root', { orientation: 'vertical' })

    nav.registerNode('branch1', { orientation: 'horizontal' })
    nav.registerNode('branch2', { orientation: 'horizontal', parent: 'branch1' })
    nav.registerNode('branch3', { orientation: 'horizontal', parent: 'branch2' })

    nav.registerNode('branch4', { orientation: 'horizontal' })
    nav.registerNode('branch5', { orientation: 'horizontal', parent: 'branch4' })
    nav.registerNode('branch6', { orientation: 'horizontal', parent: 'branch5' })

    nav.registerNode('branch7', { orientation: 'horizontal' })

    nav.register('item', {
      parent: 'branch7',
      isFocusable: true
    })

    nav.assignFocus('root')

    expect(nav.currentFocusNodeId).toEqual('item')
  })

  it('if assigning focus on a branch that has no focusable children, throw exception', () => {
    const nav = new Lrud()

    nav.registerNode('root', { orientation: 'vertical' })

    nav.registerNode('branch1', { orientation: 'horizontal' })
    nav.registerNode('branch2', { orientation: 'horizontal', parent: 'branch1' })
    nav.registerNode('branch3', { orientation: 'horizontal', parent: 'branch2' })

    nav.registerNode('branch4', { orientation: 'horizontal' })
    nav.registerNode('branch5', { orientation: 'horizontal', parent: 'branch4' })
    nav.registerNode('branch6', { orientation: 'horizontal', parent: 'branch5' })

    expect(() => {
      nav.assignFocus('root')
    }).toThrow()
  })
})
