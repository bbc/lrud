const _ = require('./lodash.custom.min.js')
const Flatten = require('flat')
const EventEmitter = require('tiny-emitter')
class Lrud {
  constructor ({ tree, rootNodeId, currentFocusId } = {}) {
    this.tree = tree || {}
    this.flattenedTree = {}
    this.nodeIdList = []
    this.rootNodeId = rootNodeId || null
    this.currentFocusId = currentFocusId || null
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
      this.flattenedTree = Flatten(this.tree)
      return this.tree
    }

    // if this node DOESNT have a parent, assume its parent is root
    if (node.parent == null) {
      node.parent = this.rootNodeId
      this.nodeIdList.push(this.rootNodeId + '.children.' + nodeId)
      _.set(this.tree, `${this.rootNodeId}.children.${nodeId}`, node)
      this.flattenedTree = Flatten(this.tree)
      return this.tree
    }

    let path = this.nodeIdList.find(path => path.endsWith('.' + node.parent))

    if (!path) {
      // parent doesn't exist in nodeIdList - stick it under the root and make a node for it
      path = this.rootNodeId + '.children.' + node.parent
      _.set(this.tree, path, {})
      this.nodeIdList.push(path)
      this.flattenedTree = Flatten(this.tree)
    }

    // at this point, `path` is the full path of the nodes parent, and the parent definitely exists
    // therefore we can just insert it
    path += '.children.' + nodeId
    _.set(this.tree, path, node)
    this.nodeIdList.push(path)
    this.flattenedTree = Flatten(this.tree)
  }

  getTree () {
    return this.tree
  }
}

module.exports = Lrud
