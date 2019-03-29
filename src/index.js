const _ = require('./lodash.custom.min.js')

class Lrud {
  constructor ({ tree, rootNodeId } = {}) {
    this.tree = tree || {}
    this.rootNodeId = rootNodeId || null
  }

  getRootNodeId () {
    return this.rootNodeId
  }

  registerNode (nodeId, node = {}) {
    if (Object.keys(this.tree).length <= 0) {
      this.rootNodeId = nodeId
      this.tree[nodeId] = node
      return this.tree
    }
  }

  getNode (nodeId) {

  }

  getTree () {
    return this.tree
  }
}

module.exports = Lrud
