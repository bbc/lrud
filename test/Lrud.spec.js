/* eslint-env mocha, chai */

const { expect } = require('chai')
const sinon = require('sinon')
const Lrud = require('../src')
const constants = require('../src/constants')

describe('Given an instance of Lrud', () => {
  beforeEach(() => {
    Lrud.KEY_CODES = constants.DEFAULT_KEY_CODES
    Lrud.KEY_MAP = constants.DEFAULT_KEY_MAP
  })

  describe('register', () => {
    it('should throw an error when attempting to register without an id', () => {
      const lrud = new Lrud()

      expect(() => lrud.register()).to.throw('Attempting to register with an invalid id')
    })

    it('should add a node as expected', () => {
      const lrud = new Lrud()

      lrud.register('root')

      expect(lrud.nodes).to.deep.equal({
        root: {
          parent: null,
          children: [],
          activeChild: null
        }
      })
    })

    it('should crate the parent/child relationship as expected', () => {
      const lrud = new Lrud()

      lrud.register('root')
      lrud.register('child', { parent: 'root' })

      expect(lrud.nodes.root.children).to.deep.equal([ 'child' ])
      expect(lrud.nodes.child.parent).to.equal('root')
    })

    it('should maintain the child order if a node is registered multiple times', () => {
      const lrud = new Lrud()

      lrud.register('root')
      lrud.register('child', { parent: 'root' })
      lrud.register('child2', { parent: 'root' })
      lrud.register('child', { parent: 'root' })

      expect(lrud.nodes.root.children).to.deep.equal([
        'child',
        'child2'
      ])
    })
  })

  describe('unregister', () => {
    it('should remove a node as expected', () => {
      const lrud = new Lrud()

      lrud.register('root')
      lrud.unregister('root')

      expect(lrud.nodes.root).to.equal(undefined)
    })

    it('should undo the parent/child relationship as expected', () => {
      const lrud = new Lrud()

      lrud.register('root')
      lrud.register('child', { parent: 'root' })
      lrud.unregister('child')

      expect(lrud.nodes.root.children).to.deep.equal([])
    })

    it('should remove the children of the unregistered node', () => {
      const lrud = new Lrud()

      lrud.register('root')
      lrud.register('child', { parent: 'root' })
      lrud.register('child2', { parent: 'root' })
      lrud.unregister('root')

      expect(lrud.nodes.child).to.equal(undefined)
      expect(lrud.nodes.child2).to.equal(undefined)
    })

    it('should blur the \'currentFocus\' node if it is the node being unregistered', () => {
      const lrud = new Lrud()
      const spy = sinon.spy()

      lrud.on('blur', spy)
      lrud.register('root')
      lrud.currentFocus = 'root'
      lrud.unregister('root')

      expect(lrud.currentFocus).to.equal(null)
      expect(spy.calledWith('root')).to.equal(true)
    })

    it('should not blur the \'currentFocus\' node if it is not the node being unregistered', () => {
      const lrud = new Lrud()
      const spy = sinon.spy()

      lrud.currentFocus = 'child'

      lrud.on('blur', spy)
      lrud.register('root')
      lrud.register('child', { parent: 'root' })
      lrud.register('child2', { parent: 'root' })
      lrud.unregister('child2')

      expect(lrud.currentFocus).to.equal('child')
      expect(spy.notCalled).to.equal(true)
    })

    it('should unset the \'activeChild\' of the parent if the unregisted node is the currect active child', () => {
      const lrud = new Lrud()

      lrud.register('root')
      lrud.register('child', { parent: 'root' })
      lrud.register('child2', { parent: 'root' })
      lrud.nodes.root.activeChild = 'child2'
      lrud.unregister('child2')

      expect(lrud.nodes.root.activeChild).to.equal(null)
    })
  })

  describe('blur', () => {
    it('should emit the blur event with node id as expected', () => {
      const lrud = new Lrud()
      const spy = sinon.spy()

      lrud.on('blur', spy)
      lrud.register('root')
      lrud.blur('root')

      expect(spy.calledWith('root')).to.equal(true)
    })

    it('should blur the \'currentFocus\' node if no arguments are provided', () => {
      const lrud = new Lrud()
      const spy = sinon.spy()

      lrud.currentFocus = 'child'

      lrud.on('blur', spy)
      lrud.register('root')
      lrud.register('child', { parent: 'root' })
      lrud.blur()

      expect(spy.calledWith('child')).to.equal(true)
    })
  })

  describe('focus', () => {
    it('should emit the focus event with node id as expected', () => {
      const lrud = new Lrud()
      const spy = sinon.spy()

      lrud.on('focus', spy)
      lrud.register('root')
      lrud.focus('root')

      expect(spy.calledWith('root')).to.equal(true)
    })

    it('should focus down the tree to the first focusable child', () => {
      const lrud = new Lrud()
      const spy = sinon.spy()

      lrud.on('focus', spy)
      lrud.register('root')
      lrud.register('child', { parent: 'root' })
      lrud.focus('root')

      expect(spy.calledWith('child')).to.equal(true)
    })

    it('should update the \'currentFocus\' prop as expected', () => {
      const lrud = new Lrud()
      const spy = sinon.spy()

      lrud.on('focus', spy)
      lrud.register('root')
      lrud.register('child', { parent: 'root' })

      expect(lrud.currentFocus).to.equal(null)

      lrud.focus('root')

      expect(lrud.currentFocus).to.equal('child')
    })

    it('should focus the \'currentFocus\' node if no arguments are provided', () => {
      const lrud = new Lrud()
      const spy = sinon.spy()

      lrud.currentFocus = 'child2'

      lrud.on('focus', spy)
      lrud.register('root')
      lrud.register('child', { parent: 'root' })
      lrud.register('child2', { parent: 'root' })
      lrud.focus()

      expect(spy.calledWith('child2')).to.equal(true)
    })

    it('should emit a blur event for the previously focused node', () => {
      const lrud = new Lrud()
      const spy = sinon.spy()

      lrud.currentFocus = 'child'

      lrud.on('blur', spy)
      lrud.register('root')
      lrud.register('child', { parent: 'root' })
      lrud.register('child2', { parent: 'root' })
      lrud.focus('child2')

      expect(spy.calledWith('child')).to.equal(true)
    })
  })
})
