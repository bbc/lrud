/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _navigation = __webpack_require__(1);

var _navigation2 = _interopRequireDefault(_navigation);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var $id = function $id(id) {
  return document.getElementById(id);
};

var addClass = function addClass(className) {
  return function (id) {
    var el = $id(id);
    el && el.classList.add(className);
  };
};

var removeClass = function removeClass(className) {
  return function (id) {
    var el = $id(id);
    el && el.classList.remove(className);
  };
};

_navigation2.default.on('focus', addClass('focused'));
_navigation2.default.on('blur', removeClass('focused'));
_navigation2.default.on('activate', addClass('active'));
_navigation2.default.on('deactivate', removeClass('active'));
_navigation2.default.on('select', function (id) {
  return alert('Selected: ' + id);
});

document.onkeydown = function (event) {
  if (_navigation.keyCodes[event.keyCode]) {
    _navigation2.default.handleKeyEvent(event);
    event.preventDefault();
  }
};

function loadFragment(url, callback) {
  var req = new XMLHttpRequest();
  req.open('GET', url);
  req.send();
  req.onload = function () {
    return callback(JSON.parse(req.responseText));
  };
}

loadFragment('/home', function (_ref) {
  var html = _ref.html,
      nodes = _ref.nodes,
      focus = _ref.focus;

  document.getElementById('app').innerHTML = html;

  _navigation2.default.nodes = nodes;
  _navigation2.default.focus(focus);
});

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.keyCodes = undefined;

var _src = __webpack_require__(2);

var _src2 = _interopRequireDefault(_src);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

exports.default = new _src2.default();
var keyCodes = exports.keyCodes = _src2.default.KEY_CODES;

/***/ }),
/* 2 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _events = __webpack_require__(3);

var _events2 = _interopRequireDefault(_events);

var _constants = __webpack_require__(4);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function Lrud() {
  this.nodes = {};
  this.currentFocus = null;
}

function newNode(props) {
  props = props || {};

  return {
    parent: props.parent,
    children: props.children || [],
    activeChild: props.activeChild,
    orientation: props.orientation,
    wrapping: props.wrapping,
    grid: props.grid,
    carousel: props.carousel,
    data: props.data
  };
}

Lrud.prototype = Object.create(_events2.default.prototype);

Lrud.prototype.register = function (id, props) {
  props = props || {};

  if (!id) {
    throw new Error('Attempting to register with an invalid id');
  }

  var node = this.nodes[id] || newNode(props);

  if (node.parent) {
    var parentNode = this.nodes[node.parent] || newNode();

    if (parentNode.children.indexOf(id) === -1) {
      parentNode.children.push(id);
    }

    node.parent = props.parent;
    this.nodes[props.parent] = parentNode;
  }

  this.nodes[id] = node;
};

Lrud.prototype.unregister = function (id) {
  var node = this.nodes[id];
  if (!node) return;

  var parentNode = this.nodes[node.parent];

  if (parentNode) {
    parentNode.children = parentNode.children.filter(function (cid) {
      return cid !== id;
    });

    if (parentNode.activeChild === id) {
      parentNode.activeChild = undefined;
    }
  }

  if (this.currentFocus === id) {
    this.blur(id);
    this.currentFocus = undefined;
  }

  delete this.nodes[id];
  node.children.forEach(this.unregister.bind(this));
};

Lrud.prototype.blur = function (id) {
  id = id || this.currentFocus;

  var node = this.nodes[id];
  if (!node) return;

  this.emit('blur', id);
};

Lrud.prototype.focus = function (id) {
  id = id || this.currentFocus;

  var node = this.nodes[id];
  if (!node) return;

  var activeChild = node.activeChild || node.children[0];

  if (activeChild) {
    return this.focus(activeChild);
  }

  this.blur();
  this.currentFocus = id;
  this.emit('focus', id);
  this._bubbleActive(id);
};

Lrud.prototype.handleKeyEvent = function (event) {
  this._bubbleKeyEvent(event, this.currentFocus);
};

Lrud.prototype._isValidLRUDEvent = function (event, node) {
  var keyCode = event.keyCode;

  return node.orientation === 'horizontal' && (Lrud.KEY_CODES[keyCode] === Lrud.KEY_MAP.LEFT || Lrud.KEY_CODES[keyCode] === Lrud.KEY_MAP.RIGHT) || node.orientation === 'vertical' && (Lrud.KEY_CODES[keyCode] === Lrud.KEY_MAP.UP || Lrud.KEY_CODES[keyCode] === Lrud.KEY_MAP.DOWN);
};

Lrud.prototype._getNextActiveIndex = function (node, activeIndex, offset) {
  var nextIndex = activeIndex + offset;
  var size = node.children.length;

  if (node.wrapping && nextIndex === -1) return size - 1;
  if (node.wrapping && nextIndex === size) return 0;

  return nextIndex;
};

Lrud.prototype._getEventOffset = function (event) {
  return Lrud.KEY_CODES[event.keyCode] === Lrud.KEY_MAP.RIGHT || Lrud.KEY_CODES[event.keyCode] === Lrud.KEY_MAP.DOWN ? 1 : -1;
};

Lrud.prototype._updateGrid = function (node) {
  var self = this;
  var rowId = node.activeChild || node.children[0];
  var rowNode = this.nodes[rowId];
  var activeChild = rowNode.activeChild || rowNode.children[0];

  if (!activeChild) return;

  var activeIndex = rowNode.children.indexOf(activeChild);

  node.children.forEach(function (id) {
    var node = self.nodes[id];
    self._setActiveChild(id, node.children[activeIndex] || node.activeChild);
  });
};

Lrud.prototype._bubbleKeyEvent = function (event, id) {
  var node = this.nodes[id];
  if (!node) return;

  if (Lrud.KEY_CODES[event.keyCode] === Lrud.KEY_MAP.ENTER) {
    return this.emit('select', id);
  }

  if (this._isValidLRUDEvent(event, node)) {
    var activeChild = node.activeChild || node.children[0];
    var activeIndex = node.children.indexOf(activeChild);
    var offset = this._getEventOffset(event);
    var nextIndex = this._getNextActiveIndex(node, activeIndex, offset);
    var nextChild = node.children[nextIndex];

    if (nextChild) {
      if (node.grid) {
        this._updateGrid(node);
      }

      this.emit('move', {
        id: id,
        orientation: node.orientation,
        carousel: node.carousel,
        offset: offset,
        enter: { id: nextChild, index: nextIndex },
        leave: { id: activeChild, index: activeIndex }
      });

      this.focus(nextChild);

      return event.stopPropagation();
    }
  }

  this._bubbleKeyEvent(event, node.parent);
};

Lrud.prototype._setActiveChild = function (id, nextActiveChild) {
  var activeChild = this.nodes[id].activeChild;

  if (activeChild !== nextActiveChild) {
    if (activeChild) {
      this.emit('deactivate', activeChild);
    }

    this.emit('activate', nextActiveChild);
    this.nodes[id].activeChild = nextActiveChild;
  }
};

Lrud.prototype._bubbleActive = function (id) {
  var node = this.nodes[id];

  if (node.parent) {
    this._setActiveChild(node.parent, id);
    this._bubbleActive(node.parent);
  }
};

Lrud.KEY_CODES = _constants.DEFAULT_KEY_CODES;
Lrud.KEY_MAP = _constants.DEFAULT_KEY_MAP;

exports.default = Lrud;

/***/ }),
/* 3 */
/***/ (function(module, exports) {

// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      } else {
        // At least give some kind of context to the user
        var err = new Error('Uncaught, unspecified "error" event. (' + er + ')');
        err.context = er;
        throw err;
      }
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        args = Array.prototype.slice.call(arguments, 1);
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    args = Array.prototype.slice.call(arguments, 1);
    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else if (listeners) {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.prototype.listenerCount = function(type) {
  if (this._events) {
    var evlistener = this._events[type];

    if (isFunction(evlistener))
      return 1;
    else if (evlistener)
      return evlistener.length;
  }
  return 0;
};

EventEmitter.listenerCount = function(emitter, type) {
  return emitter.listenerCount(type);
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}


/***/ }),
/* 4 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});
var DEFAULT_KEY_CODES = exports.DEFAULT_KEY_CODES = {
  38: 'UP',
  40: 'DOWN',
  37: 'LEFT',
  39: 'RIGHT',
  13: 'ENTER'
};

var DEFAULT_KEY_MAP = exports.DEFAULT_KEY_MAP = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  UP: 'UP',
  DOWN: 'DOWN',
  ENTER: 'ENTER'
};

/***/ })
/******/ ]);
//# sourceMappingURL=main.js.map