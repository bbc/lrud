const find = (tree, nodeId) => {
  const keys = Object.keys(tree)

  let path = ''
  if (keys.includes(nodeId)) {
    path = nodeId
    return path
  }

  keys.forEach(key => {
    let findResult = find(tree[key], nodeId)
    if (findResult !== '') {
      path += key + '.' + findResult
      return path
    }
  })

  return path
}

module.exports = {
  find
}
