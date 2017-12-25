# Lrud
**L**eft, **R**ight, **U**p, **D**own

[![Build Status](https://travis-ci.org/stuart-williams/lrud.svg?branch=master)](https://travis-ci.org/stuart-williams/lrud)

## Examples

* [React](./examples/react)
* [Server-Side React](./examples/ssr)

## Installation

## Usage

### Initialisation

```js
var navigation = new Lrud()
```

### Configuration

Lrud comes with a default map of key codes (based on [TAL's device configuration](https://github.com/bbc/tal/blob/master/config/devices)) that should work in your browser

```js
DEFAULT_KEY_CODES = {
  37: 'LEFT',
  39: 'RIGHT',
  38: 'UP',
  40: 'DOWN',
  13: 'ENTER'
}
```

The key map allows Lrud to know what's what

```js
DEFAULT_KEY_MAP = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  UP: 'UP',
  DOWN: 'DOWN',
  ENTER: 'ENTER'
}
```

Your configuration might look different, so override them...

```js
Lrud.KEY_CODES = {
  1: 'ArrowLeft',
  2: 'ArrowRight',
  3: 'ArrowUp',
  4: 'ArrowDown',
  5: 'Enter'
}

Lrud.KEY_MAP = {
  LEFT: 'ArrowLeft',
  RIGHT: 'ArrowRight',
  UP: 'ArrowUp',
  DOWN: 'ArrowDown',
  ENTER: 'Enter'
}
```

### Registering a node

A node can be added to the navigation tree by calling 'register' with the id of the node

```js
navigation.register('root')
```

```json
// navigation.nodes
{
  "root": {
    "children": []
  }
}
```

#### Parent/child relationship

Create a vertical list with two children

```js
navigation.register('list', { orientation: 'vertical' })
navigation.register('list-item-1', { parent: 'list' })
navigation.register('list-item-2', { parent: 'list' })
```

```json
// navigation.nodes
{
  "list": {
    "orientation": "vertical",
    "children": [
      "list-item-1",
      "list-item-2"
    ]
  },
  "list-item-1": {
    "parent": "list",
    "children": []
  },
  "list-item-2": {
    "parent": "list",
    "children": []
  }
}
```

### Unregistering a node

A node can be removed from the navigation tree by calling 'unregister' with the id of the node

```js
navigation.unregister('list-item-1')
```

```json
// navigation.nodes
{
  "list": {
    "children": [
      "list-item-2"
    ]
  },
  "list-item-2": {
    "parent": "list",
    "children": []
  }
}
```

Unregistering a node will also remove all of its children

```js
navigation.unregister('list')
```

```json
// navigation.nodes is empty, see!
{}
```

### Handling Key Events

You can pass key events into Lrud using the 'handleKeyEvent' function

```js
document.onkeydown = (event) => {
  if (Lrud.KEY_CODES[event.keyCode]) {
    navigation.handleKeyEvent(event)
    event.preventDefault()
  }
}
```

## Inspiration

* [BBC - TV Application Layer (TAL)](http://bbc.github.io/tal/widgets/focus-management.html)
* [Netflix - Pass the Remote](https://medium.com/netflix-techblog/pass-the-remote-user-input-on-tv-devices-923f6920c9a8)
