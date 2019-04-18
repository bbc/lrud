const _ = require('./lodash.custom.min.js')
const EventEmitter = require('tiny-emitter')

const Closest = (values, goal) => values.reduce(function (prev, curr) {
  return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev)
})

class Lrud {
  constructor () {
    this.tree = {}
    this.nodePathList = []
    this.focusableNodePathList = []
    this.rootNodeId = null
    this.currentFocusNodeId = null
    this.currentFocusNodeIndex = null
    this.currentFocusNodeIndexRange = null
    this.isIndexAlignMode = false
    this.emitter = new EventEmitter()
    this.overrides = {}
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
    if (!orientation || !direction) {
      return false
    }

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
   * @param {function} [node.onLeave]
   * @param {function} [node.onEnter]
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

    // if we're trying to unregister a node that doesn't exist, exit out
    if (!path) {
      return
    }

    // get a copy of the node to pass to the blur event, and grab the parent to work with it
    const nodeClone = _.get(this.tree, path)
    const parentNode = this.getNode(nodeClone.parent)

    // delete the node itself (delete from the parent and re-set the parent later)
    delete parentNode.children[nodeId]

    // ...remove the relevant entry from the node id list
    this.nodePathList.splice(this.nodePathList.indexOf(path), 1)

    // ...remove all its children from the node ID list
    this.nodePathList = this.nodePathList.filter(nodeIdPath => {
      return !(nodeIdPath.includes('.' + nodeId))
    })

    // if the node we're unregistering was focusable, we need to remove it from
    // our focusableNodePathList
    this.focusableNodePathList = this.focusableNodePathList.filter(nodeIdPath => {
      return !(nodeIdPath.includes('.' + nodeId))
    })

    // ...if we're unregistering the activeChild of our parent (could be a leaf OR branch)
    // we need to recalculate the focus...
    if (parentNode.activeChild && parentNode.activeChild === nodeId) {
      delete parentNode.activeChild
      const top = this.climbUp(parentNode, '*')
      const prev = this.getPrevChild(top)
      const child = this.digDown(prev)
      this.assignFocus(child.id)
    }

    // ...we need to recalculate the indexes of all the parents children
    this._reindexChildrenOfNode(parentNode)

    // re-set the parent after we've deleted the node itself and amended the parents active child, etc.
    _.set(this.tree, this.getPathForNodeId(parentNode.id), parentNode)

    // blur on the nodeClone
    this.emitter.emit('blur', nodeClone)

    return this
  }

  registerOverride (overrideId, override) {
    if (!overrideId) {
      throw new Error('need an id to register an override')
    }
    this.overrides[overrideId] = override

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

    // if we have a matching override at this point in the climb, return that target node
    const matchingOverrideId = Object.keys(this.overrides).find(overrideId => {
      const override = this.overrides[overrideId]
      return override.id === node.id && override.direction.toUpperCase() === direction.toUpperCase()
    })
    if (matchingOverrideId) {
      return this.getNode(this.overrides[matchingOverrideId].target)
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
        child = this._findChildWithClosestIndex(node, this.currentFocusNodeIndex, this.currentFocusNodeIndexRange)
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

  _findChildWithClosestIndex (node, index, indexRange = null) {
    if (!node.children) {
      return null
    }

    // if we have an indexRange, and the nodes active child is inside that index range,
    // just return the active child
    const activeChild = this.getNode(node.activeChild)
    if (indexRange && activeChild && activeChild.index >= indexRange[0] && activeChild.index <= indexRange[1]) {
      return activeChild
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

  _reindexChildrenOfNode (node) {
    if (!node.children) {
      return
    }

    const children = Object.keys(node.children).map(childId => node.children[childId])

    children.sort(function (a, b) {
      return a.index - b.index
    })

    node.children = {}

    children.forEach((child, zeroBasedIndex) => {
      child.index = zeroBasedIndex + 1
      node.children[child.id] = child
    })

    _.set(this.tree, this.getPathForNodeId(node.id), node)

    return node
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
   * @param {object} event
   * @param {string} event.direction
   */
  handleKeyEvent (event) {
    const direction = event.direction.toUpperCase()
    const currentFocusNode = this.getNode(this.currentFocusNodeId)

    // climb up from where we are...
    const topNode = this.climbUp(currentFocusNode, direction)

    // ... if we cant find a top node, its an invalid move - just return
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

    // ...get the top's next child in the direction we're going...
    const nextChild = this.getNextChildInDirection(topNode, direction)

    // ...and depending on if we're able to find a child, dig down from the child or from the original top...
    const focusableNode = (nextChild) ? this.digDown(nextChild) : this.digDown(topNode)

    // ...and then assign focus
    this.assignFocus(focusableNode.id)

    // emit events and fire functions now that the move has completed
    this.emitter.emit('move', {
      leave: currentFocusNode,
      enter: focusableNode,
      offset: (direction === 'LEFT' || direction === 'UP') ? -1 : 1
    })
    if (currentFocusNode.onLeave) {
      currentFocusNode.onLeave()
    }
    if (focusableNode.onEnter) {
      focusableNode.onEnter()
    }

    return focusableNode
  }

  _isFocusableNode (node) {
    return !!(node.selectAction || node.isFocusable)
  }

  _setActiveChild (parentId, childId) {
    const child = this.getNode(childId)
    const parent = this.getNode(parentId)
    if (!child) {
      return
    }

    // the parent already has an active child, and its NOT the same child that we're now setting
    if (parent.activeChild && parent.activeChild !== child.id) {
      const currentActiveChild = this.getNode(parent.activeChild)
      parent.activeChild = child.id
      this.emitter.emit('inactive', currentActiveChild)
      this.emitter.emit('active', child)
    }

    // if the parent has a parent, bubble up
    if (parent.parent) {
      this._setActiveChild(parent.parent, parent.id)
    }
  }

  assignFocus (nodeId) {
    let node = this.getNode(nodeId)

    if (!this._isFocusableNode(node)) {
      node = this.digDown(node)
    }

    if (!node) {
      throw new Error('trying to assign focus to a non focusable node')
    }

    this.currentFocusNodeId = node.id

    if (node.indexRange) {
      this.currentFocusNodeIndex = node.indexRange[0]
      this.currentFocusNodeIndexRange = node.indexRange
    } else {
      this.currentFocusNodeIndex = node.index
    }

    if (node.parent) {
      this._setActiveChild(node.parent, node.id)
    }

    if (node.onFocus) {
      node.onFocus()
    }

    this.emitter.emit('focus', node)
  }
}

module.exports = Lrud
