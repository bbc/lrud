import { KeyCodes } from './key-codes'
import { Node } from './interfaces'

/**
 * given an array of values and a goal, return the value from values which is closest to the goal
 *
 * @param {number[]} values
 * @param {number} goal
 */
export const Closest = (values: [number], goal: number): number => values.reduce(function (prev, curr) {
  return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev)
})

/**
 * String.endsWith helper
 */
export const endsWith = (str, suffix): boolean => str.indexOf(suffix, str.length - suffix.length) !== -1

/**
 * Array.prototype.find helper
 */
export const arrayFind = <A>(arr: A[], func): A | undefined => {
  const len = arr.length
  let i = 0
  while (i < len) {
    if (func(arr[i], i, arr)) {
      return arr[i]
    }
    i++
  }
  return undefined
}

/**
 * check if a given node is focusable
 *
 * @param {object} node
 */
export const isNodeFocusable = (node: Node): boolean => {
  if (!node) return false
  return node.isFocusable != null ? node.isFocusable : !!node.selectAction
}

/**
 * given a keyCode, lookup and return the direction from the keycodes mapping file
 *
 * @param {number} keyCode
 */
export const getDirectionForKeyCode = (keyCode: number): string | null => {
  const direction = KeyCodes.codes[keyCode]
  if (direction) {
    return direction.toUpperCase()
  }
  return null
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
export const isDirectionAndOrientationMatching = (orientation, direction): boolean => {
  if (!orientation || !direction) {
    return false
  }

  orientation = orientation.toUpperCase()
  direction = direction.toUpperCase()

  return (
    (direction === '*') ||
        (orientation === 'VERTICAL' && (direction === 'UP' || direction === 'DOWN')) ||
        (orientation === 'HORIZONTAL' && (direction === 'LEFT' || direction === 'RIGHT'))
  )
}

/**
 * Checks if the given node is a root of the path.
 *
 * @param {string} path
 * @param {string} nodeId
 */
export const isNodeIdTheRootOfPath = (path: string, nodeId: string): boolean => !!path && !!nodeId && path.lastIndexOf(nodeId + '.', 0) === 0

/**
 * Checks if the given node is a child in the middle of the path.
 *
 * @param {string} path
 * @param {string} nodeId
 */
export const isNodeIdInTheMiddleOfPath = (path: string, nodeId: string): boolean => !!path && !!nodeId && path.indexOf('.' + nodeId + '.') !== -1

/**
 * Checks if the given node is a leaf in the path.
 *
 * @param {string} path
 * @param {string} nodeId
 */
export const isNodeIdTheLeafOfPath = (path: string, nodeId: string): boolean => !!path && !!nodeId && endsWith(path, '.' + nodeId)

/**
 * is the given node in the path, return true
 *
 * @param {string} path
 * @param {string} nodeId
 */
export const isNodeIdInPath = (path: string, nodeId: string): boolean => isNodeIdTheRootOfPath(path, nodeId) || isNodeIdInTheMiddleOfPath(path, nodeId) || isNodeIdTheLeafOfPath(path, nodeId)


/**
 * return a child from the given node whose indexRange encompases the given index
 *
 * @param {object} node
 * @param {number} index
 */
export const _findChildWithMatchingIndexRange = (node, index): Node => {
  if (!node || !node.children) {
    return null
  }

  const childWithIndexRangeSpanningIndex = arrayFind(Object.keys(node.children), childId => {
    const child = node.children[childId]
    return child.indexRange && (child.indexRange[0] <= index && child.indexRange[1] >= index)
  })

  if (childWithIndexRangeSpanningIndex) {
    return node.children[childWithIndexRangeSpanningIndex]
  }
}

/**
 * return a child from the given node whose index matches the given index
 *
 * @param {object} node
 * @param {number} index
 */
export const _findChildWithIndex = (node, index): Node => {
  if (!node || !node.children) {
    return null
  }

  const childIdWithMatchingIndex = arrayFind(Object.keys(node.children), childId => {
    const childNode = node.children[childId]
    return childNode.index === index
  })

  if (childIdWithMatchingIndex) {
    return node.children[childIdWithMatchingIndex]
  }

  return null
}

/**
 * return a child from the given node whose index is numerically closest to the given
 * index. if an indexRange is provided, first check if the node's activeChild is inside
 * the indexRange. if it is, return the activeChild node instead
 *
 * @param {object} node
 * @param {index} index
 * @param {number[]} indexRange
 */
export const _findChildWithClosestIndex = (node, index, indexRange = null): Node => {
  if (!node || !node.children) {
    return null
  }

  // if we have an indexRange, and the nodes active child is inside that index range,
  // just return the active child
  const activeChild = node.children[node.activeChild]
  if (indexRange && activeChild && activeChild.index >= indexRange[0] && activeChild.index <= indexRange[1] && isNodeFocusable(activeChild)) {
    return activeChild
  }

  const indexes = Object.keys(node.children)
    .filter(childId => isNodeFocusable(node.children[childId]) || node.children[childId].children)
    .map(childId => node.children[childId].index) as [number]

  if (indexes.length <= 0) {
    return null
  }
  return _findChildWithIndex(node, Closest(indexes, index))
}

export const isNodeInTree = (nodeId: string, tree: object): boolean => {
  if (!nodeId || !tree) return false

  let nodeInTree = false

  const _isNodeInTree = (tree): void => {
    Object.keys(tree).forEach(treeProperty => {
      if (nodeId === treeProperty) {
        nodeInTree = true
      }

      if (tree[treeProperty].children) {
        _isNodeInTree(tree[treeProperty].children)
      }
    })
  }

  _isNodeInTree(tree)

  return nodeInTree
}

export const getNodesFromTree = (tree: object): Node[] => {
  const nodes: Node[] = []

  const _getNodesFromTree = (tree, parent): void => {
    Object.keys(tree).forEach(treeProperty => {
      const _parent = tree[treeProperty].parent || parent
      nodes.push({
        ...tree[treeProperty],
        id: treeProperty,
        children: undefined,
        parent: _parent
      })

      if (tree[treeProperty].children) {
        _getNodesFromTree(tree[treeProperty].children, treeProperty)
      }
    })
  }

  if (tree) {
    _getNodesFromTree(tree, undefined)
  }
  return nodes
}
