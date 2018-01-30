var EventEmitter = require('tiny-emitter')
var assign = require('object-assign')

var KEY_MAP = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  UP: 'UP',
  DOWN: 'DOWN',
  ENTER: 'ENTER'
}

var KEY_CODES = {
  4: KEY_MAP.LEFT,
  21: KEY_MAP.LEFT,
  37: KEY_MAP.LEFT,
  214: KEY_MAP.LEFT,
  205: KEY_MAP.LEFT,
  218: KEY_MAP.LEFT,
  5: KEY_MAP.RIGHT,
  22: KEY_MAP.RIGHT,
  39: KEY_MAP.RIGHT,
  213: KEY_MAP.RIGHT,
  206: KEY_MAP.RIGHT,
  217: KEY_MAP.RIGHT,
  29460: KEY_MAP.UP,
  19: KEY_MAP.UP,
  38: KEY_MAP.UP,
  211: KEY_MAP.UP,
  203: KEY_MAP.UP,
  215: KEY_MAP.UP,
  29461: KEY_MAP.DOWN,
  20: KEY_MAP.DOWN,
  40: KEY_MAP.DOWN,
  212: KEY_MAP.DOWN,
  204: KEY_MAP.DOWN,
  216: KEY_MAP.DOWN,
  29443: KEY_MAP.ENTER,
  13: KEY_MAP.ENTER,
  67: KEY_MAP.ENTER,
  32: KEY_MAP.ENTER,
  23: KEY_MAP.ENTER,
  195: KEY_MAP.ENTER
}

var either = function (arg, a, b) { return arg === a || arg === b }

function Lrud () {
  this.nodes = {}
  this.root = null
  this.currentFocus = null
}

function createNode (ctx, id, props) {
  return assign({ id: id, children: [] }, ctx.nodes[id] || {}, props || {})
}

function isValidLRUDEvent (event, node) {
  return (
    node.orientation === 'horizontal' && either(
      Lrud.KEY_CODES[event.keyCode],
      Lrud.KEY_MAP.LEFT,
      Lrud.KEY_MAP.RIGHT
    )
  ) || (
    node.orientation === 'vertical' && either(
      Lrud.KEY_CODES[event.keyCode],
      Lrud.KEY_MAP.UP,
      Lrud.KEY_MAP.DOWN
    )
  )
}

function getNextActiveIndex (node, activeIndex, offset) {
  var nextIndex = activeIndex + offset
  var size = node.children.length

  if (node.wrapping && nextIndex === -1) return size - 1
  if (node.wrapping && nextIndex === size) return 0

  return nextIndex
}

Lrud.prototype = Object.create(EventEmitter.prototype)

assign(Lrud.prototype, {
  register: function (id, props) {
    if (!id) throw new Error('Attempting to register with an invalid id')

    var node = createNode(this, id, props)

    if (node.parent) {
      var parentNode = createNode(this, node.parent)

      if (parentNode.children.indexOf(id) === -1) {
        parentNode.children.push(id)
      }

      this.nodes[node.parent] = parentNode
    } else {
      this.root = id
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
    id = id || this.root

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

    var key = Lrud.KEY_CODES[event.keyCode]

    if (key === Lrud.KEY_MAP.ENTER) {
      return this.emit('select', id)
    }

    if (isValidLRUDEvent(event, node)) {
      var activeChild = node.activeChild || node.children[0]
      var activeIndex = node.children.indexOf(activeChild)
      var offset = either(key, Lrud.KEY_MAP.RIGHT, Lrud.KEY_MAP.DOWN) ? 1 : -1
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
        return event.stopPropagation()
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

Lrud.KEY_MAP = KEY_MAP
Lrud.KEY_CODES = KEY_CODES

module.exports = Lrud
