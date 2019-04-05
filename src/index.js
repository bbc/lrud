const _ = require('./lodash.custom.min.js')
const EventEmitter = require('tiny-emitter')

class Lrud {
  constructor ({ rootNodeId, currentFocusNodePath } = {}) {
    this.tree = {}
    this.nodePathList = []
    this.rootNodeId = rootNodeId || null
    this.currentFocusNodePath = currentFocusNodePath || null
    this.emitter = new EventEmitter()
  }

  on (eventName, callback) {
    this.emitter.on(eventName, callback)
  }

  getRootNodeId () {
    return this.rootNodeId
  }

  getPathForNodeId (nodeId) {
    return this.nodePathList.find(path => path.endsWith('.' + nodeId))
  }

  registerNode (nodeId, node = {}) {
    // if this is the very first node, set it as root
    if (Object.keys(this.tree).length <= 0) {
      this.rootNodeId = nodeId
      this.tree[nodeId] = node
      this.nodePathList.push(nodeId)
      return this.tree
    }

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

  _handleKeyEvent (event, nodeId) {
    const node = this.getNode(nodeId)
  }

  handleKeyEvent (event) {
    this._handleKeyEvent(event, this.currentFocusNodePath)
  }
}

module.exports = Lrud
