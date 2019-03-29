const _ = require('./lodash.custom.min.js')
const Utils = require('./utils')

class Lrud {
  constructor ({ tree, rootNodeId, currentFocusId } = {}) {
    this.tree = tree || {}
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
      return this.tree
    }

    // if this node DOESNT have a parent, assume its parent is root
    if (node.parent == null) {
      node.parent = this.rootNodeId
      _.set(this.tree, `${this.rootNodeId}.children.${nodeId}`, node)
      return this.tree
    }

    // if it DOES have a parent, find that parent in the tree and append the node at the right point
    const parentPath = Utils.find(this.tree, node.parent)
    _.set(this.tree, `${parentPath}.children.${nodeId}`, node)
  }

  getNode (nodeId) {

  }

  getTree () {
    return this.tree
  }
}

module.exports = Lrud
