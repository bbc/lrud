(function (global, factory) {
	typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
	typeof define === 'function' && define.amd ? define(factory) :
	(global.Lrud = factory());
}(this, (function () { 'use strict';

function E () {
  // Keep this empty so it's easier to inherit from
  // (via https://github.com/lipsmack from https://github.com/scottcorgan/tiny-emitter/issues/3)
}

E.prototype = {
  on: function (name, callback, ctx) {
    var e = this.e || (this.e = {});

    (e[name] || (e[name] = [])).push({
      fn: callback,
      ctx: ctx
    });

    return this;
  },

  once: function (name, callback, ctx) {
    var self = this;
    function listener () {
      self.off(name, listener);
      callback.apply(ctx, arguments);
    }

    listener._ = callback;
    return this.on(name, listener, ctx);
  },

  emit: function (name) {
    var data = [].slice.call(arguments, 1);
    var evtArr = ((this.e || (this.e = {}))[name] || []).slice();
    var i = 0;
    var len = evtArr.length;

    for (i; i < len; i++) {
      evtArr[i].fn.apply(evtArr[i].ctx, data);
    }

    return this;
  },

  off: function (name, callback) {
    var e = this.e || (this.e = {});
    var evts = e[name];
    var liveEvents = [];

    if (evts && callback) {
      for (var i = 0, len = evts.length; i < len; i++) {
        if (evts[i].fn !== callback && evts[i].fn._ !== callback)
          liveEvents.push(evts[i]);
      }
    }

    // Remove event from queue to prevent memory leak
    // Suggested by https://github.com/lazd
    // Ref: https://github.com/scottcorgan/tiny-emitter/commit/c6ebfaa9bc973b33d110a84a307742b7cf94c953#commitcomment-5024910

    (liveEvents.length)
      ? e[name] = liveEvents
      : delete e[name];

    return this;
  }
};

var tinyEmitter = E;

/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

var objectAssign = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

function Lrud () {
  this.nodes = {};
  this.currentFocus = null;
}

function createNode (ctx, id, props) {
  return objectAssign({ id: id, children: [] }, ctx.nodes[id] || {}, props || {})
}

function isValidLRUDEvent (event, node) {
  var keyCode = event.keyCode;

  return (
    (
      node.orientation === 'horizontal' &&
      (
        Lrud.KEY_CODES[keyCode] === Lrud.KEY_MAP.LEFT ||
        Lrud.KEY_CODES[keyCode] === Lrud.KEY_MAP.RIGHT
      )
    ) ||
    (
      node.orientation === 'vertical' &&
      (
        Lrud.KEY_CODES[keyCode] === Lrud.KEY_MAP.UP ||
        Lrud.KEY_CODES[keyCode] === Lrud.KEY_MAP.DOWN
      )
    )
  )
}

function getEventOffset (event) {
  return (
    Lrud.KEY_CODES[event.keyCode] === Lrud.KEY_MAP.RIGHT ||
    Lrud.KEY_CODES[event.keyCode] === Lrud.KEY_MAP.DOWN
  ) ? 1 : -1
}

function getNextActiveIndex (node, activeIndex, offset) {
  var nextIndex = activeIndex + offset;
  var size = node.children.length;

  if (node.wrapping && nextIndex === -1) return size - 1
  if (node.wrapping && nextIndex === size) return 0

  return nextIndex
}

Lrud.prototype = Object.create(tinyEmitter.prototype);

Lrud.prototype = objectAssign(Lrud.prototype, {
  register: function (id, props) {
    props = props || {};

    if (!id) {
      throw new Error('Attempting to register with an invalid id')
    }

    var node = createNode(this, id, props);

    if (node.parent) {
      var parentNode = createNode(this, node.parent);

      if (parentNode.children.indexOf(id) === -1) {
        parentNode.children.push(id);
      }

      this.nodes[node.parent] = parentNode;
    }

    this.nodes[id] = node;
  },

  unregister: function (id) {
    var node = this.nodes[id];
    if (!node) return

    var parentNode = this.nodes[node.parent];

    if (parentNode) {
      parentNode.children = parentNode.children.filter(function (cid) {
        return cid !== id
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
  },

  blur: function (id) {
    id = id || this.currentFocus;

    if (this.nodes[id]) {
      this.emit('blur', id);
    }
  },

  focus: function (id) {
    id = id || this.currentFocus;

    var node = this.nodes[id];
    if (!node) return

    var activeChild = node.activeChild || node.children[0];

    if (activeChild) {
      return this.focus(activeChild)
    }

    this.blur();
    this.currentFocus = id;
    this.emit('focus', id);
    this._bubbleActive(id);
  },

  handleKeyEvent: function (event) {
    this._bubbleKeyEvent(event, this.currentFocus);
  },

  destroy: function () {
    this.e = {};
    this.nodes = {};
    this.currentFocus = null;
  },

  setActiveChild: function (id, child) {
    var node = this.nodes[id];
    if (!node || node.children.indexOf(child) === -1) return

    var activeChild = node.activeChild;

    if (activeChild !== child) {
      if (activeChild) {
        this.emit('inactive', activeChild);
      }

      this.emit('active', child);
      node.activeChild = child;
    }
  },

  setActiveIndex: function (id, index) {
    var node = this.nodes[id];
    if (!node || !node.children[index]) return

    this.setActiveChild(id, node.children[index]);
  },

  _updateGrid: function (node) {
    var self = this;
    var rowId = node.activeChild || node.children[0];
    var rowNode = this.nodes[rowId];
    var activeChild = rowNode.activeChild || rowNode.children[0];

    if (!activeChild) return

    var activeIndex = rowNode.children.indexOf(activeChild);

    node.children.forEach(function (id) {
      var node = self.nodes[id];
      self.setActiveChild(id, node.children[activeIndex] || node.activeChild);
    });
  },

  _bubbleKeyEvent: function (event, id) {
    var node = this.nodes[id];
    if (!node) return

    if (Lrud.KEY_CODES[event.keyCode] === Lrud.KEY_MAP.ENTER) {
      return this.emit('select', id)
    }

    if (isValidLRUDEvent(event, node)) {
      var activeChild = node.activeChild || node.children[0];
      var activeIndex = node.children.indexOf(activeChild);
      var offset = getEventOffset(event);
      var nextIndex = getNextActiveIndex(node, activeIndex, offset);
      var nextChild = node.children[nextIndex];

      if (nextChild) {
        if (node.grid) {
          this._updateGrid(node);
        }

        this.emit('move', {
          id: id,
          offset: offset,
          orientation: node.orientation,
          enter: {
            id: nextChild,
            index: nextIndex
          },
          leave: {
            id: activeChild,
            index: activeIndex
          }
        });

        this.focus(nextChild);
        event.stopPropagation();
        return
      }
    }

    this._bubbleKeyEvent(event, node.parent);
  },

  _bubbleActive: function (id) {
    var node = this.nodes[id];

    if (node.parent) {
      this.setActiveChild(node.parent, id);
      this._bubbleActive(node.parent);
    }
  }
});

Lrud.KEY_CODES = {
  37: 'LEFT',
  39: 'RIGHT',
  38: 'UP',
  40: 'DOWN',
  13: 'ENTER'
};

Lrud.KEY_MAP = {
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  UP: 'UP',
  DOWN: 'DOWN',
  ENTER: 'ENTER'
};

var lrud = Lrud;

return lrud;

})));
