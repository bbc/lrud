/**
 * a node is both stored in the tree, and passed to functions to register nodes
 */
export interface Node {
    id?: string;
    parent?: string;
    index?: number;
    indexRange?: number[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
    selectAction?: any;
    isFocusable?: boolean;
    isWrapping?: boolean;
    orientation?: string;
    isIndexAlign?: boolean;
    isIndexCoherent?: boolean;
    onLeave?: (leave: Node) => void;
    onEnter?: (enter: Node) => void;
    shouldCancelLeave?: (leave: Node, enter: Node) => boolean;
    onLeaveCancelled?: (currentFocusNode: Node, focusableNode: Node) => void;
    shouldCancelEnter?: (leave: Node, enter: Node) => boolean;
    onEnterCancelled?: (currentFocusNode: Node, focusableNode: Node) => void;
    activeChild?: string;
    children?: {
      [id: string]: Node;
    };
    onSelect?: Function;
    onInactive?: Function;
    onActive?: Function;
    onActiveChildChange?: Function;
    onBlur?: Function;
    onFocus?: Function;
    onMove?: Function;
}

export interface Override {
    id: string;
    direction: string;
    target: string;
}

export interface KeyEvent {
    keyCode?: number;
    direction: string;
}

export interface InsertTreeOptions {
    maintainIndex: boolean;
}

export interface UnregisterNodeOptions {
    forceRefocus: boolean;
}
