import {
  Direction,
  Directions,
  HandleKeyEventOptions,
  InsertTreeOptions,
  KeyEvent,
  MoveNodeOptions,
  Node,
  NodeConfig,
  NodeId,
  NodesBag,
  Orientations,
  RegisterOverrideOptions,
  UnregisterNodeOptions
} from './interfaces'

import {
  findChildWithClosestIndex,
  findChildWithMatchingIndexRange,
  getDirectionForKeyCode,
  insertChildNode,
  isDirectionAndOrientationMatching,
  isNodeFocusable,
  prepareNode,
  removeChildNode,
  toValidDirection,
  toValidOrientation,
  traverseNodeSubtree
} from './utils'

import mitt from 'mitt'

export * from './interfaces'

export class Lrud {
  nodes: NodesBag
  rootNode: Node
  currentFocusNode?: Node
  isIndexAlignMode: boolean
  emitter: mitt.Emitter

  constructor () {
    this.nodes = {}
    this.rootNode = undefined
    this.currentFocusNode = undefined
    this.isIndexAlignMode = false
    this.emitter = mitt()
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
    if (!this.rootNode) {
      throw new Error('no root node')
    }
    return this.rootNode
  }

  /**
   * Returns the current focused node.
   */
  getCurrentFocusNode (): Node | undefined {
    return this.currentFocusNode
  }

  /**
   * Registers a new node into the LRUD tree.
   *
   * @param {string} nodeId - id of the node to register
   * @param {object} [nodeConfig] - registered node parameters
   * @param {string} [nodeConfig.parent] - parent node id, if null, default root node is used
   * @param {number} [nodeConfig.index] - if null, index is 1 more than the index of the last sibling. if no previous siblings, index is 1
   * @param {number[]} [nodeConfig.indexRange] - defaults to null. acts as a colspan, value [0] is lower bound, value [1] is upper bound
   * @param {object} [nodeConfig.selectAction] - if a node has a selectAction, it is focusable
   * @param {boolean} [nodeConfig.isFocusable] - if a node is explicitly set as isFocusable, it is focusable
   * @param {boolean} [nodeConfig.isWrapping] - if true, when asking for the next child at the end or start of the node, the will "wrap around" and return the first/last (when asking for the last/first)
   * @param {string} [nodeConfig.orientation] - can be "vertical" or "horizontal". is used in conjunction when handling direction of key press, to determine which child is "next"
   * @param {boolean} [nodeConfig.isIndexAlign]  -if a node is index aligned, its descendents should jump to nodes based on index instead of activeChild
   * @param {function} [nodeConfig.onLeave] - if a node has an `onLeave` function, it will be run when a move event leaves this node
   * @param {function} [nodeConfig.onEnter] - if a node has an `onEnter` function, it will be run when a move event enters this node
   */
  registerNode (nodeId: NodeId, nodeConfig: NodeConfig = {}): Lrud {
    if (this.getNode(nodeId)) {
      throw Error(`Node with an ID of ${nodeId} has already been registered`)
    }

    // It is not allowed to register node directly with children, for such purposes registerTree should be used
    const node = prepareNode(nodeId, nodeConfig)

    // if this is the very first node, set it as root and return...
    if (!this.rootNode) {
      this.rootNode = node
      this.nodes = { [nodeId]: node }
      return this
    }

    // if this node config has no parent, assume its parent is root
    const parentNode = nodeConfig.parent ? this.getNode(nodeConfig.parent) : this.rootNode

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
   * @param {string|object} node - node or id of the node that is about to change parent
   * @param {string|object} newParentNode - node or id of the node that became a new parent for nodeId
   * @param {object} [options]
   * @param {number} [options.index] - index at which nodeId should be inserted as a child of newParentNodeId
   * @param {boolean} [options.maintainIndex] - applies only if index is not defined; if true, node will be inserted at
   *                                           it's current position if possible; otherwise node will be appended; default: false
   */
  moveNode (node: NodeId | Node, newParentNode: NodeId | Node, options: MoveNodeOptions = { maintainIndex: false }): void {
    node = typeof node === 'string' ? this.getNode(node) : node as Node
    newParentNode = typeof newParentNode === 'string' ? this.getNode(newParentNode) : newParentNode as Node

    if (!node || !newParentNode) {
      return
    }

    // It's not possible to move root node
    if (node === this.rootNode) {
      return
    }

    // There's no need to change the parent
    if (node.parent === newParentNode) {
      return
    }

    const oldParentNode = node.parent

    // Removing node from old parent
    removeChildNode(oldParentNode, node)

    // Changing parent of a node
    if (typeof options.index === 'number') {
      node.index = options.index
    } else if (!options.maintainIndex) {
      node.index = undefined
    }
    insertChildNode(newParentNode, node)

    // If moved node was an active child of the old parent, it needs to be cleaned out as well
    this.unsetActiveChild(oldParentNode, node)

    // If moved node which is (or it's subtree contains) currently focused node, then parent's active child needs to be adjusted
    if (this.isSameOrParentForChild(node, this.currentFocusNode)) {
      this.setActiveChildRecursive(newParentNode, node)
    }
  }

  /**
   * Registers a new node into the LRUD tree.
   *
   * Kept for backwards compatibility reasons.
   *
   * @param {string} nodeId - id of the node to register
   * @param {object} [nodeConfig] - registered node parameters
   */
  register (nodeId: NodeId, nodeConfig?: NodeConfig): Lrud {
    return this.registerNode(nodeId, nodeConfig)
  }

  /**
   * Unregisters a node from the navigation tree.
   *
   * Kept for backwards compatibility reasons.
   *
   * @param {string|object} node - node or id of the node to unregister
   * @param {object} [unregisterOptions]
   */
  unregister (node: NodeId | Node, unregisterOptions?: UnregisterNodeOptions): void {
    this.unregisterNode(node, unregisterOptions)
  }

  /**
   * Unregisters a node from the navigation tree.
   *
   * @param {string|object} node - node or id of the node to unregister
   * @param {object} [unregisterOptions]
   * @param {boolean} [unregisterOptions.forceRefocus] if true, LRUD will attempt to re-focus on a new node if the currently focused
   *                                                   node becomes unregistered due to the given node ID being unregistered
   */
  unregisterNode (node: NodeId | Node, unregisterOptions: UnregisterNodeOptions = { forceRefocus: true }): Lrud {
    node = typeof node === 'string' ? this.getNode(node) : node as Node

    // if we're trying to unregister a node that doesn't exist, exit out
    if (!node) {
      return this
    }

    if (node === this.rootNode) {
      this.nodes = {}
      this.rootNode = undefined
      this.currentFocusNode = undefined
      this.isIndexAlignMode = false
      this.emitter = mitt()
      return this
    }

    // get a copy of the node to pass to the blur event, and grab the parent to work with it
    const parentNode = node.parent

    // ...if we're unregistering the activeChild of our parent (could be a leaf OR branch)
    // we might need to recalculate the focus...
    if (parentNode.activeChild && parentNode.activeChild === node) {
      this.isIndexAlignMode = false

      this.unsetActiveChild(parentNode, node)
    }

    // delete the node itself (delete from the parent and re-set the parent later)
    removeChildNode(parentNode, node)

    // releasing memory references for node and all it's children all node's children
    let currentFocusIsLost = false
    traverseNodeSubtree(node, traversedNode => {
      delete this.nodes[traversedNode.id]
      // Unregistering overrides
      this.unregisterOverride(traversedNode)
      // Unregistering overrides which pointed to unregistered node
      for (let i = 0, overrideSources = traversedNode.overrideSources || []; i < overrideSources.length; i++) {
        this.unregisterOverride(overrideSources[i].node, overrideSources[i].direction)
      }
      // Unregistering currently focused node
      if (traversedNode === this.currentFocusNode) {
        this.currentFocusNode = undefined
        currentFocusIsLost = true
      }
    })

    // blur on the nodeClone
    this.emitter.emit('blur', node)
    if (node.onBlur) {
      node.onBlur(node)
    }

    // check if the current focus node was removed, if so focus needs to be recalculated
    if (currentFocusIsLost && unregisterOptions.forceRefocus) {
      this.recalculateFocus(parentNode)
    }

    return this
  }

  /**
   * Registers a new override onto the LRUD instance.
   *
   * @param {string|object} source - node or id of the node for which override should be triggered
   * @param {string|object} target - node or id of the node to which this overrides points
   * @param {string} direction - traversal direction, for which this override should be triggered
   * @param {object} [options]
   * @param {boolean} [options.forceOverride] if true, existing override from source node in direction will be overwritten.
   */
  registerOverride (source: NodeId | Node, target: NodeId | Node, direction: Direction, options: RegisterOverrideOptions = {}): Lrud {
    source = typeof source === 'string' ? this.getNode(source) : source as Node
    if (!source) {
      throw new Error('registering override: missing source node')
    }

    target = typeof target === 'string' ? this.getNode(target) : target as Node
    if (!target) {
      throw new Error('registering override: missing target node')
    }

    direction = toValidDirection(direction)
    if (!direction) {
      throw new Error('registering override: missing direction')
    }

    if (source.overrides && source.overrides[direction]) {
      if (options.forceOverride) {
        this.unregisterOverride(source, direction)
      } else {
        throw new Error(`registering override: override from ${source.id} to ${target.id} in direction ${direction} already exist`)
      }
    }

    source.overrides = source.overrides || {}
    source.overrides[direction] = target

    target.overrideSources = target.overrideSources || []
    target.overrideSources.push({ direction: direction, node: source })

    return this
  }

  /**
   * Unregisters an override from the LRUD instance.
   *
   * @param {string|object} source - node or id of the node for which override should be unregistered
   * @param {string} [direction] - traversal direction, in which override should be unregistered
   */
  unregisterOverride (source: NodeId | Node, direction?: Direction): Lrud {
    source = typeof source === 'string' ? this.getNode(source) : source as Node
    if (!source || !source.overrides) {
      return
    }

    // if no direction provided, than removing all overrides
    // if unknown direction provided, then aborting
    if (direction) {
      direction = toValidDirection(direction)
      if (!direction) {
        return
      }
    }

    let overridesToAreEmpty = true

    for (const directionKey of Object.keys(Directions)) {
      const directionToRemove = Directions[directionKey]
      if (direction && direction !== directionToRemove) {
        overridesToAreEmpty = overridesToAreEmpty && !(source.overrides && source.overrides[directionToRemove])
        continue
      }

      // removing reference to source node in target overridden in direction
      const target = source.overrides[directionToRemove]
      if (target && target.overrideSources) {
        for (let i = 0; i < target.overrideSources.length; i++) {
          if (target.overrideSources[i].direction === directionToRemove && target.overrideSources[i].node === source) {
            if (target.overrideSources.length === 1) {
              target.overrideSources = undefined
            } else {
              // The fastest way of removing element from array without maintaining the order:
              // put last element into removed one slot and make array shorter
              target.overrideSources[i] = target.overrideSources[target.overrideSources.length - 1]
              target.overrideSources.length = target.overrideSources.length - 1
            }
            break
          }
        }
      }

      // removing override
      source.overrides[directionToRemove] = undefined
    }

    // cleaning if no overrides defined
    if (overridesToAreEmpty) {
      source.overrides = undefined
    }
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
   * Gets a node by ID and then unregisters it from the instance.
   *
   * @param {string} nodeId - id of the node to be picked
   */
  pickNode (nodeId: NodeId): Node | undefined {
    const node = this.getNode(nodeId)

    if (!node) {
      return undefined
    }

    this.unregisterNode(node)
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
    while (node) {
      // if we have a matching override at this point in the climb, return that target node
      if (node.overrides && node.overrides[direction]) {
        return node.overrides[direction]
      }

      // if we're on a currently focused node, climb up, definitely we are looking for some other node
      if (node === this.currentFocusNode) {
        // climb up
        node = node.parent
        continue
      }

      // we have children, but the orientation doesn't match, so try our parent
      if (!isDirectionAndOrientationMatching(node.orientation, direction)) {
        // climb up
        node = node.parent
        continue
      }

      // if we couldn't find any focusable candidate within children or we get currently
      // activeChild, we have to look for other focusable candidate, climb up
      if (!this.getNextFocusableChildInDirection(node, direction)) {
        // climb up
        node = node.parent
        continue
      }

      return node
    }

    return undefined
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
    while (node) {
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
          if (node.parent.orientation === Orientations.VERTICAL) {
            if (direction === Directions.UP) {
              // dig down
              node = findChildWithClosestIndex(this.getNodeLastChild(node), currentFocusedIndex, currentFocusedIndexRange)
              continue
            }
            if (direction === Directions.DOWN) {
              // dig down
              node = findChildWithClosestIndex(this.getNodeFirstChild(node), currentFocusedIndex, currentFocusedIndexRange)
              continue
            }
          }

          if (node.parent.orientation === Orientations.HORIZONTAL) {
            if (direction === Directions.LEFT) {
              // dig down
              node = this.getNodeLastChild(findChildWithClosestIndex(node, currentFocusedNode.parent.index))
              continue
            }
            if (direction === Directions.RIGHT) {
              // dig down
              node = this.getNodeFirstChild(findChildWithClosestIndex(node, currentFocusedNode.parent.index))
              continue
            }
          }
        }

        // we're not in a nested grid, so just look for matching index ranges or index
        const matchingViaIndexRange = findChildWithMatchingIndexRange(node, currentFocusedIndex)
        if (matchingViaIndexRange) {
          // dig down
          node = matchingViaIndexRange
          continue
        } else {
          // dig down
          node = findChildWithClosestIndex(node, currentFocusedIndex, currentFocusedIndexRange)
          continue
        }
      }

      // if possible, picking a branch that had focus in the past, one of its children was focused
      if (node.activeChild) {
        // dig down
        node = node.activeChild
        continue
      }

      // otherwise simply digging deeper, picking branch with first focusable candidate
      node = this.getNextFocusableChildInDirection(node, Directions.UNSPECIFIED)
    }

    return undefined
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
    if (!node.activeChild) {
      return this.getNodeFirstFocusableChild(node)
    }

    // starting right after child that is (or was) focused
    for (let i = node.activeChild.index + 1; i < node.children.length; i++) {
      if (this.isNodeFocusableCandidate(node.children[i])) {
        return node.children[i]
      }
    }

    // we haven't found a node so far, so looking from the beginning of list up to current active node if possible
    if (node.isWrapping) {
      for (let i = 0; i < node.activeChild.index; i++) {
        if (this.isNodeFocusableCandidate(node.children[i])) {
          return node.children[i]
        }
      }
    }

    return undefined
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
    if (!node.activeChild) {
      return this.getNodeLastFocusableChild(node)
    }

    // starting right before child that is (or was) focused
    for (let i = node.activeChild.index - 1; i >= 0; i--) {
      if (this.isNodeFocusableCandidate(node.children[i])) {
        return node.children[i]
      }
    }

    // we haven't found a node so far, so looking from the end of list up to current active node if possible
    if (node.isWrapping) {
      for (let i = node.children.length - 1; i > node.activeChild.index; i--) {
        if (this.isNodeFocusableCandidate(node.children[i])) {
          return node.children[i]
        }
      }
    }

    return undefined
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

    return node.children[0]
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

    return node.children[node.children.length - 1]
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

    for (let i = 0; i < node.children.length; i++) {
      if (this.isNodeFocusableCandidate(node.children[i])) {
        return node.children[i]
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

    for (let i = node.children.length - 1; i >= 0; i--) {
      if (this.isNodeFocusableCandidate(node.children[i])) {
        return node.children[i]
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
    this.assignFocus(focusableNode)

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
   * Sets the activeChild of the parent node to the value of the child node.
   *
   * @param {string|object} parent - node or id of the node, which activeChild is about to be set
   * @param {string|object} child - node or id of the node, that is about to be set as parent's activeChild
   */
  setActiveChild (parent: NodeId | Node, child: NodeId | Node): void {
    parent = typeof parent === 'string' ? this.getNode(parent) : parent as Node
    child = typeof child === 'string' ? this.getNode(child) : child as Node

    if (!parent || !child) {
      return
    }
    if (child.parent.id !== parent.id) {
      return
    }

    // the parent already has an active child, and its NOT the same child that we're now setting
    if (parent.activeChild && parent.activeChild.id !== child.id) {
      const currentActiveChild = parent.activeChild
      parent.activeChild = child
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
      parent.activeChild = child
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
   * Sets the activeChild of the parent node to the value of the child node.
   *
   * If the parent node has a parent itself, it digs up the tree and sets those activeChild values.
   *
   * @param {string|object} parent - node or id of the node, which activeChild is about to be set
   * @param {string|object} child - node or id of the node, that is about to be set as parent's activeChild
   */
  setActiveChildRecursive (parent: NodeId | Node, child: NodeId | Node): void {
    parent = typeof parent === 'string' ? this.getNode(parent) : parent as Node
    child = typeof child === 'string' ? this.getNode(child) : child as Node

    while (parent) {
      this.setActiveChild(parent, child)
      // if the parent has a parent, bubble up
      child = parent
      parent = parent.parent
    }
  }

  /**
   * Unsets the activeChild of the parent nodes branch ensuring that activeChild is on the unsetting child node path
   * and not on the currentFocusNode's path, unless child node is a currentFocusNode.
   *
   * @param {string|object} parent - node or id of the node, which activeChild is about to be unset
   * @param {string|object} activeChild - node or id of the node, that is about to be unset as parent's activeChild
   */
  unsetActiveChild (parent: NodeId | Node, activeChild: NodeId | Node): void {
    parent = typeof parent === 'string' ? this.getNode(parent) : parent as Node
    activeChild = typeof activeChild === 'string' ? this.getNode(activeChild) : activeChild as Node

    if (!parent || !parent.activeChild) {
      return
    }
    if (!activeChild || parent.activeChild !== activeChild) {
      return
    }

    const isActiveChildAtCurrentFocusNodeBranch = this.isSameOrParentForChild(activeChild, this.currentFocusNode)

    while (parent && parent.activeChild) {
      const isParentAtActiveChildBranch = parent.activeChild === activeChild
      const isParentAtCurrentFocusedNodeBranch = this.isSameOrParentForChild(parent.activeChild, this.currentFocusNode)

      if (isActiveChildAtCurrentFocusNodeBranch || (isParentAtActiveChildBranch && !isParentAtCurrentFocusedNodeBranch)) {
        parent.activeChild = undefined
      }

      activeChild = parent
      parent = parent.parent
    }
  }

  /**
   * Sets the current focus of the instance to the given node or node ID.
   *
   * If the given node points to a non-focusable node, we dig down from
   * the given node to find a node that can be focused on.
   *
   * Calls `onFocus` on the given node, if it exists, and emits a `focus` event,
   * also calls `onBlur` on the node that WAS focused before this function was called.
   *
   * @param {string|object} node - node or id of the node to be focused
   */
  assignFocus (node: NodeId | Node): void {
    node = typeof node === 'string' ? this.getNode(node) : node as Node

    // Focus might be assigned to node that is not focusable itself, but
    // contains focusable children, looking for such child
    if (node && !isNodeFocusable(node)) {
      node = this.digDown(node, Directions.UNSPECIFIED)
    }

    if (!node) {
      throw new Error('trying to assign focus to a non focusable node')
    }

    if (this.currentFocusNode) {
      this.emitter.emit('blur', this.currentFocusNode)
      if (this.currentFocusNode.onBlur) {
        this.currentFocusNode.onBlur(this.currentFocusNode)
      }
    }

    this.currentFocusNode = node

    if (node.parent) {
      this.setActiveChildRecursive(node.parent, node)
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
      this.assignFocus(focusableNode)
    } else {
      this.currentFocusNode = undefined
    }
  }

  /**
   * Given a tree, register all of its nodes into this instance.
   *
   * @param {object} subTreeRootNodeConfig
   */
  registerTree (subTreeRootNodeConfig: NodeConfig): void {
    if (!subTreeRootNodeConfig) {
      return
    }

    traverseNodeSubtree(subTreeRootNodeConfig, traversedNodeConfig => {
      this.registerNode(traversedNodeConfig.id, traversedNodeConfig)
      if (traversedNodeConfig.children) {
        for (let i = 0; i < traversedNodeConfig.children.length; i++) {
          traversedNodeConfig.children[i].parent = traversedNodeConfig.id
        }
      }
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
   * @param {object} subTreeRootNodeConfig
   * @param {object} [options]
   * @param {boolean} [options.maintainIndex] - if true, and new tree is replacing an existing branch of the tree,
   *                                            maintain the original branches relative index; default: true
   */
  insertTree (subTreeRootNodeConfig: NodeConfig, options: InsertTreeOptions = { maintainIndex: true }): void {
    if (!subTreeRootNodeConfig) {
      return
    }

    const nodeToReplace = this.pickNode(subTreeRootNodeConfig.id)
    if (!subTreeRootNodeConfig.parent && nodeToReplace && nodeToReplace.parent) {
      subTreeRootNodeConfig.parent = nodeToReplace.parent.id
    }

    if (options.maintainIndex && nodeToReplace && typeof nodeToReplace.index === 'number') {
      subTreeRootNodeConfig.index = nodeToReplace.index
    }

    this.registerTree(subTreeRootNodeConfig)
  }

  /**
   * Checks is node contains children that might be focused (are a focusable candidates).
   * It checks the whole node's children sub-tree, not only direct children.
   *
   * @param {object} node - node, which children are checked against being focusable candidates
   */
  doesNodeHaveFocusableChildren (node: Node): boolean {
    if (!node || !node.children) {
      return false
    }

    let nodeHaveFocusableChildren = false
    traverseNodeSubtree(node, traversedNode => {
      // ignoring when subtree root, we are only interested in children focusability
      if (traversedNode !== node) {
        nodeHaveFocusableChildren = nodeHaveFocusableChildren || isNodeFocusable(traversedNode)
      }
      return nodeHaveFocusableChildren
    })

    return nodeHaveFocusableChildren
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
   * @param {string|object} parent - parent or id of the examined parent
   * @param {string|object} child - node id of the node which parents are queried
   */
  isSameOrParentForChild (parent: NodeId | Node, child: NodeId | Node): boolean {
    parent = typeof parent === 'string' ? this.getNode(parent) : parent as Node
    child = typeof child === 'string' ? this.getNode(child) : child as Node

    if (!parent || !child) {
      return false
    }

    if (parent === child) {
      return true
    }

    while (child) {
      if (child.parent === parent) {
        return true
      }
      child = child.parent
    }

    return false
  }

  /**
   * Changes the ability of a node to be focused in place.
   *
   * @param {string|object} node - node or id of the node, which focusability property is about to be changed
   * @param {boolean} isFocusable - focusability value to set
   */
  setNodeFocusable (node: NodeId | Node, isFocusable: boolean): void {
    node = typeof node === 'string' ? this.getNode(node) : node as Node
    if (!node) {
      return
    }

    const nodeIsFocusable = isNodeFocusable(node)
    if (nodeIsFocusable === isFocusable) {
      return
    }

    node.isFocusable = isFocusable
    if (!isFocusable) {
      if (this.currentFocusNode === node) {
        this.recalculateFocus(node)
      }
      if (node.parent) {
        this.unsetActiveChild(node.parent, node)
      }
    }
  }
}
