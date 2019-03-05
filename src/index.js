var EventEmitter = require('tiny-emitter')
var KeyCodes = require('./key-codes')

var either = function (arg, a, b) { return arg === a || arg === b }
var isList = function (node) { return node && !!node.orientation }
var isEnabled = function (id) { return this.nodes[id] && !this.nodes[id].disabled }

function assign (target) {
  for (var i = 1; i < arguments.length; i++) {
    var subject = Object(arguments[i])
    for (var prop in subject) {
      if (subject.hasOwnProperty(prop)) {
        target[prop] = subject[prop]
      }
    }
  }
  return target
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

/**
 *
 * @param {object} params any params used used during instance construction
 * @param {object} params.overrides any params used used during instance construction
 * @param {string} params.overrides.id id of the node for an override to trigger on
 * @param {string} params.overrides.direction direction for the override to trigger on
 * @param {string} params.overrides.target node to set focus to after override triggered
 */
function Lrud (params) {
  if (params == null) { params = [] }
  this.nodes = {}
  this.overrides = params.overrides || {}
  this.root = null
  this.currentFocus = null
}

Lrud.prototype = Object.create(EventEmitter.prototype)

assign(Lrud.prototype, {
  register: function (id, props) {
    if (!id) throw new Error('Attempting to register with an invalid id')

    var node = this._createNode(id, props)

    if (node.parent) {
      var parentNode = this._createNode(node.parent)

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
      this.blur()
      this.currentFocus = undefined
    }

    delete this.nodes[id]
    node.children.forEach(this.unregister.bind(this))
  },

  blur: function (id) {
    var node = this.nodes[id] || this.nodes[this.currentFocus]
    if (!node) return

    var clone = assign({}, node)

    if (node.onBlur) {
      node.onBlur(clone)
    }

    this.emit('blur', clone)
  },

  focus: function (id) {
    var node = this.nodes[id] || this.nodes[this.currentFocus] || this.nodes[this.root]
    if (!node) return

    var activeChild = this._getActiveChild(node)
    if (activeChild) {
      return this.focus(activeChild)
    }

    this.blur()

    var clone = assign({}, node)

    if (node.onFocus) {
      node.onFocus(clone)
    }

    this.emit('focus', clone)

    this._bubbleActive(node.id)
    this.currentFocus = node.id
  },

  handleKeyEvent: function (event) {
    this._bubbleKeyEvent(event, this.currentFocus)
  },

  destroy: function () {
    this.e = {}
    this.nodes = {}
    this.root = null
    this.currentFocus = null
  },

  setActiveChild: function (id, child) {
    var node = this.nodes[id]
    var childNode = this.nodes[child]

    if (!node || node.children.indexOf(child) === -1 || !childNode || childNode.disabled) {
      return
    }

    if (node.activeChild !== child) {
      if (node.activeChild) {
        this.emit('inactive', assign({}, this.nodes[node.activeChild]))
      }

      this.emit('active', assign({}, this.nodes[child]))
      node.activeChild = child
    }
  },

  setActiveIndex: function (id, index) {
    var node = this.nodes[id]
    if (!node) return

    this.setActiveChild(id, node.children[index])
  },

  getNodeById: function (id) {
    return this.nodes[id]
  },

  getFocusedNode: function () {
    return this.nodes[this.currentFocus]
  },

  // Search down the active brach of the tree only...
  searchDown: function (node, predicate) {
    var id = this._getActiveChild(node)
    var child = this.nodes[id]

    if (child && !predicate(child)) {
      return this.searchDown(child, predicate)
    }

    return child
  },

  searchUp: function (node, predicate) {
    var parent = this.nodes[node.parent]

    if (parent && !predicate(parent)) {
      return this.searchUp(parent, predicate)
    }

    return parent
  },

  _createNode: function (id, props) {
    return assign({ id: id, children: [] }, this.nodes[id], props)
  },

  _updateGrid: function (activeId, nextId) {
    var activeNode = this.nodes[activeId]
    var nextNode = this.nodes[nextId]

    // Ignore if we're not moving from a grid item to another grid item
    if (!activeNode || !nextNode || !activeNode.grid || !nextNode.grid) return

    var activeChild = this._getActiveChild(activeNode)
    var activeIndex = activeNode.children.indexOf(activeChild)

    var nodeToUpdate = !isList(nextNode) ? this.searchDown(nextNode, isList) : nextNode

    if (!nodeToUpdate) return

    // Focus closest enabled node
    var left = nodeToUpdate.children.slice(0, activeIndex).filter(isEnabled.bind(this))
    var right = nodeToUpdate.children.slice(activeIndex).filter(isEnabled.bind(this))

    this.setActiveIndex(nodeToUpdate.id, nodeToUpdate.children.indexOf(right[0] || left[left.length - 1]))
  },

  _getActiveChild: function (node) {
    return node.activeChild || node.children.filter(isEnabled.bind(this))[0]
  },

  _getNextActiveIndex: function (node, offset, index) {
    var currIndex = index + offset
    var listSize = node.children.length
    var nextIndex = node.wrapping ? (currIndex + listSize) % listSize : currIndex
    var targetId = node.children[nextIndex]
    var target = this.nodes[targetId]

    // Skip if this node is disabled
    if (target && target.disabled) {
      return this._getNextActiveIndex(node, offset, nextIndex)
    }

    return nextIndex
  },

  _bubbleKeyEvent: function (event, id) {
    var node = this.nodes[id]

    if (!node) return

    var key = Lrud.KEY_CODES[event.keyCode]

    if (key === Lrud.KEY_MAP.ENTER) {
      var clone = assign({}, node)

      if (node.onSelect) {
        node.onSelect(clone)
      }

      this.emit('select', clone)
      return
    }

    var foundOverrides = false

    /**
     * for a given overrideId, find that override from the this.override object
     * if the override exists, and its id matches id and direction matches key, run _assignFocus
     *
     * @param {string} overrideId
     */
    var handleOverride = function (overrideId) {
      var override = this.overrides[overrideId]
      if (!override) {
        return
      }
      if (override.id === id && key === override.direction) {
        var offset = (override.direction === 'RIGHT' || override.direction === 'DOWN') ? 1 : -1
        var nextActiveIndex = 0
        var activeIndex = 0
        if (this.nodes[override.target].parent != null) {
          nextActiveIndex = this.nodes[this.nodes[override.target].parent].children.indexOf(override.target)
        }
        if (this.nodes[override.id].parent != null) {
          activeIndex = this.nodes[this.nodes[override.id].parent].children.indexOf(override.id)
        }

        this._assignFocus(
          this._getActiveChild(node), // activeChildId
          override.target, // nextActiveChild (becomes the enter.id for the move event)
          nextActiveIndex,
          activeIndex,
          offset, // offset
          event, // event
          this.nodes[override.target], // node,
          this.nodes[this.nodes[override.target].parent].id, // an override for the move object id
          override.id // an override for the move object leave.id
        )
        foundOverrides = true
      }
    }.bind(this)

    Object.keys(this.overrides).forEach(handleOverride)

    if (foundOverrides) {
      return
    }

    if (isValidLRUDEvent(event, node)) {
      var activeChild = this._getActiveChild(node)
      var activeIndex = node.children.indexOf(activeChild)
      var offset = either(key, Lrud.KEY_MAP.RIGHT, Lrud.KEY_MAP.DOWN) ? 1 : -1
      var nextActiveIndex = this._getNextActiveIndex(node, offset, activeIndex)
      var nextActiveChild = node.children[nextActiveIndex]

      var child = this.nodes[nextActiveChild]

      if (child == null) {
        this._bubbleKeyEvent(event, node.parent)
        return
      }

      if (child.children.length <= 0 && child.selectAction == null && child.orientation == null) {
        return
      }

      if (nextActiveChild) {
        this._assignFocus(activeChild, nextActiveChild, nextActiveIndex, activeIndex, offset, event, node)
        return
      }
    }

    this._bubbleKeyEvent(event, node.parent)
  },

  /**
   *
   * @param {*} id
   */
  _bubbleActive: function (id) {
    var node = this.nodes[id]

    if (node.parent) {
      this.setActiveChild(node.parent, id)
      this._bubbleActive(node.parent)
    }
  },

  /**
   * insert a new node or replace a current node of the same id
   * @func upsert
   * @param {string} id
   * @param {object} props
   */
  upsert: function (id, props) {
    if (!id) throw new Error('Attempting to register with an invalid id')

    var self = this

    if (this.nodes[id] && this.nodes[id].children) {
      this.nodes[id].children.forEach(function (childId) {
        self.unregister(childId)
      })
    }

    self.register(id, props)
  },

  /**
   * assign focus from one child of a node to another
   *
   * @param {string} activeChildId id of the current active child of the node
   * @param {string} nextActiveChildId id of the next child of the node to focus on
   * @param {number} nextActiveIndex index of the next child to focus on (index from the node.children array)
   * @param {number} activeIndex index of the current child (index from the node.children array)
   * @param {number} offset 1 if moving right/down, -1 if moving left/up, 0 for override
   * @param {object} event the event that triggered the focus assignment
   * @param {object} node the navigation node we're acting on
   */
  _assignFocus: function (activeChildId, nextActiveChildId, nextActiveIndex, activeIndex, offset, event, node, moveId, moveLeaveId) {
    this._updateGrid(activeChildId, nextActiveChildId)
    var moveEvent = assign({}, node, {
      offset: offset,
      enter: {
        id: nextActiveChildId,
        index: nextActiveIndex
      },
      leave: {
        id: activeChildId,
        index: activeIndex
      }
    })

    if (moveId != null) {
      moveEvent.id = moveId
      moveEvent.parent = this.nodes[moveId].parent
      moveEvent.children = this.nodes[moveId].children
      if (this.nodes[moveId].activeChild) {
        moveEvent.activeChild = this.nodes[moveId].activeChild
      }
    }

    if (moveLeaveId != null) {
      moveEvent.leave.id = moveLeaveId
    }

    if (node.onMove) {
      node.onMove(moveEvent)
    }

    this.emit('move', moveEvent)

    this.focus(nextActiveChildId)
    event.stopPropagation()
  }

})

Lrud.KEY_MAP = KeyCodes.map
Lrud.KEY_CODES = KeyCodes.codes

module.exports = Lrud
