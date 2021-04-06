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

export interface Node {
  id?: NodeId
  parent?: NodeId
  index?: NodeIndex
  indexRange?: NodeIndexRange
  selectAction?: any
  isFocusable?: boolean
  isWrapping?: boolean
  isStopPropagate?: boolean
  orientation?: Orientation
  isIndexAlign?: boolean
  onLeave?: (leave: Node) => void
  onEnter?: (enter: Node) => void
  shouldCancelLeave?: (leave: Node, enter: Node) => boolean
  onLeaveCancelled?: (currentFocusNode: Node, focusableNode: Node) => void
  shouldCancelEnter?: (leave: Node, enter: Node) => boolean
  onEnterCancelled?: (currentFocusNode: Node, focusableNode: Node) => void
  activeChild?: NodeId
  children?: NodeTree
  onSelect?: (node: Node) => void
  onInactive?: (node: Node) => void
  onActive?: (node: Node) => void
  onActiveChildChange?: (event: { node: Node, leave: Node, enter: Node }) => void
  onBlur?: (node: Node) => void
  onFocus?: (node: Node) => void
  onMove?: (event: { node: Node, leave: Node, enter: Node, direction: Direction, offset: -1 | 1 }) => void

  [name: string]: any
}

export type NodeTree = { [id in NodeId]: Node }

export type OverrideId = string;

export interface Override {
  id: NodeId
  direction: string
  target: NodeId
}

export type OverrideTree = { [id in OverrideId]: Override }

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
