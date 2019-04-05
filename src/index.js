const _ = require('./lodash.custom.min.js')
const EventEmitter = require('tiny-emitter')
const KeyCodes = require('./key-codes')

class Lrud {
  constructor ({ rootNodeId, currentFocusNodePath } = {}) {
    this.tree = {}
    this.nodePathList = []
    this.rootNodeId = rootNodeId || null
    this.currentFocusNodePath = currentFocusNodePath || null
    this.emitter = new EventEmitter()
  }

  isDirectionAndOrientationMatching (orientation, direction) {
    orientation = orientation.toUpperCase()
    direction = direction.toUpperCase()

    return (
      (orientation === 'VERTICAL' && (direction === 'UP' || direction === 'DOWN')) ||
      (orientation === 'HORIZONTAL' && (direction === 'LEFT' || direction === 'RIGHT'))
    )
  }

  on (eventName, callback) {
    this.emitter.on(eventName, callback)
  }

  getRootNodeId () {
    return this.rootNodeId
  }

  getPathForNodeId (nodeId) {
    if (nodeId === this.rootNodeId) {
      return this.rootNodeId
    }
    return this.nodePathList.find(path => path.endsWith('.' + nodeId))
  }

  registerNode (nodeId, node = {}) {
    // if this is the very first node, set it as root an return...
    if (Object.keys(this.tree).length <= 0) {
      this.rootNodeId = nodeId
      this.tree[nodeId] = node
      this.nodePathList.push(nodeId)
      return this
    }

    // ...otherwise, set it up and insert it
    // if this node DOESNT have a parent assume its parent is root
    if (node.parent == null && nodeId !== this.rootNodeId) {
      node.parent = this.rootNodeId
    }

    // path is the node's parent plus itself (under `children`)
    let path = this.nodePathList.find(path => path.endsWith(node.parent)) + '.children.' + nodeId

    _.set(this.tree, path, node)
    this.nodePathList.push(path)
    return this
  }

  unregisterNode (nodeId) {
    const path = this.getPathForNodeId(nodeId)

    if (!path) {
      return
    }

    // get a copy of the node to pass to the blur event
    const nodeClone = _.get(this.tree, path)

    // remove it from the tree
    _.set(this.tree, path, undefined)

    // remove the relevant entry from the node id list
    this.nodePathList.splice(this.nodePathList.indexOf(path), 1)

    // remove all its children from the node ID list
    this.nodePathList = this.nodePathList.filter(nodeIdPath => {
      return !(nodeIdPath.includes('.' + nodeId))
    })

    if (this.currentFocusNodePath && this.currentFocusNodePath.includes('.' + nodeId)) {
      this.currentFocusNodePath = undefined
    }

    this.emitter.emit('blur', nodeClone)

    return this
  }

  getNode (nodeId) {
    return this.getNodeByPath(this.getPathForNodeId(nodeId))
  }

  getNodePathList () {
    return this.nodePathList
  }

  getNodeByPath (path) {
    return _.get(this.tree, path)
  }

  pickNode (nodeId) {
    const path = this.getPathForNodeId(nodeId)

    if (!path) {
      return
    }

    const node = this.getNodeByPath(path)
    this.unregisterNode(nodeId)
    return node
  }

  getTree () {
    return this.tree
  }

  // dig up
  _findNextActionableNode (nodePath, direction) {
    const node = this.getNodeByPath(nodePath)
    if (!node.orientation && !node.children) {
      // we're on a leaf, try the parent
      if (node.parent) {
        return this._findNextActionableNode(nodePath + '.parent', direction)
      }
      // if we dont have an orientation, or children, or a parent, its dead
      return null
    }

    if (!this.isDirectionAndOrientationMatching(node.orientation, direction)) {
      return false
    }
  }

  handleKeyEvent (event) {
    this._findNextActionableNode(event, this.currentFocusNodePath)
  }

  _isFocusableNode (node) {
    return !!(node.selectAction || node.isFocusable)
  }

  _isFocusableNodeByPath (path) {
    const node = this.getNodeByPath(path)
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

    if (node.parent) {
      this._setActiveChild(node.parent, nodeId)
    }
  }
}

module.exports = Lrud
