const _ = require('./lodash.custom.min.js')
const EventEmitter = require('tiny-emitter')
const KeyCodes = require('./key-codes')

class Lrud {
  constructor ({ rootNodeId, currentFocusNodePath } = {}) {
    this.tree = {}
    this.nodePathList = []
    this.focusableNodePathList = []
    this.rootNodeId = rootNodeId || null
    this.currentFocusNodeId = null
    this.currentFocusNodeIndex = null
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
   * @param {object} [node.id] if null, `nodeId` is used
   * @param {object} [node.parent] if null, value of `this.rootNodeId` is used
   * @param {object} [node.index] if null, index is 1 more than the index of the last sibling. if no previous siblings, index is 1
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

  unregisterNode (nodeId) {
    const path = this.getPathForNodeId(nodeId)

    if (!path) {
      return
    }

    // get a copy of the node to pass to the blur event
    const nodeClone = _.get(this.tree, path)

    const parentNode = this.getNode(nodeClone.parent)

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

    // if its parent's active child is the node we're unregistering (i.e
    // we're focused on the only leaf of a branch) then unset that, dig up
    // to a workable node, grab that nodes previous child, and dig down from there
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

  // climb up
  climbUp (node, direction) {
    if (!node.orientation && !node.children) {
      // we're on a leaf, try the parent
      if (node.parent) {
        return this.climbUp(this.getNode(node.parent), direction)
      }
      // if we dont have an orientation, or children, or a parent, its dead
      return null
    }

    // if we dont have any children, dig up
    if (!node.children) {
      return this.climbUp(this.getNode(node.parent), direction)
    }

    // we have children, but the orientation doesn't match, so try our parent
    if (!this.isDirectionAndOrientationMatching(node.orientation, direction)) {
      return this.climbUp(this.getNode(node.parent), direction)
    }

    // if the node we're on contains no focusable children, bubble up again
    if (!this._isNodeInFocusableNodePathList(node)) {
      return this.climbUp(this.getNode(node.parent), direction)
    }

    // so now the orientation matches the direction, and it has children,
    // so we return it
    return node
  }

  // dig down
  digDown (node) {
    // if the active child is focusable, return it
    if (this._isFocusableNode(node)) {
      return node
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

    return this.getNode(node.activeChild)
  }

  /**
   * get the semantic "next" child for a node
   * @param {object} node
   */
  getNextChild (node) {
    const childKeys = Object.keys(node.children)

    const indexOfCurrentChild = childKeys.indexOf(node.activeChild)

    if (indexOfCurrentChild === childKeys.length - 1) {
      // we're on the last child
      if (node.wraps) {
        return this.getNodeFirstChild(node)
      } else {
        return node.children[childKeys[indexOfCurrentChild]]
      }
    } else {
      return node.children[childKeys[indexOfCurrentChild + 1]]
    }
  }

  /**
   * get the semantic "previous" child for a node
   * @param {object} node
   */
  getPrevChild (node) {
    const childKeys = Object.keys(node.children)

    const indexOfCurrentChild = childKeys.indexOf(node.activeChild)

    if (indexOfCurrentChild === -1) {
      return node.children[childKeys[0]]
    }

    if (indexOfCurrentChild === childKeys[0]) {
      // we're on the first child
      if (node.wraps) {
        return this.getNodeLastChild(node)
      } else {
        return node.children[childKeys[indexOfCurrentChild]]
      }
    } else {
      return node.children[childKeys[indexOfCurrentChild - 1]]
    }
  }

  getNodeFirstChild (node) {
    if (!node.children) {
      return undefined
    }

    return this.getNode(Object.keys(node.children)[0])
  }

  getNodeLastChild (node) {
    if (!node.children) {
      return undefined
    }

    const childrenIds = Object.keys(node.children)

    return this.getNode(childrenIds[childrenIds.length - 1])
  }

  handleKeyEvent (event) {
    const direction = event.direction

    const currentFocusedNode = this.getNode(this.currentFocusNodeId)

    // dig up...
    const actionableNode = this.climbUp(currentFocusedNode, direction)

    // ...get the top's next child...
    const nextChild = this.getNextChildInDirection(actionableNode, direction)

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
    this.currentFocusNodeIndex = node.index

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
