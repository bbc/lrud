# Lrud
**L**eft, **R**ight, **U**p, **D**own (and select) takes its inspiration from the BBC's [TAL](http://bbc.github.io/tal/widgets/focus-management.html), an open source library for building applications for connected TV devices. TAL's focus management is baked its 'Widgets' which requires you to opt into the entire application framework. Lrud aims to provide similar functionality without tying you to a particular framework

[![Build Status](https://travis-ci.org/stuart-williams/lrud.svg?branch=master)](https://travis-ci.org/stuart-williams/lrud)

## Examples

* [React Example - Repo](https://github.com/stuart-williams/lrud-react-example)
* [React Example - Live Demo!](http://lrud-react-example.s3-website-eu-west-1.amazonaws.com/)

![React Example](https://raw.githubusercontent.com/stuart-williams/lrud/master/assets/lrud-react-example.gif)

## Installation

```html
<script src="//unpkg.com/lrud"></script>
```
or via npm

```bash
npm install lrud
```

or via yarn

```bash
yarn add lrud
```

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

Your configuration might look different, so override them!

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

### Focus
You can give focus to a particular node by calling 'focus' with the node id

```js
navigation.focus('list')
```

### Handling Key Events

You can pass key events into Lrud using the 'handleKeyEvent' function

```js
document.onkeydown = function (event) {
  if (Lrud.KEY_CODES[event.keyCode]) {
    navigation.handleKeyEvent(event)
    event.preventDefault()
  }
}
```

### Events

Lrud emits events in response to key events

* See the [TAL docs](http://bbc.github.io/tal/widgets/focus-management.html) for an explanation of 'focused' and 'active' nodes

### Events API

* `navigation.on('focus', function)` - Focus was given to a node
* `navigation.on('blur', function)` - Focus was taken from a node
* `navigation.on('active', function)` - The node has become active
* `navigation.on('inactive', function)` - The node has become inactive
* `navigation.on('select', function)` - The current focused node was selected
* `navigation.on('move', function)` - Triggered when focus is changed within a list

#### Example usage

```js
navigation.on('focus', function (id) {
  // Focus could be as simple as adding a class
  document.getElementById(id).classList.add('focused')
  // Or dispatching a redux action
  store.dispatch({ type: 'FOCUS', payload: id })
  // Or whatever
})

navigation.on('blur', function (id) {
  document.getElementById(id).classList.remove('focused')
})

navigation.on('active', function (id) {
  document.getElementById(id).classList.add('active')
})

navigation.on('inactive', function (id) {
  document.getElementById(id).classList.remove('active')
})

navigation.on('select', function (id) {
  var node = navigation.nodes[id]
  node.onSelect && node.onSelect(node)
})

navigation.on('move', function (event) {
  // event.id - id of the list
  // event.offset - Direction of travel (depending on orientation): -1 = LEFT/UP, 1 = RIGHT/DOWN
  // event.enter - { id, index } of the node we're navigating into
  // event.leave - { id, index } of the node we're leaving

  var node = navigation.nodes[event.id]
  node.onMove && node.onMove(event)
})
```

## Inspiration

* [BBC - TV Application Layer (TAL)](http://bbc.github.io/tal/widgets/focus-management.html)
* [Netflix - Pass the Remote](https://medium.com/netflix-techblog/pass-the-remote-user-input-on-tv-devices-923f6920c9a8)
* [Mozilla - Implementing TV remote control navigation](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox_OS_for_TV/TV_remote_control_navigation)

### Alternatives

* [react-key-navigation](https://github.com/dead/react-key-navigation)
* [JavaScript SpatialNavigation](https://github.com/luke-chang/js-spatial-navigation)
* [TAL](https://github.com/bbc/tal)
