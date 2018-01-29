var EventEmitter = require('tiny-emitter')
var assign = require('object-assign')

function Lrud () {
  this.nodes = {}
  this.currentFocus = null
}

function createNode (ctx, id, props) {
  return assign({ id: id, children: [] }, ctx.nodes[id] || {}, props || {})
}

function isValidLRUDEvent (event, node) {
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

function getEventOffset (event) {
  return (
    Lrud.KEY_CODES[event.keyCode] === Lrud.KEY_MAP.RIGHT ||
    Lrud.KEY_CODES[event.keyCode] === Lrud.KEY_MAP.DOWN
  ) ? 1 : -1
}

function getNextActiveIndex (node, activeIndex, offset) {
  var nextIndex = activeIndex + offset
  var size = node.children.length

  if (node.wrapping && nextIndex === -1) return size - 1
  if (node.wrapping && nextIndex === size) return 0

  return nextIndex
}

Lrud.prototype = Object.create(EventEmitter.prototype)

Lrud.prototype = assign(Lrud.prototype, {
  register: function (id, props) {
    props = props || {}

    if (!id) {
      throw new Error('Attempting to register with an invalid id')
    }

    var node = createNode(this, id, props)

    if (node.parent) {
      var parentNode = createNode(this, node.parent)

      if (parentNode.children.indexOf(id) === -1) {
        parentNode.children.push(id)
      }

      this.nodes[node.parent] = parentNode
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

    if (this.nodes[id]) {
      this.emit('blur', id)
    }
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

  destroy: function () {
    this.e = {}
    this.nodes = {}
    this.currentFocus = null
  },

  setActiveChild: function (id, child) {
    var node = this.nodes[id]
    if (!node || node.children.indexOf(child) === -1) return

    var activeChild = node.activeChild

    if (activeChild !== child) {
      if (activeChild) {
        this.emit('inactive', activeChild)
      }

      this.emit('active', child)
      node.activeChild = child
    }
  },

  setActiveIndex: function (id, index) {
    var node = this.nodes[id]
    if (!node || !node.children[index]) return

    this.setActiveChild(id, node.children[index])
  },

  _updateGrid: function (node) {
    var self = this
    var rowId = node.activeChild || node.children[0]
    var rowNode = this.nodes[rowId]
    var activeChild = rowNode.activeChild || rowNode.children[0]

    if (!activeChild) return

    var activeIndex = rowNode.children.indexOf(activeChild)

    node.children.forEach(function (id) {
      var node = self.nodes[id]
      self.setActiveChild(id, node.children[activeIndex] || node.activeChild)
    })
  },

  _bubbleKeyEvent: function (event, id) {
    var node = this.nodes[id]
    if (!node) return

    if (Lrud.KEY_CODES[event.keyCode] === Lrud.KEY_MAP.ENTER) {
      return this.emit('select', id)
    }

    if (isValidLRUDEvent(event, node)) {
      var activeChild = node.activeChild || node.children[0]
      var activeIndex = node.children.indexOf(activeChild)
      var offset = getEventOffset(event)
      var nextIndex = getNextActiveIndex(node, activeIndex, offset)
      var nextChild = node.children[nextIndex]

      if (nextChild) {
        if (node.grid) {
          this._updateGrid(node)
        }

        this.emit('move', {
          id: id,
          offset: offset,
          orientation: node.orientation,
          enter: {
            id: nextChild,
            index: nextIndex
          },
          leave: {
            id: activeChild,
            index: activeIndex
          }
        })

        this.focus(nextChild)
        event.stopPropagation()
        return
      }
    }

    this._bubbleKeyEvent(event, node.parent)
  },

  _bubbleActive: function (id) {
    var node = this.nodes[id]

    if (node.parent) {
      this.setActiveChild(node.parent, id)
      this._bubbleActive(node.parent)
    }
  }
})

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

module.exports = Lrud
