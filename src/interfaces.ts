export interface Node {
    id: string;
    parent?: string;
    index?: number;
    indexRange?: number[];
    selectAction?: Function;
    isFocusable?: boolean;
    isWrapping?: boolean;
    orientation?: string;
    isIndexAlign?: boolean;
    onLeave?: Function;
    onEnter?: Function;
    activeChild?: string;
    children?: any;
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