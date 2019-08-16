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

  it('should handle a move to an empty branch - vertical - dont change the focus', () => {
    const nav = new Lrud()

    nav.registerNode('root', {
      orientation: 'vertical'
    })

    nav.registerNode('node1', {
      orientation: 'horizontal',
      parent: 'root'
    })

    nav.registerNode('node2', {
      orientation: 'horizontal',
      parent: 'root'
    })

    nav.register('item1', {
      parent: 'node1',
      selectAction: {}
    })

    nav.assignFocus('root')

    nav.handleKeyEvent({ direction: 'down' })

    expect(nav.currentFocusNodeId).toEqual('item1')
  })

  it('should handle a move to an empty branch - vertical - dont change the focus', () => {
    const nav = new Lrud()

    nav.registerNode('root', {
      orientation: 'horizontal'
    })

    nav.registerNode('node1', {
      orientation: 'horizontal',
      parent: 'root'
    })

    nav.registerNode('node2', {
      orientation: 'horizontal',
      parent: 'root'
    })

    nav.register('item1', {
      parent: 'node1',
      selectAction: {}
    })

    nav.assignFocus('root')

    expect(nav.currentFocusNodeId).toEqual('item1')

    nav.handleKeyEvent({ direction: 'right' })

    expect(nav.currentFocusNodeId).toEqual('item1')
  })

  it('should jump over empty branches when moving - vertical', () => {
    const nav = new Lrud()

    nav.registerNode('root', {
      orientation: 'vertical'
    })

    nav.registerNode('node1', {
      orientation: 'horizontal',
      parent: 'root'
    })

    nav.registerNode('node2', {
      orientation: 'horizontal',
      parent: 'root'
    })

    nav.registerNode('node3', {
      orientation: 'horizontal',
      parent: 'root'
    })

    nav.register('item1', {
      parent: 'node1',
      isFocusable: true
    })

    nav.register('item3', {
      parent: 'node3',
      isFocusable: true
    })

    nav.assignFocus('root')

    nav.handleKeyEvent({ direction: 'down' })
  })

  it('should jump over multiple empty branches - vertical', () => {
    const nav = new Lrud()

    nav.registerNode('root', { orientation: 'vertical' })

    nav
      .registerNode('branch1', { orientation: 'horizontal' })
      .registerNode('item1', { parent: 'branch1', isFocusable: true })

    nav.registerNode('branch2', { orientation: 'horizontal' })
    nav.registerNode('branch3', { orientation: 'horizontal' })

    nav
      .registerNode('branch4', { orientation: 'horizontal' })
      .registerNode('item4', { parent: 'branch4', isFocusable: true })

    nav.assignFocus('root')
    expect(nav.currentFocusNodeId).toEqual('item1')

    nav.handleKeyEvent({ direction: 'down' })

    expect(nav.currentFocusNodeId).toEqual('item4')
  })

  it('should jump over multiple empty branches - horizontal', () => {
    const nav = new Lrud()

    nav.registerNode('root', { orientation: 'horizontal' })

    nav
      .registerNode('branch1', { orientation: 'horizontal' })
      .registerNode('item1', { parent: 'branch1', isFocusable: true })

    nav.registerNode('branch2', { orientation: 'horizontal' })
    nav.registerNode('branch3', { orientation: 'horizontal' })

    nav
      .registerNode('branch4', { orientation: 'horizontal' })
      .registerNode('item4', { parent: 'branch4', isFocusable: true })

    nav.assignFocus('root')
    expect(nav.currentFocusNodeId).toEqual('item1')

    nav.handleKeyEvent({ direction: 'right' })

    expect(nav.currentFocusNodeId).toEqual('item4')
  })
})
