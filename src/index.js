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
    parent: props.parent,
    children: props.children || [],
    activeChild: props.activeChild,
    orientation: props.orientation,
    wrapping: props.wrapping,
    grid: props.grid,
    carousel: props.carousel,
    data: props.data
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
    if (!node) return

    var parentNode = this.nodes[node.parent]

    if (parentNode) {
      parentNode.children = parentNode.children.filter(function (cid) {
        return cid !== id
      })

      if (parentNode.activeChild === id) {
        parentNode.activeChild = undefined
      }
    }

    if (this.currentFocus === id) {
      this.blur(id)
      this.currentFocus = undefined
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
    this._bubbleActive(id)
  },

  handleKeyEvent: function (event) {
    this._bubbleKeyEvent(event, this.currentFocus)
  },

  _bubbleKeyEvent: function (event, id) {
    var node = this.nodes[id]
    if (!node) return

    if (Lrud.KEY_CODES[event.keyCode] === Lrud.KEY_MAP.ENTER) {
      return this.emit('select', assign({ id: id }, node))
    }
  },

  _setActiveChild: function (id, nextActiveChild) {
    var activeChild = this.nodes[id].activeChild

    if (activeChild !== nextActiveChild) {
      if (activeChild) {
        this.emit('deactivate', activeChild)
      }

      this.emit('activate', nextActiveChild)
      this.nodes[id].activeChild = nextActiveChild
    }
  },

  _bubbleActive: function (id) {
    var node = this.nodes[id]

    if (node.parent) {
      this._setActiveChild(node.parent, id)
      this._bubbleActive(node.parent)
    }
  }
})

Lrud.KEY_CODES = constants.DEFAULT_KEY_CODES
Lrud.KEY_MAP = constants.DEFAULT_KEY_MAP

module.exports = Lrud
