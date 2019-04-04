const _ = require('./lodash.custom.min.js')
const EventEmitter = require('tiny-emitter')

class Lrud {
  constructor ({ tree, rootNodeId, currentFocusId } = {}) {
    this.tree = tree || {}
    this.nodeIdList = []
    this.rootNodeId = rootNodeId || null
    this.currentFocusId = currentFocusId || null
    this.emitter = new EventEmitter()
  }

  getRootNodeId () {
    return this.rootNodeId
  }

  getPathForNodeId (nodeId) {
    return this.nodeIdList.find(path => path.endsWith('.' + nodeId))
  }

  registerNode (nodeId, node = {}) {
    // if this is the very first node, set it as root
    if (Object.keys(this.tree).length <= 0) {
      this.rootNodeId = nodeId
      this.tree[nodeId] = node
      this.nodeIdList.push(nodeId)
      return this.tree
    }

    // if this node DOESNT have a parent assume its parent is root
    if (node.parent == null && nodeId !== this.rootNodeId) {
      node.parent = this.rootNodeId
    }

    // path is the node's parent plus itself (under `children`)
    let path = this.nodeIdList.find(path => path.endsWith(node.parent)) + '.children.' + nodeId

    _.set(this.tree, path, node)
    this.nodeIdList.push(path)
    return this
  }

  unregisterNode (nodeId) {
    const path = this.getPathForNodeId(nodeId)

    if (!path) {
      return
    }

    // remove it from the tree
    _.set(this.tree, path, undefined)

    // remove the relevant entry from the node id list
    this.nodeIdList.splice(this.nodeIdList.indexOf(path), 1)

    // remove all its children from the node ID list
    this.nodeIdList = this.nodeIdList.filter(nodeIdPath => {
      return !(nodeIdPath.includes('.' + nodeId))
    })

    // TODO handle if they're focused on this node

    return this
  }

  getNode (nodeId) {
    return this.getNodeByPath(this.getPathForNodeId(nodeId))
  }

  getNodeIdList () {
    return this.nodeIdList
  }

  getNodeByPath (path) {
    return _.get(this.tree, path)
  }

  deleteNodeByPath (path) {
    // remove last dot and everything after it
  }

  pickNodeByPath (path) {
    const node = this.getNode(path)
    this.deleteNode(path)
    return node
  }

  getTree () {
    return this.tree
  }

  _handleKeyEvent (event, nodeId) {
    const node = this.getNode(nodeId)
  }

  handleKeyEvent (event) {
    this._handleKeyEvent(event, this.currentFocusId)
  }
}

module.exports = Lrud
