const find = (tree, nodeId) => {
  if (tree.hasOwnProperty(nodeId)) {
    return nodeId
  }

  let path = ''

  for (let key in tree) {
    let foundId = find(tree[key], nodeId)
    if (foundId) {
      path += key + '.' + foundId
    }
  }

  return path
}

module.exports = {
  find
}
