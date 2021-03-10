import { Get } from './get'
import { Set } from './set'
import { Node, Override, KeyEvent, HandleKeyEventOptions, InsertTreeOptions, UnregisterNodeOptions } from './interfaces'

import {
  isNodeFocusable,
  getDirectionForKeyCode,
  isDirectionAndOrientationMatching,
  isNodeInPaths,
  _findChildWithMatchingIndexRange,
  _findChildWithClosestIndex,
  _findChildWithIndex,
  getNodesFromTree,
  endsWith,
  arrayFind,
  isNodeInTree
} from './utils'

import mitt from 'mitt'

export class Lrud {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tree: any;
  nodePathList: string[];
  focusableNodePathList: string[];
  rootNodeId: string;
  currentFocusNode?: Node;
  currentFocusNodeId: string;
  currentFocusNodeIndex: number;
  currentFocusNodeIndexRange: number[];
  currentFocusNodeIndexRangeLowerBound: number;
  currentFocusNodeIndexRangeUpperBound: number;
  isIndexAlignMode: boolean;
  emitter: mitt.Emitter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  overrides: any;

  constructor () {
    this.tree = {}
    this.nodePathList = []
    this.focusableNodePathList = []
    this.rootNodeId = null
    this.currentFocusNode = null
    this.currentFocusNodeId = null
    this.currentFocusNodeIndex = null
    this.currentFocusNodeIndexRange = null
    this.isIndexAlignMode = false
    this.emitter = mitt()
    this.overrides = {}
  }

  /**
   * reindex all the children of the node, assigning indexes numerically from 0. maintains
   * original order of indexes, but normalises them all to be 0 based
   *
   * @param {object} node
   */
  reindexChildrenOfNode (node: Node): Node | void {
    if (!node) {
      return
    }

    if (!node.children) {
      return
    }

    const children = Object.keys(node.children).map(childId => node.children[childId])

    children.sort((a, b) => a.index - b.index)

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
  on (eventName, callback): void {
    this.emitter.on(eventName, callback)
  }

  /**
   * unregister a callback for an LRUD event
   *
   * @param {string} eventName event to unsubscribe from
   * @param {function} callback function that was added using .on()
   */
  off (eventName, callback): void {
    this.emitter.off(eventName, callback)
  }

  /**
   * return the root node
   */
  getRootNode (): Node {
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
  getPathForNodeId (nodeId: string): string {
    if (!nodeId) {
      return undefined
    }
    if (nodeId === this.rootNodeId) {
      return this.rootNodeId
    }
    return arrayFind(this.nodePathList, path => endsWith(path, '.' + nodeId))
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
   * @param {object} [node.selectAction] if a node has a selectAction, it is focusable
   * @param {boolean} [node.isFocusable] if a node is explicitly set as isFocusable, it is focusable
   * @param {boolean} [node.isWrapping] if true, when asking for the next child at the end or start of the node, the will "wrap around" and return the first/last (when asking for the last/first)
   * @param {string} [node.orientation] can be "vertical" or "horizontal". is used in conjuction when handling direction of key press, to determine which child is "next"
   * @param {boolean} [node.isIndexAlign] if a node is index aligned, its descendents should jump to nodes based on index instead of activeChild
   * @param {function} [node.onLeave] if a node has an `onLeave` function, it will be run when a move event leaves this node
   * @param {function} [node.onEnter] if a node has an `onEnter` function, it will be run when a move event enters this node
   */
  registerNode (nodeId: string, node: Node = {}): Lrud {
    if (!node.id) {
      node.id = nodeId
    }

    if (this.getNode(nodeId)) {
      throw Error(`Node with an ID of ${nodeId} has already been registered`)
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

    // the parentPathId is period(.) plus the node's parent
    // the only expection being if the parent is the rootNode, then there is no initial period(.)
    const parentPathId = node.parent === this.rootNodeId ? node.parent : '.' + node.parent

    // if this node is the first child of its parent, we need to set its parent's `activeChild`
    // to it so that the parent always has an `activeChild` value
    // we can tell if its parent has any children by checking the nodePathList for
    // entries containing '<parentPathId>.children'
    const parentsChildPaths = arrayFind(this.nodePathList, path => path.indexOf(parentPathId + '.children') > -1)
    if (parentsChildPaths == null) {
      const parentPath = this.getPathForNodeId(node.parent)
      Set(this.tree, parentPath + '.activeChild', nodeId)

      this.emitter.emit('active', node)
      if (node.onActive) {
        node.onActive(node)
      }
    }

    const parentNode = this.getNode(node.parent)
    if (parentNode) {
      const parentsChildrenIds = Object.keys(parentNode.children || {})
      // if no `index` set, calculate it
      if (typeof node.index !== 'number') {
        node.index = parentsChildrenIds.length
      } else {
        parentsChildrenIds.forEach(childId => {
          const child = parentNode.children[childId]
          if (child.index >= node.index) {
            child.index += 1
          }
        })
      }
    }

    // add the node into the tree
    const path = arrayFind(this.nodePathList, path => endsWith(path, parentPathId)) + '.children.' + nodeId
    Set(this.tree, path, node)
    this.nodePathList.push(path)

    if (parentNode) {
      this.reindexChildrenOfNode(parentNode)
    }

    // if the node is focusable, we want to add its path to our focusableNodePathList
    if (isNodeFocusable(node)) {
      this.focusableNodePathList.push(path)
    }

    return this
  }

  /**
   * maintained for legacy API reasons
   */
  register (nodeId: string, node: Node = {}): Lrud {
    return this.registerNode(nodeId, node)
  }

  /**
   * unregister a node from the navigation tree
   * kept for backwards compatibility reasons
   *
   * @param {string} nodeId
   */
  unregister (nodeId: string, unregisterOptions?: UnregisterNodeOptions): void {
    this.unregisterNode(nodeId, unregisterOptions)
  }

  /**
   * unregister a node from the navigation tree
   *
   * @param {string} nodeId
   * @param {object} unregisterOptions
   * @param {boolean} unregisterOptions.forceRefocus if true, LRUD will attempt to re-focus on a new node if the currently focused node becomes unregistered due to the given node ID being unregistered
   */
  unregisterNode (nodeId: string, unregisterOptions: UnregisterNodeOptions = { forceRefocus: true }): Lrud {
    if (nodeId === this.rootNodeId) {
      this.tree = {}
      this.nodePathList = []
      this.focusableNodePathList = []
      this.rootNodeId = null
      this.currentFocusNode = null
      this.currentFocusNodeId = null
      this.currentFocusNodeIndex = null
      this.currentFocusNodeIndexRange = null
      this.isIndexAlignMode = false
      this.emitter = mitt()
      this.overrides = {}
      return
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

    // ...remove all its children from both path lists
    this.nodePathList = this.nodePathList.filter(nodeIdPath => {
      return nodeIdPath.indexOf(path + '.children.') === -1
    })
    this.focusableNodePathList = this.focusableNodePathList.filter(nodeIdPath => {
      return nodeIdPath.indexOf(path + '.children.') === -1
    })

    // if the node is focusable, remove it from the focusable node path list
    if (isNodeFocusable(nodeClone)) {
      this.focusableNodePathList.splice(this.focusableNodePathList.indexOf(path), 1)
    }

    // ...if we're unregistering the activeChild of our parent (could be a leaf OR branch)
    // we might need to recalculate the focus...
    if (parentNode.activeChild && parentNode.activeChild === nodeId) {
      this.isIndexAlignMode = false
      delete parentNode.activeChild

      // check if the current focus node was removed
      const isCurrentFocusNodeRemoved = !this.focusableNodePathList.some(nodeIdPath => {
        return nodeIdPath.indexOf(this.currentFocusNodeId) > -1
      })

      if (unregisterOptions.forceRefocus && isCurrentFocusNodeRemoved) {
        this.recalculateFocus(nodeClone)
      } else if (isCurrentFocusNodeRemoved) {
        this.currentFocusNode = undefined
        this.currentFocusNodeId = undefined
        this.currentFocusNodeIndex = undefined
      }
    }

    // ...we need to recalculate the indexes of all the parents children
    this.reindexChildrenOfNode(parentNode)

    // re-set the parent after we've deleted the node itself and amended the parents active child, etc.
    Set(this.tree, this.getPathForNodeId(parentNode.id), parentNode)

    // blur on the nodeClone
    this.emitter.emit('blur', nodeClone)
    if (nodeClone.onBlur) {
      nodeClone.onBlur(nodeClone)
    }

    // if we have any overrides whose target or ID is the node (or one of its children) we just unregistered, we should unregister
    // those overrides (thus keeping state clean)
    const unregisteredSubTree = { [nodeClone.id]: nodeClone }
    Object.keys(this.overrides).forEach(overrideId => {
      const override = this.overrides[overrideId]
      if (isNodeInTree(override.target, unregisteredSubTree) || isNodeInTree(override.id, unregisteredSubTree)) {
        this.unregisterOverride(overrideId)
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
  registerOverride (overrideId: string, override: Override): Lrud {
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
  unregisterOverride (overrideId: string): Lrud {
    delete this.overrides[overrideId]

    return this
  }

  /**
   * return a node for an ID
   *
   * @param {string} nodeId node id
   */
  getNode (nodeId: string): Node {
    return Get(this.tree, (this.getPathForNodeId(nodeId)))
  }

  /**
   * get a node by ID and then unregister it from the instance
   *
   * @param {string} nodeId node id
   */
  pickNode (nodeId: string): Node {
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
  climbUp (node: Node, direction: string): Node {
    if (!node) {
      return null
    }

    // if we have a matching override at this point in the climb, return that target node
    const matchingOverrideId = arrayFind(Object.keys(this.overrides), overrideId => {
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

    const nextChildInDirection = this.getNextChildInDirection(node, direction)

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
  digDown (node: Node, direction: string = null): Node {
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
        const nodeParent = this.getNode(node.parent)
        if (nodeParent.orientation === 'vertical') {
          if (direction === 'UP') {
            return this.digDown(_findChildWithClosestIndex(this.getNodeLastChild(node), this.currentFocusNodeIndex, this.currentFocusNodeIndexRange), direction)
          }
          if (direction === 'DOWN') {
            return this.digDown(_findChildWithClosestIndex(this.getNodeFirstChild(node), this.currentFocusNodeIndex, this.currentFocusNodeIndexRange), direction)
          }
        }

        if (nodeParent.orientation === 'horizontal') {
          if (direction === 'LEFT') {
            const firstStep = _findChildWithClosestIndex(node, this.getNode(this.currentFocusNode.parent).index)
            return this.digDown(this.getNodeLastChild(firstStep), direction)
          }
          if (direction === 'RIGHT') {
            const firstStep = _findChildWithClosestIndex(node, this.getNode(this.currentFocusNode.parent).index)
            return this.digDown(this.getNodeFirstChild(firstStep), direction)
          }
        }
      }

      // we're not in a nested grid, so just look for matching index ranges or index
      const matchingViaIndexRange = _findChildWithMatchingIndexRange(node, this.currentFocusNodeIndex)
      if (matchingViaIndexRange) {
        return this.digDown(matchingViaIndexRange, direction)
      }
      return this.digDown(_findChildWithClosestIndex(node, this.currentFocusNodeIndex, this.currentFocusNodeIndexRange), direction)
    }

    if (!isNodeFocusable(node) && !this.doesNodeHaveFocusableChildren(node)) {
      const parentNode = this.getNode(node.parent)
      const nextSiblingFromNode = this.getNextChildInDirection({ ...parentNode, activeChild: node.id }, direction)
      // if the next sibling is ME, we're in an infinite loop - just return null
      if (nextSiblingFromNode.id === node.id) {
        return null
      }
      return this.digDown(nextSiblingFromNode, direction)
    }

    // if we dont have an active child, use the first child
    if (!node.activeChild) {
      this.setActiveChild(node.id, this.getNodeFirstChild(node).id)
    }

    const nextChild = node.children[node.activeChild]

    return (isNodeFocusable(nextChild)) ? nextChild : this.digDown(nextChild, direction)
  }

  /**
   * gets the semantic next child for a given direction
   * if the direction is left or up, return the semantic previous child of the node
   * if the direction is right or down, return the semantic next child of the node
   *
   * @param {object} node
   * @param {string} direction
   */
  getNextChildInDirection (node: Node, direction: string = null): Node {
    if (!direction) {
      return this.getNextChild(node)
    }

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
  getNextChild (node: Node): Node {
    if (!node.activeChild) {
      this.setActiveChild(node.id, this.getNodeFirstChild(node).id)
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
   *
   * @param {object} node
   */
  getPrevChild (node: Node): Node {
    if (!node.activeChild) {
      this.setActiveChild(node.id, this.getNodeFirstChild(node).id)
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
   *
   * @param {object} node
   */
  getNodeFirstChild (node: Node): Node {
    if (!node.children) {
      return undefined
    }

    const orderedIndexes = Object.keys(node.children).map(childId => node.children[childId].index).sort((a, b) => a - b)

    return _findChildWithIndex(node, orderedIndexes[0])
  }

  /**
   * get the last child of a node, based on index
   *
   * @param {object} node
   */
  getNodeLastChild (node: Node): Node {
    if (!node.children) {
      return undefined
    }

    const orderedIndexes = Object.keys(node.children).map(childId => node.children[childId].index).sort((a, b) => a - b)

    return _findChildWithIndex(node, orderedIndexes[orderedIndexes.length - 1])
  }

  /**
   * given an event, handle any state changes that may arise from the direction pressed.
   * state changes based on climbUp'ing and digDown'ing from the current focusedNode
   *
   * @param {object} event
   * @param {string} [event.keyCode]
   * @param {string} [event.direction]
   * @param {HandleKeyEventOptions} [options]
   * @param {boolean} [options.forceFocus] - if <code>true</code> and there's no currently focused node, LRUD will try to focus first focusable node
   */
  handleKeyEvent (event: KeyEvent, options: HandleKeyEventOptions = { forceFocus: false }): Node | void {
    const direction = (event.keyCode) ? getDirectionForKeyCode(event.keyCode) : event.direction.toUpperCase()
    const currentFocusNode = this.getNode(this.currentFocusNodeId)

    // if all we're doing is processing an enter, just run the `onSelect` function of the current node...
    if (direction === 'ENTER') {
      this.emitter.emit('select', currentFocusNode)
      if (currentFocusNode.onSelect) {
        currentFocusNode.onSelect(currentFocusNode)
      }
      return
    }

    let topNode: Node
    let focusableNode: Node

    if (!currentFocusNode && options.forceFocus) {
      // No node is focused, focusing first focusable node
      topNode = this.getRootNode()
      focusableNode = this.digDown(topNode)
    } else {
      // climb up from where we are...
      topNode = this.climbUp(currentFocusNode, direction)

      // ... if we cant find a top node, its an invalid move - just return
      if (!topNode) {
        return
      }

      // ...if we need to align indexes, turn the flag on now...
      this.isIndexAlignMode = topNode.isIndexAlign === true

      // ...get the top's next child in the direction we're going...
      const nextChild = this.getNextChildInDirection(topNode, direction)

      // ...and depending on if we're able to find a child, dig down from the child or from the original top...
      focusableNode = (nextChild) ? this.digDown(nextChild, direction) : this.digDown(topNode, direction)
    }

    if (!focusableNode) {
      return
    }

    // ...give an opportunity for the move to be cancelled by the leaving node
    if (currentFocusNode && currentFocusNode.shouldCancelLeave) {
      if (currentFocusNode.shouldCancelLeave(currentFocusNode, focusableNode)) {
        if (currentFocusNode.onLeaveCancelled) {
          currentFocusNode.onLeaveCancelled(currentFocusNode, focusableNode)
        }
        this.emitter.emit('cancelled', {
          leave: currentFocusNode,
          enter: focusableNode
        })
        return currentFocusNode
      }
    }

    // ...give an opportunity for the move to be cancelled by the entering node
    if (focusableNode.shouldCancelEnter) {
      if (focusableNode.shouldCancelEnter(currentFocusNode, focusableNode)) {
        if (focusableNode.onEnterCancelled) {
          focusableNode.onEnterCancelled(currentFocusNode, focusableNode)
        }
        this.emitter.emit('cancelled', {
          leave: currentFocusNode,
          enter: focusableNode
        })
        return currentFocusNode
      }
    }

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
      })
    }

    if (currentFocusNode && currentFocusNode.onLeave) {
      currentFocusNode.onLeave(currentFocusNode)
    }
    if (focusableNode.onEnter) {
      focusableNode.onEnter(focusableNode)
    }

    return focusableNode
  }

  /**
   * Sets the activeChild of the parentId node to the value of the childId node
   *
   * @param {string} parentId
   * @param {string} childId
   */
  setActiveChild (parentId: string, childId: string): void {
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
    } else if (!parent.activeChild) {
      parent.activeChild = child.id
      this.emitter.emit('active', child)
      if (child.onActive) {
        child.onActive(child)
      }
      if (parent.onActiveChildChange) {
        parent.onActiveChildChange({
          node: parent,
          leave: null,
          enter: child
        })
      }
    }
  }

  /**
   * Sets the activeChild of the parentId node to the value of the childId node
   * if the parent node has a parent itself, it digs up the tree and sets those activeChild values
   *
   * @param {string} parentId
   * @param {string} childId
   */
  setActiveChildRecursive (parentId: string, childId: string): void {
    this.setActiveChild(parentId, childId)
    const parent = this.getNode(parentId)

    // if the parent has a parent, bubble up
    if (parent.parent) {
      this.setActiveChildRecursive(parent.parent, parent.id)
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
  assignFocus (nodeId: string): void {
    let node = this.getNode(nodeId)

    if (node.children && !this.doesNodeHaveFocusableChildren(node)) {
      throw new Error(`"${node.id}" does not have focusable children. Are you trying to assign focus to ${node.id}?`)
    }

    if (!isNodeFocusable(node)) {
      node = this.digDown(node)
    }

    if (!node) {
      throw new Error('trying to assign focus to a non focusable node')
    }

    if (this.currentFocusNodeId) {
      const previouslyFocusedNode = this.getNode(this.currentFocusNodeId)
      if (previouslyFocusedNode) {
        this.emitter.emit('blur', previouslyFocusedNode)
        if (previouslyFocusedNode.onBlur) {
          previouslyFocusedNode.onBlur(previouslyFocusedNode)
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
      this.setActiveChildRecursive(node.parent, node.id)
    }

    if (node.onFocus) {
      node.onFocus(node)
    }

    this.emitter.emit('focus', node)
  }

  /**
   * If the focus of the tree is out of sync, ie, the current focused node becomes unfocusable this can be used to fall back to another focus.
   * @param {focusedNode}
   */
  recalculateFocus (node: Node): void {
    const parentNode = this.getNode(node.parent)
    const top = this.climbUp(parentNode, '*')
    if (top) {
      const prev = this.getPrevChild(top)
      if (isNodeFocusable(prev) || (prev && prev.children && Object.keys(prev.children).length)) {
        const child = this.digDown(prev)
        this.assignFocus(child.id)
      } else {
        this.assignFocus(top.id)
      }
    } else {
      this.currentFocusNode = undefined
      this.currentFocusNodeId = undefined
      this.currentFocusNodeIndex = undefined
    }
  }

  /**
   * given a tree, return an array of Nodes in that tree
   *
   * @param {object} tree
   */

  /**
   * given a tree, register all of its nodes into this instance
   *
   * @param {object} tree
   */
  registerTree (tree: object): void {
    getNodesFromTree(tree).forEach(node => {
      this.registerNode(node.id, node)
    })
  }

  /**
   * given a tree object, attempt to register that tree into the current lrud instance
   *
   * if the given tree already exists as a branch in the instance tree, the new tree will replace that branch
   *
   * if the new tree doesn't already exist as a branch in the instance tree, this function will register the new
   * tree as a branch against the root node, as per standard registerNode() behaviour
   *
   * @param {object} tree
   * @param {object} options
   * @param {object} options.maintainIndex if true, and new tree is replacing an existing branch of the tree, maintain the original branches relative index
   */
  insertTree (tree: object, options: InsertTreeOptions = { maintainIndex: true }): void {
    const replacementNode = tree[Object.keys(tree)[0]]

    if (!replacementNode.id) {
      replacementNode.id = Object.keys(tree)[0]
    }

    const originalNode = this.pickNode(replacementNode.id)
    if (!replacementNode.parent && originalNode && originalNode.parent) {
      replacementNode.parent = originalNode.parent
    }

    if (options.maintainIndex && originalNode && typeof originalNode.index === 'number') {
      replacementNode.index = originalNode.index
    }

    this.registerTree(tree)
  }

  doesNodeHaveFocusableChildren (node: Node): boolean {
    return this.focusableNodePathList.some(p => p.indexOf(`${node.id}.`) > -1)
  }

  /**
   * Change the ability of a node to be focused in place
   * @param {string} nodeId
   * @param {boolean} isFocusable
   */
  setNodeFocusable (nodeId: string, isFocusable: boolean): void {
    const node = this.getNode(nodeId)
    if (!node) return

    const nodeIsFocusable = isNodeFocusable(node)
    if (nodeIsFocusable === isFocusable) return

    node.isFocusable = isFocusable
    if (!isFocusable) {
      const path = this.getPathForNodeId(nodeId)
      this.focusableNodePathList.splice(this.focusableNodePathList.indexOf(path), 1)
      const parent = this.getNode(node.parent)
      if (parent && parent.activeChild && parent.activeChild === nodeId) {
        delete parent.activeChild
        // Reset activeChild
        const nextChild = this.getNextChild(parent)
        if (nextChild) {
          this.setActiveChild(parent.id, nextChild.id)
        }
      }

      if (this.currentFocusNodeId === nodeId) {
        this.recalculateFocus(node)
      }
    } else {
      const path = this.getPathForNodeId(nodeId)
      this.focusableNodePathList.push(path)
    }
  }
}
