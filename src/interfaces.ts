/* eslint no-unused-vars: "off", @typescript-eslint/no-explicit-any: "off", no-use-before-define: "off" */

export enum Directions {
  LEFT = 'left',
  RIGHT = 'right',
  UP = 'up',
  DOWN = 'down',
  ENTER = 'enter',
  UNSPECIFIED = '*'
}

export type Direction = `${Directions}`

export enum Orientations {
  VERTICAL = 'vertical',
  HORIZONTAL = 'horizontal'
}

export type Orientation = `${Orientations}`

export type NodeId = string

export type NodeIndex = number

export type NodeIndexRange = [NodeIndex, NodeIndex]

export interface Tree<NodeType> {
  children? :NodeType[]
}

export interface Node extends Tree<Node> {
  id: NodeId
  parent?: Node
  index?: NodeIndex
  activeChild?: Node
  indexRange?: NodeIndexRange
  selectAction?: any
  isFocusable?: boolean
  isWrapping?: boolean
  isStopPropagate?: boolean
  orientation?: Orientation
  isIndexAlign?: boolean
  overrides?: { [direction in Direction]?: Node }
  overrideSources?: { direction: Direction, node: Node }[]
  onLeave?: (leave: Node) => void
  onEnter?: (enter: Node) => void
  shouldCancelLeave?: (leave: Node, enter: Node) => boolean
  onLeaveCancelled?: (currentFocusNode: Node, focusableNode: Node) => void
  shouldCancelEnter?: (leave: Node, enter: Node) => boolean
  onEnterCancelled?: (currentFocusNode: Node, focusableNode: Node) => void
  onSelect?: (node: Node) => void
  onInactive?: (node: Node) => void
  onActive?: (node: Node) => void
  onActiveChildChange?: (event: { node: Node, leave: Node, enter: Node }) => void
  onBlur?: (node: Node) => void
  onFocus?: (node: Node) => void
  onMove?: (event: { node: Node, leave: Node, enter: Node, direction: Direction, offset: -1 | 1 }) => void
}

export interface NodeConfig extends Tree<NodeConfig>, Omit<Node, 'id'|'parent'|'activeChild'|'children'|'overrides'|'overrideSources'> {
  id?: NodeId
  parent?: NodeId
}

export type NodesBag = { [id in NodeId]: Node }

export interface KeyEvent {
  keyCode?: number
  direction?: Direction
}

export interface HandleKeyEventOptions {
  forceFocus?: boolean
}

export interface InsertTreeOptions {
  maintainIndex?: boolean
}

export interface UnregisterNodeOptions {
  forceRefocus?: boolean
}

export interface MoveNodeOptions {
  index?: NodeIndex,
  maintainIndex?: boolean
}

export interface RegisterOverrideOptions {
  forceOverride?: boolean
}
