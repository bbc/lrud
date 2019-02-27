/* eslint-env jest */

const Lrud = require('../src')
const KeyCodes = require('../src/key-codes')
const data = require('./data.json')

describe('Given an instance of Lrud', () => {
  let navigation

  beforeEach(() => {
    Lrud.KEY_MAP = KeyCodes.map
    Lrud.KEY_CODES = KeyCodes.codes
    navigation = new Lrud()
  })

  const noop = () => {}
  const toJSON = (o) => JSON.parse(JSON.stringify(o))

  describe('register', () => {
    it('should throw an error when attempting to register without an id', () => {
      expect(() => navigation.register()).toThrowError('Attempting to register with an invalid id')
    })

    it('should register a node as expected', () => {
      navigation.register('root')

      expect(toJSON(navigation.nodes)).toEqual({
        root: {
          id: 'root',
          children: []
        }
      })
    })

    it('should assign new props on subsequent registrations', () => {
      navigation.register('root')
      navigation.register('root', { orientation: 'horizontal' })

      expect(toJSON(navigation.nodes)).toEqual({
        root: {
          id: 'root',
          children: [],
          orientation: 'horizontal'
        }
      })
    })

    it('should crate the parent/child relationship as expected', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })

      expect(navigation.nodes.root.children).toEqual([ 'child' ])
      expect(navigation.nodes.child.parent).toEqual('root')
    })

    it('should maintain the child order if a node is registered multiple times', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.register('child', { parent: 'root' })

      expect(navigation.nodes.root.children).toEqual([
        'child',
        'child2'
      ])
    })
  })

  describe('unregister', () => {
    it('should remove a node as expected', () => {
      navigation.register('root')
      navigation.unregister('root')

      expect(navigation.nodes.root).toBeUndefined()
    })

    it('should undo the parent/child relationship as expected', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.unregister('child')

      expect(navigation.nodes.root.children).toEqual([])
    })

    it('should remove the children of the unregistered node', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.unregister('root')

      expect(navigation.nodes.child).toBeUndefined()
      expect(navigation.nodes.child2).toBeUndefined()
    })

    it('should blur the currentFocus node if it is the node being unregistered', () => {
      const spy = jest.fn()

      navigation.on('blur', spy)
      navigation.register('root')
      navigation.currentFocus = 'root'
      navigation.unregister('root')

      expect(navigation.currentFocus).toBeUndefined()
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        id: 'root'
      }))
    })

    it('should not blur the currentFocus node if it is not the node being unregistered', () => {
      const spy = jest.fn()

      navigation.currentFocus = 'child'
      navigation.on('blur', spy)
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.unregister('child2')

      expect(navigation.currentFocus).toEqual('child')
      expect(spy).not.toHaveBeenCalled()
    })

    it('should unset the activeChild of the parent if the unregisted node is the currect active child', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.nodes.root.activeChild = 'child2'
      navigation.unregister('child2')

      expect(navigation.nodes.root.activeChild).toBeUndefined()
    })
  })

  describe('blur', () => {
    it('should emit the blur event as expected', () => {
      const spy = jest.fn()
      const onBlur = jest.fn()

      navigation.on('blur', spy)
      navigation.register('root', { onBlur })
      navigation.blur('root')

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'root' }))
      expect(onBlur).toHaveBeenCalledWith(expect.objectContaining({ id: 'root' }))
    })

    it('should blur the currentFocus node if no arguments are provided', () => {
      const spy = jest.fn()

      navigation.currentFocus = 'child'
      navigation.on('blur', spy)
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.blur()

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        id: 'child'
      }))
    })
  })

  describe('focus', () => {
    it('should emit the focus event as expected', () => {
      const spy = jest.fn()
      const onFocus = jest.fn()

      navigation.on('focus', spy)
      navigation.register('root', { onFocus })
      navigation.focus('root')

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'root' }))
      expect(onFocus).toHaveBeenCalledWith(expect.objectContaining({ id: 'root' }))
    })

    it('should focus down the tree to the first focusable child', () => {
      const spy = jest.fn()

      navigation.on('focus', spy)
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.focus('root')

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        id: 'child'
      }))
    })

    it('should update the currentFocus prop as expected', () => {
      const spy = jest.fn()

      navigation.on('focus', spy)
      navigation.register('root')
      navigation.register('child', { parent: 'root' })

      expect(navigation.currentFocus).toBeFalsy()

      navigation.focus('root')

      expect(navigation.currentFocus).toEqual('child')
    })

    it('should focus the currentFocus node if no id is provided', () => {
      const spy = jest.fn()

      navigation.currentFocus = 'child2'
      navigation.on('focus', spy)
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.focus()

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        id: 'child2'
      }))
    })

    it('should focus the root node if no id is provided and there is no currentFocus', () => {
      const spy = jest.fn()

      navigation.on('focus', spy)
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.focus()

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        id: 'child'
      }))
    })

    it('should emit a blur event for the previously focused node', () => {
      const spy = jest.fn()

      navigation.currentFocus = 'child'
      navigation.on('blur', spy)
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.focus('child2')

      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        id: 'child'
      }))
    })

    it('should set the activeChild property up the tree as expected', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.register('child-of-child2', { parent: 'child2' })

      navigation.focus('root')

      expect(navigation.nodes.root.activeChild).toEqual('child')

      navigation.focus('child-of-child2')

      expect(navigation.nodes.child2.activeChild).toEqual('child-of-child2')
      expect(navigation.nodes.root.activeChild).toEqual('child2')
    })

    it('should emit the active event as expected', () => {
      const spy = jest.fn()

      navigation.on('active', spy)
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child-of-child', { parent: 'child' })
      navigation.focus('child-of-child')

      expect(spy).toHaveBeenCalledTimes(2)
      expect(spy.mock.calls[0][0]).toEqual(expect.objectContaining({ id: 'child-of-child' }))
      expect(spy.mock.calls[1][0]).toEqual(expect.objectContaining({ id: 'child' }))
    })

    it('should emit the inactive event as expected', () => {
      const spy = jest.fn()

      navigation.on('inactive', spy)
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.focus('child')
      navigation.focus('child2')

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'child' }))
    })
  })

  describe('handleKeyEvent', () => {
    it('should emit the select event as expected', () => {
      const spy = jest.fn()
      const onSelect = jest.fn()

      navigation.on('select', spy)
      navigation.register('root')
      navigation.register('child', { parent: 'root', onSelect })
      navigation.focus('child')
      navigation.handleKeyEvent({ keyCode: 13 })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'child' }))
      expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: 'child' }))
    })

    it('should emit the move event as expected', () => {
      const spy = jest.fn()
      const onMove = jest.fn()

      navigation.on('move', spy)
      navigation.register('root', { orientation: 'vertical', onMove })
      navigation.register('child1', { parent: 'root', selectAction: true })
      navigation.register('child2', { parent: 'root', selectAction: true })
      navigation.focus()
      navigation.handleKeyEvent({ keyCode: 40, stopPropagation: noop })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({ id: 'root' }))
      expect(onMove).toHaveBeenCalledWith(expect.objectContaining({ id: 'root' }))
    })

    it('should move through a horizontal list as expected', () => {
      const stopPropagationSpy = jest.fn()
      const focusSpy = jest.fn()
      const moveSpy = jest.fn()

      navigation.currentFocus = 'child1'
      navigation.on('focus', focusSpy)
      navigation.on('move', moveSpy)
      navigation.register('root', { orientation: 'horizontal' })
      navigation.register('child1', { parent: 'root', selectAction: true })
      navigation.register('child2', { parent: 'root', selectAction: true })
      navigation.register('child3', { parent: 'root', selectAction: true, disabled: true })
      navigation.register('child4', { parent: 'root', selectAction: true })

      // RIGHT
      navigation.handleKeyEvent({ keyCode: 39, stopPropagation: stopPropagationSpy }) // Focus child2
      navigation.handleKeyEvent({ keyCode: 39, stopPropagation: stopPropagationSpy }) // Focus child4
      navigation.handleKeyEvent({ keyCode: 39, stopPropagation: stopPropagationSpy }) // Edge

      // LEFT
      navigation.handleKeyEvent({ keyCode: 37, stopPropagation: stopPropagationSpy }) // Focus child2
      navigation.handleKeyEvent({ keyCode: 37, stopPropagation: stopPropagationSpy }) // Focus child1
      navigation.handleKeyEvent({ keyCode: 37, stopPropagation: stopPropagationSpy }) // Edge

      expect(stopPropagationSpy).toHaveBeenCalledTimes(4)
      expect(focusSpy.mock.calls).toEqual([
        [ expect.objectContaining({ id: 'child2' }) ],
        [ expect.objectContaining({ id: 'child4' }) ],
        [ expect.objectContaining({ id: 'child2' }) ],
        [ expect.objectContaining({ id: 'child1' }) ]
      ])

      expect(toJSON(moveSpy.mock.calls)).toEqual(data.horizontalMove)
    })

    it('should move through a vertical list as expected', () => {
      const stopPropagationSpy = jest.fn()
      const focusSpy = jest.fn()
      const moveSpy = jest.fn()

      navigation.currentFocus = 'child1'
      navigation.on('focus', focusSpy)
      navigation.on('move', moveSpy)
      navigation.register('root', { orientation: 'vertical' })
      navigation.register('child1', { parent: 'root', selectAction: true })
      navigation.register('child2', { parent: 'root', selectAction: true })
      navigation.register('child3', { parent: 'root', selectAction: true, disabled: true })
      navigation.register('child4', { parent: 'root', selectAction: true })

      // DOWN
      navigation.handleKeyEvent({ keyCode: 40, stopPropagation: stopPropagationSpy }) // Focus child2
      navigation.handleKeyEvent({ keyCode: 40, stopPropagation: stopPropagationSpy }) // Focus child4
      navigation.handleKeyEvent({ keyCode: 40, stopPropagation: stopPropagationSpy }) // Edge

      // UP
      navigation.handleKeyEvent({ keyCode: 38, stopPropagation: stopPropagationSpy }) // Focus child2
      navigation.handleKeyEvent({ keyCode: 38, stopPropagation: stopPropagationSpy }) // Focus child1
      navigation.handleKeyEvent({ keyCode: 38, stopPropagation: stopPropagationSpy }) // Edge

      expect(stopPropagationSpy).toHaveBeenCalledTimes(4)
      expect(focusSpy.mock.calls).toEqual([
        [ expect.objectContaining({ id: 'child2' }) ],
        [ expect.objectContaining({ id: 'child4' }) ],
        [ expect.objectContaining({ id: 'child2' }) ],
        [ expect.objectContaining({ id: 'child1' }) ]
      ])

      expect(toJSON(moveSpy.mock.calls)).toEqual(data.verticalMove)
    })

    it('should move through a wrapping list as expected', () => {
      const focusSpy = jest.fn()

      navigation.currentFocus = 'child1'
      navigation.on('focus', focusSpy)
      navigation.register('root', { orientation: 'horizontal', wrapping: true })
      navigation.register('child1', { parent: 'root', selectAction: true })
      navigation.register('child2', { parent: 'root', selectAction: true })
      navigation.register('child3', { parent: 'root', selectAction: true })
      // RIGHT
      navigation.handleKeyEvent({ keyCode: 39, stopPropagation: noop }) // Focus child2
      navigation.handleKeyEvent({ keyCode: 39, stopPropagation: noop }) // Focus child3
      navigation.handleKeyEvent({ keyCode: 39, stopPropagation: noop }) // Focus child1

      expect(focusSpy.mock.calls).toEqual([
        [ expect.objectContaining({ id: 'child2' }) ],
        [ expect.objectContaining({ id: 'child3' }) ],
        [ expect.objectContaining({ id: 'child1' }) ]
      ])
    })

    it('should move through a grid as expected', () => {
      const focusSpy = jest.fn()

      navigation.register('root', { orientation: 'vertical' })
      navigation.register('row1', { orientation: 'horizontal', parent: 'root', grid: true, selectAction: true })
      navigation.register('row2', { orientation: 'horizontal', parent: 'root', grid: true, selectAction: true })
      navigation.register('row1-child1', { parent: 'row1', selectAction: true })
      navigation.register('row1-child2', { parent: 'row1', selectAction: true })
      navigation.register('row1-child3', { parent: 'row1', selectAction: true })
      navigation.register('row2-child1', { parent: 'row2', selectAction: true })
      navigation.register('row2-child2', { parent: 'row2', selectAction: true })
      navigation.register('row2-child3', { parent: 'row2', selectAction: true })
      navigation.focus()
      navigation.on('focus', focusSpy)
      navigation.handleKeyEvent({ keyCode: 39, stopPropagation: noop }) // RIGHT
      navigation.handleKeyEvent({ keyCode: 40, stopPropagation: noop }) // DOWN
      navigation.handleKeyEvent({ keyCode: 39, stopPropagation: noop }) // RIGHT
      navigation.handleKeyEvent({ keyCode: 38, stopPropagation: noop }) // UP

      expect(focusSpy.mock.calls).toEqual([
        [ expect.objectContaining({ id: 'row1-child2' }) ],
        [ expect.objectContaining({ id: 'row2-child2' }) ],
        [ expect.objectContaining({ id: 'row2-child3' }) ],
        [ expect.objectContaining({ id: 'row1-child3' }) ]
      ])
    })

    it('should move through a grid as expected when a row contains fewer items', () => {
      const focusSpy = jest.fn()

      navigation.register('root', { orientation: 'vertical' })
      navigation.register('row1', { orientation: 'horizontal', parent: 'root', grid: true })
      navigation.register('row2', { orientation: 'horizontal', parent: 'root', grid: true })
      navigation.register('row1-child1', { parent: 'row1' })
      navigation.register('row1-child2', { parent: 'row1' })
      navigation.register('row1-child3', { parent: 'row1' })
      navigation.register('row2-child1', { parent: 'row2' })
      navigation.register('row2-child2', { parent: 'row2' })
      navigation.focus('row1-child3')
      navigation.on('focus', focusSpy)
      navigation.handleKeyEvent({ keyCode: 40, stopPropagation: noop }) // DOWN

      expect(focusSpy).toHaveBeenCalledWith(expect.objectContaining({
        id: 'row2-child2'
      }))
    })

    it('should move through a grid as expected when a non-grid row is navigated to', () => {
      const focusSpy = jest.fn()

      navigation.register('root', { orientation: 'vertical' })
      navigation.register('row1', { orientation: 'horizontal', parent: 'root', grid: true })
      navigation.register('row2', { orientation: 'horizontal', parent: 'root', grid: true })
      navigation.register('row3', { orientation: 'horizontal', parent: 'root', grid: false })
      navigation.register('row1-child1', { parent: 'row1' })
      navigation.register('row1-child2', { parent: 'row1' })
      navigation.register('row1-child3', { parent: 'row1' })
      navigation.register('row2-child1', { parent: 'row2' })
      navigation.register('row2-child2', { parent: 'row2' })
      navigation.register('row2-child3', { parent: 'row2' })
      navigation.register('row3-child1', { parent: 'row3' })
      navigation.register('row3-child2', { parent: 'row3' })
      navigation.register('row3-child3', { parent: 'row3' })
      navigation.focus('row2-child3')
      navigation.on('focus', focusSpy)
      navigation.handleKeyEvent({ keyCode: 40, stopPropagation: noop }) // DOWN

      expect(focusSpy).toHaveBeenCalledWith(expect.objectContaining({
        id: 'row3-child1'
      }))
    })
  })

  describe('destroy', () => {
    it('should teardown as expected', () => {
      const focusSpy = jest.fn()
      const blurSpy = jest.fn()

      navigation.on('focus', focusSpy)
      navigation.on('blur', blurSpy)
      navigation.register('root')
      navigation.currentFocus = 'root'
      navigation.destroy()
      navigation.emit('focus')
      navigation.emit('blur')

      expect(navigation.nodes).toEqual({})
      expect(navigation.root).toBeFalsy()
      expect(navigation.currentFocus).toBeFalsy()
      expect(focusSpy).not.toHaveBeenCalled()
      expect(blurSpy).not.toHaveBeenCalled()
    })
  })

  describe('setActiveChild', () => {
    it('should set the activeChild as expected', () => {
      navigation.register('root')
      navigation.register('child1', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.setActiveChild('root', 'child2')

      expect(navigation.nodes.root.activeChild).toEqual('child2')
    })

    it('should not set the activeChild if it is invalid', () => {
      navigation.register('root')
      navigation.register('child1', { parent: 'root' })
      navigation.setActiveChild('root', 'child2')

      expect(navigation.nodes.root.activeChild).toBeFalsy()
    })
  })

  describe('setActiveIndex', () => {
    it('should call through to setActiveChild as expected', () => {
      navigation.setActiveChild = jest.fn()

      navigation.register('root')
      navigation.register('child1', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.setActiveIndex('root', 1)

      expect(navigation.setActiveChild).toHaveBeenCalledWith('root', 'child2')
    })
  })

  describe('getters', () => {
    it('getNodeById should return the node as expected', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })

      expect(navigation.getNodeById('child')).toEqual(expect.objectContaining({
        id: 'child'
      }))
    })

    it('getFocusedNode should return the current focused node as expected', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })

      navigation.focus()

      expect(navigation.getFocusedNode()).toEqual(expect.objectContaining({
        id: 'child'
      }))
    })
  })

  describe('search', () => {
    it('searchUp should find the parent node as expected', () => {
      navigation.register('root', { foo: true })
      navigation.register('child', { parent: 'root' })
      navigation.register('child-of-child', { parent: 'child' })

      const node = navigation.getNodeById('child-of-child')
      const found = navigation.searchUp(node, ({ foo }) => !!foo)
      const notFound = navigation.searchUp(node, ({ bar }) => !!bar)

      expect(found).toEqual(expect.objectContaining({ id: 'root' }))
      expect(notFound).toBeUndefined()
    })

    it('searchDown should find the child node as expected', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root', foo: true })
      navigation.register('child-of-child', { parent: 'child' })

      navigation.focus()

      const node = navigation.getNodeById('root')
      const found = navigation.searchDown(node, ({ foo }) => !!foo)
      const notFound = navigation.searchDown(node, ({ bar }) => !!bar)

      expect(found).toEqual(expect.objectContaining({ id: 'child' }))
      expect(notFound).toBeUndefined()
    })
  })

  describe('Overriding static KEY_CODES/KEY_MAP properties', () => {
    it('should emit the select event as expected', () => {
      Lrud.KEY_CODES = { 1: 'Enter' }
      Lrud.KEY_MAP = { ENTER: 'Enter' }

      const spy = jest.fn()

      navigation.on('select', spy)
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.focus('child')
      navigation.handleKeyEvent({ keyCode: 1 })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(expect.objectContaining({
        id: 'child'
      }))
    })
  })

  describe('upsert', () => {
    it('should insert a new node if none exists for that id', () => {
      navigation.upsert('root')

      expect(toJSON(navigation.nodes)).toEqual({
        root: {
          id: 'root',
          children: []
        }
      })
    })

    it('should replace a node already there with a new node when upserted', () => {
      navigation.upsert('root')
      navigation.upsert('root', { orientation: 'horizontal' })

      expect(toJSON(navigation.nodes)).toEqual({
        root: {
          id: 'root',
          orientation: 'horizontal',
          children: []
        }
      })
    })

    it('should replace a node already there with a new node when upserted - child test', () => {
      navigation.upsert('root')
      navigation.upsert('child-a', { parent: 'root' })
      navigation.upsert('child-b', { parent: 'root' })

      expect(toJSON(navigation.nodes.root.children)).toEqual(['child-a', 'child-b'])

      navigation.upsert('root')
      navigation.upsert('child-c', { parent: 'root' })
      navigation.upsert('child-d', { parent: 'root' })

      expect(toJSON(navigation.nodes.root.children)).toEqual(['child-c', 'child-d'])
    })
  })

  describe('handleKeyEvent - with overrides', () => {
    it('should move through a horizontal list as expected', () => {
      navigation.overrides = [
        {
          id: 'child2',
          direction: 'RIGHT',
          target: 'child1'
        }
      ]
      navigation.register('root', { orientation: 'horizontal' })
      navigation.register('child1', { parent: 'root', selectAction: true })
      navigation.register('child2', { parent: 'root', selectAction: true })
      navigation.register('child3', { parent: 'root', selectAction: true })
      navigation.register('child4', { parent: 'root', selectAction: true })

      navigation.currentFocus = 'child2'
      navigation.handleKeyEvent({ keyCode: 39, stopPropagation: noop }) // Focus child2

      // // RIGHT
      // navigation.handleKeyEvent({ keyCode: 39, stopPropagation: stopPropagationSpy }) // Focus child2
      // navigation.handleKeyEvent({ keyCode: 39, stopPropagation: stopPropagationSpy }) // Focus child4
      // navigation.handleKeyEvent({ keyCode: 39, stopPropagation: stopPropagationSpy }) // Edge

      // // LEFT
      // navigation.handleKeyEvent({ keyCode: 37, stopPropagation: stopPropagationSpy }) // Focus child2
      // navigation.handleKeyEvent({ keyCode: 37, stopPropagation: stopPropagationSpy }) // Focus child1
      // navigation.handleKeyEvent({ keyCode: 37, stopPropagation: stopPropagationSpy }) // Edge

      // expect(stopPropagationSpy).toHaveBeenCalledTimes(4)
      expect(navigation.currentFocus).toEqual('child1')
      // expect(toJSON(moveSpy.mock.calls)).toEqual(data.horizontalMove)
    })
  })
})
