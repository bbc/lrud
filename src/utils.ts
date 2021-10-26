import { KeyCodes } from './key-codes'
import {
  Direction,
  Directions,
  Node,
  NodeConfig,
  NodeId,
  NodeIndex,
  NodeIndexRange,
  Orientation,
  Orientations,
  Tree
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

  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i]
    if (child.indexRange && (child.indexRange[0] <= index && child.indexRange[1] >= index)) {
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
  if (
    indexRange && node.activeChild &&
    node.activeChild.index >= indexRange[0] && node.activeChild.index <= indexRange[1] &&
    isNodeFocusable(node.activeChild)
  ) {
    return node.activeChild
  }

  const indices = []
  for (let i = 0; i < node.children.length; i++) {
    if (isNodeFocusable(node.children[i]) || node.children[i].children) {
      indices.push(i)
    }
  }

  if (indices.length <= 0) {
    return undefined
  }
  return node.children[closestIndex(indices, index)]
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

  if (!parent.children) {
    parent.children = []
  }

  newChild.parent = parent

  if (typeof newChild.index !== 'number' || newChild.index > parent.children.length) {
    newChild.index = parent.children.length
    parent.children.push(newChild)
  } else {
    // Inserting new child, from now on all further children needs to have index value increased by one
    parent.children.splice(newChild.index, 0, newChild)
    for (let i = newChild.index + 1; i < parent.children.length; i++) {
      parent.children[i].index = i
    }
  }
}

/**
 * Removes given child from the parent's children, keeping indices coherent and compact.
 *
 * @param parent - node from which children given child is about to be removed
 * @param child - node to be removed from parent's children
 */
export const removeChildNode = (parent: Node, child: Node): void => {
  if (!child || !parent || !parent.children) {
    return
  }

  let removedChildIndex = -1
  for (let i = 0; i < parent.children.length; i++) {
    if (parent.children[i] === child) {
      removedChildIndex = i
    } else if (removedChildIndex !== -1) {
      parent.children[i].index = i - 1
    }
  }

  if (removedChildIndex !== -1) {
    if (parent.children.length === 1) {
      parent.children = undefined
    } else {
      parent.children.splice(removedChildIndex, 1)
    }
  }
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

/**
 * Creates node object from given node parameters.
 *
 * Node creation method is optimized for JavaScript engine.
 * Objects created in "the same way" allows JavaScript engine reusing existing HiddenClass transition chain.
 * Moreover most used properties are defined "at the beginning" making access to them a bit faster.
 *
 * @param {string} nodeId - id of the node
 * @param {object} [nodeConfig] - node parameters
 */
export const prepareNode = (nodeId: NodeId, nodeConfig: NodeConfig = {}): Node => {
  if (!nodeId) {
    throw Error('Node ID has to be defined')
  }

  return {
    id: nodeId,
    parent: undefined,
    children: undefined,
    activeChild: undefined,
    overrides: undefined,
    overrideSources: undefined,
    index: (typeof nodeConfig.index === 'number') ? nodeConfig.index : undefined,
    orientation: nodeConfig.orientation,
    indexRange: nodeConfig.indexRange,
    selectAction: nodeConfig.selectAction,
    isFocusable: nodeConfig.isFocusable,
    isWrapping: nodeConfig.isWrapping,
    isStopPropagate: nodeConfig.isStopPropagate,
    isIndexAlign: nodeConfig.isIndexAlign,
    onLeave: nodeConfig.onLeave,
    onEnter: nodeConfig.onEnter,
    shouldCancelLeave: nodeConfig.shouldCancelLeave,
    onLeaveCancelled: nodeConfig.onLeaveCancelled,
    shouldCancelEnter: nodeConfig.shouldCancelEnter,
    onEnterCancelled: nodeConfig.onEnterCancelled,
    onSelect: nodeConfig.onSelect,
    onInactive: nodeConfig.onInactive,
    onActive: nodeConfig.onActive,
    onActiveChildChange: nodeConfig.onActiveChildChange,
    onBlur: nodeConfig.onBlur,
    onFocus: nodeConfig.onFocus,
    onMove: nodeConfig.onMove
  }
}

/**
 * Traverses through node subtree (including the node) with iterative preorder deep first search tree traversal algorithm.
 *
 * DFS is implemented without recursion to avoid putting methods to the stack. This allows traversing deep trees without
 * the need of allocating memory for recursive method calls.
 *
 * For some processes, when node meeting some condition is searched, there's no need to traverse through whole tree.
 * To address that, given nodeProcessor may return boolean value. when true is returned, than traversal algorithm
 * is interrupted immediately.
 *
 * E.g. Given tree:
 *        root
 *        / \
 *       A   B
 *      /     \
 *     AA      BA
 *    /  \
 *  AAA  AAB
 *
 *  Traversal path: root -> A -> AA -> AAA -> AAB -> B -> BA
 *
 * @param {object} startNode - node that is the root of traversed subtree
 * @param {function} nodeProcessor - callback executed for traversed node, if true is returned then subtree traversal is interrupted
 */
export const traverseNodeSubtree = <NodeType extends Tree<NodeType>>(startNode: NodeType, nodeProcessor: (node: NodeType) => boolean | void): void => {
  const stack: NodeType[] = [startNode]
  const dummyThis = Object.create(null)

  let traversedNode: NodeType

  while (stack.length > 0) {
    traversedNode = stack.pop()

    if (nodeProcessor.call(dummyThis, traversedNode)) {
      return
    }

    if (traversedNode.children) {
      for (let i = traversedNode.children.length - 1; i >= 0; i--) {
        stack.push(traversedNode.children[i])
      }
    }
  }
}
