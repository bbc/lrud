import { KeyCodes } from './key-codes'

/**
 * given an array of values and a goal, return the value from values which is closest to the goal
 * 
 * @param {number[]} values
 * @param {number} goal
 */
export const Closest = (values, goal) => values.reduce(function (prev, curr) {
    return (Math.abs(curr - goal) < Math.abs(prev - goal) ? curr : prev)
})

/**
 * check if a given node is focusable
 * 
 * @param {object} node
 */
export const isNodeFocusable = (node) => !!(node.selectAction || node.isFocusable)

/**
 * given a keyCode, lookup and return the direction from the keycodes mapping file
 * 
 * @param {number} keyCode
 */
export const getDirectionForKeyCode = (keyCode) => {
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
export const isDirectionAndOrientationMatching = (orientation, direction) => {
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
 * is the given node in the path, return true
 *
 * @param {*} node
 */
export const isNodeInPath = (path, node) => {
    if (path.startsWith(node.id + '.')) {
        return true
    }
    if (path.endsWith('.' + node.id)) {
        return true
    }
    if (path.includes('.' + node.id + '.')) {
        return true
    }

    return false
}

/**
 * given an array of paths, return true if the node is in any of the paths
 *
 * @param {*} node
 */
export const isNodeInPaths = (paths, node) => {
    return paths.some(path => {
        return isNodeInPath(path, node)
    })
}

/**
 * return a child from the given node whose indexRange encompases the given index
 *
 * @param {object} node
 * @param {number} index
 */
export const _findChildWithMatchingIndexRange = (node, index) => {
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
export const _findChildWithClosestIndex = (node, index, indexRange = null) => {
    if (!node.children) {
        return null
    }

    // if we have an indexRange, and the nodes active child is inside that index range,
    // just return the active child
    const activeChild = node.children[node.activeChild]
    if (indexRange && activeChild && activeChild.index >= indexRange[0] && activeChild.index <= indexRange[1] && isNodeFocusable(activeChild)) {
        return activeChild
    }

    const indexes = Object.keys(node.children).map(childId => node.children[childId].index)
    return _findChildWithIndex(node, Closest(indexes, index))
}

/**
 * return a child from the given node whose index matches the given index
 *
 * @param {object} node
 * @param {number} index
 */
export const _findChildWithIndex = (node, index) => {
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