var EventEmitter = require('events').EventEmitter
var assign = require('lodash.assign')
var constants = require('./constants')

function Lrud (options) {
  options = options || {}

  this.nodes = options.nodes || {}
  this.currentFocus = options.currentFocus || null
}

function newNode (props) {
  props = props || {}

  return {
    parent: props.parent || null,
    children: props.children || [],
    activeChild: props.activeChild || null
  }
}

Lrud.prototype = assign({}, EventEmitter.prototype, {

  register: function (id, props) {
    props = props || {}

    if (!id) {
      throw new Error('Attempting to register with an invalid id')
    }

    var node = this.nodes[id] || newNode(props)

    if (node.parent) {
      var parentNode = this.nodes[node.parent] || newNode()

      if (parentNode.children.indexOf(id) === -1) {
        parentNode.children.push(id)
      }

      node.parent = props.parent
      this.nodes[props.parent] = parentNode
    }

    this.nodes[id] = node
  },

  unregister: function (id) {
    var node = this.nodes[id]
    if (!node) {
      return console.warn('Attempting to unregister an unknown node')
    }

    var parentNode = this.nodes[node.parent]
    if (parentNode) {
      parentNode.children = parentNode.children.filter(function (cid) {
        return cid !== id
      })
      if (parentNode.activeChild === id) {
        parentNode.activeChild = null
      }
    }

    if (this.currentFocus === id) {
      this.blur(id)
      this.currentFocus = null
    }

    delete this.nodes[id]
    node.children.forEach(this.unregister.bind(this))
  },

  blur: function (id) {
    id = id || this.currentFocus

    var node = this.nodes[id]
    if (!node) return

    this.emit('blur', id)
  },

  focus: function (id) {
    id = id || this.currentFocus

    var node = this.nodes[id]
    if (!node) return

    var activeChild = node.activeChild || node.children[0]

    if (activeChild) {
      return this.focus(activeChild)
    }

    this.blur()
    this.currentFocus = id
    this.emit('focus', id)
  }

})

Lrud.KEY_CODES = constants.DEFAULT_KEY_CODES
Lrud.KEY_MAP = constants.DEFAULT_KEY_MAP

module.exports = Lrud
