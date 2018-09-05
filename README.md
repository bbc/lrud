# Lrud

A spatial navigation library for devices with input via directional controls

## Installation

```bash
npm install lrud
```

## Initialisation

```js
var navigation = new Lrud()
```

## Registering a node

A node can be added to the navigation tree by calling `navigation.register` with the id of the node

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

## Options

### `orientation`

`"vertical" | "horizontal"`

A node (list) of vertical orientation will handle up/down key events while a horizontal list will handle left/right key events

### `wrapping`

`boolean`

To be used in conjunction with orientation to make a list wrap at the top/bottom or left/right depending on orientation

### `grid`

`boolean`

To be used in conjunction with orientation to give a list of lists grid functionality

### `onFocus`

`function`

### `onBlur`

`function`

### `onSelect`

`function`

### `onMove`

`function`

### Parent/child relationship

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

## Unregistering a node

A node can be removed from the navigation tree by calling `navigation.unregister` with the id of the node

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

## Focus
You can give focus to a particular node by calling `navigation.focus` with the node id

```js
navigation.focus('list')
```

Calling `navigation.focus` without an id will focus the root node

```js
navigation.focus()
```

## setActiveChild

Manually set the active child of a node by its id

```js
navigation.setActiveChild(id, child)
```

## setActiveIndex

Manually set the active child of a node by its index in `parent.children`

```js
navigation.setActiveIndex(id, index)
```

## Destroy

An Lrud instance can be torn down, removing all event listeners, nodes and current focus

```js
navigation.destroy()
```

## Handling Key Events

You can pass key events into Lrud using the `navigation.handleKeyEvent` function

```js
document.onkeydown = function (event) {
  if (Lrud.KEY_CODES[event.keyCode]) {
    navigation.handleKeyEvent(event)
    event.preventDefault()
  }
}
```

## Events

Lrud emits events in response to key events. See the [TAL docs](http://bbc.github.io/tal/widgets/focus-management.html) for an explanation of 'focused' and 'active' nodes

* `navigation.on('focus', function)` - Focus was given to a node
* `navigation.on('blur', function)` - Focus was taken from a node
* `navigation.on('active', function)` - The node has become active
* `navigation.on('inactive', function)` - The node has become inactive
* `navigation.on('select', function)` - The current focused node was selected
* `navigation.on('move', function)` - Triggered when focus is changed within a list

```js
navigation.on('focus', function (node) {
  // Focus could add a class
  document.getElementById(node.id).classList.add('focused')
  // Or dispatching a redux action
  store.dispatch({ type: 'FOCUS', payload: node.id })
  // Or whatever
})

navigation.on('move', function (node) {
  // node.offset - Direction of travel (depending on orientation): -1 = LEFT/UP, 1 = RIGHT/DOWN
  // node.enter - { id, index } of the node we're navigating into
  // node.leave - { id, index } of the node we're leaving
})
```

## Inspiration

* [BBC - TV Application Layer (TAL)](http://bbc.github.io/tal/widgets/focus-management.html)
* [Netflix - Pass the Remote](https://medium.com/netflix-techblog/pass-the-remote-user-input-on-tv-devices-923f6920c9a8)
* [Mozilla - Implementing TV remote control navigation](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox_OS_for_TV/TV_remote_control_navigation)

## Alternatives

* [tal](https://github.com/bbc/tal)
* [react-tv-navigation](https://github.com/react-tv/react-tv-navigation)
* [react-key-navigation](https://github.com/dead/react-key-navigation)
* [js-spatial-navigation](https://github.com/luke-chang/js-spatial-navigation)

# License


LRUD is part of the BBC TAL libraries, and available to everyone under the terms of the Apache 2 open source licence (Apache-2.0). Take a look at the LICENSE file in the code.

Copyright (c) 2018 BBC

