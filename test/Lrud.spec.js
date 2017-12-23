/* eslint-env mocha, chai */

const { expect } = require('chai')
const sinon = require('sinon')
const Lrud = require('../src')
const constants = require('../src/constants')

describe('Given an instance of Lrud', () => {
  let navigation

  beforeEach(() => {
    Lrud.KEY_CODES = constants.DEFAULT_KEY_CODES
    Lrud.KEY_MAP = constants.DEFAULT_KEY_MAP
    navigation = new Lrud()
  })

  describe('register', () => {
    it('should throw an error when attempting to register without an id', () => {
      expect(() => navigation.register()).to.throw('Attempting to register with an invalid id')
    })

    it('should register a node as expected', () => {
      navigation.register('root')

      expect(navigation.getNodes()).to.deep.equal({
        root: {
          children: []
        }
      })
    })

    it('should register a node passing through only the white listed props', () => {
      navigation.register('root', {
        orientation: 'vertical',
        wrapping: true,
        grid: true,
        carousel: true,
        data: {
          hi: true
        },
        imposter: true
      })

      expect(navigation.getNodes()).to.deep.equal({
        root: {
          children: [],
          orientation: 'vertical',
          wrapping: true,
          grid: true,
          carousel: true,
          data: {
            hi: true
          }
        }
      })
    })

    it('should crate the parent/child relationship as expected', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })

      expect(navigation.getNodes().root.children).to.deep.equal([ 'child' ])
      expect(navigation.getNodes().child.parent).to.equal('root')
    })

    it('should maintain the child order if a node is registered multiple times', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.register('child', { parent: 'root' })

      expect(navigation.getNodes().root.children).to.deep.equal([
        'child',
        'child2'
      ])
    })
  })

  describe('unregister', () => {
    it('should remove a node as expected', () => {
      navigation.register('root')
      navigation.unregister('root')

      expect(navigation.getNodes().root).to.equal(undefined)
    })

    it('should undo the parent/child relationship as expected', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.unregister('child')

      expect(navigation.getNodes().root.children).to.deep.equal([])
    })

    it('should remove the children of the unregistered node', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.unregister('root')

      expect(navigation.getNodes().child).to.equal(undefined)
      expect(navigation.getNodes().child2).to.equal(undefined)
    })

    it('should blur the \'currentFocus\' node if it is the node being unregistered', () => {
      const spy = sinon.spy()

      navigation.on('blur', spy)

      navigation.register('root')
      navigation.currentFocus = 'root'
      navigation.unregister('root')

      expect(navigation.currentFocus).to.equal(null)
      expect(spy.calledWith('root')).to.equal(true)
    })

    it('should not blur the \'currentFocus\' node if it is not the node being unregistered', () => {
      const spy = sinon.spy()

      navigation.currentFocus = 'child'

      navigation.on('blur', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.unregister('child2')

      expect(navigation.currentFocus).to.equal('child')
      expect(spy.notCalled).to.equal(true)
    })

    it('should unset the \'activeChild\' of the parent if the unregisted node is the currect active child', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.getNodes().root.activeChild = 'child2'
      navigation.unregister('child2')

      expect(navigation.getNodes().root.activeChild).to.equal(undefined)
    })
  })

  describe('blur', () => {
    it('should emit the blur event with node id as expected', () => {
      const spy = sinon.spy()

      navigation.on('blur', spy)

      navigation.register('root')

      navigation.blur('root')

      expect(spy.calledWith('root')).to.equal(true)
    })

    it('should blur the \'currentFocus\' node if no arguments are provided', () => {
      const spy = sinon.spy()

      navigation.currentFocus = 'child'

      navigation.on('blur', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })

      navigation.blur()

      expect(spy.calledWith('child')).to.equal(true)
    })
  })

  describe('focus', () => {
    it('should emit the focus event with node id as expected', () => {
      const spy = sinon.spy()

      navigation.on('focus', spy)

      navigation.register('root')

      navigation.focus('root')

      expect(spy.calledWith('root')).to.equal(true)
    })

    it('should focus down the tree to the first focusable child', () => {
      const spy = sinon.spy()

      navigation.on('focus', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })

      navigation.focus('root')

      expect(spy.calledWith('child')).to.equal(true)
    })

    it('should update the \'currentFocus\' prop as expected', () => {
      const spy = sinon.spy()

      navigation.on('focus', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })

      expect(navigation.currentFocus).to.equal(null)

      navigation.focus('root')

      expect(navigation.currentFocus).to.equal('child')
    })

    it('should focus the \'currentFocus\' node if no arguments are provided', () => {
      const spy = sinon.spy()

      navigation.currentFocus = 'child2'

      navigation.on('focus', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })

      navigation.focus()

      expect(spy.calledWith('child2')).to.equal(true)
    })

    it('should emit a blur event for the previously focused node', () => {
      const spy = sinon.spy()

      navigation.currentFocus = 'child'

      navigation.on('blur', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })

      navigation.focus('child2')

      expect(spy.calledWith('child')).to.equal(true)
    })

    it('should set the \'activeChild\' property up the tree as expected', () => {
      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })
      navigation.register('child-of-child2', { parent: 'child2' })

      navigation.focus('root')

      expect(navigation.getNodes().root.activeChild).to.equal('child')

      navigation.focus('child-of-child2')

      expect(navigation.getNodes().child2.activeChild).to.equal('child-of-child2')
      expect(navigation.getNodes().root.activeChild).to.equal('child2')
    })

    it('should emit the activate event as expected', () => {
      const spy = sinon.spy()

      navigation.on('activate', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child-of-child', { parent: 'child' })

      navigation.focus('child-of-child')

      expect(spy.calledTwice).to.equal(true)
      expect(spy.firstCall.calledWith('child-of-child')).to.equal(true)
      expect(spy.secondCall.calledWith('child')).to.equal(true)
    })

    it('should emit the deactivate event as expected', () => {
      const spy = sinon.spy()

      navigation.on('deactivate', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })
      navigation.register('child2', { parent: 'root' })

      navigation.focus('child')
      navigation.focus('child2')

      expect(spy.calledOnce).to.equal(true)
      expect(spy.calledWith('child')).to.equal(true)
    })
  })

  describe('handleKeyEvent', () => {
    it('should emit the select event as expected', () => {
      const spy = sinon.spy()

      navigation.on('select', spy)

      navigation.register('root')
      navigation.register('child', { parent: 'root' })

      navigation.focus('child')

      navigation.handleKeyEvent({ keyCode: 13 })

      const args = spy.getCall(0).args[0]

      expect(spy.calledOnce).to.equal(true)
      expect(args.id).to.equal('child')
    })
  })

  // TODO
  // describe('Overriding static properties', () => {
  //
  // })
})
