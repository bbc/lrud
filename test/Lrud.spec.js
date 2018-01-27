/* eslint-env mocha, chai */

var expect = require('chai').expect
var sinon = require('sinon')
var Lrud = require('../lib/lrud')
var data = require('./data.json')

describe('Given an instance of Lrud', function () {
  var navigation

  beforeEach(function () {
    Lrud.KEY_CODES = {
      37: 'LEFT',
      39: 'RIGHT',
      38: 'UP',
      40: 'DOWN',
      13: 'ENTER'
    }
    Lrud.KEY_MAP = {
      LEFT: 'LEFT',
      RIGHT: 'RIGHT',
      UP: 'UP',
      DOWN: 'DOWN',
      ENTER: 'ENTER'
    }
    navigation = new Lrud()
  })

  var toJSON = function (o) { return JSON.parse(JSON.stringify(o)) }

  describe('register', function () {
    it('should throw an error when attempting to register without an id', function () {
      expect(function () { navigation.register() }).to.throw('Attempting to register with an invalid id')
    })

    it('should register a node as expected', function () {
      navigation.register('root')

      expect(toJSON(navigation.nodes)).to.deep.equal({
        root: {
          id: 'root',
          children: []
        }
      })
    })

    it('should assign new props on subsequent registrations', function () {
      navigation.register('root')
      navigation.register('root', { orientation: 'horizontal' })

      expect(toJSON(navigation.nodes)).to.deep.equal({
        root: {
          id: 'root',
          children: [],
          orientation: 'horizontal'
        }
      })
    })

    it('should crate the parent/child relationship as expected', function () {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })

      expect(navigation.nodes.root.children).to.deep.equal([ 'child' ])
      expect(navigation.nodes.child.parent).to.equal('root')
    })

    it('should maintain the child order if a node is registered multiple times', function () {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.register('child', { parent: 'root' })

      expect(navigation.nodes.root.children).to.deep.equal([
        'child',
        'child2'
      ])
    })
  })

  describe('unregister', function () {
    it('should remove a node as expected', function () {
      navigation.register('root')
      navigation.unregister('root')

      expect(navigation.nodes.root).to.equal(undefined)
    })

    it('should undo the parent/child relationship as expected', function () {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.unregister('child')

      expect(navigation.nodes.root.children).to.deep.equal([])
    })

    it('should remove the children of the unregistered node', function () {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.unregister('root')

      expect(navigation.nodes.child).to.equal(undefined)
      expect(navigation.nodes.child2).to.equal(undefined)
    })

    it('should blur the \'currentFocus\' node if it is the node being unregistered', function () {
      var spy = sinon.spy()

      navigation.on('blur', spy)

      navigation.register('root')
      navigation.currentFocus = 'root'
      navigation.unregister('root')

      expect(navigation.currentFocus).to.equal(undefined)
      expect(spy.calledWith('root')).to.equal(true)
    })

    it('should not blur the \'currentFocus\' node if it is not the node being unregistered', function () {
      var spy = sinon.spy()

      navigation.currentFocus = 'child'

      navigation.on('blur', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.unregister('child2')

      expect(navigation.currentFocus).to.equal('child')
      expect(spy.notCalled).to.equal(true)
    })

    it('should unset the \'activeChild\' of the parent if the unregisted node is the currect active child', function () {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.nodes.root.activeChild = 'child2'
      navigation.unregister('child2')

      expect(navigation.nodes.root.activeChild).to.equal(undefined)
    })
  })

  describe('blur', function () {
    it('should emit the blur event with node id as expected', function () {
      var spy = sinon.spy()

      navigation.on('blur', spy)

      navigation.register('root')

      navigation.blur('root')

      expect(spy.calledWith('root')).to.equal(true)
    })

    it('should blur the \'currentFocus\' node if no arguments are provided', function () {
      var spy = sinon.spy()

      navigation.currentFocus = 'child'

      navigation.on('blur', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })

      navigation.blur()

      expect(spy.calledWith('child')).to.equal(true)
    })
  })

  describe('focus', function () {
    it('should emit the focus event with node id as expected', function () {
      var spy = sinon.spy()

      navigation.on('focus', spy)

      navigation.register('root')

      navigation.focus('root')

      expect(spy.calledWith('root')).to.equal(true)
    })

    it('should focus down the tree to the first focusable child', function () {
      var spy = sinon.spy()

      navigation.on('focus', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })

      navigation.focus('root')

      expect(spy.calledWith('child')).to.equal(true)
    })

    it('should update the \'currentFocus\' prop as expected', function () {
      var spy = sinon.spy()

      navigation.on('focus', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })

      expect(navigation.currentFocus).to.equal(null)

      navigation.focus('root')

      expect(navigation.currentFocus).to.equal('child')
    })

    it('should focus the \'currentFocus\' node if no arguments are provided', function () {
      var spy = sinon.spy()

      navigation.currentFocus = 'child2'

      navigation.on('focus', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })

      navigation.focus()

      expect(spy.calledWith('child2')).to.equal(true)
    })

    it('should emit a blur event for the previously focused node', function () {
      var spy = sinon.spy()

      navigation.currentFocus = 'child'

      navigation.on('blur', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })

      navigation.focus('child2')

      expect(spy.calledWith('child')).to.equal(true)
    })

    it('should set the \'activeChild\' property up the tree as expected', function () {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.register('child-of-child2', { parent: 'child2' })

      navigation.focus('root')

      expect(navigation.nodes.root.activeChild).to.equal('child')

      navigation.focus('child-of-child2')

      expect(navigation.nodes.child2.activeChild).to.equal('child-of-child2')
      expect(navigation.nodes.root.activeChild).to.equal('child2')
    })

    it('should emit the active event as expected', function () {
      var spy = sinon.spy()

      navigation.on('active', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child-of-child', { parent: 'child' })

      navigation.focus('child-of-child')

      expect(spy.calledTwice).to.equal(true)
      expect(spy.firstCall.calledWith('child-of-child')).to.equal(true)
      expect(spy.secondCall.calledWith('child')).to.equal(true)
    })

    it('should emit the inactive event as expected', function () {
      var spy = sinon.spy()

      navigation.on('inactive', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })

      navigation.focus('child')
      navigation.focus('child2')

      expect(spy.calledOnce).to.equal(true)
      expect(spy.calledWith('child')).to.equal(true)
    })
  })

  describe('handleKeyEvent', function () {
    it('should emit the select event as expected', function () {
      var spy = sinon.spy()

      navigation.on('select', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })

      navigation.focus('child')

      navigation.handleKeyEvent({ keyCode: 13 })

      expect(spy.calledOnce).to.equal(true)
      expect(spy.calledWith('child')).to.equal(true)
    })

    it('should move through a horizontal list as expected', function () {
      var stopPropagationSpy = sinon.spy()
      var focusSpy = sinon.spy()
      var moveSpy = sinon.spy()

      navigation.currentFocus = 'child1'

      navigation.on('focus', focusSpy)
      navigation.on('move', moveSpy)

      navigation.register('root', { orientation: 'horizontal' })
      navigation.register('child1', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.register('child3', { parent: 'root' })

      // RIGHT
      navigation.handleKeyEvent({ keyCode: 39, stopPropagation: stopPropagationSpy }) // Focus child2
      navigation.handleKeyEvent({ keyCode: 39, stopPropagation: stopPropagationSpy }) // Focus child3
      navigation.handleKeyEvent({ keyCode: 39, stopPropagation: stopPropagationSpy }) // Edge
      // LEFT
      navigation.handleKeyEvent({ keyCode: 37, stopPropagation: stopPropagationSpy }) // Focus child2
      navigation.handleKeyEvent({ keyCode: 37, stopPropagation: stopPropagationSpy }) // Focus child1
      navigation.handleKeyEvent({ keyCode: 37, stopPropagation: stopPropagationSpy }) // Edge

      expect(stopPropagationSpy.callCount).to.equal(4)
      expect(focusSpy.args).to.deep.equal([
        [ 'child2' ],
        [ 'child3' ],
        [ 'child2' ],
        [ 'child1' ]
      ])

      expect(toJSON(moveSpy.args)).to.deep.equal(data.horizontalMove)
    })

    it('should move through a vertical list as expected', function () {
      var stopPropagationSpy = sinon.spy()
      var focusSpy = sinon.spy()
      var moveSpy = sinon.spy()

      navigation.currentFocus = 'child1'

      navigation.on('focus', focusSpy)
      navigation.on('move', moveSpy)

      navigation.register('root', { orientation: 'vertical' })
      navigation.register('child1', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.register('child3', { parent: 'root' })

      // DOWN
      navigation.handleKeyEvent({ keyCode: 40, stopPropagation: stopPropagationSpy }) // Focus child2
      navigation.handleKeyEvent({ keyCode: 40, stopPropagation: stopPropagationSpy }) // Focus child3
      navigation.handleKeyEvent({ keyCode: 40, stopPropagation: stopPropagationSpy }) // Edge
      // UP
      navigation.handleKeyEvent({ keyCode: 38, stopPropagation: stopPropagationSpy }) // Focus child2
      navigation.handleKeyEvent({ keyCode: 38, stopPropagation: stopPropagationSpy }) // Focus child1
      navigation.handleKeyEvent({ keyCode: 38, stopPropagation: stopPropagationSpy }) // Edge

      expect(stopPropagationSpy.callCount).to.equal(4)
      expect(focusSpy.args).to.deep.equal([
        [ 'child2' ],
        [ 'child3' ],
        [ 'child2' ],
        [ 'child1' ]
      ])

      expect(toJSON(moveSpy.args)).to.deep.equal(data.verticalMove)
    })

    it('should move through a wrapping list as expected', function () {
      var focusSpy = sinon.spy()

      navigation.currentFocus = 'child1'

      navigation.on('focus', focusSpy)

      navigation.register('root', { orientation: 'horizontal', wrapping: true })
      navigation.register('child1', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.register('child3', { parent: 'root' })

      // RIGHT
      navigation.handleKeyEvent({ keyCode: 39, stopPropagation: function () {} }) // Focus child2
      navigation.handleKeyEvent({ keyCode: 39, stopPropagation: function () {} }) // Focus child3
      navigation.handleKeyEvent({ keyCode: 39, stopPropagation: function () {} }) // Focus child1

      expect(focusSpy.args).to.deep.equal([
        [ 'child2' ],
        [ 'child3' ],
        [ 'child1' ]
      ])
    })

    it('should move through a grid as expected', function () {
      var focusSpy = sinon.spy()

      navigation.currentFocus = 'row1-child1'

      navigation.on('focus', focusSpy)

      navigation.register('root', { orientation: 'vertical', grid: true })
      navigation.register('row1', { orientation: 'horizontal', parent: 'root' })
      navigation.register('row2', { orientation: 'horizontal', parent: 'root' })
      navigation.register('row1-child1', { parent: 'row1' })
      navigation.register('row1-child2', { parent: 'row1' })
      navigation.register('row1-child3', { parent: 'row1' })
      navigation.register('row2-child1', { parent: 'row2' })
      navigation.register('row2-child2', { parent: 'row2' })
      navigation.register('row2-child3', { parent: 'row2' })

      navigation.handleKeyEvent({ keyCode: 39, stopPropagation: function () {} }) // RIGHT
      navigation.handleKeyEvent({ keyCode: 40, stopPropagation: function () {} }) // DOWN
      navigation.handleKeyEvent({ keyCode: 39, stopPropagation: function () {} }) // RIGHT
      navigation.handleKeyEvent({ keyCode: 38, stopPropagation: function () {} }) // UP

      expect(focusSpy.args).to.deep.equal([
        [ 'row1-child2' ],
        [ 'row2-child2' ],
        [ 'row2-child3' ],
        [ 'row1-child3' ]
      ])
    })
  })

  describe('destroy', function () {
    it('should reset nodes and currentFocus and remove remove all event listeners', function () {
      var focusSpy = sinon.spy()
      var blurSpy = sinon.spy()

      navigation.on('focus', focusSpy)
      navigation.on('blur', blurSpy)

      navigation.register('root')
      navigation.currentFocus = 'root'

      navigation.destroy()

      navigation.emit('focus')
      navigation.emit('blur')

      expect(navigation.nodes).to.deep.equal({})
      expect(navigation.currentFocus).to.equal(null)

      expect(focusSpy.called).to.equal(false)
      expect(blurSpy.called).to.equal(false)
    })
  })

  describe('Overriding static KEY_CODES/KEY_MAP properties', function () {
    it('should emit the select event as expected', function () {
      Lrud.KEY_CODES = { 1: 'Enter' }
      Lrud.KEY_MAP = { ENTER: 'Enter' }

      var spy = sinon.spy()

      navigation.on('select', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })

      navigation.focus('child')

      navigation.handleKeyEvent({ keyCode: 1 })

      expect(spy.calledOnce).to.equal(true)
      expect(spy.calledWith('child')).to.equal(true)
    })
  })
})
