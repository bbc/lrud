import { KeyCodes } from './key-codes'
import {
  Direction,
  Directions,
  Node,
  NodeId,
  NodeIndex,
  NodeIndexRange,
  NodeTree,
  Orientation,
  Orientations
} from './interfaces'

/**
 * Given an array of values and a goal, return the value from values which is closest to the goal.
 *
 * @param {number[]} values
 * @param {number} goal
 */
export const closestIndex = (values: NodeIndex[], goal: NodeIndex): number => values.reduce(function (prev, curr) {
  return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev)
})

/**
 * Checks if a given node is focusable.
 *
 * @param {object} node - node to check against focusability
 */
export const isNodeFocusable = (node: Node): boolean => {
  if (!node) {
    return false
  }
  return node.isFocusable != null ? node.isFocusable : !!node.selectAction
}

/**
 * Given a keyCode, lookup and return the direction from the keycodes mapping file.
 *
 * @param {number} keyCode - key code for which corresponding direction is searched
 */
export const getDirectionForKeyCode = (keyCode: number): Direction | undefined => {
  return KeyCodes[keyCode]
}

/**
 * Given an orientation and a direction, do they match?
 *
 * I.e an orientation `horizontal` and direction `left` or `right` is considered matching.
 *
 * Direction CAN be passed as `*` (wildcard). this will always return true.
 *
 * @param {string} orientation - orientation to match with the direction
 * @param {string} direction - direction to match with the orientation
 */
export const isDirectionAndOrientationMatching = (orientation: Orientation, direction: Direction): boolean => {
  if (!orientation || !direction) {
    return false
  }

  const validOrientation = toValidOrientation(orientation)
  const validDirection = toValidDirection(direction)

  return (
    (validDirection === Directions.UNSPECIFIED) ||
    (validOrientation === Orientations.VERTICAL && (validDirection === Directions.UP || validDirection === Directions.DOWN)) ||
    (validOrientation === Orientations.HORIZONTAL && (validDirection === Directions.LEFT || validDirection === Directions.RIGHT))
  )
}

/**
 * Returns a child from the given node whose indexRange encompasses the given index.
 *
 * @param {object} node - node, which children index ranges will be examined
 * @param {number} index - examined index value
 */
export const findChildWithMatchingIndexRange = (node: Node, index: NodeIndex): Node | undefined => {
  if (!node || !node.children) {
    return undefined
  }

  for (const childId of Object.keys(node.children)) {
    const child = node.children[childId]
    if (child.indexRange && (child.indexRange[0] <= index && child.indexRange[1] >= index)) {
      return child
    }
  }

  return undefined
}

/**
 * Returns a child from the given node whose index matches the given index.
 *
 * @param {object} node - node, which children indices will be examined
 * @param {number} index - searched index value
 */
export const findChildWithIndex = (node: Node, index: NodeIndex): Node | undefined => {
  if (!node || !node.children) {
    return undefined
  }

  for (const childId of Object.keys(node.children)) {
    const child = node.children[childId]
    if (child.index === index) {
      return child
    }
  }

  return undefined
}

/**
 * Returns a child from the given node whose index is numerically closest to the given index.
 *
 * If an indexRange is provided, first check if the node's activeChild is inside
 * the indexRange. If it is, return the activeChild node instead
 *
 * @param {object} node
 * @param {number} index
 * @param {number[]} indexRange
 */
export const findChildWithClosestIndex = (node: Node, index: NodeIndex, indexRange?: NodeIndexRange): Node | undefined => {
  if (!node || !node.children) {
    return undefined
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
    return undefined
  }
  return findChildWithIndex(node, closestIndex(indexes, index))
}

/**
 * Inserts given child to the parent's children, keeping indices coherent and compact.
 *
 * @param parent - node to which new child is about to be added
 * @param newChild - node to be added to the parent
 */
export const insertChildNode = (parent: Node, newChild: Node): void => {
  if (!parent || !newChild) {
    return
  }

  const childrenIds = Object.keys(parent.children || {})
  const orderedChildren = {}

  newChild.parent = parent.id

  if (typeof newChild.index !== 'number' || newChild.index > childrenIds.length) {
    newChild.index = childrenIds.length
  }

  for (const childId of childrenIds) {
    const child = parent.children[childId]

    // Inserting new child, from now on all further children needs to have index value increased by one
    if (child.index >= newChild.index) {
      if (!orderedChildren[newChild.id]) {
        orderedChildren[newChild.id] = newChild
      }
      child.index += 1
    }

    orderedChildren[child.id] = child
  }

  if (!orderedChildren[newChild.id]) {
    orderedChildren[newChild.id] = newChild
  }

  parent.children = orderedChildren
}

/**
 * Removes given child from the parent's children, keeping indices coherent and compact.
 *
 * @param parent - node from which children given child is about to be removed
 * @param childId - id of the node to be removed from parent's children
 */
export const removeChildNode = (parent: Node, childId: NodeId): void => {
  if (!childId || !parent || !parent.children || !parent.children[childId]) {
    return
  }

  const removedChildIndex = parent.children[childId].index
  delete parent.children[childId]

  for (const childId of Object.keys(parent.children)) {
    const child = parent.children[childId]
    if (child.index > removedChildIndex) {
      child.index -= 1
    }
  }
}

/**
 * Returns flatten tree of nodes.
 *
 * Returned node values are kept coherent and delivers basic information about the node:
 *   - missing 'id' and 'parent' fields are filled in
 *   - children subtree is removed
 *
 * E.g.
 *   {
 *      'root': {
 *         children: {
 *           'a': { isFocusable: true },
 *           'b': {
 *             orientation: 'horizontal',
 *             children: {
 *               ba: { isFocusable: true },
 *               bb: { isFocusable: true }
 *           }
 *         }
 *       }
 *     }
 *   }
 *
 * Expect:
 *    {
 *      'root': { id: 'root' }
 *      'a': { id: 'a', parent: 'root', isFocusable: true }
 *      'b': { id: 'b', parent: 'root', orientation: 'horizontal' }
 *      'ba': { id: 'ba', parent: 'b', isFocusable: true }
 *      'bb': { id: 'bb', parent: 'b', isFocusable: true }
 *   }
 *
 * @param tree - tree to flatten
 */
export const flattenNodeTree = (tree: NodeTree): NodeTree => {
  const flatNodeTree = {}

  if (!tree) {
    return flatNodeTree
  }

  const _flatten = (tree: NodeTree, parent?: NodeId): void => {
    Object.keys(tree).forEach(nodeId => {
      flatNodeTree[nodeId] = {
        ...tree[nodeId],
        id: nodeId,
        parent: tree[nodeId].parent || parent,
        children: undefined
      }

      if (tree[nodeId].children) {
        _flatten(tree[nodeId].children, nodeId)
      }
    })
  }

  _flatten(tree)

  return flatNodeTree
}

/**
 * Returns flatten node's sub-tree including the given node.
 *
 * Returned node values are kept coherent and delivers basic information about the node:
 *   - missing 'id' and 'parent' fields are filled in
 *   - children subtree is removed
 *
 * E.g.
 *    {
 *      id: 'root'
 *      children: {
 *        'a': { isFocusable: true },
 *        'b': {
 *          orientation: 'horizontal',
 *          children: {
 *            ba: { isFocusable: true },
 *            bb: { isFocusable: true }
 *          }
 *        }
 *      }
 *    }
 *
 * Expect:
 *    {
 *      'root': { id: 'root' }
 *      'a': { id: 'a', parent: 'root', isFocusable: true }
 *      'b': { id: 'b', parent: 'root', orientation: 'horizontal' }
 *      'ba': { id: 'ba', parent: 'b', isFocusable: true }
 *      'bb': { id: 'bb', parent: 'b', isFocusable: true }
 *   }
 *
 * @param node - node which sub-tree is about to be flatten
 */
export const flattenNode = (node: Node): NodeTree => {
  if (!node) {
    return {}
  }
  return flattenNodeTree({ [node.id]: node })
}

/**
 * Returns valid orientation parameter.
 *
 * TypeScript defines type appropriately, but in JavaScript anything can be passed. Method doesn't imply that user
 * might be malicious, it just tries to unify provided string values, by making them a valid Orientation type.
 *
 * @param orientation - orientation to correct
 */
export const toValidOrientation = (orientation: Orientation): Orientation | undefined => {
  if (!orientation) {
    return undefined
  }
  for (const orientationKey of Object.keys(Orientations)) {
    if (Orientations[orientationKey] === orientation.toLowerCase()) {
      return Orientations[orientationKey]
    }
  }
  return undefined
}

/**
 * Returns valid direction parameter.
 *
 * TypeScript defines type appropriately, but in JavaScript anything can be passed. Method doesn't imply that user
 * might be malicious, it just tries to unify provided string values, by making them a valid Orientation type.
 *
 * @param direction - direction to correct
 */
export const toValidDirection = (direction: Direction): Direction | undefined => {
  if (!direction) {
    return undefined
  }
  for (const directionKey of Object.keys(Directions)) {
    if (Directions[directionKey] === direction.toLowerCase()) {
      return Directions[directionKey]
    }
  }
  return undefined
}
