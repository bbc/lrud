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
  }

  unregisterNode (nodeId) {

  }

  getNode (nodeId) {
    return this.getNodeByPath(this.nodeIdList.find(path => path.endsWith('.' + nodeId)))
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
    this._handleKeyEvent(event, this.currentFocus)
  }
}

module.exports = Lrud
