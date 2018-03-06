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

var left = 'LEFT';
var right = 'RIGHT';
var up = 'UP';
var down = 'DOWN';
var enter = 'ENTER';

var keyCodes = {
  map: {
    LEFT: left,
    RIGHT: right,
    UP: up,
    DOWN: down,
    ENTER: enter
  },
  codes: {
    4: left,
    21: left,
    37: left,
    214: left,
    205: left,
    218: left,
    5: right,
    22: right,
    39: right,
    213: right,
    206: right,
    217: right,
    29460: up,
    19: up,
    38: up,
    211: up,
    203: up,
    215: up,
    29461: down,
    20: down,
    40: down,
    212: down,
    204: down,
    216: down,
    29443: enter,
    13: enter,
    67: enter,
    32: enter,
    23: enter,
    195: enter
  }
};

var either = function (arg, a, b) { return arg === a || arg === b };
var isList = function (node) { return node && !!node.orientation };

function assign (target) {
  for (var i = 1; i < arguments.length; i++) {
    var subject = Object(arguments[i]);
    for (var prop in subject) {
      if (subject.hasOwnProperty(prop)) {
        target[prop] = subject[prop];
      }
    }
  }
  return target
}

function isValidLRUDEvent (event, node) {
  return (
    node.orientation === 'horizontal' && either(
      Lrud.KEY_CODES[event.keyCode],
      Lrud.KEY_MAP.LEFT,
      Lrud.KEY_MAP.RIGHT
    )
  ) || (
    node.orientation === 'vertical' && either(
      Lrud.KEY_CODES[event.keyCode],
      Lrud.KEY_MAP.UP,
      Lrud.KEY_MAP.DOWN
    )
  )
}

function Lrud () {
  this.nodes = {};
  this.root = null;
  this.currentFocus = null;
}

Lrud.prototype = Object.create(tinyEmitter.prototype);

assign(Lrud.prototype, {
  register: function (id, props) {
    if (!id) throw new Error('Attempting to register with an invalid id')

    var node = this._createNode(id, props);

    if (node.parent) {
      var parentNode = this._createNode(node.parent);

      if (parentNode.children.indexOf(id) === -1) {
        parentNode.children.push(id);
      }

      this.nodes[node.parent] = parentNode;
    } else {
      this.root = id;
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
      this.blur();
      this.currentFocus = undefined;
    }

    delete this.nodes[id];
    node.children.forEach(this.unregister.bind(this));
  },

  blur: function (id) {
    var node = this.nodes[id] || this.nodes[this.currentFocus];
    if (node) this.emit('blur', node.id);
  },

  focus: function (id) {
    var node = this.nodes[id] || this.nodes[this.currentFocus] || this.nodes[this.root];
    if (!node) return

    var activeChild = node.activeChild || node.children[0];
    if (activeChild) {
      return this.focus(activeChild)
    }

    this.blur();
    this.currentFocus = node.id;
    this.emit('focus', this.currentFocus);
    this._bubbleActive(this.currentFocus);
  },

  handleKeyEvent: function (event) {
    this._bubbleKeyEvent(event, this.currentFocus);
  },

  destroy: function () {
    this.e = {};
    this.nodes = {};
    this.root = null;
    this.currentFocus = null;
  },

  setActiveChild: function (id, child) {
    var node = this.nodes[id];
    if (!node || node.children.indexOf(child) === -1) return

    if (node.activeChild !== child) {
      if (node.activeChild) {
        this.emit('inactive', node.activeChild);
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

  _createNode: function (id, props) {
    return assign({ id: id, children: [] }, this.nodes[id] || {}, props || {})
  },

  _findChild: function (parent, predicate) {
    if (!parent) return

    var id = parent.activeChild || parent.children[0];
    var node = this.nodes[id];

    if (node && !predicate(node)) {
      return this._findChild(node, predicate)
    }

    return node
  },

  _updateGrid: function (node) {
    var rowNode = this._findChild(node, isList);
    if (!rowNode) return

    var activeChild = rowNode.activeChild || rowNode.children[0];
    var activeIndex = rowNode.children.indexOf(activeChild);

    node.children.forEach(function (id) {
      var parent = this.nodes[id];
      var child = !isList(parent) ? this._findChild(parent, isList) : parent;
      if (!child) return

      this.setActiveIndex(child.id, Math.min(
        child.children.length - 1,
        activeIndex
      ));
    }.bind(this));
  },

  _bubbleKeyEvent: function (event, id) {
    var node = this.nodes[id];
    if (!node) return

    var key = Lrud.KEY_CODES[event.keyCode];

    if (key === Lrud.KEY_MAP.ENTER) {
      return this.emit('select', id)
    }

    if (isValidLRUDEvent(event, node)) {
      var activeChild = node.activeChild || node.children[0];
      var activeIndex = node.children.indexOf(activeChild);
      var offset = either(key, Lrud.KEY_MAP.RIGHT, Lrud.KEY_MAP.DOWN) ? 1 : -1;
      var nextIndex = activeIndex + offset;
      var listSize = node.children.length;
      var nextActiveIndex = node.wrapping ? (nextIndex + listSize) % listSize : nextIndex;
      var nextActiveChild = node.children[nextActiveIndex];

      if (nextActiveChild) {
        if (node.grid) {
          this._updateGrid(node);
        }

        this.emit('move', {
          id: id,
          offset: offset,
          orientation: node.orientation,
          enter: {
            id: nextActiveChild,
            index: nextActiveIndex
          },
          leave: {
            id: activeChild,
            index: activeIndex
          }
        });

        this.focus(nextActiveChild);
        return event.stopPropagation()
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

Lrud.KEY_MAP = keyCodes.map;
Lrud.KEY_CODES = keyCodes.codes;

var src = Lrud;

return src;

})));
