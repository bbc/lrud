import {
  Direction,
  Directions,
  HandleKeyEventOptions,
  InsertTreeOptions,
  KeyEvent,
  MoveNodeOptions,
  Node,
  NodeId,
  NodeTree,
  Orientations,
  Override,
  OverrideId,
  OverrideTree,
  UnregisterNodeOptions
} from './interfaces'

import {
  findChildWithClosestIndex,
  findChildWithIndex,
  findChildWithMatchingIndexRange,
  flattenNode,
  flattenNodeTree,
  getDirectionForKeyCode,
  insertChildNode,
  isDirectionAndOrientationMatching,
  isNodeFocusable,
  removeChildNode,
  toValidDirection,
  toValidOrientation
} from './utils'

import mitt from 'mitt'

export * from './interfaces'

export class Lrud {
  nodes: NodeTree
  rootNodeId: NodeId
  currentFocusNodeId?: NodeId
  isIndexAlignMode: boolean
  emitter: mitt.Emitter
  overrides: OverrideTree

  constructor () {
    this.nodes = {}
    this.rootNodeId = undefined
    this.currentFocusNodeId = undefined
    this.isIndexAlignMode = false
    this.emitter = mitt()
    this.overrides = {}
  }

  /**
   * Registers a callback for an LRUD event.
   *
   * @param {string} eventName - event to subscribe to
   * @param {function} callback - function to call on event
   */
  on (eventName: string, callback: mitt.Handler): void {
    this.emitter.on(eventName, callback)
  }

  /**
   * Unregisters a callback for an LRUD event.
   *
   * @param {string} eventName - event to unsubscribe from
   * @param {function} callback - function that was added using .on()
   */
  off (eventName: string, callback: mitt.Handler): void {
    this.emitter.off(eventName, callback)
  }

  /**
   * Returns the root node.
   */
  getRootNode (): Node {
    const node = this.getNode(this.rootNodeId)

    if (!node) {
      throw new Error('no root node')
    }

    return node
  }

  /**
   * Returns the current focused node.
   */
  getCurrentFocusNode (): Node {
    return this.getNode(this.currentFocusNodeId)
  }

  /**
   * Registers a new node into the LRUD tree.
   *
   * @param {string} nodeId - id of the node to register
   * @param {object} node - registered node parameters
   * @param {string} [node.id] - if null, `nodeId` is used
   * @param {string} [node.parent] - if null, value of `this.rootNodeId` is used
   * @param {number} [node.index] - if null, index is 1 more than the index of the last sibling. if no previous siblings, index is 1
   * @param {number[]} [node.indexRange] - defaults to null. acts as a colspan, value [0] is lower bound, value [1] is upper bound
   * @param {object} [node.selectAction] - if a node has a selectAction, it is focusable
   * @param {boolean} [node.isFocusable] - if a node is explicitly set as isFocusable, it is focusable
   * @param {boolean} [node.isWrapping] - if true, when asking for the next child at the end or start of the node, the will "wrap around" and return the first/last (when asking for the last/first)
   * @param {string} [node.orientation] - can be "vertical" or "horizontal". is used in conjunction when handling direction of key press, to determine which child is "next"
   * @param {boolean} [node.isIndexAlign]  -if a node is index aligned, its descendents should jump to nodes based on index instead of activeChild
   * @param {function} [node.onLeave] - if a node has an `onLeave` function, it will be run when a move event leaves this node
   * @param {function} [node.onEnter] - if a node has an `onEnter` function, it will be run when a move event enters this node
   */
  registerNode (nodeId: NodeId, node: Node = {}): Lrud {
    if (this.getNode(nodeId)) {
      throw Error(`Node with an ID of ${nodeId} has already been registered`)
    }

    // It is not allowed to register node directly with children, for such purposes registerTree should be used
    node = {
      ...node,
      id: nodeId
    }
    delete node.children

    // if this is the very first node, set it as root and return...
    if (Object.keys(this.nodes).length <= 0) {
      this.rootNodeId = nodeId
      this.nodes[nodeId] = node
      return this
    }

    // if this node has no parent, assume its parent is root
    if (!node.parent && nodeId !== this.rootNodeId) {
      node.parent = this.rootNodeId
    }

    const parentNode = this.getNode(node.parent)
    // to keep tree coherent, nodes that are about to be added to not existing parent are ignored
    if (!parentNode) {
      return this
    }

    // add the node into the tree
    this.nodes[nodeId] = node
    insertChildNode(parentNode, node)

    return this
  }

  /**
   * Allows to change node's parent by moving it's whole sub-tree.
   *
   * @param {string} nodeId - id of the node that is about to change parent
   * @param {string} newParentNodeId - id of the node that became a new parent for nodeId
   * @param {object} [options]
   * @param {number} [options.index] - index at which nodeId should be inserted as a child of newParentNodeId
   * @param {boolean} [options.maintainIndex] - applies only if index is not defined; if true, node will be inserted at
   *                                           it's current position if possible; otherwise node will be appended; default: false
   */
  moveNode (nodeId: NodeId, newParentNodeId: NodeId, options: MoveNodeOptions = { maintainIndex: false }): void {
    // It's not possible to move root node
    if (nodeId === this.rootNodeId) {
      return
    }

    const node = this.getNode(nodeId)
    if (!node) {
      return
    }

    const newParentNode = this.getNode(newParentNodeId)
    if (!newParentNode) {
      return
    }

    // There's no need to change the parent
    if (node.parent === newParentNodeId) {
      return
    }

    const oldParentNode = this.getNode(node.parent)

    // Removing node from old parent
    removeChildNode(oldParentNode, nodeId)

    // Changing parent of a node
    if (typeof options.index === 'number') {
      node.index = options.index
    } else if (!options.maintainIndex) {
      node.index = undefined
    }
    insertChildNode(newParentNode, node)

    // If moved node was an active child of the old parent, it needs to be cleaned out as well
    this.unsetActiveChild(oldParentNode.id, node.id)

    // If moved node which is (or it's subtree contains) currently focused node, then parent's active child needs to be adjusted
    if (this.isSameOrParentForChild(nodeId, this.currentFocusNodeId)) {
      this.setActiveChildRecursive(newParentNode.id, node.id)
    }
  }

  /**
   * Registers a new node into the LRUD tree.
   *
   * Kept for backwards compatibility reasons.
   *
   * @param {string} nodeId - id of the node to register
   * @param {object} [node] - registered node parameters
   */
  register (nodeId: NodeId, node?: Node): Lrud {
    return this.registerNode(nodeId, node)
  }

  /**
   * Unregisters a node from the navigation tree.
   *
   * Kept for backwards compatibility reasons.
   *
   * @param {string} nodeId - id of the node to unregister
   * @param {object} [unregisterOptions]
   */
  unregister (nodeId: NodeId, unregisterOptions?: UnregisterNodeOptions): void {
    this.unregisterNode(nodeId, unregisterOptions)
  }

  /**
   * Unregisters a node from the navigation tree.
   *
   * @param {string} nodeId - id of the node to unregister
   * @param {object} [unregisterOptions]
   * @param {boolean} [unregisterOptions.forceRefocus] if true, LRUD will attempt to re-focus on a new node if the currently focused
   *                                                   node becomes unregistered due to the given node ID being unregistered
   */
  unregisterNode (nodeId: string, unregisterOptions: UnregisterNodeOptions = { forceRefocus: true }): Lrud {
    if (nodeId === this.rootNodeId) {
      this.nodes = {}
      this.rootNodeId = undefined
      this.currentFocusNodeId = undefined
      this.isIndexAlignMode = false
      this.emitter = mitt()
      this.overrides = {}
      return this
    }

    const node = this.getNode(nodeId)

    // if we're trying to unregister a node that doesn't exist, exit out
    if (!node) {
      return this
    }

    // get a copy of the node to pass to the blur event, and grab the parent to work with it
    const parentNode = this.getNode(node.parent)

    // delete the node itself (delete from the parent and re-set the parent later)
    removeChildNode(parentNode, nodeId)

    // delete all node's children
    const flatNodeTree = flattenNode(node)
    Object.keys(flatNodeTree).forEach(flatNodeId => {
      delete this.nodes[flatNodeId]
    })

    // ...if we're unregistering the activeChild of our parent (could be a leaf OR branch)
    // we might need to recalculate the focus...
    if (parentNode.activeChild && parentNode.activeChild === nodeId) {
      this.isIndexAlignMode = false

      // check if the current focus node was removed, if so focus needs to be recalculated
      if (!this.getCurrentFocusNode()) {
        this.currentFocusNodeId = undefined
        if (unregisterOptions.forceRefocus) {
          this.recalculateFocus(parentNode)
        }
      }

      this.unsetActiveChild(parentNode.id, nodeId)
    }

    // blur on the nodeClone
    this.emitter.emit('blur', node)
    if (node.onBlur) {
      node.onBlur(node)
    }

    // if we have any overrides whose target or ID is the node (or one of its children) we just unregistered, we should unregister
    // those overrides (thus keeping state clean)
    Object.keys(this.overrides).forEach(overrideId => {
      const override = this.overrides[overrideId]
      if (flatNodeTree[override.target] || flatNodeTree[override.id]) {
        this.unregisterOverride(overrideId)
      }
    })

    return this
  }

  /**
   * Registers a new override onto the LRUD instance.
   *
   * @param {string} overrideId - id of the override to register
   * @param {object} override
   * @param {string} override.id - id of the node, for which this override should be triggered
   * @param {string} override.direction - traversal direction, for which this override should be triggered
   * @param {string} override.target - id of the node to which this overrides points
   */
  registerOverride (overrideId: OverrideId, override: Override): Lrud {
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
   * Unregisters an override from the LRUD instance.
   *
   * @param {string} overrideId - id of the override to unregister
   */
  unregisterOverride (overrideId: OverrideId): Lrud {
    delete this.overrides[overrideId]
    return this
  }

  /**
   * Returns a node for an ID.
   *
   * @param {string} nodeId - id of the node to be returned
   */
  getNode (nodeId: NodeId): Node | undefined {
    if (!nodeId) {
      return undefined
    }
    return this.nodes[nodeId]
  }

  /**
   * Gets a node by ID and then unregister it from the instance.
   *
   * @param {string} nodeId - id of the node to be picked
   */
  pickNode (nodeId: NodeId): Node | undefined {
    const node = this.getNode(nodeId)

    if (!node) {
      return undefined
    }

    this.unregisterNode(nodeId)
    return node
  }

  /**
   * Starting from a node, climb up the navigation tree until we find a node that can be
   * actioned, based on the given direction. An actionable node is one whose orientation is valid
   * for the given direction, has focusable children and whose activeChild isn't a leaf that is
   * also its current activeChild.
   *
   * @param {object} node - node from which climbing up starts
   * @param {string} direction - direction in which to traverse while climbing up
   */
  climbUp (node: Node, direction: Direction): Node | undefined {
    if (!node) {
      return undefined
    }

    // if we have a matching override at this point in the climb, return that target node
    for (const overrideId of Object.keys(this.overrides)) {
      const override = this.overrides[overrideId]
      if (override.id === node.id && override.direction.toUpperCase() === direction.toUpperCase()) {
        return this.getNode(override.target)
      }
    }

    // if we're on a currently focused node, climb up, definitely we are looking for some other node
    if (node.id === this.currentFocusNodeId) {
      return this.climbUp(this.getNode(node.parent), direction)
    }

    // we have children, but the orientation doesn't match, so try our parent
    if (!isDirectionAndOrientationMatching(node.orientation, direction)) {
      return this.climbUp(this.getNode(node.parent), direction)
    }

    // if we couldn't find any focusable candidate within children or we get currently
    // activeChild, we have to look for other focusable candidate, climb up
    if (!this.getNextFocusableChildInDirection(node, direction)) {
      return this.climbUp(this.getNode(node.parent), direction)
    }

    return node
  }

  /**
   * Starting from the given node, dig down the navigation tree until we find a focusable
   * leaf, and return it. dig "direction" priority:
   * - index align mode
   * - active child
   * - first focusable child
   *
   * @param {object} node - node, from which digging down starts
   * @param {string} [direction] - direction in which to traverse while digging down
   */
  digDown (node: Node, direction: Direction = Directions.UNSPECIFIED): Node | undefined {
    if (!node) {
      return undefined
    }

    // If the node is focusable, then return it, but only when it doesn't contain focusable children.
    // Otherwise, digging down to "the deepest" focusable node.
    // Focusable "leaf" has a higher priority than focusable "container".
    if (isNodeFocusable(node) && (node.isStopPropagate || !this.doesNodeHaveFocusableChildren(node))) {
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
      const currentFocusedNode = this.getCurrentFocusNode()
      const currentFocusedIndexRange = currentFocusedNode.indexRange
      const currentFocusedIndex = currentFocusedIndexRange ? currentFocusedIndexRange[0] : currentFocusedNode.index
      if (node.isIndexAlign) {
        // we're in a nested grid, so need to take into account orientation and direction of travel
        const nodeParent = this.getNode(node.parent)
        if (nodeParent.orientation === Orientations.VERTICAL) {
          if (direction === Directions.UP) {
            return this.digDown(findChildWithClosestIndex(this.getNodeLastChild(node), currentFocusedIndex, currentFocusedIndexRange), direction)
          }
          if (direction === Directions.DOWN) {
            return this.digDown(findChildWithClosestIndex(this.getNodeFirstChild(node), currentFocusedIndex, currentFocusedIndexRange), direction)
          }
        }

        if (nodeParent.orientation === Orientations.HORIZONTAL) {
          if (direction === Directions.LEFT) {
            const firstStep = findChildWithClosestIndex(node, this.getNode(currentFocusedNode.parent).index)
            return this.digDown(this.getNodeLastChild(firstStep), direction)
          }
          if (direction === Directions.RIGHT) {
            const firstStep = findChildWithClosestIndex(node, this.getNode(currentFocusedNode.parent).index)
            return this.digDown(this.getNodeFirstChild(firstStep), direction)
          }
        }
      }

      // we're not in a nested grid, so just look for matching index ranges or index
      const matchingViaIndexRange = findChildWithMatchingIndexRange(node, currentFocusedIndex)
      if (matchingViaIndexRange) {
        return this.digDown(matchingViaIndexRange, direction)
      }
      return this.digDown(findChildWithClosestIndex(node, currentFocusedIndex, currentFocusedIndexRange), direction)
    }

    // if possible, picking a branch that had focus in the past, one of its children was focused
    if (node.activeChild) {
      return this.digDown(node.children[node.activeChild], direction)
    }

    // otherwise simply digging deeper, picking branch with first focusable candidate
    return this.digDown(this.getNextFocusableChildInDirection(node, Directions.UNSPECIFIED), direction)
  }

  /**
   * Gets the semantic next focusable child for a given direction.
   *
   * If the direction is 'left' or 'up', return the semantic previous focusable child of the node.
   * If the direction is 'right' or 'down'', return the semantic next focusable child of the node.
   * If the direction is *, return the semantic next (or previous, if next not found) focusable child of the node.
   *
   * @param {object} node - node, for which next focusable child for a given direction is returned
   * @param {string} direction - direction in which to traverse while searching for next focusable child
   */
  getNextFocusableChildInDirection (node: Node, direction: Direction): Node | undefined {
    if (!node) {
      return undefined
    }

    const validOrientation = toValidOrientation(node.orientation)
    const validDirection = toValidDirection(direction)

    let nextChildInDirection

    const traverseForward = (validDirection === Directions.UNSPECIFIED) ||
      (validOrientation === Orientations.HORIZONTAL && validDirection === Directions.RIGHT) ||
      (validOrientation === Orientations.VERTICAL && validDirection === Directions.DOWN)

    if (traverseForward) {
      nextChildInDirection = this.getNextFocusableChild(node)
    }

    const traverseBackward = (validDirection === Directions.UNSPECIFIED) ||
      (validOrientation === Orientations.HORIZONTAL && validDirection === Directions.LEFT) ||
      (validOrientation === Orientations.VERTICAL && validDirection === Directions.UP)

    if (!nextChildInDirection && traverseBackward) {
      nextChildInDirection = this.getPrevFocusableChild(node)
    }

    return nextChildInDirection
  }

  /**
   * Gets the semantic "next" child for a node that might be focused or bypass focus to its children.
   *
   * @param {object} node - node, for which next focusable child is returned
   */
  getNextFocusableChild (node: Node): Node | undefined {
    if (!node || !node.children) {
      return undefined
    }
    // there's no child that is (or was) focused, so we can quickly pick first focusable child
    const activeChild = this.getNode(node.activeChild)
    if (!activeChild) {
      return this.getNodeFirstFocusableChild(node)
    }

    let nextChild = activeChild

    do {
      nextChild = findChildWithIndex(node, nextChild.index + 1)
      if (!nextChild && node.isWrapping) {
        nextChild = this.getNodeFirstFocusableChild(node)
      }
      if (!nextChild) {
        nextChild = activeChild
      }
    } while (!this.isNodeFocusableCandidate(nextChild) && nextChild.id !== activeChild.id)

    return nextChild.id !== activeChild.id ? nextChild : undefined
  }

  /**
   * Gets the semantic "previous" child for a node that might be focused or bypass focus to its children.
   *
   * @param {object} node - node, for which previous focusable child is returned
   */
  getPrevFocusableChild (node: Node): Node | undefined {
    if (!node || !node.children) {
      return undefined
    }
    // there's no child that is (or was) focused, so we can quickly pick last focusable child
    const activeChild = this.getNode(node.activeChild)
    if (!activeChild) {
      return this.getNodeLastFocusableChild(node)
    }

    // starting from child that is (or was) focused
    let prevChild = activeChild

    do {
      prevChild = findChildWithIndex(node, prevChild.index - 1)
      if (!prevChild && node.isWrapping) {
        prevChild = this.getNodeLastFocusableChild(node)
      }
      if (!prevChild) {
        prevChild = activeChild
      }
    } while (!this.isNodeFocusableCandidate(prevChild) && prevChild.id !== activeChild.id)

    return prevChild.id !== activeChild.id ? prevChild : undefined
  }

  /**
   * Gets the first child of a node, based on index.
   *
   * @param {object} node - node, for which first child is returned
   */
  getNodeFirstChild (node: Node): Node | undefined {
    if (!node || !node.children) {
      return undefined
    }

    return findChildWithIndex(node, 0)
  }

  /**
   * Gets the last child of a node, based on index.
   *
   * @param {object} node - node, for which last child is returned
   */
  getNodeLastChild (node: Node): Node | undefined {
    if (!node || !node.children) {
      return undefined
    }

    return findChildWithIndex(node, Object.keys(node.children).length - 1)
  }

  /**
   * Gets the first focusable (or containing focusable nodes) child of a node, based on index.
   *
   * @param {object} node - node, for which first focusable child is returned
   */
  getNodeFirstFocusableChild (node: Node): Node | undefined {
    if (!node || !node.children) {
      return undefined
    }

    const orderedChildren = Object.keys(node.children)
      .map(childId => node.children[childId])
      .sort((a, b) => a.index - b.index)

    for (const child of orderedChildren) {
      if (this.isNodeFocusableCandidate(child)) {
        return child
      }
    }

    return undefined
  }

  /**
   * Gets the last focusable (or containing focusable nodes) child of a node, based on index.
   *
   * @param {object} node - node, for which last focusable child is returned
   */
  getNodeLastFocusableChild (node: Node): Node | undefined {
    if (!node || !node.children) {
      return undefined
    }

    const inverselyOrderedChildren = Object.keys(node.children)
      .map(childId => node.children[childId])
      .sort((a, b) => b.index - a.index)

    for (const child of inverselyOrderedChildren) {
      if (this.isNodeFocusableCandidate(child)) {
        return child
      }
    }

    return undefined
  }

  /**
   * Given an event, handle any state changes that may arise from the direction pressed.
   *
   * State changes based on climbing up and digging down from the current focusedNode
   *
   * @param {object} event
   * @param {number} [event.keyCode]
   * @param {string} [event.direction]
   * @param {object} [options]
   * @param {boolean} [options.forceFocus] - if true and there's no currently focused node, LRUD will try to focus
   *                                         first focusable node; default: false
   */
  handleKeyEvent (event: KeyEvent, options: HandleKeyEventOptions = { forceFocus: false }): Node | undefined {
    if (!event) {
      return undefined
    }

    const direction = (event.keyCode) ? getDirectionForKeyCode(event.keyCode) : toValidDirection(event.direction)
    if (!direction) {
      return undefined
    }

    const currentFocusNode = this.getCurrentFocusNode()

    // if all we're doing is processing an enter, just run the `onSelect` function of the current node...
    if (direction === Directions.ENTER) {
      if (currentFocusNode) {
        this.emitter.emit('select', currentFocusNode)
        if (currentFocusNode.onSelect) {
          currentFocusNode.onSelect(currentFocusNode)
        }
      }
      return currentFocusNode
    }

    let topNode: Node
    let focusableNode: Node

    if (!currentFocusNode && options.forceFocus) {
      // No node is focused, focusing first focusable node
      topNode = this.getRootNode()
      focusableNode = this.getNextFocusableChildInDirection(topNode, Directions.UNSPECIFIED)
    } else {
      // climb up from where we are...
      topNode = this.climbUp(currentFocusNode, direction)

      // ... if we cant find a top node, its an invalid move - just return
      if (!topNode) {
        return undefined
      }

      // ...if we need to align indexes, turn the flag on now...
      this.isIndexAlignMode = topNode.isIndexAlign === true

      // ...get the top's next child in the direction we're going...
      const nextChild = this.getNextFocusableChildInDirection(topNode, direction)

      // ...and depending on if we're able to find a child, dig down from the child or from the original top...
      focusableNode = this.digDown(nextChild || topNode, direction)
    }

    if (!focusableNode) {
      return undefined
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

    const offset = (direction === Directions.LEFT || direction === Directions.UP) ? -1 : 1

    // emit events and fire functions now that the move has completed
    this.emitter.emit('move', {
      leave: currentFocusNode,
      enter: focusableNode,
      direction,
      offset
    })

    if (topNode.onMove) {
      topNode.onMove({
        node: topNode,
        leave: currentFocusNode,
        enter: focusableNode,
        direction,
        offset
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
   * Sets the activeChild of the parentId node to the value of the childId node.
   *
   * @param {string} parentId - id of the node, which activeChild is about to be set
   * @param {string} childId - id of the node, that is about to be set as parent's activeChild
   */
  setActiveChild (parentId: NodeId, childId: NodeId): void {
    const child = this.getNode(childId)
    const parent = this.getNode(parentId)
    if (!parent || !child) {
      return
    }
    if (child.parent !== parent.id) {
      return
    }

    // the parent already has an active child, and its NOT the same child that we're now setting
    if (parent.activeChild && parent.activeChild !== child.id) {
      const currentActiveChild = this.getNode(parent.activeChild)
      parent.activeChild = child.id
      if (currentActiveChild) {
        this.emitter.emit('inactive', currentActiveChild)
        if (currentActiveChild.onInactive) {
          currentActiveChild.onInactive(currentActiveChild)
        }
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
   * Sets the activeChild of the parentId node to the value of the childId node.
   *
   * If the parent node has a parent itself, it digs up the tree and sets those activeChild values.
   *
   * @param {string} parentId - id of the node, which activeChild is about to be set
   * @param {string} childId - id of the node, that is about to be set as parent's activeChild
   */
  setActiveChildRecursive (parentId: NodeId, childId: NodeId): void {
    this.setActiveChild(parentId, childId)
    const parent = this.getNode(parentId)

    // if the parent has a parent, bubble up
    if (parent && parent.parent) {
      this.setActiveChildRecursive(parent.parent, parent.id)
    }
  }

  /**
   * Unsets the activeChild of the parent nodes branch ensuring that activeChild is on the unsetting childId path
   * and not on the currentFocusNode's path, unless childId is a currentFocusNode.
   *
   * @param {string} parentId - id of the node, which activeChild is about to be unset
   * @param {string} activeChildId - id of the node, that is about to be unset as parent's activeChild
   */
  unsetActiveChild (parentId: NodeId, activeChildId: NodeId): void {
    let parent = this.getNode(parentId)
    if (!parent || !parent.activeChild) {
      return
    }
    if (parent.activeChild !== activeChildId) {
      return
    }

    const isActiveChildAtCurrentFocusNodeBranch = this.isSameOrParentForChild(activeChildId, this.currentFocusNodeId)

    while (parent && parent.activeChild) {
      const isParentAtActiveChildBranch = parent.activeChild === activeChildId
      const isParentAtCurrentFocusedNodeBranch = this.isSameOrParentForChild(parent.activeChild, this.currentFocusNodeId)

      if (isActiveChildAtCurrentFocusNodeBranch || (isParentAtActiveChildBranch && !isParentAtCurrentFocusedNodeBranch)) {
        delete parent.activeChild
      }

      activeChildId = parent.id
      parent = this.getNode(parent.parent)
    }
  }

  /**
   * Sets the current focus of the instance to the given node ID.
   *
   * If the given node ID points to a non-focusable node, we dig down from
   * the given node to find a node that can be focused on.
   *
   * Calls `onFocus` on the given node, if it exists, and emits a `focus` event,
   * also calls `onBlur` on the node that WAS focused before this function was called.
   *
   * @param {string} nodeId - id of the node to be focused
   */
  assignFocus (nodeId: NodeId): void {
    let node = this.getNode(nodeId)

    // Focus might be assigned to node that is not focusable itself, but
    // contains focusable children, looking for such child
    if (node && !isNodeFocusable(node)) {
      node = this.digDown(node, Directions.UNSPECIFIED)
    }

    if (!node) {
      throw new Error('trying to assign focus to a non focusable node')
    }

    const previouslyFocusedNode = this.getCurrentFocusNode()
    if (previouslyFocusedNode) {
      this.emitter.emit('blur', previouslyFocusedNode)
      if (previouslyFocusedNode.onBlur) {
        previouslyFocusedNode.onBlur(previouslyFocusedNode)
      }
    }

    this.currentFocusNodeId = node.id

    if (node.parent) {
      this.setActiveChildRecursive(node.parent, node.id)
    }

    if (node.onFocus) {
      node.onFocus(node)
    }

    this.emitter.emit('focus', node)
  }

  /**
   * If the focus of the tree is out of sync, ie, the current focused node becomes unfocusable,
   * this can be used to fall back to another focus.
   *
   * @param {object} node - node, based on which focus is recalculated
   */
  recalculateFocus (node: Node): void {
    const topNode = this.climbUp(node, Directions.UNSPECIFIED) || this.getRootNode()
    const nextChild = this.getNextFocusableChildInDirection(topNode, Directions.UNSPECIFIED)
    const focusableNode = this.digDown(nextChild || topNode, Directions.UNSPECIFIED)
    if (focusableNode) {
      this.assignFocus(focusableNode.id)
    } else {
      this.currentFocusNodeId = undefined
    }
  }

  /**
   * Given a tree, register all of its nodes into this instance.
   *
   * @param {object} tree
   */
  registerTree (tree: NodeTree): void {
    const flatNodeTree = flattenNodeTree(tree)
    Object.keys(flatNodeTree).forEach(flatNodeId => {
      this.registerNode(flatNodeId, flatNodeTree[flatNodeId])
    })
  }

  /**
   * Given a tree object, attempt to register that tree into the current lrud instance.
   *
   * If the given tree already exists as a branch in the instance tree, the new tree will replace that branch.
   *
   * If the new tree doesn't already exist as a branch in the instance tree, this function will register the new
   * tree as a branch against the root node, as per standard registerNode() behaviour.
   *
   * @param {object} tree
   * @param {object} [options]
   * @param {boolean} [options.maintainIndex] - if true, and new tree is replacing an existing branch of the tree,
   *                                            maintain the original branches relative index; default: true
   */
  insertTree (tree: NodeTree, options: InsertTreeOptions = { maintainIndex: true }): void {
    if (!tree) {
      return
    }

    const replacementNode = tree[Object.keys(tree)[0]]
    replacementNode.id = Object.keys(tree)[0]

    const originalNode = this.pickNode(replacementNode.id)
    if (!replacementNode.parent && originalNode && originalNode.parent) {
      replacementNode.parent = originalNode.parent
    }

    if (options.maintainIndex && originalNode && typeof originalNode.index === 'number') {
      replacementNode.index = originalNode.index
    }

    this.registerTree(tree)
  }

  /**
   * Checks is node contains children that might be focused (are a focusable candidates).
   * It checks the whole node's children sub-tree, not only direct children.
   *
   * @param node - node, which children are checked against being focusable candidates
   */
  doesNodeHaveFocusableChildren (node: Node): boolean {
    if (!node || !node.children) {
      return false
    }

    const flatNodeChildren = flattenNodeTree(node.children)

    for (const flatNodeId of Object.keys(flatNodeChildren)) {
      if (isNodeFocusable(flatNodeChildren[flatNodeId])) {
        return true
      }
    }

    return false
  }

  /**
   * Checks if node is focusable or contains focusable children.
   *
   * @param {object} node - node to check against being focusable candidate
   */
  isNodeFocusableCandidate (node: Node): boolean {
    return isNodeFocusable(node) || this.doesNodeHaveFocusableChildren(node)
  }

  /**
   * Checks if given parent node is a child's parent node or the node itself. If it's a parent it doesn't have
   * to be a direct one, but has to be placed at a path to the root node.
   *
   * E.g.
   *        root
   *        / \
   *       A   B
   *      /     \
   *     AA      BA
   *    /  \
   *  AAA  AAB
   *
   *  Expect:
   *    isSameOrParentForChild('A', 'A') -> true
   *    isSameOrParentForChild('A', 'AA') -> true
   *    isSameOrParentForChild('AA', 'A') -> false
   *    isSameOrParentForChild('A', 'AAA') -> true
   *    isSameOrParentForChild('AAA', 'AA') -> false
   *    isSameOrParentForChild('A', 'BA') -> false
   *    isSameOrParentForChild('BA', 'A') -> false
   *    isSameOrParentForChild('AA', 'BA') -> false
   *    isSameOrParentForChild('BA', 'AA') -> false
   *
   * @param {string} parentId - id of the examined parent
   * @param {string} childId - id of the node which parents are queried
   */
  isSameOrParentForChild (parentId: NodeId, childId: NodeId): boolean {
    if (!parentId || !childId) {
      return false
    }

    if (parentId === childId) {
      return true
    }

    let child = this.getNode(childId)
    while (child) {
      if (child.parent === parentId) {
        return true
      }
      child = this.getNode(child.parent)
    }

    return false
  }

  /**
   * Changes the ability of a node to be focused in place.
   *
   * @param {string} nodeId - id of the node, which focusability property is about to be changed
   * @param {boolean} isFocusable - focusability value to set
   */
  setNodeFocusable (nodeId: NodeId, isFocusable: boolean): void {
    const node = this.getNode(nodeId)
    if (!node) {
      return
    }

    const nodeIsFocusable = isNodeFocusable(node)
    if (nodeIsFocusable === isFocusable) {
      return
    }

    node.isFocusable = isFocusable
    if (!isFocusable) {
      if (this.currentFocusNodeId === nodeId) {
        this.recalculateFocus(node)
      }
      if (node.parent) {
        this.unsetActiveChild(node.parent, nodeId)
      }
    }
  }
}
