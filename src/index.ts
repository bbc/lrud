import { Get } from './get'
import { Set } from './set'
import { Node, Override } from './interfaces'

import {
  isNodeFocusable,
  getDirectionForKeyCode,
  isDirectionAndOrientationMatching,
  isNodeInPaths,
  _findChildWithMatchingIndexRange,
  _findChildWithClosestIndex,
  _findChildWithIndex
} from './utils'

import mitt from 'mitt'

export class Lrud {
  tree: any;
  nodePathList: any;
  focusableNodePathList: any;
  rootNodeId: any;
  currentFocusNode: any;
  currentFocusNodeId: any;
  currentFocusNodeIndex: any;
  currentFocusNodeIndexRange: any;
  currentFocusNodeIndexRangeLowerBound: any;
  currentFocusNodeIndexRangeUpperBound: any;
  isIndexAlignMode: any;
  emitter: mitt.Emitter
  overrides: any;

  constructor() {
    this.tree = {}
    this.nodePathList = []
    this.focusableNodePathList = []
    this.rootNodeId = null
    this.currentFocusNode = null
    this.currentFocusNodeId = null
    this.currentFocusNodeIndex = null
    this.currentFocusNodeIndexRange = null
    this.isIndexAlignMode = false
    this.emitter = new mitt();
    this.overrides = {}
  }

  /**
   * reindex all the children of the node, assigning indexes numerically from 0. maintains
   * original order of indexes, but normalises them all to be 0 based
   *
   * @param {object} node
   */
  reindexChildrenOfNode(node: Node) {
    if (!node.children) {
      return
    }

    const children = Object.keys(node.children).map(childId => node.children[childId])

    children.sort(function (a, b) {
      return a.index - b.index
    })

    node.children = {}

    children.forEach((child, index) => {
      child.index = index
      node.children[child.id] = child
    })

    Set(this.tree, this.getPathForNodeId(node.id), node)

    return node
  }

  /**
   * register a callback for an LRUD event
   *
   * @param {string} eventName event to subscribe to
   * @param {function} callback function to call on event
   */
  on(eventName, callback) {
    this.emitter.on(eventName, callback)
  }

  /**
   * return the root node
   */
  getRootNode() {
    const node = this.getNode(this.rootNodeId)

    if (!node) {
      throw new Error('no root node')
    }

    return node
  }

  /**
   * given a node id, return the full path for it
   *
   * @param {string} nodeId
   */
  getPathForNodeId(nodeId: string) {
    if (nodeId === this.rootNodeId) {
      return this.rootNodeId
    }
    return this.nodePathList.find(path => path.endsWith('.' + nodeId))
  }

  /**
   * register a new node into the LRUD tree
   *
   * @param {string} nodeId
   * @param {object} node
   * @param {string} [node.id] if null, `nodeId` is used
   * @param {string} [node.parent] if null, value of `this.rootNodeId` is used
   * @param {number} [node.index] if null, index is 1 more than the index of the last sibling. if no previous siblings, index is 1
   * @param {number[]} [node.indexRange] defaults to null. acts as a colspan, value [0] is lower bound, value [1] is upper bound
   * @param {function} [node.selectAction] if a node has a selectAction, it is focusable
   * @param {boolean} [node.isFocusable] if a node is explicitly set as isFocusable, it is focusable
   * @param {boolean} [node.isWrapping] if true, when asking for the next child at the end or start of the node, the will "wrap around" and return the first/last (when asking for the last/first)
   * @param {string} [node.orientation] can be "vertical" or "horizontal". is used in conjuction when handling direction of key press, to determine which child is "next"
   * @param {boolean} [node.isIndexAlign] if a node is index aligned, its descendents should jump to nodes based on index instead of activeChild
   * @param {function} [node.onLeave] if a node has an `onLeave` function, it will be run when a move event leaves this node
   * @param {function} [node.onEnter] if a node has an `onEnter` function, it will be run when a move event enters this node
   */
  registerNode(nodeId: string, node: Node = { id: null }) {
    if (!node.id) {
      node.id = nodeId
    }

    // if this is the very first node, set it as root and return...
    if (Object.keys(this.tree).length <= 0) {
      this.rootNodeId = nodeId
      this.tree[nodeId] = node
      this.nodePathList.push(nodeId)
      return this
    }

    // if this node has no parent, assume its parent is root
    if (node.parent == null && nodeId !== this.rootNodeId) {
      node.parent = this.rootNodeId
    }

    // if this node is the first child of its parent, we need to set its parent's `activeChild`
    // to it so that the parent always has an `activeChild` value
    // we can tell if its parent has any children by checking the nodePathList for
    // entries containing '<parent>.children'
    const parentsChildPaths = this.nodePathList.find(path => path.includes(node.parent + '.children'))
    if (parentsChildPaths == null) {
      const parentPath = this.getPathForNodeId(node.parent)
      Set(this.tree, parentPath + '.activeChild', nodeId)
    }

    // if no `index` set, calculate it
    if (!node.index) {
      const parentNode = this.getNode(node.parent)
      if (parentNode) {
        const parentsChildren = this.getNode(node.parent).children
        if (!parentsChildren) {
          node.index = 0
        } else {
          node.index = (Object.keys(parentsChildren).length)
        }
      }
    }

    // add the node into the tree
    // path is the node's parent plus 'children' plus itself
    let path = this.nodePathList.find(path => path.endsWith(node.parent)) + '.children.' + nodeId
    Set(this.tree, path, node)
    this.nodePathList.push(path)

    // if the node is focusable, we want to add its path to our focusableNodePathList
    if (isNodeFocusable(node)) {
      this.focusableNodePathList.push(path)
    }

    return this
  }

  /**
   * maintained for legacy API reasons
   */
  register(nodeId: string, node: any = {}) {
    return this.registerNode(nodeId, node)
  }

  /**
   * unregister a node from the navigation tree
   * kept for backwards compatibility reasons
   * 
   * @param {string} nodeId
   */
  unregister(nodeId: string) {
    this.unregisterNode(nodeId);
  }

  /**
   * unregister a node from the navigation tree
   * 
   * @param {string} nodeId
   */
  unregisterNode(nodeId: string) {
    if (nodeId === this.rootNodeId) {
      this.tree = {}
      this.overrides = {};
      return;
    }

    const path = this.getPathForNodeId(nodeId)

    // if we're trying to unregister a node that doesn't exist, exit out
    if (!path) {
      return
    }

    // get a copy of the node to pass to the blur event, and grab the parent to work with it
    const nodeClone = Get(this.tree, path)
    const parentNode = this.getNode(nodeClone.parent)

    // delete the node itself (delete from the parent and re-set the parent later)
    delete parentNode.children[nodeId]

    // ...remove the relevant entry from the node id list
    this.nodePathList.splice(this.nodePathList.indexOf(path), 1)

    // ...remove all its children from the node ID list
    this.nodePathList = this.nodePathList.filter(nodeIdPath => {
      return !(nodeIdPath.includes('.' + nodeId))
    })

    // if the node we're unregistering was focusable, we need to remove it from
    // our focusableNodePathList
    this.focusableNodePathList = this.focusableNodePathList.filter(nodeIdPath => {
      return !(nodeIdPath.includes('.' + nodeId))
    })

    // ...if we're unregistering the activeChild of our parent (could be a leaf OR branch)
    // we need to recalculate the focus...
    if (parentNode.activeChild && parentNode.activeChild === nodeId) {
      delete parentNode.activeChild
      const top = this.climbUp(parentNode, '*')
      const prev = this.getPrevChild(top)
      const child = this.digDown(prev)
      this.assignFocus(child.id)
    }

    // ...we need to recalculate the indexes of all the parents children
    this.reindexChildrenOfNode(parentNode)

    // re-set the parent after we've deleted the node itself and amended the parents active child, etc.
    Set(this.tree, this.getPathForNodeId(parentNode.id), parentNode)

    // blur on the nodeClone
    this.emitter.emit('blur', nodeClone)
    if (nodeClone.onBlur) {
      nodeClone.onBlur(nodeClone);
    }

    // if we have any overrides whose target is the node we just unregistered, we should unregister
    // those overrides (thus keeping state clean)
    Object.keys(this.overrides).forEach(overrideId => {
      const override = this.overrides[overrideId]
      if (override.target === nodeClone.id || override.id === nodeClone.id) {
        this.unregisterOverride(overrideId);
      }
    })

    return this
  }

  /**
   * register a new override onto the LRUD instance
   *
   * @param {string} overrideId
   * @param {object} override
   * @param {string} override.id
   * @param {string} override.direction
   * @param {string} override.target
   */
  registerOverride(overrideId: string, override: Override) {
    if (!overrideId) {
      throw new Error('need an ID to register an override')
    }
    if (this.overrides[overrideId]) {
      throw new Error(`override with ID of ${overrideId} already exists`)
    }
    if (!override.id) {
      throw new Error(`registering override: ${overrideId} - missing internal id`)
    }
    if (!override.direction) {
      throw new Error(`registering override: ${overrideId} - missing internal direction`)
    }
    if (!override.target) {
      throw new Error(`registering override: ${overrideId} - missing internal target`)
    }
    this.overrides[overrideId] = override

    return this
  }

  /**
   * unregister an override from the LRUD instance
   *
   * @param {string} overrideId
   */
  unregisterOverride(overrideId: string) {
    delete this.overrides[overrideId]

    return this
  }

  /**
   * return a node for an ID
   *
   * @param {string} nodeId node id
   */
  getNode(nodeId: string) {
    return Get(this.tree, (this.getPathForNodeId(nodeId)))
  }

  /**
   * get a node by ID and then unregister it from the instance
   *
   * @param {string} nodeId node id
   */
  pickNode(nodeId: string) {
    const node = this.getNode(nodeId)

    if (!node) {
      return
    }

    this.unregisterNode(nodeId)
    return node
  }

  /**
   * starting from a node, climb up the navigation tree until we find a node that can be
   * actioned, based on the given direction. an actionable node is one whose orientation is valid
   * for the given direction, has focusable children and whose activeChild isn't a leaf that is
   * also its current activeChild
   *
   * @param {object} node
   * @param {string} direction
   */
  climbUp(node: Node, direction: string) {
    if (!node) {
      return null
    }

    // if we have a matching override at this point in the climb, return that target node
    const matchingOverrideId = Object.keys(this.overrides).find(overrideId => {
      const override = this.overrides[overrideId]
      return override.id === node.id && override.direction.toUpperCase() === direction.toUpperCase()
    })

    if (matchingOverrideId) {
      return this.getNode(this.overrides[matchingOverrideId].target)
    }

    // if we're on a leaf, climb up
    if (isNodeFocusable(node)) {
      return this.climbUp(this.getNode(node.parent), direction)
    }

    // if the node we're on contains no focusable children, climb up
    if (!isNodeInPaths(this.focusableNodePathList, node)) {
      return this.climbUp(this.getNode(node.parent), direction)
    }

    // we have children, but the orientation doesn't match, so try our parent
    if (!isDirectionAndOrientationMatching(node.orientation, direction)) {
      return this.climbUp(this.getNode(node.parent), direction)
    }

    let nextChildInDirection = this.getNextChildInDirection(node, direction)

    // if we dont have a next child, just return the node. this is primarily for use during unregistering
    if (!nextChildInDirection) {
      return node
    }

    // if the next child in the direction is both the same as this node's activeChild
    // AND a leaf, bubble up too - handles nested wrappers, like docs/test-diagrams/fig-3.png
    const isNextChildCurrentActiveChild = (nextChildInDirection && nextChildInDirection.id === node.activeChild)
    const isNextChildFocusable = isNodeFocusable(this.getNode(node.activeChild))
    const isNodeInFocusablePath = isNodeInPaths(this.focusableNodePathList, node)
    if (isNextChildCurrentActiveChild && (isNextChildFocusable || isNodeInFocusablePath)) {
      return this.climbUp(this.getNode(node.parent), direction)
    }

    return node
  }

  /**
   * starting from the given node, dig down the navigation tree until we find a focusable
   * leaf, and return it. dig "direction" priority:
   * - index align mode
   * - active child
   * - first child
   *
   * @param {object} node
   */
  digDown(node: Node, direction: string = null) {
    // if the active child is focusable, return it
    if (isNodeFocusable(node)) {
      return node
    }

    /*
    if we're in a nested grid
      if we're going VERTICAL DOWN 
        take the first child, and then match the index
      if we're going VERTICAL UP
        take the last child, and then match the index

    if we're in a nested grid
      and we're going HORIZONTAL LEFT
        take the matching index of the same depth, and then the last child
      and we're going HORIZONTAL RIGHT
        take the matching index of the same depth, and then the first child

    if its not a nested grid, take the matching index
    */

    if (this.isIndexAlignMode) {
      if (node.isIndexAlign) {
        // we're in a nested grid, so need to take into account orientation and direction of travel
        const nodeParent = this.getNode(node.parent);
        if (nodeParent.orientation === 'vertical') {
          if (direction === 'UP') {
            return this.digDown(_findChildWithClosestIndex(this.getNodeLastChild(node), this.currentFocusNodeIndex, this.currentFocusNodeIndexRange), direction);
          }
          if (direction === 'DOWN') {
            return this.digDown(_findChildWithClosestIndex(this.getNodeFirstChild(node), this.currentFocusNodeIndex, this.currentFocusNodeIndexRange), direction);
          }
        }

        if (nodeParent.orientation === 'horizontal') {
          if (direction === 'LEFT') {
            const firstStep = _findChildWithClosestIndex(node, this.getNode(this.currentFocusNode.parent).index);
            return this.digDown(this.getNodeLastChild(firstStep), direction);
          }
          if (direction === 'RIGHT') {
            const firstStep = _findChildWithClosestIndex(node, this.getNode(this.currentFocusNode.parent).index);
            return this.digDown(this.getNodeFirstChild(firstStep), direction);
          }
        }
      }

      // we're not in a nested grid, so just look for matching index ranges or index
      const matchingViaIndexRange = _findChildWithMatchingIndexRange(node, this.currentFocusNodeIndex)
      if (matchingViaIndexRange) {
        return this.digDown(matchingViaIndexRange, direction);
      }
      return this.digDown(_findChildWithClosestIndex(node, this.currentFocusNodeIndex, this.currentFocusNodeIndexRange), direction);
    }

    // if we dont have an active child, use the first child
    if (!node.activeChild) {
      node.activeChild = this.getNodeFirstChild(node).id
    }

    const activeChild = node.children[node.activeChild]

    if (isNodeFocusable(activeChild)) {
      return activeChild
    }

    return this.digDown(activeChild, direction)
  }

  /**
   * gets the semantic next child for a given direction
   * if the direction is left or up, return the semantic previous child of the node
   * if the direction is right or down, return the semantic next child of the node
   *
   * @param {object} node
   * @param {string} direction
   */
  getNextChildInDirection(node: Node, direction: string) {
    direction = direction.toUpperCase()

    if (node.orientation === 'horizontal' && direction === 'RIGHT') {
      return this.getNextChild(node)
    }
    if (node.orientation === 'horizontal' && direction === 'LEFT') {
      return this.getPrevChild(node)
    }
    if (node.orientation === 'vertical' && direction === 'DOWN') {
      return this.getNextChild(node)
    }
    if (node.orientation === 'vertical' && direction === 'UP') {
      return this.getPrevChild(node)
    }

    return null
  }

  /**
   * get the semantic "next" child for a node
   *
   * @param {object} node
   */
  getNextChild(node: Node) {
    if (!node.activeChild) {
      node.activeChild = this.getNodeFirstChild(node).id
    }

    const currentActiveIndex = node.children[node.activeChild].index

    let nextChild = _findChildWithIndex(node, currentActiveIndex + 1)

    if (!nextChild) {
      if (node.isWrapping) {
        nextChild = this.getNodeFirstChild(node)
      } else {
        nextChild = node.children[node.activeChild]
      }
    }

    return nextChild
  }

  /**
   * get the semantic "previous" child for a node
   * @param {object} node
   */
  getPrevChild(node: Node) {
    if (!node.activeChild) {
      node.activeChild = this.getNodeFirstChild(node).id
    }

    const currentActiveIndex = node.children[node.activeChild].index

    let prevChild = _findChildWithIndex(node, currentActiveIndex - 1)

    if (!prevChild) {
      // cant find a prev child, so the prev child is the current child
      if (node.isWrapping) {
        prevChild = this.getNodeLastChild(node)
      } else {
        prevChild = node.children[node.activeChild]
      }
    }

    return prevChild
  }

  /**
   * get the first child of a node, based on index
   * @param {object} node
   */
  getNodeFirstChild(node: Node) {
    if (!node.children) {
      return undefined
    }

    const orderedIndexes = Object.keys(node.children).map(childId => node.children[childId].index).sort()

    return _findChildWithIndex(node, orderedIndexes[0])
  }

  /**
   * get the last child of a node, based on index
   * @param {object} node
   */
  getNodeLastChild(node: Node) {
    if (!node.children) {
      return undefined
    }

    const orderedIndexes = Object.keys(node.children).map(childId => node.children[childId].index).sort()

    return _findChildWithIndex(node, orderedIndexes[orderedIndexes.length - 1])
  }

  /**
   * given an event, handle any state changes that may arise from the direction pressed.
   * state changes based on climbUp'ing and digDown'ing from the current focusedNode
   * 
   * @param {object} event
   * @param {string} [event.keyCode]
   * @param {string} [event.direction]
   */
  handleKeyEvent(event) {
    const direction = (event.keyCode) ? getDirectionForKeyCode(event.keyCode) : event.direction.toUpperCase()
    const currentFocusNode = this.getNode(this.currentFocusNodeId)

    // if all we're doing is processing an enter, just run the `onSelect` function of the current node...
    if (direction === 'ENTER' && currentFocusNode.onSelect) {
      this.emitter.emit('select', currentFocusNode);
      currentFocusNode.onSelect(currentFocusNode)
      return
    }

    // climb up from where we are...
    const topNode = this.climbUp(currentFocusNode, direction)

    // ... if we cant find a top node, its an invalid move - just return
    if (!topNode) {
      return
    }

    // ...if we need to align indexes, turn the flag on now...
    this.isIndexAlignMode = topNode.isIndexAlign === true

    // ...get the top's next child in the direction we're going...
    const nextChild = this.getNextChildInDirection(topNode, direction)

    // ...and depending on if we're able to find a child, dig down from the child or from the original top...
    const focusableNode = (nextChild) ? this.digDown(nextChild, direction) : this.digDown(topNode, direction)

    // ...and then assign focus
    this.assignFocus(focusableNode.id)

    // emit events and fire functions now that the move has completed
    this.emitter.emit('move', {
      leave: currentFocusNode,
      enter: focusableNode,
      direction,
      offset: (direction === 'LEFT' || direction === 'UP') ? -1 : 1
    })

    if (topNode.onMove) {
      topNode.onMove({
        node: topNode,
        leave: currentFocusNode,
        enter: focusableNode,
        direction,
        offset: (direction === 'LEFT' || direction === 'UP') ? -1 : 1
      });
    }

    if (currentFocusNode.onLeave) {
      currentFocusNode.onLeave(currentFocusNode)
    }
    if (focusableNode.onEnter) {
      focusableNode.onEnter(focusableNode)
    }

    return focusableNode
  }

  /**
   * recursively sets the activeChild of the parentId node to the value of the childId node
   * if the parent node has a parent itself, it digs up the tree and sets those activeChild values
   *
   * @param {string} parentId
   * @param {string} childId
   */
  setActiveChild(parentId: string, childId: string) {
    const child = this.getNode(childId)
    const parent = this.getNode(parentId)
    if (!child) {
      return
    }

    // the parent already has an active child, and its NOT the same child that we're now setting
    if (parent.activeChild && parent.activeChild !== child.id) {
      const currentActiveChild = this.getNode(parent.activeChild)
      parent.activeChild = child.id
      this.emitter.emit('inactive', currentActiveChild)
      if (currentActiveChild.onInactive) {
        currentActiveChild.onInactive(currentActiveChild)
      }
      this.emitter.emit('active', child)
      if (child.onActive) {
        child.onActive(child)
      }
      if (parent.onActiveChildChange) {
        parent.onActiveChildChange({
          node: parent,
          leave: currentActiveChild,
          enter: child
        })
      }
    }

    // if the parent has a parent, bubble up
    if (parent.parent) {
      this.setActiveChild(parent.parent, parent.id)
    }
  }

  /**
   * set the current focus of the instance to the given node ID
   * if the given node ID points to a non-focusable node, we dig down from
   * the given node to find a node that can be focused on
   * calls `onFocus` on the given node, if it exists, and emits a `focus` event
   * also calls `onBlur` on the node that WAS focused before this function was called
   *
   * @param {string} nodeId
   */
  assignFocus(nodeId: string) {
    let node = this.getNode(nodeId)

    if (!isNodeFocusable(node)) {
      node = this.digDown(node)
    }

    if (!node) {
      throw new Error('trying to assign focus to a non focusable node')
    }

    if (this.currentFocusNodeId) {
      let previouslyFocusedNode = this.getNode(this.currentFocusNodeId);
      if (previouslyFocusedNode) {
        this.emitter.emit('blur', previouslyFocusedNode)
        if (previouslyFocusedNode.onBlur) {
          previouslyFocusedNode.onBlur(previouslyFocusedNode);
        }
      }
    }

    this.currentFocusNodeId = node.id
    this.currentFocusNode = node

    if (node.indexRange) {
      this.currentFocusNodeIndex = node.indexRange[0]
      this.currentFocusNodeIndexRangeLowerBound = node.indexRange[0]
      this.currentFocusNodeIndexRangeUpperBound = node.indexRange[1]
      this.currentFocusNodeIndexRange = node.indexRange
    } else {
      this.currentFocusNodeIndex = node.index
      this.currentFocusNodeIndexRangeLowerBound = node.index
      this.currentFocusNodeIndexRangeUpperBound = node.index
    }

    if (node.parent) {
      this.setActiveChild(node.parent, node.id)
    }

    if (node.onFocus) {
      node.onFocus(node)
    }

    this.emitter.emit('focus', node)
  }
}