import { KeyCodes } from './key-codes'

/**
 * given an array of values and a goal, return the value from values which is closest to the goal
 * 
 * @param {number[]} values
 * @param {number} goal
 */
const Closest = (values, goal) => values.reduce(function (prev, curr) {
    return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev)
})


/**
 * check if a given node is focusable
 * 
 * @param {object} node
 */
const isNodeFocusable = (node) => !!(node.selectAction || node.isFocusable)

/**
 * given a keyCode, lookup and return the direction from the keycodes mapping file
 * 
 * @param {number} keyCode
 */
const getDirectionForKeyCode = (keyCode) => {
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
const isDirectionAndOrientationMatching = (orientation, direction) => {
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
   * is the given node in the path of ANY node that is focusable
   *
   * @param {*} node
   */
  const _isNodeInFocusableNodePathList = (focusableNodePathList, node) => {
    return focusableNodePathList.some(nodeIdPath => {
      if (nodeIdPath.includes('.' + node.id + '.')) {
        return true
      }
      if (node.id === this.rootNodeId && nodeIdPath.includes(node.id + '.')) {
        return true
      }
      return false
    })
  }

  /**
   * return a child from the given node whose indexRange encompases the given index
   *
   * @param {object} node
   * @param {number} index
   */
  const _findChildWithMatchingIndexRange = (node, index) => {
    if (!node.children) {
      return null
    }

    const childWithIndexRangeSpanningIndex = Object.keys(node.children).find(childId => {
      const child = node.children[childId]
      return child.indexRange && (child.indexRange[0] <= index && child.indexRange[1] >= index)
    })

    if (childWithIndexRangeSpanningIndex) {
      return node.children[childWithIndexRangeSpanningIndex]
    }
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
  const _findChildWithClosestIndex = (node, index, indexRange = null) => {
    if (!node.children) {
      return null
    }

    // if we have an indexRange, and the nodes active child is inside that index range,
    // just return the active child
    const activeChild = this.getNode(node.activeChild)
    if (indexRange && activeChild && activeChild.index >= indexRange[0] && activeChild.index <= indexRange[1] && isFocusable(activeChild)) {
      return activeChild
    }

    const indexes = Object.keys(node.children).map(childId => node.children[childId].index)
    return this._findChildWithIndex(node, Closest(indexes, index))
  }

  /**
   * return a child from the given node whose index matches the given index
   *
   * @param {object} node
   * @param {number} index
   */
  const _findChildWithIndex = (node, index) => {
    if (!node.children) {
      return null
    }

    const childIdWithMatchingIndex = Object.keys(node.children).find(childId => {
      const childNode = node.children[childId]
      return childNode.index === index
    })

    if (childIdWithMatchingIndex) {
      return node.children[childIdWithMatchingIndex]
    }

    return null
  }

  