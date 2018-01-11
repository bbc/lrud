import EventEmitter from 'tiny-emitter'
import { DEFAULT_KEY_CODES, DEFAULT_KEY_MAP } from './constants'

function Lrud () {
  this.nodes = {}
  this.currentFocus = null
}

function merge () {
  var merged = {}

  for (var i = 0; i < arguments.length; i++) {
    var obj = arguments[i]
    for (var prop in obj) {
      if (obj.hasOwnProperty(prop)) {
        merged[prop] = obj[prop]
      }
    }
  }

  return merged
}

Lrud.prototype = Object.create(EventEmitter.prototype)

Lrud.prototype.register = function (id, props) {
  props = props || {}

  if (!id) {
    throw new Error('Attempting to register with an invalid id')
  }

  var node = this._createNode(id, props)

  if (node.parent) {
    var parentNode = this._createNode(node.parent)

    if (parentNode.children.indexOf(id) === -1) {
      parentNode.children.push(id)
    }

    this.nodes[node.parent] = parentNode
  }

  this.nodes[id] = node
}

Lrud.prototype.unregister = function (id) {
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
}

Lrud.prototype.blur = function (id) {
  id = id || this.currentFocus

  var node = this.nodes[id]
  if (!node) return

  this.emit('blur', id)
}

Lrud.prototype.focus = function (id) {
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
}

Lrud.prototype.handleKeyEvent = function (event) {
  this._bubbleKeyEvent(event, this.currentFocus)
}

Lrud.prototype.destroy = function () {
  this.e = {}
  this.nodes = {}
  this.currentFocus = null
}

Lrud.prototype._isValidLRUDEvent = function (event, node) {
  var keyCode = event.keyCode

  return (
    (
      node.orientation === 'horizontal' &&
      (
        Lrud.KEY_CODES[keyCode] === Lrud.KEY_MAP.LEFT ||
        Lrud.KEY_CODES[keyCode] === Lrud.KEY_MAP.RIGHT
      )
    ) ||
    (
      node.orientation === 'vertical' &&
      (
        Lrud.KEY_CODES[keyCode] === Lrud.KEY_MAP.UP ||
        Lrud.KEY_CODES[keyCode] === Lrud.KEY_MAP.DOWN
      )
    )
  )
}

Lrud.prototype._createNode = function (id, props) {
  return merge({ children: [] }, this.nodes[id] || {}, props || {})
}

Lrud.prototype._getNextActiveIndex = function (node, activeIndex, offset) {
  var nextIndex = activeIndex + offset
  var size = node.children.length

  if (node.wrapping && nextIndex === -1) return size - 1
  if (node.wrapping && nextIndex === size) return 0

  return nextIndex
}

Lrud.prototype._getEventOffset = function (event) {
  return (
    Lrud.KEY_CODES[event.keyCode] === Lrud.KEY_MAP.RIGHT ||
    Lrud.KEY_CODES[event.keyCode] === Lrud.KEY_MAP.DOWN
  ) ? 1 : -1
}

Lrud.prototype._updateGrid = function (node) {
  var self = this
  var rowId = node.activeChild || node.children[0]
  var rowNode = this.nodes[rowId]
  var activeChild = rowNode.activeChild || rowNode.children[0]

  if (!activeChild) return

  var activeIndex = rowNode.children.indexOf(activeChild)

  node.children.forEach(function (id) {
    var node = self.nodes[id]
    self._setActiveChild(id, node.children[activeIndex] || node.activeChild)
  })
}

Lrud.prototype._bubbleKeyEvent = function (event, id) {
  var node = this.nodes[id]
  if (!node) return

  if (Lrud.KEY_CODES[event.keyCode] === Lrud.KEY_MAP.ENTER) {
    return this.emit('select', id)
  }

  if (this._isValidLRUDEvent(event, node)) {
    var activeChild = node.activeChild || node.children[0]
    var activeIndex = node.children.indexOf(activeChild)
    var offset = this._getEventOffset(event)
    var nextIndex = this._getNextActiveIndex(node, activeIndex, offset)
    var nextChild = node.children[nextIndex]

    if (nextChild) {
      if (node.grid) {
        this._updateGrid(node)
      }

      this.emit('move', {
        id: id,
        offset: offset,
        enter: { id: nextChild, index: nextIndex },
        leave: { id: activeChild, index: activeIndex }
      })

      this.focus(nextChild)

      return event.stopPropagation()
    }
  }

  this._bubbleKeyEvent(event, node.parent)
}

Lrud.prototype._setActiveChild = function (id, nextActiveChild) {
  var activeChild = this.nodes[id].activeChild

  if (activeChild !== nextActiveChild) {
    if (activeChild) {
      this.emit('inactive', activeChild)
    }

    this.emit('active', nextActiveChild)
    this.nodes[id].activeChild = nextActiveChild
  }
}

Lrud.prototype._bubbleActive = function (id) {
  var node = this.nodes[id]

  if (node.parent) {
    this._setActiveChild(node.parent, id)
    this._bubbleActive(node.parent)
  }
}

Lrud.KEY_CODES = DEFAULT_KEY_CODES
Lrud.KEY_MAP = DEFAULT_KEY_MAP

export default Lrud
