/**
 * a node is both stored in the tree, and passed to functions to register nodes
 */
export interface Node {
    id?: string;
    parent?: string;
    index?: number;
    indexRange?: number[];
    selectAction?: any;
    isFocusable?: boolean;
    isWrapping?: boolean;
    orientation?: string;
    isIndexAlign?: boolean;
    onLeave?: (leave: Node) => void;
    onEnter?: (enter: Node) => void;
    shouldCancelLeave?: (leave: Node, enter: Node) => Boolean;
    onLeaveCancelled?: (currentFocusNode: Node, focusableNode: Node) => void;
    shouldCancelEnter?: (leave: Node, enter: Node) => Boolean;
    onEnterCancelled?: (currentFocusNode: Node, focusableNode: Node) => void;
    activeChild?: string;
    children?: any;
    onSelect?: Function;
    onInactive?: Function;
    onActive?: Function;
    onActiveChildChange?: Function;
    onBlur?: Function;
    onFocus?: Function;
}

export interface Override {
    id: string;
    direction: string;
    target: string;
}

export interface KeyEvent {
    keyCode: number;
    direction: string;
}

export interface InsertTreeOptions {
    maintainIndex: boolean;
}

export interface UnregisterNodeOptions {
    forceRefocus: boolean;
}