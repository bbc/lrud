const _ = require('./lodash.custom.min.js')
const EventEmitter = require('tiny-emitter')
const KeyCodes = require('./key-codes')

const Closest = (values, goal) => values.reduce(function (prev, curr) {
  return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev)
})

class Lrud {
  constructor ({ rootNodeId, currentFocusNodePath } = {}) {
    this.tree = {}
    this.nodePathList = []
    this.focusableNodePathList = []
    this.rootNodeId = rootNodeId || null
    this.currentFocusNodeId = null
    this.currentFocusNodeIndex = null
    this.isIndexAlignMode = false
    this.emitter = new EventEmitter()
  }

  /**
   * given an orientation and a direction, do they match? i.e an
   * orientation `horizontal` and direction `left` or `right` is considered matching.
   *
   * direction CAN be passed as `*` (wildcard). this will always return true
   *
   * @param {string} orientation
   * @param {string} direction
   */
  isDirectionAndOrientationMatching (orientation, direction) {
    orientation = orientation.toUpperCase()
    direction = direction.toUpperCase()

    return (
      (direction === '*') ||
      (orientation === 'VERTICAL' && (direction === 'UP' || direction === 'DOWN')) ||
      (orientation === 'HORIZONTAL' && (direction === 'LEFT' || direction === 'RIGHT'))
    )
  }

  /**
   *
   * @param {string} eventName event to subscribe to
   * @param {function} callback function to call on event
   */
  on (eventName, callback) {
    this.emitter.on(eventName, callback)
  }

  /**
   * return the root node
   */
  getRootNode () {
    const node = this.getNode(this.rootNodeId)

    if (!node) {
      throw new Error('no root node')
    }

    return node
  }

  /**
   * given a node id, return the full path for it
   * @param {string} nodeId
   */
  getPathForNodeId (nodeId) {
    if (nodeId === this.rootNodeId) {
      return this.rootNodeId
    }
    return this.nodePathList.find(path => path.endsWith('.' + nodeId))
  }

  /**
   *
   * @param {string} nodeId
   * @param {object} node
   * @param {string} [node.id] if null, `nodeId` is used
   * @param {string} [node.parent] if null, value of `this.rootNodeId` is used
   * @param {number} [node.index] if null, index is 1 more than the index of the last sibling. if no previous siblings, index is 1
   * @param {number[]} [node.indexRange] defaults to null. acts as a colspan, value [0] is lower bound, value [1] is upper bound
   * @param {function} [node.selectAction]
   * @param {boolean} [node.isFocusable]
   * @param {boolean} [node.isWrapping]
   * @param {string} [node.orientation]
   * @param {boolean} [node.isVerticalIndexAlign]
   * @param {boolean} [node.isHorizontalIndexAlign]
   * @param {boolean} [node.isIndexAlign]
   */
  registerNode (nodeId, node = {}) {
    if (!node.id) {
      node.id = nodeId
    }

    // if this is the very first node, set it as root and return...
    if (Object.keys(this.tree).length <= 0) {
      this.rootNodeId = nodeId
      this.tree[nodeId] = node
      this.nodePathList.push(nodeId)
      return this
    }

    // if this node DOESNT have a parent assume its parent is root
    if (node.parent == null && nodeId !== this.rootNodeId) {
      node.parent = this.rootNodeId
    }

    // if this node is the first child of its parent, we need to set its parent's `activeChild`
    // to it so that the parent always has an `activeChild` value
    // we can tell if its parent has any children by checking the nodePathList for
    // entries containing '<parent>.children'
    const parentsChildPaths = this.nodePathList.find(path => path.includes(node.parent + '.children'))
    if (parentsChildPaths == null) {
      const parentPath = this.getPathForNodeId(node.parent)
      _.set(this.tree, parentPath + '.activeChild', nodeId)
    }

    // if no `index` set, calculate it
    if (!node.index) {
      let parentsChildren = this.getNode(node.parent).children
      if (!parentsChildren) {
        node.index = 1
      } else {
        node.index = (Object.keys(parentsChildren).length) + 1
      }
    }

    // add the node into the tree
    // path is the node's parent plus 'children' plus itself
    let path = this.nodePathList.find(path => path.endsWith(node.parent)) + '.children.' + nodeId
    _.set(this.tree, path, node)
    this.nodePathList.push(path)

    // if the node is focusable, we want to add its path to our focusableNodePathList
    if (this._isFocusableNode(node)) {
      this.focusableNodePathList.push(path)
    }
    return this
  }

  /**
   *
   * @param {string} nodeId
   */
  unregisterNode (nodeId) {
    const path = this.getPathForNodeId(nodeId)

    if (!path) {
      return
    }

    // get a copy of the node to pass to the blur event
    const nodeClone = _.get(this.tree, path)

    const parentNode = this.getNode(nodeClone.parent)

    // delete the node itself (delete from the parent and reset the parent later)
    delete parentNode.children[nodeId]

    // remove the relevant entry from the node id list
    this.nodePathList.splice(this.nodePathList.indexOf(path), 1)

    // remove all its children from the node ID list
    this.nodePathList = this.nodePathList.filter(nodeIdPath => {
      return !(nodeIdPath.includes('.' + nodeId))
    })

    // if the node we're unregistering was focusable, we need to remove it from
    // our focusableNodePathList
    this.focusableNodePathList = this.focusableNodePathList.filter(nodeIdPath => {
      return !(nodeIdPath.includes('.' + nodeId))
    })

    // if its parent's activeChild is the node we're unregistering
    // we need to reset the focus
    if (parentNode.activeChild && parentNode.activeChild === nodeId) {
      delete parentNode.activeChild
      const top = this.climbUp(parentNode, '*')
      const prev = this.getPrevChild(top)
      const child = this.digDown(prev)
      this.assignFocus(child.id)
    }

    // reset the parent after we've deleted it and amended the parents active child, etc.
    _.set(this.tree, this.getPathForNodeId(parentNode.id), parentNode)

    // blur on the nodeClone
    this.emitter.emit('blur', nodeClone)

    return this
  }

  /**
   * return a node based on ID
   * @param {string} nodeId node id
   */
  getNode (nodeId) {
    return _.get(this.tree, (this.getPathForNodeId(nodeId)))
  }

  /**
   * return a node by ID and then unregister it from the instance
   * @param {string} nodeId node id
   */
  pickNode (nodeId) {
    const path = this.getPathForNodeId(nodeId)

    if (!path) {
      return
    }

    const node = _.get(this.tree, path)
    this.unregisterNode(nodeId)
    return node
  }

  /**
   * is the given node in the path of ANY node that is focusable
   * @param {*} node
   */
  _isNodeInFocusableNodePathList (node) {
    return this.focusableNodePathList.some(nodeIdPath => {
      if (nodeIdPath.includes('.' + node.id + '.')) {
        return true
      }
      if (node.id === this.rootNodeId && nodeIdPath.includes(node.id + '.')) {
        return true
      }
      return false
    })
  }

  /**
   *
   * @param {object} node
   * @param {string} direction
   */
  climbUp (node, direction) {
    if (!node) {
      return null
    }

    // if we're on a leaf, climb up
    if (this._isFocusableNode(node)) {
      return this.climbUp(this.getNode(node.parent), direction)
    }

    // if the node we're on contains no focusable children, climb up
    if (!this._isNodeInFocusableNodePathList(node)) {
      return this.climbUp(this.getNode(node.parent), direction)
    }

    // we have children, but the orientation doesn't match, so try our parent
    if (!this.isDirectionAndOrientationMatching(node.orientation, direction)) {
      return this.climbUp(this.getNode(node.parent), direction)
    }

    let nextChildInDirection = this.getNextChildInDirection(node, direction)

    // if we dont have a next child, just return the node. this is primarily for use during unregistering
    if (!nextChildInDirection) {
      return node
    }

    // if the next child in the direction is both the same as this node's activeChild
    // AND a leaf, bubble up too - handles nested wrappers, like docs/test-diagrams/fig-3.png
    const isNextChildCurrentActiveChild = (nextChildInDirection && nextChildInDirection.id === node.activeChild)
    const isNextChildFocusable = this._isFocusableNode(this.getNode(node.activeChild))
    const isNodeInFocusablePath = this._isNodeInFocusableNodePathList(node)
    if (isNextChildCurrentActiveChild && (isNextChildFocusable || isNodeInFocusablePath)) {
      return this.climbUp(this.getNode(node.parent), direction)
    }

    return node
  }

  /**
   *
   * @param {object} node
   */
  digDown (node) {
    // if the active child is focusable, return it
    if (this._isFocusableNode(node)) {
      return node
    }

    const parent = this.getNode(node.parent)

    // we're in index align mode, so set the `node.activeChild` to the node's child of the same index
    // that the current `this.currentFocusNodeIndex` is
    // TODO probably refactor in specific alignment modes for vertical and horizontal
    if (this.isIndexAlignMode && !(node.orientation === 'vertical' && parent.orientation === 'vertical')) {
      let child = this._findChildWithMatchingIndexRange(node, this.currentFocusNodeIndex)

      if (!child) {
        child = this._findChildWithClosestIndex(node, this.currentFocusNodeIndex)
      }

      if (child) {
        node.activeChild = child.id
      }
    }

    // if we dont have an active child, use the first child
    if (!node.activeChild) {
      node.activeChild = this.getNodeFirstChild(node).id
    }

    const activeChild = this.getNode(node.activeChild)

    if (this._isFocusableNode(activeChild)) {
      return activeChild
    }

    return this.digDown(activeChild)
  }

  _findChildWithMatchingIndexRange (node, index) {
    if (!node.children) {
      return null
    }

    const childWithIndexRangeSpanningIndex = Object.keys(node.children).find(childId => {
      const child = node.children[childId]
      return child.indexRange && (child.indexRange[0] <= index && child.indexRange[1] >= index)
    })

    if (childWithIndexRangeSpanningIndex) {
      return node.children[childWithIndexRangeSpanningIndex]
    }
  }

  _findChildWithClosestIndex (node, index) {
    if (!node.children) {
      return null
    }
    const indexes = Object.keys(node.children).map(childId => node.children[childId].index)
    return this._findChildWithIndex(node, Closest(indexes, index))
  }

  _findChildWithIndex (node, index) {
    if (!node.children) {
      return null
    }

    const childIdWithMatchingIndex = Object.keys(node.children).find(childId => {
      const childNode = node.children[childId]
      return childNode.index === index
    })

    if (childIdWithMatchingIndex) {
      return node.children[childIdWithMatchingIndex]
    }

    return null
  }

  getNextChildInDirection (node, direction) {
    direction = direction.toUpperCase()

    if (node.orientation === 'horizontal' && direction === 'RIGHT') {
      return this.getNextChild(node)
    }
    if (node.orientation === 'horizontal' && direction === 'LEFT') {
      return this.getPrevChild(node)
    }
    if (node.orientation === 'vertical' && direction === 'DOWN') {
      return this.getNextChild(node)
    }
    if (node.orientation === 'vertical' && direction === 'UP') {
      return this.getPrevChild(node)
    }

    return null
  }

  /**
   * get the semantic "next" child for a node
   *
   * @param {object} node
   */
  getNextChild (node) {
    if (!node.activeChild) {
      node.activeChild = this.getNodeFirstChild(node).id
    }

    const currentActiveIndex = node.children[node.activeChild].index

    let nextChild = this._findChildWithIndex(node, currentActiveIndex + 1)

    if (!nextChild) {
      if (node.isWrapping) {
        nextChild = this.getNodeFirstChild(node)
      } else {
        nextChild = node.children[node.activeChild]
      }
    }

    return nextChild
  }

  /**
   * get the semantic "previous" child for a node
   * @param {object} node
   */
  getPrevChild (node) {
    if (!node.activeChild) {
      node.activeChild = this.getNodeFirstChild(node).id
    }

    const currentActiveIndex = node.children[node.activeChild].index

    let prevChild = this._findChildWithIndex(node, currentActiveIndex - 1)

    if (!prevChild) {
      // cant find a prev child, so the prev child is the current child
      if (node.isWrapping) {
        prevChild = this.getNodeLastChild(node)
      } else {
        prevChild = node.children[node.activeChild]
      }
    }

    return prevChild
  }

  /**
   * get the first child of a node, based on index
   * @param {object} node
   */
  getNodeFirstChild (node) {
    if (!node.children) {
      return undefined
    }

    const orderedIndexes = Object.keys(node.children).map(childId => node.children[childId].index).sort()

    return this._findChildWithIndex(node, orderedIndexes[0])
  }

  /**
   * get the last child of a node, based on index
   * @param {object} node
   */
  getNodeLastChild (node) {
    if (!node.children) {
      return undefined
    }

    const orderedIndexes = Object.keys(node.children).map(childId => node.children[childId].index).sort()

    return this._findChildWithIndex(node, orderedIndexes[orderedIndexes.length - 1])
  }

  /**
   *
   * @param {*} event
   */
  handleKeyEvent (event) {
    const direction = event.direction.toUpperCase()

    // climb up from where we are...
    const topNode = this.climbUp(this.getNode(this.currentFocusNodeId), direction)

    if (!topNode) {
      return
    }

    // ...if we need to align indexes, turn the flag on now...
    if ((direction === 'UP' || direction === 'DOWN') && topNode.isVerticalIndexAlign) {
      this.isIndexAlignMode = true
    }
    if ((direction === 'LEFT' || direction === 'RIGHT') && topNode.isHorizontalIndexAlign) {
      this.isIndexAlignMode = true
    }
    if (topNode.isIndexAlign) {
      this.isIndexAlignMode = true
    }

    // ...get the top's next child...
    const nextChild = this.getNextChildInDirection(topNode, direction)

    // ...and dig down from that child
    const focusableNode = this.digDown(nextChild)

    this.assignFocus(focusableNode.id)

    return focusableNode
  }

  _isFocusableNode (node) {
    return !!(node.selectAction || node.isFocusable)
  }

  _setActiveChild (parentId, childId) {
    // set the activeChild of the parent to the child
    const path = this.getPathForNodeId(parentId)
    _.set(this.tree, path + '.activeChild', childId)

    // then see if the parent has its OWN parent, and if it does, call again
    const parentsParent = _.get(this.tree, path + '.parent')
    if (parentsParent) {
      this._setActiveChild(parentsParent, parentId)
    }
  }

  assignFocus (nodeId) {
    const node = this.getNode(nodeId)

    if (!this._isFocusableNode(node)) {
      throw new Error('trying to assign focus to a non focusable node')
    }

    this.currentFocusNodeId = nodeId

    if (node.indexRange) {
      this.currentFocusNodeIndex = node.indexRange[0]
    } else {
      this.currentFocusNodeIndex = node.index
    }

    if (node.parent) {
      this._setActiveChild(node.parent, nodeId)
    }

    if (node.onFocus) {
      node.onFocus()
    }

    this.emitter.emit('focus', node)
  }
}

module.exports = Lrud
