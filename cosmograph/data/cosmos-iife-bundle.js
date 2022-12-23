var cosmos = (function (exports) {
  'use strict';

  var xhtml$1 = "http://www.w3.org/1999/xhtml";

  var namespaces$1 = {
    svg: "http://www.w3.org/2000/svg",
    xhtml: xhtml$1,
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };

  function namespace$1(name) {
    var prefix = name += "", i = prefix.indexOf(":");
    if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
    return namespaces$1.hasOwnProperty(prefix) ? {space: namespaces$1[prefix], local: name} : name; // eslint-disable-line no-prototype-builtins
  }

  function creatorInherit$1(name) {
    return function() {
      var document = this.ownerDocument,
          uri = this.namespaceURI;
      return uri === xhtml$1 && document.documentElement.namespaceURI === xhtml$1
          ? document.createElement(name)
          : document.createElementNS(uri, name);
    };
  }

  function creatorFixed$1(fullname) {
    return function() {
      return this.ownerDocument.createElementNS(fullname.space, fullname.local);
    };
  }

  function creator$1(name) {
    var fullname = namespace$1(name);
    return (fullname.local
        ? creatorFixed$1
        : creatorInherit$1)(fullname);
  }

  function none$1() {}

  function selector$1(selector) {
    return selector == null ? none$1 : function() {
      return this.querySelector(selector);
    };
  }

  function selection_select$1(select) {
    if (typeof select !== "function") select = selector$1(select);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
        }
      }
    }

    return new Selection$2(subgroups, this._parents);
  }

  // Given something array like (or null), returns something that is strictly an
  // array. This is used to ensure that array-like objects passed to d3.selectAll
  // or selection.selectAll are converted into proper arrays when creating a
  // selection; we don’t ever want to create a selection backed by a live
  // HTMLCollection or NodeList. However, note that selection.selectAll will use a
  // static NodeList as a group, since it safely derived from querySelectorAll.
  function array$1(x) {
    return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
  }

  function empty$1() {
    return [];
  }

  function selectorAll$1(selector) {
    return selector == null ? empty$1 : function() {
      return this.querySelectorAll(selector);
    };
  }

  function arrayAll$1(select) {
    return function() {
      return array$1(select.apply(this, arguments));
    };
  }

  function selection_selectAll$1(select) {
    if (typeof select === "function") select = arrayAll$1(select);
    else select = selectorAll$1(select);

    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          subgroups.push(select.call(node, node.__data__, i, group));
          parents.push(node);
        }
      }
    }

    return new Selection$2(subgroups, parents);
  }

  function matcher$1(selector) {
    return function() {
      return this.matches(selector);
    };
  }

  function childMatcher$1(selector) {
    return function(node) {
      return node.matches(selector);
    };
  }

  var find$1 = Array.prototype.find;

  function childFind$1(match) {
    return function() {
      return find$1.call(this.children, match);
    };
  }

  function childFirst$1() {
    return this.firstElementChild;
  }

  function selection_selectChild$1(match) {
    return this.select(match == null ? childFirst$1
        : childFind$1(typeof match === "function" ? match : childMatcher$1(match)));
  }

  var filter$1 = Array.prototype.filter;

  function children$1() {
    return Array.from(this.children);
  }

  function childrenFilter$1(match) {
    return function() {
      return filter$1.call(this.children, match);
    };
  }

  function selection_selectChildren$1(match) {
    return this.selectAll(match == null ? children$1
        : childrenFilter$1(typeof match === "function" ? match : childMatcher$1(match)));
  }

  function selection_filter$1(match) {
    if (typeof match !== "function") match = matcher$1(match);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }

    return new Selection$2(subgroups, this._parents);
  }

  function sparse$1(update) {
    return new Array(update.length);
  }

  function selection_enter$1() {
    return new Selection$2(this._enter || this._groups.map(sparse$1), this._parents);
  }

  function EnterNode$1(parent, datum) {
    this.ownerDocument = parent.ownerDocument;
    this.namespaceURI = parent.namespaceURI;
    this._next = null;
    this._parent = parent;
    this.__data__ = datum;
  }

  EnterNode$1.prototype = {
    constructor: EnterNode$1,
    appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
    insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
    querySelector: function(selector) { return this._parent.querySelector(selector); },
    querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
  };

  function constant$3(x) {
    return function() {
      return x;
    };
  }

  function bindIndex$1(parent, group, enter, update, exit, data) {
    var i = 0,
        node,
        groupLength = group.length,
        dataLength = data.length;

    // Put any non-null nodes that fit into update.
    // Put any null nodes into enter.
    // Put any remaining data into enter.
    for (; i < dataLength; ++i) {
      if (node = group[i]) {
        node.__data__ = data[i];
        update[i] = node;
      } else {
        enter[i] = new EnterNode$1(parent, data[i]);
      }
    }

    // Put any non-null nodes that don’t fit into exit.
    for (; i < groupLength; ++i) {
      if (node = group[i]) {
        exit[i] = node;
      }
    }
  }

  function bindKey$1(parent, group, enter, update, exit, data, key) {
    var i,
        node,
        nodeByKeyValue = new Map,
        groupLength = group.length,
        dataLength = data.length,
        keyValues = new Array(groupLength),
        keyValue;

    // Compute the key for each node.
    // If multiple nodes have the same key, the duplicates are added to exit.
    for (i = 0; i < groupLength; ++i) {
      if (node = group[i]) {
        keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
        if (nodeByKeyValue.has(keyValue)) {
          exit[i] = node;
        } else {
          nodeByKeyValue.set(keyValue, node);
        }
      }
    }

    // Compute the key for each datum.
    // If there a node associated with this key, join and add it to update.
    // If there is not (or the key is a duplicate), add it to enter.
    for (i = 0; i < dataLength; ++i) {
      keyValue = key.call(parent, data[i], i, data) + "";
      if (node = nodeByKeyValue.get(keyValue)) {
        update[i] = node;
        node.__data__ = data[i];
        nodeByKeyValue.delete(keyValue);
      } else {
        enter[i] = new EnterNode$1(parent, data[i]);
      }
    }

    // Add any remaining nodes that were not bound to data to exit.
    for (i = 0; i < groupLength; ++i) {
      if ((node = group[i]) && (nodeByKeyValue.get(keyValues[i]) === node)) {
        exit[i] = node;
      }
    }
  }

  function datum$1(node) {
    return node.__data__;
  }

  function selection_data$1(value, key) {
    if (!arguments.length) return Array.from(this, datum$1);

    var bind = key ? bindKey$1 : bindIndex$1,
        parents = this._parents,
        groups = this._groups;

    if (typeof value !== "function") value = constant$3(value);

    for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
      var parent = parents[j],
          group = groups[j],
          groupLength = group.length,
          data = arraylike(value.call(parent, parent && parent.__data__, j, parents)),
          dataLength = data.length,
          enterGroup = enter[j] = new Array(dataLength),
          updateGroup = update[j] = new Array(dataLength),
          exitGroup = exit[j] = new Array(groupLength);

      bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

      // Now connect the enter nodes to their following update node, such that
      // appendChild can insert the materialized enter node before this node,
      // rather than at the end of the parent node.
      for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
        if (previous = enterGroup[i0]) {
          if (i0 >= i1) i1 = i0 + 1;
          while (!(next = updateGroup[i1]) && ++i1 < dataLength);
          previous._next = next || null;
        }
      }
    }

    update = new Selection$2(update, parents);
    update._enter = enter;
    update._exit = exit;
    return update;
  }

  // Given some data, this returns an array-like view of it: an object that
  // exposes a length property and allows numeric indexing. Note that unlike
  // selectAll, this isn’t worried about “live” collections because the resulting
  // array will only be used briefly while data is being bound. (It is possible to
  // cause the data to change while iterating by using a key function, but please
  // don’t; we’d rather avoid a gratuitous copy.)
  function arraylike(data) {
    return typeof data === "object" && "length" in data
      ? data // Array, TypedArray, NodeList, array-like
      : Array.from(data); // Map, Set, iterable, string, or anything else
  }

  function selection_exit$1() {
    return new Selection$2(this._exit || this._groups.map(sparse$1), this._parents);
  }

  function selection_join$1(onenter, onupdate, onexit) {
    var enter = this.enter(), update = this, exit = this.exit();
    if (typeof onenter === "function") {
      enter = onenter(enter);
      if (enter) enter = enter.selection();
    } else {
      enter = enter.append(onenter + "");
    }
    if (onupdate != null) {
      update = onupdate(update);
      if (update) update = update.selection();
    }
    if (onexit == null) exit.remove(); else onexit(exit);
    return enter && update ? enter.merge(update).order() : update;
  }

  function selection_merge$1(context) {
    var selection = context.selection ? context.selection() : context;

    for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }

    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }

    return new Selection$2(merges, this._parents);
  }

  function selection_order$1() {

    for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
      for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
        if (node = group[i]) {
          if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }

    return this;
  }

  function selection_sort$1(compare) {
    if (!compare) compare = ascending$2;

    function compareNode(a, b) {
      return a && b ? compare(a.__data__, b.__data__) : !a - !b;
    }

    for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          sortgroup[i] = node;
        }
      }
      sortgroup.sort(compareNode);
    }

    return new Selection$2(sortgroups, this._parents).order();
  }

  function ascending$2(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function selection_call$1() {
    var callback = arguments[0];
    arguments[0] = this;
    callback.apply(null, arguments);
    return this;
  }

  function selection_nodes$1() {
    return Array.from(this);
  }

  function selection_node$1() {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
        var node = group[i];
        if (node) return node;
      }
    }

    return null;
  }

  function selection_size$1() {
    let size = 0;
    for (const node of this) ++size; // eslint-disable-line no-unused-vars
    return size;
  }

  function selection_empty$1() {
    return !this.node();
  }

  function selection_each$1(callback) {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if (node = group[i]) callback.call(node, node.__data__, i, group);
      }
    }

    return this;
  }

  function attrRemove$2(name) {
    return function() {
      this.removeAttribute(name);
    };
  }

  function attrRemoveNS$2(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }

  function attrConstant$2(name, value) {
    return function() {
      this.setAttribute(name, value);
    };
  }

  function attrConstantNS$2(fullname, value) {
    return function() {
      this.setAttributeNS(fullname.space, fullname.local, value);
    };
  }

  function attrFunction$2(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttribute(name);
      else this.setAttribute(name, v);
    };
  }

  function attrFunctionNS$2(fullname, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
      else this.setAttributeNS(fullname.space, fullname.local, v);
    };
  }

  function selection_attr$1(name, value) {
    var fullname = namespace$1(name);

    if (arguments.length < 2) {
      var node = this.node();
      return fullname.local
          ? node.getAttributeNS(fullname.space, fullname.local)
          : node.getAttribute(fullname);
    }

    return this.each((value == null
        ? (fullname.local ? attrRemoveNS$2 : attrRemove$2) : (typeof value === "function"
        ? (fullname.local ? attrFunctionNS$2 : attrFunction$2)
        : (fullname.local ? attrConstantNS$2 : attrConstant$2)))(fullname, value));
  }

  function defaultView$1(node) {
    return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
        || (node.document && node) // node is a Window
        || node.defaultView; // node is a Document
  }

  function styleRemove$2(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }

  function styleConstant$2(name, value, priority) {
    return function() {
      this.style.setProperty(name, value, priority);
    };
  }

  function styleFunction$2(name, value, priority) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.style.removeProperty(name);
      else this.style.setProperty(name, v, priority);
    };
  }

  function selection_style$1(name, value, priority) {
    return arguments.length > 1
        ? this.each((value == null
              ? styleRemove$2 : typeof value === "function"
              ? styleFunction$2
              : styleConstant$2)(name, value, priority == null ? "" : priority))
        : styleValue$1(this.node(), name);
  }

  function styleValue$1(node, name) {
    return node.style.getPropertyValue(name)
        || defaultView$1(node).getComputedStyle(node, null).getPropertyValue(name);
  }

  function propertyRemove$1(name) {
    return function() {
      delete this[name];
    };
  }

  function propertyConstant$1(name, value) {
    return function() {
      this[name] = value;
    };
  }

  function propertyFunction$1(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) delete this[name];
      else this[name] = v;
    };
  }

  function selection_property$1(name, value) {
    return arguments.length > 1
        ? this.each((value == null
            ? propertyRemove$1 : typeof value === "function"
            ? propertyFunction$1
            : propertyConstant$1)(name, value))
        : this.node()[name];
  }

  function classArray$1(string) {
    return string.trim().split(/^|\s+/);
  }

  function classList$1(node) {
    return node.classList || new ClassList$1(node);
  }

  function ClassList$1(node) {
    this._node = node;
    this._names = classArray$1(node.getAttribute("class") || "");
  }

  ClassList$1.prototype = {
    add: function(name) {
      var i = this._names.indexOf(name);
      if (i < 0) {
        this._names.push(name);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    remove: function(name) {
      var i = this._names.indexOf(name);
      if (i >= 0) {
        this._names.splice(i, 1);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    contains: function(name) {
      return this._names.indexOf(name) >= 0;
    }
  };

  function classedAdd$1(node, names) {
    var list = classList$1(node), i = -1, n = names.length;
    while (++i < n) list.add(names[i]);
  }

  function classedRemove$1(node, names) {
    var list = classList$1(node), i = -1, n = names.length;
    while (++i < n) list.remove(names[i]);
  }

  function classedTrue$1(names) {
    return function() {
      classedAdd$1(this, names);
    };
  }

  function classedFalse$1(names) {
    return function() {
      classedRemove$1(this, names);
    };
  }

  function classedFunction$1(names, value) {
    return function() {
      (value.apply(this, arguments) ? classedAdd$1 : classedRemove$1)(this, names);
    };
  }

  function selection_classed$1(name, value) {
    var names = classArray$1(name + "");

    if (arguments.length < 2) {
      var list = classList$1(this.node()), i = -1, n = names.length;
      while (++i < n) if (!list.contains(names[i])) return false;
      return true;
    }

    return this.each((typeof value === "function"
        ? classedFunction$1 : value
        ? classedTrue$1
        : classedFalse$1)(names, value));
  }

  function textRemove$1() {
    this.textContent = "";
  }

  function textConstant$2(value) {
    return function() {
      this.textContent = value;
    };
  }

  function textFunction$2(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    };
  }

  function selection_text$1(value) {
    return arguments.length
        ? this.each(value == null
            ? textRemove$1 : (typeof value === "function"
            ? textFunction$2
            : textConstant$2)(value))
        : this.node().textContent;
  }

  function htmlRemove$1() {
    this.innerHTML = "";
  }

  function htmlConstant$1(value) {
    return function() {
      this.innerHTML = value;
    };
  }

  function htmlFunction$1(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    };
  }

  function selection_html$1(value) {
    return arguments.length
        ? this.each(value == null
            ? htmlRemove$1 : (typeof value === "function"
            ? htmlFunction$1
            : htmlConstant$1)(value))
        : this.node().innerHTML;
  }

  function raise$1() {
    if (this.nextSibling) this.parentNode.appendChild(this);
  }

  function selection_raise$1() {
    return this.each(raise$1);
  }

  function lower$1() {
    if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
  }

  function selection_lower$1() {
    return this.each(lower$1);
  }

  function selection_append$1(name) {
    var create = typeof name === "function" ? name : creator$1(name);
    return this.select(function() {
      return this.appendChild(create.apply(this, arguments));
    });
  }

  function constantNull$1() {
    return null;
  }

  function selection_insert$1(name, before) {
    var create = typeof name === "function" ? name : creator$1(name),
        select = before == null ? constantNull$1 : typeof before === "function" ? before : selector$1(before);
    return this.select(function() {
      return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
    });
  }

  function remove$1() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  }

  function selection_remove$1() {
    return this.each(remove$1);
  }

  function selection_cloneShallow$1() {
    var clone = this.cloneNode(false), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }

  function selection_cloneDeep$1() {
    var clone = this.cloneNode(true), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }

  function selection_clone$1(deep) {
    return this.select(deep ? selection_cloneDeep$1 : selection_cloneShallow$1);
  }

  function selection_datum$1(value) {
    return arguments.length
        ? this.property("__data__", value)
        : this.node().__data__;
  }

  function contextListener$1(listener) {
    return function(event) {
      listener.call(this, event, this.__data__);
    };
  }

  function parseTypenames$2(typenames) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      return {type: t, name: name};
    });
  }

  function onRemove$1(typename) {
    return function() {
      var on = this.__on;
      if (!on) return;
      for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
        if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.options);
        } else {
          on[++i] = o;
        }
      }
      if (++i) on.length = i;
      else delete this.__on;
    };
  }

  function onAdd$1(typename, value, options) {
    return function() {
      var on = this.__on, o, listener = contextListener$1(value);
      if (on) for (var j = 0, m = on.length; j < m; ++j) {
        if ((o = on[j]).type === typename.type && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.options);
          this.addEventListener(o.type, o.listener = listener, o.options = options);
          o.value = value;
          return;
        }
      }
      this.addEventListener(typename.type, listener, options);
      o = {type: typename.type, name: typename.name, value: value, listener: listener, options: options};
      if (!on) this.__on = [o];
      else on.push(o);
    };
  }

  function selection_on$1(typename, value, options) {
    var typenames = parseTypenames$2(typename + ""), i, n = typenames.length, t;

    if (arguments.length < 2) {
      var on = this.node().__on;
      if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
        for (i = 0, o = on[j]; i < n; ++i) {
          if ((t = typenames[i]).type === o.type && t.name === o.name) {
            return o.value;
          }
        }
      }
      return;
    }

    on = value ? onAdd$1 : onRemove$1;
    for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
    return this;
  }

  function dispatchEvent$1(node, type, params) {
    var window = defaultView$1(node),
        event = window.CustomEvent;

    if (typeof event === "function") {
      event = new event(type, params);
    } else {
      event = window.document.createEvent("Event");
      if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
      else event.initEvent(type, false, false);
    }

    node.dispatchEvent(event);
  }

  function dispatchConstant$1(type, params) {
    return function() {
      return dispatchEvent$1(this, type, params);
    };
  }

  function dispatchFunction$1(type, params) {
    return function() {
      return dispatchEvent$1(this, type, params.apply(this, arguments));
    };
  }

  function selection_dispatch$1(type, params) {
    return this.each((typeof params === "function"
        ? dispatchFunction$1
        : dispatchConstant$1)(type, params));
  }

  function* selection_iterator$1() {
    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if (node = group[i]) yield node;
      }
    }
  }

  var root$1 = [null];

  function Selection$2(groups, parents) {
    this._groups = groups;
    this._parents = parents;
  }

  function selection() {
    return new Selection$2([[document.documentElement]], root$1);
  }

  function selection_selection$1() {
    return this;
  }

  Selection$2.prototype = selection.prototype = {
    constructor: Selection$2,
    select: selection_select$1,
    selectAll: selection_selectAll$1,
    selectChild: selection_selectChild$1,
    selectChildren: selection_selectChildren$1,
    filter: selection_filter$1,
    data: selection_data$1,
    enter: selection_enter$1,
    exit: selection_exit$1,
    join: selection_join$1,
    merge: selection_merge$1,
    selection: selection_selection$1,
    order: selection_order$1,
    sort: selection_sort$1,
    call: selection_call$1,
    nodes: selection_nodes$1,
    node: selection_node$1,
    size: selection_size$1,
    empty: selection_empty$1,
    each: selection_each$1,
    attr: selection_attr$1,
    style: selection_style$1,
    property: selection_property$1,
    classed: selection_classed$1,
    text: selection_text$1,
    html: selection_html$1,
    raise: selection_raise$1,
    lower: selection_lower$1,
    append: selection_append$1,
    insert: selection_insert$1,
    remove: selection_remove$1,
    clone: selection_clone$1,
    datum: selection_datum$1,
    on: selection_on$1,
    dispatch: selection_dispatch$1,
    [Symbol.iterator]: selection_iterator$1
  };

  function select$1(selector) {
    return typeof selector === "string"
        ? new Selection$2([[document.querySelector(selector)]], [document.documentElement])
        : new Selection$2([[selector]], root$1);
  }

  var nextId$1 = 0;

  function Local$1() {
    this._ = "@" + (++nextId$1).toString(36);
  }

  Local$1.prototype = {
    constructor: Local$1,
    get: function(node) {
      var id = this._;
      while (!(id in node)) if (!(node = node.parentNode)) return;
      return node[id];
    },
    set: function(node, value) {
      return node[this._] = value;
    },
    remove: function(node) {
      return this._ in node && delete node[this._];
    },
    toString: function() {
      return this._;
    }
  };

  function sourceEvent(event) {
    let sourceEvent;
    while (sourceEvent = event.sourceEvent) event = sourceEvent;
    return event;
  }

  function pointer(event, node) {
    event = sourceEvent(event);
    if (node === undefined) node = event.currentTarget;
    if (node) {
      var svg = node.ownerSVGElement || node;
      if (svg.createSVGPoint) {
        var point = svg.createSVGPoint();
        point.x = event.clientX, point.y = event.clientY;
        point = point.matrixTransform(node.getScreenCTM().inverse());
        return [point.x, point.y];
      }
      if (node.getBoundingClientRect) {
        var rect = node.getBoundingClientRect();
        return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
      }
    }
    return [event.pageX, event.pageY];
  }

  var noop = {value: () => {}};

  function dispatch() {
    for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
      if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
      _[t] = [];
    }
    return new Dispatch(_);
  }

  function Dispatch(_) {
    this._ = _;
  }

  function parseTypenames$1(typenames, types) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
      return {type: t, name: name};
    });
  }

  Dispatch.prototype = dispatch.prototype = {
    constructor: Dispatch,
    on: function(typename, callback) {
      var _ = this._,
          T = parseTypenames$1(typename + "", _),
          t,
          i = -1,
          n = T.length;

      // If no callback was specified, return the callback of the given type and name.
      if (arguments.length < 2) {
        while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
        return;
      }

      // If a type was specified, set the callback for the given type and name.
      // Otherwise, if a null callback was specified, remove callbacks of the given name.
      if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
      while (++i < n) {
        if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
        else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
      }

      return this;
    },
    copy: function() {
      var copy = {}, _ = this._;
      for (var t in _) copy[t] = _[t].slice();
      return new Dispatch(copy);
    },
    call: function(type, that) {
      if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    },
    apply: function(type, that, args) {
      if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
      for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
    }
  };

  function get$1(type, name) {
    for (var i = 0, n = type.length, c; i < n; ++i) {
      if ((c = type[i]).name === name) {
        return c.value;
      }
    }
  }

  function set$1(type, name, callback) {
    for (var i = 0, n = type.length; i < n; ++i) {
      if (type[i].name === name) {
        type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
        break;
      }
    }
    if (callback != null) type.push({name: name, value: callback});
    return type;
  }

  var frame = 0, // is an animation frame pending?
      timeout$1 = 0, // is a timeout pending?
      interval = 0, // are any timers active?
      pokeDelay = 1000, // how frequently we check for clock skew
      taskHead,
      taskTail,
      clockLast = 0,
      clockNow = 0,
      clockSkew = 0,
      clock = typeof performance === "object" && performance.now ? performance : Date,
      setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

  function now() {
    return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
  }

  function clearNow() {
    clockNow = 0;
  }

  function Timer() {
    this._call =
    this._time =
    this._next = null;
  }

  Timer.prototype = timer.prototype = {
    constructor: Timer,
    restart: function(callback, delay, time) {
      if (typeof callback !== "function") throw new TypeError("callback is not a function");
      time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
      if (!this._next && taskTail !== this) {
        if (taskTail) taskTail._next = this;
        else taskHead = this;
        taskTail = this;
      }
      this._call = callback;
      this._time = time;
      sleep();
    },
    stop: function() {
      if (this._call) {
        this._call = null;
        this._time = Infinity;
        sleep();
      }
    }
  };

  function timer(callback, delay, time) {
    var t = new Timer;
    t.restart(callback, delay, time);
    return t;
  }

  function timerFlush() {
    now(); // Get the current time, if not already set.
    ++frame; // Pretend we’ve set an alarm, if we haven’t already.
    var t = taskHead, e;
    while (t) {
      if ((e = clockNow - t._time) >= 0) t._call.call(null, e);
      t = t._next;
    }
    --frame;
  }

  function wake() {
    clockNow = (clockLast = clock.now()) + clockSkew;
    frame = timeout$1 = 0;
    try {
      timerFlush();
    } finally {
      frame = 0;
      nap();
      clockNow = 0;
    }
  }

  function poke() {
    var now = clock.now(), delay = now - clockLast;
    if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
  }

  function nap() {
    var t0, t1 = taskHead, t2, time = Infinity;
    while (t1) {
      if (t1._call) {
        if (time > t1._time) time = t1._time;
        t0 = t1, t1 = t1._next;
      } else {
        t2 = t1._next, t1._next = null;
        t1 = t0 ? t0._next = t2 : taskHead = t2;
      }
    }
    taskTail = t0;
    sleep(time);
  }

  function sleep(time) {
    if (frame) return; // Soonest alarm already set, or will be.
    if (timeout$1) timeout$1 = clearTimeout(timeout$1);
    var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
    if (delay > 24) {
      if (time < Infinity) timeout$1 = setTimeout(wake, time - clock.now() - clockSkew);
      if (interval) interval = clearInterval(interval);
    } else {
      if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
      frame = 1, setFrame(wake);
    }
  }

  function timeout(callback, delay, time) {
    var t = new Timer;
    delay = delay == null ? 0 : +delay;
    t.restart(elapsed => {
      t.stop();
      callback(elapsed + delay);
    }, delay, time);
    return t;
  }

  var emptyOn = dispatch("start", "end", "cancel", "interrupt");
  var emptyTween = [];

  var CREATED = 0;
  var SCHEDULED = 1;
  var STARTING = 2;
  var STARTED = 3;
  var RUNNING = 4;
  var ENDING = 5;
  var ENDED = 6;

  function schedule(node, name, id, index, group, timing) {
    var schedules = node.__transition;
    if (!schedules) node.__transition = {};
    else if (id in schedules) return;
    create$5(node, id, {
      name: name,
      index: index, // For context during callback.
      group: group, // For context during callback.
      on: emptyOn,
      tween: emptyTween,
      time: timing.time,
      delay: timing.delay,
      duration: timing.duration,
      ease: timing.ease,
      timer: null,
      state: CREATED
    });
  }

  function init(node, id) {
    var schedule = get(node, id);
    if (schedule.state > CREATED) throw new Error("too late; already scheduled");
    return schedule;
  }

  function set(node, id) {
    var schedule = get(node, id);
    if (schedule.state > STARTED) throw new Error("too late; already running");
    return schedule;
  }

  function get(node, id) {
    var schedule = node.__transition;
    if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
    return schedule;
  }

  function create$5(node, id, self) {
    var schedules = node.__transition,
        tween;

    // Initialize the self timer when the transition is created.
    // Note the actual delay is not known until the first callback!
    schedules[id] = self;
    self.timer = timer(schedule, 0, self.time);

    function schedule(elapsed) {
      self.state = SCHEDULED;
      self.timer.restart(start, self.delay, self.time);

      // If the elapsed delay is less than our first sleep, start immediately.
      if (self.delay <= elapsed) start(elapsed - self.delay);
    }

    function start(elapsed) {
      var i, j, n, o;

      // If the state is not SCHEDULED, then we previously errored on start.
      if (self.state !== SCHEDULED) return stop();

      for (i in schedules) {
        o = schedules[i];
        if (o.name !== self.name) continue;

        // While this element already has a starting transition during this frame,
        // defer starting an interrupting transition until that transition has a
        // chance to tick (and possibly end); see d3/d3-transition#54!
        if (o.state === STARTED) return timeout(start);

        // Interrupt the active transition, if any.
        if (o.state === RUNNING) {
          o.state = ENDED;
          o.timer.stop();
          o.on.call("interrupt", node, node.__data__, o.index, o.group);
          delete schedules[i];
        }

        // Cancel any pre-empted transitions.
        else if (+i < id) {
          o.state = ENDED;
          o.timer.stop();
          o.on.call("cancel", node, node.__data__, o.index, o.group);
          delete schedules[i];
        }
      }

      // Defer the first tick to end of the current frame; see d3/d3#1576.
      // Note the transition may be canceled after start and before the first tick!
      // Note this must be scheduled before the start event; see d3/d3-transition#16!
      // Assuming this is successful, subsequent callbacks go straight to tick.
      timeout(function() {
        if (self.state === STARTED) {
          self.state = RUNNING;
          self.timer.restart(tick, self.delay, self.time);
          tick(elapsed);
        }
      });

      // Dispatch the start event.
      // Note this must be done before the tween are initialized.
      self.state = STARTING;
      self.on.call("start", node, node.__data__, self.index, self.group);
      if (self.state !== STARTING) return; // interrupted
      self.state = STARTED;

      // Initialize the tween, deleting null tween.
      tween = new Array(n = self.tween.length);
      for (i = 0, j = -1; i < n; ++i) {
        if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
          tween[++j] = o;
        }
      }
      tween.length = j + 1;
    }

    function tick(elapsed) {
      var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
          i = -1,
          n = tween.length;

      while (++i < n) {
        tween[i].call(node, t);
      }

      // Dispatch the end event.
      if (self.state === ENDING) {
        self.on.call("end", node, node.__data__, self.index, self.group);
        stop();
      }
    }

    function stop() {
      self.state = ENDED;
      self.timer.stop();
      delete schedules[id];
      for (var i in schedules) return; // eslint-disable-line no-unused-vars
      delete node.__transition;
    }
  }

  function interrupt(node, name) {
    var schedules = node.__transition,
        schedule,
        active,
        empty = true,
        i;

    if (!schedules) return;

    name = name == null ? null : name + "";

    for (i in schedules) {
      if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
      active = schedule.state > STARTING && schedule.state < ENDING;
      schedule.state = ENDED;
      schedule.timer.stop();
      schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
      delete schedules[i];
    }

    if (empty) delete node.__transition;
  }

  function selection_interrupt(name) {
    return this.each(function() {
      interrupt(this, name);
    });
  }

  function define(constructor, factory, prototype) {
    constructor.prototype = factory.prototype = prototype;
    prototype.constructor = constructor;
  }

  function extend(parent, definition) {
    var prototype = Object.create(parent.prototype);
    for (var key in definition) prototype[key] = definition[key];
    return prototype;
  }

  function Color() {}

  var darker = 0.7;
  var brighter = 1 / darker;

  var reI = "\\s*([+-]?\\d+)\\s*",
      reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",
      reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
      reHex = /^#([0-9a-f]{3,8})$/,
      reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`),
      reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`),
      reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`),
      reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`),
      reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`),
      reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);

  var named = {
    aliceblue: 0xf0f8ff,
    antiquewhite: 0xfaebd7,
    aqua: 0x00ffff,
    aquamarine: 0x7fffd4,
    azure: 0xf0ffff,
    beige: 0xf5f5dc,
    bisque: 0xffe4c4,
    black: 0x000000,
    blanchedalmond: 0xffebcd,
    blue: 0x0000ff,
    blueviolet: 0x8a2be2,
    brown: 0xa52a2a,
    burlywood: 0xdeb887,
    cadetblue: 0x5f9ea0,
    chartreuse: 0x7fff00,
    chocolate: 0xd2691e,
    coral: 0xff7f50,
    cornflowerblue: 0x6495ed,
    cornsilk: 0xfff8dc,
    crimson: 0xdc143c,
    cyan: 0x00ffff,
    darkblue: 0x00008b,
    darkcyan: 0x008b8b,
    darkgoldenrod: 0xb8860b,
    darkgray: 0xa9a9a9,
    darkgreen: 0x006400,
    darkgrey: 0xa9a9a9,
    darkkhaki: 0xbdb76b,
    darkmagenta: 0x8b008b,
    darkolivegreen: 0x556b2f,
    darkorange: 0xff8c00,
    darkorchid: 0x9932cc,
    darkred: 0x8b0000,
    darksalmon: 0xe9967a,
    darkseagreen: 0x8fbc8f,
    darkslateblue: 0x483d8b,
    darkslategray: 0x2f4f4f,
    darkslategrey: 0x2f4f4f,
    darkturquoise: 0x00ced1,
    darkviolet: 0x9400d3,
    deeppink: 0xff1493,
    deepskyblue: 0x00bfff,
    dimgray: 0x696969,
    dimgrey: 0x696969,
    dodgerblue: 0x1e90ff,
    firebrick: 0xb22222,
    floralwhite: 0xfffaf0,
    forestgreen: 0x228b22,
    fuchsia: 0xff00ff,
    gainsboro: 0xdcdcdc,
    ghostwhite: 0xf8f8ff,
    gold: 0xffd700,
    goldenrod: 0xdaa520,
    gray: 0x808080,
    green: 0x008000,
    greenyellow: 0xadff2f,
    grey: 0x808080,
    honeydew: 0xf0fff0,
    hotpink: 0xff69b4,
    indianred: 0xcd5c5c,
    indigo: 0x4b0082,
    ivory: 0xfffff0,
    khaki: 0xf0e68c,
    lavender: 0xe6e6fa,
    lavenderblush: 0xfff0f5,
    lawngreen: 0x7cfc00,
    lemonchiffon: 0xfffacd,
    lightblue: 0xadd8e6,
    lightcoral: 0xf08080,
    lightcyan: 0xe0ffff,
    lightgoldenrodyellow: 0xfafad2,
    lightgray: 0xd3d3d3,
    lightgreen: 0x90ee90,
    lightgrey: 0xd3d3d3,
    lightpink: 0xffb6c1,
    lightsalmon: 0xffa07a,
    lightseagreen: 0x20b2aa,
    lightskyblue: 0x87cefa,
    lightslategray: 0x778899,
    lightslategrey: 0x778899,
    lightsteelblue: 0xb0c4de,
    lightyellow: 0xffffe0,
    lime: 0x00ff00,
    limegreen: 0x32cd32,
    linen: 0xfaf0e6,
    magenta: 0xff00ff,
    maroon: 0x800000,
    mediumaquamarine: 0x66cdaa,
    mediumblue: 0x0000cd,
    mediumorchid: 0xba55d3,
    mediumpurple: 0x9370db,
    mediumseagreen: 0x3cb371,
    mediumslateblue: 0x7b68ee,
    mediumspringgreen: 0x00fa9a,
    mediumturquoise: 0x48d1cc,
    mediumvioletred: 0xc71585,
    midnightblue: 0x191970,
    mintcream: 0xf5fffa,
    mistyrose: 0xffe4e1,
    moccasin: 0xffe4b5,
    navajowhite: 0xffdead,
    navy: 0x000080,
    oldlace: 0xfdf5e6,
    olive: 0x808000,
    olivedrab: 0x6b8e23,
    orange: 0xffa500,
    orangered: 0xff4500,
    orchid: 0xda70d6,
    palegoldenrod: 0xeee8aa,
    palegreen: 0x98fb98,
    paleturquoise: 0xafeeee,
    palevioletred: 0xdb7093,
    papayawhip: 0xffefd5,
    peachpuff: 0xffdab9,
    peru: 0xcd853f,
    pink: 0xffc0cb,
    plum: 0xdda0dd,
    powderblue: 0xb0e0e6,
    purple: 0x800080,
    rebeccapurple: 0x663399,
    red: 0xff0000,
    rosybrown: 0xbc8f8f,
    royalblue: 0x4169e1,
    saddlebrown: 0x8b4513,
    salmon: 0xfa8072,
    sandybrown: 0xf4a460,
    seagreen: 0x2e8b57,
    seashell: 0xfff5ee,
    sienna: 0xa0522d,
    silver: 0xc0c0c0,
    skyblue: 0x87ceeb,
    slateblue: 0x6a5acd,
    slategray: 0x708090,
    slategrey: 0x708090,
    snow: 0xfffafa,
    springgreen: 0x00ff7f,
    steelblue: 0x4682b4,
    tan: 0xd2b48c,
    teal: 0x008080,
    thistle: 0xd8bfd8,
    tomato: 0xff6347,
    turquoise: 0x40e0d0,
    violet: 0xee82ee,
    wheat: 0xf5deb3,
    white: 0xffffff,
    whitesmoke: 0xf5f5f5,
    yellow: 0xffff00,
    yellowgreen: 0x9acd32
  };

  define(Color, color, {
    copy(channels) {
      return Object.assign(new this.constructor, this, channels);
    },
    displayable() {
      return this.rgb().displayable();
    },
    hex: color_formatHex, // Deprecated! Use color.formatHex.
    formatHex: color_formatHex,
    formatHex8: color_formatHex8,
    formatHsl: color_formatHsl,
    formatRgb: color_formatRgb,
    toString: color_formatRgb
  });

  function color_formatHex() {
    return this.rgb().formatHex();
  }

  function color_formatHex8() {
    return this.rgb().formatHex8();
  }

  function color_formatHsl() {
    return hslConvert(this).formatHsl();
  }

  function color_formatRgb() {
    return this.rgb().formatRgb();
  }

  function color(format) {
    var m, l;
    format = (format + "").trim().toLowerCase();
    return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
        : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
        : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
        : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
        : null) // invalid hex
        : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
        : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
        : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
        : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
        : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
        : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
        : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
        : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
        : null;
  }

  function rgbn(n) {
    return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
  }

  function rgba(r, g, b, a) {
    if (a <= 0) r = g = b = NaN;
    return new Rgb(r, g, b, a);
  }

  function rgbConvert(o) {
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Rgb;
    o = o.rgb();
    return new Rgb(o.r, o.g, o.b, o.opacity);
  }

  function rgb(r, g, b, opacity) {
    return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
  }

  function Rgb(r, g, b, opacity) {
    this.r = +r;
    this.g = +g;
    this.b = +b;
    this.opacity = +opacity;
  }

  define(Rgb, rgb, extend(Color, {
    brighter(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    darker(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
    },
    rgb() {
      return this;
    },
    clamp() {
      return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
    },
    displayable() {
      return (-0.5 <= this.r && this.r < 255.5)
          && (-0.5 <= this.g && this.g < 255.5)
          && (-0.5 <= this.b && this.b < 255.5)
          && (0 <= this.opacity && this.opacity <= 1);
    },
    hex: rgb_formatHex, // Deprecated! Use color.formatHex.
    formatHex: rgb_formatHex,
    formatHex8: rgb_formatHex8,
    formatRgb: rgb_formatRgb,
    toString: rgb_formatRgb
  }));

  function rgb_formatHex() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
  }

  function rgb_formatHex8() {
    return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
  }

  function rgb_formatRgb() {
    const a = clampa(this.opacity);
    return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
  }

  function clampa(opacity) {
    return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
  }

  function clampi(value) {
    return Math.max(0, Math.min(255, Math.round(value) || 0));
  }

  function hex(value) {
    value = clampi(value);
    return (value < 16 ? "0" : "") + value.toString(16);
  }

  function hsla(h, s, l, a) {
    if (a <= 0) h = s = l = NaN;
    else if (l <= 0 || l >= 1) h = s = NaN;
    else if (s <= 0) h = NaN;
    return new Hsl(h, s, l, a);
  }

  function hslConvert(o) {
    if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Color)) o = color(o);
    if (!o) return new Hsl;
    if (o instanceof Hsl) return o;
    o = o.rgb();
    var r = o.r / 255,
        g = o.g / 255,
        b = o.b / 255,
        min = Math.min(r, g, b),
        max = Math.max(r, g, b),
        h = NaN,
        s = max - min,
        l = (max + min) / 2;
    if (s) {
      if (r === max) h = (g - b) / s + (g < b) * 6;
      else if (g === max) h = (b - r) / s + 2;
      else h = (r - g) / s + 4;
      s /= l < 0.5 ? max + min : 2 - max - min;
      h *= 60;
    } else {
      s = l > 0 && l < 1 ? 0 : h;
    }
    return new Hsl(h, s, l, o.opacity);
  }

  function hsl(h, s, l, opacity) {
    return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
  }

  function Hsl(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }

  define(Hsl, hsl, extend(Color, {
    brighter(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    darker(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Hsl(this.h, this.s, this.l * k, this.opacity);
    },
    rgb() {
      var h = this.h % 360 + (this.h < 0) * 360,
          s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
          l = this.l,
          m2 = l + (l < 0.5 ? l : 1 - l) * s,
          m1 = 2 * l - m2;
      return new Rgb(
        hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
        hsl2rgb(h, m1, m2),
        hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
        this.opacity
      );
    },
    clamp() {
      return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
    },
    displayable() {
      return (0 <= this.s && this.s <= 1 || isNaN(this.s))
          && (0 <= this.l && this.l <= 1)
          && (0 <= this.opacity && this.opacity <= 1);
    },
    formatHsl() {
      const a = clampa(this.opacity);
      return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
    }
  }));

  function clamph(value) {
    value = (value || 0) % 360;
    return value < 0 ? value + 360 : value;
  }

  function clampt(value) {
    return Math.max(0, Math.min(1, value || 0));
  }

  /* From FvD 13.37, CSS Color Module Level 3 */
  function hsl2rgb(h, m1, m2) {
    return (h < 60 ? m1 + (m2 - m1) * h / 60
        : h < 180 ? m2
        : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
        : m1) * 255;
  }

  const radians = Math.PI / 180;
  const degrees$1 = 180 / Math.PI;

  // https://observablehq.com/@mbostock/lab-and-rgb
  const K = 18,
      Xn = 0.96422,
      Yn = 1,
      Zn = 0.82521,
      t0$1 = 4 / 29,
      t1$1 = 6 / 29,
      t2 = 3 * t1$1 * t1$1,
      t3 = t1$1 * t1$1 * t1$1;

  function labConvert(o) {
    if (o instanceof Lab) return new Lab(o.l, o.a, o.b, o.opacity);
    if (o instanceof Hcl) return hcl2lab(o);
    if (!(o instanceof Rgb)) o = rgbConvert(o);
    var r = rgb2lrgb(o.r),
        g = rgb2lrgb(o.g),
        b = rgb2lrgb(o.b),
        y = xyz2lab((0.2225045 * r + 0.7168786 * g + 0.0606169 * b) / Yn), x, z;
    if (r === g && g === b) x = z = y; else {
      x = xyz2lab((0.4360747 * r + 0.3850649 * g + 0.1430804 * b) / Xn);
      z = xyz2lab((0.0139322 * r + 0.0971045 * g + 0.7141733 * b) / Zn);
    }
    return new Lab(116 * y - 16, 500 * (x - y), 200 * (y - z), o.opacity);
  }

  function lab(l, a, b, opacity) {
    return arguments.length === 1 ? labConvert(l) : new Lab(l, a, b, opacity == null ? 1 : opacity);
  }

  function Lab(l, a, b, opacity) {
    this.l = +l;
    this.a = +a;
    this.b = +b;
    this.opacity = +opacity;
  }

  define(Lab, lab, extend(Color, {
    brighter(k) {
      return new Lab(this.l + K * (k == null ? 1 : k), this.a, this.b, this.opacity);
    },
    darker(k) {
      return new Lab(this.l - K * (k == null ? 1 : k), this.a, this.b, this.opacity);
    },
    rgb() {
      var y = (this.l + 16) / 116,
          x = isNaN(this.a) ? y : y + this.a / 500,
          z = isNaN(this.b) ? y : y - this.b / 200;
      x = Xn * lab2xyz(x);
      y = Yn * lab2xyz(y);
      z = Zn * lab2xyz(z);
      return new Rgb(
        lrgb2rgb( 3.1338561 * x - 1.6168667 * y - 0.4906146 * z),
        lrgb2rgb(-0.9787684 * x + 1.9161415 * y + 0.0334540 * z),
        lrgb2rgb( 0.0719453 * x - 0.2289914 * y + 1.4052427 * z),
        this.opacity
      );
    }
  }));

  function xyz2lab(t) {
    return t > t3 ? Math.pow(t, 1 / 3) : t / t2 + t0$1;
  }

  function lab2xyz(t) {
    return t > t1$1 ? t * t * t : t2 * (t - t0$1);
  }

  function lrgb2rgb(x) {
    return 255 * (x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055);
  }

  function rgb2lrgb(x) {
    return (x /= 255) <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
  }

  function hclConvert(o) {
    if (o instanceof Hcl) return new Hcl(o.h, o.c, o.l, o.opacity);
    if (!(o instanceof Lab)) o = labConvert(o);
    if (o.a === 0 && o.b === 0) return new Hcl(NaN, 0 < o.l && o.l < 100 ? 0 : NaN, o.l, o.opacity);
    var h = Math.atan2(o.b, o.a) * degrees$1;
    return new Hcl(h < 0 ? h + 360 : h, Math.sqrt(o.a * o.a + o.b * o.b), o.l, o.opacity);
  }

  function hcl(h, c, l, opacity) {
    return arguments.length === 1 ? hclConvert(h) : new Hcl(h, c, l, opacity == null ? 1 : opacity);
  }

  function Hcl(h, c, l, opacity) {
    this.h = +h;
    this.c = +c;
    this.l = +l;
    this.opacity = +opacity;
  }

  function hcl2lab(o) {
    if (isNaN(o.h)) return new Lab(o.l, 0, 0, o.opacity);
    var h = o.h * radians;
    return new Lab(o.l, Math.cos(h) * o.c, Math.sin(h) * o.c, o.opacity);
  }

  define(Hcl, hcl, extend(Color, {
    brighter(k) {
      return new Hcl(this.h, this.c, this.l + K * (k == null ? 1 : k), this.opacity);
    },
    darker(k) {
      return new Hcl(this.h, this.c, this.l - K * (k == null ? 1 : k), this.opacity);
    },
    rgb() {
      return hcl2lab(this).rgb();
    }
  }));

  var A = -0.14861,
      B = +1.78277,
      C = -0.29227,
      D = -0.90649,
      E = +1.97294,
      ED = E * D,
      EB = E * B,
      BC_DA = B * C - D * A;

  function cubehelixConvert(o) {
    if (o instanceof Cubehelix) return new Cubehelix(o.h, o.s, o.l, o.opacity);
    if (!(o instanceof Rgb)) o = rgbConvert(o);
    var r = o.r / 255,
        g = o.g / 255,
        b = o.b / 255,
        l = (BC_DA * b + ED * r - EB * g) / (BC_DA + ED - EB),
        bl = b - l,
        k = (E * (g - l) - C * bl) / D,
        s = Math.sqrt(k * k + bl * bl) / (E * l * (1 - l)), // NaN if l=0 or l=1
        h = s ? Math.atan2(k, bl) * degrees$1 - 120 : NaN;
    return new Cubehelix(h < 0 ? h + 360 : h, s, l, o.opacity);
  }

  function cubehelix$1(h, s, l, opacity) {
    return arguments.length === 1 ? cubehelixConvert(h) : new Cubehelix(h, s, l, opacity == null ? 1 : opacity);
  }

  function Cubehelix(h, s, l, opacity) {
    this.h = +h;
    this.s = +s;
    this.l = +l;
    this.opacity = +opacity;
  }

  define(Cubehelix, cubehelix$1, extend(Color, {
    brighter(k) {
      k = k == null ? brighter : Math.pow(brighter, k);
      return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
    },
    darker(k) {
      k = k == null ? darker : Math.pow(darker, k);
      return new Cubehelix(this.h, this.s, this.l * k, this.opacity);
    },
    rgb() {
      var h = isNaN(this.h) ? 0 : (this.h + 120) * radians,
          l = +this.l,
          a = isNaN(this.s) ? 0 : this.s * l * (1 - l),
          cosh = Math.cos(h),
          sinh = Math.sin(h);
      return new Rgb(
        255 * (l + a * (A * cosh + B * sinh)),
        255 * (l + a * (C * cosh + D * sinh)),
        255 * (l + a * (E * cosh)),
        this.opacity
      );
    }
  }));

  var constant$2 = x => () => x;

  function linear$1(a, d) {
    return function(t) {
      return a + t * d;
    };
  }

  function exponential$1(a, b, y) {
    return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
      return Math.pow(a + t * b, y);
    };
  }

  function hue(a, b) {
    var d = b - a;
    return d ? linear$1(a, d > 180 || d < -180 ? d - 360 * Math.round(d / 360) : d) : constant$2(isNaN(a) ? b : a);
  }

  function gamma(y) {
    return (y = +y) === 1 ? nogamma : function(a, b) {
      return b - a ? exponential$1(a, b, y) : constant$2(isNaN(a) ? b : a);
    };
  }

  function nogamma(a, b) {
    var d = b - a;
    return d ? linear$1(a, d) : constant$2(isNaN(a) ? b : a);
  }

  var interpolateRgb = (function rgbGamma(y) {
    var color = gamma(y);

    function rgb$1(start, end) {
      var r = color((start = rgb(start)).r, (end = rgb(end)).r),
          g = color(start.g, end.g),
          b = color(start.b, end.b),
          opacity = nogamma(start.opacity, end.opacity);
      return function(t) {
        start.r = r(t);
        start.g = g(t);
        start.b = b(t);
        start.opacity = opacity(t);
        return start + "";
      };
    }

    rgb$1.gamma = rgbGamma;

    return rgb$1;
  })(1);

  function numberArray(a, b) {
    if (!b) b = [];
    var n = a ? Math.min(b.length, a.length) : 0,
        c = b.slice(),
        i;
    return function(t) {
      for (i = 0; i < n; ++i) c[i] = a[i] * (1 - t) + b[i] * t;
      return c;
    };
  }

  function isNumberArray(x) {
    return ArrayBuffer.isView(x) && !(x instanceof DataView);
  }

  function genericArray(a, b) {
    var nb = b ? b.length : 0,
        na = a ? Math.min(nb, a.length) : 0,
        x = new Array(na),
        c = new Array(nb),
        i;

    for (i = 0; i < na; ++i) x[i] = interpolate$1(a[i], b[i]);
    for (; i < nb; ++i) c[i] = b[i];

    return function(t) {
      for (i = 0; i < na; ++i) c[i] = x[i](t);
      return c;
    };
  }

  function date(a, b) {
    var d = new Date;
    return a = +a, b = +b, function(t) {
      return d.setTime(a * (1 - t) + b * t), d;
    };
  }

  function interpolateNumber(a, b) {
    return a = +a, b = +b, function(t) {
      return a * (1 - t) + b * t;
    };
  }

  function object(a, b) {
    var i = {},
        c = {},
        k;

    if (a === null || typeof a !== "object") a = {};
    if (b === null || typeof b !== "object") b = {};

    for (k in b) {
      if (k in a) {
        i[k] = interpolate$1(a[k], b[k]);
      } else {
        c[k] = b[k];
      }
    }

    return function(t) {
      for (k in i) c[k] = i[k](t);
      return c;
    };
  }

  var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
      reB = new RegExp(reA.source, "g");

  function zero$1(b) {
    return function() {
      return b;
    };
  }

  function one(b) {
    return function(t) {
      return b(t) + "";
    };
  }

  function interpolateString(a, b) {
    var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
        am, // current match in a
        bm, // current match in b
        bs, // string preceding current number in b, if any
        i = -1, // index in s
        s = [], // string constants and placeholders
        q = []; // number interpolators

    // Coerce inputs to strings.
    a = a + "", b = b + "";

    // Interpolate pairs of numbers in a & b.
    while ((am = reA.exec(a))
        && (bm = reB.exec(b))) {
      if ((bs = bm.index) > bi) { // a string precedes the next number in b
        bs = b.slice(bi, bs);
        if (s[i]) s[i] += bs; // coalesce with previous string
        else s[++i] = bs;
      }
      if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
        if (s[i]) s[i] += bm; // coalesce with previous string
        else s[++i] = bm;
      } else { // interpolate non-matching numbers
        s[++i] = null;
        q.push({i: i, x: interpolateNumber(am, bm)});
      }
      bi = reB.lastIndex;
    }

    // Add remains of b.
    if (bi < b.length) {
      bs = b.slice(bi);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }

    // Special optimization for only a single match.
    // Otherwise, interpolate each of the numbers and rejoin the string.
    return s.length < 2 ? (q[0]
        ? one(q[0].x)
        : zero$1(b))
        : (b = q.length, function(t) {
            for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
            return s.join("");
          });
  }

  function interpolate$1(a, b) {
    var t = typeof b, c;
    return b == null || t === "boolean" ? constant$2(b)
        : (t === "number" ? interpolateNumber
        : t === "string" ? ((c = color(b)) ? (b = c, interpolateRgb) : interpolateString)
        : b instanceof color ? interpolateRgb
        : b instanceof Date ? date
        : isNumberArray(b) ? numberArray
        : Array.isArray(b) ? genericArray
        : typeof b.valueOf !== "function" && typeof b.toString !== "function" || isNaN(b) ? object
        : interpolateNumber)(a, b);
  }

  function interpolateRound(a, b) {
    return a = +a, b = +b, function(t) {
      return Math.round(a * (1 - t) + b * t);
    };
  }

  var degrees = 180 / Math.PI;

  var identity$3 = {
    translateX: 0,
    translateY: 0,
    rotate: 0,
    skewX: 0,
    scaleX: 1,
    scaleY: 1
  };

  function decompose(a, b, c, d, e, f) {
    var scaleX, scaleY, skewX;
    if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
    if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
    if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
    if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
    return {
      translateX: e,
      translateY: f,
      rotate: Math.atan2(b, a) * degrees,
      skewX: Math.atan(skewX) * degrees,
      scaleX: scaleX,
      scaleY: scaleY
    };
  }

  var svgNode;

  /* eslint-disable no-undef */
  function parseCss(value) {
    const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
    return m.isIdentity ? identity$3 : decompose(m.a, m.b, m.c, m.d, m.e, m.f);
  }

  function parseSvg(value) {
    if (value == null) return identity$3;
    if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
    svgNode.setAttribute("transform", value);
    if (!(value = svgNode.transform.baseVal.consolidate())) return identity$3;
    value = value.matrix;
    return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
  }

  function interpolateTransform(parse, pxComma, pxParen, degParen) {

    function pop(s) {
      return s.length ? s.pop() + " " : "";
    }

    function translate(xa, ya, xb, yb, s, q) {
      if (xa !== xb || ya !== yb) {
        var i = s.push("translate(", null, pxComma, null, pxParen);
        q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
      } else if (xb || yb) {
        s.push("translate(" + xb + pxComma + yb + pxParen);
      }
    }

    function rotate(a, b, s, q) {
      if (a !== b) {
        if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
        q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
      } else if (b) {
        s.push(pop(s) + "rotate(" + b + degParen);
      }
    }

    function skewX(a, b, s, q) {
      if (a !== b) {
        q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
      } else if (b) {
        s.push(pop(s) + "skewX(" + b + degParen);
      }
    }

    function scale(xa, ya, xb, yb, s, q) {
      if (xa !== xb || ya !== yb) {
        var i = s.push(pop(s) + "scale(", null, ",", null, ")");
        q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
      } else if (xb !== 1 || yb !== 1) {
        s.push(pop(s) + "scale(" + xb + "," + yb + ")");
      }
    }

    return function(a, b) {
      var s = [], // string constants and placeholders
          q = []; // number interpolators
      a = parse(a), b = parse(b);
      translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
      rotate(a.rotate, b.rotate, s, q);
      skewX(a.skewX, b.skewX, s, q);
      scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
      a = b = null; // gc
      return function(t) {
        var i = -1, n = q.length, o;
        while (++i < n) s[(o = q[i]).i] = o.x(t);
        return s.join("");
      };
    };
  }

  var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
  var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

  var epsilon2 = 1e-12;

  function cosh(x) {
    return ((x = Math.exp(x)) + 1 / x) / 2;
  }

  function sinh(x) {
    return ((x = Math.exp(x)) - 1 / x) / 2;
  }

  function tanh(x) {
    return ((x = Math.exp(2 * x)) - 1) / (x + 1);
  }

  var interpolateZoom = (function zoomRho(rho, rho2, rho4) {

    // p0 = [ux0, uy0, w0]
    // p1 = [ux1, uy1, w1]
    function zoom(p0, p1) {
      var ux0 = p0[0], uy0 = p0[1], w0 = p0[2],
          ux1 = p1[0], uy1 = p1[1], w1 = p1[2],
          dx = ux1 - ux0,
          dy = uy1 - uy0,
          d2 = dx * dx + dy * dy,
          i,
          S;

      // Special case for u0 ≅ u1.
      if (d2 < epsilon2) {
        S = Math.log(w1 / w0) / rho;
        i = function(t) {
          return [
            ux0 + t * dx,
            uy0 + t * dy,
            w0 * Math.exp(rho * t * S)
          ];
        };
      }

      // General case.
      else {
        var d1 = Math.sqrt(d2),
            b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1),
            b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1),
            r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
            r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
        S = (r1 - r0) / rho;
        i = function(t) {
          var s = t * S,
              coshr0 = cosh(r0),
              u = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
          return [
            ux0 + u * dx,
            uy0 + u * dy,
            w0 * coshr0 / cosh(rho * s + r0)
          ];
        };
      }

      i.duration = S * 1000 * rho / Math.SQRT2;

      return i;
    }

    zoom.rho = function(_) {
      var _1 = Math.max(1e-3, +_), _2 = _1 * _1, _4 = _2 * _2;
      return zoomRho(_1, _2, _4);
    };

    return zoom;
  })(Math.SQRT2, 2, 4);

  function cubehelix(hue) {
    return (function cubehelixGamma(y) {
      y = +y;

      function cubehelix(start, end) {
        var h = hue((start = cubehelix$1(start)).h, (end = cubehelix$1(end)).h),
            s = nogamma(start.s, end.s),
            l = nogamma(start.l, end.l),
            opacity = nogamma(start.opacity, end.opacity);
        return function(t) {
          start.h = h(t);
          start.s = s(t);
          start.l = l(Math.pow(t, y));
          start.opacity = opacity(t);
          return start + "";
        };
      }

      cubehelix.gamma = cubehelixGamma;

      return cubehelix;
    })(1);
  }

  cubehelix(hue);
  cubehelix(nogamma);

  function tweenRemove(id, name) {
    var tween0, tween1;
    return function() {
      var schedule = set(this, id),
          tween = schedule.tween;

      // If this node shared tween with the previous node,
      // just assign the updated shared tween and we’re done!
      // Otherwise, copy-on-write.
      if (tween !== tween0) {
        tween1 = tween0 = tween;
        for (var i = 0, n = tween1.length; i < n; ++i) {
          if (tween1[i].name === name) {
            tween1 = tween1.slice();
            tween1.splice(i, 1);
            break;
          }
        }
      }

      schedule.tween = tween1;
    };
  }

  function tweenFunction(id, name, value) {
    var tween0, tween1;
    if (typeof value !== "function") throw new Error;
    return function() {
      var schedule = set(this, id),
          tween = schedule.tween;

      // If this node shared tween with the previous node,
      // just assign the updated shared tween and we’re done!
      // Otherwise, copy-on-write.
      if (tween !== tween0) {
        tween1 = (tween0 = tween).slice();
        for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
          if (tween1[i].name === name) {
            tween1[i] = t;
            break;
          }
        }
        if (i === n) tween1.push(t);
      }

      schedule.tween = tween1;
    };
  }

  function transition_tween(name, value) {
    var id = this._id;

    name += "";

    if (arguments.length < 2) {
      var tween = get(this.node(), id).tween;
      for (var i = 0, n = tween.length, t; i < n; ++i) {
        if ((t = tween[i]).name === name) {
          return t.value;
        }
      }
      return null;
    }

    return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
  }

  function tweenValue(transition, name, value) {
    var id = transition._id;

    transition.each(function() {
      var schedule = set(this, id);
      (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
    });

    return function(node) {
      return get(node, id).value[name];
    };
  }

  function interpolate(a, b) {
    var c;
    return (typeof b === "number" ? interpolateNumber
        : b instanceof color ? interpolateRgb
        : (c = color(b)) ? (b = c, interpolateRgb)
        : interpolateString)(a, b);
  }

  function attrRemove$1(name) {
    return function() {
      this.removeAttribute(name);
    };
  }

  function attrRemoveNS$1(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }

  function attrConstant$1(name, interpolate, value1) {
    var string00,
        string1 = value1 + "",
        interpolate0;
    return function() {
      var string0 = this.getAttribute(name);
      return string0 === string1 ? null
          : string0 === string00 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, value1);
    };
  }

  function attrConstantNS$1(fullname, interpolate, value1) {
    var string00,
        string1 = value1 + "",
        interpolate0;
    return function() {
      var string0 = this.getAttributeNS(fullname.space, fullname.local);
      return string0 === string1 ? null
          : string0 === string00 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, value1);
    };
  }

  function attrFunction$1(name, interpolate, value) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0, value1 = value(this), string1;
      if (value1 == null) return void this.removeAttribute(name);
      string0 = this.getAttribute(name);
      string1 = value1 + "";
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }

  function attrFunctionNS$1(fullname, interpolate, value) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0, value1 = value(this), string1;
      if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
      string0 = this.getAttributeNS(fullname.space, fullname.local);
      string1 = value1 + "";
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }

  function transition_attr(name, value) {
    var fullname = namespace$1(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
    return this.attrTween(name, typeof value === "function"
        ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)(fullname, i, tweenValue(this, "attr." + name, value))
        : value == null ? (fullname.local ? attrRemoveNS$1 : attrRemove$1)(fullname)
        : (fullname.local ? attrConstantNS$1 : attrConstant$1)(fullname, i, value));
  }

  function attrInterpolate(name, i) {
    return function(t) {
      this.setAttribute(name, i.call(this, t));
    };
  }

  function attrInterpolateNS(fullname, i) {
    return function(t) {
      this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
    };
  }

  function attrTweenNS(fullname, value) {
    var t0, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
      return t0;
    }
    tween._value = value;
    return tween;
  }

  function attrTween(name, value) {
    var t0, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
      return t0;
    }
    tween._value = value;
    return tween;
  }

  function transition_attrTween(name, value) {
    var key = "attr." + name;
    if (arguments.length < 2) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    var fullname = namespace$1(name);
    return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
  }

  function delayFunction(id, value) {
    return function() {
      init(this, id).delay = +value.apply(this, arguments);
    };
  }

  function delayConstant(id, value) {
    return value = +value, function() {
      init(this, id).delay = value;
    };
  }

  function transition_delay(value) {
    var id = this._id;

    return arguments.length
        ? this.each((typeof value === "function"
            ? delayFunction
            : delayConstant)(id, value))
        : get(this.node(), id).delay;
  }

  function durationFunction(id, value) {
    return function() {
      set(this, id).duration = +value.apply(this, arguments);
    };
  }

  function durationConstant(id, value) {
    return value = +value, function() {
      set(this, id).duration = value;
    };
  }

  function transition_duration(value) {
    var id = this._id;

    return arguments.length
        ? this.each((typeof value === "function"
            ? durationFunction
            : durationConstant)(id, value))
        : get(this.node(), id).duration;
  }

  function easeConstant(id, value) {
    if (typeof value !== "function") throw new Error;
    return function() {
      set(this, id).ease = value;
    };
  }

  function transition_ease(value) {
    var id = this._id;

    return arguments.length
        ? this.each(easeConstant(id, value))
        : get(this.node(), id).ease;
  }

  function easeVarying(id, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (typeof v !== "function") throw new Error;
      set(this, id).ease = v;
    };
  }

  function transition_easeVarying(value) {
    if (typeof value !== "function") throw new Error;
    return this.each(easeVarying(this._id, value));
  }

  function transition_filter(match) {
    if (typeof match !== "function") match = matcher$1(match);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }

    return new Transition(subgroups, this._parents, this._name, this._id);
  }

  function transition_merge(transition) {
    if (transition._id !== this._id) throw new Error;

    for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }

    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }

    return new Transition(merges, this._parents, this._name, this._id);
  }

  function start(name) {
    return (name + "").trim().split(/^|\s+/).every(function(t) {
      var i = t.indexOf(".");
      if (i >= 0) t = t.slice(0, i);
      return !t || t === "start";
    });
  }

  function onFunction(id, name, listener) {
    var on0, on1, sit = start(name) ? init : set;
    return function() {
      var schedule = sit(this, id),
          on = schedule.on;

      // If this node shared a dispatch with the previous node,
      // just assign the updated shared dispatch and we’re done!
      // Otherwise, copy-on-write.
      if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

      schedule.on = on1;
    };
  }

  function transition_on(name, listener) {
    var id = this._id;

    return arguments.length < 2
        ? get(this.node(), id).on.on(name)
        : this.each(onFunction(id, name, listener));
  }

  function removeFunction(id) {
    return function() {
      var parent = this.parentNode;
      for (var i in this.__transition) if (+i !== id) return;
      if (parent) parent.removeChild(this);
    };
  }

  function transition_remove() {
    return this.on("end.remove", removeFunction(this._id));
  }

  function transition_select(select) {
    var name = this._name,
        id = this._id;

    if (typeof select !== "function") select = selector$1(select);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
          schedule(subgroup[i], name, id, i, subgroup, get(node, id));
        }
      }
    }

    return new Transition(subgroups, this._parents, name, id);
  }

  function transition_selectAll(select) {
    var name = this._name,
        id = this._id;

    if (typeof select !== "function") select = selectorAll$1(select);

    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          for (var children = select.call(node, node.__data__, i, group), child, inherit = get(node, id), k = 0, l = children.length; k < l; ++k) {
            if (child = children[k]) {
              schedule(child, name, id, k, children, inherit);
            }
          }
          subgroups.push(children);
          parents.push(node);
        }
      }
    }

    return new Transition(subgroups, parents, name, id);
  }

  var Selection$1 = selection.prototype.constructor;

  function transition_selection() {
    return new Selection$1(this._groups, this._parents);
  }

  function styleNull(name, interpolate) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0 = styleValue$1(this, name),
          string1 = (this.style.removeProperty(name), styleValue$1(this, name));
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, string10 = string1);
    };
  }

  function styleRemove$1(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }

  function styleConstant$1(name, interpolate, value1) {
    var string00,
        string1 = value1 + "",
        interpolate0;
    return function() {
      var string0 = styleValue$1(this, name);
      return string0 === string1 ? null
          : string0 === string00 ? interpolate0
          : interpolate0 = interpolate(string00 = string0, value1);
    };
  }

  function styleFunction$1(name, interpolate, value) {
    var string00,
        string10,
        interpolate0;
    return function() {
      var string0 = styleValue$1(this, name),
          value1 = value(this),
          string1 = value1 + "";
      if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue$1(this, name));
      return string0 === string1 ? null
          : string0 === string00 && string1 === string10 ? interpolate0
          : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
    };
  }

  function styleMaybeRemove(id, name) {
    var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
    return function() {
      var schedule = set(this, id),
          on = schedule.on,
          listener = schedule.value[key] == null ? remove || (remove = styleRemove$1(name)) : undefined;

      // If this node shared a dispatch with the previous node,
      // just assign the updated shared dispatch and we’re done!
      // Otherwise, copy-on-write.
      if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

      schedule.on = on1;
    };
  }

  function transition_style(name, value, priority) {
    var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
    return value == null ? this
        .styleTween(name, styleNull(name, i))
        .on("end.style." + name, styleRemove$1(name))
      : typeof value === "function" ? this
        .styleTween(name, styleFunction$1(name, i, tweenValue(this, "style." + name, value)))
        .each(styleMaybeRemove(this._id, name))
      : this
        .styleTween(name, styleConstant$1(name, i, value), priority)
        .on("end.style." + name, null);
  }

  function styleInterpolate(name, i, priority) {
    return function(t) {
      this.style.setProperty(name, i.call(this, t), priority);
    };
  }

  function styleTween(name, value, priority) {
    var t, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
      return t;
    }
    tween._value = value;
    return tween;
  }

  function transition_styleTween(name, value, priority) {
    var key = "style." + (name += "");
    if (arguments.length < 2) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
  }

  function textConstant$1(value) {
    return function() {
      this.textContent = value;
    };
  }

  function textFunction$1(value) {
    return function() {
      var value1 = value(this);
      this.textContent = value1 == null ? "" : value1;
    };
  }

  function transition_text(value) {
    return this.tween("text", typeof value === "function"
        ? textFunction$1(tweenValue(this, "text", value))
        : textConstant$1(value == null ? "" : value + ""));
  }

  function textInterpolate(i) {
    return function(t) {
      this.textContent = i.call(this, t);
    };
  }

  function textTween(value) {
    var t0, i0;
    function tween() {
      var i = value.apply(this, arguments);
      if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
      return t0;
    }
    tween._value = value;
    return tween;
  }

  function transition_textTween(value) {
    var key = "text";
    if (arguments.length < 1) return (key = this.tween(key)) && key._value;
    if (value == null) return this.tween(key, null);
    if (typeof value !== "function") throw new Error;
    return this.tween(key, textTween(value));
  }

  function transition_transition() {
    var name = this._name,
        id0 = this._id,
        id1 = newId();

    for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          var inherit = get(node, id0);
          schedule(node, name, id1, i, group, {
            time: inherit.time + inherit.delay + inherit.duration,
            delay: 0,
            duration: inherit.duration,
            ease: inherit.ease
          });
        }
      }
    }

    return new Transition(groups, this._parents, name, id1);
  }

  function transition_end() {
    var on0, on1, that = this, id = that._id, size = that.size();
    return new Promise(function(resolve, reject) {
      var cancel = {value: reject},
          end = {value: function() { if (--size === 0) resolve(); }};

      that.each(function() {
        var schedule = set(this, id),
            on = schedule.on;

        // If this node shared a dispatch with the previous node,
        // just assign the updated shared dispatch and we’re done!
        // Otherwise, copy-on-write.
        if (on !== on0) {
          on1 = (on0 = on).copy();
          on1._.cancel.push(cancel);
          on1._.interrupt.push(cancel);
          on1._.end.push(end);
        }

        schedule.on = on1;
      });

      // The selection was empty, resolve end immediately
      if (size === 0) resolve();
    });
  }

  var id = 0;

  function Transition(groups, parents, name, id) {
    this._groups = groups;
    this._parents = parents;
    this._name = name;
    this._id = id;
  }

  function newId() {
    return ++id;
  }

  var selection_prototype = selection.prototype;

  Transition.prototype = {
    constructor: Transition,
    select: transition_select,
    selectAll: transition_selectAll,
    selectChild: selection_prototype.selectChild,
    selectChildren: selection_prototype.selectChildren,
    filter: transition_filter,
    merge: transition_merge,
    selection: transition_selection,
    transition: transition_transition,
    call: selection_prototype.call,
    nodes: selection_prototype.nodes,
    node: selection_prototype.node,
    size: selection_prototype.size,
    empty: selection_prototype.empty,
    each: selection_prototype.each,
    on: transition_on,
    attr: transition_attr,
    attrTween: transition_attrTween,
    style: transition_style,
    styleTween: transition_styleTween,
    text: transition_text,
    textTween: transition_textTween,
    remove: transition_remove,
    tween: transition_tween,
    delay: transition_delay,
    duration: transition_duration,
    ease: transition_ease,
    easeVarying: transition_easeVarying,
    end: transition_end,
    [Symbol.iterator]: selection_prototype[Symbol.iterator]
  };

  function quadIn(t) {
    return t * t;
  }

  function quadOut(t) {
    return t * (2 - t);
  }

  function quadInOut(t) {
    return ((t *= 2) <= 1 ? t * t : --t * (2 - t) + 1) / 2;
  }

  function cubicInOut(t) {
    return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
  }

  var exponent$1 = 3;

  ((function custom(e) {
    e = +e;

    function polyIn(t) {
      return Math.pow(t, e);
    }

    polyIn.exponent = custom;

    return polyIn;
  }))(exponent$1);

  ((function custom(e) {
    e = +e;

    function polyOut(t) {
      return 1 - Math.pow(1 - t, e);
    }

    polyOut.exponent = custom;

    return polyOut;
  }))(exponent$1);

  ((function custom(e) {
    e = +e;

    function polyInOut(t) {
      return ((t *= 2) <= 1 ? Math.pow(t, e) : 2 - Math.pow(2 - t, e)) / 2;
    }

    polyInOut.exponent = custom;

    return polyInOut;
  }))(exponent$1);

  // tpmt is two power minus ten times t scaled to [0,1]
  function tpmt(x) {
    return (Math.pow(2, -10 * x) - 0.0009765625) * 1.0009775171065494;
  }

  var overshoot = 1.70158;

  ((function custom(s) {
    s = +s;

    function backIn(t) {
      return (t = +t) * t * (s * (t - 1) + t);
    }

    backIn.overshoot = custom;

    return backIn;
  }))(overshoot);

  ((function custom(s) {
    s = +s;

    function backOut(t) {
      return --t * t * ((t + 1) * s + t) + 1;
    }

    backOut.overshoot = custom;

    return backOut;
  }))(overshoot);

  ((function custom(s) {
    s = +s;

    function backInOut(t) {
      return ((t *= 2) < 1 ? t * t * ((s + 1) * t - s) : (t -= 2) * t * ((s + 1) * t + s) + 2) / 2;
    }

    backInOut.overshoot = custom;

    return backInOut;
  }))(overshoot);

  var tau = 2 * Math.PI,
      amplitude = 1,
      period = 0.3;

  ((function custom(a, p) {
    var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

    function elasticIn(t) {
      return a * tpmt(-(--t)) * Math.sin((s - t) / p);
    }

    elasticIn.amplitude = function(a) { return custom(a, p * tau); };
    elasticIn.period = function(p) { return custom(a, p); };

    return elasticIn;
  }))(amplitude, period);

  ((function custom(a, p) {
    var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

    function elasticOut(t) {
      return 1 - a * tpmt(t = +t) * Math.sin((t + s) / p);
    }

    elasticOut.amplitude = function(a) { return custom(a, p * tau); };
    elasticOut.period = function(p) { return custom(a, p); };

    return elasticOut;
  }))(amplitude, period);

  ((function custom(a, p) {
    var s = Math.asin(1 / (a = Math.max(1, a))) * (p /= tau);

    function elasticInOut(t) {
      return ((t = t * 2 - 1) < 0
          ? a * tpmt(-t) * Math.sin((s - t) / p)
          : 2 - a * tpmt(t) * Math.sin((s + t) / p)) / 2;
    }

    elasticInOut.amplitude = function(a) { return custom(a, p * tau); };
    elasticInOut.period = function(p) { return custom(a, p); };

    return elasticInOut;
  }))(amplitude, period);

  var defaultTiming = {
    time: null, // Set on use.
    delay: 0,
    duration: 250,
    ease: cubicInOut
  };

  function inherit(node, id) {
    var timing;
    while (!(timing = node.__transition) || !(timing = timing[id])) {
      if (!(node = node.parentNode)) {
        throw new Error(`transition ${id} not found`);
      }
    }
    return timing;
  }

  function selection_transition(name) {
    var id,
        timing;

    if (name instanceof Transition) {
      id = name._id, name = name._name;
    } else {
      id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
    }

    for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          schedule(node, name, id, i, group, timing || inherit(node, id));
        }
      }
    }

    return new Transition(groups, this._parents, name, id);
  }

  selection.prototype.interrupt = selection_interrupt;
  selection.prototype.transition = selection_transition;

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  var regl$1 = {exports: {}};

  (function (module, exports) {
  	(function (global, factory) {
  	    module.exports = factory() ;
  	}(commonjsGlobal, (function () {
  	var isTypedArray = function (x) {
  	  return (
  	    x instanceof Uint8Array ||
  	    x instanceof Uint16Array ||
  	    x instanceof Uint32Array ||
  	    x instanceof Int8Array ||
  	    x instanceof Int16Array ||
  	    x instanceof Int32Array ||
  	    x instanceof Float32Array ||
  	    x instanceof Float64Array ||
  	    x instanceof Uint8ClampedArray
  	  )
  	};

  	var extend = function (base, opts) {
  	  var keys = Object.keys(opts);
  	  for (var i = 0; i < keys.length; ++i) {
  	    base[keys[i]] = opts[keys[i]];
  	  }
  	  return base
  	};

  	// Error checking and parameter validation.
  	//
  	// Statements for the form `check.someProcedure(...)` get removed by
  	// a browserify transform for optimized/minified bundles.
  	//
  	/* globals atob */
  	var endl = '\n';

  	// only used for extracting shader names.  if atob not present, then errors
  	// will be slightly crappier
  	function decodeB64 (str) {
  	  if (typeof atob !== 'undefined') {
  	    return atob(str)
  	  }
  	  return 'base64:' + str
  	}

  	function raise (message) {
  	  var error = new Error('(regl) ' + message);
  	  console.error(error);
  	  throw error
  	}

  	function check (pred, message) {
  	  if (!pred) {
  	    raise(message);
  	  }
  	}

  	function encolon (message) {
  	  if (message) {
  	    return ': ' + message
  	  }
  	  return ''
  	}

  	function checkParameter (param, possibilities, message) {
  	  if (!(param in possibilities)) {
  	    raise('unknown parameter (' + param + ')' + encolon(message) +
  	          '. possible values: ' + Object.keys(possibilities).join());
  	  }
  	}

  	function checkIsTypedArray (data, message) {
  	  if (!isTypedArray(data)) {
  	    raise(
  	      'invalid parameter type' + encolon(message) +
  	      '. must be a typed array');
  	  }
  	}

  	function standardTypeEh (value, type) {
  	  switch (type) {
  	    case 'number': return typeof value === 'number'
  	    case 'object': return typeof value === 'object'
  	    case 'string': return typeof value === 'string'
  	    case 'boolean': return typeof value === 'boolean'
  	    case 'function': return typeof value === 'function'
  	    case 'undefined': return typeof value === 'undefined'
  	    case 'symbol': return typeof value === 'symbol'
  	  }
  	}

  	function checkTypeOf (value, type, message) {
  	  if (!standardTypeEh(value, type)) {
  	    raise(
  	      'invalid parameter type' + encolon(message) +
  	      '. expected ' + type + ', got ' + (typeof value));
  	  }
  	}

  	function checkNonNegativeInt (value, message) {
  	  if (!((value >= 0) &&
  	        ((value | 0) === value))) {
  	    raise('invalid parameter type, (' + value + ')' + encolon(message) +
  	          '. must be a nonnegative integer');
  	  }
  	}

  	function checkOneOf (value, list, message) {
  	  if (list.indexOf(value) < 0) {
  	    raise('invalid value' + encolon(message) + '. must be one of: ' + list);
  	  }
  	}

  	var constructorKeys = [
  	  'gl',
  	  'canvas',
  	  'container',
  	  'attributes',
  	  'pixelRatio',
  	  'extensions',
  	  'optionalExtensions',
  	  'profile',
  	  'onDone'
  	];

  	function checkConstructor (obj) {
  	  Object.keys(obj).forEach(function (key) {
  	    if (constructorKeys.indexOf(key) < 0) {
  	      raise('invalid regl constructor argument "' + key + '". must be one of ' + constructorKeys);
  	    }
  	  });
  	}

  	function leftPad (str, n) {
  	  str = str + '';
  	  while (str.length < n) {
  	    str = ' ' + str;
  	  }
  	  return str
  	}

  	function ShaderFile () {
  	  this.name = 'unknown';
  	  this.lines = [];
  	  this.index = {};
  	  this.hasErrors = false;
  	}

  	function ShaderLine (number, line) {
  	  this.number = number;
  	  this.line = line;
  	  this.errors = [];
  	}

  	function ShaderError (fileNumber, lineNumber, message) {
  	  this.file = fileNumber;
  	  this.line = lineNumber;
  	  this.message = message;
  	}

  	function guessCommand () {
  	  var error = new Error();
  	  var stack = (error.stack || error).toString();
  	  var pat = /compileProcedure.*\n\s*at.*\((.*)\)/.exec(stack);
  	  if (pat) {
  	    return pat[1]
  	  }
  	  var pat2 = /compileProcedure.*\n\s*at\s+(.*)(\n|$)/.exec(stack);
  	  if (pat2) {
  	    return pat2[1]
  	  }
  	  return 'unknown'
  	}

  	function guessCallSite () {
  	  var error = new Error();
  	  var stack = (error.stack || error).toString();
  	  var pat = /at REGLCommand.*\n\s+at.*\((.*)\)/.exec(stack);
  	  if (pat) {
  	    return pat[1]
  	  }
  	  var pat2 = /at REGLCommand.*\n\s+at\s+(.*)\n/.exec(stack);
  	  if (pat2) {
  	    return pat2[1]
  	  }
  	  return 'unknown'
  	}

  	function parseSource (source, command) {
  	  var lines = source.split('\n');
  	  var lineNumber = 1;
  	  var fileNumber = 0;
  	  var files = {
  	    unknown: new ShaderFile(),
  	    0: new ShaderFile()
  	  };
  	  files.unknown.name = files[0].name = command || guessCommand();
  	  files.unknown.lines.push(new ShaderLine(0, ''));
  	  for (var i = 0; i < lines.length; ++i) {
  	    var line = lines[i];
  	    var parts = /^\s*#\s*(\w+)\s+(.+)\s*$/.exec(line);
  	    if (parts) {
  	      switch (parts[1]) {
  	        case 'line':
  	          var lineNumberInfo = /(\d+)(\s+\d+)?/.exec(parts[2]);
  	          if (lineNumberInfo) {
  	            lineNumber = lineNumberInfo[1] | 0;
  	            if (lineNumberInfo[2]) {
  	              fileNumber = lineNumberInfo[2] | 0;
  	              if (!(fileNumber in files)) {
  	                files[fileNumber] = new ShaderFile();
  	              }
  	            }
  	          }
  	          break
  	        case 'define':
  	          var nameInfo = /SHADER_NAME(_B64)?\s+(.*)$/.exec(parts[2]);
  	          if (nameInfo) {
  	            files[fileNumber].name = (nameInfo[1]
  	              ? decodeB64(nameInfo[2])
  	              : nameInfo[2]);
  	          }
  	          break
  	      }
  	    }
  	    files[fileNumber].lines.push(new ShaderLine(lineNumber++, line));
  	  }
  	  Object.keys(files).forEach(function (fileNumber) {
  	    var file = files[fileNumber];
  	    file.lines.forEach(function (line) {
  	      file.index[line.number] = line;
  	    });
  	  });
  	  return files
  	}

  	function parseErrorLog (errLog) {
  	  var result = [];
  	  errLog.split('\n').forEach(function (errMsg) {
  	    if (errMsg.length < 5) {
  	      return
  	    }
  	    var parts = /^ERROR:\s+(\d+):(\d+):\s*(.*)$/.exec(errMsg);
  	    if (parts) {
  	      result.push(new ShaderError(
  	        parts[1] | 0,
  	        parts[2] | 0,
  	        parts[3].trim()));
  	    } else if (errMsg.length > 0) {
  	      result.push(new ShaderError('unknown', 0, errMsg));
  	    }
  	  });
  	  return result
  	}

  	function annotateFiles (files, errors) {
  	  errors.forEach(function (error) {
  	    var file = files[error.file];
  	    if (file) {
  	      var line = file.index[error.line];
  	      if (line) {
  	        line.errors.push(error);
  	        file.hasErrors = true;
  	        return
  	      }
  	    }
  	    files.unknown.hasErrors = true;
  	    files.unknown.lines[0].errors.push(error);
  	  });
  	}

  	function checkShaderError (gl, shader, source, type, command) {
  	  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
  	    var errLog = gl.getShaderInfoLog(shader);
  	    var typeName = type === gl.FRAGMENT_SHADER ? 'fragment' : 'vertex';
  	    checkCommandType(source, 'string', typeName + ' shader source must be a string', command);
  	    var files = parseSource(source, command);
  	    var errors = parseErrorLog(errLog);
  	    annotateFiles(files, errors);

  	    Object.keys(files).forEach(function (fileNumber) {
  	      var file = files[fileNumber];
  	      if (!file.hasErrors) {
  	        return
  	      }

  	      var strings = [''];
  	      var styles = [''];

  	      function push (str, style) {
  	        strings.push(str);
  	        styles.push(style || '');
  	      }

  	      push('file number ' + fileNumber + ': ' + file.name + '\n', 'color:red;text-decoration:underline;font-weight:bold');

  	      file.lines.forEach(function (line) {
  	        if (line.errors.length > 0) {
  	          push(leftPad(line.number, 4) + '|  ', 'background-color:yellow; font-weight:bold');
  	          push(line.line + endl, 'color:red; background-color:yellow; font-weight:bold');

  	          // try to guess token
  	          var offset = 0;
  	          line.errors.forEach(function (error) {
  	            var message = error.message;
  	            var token = /^\s*'(.*)'\s*:\s*(.*)$/.exec(message);
  	            if (token) {
  	              var tokenPat = token[1];
  	              message = token[2];
  	              switch (tokenPat) {
  	                case 'assign':
  	                  tokenPat = '=';
  	                  break
  	              }
  	              offset = Math.max(line.line.indexOf(tokenPat, offset), 0);
  	            } else {
  	              offset = 0;
  	            }

  	            push(leftPad('| ', 6));
  	            push(leftPad('^^^', offset + 3) + endl, 'font-weight:bold');
  	            push(leftPad('| ', 6));
  	            push(message + endl, 'font-weight:bold');
  	          });
  	          push(leftPad('| ', 6) + endl);
  	        } else {
  	          push(leftPad(line.number, 4) + '|  ');
  	          push(line.line + endl, 'color:red');
  	        }
  	      });
  	      if (typeof document !== 'undefined' && !window.chrome) {
  	        styles[0] = strings.join('%c');
  	        console.log.apply(console, styles);
  	      } else {
  	        console.log(strings.join(''));
  	      }
  	    });

  	    check.raise('Error compiling ' + typeName + ' shader, ' + files[0].name);
  	  }
  	}

  	function checkLinkError (gl, program, fragShader, vertShader, command) {
  	  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
  	    var errLog = gl.getProgramInfoLog(program);
  	    var fragParse = parseSource(fragShader, command);
  	    var vertParse = parseSource(vertShader, command);

  	    var header = 'Error linking program with vertex shader, "' +
  	      vertParse[0].name + '", and fragment shader "' + fragParse[0].name + '"';

  	    if (typeof document !== 'undefined') {
  	      console.log('%c' + header + endl + '%c' + errLog,
  	        'color:red;text-decoration:underline;font-weight:bold',
  	        'color:red');
  	    } else {
  	      console.log(header + endl + errLog);
  	    }
  	    check.raise(header);
  	  }
  	}

  	function saveCommandRef (object) {
  	  object._commandRef = guessCommand();
  	}

  	function saveDrawCommandInfo (opts, uniforms, attributes, stringStore) {
  	  saveCommandRef(opts);

  	  function id (str) {
  	    if (str) {
  	      return stringStore.id(str)
  	    }
  	    return 0
  	  }
  	  opts._fragId = id(opts.static.frag);
  	  opts._vertId = id(opts.static.vert);

  	  function addProps (dict, set) {
  	    Object.keys(set).forEach(function (u) {
  	      dict[stringStore.id(u)] = true;
  	    });
  	  }

  	  var uniformSet = opts._uniformSet = {};
  	  addProps(uniformSet, uniforms.static);
  	  addProps(uniformSet, uniforms.dynamic);

  	  var attributeSet = opts._attributeSet = {};
  	  addProps(attributeSet, attributes.static);
  	  addProps(attributeSet, attributes.dynamic);

  	  opts._hasCount = (
  	    'count' in opts.static ||
  	    'count' in opts.dynamic ||
  	    'elements' in opts.static ||
  	    'elements' in opts.dynamic);
  	}

  	function commandRaise (message, command) {
  	  var callSite = guessCallSite();
  	  raise(message +
  	    ' in command ' + (command || guessCommand()) +
  	    (callSite === 'unknown' ? '' : ' called from ' + callSite));
  	}

  	function checkCommand (pred, message, command) {
  	  if (!pred) {
  	    commandRaise(message, command || guessCommand());
  	  }
  	}

  	function checkParameterCommand (param, possibilities, message, command) {
  	  if (!(param in possibilities)) {
  	    commandRaise(
  	      'unknown parameter (' + param + ')' + encolon(message) +
  	      '. possible values: ' + Object.keys(possibilities).join(),
  	      command || guessCommand());
  	  }
  	}

  	function checkCommandType (value, type, message, command) {
  	  if (!standardTypeEh(value, type)) {
  	    commandRaise(
  	      'invalid parameter type' + encolon(message) +
  	      '. expected ' + type + ', got ' + (typeof value),
  	      command || guessCommand());
  	  }
  	}

  	function checkOptional (block) {
  	  block();
  	}

  	function checkFramebufferFormat (attachment, texFormats, rbFormats) {
  	  if (attachment.texture) {
  	    checkOneOf(
  	      attachment.texture._texture.internalformat,
  	      texFormats,
  	      'unsupported texture format for attachment');
  	  } else {
  	    checkOneOf(
  	      attachment.renderbuffer._renderbuffer.format,
  	      rbFormats,
  	      'unsupported renderbuffer format for attachment');
  	  }
  	}

  	var GL_CLAMP_TO_EDGE = 0x812F;

  	var GL_NEAREST = 0x2600;
  	var GL_NEAREST_MIPMAP_NEAREST = 0x2700;
  	var GL_LINEAR_MIPMAP_NEAREST = 0x2701;
  	var GL_NEAREST_MIPMAP_LINEAR = 0x2702;
  	var GL_LINEAR_MIPMAP_LINEAR = 0x2703;

  	var GL_BYTE = 5120;
  	var GL_UNSIGNED_BYTE = 5121;
  	var GL_SHORT = 5122;
  	var GL_UNSIGNED_SHORT = 5123;
  	var GL_INT = 5124;
  	var GL_UNSIGNED_INT = 5125;
  	var GL_FLOAT = 5126;

  	var GL_UNSIGNED_SHORT_4_4_4_4 = 0x8033;
  	var GL_UNSIGNED_SHORT_5_5_5_1 = 0x8034;
  	var GL_UNSIGNED_SHORT_5_6_5 = 0x8363;
  	var GL_UNSIGNED_INT_24_8_WEBGL = 0x84FA;

  	var GL_HALF_FLOAT_OES = 0x8D61;

  	var TYPE_SIZE = {};

  	TYPE_SIZE[GL_BYTE] =
  	TYPE_SIZE[GL_UNSIGNED_BYTE] = 1;

  	TYPE_SIZE[GL_SHORT] =
  	TYPE_SIZE[GL_UNSIGNED_SHORT] =
  	TYPE_SIZE[GL_HALF_FLOAT_OES] =
  	TYPE_SIZE[GL_UNSIGNED_SHORT_5_6_5] =
  	TYPE_SIZE[GL_UNSIGNED_SHORT_4_4_4_4] =
  	TYPE_SIZE[GL_UNSIGNED_SHORT_5_5_5_1] = 2;

  	TYPE_SIZE[GL_INT] =
  	TYPE_SIZE[GL_UNSIGNED_INT] =
  	TYPE_SIZE[GL_FLOAT] =
  	TYPE_SIZE[GL_UNSIGNED_INT_24_8_WEBGL] = 4;

  	function pixelSize (type, channels) {
  	  if (type === GL_UNSIGNED_SHORT_5_5_5_1 ||
  	      type === GL_UNSIGNED_SHORT_4_4_4_4 ||
  	      type === GL_UNSIGNED_SHORT_5_6_5) {
  	    return 2
  	  } else if (type === GL_UNSIGNED_INT_24_8_WEBGL) {
  	    return 4
  	  } else {
  	    return TYPE_SIZE[type] * channels
  	  }
  	}

  	function isPow2 (v) {
  	  return !(v & (v - 1)) && (!!v)
  	}

  	function checkTexture2D (info, mipData, limits) {
  	  var i;
  	  var w = mipData.width;
  	  var h = mipData.height;
  	  var c = mipData.channels;

  	  // Check texture shape
  	  check(w > 0 && w <= limits.maxTextureSize &&
  	        h > 0 && h <= limits.maxTextureSize,
  	  'invalid texture shape');

  	  // check wrap mode
  	  if (info.wrapS !== GL_CLAMP_TO_EDGE || info.wrapT !== GL_CLAMP_TO_EDGE) {
  	    check(isPow2(w) && isPow2(h),
  	      'incompatible wrap mode for texture, both width and height must be power of 2');
  	  }

  	  if (mipData.mipmask === 1) {
  	    if (w !== 1 && h !== 1) {
  	      check(
  	        info.minFilter !== GL_NEAREST_MIPMAP_NEAREST &&
  	        info.minFilter !== GL_NEAREST_MIPMAP_LINEAR &&
  	        info.minFilter !== GL_LINEAR_MIPMAP_NEAREST &&
  	        info.minFilter !== GL_LINEAR_MIPMAP_LINEAR,
  	        'min filter requires mipmap');
  	    }
  	  } else {
  	    // texture must be power of 2
  	    check(isPow2(w) && isPow2(h),
  	      'texture must be a square power of 2 to support mipmapping');
  	    check(mipData.mipmask === (w << 1) - 1,
  	      'missing or incomplete mipmap data');
  	  }

  	  if (mipData.type === GL_FLOAT) {
  	    if (limits.extensions.indexOf('oes_texture_float_linear') < 0) {
  	      check(info.minFilter === GL_NEAREST && info.magFilter === GL_NEAREST,
  	        'filter not supported, must enable oes_texture_float_linear');
  	    }
  	    check(!info.genMipmaps,
  	      'mipmap generation not supported with float textures');
  	  }

  	  // check image complete
  	  var mipimages = mipData.images;
  	  for (i = 0; i < 16; ++i) {
  	    if (mipimages[i]) {
  	      var mw = w >> i;
  	      var mh = h >> i;
  	      check(mipData.mipmask & (1 << i), 'missing mipmap data');

  	      var img = mipimages[i];

  	      check(
  	        img.width === mw &&
  	        img.height === mh,
  	        'invalid shape for mip images');

  	      check(
  	        img.format === mipData.format &&
  	        img.internalformat === mipData.internalformat &&
  	        img.type === mipData.type,
  	        'incompatible type for mip image');

  	      if (img.compressed) ; else if (img.data) {
  	        // check(img.data.byteLength === mw * mh *
  	        // Math.max(pixelSize(img.type, c), img.unpackAlignment),
  	        var rowSize = Math.ceil(pixelSize(img.type, c) * mw / img.unpackAlignment) * img.unpackAlignment;
  	        check(img.data.byteLength === rowSize * mh,
  	          'invalid data for image, buffer size is inconsistent with image format');
  	      } else if (img.element) ; else if (img.copy) ;
  	    } else if (!info.genMipmaps) {
  	      check((mipData.mipmask & (1 << i)) === 0, 'extra mipmap data');
  	    }
  	  }

  	  if (mipData.compressed) {
  	    check(!info.genMipmaps,
  	      'mipmap generation for compressed images not supported');
  	  }
  	}

  	function checkTextureCube (texture, info, faces, limits) {
  	  var w = texture.width;
  	  var h = texture.height;
  	  var c = texture.channels;

  	  // Check texture shape
  	  check(
  	    w > 0 && w <= limits.maxTextureSize && h > 0 && h <= limits.maxTextureSize,
  	    'invalid texture shape');
  	  check(
  	    w === h,
  	    'cube map must be square');
  	  check(
  	    info.wrapS === GL_CLAMP_TO_EDGE && info.wrapT === GL_CLAMP_TO_EDGE,
  	    'wrap mode not supported by cube map');

  	  for (var i = 0; i < faces.length; ++i) {
  	    var face = faces[i];
  	    check(
  	      face.width === w && face.height === h,
  	      'inconsistent cube map face shape');

  	    if (info.genMipmaps) {
  	      check(!face.compressed,
  	        'can not generate mipmap for compressed textures');
  	      check(face.mipmask === 1,
  	        'can not specify mipmaps and generate mipmaps');
  	    }

  	    var mipmaps = face.images;
  	    for (var j = 0; j < 16; ++j) {
  	      var img = mipmaps[j];
  	      if (img) {
  	        var mw = w >> j;
  	        var mh = h >> j;
  	        check(face.mipmask & (1 << j), 'missing mipmap data');
  	        check(
  	          img.width === mw &&
  	          img.height === mh,
  	          'invalid shape for mip images');
  	        check(
  	          img.format === texture.format &&
  	          img.internalformat === texture.internalformat &&
  	          img.type === texture.type,
  	          'incompatible type for mip image');

  	        if (img.compressed) ; else if (img.data) {
  	          check(img.data.byteLength === mw * mh *
  	            Math.max(pixelSize(img.type, c), img.unpackAlignment),
  	          'invalid data for image, buffer size is inconsistent with image format');
  	        } else if (img.element) ; else if (img.copy) ;
  	      }
  	    }
  	  }
  	}

  	var check$1 = extend(check, {
  	  optional: checkOptional,
  	  raise: raise,
  	  commandRaise: commandRaise,
  	  command: checkCommand,
  	  parameter: checkParameter,
  	  commandParameter: checkParameterCommand,
  	  constructor: checkConstructor,
  	  type: checkTypeOf,
  	  commandType: checkCommandType,
  	  isTypedArray: checkIsTypedArray,
  	  nni: checkNonNegativeInt,
  	  oneOf: checkOneOf,
  	  shaderError: checkShaderError,
  	  linkError: checkLinkError,
  	  callSite: guessCallSite,
  	  saveCommandRef: saveCommandRef,
  	  saveDrawInfo: saveDrawCommandInfo,
  	  framebufferFormat: checkFramebufferFormat,
  	  guessCommand: guessCommand,
  	  texture2D: checkTexture2D,
  	  textureCube: checkTextureCube
  	});

  	var VARIABLE_COUNTER = 0;

  	var DYN_FUNC = 0;
  	var DYN_CONSTANT = 5;
  	var DYN_ARRAY = 6;

  	function DynamicVariable (type, data) {
  	  this.id = (VARIABLE_COUNTER++);
  	  this.type = type;
  	  this.data = data;
  	}

  	function escapeStr (str) {
  	  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"')
  	}

  	function splitParts (str) {
  	  if (str.length === 0) {
  	    return []
  	  }

  	  var firstChar = str.charAt(0);
  	  var lastChar = str.charAt(str.length - 1);

  	  if (str.length > 1 &&
  	      firstChar === lastChar &&
  	      (firstChar === '"' || firstChar === "'")) {
  	    return ['"' + escapeStr(str.substr(1, str.length - 2)) + '"']
  	  }

  	  var parts = /\[(false|true|null|\d+|'[^']*'|"[^"]*")\]/.exec(str);
  	  if (parts) {
  	    return (
  	      splitParts(str.substr(0, parts.index))
  	        .concat(splitParts(parts[1]))
  	        .concat(splitParts(str.substr(parts.index + parts[0].length)))
  	    )
  	  }

  	  var subparts = str.split('.');
  	  if (subparts.length === 1) {
  	    return ['"' + escapeStr(str) + '"']
  	  }

  	  var result = [];
  	  for (var i = 0; i < subparts.length; ++i) {
  	    result = result.concat(splitParts(subparts[i]));
  	  }
  	  return result
  	}

  	function toAccessorString (str) {
  	  return '[' + splitParts(str).join('][') + ']'
  	}

  	function defineDynamic (type, data) {
  	  return new DynamicVariable(type, toAccessorString(data + ''))
  	}

  	function isDynamic (x) {
  	  return (typeof x === 'function' && !x._reglType) || (x instanceof DynamicVariable)
  	}

  	function unbox (x, path) {
  	  if (typeof x === 'function') {
  	    return new DynamicVariable(DYN_FUNC, x)
  	  } else if (typeof x === 'number' || typeof x === 'boolean') {
  	    return new DynamicVariable(DYN_CONSTANT, x)
  	  } else if (Array.isArray(x)) {
  	    return new DynamicVariable(DYN_ARRAY, x.map(function (y, i) { return unbox(y, path + '[' + i + ']') }))
  	  } else if (x instanceof DynamicVariable) {
  	    return x
  	  }
  	  check$1(false, 'invalid option type in uniform ' + path);
  	}

  	var dynamic = {
  	  DynamicVariable: DynamicVariable,
  	  define: defineDynamic,
  	  isDynamic: isDynamic,
  	  unbox: unbox,
  	  accessor: toAccessorString
  	};

  	/* globals requestAnimationFrame, cancelAnimationFrame */
  	var raf = {
  	  next: typeof requestAnimationFrame === 'function'
  	    ? function (cb) { return requestAnimationFrame(cb) }
  	    : function (cb) { return setTimeout(cb, 16) },
  	  cancel: typeof cancelAnimationFrame === 'function'
  	    ? function (raf) { return cancelAnimationFrame(raf) }
  	    : clearTimeout
  	};

  	/* globals performance */
  	var clock = (typeof performance !== 'undefined' && performance.now)
  	    ? function () { return performance.now() }
  	    : function () { return +(new Date()) };

  	function createStringStore () {
  	  var stringIds = { '': 0 };
  	  var stringValues = [''];
  	  return {
  	    id: function (str) {
  	      var result = stringIds[str];
  	      if (result) {
  	        return result
  	      }
  	      result = stringIds[str] = stringValues.length;
  	      stringValues.push(str);
  	      return result
  	    },

  	    str: function (id) {
  	      return stringValues[id]
  	    }
  	  }
  	}

  	// Context and canvas creation helper functions
  	function createCanvas (element, onDone, pixelRatio) {
  	  var canvas = document.createElement('canvas');
  	  extend(canvas.style, {
  	    border: 0,
  	    margin: 0,
  	    padding: 0,
  	    top: 0,
  	    left: 0,
  	    width: '100%',
  	    height: '100%'
  	  });
  	  element.appendChild(canvas);

  	  if (element === document.body) {
  	    canvas.style.position = 'absolute';
  	    extend(element.style, {
  	      margin: 0,
  	      padding: 0
  	    });
  	  }

  	  function resize () {
  	    var w = window.innerWidth;
  	    var h = window.innerHeight;
  	    if (element !== document.body) {
  	      var bounds = canvas.getBoundingClientRect();
  	      w = bounds.right - bounds.left;
  	      h = bounds.bottom - bounds.top;
  	    }
  	    canvas.width = pixelRatio * w;
  	    canvas.height = pixelRatio * h;
  	  }

  	  var resizeObserver;
  	  if (element !== document.body && typeof ResizeObserver === 'function') {
  	    // ignore 'ResizeObserver' is not defined
  	    // eslint-disable-next-line
  	    resizeObserver = new ResizeObserver(function () {
  	      // setTimeout to avoid flicker
  	      setTimeout(resize);
  	    });
  	    resizeObserver.observe(element);
  	  } else {
  	    window.addEventListener('resize', resize, false);
  	  }

  	  function onDestroy () {
  	    if (resizeObserver) {
  	      resizeObserver.disconnect();
  	    } else {
  	      window.removeEventListener('resize', resize);
  	    }
  	    element.removeChild(canvas);
  	  }

  	  resize();

  	  return {
  	    canvas: canvas,
  	    onDestroy: onDestroy
  	  }
  	}

  	function createContext (canvas, contextAttributes) {
  	  function get (name) {
  	    try {
  	      return canvas.getContext(name, contextAttributes)
  	    } catch (e) {
  	      return null
  	    }
  	  }
  	  return (
  	    get('webgl') ||
  	    get('experimental-webgl') ||
  	    get('webgl-experimental')
  	  )
  	}

  	function isHTMLElement (obj) {
  	  return (
  	    typeof obj.nodeName === 'string' &&
  	    typeof obj.appendChild === 'function' &&
  	    typeof obj.getBoundingClientRect === 'function'
  	  )
  	}

  	function isWebGLContext (obj) {
  	  return (
  	    typeof obj.drawArrays === 'function' ||
  	    typeof obj.drawElements === 'function'
  	  )
  	}

  	function parseExtensions (input) {
  	  if (typeof input === 'string') {
  	    return input.split()
  	  }
  	  check$1(Array.isArray(input), 'invalid extension array');
  	  return input
  	}

  	function getElement (desc) {
  	  if (typeof desc === 'string') {
  	    check$1(typeof document !== 'undefined', 'not supported outside of DOM');
  	    return document.querySelector(desc)
  	  }
  	  return desc
  	}

  	function parseArgs (args_) {
  	  var args = args_ || {};
  	  var element, container, canvas, gl;
  	  var contextAttributes = {};
  	  var extensions = [];
  	  var optionalExtensions = [];
  	  var pixelRatio = (typeof window === 'undefined' ? 1 : window.devicePixelRatio);
  	  var profile = false;
  	  var onDone = function (err) {
  	    if (err) {
  	      check$1.raise(err);
  	    }
  	  };
  	  var onDestroy = function () {};
  	  if (typeof args === 'string') {
  	    check$1(
  	      typeof document !== 'undefined',
  	      'selector queries only supported in DOM enviroments');
  	    element = document.querySelector(args);
  	    check$1(element, 'invalid query string for element');
  	  } else if (typeof args === 'object') {
  	    if (isHTMLElement(args)) {
  	      element = args;
  	    } else if (isWebGLContext(args)) {
  	      gl = args;
  	      canvas = gl.canvas;
  	    } else {
  	      check$1.constructor(args);
  	      if ('gl' in args) {
  	        gl = args.gl;
  	      } else if ('canvas' in args) {
  	        canvas = getElement(args.canvas);
  	      } else if ('container' in args) {
  	        container = getElement(args.container);
  	      }
  	      if ('attributes' in args) {
  	        contextAttributes = args.attributes;
  	        check$1.type(contextAttributes, 'object', 'invalid context attributes');
  	      }
  	      if ('extensions' in args) {
  	        extensions = parseExtensions(args.extensions);
  	      }
  	      if ('optionalExtensions' in args) {
  	        optionalExtensions = parseExtensions(args.optionalExtensions);
  	      }
  	      if ('onDone' in args) {
  	        check$1.type(
  	          args.onDone, 'function',
  	          'invalid or missing onDone callback');
  	        onDone = args.onDone;
  	      }
  	      if ('profile' in args) {
  	        profile = !!args.profile;
  	      }
  	      if ('pixelRatio' in args) {
  	        pixelRatio = +args.pixelRatio;
  	        check$1(pixelRatio > 0, 'invalid pixel ratio');
  	      }
  	    }
  	  } else {
  	    check$1.raise('invalid arguments to regl');
  	  }

  	  if (element) {
  	    if (element.nodeName.toLowerCase() === 'canvas') {
  	      canvas = element;
  	    } else {
  	      container = element;
  	    }
  	  }

  	  if (!gl) {
  	    if (!canvas) {
  	      check$1(
  	        typeof document !== 'undefined',
  	        'must manually specify webgl context outside of DOM environments');
  	      var result = createCanvas(container || document.body, onDone, pixelRatio);
  	      if (!result) {
  	        return null
  	      }
  	      canvas = result.canvas;
  	      onDestroy = result.onDestroy;
  	    }
  	    // workaround for chromium bug, premultiplied alpha value is platform dependent
  	    if (contextAttributes.premultipliedAlpha === undefined) contextAttributes.premultipliedAlpha = true;
  	    gl = createContext(canvas, contextAttributes);
  	  }

  	  if (!gl) {
  	    onDestroy();
  	    onDone('webgl not supported, try upgrading your browser or graphics drivers http://get.webgl.org');
  	    return null
  	  }

  	  return {
  	    gl: gl,
  	    canvas: canvas,
  	    container: container,
  	    extensions: extensions,
  	    optionalExtensions: optionalExtensions,
  	    pixelRatio: pixelRatio,
  	    profile: profile,
  	    onDone: onDone,
  	    onDestroy: onDestroy
  	  }
  	}

  	function createExtensionCache (gl, config) {
  	  var extensions = {};

  	  function tryLoadExtension (name_) {
  	    check$1.type(name_, 'string', 'extension name must be string');
  	    var name = name_.toLowerCase();
  	    var ext;
  	    try {
  	      ext = extensions[name] = gl.getExtension(name);
  	    } catch (e) {}
  	    return !!ext
  	  }

  	  for (var i = 0; i < config.extensions.length; ++i) {
  	    var name = config.extensions[i];
  	    if (!tryLoadExtension(name)) {
  	      config.onDestroy();
  	      config.onDone('"' + name + '" extension is not supported by the current WebGL context, try upgrading your system or a different browser');
  	      return null
  	    }
  	  }

  	  config.optionalExtensions.forEach(tryLoadExtension);

  	  return {
  	    extensions: extensions,
  	    restore: function () {
  	      Object.keys(extensions).forEach(function (name) {
  	        if (extensions[name] && !tryLoadExtension(name)) {
  	          throw new Error('(regl): error restoring extension ' + name)
  	        }
  	      });
  	    }
  	  }
  	}

  	function loop (n, f) {
  	  var result = Array(n);
  	  for (var i = 0; i < n; ++i) {
  	    result[i] = f(i);
  	  }
  	  return result
  	}

  	var GL_BYTE$1 = 5120;
  	var GL_UNSIGNED_BYTE$2 = 5121;
  	var GL_SHORT$1 = 5122;
  	var GL_UNSIGNED_SHORT$1 = 5123;
  	var GL_INT$1 = 5124;
  	var GL_UNSIGNED_INT$1 = 5125;
  	var GL_FLOAT$2 = 5126;

  	function nextPow16 (v) {
  	  for (var i = 16; i <= (1 << 28); i *= 16) {
  	    if (v <= i) {
  	      return i
  	    }
  	  }
  	  return 0
  	}

  	function log2 (v) {
  	  var r, shift;
  	  r = (v > 0xFFFF) << 4;
  	  v >>>= r;
  	  shift = (v > 0xFF) << 3;
  	  v >>>= shift; r |= shift;
  	  shift = (v > 0xF) << 2;
  	  v >>>= shift; r |= shift;
  	  shift = (v > 0x3) << 1;
  	  v >>>= shift; r |= shift;
  	  return r | (v >> 1)
  	}

  	function createPool () {
  	  var bufferPool = loop(8, function () {
  	    return []
  	  });

  	  function alloc (n) {
  	    var sz = nextPow16(n);
  	    var bin = bufferPool[log2(sz) >> 2];
  	    if (bin.length > 0) {
  	      return bin.pop()
  	    }
  	    return new ArrayBuffer(sz)
  	  }

  	  function free (buf) {
  	    bufferPool[log2(buf.byteLength) >> 2].push(buf);
  	  }

  	  function allocType (type, n) {
  	    var result = null;
  	    switch (type) {
  	      case GL_BYTE$1:
  	        result = new Int8Array(alloc(n), 0, n);
  	        break
  	      case GL_UNSIGNED_BYTE$2:
  	        result = new Uint8Array(alloc(n), 0, n);
  	        break
  	      case GL_SHORT$1:
  	        result = new Int16Array(alloc(2 * n), 0, n);
  	        break
  	      case GL_UNSIGNED_SHORT$1:
  	        result = new Uint16Array(alloc(2 * n), 0, n);
  	        break
  	      case GL_INT$1:
  	        result = new Int32Array(alloc(4 * n), 0, n);
  	        break
  	      case GL_UNSIGNED_INT$1:
  	        result = new Uint32Array(alloc(4 * n), 0, n);
  	        break
  	      case GL_FLOAT$2:
  	        result = new Float32Array(alloc(4 * n), 0, n);
  	        break
  	      default:
  	        return null
  	    }
  	    if (result.length !== n) {
  	      return result.subarray(0, n)
  	    }
  	    return result
  	  }

  	  function freeType (array) {
  	    free(array.buffer);
  	  }

  	  return {
  	    alloc: alloc,
  	    free: free,
  	    allocType: allocType,
  	    freeType: freeType
  	  }
  	}

  	var pool = createPool();

  	// zero pool for initial zero data
  	pool.zero = createPool();

  	var GL_SUBPIXEL_BITS = 0x0D50;
  	var GL_RED_BITS = 0x0D52;
  	var GL_GREEN_BITS = 0x0D53;
  	var GL_BLUE_BITS = 0x0D54;
  	var GL_ALPHA_BITS = 0x0D55;
  	var GL_DEPTH_BITS = 0x0D56;
  	var GL_STENCIL_BITS = 0x0D57;

  	var GL_ALIASED_POINT_SIZE_RANGE = 0x846D;
  	var GL_ALIASED_LINE_WIDTH_RANGE = 0x846E;

  	var GL_MAX_TEXTURE_SIZE = 0x0D33;
  	var GL_MAX_VIEWPORT_DIMS = 0x0D3A;
  	var GL_MAX_VERTEX_ATTRIBS = 0x8869;
  	var GL_MAX_VERTEX_UNIFORM_VECTORS = 0x8DFB;
  	var GL_MAX_VARYING_VECTORS = 0x8DFC;
  	var GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS = 0x8B4D;
  	var GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS = 0x8B4C;
  	var GL_MAX_TEXTURE_IMAGE_UNITS = 0x8872;
  	var GL_MAX_FRAGMENT_UNIFORM_VECTORS = 0x8DFD;
  	var GL_MAX_CUBE_MAP_TEXTURE_SIZE = 0x851C;
  	var GL_MAX_RENDERBUFFER_SIZE = 0x84E8;

  	var GL_VENDOR = 0x1F00;
  	var GL_RENDERER = 0x1F01;
  	var GL_VERSION = 0x1F02;
  	var GL_SHADING_LANGUAGE_VERSION = 0x8B8C;

  	var GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT = 0x84FF;

  	var GL_MAX_COLOR_ATTACHMENTS_WEBGL = 0x8CDF;
  	var GL_MAX_DRAW_BUFFERS_WEBGL = 0x8824;

  	var GL_TEXTURE_2D = 0x0DE1;
  	var GL_TEXTURE_CUBE_MAP = 0x8513;
  	var GL_TEXTURE_CUBE_MAP_POSITIVE_X = 0x8515;
  	var GL_TEXTURE0 = 0x84C0;
  	var GL_RGBA = 0x1908;
  	var GL_FLOAT$1 = 0x1406;
  	var GL_UNSIGNED_BYTE$1 = 0x1401;
  	var GL_FRAMEBUFFER = 0x8D40;
  	var GL_FRAMEBUFFER_COMPLETE = 0x8CD5;
  	var GL_COLOR_ATTACHMENT0 = 0x8CE0;
  	var GL_COLOR_BUFFER_BIT$1 = 0x4000;

  	var wrapLimits = function (gl, extensions) {
  	  var maxAnisotropic = 1;
  	  if (extensions.ext_texture_filter_anisotropic) {
  	    maxAnisotropic = gl.getParameter(GL_MAX_TEXTURE_MAX_ANISOTROPY_EXT);
  	  }

  	  var maxDrawbuffers = 1;
  	  var maxColorAttachments = 1;
  	  if (extensions.webgl_draw_buffers) {
  	    maxDrawbuffers = gl.getParameter(GL_MAX_DRAW_BUFFERS_WEBGL);
  	    maxColorAttachments = gl.getParameter(GL_MAX_COLOR_ATTACHMENTS_WEBGL);
  	  }

  	  // detect if reading float textures is available (Safari doesn't support)
  	  var readFloat = !!extensions.oes_texture_float;
  	  if (readFloat) {
  	    var readFloatTexture = gl.createTexture();
  	    gl.bindTexture(GL_TEXTURE_2D, readFloatTexture);
  	    gl.texImage2D(GL_TEXTURE_2D, 0, GL_RGBA, 1, 1, 0, GL_RGBA, GL_FLOAT$1, null);

  	    var fbo = gl.createFramebuffer();
  	    gl.bindFramebuffer(GL_FRAMEBUFFER, fbo);
  	    gl.framebufferTexture2D(GL_FRAMEBUFFER, GL_COLOR_ATTACHMENT0, GL_TEXTURE_2D, readFloatTexture, 0);
  	    gl.bindTexture(GL_TEXTURE_2D, null);

  	    if (gl.checkFramebufferStatus(GL_FRAMEBUFFER) !== GL_FRAMEBUFFER_COMPLETE) readFloat = false;

  	    else {
  	      gl.viewport(0, 0, 1, 1);
  	      gl.clearColor(1.0, 0.0, 0.0, 1.0);
  	      gl.clear(GL_COLOR_BUFFER_BIT$1);
  	      var pixels = pool.allocType(GL_FLOAT$1, 4);
  	      gl.readPixels(0, 0, 1, 1, GL_RGBA, GL_FLOAT$1, pixels);

  	      if (gl.getError()) readFloat = false;
  	      else {
  	        gl.deleteFramebuffer(fbo);
  	        gl.deleteTexture(readFloatTexture);

  	        readFloat = pixels[0] === 1.0;
  	      }

  	      pool.freeType(pixels);
  	    }
  	  }

  	  // detect non power of two cube textures support (IE doesn't support)
  	  var isIE = typeof navigator !== 'undefined' && (/MSIE/.test(navigator.userAgent) || /Trident\//.test(navigator.appVersion) || /Edge/.test(navigator.userAgent));

  	  var npotTextureCube = true;

  	  if (!isIE) {
  	    var cubeTexture = gl.createTexture();
  	    var data = pool.allocType(GL_UNSIGNED_BYTE$1, 36);
  	    gl.activeTexture(GL_TEXTURE0);
  	    gl.bindTexture(GL_TEXTURE_CUBE_MAP, cubeTexture);
  	    gl.texImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X, 0, GL_RGBA, 3, 3, 0, GL_RGBA, GL_UNSIGNED_BYTE$1, data);
  	    pool.freeType(data);
  	    gl.bindTexture(GL_TEXTURE_CUBE_MAP, null);
  	    gl.deleteTexture(cubeTexture);
  	    npotTextureCube = !gl.getError();
  	  }

  	  return {
  	    // drawing buffer bit depth
  	    colorBits: [
  	      gl.getParameter(GL_RED_BITS),
  	      gl.getParameter(GL_GREEN_BITS),
  	      gl.getParameter(GL_BLUE_BITS),
  	      gl.getParameter(GL_ALPHA_BITS)
  	    ],
  	    depthBits: gl.getParameter(GL_DEPTH_BITS),
  	    stencilBits: gl.getParameter(GL_STENCIL_BITS),
  	    subpixelBits: gl.getParameter(GL_SUBPIXEL_BITS),

  	    // supported extensions
  	    extensions: Object.keys(extensions).filter(function (ext) {
  	      return !!extensions[ext]
  	    }),

  	    // max aniso samples
  	    maxAnisotropic: maxAnisotropic,

  	    // max draw buffers
  	    maxDrawbuffers: maxDrawbuffers,
  	    maxColorAttachments: maxColorAttachments,

  	    // point and line size ranges
  	    pointSizeDims: gl.getParameter(GL_ALIASED_POINT_SIZE_RANGE),
  	    lineWidthDims: gl.getParameter(GL_ALIASED_LINE_WIDTH_RANGE),
  	    maxViewportDims: gl.getParameter(GL_MAX_VIEWPORT_DIMS),
  	    maxCombinedTextureUnits: gl.getParameter(GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS),
  	    maxCubeMapSize: gl.getParameter(GL_MAX_CUBE_MAP_TEXTURE_SIZE),
  	    maxRenderbufferSize: gl.getParameter(GL_MAX_RENDERBUFFER_SIZE),
  	    maxTextureUnits: gl.getParameter(GL_MAX_TEXTURE_IMAGE_UNITS),
  	    maxTextureSize: gl.getParameter(GL_MAX_TEXTURE_SIZE),
  	    maxAttributes: gl.getParameter(GL_MAX_VERTEX_ATTRIBS),
  	    maxVertexUniforms: gl.getParameter(GL_MAX_VERTEX_UNIFORM_VECTORS),
  	    maxVertexTextureUnits: gl.getParameter(GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS),
  	    maxVaryingVectors: gl.getParameter(GL_MAX_VARYING_VECTORS),
  	    maxFragmentUniforms: gl.getParameter(GL_MAX_FRAGMENT_UNIFORM_VECTORS),

  	    // vendor info
  	    glsl: gl.getParameter(GL_SHADING_LANGUAGE_VERSION),
  	    renderer: gl.getParameter(GL_RENDERER),
  	    vendor: gl.getParameter(GL_VENDOR),
  	    version: gl.getParameter(GL_VERSION),

  	    // quirks
  	    readFloat: readFloat,
  	    npotTextureCube: npotTextureCube
  	  }
  	};

  	function isNDArrayLike (obj) {
  	  return (
  	    !!obj &&
  	    typeof obj === 'object' &&
  	    Array.isArray(obj.shape) &&
  	    Array.isArray(obj.stride) &&
  	    typeof obj.offset === 'number' &&
  	    obj.shape.length === obj.stride.length &&
  	    (Array.isArray(obj.data) ||
  	      isTypedArray(obj.data)))
  	}

  	var values = function (obj) {
  	  return Object.keys(obj).map(function (key) { return obj[key] })
  	};

  	var flattenUtils = {
  	  shape: arrayShape$1,
  	  flatten: flattenArray
  	};

  	function flatten1D (array, nx, out) {
  	  for (var i = 0; i < nx; ++i) {
  	    out[i] = array[i];
  	  }
  	}

  	function flatten2D (array, nx, ny, out) {
  	  var ptr = 0;
  	  for (var i = 0; i < nx; ++i) {
  	    var row = array[i];
  	    for (var j = 0; j < ny; ++j) {
  	      out[ptr++] = row[j];
  	    }
  	  }
  	}

  	function flatten3D (array, nx, ny, nz, out, ptr_) {
  	  var ptr = ptr_;
  	  for (var i = 0; i < nx; ++i) {
  	    var row = array[i];
  	    for (var j = 0; j < ny; ++j) {
  	      var col = row[j];
  	      for (var k = 0; k < nz; ++k) {
  	        out[ptr++] = col[k];
  	      }
  	    }
  	  }
  	}

  	function flattenRec (array, shape, level, out, ptr) {
  	  var stride = 1;
  	  for (var i = level + 1; i < shape.length; ++i) {
  	    stride *= shape[i];
  	  }
  	  var n = shape[level];
  	  if (shape.length - level === 4) {
  	    var nx = shape[level + 1];
  	    var ny = shape[level + 2];
  	    var nz = shape[level + 3];
  	    for (i = 0; i < n; ++i) {
  	      flatten3D(array[i], nx, ny, nz, out, ptr);
  	      ptr += stride;
  	    }
  	  } else {
  	    for (i = 0; i < n; ++i) {
  	      flattenRec(array[i], shape, level + 1, out, ptr);
  	      ptr += stride;
  	    }
  	  }
  	}

  	function flattenArray (array, shape, type, out_) {
  	  var sz = 1;
  	  if (shape.length) {
  	    for (var i = 0; i < shape.length; ++i) {
  	      sz *= shape[i];
  	    }
  	  } else {
  	    sz = 0;
  	  }
  	  var out = out_ || pool.allocType(type, sz);
  	  switch (shape.length) {
  	    case 0:
  	      break
  	    case 1:
  	      flatten1D(array, shape[0], out);
  	      break
  	    case 2:
  	      flatten2D(array, shape[0], shape[1], out);
  	      break
  	    case 3:
  	      flatten3D(array, shape[0], shape[1], shape[2], out, 0);
  	      break
  	    default:
  	      flattenRec(array, shape, 0, out, 0);
  	  }
  	  return out
  	}

  	function arrayShape$1 (array_) {
  	  var shape = [];
  	  for (var array = array_; array.length; array = array[0]) {
  	    shape.push(array.length);
  	  }
  	  return shape
  	}

  	var arrayTypes =  {
  		"[object Int8Array]": 5120,
  		"[object Int16Array]": 5122,
  		"[object Int32Array]": 5124,
  		"[object Uint8Array]": 5121,
  		"[object Uint8ClampedArray]": 5121,
  		"[object Uint16Array]": 5123,
  		"[object Uint32Array]": 5125,
  		"[object Float32Array]": 5126,
  		"[object Float64Array]": 5121,
  		"[object ArrayBuffer]": 5121
  	};

  	var int8 = 5120;
  	var int16 = 5122;
  	var int32 = 5124;
  	var uint8 = 5121;
  	var uint16 = 5123;
  	var uint32 = 5125;
  	var float = 5126;
  	var float32 = 5126;
  	var glTypes = {
  		int8: int8,
  		int16: int16,
  		int32: int32,
  		uint8: uint8,
  		uint16: uint16,
  		uint32: uint32,
  		float: float,
  		float32: float32
  	};

  	var dynamic$1 = 35048;
  	var stream = 35040;
  	var usageTypes = {
  		dynamic: dynamic$1,
  		stream: stream,
  		"static": 35044
  	};

  	var arrayFlatten = flattenUtils.flatten;
  	var arrayShape = flattenUtils.shape;

  	var GL_STATIC_DRAW = 0x88E4;
  	var GL_STREAM_DRAW = 0x88E0;

  	var GL_UNSIGNED_BYTE$3 = 5121;
  	var GL_FLOAT$3 = 5126;

  	var DTYPES_SIZES = [];
  	DTYPES_SIZES[5120] = 1; // int8
  	DTYPES_SIZES[5122] = 2; // int16
  	DTYPES_SIZES[5124] = 4; // int32
  	DTYPES_SIZES[5121] = 1; // uint8
  	DTYPES_SIZES[5123] = 2; // uint16
  	DTYPES_SIZES[5125] = 4; // uint32
  	DTYPES_SIZES[5126] = 4; // float32

  	function typedArrayCode (data) {
  	  return arrayTypes[Object.prototype.toString.call(data)] | 0
  	}

  	function copyArray (out, inp) {
  	  for (var i = 0; i < inp.length; ++i) {
  	    out[i] = inp[i];
  	  }
  	}

  	function transpose (
  	  result, data, shapeX, shapeY, strideX, strideY, offset) {
  	  var ptr = 0;
  	  for (var i = 0; i < shapeX; ++i) {
  	    for (var j = 0; j < shapeY; ++j) {
  	      result[ptr++] = data[strideX * i + strideY * j + offset];
  	    }
  	  }
  	}

  	function wrapBufferState (gl, stats, config, destroyBuffer) {
  	  var bufferCount = 0;
  	  var bufferSet = {};

  	  function REGLBuffer (type) {
  	    this.id = bufferCount++;
  	    this.buffer = gl.createBuffer();
  	    this.type = type;
  	    this.usage = GL_STATIC_DRAW;
  	    this.byteLength = 0;
  	    this.dimension = 1;
  	    this.dtype = GL_UNSIGNED_BYTE$3;

  	    this.persistentData = null;

  	    if (config.profile) {
  	      this.stats = { size: 0 };
  	    }
  	  }

  	  REGLBuffer.prototype.bind = function () {
  	    gl.bindBuffer(this.type, this.buffer);
  	  };

  	  REGLBuffer.prototype.destroy = function () {
  	    destroy(this);
  	  };

  	  var streamPool = [];

  	  function createStream (type, data) {
  	    var buffer = streamPool.pop();
  	    if (!buffer) {
  	      buffer = new REGLBuffer(type);
  	    }
  	    buffer.bind();
  	    initBufferFromData(buffer, data, GL_STREAM_DRAW, 0, 1, false);
  	    return buffer
  	  }

  	  function destroyStream (stream$$1) {
  	    streamPool.push(stream$$1);
  	  }

  	  function initBufferFromTypedArray (buffer, data, usage) {
  	    buffer.byteLength = data.byteLength;
  	    gl.bufferData(buffer.type, data, usage);
  	  }

  	  function initBufferFromData (buffer, data, usage, dtype, dimension, persist) {
  	    var shape;
  	    buffer.usage = usage;
  	    if (Array.isArray(data)) {
  	      buffer.dtype = dtype || GL_FLOAT$3;
  	      if (data.length > 0) {
  	        var flatData;
  	        if (Array.isArray(data[0])) {
  	          shape = arrayShape(data);
  	          var dim = 1;
  	          for (var i = 1; i < shape.length; ++i) {
  	            dim *= shape[i];
  	          }
  	          buffer.dimension = dim;
  	          flatData = arrayFlatten(data, shape, buffer.dtype);
  	          initBufferFromTypedArray(buffer, flatData, usage);
  	          if (persist) {
  	            buffer.persistentData = flatData;
  	          } else {
  	            pool.freeType(flatData);
  	          }
  	        } else if (typeof data[0] === 'number') {
  	          buffer.dimension = dimension;
  	          var typedData = pool.allocType(buffer.dtype, data.length);
  	          copyArray(typedData, data);
  	          initBufferFromTypedArray(buffer, typedData, usage);
  	          if (persist) {
  	            buffer.persistentData = typedData;
  	          } else {
  	            pool.freeType(typedData);
  	          }
  	        } else if (isTypedArray(data[0])) {
  	          buffer.dimension = data[0].length;
  	          buffer.dtype = dtype || typedArrayCode(data[0]) || GL_FLOAT$3;
  	          flatData = arrayFlatten(
  	            data,
  	            [data.length, data[0].length],
  	            buffer.dtype);
  	          initBufferFromTypedArray(buffer, flatData, usage);
  	          if (persist) {
  	            buffer.persistentData = flatData;
  	          } else {
  	            pool.freeType(flatData);
  	          }
  	        } else {
  	          check$1.raise('invalid buffer data');
  	        }
  	      }
  	    } else if (isTypedArray(data)) {
  	      buffer.dtype = dtype || typedArrayCode(data);
  	      buffer.dimension = dimension;
  	      initBufferFromTypedArray(buffer, data, usage);
  	      if (persist) {
  	        buffer.persistentData = new Uint8Array(new Uint8Array(data.buffer));
  	      }
  	    } else if (isNDArrayLike(data)) {
  	      shape = data.shape;
  	      var stride = data.stride;
  	      var offset = data.offset;

  	      var shapeX = 0;
  	      var shapeY = 0;
  	      var strideX = 0;
  	      var strideY = 0;
  	      if (shape.length === 1) {
  	        shapeX = shape[0];
  	        shapeY = 1;
  	        strideX = stride[0];
  	        strideY = 0;
  	      } else if (shape.length === 2) {
  	        shapeX = shape[0];
  	        shapeY = shape[1];
  	        strideX = stride[0];
  	        strideY = stride[1];
  	      } else {
  	        check$1.raise('invalid shape');
  	      }

  	      buffer.dtype = dtype || typedArrayCode(data.data) || GL_FLOAT$3;
  	      buffer.dimension = shapeY;

  	      var transposeData = pool.allocType(buffer.dtype, shapeX * shapeY);
  	      transpose(transposeData,
  	        data.data,
  	        shapeX, shapeY,
  	        strideX, strideY,
  	        offset);
  	      initBufferFromTypedArray(buffer, transposeData, usage);
  	      if (persist) {
  	        buffer.persistentData = transposeData;
  	      } else {
  	        pool.freeType(transposeData);
  	      }
  	    } else if (data instanceof ArrayBuffer) {
  	      buffer.dtype = GL_UNSIGNED_BYTE$3;
  	      buffer.dimension = dimension;
  	      initBufferFromTypedArray(buffer, data, usage);
  	      if (persist) {
  	        buffer.persistentData = new Uint8Array(new Uint8Array(data));
  	      }
  	    } else {
  	      check$1.raise('invalid buffer data');
  	    }
  	  }

  	  function destroy (buffer) {
  	    stats.bufferCount--;

  	    // remove attribute link
  	    destroyBuffer(buffer);

  	    var handle = buffer.buffer;
  	    check$1(handle, 'buffer must not be deleted already');
  	    gl.deleteBuffer(handle);
  	    buffer.buffer = null;
  	    delete bufferSet[buffer.id];
  	  }

  	  function createBuffer (options, type, deferInit, persistent) {
  	    stats.bufferCount++;

  	    var buffer = new REGLBuffer(type);
  	    bufferSet[buffer.id] = buffer;

  	    function reglBuffer (options) {
  	      var usage = GL_STATIC_DRAW;
  	      var data = null;
  	      var byteLength = 0;
  	      var dtype = 0;
  	      var dimension = 1;
  	      if (Array.isArray(options) ||
  	          isTypedArray(options) ||
  	          isNDArrayLike(options) ||
  	          options instanceof ArrayBuffer) {
  	        data = options;
  	      } else if (typeof options === 'number') {
  	        byteLength = options | 0;
  	      } else if (options) {
  	        check$1.type(
  	          options, 'object',
  	          'buffer arguments must be an object, a number or an array');

  	        if ('data' in options) {
  	          check$1(
  	            data === null ||
  	            Array.isArray(data) ||
  	            isTypedArray(data) ||
  	            isNDArrayLike(data),
  	            'invalid data for buffer');
  	          data = options.data;
  	        }

  	        if ('usage' in options) {
  	          check$1.parameter(options.usage, usageTypes, 'invalid buffer usage');
  	          usage = usageTypes[options.usage];
  	        }

  	        if ('type' in options) {
  	          check$1.parameter(options.type, glTypes, 'invalid buffer type');
  	          dtype = glTypes[options.type];
  	        }

  	        if ('dimension' in options) {
  	          check$1.type(options.dimension, 'number', 'invalid dimension');
  	          dimension = options.dimension | 0;
  	        }

  	        if ('length' in options) {
  	          check$1.nni(byteLength, 'buffer length must be a nonnegative integer');
  	          byteLength = options.length | 0;
  	        }
  	      }

  	      buffer.bind();
  	      if (!data) {
  	        // #475
  	        if (byteLength) gl.bufferData(buffer.type, byteLength, usage);
  	        buffer.dtype = dtype || GL_UNSIGNED_BYTE$3;
  	        buffer.usage = usage;
  	        buffer.dimension = dimension;
  	        buffer.byteLength = byteLength;
  	      } else {
  	        initBufferFromData(buffer, data, usage, dtype, dimension, persistent);
  	      }

  	      if (config.profile) {
  	        buffer.stats.size = buffer.byteLength * DTYPES_SIZES[buffer.dtype];
  	      }

  	      return reglBuffer
  	    }

  	    function setSubData (data, offset) {
  	      check$1(offset + data.byteLength <= buffer.byteLength,
  	        'invalid buffer subdata call, buffer is too small. ' + ' Can\'t write data of size ' + data.byteLength + ' starting from offset ' + offset + ' to a buffer of size ' + buffer.byteLength);

  	      gl.bufferSubData(buffer.type, offset, data);
  	    }

  	    function subdata (data, offset_) {
  	      var offset = (offset_ || 0) | 0;
  	      var shape;
  	      buffer.bind();
  	      if (isTypedArray(data) || data instanceof ArrayBuffer) {
  	        setSubData(data, offset);
  	      } else if (Array.isArray(data)) {
  	        if (data.length > 0) {
  	          if (typeof data[0] === 'number') {
  	            var converted = pool.allocType(buffer.dtype, data.length);
  	            copyArray(converted, data);
  	            setSubData(converted, offset);
  	            pool.freeType(converted);
  	          } else if (Array.isArray(data[0]) || isTypedArray(data[0])) {
  	            shape = arrayShape(data);
  	            var flatData = arrayFlatten(data, shape, buffer.dtype);
  	            setSubData(flatData, offset);
  	            pool.freeType(flatData);
  	          } else {
  	            check$1.raise('invalid buffer data');
  	          }
  	        }
  	      } else if (isNDArrayLike(data)) {
  	        shape = data.shape;
  	        var stride = data.stride;

  	        var shapeX = 0;
  	        var shapeY = 0;
  	        var strideX = 0;
  	        var strideY = 0;
  	        if (shape.length === 1) {
  	          shapeX = shape[0];
  	          shapeY = 1;
  	          strideX = stride[0];
  	          strideY = 0;
  	        } else if (shape.length === 2) {
  	          shapeX = shape[0];
  	          shapeY = shape[1];
  	          strideX = stride[0];
  	          strideY = stride[1];
  	        } else {
  	          check$1.raise('invalid shape');
  	        }
  	        var dtype = Array.isArray(data.data)
  	          ? buffer.dtype
  	          : typedArrayCode(data.data);

  	        var transposeData = pool.allocType(dtype, shapeX * shapeY);
  	        transpose(transposeData,
  	          data.data,
  	          shapeX, shapeY,
  	          strideX, strideY,
  	          data.offset);
  	        setSubData(transposeData, offset);
  	        pool.freeType(transposeData);
  	      } else {
  	        check$1.raise('invalid data for buffer subdata');
  	      }
  	      return reglBuffer
  	    }

  	    if (!deferInit) {
  	      reglBuffer(options);
  	    }

  	    reglBuffer._reglType = 'buffer';
  	    reglBuffer._buffer = buffer;
  	    reglBuffer.subdata = subdata;
  	    if (config.profile) {
  	      reglBuffer.stats = buffer.stats;
  	    }
  	    reglBuffer.destroy = function () { destroy(buffer); };

  	    return reglBuffer
  	  }

  	  function restoreBuffers () {
  	    values(bufferSet).forEach(function (buffer) {
  	      buffer.buffer = gl.createBuffer();
  	      gl.bindBuffer(buffer.type, buffer.buffer);
  	      gl.bufferData(
  	        buffer.type, buffer.persistentData || buffer.byteLength, buffer.usage);
  	    });
  	  }

  	  if (config.profile) {
  	    stats.getTotalBufferSize = function () {
  	      var total = 0;
  	      // TODO: Right now, the streams are not part of the total count.
  	      Object.keys(bufferSet).forEach(function (key) {
  	        total += bufferSet[key].stats.size;
  	      });
  	      return total
  	    };
  	  }

  	  return {
  	    create: createBuffer,

  	    createStream: createStream,
  	    destroyStream: destroyStream,

  	    clear: function () {
  	      values(bufferSet).forEach(destroy);
  	      streamPool.forEach(destroy);
  	    },

  	    getBuffer: function (wrapper) {
  	      if (wrapper && wrapper._buffer instanceof REGLBuffer) {
  	        return wrapper._buffer
  	      }
  	      return null
  	    },

  	    restore: restoreBuffers,

  	    _initBuffer: initBufferFromData
  	  }
  	}

  	var points = 0;
  	var point = 0;
  	var lines = 1;
  	var line = 1;
  	var triangles = 4;
  	var triangle = 4;
  	var primTypes = {
  		points: points,
  		point: point,
  		lines: lines,
  		line: line,
  		triangles: triangles,
  		triangle: triangle,
  		"line loop": 2,
  		"line strip": 3,
  		"triangle strip": 5,
  		"triangle fan": 6
  	};

  	var GL_POINTS = 0;
  	var GL_LINES = 1;
  	var GL_TRIANGLES = 4;

  	var GL_BYTE$2 = 5120;
  	var GL_UNSIGNED_BYTE$4 = 5121;
  	var GL_SHORT$2 = 5122;
  	var GL_UNSIGNED_SHORT$2 = 5123;
  	var GL_INT$2 = 5124;
  	var GL_UNSIGNED_INT$2 = 5125;

  	var GL_ELEMENT_ARRAY_BUFFER = 34963;

  	var GL_STREAM_DRAW$1 = 0x88E0;
  	var GL_STATIC_DRAW$1 = 0x88E4;

  	function wrapElementsState (gl, extensions, bufferState, stats) {
  	  var elementSet = {};
  	  var elementCount = 0;

  	  var elementTypes = {
  	    'uint8': GL_UNSIGNED_BYTE$4,
  	    'uint16': GL_UNSIGNED_SHORT$2
  	  };

  	  if (extensions.oes_element_index_uint) {
  	    elementTypes.uint32 = GL_UNSIGNED_INT$2;
  	  }

  	  function REGLElementBuffer (buffer) {
  	    this.id = elementCount++;
  	    elementSet[this.id] = this;
  	    this.buffer = buffer;
  	    this.primType = GL_TRIANGLES;
  	    this.vertCount = 0;
  	    this.type = 0;
  	  }

  	  REGLElementBuffer.prototype.bind = function () {
  	    this.buffer.bind();
  	  };

  	  var bufferPool = [];

  	  function createElementStream (data) {
  	    var result = bufferPool.pop();
  	    if (!result) {
  	      result = new REGLElementBuffer(bufferState.create(
  	        null,
  	        GL_ELEMENT_ARRAY_BUFFER,
  	        true,
  	        false)._buffer);
  	    }
  	    initElements(result, data, GL_STREAM_DRAW$1, -1, -1, 0, 0);
  	    return result
  	  }

  	  function destroyElementStream (elements) {
  	    bufferPool.push(elements);
  	  }

  	  function initElements (
  	    elements,
  	    data,
  	    usage,
  	    prim,
  	    count,
  	    byteLength,
  	    type) {
  	    elements.buffer.bind();
  	    var dtype;
  	    if (data) {
  	      var predictedType = type;
  	      if (!type && (
  	        !isTypedArray(data) ||
  	         (isNDArrayLike(data) && !isTypedArray(data.data)))) {
  	        predictedType = extensions.oes_element_index_uint
  	          ? GL_UNSIGNED_INT$2
  	          : GL_UNSIGNED_SHORT$2;
  	      }
  	      bufferState._initBuffer(
  	        elements.buffer,
  	        data,
  	        usage,
  	        predictedType,
  	        3);
  	    } else {
  	      gl.bufferData(GL_ELEMENT_ARRAY_BUFFER, byteLength, usage);
  	      elements.buffer.dtype = dtype || GL_UNSIGNED_BYTE$4;
  	      elements.buffer.usage = usage;
  	      elements.buffer.dimension = 3;
  	      elements.buffer.byteLength = byteLength;
  	    }

  	    dtype = type;
  	    if (!type) {
  	      switch (elements.buffer.dtype) {
  	        case GL_UNSIGNED_BYTE$4:
  	        case GL_BYTE$2:
  	          dtype = GL_UNSIGNED_BYTE$4;
  	          break

  	        case GL_UNSIGNED_SHORT$2:
  	        case GL_SHORT$2:
  	          dtype = GL_UNSIGNED_SHORT$2;
  	          break

  	        case GL_UNSIGNED_INT$2:
  	        case GL_INT$2:
  	          dtype = GL_UNSIGNED_INT$2;
  	          break

  	        default:
  	          check$1.raise('unsupported type for element array');
  	      }
  	      elements.buffer.dtype = dtype;
  	    }
  	    elements.type = dtype;

  	    // Check oes_element_index_uint extension
  	    check$1(
  	      dtype !== GL_UNSIGNED_INT$2 ||
  	      !!extensions.oes_element_index_uint,
  	      '32 bit element buffers not supported, enable oes_element_index_uint first');

  	    // try to guess default primitive type and arguments
  	    var vertCount = count;
  	    if (vertCount < 0) {
  	      vertCount = elements.buffer.byteLength;
  	      if (dtype === GL_UNSIGNED_SHORT$2) {
  	        vertCount >>= 1;
  	      } else if (dtype === GL_UNSIGNED_INT$2) {
  	        vertCount >>= 2;
  	      }
  	    }
  	    elements.vertCount = vertCount;

  	    // try to guess primitive type from cell dimension
  	    var primType = prim;
  	    if (prim < 0) {
  	      primType = GL_TRIANGLES;
  	      var dimension = elements.buffer.dimension;
  	      if (dimension === 1) primType = GL_POINTS;
  	      if (dimension === 2) primType = GL_LINES;
  	      if (dimension === 3) primType = GL_TRIANGLES;
  	    }
  	    elements.primType = primType;
  	  }

  	  function destroyElements (elements) {
  	    stats.elementsCount--;

  	    check$1(elements.buffer !== null, 'must not double destroy elements');
  	    delete elementSet[elements.id];
  	    elements.buffer.destroy();
  	    elements.buffer = null;
  	  }

  	  function createElements (options, persistent) {
  	    var buffer = bufferState.create(null, GL_ELEMENT_ARRAY_BUFFER, true);
  	    var elements = new REGLElementBuffer(buffer._buffer);
  	    stats.elementsCount++;

  	    function reglElements (options) {
  	      if (!options) {
  	        buffer();
  	        elements.primType = GL_TRIANGLES;
  	        elements.vertCount = 0;
  	        elements.type = GL_UNSIGNED_BYTE$4;
  	      } else if (typeof options === 'number') {
  	        buffer(options);
  	        elements.primType = GL_TRIANGLES;
  	        elements.vertCount = options | 0;
  	        elements.type = GL_UNSIGNED_BYTE$4;
  	      } else {
  	        var data = null;
  	        var usage = GL_STATIC_DRAW$1;
  	        var primType = -1;
  	        var vertCount = -1;
  	        var byteLength = 0;
  	        var dtype = 0;
  	        if (Array.isArray(options) ||
  	            isTypedArray(options) ||
  	            isNDArrayLike(options)) {
  	          data = options;
  	        } else {
  	          check$1.type(options, 'object', 'invalid arguments for elements');
  	          if ('data' in options) {
  	            data = options.data;
  	            check$1(
  	              Array.isArray(data) ||
  	                isTypedArray(data) ||
  	                isNDArrayLike(data),
  	              'invalid data for element buffer');
  	          }
  	          if ('usage' in options) {
  	            check$1.parameter(
  	              options.usage,
  	              usageTypes,
  	              'invalid element buffer usage');
  	            usage = usageTypes[options.usage];
  	          }
  	          if ('primitive' in options) {
  	            check$1.parameter(
  	              options.primitive,
  	              primTypes,
  	              'invalid element buffer primitive');
  	            primType = primTypes[options.primitive];
  	          }
  	          if ('count' in options) {
  	            check$1(
  	              typeof options.count === 'number' && options.count >= 0,
  	              'invalid vertex count for elements');
  	            vertCount = options.count | 0;
  	          }
  	          if ('type' in options) {
  	            check$1.parameter(
  	              options.type,
  	              elementTypes,
  	              'invalid buffer type');
  	            dtype = elementTypes[options.type];
  	          }
  	          if ('length' in options) {
  	            byteLength = options.length | 0;
  	          } else {
  	            byteLength = vertCount;
  	            if (dtype === GL_UNSIGNED_SHORT$2 || dtype === GL_SHORT$2) {
  	              byteLength *= 2;
  	            } else if (dtype === GL_UNSIGNED_INT$2 || dtype === GL_INT$2) {
  	              byteLength *= 4;
  	            }
  	          }
  	        }
  	        initElements(
  	          elements,
  	          data,
  	          usage,
  	          primType,
  	          vertCount,
  	          byteLength,
  	          dtype);
  	      }

  	      return reglElements
  	    }

  	    reglElements(options);

  	    reglElements._reglType = 'elements';
  	    reglElements._elements = elements;
  	    reglElements.subdata = function (data, offset) {
  	      buffer.subdata(data, offset);
  	      return reglElements
  	    };
  	    reglElements.destroy = function () {
  	      destroyElements(elements);
  	    };

  	    return reglElements
  	  }

  	  return {
  	    create: createElements,
  	    createStream: createElementStream,
  	    destroyStream: destroyElementStream,
  	    getElements: function (elements) {
  	      if (typeof elements === 'function' &&
  	          elements._elements instanceof REGLElementBuffer) {
  	        return elements._elements
  	      }
  	      return null
  	    },
  	    clear: function () {
  	      values(elementSet).forEach(destroyElements);
  	    }
  	  }
  	}

  	var FLOAT = new Float32Array(1);
  	var INT = new Uint32Array(FLOAT.buffer);

  	var GL_UNSIGNED_SHORT$4 = 5123;

  	function convertToHalfFloat (array) {
  	  var ushorts = pool.allocType(GL_UNSIGNED_SHORT$4, array.length);

  	  for (var i = 0; i < array.length; ++i) {
  	    if (isNaN(array[i])) {
  	      ushorts[i] = 0xffff;
  	    } else if (array[i] === Infinity) {
  	      ushorts[i] = 0x7c00;
  	    } else if (array[i] === -Infinity) {
  	      ushorts[i] = 0xfc00;
  	    } else {
  	      FLOAT[0] = array[i];
  	      var x = INT[0];

  	      var sgn = (x >>> 31) << 15;
  	      var exp = ((x << 1) >>> 24) - 127;
  	      var frac = (x >> 13) & ((1 << 10) - 1);

  	      if (exp < -24) {
  	        // round non-representable denormals to 0
  	        ushorts[i] = sgn;
  	      } else if (exp < -14) {
  	        // handle denormals
  	        var s = -14 - exp;
  	        ushorts[i] = sgn + ((frac + (1 << 10)) >> s);
  	      } else if (exp > 15) {
  	        // round overflow to +/- Infinity
  	        ushorts[i] = sgn + 0x7c00;
  	      } else {
  	        // otherwise convert directly
  	        ushorts[i] = sgn + ((exp + 15) << 10) + frac;
  	      }
  	    }
  	  }

  	  return ushorts
  	}

  	function isArrayLike (s) {
  	  return Array.isArray(s) || isTypedArray(s)
  	}

  	var isPow2$1 = function (v) {
  	  return !(v & (v - 1)) && (!!v)
  	};

  	var GL_COMPRESSED_TEXTURE_FORMATS = 0x86A3;

  	var GL_TEXTURE_2D$1 = 0x0DE1;
  	var GL_TEXTURE_CUBE_MAP$1 = 0x8513;
  	var GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 = 0x8515;

  	var GL_RGBA$1 = 0x1908;
  	var GL_ALPHA = 0x1906;
  	var GL_RGB = 0x1907;
  	var GL_LUMINANCE = 0x1909;
  	var GL_LUMINANCE_ALPHA = 0x190A;

  	var GL_RGBA4 = 0x8056;
  	var GL_RGB5_A1 = 0x8057;
  	var GL_RGB565 = 0x8D62;

  	var GL_UNSIGNED_SHORT_4_4_4_4$1 = 0x8033;
  	var GL_UNSIGNED_SHORT_5_5_5_1$1 = 0x8034;
  	var GL_UNSIGNED_SHORT_5_6_5$1 = 0x8363;
  	var GL_UNSIGNED_INT_24_8_WEBGL$1 = 0x84FA;

  	var GL_DEPTH_COMPONENT = 0x1902;
  	var GL_DEPTH_STENCIL = 0x84F9;

  	var GL_SRGB_EXT = 0x8C40;
  	var GL_SRGB_ALPHA_EXT = 0x8C42;

  	var GL_HALF_FLOAT_OES$1 = 0x8D61;

  	var GL_COMPRESSED_RGB_S3TC_DXT1_EXT = 0x83F0;
  	var GL_COMPRESSED_RGBA_S3TC_DXT1_EXT = 0x83F1;
  	var GL_COMPRESSED_RGBA_S3TC_DXT3_EXT = 0x83F2;
  	var GL_COMPRESSED_RGBA_S3TC_DXT5_EXT = 0x83F3;

  	var GL_COMPRESSED_RGB_ATC_WEBGL = 0x8C92;
  	var GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL = 0x8C93;
  	var GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL = 0x87EE;

  	var GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG = 0x8C00;
  	var GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG = 0x8C01;
  	var GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG = 0x8C02;
  	var GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG = 0x8C03;

  	var GL_COMPRESSED_RGB_ETC1_WEBGL = 0x8D64;

  	var GL_UNSIGNED_BYTE$5 = 0x1401;
  	var GL_UNSIGNED_SHORT$3 = 0x1403;
  	var GL_UNSIGNED_INT$3 = 0x1405;
  	var GL_FLOAT$4 = 0x1406;

  	var GL_TEXTURE_WRAP_S = 0x2802;
  	var GL_TEXTURE_WRAP_T = 0x2803;

  	var GL_REPEAT = 0x2901;
  	var GL_CLAMP_TO_EDGE$1 = 0x812F;
  	var GL_MIRRORED_REPEAT = 0x8370;

  	var GL_TEXTURE_MAG_FILTER = 0x2800;
  	var GL_TEXTURE_MIN_FILTER = 0x2801;

  	var GL_NEAREST$1 = 0x2600;
  	var GL_LINEAR = 0x2601;
  	var GL_NEAREST_MIPMAP_NEAREST$1 = 0x2700;
  	var GL_LINEAR_MIPMAP_NEAREST$1 = 0x2701;
  	var GL_NEAREST_MIPMAP_LINEAR$1 = 0x2702;
  	var GL_LINEAR_MIPMAP_LINEAR$1 = 0x2703;

  	var GL_GENERATE_MIPMAP_HINT = 0x8192;
  	var GL_DONT_CARE = 0x1100;
  	var GL_FASTEST = 0x1101;
  	var GL_NICEST = 0x1102;

  	var GL_TEXTURE_MAX_ANISOTROPY_EXT = 0x84FE;

  	var GL_UNPACK_ALIGNMENT = 0x0CF5;
  	var GL_UNPACK_FLIP_Y_WEBGL = 0x9240;
  	var GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL = 0x9241;
  	var GL_UNPACK_COLORSPACE_CONVERSION_WEBGL = 0x9243;

  	var GL_BROWSER_DEFAULT_WEBGL = 0x9244;

  	var GL_TEXTURE0$1 = 0x84C0;

  	var MIPMAP_FILTERS = [
  	  GL_NEAREST_MIPMAP_NEAREST$1,
  	  GL_NEAREST_MIPMAP_LINEAR$1,
  	  GL_LINEAR_MIPMAP_NEAREST$1,
  	  GL_LINEAR_MIPMAP_LINEAR$1
  	];

  	var CHANNELS_FORMAT = [
  	  0,
  	  GL_LUMINANCE,
  	  GL_LUMINANCE_ALPHA,
  	  GL_RGB,
  	  GL_RGBA$1
  	];

  	var FORMAT_CHANNELS = {};
  	FORMAT_CHANNELS[GL_LUMINANCE] =
  	FORMAT_CHANNELS[GL_ALPHA] =
  	FORMAT_CHANNELS[GL_DEPTH_COMPONENT] = 1;
  	FORMAT_CHANNELS[GL_DEPTH_STENCIL] =
  	FORMAT_CHANNELS[GL_LUMINANCE_ALPHA] = 2;
  	FORMAT_CHANNELS[GL_RGB] =
  	FORMAT_CHANNELS[GL_SRGB_EXT] = 3;
  	FORMAT_CHANNELS[GL_RGBA$1] =
  	FORMAT_CHANNELS[GL_SRGB_ALPHA_EXT] = 4;

  	function objectName (str) {
  	  return '[object ' + str + ']'
  	}

  	var CANVAS_CLASS = objectName('HTMLCanvasElement');
  	var OFFSCREENCANVAS_CLASS = objectName('OffscreenCanvas');
  	var CONTEXT2D_CLASS = objectName('CanvasRenderingContext2D');
  	var BITMAP_CLASS = objectName('ImageBitmap');
  	var IMAGE_CLASS = objectName('HTMLImageElement');
  	var VIDEO_CLASS = objectName('HTMLVideoElement');

  	var PIXEL_CLASSES = Object.keys(arrayTypes).concat([
  	  CANVAS_CLASS,
  	  OFFSCREENCANVAS_CLASS,
  	  CONTEXT2D_CLASS,
  	  BITMAP_CLASS,
  	  IMAGE_CLASS,
  	  VIDEO_CLASS
  	]);

  	// for every texture type, store
  	// the size in bytes.
  	var TYPE_SIZES = [];
  	TYPE_SIZES[GL_UNSIGNED_BYTE$5] = 1;
  	TYPE_SIZES[GL_FLOAT$4] = 4;
  	TYPE_SIZES[GL_HALF_FLOAT_OES$1] = 2;

  	TYPE_SIZES[GL_UNSIGNED_SHORT$3] = 2;
  	TYPE_SIZES[GL_UNSIGNED_INT$3] = 4;

  	var FORMAT_SIZES_SPECIAL = [];
  	FORMAT_SIZES_SPECIAL[GL_RGBA4] = 2;
  	FORMAT_SIZES_SPECIAL[GL_RGB5_A1] = 2;
  	FORMAT_SIZES_SPECIAL[GL_RGB565] = 2;
  	FORMAT_SIZES_SPECIAL[GL_DEPTH_STENCIL] = 4;

  	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_S3TC_DXT1_EXT] = 0.5;
  	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_S3TC_DXT1_EXT] = 0.5;
  	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_S3TC_DXT3_EXT] = 1;
  	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_S3TC_DXT5_EXT] = 1;

  	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_ATC_WEBGL] = 0.5;
  	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL] = 1;
  	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL] = 1;

  	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG] = 0.5;
  	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG] = 0.25;
  	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG] = 0.5;
  	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG] = 0.25;

  	FORMAT_SIZES_SPECIAL[GL_COMPRESSED_RGB_ETC1_WEBGL] = 0.5;

  	function isNumericArray (arr) {
  	  return (
  	    Array.isArray(arr) &&
  	    (arr.length === 0 ||
  	    typeof arr[0] === 'number'))
  	}

  	function isRectArray (arr) {
  	  if (!Array.isArray(arr)) {
  	    return false
  	  }
  	  var width = arr.length;
  	  if (width === 0 || !isArrayLike(arr[0])) {
  	    return false
  	  }
  	  return true
  	}

  	function classString (x) {
  	  return Object.prototype.toString.call(x)
  	}

  	function isCanvasElement (object) {
  	  return classString(object) === CANVAS_CLASS
  	}

  	function isOffscreenCanvas (object) {
  	  return classString(object) === OFFSCREENCANVAS_CLASS
  	}

  	function isContext2D (object) {
  	  return classString(object) === CONTEXT2D_CLASS
  	}

  	function isBitmap (object) {
  	  return classString(object) === BITMAP_CLASS
  	}

  	function isImageElement (object) {
  	  return classString(object) === IMAGE_CLASS
  	}

  	function isVideoElement (object) {
  	  return classString(object) === VIDEO_CLASS
  	}

  	function isPixelData (object) {
  	  if (!object) {
  	    return false
  	  }
  	  var className = classString(object);
  	  if (PIXEL_CLASSES.indexOf(className) >= 0) {
  	    return true
  	  }
  	  return (
  	    isNumericArray(object) ||
  	    isRectArray(object) ||
  	    isNDArrayLike(object))
  	}

  	function typedArrayCode$1 (data) {
  	  return arrayTypes[Object.prototype.toString.call(data)] | 0
  	}

  	function convertData (result, data) {
  	  var n = data.length;
  	  switch (result.type) {
  	    case GL_UNSIGNED_BYTE$5:
  	    case GL_UNSIGNED_SHORT$3:
  	    case GL_UNSIGNED_INT$3:
  	    case GL_FLOAT$4:
  	      var converted = pool.allocType(result.type, n);
  	      converted.set(data);
  	      result.data = converted;
  	      break

  	    case GL_HALF_FLOAT_OES$1:
  	      result.data = convertToHalfFloat(data);
  	      break

  	    default:
  	      check$1.raise('unsupported texture type, must specify a typed array');
  	  }
  	}

  	function preConvert (image, n) {
  	  return pool.allocType(
  	    image.type === GL_HALF_FLOAT_OES$1
  	      ? GL_FLOAT$4
  	      : image.type, n)
  	}

  	function postConvert (image, data) {
  	  if (image.type === GL_HALF_FLOAT_OES$1) {
  	    image.data = convertToHalfFloat(data);
  	    pool.freeType(data);
  	  } else {
  	    image.data = data;
  	  }
  	}

  	function transposeData (image, array, strideX, strideY, strideC, offset) {
  	  var w = image.width;
  	  var h = image.height;
  	  var c = image.channels;
  	  var n = w * h * c;
  	  var data = preConvert(image, n);

  	  var p = 0;
  	  for (var i = 0; i < h; ++i) {
  	    for (var j = 0; j < w; ++j) {
  	      for (var k = 0; k < c; ++k) {
  	        data[p++] = array[strideX * j + strideY * i + strideC * k + offset];
  	      }
  	    }
  	  }

  	  postConvert(image, data);
  	}

  	function getTextureSize (format, type, width, height, isMipmap, isCube) {
  	  var s;
  	  if (typeof FORMAT_SIZES_SPECIAL[format] !== 'undefined') {
  	    // we have a special array for dealing with weird color formats such as RGB5A1
  	    s = FORMAT_SIZES_SPECIAL[format];
  	  } else {
  	    s = FORMAT_CHANNELS[format] * TYPE_SIZES[type];
  	  }

  	  if (isCube) {
  	    s *= 6;
  	  }

  	  if (isMipmap) {
  	    // compute the total size of all the mipmaps.
  	    var total = 0;

  	    var w = width;
  	    while (w >= 1) {
  	      // we can only use mipmaps on a square image,
  	      // so we can simply use the width and ignore the height:
  	      total += s * w * w;
  	      w /= 2;
  	    }
  	    return total
  	  } else {
  	    return s * width * height
  	  }
  	}

  	function createTextureSet (
  	  gl, extensions, limits, reglPoll, contextState, stats, config) {
  	  // -------------------------------------------------------
  	  // Initialize constants and parameter tables here
  	  // -------------------------------------------------------
  	  var mipmapHint = {
  	    "don't care": GL_DONT_CARE,
  	    'dont care': GL_DONT_CARE,
  	    'nice': GL_NICEST,
  	    'fast': GL_FASTEST
  	  };

  	  var wrapModes = {
  	    'repeat': GL_REPEAT,
  	    'clamp': GL_CLAMP_TO_EDGE$1,
  	    'mirror': GL_MIRRORED_REPEAT
  	  };

  	  var magFilters = {
  	    'nearest': GL_NEAREST$1,
  	    'linear': GL_LINEAR
  	  };

  	  var minFilters = extend({
  	    'mipmap': GL_LINEAR_MIPMAP_LINEAR$1,
  	    'nearest mipmap nearest': GL_NEAREST_MIPMAP_NEAREST$1,
  	    'linear mipmap nearest': GL_LINEAR_MIPMAP_NEAREST$1,
  	    'nearest mipmap linear': GL_NEAREST_MIPMAP_LINEAR$1,
  	    'linear mipmap linear': GL_LINEAR_MIPMAP_LINEAR$1
  	  }, magFilters);

  	  var colorSpace = {
  	    'none': 0,
  	    'browser': GL_BROWSER_DEFAULT_WEBGL
  	  };

  	  var textureTypes = {
  	    'uint8': GL_UNSIGNED_BYTE$5,
  	    'rgba4': GL_UNSIGNED_SHORT_4_4_4_4$1,
  	    'rgb565': GL_UNSIGNED_SHORT_5_6_5$1,
  	    'rgb5 a1': GL_UNSIGNED_SHORT_5_5_5_1$1
  	  };

  	  var textureFormats = {
  	    'alpha': GL_ALPHA,
  	    'luminance': GL_LUMINANCE,
  	    'luminance alpha': GL_LUMINANCE_ALPHA,
  	    'rgb': GL_RGB,
  	    'rgba': GL_RGBA$1,
  	    'rgba4': GL_RGBA4,
  	    'rgb5 a1': GL_RGB5_A1,
  	    'rgb565': GL_RGB565
  	  };

  	  var compressedTextureFormats = {};

  	  if (extensions.ext_srgb) {
  	    textureFormats.srgb = GL_SRGB_EXT;
  	    textureFormats.srgba = GL_SRGB_ALPHA_EXT;
  	  }

  	  if (extensions.oes_texture_float) {
  	    textureTypes.float32 = textureTypes.float = GL_FLOAT$4;
  	  }

  	  if (extensions.oes_texture_half_float) {
  	    textureTypes['float16'] = textureTypes['half float'] = GL_HALF_FLOAT_OES$1;
  	  }

  	  if (extensions.webgl_depth_texture) {
  	    extend(textureFormats, {
  	      'depth': GL_DEPTH_COMPONENT,
  	      'depth stencil': GL_DEPTH_STENCIL
  	    });

  	    extend(textureTypes, {
  	      'uint16': GL_UNSIGNED_SHORT$3,
  	      'uint32': GL_UNSIGNED_INT$3,
  	      'depth stencil': GL_UNSIGNED_INT_24_8_WEBGL$1
  	    });
  	  }

  	  if (extensions.webgl_compressed_texture_s3tc) {
  	    extend(compressedTextureFormats, {
  	      'rgb s3tc dxt1': GL_COMPRESSED_RGB_S3TC_DXT1_EXT,
  	      'rgba s3tc dxt1': GL_COMPRESSED_RGBA_S3TC_DXT1_EXT,
  	      'rgba s3tc dxt3': GL_COMPRESSED_RGBA_S3TC_DXT3_EXT,
  	      'rgba s3tc dxt5': GL_COMPRESSED_RGBA_S3TC_DXT5_EXT
  	    });
  	  }

  	  if (extensions.webgl_compressed_texture_atc) {
  	    extend(compressedTextureFormats, {
  	      'rgb atc': GL_COMPRESSED_RGB_ATC_WEBGL,
  	      'rgba atc explicit alpha': GL_COMPRESSED_RGBA_ATC_EXPLICIT_ALPHA_WEBGL,
  	      'rgba atc interpolated alpha': GL_COMPRESSED_RGBA_ATC_INTERPOLATED_ALPHA_WEBGL
  	    });
  	  }

  	  if (extensions.webgl_compressed_texture_pvrtc) {
  	    extend(compressedTextureFormats, {
  	      'rgb pvrtc 4bppv1': GL_COMPRESSED_RGB_PVRTC_4BPPV1_IMG,
  	      'rgb pvrtc 2bppv1': GL_COMPRESSED_RGB_PVRTC_2BPPV1_IMG,
  	      'rgba pvrtc 4bppv1': GL_COMPRESSED_RGBA_PVRTC_4BPPV1_IMG,
  	      'rgba pvrtc 2bppv1': GL_COMPRESSED_RGBA_PVRTC_2BPPV1_IMG
  	    });
  	  }

  	  if (extensions.webgl_compressed_texture_etc1) {
  	    compressedTextureFormats['rgb etc1'] = GL_COMPRESSED_RGB_ETC1_WEBGL;
  	  }

  	  // Copy over all texture formats
  	  var supportedCompressedFormats = Array.prototype.slice.call(
  	    gl.getParameter(GL_COMPRESSED_TEXTURE_FORMATS));
  	  Object.keys(compressedTextureFormats).forEach(function (name) {
  	    var format = compressedTextureFormats[name];
  	    if (supportedCompressedFormats.indexOf(format) >= 0) {
  	      textureFormats[name] = format;
  	    }
  	  });

  	  var supportedFormats = Object.keys(textureFormats);
  	  limits.textureFormats = supportedFormats;

  	  // associate with every format string its
  	  // corresponding GL-value.
  	  var textureFormatsInvert = [];
  	  Object.keys(textureFormats).forEach(function (key) {
  	    var val = textureFormats[key];
  	    textureFormatsInvert[val] = key;
  	  });

  	  // associate with every type string its
  	  // corresponding GL-value.
  	  var textureTypesInvert = [];
  	  Object.keys(textureTypes).forEach(function (key) {
  	    var val = textureTypes[key];
  	    textureTypesInvert[val] = key;
  	  });

  	  var magFiltersInvert = [];
  	  Object.keys(magFilters).forEach(function (key) {
  	    var val = magFilters[key];
  	    magFiltersInvert[val] = key;
  	  });

  	  var minFiltersInvert = [];
  	  Object.keys(minFilters).forEach(function (key) {
  	    var val = minFilters[key];
  	    minFiltersInvert[val] = key;
  	  });

  	  var wrapModesInvert = [];
  	  Object.keys(wrapModes).forEach(function (key) {
  	    var val = wrapModes[key];
  	    wrapModesInvert[val] = key;
  	  });

  	  // colorFormats[] gives the format (channels) associated to an
  	  // internalformat
  	  var colorFormats = supportedFormats.reduce(function (color, key) {
  	    var glenum = textureFormats[key];
  	    if (glenum === GL_LUMINANCE ||
  	        glenum === GL_ALPHA ||
  	        glenum === GL_LUMINANCE ||
  	        glenum === GL_LUMINANCE_ALPHA ||
  	        glenum === GL_DEPTH_COMPONENT ||
  	        glenum === GL_DEPTH_STENCIL ||
  	        (extensions.ext_srgb &&
  	                (glenum === GL_SRGB_EXT ||
  	                 glenum === GL_SRGB_ALPHA_EXT))) {
  	      color[glenum] = glenum;
  	    } else if (glenum === GL_RGB5_A1 || key.indexOf('rgba') >= 0) {
  	      color[glenum] = GL_RGBA$1;
  	    } else {
  	      color[glenum] = GL_RGB;
  	    }
  	    return color
  	  }, {});

  	  function TexFlags () {
  	    // format info
  	    this.internalformat = GL_RGBA$1;
  	    this.format = GL_RGBA$1;
  	    this.type = GL_UNSIGNED_BYTE$5;
  	    this.compressed = false;

  	    // pixel storage
  	    this.premultiplyAlpha = false;
  	    this.flipY = false;
  	    this.unpackAlignment = 1;
  	    this.colorSpace = GL_BROWSER_DEFAULT_WEBGL;

  	    // shape info
  	    this.width = 0;
  	    this.height = 0;
  	    this.channels = 0;
  	  }

  	  function copyFlags (result, other) {
  	    result.internalformat = other.internalformat;
  	    result.format = other.format;
  	    result.type = other.type;
  	    result.compressed = other.compressed;

  	    result.premultiplyAlpha = other.premultiplyAlpha;
  	    result.flipY = other.flipY;
  	    result.unpackAlignment = other.unpackAlignment;
  	    result.colorSpace = other.colorSpace;

  	    result.width = other.width;
  	    result.height = other.height;
  	    result.channels = other.channels;
  	  }

  	  function parseFlags (flags, options) {
  	    if (typeof options !== 'object' || !options) {
  	      return
  	    }

  	    if ('premultiplyAlpha' in options) {
  	      check$1.type(options.premultiplyAlpha, 'boolean',
  	        'invalid premultiplyAlpha');
  	      flags.premultiplyAlpha = options.premultiplyAlpha;
  	    }

  	    if ('flipY' in options) {
  	      check$1.type(options.flipY, 'boolean',
  	        'invalid texture flip');
  	      flags.flipY = options.flipY;
  	    }

  	    if ('alignment' in options) {
  	      check$1.oneOf(options.alignment, [1, 2, 4, 8],
  	        'invalid texture unpack alignment');
  	      flags.unpackAlignment = options.alignment;
  	    }

  	    if ('colorSpace' in options) {
  	      check$1.parameter(options.colorSpace, colorSpace,
  	        'invalid colorSpace');
  	      flags.colorSpace = colorSpace[options.colorSpace];
  	    }

  	    if ('type' in options) {
  	      var type = options.type;
  	      check$1(extensions.oes_texture_float ||
  	        !(type === 'float' || type === 'float32'),
  	      'you must enable the OES_texture_float extension in order to use floating point textures.');
  	      check$1(extensions.oes_texture_half_float ||
  	        !(type === 'half float' || type === 'float16'),
  	      'you must enable the OES_texture_half_float extension in order to use 16-bit floating point textures.');
  	      check$1(extensions.webgl_depth_texture ||
  	        !(type === 'uint16' || type === 'uint32' || type === 'depth stencil'),
  	      'you must enable the WEBGL_depth_texture extension in order to use depth/stencil textures.');
  	      check$1.parameter(type, textureTypes,
  	        'invalid texture type');
  	      flags.type = textureTypes[type];
  	    }

  	    var w = flags.width;
  	    var h = flags.height;
  	    var c = flags.channels;
  	    var hasChannels = false;
  	    if ('shape' in options) {
  	      check$1(Array.isArray(options.shape) && options.shape.length >= 2,
  	        'shape must be an array');
  	      w = options.shape[0];
  	      h = options.shape[1];
  	      if (options.shape.length === 3) {
  	        c = options.shape[2];
  	        check$1(c > 0 && c <= 4, 'invalid number of channels');
  	        hasChannels = true;
  	      }
  	      check$1(w >= 0 && w <= limits.maxTextureSize, 'invalid width');
  	      check$1(h >= 0 && h <= limits.maxTextureSize, 'invalid height');
  	    } else {
  	      if ('radius' in options) {
  	        w = h = options.radius;
  	        check$1(w >= 0 && w <= limits.maxTextureSize, 'invalid radius');
  	      }
  	      if ('width' in options) {
  	        w = options.width;
  	        check$1(w >= 0 && w <= limits.maxTextureSize, 'invalid width');
  	      }
  	      if ('height' in options) {
  	        h = options.height;
  	        check$1(h >= 0 && h <= limits.maxTextureSize, 'invalid height');
  	      }
  	      if ('channels' in options) {
  	        c = options.channels;
  	        check$1(c > 0 && c <= 4, 'invalid number of channels');
  	        hasChannels = true;
  	      }
  	    }
  	    flags.width = w | 0;
  	    flags.height = h | 0;
  	    flags.channels = c | 0;

  	    var hasFormat = false;
  	    if ('format' in options) {
  	      var formatStr = options.format;
  	      check$1(extensions.webgl_depth_texture ||
  	        !(formatStr === 'depth' || formatStr === 'depth stencil'),
  	      'you must enable the WEBGL_depth_texture extension in order to use depth/stencil textures.');
  	      check$1.parameter(formatStr, textureFormats,
  	        'invalid texture format');
  	      var internalformat = flags.internalformat = textureFormats[formatStr];
  	      flags.format = colorFormats[internalformat];
  	      if (formatStr in textureTypes) {
  	        if (!('type' in options)) {
  	          flags.type = textureTypes[formatStr];
  	        }
  	      }
  	      if (formatStr in compressedTextureFormats) {
  	        flags.compressed = true;
  	      }
  	      hasFormat = true;
  	    }

  	    // Reconcile channels and format
  	    if (!hasChannels && hasFormat) {
  	      flags.channels = FORMAT_CHANNELS[flags.format];
  	    } else if (hasChannels && !hasFormat) {
  	      if (flags.channels !== CHANNELS_FORMAT[flags.format]) {
  	        flags.format = flags.internalformat = CHANNELS_FORMAT[flags.channels];
  	      }
  	    } else if (hasFormat && hasChannels) {
  	      check$1(
  	        flags.channels === FORMAT_CHANNELS[flags.format],
  	        'number of channels inconsistent with specified format');
  	    }
  	  }

  	  function setFlags (flags) {
  	    gl.pixelStorei(GL_UNPACK_FLIP_Y_WEBGL, flags.flipY);
  	    gl.pixelStorei(GL_UNPACK_PREMULTIPLY_ALPHA_WEBGL, flags.premultiplyAlpha);
  	    gl.pixelStorei(GL_UNPACK_COLORSPACE_CONVERSION_WEBGL, flags.colorSpace);
  	    gl.pixelStorei(GL_UNPACK_ALIGNMENT, flags.unpackAlignment);
  	  }

  	  // -------------------------------------------------------
  	  // Tex image data
  	  // -------------------------------------------------------
  	  function TexImage () {
  	    TexFlags.call(this);

  	    this.xOffset = 0;
  	    this.yOffset = 0;

  	    // data
  	    this.data = null;
  	    this.needsFree = false;

  	    // html element
  	    this.element = null;

  	    // copyTexImage info
  	    this.needsCopy = false;
  	  }

  	  function parseImage (image, options) {
  	    var data = null;
  	    if (isPixelData(options)) {
  	      data = options;
  	    } else if (options) {
  	      check$1.type(options, 'object', 'invalid pixel data type');
  	      parseFlags(image, options);
  	      if ('x' in options) {
  	        image.xOffset = options.x | 0;
  	      }
  	      if ('y' in options) {
  	        image.yOffset = options.y | 0;
  	      }
  	      if (isPixelData(options.data)) {
  	        data = options.data;
  	      }
  	    }

  	    check$1(
  	      !image.compressed ||
  	      data instanceof Uint8Array,
  	      'compressed texture data must be stored in a uint8array');

  	    if (options.copy) {
  	      check$1(!data, 'can not specify copy and data field for the same texture');
  	      var viewW = contextState.viewportWidth;
  	      var viewH = contextState.viewportHeight;
  	      image.width = image.width || (viewW - image.xOffset);
  	      image.height = image.height || (viewH - image.yOffset);
  	      image.needsCopy = true;
  	      check$1(image.xOffset >= 0 && image.xOffset < viewW &&
  	            image.yOffset >= 0 && image.yOffset < viewH &&
  	            image.width > 0 && image.width <= viewW &&
  	            image.height > 0 && image.height <= viewH,
  	      'copy texture read out of bounds');
  	    } else if (!data) {
  	      image.width = image.width || 1;
  	      image.height = image.height || 1;
  	      image.channels = image.channels || 4;
  	    } else if (isTypedArray(data)) {
  	      image.channels = image.channels || 4;
  	      image.data = data;
  	      if (!('type' in options) && image.type === GL_UNSIGNED_BYTE$5) {
  	        image.type = typedArrayCode$1(data);
  	      }
  	    } else if (isNumericArray(data)) {
  	      image.channels = image.channels || 4;
  	      convertData(image, data);
  	      image.alignment = 1;
  	      image.needsFree = true;
  	    } else if (isNDArrayLike(data)) {
  	      var array = data.data;
  	      if (!Array.isArray(array) && image.type === GL_UNSIGNED_BYTE$5) {
  	        image.type = typedArrayCode$1(array);
  	      }
  	      var shape = data.shape;
  	      var stride = data.stride;
  	      var shapeX, shapeY, shapeC, strideX, strideY, strideC;
  	      if (shape.length === 3) {
  	        shapeC = shape[2];
  	        strideC = stride[2];
  	      } else {
  	        check$1(shape.length === 2, 'invalid ndarray pixel data, must be 2 or 3D');
  	        shapeC = 1;
  	        strideC = 1;
  	      }
  	      shapeX = shape[0];
  	      shapeY = shape[1];
  	      strideX = stride[0];
  	      strideY = stride[1];
  	      image.alignment = 1;
  	      image.width = shapeX;
  	      image.height = shapeY;
  	      image.channels = shapeC;
  	      image.format = image.internalformat = CHANNELS_FORMAT[shapeC];
  	      image.needsFree = true;
  	      transposeData(image, array, strideX, strideY, strideC, data.offset);
  	    } else if (isCanvasElement(data) || isOffscreenCanvas(data) || isContext2D(data)) {
  	      if (isCanvasElement(data) || isOffscreenCanvas(data)) {
  	        image.element = data;
  	      } else {
  	        image.element = data.canvas;
  	      }
  	      image.width = image.element.width;
  	      image.height = image.element.height;
  	      image.channels = 4;
  	    } else if (isBitmap(data)) {
  	      image.element = data;
  	      image.width = data.width;
  	      image.height = data.height;
  	      image.channels = 4;
  	    } else if (isImageElement(data)) {
  	      image.element = data;
  	      image.width = data.naturalWidth;
  	      image.height = data.naturalHeight;
  	      image.channels = 4;
  	    } else if (isVideoElement(data)) {
  	      image.element = data;
  	      image.width = data.videoWidth;
  	      image.height = data.videoHeight;
  	      image.channels = 4;
  	    } else if (isRectArray(data)) {
  	      var w = image.width || data[0].length;
  	      var h = image.height || data.length;
  	      var c = image.channels;
  	      if (isArrayLike(data[0][0])) {
  	        c = c || data[0][0].length;
  	      } else {
  	        c = c || 1;
  	      }
  	      var arrayShape = flattenUtils.shape(data);
  	      var n = 1;
  	      for (var dd = 0; dd < arrayShape.length; ++dd) {
  	        n *= arrayShape[dd];
  	      }
  	      var allocData = preConvert(image, n);
  	      flattenUtils.flatten(data, arrayShape, '', allocData);
  	      postConvert(image, allocData);
  	      image.alignment = 1;
  	      image.width = w;
  	      image.height = h;
  	      image.channels = c;
  	      image.format = image.internalformat = CHANNELS_FORMAT[c];
  	      image.needsFree = true;
  	    }

  	    if (image.type === GL_FLOAT$4) {
  	      check$1(limits.extensions.indexOf('oes_texture_float') >= 0,
  	        'oes_texture_float extension not enabled');
  	    } else if (image.type === GL_HALF_FLOAT_OES$1) {
  	      check$1(limits.extensions.indexOf('oes_texture_half_float') >= 0,
  	        'oes_texture_half_float extension not enabled');
  	    }

  	    // do compressed texture  validation here.
  	  }

  	  function setImage (info, target, miplevel) {
  	    var element = info.element;
  	    var data = info.data;
  	    var internalformat = info.internalformat;
  	    var format = info.format;
  	    var type = info.type;
  	    var width = info.width;
  	    var height = info.height;

  	    setFlags(info);

  	    if (element) {
  	      gl.texImage2D(target, miplevel, format, format, type, element);
  	    } else if (info.compressed) {
  	      gl.compressedTexImage2D(target, miplevel, internalformat, width, height, 0, data);
  	    } else if (info.needsCopy) {
  	      reglPoll();
  	      gl.copyTexImage2D(
  	        target, miplevel, format, info.xOffset, info.yOffset, width, height, 0);
  	    } else {
  	      gl.texImage2D(target, miplevel, format, width, height, 0, format, type, data || null);
  	    }
  	  }

  	  function setSubImage (info, target, x, y, miplevel) {
  	    var element = info.element;
  	    var data = info.data;
  	    var internalformat = info.internalformat;
  	    var format = info.format;
  	    var type = info.type;
  	    var width = info.width;
  	    var height = info.height;

  	    setFlags(info);

  	    if (element) {
  	      gl.texSubImage2D(
  	        target, miplevel, x, y, format, type, element);
  	    } else if (info.compressed) {
  	      gl.compressedTexSubImage2D(
  	        target, miplevel, x, y, internalformat, width, height, data);
  	    } else if (info.needsCopy) {
  	      reglPoll();
  	      gl.copyTexSubImage2D(
  	        target, miplevel, x, y, info.xOffset, info.yOffset, width, height);
  	    } else {
  	      gl.texSubImage2D(
  	        target, miplevel, x, y, width, height, format, type, data);
  	    }
  	  }

  	  // texImage pool
  	  var imagePool = [];

  	  function allocImage () {
  	    return imagePool.pop() || new TexImage()
  	  }

  	  function freeImage (image) {
  	    if (image.needsFree) {
  	      pool.freeType(image.data);
  	    }
  	    TexImage.call(image);
  	    imagePool.push(image);
  	  }

  	  // -------------------------------------------------------
  	  // Mip map
  	  // -------------------------------------------------------
  	  function MipMap () {
  	    TexFlags.call(this);

  	    this.genMipmaps = false;
  	    this.mipmapHint = GL_DONT_CARE;
  	    this.mipmask = 0;
  	    this.images = Array(16);
  	  }

  	  function parseMipMapFromShape (mipmap, width, height) {
  	    var img = mipmap.images[0] = allocImage();
  	    mipmap.mipmask = 1;
  	    img.width = mipmap.width = width;
  	    img.height = mipmap.height = height;
  	    img.channels = mipmap.channels = 4;
  	  }

  	  function parseMipMapFromObject (mipmap, options) {
  	    var imgData = null;
  	    if (isPixelData(options)) {
  	      imgData = mipmap.images[0] = allocImage();
  	      copyFlags(imgData, mipmap);
  	      parseImage(imgData, options);
  	      mipmap.mipmask = 1;
  	    } else {
  	      parseFlags(mipmap, options);
  	      if (Array.isArray(options.mipmap)) {
  	        var mipData = options.mipmap;
  	        for (var i = 0; i < mipData.length; ++i) {
  	          imgData = mipmap.images[i] = allocImage();
  	          copyFlags(imgData, mipmap);
  	          imgData.width >>= i;
  	          imgData.height >>= i;
  	          parseImage(imgData, mipData[i]);
  	          mipmap.mipmask |= (1 << i);
  	        }
  	      } else {
  	        imgData = mipmap.images[0] = allocImage();
  	        copyFlags(imgData, mipmap);
  	        parseImage(imgData, options);
  	        mipmap.mipmask = 1;
  	      }
  	    }
  	    copyFlags(mipmap, mipmap.images[0]);

  	    // For textures of the compressed format WEBGL_compressed_texture_s3tc
  	    // we must have that
  	    //
  	    // "When level equals zero width and height must be a multiple of 4.
  	    // When level is greater than 0 width and height must be 0, 1, 2 or a multiple of 4. "
  	    //
  	    // but we do not yet support having multiple mipmap levels for compressed textures,
  	    // so we only test for level zero.

  	    if (
  	      mipmap.compressed &&
  	      (
  	        mipmap.internalformat === GL_COMPRESSED_RGB_S3TC_DXT1_EXT ||
  	        mipmap.internalformat === GL_COMPRESSED_RGBA_S3TC_DXT1_EXT ||
  	        mipmap.internalformat === GL_COMPRESSED_RGBA_S3TC_DXT3_EXT ||
  	        mipmap.internalformat === GL_COMPRESSED_RGBA_S3TC_DXT5_EXT
  	      )
  	    ) {
  	      check$1(mipmap.width % 4 === 0 && mipmap.height % 4 === 0,
  	        'for compressed texture formats, mipmap level 0 must have width and height that are a multiple of 4');
  	    }
  	  }

  	  function setMipMap (mipmap, target) {
  	    var images = mipmap.images;
  	    for (var i = 0; i < images.length; ++i) {
  	      if (!images[i]) {
  	        return
  	      }
  	      setImage(images[i], target, i);
  	    }
  	  }

  	  var mipPool = [];

  	  function allocMipMap () {
  	    var result = mipPool.pop() || new MipMap();
  	    TexFlags.call(result);
  	    result.mipmask = 0;
  	    for (var i = 0; i < 16; ++i) {
  	      result.images[i] = null;
  	    }
  	    return result
  	  }

  	  function freeMipMap (mipmap) {
  	    var images = mipmap.images;
  	    for (var i = 0; i < images.length; ++i) {
  	      if (images[i]) {
  	        freeImage(images[i]);
  	      }
  	      images[i] = null;
  	    }
  	    mipPool.push(mipmap);
  	  }

  	  // -------------------------------------------------------
  	  // Tex info
  	  // -------------------------------------------------------
  	  function TexInfo () {
  	    this.minFilter = GL_NEAREST$1;
  	    this.magFilter = GL_NEAREST$1;

  	    this.wrapS = GL_CLAMP_TO_EDGE$1;
  	    this.wrapT = GL_CLAMP_TO_EDGE$1;

  	    this.anisotropic = 1;

  	    this.genMipmaps = false;
  	    this.mipmapHint = GL_DONT_CARE;
  	  }

  	  function parseTexInfo (info, options) {
  	    if ('min' in options) {
  	      var minFilter = options.min;
  	      check$1.parameter(minFilter, minFilters);
  	      info.minFilter = minFilters[minFilter];
  	      if (MIPMAP_FILTERS.indexOf(info.minFilter) >= 0 && !('faces' in options)) {
  	        info.genMipmaps = true;
  	      }
  	    }

  	    if ('mag' in options) {
  	      var magFilter = options.mag;
  	      check$1.parameter(magFilter, magFilters);
  	      info.magFilter = magFilters[magFilter];
  	    }

  	    var wrapS = info.wrapS;
  	    var wrapT = info.wrapT;
  	    if ('wrap' in options) {
  	      var wrap = options.wrap;
  	      if (typeof wrap === 'string') {
  	        check$1.parameter(wrap, wrapModes);
  	        wrapS = wrapT = wrapModes[wrap];
  	      } else if (Array.isArray(wrap)) {
  	        check$1.parameter(wrap[0], wrapModes);
  	        check$1.parameter(wrap[1], wrapModes);
  	        wrapS = wrapModes[wrap[0]];
  	        wrapT = wrapModes[wrap[1]];
  	      }
  	    } else {
  	      if ('wrapS' in options) {
  	        var optWrapS = options.wrapS;
  	        check$1.parameter(optWrapS, wrapModes);
  	        wrapS = wrapModes[optWrapS];
  	      }
  	      if ('wrapT' in options) {
  	        var optWrapT = options.wrapT;
  	        check$1.parameter(optWrapT, wrapModes);
  	        wrapT = wrapModes[optWrapT];
  	      }
  	    }
  	    info.wrapS = wrapS;
  	    info.wrapT = wrapT;

  	    if ('anisotropic' in options) {
  	      var anisotropic = options.anisotropic;
  	      check$1(typeof anisotropic === 'number' &&
  	         anisotropic >= 1 && anisotropic <= limits.maxAnisotropic,
  	      'aniso samples must be between 1 and ');
  	      info.anisotropic = options.anisotropic;
  	    }

  	    if ('mipmap' in options) {
  	      var hasMipMap = false;
  	      switch (typeof options.mipmap) {
  	        case 'string':
  	          check$1.parameter(options.mipmap, mipmapHint,
  	            'invalid mipmap hint');
  	          info.mipmapHint = mipmapHint[options.mipmap];
  	          info.genMipmaps = true;
  	          hasMipMap = true;
  	          break

  	        case 'boolean':
  	          hasMipMap = info.genMipmaps = options.mipmap;
  	          break

  	        case 'object':
  	          check$1(Array.isArray(options.mipmap), 'invalid mipmap type');
  	          info.genMipmaps = false;
  	          hasMipMap = true;
  	          break

  	        default:
  	          check$1.raise('invalid mipmap type');
  	      }
  	      if (hasMipMap && !('min' in options)) {
  	        info.minFilter = GL_NEAREST_MIPMAP_NEAREST$1;
  	      }
  	    }
  	  }

  	  function setTexInfo (info, target) {
  	    gl.texParameteri(target, GL_TEXTURE_MIN_FILTER, info.minFilter);
  	    gl.texParameteri(target, GL_TEXTURE_MAG_FILTER, info.magFilter);
  	    gl.texParameteri(target, GL_TEXTURE_WRAP_S, info.wrapS);
  	    gl.texParameteri(target, GL_TEXTURE_WRAP_T, info.wrapT);
  	    if (extensions.ext_texture_filter_anisotropic) {
  	      gl.texParameteri(target, GL_TEXTURE_MAX_ANISOTROPY_EXT, info.anisotropic);
  	    }
  	    if (info.genMipmaps) {
  	      gl.hint(GL_GENERATE_MIPMAP_HINT, info.mipmapHint);
  	      gl.generateMipmap(target);
  	    }
  	  }

  	  // -------------------------------------------------------
  	  // Full texture object
  	  // -------------------------------------------------------
  	  var textureCount = 0;
  	  var textureSet = {};
  	  var numTexUnits = limits.maxTextureUnits;
  	  var textureUnits = Array(numTexUnits).map(function () {
  	    return null
  	  });

  	  function REGLTexture (target) {
  	    TexFlags.call(this);
  	    this.mipmask = 0;
  	    this.internalformat = GL_RGBA$1;

  	    this.id = textureCount++;

  	    this.refCount = 1;

  	    this.target = target;
  	    this.texture = gl.createTexture();

  	    this.unit = -1;
  	    this.bindCount = 0;

  	    this.texInfo = new TexInfo();

  	    if (config.profile) {
  	      this.stats = { size: 0 };
  	    }
  	  }

  	  function tempBind (texture) {
  	    gl.activeTexture(GL_TEXTURE0$1);
  	    gl.bindTexture(texture.target, texture.texture);
  	  }

  	  function tempRestore () {
  	    var prev = textureUnits[0];
  	    if (prev) {
  	      gl.bindTexture(prev.target, prev.texture);
  	    } else {
  	      gl.bindTexture(GL_TEXTURE_2D$1, null);
  	    }
  	  }

  	  function destroy (texture) {
  	    var handle = texture.texture;
  	    check$1(handle, 'must not double destroy texture');
  	    var unit = texture.unit;
  	    var target = texture.target;
  	    if (unit >= 0) {
  	      gl.activeTexture(GL_TEXTURE0$1 + unit);
  	      gl.bindTexture(target, null);
  	      textureUnits[unit] = null;
  	    }
  	    gl.deleteTexture(handle);
  	    texture.texture = null;
  	    texture.params = null;
  	    texture.pixels = null;
  	    texture.refCount = 0;
  	    delete textureSet[texture.id];
  	    stats.textureCount--;
  	  }

  	  extend(REGLTexture.prototype, {
  	    bind: function () {
  	      var texture = this;
  	      texture.bindCount += 1;
  	      var unit = texture.unit;
  	      if (unit < 0) {
  	        for (var i = 0; i < numTexUnits; ++i) {
  	          var other = textureUnits[i];
  	          if (other) {
  	            if (other.bindCount > 0) {
  	              continue
  	            }
  	            other.unit = -1;
  	          }
  	          textureUnits[i] = texture;
  	          unit = i;
  	          break
  	        }
  	        if (unit >= numTexUnits) {
  	          check$1.raise('insufficient number of texture units');
  	        }
  	        if (config.profile && stats.maxTextureUnits < (unit + 1)) {
  	          stats.maxTextureUnits = unit + 1; // +1, since the units are zero-based
  	        }
  	        texture.unit = unit;
  	        gl.activeTexture(GL_TEXTURE0$1 + unit);
  	        gl.bindTexture(texture.target, texture.texture);
  	      }
  	      return unit
  	    },

  	    unbind: function () {
  	      this.bindCount -= 1;
  	    },

  	    decRef: function () {
  	      if (--this.refCount <= 0) {
  	        destroy(this);
  	      }
  	    }
  	  });

  	  function createTexture2D (a, b) {
  	    var texture = new REGLTexture(GL_TEXTURE_2D$1);
  	    textureSet[texture.id] = texture;
  	    stats.textureCount++;

  	    function reglTexture2D (a, b) {
  	      var texInfo = texture.texInfo;
  	      TexInfo.call(texInfo);
  	      var mipData = allocMipMap();

  	      if (typeof a === 'number') {
  	        if (typeof b === 'number') {
  	          parseMipMapFromShape(mipData, a | 0, b | 0);
  	        } else {
  	          parseMipMapFromShape(mipData, a | 0, a | 0);
  	        }
  	      } else if (a) {
  	        check$1.type(a, 'object', 'invalid arguments to regl.texture');
  	        parseTexInfo(texInfo, a);
  	        parseMipMapFromObject(mipData, a);
  	      } else {
  	        // empty textures get assigned a default shape of 1x1
  	        parseMipMapFromShape(mipData, 1, 1);
  	      }

  	      if (texInfo.genMipmaps) {
  	        mipData.mipmask = (mipData.width << 1) - 1;
  	      }
  	      texture.mipmask = mipData.mipmask;

  	      copyFlags(texture, mipData);

  	      check$1.texture2D(texInfo, mipData, limits);
  	      texture.internalformat = mipData.internalformat;

  	      reglTexture2D.width = mipData.width;
  	      reglTexture2D.height = mipData.height;

  	      tempBind(texture);
  	      setMipMap(mipData, GL_TEXTURE_2D$1);
  	      setTexInfo(texInfo, GL_TEXTURE_2D$1);
  	      tempRestore();

  	      freeMipMap(mipData);

  	      if (config.profile) {
  	        texture.stats.size = getTextureSize(
  	          texture.internalformat,
  	          texture.type,
  	          mipData.width,
  	          mipData.height,
  	          texInfo.genMipmaps,
  	          false);
  	      }
  	      reglTexture2D.format = textureFormatsInvert[texture.internalformat];
  	      reglTexture2D.type = textureTypesInvert[texture.type];

  	      reglTexture2D.mag = magFiltersInvert[texInfo.magFilter];
  	      reglTexture2D.min = minFiltersInvert[texInfo.minFilter];

  	      reglTexture2D.wrapS = wrapModesInvert[texInfo.wrapS];
  	      reglTexture2D.wrapT = wrapModesInvert[texInfo.wrapT];

  	      return reglTexture2D
  	    }

  	    function subimage (image, x_, y_, level_) {
  	      check$1(!!image, 'must specify image data');

  	      var x = x_ | 0;
  	      var y = y_ | 0;
  	      var level = level_ | 0;

  	      var imageData = allocImage();
  	      copyFlags(imageData, texture);
  	      imageData.width = 0;
  	      imageData.height = 0;
  	      parseImage(imageData, image);
  	      imageData.width = imageData.width || ((texture.width >> level) - x);
  	      imageData.height = imageData.height || ((texture.height >> level) - y);

  	      check$1(
  	        texture.type === imageData.type &&
  	        texture.format === imageData.format &&
  	        texture.internalformat === imageData.internalformat,
  	        'incompatible format for texture.subimage');
  	      check$1(
  	        x >= 0 && y >= 0 &&
  	        x + imageData.width <= texture.width &&
  	        y + imageData.height <= texture.height,
  	        'texture.subimage write out of bounds');
  	      check$1(
  	        texture.mipmask & (1 << level),
  	        'missing mipmap data');
  	      check$1(
  	        imageData.data || imageData.element || imageData.needsCopy,
  	        'missing image data');

  	      tempBind(texture);
  	      setSubImage(imageData, GL_TEXTURE_2D$1, x, y, level);
  	      tempRestore();

  	      freeImage(imageData);

  	      return reglTexture2D
  	    }

  	    function resize (w_, h_) {
  	      var w = w_ | 0;
  	      var h = (h_ | 0) || w;
  	      if (w === texture.width && h === texture.height) {
  	        return reglTexture2D
  	      }

  	      reglTexture2D.width = texture.width = w;
  	      reglTexture2D.height = texture.height = h;

  	      tempBind(texture);

  	      for (var i = 0; texture.mipmask >> i; ++i) {
  	        var _w = w >> i;
  	        var _h = h >> i;
  	        if (!_w || !_h) break
  	        gl.texImage2D(
  	          GL_TEXTURE_2D$1,
  	          i,
  	          texture.format,
  	          _w,
  	          _h,
  	          0,
  	          texture.format,
  	          texture.type,
  	          null);
  	      }
  	      tempRestore();

  	      // also, recompute the texture size.
  	      if (config.profile) {
  	        texture.stats.size = getTextureSize(
  	          texture.internalformat,
  	          texture.type,
  	          w,
  	          h,
  	          false,
  	          false);
  	      }

  	      return reglTexture2D
  	    }

  	    reglTexture2D(a, b);

  	    reglTexture2D.subimage = subimage;
  	    reglTexture2D.resize = resize;
  	    reglTexture2D._reglType = 'texture2d';
  	    reglTexture2D._texture = texture;
  	    if (config.profile) {
  	      reglTexture2D.stats = texture.stats;
  	    }
  	    reglTexture2D.destroy = function () {
  	      texture.decRef();
  	    };

  	    return reglTexture2D
  	  }

  	  function createTextureCube (a0, a1, a2, a3, a4, a5) {
  	    var texture = new REGLTexture(GL_TEXTURE_CUBE_MAP$1);
  	    textureSet[texture.id] = texture;
  	    stats.cubeCount++;

  	    var faces = new Array(6);

  	    function reglTextureCube (a0, a1, a2, a3, a4, a5) {
  	      var i;
  	      var texInfo = texture.texInfo;
  	      TexInfo.call(texInfo);
  	      for (i = 0; i < 6; ++i) {
  	        faces[i] = allocMipMap();
  	      }

  	      if (typeof a0 === 'number' || !a0) {
  	        var s = (a0 | 0) || 1;
  	        for (i = 0; i < 6; ++i) {
  	          parseMipMapFromShape(faces[i], s, s);
  	        }
  	      } else if (typeof a0 === 'object') {
  	        if (a1) {
  	          parseMipMapFromObject(faces[0], a0);
  	          parseMipMapFromObject(faces[1], a1);
  	          parseMipMapFromObject(faces[2], a2);
  	          parseMipMapFromObject(faces[3], a3);
  	          parseMipMapFromObject(faces[4], a4);
  	          parseMipMapFromObject(faces[5], a5);
  	        } else {
  	          parseTexInfo(texInfo, a0);
  	          parseFlags(texture, a0);
  	          if ('faces' in a0) {
  	            var faceInput = a0.faces;
  	            check$1(Array.isArray(faceInput) && faceInput.length === 6,
  	              'cube faces must be a length 6 array');
  	            for (i = 0; i < 6; ++i) {
  	              check$1(typeof faceInput[i] === 'object' && !!faceInput[i],
  	                'invalid input for cube map face');
  	              copyFlags(faces[i], texture);
  	              parseMipMapFromObject(faces[i], faceInput[i]);
  	            }
  	          } else {
  	            for (i = 0; i < 6; ++i) {
  	              parseMipMapFromObject(faces[i], a0);
  	            }
  	          }
  	        }
  	      } else {
  	        check$1.raise('invalid arguments to cube map');
  	      }

  	      copyFlags(texture, faces[0]);
  	      check$1.optional(function () {
  	        if (!limits.npotTextureCube) {
  	          check$1(isPow2$1(texture.width) && isPow2$1(texture.height), 'your browser does not support non power or two texture dimensions');
  	        }
  	      });

  	      if (texInfo.genMipmaps) {
  	        texture.mipmask = (faces[0].width << 1) - 1;
  	      } else {
  	        texture.mipmask = faces[0].mipmask;
  	      }

  	      check$1.textureCube(texture, texInfo, faces, limits);
  	      texture.internalformat = faces[0].internalformat;

  	      reglTextureCube.width = faces[0].width;
  	      reglTextureCube.height = faces[0].height;

  	      tempBind(texture);
  	      for (i = 0; i < 6; ++i) {
  	        setMipMap(faces[i], GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + i);
  	      }
  	      setTexInfo(texInfo, GL_TEXTURE_CUBE_MAP$1);
  	      tempRestore();

  	      if (config.profile) {
  	        texture.stats.size = getTextureSize(
  	          texture.internalformat,
  	          texture.type,
  	          reglTextureCube.width,
  	          reglTextureCube.height,
  	          texInfo.genMipmaps,
  	          true);
  	      }

  	      reglTextureCube.format = textureFormatsInvert[texture.internalformat];
  	      reglTextureCube.type = textureTypesInvert[texture.type];

  	      reglTextureCube.mag = magFiltersInvert[texInfo.magFilter];
  	      reglTextureCube.min = minFiltersInvert[texInfo.minFilter];

  	      reglTextureCube.wrapS = wrapModesInvert[texInfo.wrapS];
  	      reglTextureCube.wrapT = wrapModesInvert[texInfo.wrapT];

  	      for (i = 0; i < 6; ++i) {
  	        freeMipMap(faces[i]);
  	      }

  	      return reglTextureCube
  	    }

  	    function subimage (face, image, x_, y_, level_) {
  	      check$1(!!image, 'must specify image data');
  	      check$1(typeof face === 'number' && face === (face | 0) &&
  	        face >= 0 && face < 6, 'invalid face');

  	      var x = x_ | 0;
  	      var y = y_ | 0;
  	      var level = level_ | 0;

  	      var imageData = allocImage();
  	      copyFlags(imageData, texture);
  	      imageData.width = 0;
  	      imageData.height = 0;
  	      parseImage(imageData, image);
  	      imageData.width = imageData.width || ((texture.width >> level) - x);
  	      imageData.height = imageData.height || ((texture.height >> level) - y);

  	      check$1(
  	        texture.type === imageData.type &&
  	        texture.format === imageData.format &&
  	        texture.internalformat === imageData.internalformat,
  	        'incompatible format for texture.subimage');
  	      check$1(
  	        x >= 0 && y >= 0 &&
  	        x + imageData.width <= texture.width &&
  	        y + imageData.height <= texture.height,
  	        'texture.subimage write out of bounds');
  	      check$1(
  	        texture.mipmask & (1 << level),
  	        'missing mipmap data');
  	      check$1(
  	        imageData.data || imageData.element || imageData.needsCopy,
  	        'missing image data');

  	      tempBind(texture);
  	      setSubImage(imageData, GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + face, x, y, level);
  	      tempRestore();

  	      freeImage(imageData);

  	      return reglTextureCube
  	    }

  	    function resize (radius_) {
  	      var radius = radius_ | 0;
  	      if (radius === texture.width) {
  	        return
  	      }

  	      reglTextureCube.width = texture.width = radius;
  	      reglTextureCube.height = texture.height = radius;

  	      tempBind(texture);
  	      for (var i = 0; i < 6; ++i) {
  	        for (var j = 0; texture.mipmask >> j; ++j) {
  	          gl.texImage2D(
  	            GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + i,
  	            j,
  	            texture.format,
  	            radius >> j,
  	            radius >> j,
  	            0,
  	            texture.format,
  	            texture.type,
  	            null);
  	        }
  	      }
  	      tempRestore();

  	      if (config.profile) {
  	        texture.stats.size = getTextureSize(
  	          texture.internalformat,
  	          texture.type,
  	          reglTextureCube.width,
  	          reglTextureCube.height,
  	          false,
  	          true);
  	      }

  	      return reglTextureCube
  	    }

  	    reglTextureCube(a0, a1, a2, a3, a4, a5);

  	    reglTextureCube.subimage = subimage;
  	    reglTextureCube.resize = resize;
  	    reglTextureCube._reglType = 'textureCube';
  	    reglTextureCube._texture = texture;
  	    if (config.profile) {
  	      reglTextureCube.stats = texture.stats;
  	    }
  	    reglTextureCube.destroy = function () {
  	      texture.decRef();
  	    };

  	    return reglTextureCube
  	  }

  	  // Called when regl is destroyed
  	  function destroyTextures () {
  	    for (var i = 0; i < numTexUnits; ++i) {
  	      gl.activeTexture(GL_TEXTURE0$1 + i);
  	      gl.bindTexture(GL_TEXTURE_2D$1, null);
  	      textureUnits[i] = null;
  	    }
  	    values(textureSet).forEach(destroy);

  	    stats.cubeCount = 0;
  	    stats.textureCount = 0;
  	  }

  	  if (config.profile) {
  	    stats.getTotalTextureSize = function () {
  	      var total = 0;
  	      Object.keys(textureSet).forEach(function (key) {
  	        total += textureSet[key].stats.size;
  	      });
  	      return total
  	    };
  	  }

  	  function restoreTextures () {
  	    for (var i = 0; i < numTexUnits; ++i) {
  	      var tex = textureUnits[i];
  	      if (tex) {
  	        tex.bindCount = 0;
  	        tex.unit = -1;
  	        textureUnits[i] = null;
  	      }
  	    }

  	    values(textureSet).forEach(function (texture) {
  	      texture.texture = gl.createTexture();
  	      gl.bindTexture(texture.target, texture.texture);
  	      for (var i = 0; i < 32; ++i) {
  	        if ((texture.mipmask & (1 << i)) === 0) {
  	          continue
  	        }
  	        if (texture.target === GL_TEXTURE_2D$1) {
  	          gl.texImage2D(GL_TEXTURE_2D$1,
  	            i,
  	            texture.internalformat,
  	            texture.width >> i,
  	            texture.height >> i,
  	            0,
  	            texture.internalformat,
  	            texture.type,
  	            null);
  	        } else {
  	          for (var j = 0; j < 6; ++j) {
  	            gl.texImage2D(GL_TEXTURE_CUBE_MAP_POSITIVE_X$1 + j,
  	              i,
  	              texture.internalformat,
  	              texture.width >> i,
  	              texture.height >> i,
  	              0,
  	              texture.internalformat,
  	              texture.type,
  	              null);
  	          }
  	        }
  	      }
  	      setTexInfo(texture.texInfo, texture.target);
  	    });
  	  }

  	  function refreshTextures () {
  	    for (var i = 0; i < numTexUnits; ++i) {
  	      var tex = textureUnits[i];
  	      if (tex) {
  	        tex.bindCount = 0;
  	        tex.unit = -1;
  	        textureUnits[i] = null;
  	      }
  	      gl.activeTexture(GL_TEXTURE0$1 + i);
  	      gl.bindTexture(GL_TEXTURE_2D$1, null);
  	      gl.bindTexture(GL_TEXTURE_CUBE_MAP$1, null);
  	    }
  	  }

  	  return {
  	    create2D: createTexture2D,
  	    createCube: createTextureCube,
  	    clear: destroyTextures,
  	    getTexture: function (wrapper) {
  	      return null
  	    },
  	    restore: restoreTextures,
  	    refresh: refreshTextures
  	  }
  	}

  	var GL_RENDERBUFFER = 0x8D41;

  	var GL_RGBA4$1 = 0x8056;
  	var GL_RGB5_A1$1 = 0x8057;
  	var GL_RGB565$1 = 0x8D62;
  	var GL_DEPTH_COMPONENT16 = 0x81A5;
  	var GL_STENCIL_INDEX8 = 0x8D48;
  	var GL_DEPTH_STENCIL$1 = 0x84F9;

  	var GL_SRGB8_ALPHA8_EXT = 0x8C43;

  	var GL_RGBA32F_EXT = 0x8814;

  	var GL_RGBA16F_EXT = 0x881A;
  	var GL_RGB16F_EXT = 0x881B;

  	var FORMAT_SIZES = [];

  	FORMAT_SIZES[GL_RGBA4$1] = 2;
  	FORMAT_SIZES[GL_RGB5_A1$1] = 2;
  	FORMAT_SIZES[GL_RGB565$1] = 2;

  	FORMAT_SIZES[GL_DEPTH_COMPONENT16] = 2;
  	FORMAT_SIZES[GL_STENCIL_INDEX8] = 1;
  	FORMAT_SIZES[GL_DEPTH_STENCIL$1] = 4;

  	FORMAT_SIZES[GL_SRGB8_ALPHA8_EXT] = 4;
  	FORMAT_SIZES[GL_RGBA32F_EXT] = 16;
  	FORMAT_SIZES[GL_RGBA16F_EXT] = 8;
  	FORMAT_SIZES[GL_RGB16F_EXT] = 6;

  	function getRenderbufferSize (format, width, height) {
  	  return FORMAT_SIZES[format] * width * height
  	}

  	var wrapRenderbuffers = function (gl, extensions, limits, stats, config) {
  	  var formatTypes = {
  	    'rgba4': GL_RGBA4$1,
  	    'rgb565': GL_RGB565$1,
  	    'rgb5 a1': GL_RGB5_A1$1,
  	    'depth': GL_DEPTH_COMPONENT16,
  	    'stencil': GL_STENCIL_INDEX8,
  	    'depth stencil': GL_DEPTH_STENCIL$1
  	  };

  	  if (extensions.ext_srgb) {
  	    formatTypes['srgba'] = GL_SRGB8_ALPHA8_EXT;
  	  }

  	  if (extensions.ext_color_buffer_half_float) {
  	    formatTypes['rgba16f'] = GL_RGBA16F_EXT;
  	    formatTypes['rgb16f'] = GL_RGB16F_EXT;
  	  }

  	  if (extensions.webgl_color_buffer_float) {
  	    formatTypes['rgba32f'] = GL_RGBA32F_EXT;
  	  }

  	  var formatTypesInvert = [];
  	  Object.keys(formatTypes).forEach(function (key) {
  	    var val = formatTypes[key];
  	    formatTypesInvert[val] = key;
  	  });

  	  var renderbufferCount = 0;
  	  var renderbufferSet = {};

  	  function REGLRenderbuffer (renderbuffer) {
  	    this.id = renderbufferCount++;
  	    this.refCount = 1;

  	    this.renderbuffer = renderbuffer;

  	    this.format = GL_RGBA4$1;
  	    this.width = 0;
  	    this.height = 0;

  	    if (config.profile) {
  	      this.stats = { size: 0 };
  	    }
  	  }

  	  REGLRenderbuffer.prototype.decRef = function () {
  	    if (--this.refCount <= 0) {
  	      destroy(this);
  	    }
  	  };

  	  function destroy (rb) {
  	    var handle = rb.renderbuffer;
  	    check$1(handle, 'must not double destroy renderbuffer');
  	    gl.bindRenderbuffer(GL_RENDERBUFFER, null);
  	    gl.deleteRenderbuffer(handle);
  	    rb.renderbuffer = null;
  	    rb.refCount = 0;
  	    delete renderbufferSet[rb.id];
  	    stats.renderbufferCount--;
  	  }

  	  function createRenderbuffer (a, b) {
  	    var renderbuffer = new REGLRenderbuffer(gl.createRenderbuffer());
  	    renderbufferSet[renderbuffer.id] = renderbuffer;
  	    stats.renderbufferCount++;

  	    function reglRenderbuffer (a, b) {
  	      var w = 0;
  	      var h = 0;
  	      var format = GL_RGBA4$1;

  	      if (typeof a === 'object' && a) {
  	        var options = a;
  	        if ('shape' in options) {
  	          var shape = options.shape;
  	          check$1(Array.isArray(shape) && shape.length >= 2,
  	            'invalid renderbuffer shape');
  	          w = shape[0] | 0;
  	          h = shape[1] | 0;
  	        } else {
  	          if ('radius' in options) {
  	            w = h = options.radius | 0;
  	          }
  	          if ('width' in options) {
  	            w = options.width | 0;
  	          }
  	          if ('height' in options) {
  	            h = options.height | 0;
  	          }
  	        }
  	        if ('format' in options) {
  	          check$1.parameter(options.format, formatTypes,
  	            'invalid renderbuffer format');
  	          format = formatTypes[options.format];
  	        }
  	      } else if (typeof a === 'number') {
  	        w = a | 0;
  	        if (typeof b === 'number') {
  	          h = b | 0;
  	        } else {
  	          h = w;
  	        }
  	      } else if (!a) {
  	        w = h = 1;
  	      } else {
  	        check$1.raise('invalid arguments to renderbuffer constructor');
  	      }

  	      // check shape
  	      check$1(
  	        w > 0 && h > 0 &&
  	        w <= limits.maxRenderbufferSize && h <= limits.maxRenderbufferSize,
  	        'invalid renderbuffer size');

  	      if (w === renderbuffer.width &&
  	          h === renderbuffer.height &&
  	          format === renderbuffer.format) {
  	        return
  	      }

  	      reglRenderbuffer.width = renderbuffer.width = w;
  	      reglRenderbuffer.height = renderbuffer.height = h;
  	      renderbuffer.format = format;

  	      gl.bindRenderbuffer(GL_RENDERBUFFER, renderbuffer.renderbuffer);
  	      gl.renderbufferStorage(GL_RENDERBUFFER, format, w, h);

  	      check$1(
  	        gl.getError() === 0,
  	        'invalid render buffer format');

  	      if (config.profile) {
  	        renderbuffer.stats.size = getRenderbufferSize(renderbuffer.format, renderbuffer.width, renderbuffer.height);
  	      }
  	      reglRenderbuffer.format = formatTypesInvert[renderbuffer.format];

  	      return reglRenderbuffer
  	    }

  	    function resize (w_, h_) {
  	      var w = w_ | 0;
  	      var h = (h_ | 0) || w;

  	      if (w === renderbuffer.width && h === renderbuffer.height) {
  	        return reglRenderbuffer
  	      }

  	      // check shape
  	      check$1(
  	        w > 0 && h > 0 &&
  	        w <= limits.maxRenderbufferSize && h <= limits.maxRenderbufferSize,
  	        'invalid renderbuffer size');

  	      reglRenderbuffer.width = renderbuffer.width = w;
  	      reglRenderbuffer.height = renderbuffer.height = h;

  	      gl.bindRenderbuffer(GL_RENDERBUFFER, renderbuffer.renderbuffer);
  	      gl.renderbufferStorage(GL_RENDERBUFFER, renderbuffer.format, w, h);

  	      check$1(
  	        gl.getError() === 0,
  	        'invalid render buffer format');

  	      // also, recompute size.
  	      if (config.profile) {
  	        renderbuffer.stats.size = getRenderbufferSize(
  	          renderbuffer.format, renderbuffer.width, renderbuffer.height);
  	      }

  	      return reglRenderbuffer
  	    }

  	    reglRenderbuffer(a, b);

  	    reglRenderbuffer.resize = resize;
  	    reglRenderbuffer._reglType = 'renderbuffer';
  	    reglRenderbuffer._renderbuffer = renderbuffer;
  	    if (config.profile) {
  	      reglRenderbuffer.stats = renderbuffer.stats;
  	    }
  	    reglRenderbuffer.destroy = function () {
  	      renderbuffer.decRef();
  	    };

  	    return reglRenderbuffer
  	  }

  	  if (config.profile) {
  	    stats.getTotalRenderbufferSize = function () {
  	      var total = 0;
  	      Object.keys(renderbufferSet).forEach(function (key) {
  	        total += renderbufferSet[key].stats.size;
  	      });
  	      return total
  	    };
  	  }

  	  function restoreRenderbuffers () {
  	    values(renderbufferSet).forEach(function (rb) {
  	      rb.renderbuffer = gl.createRenderbuffer();
  	      gl.bindRenderbuffer(GL_RENDERBUFFER, rb.renderbuffer);
  	      gl.renderbufferStorage(GL_RENDERBUFFER, rb.format, rb.width, rb.height);
  	    });
  	    gl.bindRenderbuffer(GL_RENDERBUFFER, null);
  	  }

  	  return {
  	    create: createRenderbuffer,
  	    clear: function () {
  	      values(renderbufferSet).forEach(destroy);
  	    },
  	    restore: restoreRenderbuffers
  	  }
  	};

  	// We store these constants so that the minifier can inline them
  	var GL_FRAMEBUFFER$1 = 0x8D40;
  	var GL_RENDERBUFFER$1 = 0x8D41;

  	var GL_TEXTURE_2D$2 = 0x0DE1;
  	var GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 = 0x8515;

  	var GL_COLOR_ATTACHMENT0$1 = 0x8CE0;
  	var GL_DEPTH_ATTACHMENT = 0x8D00;
  	var GL_STENCIL_ATTACHMENT = 0x8D20;
  	var GL_DEPTH_STENCIL_ATTACHMENT = 0x821A;

  	var GL_FRAMEBUFFER_COMPLETE$1 = 0x8CD5;
  	var GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT = 0x8CD6;
  	var GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT = 0x8CD7;
  	var GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS = 0x8CD9;
  	var GL_FRAMEBUFFER_UNSUPPORTED = 0x8CDD;

  	var GL_HALF_FLOAT_OES$2 = 0x8D61;
  	var GL_UNSIGNED_BYTE$6 = 0x1401;
  	var GL_FLOAT$5 = 0x1406;

  	var GL_RGB$1 = 0x1907;
  	var GL_RGBA$2 = 0x1908;

  	var GL_DEPTH_COMPONENT$1 = 0x1902;

  	var colorTextureFormatEnums = [
  	  GL_RGB$1,
  	  GL_RGBA$2
  	];

  	// for every texture format, store
  	// the number of channels
  	var textureFormatChannels = [];
  	textureFormatChannels[GL_RGBA$2] = 4;
  	textureFormatChannels[GL_RGB$1] = 3;

  	// for every texture type, store
  	// the size in bytes.
  	var textureTypeSizes = [];
  	textureTypeSizes[GL_UNSIGNED_BYTE$6] = 1;
  	textureTypeSizes[GL_FLOAT$5] = 4;
  	textureTypeSizes[GL_HALF_FLOAT_OES$2] = 2;

  	var GL_RGBA4$2 = 0x8056;
  	var GL_RGB5_A1$2 = 0x8057;
  	var GL_RGB565$2 = 0x8D62;
  	var GL_DEPTH_COMPONENT16$1 = 0x81A5;
  	var GL_STENCIL_INDEX8$1 = 0x8D48;
  	var GL_DEPTH_STENCIL$2 = 0x84F9;

  	var GL_SRGB8_ALPHA8_EXT$1 = 0x8C43;

  	var GL_RGBA32F_EXT$1 = 0x8814;

  	var GL_RGBA16F_EXT$1 = 0x881A;
  	var GL_RGB16F_EXT$1 = 0x881B;

  	var colorRenderbufferFormatEnums = [
  	  GL_RGBA4$2,
  	  GL_RGB5_A1$2,
  	  GL_RGB565$2,
  	  GL_SRGB8_ALPHA8_EXT$1,
  	  GL_RGBA16F_EXT$1,
  	  GL_RGB16F_EXT$1,
  	  GL_RGBA32F_EXT$1
  	];

  	var statusCode = {};
  	statusCode[GL_FRAMEBUFFER_COMPLETE$1] = 'complete';
  	statusCode[GL_FRAMEBUFFER_INCOMPLETE_ATTACHMENT] = 'incomplete attachment';
  	statusCode[GL_FRAMEBUFFER_INCOMPLETE_DIMENSIONS] = 'incomplete dimensions';
  	statusCode[GL_FRAMEBUFFER_INCOMPLETE_MISSING_ATTACHMENT] = 'incomplete, missing attachment';
  	statusCode[GL_FRAMEBUFFER_UNSUPPORTED] = 'unsupported';

  	function wrapFBOState (
  	  gl,
  	  extensions,
  	  limits,
  	  textureState,
  	  renderbufferState,
  	  stats) {
  	  var framebufferState = {
  	    cur: null,
  	    next: null,
  	    dirty: false,
  	    setFBO: null
  	  };

  	  var colorTextureFormats = ['rgba'];
  	  var colorRenderbufferFormats = ['rgba4', 'rgb565', 'rgb5 a1'];

  	  if (extensions.ext_srgb) {
  	    colorRenderbufferFormats.push('srgba');
  	  }

  	  if (extensions.ext_color_buffer_half_float) {
  	    colorRenderbufferFormats.push('rgba16f', 'rgb16f');
  	  }

  	  if (extensions.webgl_color_buffer_float) {
  	    colorRenderbufferFormats.push('rgba32f');
  	  }

  	  var colorTypes = ['uint8'];
  	  if (extensions.oes_texture_half_float) {
  	    colorTypes.push('half float', 'float16');
  	  }
  	  if (extensions.oes_texture_float) {
  	    colorTypes.push('float', 'float32');
  	  }

  	  function FramebufferAttachment (target, texture, renderbuffer) {
  	    this.target = target;
  	    this.texture = texture;
  	    this.renderbuffer = renderbuffer;

  	    var w = 0;
  	    var h = 0;
  	    if (texture) {
  	      w = texture.width;
  	      h = texture.height;
  	    } else if (renderbuffer) {
  	      w = renderbuffer.width;
  	      h = renderbuffer.height;
  	    }
  	    this.width = w;
  	    this.height = h;
  	  }

  	  function decRef (attachment) {
  	    if (attachment) {
  	      if (attachment.texture) {
  	        attachment.texture._texture.decRef();
  	      }
  	      if (attachment.renderbuffer) {
  	        attachment.renderbuffer._renderbuffer.decRef();
  	      }
  	    }
  	  }

  	  function incRefAndCheckShape (attachment, width, height) {
  	    if (!attachment) {
  	      return
  	    }
  	    if (attachment.texture) {
  	      var texture = attachment.texture._texture;
  	      var tw = Math.max(1, texture.width);
  	      var th = Math.max(1, texture.height);
  	      check$1(tw === width && th === height,
  	        'inconsistent width/height for supplied texture');
  	      texture.refCount += 1;
  	    } else {
  	      var renderbuffer = attachment.renderbuffer._renderbuffer;
  	      check$1(
  	        renderbuffer.width === width && renderbuffer.height === height,
  	        'inconsistent width/height for renderbuffer');
  	      renderbuffer.refCount += 1;
  	    }
  	  }

  	  function attach (location, attachment) {
  	    if (attachment) {
  	      if (attachment.texture) {
  	        gl.framebufferTexture2D(
  	          GL_FRAMEBUFFER$1,
  	          location,
  	          attachment.target,
  	          attachment.texture._texture.texture,
  	          0);
  	      } else {
  	        gl.framebufferRenderbuffer(
  	          GL_FRAMEBUFFER$1,
  	          location,
  	          GL_RENDERBUFFER$1,
  	          attachment.renderbuffer._renderbuffer.renderbuffer);
  	      }
  	    }
  	  }

  	  function parseAttachment (attachment) {
  	    var target = GL_TEXTURE_2D$2;
  	    var texture = null;
  	    var renderbuffer = null;

  	    var data = attachment;
  	    if (typeof attachment === 'object') {
  	      data = attachment.data;
  	      if ('target' in attachment) {
  	        target = attachment.target | 0;
  	      }
  	    }

  	    check$1.type(data, 'function', 'invalid attachment data');

  	    var type = data._reglType;
  	    if (type === 'texture2d') {
  	      texture = data;
  	      check$1(target === GL_TEXTURE_2D$2);
  	    } else if (type === 'textureCube') {
  	      texture = data;
  	      check$1(
  	        target >= GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 &&
  	        target < GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 + 6,
  	        'invalid cube map target');
  	    } else if (type === 'renderbuffer') {
  	      renderbuffer = data;
  	      target = GL_RENDERBUFFER$1;
  	    } else {
  	      check$1.raise('invalid regl object for attachment');
  	    }

  	    return new FramebufferAttachment(target, texture, renderbuffer)
  	  }

  	  function allocAttachment (
  	    width,
  	    height,
  	    isTexture,
  	    format,
  	    type) {
  	    if (isTexture) {
  	      var texture = textureState.create2D({
  	        width: width,
  	        height: height,
  	        format: format,
  	        type: type
  	      });
  	      texture._texture.refCount = 0;
  	      return new FramebufferAttachment(GL_TEXTURE_2D$2, texture, null)
  	    } else {
  	      var rb = renderbufferState.create({
  	        width: width,
  	        height: height,
  	        format: format
  	      });
  	      rb._renderbuffer.refCount = 0;
  	      return new FramebufferAttachment(GL_RENDERBUFFER$1, null, rb)
  	    }
  	  }

  	  function unwrapAttachment (attachment) {
  	    return attachment && (attachment.texture || attachment.renderbuffer)
  	  }

  	  function resizeAttachment (attachment, w, h) {
  	    if (attachment) {
  	      if (attachment.texture) {
  	        attachment.texture.resize(w, h);
  	      } else if (attachment.renderbuffer) {
  	        attachment.renderbuffer.resize(w, h);
  	      }
  	      attachment.width = w;
  	      attachment.height = h;
  	    }
  	  }

  	  var framebufferCount = 0;
  	  var framebufferSet = {};

  	  function REGLFramebuffer () {
  	    this.id = framebufferCount++;
  	    framebufferSet[this.id] = this;

  	    this.framebuffer = gl.createFramebuffer();
  	    this.width = 0;
  	    this.height = 0;

  	    this.colorAttachments = [];
  	    this.depthAttachment = null;
  	    this.stencilAttachment = null;
  	    this.depthStencilAttachment = null;
  	  }

  	  function decFBORefs (framebuffer) {
  	    framebuffer.colorAttachments.forEach(decRef);
  	    decRef(framebuffer.depthAttachment);
  	    decRef(framebuffer.stencilAttachment);
  	    decRef(framebuffer.depthStencilAttachment);
  	  }

  	  function destroy (framebuffer) {
  	    var handle = framebuffer.framebuffer;
  	    check$1(handle, 'must not double destroy framebuffer');
  	    gl.deleteFramebuffer(handle);
  	    framebuffer.framebuffer = null;
  	    stats.framebufferCount--;
  	    delete framebufferSet[framebuffer.id];
  	  }

  	  function updateFramebuffer (framebuffer) {
  	    var i;

  	    gl.bindFramebuffer(GL_FRAMEBUFFER$1, framebuffer.framebuffer);
  	    var colorAttachments = framebuffer.colorAttachments;
  	    for (i = 0; i < colorAttachments.length; ++i) {
  	      attach(GL_COLOR_ATTACHMENT0$1 + i, colorAttachments[i]);
  	    }
  	    for (i = colorAttachments.length; i < limits.maxColorAttachments; ++i) {
  	      gl.framebufferTexture2D(
  	        GL_FRAMEBUFFER$1,
  	        GL_COLOR_ATTACHMENT0$1 + i,
  	        GL_TEXTURE_2D$2,
  	        null,
  	        0);
  	    }

  	    gl.framebufferTexture2D(
  	      GL_FRAMEBUFFER$1,
  	      GL_DEPTH_STENCIL_ATTACHMENT,
  	      GL_TEXTURE_2D$2,
  	      null,
  	      0);
  	    gl.framebufferTexture2D(
  	      GL_FRAMEBUFFER$1,
  	      GL_DEPTH_ATTACHMENT,
  	      GL_TEXTURE_2D$2,
  	      null,
  	      0);
  	    gl.framebufferTexture2D(
  	      GL_FRAMEBUFFER$1,
  	      GL_STENCIL_ATTACHMENT,
  	      GL_TEXTURE_2D$2,
  	      null,
  	      0);

  	    attach(GL_DEPTH_ATTACHMENT, framebuffer.depthAttachment);
  	    attach(GL_STENCIL_ATTACHMENT, framebuffer.stencilAttachment);
  	    attach(GL_DEPTH_STENCIL_ATTACHMENT, framebuffer.depthStencilAttachment);

  	    // Check status code
  	    var status = gl.checkFramebufferStatus(GL_FRAMEBUFFER$1);
  	    if (!gl.isContextLost() && status !== GL_FRAMEBUFFER_COMPLETE$1) {
  	      check$1.raise('framebuffer configuration not supported, status = ' +
  	        statusCode[status]);
  	    }

  	    gl.bindFramebuffer(GL_FRAMEBUFFER$1, framebufferState.next ? framebufferState.next.framebuffer : null);
  	    framebufferState.cur = framebufferState.next;

  	    // FIXME: Clear error code here.  This is a work around for a bug in
  	    // headless-gl
  	    gl.getError();
  	  }

  	  function createFBO (a0, a1) {
  	    var framebuffer = new REGLFramebuffer();
  	    stats.framebufferCount++;

  	    function reglFramebuffer (a, b) {
  	      var i;

  	      check$1(framebufferState.next !== framebuffer,
  	        'can not update framebuffer which is currently in use');

  	      var width = 0;
  	      var height = 0;

  	      var needsDepth = true;
  	      var needsStencil = true;

  	      var colorBuffer = null;
  	      var colorTexture = true;
  	      var colorFormat = 'rgba';
  	      var colorType = 'uint8';
  	      var colorCount = 1;

  	      var depthBuffer = null;
  	      var stencilBuffer = null;
  	      var depthStencilBuffer = null;
  	      var depthStencilTexture = false;

  	      if (typeof a === 'number') {
  	        width = a | 0;
  	        height = (b | 0) || width;
  	      } else if (!a) {
  	        width = height = 1;
  	      } else {
  	        check$1.type(a, 'object', 'invalid arguments for framebuffer');
  	        var options = a;

  	        if ('shape' in options) {
  	          var shape = options.shape;
  	          check$1(Array.isArray(shape) && shape.length >= 2,
  	            'invalid shape for framebuffer');
  	          width = shape[0];
  	          height = shape[1];
  	        } else {
  	          if ('radius' in options) {
  	            width = height = options.radius;
  	          }
  	          if ('width' in options) {
  	            width = options.width;
  	          }
  	          if ('height' in options) {
  	            height = options.height;
  	          }
  	        }

  	        if ('color' in options ||
  	            'colors' in options) {
  	          colorBuffer =
  	            options.color ||
  	            options.colors;
  	          if (Array.isArray(colorBuffer)) {
  	            check$1(
  	              colorBuffer.length === 1 || extensions.webgl_draw_buffers,
  	              'multiple render targets not supported');
  	          }
  	        }

  	        if (!colorBuffer) {
  	          if ('colorCount' in options) {
  	            colorCount = options.colorCount | 0;
  	            check$1(colorCount > 0, 'invalid color buffer count');
  	          }

  	          if ('colorTexture' in options) {
  	            colorTexture = !!options.colorTexture;
  	            colorFormat = 'rgba4';
  	          }

  	          if ('colorType' in options) {
  	            colorType = options.colorType;
  	            if (!colorTexture) {
  	              if (colorType === 'half float' || colorType === 'float16') {
  	                check$1(extensions.ext_color_buffer_half_float,
  	                  'you must enable EXT_color_buffer_half_float to use 16-bit render buffers');
  	                colorFormat = 'rgba16f';
  	              } else if (colorType === 'float' || colorType === 'float32') {
  	                check$1(extensions.webgl_color_buffer_float,
  	                  'you must enable WEBGL_color_buffer_float in order to use 32-bit floating point renderbuffers');
  	                colorFormat = 'rgba32f';
  	              }
  	            } else {
  	              check$1(extensions.oes_texture_float ||
  	                !(colorType === 'float' || colorType === 'float32'),
  	              'you must enable OES_texture_float in order to use floating point framebuffer objects');
  	              check$1(extensions.oes_texture_half_float ||
  	                !(colorType === 'half float' || colorType === 'float16'),
  	              'you must enable OES_texture_half_float in order to use 16-bit floating point framebuffer objects');
  	            }
  	            check$1.oneOf(colorType, colorTypes, 'invalid color type');
  	          }

  	          if ('colorFormat' in options) {
  	            colorFormat = options.colorFormat;
  	            if (colorTextureFormats.indexOf(colorFormat) >= 0) {
  	              colorTexture = true;
  	            } else if (colorRenderbufferFormats.indexOf(colorFormat) >= 0) {
  	              colorTexture = false;
  	            } else {
  	              check$1.optional(function () {
  	                if (colorTexture) {
  	                  check$1.oneOf(
  	                    options.colorFormat, colorTextureFormats,
  	                    'invalid color format for texture');
  	                } else {
  	                  check$1.oneOf(
  	                    options.colorFormat, colorRenderbufferFormats,
  	                    'invalid color format for renderbuffer');
  	                }
  	              });
  	            }
  	          }
  	        }

  	        if ('depthTexture' in options || 'depthStencilTexture' in options) {
  	          depthStencilTexture = !!(options.depthTexture ||
  	            options.depthStencilTexture);
  	          check$1(!depthStencilTexture || extensions.webgl_depth_texture,
  	            'webgl_depth_texture extension not supported');
  	        }

  	        if ('depth' in options) {
  	          if (typeof options.depth === 'boolean') {
  	            needsDepth = options.depth;
  	          } else {
  	            depthBuffer = options.depth;
  	            needsStencil = false;
  	          }
  	        }

  	        if ('stencil' in options) {
  	          if (typeof options.stencil === 'boolean') {
  	            needsStencil = options.stencil;
  	          } else {
  	            stencilBuffer = options.stencil;
  	            needsDepth = false;
  	          }
  	        }

  	        if ('depthStencil' in options) {
  	          if (typeof options.depthStencil === 'boolean') {
  	            needsDepth = needsStencil = options.depthStencil;
  	          } else {
  	            depthStencilBuffer = options.depthStencil;
  	            needsDepth = false;
  	            needsStencil = false;
  	          }
  	        }
  	      }

  	      // parse attachments
  	      var colorAttachments = null;
  	      var depthAttachment = null;
  	      var stencilAttachment = null;
  	      var depthStencilAttachment = null;

  	      // Set up color attachments
  	      if (Array.isArray(colorBuffer)) {
  	        colorAttachments = colorBuffer.map(parseAttachment);
  	      } else if (colorBuffer) {
  	        colorAttachments = [parseAttachment(colorBuffer)];
  	      } else {
  	        colorAttachments = new Array(colorCount);
  	        for (i = 0; i < colorCount; ++i) {
  	          colorAttachments[i] = allocAttachment(
  	            width,
  	            height,
  	            colorTexture,
  	            colorFormat,
  	            colorType);
  	        }
  	      }

  	      check$1(extensions.webgl_draw_buffers || colorAttachments.length <= 1,
  	        'you must enable the WEBGL_draw_buffers extension in order to use multiple color buffers.');
  	      check$1(colorAttachments.length <= limits.maxColorAttachments,
  	        'too many color attachments, not supported');

  	      width = width || colorAttachments[0].width;
  	      height = height || colorAttachments[0].height;

  	      if (depthBuffer) {
  	        depthAttachment = parseAttachment(depthBuffer);
  	      } else if (needsDepth && !needsStencil) {
  	        depthAttachment = allocAttachment(
  	          width,
  	          height,
  	          depthStencilTexture,
  	          'depth',
  	          'uint32');
  	      }

  	      if (stencilBuffer) {
  	        stencilAttachment = parseAttachment(stencilBuffer);
  	      } else if (needsStencil && !needsDepth) {
  	        stencilAttachment = allocAttachment(
  	          width,
  	          height,
  	          false,
  	          'stencil',
  	          'uint8');
  	      }

  	      if (depthStencilBuffer) {
  	        depthStencilAttachment = parseAttachment(depthStencilBuffer);
  	      } else if (!depthBuffer && !stencilBuffer && needsStencil && needsDepth) {
  	        depthStencilAttachment = allocAttachment(
  	          width,
  	          height,
  	          depthStencilTexture,
  	          'depth stencil',
  	          'depth stencil');
  	      }

  	      check$1(
  	        (!!depthBuffer) + (!!stencilBuffer) + (!!depthStencilBuffer) <= 1,
  	        'invalid framebuffer configuration, can specify exactly one depth/stencil attachment');

  	      var commonColorAttachmentSize = null;

  	      for (i = 0; i < colorAttachments.length; ++i) {
  	        incRefAndCheckShape(colorAttachments[i], width, height);
  	        check$1(!colorAttachments[i] ||
  	          (colorAttachments[i].texture &&
  	            colorTextureFormatEnums.indexOf(colorAttachments[i].texture._texture.format) >= 0) ||
  	          (colorAttachments[i].renderbuffer &&
  	            colorRenderbufferFormatEnums.indexOf(colorAttachments[i].renderbuffer._renderbuffer.format) >= 0),
  	        'framebuffer color attachment ' + i + ' is invalid');

  	        if (colorAttachments[i] && colorAttachments[i].texture) {
  	          var colorAttachmentSize =
  	              textureFormatChannels[colorAttachments[i].texture._texture.format] *
  	              textureTypeSizes[colorAttachments[i].texture._texture.type];

  	          if (commonColorAttachmentSize === null) {
  	            commonColorAttachmentSize = colorAttachmentSize;
  	          } else {
  	            // We need to make sure that all color attachments have the same number of bitplanes
  	            // (that is, the same numer of bits per pixel)
  	            // This is required by the GLES2.0 standard. See the beginning of Chapter 4 in that document.
  	            check$1(commonColorAttachmentSize === colorAttachmentSize,
  	              'all color attachments much have the same number of bits per pixel.');
  	          }
  	        }
  	      }
  	      incRefAndCheckShape(depthAttachment, width, height);
  	      check$1(!depthAttachment ||
  	        (depthAttachment.texture &&
  	          depthAttachment.texture._texture.format === GL_DEPTH_COMPONENT$1) ||
  	        (depthAttachment.renderbuffer &&
  	          depthAttachment.renderbuffer._renderbuffer.format === GL_DEPTH_COMPONENT16$1),
  	      'invalid depth attachment for framebuffer object');
  	      incRefAndCheckShape(stencilAttachment, width, height);
  	      check$1(!stencilAttachment ||
  	        (stencilAttachment.renderbuffer &&
  	          stencilAttachment.renderbuffer._renderbuffer.format === GL_STENCIL_INDEX8$1),
  	      'invalid stencil attachment for framebuffer object');
  	      incRefAndCheckShape(depthStencilAttachment, width, height);
  	      check$1(!depthStencilAttachment ||
  	        (depthStencilAttachment.texture &&
  	          depthStencilAttachment.texture._texture.format === GL_DEPTH_STENCIL$2) ||
  	        (depthStencilAttachment.renderbuffer &&
  	          depthStencilAttachment.renderbuffer._renderbuffer.format === GL_DEPTH_STENCIL$2),
  	      'invalid depth-stencil attachment for framebuffer object');

  	      // decrement references
  	      decFBORefs(framebuffer);

  	      framebuffer.width = width;
  	      framebuffer.height = height;

  	      framebuffer.colorAttachments = colorAttachments;
  	      framebuffer.depthAttachment = depthAttachment;
  	      framebuffer.stencilAttachment = stencilAttachment;
  	      framebuffer.depthStencilAttachment = depthStencilAttachment;

  	      reglFramebuffer.color = colorAttachments.map(unwrapAttachment);
  	      reglFramebuffer.depth = unwrapAttachment(depthAttachment);
  	      reglFramebuffer.stencil = unwrapAttachment(stencilAttachment);
  	      reglFramebuffer.depthStencil = unwrapAttachment(depthStencilAttachment);

  	      reglFramebuffer.width = framebuffer.width;
  	      reglFramebuffer.height = framebuffer.height;

  	      updateFramebuffer(framebuffer);

  	      return reglFramebuffer
  	    }

  	    function resize (w_, h_) {
  	      check$1(framebufferState.next !== framebuffer,
  	        'can not resize a framebuffer which is currently in use');

  	      var w = Math.max(w_ | 0, 1);
  	      var h = Math.max((h_ | 0) || w, 1);
  	      if (w === framebuffer.width && h === framebuffer.height) {
  	        return reglFramebuffer
  	      }

  	      // resize all buffers
  	      var colorAttachments = framebuffer.colorAttachments;
  	      for (var i = 0; i < colorAttachments.length; ++i) {
  	        resizeAttachment(colorAttachments[i], w, h);
  	      }
  	      resizeAttachment(framebuffer.depthAttachment, w, h);
  	      resizeAttachment(framebuffer.stencilAttachment, w, h);
  	      resizeAttachment(framebuffer.depthStencilAttachment, w, h);

  	      framebuffer.width = reglFramebuffer.width = w;
  	      framebuffer.height = reglFramebuffer.height = h;

  	      updateFramebuffer(framebuffer);

  	      return reglFramebuffer
  	    }

  	    reglFramebuffer(a0, a1);

  	    return extend(reglFramebuffer, {
  	      resize: resize,
  	      _reglType: 'framebuffer',
  	      _framebuffer: framebuffer,
  	      destroy: function () {
  	        destroy(framebuffer);
  	        decFBORefs(framebuffer);
  	      },
  	      use: function (block) {
  	        framebufferState.setFBO({
  	          framebuffer: reglFramebuffer
  	        }, block);
  	      }
  	    })
  	  }

  	  function createCubeFBO (options) {
  	    var faces = Array(6);

  	    function reglFramebufferCube (a) {
  	      var i;

  	      check$1(faces.indexOf(framebufferState.next) < 0,
  	        'can not update framebuffer which is currently in use');

  	      var params = {
  	        color: null
  	      };

  	      var radius = 0;

  	      var colorBuffer = null;
  	      var colorFormat = 'rgba';
  	      var colorType = 'uint8';
  	      var colorCount = 1;

  	      if (typeof a === 'number') {
  	        radius = a | 0;
  	      } else if (!a) {
  	        radius = 1;
  	      } else {
  	        check$1.type(a, 'object', 'invalid arguments for framebuffer');
  	        var options = a;

  	        if ('shape' in options) {
  	          var shape = options.shape;
  	          check$1(
  	            Array.isArray(shape) && shape.length >= 2,
  	            'invalid shape for framebuffer');
  	          check$1(
  	            shape[0] === shape[1],
  	            'cube framebuffer must be square');
  	          radius = shape[0];
  	        } else {
  	          if ('radius' in options) {
  	            radius = options.radius | 0;
  	          }
  	          if ('width' in options) {
  	            radius = options.width | 0;
  	            if ('height' in options) {
  	              check$1(options.height === radius, 'must be square');
  	            }
  	          } else if ('height' in options) {
  	            radius = options.height | 0;
  	          }
  	        }

  	        if ('color' in options ||
  	            'colors' in options) {
  	          colorBuffer =
  	            options.color ||
  	            options.colors;
  	          if (Array.isArray(colorBuffer)) {
  	            check$1(
  	              colorBuffer.length === 1 || extensions.webgl_draw_buffers,
  	              'multiple render targets not supported');
  	          }
  	        }

  	        if (!colorBuffer) {
  	          if ('colorCount' in options) {
  	            colorCount = options.colorCount | 0;
  	            check$1(colorCount > 0, 'invalid color buffer count');
  	          }

  	          if ('colorType' in options) {
  	            check$1.oneOf(
  	              options.colorType, colorTypes,
  	              'invalid color type');
  	            colorType = options.colorType;
  	          }

  	          if ('colorFormat' in options) {
  	            colorFormat = options.colorFormat;
  	            check$1.oneOf(
  	              options.colorFormat, colorTextureFormats,
  	              'invalid color format for texture');
  	          }
  	        }

  	        if ('depth' in options) {
  	          params.depth = options.depth;
  	        }

  	        if ('stencil' in options) {
  	          params.stencil = options.stencil;
  	        }

  	        if ('depthStencil' in options) {
  	          params.depthStencil = options.depthStencil;
  	        }
  	      }

  	      var colorCubes;
  	      if (colorBuffer) {
  	        if (Array.isArray(colorBuffer)) {
  	          colorCubes = [];
  	          for (i = 0; i < colorBuffer.length; ++i) {
  	            colorCubes[i] = colorBuffer[i];
  	          }
  	        } else {
  	          colorCubes = [ colorBuffer ];
  	        }
  	      } else {
  	        colorCubes = Array(colorCount);
  	        var cubeMapParams = {
  	          radius: radius,
  	          format: colorFormat,
  	          type: colorType
  	        };
  	        for (i = 0; i < colorCount; ++i) {
  	          colorCubes[i] = textureState.createCube(cubeMapParams);
  	        }
  	      }

  	      // Check color cubes
  	      params.color = Array(colorCubes.length);
  	      for (i = 0; i < colorCubes.length; ++i) {
  	        var cube = colorCubes[i];
  	        check$1(
  	          typeof cube === 'function' && cube._reglType === 'textureCube',
  	          'invalid cube map');
  	        radius = radius || cube.width;
  	        check$1(
  	          cube.width === radius && cube.height === radius,
  	          'invalid cube map shape');
  	        params.color[i] = {
  	          target: GL_TEXTURE_CUBE_MAP_POSITIVE_X$2,
  	          data: colorCubes[i]
  	        };
  	      }

  	      for (i = 0; i < 6; ++i) {
  	        for (var j = 0; j < colorCubes.length; ++j) {
  	          params.color[j].target = GL_TEXTURE_CUBE_MAP_POSITIVE_X$2 + i;
  	        }
  	        // reuse depth-stencil attachments across all cube maps
  	        if (i > 0) {
  	          params.depth = faces[0].depth;
  	          params.stencil = faces[0].stencil;
  	          params.depthStencil = faces[0].depthStencil;
  	        }
  	        if (faces[i]) {
  	          (faces[i])(params);
  	        } else {
  	          faces[i] = createFBO(params);
  	        }
  	      }

  	      return extend(reglFramebufferCube, {
  	        width: radius,
  	        height: radius,
  	        color: colorCubes
  	      })
  	    }

  	    function resize (radius_) {
  	      var i;
  	      var radius = radius_ | 0;
  	      check$1(radius > 0 && radius <= limits.maxCubeMapSize,
  	        'invalid radius for cube fbo');

  	      if (radius === reglFramebufferCube.width) {
  	        return reglFramebufferCube
  	      }

  	      var colors = reglFramebufferCube.color;
  	      for (i = 0; i < colors.length; ++i) {
  	        colors[i].resize(radius);
  	      }

  	      for (i = 0; i < 6; ++i) {
  	        faces[i].resize(radius);
  	      }

  	      reglFramebufferCube.width = reglFramebufferCube.height = radius;

  	      return reglFramebufferCube
  	    }

  	    reglFramebufferCube(options);

  	    return extend(reglFramebufferCube, {
  	      faces: faces,
  	      resize: resize,
  	      _reglType: 'framebufferCube',
  	      destroy: function () {
  	        faces.forEach(function (f) {
  	          f.destroy();
  	        });
  	      }
  	    })
  	  }

  	  function restoreFramebuffers () {
  	    framebufferState.cur = null;
  	    framebufferState.next = null;
  	    framebufferState.dirty = true;
  	    values(framebufferSet).forEach(function (fb) {
  	      fb.framebuffer = gl.createFramebuffer();
  	      updateFramebuffer(fb);
  	    });
  	  }

  	  return extend(framebufferState, {
  	    getFramebuffer: function (object) {
  	      if (typeof object === 'function' && object._reglType === 'framebuffer') {
  	        var fbo = object._framebuffer;
  	        if (fbo instanceof REGLFramebuffer) {
  	          return fbo
  	        }
  	      }
  	      return null
  	    },
  	    create: createFBO,
  	    createCube: createCubeFBO,
  	    clear: function () {
  	      values(framebufferSet).forEach(destroy);
  	    },
  	    restore: restoreFramebuffers
  	  })
  	}

  	var GL_FLOAT$6 = 5126;
  	var GL_ARRAY_BUFFER$1 = 34962;
  	var GL_ELEMENT_ARRAY_BUFFER$1 = 34963;

  	var VAO_OPTIONS = [
  	  'attributes',
  	  'elements',
  	  'offset',
  	  'count',
  	  'primitive',
  	  'instances'
  	];

  	function AttributeRecord () {
  	  this.state = 0;

  	  this.x = 0.0;
  	  this.y = 0.0;
  	  this.z = 0.0;
  	  this.w = 0.0;

  	  this.buffer = null;
  	  this.size = 0;
  	  this.normalized = false;
  	  this.type = GL_FLOAT$6;
  	  this.offset = 0;
  	  this.stride = 0;
  	  this.divisor = 0;
  	}

  	function wrapAttributeState (
  	  gl,
  	  extensions,
  	  limits,
  	  stats,
  	  bufferState,
  	  elementState,
  	  drawState) {
  	  var NUM_ATTRIBUTES = limits.maxAttributes;
  	  var attributeBindings = new Array(NUM_ATTRIBUTES);
  	  for (var i = 0; i < NUM_ATTRIBUTES; ++i) {
  	    attributeBindings[i] = new AttributeRecord();
  	  }
  	  var vaoCount = 0;
  	  var vaoSet = {};

  	  var state = {
  	    Record: AttributeRecord,
  	    scope: {},
  	    state: attributeBindings,
  	    currentVAO: null,
  	    targetVAO: null,
  	    restore: extVAO() ? restoreVAO : function () {},
  	    createVAO: createVAO,
  	    getVAO: getVAO,
  	    destroyBuffer: destroyBuffer,
  	    setVAO: extVAO() ? setVAOEXT : setVAOEmulated,
  	    clear: extVAO() ? destroyVAOEXT : function () {}
  	  };

  	  function destroyBuffer (buffer) {
  	    for (var i = 0; i < attributeBindings.length; ++i) {
  	      var record = attributeBindings[i];
  	      if (record.buffer === buffer) {
  	        gl.disableVertexAttribArray(i);
  	        record.buffer = null;
  	      }
  	    }
  	  }

  	  function extVAO () {
  	    return extensions.oes_vertex_array_object
  	  }

  	  function extInstanced () {
  	    return extensions.angle_instanced_arrays
  	  }

  	  function getVAO (vao) {
  	    if (typeof vao === 'function' && vao._vao) {
  	      return vao._vao
  	    }
  	    return null
  	  }

  	  function setVAOEXT (vao) {
  	    if (vao === state.currentVAO) {
  	      return
  	    }
  	    var ext = extVAO();
  	    if (vao) {
  	      ext.bindVertexArrayOES(vao.vao);
  	    } else {
  	      ext.bindVertexArrayOES(null);
  	    }
  	    state.currentVAO = vao;
  	  }

  	  function setVAOEmulated (vao) {
  	    if (vao === state.currentVAO) {
  	      return
  	    }
  	    if (vao) {
  	      vao.bindAttrs();
  	    } else {
  	      var exti = extInstanced();
  	      for (var i = 0; i < attributeBindings.length; ++i) {
  	        var binding = attributeBindings[i];
  	        if (binding.buffer) {
  	          gl.enableVertexAttribArray(i);
  	          binding.buffer.bind();
  	          gl.vertexAttribPointer(i, binding.size, binding.type, binding.normalized, binding.stride, binding.offfset);
  	          if (exti && binding.divisor) {
  	            exti.vertexAttribDivisorANGLE(i, binding.divisor);
  	          }
  	        } else {
  	          gl.disableVertexAttribArray(i);
  	          gl.vertexAttrib4f(i, binding.x, binding.y, binding.z, binding.w);
  	        }
  	      }
  	      if (drawState.elements) {
  	        gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER$1, drawState.elements.buffer.buffer);
  	      } else {
  	        gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER$1, null);
  	      }
  	    }
  	    state.currentVAO = vao;
  	  }

  	  function destroyVAOEXT () {
  	    values(vaoSet).forEach(function (vao) {
  	      vao.destroy();
  	    });
  	  }

  	  function REGLVAO () {
  	    this.id = ++vaoCount;
  	    this.attributes = [];
  	    this.elements = null;
  	    this.ownsElements = false;
  	    this.count = 0;
  	    this.offset = 0;
  	    this.instances = -1;
  	    this.primitive = 4;
  	    var extension = extVAO();
  	    if (extension) {
  	      this.vao = extension.createVertexArrayOES();
  	    } else {
  	      this.vao = null;
  	    }
  	    vaoSet[this.id] = this;
  	    this.buffers = [];
  	  }

  	  REGLVAO.prototype.bindAttrs = function () {
  	    var exti = extInstanced();
  	    var attributes = this.attributes;
  	    for (var i = 0; i < attributes.length; ++i) {
  	      var attr = attributes[i];
  	      if (attr.buffer) {
  	        gl.enableVertexAttribArray(i);
  	        gl.bindBuffer(GL_ARRAY_BUFFER$1, attr.buffer.buffer);
  	        gl.vertexAttribPointer(i, attr.size, attr.type, attr.normalized, attr.stride, attr.offset);
  	        if (exti && attr.divisor) {
  	          exti.vertexAttribDivisorANGLE(i, attr.divisor);
  	        }
  	      } else {
  	        gl.disableVertexAttribArray(i);
  	        gl.vertexAttrib4f(i, attr.x, attr.y, attr.z, attr.w);
  	      }
  	    }
  	    for (var j = attributes.length; j < NUM_ATTRIBUTES; ++j) {
  	      gl.disableVertexAttribArray(j);
  	    }
  	    var elements = elementState.getElements(this.elements);
  	    if (elements) {
  	      gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER$1, elements.buffer.buffer);
  	    } else {
  	      gl.bindBuffer(GL_ELEMENT_ARRAY_BUFFER$1, null);
  	    }
  	  };

  	  REGLVAO.prototype.refresh = function () {
  	    var ext = extVAO();
  	    if (ext) {
  	      ext.bindVertexArrayOES(this.vao);
  	      this.bindAttrs();
  	      state.currentVAO = null;
  	      ext.bindVertexArrayOES(null);
  	    }
  	  };

  	  REGLVAO.prototype.destroy = function () {
  	    if (this.vao) {
  	      var extension = extVAO();
  	      if (this === state.currentVAO) {
  	        state.currentVAO = null;
  	        extension.bindVertexArrayOES(null);
  	      }
  	      extension.deleteVertexArrayOES(this.vao);
  	      this.vao = null;
  	    }
  	    if (this.ownsElements) {
  	      this.elements.destroy();
  	      this.elements = null;
  	      this.ownsElements = false;
  	    }
  	    if (vaoSet[this.id]) {
  	      delete vaoSet[this.id];
  	      stats.vaoCount -= 1;
  	    }
  	  };

  	  function restoreVAO () {
  	    var ext = extVAO();
  	    if (ext) {
  	      values(vaoSet).forEach(function (vao) {
  	        vao.refresh();
  	      });
  	    }
  	  }

  	  function createVAO (_attr) {
  	    var vao = new REGLVAO();
  	    stats.vaoCount += 1;

  	    function updateVAO (options) {
  	      var attributes;
  	      if (Array.isArray(options)) {
  	        attributes = options;
  	        if (vao.elements && vao.ownsElements) {
  	          vao.elements.destroy();
  	        }
  	        vao.elements = null;
  	        vao.ownsElements = false;
  	        vao.offset = 0;
  	        vao.count = 0;
  	        vao.instances = -1;
  	        vao.primitive = 4;
  	      } else {
  	        check$1(typeof options === 'object', 'invalid arguments for create vao');
  	        check$1('attributes' in options, 'must specify attributes for vao');
  	        if (options.elements) {
  	          var elements = options.elements;
  	          if (vao.ownsElements) {
  	            if (typeof elements === 'function' && elements._reglType === 'elements') {
  	              vao.elements.destroy();
  	              vao.ownsElements = false;
  	            } else {
  	              vao.elements(elements);
  	              vao.ownsElements = false;
  	            }
  	          } else if (elementState.getElements(options.elements)) {
  	            vao.elements = options.elements;
  	            vao.ownsElements = false;
  	          } else {
  	            vao.elements = elementState.create(options.elements);
  	            vao.ownsElements = true;
  	          }
  	        } else {
  	          vao.elements = null;
  	          vao.ownsElements = false;
  	        }
  	        attributes = options.attributes;

  	        // set default vao
  	        vao.offset = 0;
  	        vao.count = -1;
  	        vao.instances = -1;
  	        vao.primitive = 4;

  	        // copy element properties
  	        if (vao.elements) {
  	          vao.count = vao.elements._elements.vertCount;
  	          vao.primitive = vao.elements._elements.primType;
  	        }

  	        if ('offset' in options) {
  	          vao.offset = options.offset | 0;
  	        }
  	        if ('count' in options) {
  	          vao.count = options.count | 0;
  	        }
  	        if ('instances' in options) {
  	          vao.instances = options.instances | 0;
  	        }
  	        if ('primitive' in options) {
  	          check$1(options.primitive in primTypes, 'bad primitive type: ' + options.primitive);
  	          vao.primitive = primTypes[options.primitive];
  	        }

  	        check$1.optional(() => {
  	          var keys = Object.keys(options);
  	          for (var i = 0; i < keys.length; ++i) {
  	            check$1(VAO_OPTIONS.indexOf(keys[i]) >= 0, 'invalid option for vao: "' + keys[i] + '" valid options are ' + VAO_OPTIONS);
  	          }
  	        });
  	        check$1(Array.isArray(attributes), 'attributes must be an array');
  	      }

  	      check$1(attributes.length < NUM_ATTRIBUTES, 'too many attributes');
  	      check$1(attributes.length > 0, 'must specify at least one attribute');

  	      var bufUpdated = {};
  	      var nattributes = vao.attributes;
  	      nattributes.length = attributes.length;
  	      for (var i = 0; i < attributes.length; ++i) {
  	        var spec = attributes[i];
  	        var rec = nattributes[i] = new AttributeRecord();
  	        var data = spec.data || spec;
  	        if (Array.isArray(data) || isTypedArray(data) || isNDArrayLike(data)) {
  	          var buf;
  	          if (vao.buffers[i]) {
  	            buf = vao.buffers[i];
  	            if (isTypedArray(data) && buf._buffer.byteLength >= data.byteLength) {
  	              buf.subdata(data);
  	            } else {
  	              buf.destroy();
  	              vao.buffers[i] = null;
  	            }
  	          }
  	          if (!vao.buffers[i]) {
  	            buf = vao.buffers[i] = bufferState.create(spec, GL_ARRAY_BUFFER$1, false, true);
  	          }
  	          rec.buffer = bufferState.getBuffer(buf);
  	          rec.size = rec.buffer.dimension | 0;
  	          rec.normalized = false;
  	          rec.type = rec.buffer.dtype;
  	          rec.offset = 0;
  	          rec.stride = 0;
  	          rec.divisor = 0;
  	          rec.state = 1;
  	          bufUpdated[i] = 1;
  	        } else if (bufferState.getBuffer(spec)) {
  	          rec.buffer = bufferState.getBuffer(spec);
  	          rec.size = rec.buffer.dimension | 0;
  	          rec.normalized = false;
  	          rec.type = rec.buffer.dtype;
  	          rec.offset = 0;
  	          rec.stride = 0;
  	          rec.divisor = 0;
  	          rec.state = 1;
  	        } else if (bufferState.getBuffer(spec.buffer)) {
  	          rec.buffer = bufferState.getBuffer(spec.buffer);
  	          rec.size = ((+spec.size) || rec.buffer.dimension) | 0;
  	          rec.normalized = !!spec.normalized || false;
  	          if ('type' in spec) {
  	            check$1.parameter(spec.type, glTypes, 'invalid buffer type');
  	            rec.type = glTypes[spec.type];
  	          } else {
  	            rec.type = rec.buffer.dtype;
  	          }
  	          rec.offset = (spec.offset || 0) | 0;
  	          rec.stride = (spec.stride || 0) | 0;
  	          rec.divisor = (spec.divisor || 0) | 0;
  	          rec.state = 1;

  	          check$1(rec.size >= 1 && rec.size <= 4, 'size must be between 1 and 4');
  	          check$1(rec.offset >= 0, 'invalid offset');
  	          check$1(rec.stride >= 0 && rec.stride <= 255, 'stride must be between 0 and 255');
  	          check$1(rec.divisor >= 0, 'divisor must be positive');
  	          check$1(!rec.divisor || !!extensions.angle_instanced_arrays, 'ANGLE_instanced_arrays must be enabled to use divisor');
  	        } else if ('x' in spec) {
  	          check$1(i > 0, 'first attribute must not be a constant');
  	          rec.x = +spec.x || 0;
  	          rec.y = +spec.y || 0;
  	          rec.z = +spec.z || 0;
  	          rec.w = +spec.w || 0;
  	          rec.state = 2;
  	        } else {
  	          check$1(false, 'invalid attribute spec for location ' + i);
  	        }
  	      }

  	      // retire unused buffers
  	      for (var j = 0; j < vao.buffers.length; ++j) {
  	        if (!bufUpdated[j] && vao.buffers[j]) {
  	          vao.buffers[j].destroy();
  	          vao.buffers[j] = null;
  	        }
  	      }

  	      vao.refresh();
  	      return updateVAO
  	    }

  	    updateVAO.destroy = function () {
  	      for (var j = 0; j < vao.buffers.length; ++j) {
  	        if (vao.buffers[j]) {
  	          vao.buffers[j].destroy();
  	        }
  	      }
  	      vao.buffers.length = 0;

  	      if (vao.ownsElements) {
  	        vao.elements.destroy();
  	        vao.elements = null;
  	        vao.ownsElements = false;
  	      }

  	      vao.destroy();
  	    };

  	    updateVAO._vao = vao;
  	    updateVAO._reglType = 'vao';

  	    return updateVAO(_attr)
  	  }

  	  return state
  	}

  	var GL_FRAGMENT_SHADER = 35632;
  	var GL_VERTEX_SHADER = 35633;

  	var GL_ACTIVE_UNIFORMS = 0x8B86;
  	var GL_ACTIVE_ATTRIBUTES = 0x8B89;

  	function wrapShaderState (gl, stringStore, stats, config) {
  	  // ===================================================
  	  // glsl compilation and linking
  	  // ===================================================
  	  var fragShaders = {};
  	  var vertShaders = {};

  	  function ActiveInfo (name, id, location, info) {
  	    this.name = name;
  	    this.id = id;
  	    this.location = location;
  	    this.info = info;
  	  }

  	  function insertActiveInfo (list, info) {
  	    for (var i = 0; i < list.length; ++i) {
  	      if (list[i].id === info.id) {
  	        list[i].location = info.location;
  	        return
  	      }
  	    }
  	    list.push(info);
  	  }

  	  function getShader (type, id, command) {
  	    var cache = type === GL_FRAGMENT_SHADER ? fragShaders : vertShaders;
  	    var shader = cache[id];

  	    if (!shader) {
  	      var source = stringStore.str(id);
  	      shader = gl.createShader(type);
  	      gl.shaderSource(shader, source);
  	      gl.compileShader(shader);
  	      check$1.shaderError(gl, shader, source, type, command);
  	      cache[id] = shader;
  	    }

  	    return shader
  	  }

  	  // ===================================================
  	  // program linking
  	  // ===================================================
  	  var programCache = {};
  	  var programList = [];

  	  var PROGRAM_COUNTER = 0;

  	  function REGLProgram (fragId, vertId) {
  	    this.id = PROGRAM_COUNTER++;
  	    this.fragId = fragId;
  	    this.vertId = vertId;
  	    this.program = null;
  	    this.uniforms = [];
  	    this.attributes = [];
  	    this.refCount = 1;

  	    if (config.profile) {
  	      this.stats = {
  	        uniformsCount: 0,
  	        attributesCount: 0
  	      };
  	    }
  	  }

  	  function linkProgram (desc, command, attributeLocations) {
  	    var i, info;

  	    // -------------------------------
  	    // compile & link
  	    // -------------------------------
  	    var fragShader = getShader(GL_FRAGMENT_SHADER, desc.fragId);
  	    var vertShader = getShader(GL_VERTEX_SHADER, desc.vertId);

  	    var program = desc.program = gl.createProgram();
  	    gl.attachShader(program, fragShader);
  	    gl.attachShader(program, vertShader);
  	    if (attributeLocations) {
  	      for (i = 0; i < attributeLocations.length; ++i) {
  	        var binding = attributeLocations[i];
  	        gl.bindAttribLocation(program, binding[0], binding[1]);
  	      }
  	    }

  	    gl.linkProgram(program);
  	    check$1.linkError(
  	      gl,
  	      program,
  	      stringStore.str(desc.fragId),
  	      stringStore.str(desc.vertId),
  	      command);

  	    // -------------------------------
  	    // grab uniforms
  	    // -------------------------------
  	    var numUniforms = gl.getProgramParameter(program, GL_ACTIVE_UNIFORMS);
  	    if (config.profile) {
  	      desc.stats.uniformsCount = numUniforms;
  	    }
  	    var uniforms = desc.uniforms;
  	    for (i = 0; i < numUniforms; ++i) {
  	      info = gl.getActiveUniform(program, i);
  	      if (info) {
  	        if (info.size > 1) {
  	          for (var j = 0; j < info.size; ++j) {
  	            var name = info.name.replace('[0]', '[' + j + ']');
  	            insertActiveInfo(uniforms, new ActiveInfo(
  	              name,
  	              stringStore.id(name),
  	              gl.getUniformLocation(program, name),
  	              info));
  	          }
  	        }
  	        var uniName = info.name;
  	        if (info.size > 1) {
  	          uniName = uniName.replace('[0]', '');
  	        }
  	        insertActiveInfo(uniforms, new ActiveInfo(
  	          uniName,
  	          stringStore.id(uniName),
  	          gl.getUniformLocation(program, uniName),
  	          info));
  	      }
  	    }

  	    // -------------------------------
  	    // grab attributes
  	    // -------------------------------
  	    var numAttributes = gl.getProgramParameter(program, GL_ACTIVE_ATTRIBUTES);
  	    if (config.profile) {
  	      desc.stats.attributesCount = numAttributes;
  	    }

  	    var attributes = desc.attributes;
  	    for (i = 0; i < numAttributes; ++i) {
  	      info = gl.getActiveAttrib(program, i);
  	      if (info) {
  	        insertActiveInfo(attributes, new ActiveInfo(
  	          info.name,
  	          stringStore.id(info.name),
  	          gl.getAttribLocation(program, info.name),
  	          info));
  	      }
  	    }
  	  }

  	  if (config.profile) {
  	    stats.getMaxUniformsCount = function () {
  	      var m = 0;
  	      programList.forEach(function (desc) {
  	        if (desc.stats.uniformsCount > m) {
  	          m = desc.stats.uniformsCount;
  	        }
  	      });
  	      return m
  	    };

  	    stats.getMaxAttributesCount = function () {
  	      var m = 0;
  	      programList.forEach(function (desc) {
  	        if (desc.stats.attributesCount > m) {
  	          m = desc.stats.attributesCount;
  	        }
  	      });
  	      return m
  	    };
  	  }

  	  function restoreShaders () {
  	    fragShaders = {};
  	    vertShaders = {};
  	    for (var i = 0; i < programList.length; ++i) {
  	      linkProgram(programList[i], null, programList[i].attributes.map(function (info) {
  	        return [info.location, info.name]
  	      }));
  	    }
  	  }

  	  return {
  	    clear: function () {
  	      var deleteShader = gl.deleteShader.bind(gl);
  	      values(fragShaders).forEach(deleteShader);
  	      fragShaders = {};
  	      values(vertShaders).forEach(deleteShader);
  	      vertShaders = {};

  	      programList.forEach(function (desc) {
  	        gl.deleteProgram(desc.program);
  	      });
  	      programList.length = 0;
  	      programCache = {};

  	      stats.shaderCount = 0;
  	    },

  	    program: function (vertId, fragId, command, attribLocations) {
  	      check$1.command(vertId >= 0, 'missing vertex shader', command);
  	      check$1.command(fragId >= 0, 'missing fragment shader', command);

  	      var cache = programCache[fragId];
  	      if (!cache) {
  	        cache = programCache[fragId] = {};
  	      }
  	      var prevProgram = cache[vertId];
  	      if (prevProgram) {
  	        prevProgram.refCount++;
  	        if (!attribLocations) {
  	          return prevProgram
  	        }
  	      }
  	      var program = new REGLProgram(fragId, vertId);
  	      stats.shaderCount++;
  	      linkProgram(program, command, attribLocations);
  	      if (!prevProgram) {
  	        cache[vertId] = program;
  	      }
  	      programList.push(program);
  	      return extend(program, {
  	        destroy: function () {
  	          program.refCount--;
  	          if (program.refCount <= 0) {
  	            gl.deleteProgram(program.program);
  	            var idx = programList.indexOf(program);
  	            programList.splice(idx, 1);
  	            stats.shaderCount--;
  	          }
  	          // no program is linked to this vert anymore
  	          if (cache[program.vertId].refCount <= 0) {
  	            gl.deleteShader(vertShaders[program.vertId]);
  	            delete vertShaders[program.vertId];
  	            delete programCache[program.fragId][program.vertId];
  	          }
  	          // no program is linked to this frag anymore
  	          if (!Object.keys(programCache[program.fragId]).length) {
  	            gl.deleteShader(fragShaders[program.fragId]);
  	            delete fragShaders[program.fragId];
  	            delete programCache[program.fragId];
  	          }
  	        }
  	      })
  	    },

  	    restore: restoreShaders,

  	    shader: getShader,

  	    frag: -1,
  	    vert: -1
  	  }
  	}

  	var GL_RGBA$3 = 6408;
  	var GL_UNSIGNED_BYTE$7 = 5121;
  	var GL_PACK_ALIGNMENT = 0x0D05;
  	var GL_FLOAT$7 = 0x1406; // 5126

  	function wrapReadPixels (
  	  gl,
  	  framebufferState,
  	  reglPoll,
  	  context,
  	  glAttributes,
  	  extensions,
  	  limits) {
  	  function readPixelsImpl (input) {
  	    var type;
  	    if (framebufferState.next === null) {
  	      check$1(
  	        glAttributes.preserveDrawingBuffer,
  	        'you must create a webgl context with "preserveDrawingBuffer":true in order to read pixels from the drawing buffer');
  	      type = GL_UNSIGNED_BYTE$7;
  	    } else {
  	      check$1(
  	        framebufferState.next.colorAttachments[0].texture !== null,
  	        'You cannot read from a renderbuffer');
  	      type = framebufferState.next.colorAttachments[0].texture._texture.type;

  	      check$1.optional(function () {
  	        if (extensions.oes_texture_float) {
  	          check$1(
  	            type === GL_UNSIGNED_BYTE$7 || type === GL_FLOAT$7,
  	            'Reading from a framebuffer is only allowed for the types \'uint8\' and \'float\'');

  	          if (type === GL_FLOAT$7) {
  	            check$1(limits.readFloat, 'Reading \'float\' values is not permitted in your browser. For a fallback, please see: https://www.npmjs.com/package/glsl-read-float');
  	          }
  	        } else {
  	          check$1(
  	            type === GL_UNSIGNED_BYTE$7,
  	            'Reading from a framebuffer is only allowed for the type \'uint8\'');
  	        }
  	      });
  	    }

  	    var x = 0;
  	    var y = 0;
  	    var width = context.framebufferWidth;
  	    var height = context.framebufferHeight;
  	    var data = null;

  	    if (isTypedArray(input)) {
  	      data = input;
  	    } else if (input) {
  	      check$1.type(input, 'object', 'invalid arguments to regl.read()');
  	      x = input.x | 0;
  	      y = input.y | 0;
  	      check$1(
  	        x >= 0 && x < context.framebufferWidth,
  	        'invalid x offset for regl.read');
  	      check$1(
  	        y >= 0 && y < context.framebufferHeight,
  	        'invalid y offset for regl.read');
  	      width = (input.width || (context.framebufferWidth - x)) | 0;
  	      height = (input.height || (context.framebufferHeight - y)) | 0;
  	      data = input.data || null;
  	    }

  	    // sanity check input.data
  	    if (data) {
  	      if (type === GL_UNSIGNED_BYTE$7) {
  	        check$1(
  	          data instanceof Uint8Array,
  	          'buffer must be \'Uint8Array\' when reading from a framebuffer of type \'uint8\'');
  	      } else if (type === GL_FLOAT$7) {
  	        check$1(
  	          data instanceof Float32Array,
  	          'buffer must be \'Float32Array\' when reading from a framebuffer of type \'float\'');
  	      }
  	    }

  	    check$1(
  	      width > 0 && width + x <= context.framebufferWidth,
  	      'invalid width for read pixels');
  	    check$1(
  	      height > 0 && height + y <= context.framebufferHeight,
  	      'invalid height for read pixels');

  	    // Update WebGL state
  	    reglPoll();

  	    // Compute size
  	    var size = width * height * 4;

  	    // Allocate data
  	    if (!data) {
  	      if (type === GL_UNSIGNED_BYTE$7) {
  	        data = new Uint8Array(size);
  	      } else if (type === GL_FLOAT$7) {
  	        data = data || new Float32Array(size);
  	      }
  	    }

  	    // Type check
  	    check$1.isTypedArray(data, 'data buffer for regl.read() must be a typedarray');
  	    check$1(data.byteLength >= size, 'data buffer for regl.read() too small');

  	    // Run read pixels
  	    gl.pixelStorei(GL_PACK_ALIGNMENT, 4);
  	    gl.readPixels(x, y, width, height, GL_RGBA$3,
  	      type,
  	      data);

  	    return data
  	  }

  	  function readPixelsFBO (options) {
  	    var result;
  	    framebufferState.setFBO({
  	      framebuffer: options.framebuffer
  	    }, function () {
  	      result = readPixelsImpl(options);
  	    });
  	    return result
  	  }

  	  function readPixels (options) {
  	    if (!options || !('framebuffer' in options)) {
  	      return readPixelsImpl(options)
  	    } else {
  	      return readPixelsFBO(options)
  	    }
  	  }

  	  return readPixels
  	}

  	function slice (x) {
  	  return Array.prototype.slice.call(x)
  	}

  	function join (x) {
  	  return slice(x).join('')
  	}

  	function createEnvironment () {
  	  // Unique variable id counter
  	  var varCounter = 0;

  	  // Linked values are passed from this scope into the generated code block
  	  // Calling link() passes a value into the generated scope and returns
  	  // the variable name which it is bound to
  	  var linkedNames = [];
  	  var linkedValues = [];
  	  function link (value) {
  	    for (var i = 0; i < linkedValues.length; ++i) {
  	      if (linkedValues[i] === value) {
  	        return linkedNames[i]
  	      }
  	    }

  	    var name = 'g' + (varCounter++);
  	    linkedNames.push(name);
  	    linkedValues.push(value);
  	    return name
  	  }

  	  // create a code block
  	  function block () {
  	    var code = [];
  	    function push () {
  	      code.push.apply(code, slice(arguments));
  	    }

  	    var vars = [];
  	    function def () {
  	      var name = 'v' + (varCounter++);
  	      vars.push(name);

  	      if (arguments.length > 0) {
  	        code.push(name, '=');
  	        code.push.apply(code, slice(arguments));
  	        code.push(';');
  	      }

  	      return name
  	    }

  	    return extend(push, {
  	      def: def,
  	      toString: function () {
  	        return join([
  	          (vars.length > 0 ? 'var ' + vars.join(',') + ';' : ''),
  	          join(code)
  	        ])
  	      }
  	    })
  	  }

  	  function scope () {
  	    var entry = block();
  	    var exit = block();

  	    var entryToString = entry.toString;
  	    var exitToString = exit.toString;

  	    function save (object, prop) {
  	      exit(object, prop, '=', entry.def(object, prop), ';');
  	    }

  	    return extend(function () {
  	      entry.apply(entry, slice(arguments));
  	    }, {
  	      def: entry.def,
  	      entry: entry,
  	      exit: exit,
  	      save: save,
  	      set: function (object, prop, value) {
  	        save(object, prop);
  	        entry(object, prop, '=', value, ';');
  	      },
  	      toString: function () {
  	        return entryToString() + exitToString()
  	      }
  	    })
  	  }

  	  function conditional () {
  	    var pred = join(arguments);
  	    var thenBlock = scope();
  	    var elseBlock = scope();

  	    var thenToString = thenBlock.toString;
  	    var elseToString = elseBlock.toString;

  	    return extend(thenBlock, {
  	      then: function () {
  	        thenBlock.apply(thenBlock, slice(arguments));
  	        return this
  	      },
  	      else: function () {
  	        elseBlock.apply(elseBlock, slice(arguments));
  	        return this
  	      },
  	      toString: function () {
  	        var elseClause = elseToString();
  	        if (elseClause) {
  	          elseClause = 'else{' + elseClause + '}';
  	        }
  	        return join([
  	          'if(', pred, '){',
  	          thenToString(),
  	          '}', elseClause
  	        ])
  	      }
  	    })
  	  }

  	  // procedure list
  	  var globalBlock = block();
  	  var procedures = {};
  	  function proc (name, count) {
  	    var args = [];
  	    function arg () {
  	      var name = 'a' + args.length;
  	      args.push(name);
  	      return name
  	    }

  	    count = count || 0;
  	    for (var i = 0; i < count; ++i) {
  	      arg();
  	    }

  	    var body = scope();
  	    var bodyToString = body.toString;

  	    var result = procedures[name] = extend(body, {
  	      arg: arg,
  	      toString: function () {
  	        return join([
  	          'function(', args.join(), '){',
  	          bodyToString(),
  	          '}'
  	        ])
  	      }
  	    });

  	    return result
  	  }

  	  function compile () {
  	    var code = ['"use strict";',
  	      globalBlock,
  	      'return {'];
  	    Object.keys(procedures).forEach(function (name) {
  	      code.push('"', name, '":', procedures[name].toString(), ',');
  	    });
  	    code.push('}');
  	    var src = join(code)
  	      .replace(/;/g, ';\n')
  	      .replace(/}/g, '}\n')
  	      .replace(/{/g, '{\n');
  	    var proc = Function.apply(null, linkedNames.concat(src));
  	    return proc.apply(null, linkedValues)
  	  }

  	  return {
  	    global: globalBlock,
  	    link: link,
  	    block: block,
  	    proc: proc,
  	    scope: scope,
  	    cond: conditional,
  	    compile: compile
  	  }
  	}

  	// "cute" names for vector components
  	var CUTE_COMPONENTS = 'xyzw'.split('');

  	var GL_UNSIGNED_BYTE$8 = 5121;

  	var ATTRIB_STATE_POINTER = 1;
  	var ATTRIB_STATE_CONSTANT = 2;

  	var DYN_FUNC$1 = 0;
  	var DYN_PROP$1 = 1;
  	var DYN_CONTEXT$1 = 2;
  	var DYN_STATE$1 = 3;
  	var DYN_THUNK = 4;
  	var DYN_CONSTANT$1 = 5;
  	var DYN_ARRAY$1 = 6;

  	var S_DITHER = 'dither';
  	var S_BLEND_ENABLE = 'blend.enable';
  	var S_BLEND_COLOR = 'blend.color';
  	var S_BLEND_EQUATION = 'blend.equation';
  	var S_BLEND_FUNC = 'blend.func';
  	var S_DEPTH_ENABLE = 'depth.enable';
  	var S_DEPTH_FUNC = 'depth.func';
  	var S_DEPTH_RANGE = 'depth.range';
  	var S_DEPTH_MASK = 'depth.mask';
  	var S_COLOR_MASK = 'colorMask';
  	var S_CULL_ENABLE = 'cull.enable';
  	var S_CULL_FACE = 'cull.face';
  	var S_FRONT_FACE = 'frontFace';
  	var S_LINE_WIDTH = 'lineWidth';
  	var S_POLYGON_OFFSET_ENABLE = 'polygonOffset.enable';
  	var S_POLYGON_OFFSET_OFFSET = 'polygonOffset.offset';
  	var S_SAMPLE_ALPHA = 'sample.alpha';
  	var S_SAMPLE_ENABLE = 'sample.enable';
  	var S_SAMPLE_COVERAGE = 'sample.coverage';
  	var S_STENCIL_ENABLE = 'stencil.enable';
  	var S_STENCIL_MASK = 'stencil.mask';
  	var S_STENCIL_FUNC = 'stencil.func';
  	var S_STENCIL_OPFRONT = 'stencil.opFront';
  	var S_STENCIL_OPBACK = 'stencil.opBack';
  	var S_SCISSOR_ENABLE = 'scissor.enable';
  	var S_SCISSOR_BOX = 'scissor.box';
  	var S_VIEWPORT = 'viewport';

  	var S_PROFILE = 'profile';

  	var S_FRAMEBUFFER = 'framebuffer';
  	var S_VERT = 'vert';
  	var S_FRAG = 'frag';
  	var S_ELEMENTS = 'elements';
  	var S_PRIMITIVE = 'primitive';
  	var S_COUNT = 'count';
  	var S_OFFSET = 'offset';
  	var S_INSTANCES = 'instances';
  	var S_VAO = 'vao';

  	var SUFFIX_WIDTH = 'Width';
  	var SUFFIX_HEIGHT = 'Height';

  	var S_FRAMEBUFFER_WIDTH = S_FRAMEBUFFER + SUFFIX_WIDTH;
  	var S_FRAMEBUFFER_HEIGHT = S_FRAMEBUFFER + SUFFIX_HEIGHT;
  	var S_VIEWPORT_WIDTH = S_VIEWPORT + SUFFIX_WIDTH;
  	var S_VIEWPORT_HEIGHT = S_VIEWPORT + SUFFIX_HEIGHT;
  	var S_DRAWINGBUFFER = 'drawingBuffer';
  	var S_DRAWINGBUFFER_WIDTH = S_DRAWINGBUFFER + SUFFIX_WIDTH;
  	var S_DRAWINGBUFFER_HEIGHT = S_DRAWINGBUFFER + SUFFIX_HEIGHT;

  	var NESTED_OPTIONS = [
  	  S_BLEND_FUNC,
  	  S_BLEND_EQUATION,
  	  S_STENCIL_FUNC,
  	  S_STENCIL_OPFRONT,
  	  S_STENCIL_OPBACK,
  	  S_SAMPLE_COVERAGE,
  	  S_VIEWPORT,
  	  S_SCISSOR_BOX,
  	  S_POLYGON_OFFSET_OFFSET
  	];

  	var GL_ARRAY_BUFFER$2 = 34962;
  	var GL_ELEMENT_ARRAY_BUFFER$2 = 34963;

  	var GL_FRAGMENT_SHADER$1 = 35632;
  	var GL_VERTEX_SHADER$1 = 35633;

  	var GL_TEXTURE_2D$3 = 0x0DE1;
  	var GL_TEXTURE_CUBE_MAP$2 = 0x8513;

  	var GL_CULL_FACE = 0x0B44;
  	var GL_BLEND = 0x0BE2;
  	var GL_DITHER = 0x0BD0;
  	var GL_STENCIL_TEST = 0x0B90;
  	var GL_DEPTH_TEST = 0x0B71;
  	var GL_SCISSOR_TEST = 0x0C11;
  	var GL_POLYGON_OFFSET_FILL = 0x8037;
  	var GL_SAMPLE_ALPHA_TO_COVERAGE = 0x809E;
  	var GL_SAMPLE_COVERAGE = 0x80A0;

  	var GL_FLOAT$8 = 5126;
  	var GL_FLOAT_VEC2 = 35664;
  	var GL_FLOAT_VEC3 = 35665;
  	var GL_FLOAT_VEC4 = 35666;
  	var GL_INT$3 = 5124;
  	var GL_INT_VEC2 = 35667;
  	var GL_INT_VEC3 = 35668;
  	var GL_INT_VEC4 = 35669;
  	var GL_BOOL = 35670;
  	var GL_BOOL_VEC2 = 35671;
  	var GL_BOOL_VEC3 = 35672;
  	var GL_BOOL_VEC4 = 35673;
  	var GL_FLOAT_MAT2 = 35674;
  	var GL_FLOAT_MAT3 = 35675;
  	var GL_FLOAT_MAT4 = 35676;
  	var GL_SAMPLER_2D = 35678;
  	var GL_SAMPLER_CUBE = 35680;

  	var GL_TRIANGLES$1 = 4;

  	var GL_FRONT = 1028;
  	var GL_BACK = 1029;
  	var GL_CW = 0x0900;
  	var GL_CCW = 0x0901;
  	var GL_MIN_EXT = 0x8007;
  	var GL_MAX_EXT = 0x8008;
  	var GL_ALWAYS = 519;
  	var GL_KEEP = 7680;
  	var GL_ZERO = 0;
  	var GL_ONE = 1;
  	var GL_FUNC_ADD = 0x8006;
  	var GL_LESS = 513;

  	var GL_FRAMEBUFFER$2 = 0x8D40;
  	var GL_COLOR_ATTACHMENT0$2 = 0x8CE0;

  	var blendFuncs = {
  	  '0': 0,
  	  '1': 1,
  	  'zero': 0,
  	  'one': 1,
  	  'src color': 768,
  	  'one minus src color': 769,
  	  'src alpha': 770,
  	  'one minus src alpha': 771,
  	  'dst color': 774,
  	  'one minus dst color': 775,
  	  'dst alpha': 772,
  	  'one minus dst alpha': 773,
  	  'constant color': 32769,
  	  'one minus constant color': 32770,
  	  'constant alpha': 32771,
  	  'one minus constant alpha': 32772,
  	  'src alpha saturate': 776
  	};

  	// There are invalid values for srcRGB and dstRGB. See:
  	// https://www.khronos.org/registry/webgl/specs/1.0/#6.13
  	// https://github.com/KhronosGroup/WebGL/blob/0d3201f5f7ec3c0060bc1f04077461541f1987b9/conformance-suites/1.0.3/conformance/misc/webgl-specific.html#L56
  	var invalidBlendCombinations = [
  	  'constant color, constant alpha',
  	  'one minus constant color, constant alpha',
  	  'constant color, one minus constant alpha',
  	  'one minus constant color, one minus constant alpha',
  	  'constant alpha, constant color',
  	  'constant alpha, one minus constant color',
  	  'one minus constant alpha, constant color',
  	  'one minus constant alpha, one minus constant color'
  	];

  	var compareFuncs = {
  	  'never': 512,
  	  'less': 513,
  	  '<': 513,
  	  'equal': 514,
  	  '=': 514,
  	  '==': 514,
  	  '===': 514,
  	  'lequal': 515,
  	  '<=': 515,
  	  'greater': 516,
  	  '>': 516,
  	  'notequal': 517,
  	  '!=': 517,
  	  '!==': 517,
  	  'gequal': 518,
  	  '>=': 518,
  	  'always': 519
  	};

  	var stencilOps = {
  	  '0': 0,
  	  'zero': 0,
  	  'keep': 7680,
  	  'replace': 7681,
  	  'increment': 7682,
  	  'decrement': 7683,
  	  'increment wrap': 34055,
  	  'decrement wrap': 34056,
  	  'invert': 5386
  	};

  	var shaderType = {
  	  'frag': GL_FRAGMENT_SHADER$1,
  	  'vert': GL_VERTEX_SHADER$1
  	};

  	var orientationType = {
  	  'cw': GL_CW,
  	  'ccw': GL_CCW
  	};

  	function isBufferArgs (x) {
  	  return Array.isArray(x) ||
  	    isTypedArray(x) ||
  	    isNDArrayLike(x)
  	}

  	// Make sure viewport is processed first
  	function sortState (state) {
  	  return state.sort(function (a, b) {
  	    if (a === S_VIEWPORT) {
  	      return -1
  	    } else if (b === S_VIEWPORT) {
  	      return 1
  	    }
  	    return (a < b) ? -1 : 1
  	  })
  	}

  	function Declaration (thisDep, contextDep, propDep, append) {
  	  this.thisDep = thisDep;
  	  this.contextDep = contextDep;
  	  this.propDep = propDep;
  	  this.append = append;
  	}

  	function isStatic (decl) {
  	  return decl && !(decl.thisDep || decl.contextDep || decl.propDep)
  	}

  	function createStaticDecl (append) {
  	  return new Declaration(false, false, false, append)
  	}

  	function createDynamicDecl (dyn, append) {
  	  var type = dyn.type;
  	  if (type === DYN_FUNC$1) {
  	    var numArgs = dyn.data.length;
  	    return new Declaration(
  	      true,
  	      numArgs >= 1,
  	      numArgs >= 2,
  	      append)
  	  } else if (type === DYN_THUNK) {
  	    var data = dyn.data;
  	    return new Declaration(
  	      data.thisDep,
  	      data.contextDep,
  	      data.propDep,
  	      append)
  	  } else if (type === DYN_CONSTANT$1) {
  	    return new Declaration(
  	      false,
  	      false,
  	      false,
  	      append)
  	  } else if (type === DYN_ARRAY$1) {
  	    var thisDep = false;
  	    var contextDep = false;
  	    var propDep = false;
  	    for (var i = 0; i < dyn.data.length; ++i) {
  	      var subDyn = dyn.data[i];
  	      if (subDyn.type === DYN_PROP$1) {
  	        propDep = true;
  	      } else if (subDyn.type === DYN_CONTEXT$1) {
  	        contextDep = true;
  	      } else if (subDyn.type === DYN_STATE$1) {
  	        thisDep = true;
  	      } else if (subDyn.type === DYN_FUNC$1) {
  	        thisDep = true;
  	        var subArgs = subDyn.data;
  	        if (subArgs >= 1) {
  	          contextDep = true;
  	        }
  	        if (subArgs >= 2) {
  	          propDep = true;
  	        }
  	      } else if (subDyn.type === DYN_THUNK) {
  	        thisDep = thisDep || subDyn.data.thisDep;
  	        contextDep = contextDep || subDyn.data.contextDep;
  	        propDep = propDep || subDyn.data.propDep;
  	      }
  	    }
  	    return new Declaration(
  	      thisDep,
  	      contextDep,
  	      propDep,
  	      append)
  	  } else {
  	    return new Declaration(
  	      type === DYN_STATE$1,
  	      type === DYN_CONTEXT$1,
  	      type === DYN_PROP$1,
  	      append)
  	  }
  	}

  	var SCOPE_DECL = new Declaration(false, false, false, function () {});

  	function reglCore (
  	  gl,
  	  stringStore,
  	  extensions,
  	  limits,
  	  bufferState,
  	  elementState,
  	  textureState,
  	  framebufferState,
  	  uniformState,
  	  attributeState,
  	  shaderState,
  	  drawState,
  	  contextState,
  	  timer,
  	  config) {
  	  var AttributeRecord = attributeState.Record;

  	  var blendEquations = {
  	    'add': 32774,
  	    'subtract': 32778,
  	    'reverse subtract': 32779
  	  };
  	  if (extensions.ext_blend_minmax) {
  	    blendEquations.min = GL_MIN_EXT;
  	    blendEquations.max = GL_MAX_EXT;
  	  }

  	  var extInstancing = extensions.angle_instanced_arrays;
  	  var extDrawBuffers = extensions.webgl_draw_buffers;
  	  var extVertexArrays = extensions.oes_vertex_array_object;

  	  // ===================================================
  	  // ===================================================
  	  // WEBGL STATE
  	  // ===================================================
  	  // ===================================================
  	  var currentState = {
  	    dirty: true,
  	    profile: config.profile
  	  };
  	  var nextState = {};
  	  var GL_STATE_NAMES = [];
  	  var GL_FLAGS = {};
  	  var GL_VARIABLES = {};

  	  function propName (name) {
  	    return name.replace('.', '_')
  	  }

  	  function stateFlag (sname, cap, init) {
  	    var name = propName(sname);
  	    GL_STATE_NAMES.push(sname);
  	    nextState[name] = currentState[name] = !!init;
  	    GL_FLAGS[name] = cap;
  	  }

  	  function stateVariable (sname, func, init) {
  	    var name = propName(sname);
  	    GL_STATE_NAMES.push(sname);
  	    if (Array.isArray(init)) {
  	      currentState[name] = init.slice();
  	      nextState[name] = init.slice();
  	    } else {
  	      currentState[name] = nextState[name] = init;
  	    }
  	    GL_VARIABLES[name] = func;
  	  }

  	  // Dithering
  	  stateFlag(S_DITHER, GL_DITHER);

  	  // Blending
  	  stateFlag(S_BLEND_ENABLE, GL_BLEND);
  	  stateVariable(S_BLEND_COLOR, 'blendColor', [0, 0, 0, 0]);
  	  stateVariable(S_BLEND_EQUATION, 'blendEquationSeparate',
  	    [GL_FUNC_ADD, GL_FUNC_ADD]);
  	  stateVariable(S_BLEND_FUNC, 'blendFuncSeparate',
  	    [GL_ONE, GL_ZERO, GL_ONE, GL_ZERO]);

  	  // Depth
  	  stateFlag(S_DEPTH_ENABLE, GL_DEPTH_TEST, true);
  	  stateVariable(S_DEPTH_FUNC, 'depthFunc', GL_LESS);
  	  stateVariable(S_DEPTH_RANGE, 'depthRange', [0, 1]);
  	  stateVariable(S_DEPTH_MASK, 'depthMask', true);

  	  // Color mask
  	  stateVariable(S_COLOR_MASK, S_COLOR_MASK, [true, true, true, true]);

  	  // Face culling
  	  stateFlag(S_CULL_ENABLE, GL_CULL_FACE);
  	  stateVariable(S_CULL_FACE, 'cullFace', GL_BACK);

  	  // Front face orientation
  	  stateVariable(S_FRONT_FACE, S_FRONT_FACE, GL_CCW);

  	  // Line width
  	  stateVariable(S_LINE_WIDTH, S_LINE_WIDTH, 1);

  	  // Polygon offset
  	  stateFlag(S_POLYGON_OFFSET_ENABLE, GL_POLYGON_OFFSET_FILL);
  	  stateVariable(S_POLYGON_OFFSET_OFFSET, 'polygonOffset', [0, 0]);

  	  // Sample coverage
  	  stateFlag(S_SAMPLE_ALPHA, GL_SAMPLE_ALPHA_TO_COVERAGE);
  	  stateFlag(S_SAMPLE_ENABLE, GL_SAMPLE_COVERAGE);
  	  stateVariable(S_SAMPLE_COVERAGE, 'sampleCoverage', [1, false]);

  	  // Stencil
  	  stateFlag(S_STENCIL_ENABLE, GL_STENCIL_TEST);
  	  stateVariable(S_STENCIL_MASK, 'stencilMask', -1);
  	  stateVariable(S_STENCIL_FUNC, 'stencilFunc', [GL_ALWAYS, 0, -1]);
  	  stateVariable(S_STENCIL_OPFRONT, 'stencilOpSeparate',
  	    [GL_FRONT, GL_KEEP, GL_KEEP, GL_KEEP]);
  	  stateVariable(S_STENCIL_OPBACK, 'stencilOpSeparate',
  	    [GL_BACK, GL_KEEP, GL_KEEP, GL_KEEP]);

  	  // Scissor
  	  stateFlag(S_SCISSOR_ENABLE, GL_SCISSOR_TEST);
  	  stateVariable(S_SCISSOR_BOX, 'scissor',
  	    [0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight]);

  	  // Viewport
  	  stateVariable(S_VIEWPORT, S_VIEWPORT,
  	    [0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight]);

  	  // ===================================================
  	  // ===================================================
  	  // ENVIRONMENT
  	  // ===================================================
  	  // ===================================================
  	  var sharedState = {
  	    gl: gl,
  	    context: contextState,
  	    strings: stringStore,
  	    next: nextState,
  	    current: currentState,
  	    draw: drawState,
  	    elements: elementState,
  	    buffer: bufferState,
  	    shader: shaderState,
  	    attributes: attributeState.state,
  	    vao: attributeState,
  	    uniforms: uniformState,
  	    framebuffer: framebufferState,
  	    extensions: extensions,

  	    timer: timer,
  	    isBufferArgs: isBufferArgs
  	  };

  	  var sharedConstants = {
  	    primTypes: primTypes,
  	    compareFuncs: compareFuncs,
  	    blendFuncs: blendFuncs,
  	    blendEquations: blendEquations,
  	    stencilOps: stencilOps,
  	    glTypes: glTypes,
  	    orientationType: orientationType
  	  };

  	  check$1.optional(function () {
  	    sharedState.isArrayLike = isArrayLike;
  	  });

  	  if (extDrawBuffers) {
  	    sharedConstants.backBuffer = [GL_BACK];
  	    sharedConstants.drawBuffer = loop(limits.maxDrawbuffers, function (i) {
  	      if (i === 0) {
  	        return [0]
  	      }
  	      return loop(i, function (j) {
  	        return GL_COLOR_ATTACHMENT0$2 + j
  	      })
  	    });
  	  }

  	  var drawCallCounter = 0;
  	  function createREGLEnvironment () {
  	    var env = createEnvironment();
  	    var link = env.link;
  	    var global = env.global;
  	    env.id = drawCallCounter++;

  	    env.batchId = '0';

  	    // link shared state
  	    var SHARED = link(sharedState);
  	    var shared = env.shared = {
  	      props: 'a0'
  	    };
  	    Object.keys(sharedState).forEach(function (prop) {
  	      shared[prop] = global.def(SHARED, '.', prop);
  	    });

  	    // Inject runtime assertion stuff for debug builds
  	    check$1.optional(function () {
  	      env.CHECK = link(check$1);
  	      env.commandStr = check$1.guessCommand();
  	      env.command = link(env.commandStr);
  	      env.assert = function (block, pred, message) {
  	        block(
  	          'if(!(', pred, '))',
  	          this.CHECK, '.commandRaise(', link(message), ',', this.command, ');');
  	      };

  	      sharedConstants.invalidBlendCombinations = invalidBlendCombinations;
  	    });

  	    // Copy GL state variables over
  	    var nextVars = env.next = {};
  	    var currentVars = env.current = {};
  	    Object.keys(GL_VARIABLES).forEach(function (variable) {
  	      if (Array.isArray(currentState[variable])) {
  	        nextVars[variable] = global.def(shared.next, '.', variable);
  	        currentVars[variable] = global.def(shared.current, '.', variable);
  	      }
  	    });

  	    // Initialize shared constants
  	    var constants = env.constants = {};
  	    Object.keys(sharedConstants).forEach(function (name) {
  	      constants[name] = global.def(JSON.stringify(sharedConstants[name]));
  	    });

  	    // Helper function for calling a block
  	    env.invoke = function (block, x) {
  	      switch (x.type) {
  	        case DYN_FUNC$1:
  	          var argList = [
  	            'this',
  	            shared.context,
  	            shared.props,
  	            env.batchId
  	          ];
  	          return block.def(
  	            link(x.data), '.call(',
  	            argList.slice(0, Math.max(x.data.length + 1, 4)),
  	            ')')
  	        case DYN_PROP$1:
  	          return block.def(shared.props, x.data)
  	        case DYN_CONTEXT$1:
  	          return block.def(shared.context, x.data)
  	        case DYN_STATE$1:
  	          return block.def('this', x.data)
  	        case DYN_THUNK:
  	          x.data.append(env, block);
  	          return x.data.ref
  	        case DYN_CONSTANT$1:
  	          return x.data.toString()
  	        case DYN_ARRAY$1:
  	          return x.data.map(function (y) {
  	            return env.invoke(block, y)
  	          })
  	      }
  	    };

  	    env.attribCache = {};

  	    var scopeAttribs = {};
  	    env.scopeAttrib = function (name) {
  	      var id = stringStore.id(name);
  	      if (id in scopeAttribs) {
  	        return scopeAttribs[id]
  	      }
  	      var binding = attributeState.scope[id];
  	      if (!binding) {
  	        binding = attributeState.scope[id] = new AttributeRecord();
  	      }
  	      var result = scopeAttribs[id] = link(binding);
  	      return result
  	    };

  	    return env
  	  }

  	  // ===================================================
  	  // ===================================================
  	  // PARSING
  	  // ===================================================
  	  // ===================================================
  	  function parseProfile (options) {
  	    var staticOptions = options.static;
  	    var dynamicOptions = options.dynamic;

  	    var profileEnable;
  	    if (S_PROFILE in staticOptions) {
  	      var value = !!staticOptions[S_PROFILE];
  	      profileEnable = createStaticDecl(function (env, scope) {
  	        return value
  	      });
  	      profileEnable.enable = value;
  	    } else if (S_PROFILE in dynamicOptions) {
  	      var dyn = dynamicOptions[S_PROFILE];
  	      profileEnable = createDynamicDecl(dyn, function (env, scope) {
  	        return env.invoke(scope, dyn)
  	      });
  	    }

  	    return profileEnable
  	  }

  	  function parseFramebuffer (options, env) {
  	    var staticOptions = options.static;
  	    var dynamicOptions = options.dynamic;

  	    if (S_FRAMEBUFFER in staticOptions) {
  	      var framebuffer = staticOptions[S_FRAMEBUFFER];
  	      if (framebuffer) {
  	        framebuffer = framebufferState.getFramebuffer(framebuffer);
  	        check$1.command(framebuffer, 'invalid framebuffer object');
  	        return createStaticDecl(function (env, block) {
  	          var FRAMEBUFFER = env.link(framebuffer);
  	          var shared = env.shared;
  	          block.set(
  	            shared.framebuffer,
  	            '.next',
  	            FRAMEBUFFER);
  	          var CONTEXT = shared.context;
  	          block.set(
  	            CONTEXT,
  	            '.' + S_FRAMEBUFFER_WIDTH,
  	            FRAMEBUFFER + '.width');
  	          block.set(
  	            CONTEXT,
  	            '.' + S_FRAMEBUFFER_HEIGHT,
  	            FRAMEBUFFER + '.height');
  	          return FRAMEBUFFER
  	        })
  	      } else {
  	        return createStaticDecl(function (env, scope) {
  	          var shared = env.shared;
  	          scope.set(
  	            shared.framebuffer,
  	            '.next',
  	            'null');
  	          var CONTEXT = shared.context;
  	          scope.set(
  	            CONTEXT,
  	            '.' + S_FRAMEBUFFER_WIDTH,
  	            CONTEXT + '.' + S_DRAWINGBUFFER_WIDTH);
  	          scope.set(
  	            CONTEXT,
  	            '.' + S_FRAMEBUFFER_HEIGHT,
  	            CONTEXT + '.' + S_DRAWINGBUFFER_HEIGHT);
  	          return 'null'
  	        })
  	      }
  	    } else if (S_FRAMEBUFFER in dynamicOptions) {
  	      var dyn = dynamicOptions[S_FRAMEBUFFER];
  	      return createDynamicDecl(dyn, function (env, scope) {
  	        var FRAMEBUFFER_FUNC = env.invoke(scope, dyn);
  	        var shared = env.shared;
  	        var FRAMEBUFFER_STATE = shared.framebuffer;
  	        var FRAMEBUFFER = scope.def(
  	          FRAMEBUFFER_STATE, '.getFramebuffer(', FRAMEBUFFER_FUNC, ')');

  	        check$1.optional(function () {
  	          env.assert(scope,
  	            '!' + FRAMEBUFFER_FUNC + '||' + FRAMEBUFFER,
  	            'invalid framebuffer object');
  	        });

  	        scope.set(
  	          FRAMEBUFFER_STATE,
  	          '.next',
  	          FRAMEBUFFER);
  	        var CONTEXT = shared.context;
  	        scope.set(
  	          CONTEXT,
  	          '.' + S_FRAMEBUFFER_WIDTH,
  	          FRAMEBUFFER + '?' + FRAMEBUFFER + '.width:' +
  	          CONTEXT + '.' + S_DRAWINGBUFFER_WIDTH);
  	        scope.set(
  	          CONTEXT,
  	          '.' + S_FRAMEBUFFER_HEIGHT,
  	          FRAMEBUFFER +
  	          '?' + FRAMEBUFFER + '.height:' +
  	          CONTEXT + '.' + S_DRAWINGBUFFER_HEIGHT);
  	        return FRAMEBUFFER
  	      })
  	    } else {
  	      return null
  	    }
  	  }

  	  function parseViewportScissor (options, framebuffer, env) {
  	    var staticOptions = options.static;
  	    var dynamicOptions = options.dynamic;

  	    function parseBox (param) {
  	      if (param in staticOptions) {
  	        var box = staticOptions[param];
  	        check$1.commandType(box, 'object', 'invalid ' + param, env.commandStr);

  	        var isStatic = true;
  	        var x = box.x | 0;
  	        var y = box.y | 0;
  	        var w, h;
  	        if ('width' in box) {
  	          w = box.width | 0;
  	          check$1.command(w >= 0, 'invalid ' + param, env.commandStr);
  	        } else {
  	          isStatic = false;
  	        }
  	        if ('height' in box) {
  	          h = box.height | 0;
  	          check$1.command(h >= 0, 'invalid ' + param, env.commandStr);
  	        } else {
  	          isStatic = false;
  	        }

  	        return new Declaration(
  	          !isStatic && framebuffer && framebuffer.thisDep,
  	          !isStatic && framebuffer && framebuffer.contextDep,
  	          !isStatic && framebuffer && framebuffer.propDep,
  	          function (env, scope) {
  	            var CONTEXT = env.shared.context;
  	            var BOX_W = w;
  	            if (!('width' in box)) {
  	              BOX_W = scope.def(CONTEXT, '.', S_FRAMEBUFFER_WIDTH, '-', x);
  	            }
  	            var BOX_H = h;
  	            if (!('height' in box)) {
  	              BOX_H = scope.def(CONTEXT, '.', S_FRAMEBUFFER_HEIGHT, '-', y);
  	            }
  	            return [x, y, BOX_W, BOX_H]
  	          })
  	      } else if (param in dynamicOptions) {
  	        var dynBox = dynamicOptions[param];
  	        var result = createDynamicDecl(dynBox, function (env, scope) {
  	          var BOX = env.invoke(scope, dynBox);

  	          check$1.optional(function () {
  	            env.assert(scope,
  	              BOX + '&&typeof ' + BOX + '==="object"',
  	              'invalid ' + param);
  	          });

  	          var CONTEXT = env.shared.context;
  	          var BOX_X = scope.def(BOX, '.x|0');
  	          var BOX_Y = scope.def(BOX, '.y|0');
  	          var BOX_W = scope.def(
  	            '"width" in ', BOX, '?', BOX, '.width|0:',
  	            '(', CONTEXT, '.', S_FRAMEBUFFER_WIDTH, '-', BOX_X, ')');
  	          var BOX_H = scope.def(
  	            '"height" in ', BOX, '?', BOX, '.height|0:',
  	            '(', CONTEXT, '.', S_FRAMEBUFFER_HEIGHT, '-', BOX_Y, ')');

  	          check$1.optional(function () {
  	            env.assert(scope,
  	              BOX_W + '>=0&&' +
  	              BOX_H + '>=0',
  	              'invalid ' + param);
  	          });

  	          return [BOX_X, BOX_Y, BOX_W, BOX_H]
  	        });
  	        if (framebuffer) {
  	          result.thisDep = result.thisDep || framebuffer.thisDep;
  	          result.contextDep = result.contextDep || framebuffer.contextDep;
  	          result.propDep = result.propDep || framebuffer.propDep;
  	        }
  	        return result
  	      } else if (framebuffer) {
  	        return new Declaration(
  	          framebuffer.thisDep,
  	          framebuffer.contextDep,
  	          framebuffer.propDep,
  	          function (env, scope) {
  	            var CONTEXT = env.shared.context;
  	            return [
  	              0, 0,
  	              scope.def(CONTEXT, '.', S_FRAMEBUFFER_WIDTH),
  	              scope.def(CONTEXT, '.', S_FRAMEBUFFER_HEIGHT)]
  	          })
  	      } else {
  	        return null
  	      }
  	    }

  	    var viewport = parseBox(S_VIEWPORT);

  	    if (viewport) {
  	      var prevViewport = viewport;
  	      viewport = new Declaration(
  	        viewport.thisDep,
  	        viewport.contextDep,
  	        viewport.propDep,
  	        function (env, scope) {
  	          var VIEWPORT = prevViewport.append(env, scope);
  	          var CONTEXT = env.shared.context;
  	          scope.set(
  	            CONTEXT,
  	            '.' + S_VIEWPORT_WIDTH,
  	            VIEWPORT[2]);
  	          scope.set(
  	            CONTEXT,
  	            '.' + S_VIEWPORT_HEIGHT,
  	            VIEWPORT[3]);
  	          return VIEWPORT
  	        });
  	    }

  	    return {
  	      viewport: viewport,
  	      scissor_box: parseBox(S_SCISSOR_BOX)
  	    }
  	  }

  	  function parseAttribLocations (options, attributes) {
  	    var staticOptions = options.static;
  	    var staticProgram =
  	      typeof staticOptions[S_FRAG] === 'string' &&
  	      typeof staticOptions[S_VERT] === 'string';
  	    if (staticProgram) {
  	      if (Object.keys(attributes.dynamic).length > 0) {
  	        return null
  	      }
  	      var staticAttributes = attributes.static;
  	      var sAttributes = Object.keys(staticAttributes);
  	      if (sAttributes.length > 0 && typeof staticAttributes[sAttributes[0]] === 'number') {
  	        var bindings = [];
  	        for (var i = 0; i < sAttributes.length; ++i) {
  	          check$1(typeof staticAttributes[sAttributes[i]] === 'number', 'must specify all vertex attribute locations when using vaos');
  	          bindings.push([staticAttributes[sAttributes[i]] | 0, sAttributes[i]]);
  	        }
  	        return bindings
  	      }
  	    }
  	    return null
  	  }

  	  function parseProgram (options, env, attribLocations) {
  	    var staticOptions = options.static;
  	    var dynamicOptions = options.dynamic;

  	    function parseShader (name) {
  	      if (name in staticOptions) {
  	        var id = stringStore.id(staticOptions[name]);
  	        check$1.optional(function () {
  	          shaderState.shader(shaderType[name], id, check$1.guessCommand());
  	        });
  	        var result = createStaticDecl(function () {
  	          return id
  	        });
  	        result.id = id;
  	        return result
  	      } else if (name in dynamicOptions) {
  	        var dyn = dynamicOptions[name];
  	        return createDynamicDecl(dyn, function (env, scope) {
  	          var str = env.invoke(scope, dyn);
  	          var id = scope.def(env.shared.strings, '.id(', str, ')');
  	          check$1.optional(function () {
  	            scope(
  	              env.shared.shader, '.shader(',
  	              shaderType[name], ',',
  	              id, ',',
  	              env.command, ');');
  	          });
  	          return id
  	        })
  	      }
  	      return null
  	    }

  	    var frag = parseShader(S_FRAG);
  	    var vert = parseShader(S_VERT);

  	    var program = null;
  	    var progVar;
  	    if (isStatic(frag) && isStatic(vert)) {
  	      program = shaderState.program(vert.id, frag.id, null, attribLocations);
  	      progVar = createStaticDecl(function (env, scope) {
  	        return env.link(program)
  	      });
  	    } else {
  	      progVar = new Declaration(
  	        (frag && frag.thisDep) || (vert && vert.thisDep),
  	        (frag && frag.contextDep) || (vert && vert.contextDep),
  	        (frag && frag.propDep) || (vert && vert.propDep),
  	        function (env, scope) {
  	          var SHADER_STATE = env.shared.shader;
  	          var fragId;
  	          if (frag) {
  	            fragId = frag.append(env, scope);
  	          } else {
  	            fragId = scope.def(SHADER_STATE, '.', S_FRAG);
  	          }
  	          var vertId;
  	          if (vert) {
  	            vertId = vert.append(env, scope);
  	          } else {
  	            vertId = scope.def(SHADER_STATE, '.', S_VERT);
  	          }
  	          var progDef = SHADER_STATE + '.program(' + vertId + ',' + fragId;
  	          check$1.optional(function () {
  	            progDef += ',' + env.command;
  	          });
  	          return scope.def(progDef + ')')
  	        });
  	    }

  	    return {
  	      frag: frag,
  	      vert: vert,
  	      progVar: progVar,
  	      program: program
  	    }
  	  }

  	  function parseDraw (options, env) {
  	    var staticOptions = options.static;
  	    var dynamicOptions = options.dynamic;

  	    // TODO: should use VAO to get default values for offset properties
  	    // should move vao parse into here and out of the old stuff

  	    var staticDraw = {};
  	    var vaoActive = false;

  	    function parseVAO () {
  	      if (S_VAO in staticOptions) {
  	        var vao = staticOptions[S_VAO];
  	        if (vao !== null && attributeState.getVAO(vao) === null) {
  	          vao = attributeState.createVAO(vao);
  	        }

  	        vaoActive = true;
  	        staticDraw.vao = vao;

  	        return createStaticDecl(function (env) {
  	          var vaoRef = attributeState.getVAO(vao);
  	          if (vaoRef) {
  	            return env.link(vaoRef)
  	          } else {
  	            return 'null'
  	          }
  	        })
  	      } else if (S_VAO in dynamicOptions) {
  	        vaoActive = true;
  	        var dyn = dynamicOptions[S_VAO];
  	        return createDynamicDecl(dyn, function (env, scope) {
  	          var vaoRef = env.invoke(scope, dyn);
  	          return scope.def(env.shared.vao + '.getVAO(' + vaoRef + ')')
  	        })
  	      }
  	      return null
  	    }

  	    var vao = parseVAO();

  	    var elementsActive = false;

  	    function parseElements () {
  	      if (S_ELEMENTS in staticOptions) {
  	        var elements = staticOptions[S_ELEMENTS];
  	        staticDraw.elements = elements;
  	        if (isBufferArgs(elements)) {
  	          var e = staticDraw.elements = elementState.create(elements, true);
  	          elements = elementState.getElements(e);
  	          elementsActive = true;
  	        } else if (elements) {
  	          elements = elementState.getElements(elements);
  	          elementsActive = true;
  	          check$1.command(elements, 'invalid elements', env.commandStr);
  	        }

  	        var result = createStaticDecl(function (env, scope) {
  	          if (elements) {
  	            var result = env.link(elements);
  	            env.ELEMENTS = result;
  	            return result
  	          }
  	          env.ELEMENTS = null;
  	          return null
  	        });
  	        result.value = elements;
  	        return result
  	      } else if (S_ELEMENTS in dynamicOptions) {
  	        elementsActive = true;

  	        var dyn = dynamicOptions[S_ELEMENTS];
  	        return createDynamicDecl(dyn, function (env, scope) {
  	          var shared = env.shared;

  	          var IS_BUFFER_ARGS = shared.isBufferArgs;
  	          var ELEMENT_STATE = shared.elements;

  	          var elementDefn = env.invoke(scope, dyn);
  	          var elements = scope.def('null');
  	          var elementStream = scope.def(IS_BUFFER_ARGS, '(', elementDefn, ')');

  	          var ifte = env.cond(elementStream)
  	            .then(elements, '=', ELEMENT_STATE, '.createStream(', elementDefn, ');')
  	            .else(elements, '=', ELEMENT_STATE, '.getElements(', elementDefn, ');');

  	          check$1.optional(function () {
  	            env.assert(ifte.else,
  	              '!' + elementDefn + '||' + elements,
  	              'invalid elements');
  	          });

  	          scope.entry(ifte);
  	          scope.exit(
  	            env.cond(elementStream)
  	              .then(ELEMENT_STATE, '.destroyStream(', elements, ');'));

  	          env.ELEMENTS = elements;

  	          return elements
  	        })
  	      } else if (vaoActive) {
  	        return new Declaration(
  	          vao.thisDep,
  	          vao.contextDep,
  	          vao.propDep,
  	          function (env, scope) {
  	            return scope.def(env.shared.vao + '.currentVAO?' + env.shared.elements + '.getElements(' + env.shared.vao + '.currentVAO.elements):null')
  	          })
  	      }
  	      return null
  	    }

  	    var elements = parseElements();

  	    function parsePrimitive () {
  	      if (S_PRIMITIVE in staticOptions) {
  	        var primitive = staticOptions[S_PRIMITIVE];
  	        staticDraw.primitive = primitive;
  	        check$1.commandParameter(primitive, primTypes, 'invalid primitve', env.commandStr);
  	        return createStaticDecl(function (env, scope) {
  	          return primTypes[primitive]
  	        })
  	      } else if (S_PRIMITIVE in dynamicOptions) {
  	        var dynPrimitive = dynamicOptions[S_PRIMITIVE];
  	        return createDynamicDecl(dynPrimitive, function (env, scope) {
  	          var PRIM_TYPES = env.constants.primTypes;
  	          var prim = env.invoke(scope, dynPrimitive);
  	          check$1.optional(function () {
  	            env.assert(scope,
  	              prim + ' in ' + PRIM_TYPES,
  	              'invalid primitive, must be one of ' + Object.keys(primTypes));
  	          });
  	          return scope.def(PRIM_TYPES, '[', prim, ']')
  	        })
  	      } else if (elementsActive) {
  	        if (isStatic(elements)) {
  	          if (elements.value) {
  	            return createStaticDecl(function (env, scope) {
  	              return scope.def(env.ELEMENTS, '.primType')
  	            })
  	          } else {
  	            return createStaticDecl(function () {
  	              return GL_TRIANGLES$1
  	            })
  	          }
  	        } else {
  	          return new Declaration(
  	            elements.thisDep,
  	            elements.contextDep,
  	            elements.propDep,
  	            function (env, scope) {
  	              var elements = env.ELEMENTS;
  	              return scope.def(elements, '?', elements, '.primType:', GL_TRIANGLES$1)
  	            })
  	        }
  	      } else if (vaoActive) {
  	        return new Declaration(
  	          vao.thisDep,
  	          vao.contextDep,
  	          vao.propDep,
  	          function (env, scope) {
  	            return scope.def(env.shared.vao + '.currentVAO?' + env.shared.vao + '.currentVAO.primitive:' + GL_TRIANGLES$1)
  	          })
  	      }
  	      return null
  	    }

  	    function parseParam (param, isOffset) {
  	      if (param in staticOptions) {
  	        var value = staticOptions[param] | 0;
  	        if (isOffset) {
  	          staticDraw.offset = value;
  	        } else {
  	          staticDraw.instances = value;
  	        }
  	        check$1.command(!isOffset || value >= 0, 'invalid ' + param, env.commandStr);
  	        return createStaticDecl(function (env, scope) {
  	          if (isOffset) {
  	            env.OFFSET = value;
  	          }
  	          return value
  	        })
  	      } else if (param in dynamicOptions) {
  	        var dynValue = dynamicOptions[param];
  	        return createDynamicDecl(dynValue, function (env, scope) {
  	          var result = env.invoke(scope, dynValue);
  	          if (isOffset) {
  	            env.OFFSET = result;
  	            check$1.optional(function () {
  	              env.assert(scope,
  	                result + '>=0',
  	                'invalid ' + param);
  	            });
  	          }
  	          return result
  	        })
  	      } else if (isOffset) {
  	        if (elementsActive) {
  	          return createStaticDecl(function (env, scope) {
  	            env.OFFSET = 0;
  	            return 0
  	          })
  	        } else if (vaoActive) {
  	          return new Declaration(
  	            vao.thisDep,
  	            vao.contextDep,
  	            vao.propDep,
  	            function (env, scope) {
  	              return scope.def(env.shared.vao + '.currentVAO?' + env.shared.vao + '.currentVAO.offset:0')
  	            })
  	        }
  	      } else if (vaoActive) {
  	        return new Declaration(
  	          vao.thisDep,
  	          vao.contextDep,
  	          vao.propDep,
  	          function (env, scope) {
  	            return scope.def(env.shared.vao + '.currentVAO?' + env.shared.vao + '.currentVAO.instances:-1')
  	          })
  	      }
  	      return null
  	    }

  	    var OFFSET = parseParam(S_OFFSET, true);

  	    function parseVertCount () {
  	      if (S_COUNT in staticOptions) {
  	        var count = staticOptions[S_COUNT] | 0;
  	        staticDraw.count = count;
  	        check$1.command(
  	          typeof count === 'number' && count >= 0, 'invalid vertex count', env.commandStr);
  	        return createStaticDecl(function () {
  	          return count
  	        })
  	      } else if (S_COUNT in dynamicOptions) {
  	        var dynCount = dynamicOptions[S_COUNT];
  	        return createDynamicDecl(dynCount, function (env, scope) {
  	          var result = env.invoke(scope, dynCount);
  	          check$1.optional(function () {
  	            env.assert(scope,
  	              'typeof ' + result + '==="number"&&' +
  	              result + '>=0&&' +
  	              result + '===(' + result + '|0)',
  	              'invalid vertex count');
  	          });
  	          return result
  	        })
  	      } else if (elementsActive) {
  	        if (isStatic(elements)) {
  	          if (elements) {
  	            if (OFFSET) {
  	              return new Declaration(
  	                OFFSET.thisDep,
  	                OFFSET.contextDep,
  	                OFFSET.propDep,
  	                function (env, scope) {
  	                  var result = scope.def(
  	                    env.ELEMENTS, '.vertCount-', env.OFFSET);

  	                  check$1.optional(function () {
  	                    env.assert(scope,
  	                      result + '>=0',
  	                      'invalid vertex offset/element buffer too small');
  	                  });

  	                  return result
  	                })
  	            } else {
  	              return createStaticDecl(function (env, scope) {
  	                return scope.def(env.ELEMENTS, '.vertCount')
  	              })
  	            }
  	          } else {
  	            var result = createStaticDecl(function () {
  	              return -1
  	            });
  	            check$1.optional(function () {
  	              result.MISSING = true;
  	            });
  	            return result
  	          }
  	        } else {
  	          var variable = new Declaration(
  	            elements.thisDep || OFFSET.thisDep,
  	            elements.contextDep || OFFSET.contextDep,
  	            elements.propDep || OFFSET.propDep,
  	            function (env, scope) {
  	              var elements = env.ELEMENTS;
  	              if (env.OFFSET) {
  	                return scope.def(elements, '?', elements, '.vertCount-',
  	                  env.OFFSET, ':-1')
  	              }
  	              return scope.def(elements, '?', elements, '.vertCount:-1')
  	            });
  	          check$1.optional(function () {
  	            variable.DYNAMIC = true;
  	          });
  	          return variable
  	        }
  	      } else if (vaoActive) {
  	        var countVariable = new Declaration(
  	          vao.thisDep,
  	          vao.contextDep,
  	          vao.propDep,
  	          function (env, scope) {
  	            return scope.def(env.shared.vao, '.currentVAO?', env.shared.vao, '.currentVAO.count:-1')
  	          });
  	        return countVariable
  	      }
  	      return null
  	    }

  	    var primitive = parsePrimitive();
  	    var count = parseVertCount();
  	    var instances = parseParam(S_INSTANCES, false);

  	    return {
  	      elements: elements,
  	      primitive: primitive,
  	      count: count,
  	      instances: instances,
  	      offset: OFFSET,
  	      vao: vao,

  	      vaoActive: vaoActive,
  	      elementsActive: elementsActive,

  	      // static draw props
  	      static: staticDraw
  	    }
  	  }

  	  function parseGLState (options, env) {
  	    var staticOptions = options.static;
  	    var dynamicOptions = options.dynamic;

  	    var STATE = {};

  	    GL_STATE_NAMES.forEach(function (prop) {
  	      var param = propName(prop);

  	      function parseParam (parseStatic, parseDynamic) {
  	        if (prop in staticOptions) {
  	          var value = parseStatic(staticOptions[prop]);
  	          STATE[param] = createStaticDecl(function () {
  	            return value
  	          });
  	        } else if (prop in dynamicOptions) {
  	          var dyn = dynamicOptions[prop];
  	          STATE[param] = createDynamicDecl(dyn, function (env, scope) {
  	            return parseDynamic(env, scope, env.invoke(scope, dyn))
  	          });
  	        }
  	      }

  	      switch (prop) {
  	        case S_CULL_ENABLE:
  	        case S_BLEND_ENABLE:
  	        case S_DITHER:
  	        case S_STENCIL_ENABLE:
  	        case S_DEPTH_ENABLE:
  	        case S_SCISSOR_ENABLE:
  	        case S_POLYGON_OFFSET_ENABLE:
  	        case S_SAMPLE_ALPHA:
  	        case S_SAMPLE_ENABLE:
  	        case S_DEPTH_MASK:
  	          return parseParam(
  	            function (value) {
  	              check$1.commandType(value, 'boolean', prop, env.commandStr);
  	              return value
  	            },
  	            function (env, scope, value) {
  	              check$1.optional(function () {
  	                env.assert(scope,
  	                  'typeof ' + value + '==="boolean"',
  	                  'invalid flag ' + prop, env.commandStr);
  	              });
  	              return value
  	            })

  	        case S_DEPTH_FUNC:
  	          return parseParam(
  	            function (value) {
  	              check$1.commandParameter(value, compareFuncs, 'invalid ' + prop, env.commandStr);
  	              return compareFuncs[value]
  	            },
  	            function (env, scope, value) {
  	              var COMPARE_FUNCS = env.constants.compareFuncs;
  	              check$1.optional(function () {
  	                env.assert(scope,
  	                  value + ' in ' + COMPARE_FUNCS,
  	                  'invalid ' + prop + ', must be one of ' + Object.keys(compareFuncs));
  	              });
  	              return scope.def(COMPARE_FUNCS, '[', value, ']')
  	            })

  	        case S_DEPTH_RANGE:
  	          return parseParam(
  	            function (value) {
  	              check$1.command(
  	                isArrayLike(value) &&
  	                value.length === 2 &&
  	                typeof value[0] === 'number' &&
  	                typeof value[1] === 'number' &&
  	                value[0] <= value[1],
  	                'depth range is 2d array',
  	                env.commandStr);
  	              return value
  	            },
  	            function (env, scope, value) {
  	              check$1.optional(function () {
  	                env.assert(scope,
  	                  env.shared.isArrayLike + '(' + value + ')&&' +
  	                  value + '.length===2&&' +
  	                  'typeof ' + value + '[0]==="number"&&' +
  	                  'typeof ' + value + '[1]==="number"&&' +
  	                  value + '[0]<=' + value + '[1]',
  	                  'depth range must be a 2d array');
  	              });

  	              var Z_NEAR = scope.def('+', value, '[0]');
  	              var Z_FAR = scope.def('+', value, '[1]');
  	              return [Z_NEAR, Z_FAR]
  	            })

  	        case S_BLEND_FUNC:
  	          return parseParam(
  	            function (value) {
  	              check$1.commandType(value, 'object', 'blend.func', env.commandStr);
  	              var srcRGB = ('srcRGB' in value ? value.srcRGB : value.src);
  	              var srcAlpha = ('srcAlpha' in value ? value.srcAlpha : value.src);
  	              var dstRGB = ('dstRGB' in value ? value.dstRGB : value.dst);
  	              var dstAlpha = ('dstAlpha' in value ? value.dstAlpha : value.dst);
  	              check$1.commandParameter(srcRGB, blendFuncs, param + '.srcRGB', env.commandStr);
  	              check$1.commandParameter(srcAlpha, blendFuncs, param + '.srcAlpha', env.commandStr);
  	              check$1.commandParameter(dstRGB, blendFuncs, param + '.dstRGB', env.commandStr);
  	              check$1.commandParameter(dstAlpha, blendFuncs, param + '.dstAlpha', env.commandStr);

  	              check$1.command(
  	                (invalidBlendCombinations.indexOf(srcRGB + ', ' + dstRGB) === -1),
  	                'unallowed blending combination (srcRGB, dstRGB) = (' + srcRGB + ', ' + dstRGB + ')', env.commandStr);

  	              return [
  	                blendFuncs[srcRGB],
  	                blendFuncs[dstRGB],
  	                blendFuncs[srcAlpha],
  	                blendFuncs[dstAlpha]
  	              ]
  	            },
  	            function (env, scope, value) {
  	              var BLEND_FUNCS = env.constants.blendFuncs;

  	              check$1.optional(function () {
  	                env.assert(scope,
  	                  value + '&&typeof ' + value + '==="object"',
  	                  'invalid blend func, must be an object');
  	              });

  	              function read (prefix, suffix) {
  	                var func = scope.def(
  	                  '"', prefix, suffix, '" in ', value,
  	                  '?', value, '.', prefix, suffix,
  	                  ':', value, '.', prefix);

  	                check$1.optional(function () {
  	                  env.assert(scope,
  	                    func + ' in ' + BLEND_FUNCS,
  	                    'invalid ' + prop + '.' + prefix + suffix + ', must be one of ' + Object.keys(blendFuncs));
  	                });

  	                return func
  	              }

  	              var srcRGB = read('src', 'RGB');
  	              var dstRGB = read('dst', 'RGB');

  	              check$1.optional(function () {
  	                var INVALID_BLEND_COMBINATIONS = env.constants.invalidBlendCombinations;

  	                env.assert(scope,
  	                  INVALID_BLEND_COMBINATIONS +
  	                           '.indexOf(' + srcRGB + '+", "+' + dstRGB + ') === -1 ',
  	                  'unallowed blending combination for (srcRGB, dstRGB)'
  	                );
  	              });

  	              var SRC_RGB = scope.def(BLEND_FUNCS, '[', srcRGB, ']');
  	              var SRC_ALPHA = scope.def(BLEND_FUNCS, '[', read('src', 'Alpha'), ']');
  	              var DST_RGB = scope.def(BLEND_FUNCS, '[', dstRGB, ']');
  	              var DST_ALPHA = scope.def(BLEND_FUNCS, '[', read('dst', 'Alpha'), ']');

  	              return [SRC_RGB, DST_RGB, SRC_ALPHA, DST_ALPHA]
  	            })

  	        case S_BLEND_EQUATION:
  	          return parseParam(
  	            function (value) {
  	              if (typeof value === 'string') {
  	                check$1.commandParameter(value, blendEquations, 'invalid ' + prop, env.commandStr);
  	                return [
  	                  blendEquations[value],
  	                  blendEquations[value]
  	                ]
  	              } else if (typeof value === 'object') {
  	                check$1.commandParameter(
  	                  value.rgb, blendEquations, prop + '.rgb', env.commandStr);
  	                check$1.commandParameter(
  	                  value.alpha, blendEquations, prop + '.alpha', env.commandStr);
  	                return [
  	                  blendEquations[value.rgb],
  	                  blendEquations[value.alpha]
  	                ]
  	              } else {
  	                check$1.commandRaise('invalid blend.equation', env.commandStr);
  	              }
  	            },
  	            function (env, scope, value) {
  	              var BLEND_EQUATIONS = env.constants.blendEquations;

  	              var RGB = scope.def();
  	              var ALPHA = scope.def();

  	              var ifte = env.cond('typeof ', value, '==="string"');

  	              check$1.optional(function () {
  	                function checkProp (block, name, value) {
  	                  env.assert(block,
  	                    value + ' in ' + BLEND_EQUATIONS,
  	                    'invalid ' + name + ', must be one of ' + Object.keys(blendEquations));
  	                }
  	                checkProp(ifte.then, prop, value);

  	                env.assert(ifte.else,
  	                  value + '&&typeof ' + value + '==="object"',
  	                  'invalid ' + prop);
  	                checkProp(ifte.else, prop + '.rgb', value + '.rgb');
  	                checkProp(ifte.else, prop + '.alpha', value + '.alpha');
  	              });

  	              ifte.then(
  	                RGB, '=', ALPHA, '=', BLEND_EQUATIONS, '[', value, '];');
  	              ifte.else(
  	                RGB, '=', BLEND_EQUATIONS, '[', value, '.rgb];',
  	                ALPHA, '=', BLEND_EQUATIONS, '[', value, '.alpha];');

  	              scope(ifte);

  	              return [RGB, ALPHA]
  	            })

  	        case S_BLEND_COLOR:
  	          return parseParam(
  	            function (value) {
  	              check$1.command(
  	                isArrayLike(value) &&
  	                value.length === 4,
  	                'blend.color must be a 4d array', env.commandStr);
  	              return loop(4, function (i) {
  	                return +value[i]
  	              })
  	            },
  	            function (env, scope, value) {
  	              check$1.optional(function () {
  	                env.assert(scope,
  	                  env.shared.isArrayLike + '(' + value + ')&&' +
  	                  value + '.length===4',
  	                  'blend.color must be a 4d array');
  	              });
  	              return loop(4, function (i) {
  	                return scope.def('+', value, '[', i, ']')
  	              })
  	            })

  	        case S_STENCIL_MASK:
  	          return parseParam(
  	            function (value) {
  	              check$1.commandType(value, 'number', param, env.commandStr);
  	              return value | 0
  	            },
  	            function (env, scope, value) {
  	              check$1.optional(function () {
  	                env.assert(scope,
  	                  'typeof ' + value + '==="number"',
  	                  'invalid stencil.mask');
  	              });
  	              return scope.def(value, '|0')
  	            })

  	        case S_STENCIL_FUNC:
  	          return parseParam(
  	            function (value) {
  	              check$1.commandType(value, 'object', param, env.commandStr);
  	              var cmp = value.cmp || 'keep';
  	              var ref = value.ref || 0;
  	              var mask = 'mask' in value ? value.mask : -1;
  	              check$1.commandParameter(cmp, compareFuncs, prop + '.cmp', env.commandStr);
  	              check$1.commandType(ref, 'number', prop + '.ref', env.commandStr);
  	              check$1.commandType(mask, 'number', prop + '.mask', env.commandStr);
  	              return [
  	                compareFuncs[cmp],
  	                ref,
  	                mask
  	              ]
  	            },
  	            function (env, scope, value) {
  	              var COMPARE_FUNCS = env.constants.compareFuncs;
  	              check$1.optional(function () {
  	                function assert () {
  	                  env.assert(scope,
  	                    Array.prototype.join.call(arguments, ''),
  	                    'invalid stencil.func');
  	                }
  	                assert(value + '&&typeof ', value, '==="object"');
  	                assert('!("cmp" in ', value, ')||(',
  	                  value, '.cmp in ', COMPARE_FUNCS, ')');
  	              });
  	              var cmp = scope.def(
  	                '"cmp" in ', value,
  	                '?', COMPARE_FUNCS, '[', value, '.cmp]',
  	                ':', GL_KEEP);
  	              var ref = scope.def(value, '.ref|0');
  	              var mask = scope.def(
  	                '"mask" in ', value,
  	                '?', value, '.mask|0:-1');
  	              return [cmp, ref, mask]
  	            })

  	        case S_STENCIL_OPFRONT:
  	        case S_STENCIL_OPBACK:
  	          return parseParam(
  	            function (value) {
  	              check$1.commandType(value, 'object', param, env.commandStr);
  	              var fail = value.fail || 'keep';
  	              var zfail = value.zfail || 'keep';
  	              var zpass = value.zpass || 'keep';
  	              check$1.commandParameter(fail, stencilOps, prop + '.fail', env.commandStr);
  	              check$1.commandParameter(zfail, stencilOps, prop + '.zfail', env.commandStr);
  	              check$1.commandParameter(zpass, stencilOps, prop + '.zpass', env.commandStr);
  	              return [
  	                prop === S_STENCIL_OPBACK ? GL_BACK : GL_FRONT,
  	                stencilOps[fail],
  	                stencilOps[zfail],
  	                stencilOps[zpass]
  	              ]
  	            },
  	            function (env, scope, value) {
  	              var STENCIL_OPS = env.constants.stencilOps;

  	              check$1.optional(function () {
  	                env.assert(scope,
  	                  value + '&&typeof ' + value + '==="object"',
  	                  'invalid ' + prop);
  	              });

  	              function read (name) {
  	                check$1.optional(function () {
  	                  env.assert(scope,
  	                    '!("' + name + '" in ' + value + ')||' +
  	                    '(' + value + '.' + name + ' in ' + STENCIL_OPS + ')',
  	                    'invalid ' + prop + '.' + name + ', must be one of ' + Object.keys(stencilOps));
  	                });

  	                return scope.def(
  	                  '"', name, '" in ', value,
  	                  '?', STENCIL_OPS, '[', value, '.', name, ']:',
  	                  GL_KEEP)
  	              }

  	              return [
  	                prop === S_STENCIL_OPBACK ? GL_BACK : GL_FRONT,
  	                read('fail'),
  	                read('zfail'),
  	                read('zpass')
  	              ]
  	            })

  	        case S_POLYGON_OFFSET_OFFSET:
  	          return parseParam(
  	            function (value) {
  	              check$1.commandType(value, 'object', param, env.commandStr);
  	              var factor = value.factor | 0;
  	              var units = value.units | 0;
  	              check$1.commandType(factor, 'number', param + '.factor', env.commandStr);
  	              check$1.commandType(units, 'number', param + '.units', env.commandStr);
  	              return [factor, units]
  	            },
  	            function (env, scope, value) {
  	              check$1.optional(function () {
  	                env.assert(scope,
  	                  value + '&&typeof ' + value + '==="object"',
  	                  'invalid ' + prop);
  	              });

  	              var FACTOR = scope.def(value, '.factor|0');
  	              var UNITS = scope.def(value, '.units|0');

  	              return [FACTOR, UNITS]
  	            })

  	        case S_CULL_FACE:
  	          return parseParam(
  	            function (value) {
  	              var face = 0;
  	              if (value === 'front') {
  	                face = GL_FRONT;
  	              } else if (value === 'back') {
  	                face = GL_BACK;
  	              }
  	              check$1.command(!!face, param, env.commandStr);
  	              return face
  	            },
  	            function (env, scope, value) {
  	              check$1.optional(function () {
  	                env.assert(scope,
  	                  value + '==="front"||' +
  	                  value + '==="back"',
  	                  'invalid cull.face');
  	              });
  	              return scope.def(value, '==="front"?', GL_FRONT, ':', GL_BACK)
  	            })

  	        case S_LINE_WIDTH:
  	          return parseParam(
  	            function (value) {
  	              check$1.command(
  	                typeof value === 'number' &&
  	                value >= limits.lineWidthDims[0] &&
  	                value <= limits.lineWidthDims[1],
  	                'invalid line width, must be a positive number between ' +
  	                limits.lineWidthDims[0] + ' and ' + limits.lineWidthDims[1], env.commandStr);
  	              return value
  	            },
  	            function (env, scope, value) {
  	              check$1.optional(function () {
  	                env.assert(scope,
  	                  'typeof ' + value + '==="number"&&' +
  	                  value + '>=' + limits.lineWidthDims[0] + '&&' +
  	                  value + '<=' + limits.lineWidthDims[1],
  	                  'invalid line width');
  	              });

  	              return value
  	            })

  	        case S_FRONT_FACE:
  	          return parseParam(
  	            function (value) {
  	              check$1.commandParameter(value, orientationType, param, env.commandStr);
  	              return orientationType[value]
  	            },
  	            function (env, scope, value) {
  	              check$1.optional(function () {
  	                env.assert(scope,
  	                  value + '==="cw"||' +
  	                  value + '==="ccw"',
  	                  'invalid frontFace, must be one of cw,ccw');
  	              });
  	              return scope.def(value + '==="cw"?' + GL_CW + ':' + GL_CCW)
  	            })

  	        case S_COLOR_MASK:
  	          return parseParam(
  	            function (value) {
  	              check$1.command(
  	                isArrayLike(value) && value.length === 4,
  	                'color.mask must be length 4 array', env.commandStr);
  	              return value.map(function (v) { return !!v })
  	            },
  	            function (env, scope, value) {
  	              check$1.optional(function () {
  	                env.assert(scope,
  	                  env.shared.isArrayLike + '(' + value + ')&&' +
  	                  value + '.length===4',
  	                  'invalid color.mask');
  	              });
  	              return loop(4, function (i) {
  	                return '!!' + value + '[' + i + ']'
  	              })
  	            })

  	        case S_SAMPLE_COVERAGE:
  	          return parseParam(
  	            function (value) {
  	              check$1.command(typeof value === 'object' && value, param, env.commandStr);
  	              var sampleValue = 'value' in value ? value.value : 1;
  	              var sampleInvert = !!value.invert;
  	              check$1.command(
  	                typeof sampleValue === 'number' &&
  	                sampleValue >= 0 && sampleValue <= 1,
  	                'sample.coverage.value must be a number between 0 and 1', env.commandStr);
  	              return [sampleValue, sampleInvert]
  	            },
  	            function (env, scope, value) {
  	              check$1.optional(function () {
  	                env.assert(scope,
  	                  value + '&&typeof ' + value + '==="object"',
  	                  'invalid sample.coverage');
  	              });
  	              var VALUE = scope.def(
  	                '"value" in ', value, '?+', value, '.value:1');
  	              var INVERT = scope.def('!!', value, '.invert');
  	              return [VALUE, INVERT]
  	            })
  	      }
  	    });

  	    return STATE
  	  }

  	  function parseUniforms (uniforms, env) {
  	    var staticUniforms = uniforms.static;
  	    var dynamicUniforms = uniforms.dynamic;

  	    var UNIFORMS = {};

  	    Object.keys(staticUniforms).forEach(function (name) {
  	      var value = staticUniforms[name];
  	      var result;
  	      if (typeof value === 'number' ||
  	          typeof value === 'boolean') {
  	        result = createStaticDecl(function () {
  	          return value
  	        });
  	      } else if (typeof value === 'function') {
  	        var reglType = value._reglType;
  	        if (reglType === 'texture2d' ||
  	            reglType === 'textureCube') {
  	          result = createStaticDecl(function (env) {
  	            return env.link(value)
  	          });
  	        } else if (reglType === 'framebuffer' ||
  	                   reglType === 'framebufferCube') {
  	          check$1.command(value.color.length > 0,
  	            'missing color attachment for framebuffer sent to uniform "' + name + '"', env.commandStr);
  	          result = createStaticDecl(function (env) {
  	            return env.link(value.color[0])
  	          });
  	        } else {
  	          check$1.commandRaise('invalid data for uniform "' + name + '"', env.commandStr);
  	        }
  	      } else if (isArrayLike(value)) {
  	        result = createStaticDecl(function (env) {
  	          var ITEM = env.global.def('[',
  	            loop(value.length, function (i) {
  	              check$1.command(
  	                typeof value[i] === 'number' ||
  	                typeof value[i] === 'boolean',
  	                'invalid uniform ' + name, env.commandStr);
  	              return value[i]
  	            }), ']');
  	          return ITEM
  	        });
  	      } else {
  	        check$1.commandRaise('invalid or missing data for uniform "' + name + '"', env.commandStr);
  	      }
  	      result.value = value;
  	      UNIFORMS[name] = result;
  	    });

  	    Object.keys(dynamicUniforms).forEach(function (key) {
  	      var dyn = dynamicUniforms[key];
  	      UNIFORMS[key] = createDynamicDecl(dyn, function (env, scope) {
  	        return env.invoke(scope, dyn)
  	      });
  	    });

  	    return UNIFORMS
  	  }

  	  function parseAttributes (attributes, env) {
  	    var staticAttributes = attributes.static;
  	    var dynamicAttributes = attributes.dynamic;

  	    var attributeDefs = {};

  	    Object.keys(staticAttributes).forEach(function (attribute) {
  	      var value = staticAttributes[attribute];
  	      var id = stringStore.id(attribute);

  	      var record = new AttributeRecord();
  	      if (isBufferArgs(value)) {
  	        record.state = ATTRIB_STATE_POINTER;
  	        record.buffer = bufferState.getBuffer(
  	          bufferState.create(value, GL_ARRAY_BUFFER$2, false, true));
  	        record.type = 0;
  	      } else {
  	        var buffer = bufferState.getBuffer(value);
  	        if (buffer) {
  	          record.state = ATTRIB_STATE_POINTER;
  	          record.buffer = buffer;
  	          record.type = 0;
  	        } else {
  	          check$1.command(typeof value === 'object' && value,
  	            'invalid data for attribute ' + attribute, env.commandStr);
  	          if ('constant' in value) {
  	            var constant = value.constant;
  	            record.buffer = 'null';
  	            record.state = ATTRIB_STATE_CONSTANT;
  	            if (typeof constant === 'number') {
  	              record.x = constant;
  	            } else {
  	              check$1.command(
  	                isArrayLike(constant) &&
  	                constant.length > 0 &&
  	                constant.length <= 4,
  	                'invalid constant for attribute ' + attribute, env.commandStr);
  	              CUTE_COMPONENTS.forEach(function (c, i) {
  	                if (i < constant.length) {
  	                  record[c] = constant[i];
  	                }
  	              });
  	            }
  	          } else {
  	            if (isBufferArgs(value.buffer)) {
  	              buffer = bufferState.getBuffer(
  	                bufferState.create(value.buffer, GL_ARRAY_BUFFER$2, false, true));
  	            } else {
  	              buffer = bufferState.getBuffer(value.buffer);
  	            }
  	            check$1.command(!!buffer, 'missing buffer for attribute "' + attribute + '"', env.commandStr);

  	            var offset = value.offset | 0;
  	            check$1.command(offset >= 0,
  	              'invalid offset for attribute "' + attribute + '"', env.commandStr);

  	            var stride = value.stride | 0;
  	            check$1.command(stride >= 0 && stride < 256,
  	              'invalid stride for attribute "' + attribute + '", must be integer betweeen [0, 255]', env.commandStr);

  	            var size = value.size | 0;
  	            check$1.command(!('size' in value) || (size > 0 && size <= 4),
  	              'invalid size for attribute "' + attribute + '", must be 1,2,3,4', env.commandStr);

  	            var normalized = !!value.normalized;

  	            var type = 0;
  	            if ('type' in value) {
  	              check$1.commandParameter(
  	                value.type, glTypes,
  	                'invalid type for attribute ' + attribute, env.commandStr);
  	              type = glTypes[value.type];
  	            }

  	            var divisor = value.divisor | 0;
  	            check$1.optional(function () {
  	              if ('divisor' in value) {
  	                check$1.command(divisor === 0 || extInstancing,
  	                  'cannot specify divisor for attribute "' + attribute + '", instancing not supported', env.commandStr);
  	                check$1.command(divisor >= 0,
  	                  'invalid divisor for attribute "' + attribute + '"', env.commandStr);
  	              }

  	              var command = env.commandStr;

  	              var VALID_KEYS = [
  	                'buffer',
  	                'offset',
  	                'divisor',
  	                'normalized',
  	                'type',
  	                'size',
  	                'stride'
  	              ];

  	              Object.keys(value).forEach(function (prop) {
  	                check$1.command(
  	                  VALID_KEYS.indexOf(prop) >= 0,
  	                  'unknown parameter "' + prop + '" for attribute pointer "' + attribute + '" (valid parameters are ' + VALID_KEYS + ')',
  	                  command);
  	              });
  	            });

  	            record.buffer = buffer;
  	            record.state = ATTRIB_STATE_POINTER;
  	            record.size = size;
  	            record.normalized = normalized;
  	            record.type = type || buffer.dtype;
  	            record.offset = offset;
  	            record.stride = stride;
  	            record.divisor = divisor;
  	          }
  	        }
  	      }

  	      attributeDefs[attribute] = createStaticDecl(function (env, scope) {
  	        var cache = env.attribCache;
  	        if (id in cache) {
  	          return cache[id]
  	        }
  	        var result = {
  	          isStream: false
  	        };
  	        Object.keys(record).forEach(function (key) {
  	          result[key] = record[key];
  	        });
  	        if (record.buffer) {
  	          result.buffer = env.link(record.buffer);
  	          result.type = result.type || (result.buffer + '.dtype');
  	        }
  	        cache[id] = result;
  	        return result
  	      });
  	    });

  	    Object.keys(dynamicAttributes).forEach(function (attribute) {
  	      var dyn = dynamicAttributes[attribute];

  	      function appendAttributeCode (env, block) {
  	        var VALUE = env.invoke(block, dyn);

  	        var shared = env.shared;
  	        var constants = env.constants;

  	        var IS_BUFFER_ARGS = shared.isBufferArgs;
  	        var BUFFER_STATE = shared.buffer;

  	        // Perform validation on attribute
  	        check$1.optional(function () {
  	          env.assert(block,
  	            VALUE + '&&(typeof ' + VALUE + '==="object"||typeof ' +
  	            VALUE + '==="function")&&(' +
  	            IS_BUFFER_ARGS + '(' + VALUE + ')||' +
  	            BUFFER_STATE + '.getBuffer(' + VALUE + ')||' +
  	            BUFFER_STATE + '.getBuffer(' + VALUE + '.buffer)||' +
  	            IS_BUFFER_ARGS + '(' + VALUE + '.buffer)||' +
  	            '("constant" in ' + VALUE +
  	            '&&(typeof ' + VALUE + '.constant==="number"||' +
  	            shared.isArrayLike + '(' + VALUE + '.constant))))',
  	            'invalid dynamic attribute "' + attribute + '"');
  	        });

  	        // allocate names for result
  	        var result = {
  	          isStream: block.def(false)
  	        };
  	        var defaultRecord = new AttributeRecord();
  	        defaultRecord.state = ATTRIB_STATE_POINTER;
  	        Object.keys(defaultRecord).forEach(function (key) {
  	          result[key] = block.def('' + defaultRecord[key]);
  	        });

  	        var BUFFER = result.buffer;
  	        var TYPE = result.type;
  	        block(
  	          'if(', IS_BUFFER_ARGS, '(', VALUE, ')){',
  	          result.isStream, '=true;',
  	          BUFFER, '=', BUFFER_STATE, '.createStream(', GL_ARRAY_BUFFER$2, ',', VALUE, ');',
  	          TYPE, '=', BUFFER, '.dtype;',
  	          '}else{',
  	          BUFFER, '=', BUFFER_STATE, '.getBuffer(', VALUE, ');',
  	          'if(', BUFFER, '){',
  	          TYPE, '=', BUFFER, '.dtype;',
  	          '}else if("constant" in ', VALUE, '){',
  	          result.state, '=', ATTRIB_STATE_CONSTANT, ';',
  	          'if(typeof ' + VALUE + '.constant === "number"){',
  	          result[CUTE_COMPONENTS[0]], '=', VALUE, '.constant;',
  	          CUTE_COMPONENTS.slice(1).map(function (n) {
  	            return result[n]
  	          }).join('='), '=0;',
  	          '}else{',
  	          CUTE_COMPONENTS.map(function (name, i) {
  	            return (
  	              result[name] + '=' + VALUE + '.constant.length>' + i +
  	              '?' + VALUE + '.constant[' + i + ']:0;'
  	            )
  	          }).join(''),
  	          '}}else{',
  	          'if(', IS_BUFFER_ARGS, '(', VALUE, '.buffer)){',
  	          BUFFER, '=', BUFFER_STATE, '.createStream(', GL_ARRAY_BUFFER$2, ',', VALUE, '.buffer);',
  	          '}else{',
  	          BUFFER, '=', BUFFER_STATE, '.getBuffer(', VALUE, '.buffer);',
  	          '}',
  	          TYPE, '="type" in ', VALUE, '?',
  	          constants.glTypes, '[', VALUE, '.type]:', BUFFER, '.dtype;',
  	          result.normalized, '=!!', VALUE, '.normalized;');
  	        function emitReadRecord (name) {
  	          block(result[name], '=', VALUE, '.', name, '|0;');
  	        }
  	        emitReadRecord('size');
  	        emitReadRecord('offset');
  	        emitReadRecord('stride');
  	        emitReadRecord('divisor');

  	        block('}}');

  	        block.exit(
  	          'if(', result.isStream, '){',
  	          BUFFER_STATE, '.destroyStream(', BUFFER, ');',
  	          '}');

  	        return result
  	      }

  	      attributeDefs[attribute] = createDynamicDecl(dyn, appendAttributeCode);
  	    });

  	    return attributeDefs
  	  }

  	  function parseContext (context) {
  	    var staticContext = context.static;
  	    var dynamicContext = context.dynamic;
  	    var result = {};

  	    Object.keys(staticContext).forEach(function (name) {
  	      var value = staticContext[name];
  	      result[name] = createStaticDecl(function (env, scope) {
  	        if (typeof value === 'number' || typeof value === 'boolean') {
  	          return '' + value
  	        } else {
  	          return env.link(value)
  	        }
  	      });
  	    });

  	    Object.keys(dynamicContext).forEach(function (name) {
  	      var dyn = dynamicContext[name];
  	      result[name] = createDynamicDecl(dyn, function (env, scope) {
  	        return env.invoke(scope, dyn)
  	      });
  	    });

  	    return result
  	  }

  	  function parseArguments (options, attributes, uniforms, context, env) {
  	    var staticOptions = options.static;
  	    var dynamicOptions = options.dynamic;

  	    check$1.optional(function () {
  	      var KEY_NAMES = [
  	        S_FRAMEBUFFER,
  	        S_VERT,
  	        S_FRAG,
  	        S_ELEMENTS,
  	        S_PRIMITIVE,
  	        S_OFFSET,
  	        S_COUNT,
  	        S_INSTANCES,
  	        S_PROFILE,
  	        S_VAO
  	      ].concat(GL_STATE_NAMES);

  	      function checkKeys (dict) {
  	        Object.keys(dict).forEach(function (key) {
  	          check$1.command(
  	            KEY_NAMES.indexOf(key) >= 0,
  	            'unknown parameter "' + key + '"',
  	            env.commandStr);
  	        });
  	      }

  	      checkKeys(staticOptions);
  	      checkKeys(dynamicOptions);
  	    });

  	    var attribLocations = parseAttribLocations(options, attributes);

  	    var framebuffer = parseFramebuffer(options);
  	    var viewportAndScissor = parseViewportScissor(options, framebuffer, env);
  	    var draw = parseDraw(options, env);
  	    var state = parseGLState(options, env);
  	    var shader = parseProgram(options, env, attribLocations);

  	    function copyBox (name) {
  	      var defn = viewportAndScissor[name];
  	      if (defn) {
  	        state[name] = defn;
  	      }
  	    }
  	    copyBox(S_VIEWPORT);
  	    copyBox(propName(S_SCISSOR_BOX));

  	    var dirty = Object.keys(state).length > 0;

  	    var result = {
  	      framebuffer: framebuffer,
  	      draw: draw,
  	      shader: shader,
  	      state: state,
  	      dirty: dirty,
  	      scopeVAO: null,
  	      drawVAO: null,
  	      useVAO: false,
  	      attributes: {}
  	    };

  	    result.profile = parseProfile(options);
  	    result.uniforms = parseUniforms(uniforms, env);
  	    result.drawVAO = result.scopeVAO = draw.vao;
  	    // special case: check if we can statically allocate a vertex array object for this program
  	    if (!result.drawVAO &&
  	      shader.program &&
  	      !attribLocations &&
  	      extensions.angle_instanced_arrays &&
  	      draw.static.elements) {
  	      var useVAO = true;
  	      var staticBindings = shader.program.attributes.map(function (attr) {
  	        var binding = attributes.static[attr];
  	        useVAO = useVAO && !!binding;
  	        return binding
  	      });
  	      if (useVAO && staticBindings.length > 0) {
  	        var vao = attributeState.getVAO(attributeState.createVAO({
  	          attributes: staticBindings,
  	          elements: draw.static.elements
  	        }));
  	        result.drawVAO = new Declaration(null, null, null, function (env, scope) {
  	          return env.link(vao)
  	        });
  	        result.useVAO = true;
  	      }
  	    }
  	    if (attribLocations) {
  	      result.useVAO = true;
  	    } else {
  	      result.attributes = parseAttributes(attributes, env);
  	    }
  	    result.context = parseContext(context);
  	    return result
  	  }

  	  // ===================================================
  	  // ===================================================
  	  // COMMON UPDATE FUNCTIONS
  	  // ===================================================
  	  // ===================================================
  	  function emitContext (env, scope, context) {
  	    var shared = env.shared;
  	    var CONTEXT = shared.context;

  	    var contextEnter = env.scope();

  	    Object.keys(context).forEach(function (name) {
  	      scope.save(CONTEXT, '.' + name);
  	      var defn = context[name];
  	      var value = defn.append(env, scope);
  	      if (Array.isArray(value)) {
  	        contextEnter(CONTEXT, '.', name, '=[', value.join(), '];');
  	      } else {
  	        contextEnter(CONTEXT, '.', name, '=', value, ';');
  	      }
  	    });

  	    scope(contextEnter);
  	  }

  	  // ===================================================
  	  // ===================================================
  	  // COMMON DRAWING FUNCTIONS
  	  // ===================================================
  	  // ===================================================
  	  function emitPollFramebuffer (env, scope, framebuffer, skipCheck) {
  	    var shared = env.shared;

  	    var GL = shared.gl;
  	    var FRAMEBUFFER_STATE = shared.framebuffer;
  	    var EXT_DRAW_BUFFERS;
  	    if (extDrawBuffers) {
  	      EXT_DRAW_BUFFERS = scope.def(shared.extensions, '.webgl_draw_buffers');
  	    }

  	    var constants = env.constants;

  	    var DRAW_BUFFERS = constants.drawBuffer;
  	    var BACK_BUFFER = constants.backBuffer;

  	    var NEXT;
  	    if (framebuffer) {
  	      NEXT = framebuffer.append(env, scope);
  	    } else {
  	      NEXT = scope.def(FRAMEBUFFER_STATE, '.next');
  	    }

  	    if (!skipCheck) {
  	      scope('if(', NEXT, '!==', FRAMEBUFFER_STATE, '.cur){');
  	    }
  	    scope(
  	      'if(', NEXT, '){',
  	      GL, '.bindFramebuffer(', GL_FRAMEBUFFER$2, ',', NEXT, '.framebuffer);');
  	    if (extDrawBuffers) {
  	      scope(EXT_DRAW_BUFFERS, '.drawBuffersWEBGL(',
  	        DRAW_BUFFERS, '[', NEXT, '.colorAttachments.length]);');
  	    }
  	    scope('}else{',
  	      GL, '.bindFramebuffer(', GL_FRAMEBUFFER$2, ',null);');
  	    if (extDrawBuffers) {
  	      scope(EXT_DRAW_BUFFERS, '.drawBuffersWEBGL(', BACK_BUFFER, ');');
  	    }
  	    scope(
  	      '}',
  	      FRAMEBUFFER_STATE, '.cur=', NEXT, ';');
  	    if (!skipCheck) {
  	      scope('}');
  	    }
  	  }

  	  function emitPollState (env, scope, args) {
  	    var shared = env.shared;

  	    var GL = shared.gl;

  	    var CURRENT_VARS = env.current;
  	    var NEXT_VARS = env.next;
  	    var CURRENT_STATE = shared.current;
  	    var NEXT_STATE = shared.next;

  	    var block = env.cond(CURRENT_STATE, '.dirty');

  	    GL_STATE_NAMES.forEach(function (prop) {
  	      var param = propName(prop);
  	      if (param in args.state) {
  	        return
  	      }

  	      var NEXT, CURRENT;
  	      if (param in NEXT_VARS) {
  	        NEXT = NEXT_VARS[param];
  	        CURRENT = CURRENT_VARS[param];
  	        var parts = loop(currentState[param].length, function (i) {
  	          return block.def(NEXT, '[', i, ']')
  	        });
  	        block(env.cond(parts.map(function (p, i) {
  	          return p + '!==' + CURRENT + '[' + i + ']'
  	        }).join('||'))
  	          .then(
  	            GL, '.', GL_VARIABLES[param], '(', parts, ');',
  	            parts.map(function (p, i) {
  	              return CURRENT + '[' + i + ']=' + p
  	            }).join(';'), ';'));
  	      } else {
  	        NEXT = block.def(NEXT_STATE, '.', param);
  	        var ifte = env.cond(NEXT, '!==', CURRENT_STATE, '.', param);
  	        block(ifte);
  	        if (param in GL_FLAGS) {
  	          ifte(
  	            env.cond(NEXT)
  	              .then(GL, '.enable(', GL_FLAGS[param], ');')
  	              .else(GL, '.disable(', GL_FLAGS[param], ');'),
  	            CURRENT_STATE, '.', param, '=', NEXT, ';');
  	        } else {
  	          ifte(
  	            GL, '.', GL_VARIABLES[param], '(', NEXT, ');',
  	            CURRENT_STATE, '.', param, '=', NEXT, ';');
  	        }
  	      }
  	    });
  	    if (Object.keys(args.state).length === 0) {
  	      block(CURRENT_STATE, '.dirty=false;');
  	    }
  	    scope(block);
  	  }

  	  function emitSetOptions (env, scope, options, filter) {
  	    var shared = env.shared;
  	    var CURRENT_VARS = env.current;
  	    var CURRENT_STATE = shared.current;
  	    var GL = shared.gl;
  	    sortState(Object.keys(options)).forEach(function (param) {
  	      var defn = options[param];
  	      if (filter && !filter(defn)) {
  	        return
  	      }
  	      var variable = defn.append(env, scope);
  	      if (GL_FLAGS[param]) {
  	        var flag = GL_FLAGS[param];
  	        if (isStatic(defn)) {
  	          if (variable) {
  	            scope(GL, '.enable(', flag, ');');
  	          } else {
  	            scope(GL, '.disable(', flag, ');');
  	          }
  	        } else {
  	          scope(env.cond(variable)
  	            .then(GL, '.enable(', flag, ');')
  	            .else(GL, '.disable(', flag, ');'));
  	        }
  	        scope(CURRENT_STATE, '.', param, '=', variable, ';');
  	      } else if (isArrayLike(variable)) {
  	        var CURRENT = CURRENT_VARS[param];
  	        scope(
  	          GL, '.', GL_VARIABLES[param], '(', variable, ');',
  	          variable.map(function (v, i) {
  	            return CURRENT + '[' + i + ']=' + v
  	          }).join(';'), ';');
  	      } else {
  	        scope(
  	          GL, '.', GL_VARIABLES[param], '(', variable, ');',
  	          CURRENT_STATE, '.', param, '=', variable, ';');
  	      }
  	    });
  	  }

  	  function injectExtensions (env, scope) {
  	    if (extInstancing) {
  	      env.instancing = scope.def(
  	        env.shared.extensions, '.angle_instanced_arrays');
  	    }
  	  }

  	  function emitProfile (env, scope, args, useScope, incrementCounter) {
  	    var shared = env.shared;
  	    var STATS = env.stats;
  	    var CURRENT_STATE = shared.current;
  	    var TIMER = shared.timer;
  	    var profileArg = args.profile;

  	    function perfCounter () {
  	      if (typeof performance === 'undefined') {
  	        return 'Date.now()'
  	      } else {
  	        return 'performance.now()'
  	      }
  	    }

  	    var CPU_START, QUERY_COUNTER;
  	    function emitProfileStart (block) {
  	      CPU_START = scope.def();
  	      block(CPU_START, '=', perfCounter(), ';');
  	      if (typeof incrementCounter === 'string') {
  	        block(STATS, '.count+=', incrementCounter, ';');
  	      } else {
  	        block(STATS, '.count++;');
  	      }
  	      if (timer) {
  	        if (useScope) {
  	          QUERY_COUNTER = scope.def();
  	          block(QUERY_COUNTER, '=', TIMER, '.getNumPendingQueries();');
  	        } else {
  	          block(TIMER, '.beginQuery(', STATS, ');');
  	        }
  	      }
  	    }

  	    function emitProfileEnd (block) {
  	      block(STATS, '.cpuTime+=', perfCounter(), '-', CPU_START, ';');
  	      if (timer) {
  	        if (useScope) {
  	          block(TIMER, '.pushScopeStats(',
  	            QUERY_COUNTER, ',',
  	            TIMER, '.getNumPendingQueries(),',
  	            STATS, ');');
  	        } else {
  	          block(TIMER, '.endQuery();');
  	        }
  	      }
  	    }

  	    function scopeProfile (value) {
  	      var prev = scope.def(CURRENT_STATE, '.profile');
  	      scope(CURRENT_STATE, '.profile=', value, ';');
  	      scope.exit(CURRENT_STATE, '.profile=', prev, ';');
  	    }

  	    var USE_PROFILE;
  	    if (profileArg) {
  	      if (isStatic(profileArg)) {
  	        if (profileArg.enable) {
  	          emitProfileStart(scope);
  	          emitProfileEnd(scope.exit);
  	          scopeProfile('true');
  	        } else {
  	          scopeProfile('false');
  	        }
  	        return
  	      }
  	      USE_PROFILE = profileArg.append(env, scope);
  	      scopeProfile(USE_PROFILE);
  	    } else {
  	      USE_PROFILE = scope.def(CURRENT_STATE, '.profile');
  	    }

  	    var start = env.block();
  	    emitProfileStart(start);
  	    scope('if(', USE_PROFILE, '){', start, '}');
  	    var end = env.block();
  	    emitProfileEnd(end);
  	    scope.exit('if(', USE_PROFILE, '){', end, '}');
  	  }

  	  function emitAttributes (env, scope, args, attributes, filter) {
  	    var shared = env.shared;

  	    function typeLength (x) {
  	      switch (x) {
  	        case GL_FLOAT_VEC2:
  	        case GL_INT_VEC2:
  	        case GL_BOOL_VEC2:
  	          return 2
  	        case GL_FLOAT_VEC3:
  	        case GL_INT_VEC3:
  	        case GL_BOOL_VEC3:
  	          return 3
  	        case GL_FLOAT_VEC4:
  	        case GL_INT_VEC4:
  	        case GL_BOOL_VEC4:
  	          return 4
  	        default:
  	          return 1
  	      }
  	    }

  	    function emitBindAttribute (ATTRIBUTE, size, record) {
  	      var GL = shared.gl;

  	      var LOCATION = scope.def(ATTRIBUTE, '.location');
  	      var BINDING = scope.def(shared.attributes, '[', LOCATION, ']');

  	      var STATE = record.state;
  	      var BUFFER = record.buffer;
  	      var CONST_COMPONENTS = [
  	        record.x,
  	        record.y,
  	        record.z,
  	        record.w
  	      ];

  	      var COMMON_KEYS = [
  	        'buffer',
  	        'normalized',
  	        'offset',
  	        'stride'
  	      ];

  	      function emitBuffer () {
  	        scope(
  	          'if(!', BINDING, '.buffer){',
  	          GL, '.enableVertexAttribArray(', LOCATION, ');}');

  	        var TYPE = record.type;
  	        var SIZE;
  	        if (!record.size) {
  	          SIZE = size;
  	        } else {
  	          SIZE = scope.def(record.size, '||', size);
  	        }

  	        scope('if(',
  	          BINDING, '.type!==', TYPE, '||',
  	          BINDING, '.size!==', SIZE, '||',
  	          COMMON_KEYS.map(function (key) {
  	            return BINDING + '.' + key + '!==' + record[key]
  	          }).join('||'),
  	          '){',
  	          GL, '.bindBuffer(', GL_ARRAY_BUFFER$2, ',', BUFFER, '.buffer);',
  	          GL, '.vertexAttribPointer(', [
  	            LOCATION,
  	            SIZE,
  	            TYPE,
  	            record.normalized,
  	            record.stride,
  	            record.offset
  	          ], ');',
  	          BINDING, '.type=', TYPE, ';',
  	          BINDING, '.size=', SIZE, ';',
  	          COMMON_KEYS.map(function (key) {
  	            return BINDING + '.' + key + '=' + record[key] + ';'
  	          }).join(''),
  	          '}');

  	        if (extInstancing) {
  	          var DIVISOR = record.divisor;
  	          scope(
  	            'if(', BINDING, '.divisor!==', DIVISOR, '){',
  	            env.instancing, '.vertexAttribDivisorANGLE(', [LOCATION, DIVISOR], ');',
  	            BINDING, '.divisor=', DIVISOR, ';}');
  	        }
  	      }

  	      function emitConstant () {
  	        scope(
  	          'if(', BINDING, '.buffer){',
  	          GL, '.disableVertexAttribArray(', LOCATION, ');',
  	          BINDING, '.buffer=null;',
  	          '}if(', CUTE_COMPONENTS.map(function (c, i) {
  	            return BINDING + '.' + c + '!==' + CONST_COMPONENTS[i]
  	          }).join('||'), '){',
  	          GL, '.vertexAttrib4f(', LOCATION, ',', CONST_COMPONENTS, ');',
  	          CUTE_COMPONENTS.map(function (c, i) {
  	            return BINDING + '.' + c + '=' + CONST_COMPONENTS[i] + ';'
  	          }).join(''),
  	          '}');
  	      }

  	      if (STATE === ATTRIB_STATE_POINTER) {
  	        emitBuffer();
  	      } else if (STATE === ATTRIB_STATE_CONSTANT) {
  	        emitConstant();
  	      } else {
  	        scope('if(', STATE, '===', ATTRIB_STATE_POINTER, '){');
  	        emitBuffer();
  	        scope('}else{');
  	        emitConstant();
  	        scope('}');
  	      }
  	    }

  	    attributes.forEach(function (attribute) {
  	      var name = attribute.name;
  	      var arg = args.attributes[name];
  	      var record;
  	      if (arg) {
  	        if (!filter(arg)) {
  	          return
  	        }
  	        record = arg.append(env, scope);
  	      } else {
  	        if (!filter(SCOPE_DECL)) {
  	          return
  	        }
  	        var scopeAttrib = env.scopeAttrib(name);
  	        check$1.optional(function () {
  	          env.assert(scope,
  	            scopeAttrib + '.state',
  	            'missing attribute ' + name);
  	        });
  	        record = {};
  	        Object.keys(new AttributeRecord()).forEach(function (key) {
  	          record[key] = scope.def(scopeAttrib, '.', key);
  	        });
  	      }
  	      emitBindAttribute(
  	        env.link(attribute), typeLength(attribute.info.type), record);
  	    });
  	  }

  	  function emitUniforms (env, scope, args, uniforms, filter, isBatchInnerLoop) {
  	    var shared = env.shared;
  	    var GL = shared.gl;

  	    var definedArrUniforms = {};
  	    var infix;
  	    for (var i = 0; i < uniforms.length; ++i) {
  	      var uniform = uniforms[i];
  	      var name = uniform.name;
  	      var type = uniform.info.type;
  	      var size = uniform.info.size;
  	      var arg = args.uniforms[name];
  	      if (size > 1) {
  	        // either foo[n] or foos, avoid define both
  	        if (!arg) {
  	          continue
  	        }
  	        var arrUniformName = name.replace('[0]', '');
  	        if (definedArrUniforms[arrUniformName]) {
  	          continue
  	        }
  	        definedArrUniforms[arrUniformName] = 1;
  	      }
  	      var UNIFORM = env.link(uniform);
  	      var LOCATION = UNIFORM + '.location';

  	      var VALUE;
  	      if (arg) {
  	        if (!filter(arg)) {
  	          continue
  	        }
  	        if (isStatic(arg)) {
  	          var value = arg.value;
  	          check$1.command(
  	            value !== null && typeof value !== 'undefined',
  	            'missing uniform "' + name + '"', env.commandStr);
  	          if (type === GL_SAMPLER_2D || type === GL_SAMPLER_CUBE) {
  	            check$1.command(
  	              typeof value === 'function' &&
  	              ((type === GL_SAMPLER_2D &&
  	                (value._reglType === 'texture2d' ||
  	                value._reglType === 'framebuffer')) ||
  	              (type === GL_SAMPLER_CUBE &&
  	                (value._reglType === 'textureCube' ||
  	                value._reglType === 'framebufferCube'))),
  	              'invalid texture for uniform ' + name, env.commandStr);
  	            var TEX_VALUE = env.link(value._texture || value.color[0]._texture);
  	            scope(GL, '.uniform1i(', LOCATION, ',', TEX_VALUE + '.bind());');
  	            scope.exit(TEX_VALUE, '.unbind();');
  	          } else if (
  	            type === GL_FLOAT_MAT2 ||
  	            type === GL_FLOAT_MAT3 ||
  	            type === GL_FLOAT_MAT4) {
  	            check$1.optional(function () {
  	              check$1.command(isArrayLike(value),
  	                'invalid matrix for uniform ' + name, env.commandStr);
  	              check$1.command(
  	                (type === GL_FLOAT_MAT2 && value.length === 4) ||
  	                (type === GL_FLOAT_MAT3 && value.length === 9) ||
  	                (type === GL_FLOAT_MAT4 && value.length === 16),
  	                'invalid length for matrix uniform ' + name, env.commandStr);
  	            });
  	            var MAT_VALUE = env.global.def('new Float32Array([' +
  	              Array.prototype.slice.call(value) + '])');
  	            var dim = 2;
  	            if (type === GL_FLOAT_MAT3) {
  	              dim = 3;
  	            } else if (type === GL_FLOAT_MAT4) {
  	              dim = 4;
  	            }
  	            scope(
  	              GL, '.uniformMatrix', dim, 'fv(',
  	              LOCATION, ',false,', MAT_VALUE, ');');
  	          } else {
  	            switch (type) {
  	              case GL_FLOAT$8:
  	                if (size === 1) {
  	                  check$1.commandType(value, 'number', 'uniform ' + name, env.commandStr);
  	                } else {
  	                  check$1.command(
  	                    isArrayLike(value) && (value.length === size),
  	                    'uniform ' + name, env.commandStr);
  	                }
  	                infix = '1f';
  	                break
  	              case GL_FLOAT_VEC2:
  	                check$1.command(
  	                  isArrayLike(value) && (value.length && value.length % 2 === 0 && value.length <= size * 2),
  	                  'uniform ' + name, env.commandStr);
  	                infix = '2f';
  	                break
  	              case GL_FLOAT_VEC3:
  	                check$1.command(
  	                  isArrayLike(value) && (value.length && value.length % 3 === 0 && value.length <= size * 3),
  	                  'uniform ' + name, env.commandStr);
  	                infix = '3f';
  	                break
  	              case GL_FLOAT_VEC4:
  	                check$1.command(
  	                  isArrayLike(value) && (value.length && value.length % 4 === 0 && value.length <= size * 4),
  	                  'uniform ' + name, env.commandStr);
  	                infix = '4f';
  	                break
  	              case GL_BOOL:
  	                if (size === 1) {
  	                  check$1.commandType(value, 'boolean', 'uniform ' + name, env.commandStr);
  	                } else {
  	                  check$1.command(
  	                    isArrayLike(value) && (value.length === size),
  	                    'uniform ' + name, env.commandStr);
  	                }
  	                infix = '1i';
  	                break
  	              case GL_INT$3:
  	                if (size === 1) {
  	                  check$1.commandType(value, 'number', 'uniform ' + name, env.commandStr);
  	                } else {
  	                  check$1.command(
  	                    isArrayLike(value) && (value.length === size),
  	                    'uniform ' + name, env.commandStr);
  	                }
  	                infix = '1i';
  	                break
  	              case GL_BOOL_VEC2:
  	                check$1.command(
  	                  isArrayLike(value) && (value.length && value.length % 2 === 0 && value.length <= size * 2),
  	                  'uniform ' + name, env.commandStr);
  	                infix = '2i';
  	                break
  	              case GL_INT_VEC2:
  	                check$1.command(
  	                  isArrayLike(value) && (value.length && value.length % 2 === 0 && value.length <= size * 2),
  	                  'uniform ' + name, env.commandStr);
  	                infix = '2i';
  	                break
  	              case GL_BOOL_VEC3:
  	                check$1.command(
  	                  isArrayLike(value) && (value.length && value.length % 3 === 0 && value.length <= size * 3),
  	                  'uniform ' + name, env.commandStr);
  	                infix = '3i';
  	                break
  	              case GL_INT_VEC3:
  	                check$1.command(
  	                  isArrayLike(value) && (value.length && value.length % 3 === 0 && value.length <= size * 3),
  	                  'uniform ' + name, env.commandStr);
  	                infix = '3i';
  	                break
  	              case GL_BOOL_VEC4:
  	                check$1.command(
  	                  isArrayLike(value) && (value.length && value.length % 4 === 0 && value.length <= size * 4),
  	                  'uniform ' + name, env.commandStr);
  	                infix = '4i';
  	                break
  	              case GL_INT_VEC4:
  	                check$1.command(
  	                  isArrayLike(value) && (value.length && value.length % 4 === 0 && value.length <= size * 4),
  	                  'uniform ' + name, env.commandStr);
  	                infix = '4i';
  	                break
  	            }
  	            if (size > 1) {
  	              infix += 'v';
  	              value = env.global.def('[' +
  	              Array.prototype.slice.call(value) + ']');
  	            } else {
  	              value = isArrayLike(value) ? Array.prototype.slice.call(value) : value;
  	            }
  	            scope(GL, '.uniform', infix, '(', LOCATION, ',',
  	              value,
  	              ');');
  	          }
  	          continue
  	        } else {
  	          VALUE = arg.append(env, scope);
  	        }
  	      } else {
  	        if (!filter(SCOPE_DECL)) {
  	          continue
  	        }
  	        VALUE = scope.def(shared.uniforms, '[', stringStore.id(name), ']');
  	      }

  	      if (type === GL_SAMPLER_2D) {
  	        check$1(!Array.isArray(VALUE), 'must specify a scalar prop for textures');
  	        scope(
  	          'if(', VALUE, '&&', VALUE, '._reglType==="framebuffer"){',
  	          VALUE, '=', VALUE, '.color[0];',
  	          '}');
  	      } else if (type === GL_SAMPLER_CUBE) {
  	        check$1(!Array.isArray(VALUE), 'must specify a scalar prop for cube maps');
  	        scope(
  	          'if(', VALUE, '&&', VALUE, '._reglType==="framebufferCube"){',
  	          VALUE, '=', VALUE, '.color[0];',
  	          '}');
  	      }

  	      // perform type validation
  	      check$1.optional(function () {
  	        function emitCheck (pred, message) {
  	          env.assert(scope, pred,
  	            'bad data or missing for uniform "' + name + '".  ' + message);
  	        }

  	        function checkType (type, size) {
  	          if (size === 1) {
  	            check$1(!Array.isArray(VALUE), 'must not specify an array type for uniform');
  	          }
  	          emitCheck(
  	            'Array.isArray(' + VALUE + ') && typeof ' + VALUE + '[0]===" ' + type + '"' +
  	            ' || typeof ' + VALUE + '==="' + type + '"',
  	            'invalid type, expected ' + type);
  	        }

  	        function checkVector (n, type, size) {
  	          if (Array.isArray(VALUE)) {
  	            check$1(VALUE.length && VALUE.length % n === 0 && VALUE.length <= n * size, 'must have length of ' + (size === 1 ? '' : 'n * ') + n);
  	          } else {
  	            emitCheck(
  	              shared.isArrayLike + '(' + VALUE + ')&&' + VALUE + '.length && ' + VALUE + '.length % ' + n + ' === 0' +
  	              ' && ' + VALUE + '.length<=' + n * size,
  	              'invalid vector, should have length of ' + (size === 1 ? '' : 'n * ') + n, env.commandStr);
  	          }
  	        }

  	        function checkTexture (target) {
  	          check$1(!Array.isArray(VALUE), 'must not specify a value type');
  	          emitCheck(
  	            'typeof ' + VALUE + '==="function"&&' +
  	            VALUE + '._reglType==="texture' +
  	            (target === GL_TEXTURE_2D$3 ? '2d' : 'Cube') + '"',
  	            'invalid texture type', env.commandStr);
  	        }

  	        switch (type) {
  	          case GL_INT$3:
  	            checkType('number', size);
  	            break
  	          case GL_INT_VEC2:
  	            checkVector(2, 'number', size);
  	            break
  	          case GL_INT_VEC3:
  	            checkVector(3, 'number', size);
  	            break
  	          case GL_INT_VEC4:
  	            checkVector(4, 'number', size);
  	            break
  	          case GL_FLOAT$8:
  	            checkType('number', size);
  	            break
  	          case GL_FLOAT_VEC2:
  	            checkVector(2, 'number', size);
  	            break
  	          case GL_FLOAT_VEC3:
  	            checkVector(3, 'number', size);
  	            break
  	          case GL_FLOAT_VEC4:
  	            checkVector(4, 'number', size);
  	            break
  	          case GL_BOOL:
  	            checkType('boolean', size);
  	            break
  	          case GL_BOOL_VEC2:
  	            checkVector(2, 'boolean', size);
  	            break
  	          case GL_BOOL_VEC3:
  	            checkVector(3, 'boolean', size);
  	            break
  	          case GL_BOOL_VEC4:
  	            checkVector(4, 'boolean', size);
  	            break
  	          case GL_FLOAT_MAT2:
  	            checkVector(4, 'number', size);
  	            break
  	          case GL_FLOAT_MAT3:
  	            checkVector(9, 'number', size);
  	            break
  	          case GL_FLOAT_MAT4:
  	            checkVector(16, 'number', size);
  	            break
  	          case GL_SAMPLER_2D:
  	            checkTexture(GL_TEXTURE_2D$3);
  	            break
  	          case GL_SAMPLER_CUBE:
  	            checkTexture(GL_TEXTURE_CUBE_MAP$2);
  	            break
  	        }
  	      });

  	      var unroll = 1;
  	      switch (type) {
  	        case GL_SAMPLER_2D:
  	        case GL_SAMPLER_CUBE:
  	          var TEX = scope.def(VALUE, '._texture');
  	          scope(GL, '.uniform1i(', LOCATION, ',', TEX, '.bind());');
  	          scope.exit(TEX, '.unbind();');
  	          continue

  	        case GL_INT$3:
  	        case GL_BOOL:
  	          infix = '1i';
  	          break

  	        case GL_INT_VEC2:
  	        case GL_BOOL_VEC2:
  	          infix = '2i';
  	          unroll = 2;
  	          break

  	        case GL_INT_VEC3:
  	        case GL_BOOL_VEC3:
  	          infix = '3i';
  	          unroll = 3;
  	          break

  	        case GL_INT_VEC4:
  	        case GL_BOOL_VEC4:
  	          infix = '4i';
  	          unroll = 4;
  	          break

  	        case GL_FLOAT$8:
  	          infix = '1f';
  	          break

  	        case GL_FLOAT_VEC2:
  	          infix = '2f';
  	          unroll = 2;
  	          break

  	        case GL_FLOAT_VEC3:
  	          infix = '3f';
  	          unroll = 3;
  	          break

  	        case GL_FLOAT_VEC4:
  	          infix = '4f';
  	          unroll = 4;
  	          break

  	        case GL_FLOAT_MAT2:
  	          infix = 'Matrix2fv';
  	          break

  	        case GL_FLOAT_MAT3:
  	          infix = 'Matrix3fv';
  	          break

  	        case GL_FLOAT_MAT4:
  	          infix = 'Matrix4fv';
  	          break
  	      }

  	      if (infix.indexOf('Matrix') === -1 && size > 1) {
  	        infix += 'v';
  	        unroll = 1;
  	      }

  	      if (infix.charAt(0) === 'M') {
  	        scope(GL, '.uniform', infix, '(', LOCATION, ',');
  	        var matSize = Math.pow(type - GL_FLOAT_MAT2 + 2, 2);
  	        var STORAGE = env.global.def('new Float32Array(', matSize, ')');
  	        if (Array.isArray(VALUE)) {
  	          scope(
  	            'false,(',
  	            loop(matSize, function (i) {
  	              return STORAGE + '[' + i + ']=' + VALUE[i]
  	            }), ',', STORAGE, ')');
  	        } else {
  	          scope(
  	            'false,(Array.isArray(', VALUE, ')||', VALUE, ' instanceof Float32Array)?', VALUE, ':(',
  	            loop(matSize, function (i) {
  	              return STORAGE + '[' + i + ']=' + VALUE + '[' + i + ']'
  	            }), ',', STORAGE, ')');
  	        }
  	        scope(');');
  	      } else if (unroll > 1) {
  	        var prev = [];
  	        var cur = [];
  	        for (var j = 0; j < unroll; ++j) {
  	          if (Array.isArray(VALUE)) {
  	            cur.push(VALUE[j]);
  	          } else {
  	            cur.push(scope.def(VALUE + '[' + j + ']'));
  	          }
  	          if (isBatchInnerLoop) {
  	            prev.push(scope.def());
  	          }
  	        }
  	        if (isBatchInnerLoop) {
  	          scope('if(!', env.batchId, '||', prev.map(function (p, i) {
  	            return p + '!==' + cur[i]
  	          }).join('||'), '){', prev.map(function (p, i) {
  	            return p + '=' + cur[i] + ';'
  	          }).join(''));
  	        }
  	        scope(GL, '.uniform', infix, '(', LOCATION, ',', cur.join(','), ');');
  	        if (isBatchInnerLoop) {
  	          scope('}');
  	        }
  	      } else {
  	        check$1(!Array.isArray(VALUE), 'uniform value must not be an array');
  	        if (isBatchInnerLoop) {
  	          var prevS = scope.def();
  	          scope('if(!', env.batchId, '||', prevS, '!==', VALUE, '){',
  	            prevS, '=', VALUE, ';');
  	        }
  	        scope(GL, '.uniform', infix, '(', LOCATION, ',', VALUE, ');');
  	        if (isBatchInnerLoop) {
  	          scope('}');
  	        }
  	      }
  	    }
  	  }

  	  function emitDraw (env, outer, inner, args) {
  	    var shared = env.shared;
  	    var GL = shared.gl;
  	    var DRAW_STATE = shared.draw;

  	    var drawOptions = args.draw;

  	    function emitElements () {
  	      var defn = drawOptions.elements;
  	      var ELEMENTS;
  	      var scope = outer;
  	      if (defn) {
  	        if ((defn.contextDep && args.contextDynamic) || defn.propDep) {
  	          scope = inner;
  	        }
  	        ELEMENTS = defn.append(env, scope);
  	        if (drawOptions.elementsActive) {
  	          scope(
  	            'if(' + ELEMENTS + ')' +
  	            GL + '.bindBuffer(' + GL_ELEMENT_ARRAY_BUFFER$2 + ',' + ELEMENTS + '.buffer.buffer);');
  	        }
  	      } else {
  	        ELEMENTS = scope.def();
  	        scope(
  	          ELEMENTS, '=', DRAW_STATE, '.', S_ELEMENTS, ';',
  	          'if(', ELEMENTS, '){',
  	          GL, '.bindBuffer(', GL_ELEMENT_ARRAY_BUFFER$2, ',', ELEMENTS, '.buffer.buffer);}',
  	          'else if(', shared.vao, '.currentVAO){',
  	          ELEMENTS, '=', env.shared.elements + '.getElements(' + shared.vao, '.currentVAO.elements);',
  	          (!extVertexArrays ? 'if(' + ELEMENTS + ')' + GL + '.bindBuffer(' + GL_ELEMENT_ARRAY_BUFFER$2 + ',' + ELEMENTS + '.buffer.buffer);' : ''),
  	          '}');
  	      }
  	      return ELEMENTS
  	    }

  	    function emitCount () {
  	      var defn = drawOptions.count;
  	      var COUNT;
  	      var scope = outer;
  	      if (defn) {
  	        if ((defn.contextDep && args.contextDynamic) || defn.propDep) {
  	          scope = inner;
  	        }
  	        COUNT = defn.append(env, scope);
  	        check$1.optional(function () {
  	          if (defn.MISSING) {
  	            env.assert(outer, 'false', 'missing vertex count');
  	          }
  	          if (defn.DYNAMIC) {
  	            env.assert(scope, COUNT + '>=0', 'missing vertex count');
  	          }
  	        });
  	      } else {
  	        COUNT = scope.def(DRAW_STATE, '.', S_COUNT);
  	        check$1.optional(function () {
  	          env.assert(scope, COUNT + '>=0', 'missing vertex count');
  	        });
  	      }
  	      return COUNT
  	    }

  	    var ELEMENTS = emitElements();
  	    function emitValue (name) {
  	      var defn = drawOptions[name];
  	      if (defn) {
  	        if ((defn.contextDep && args.contextDynamic) || defn.propDep) {
  	          return defn.append(env, inner)
  	        } else {
  	          return defn.append(env, outer)
  	        }
  	      } else {
  	        return outer.def(DRAW_STATE, '.', name)
  	      }
  	    }

  	    var PRIMITIVE = emitValue(S_PRIMITIVE);
  	    var OFFSET = emitValue(S_OFFSET);

  	    var COUNT = emitCount();
  	    if (typeof COUNT === 'number') {
  	      if (COUNT === 0) {
  	        return
  	      }
  	    } else {
  	      inner('if(', COUNT, '){');
  	      inner.exit('}');
  	    }

  	    var INSTANCES, EXT_INSTANCING;
  	    if (extInstancing) {
  	      INSTANCES = emitValue(S_INSTANCES);
  	      EXT_INSTANCING = env.instancing;
  	    }

  	    var ELEMENT_TYPE = ELEMENTS + '.type';

  	    var elementsStatic = drawOptions.elements && isStatic(drawOptions.elements) && !drawOptions.vaoActive;

  	    function emitInstancing () {
  	      function drawElements () {
  	        inner(EXT_INSTANCING, '.drawElementsInstancedANGLE(', [
  	          PRIMITIVE,
  	          COUNT,
  	          ELEMENT_TYPE,
  	          OFFSET + '<<((' + ELEMENT_TYPE + '-' + GL_UNSIGNED_BYTE$8 + ')>>1)',
  	          INSTANCES
  	        ], ');');
  	      }

  	      function drawArrays () {
  	        inner(EXT_INSTANCING, '.drawArraysInstancedANGLE(',
  	          [PRIMITIVE, OFFSET, COUNT, INSTANCES], ');');
  	      }

  	      if (ELEMENTS && ELEMENTS !== 'null') {
  	        if (!elementsStatic) {
  	          inner('if(', ELEMENTS, '){');
  	          drawElements();
  	          inner('}else{');
  	          drawArrays();
  	          inner('}');
  	        } else {
  	          drawElements();
  	        }
  	      } else {
  	        drawArrays();
  	      }
  	    }

  	    function emitRegular () {
  	      function drawElements () {
  	        inner(GL + '.drawElements(' + [
  	          PRIMITIVE,
  	          COUNT,
  	          ELEMENT_TYPE,
  	          OFFSET + '<<((' + ELEMENT_TYPE + '-' + GL_UNSIGNED_BYTE$8 + ')>>1)'
  	        ] + ');');
  	      }

  	      function drawArrays () {
  	        inner(GL + '.drawArrays(' + [PRIMITIVE, OFFSET, COUNT] + ');');
  	      }

  	      if (ELEMENTS && ELEMENTS !== 'null') {
  	        if (!elementsStatic) {
  	          inner('if(', ELEMENTS, '){');
  	          drawElements();
  	          inner('}else{');
  	          drawArrays();
  	          inner('}');
  	        } else {
  	          drawElements();
  	        }
  	      } else {
  	        drawArrays();
  	      }
  	    }

  	    if (extInstancing && (typeof INSTANCES !== 'number' || INSTANCES >= 0)) {
  	      if (typeof INSTANCES === 'string') {
  	        inner('if(', INSTANCES, '>0){');
  	        emitInstancing();
  	        inner('}else if(', INSTANCES, '<0){');
  	        emitRegular();
  	        inner('}');
  	      } else {
  	        emitInstancing();
  	      }
  	    } else {
  	      emitRegular();
  	    }
  	  }

  	  function createBody (emitBody, parentEnv, args, program, count) {
  	    var env = createREGLEnvironment();
  	    var scope = env.proc('body', count);
  	    check$1.optional(function () {
  	      env.commandStr = parentEnv.commandStr;
  	      env.command = env.link(parentEnv.commandStr);
  	    });
  	    if (extInstancing) {
  	      env.instancing = scope.def(
  	        env.shared.extensions, '.angle_instanced_arrays');
  	    }
  	    emitBody(env, scope, args, program);
  	    return env.compile().body
  	  }

  	  // ===================================================
  	  // ===================================================
  	  // DRAW PROC
  	  // ===================================================
  	  // ===================================================
  	  function emitDrawBody (env, draw, args, program) {
  	    injectExtensions(env, draw);
  	    if (args.useVAO) {
  	      if (args.drawVAO) {
  	        draw(env.shared.vao, '.setVAO(', args.drawVAO.append(env, draw), ');');
  	      } else {
  	        draw(env.shared.vao, '.setVAO(', env.shared.vao, '.targetVAO);');
  	      }
  	    } else {
  	      draw(env.shared.vao, '.setVAO(null);');
  	      emitAttributes(env, draw, args, program.attributes, function () {
  	        return true
  	      });
  	    }
  	    emitUniforms(env, draw, args, program.uniforms, function () {
  	      return true
  	    }, false);
  	    emitDraw(env, draw, draw, args);
  	  }

  	  function emitDrawProc (env, args) {
  	    var draw = env.proc('draw', 1);

  	    injectExtensions(env, draw);

  	    emitContext(env, draw, args.context);
  	    emitPollFramebuffer(env, draw, args.framebuffer);

  	    emitPollState(env, draw, args);
  	    emitSetOptions(env, draw, args.state);

  	    emitProfile(env, draw, args, false, true);

  	    var program = args.shader.progVar.append(env, draw);
  	    draw(env.shared.gl, '.useProgram(', program, '.program);');

  	    if (args.shader.program) {
  	      emitDrawBody(env, draw, args, args.shader.program);
  	    } else {
  	      draw(env.shared.vao, '.setVAO(null);');
  	      var drawCache = env.global.def('{}');
  	      var PROG_ID = draw.def(program, '.id');
  	      var CACHED_PROC = draw.def(drawCache, '[', PROG_ID, ']');
  	      draw(
  	        env.cond(CACHED_PROC)
  	          .then(CACHED_PROC, '.call(this,a0);')
  	          .else(
  	            CACHED_PROC, '=', drawCache, '[', PROG_ID, ']=',
  	            env.link(function (program) {
  	              return createBody(emitDrawBody, env, args, program, 1)
  	            }), '(', program, ');',
  	            CACHED_PROC, '.call(this,a0);'));
  	    }

  	    if (Object.keys(args.state).length > 0) {
  	      draw(env.shared.current, '.dirty=true;');
  	    }
  	    if (env.shared.vao) {
  	      draw(env.shared.vao, '.setVAO(null);');
  	    }
  	  }

  	  // ===================================================
  	  // ===================================================
  	  // BATCH PROC
  	  // ===================================================
  	  // ===================================================

  	  function emitBatchDynamicShaderBody (env, scope, args, program) {
  	    env.batchId = 'a1';

  	    injectExtensions(env, scope);

  	    function all () {
  	      return true
  	    }

  	    emitAttributes(env, scope, args, program.attributes, all);
  	    emitUniforms(env, scope, args, program.uniforms, all, false);
  	    emitDraw(env, scope, scope, args);
  	  }

  	  function emitBatchBody (env, scope, args, program) {
  	    injectExtensions(env, scope);

  	    var contextDynamic = args.contextDep;

  	    var BATCH_ID = scope.def();
  	    var PROP_LIST = 'a0';
  	    var NUM_PROPS = 'a1';
  	    var PROPS = scope.def();
  	    env.shared.props = PROPS;
  	    env.batchId = BATCH_ID;

  	    var outer = env.scope();
  	    var inner = env.scope();

  	    scope(
  	      outer.entry,
  	      'for(', BATCH_ID, '=0;', BATCH_ID, '<', NUM_PROPS, ';++', BATCH_ID, '){',
  	      PROPS, '=', PROP_LIST, '[', BATCH_ID, '];',
  	      inner,
  	      '}',
  	      outer.exit);

  	    function isInnerDefn (defn) {
  	      return ((defn.contextDep && contextDynamic) || defn.propDep)
  	    }

  	    function isOuterDefn (defn) {
  	      return !isInnerDefn(defn)
  	    }

  	    if (args.needsContext) {
  	      emitContext(env, inner, args.context);
  	    }
  	    if (args.needsFramebuffer) {
  	      emitPollFramebuffer(env, inner, args.framebuffer);
  	    }
  	    emitSetOptions(env, inner, args.state, isInnerDefn);

  	    if (args.profile && isInnerDefn(args.profile)) {
  	      emitProfile(env, inner, args, false, true);
  	    }

  	    if (!program) {
  	      var progCache = env.global.def('{}');
  	      var PROGRAM = args.shader.progVar.append(env, inner);
  	      var PROG_ID = inner.def(PROGRAM, '.id');
  	      var CACHED_PROC = inner.def(progCache, '[', PROG_ID, ']');
  	      inner(
  	        env.shared.gl, '.useProgram(', PROGRAM, '.program);',
  	        'if(!', CACHED_PROC, '){',
  	        CACHED_PROC, '=', progCache, '[', PROG_ID, ']=',
  	        env.link(function (program) {
  	          return createBody(
  	            emitBatchDynamicShaderBody, env, args, program, 2)
  	        }), '(', PROGRAM, ');}',
  	        CACHED_PROC, '.call(this,a0[', BATCH_ID, '],', BATCH_ID, ');');
  	    } else {
  	      if (args.useVAO) {
  	        if (args.drawVAO) {
  	          if (isInnerDefn(args.drawVAO)) {
  	            // vao is a prop
  	            inner(env.shared.vao, '.setVAO(', args.drawVAO.append(env, inner), ');');
  	          } else {
  	            // vao is invariant
  	            outer(env.shared.vao, '.setVAO(', args.drawVAO.append(env, outer), ');');
  	          }
  	        } else {
  	          // scoped vao binding
  	          outer(env.shared.vao, '.setVAO(', env.shared.vao, '.targetVAO);');
  	        }
  	      } else {
  	        outer(env.shared.vao, '.setVAO(null);');
  	        emitAttributes(env, outer, args, program.attributes, isOuterDefn);
  	        emitAttributes(env, inner, args, program.attributes, isInnerDefn);
  	      }
  	      emitUniforms(env, outer, args, program.uniforms, isOuterDefn, false);
  	      emitUniforms(env, inner, args, program.uniforms, isInnerDefn, true);
  	      emitDraw(env, outer, inner, args);
  	    }
  	  }

  	  function emitBatchProc (env, args) {
  	    var batch = env.proc('batch', 2);
  	    env.batchId = '0';

  	    injectExtensions(env, batch);

  	    // Check if any context variables depend on props
  	    var contextDynamic = false;
  	    var needsContext = true;
  	    Object.keys(args.context).forEach(function (name) {
  	      contextDynamic = contextDynamic || args.context[name].propDep;
  	    });
  	    if (!contextDynamic) {
  	      emitContext(env, batch, args.context);
  	      needsContext = false;
  	    }

  	    // framebuffer state affects framebufferWidth/height context vars
  	    var framebuffer = args.framebuffer;
  	    var needsFramebuffer = false;
  	    if (framebuffer) {
  	      if (framebuffer.propDep) {
  	        contextDynamic = needsFramebuffer = true;
  	      } else if (framebuffer.contextDep && contextDynamic) {
  	        needsFramebuffer = true;
  	      }
  	      if (!needsFramebuffer) {
  	        emitPollFramebuffer(env, batch, framebuffer);
  	      }
  	    } else {
  	      emitPollFramebuffer(env, batch, null);
  	    }

  	    // viewport is weird because it can affect context vars
  	    if (args.state.viewport && args.state.viewport.propDep) {
  	      contextDynamic = true;
  	    }

  	    function isInnerDefn (defn) {
  	      return (defn.contextDep && contextDynamic) || defn.propDep
  	    }

  	    // set webgl options
  	    emitPollState(env, batch, args);
  	    emitSetOptions(env, batch, args.state, function (defn) {
  	      return !isInnerDefn(defn)
  	    });

  	    if (!args.profile || !isInnerDefn(args.profile)) {
  	      emitProfile(env, batch, args, false, 'a1');
  	    }

  	    // Save these values to args so that the batch body routine can use them
  	    args.contextDep = contextDynamic;
  	    args.needsContext = needsContext;
  	    args.needsFramebuffer = needsFramebuffer;

  	    // determine if shader is dynamic
  	    var progDefn = args.shader.progVar;
  	    if ((progDefn.contextDep && contextDynamic) || progDefn.propDep) {
  	      emitBatchBody(
  	        env,
  	        batch,
  	        args,
  	        null);
  	    } else {
  	      var PROGRAM = progDefn.append(env, batch);
  	      batch(env.shared.gl, '.useProgram(', PROGRAM, '.program);');
  	      if (args.shader.program) {
  	        emitBatchBody(
  	          env,
  	          batch,
  	          args,
  	          args.shader.program);
  	      } else {
  	        batch(env.shared.vao, '.setVAO(null);');
  	        var batchCache = env.global.def('{}');
  	        var PROG_ID = batch.def(PROGRAM, '.id');
  	        var CACHED_PROC = batch.def(batchCache, '[', PROG_ID, ']');
  	        batch(
  	          env.cond(CACHED_PROC)
  	            .then(CACHED_PROC, '.call(this,a0,a1);')
  	            .else(
  	              CACHED_PROC, '=', batchCache, '[', PROG_ID, ']=',
  	              env.link(function (program) {
  	                return createBody(emitBatchBody, env, args, program, 2)
  	              }), '(', PROGRAM, ');',
  	              CACHED_PROC, '.call(this,a0,a1);'));
  	      }
  	    }

  	    if (Object.keys(args.state).length > 0) {
  	      batch(env.shared.current, '.dirty=true;');
  	    }

  	    if (env.shared.vao) {
  	      batch(env.shared.vao, '.setVAO(null);');
  	    }
  	  }

  	  // ===================================================
  	  // ===================================================
  	  // SCOPE COMMAND
  	  // ===================================================
  	  // ===================================================
  	  function emitScopeProc (env, args) {
  	    var scope = env.proc('scope', 3);
  	    env.batchId = 'a2';

  	    var shared = env.shared;
  	    var CURRENT_STATE = shared.current;

  	    emitContext(env, scope, args.context);

  	    if (args.framebuffer) {
  	      args.framebuffer.append(env, scope);
  	    }

  	    sortState(Object.keys(args.state)).forEach(function (name) {
  	      var defn = args.state[name];
  	      var value = defn.append(env, scope);
  	      if (isArrayLike(value)) {
  	        value.forEach(function (v, i) {
  	          scope.set(env.next[name], '[' + i + ']', v);
  	        });
  	      } else {
  	        scope.set(shared.next, '.' + name, value);
  	      }
  	    });

  	    emitProfile(env, scope, args, true, true)

  	    ;[S_ELEMENTS, S_OFFSET, S_COUNT, S_INSTANCES, S_PRIMITIVE].forEach(
  	      function (opt) {
  	        var variable = args.draw[opt];
  	        if (!variable) {
  	          return
  	        }
  	        scope.set(shared.draw, '.' + opt, '' + variable.append(env, scope));
  	      });

  	    Object.keys(args.uniforms).forEach(function (opt) {
  	      var value = args.uniforms[opt].append(env, scope);
  	      if (Array.isArray(value)) {
  	        value = '[' + value.join() + ']';
  	      }
  	      scope.set(
  	        shared.uniforms,
  	        '[' + stringStore.id(opt) + ']',
  	        value);
  	    });

  	    Object.keys(args.attributes).forEach(function (name) {
  	      var record = args.attributes[name].append(env, scope);
  	      var scopeAttrib = env.scopeAttrib(name);
  	      Object.keys(new AttributeRecord()).forEach(function (prop) {
  	        scope.set(scopeAttrib, '.' + prop, record[prop]);
  	      });
  	    });

  	    if (args.scopeVAO) {
  	      scope.set(shared.vao, '.targetVAO', args.scopeVAO.append(env, scope));
  	    }

  	    function saveShader (name) {
  	      var shader = args.shader[name];
  	      if (shader) {
  	        scope.set(shared.shader, '.' + name, shader.append(env, scope));
  	      }
  	    }
  	    saveShader(S_VERT);
  	    saveShader(S_FRAG);

  	    if (Object.keys(args.state).length > 0) {
  	      scope(CURRENT_STATE, '.dirty=true;');
  	      scope.exit(CURRENT_STATE, '.dirty=true;');
  	    }

  	    scope('a1(', env.shared.context, ',a0,', env.batchId, ');');
  	  }

  	  function isDynamicObject (object) {
  	    if (typeof object !== 'object' || isArrayLike(object)) {
  	      return
  	    }
  	    var props = Object.keys(object);
  	    for (var i = 0; i < props.length; ++i) {
  	      if (dynamic.isDynamic(object[props[i]])) {
  	        return true
  	      }
  	    }
  	    return false
  	  }

  	  function splatObject (env, options, name) {
  	    var object = options.static[name];
  	    if (!object || !isDynamicObject(object)) {
  	      return
  	    }

  	    var globals = env.global;
  	    var keys = Object.keys(object);
  	    var thisDep = false;
  	    var contextDep = false;
  	    var propDep = false;
  	    var objectRef = env.global.def('{}');
  	    keys.forEach(function (key) {
  	      var value = object[key];
  	      if (dynamic.isDynamic(value)) {
  	        if (typeof value === 'function') {
  	          value = object[key] = dynamic.unbox(value);
  	        }
  	        var deps = createDynamicDecl(value, null);
  	        thisDep = thisDep || deps.thisDep;
  	        propDep = propDep || deps.propDep;
  	        contextDep = contextDep || deps.contextDep;
  	      } else {
  	        globals(objectRef, '.', key, '=');
  	        switch (typeof value) {
  	          case 'number':
  	            globals(value);
  	            break
  	          case 'string':
  	            globals('"', value, '"');
  	            break
  	          case 'object':
  	            if (Array.isArray(value)) {
  	              globals('[', value.join(), ']');
  	            }
  	            break
  	          default:
  	            globals(env.link(value));
  	            break
  	        }
  	        globals(';');
  	      }
  	    });

  	    function appendBlock (env, block) {
  	      keys.forEach(function (key) {
  	        var value = object[key];
  	        if (!dynamic.isDynamic(value)) {
  	          return
  	        }
  	        var ref = env.invoke(block, value);
  	        block(objectRef, '.', key, '=', ref, ';');
  	      });
  	    }

  	    options.dynamic[name] = new dynamic.DynamicVariable(DYN_THUNK, {
  	      thisDep: thisDep,
  	      contextDep: contextDep,
  	      propDep: propDep,
  	      ref: objectRef,
  	      append: appendBlock
  	    });
  	    delete options.static[name];
  	  }

  	  // ===========================================================================
  	  // ===========================================================================
  	  // MAIN DRAW COMMAND
  	  // ===========================================================================
  	  // ===========================================================================
  	  function compileCommand (options, attributes, uniforms, context, stats) {
  	    var env = createREGLEnvironment();

  	    // link stats, so that we can easily access it in the program.
  	    env.stats = env.link(stats);

  	    // splat options and attributes to allow for dynamic nested properties
  	    Object.keys(attributes.static).forEach(function (key) {
  	      splatObject(env, attributes, key);
  	    });
  	    NESTED_OPTIONS.forEach(function (name) {
  	      splatObject(env, options, name);
  	    });

  	    var args = parseArguments(options, attributes, uniforms, context, env);

  	    emitDrawProc(env, args);
  	    emitScopeProc(env, args);
  	    emitBatchProc(env, args);

  	    return extend(env.compile(), {
  	      destroy: function () {
  	        args.shader.program.destroy();
  	      }
  	    })
  	  }

  	  // ===========================================================================
  	  // ===========================================================================
  	  // POLL / REFRESH
  	  // ===========================================================================
  	  // ===========================================================================
  	  return {
  	    next: nextState,
  	    current: currentState,
  	    procs: (function () {
  	      var env = createREGLEnvironment();
  	      var poll = env.proc('poll');
  	      var refresh = env.proc('refresh');
  	      var common = env.block();
  	      poll(common);
  	      refresh(common);

  	      var shared = env.shared;
  	      var GL = shared.gl;
  	      var NEXT_STATE = shared.next;
  	      var CURRENT_STATE = shared.current;

  	      common(CURRENT_STATE, '.dirty=false;');

  	      emitPollFramebuffer(env, poll);
  	      emitPollFramebuffer(env, refresh, null, true);

  	      // Refresh updates all attribute state changes
  	      var INSTANCING;
  	      if (extInstancing) {
  	        INSTANCING = env.link(extInstancing);
  	      }

  	      // update vertex array bindings
  	      if (extensions.oes_vertex_array_object) {
  	        refresh(env.link(extensions.oes_vertex_array_object), '.bindVertexArrayOES(null);');
  	      }
  	      for (var i = 0; i < limits.maxAttributes; ++i) {
  	        var BINDING = refresh.def(shared.attributes, '[', i, ']');
  	        var ifte = env.cond(BINDING, '.buffer');
  	        ifte.then(
  	          GL, '.enableVertexAttribArray(', i, ');',
  	          GL, '.bindBuffer(',
  	          GL_ARRAY_BUFFER$2, ',',
  	          BINDING, '.buffer.buffer);',
  	          GL, '.vertexAttribPointer(',
  	          i, ',',
  	          BINDING, '.size,',
  	          BINDING, '.type,',
  	          BINDING, '.normalized,',
  	          BINDING, '.stride,',
  	          BINDING, '.offset);'
  	        ).else(
  	          GL, '.disableVertexAttribArray(', i, ');',
  	          GL, '.vertexAttrib4f(',
  	          i, ',',
  	          BINDING, '.x,',
  	          BINDING, '.y,',
  	          BINDING, '.z,',
  	          BINDING, '.w);',
  	          BINDING, '.buffer=null;');
  	        refresh(ifte);
  	        if (extInstancing) {
  	          refresh(
  	            INSTANCING, '.vertexAttribDivisorANGLE(',
  	            i, ',',
  	            BINDING, '.divisor);');
  	        }
  	      }
  	      refresh(
  	        env.shared.vao, '.currentVAO=null;',
  	        env.shared.vao, '.setVAO(', env.shared.vao, '.targetVAO);');

  	      Object.keys(GL_FLAGS).forEach(function (flag) {
  	        var cap = GL_FLAGS[flag];
  	        var NEXT = common.def(NEXT_STATE, '.', flag);
  	        var block = env.block();
  	        block('if(', NEXT, '){',
  	          GL, '.enable(', cap, ')}else{',
  	          GL, '.disable(', cap, ')}',
  	          CURRENT_STATE, '.', flag, '=', NEXT, ';');
  	        refresh(block);
  	        poll(
  	          'if(', NEXT, '!==', CURRENT_STATE, '.', flag, '){',
  	          block,
  	          '}');
  	      });

  	      Object.keys(GL_VARIABLES).forEach(function (name) {
  	        var func = GL_VARIABLES[name];
  	        var init = currentState[name];
  	        var NEXT, CURRENT;
  	        var block = env.block();
  	        block(GL, '.', func, '(');
  	        if (isArrayLike(init)) {
  	          var n = init.length;
  	          NEXT = env.global.def(NEXT_STATE, '.', name);
  	          CURRENT = env.global.def(CURRENT_STATE, '.', name);
  	          block(
  	            loop(n, function (i) {
  	              return NEXT + '[' + i + ']'
  	            }), ');',
  	            loop(n, function (i) {
  	              return CURRENT + '[' + i + ']=' + NEXT + '[' + i + '];'
  	            }).join(''));
  	          poll(
  	            'if(', loop(n, function (i) {
  	              return NEXT + '[' + i + ']!==' + CURRENT + '[' + i + ']'
  	            }).join('||'), '){',
  	            block,
  	            '}');
  	        } else {
  	          NEXT = common.def(NEXT_STATE, '.', name);
  	          CURRENT = common.def(CURRENT_STATE, '.', name);
  	          block(
  	            NEXT, ');',
  	            CURRENT_STATE, '.', name, '=', NEXT, ';');
  	          poll(
  	            'if(', NEXT, '!==', CURRENT, '){',
  	            block,
  	            '}');
  	        }
  	        refresh(block);
  	      });

  	      return env.compile()
  	    })(),
  	    compile: compileCommand
  	  }
  	}

  	function stats () {
  	  return {
  	    vaoCount: 0,
  	    bufferCount: 0,
  	    elementsCount: 0,
  	    framebufferCount: 0,
  	    shaderCount: 0,
  	    textureCount: 0,
  	    cubeCount: 0,
  	    renderbufferCount: 0,
  	    maxTextureUnits: 0
  	  }
  	}

  	var GL_QUERY_RESULT_EXT = 0x8866;
  	var GL_QUERY_RESULT_AVAILABLE_EXT = 0x8867;
  	var GL_TIME_ELAPSED_EXT = 0x88BF;

  	var createTimer = function (gl, extensions) {
  	  if (!extensions.ext_disjoint_timer_query) {
  	    return null
  	  }

  	  // QUERY POOL BEGIN
  	  var queryPool = [];
  	  function allocQuery () {
  	    return queryPool.pop() || extensions.ext_disjoint_timer_query.createQueryEXT()
  	  }
  	  function freeQuery (query) {
  	    queryPool.push(query);
  	  }
  	  // QUERY POOL END

  	  var pendingQueries = [];
  	  function beginQuery (stats) {
  	    var query = allocQuery();
  	    extensions.ext_disjoint_timer_query.beginQueryEXT(GL_TIME_ELAPSED_EXT, query);
  	    pendingQueries.push(query);
  	    pushScopeStats(pendingQueries.length - 1, pendingQueries.length, stats);
  	  }

  	  function endQuery () {
  	    extensions.ext_disjoint_timer_query.endQueryEXT(GL_TIME_ELAPSED_EXT);
  	  }

  	  //
  	  // Pending stats pool.
  	  //
  	  function PendingStats () {
  	    this.startQueryIndex = -1;
  	    this.endQueryIndex = -1;
  	    this.sum = 0;
  	    this.stats = null;
  	  }
  	  var pendingStatsPool = [];
  	  function allocPendingStats () {
  	    return pendingStatsPool.pop() || new PendingStats()
  	  }
  	  function freePendingStats (pendingStats) {
  	    pendingStatsPool.push(pendingStats);
  	  }
  	  // Pending stats pool end

  	  var pendingStats = [];
  	  function pushScopeStats (start, end, stats) {
  	    var ps = allocPendingStats();
  	    ps.startQueryIndex = start;
  	    ps.endQueryIndex = end;
  	    ps.sum = 0;
  	    ps.stats = stats;
  	    pendingStats.push(ps);
  	  }

  	  // we should call this at the beginning of the frame,
  	  // in order to update gpuTime
  	  var timeSum = [];
  	  var queryPtr = [];
  	  function update () {
  	    var ptr, i;

  	    var n = pendingQueries.length;
  	    if (n === 0) {
  	      return
  	    }

  	    // Reserve space
  	    queryPtr.length = Math.max(queryPtr.length, n + 1);
  	    timeSum.length = Math.max(timeSum.length, n + 1);
  	    timeSum[0] = 0;
  	    queryPtr[0] = 0;

  	    // Update all pending timer queries
  	    var queryTime = 0;
  	    ptr = 0;
  	    for (i = 0; i < pendingQueries.length; ++i) {
  	      var query = pendingQueries[i];
  	      if (extensions.ext_disjoint_timer_query.getQueryObjectEXT(query, GL_QUERY_RESULT_AVAILABLE_EXT)) {
  	        queryTime += extensions.ext_disjoint_timer_query.getQueryObjectEXT(query, GL_QUERY_RESULT_EXT);
  	        freeQuery(query);
  	      } else {
  	        pendingQueries[ptr++] = query;
  	      }
  	      timeSum[i + 1] = queryTime;
  	      queryPtr[i + 1] = ptr;
  	    }
  	    pendingQueries.length = ptr;

  	    // Update all pending stat queries
  	    ptr = 0;
  	    for (i = 0; i < pendingStats.length; ++i) {
  	      var stats = pendingStats[i];
  	      var start = stats.startQueryIndex;
  	      var end = stats.endQueryIndex;
  	      stats.sum += timeSum[end] - timeSum[start];
  	      var startPtr = queryPtr[start];
  	      var endPtr = queryPtr[end];
  	      if (endPtr === startPtr) {
  	        stats.stats.gpuTime += stats.sum / 1e6;
  	        freePendingStats(stats);
  	      } else {
  	        stats.startQueryIndex = startPtr;
  	        stats.endQueryIndex = endPtr;
  	        pendingStats[ptr++] = stats;
  	      }
  	    }
  	    pendingStats.length = ptr;
  	  }

  	  return {
  	    beginQuery: beginQuery,
  	    endQuery: endQuery,
  	    pushScopeStats: pushScopeStats,
  	    update: update,
  	    getNumPendingQueries: function () {
  	      return pendingQueries.length
  	    },
  	    clear: function () {
  	      queryPool.push.apply(queryPool, pendingQueries);
  	      for (var i = 0; i < queryPool.length; i++) {
  	        extensions.ext_disjoint_timer_query.deleteQueryEXT(queryPool[i]);
  	      }
  	      pendingQueries.length = 0;
  	      queryPool.length = 0;
  	    },
  	    restore: function () {
  	      pendingQueries.length = 0;
  	      queryPool.length = 0;
  	    }
  	  }
  	};

  	var GL_COLOR_BUFFER_BIT = 16384;
  	var GL_DEPTH_BUFFER_BIT = 256;
  	var GL_STENCIL_BUFFER_BIT = 1024;

  	var GL_ARRAY_BUFFER = 34962;

  	var CONTEXT_LOST_EVENT = 'webglcontextlost';
  	var CONTEXT_RESTORED_EVENT = 'webglcontextrestored';

  	var DYN_PROP = 1;
  	var DYN_CONTEXT = 2;
  	var DYN_STATE = 3;

  	function find (haystack, needle) {
  	  for (var i = 0; i < haystack.length; ++i) {
  	    if (haystack[i] === needle) {
  	      return i
  	    }
  	  }
  	  return -1
  	}

  	function wrapREGL (args) {
  	  var config = parseArgs(args);
  	  if (!config) {
  	    return null
  	  }

  	  var gl = config.gl;
  	  var glAttributes = gl.getContextAttributes();
  	  var contextLost = gl.isContextLost();

  	  var extensionState = createExtensionCache(gl, config);
  	  if (!extensionState) {
  	    return null
  	  }

  	  var stringStore = createStringStore();
  	  var stats$$1 = stats();
  	  var extensions = extensionState.extensions;
  	  var timer = createTimer(gl, extensions);

  	  var START_TIME = clock();
  	  var WIDTH = gl.drawingBufferWidth;
  	  var HEIGHT = gl.drawingBufferHeight;

  	  var contextState = {
  	    tick: 0,
  	    time: 0,
  	    viewportWidth: WIDTH,
  	    viewportHeight: HEIGHT,
  	    framebufferWidth: WIDTH,
  	    framebufferHeight: HEIGHT,
  	    drawingBufferWidth: WIDTH,
  	    drawingBufferHeight: HEIGHT,
  	    pixelRatio: config.pixelRatio
  	  };
  	  var uniformState = {};
  	  var drawState = {
  	    elements: null,
  	    primitive: 4, // GL_TRIANGLES
  	    count: -1,
  	    offset: 0,
  	    instances: -1
  	  };

  	  var limits = wrapLimits(gl, extensions);
  	  var bufferState = wrapBufferState(
  	    gl,
  	    stats$$1,
  	    config,
  	    destroyBuffer);
  	  var elementState = wrapElementsState(gl, extensions, bufferState, stats$$1);
  	  var attributeState = wrapAttributeState(
  	    gl,
  	    extensions,
  	    limits,
  	    stats$$1,
  	    bufferState,
  	    elementState,
  	    drawState);
  	  function destroyBuffer (buffer) {
  	    return attributeState.destroyBuffer(buffer)
  	  }
  	  var shaderState = wrapShaderState(gl, stringStore, stats$$1, config);
  	  var textureState = createTextureSet(
  	    gl,
  	    extensions,
  	    limits,
  	    function () { core.procs.poll(); },
  	    contextState,
  	    stats$$1,
  	    config);
  	  var renderbufferState = wrapRenderbuffers(gl, extensions, limits, stats$$1, config);
  	  var framebufferState = wrapFBOState(
  	    gl,
  	    extensions,
  	    limits,
  	    textureState,
  	    renderbufferState,
  	    stats$$1);
  	  var core = reglCore(
  	    gl,
  	    stringStore,
  	    extensions,
  	    limits,
  	    bufferState,
  	    elementState,
  	    textureState,
  	    framebufferState,
  	    uniformState,
  	    attributeState,
  	    shaderState,
  	    drawState,
  	    contextState,
  	    timer,
  	    config);
  	  var readPixels = wrapReadPixels(
  	    gl,
  	    framebufferState,
  	    core.procs.poll,
  	    contextState,
  	    glAttributes, extensions, limits);

  	  var nextState = core.next;
  	  var canvas = gl.canvas;

  	  var rafCallbacks = [];
  	  var lossCallbacks = [];
  	  var restoreCallbacks = [];
  	  var destroyCallbacks = [config.onDestroy];

  	  var activeRAF = null;
  	  function handleRAF () {
  	    if (rafCallbacks.length === 0) {
  	      if (timer) {
  	        timer.update();
  	      }
  	      activeRAF = null;
  	      return
  	    }

  	    // schedule next animation frame
  	    activeRAF = raf.next(handleRAF);

  	    // poll for changes
  	    poll();

  	    // fire a callback for all pending rafs
  	    for (var i = rafCallbacks.length - 1; i >= 0; --i) {
  	      var cb = rafCallbacks[i];
  	      if (cb) {
  	        cb(contextState, null, 0);
  	      }
  	    }

  	    // flush all pending webgl calls
  	    gl.flush();

  	    // poll GPU timers *after* gl.flush so we don't delay command dispatch
  	    if (timer) {
  	      timer.update();
  	    }
  	  }

  	  function startRAF () {
  	    if (!activeRAF && rafCallbacks.length > 0) {
  	      activeRAF = raf.next(handleRAF);
  	    }
  	  }

  	  function stopRAF () {
  	    if (activeRAF) {
  	      raf.cancel(handleRAF);
  	      activeRAF = null;
  	    }
  	  }

  	  function handleContextLoss (event) {
  	    event.preventDefault();

  	    // set context lost flag
  	    contextLost = true;

  	    // pause request animation frame
  	    stopRAF();

  	    // lose context
  	    lossCallbacks.forEach(function (cb) {
  	      cb();
  	    });
  	  }

  	  function handleContextRestored (event) {
  	    // clear error code
  	    gl.getError();

  	    // clear context lost flag
  	    contextLost = false;

  	    // refresh state
  	    extensionState.restore();
  	    shaderState.restore();
  	    bufferState.restore();
  	    textureState.restore();
  	    renderbufferState.restore();
  	    framebufferState.restore();
  	    attributeState.restore();
  	    if (timer) {
  	      timer.restore();
  	    }

  	    // refresh state
  	    core.procs.refresh();

  	    // restart RAF
  	    startRAF();

  	    // restore context
  	    restoreCallbacks.forEach(function (cb) {
  	      cb();
  	    });
  	  }

  	  if (canvas) {
  	    canvas.addEventListener(CONTEXT_LOST_EVENT, handleContextLoss, false);
  	    canvas.addEventListener(CONTEXT_RESTORED_EVENT, handleContextRestored, false);
  	  }

  	  function destroy () {
  	    rafCallbacks.length = 0;
  	    stopRAF();

  	    if (canvas) {
  	      canvas.removeEventListener(CONTEXT_LOST_EVENT, handleContextLoss);
  	      canvas.removeEventListener(CONTEXT_RESTORED_EVENT, handleContextRestored);
  	    }

  	    shaderState.clear();
  	    framebufferState.clear();
  	    renderbufferState.clear();
  	    attributeState.clear();
  	    textureState.clear();
  	    elementState.clear();
  	    bufferState.clear();

  	    if (timer) {
  	      timer.clear();
  	    }

  	    destroyCallbacks.forEach(function (cb) {
  	      cb();
  	    });
  	  }

  	  function compileProcedure (options) {
  	    check$1(!!options, 'invalid args to regl({...})');
  	    check$1.type(options, 'object', 'invalid args to regl({...})');

  	    function flattenNestedOptions (options) {
  	      var result = extend({}, options);
  	      delete result.uniforms;
  	      delete result.attributes;
  	      delete result.context;
  	      delete result.vao;

  	      if ('stencil' in result && result.stencil.op) {
  	        result.stencil.opBack = result.stencil.opFront = result.stencil.op;
  	        delete result.stencil.op;
  	      }

  	      function merge (name) {
  	        if (name in result) {
  	          var child = result[name];
  	          delete result[name];
  	          Object.keys(child).forEach(function (prop) {
  	            result[name + '.' + prop] = child[prop];
  	          });
  	        }
  	      }
  	      merge('blend');
  	      merge('depth');
  	      merge('cull');
  	      merge('stencil');
  	      merge('polygonOffset');
  	      merge('scissor');
  	      merge('sample');

  	      if ('vao' in options) {
  	        result.vao = options.vao;
  	      }

  	      return result
  	    }

  	    function separateDynamic (object, useArrays) {
  	      var staticItems = {};
  	      var dynamicItems = {};
  	      Object.keys(object).forEach(function (option) {
  	        var value = object[option];
  	        if (dynamic.isDynamic(value)) {
  	          dynamicItems[option] = dynamic.unbox(value, option);
  	          return
  	        } else if (useArrays && Array.isArray(value)) {
  	          for (var i = 0; i < value.length; ++i) {
  	            if (dynamic.isDynamic(value[i])) {
  	              dynamicItems[option] = dynamic.unbox(value, option);
  	              return
  	            }
  	          }
  	        }
  	        staticItems[option] = value;
  	      });
  	      return {
  	        dynamic: dynamicItems,
  	        static: staticItems
  	      }
  	    }

  	    // Treat context variables separate from other dynamic variables
  	    var context = separateDynamic(options.context || {}, true);
  	    var uniforms = separateDynamic(options.uniforms || {}, true);
  	    var attributes = separateDynamic(options.attributes || {}, false);
  	    var opts = separateDynamic(flattenNestedOptions(options), false);

  	    var stats$$1 = {
  	      gpuTime: 0.0,
  	      cpuTime: 0.0,
  	      count: 0
  	    };

  	    var compiled = core.compile(opts, attributes, uniforms, context, stats$$1);

  	    var draw = compiled.draw;
  	    var batch = compiled.batch;
  	    var scope = compiled.scope;

  	    // FIXME: we should modify code generation for batch commands so this
  	    // isn't necessary
  	    var EMPTY_ARRAY = [];
  	    function reserve (count) {
  	      while (EMPTY_ARRAY.length < count) {
  	        EMPTY_ARRAY.push(null);
  	      }
  	      return EMPTY_ARRAY
  	    }

  	    function REGLCommand (args, body) {
  	      var i;
  	      if (contextLost) {
  	        check$1.raise('context lost');
  	      }
  	      if (typeof args === 'function') {
  	        return scope.call(this, null, args, 0)
  	      } else if (typeof body === 'function') {
  	        if (typeof args === 'number') {
  	          for (i = 0; i < args; ++i) {
  	            scope.call(this, null, body, i);
  	          }
  	        } else if (Array.isArray(args)) {
  	          for (i = 0; i < args.length; ++i) {
  	            scope.call(this, args[i], body, i);
  	          }
  	        } else {
  	          return scope.call(this, args, body, 0)
  	        }
  	      } else if (typeof args === 'number') {
  	        if (args > 0) {
  	          return batch.call(this, reserve(args | 0), args | 0)
  	        }
  	      } else if (Array.isArray(args)) {
  	        if (args.length) {
  	          return batch.call(this, args, args.length)
  	        }
  	      } else {
  	        return draw.call(this, args)
  	      }
  	    }

  	    return extend(REGLCommand, {
  	      stats: stats$$1,
  	      destroy: function () {
  	        compiled.destroy();
  	      }
  	    })
  	  }

  	  var setFBO = framebufferState.setFBO = compileProcedure({
  	    framebuffer: dynamic.define.call(null, DYN_PROP, 'framebuffer')
  	  });

  	  function clearImpl (_, options) {
  	    var clearFlags = 0;
  	    core.procs.poll();

  	    var c = options.color;
  	    if (c) {
  	      gl.clearColor(+c[0] || 0, +c[1] || 0, +c[2] || 0, +c[3] || 0);
  	      clearFlags |= GL_COLOR_BUFFER_BIT;
  	    }
  	    if ('depth' in options) {
  	      gl.clearDepth(+options.depth);
  	      clearFlags |= GL_DEPTH_BUFFER_BIT;
  	    }
  	    if ('stencil' in options) {
  	      gl.clearStencil(options.stencil | 0);
  	      clearFlags |= GL_STENCIL_BUFFER_BIT;
  	    }

  	    check$1(!!clearFlags, 'called regl.clear with no buffer specified');
  	    gl.clear(clearFlags);
  	  }

  	  function clear (options) {
  	    check$1(
  	      typeof options === 'object' && options,
  	      'regl.clear() takes an object as input');
  	    if ('framebuffer' in options) {
  	      if (options.framebuffer &&
  	          options.framebuffer_reglType === 'framebufferCube') {
  	        for (var i = 0; i < 6; ++i) {
  	          setFBO(extend({
  	            framebuffer: options.framebuffer.faces[i]
  	          }, options), clearImpl);
  	        }
  	      } else {
  	        setFBO(options, clearImpl);
  	      }
  	    } else {
  	      clearImpl(null, options);
  	    }
  	  }

  	  function frame (cb) {
  	    check$1.type(cb, 'function', 'regl.frame() callback must be a function');
  	    rafCallbacks.push(cb);

  	    function cancel () {
  	      // FIXME:  should we check something other than equals cb here?
  	      // what if a user calls frame twice with the same callback...
  	      //
  	      var i = find(rafCallbacks, cb);
  	      check$1(i >= 0, 'cannot cancel a frame twice');
  	      function pendingCancel () {
  	        var index = find(rafCallbacks, pendingCancel);
  	        rafCallbacks[index] = rafCallbacks[rafCallbacks.length - 1];
  	        rafCallbacks.length -= 1;
  	        if (rafCallbacks.length <= 0) {
  	          stopRAF();
  	        }
  	      }
  	      rafCallbacks[i] = pendingCancel;
  	    }

  	    startRAF();

  	    return {
  	      cancel: cancel
  	    }
  	  }

  	  // poll viewport
  	  function pollViewport () {
  	    var viewport = nextState.viewport;
  	    var scissorBox = nextState.scissor_box;
  	    viewport[0] = viewport[1] = scissorBox[0] = scissorBox[1] = 0;
  	    contextState.viewportWidth =
  	      contextState.framebufferWidth =
  	      contextState.drawingBufferWidth =
  	      viewport[2] =
  	      scissorBox[2] = gl.drawingBufferWidth;
  	    contextState.viewportHeight =
  	      contextState.framebufferHeight =
  	      contextState.drawingBufferHeight =
  	      viewport[3] =
  	      scissorBox[3] = gl.drawingBufferHeight;
  	  }

  	  function poll () {
  	    contextState.tick += 1;
  	    contextState.time = now();
  	    pollViewport();
  	    core.procs.poll();
  	  }

  	  function refresh () {
  	    textureState.refresh();
  	    pollViewport();
  	    core.procs.refresh();
  	    if (timer) {
  	      timer.update();
  	    }
  	  }

  	  function now () {
  	    return (clock() - START_TIME) / 1000.0
  	  }

  	  refresh();

  	  function addListener (event, callback) {
  	    check$1.type(callback, 'function', 'listener callback must be a function');

  	    var callbacks;
  	    switch (event) {
  	      case 'frame':
  	        return frame(callback)
  	      case 'lost':
  	        callbacks = lossCallbacks;
  	        break
  	      case 'restore':
  	        callbacks = restoreCallbacks;
  	        break
  	      case 'destroy':
  	        callbacks = destroyCallbacks;
  	        break
  	      default:
  	        check$1.raise('invalid event, must be one of frame,lost,restore,destroy');
  	    }

  	    callbacks.push(callback);
  	    return {
  	      cancel: function () {
  	        for (var i = 0; i < callbacks.length; ++i) {
  	          if (callbacks[i] === callback) {
  	            callbacks[i] = callbacks[callbacks.length - 1];
  	            callbacks.pop();
  	            return
  	          }
  	        }
  	      }
  	    }
  	  }

  	  var regl = extend(compileProcedure, {
  	    // Clear current FBO
  	    clear: clear,

  	    // Short cuts for dynamic variables
  	    prop: dynamic.define.bind(null, DYN_PROP),
  	    context: dynamic.define.bind(null, DYN_CONTEXT),
  	    this: dynamic.define.bind(null, DYN_STATE),

  	    // executes an empty draw command
  	    draw: compileProcedure({}),

  	    // Resources
  	    buffer: function (options) {
  	      return bufferState.create(options, GL_ARRAY_BUFFER, false, false)
  	    },
  	    elements: function (options) {
  	      return elementState.create(options, false)
  	    },
  	    texture: textureState.create2D,
  	    cube: textureState.createCube,
  	    renderbuffer: renderbufferState.create,
  	    framebuffer: framebufferState.create,
  	    framebufferCube: framebufferState.createCube,
  	    vao: attributeState.createVAO,

  	    // Expose context attributes
  	    attributes: glAttributes,

  	    // Frame rendering
  	    frame: frame,
  	    on: addListener,

  	    // System limits
  	    limits: limits,
  	    hasExtension: function (name) {
  	      return limits.extensions.indexOf(name.toLowerCase()) >= 0
  	    },

  	    // Read pixels
  	    read: readPixels,

  	    // Destroy regl and all associated resources
  	    destroy: destroy,

  	    // Direct GL state manipulation
  	    _gl: gl,
  	    _refresh: refresh,

  	    poll: function () {
  	      poll();
  	      if (timer) {
  	        timer.update();
  	      }
  	    },

  	    // Current time
  	    now: now,

  	    // regl Statistics Information
  	    stats: stats$$1
  	  });

  	  config.onDone(null, regl);

  	  return regl
  	}

  	return wrapREGL;

  	})));
  	
  } (regl$1));

  var regl = regl$1.exports;

  const defaultNodeColor = '#b3b3b3';
  const defaultGreyoutNodeOpacity = 0.1;
  const defaultNodeSize = 4;
  const defaultLinkColor = '#666666';
  const defaultGreyoutLinkOpacity = 0.1;
  const defaultLinkWidth = 1;
  const defaultBackgroundColor = '#222222';
  const defaultConfigValues = {
      spaceSize: 4096,
      nodeSizeScale: 1,
      linkWidthScale: 1,
      arrowSizeScale: 1,
      renderLinks: true,
      arrowLinks: true,
      linkVisibilityDistanceRange: [50, 150],
      linkVisibilityMinTransparency: 0.25,
      useQuadtree: false,
      simulation: {
          decay: 1000,
          gravity: 0,
          center: 0,
          repulsion: 0.1,
          repulsionTheta: 1.7,
          repulsionQuadtreeLevels: 12,
          linkSpring: 1,
          linkDistance: 2,
          linkDistRandomVariationRange: [1, 1.2],
          repulsionFromMouse: 2,
          friction: 0.85,
      },
      showFPSMonitor: false,
      pixelRatio: 2,
      scaleNodesOnZoom: true,
  };

  class GraphConfig {
      constructor() {
          this.backgroundColor = defaultBackgroundColor;
          this.spaceSize = defaultConfigValues.spaceSize;
          this.nodeColor = defaultNodeColor;
          this.nodeGreyoutOpacity = defaultGreyoutNodeOpacity;
          this.nodeSize = defaultNodeSize;
          this.nodeSizeScale = defaultConfigValues.nodeSizeScale;
          this.linkColor = defaultLinkColor;
          this.linkGreyoutOpacity = defaultGreyoutLinkOpacity;
          this.linkWidth = defaultLinkWidth;
          this.linkWidthScale = defaultConfigValues.linkWidthScale;
          this.renderLinks = defaultConfigValues.renderLinks;
          this.linkArrows = defaultConfigValues.arrowLinks;
          this.linkArrowsSizeScale = defaultConfigValues.arrowSizeScale;
          this.linkVisibilityDistanceRange = defaultConfigValues.linkVisibilityDistanceRange;
          this.linkVisibilityMinTransparency = defaultConfigValues.linkVisibilityMinTransparency;
          this.useQuadtree = defaultConfigValues.useQuadtree;
          this.simulation = {
              decay: defaultConfigValues.simulation.decay,
              gravity: defaultConfigValues.simulation.gravity,
              center: defaultConfigValues.simulation.center,
              repulsion: defaultConfigValues.simulation.repulsion,
              repulsionTheta: defaultConfigValues.simulation.repulsionTheta,
              repulsionQuadtreeLevels: defaultConfigValues.simulation.repulsionQuadtreeLevels,
              linkSpring: defaultConfigValues.simulation.linkSpring,
              linkDistance: defaultConfigValues.simulation.linkDistance,
              linkDistRandomVariationRange: defaultConfigValues.simulation.linkDistRandomVariationRange,
              repulsionFromMouse: defaultConfigValues.simulation.repulsionFromMouse,
              friction: defaultConfigValues.simulation.friction,
              onStart: undefined,
              onTick: undefined,
              onEnd: undefined,
              onPause: undefined,
              onRestart: undefined,
          };
          this.events = {
              onClick: undefined,
              onZoomStart: undefined,
              onZoom: undefined,
              onZoomEnd: undefined,
          };
          this.showFPSMonitor = defaultConfigValues.showFPSMonitor;
          this.pixelRatio = defaultConfigValues.pixelRatio;
          this.scaleNodesOnZoom = defaultConfigValues.scaleNodesOnZoom;
          this.randomSeed = undefined;
      }
      init(config) {
          const currentConfig = this.getConfig();
          const keys = Object.keys(config).map(key => key);
          keys.forEach(key => {
              if (typeof currentConfig[key] === 'object') {
                  currentConfig[key] = {
                      ...currentConfig[key],
                      ...config[key],
                  };
              }
              else {
                  currentConfig[key] =
                      config[key];
              }
          });
          return currentConfig;
      }
      getConfig() {
          return this;
      }
  }

  function isFunction(value) {
      return typeof value === 'function';
  }
  function getValue(d, accessor, index) {
      // eslint-disable-next-line @typescript-eslint/ban-types
      if (isFunction(accessor))
          return accessor(d, index);
      else
          return accessor;
  }
  function getRgbaColor(value) {
      var _a;
      let rgba;
      if (Array.isArray(value)) {
          rgba = value;
      }
      else {
          const color$1 = color(value);
          const rgb = color$1 === null || color$1 === void 0 ? void 0 : color$1.rgb();
          rgba = [(rgb === null || rgb === void 0 ? void 0 : rgb.r) || 0, (rgb === null || rgb === void 0 ? void 0 : rgb.g) || 0, (rgb === null || rgb === void 0 ? void 0 : rgb.b) || 0, (_a = color$1 === null || color$1 === void 0 ? void 0 : color$1.opacity) !== null && _a !== void 0 ? _a : 1];
      }
      return [
          rgba[0] / 255,
          rgba[1] / 255,
          rgba[2] / 255,
          rgba[3],
      ];
  }
  function readPixels(reglInstance, fbo) {
      let resultPixels = new Float32Array();
      reglInstance({ framebuffer: fbo })(() => {
          resultPixels = reglInstance.read();
      });
      return resultPixels;
  }
  function clamp(num, min, max) {
      return Math.min(Math.max(num, min), max);
  }

  class CoreModule {
      constructor(reglInstance, config, store, data, points) {
          this.reglInstance = reglInstance;
          this.config = config;
          this.store = store;
          this.data = data;
          if (points)
              this.points = points;
      }
  }

  var calculateCentermassFrag = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\nvarying vec4 rgba;void main(){gl_FragColor=rgba;}"; // eslint-disable-line

  var calculateCentermassVert = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\nuniform sampler2D position;uniform float pointsTextureSize;attribute vec2 indexes;varying vec4 rgba;void main(){vec4 pointPosition=texture2D(position,indexes/pointsTextureSize);rgba=vec4(pointPosition.xy,1.0,0.0);gl_Position=vec4(0.0,0.0,0.0,1.0);gl_PointSize=1.0;}"; // eslint-disable-line

  var forceFrag$5 = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\nuniform sampler2D position;uniform sampler2D centermass;uniform float center;uniform float alpha;varying vec2 index;void main(){vec4 pointPosition=texture2D(position,index);vec4 velocity=vec4(0.0);vec4 centermassValues=texture2D(centermass,vec2(0.0));vec2 centermassPosition=centermassValues.xy/centermassValues.b;vec2 distVector=centermassPosition-pointPosition.xy;float dist=sqrt(dot(distVector,distVector));if(dist>0.0){float angle=atan(distVector.y,distVector.x);float addV=alpha*center*dist*0.01;velocity.rg+=addV*vec2(cos(angle),sin(angle));}gl_FragColor=velocity;}"; // eslint-disable-line

  function createQuadBuffer(reglInstance) {
      const quadBuffer = reglInstance.buffer(new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]));
      return {
          buffer: quadBuffer,
          size: 2,
      };
  }
  function createIndexesBuffer(reglInstance, textureSize) {
      const indexes = new Float32Array(textureSize * textureSize * 2);
      for (let y = 0; y < textureSize; y++) {
          for (let x = 0; x < textureSize; x++) {
              const i = y * textureSize * 2 + x * 2;
              indexes[i + 0] = x;
              indexes[i + 1] = y;
          }
      }
      const indexBuffer = reglInstance.buffer(indexes);
      return {
          buffer: indexBuffer,
          size: 2,
      };
  }

  var clearFrag = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\nvarying vec2 index;void main(){gl_FragColor=vec4(0.0);}"; // eslint-disable-line

  var updateVert = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\nattribute vec2 quad;varying vec2 index;void main(){index=(quad+1.0)/2.0;gl_Position=vec4(quad,0,1);}"; // eslint-disable-line

  class ForceCenter extends CoreModule {
      create() {
          const { reglInstance } = this;
          this.centermassFbo = reglInstance.framebuffer({
              color: reglInstance.texture({
                  data: new Float32Array(4).fill(0),
                  shape: [1, 1, 4],
                  type: 'float',
              }),
              depth: false,
              stencil: false,
          });
      }
      initPrograms() {
          const { reglInstance, config, store, data, points } = this;
          this.clearCentermassCommand = reglInstance({
              frag: clearFrag,
              vert: updateVert,
              framebuffer: this.centermassFbo,
              primitive: 'triangle strip',
              count: 4,
              attributes: { quad: createQuadBuffer(reglInstance) },
          });
          this.calculateCentermassCommand = reglInstance({
              frag: calculateCentermassFrag,
              vert: calculateCentermassVert,
              framebuffer: () => this.centermassFbo,
              primitive: 'points',
              count: () => data.nodes.length,
              attributes: { indexes: createIndexesBuffer(reglInstance, store.pointsTextureSize) },
              uniforms: {
                  position: () => points === null || points === void 0 ? void 0 : points.previousPositionFbo,
                  pointsTextureSize: () => store.pointsTextureSize,
              },
              blend: {
                  enable: true,
                  func: {
                      src: 'one',
                      dst: 'one',
                  },
                  equation: {
                      rgb: 'add',
                      alpha: 'add',
                  },
              },
              depth: { enable: false, mask: false },
              stencil: { enable: false },
          });
          this.runCommand = reglInstance({
              frag: forceFrag$5,
              vert: updateVert,
              framebuffer: () => points === null || points === void 0 ? void 0 : points.velocityFbo,
              primitive: 'triangle strip',
              count: 4,
              attributes: { quad: createQuadBuffer(reglInstance) },
              uniforms: {
                  position: () => points === null || points === void 0 ? void 0 : points.previousPositionFbo,
                  centermass: () => this.centermassFbo,
                  center: () => { var _a; return (_a = config.simulation) === null || _a === void 0 ? void 0 : _a.center; },
                  alpha: () => store.alpha,
              },
          });
      }
      run() {
          var _a, _b, _c;
          (_a = this.clearCentermassCommand) === null || _a === void 0 ? void 0 : _a.call(this);
          (_b = this.calculateCentermassCommand) === null || _b === void 0 ? void 0 : _b.call(this);
          (_c = this.runCommand) === null || _c === void 0 ? void 0 : _c.call(this);
      }
      destroy() {
          var _a;
          (_a = this.centermassFbo) === null || _a === void 0 ? void 0 : _a.destroy();
      }
  }

  var forceFrag$4 = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\nuniform sampler2D position;uniform float gravity;uniform float spaceSize;uniform float alpha;varying vec2 index;void main(){vec4 pointPosition=texture2D(position,index);vec4 velocity=vec4(0.0);vec2 centerPosition=vec2(spaceSize/2.0);vec2 distVector=centerPosition-pointPosition.rg;float dist=sqrt(dot(distVector,distVector));if(dist>0.0){float angle=atan(distVector.y,distVector.x);float addV=alpha*gravity*dist*0.1;velocity.rg+=addV*vec2(cos(angle),sin(angle));}gl_FragColor=velocity;}"; // eslint-disable-line

  class ForceGravity extends CoreModule {
      initPrograms() {
          const { reglInstance, config, store, points } = this;
          this.runCommand = reglInstance({
              frag: forceFrag$4,
              vert: updateVert,
              framebuffer: () => points === null || points === void 0 ? void 0 : points.velocityFbo,
              primitive: 'triangle strip',
              count: 4,
              attributes: { quad: createQuadBuffer(reglInstance) },
              uniforms: {
                  position: () => points === null || points === void 0 ? void 0 : points.previousPositionFbo,
                  gravity: () => { var _a; return (_a = config.simulation) === null || _a === void 0 ? void 0 : _a.gravity; },
                  spaceSize: () => config.spaceSize,
                  alpha: () => store.alpha,
              },
          });
      }
      run() {
          var _a;
          (_a = this.runCommand) === null || _a === void 0 ? void 0 : _a.call(this);
      }
  }

  function forceFrag$3(maxLinks) {
      return `
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D position;
uniform float linkSpring;
uniform float linkDistance;
uniform vec2 linkDistRandomVariationRange;

uniform sampler2D linkFirstIndicesAndAmount;
uniform sampler2D linkIndices;
uniform sampler2D linkBiasAndStrength;
uniform sampler2D linkRandomDistanceFbo;

uniform float pointsTextureSize;
uniform float linksTextureSize;
uniform float alpha;

varying vec2 index;

const float MAX_LINKS = ${maxLinks}.0;

void main() {
  vec4 pointPosition = texture2D(position, index);
  vec4 velocity = vec4(0.0);

  vec4 linkFirstIJAndAmount = texture2D(linkFirstIndicesAndAmount, index);
  float iCount = linkFirstIJAndAmount.r;
  float jCount = linkFirstIJAndAmount.g;
  float linkAmount = linkFirstIJAndAmount.b;
  if (linkAmount > 0.0) {
    for (float i = 0.0; i < MAX_LINKS; i += 1.0) {
      if (i < linkAmount) {
        if (iCount >= linksTextureSize) {
          iCount = 0.0;
          jCount += 1.0;
        }
        vec2 linkTextureIndex = (vec2(iCount, jCount) + 0.5) / linksTextureSize;
        vec4 connectedPointIndex = texture2D(linkIndices, linkTextureIndex);
        vec4 biasAndStrength = texture2D(linkBiasAndStrength, linkTextureIndex);
        vec4 randomMinDistance = texture2D(linkRandomDistanceFbo, linkTextureIndex);
        float bias = biasAndStrength.r;
        float strength = biasAndStrength.g;
        float randomMinLinkDist = randomMinDistance.r * (linkDistRandomVariationRange.g - linkDistRandomVariationRange.r) + linkDistRandomVariationRange.r;
        randomMinLinkDist *= linkDistance;

        iCount += 1.0;

        vec4 connectedPointPosition = texture2D(position, (connectedPointIndex.rg + 0.5) / pointsTextureSize);
        float x = connectedPointPosition.x - (pointPosition.x + velocity.x);
        float y = connectedPointPosition.y - (pointPosition.y + velocity.y);
        float l = sqrt(x * x + y * y);
        l = max(l, randomMinLinkDist * 0.99);
        l = (l - randomMinLinkDist) / l;
        l *= linkSpring * alpha;
        l *= strength;
        l *= bias;
        x *= l;
        y *= l;
        velocity.x += x;
        velocity.y += y;
      }
    }
  }

  gl_FragColor = vec4(velocity.rg, 0.0, 0.0);
}
  `;
  }

  var LinkDirection;
  (function (LinkDirection) {
      LinkDirection["OUTGOING"] = "outgoing";
      LinkDirection["INCOMING"] = "incoming";
  })(LinkDirection || (LinkDirection = {}));
  class ForceLink extends CoreModule {
      constructor() {
          super(...arguments);
          this.linkFirstIndicesAndAmount = new Float32Array();
          this.indices = new Float32Array();
          this.maxPointDegree = 0;
      }
      create(direction) {
          const { reglInstance, store: { pointsTextureSize, linksTextureSize }, data } = this;
          this.linkFirstIndicesAndAmount = new Float32Array(pointsTextureSize * pointsTextureSize * 4);
          this.indices = new Float32Array(linksTextureSize * linksTextureSize * 4);
          const linkBiasAndStrengthState = new Float32Array(linksTextureSize * linksTextureSize * 4);
          const linkDistanceState = new Float32Array(linksTextureSize * linksTextureSize * 4);
          const grouped = direction === LinkDirection.INCOMING ? data.groupedSourceToTargetLinks : data.groupedTargetToSourceLinks;
          this.maxPointDegree = 0;
          let linkIndex = 0;
          grouped.forEach((connectedNodeIndices, nodeIndex) => {
              this.linkFirstIndicesAndAmount[nodeIndex * 4 + 0] = linkIndex % linksTextureSize;
              this.linkFirstIndicesAndAmount[nodeIndex * 4 + 1] = Math.floor(linkIndex / linksTextureSize);
              this.linkFirstIndicesAndAmount[nodeIndex * 4 + 2] = connectedNodeIndices.size;
              connectedNodeIndices.forEach((connectedNodeIndex) => {
                  var _a, _b;
                  this.indices[linkIndex * 4 + 0] = connectedNodeIndex % pointsTextureSize;
                  this.indices[linkIndex * 4 + 1] = Math.floor(connectedNodeIndex / pointsTextureSize);
                  const degree = (_a = data.degree[data.getInputIndexBySortedIndex(connectedNodeIndex)]) !== null && _a !== void 0 ? _a : 0;
                  const connectedDegree = (_b = data.degree[data.getInputIndexBySortedIndex(nodeIndex)]) !== null && _b !== void 0 ? _b : 0;
                  const bias = degree / (degree + connectedDegree);
                  let strength = 1 / Math.min(degree, connectedDegree);
                  strength = Math.sqrt(strength);
                  linkBiasAndStrengthState[linkIndex * 4 + 0] = bias;
                  linkBiasAndStrengthState[linkIndex * 4 + 1] = strength;
                  linkDistanceState[linkIndex * 4] = this.store.getRandomFloat(0, 1);
                  linkIndex += 1;
              });
              this.maxPointDegree = Math.max(this.maxPointDegree, connectedNodeIndices.size);
          });
          this.linkFirstIndicesAndAmountFbo = reglInstance.framebuffer({
              color: reglInstance.texture({
                  data: this.linkFirstIndicesAndAmount,
                  shape: [pointsTextureSize, pointsTextureSize, 4],
                  type: 'float',
              }),
              depth: false,
              stencil: false,
          });
          this.indicesFbo = reglInstance.framebuffer({
              color: reglInstance.texture({
                  data: this.indices,
                  shape: [linksTextureSize, linksTextureSize, 4],
                  type: 'float',
              }),
              depth: false,
              stencil: false,
          });
          this.biasAndStrengthFbo = reglInstance.framebuffer({
              color: reglInstance.texture({
                  data: linkBiasAndStrengthState,
                  shape: [linksTextureSize, linksTextureSize, 4],
                  type: 'float',
              }),
              depth: false,
              stencil: false,
          });
          this.randomDistanceFbo = reglInstance.framebuffer({
              color: reglInstance.texture({
                  data: linkDistanceState,
                  shape: [linksTextureSize, linksTextureSize, 4],
                  type: 'float',
              }),
              depth: false,
              stencil: false,
          });
      }
      initPrograms() {
          const { reglInstance, config, store, points } = this;
          this.runCommand = reglInstance({
              frag: () => forceFrag$3(this.maxPointDegree),
              vert: updateVert,
              framebuffer: () => points === null || points === void 0 ? void 0 : points.velocityFbo,
              primitive: 'triangle strip',
              count: 4,
              attributes: { quad: createQuadBuffer(reglInstance) },
              uniforms: {
                  position: () => points === null || points === void 0 ? void 0 : points.previousPositionFbo,
                  linkSpring: () => { var _a; return (_a = config.simulation) === null || _a === void 0 ? void 0 : _a.linkSpring; },
                  linkDistance: () => { var _a; return (_a = config.simulation) === null || _a === void 0 ? void 0 : _a.linkDistance; },
                  linkDistRandomVariationRange: () => { var _a; return (_a = config.simulation) === null || _a === void 0 ? void 0 : _a.linkDistRandomVariationRange; },
                  linkFirstIndicesAndAmount: () => this.linkFirstIndicesAndAmountFbo,
                  linkIndices: () => this.indicesFbo,
                  linkBiasAndStrength: () => this.biasAndStrengthFbo,
                  linkRandomDistanceFbo: () => this.randomDistanceFbo,
                  pointsTextureSize: () => store.pointsTextureSize,
                  linksTextureSize: () => store.linksTextureSize,
                  alpha: () => store.alpha,
              },
          });
      }
      run() {
          var _a;
          (_a = this.runCommand) === null || _a === void 0 ? void 0 : _a.call(this);
      }
      destroy() {
          var _a, _b, _c, _d;
          (_a = this.linkFirstIndicesAndAmountFbo) === null || _a === void 0 ? void 0 : _a.destroy();
          (_b = this.indicesFbo) === null || _b === void 0 ? void 0 : _b.destroy();
          (_c = this.biasAndStrengthFbo) === null || _c === void 0 ? void 0 : _c.destroy();
          (_d = this.randomDistanceFbo) === null || _d === void 0 ? void 0 : _d.destroy();
      }
  }

  var calculateLevelFrag = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\nvarying vec4 rgba;void main(){gl_FragColor=rgba;}"; // eslint-disable-line

  var calculateLevelVert = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\nuniform sampler2D position;uniform float pointsTextureSize;uniform float levelTextureSize;uniform float cellSize;attribute vec2 indexes;varying vec4 rgba;void main(){vec4 pointPosition=texture2D(position,indexes/pointsTextureSize);rgba=vec4(pointPosition.rg,1.0,0.0);float n=floor(pointPosition.x/cellSize);float m=floor(pointPosition.y/cellSize);vec2 levelPosition=2.0*(vec2(n,m)+0.5)/levelTextureSize-1.0;gl_Position=vec4(levelPosition,0.0,1.0);gl_PointSize=1.0;}"; // eslint-disable-line

  var forceFrag$2 = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\nuniform sampler2D position;uniform sampler2D levelFbo;uniform float level;uniform float levels;uniform float levelTextureSize;uniform float repulsion;uniform float alpha;uniform float spaceSize;uniform float theta;varying vec2 index;const float MAX_LEVELS_NUM=14.0;vec2 calcAdd(vec2 ij,vec2 pp){vec2 add=vec2(0.0);vec4 centermass=texture2D(levelFbo,ij);if(centermass.r>0.0&&centermass.g>0.0&&centermass.b>0.0){vec2 centermassPosition=vec2(centermass.rg/centermass.b);vec2 distVector=pp-centermassPosition;float l=dot(distVector,distVector);float dist=sqrt(l);if(l>0.0){float angle=atan(distVector.y,distVector.x);float c=alpha*repulsion*centermass.b;float distanceMin2=1.0;if(l<distanceMin2)l=sqrt(distanceMin2*l);float addV=c/sqrt(l);add=addV*vec2(cos(angle),sin(angle));}}return add;}void main(){vec4 pointPosition=texture2D(position,index);float x=pointPosition.x;float y=pointPosition.y;float left=0.0;float top=0.0;float right=spaceSize;float bottom=spaceSize;float n_left=0.0;float n_top=0.0;float n_right=0.0;float n_bottom=0.0;float cellSize=0.0;for(float i=0.0;i<MAX_LEVELS_NUM;i+=1.0){if(i<=level){left+=cellSize*n_left;top+=cellSize*n_top;right-=cellSize*n_right;bottom-=cellSize*n_bottom;cellSize=pow(2.0,levels-i-1.0);float dist_left=x-left;n_left=max(0.0,floor(dist_left/cellSize-theta));float dist_top=y-top;n_top=max(0.0,floor(dist_top/cellSize-theta));float dist_right=right-x;n_right=max(0.0,floor(dist_right/cellSize-theta));float dist_bottom=bottom-y;n_bottom=max(0.0,floor(dist_bottom/cellSize-theta));}}vec4 velocity=vec4(vec2(0.0),1.0,0.0);for(float i=0.0;i<12.0;i+=1.0){for(float j=0.0;j<4.0;j+=1.0){float n=left+cellSize*j;float m=top+cellSize*n_top+cellSize*i;if(n<(left+n_left*cellSize)&&m<bottom){velocity.xy+=calcAdd(vec2(n/cellSize,m/cellSize)/levelTextureSize,pointPosition.xy);}n=left+cellSize*i;m=top+cellSize*j;if(n<(right-n_right*cellSize)&&m<(top+n_top*cellSize)){velocity.xy+=calcAdd(vec2(n/cellSize,m/cellSize)/levelTextureSize,pointPosition.xy);}n=right-n_right*cellSize+cellSize*j;m=top+cellSize*i;if(n<right&&m<(bottom-n_bottom*cellSize)){velocity.xy+=calcAdd(vec2(n/cellSize,m/cellSize)/levelTextureSize,pointPosition.xy);}n=left+n_left*cellSize+cellSize*i;m=bottom-n_bottom*cellSize+cellSize*j;if(n<right&&m<bottom){velocity.xy+=calcAdd(vec2(n/cellSize,m/cellSize)/levelTextureSize,pointPosition.xy);}}}gl_FragColor=velocity;}"; // eslint-disable-line

  var forceCenterFrag = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\nuniform sampler2D position;uniform sampler2D levelFbo;uniform sampler2D randomValues;uniform float levelTextureSize;uniform float repulsion;uniform float alpha;varying vec2 index;vec2 calcAdd(vec2 ij,vec2 pp){vec2 add=vec2(0.0);vec4 centermass=texture2D(levelFbo,ij);if(centermass.r>0.0&&centermass.g>0.0&&centermass.b>0.0){vec2 centermassPosition=vec2(centermass.rg/centermass.b);vec2 distVector=pp-centermassPosition;float l=dot(distVector,distVector);float dist=sqrt(l);if(l>0.0){float angle=atan(distVector.y,distVector.x);float c=alpha*repulsion*centermass.b;float distanceMin2=1.0;if(l<distanceMin2)l=sqrt(distanceMin2*l);float addV=c/sqrt(l);add=addV*vec2(cos(angle),sin(angle));}}return add;}void main(){vec4 pointPosition=texture2D(position,index);vec4 random=texture2D(randomValues,index);vec4 velocity=vec4(0.0);velocity.xy+=calcAdd(pointPosition.xy/levelTextureSize,pointPosition.xy);velocity.xy+=velocity.xy*random.rg;gl_FragColor=velocity;}"; // eslint-disable-line

  class ForceManyBody extends CoreModule {
      constructor() {
          super(...arguments);
          this.levelsFbos = new Map();
          this.quadtreeLevels = 0;
      }
      create() {
          var _a;
          const { reglInstance, config, store } = this;
          this.quadtreeLevels = Math.log2((_a = config.spaceSize) !== null && _a !== void 0 ? _a : defaultConfigValues.spaceSize);
          for (let i = 0; i < this.quadtreeLevels; i += 1) {
              const levelTextureSize = Math.pow(2, i + 1);
              this.levelsFbos.set(`level[${i}]`, reglInstance.framebuffer({
                  shape: [levelTextureSize, levelTextureSize],
                  colorType: 'float',
                  depth: false,
                  stencil: false,
              }));
          }
          // Create random number to prevent point to stick together in one coordinate
          const randomValuesState = new Float32Array(store.pointsTextureSize * store.pointsTextureSize * 4);
          for (let i = 0; i < store.pointsTextureSize * store.pointsTextureSize; ++i) {
              randomValuesState[i * 4] = store.getRandomFloat(-1, 1) * 0.00001;
              randomValuesState[i * 4 + 1] = store.getRandomFloat(-1, 1) * 0.00001;
          }
          this.randomValuesFbo = reglInstance.framebuffer({
              color: reglInstance.texture({
                  data: randomValuesState,
                  shape: [store.pointsTextureSize, store.pointsTextureSize, 4],
                  type: 'float',
              }),
              depth: false,
              stencil: false,
          });
      }
      initPrograms() {
          const { reglInstance, config, store, data, points } = this;
          this.clearLevelsCommand = reglInstance({
              frag: clearFrag,
              vert: updateVert,
              framebuffer: (_, props) => props.levelFbo,
              primitive: 'triangle strip',
              count: 4,
              attributes: { quad: createQuadBuffer(reglInstance) },
          });
          this.calculateLevelsCommand = reglInstance({
              frag: calculateLevelFrag,
              vert: calculateLevelVert,
              framebuffer: (_, props) => props.levelFbo,
              primitive: 'points',
              count: () => data.nodes.length,
              attributes: { indexes: createIndexesBuffer(reglInstance, store.pointsTextureSize) },
              uniforms: {
                  position: () => points === null || points === void 0 ? void 0 : points.previousPositionFbo,
                  pointsTextureSize: () => store.pointsTextureSize,
                  levelTextureSize: (_, props) => props.levelTextureSize,
                  cellSize: (_, props) => props.cellSize,
              },
              blend: {
                  enable: true,
                  func: {
                      src: 'one',
                      dst: 'one',
                  },
                  equation: {
                      rgb: 'add',
                      alpha: 'add',
                  },
              },
              depth: { enable: false, mask: false },
              stencil: { enable: false },
          });
          this.forceCommand = reglInstance({
              frag: forceFrag$2,
              vert: updateVert,
              framebuffer: () => points === null || points === void 0 ? void 0 : points.velocityFbo,
              primitive: 'triangle strip',
              count: 4,
              attributes: { quad: createQuadBuffer(reglInstance) },
              uniforms: {
                  position: () => points === null || points === void 0 ? void 0 : points.previousPositionFbo,
                  level: (_, props) => props.level,
                  levels: this.quadtreeLevels,
                  levelFbo: (_, props) => props.levelFbo,
                  levelTextureSize: (_, props) => props.levelTextureSize,
                  alpha: () => store.alpha,
                  repulsion: () => { var _a; return (_a = config.simulation) === null || _a === void 0 ? void 0 : _a.repulsion; },
                  spaceSize: () => config.spaceSize,
                  theta: () => { var _a; return (_a = config.simulation) === null || _a === void 0 ? void 0 : _a.repulsionTheta; },
              },
              blend: {
                  enable: true,
                  func: {
                      src: 'one',
                      dst: 'one',
                  },
                  equation: {
                      rgb: 'add',
                      alpha: 'add',
                  },
              },
              depth: { enable: false, mask: false },
              stencil: { enable: false },
          });
          this.forceFromItsOwnCentermassCommand = reglInstance({
              frag: forceCenterFrag,
              vert: updateVert,
              framebuffer: () => points === null || points === void 0 ? void 0 : points.velocityFbo,
              primitive: 'triangle strip',
              count: 4,
              attributes: { quad: createQuadBuffer(reglInstance) },
              uniforms: {
                  position: () => points === null || points === void 0 ? void 0 : points.previousPositionFbo,
                  randomValues: () => this.randomValuesFbo,
                  levelFbo: (_, props) => props.levelFbo,
                  levelTextureSize: (_, props) => props.levelTextureSize,
                  alpha: () => store.alpha,
                  repulsion: () => { var _a; return (_a = config.simulation) === null || _a === void 0 ? void 0 : _a.repulsion; },
                  spaceSize: () => config.spaceSize,
              },
              blend: {
                  enable: true,
                  func: {
                      src: 'one',
                      dst: 'one',
                  },
                  equation: {
                      rgb: 'add',
                      alpha: 'add',
                  },
              },
              depth: { enable: false, mask: false },
              stencil: { enable: false },
          });
          this.clearVelocityCommand = reglInstance({
              frag: clearFrag,
              vert: updateVert,
              framebuffer: () => points === null || points === void 0 ? void 0 : points.velocityFbo,
              primitive: 'triangle strip',
              count: 4,
              attributes: { quad: createQuadBuffer(reglInstance) },
          });
      }
      run() {
          var _a, _b, _c, _d, _e, _f;
          const { config } = this;
          for (let i = 0; i < this.quadtreeLevels; i += 1) {
              (_a = this.clearLevelsCommand) === null || _a === void 0 ? void 0 : _a.call(this, { levelFbo: this.levelsFbos.get(`level[${i}]`) });
              const levelTextureSize = Math.pow(2, i + 1);
              const cellSize = ((_b = config.spaceSize) !== null && _b !== void 0 ? _b : defaultConfigValues.spaceSize) / levelTextureSize;
              (_c = this.calculateLevelsCommand) === null || _c === void 0 ? void 0 : _c.call(this, {
                  levelFbo: this.levelsFbos.get(`level[${i}]`),
                  levelTextureSize,
                  cellSize,
              });
          }
          (_d = this.clearVelocityCommand) === null || _d === void 0 ? void 0 : _d.call(this);
          for (let i = 0; i < this.quadtreeLevels; i += 1) {
              const levelTextureSize = Math.pow(2, i + 1);
              (_e = this.forceCommand) === null || _e === void 0 ? void 0 : _e.call(this, {
                  levelFbo: this.levelsFbos.get(`level[${i}]`),
                  levelTextureSize,
                  level: i,
              });
              if (i === this.quadtreeLevels - 1) {
                  (_f = this.forceFromItsOwnCentermassCommand) === null || _f === void 0 ? void 0 : _f.call(this, {
                      levelFbo: this.levelsFbos.get(`level[${i}]`),
                      levelTextureSize,
                      level: i,
                  });
              }
          }
      }
      destroy() {
          var _a;
          (_a = this.randomValuesFbo) === null || _a === void 0 ? void 0 : _a.destroy();
          this.levelsFbos.forEach(fbo => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (fbo === null || fbo === void 0 ? void 0 : fbo._framebuffer.framebuffer) {
                  fbo.destroy();
              }
          });
          this.levelsFbos.clear();
      }
  }

  function forceFrag$1(startLevel, maxLevels) {
      startLevel = Math.min(startLevel, maxLevels);
      const delta = maxLevels - startLevel;
      const calcAdd = `
    float dist = sqrt(l);
    if (dist > 0.0) {
      float c = alpha * repulsion * centermass.b;
      addVelocity += calcAdd(vec2(x, y), l, c);
      addVelocity += addVelocity * random.rg;
    }
  `;
      function quad(level) {
          if (level >= maxLevels) {
              return calcAdd;
          }
          else {
              const groupSize = Math.pow(2, level + 1);
              const iEnding = new Array(level + 1 - delta).fill(0).map((_, l) => `pow(2.0, ${level - (l + delta)}.0) * i${l + delta}`).join('+');
              const jEnding = new Array(level + 1 - delta).fill(0).map((_, l) => `pow(2.0, ${level - (l + delta)}.0) * j${l + delta}`).join('+');
              return `
      for (float ij${level} = 0.0; ij${level} < 4.0; ij${level} += 1.0) {
        float i${level} = 0.0;
        float j${level} = 0.0;
        if (ij${level} == 1.0 || ij${level} == 3.0) i${level} = 1.0;
        if (ij${level} == 2.0 || ij${level} == 3.0) j${level} = 1.0;
        float i = pow(2.0, ${startLevel}.0) * n / width${level + 1} + ${iEnding};
        float j = pow(2.0, ${startLevel}.0) * m / width${level + 1} + ${jEnding};
        float groupPosX = (i + 0.5) / ${groupSize}.0;
        float groupPosY = (j + 0.5) / ${groupSize}.0;
        
        vec4 centermass = texture2D(level[${level}], vec2(groupPosX, groupPosY));
        if (centermass.r > 0.0 && centermass.g > 0.0 && centermass.b > 0.0) {
          float x = centermass.r / centermass.b - pointPosition.r;
          float y = centermass.g / centermass.b - pointPosition.g;
          float l = x * x + y * y;
          if ((width${level + 1} * width${level + 1}) / theta < l) {
            ${calcAdd}
          } else {
            ${quad(level + 1)}
          }
        }
      }
      `;
          }
      }
      return `
#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D position;
uniform sampler2D randomValues;
uniform float spaceSize;
uniform float repulsion;
uniform float theta;
uniform float alpha;
uniform sampler2D level[${maxLevels}];
varying vec2 index;

vec2 calcAdd(vec2 xy, float l, float c) {
  float distanceMin2 = 1.0;
  if (l < distanceMin2) l = sqrt(distanceMin2 * l);
  float add = c / l;
  return add * xy;
}

void main() {
  vec4 pointPosition = texture2D(position, index);
  vec4 random = texture2D(randomValues, index);

  float width0 = spaceSize;

  vec2 velocity = vec2(0.0);
  vec2 addVelocity = vec2(0.0);

  ${new Array(maxLevels).fill(0).map((_, i) => `float width${i + 1} = width${i} / 2.0;`).join('\n')}

  for (float n = 0.0; n < pow(2.0, ${delta}.0); n += 1.0) {
    for (float m = 0.0; m < pow(2.0, ${delta}.0); m += 1.0) {
      ${quad(delta)}
    }
  }

  velocity -= addVelocity;

  gl_FragColor = vec4(velocity, 0.0, 0.0);
}
`;
  }

  class ForceManyBodyQuadtree extends CoreModule {
      constructor() {
          super(...arguments);
          this.levelsFbos = new Map();
          this.quadtreeLevels = 0;
      }
      create() {
          var _a;
          const { reglInstance, config, store } = this;
          this.quadtreeLevels = Math.log2((_a = config.spaceSize) !== null && _a !== void 0 ? _a : defaultConfigValues.spaceSize);
          for (let i = 0; i < this.quadtreeLevels; i += 1) {
              const levelTextureSize = Math.pow(2, i + 1);
              this.levelsFbos.set(`level[${i}]`, reglInstance.framebuffer({
                  color: reglInstance.texture({
                      data: new Float32Array(levelTextureSize * levelTextureSize * 4),
                      shape: [levelTextureSize, levelTextureSize, 4],
                      type: 'float',
                  }),
                  depth: false,
                  stencil: false,
              }));
          }
          // Create random number to prevent point to stick together in one coordinate
          const randomValuesState = new Float32Array(store.pointsTextureSize * store.pointsTextureSize * 4);
          for (let i = 0; i < store.pointsTextureSize * store.pointsTextureSize; ++i) {
              randomValuesState[i * 4] = store.getRandomFloat(-1, 1) * 0.00001;
              randomValuesState[i * 4 + 1] = store.getRandomFloat(-1, 1) * 0.00001;
          }
          this.randomValuesFbo = reglInstance.framebuffer({
              color: reglInstance.texture({
                  data: randomValuesState,
                  shape: [store.pointsTextureSize, store.pointsTextureSize, 4],
                  type: 'float',
              }),
              depth: false,
              stencil: false,
          });
      }
      initPrograms() {
          var _a, _b;
          const { reglInstance, config, store, data, points } = this;
          this.clearLevelsCommand = reglInstance({
              frag: clearFrag,
              vert: updateVert,
              framebuffer: (_, props) => props.levelFbo,
              primitive: 'triangle strip',
              count: 4,
              attributes: { quad: createQuadBuffer(reglInstance) },
          });
          this.calculateLevelsCommand = reglInstance({
              frag: calculateLevelFrag,
              vert: calculateLevelVert,
              framebuffer: (_, props) => props.levelFbo,
              primitive: 'points',
              count: () => data.nodes.length,
              attributes: { indexes: createIndexesBuffer(reglInstance, store.pointsTextureSize) },
              uniforms: {
                  position: () => points === null || points === void 0 ? void 0 : points.previousPositionFbo,
                  pointsTextureSize: () => store.pointsTextureSize,
                  levelTextureSize: (_, props) => props.levelTextureSize,
                  cellSize: (_, props) => props.cellSize,
              },
              blend: {
                  enable: true,
                  func: {
                      src: 'one',
                      dst: 'one',
                  },
                  equation: {
                      rgb: 'add',
                      alpha: 'add',
                  },
              },
              depth: { enable: false, mask: false },
              stencil: { enable: false },
          });
          this.quadtreeCommand = reglInstance({
              frag: forceFrag$1((_b = (_a = config.simulation) === null || _a === void 0 ? void 0 : _a.repulsionQuadtreeLevels) !== null && _b !== void 0 ? _b : this.quadtreeLevels, this.quadtreeLevels),
              vert: updateVert,
              framebuffer: () => points === null || points === void 0 ? void 0 : points.velocityFbo,
              primitive: 'triangle strip',
              count: 4,
              attributes: { quad: createQuadBuffer(reglInstance) },
              uniforms: {
                  position: () => points === null || points === void 0 ? void 0 : points.previousPositionFbo,
                  randomValues: () => this.randomValuesFbo,
                  spaceSize: () => config.spaceSize,
                  repulsion: () => { var _a; return (_a = config.simulation) === null || _a === void 0 ? void 0 : _a.repulsion; },
                  theta: () => { var _a; return (_a = config.simulation) === null || _a === void 0 ? void 0 : _a.repulsionTheta; },
                  alpha: () => store.alpha,
                  ...Object.fromEntries(this.levelsFbos),
              },
          });
      }
      run() {
          var _a, _b, _c, _d;
          const { config } = this;
          for (let i = 0; i < this.quadtreeLevels; i += 1) {
              (_a = this.clearLevelsCommand) === null || _a === void 0 ? void 0 : _a.call(this, { levelFbo: this.levelsFbos.get(`level[${i}]`) });
              const levelTextureSize = Math.pow(2, i + 1);
              const cellSize = ((_b = config.spaceSize) !== null && _b !== void 0 ? _b : defaultConfigValues.spaceSize) / levelTextureSize;
              (_c = this.calculateLevelsCommand) === null || _c === void 0 ? void 0 : _c.call(this, {
                  levelFbo: this.levelsFbos.get(`level[${i}]`),
                  levelTextureSize,
                  cellSize,
              });
          }
          (_d = this.quadtreeCommand) === null || _d === void 0 ? void 0 : _d.call(this);
      }
      destroy() {
          var _a;
          (_a = this.randomValuesFbo) === null || _a === void 0 ? void 0 : _a.destroy();
          this.levelsFbos.forEach(fbo => {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (fbo === null || fbo === void 0 ? void 0 : fbo._framebuffer.framebuffer) {
                  fbo.destroy();
              }
          });
          this.levelsFbos.clear();
      }
  }

  var forceFrag = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\nuniform sampler2D position;uniform float repulsion;uniform vec2 mousePos;varying vec2 index;void main(){vec4 pointPosition=texture2D(position,index);vec4 velocity=vec4(0.0);vec2 mouse=mousePos;vec2 distVector=mouse-pointPosition.rg;float dist=sqrt(dot(distVector,distVector));dist=max(dist,10.0);float angle=atan(distVector.y,distVector.x);float addV=100.0*repulsion/(dist*dist);velocity.rg-=addV*vec2(cos(angle),sin(angle));gl_FragColor=velocity;}"; // eslint-disable-line

  class ForceMouse extends CoreModule {
      initPrograms() {
          const { reglInstance, config, store, points } = this;
          this.runCommand = reglInstance({
              frag: forceFrag,
              vert: updateVert,
              framebuffer: () => points === null || points === void 0 ? void 0 : points.velocityFbo,
              primitive: 'triangle strip',
              count: 4,
              attributes: { quad: createQuadBuffer(reglInstance) },
              uniforms: {
                  position: () => points === null || points === void 0 ? void 0 : points.previousPositionFbo,
                  mousePos: () => store.mousePosition,
                  repulsion: () => { var _a; return (_a = config.simulation) === null || _a === void 0 ? void 0 : _a.repulsionFromMouse; },
              },
          });
      }
      run() {
          var _a;
          (_a = this.runCommand) === null || _a === void 0 ? void 0 : _a.call(this);
      }
  }

  var glBench = {exports: {}};

  (function (module, exports) {
  	(function (global, factory) {
  	  module.exports = factory() ;
  	}(commonjsGlobal, (function () {
  	  var UISVG = "<div class=\"gl-box\">\n  <svg viewBox=\"0 0 55 60\">\n    <text x=\"27\" y=\"56\" class=\"gl-fps\">00 FPS</text>\n    <text x=\"28\" y=\"8\" class=\"gl-mem\"></text>\n    <rect x=\"0\" y=\"14\" rx=\"4\" ry=\"4\" width=\"55\" height=\"32\"></rect>\n    <polyline class=\"gl-chart\"></polyline>\n  </svg>\n  <svg viewBox=\"0 0 14 60\" class=\"gl-cpu-svg\">\n    <line x1=\"7\" y1=\"38\" x2=\"7\" y2=\"11\" class=\"opacity\"/>\n    <line x1=\"7\" y1=\"38\" x2=\"7\" y2=\"11\" class=\"gl-cpu\" stroke-dasharray=\"0 27\"/>\n    <path d=\"M5.35 43c-.464 0-.812.377-.812.812v1.16c-.783.1972-1.421.812-1.595 1.624h-1.16c-.435 0-.812.348-.812.812s.348.812.812.812h1.102v1.653H1.812c-.464 0-.812.377-.812.812 0 .464.377.812.812.812h1.131c.1943.783.812 1.392 1.595 1.595v1.131c0 .464.377.812.812.812.464 0 .812-.377.812-.812V53.15h1.653v1.073c0 .464.377.812.812.812.464 0 .812-.377.812-.812v-1.131c.783-.1943 1.392-.812 1.595-1.595h1.131c.464 0 .812-.377.812-.812 0-.464-.377-.812-.812-.812h-1.073V48.22h1.102c.435 0 .812-.348.812-.812s-.348-.812-.812-.812h-1.16c-.1885-.783-.812-1.421-1.595-1.624v-1.131c0-.464-.377-.812-.812-.812-.464 0-.812.377-.812.812v1.073H6.162v-1.073c0-.464-.377-.812-.812-.812zm.58 3.48h2.088c.754 0 1.363.609 1.363 1.363v2.088c0 .754-.609 1.363-1.363 1.363H5.93c-.754 0-1.363-.609-1.363-1.363v-2.088c0-.754.609-1.363 1.363-1.363z\"/>\n  </svg>\n  <svg viewBox=\"0 0 14 60\" class=\"gl-gpu-svg\">\n    <line x1=\"7\" y1=\"38\" x2=\"7\" y2=\"11\" class=\"opacity\"/>\n    <line x1=\"7\" y1=\"38\" x2=\"7\" y2=\"11\" class=\"gl-gpu\" stroke-dasharray=\"0 27\"/>\n    <path d=\"M1.94775 43.3772a.736.736 0 10-.00416 1.472c.58535.00231.56465.1288.6348.3197.07015.18975.04933.43585.04933.43585l-.00653.05405v8.671a.736.736 0 101.472 0v-1.4145c.253.09522.52785.1495.81765.1495h5.267c1.2535 0 2.254-.9752 2.254-2.185v-3.105c0-1.2075-1.00625-2.185-2.254-2.185h-5.267c-.28865 0-.5635.05405-.8165.1495.01806-.16445.04209-.598-.1357-1.0787-.22425-.6072-.9499-1.2765-2.0125-1.2765zm2.9095 3.6455c.42435 0 .7659.36225.7659.8119v2.9785c0 .44965-.34155.8119-.7659.8119s-.7659-.36225-.7659-.8119v-2.9785c0-.44965.34155-.8119.7659-.8119zm4.117 0a2.3 2.3 0 012.3 2.3 2.3 2.3 0 01-2.3 2.3 2.3 2.3 0 01-2.3-2.3 2.3 2.3 0 012.3-2.3z\"/>\n  </svg>\n</div>";

  	  var UICSS = "#gl-bench {\n  position:absolute;\n  left:0;\n  top:0;\n  z-index:1000;\n  -webkit-user-select: none;\n  -moz-user-select: none;\n  user-select: none;\n}\n\n#gl-bench div {\n  position: relative;\n  display: block;\n  margin: 4px;\n  padding: 0 7px 0 10px;\n  background: #6c6;\n  border-radius: 15px;\n  cursor: pointer;\n  opacity: 0.9;\n}\n\n#gl-bench svg {\n  height: 60px;\n  margin: 0 -1px;\n}\n\n#gl-bench text {\n  font-size: 12px;\n  font-family: Helvetica,Arial,sans-serif;\n  font-weight: 700;\n  dominant-baseline: middle;\n  text-anchor: middle;\n}\n\n#gl-bench .gl-mem {\n  font-size: 9px;\n}\n\n#gl-bench line {\n  stroke-width: 5;\n  stroke: #112211;\n  stroke-linecap: round;\n}\n\n#gl-bench polyline {\n  fill: none;\n  stroke: #112211;\n  stroke-linecap: round;\n  stroke-linejoin: round;\n  stroke-width: 3.5;\n}\n\n#gl-bench rect {\n  fill: #448844;\n}\n\n#gl-bench .opacity {\n  stroke: #448844;\n}\n";

  	  class GLBench {

  	    /** GLBench constructor
  	     * @param { WebGLRenderingContext | WebGL2RenderingContext } gl context
  	     * @param { Object | undefined } settings additional settings
  	     */
  	    constructor(gl, settings = {}) {
  	      this.css = UICSS;
  	      this.svg = UISVG;
  	      this.paramLogger = () => {};
  	      this.chartLogger = () => {};
  	      this.chartLen = 20;
  	      this.chartHz = 20;

  	      this.names = [];
  	      this.cpuAccums = [];
  	      this.gpuAccums = [];  
  	      this.activeAccums = [];
  	      this.chart = new Array(this.chartLen);
  	      this.now = () => (performance && performance.now) ? performance.now() : Date.now();
  	      this.updateUI = () => {
  	        [].forEach.call(this.nodes['gl-gpu-svg'], node => {
  	          node.style.display = this.trackGPU ? 'inline' : 'none';
  	        });
  	      };

  	      Object.assign(this, settings);
  	      this.detected = 0;
  	      this.finished = [];
  	      this.isFramebuffer = 0;
  	      this.frameId = 0;

  	      // 120hz device detection
  	      let rafId, n = 0, t0;
  	      let loop = (t) => {
  	        if (++n < 20) {
  	          rafId = requestAnimationFrame(loop);
  	        } else {
  	          this.detected = Math.ceil(1e3 * n / (t - t0) / 70);
  	          cancelAnimationFrame(rafId);
  	        }
  	        if (!t0) t0 = t;
  	      };
  	      requestAnimationFrame(loop);

  	      // attach gpu profilers
  	      if (gl) {
  	        const glFinish = async (t, activeAccums) =>
  	          Promise.resolve(setTimeout(() => {
  	            gl.getError();
  	            const dt = this.now() - t;
  	            activeAccums.forEach((active, i) => {
  	              if (active) this.gpuAccums[i] += dt;
  	            });
  	          }, 0));

  	        const addProfiler = (fn, self, target) => function() {
  	          const t = self.now();
  	          fn.apply(target, arguments);
  	          if (self.trackGPU) self.finished.push(glFinish(t, self.activeAccums.slice(0)));
  	        };

  	        ['drawArrays', 'drawElements', 'drawArraysInstanced',
  	          'drawBuffers', 'drawElementsInstanced', 'drawRangeElements']
  	          .forEach(fn => { if (gl[fn]) gl[fn] = addProfiler(gl[fn], this, gl); });

  	        gl.getExtension = ((fn, self) => function() {
  	          let ext = fn.apply(gl, arguments);
  	          if (ext) {
  	            ['drawElementsInstancedANGLE', 'drawBuffersWEBGL']
  	              .forEach(fn => { if (ext[fn]) ext[fn] = addProfiler(ext[fn], self, ext); });
  	          }
  	          return ext;
  	        })(gl.getExtension, this);
  	      }

  	      // init ui and ui loggers
  	      if (!this.withoutUI) {
  	        if (!this.dom) this.dom = document.body;
  	        let elm = document.createElement('div');
  	        elm.id = 'gl-bench';
  	        this.dom.appendChild(elm);
  	        this.dom.insertAdjacentHTML('afterbegin', '<style id="gl-bench-style">' + this.css + '</style>');
  	        this.dom = elm;
  	        this.dom.addEventListener('click', () => {
  	          this.trackGPU = !this.trackGPU;
  	          this.updateUI();
  	        });

  	        this.paramLogger = ((logger, dom, names) => {
  	          const classes = ['gl-cpu', 'gl-gpu', 'gl-mem', 'gl-fps', 'gl-gpu-svg', 'gl-chart'];
  	          const nodes = Object.assign({}, classes);
  	          classes.forEach(c => nodes[c] = dom.getElementsByClassName(c));
  	          this.nodes = nodes;
  	          return (i, cpu, gpu, mem, fps, totalTime, frameId) => {
  	            nodes['gl-cpu'][i].style.strokeDasharray = (cpu * 0.27).toFixed(0) + ' 100';
  	            nodes['gl-gpu'][i].style.strokeDasharray = (gpu * 0.27).toFixed(0) + ' 100';
  	            nodes['gl-mem'][i].innerHTML = names[i] ? names[i] : (mem ? 'mem: ' + mem.toFixed(0) + 'mb' : '');
  	            nodes['gl-fps'][i].innerHTML = fps.toFixed(0) + ' FPS';
  	            logger(names[i], cpu, gpu, mem, fps, totalTime, frameId);
  	          }
  	        })(this.paramLogger, this.dom, this.names);

  	        this.chartLogger = ((logger, dom) => {
  	          let nodes = { 'gl-chart': dom.getElementsByClassName('gl-chart') };
  	          return (i, chart, circularId) => {
  	            let points = '';
  	            let len = chart.length;
  	            for (let i = 0; i < len; i++) {
  	              let id = (circularId + i + 1) % len;
  	              if (chart[id] != undefined) {
  	                points = points + ' ' + (55 * i / (len - 1)).toFixed(1) + ','
  	                  + (45 - chart[id] * 22 / 60 / this.detected).toFixed(1);
  	              }
  	            }
  	            nodes['gl-chart'][i].setAttribute('points', points);
  	            logger(this.names[i], chart, circularId);
  	          }
  	        })(this.chartLogger, this.dom);
  	      }
  	    }

  	    /**
  	     * Explicit UI add
  	     * @param { string | undefined } name 
  	     */
  	    addUI(name) {
  	      if (this.names.indexOf(name) == -1) {
  	        this.names.push(name);
  	        if (this.dom) {
  	          this.dom.insertAdjacentHTML('beforeend', this.svg);
  	          this.updateUI();
  	        }
  	        this.cpuAccums.push(0);
  	        this.gpuAccums.push(0);
  	        this.activeAccums.push(false);
  	      }
  	    }

  	    /**
  	     * Increase frameID
  	     * @param { number | undefined } now
  	     */
  	    nextFrame(now) {
  	      this.frameId++;
  	      const t = now ? now : this.now();

  	      // params
  	      if (this.frameId <= 1) {
  	        this.paramFrame = this.frameId;
  	        this.paramTime = t;
  	      } else {
  	        let duration = t - this.paramTime;
  	        if (duration >= 1e3) {
  	          const frameCount = this.frameId - this.paramFrame;
  	          const fps = frameCount / duration * 1e3;
  	          for (let i = 0; i < this.names.length; i++) {
  	            const cpu = this.cpuAccums[i] / duration * 100,
  	              gpu = this.gpuAccums[i] / duration * 100,
  	              mem = (performance && performance.memory) ? performance.memory.usedJSHeapSize / (1 << 20) : 0;
  	            this.paramLogger(i, cpu, gpu, mem, fps, duration, frameCount);
  	            this.cpuAccums[i] = 0;
  	            Promise.all(this.finished).then(() => {
  	              this.gpuAccums[i] = 0;
  	              this.finished = [];
  	            });
  	          }
  	          this.paramFrame = this.frameId;
  	          this.paramTime = t;
  	        }
  	      }

  	      // chart
  	      if (!this.detected || !this.chartFrame) {
  	        this.chartFrame = this.frameId;
  	        this.chartTime = t;
  	        this.circularId = 0;
  	      } else {
  	        let timespan = t - this.chartTime;
  	        let hz = this.chartHz * timespan / 1e3;
  	        while (--hz > 0 && this.detected) {
  	          const frameCount = this.frameId - this.chartFrame;
  	          const fps = frameCount / timespan * 1e3;
  	          this.chart[this.circularId % this.chartLen] = fps;
  	          for (let i = 0; i < this.names.length; i++) {
  	            this.chartLogger(i, this.chart, this.circularId);
  	          }
  	          this.circularId++;
  	          this.chartFrame = this.frameId;
  	          this.chartTime = t;
  	        }
  	      }
  	    }

  	    /**
  	     * Begin named measurement
  	     * @param { string | undefined } name
  	     */
  	    begin(name) {
  	      this.updateAccums(name);
  	    }

  	    /**
  	     * End named measure
  	     * @param { string | undefined } name
  	     */
  	    end(name) {
  	      this.updateAccums(name);
  	    }

  	    updateAccums(name) {
  	      let nameId = this.names.indexOf(name);
  	      if (nameId == -1) {
  	        nameId = this.names.length;
  	        this.addUI(name);
  	      }

  	      const t = this.now();
  	      const dt = t - this.t0;
  	      for (let i = 0; i < nameId + 1; i++) {
  	        if (this.activeAccums[i]) {
  	          this.cpuAccums[i] += dt;
  	        }
  	      }    this.activeAccums[nameId] = !this.activeAccums[nameId];
  	      this.t0 = t;
  	    }

  	  }

  	  return GLBench;

  	})));
  } (glBench));

  var GLBench = glBench.exports;

  const benchCSS = `
  #gl-bench {
    position:absolute;
    right:0;
    top:0;
    z-index:1000;
    -webkit-user-select: none;
    -moz-user-select: none;
    user-select: none;
  }
  #gl-bench div {
    position: relative;
    display: block;
    margin: 4px;
    padding: 0 7px 0 10px;
    background: #5f69de;
    border-radius: 15px;
    cursor: pointer;
    opacity: 0.9;
  }
  #gl-bench svg {
    height: 60px;
    margin: 0 -1px;
  }
  #gl-bench text {
    font-size: 12px;
    font-family: Helvetica,Arial,sans-serif;
    font-weight: 700;
    dominant-baseline: middle;
    text-anchor: middle;
  }
  #gl-bench .gl-mem {
    font-size: 9px;
  }
  #gl-bench line {
    stroke-width: 5;
    stroke: #112211;
    stroke-linecap: round;
  }
  #gl-bench polyline {
    fill: none;
    stroke: #112211;
    stroke-linecap: round;
    stroke-linejoin: round;
    stroke-width: 3.5;
  }
  #gl-bench rect {
    fill: #8288e4;
  }
  #gl-bench .opacity {
    stroke: #8288e4;
  }
`;

  class FPSMonitor {
      constructor(canvas) {
          this.destroy();
          const gl = (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
          this.bench = new GLBench(gl, { css: benchCSS });
      }
      begin() {
          var _a;
          (_a = this.bench) === null || _a === void 0 ? void 0 : _a.begin('frame');
      }
      end(now) {
          var _a, _b;
          (_a = this.bench) === null || _a === void 0 ? void 0 : _a.end('frame');
          (_b = this.bench) === null || _b === void 0 ? void 0 : _b.nextFrame(now);
      }
      destroy() {
          this.bench = undefined;
          select$1('#gl-bench').remove();
      }
  }

  class GraphData {
      constructor() {
          /** Links that have existing source and target nodes  */
          this.completeLinks = new Set();
          this.degree = [];
          /** Mapping the source node index to a `Set` of target node indices connected to that node */
          this.groupedSourceToTargetLinks = new Map();
          /** Mapping the target node index to a `Set` of source node indices connected to that node */
          this.groupedTargetToSourceLinks = new Map();
          this._nodes = [];
          this._links = [];
          /** Mapping the original id to the original node */
          this.idToNodeMap = new Map();
          /** We want to display more important nodes (i.e. with the biggest number of connections)
           * on top of the other. To render them in the right order,
           * we create an array of node indices sorted by degree (number of connections)
           * and and we store multiple maps that help us referencing the right data objects
           * and other properties by original node index, sorted index, and id 👇. */
          /** Mapping the sorted index to the original index */
          this.sortedIndexToInputIndexMap = new Map();
          /** Mapping the original index to the sorted index of the node */
          this.inputIndexToSortedIndexMap = new Map();
          /** Mapping the original id to the sorted index of the node */
          this.idToSortedIndexMap = new Map();
          /** Mapping the original index to the original id of the node */
          this.inputIndexToIdMap = new Map();
          /** Mapping the original id to the indegree value of the node */
          this.idToIndegreeMap = new Map();
          /** Mapping the original id to the outdegree value of the node */
          this.idToOutdegreeMap = new Map();
      }
      get nodes() {
          return this._nodes;
      }
      get links() {
          return this._links;
      }
      get linksNumber() {
          return this.completeLinks.size;
      }
      setData(inputNodes, inputLinks) {
          this.idToNodeMap.clear();
          this.idToSortedIndexMap.clear();
          this.inputIndexToIdMap.clear();
          this.idToIndegreeMap.clear();
          this.idToOutdegreeMap.clear();
          inputNodes.forEach((n, i) => {
              this.idToNodeMap.set(n.id, n);
              this.inputIndexToIdMap.set(i, n.id);
              this.idToIndegreeMap.set(n.id, 0);
              this.idToOutdegreeMap.set(n.id, 0);
          });
          // Calculate node outdegree/indegree values
          // And filter links if source/target node does not exist
          this.completeLinks.clear();
          inputLinks.forEach(l => {
              const sourceNode = this.idToNodeMap.get(l.source);
              const targetNode = this.idToNodeMap.get(l.target);
              if (sourceNode !== undefined && targetNode !== undefined) {
                  this.completeLinks.add(l);
                  const outdegree = this.idToOutdegreeMap.get(sourceNode.id);
                  if (outdegree !== undefined)
                      this.idToOutdegreeMap.set(sourceNode.id, outdegree + 1);
                  const indegree = this.idToIndegreeMap.get(targetNode.id);
                  if (indegree !== undefined)
                      this.idToIndegreeMap.set(targetNode.id, indegree + 1);
              }
          });
          // Calculate node degree value
          this.degree = new Array(inputNodes.length);
          inputNodes.forEach((n, i) => {
              const outdegree = this.idToOutdegreeMap.get(n.id);
              const indegree = this.idToIndegreeMap.get(n.id);
              this.degree[i] = (outdegree !== null && outdegree !== void 0 ? outdegree : 0) + (indegree !== null && indegree !== void 0 ? indegree : 0);
          });
          // Sort nodes by degree value
          this.sortedIndexToInputIndexMap.clear();
          this.inputIndexToSortedIndexMap.clear();
          const sortedDegrees = Object.entries(this.degree).sort((a, b) => a[1] - b[1]);
          sortedDegrees.forEach(([inputStringedIndex], sortedIndex) => {
              const inputIndex = +inputStringedIndex;
              this.sortedIndexToInputIndexMap.set(sortedIndex, inputIndex);
              this.inputIndexToSortedIndexMap.set(inputIndex, sortedIndex);
              this.idToSortedIndexMap.set(this.inputIndexToIdMap.get(inputIndex), sortedIndex);
          });
          this.groupedSourceToTargetLinks.clear();
          this.groupedTargetToSourceLinks.clear();
          inputLinks.forEach((l) => {
              const sourceIndex = this.idToSortedIndexMap.get(l.source);
              const targetIndex = this.idToSortedIndexMap.get(l.target);
              if (sourceIndex !== undefined && targetIndex !== undefined) {
                  if (this.groupedSourceToTargetLinks.get(sourceIndex) === undefined)
                      this.groupedSourceToTargetLinks.set(sourceIndex, new Set());
                  const targets = this.groupedSourceToTargetLinks.get(sourceIndex);
                  targets === null || targets === void 0 ? void 0 : targets.add(targetIndex);
                  if (this.groupedTargetToSourceLinks.get(targetIndex) === undefined)
                      this.groupedTargetToSourceLinks.set(targetIndex, new Set());
                  const sources = this.groupedTargetToSourceLinks.get(targetIndex);
                  sources === null || sources === void 0 ? void 0 : sources.add(sourceIndex);
              }
          });
          this._nodes = inputNodes;
          this._links = inputLinks;
      }
      getNodeById(id) {
          return this.idToNodeMap.get(id);
      }
      getNodeByIndex(index) {
          return this._nodes[index];
      }
      getSortedIndexByInputIndex(index) {
          return this.inputIndexToSortedIndexMap.get(index);
      }
      getInputIndexBySortedIndex(index) {
          return this.sortedIndexToInputIndexMap.get(index);
      }
      getSortedIndexById(id) {
          return id !== undefined ? this.idToSortedIndexMap.get(id) : undefined;
      }
      getAdjacentNodes(id) {
          var _a, _b;
          const index = this.getSortedIndexById(id);
          if (index === undefined)
              return undefined;
          const outgoingSet = (_a = this.groupedSourceToTargetLinks.get(index)) !== null && _a !== void 0 ? _a : [];
          const incomingSet = (_b = this.groupedTargetToSourceLinks.get(index)) !== null && _b !== void 0 ? _b : [];
          return [...new Set([...outgoingSet, ...incomingSet])]
              .map(index => this.getNodeByIndex(this.getInputIndexBySortedIndex(index)));
      }
  }

  var drawStraightFrag = "precision highp float;\n#define GLSLIFY 1\nuniform bool useArrow;varying vec4 rgbaColor;varying vec2 pos;varying float arrowLength;varying float linkWidthArrowWidthRatio;varying float smoothWidthRatio;varying float targetPointSize;float map(float value,float min1,float max1,float min2,float max2){return min2+(value-min1)*(max2-min2)/(max1-min1);}void main(){float opacity=1.0;vec3 color=rgbaColor.rgb;float smoothDelta=smoothWidthRatio/2.0;if(useArrow){float end_arrow=0.5+arrowLength/2.0;float start_arrow=end_arrow-arrowLength;float arrowWidthDelta=linkWidthArrowWidthRatio/2.0;float linkOpacity=rgbaColor.a*smoothstep(0.5-arrowWidthDelta,0.5-arrowWidthDelta-smoothDelta,abs(pos.y));float arrowOpacity=1.0;if(pos.x>start_arrow&&pos.x<start_arrow+arrowLength){float xmapped=map(pos.x,start_arrow,end_arrow,0.0,1.0);arrowOpacity=rgbaColor.a*smoothstep(xmapped-smoothDelta,xmapped,map(abs(pos.y),0.5,0.0,0.0,1.0));if(linkOpacity!=arrowOpacity){linkOpacity+=arrowOpacity;}}opacity=linkOpacity;}else opacity=rgbaColor.a*smoothstep(0.5,0.5-smoothDelta,abs(pos.y));gl_FragColor=vec4(color,opacity);}"; // eslint-disable-line

  var drawStraightVert = "precision highp float;\n#define GLSLIFY 1\nattribute vec2 position,pointA,pointB;attribute vec4 color;attribute float width;uniform sampler2D positions;uniform sampler2D particleSize;uniform sampler2D particleGreyoutStatus;uniform mat3 transform;uniform float pointsTextureSize;uniform float widthScale;uniform float nodeSizeScale;uniform bool useArrow;uniform float arrowSizeScale;uniform float spaceSize;uniform vec2 screenSize;uniform float ratio;uniform vec2 linkVisibilityDistanceRange;uniform float linkVisibilityMinTransparency;uniform float greyoutOpacity;uniform bool scaleNodesOnZoom;varying vec4 rgbaColor;varying vec2 pos;varying float arrowLength;varying float linkWidthArrowWidthRatio;varying float smoothWidthRatio;varying float targetPointSize;float map(float value,float min1,float max1,float min2,float max2){return min2+(value-min1)*(max2-min2)/(max1-min1);}float pointSize(float size){float pSize;if(scaleNodesOnZoom){pSize=size*ratio*transform[0][0];}else{pSize=size*ratio*min(5.0,max(1.0,transform[0][0]*0.01));}return pSize;}void main(){pos=position;vec2 pointTexturePosA=(pointA+0.5)/pointsTextureSize;vec2 pointTexturePosB=(pointB+0.5)/pointsTextureSize;vec4 greyoutStatusA=texture2D(particleGreyoutStatus,pointTexturePosA);vec4 greyoutStatusB=texture2D(particleGreyoutStatus,pointTexturePosB);targetPointSize=pointSize(texture2D(particleSize,pointTexturePosB).r*nodeSizeScale);vec4 pointPositionA=texture2D(positions,pointTexturePosA);vec4 pointPositionB=texture2D(positions,pointTexturePosB);vec2 a=pointPositionA.xy;vec2 b=pointPositionB.xy;vec2 xBasis=b-a;vec2 yBasis=normalize(vec2(-xBasis.y,xBasis.x));vec2 distVector=a-b;float linkDist=sqrt(dot(distVector,distVector));float linkDistPx=linkDist*transform[0][0];targetPointSize=(targetPointSize/(2.0*ratio))/linkDistPx;float linkWidth=width*widthScale;float k=2.0;float arrowWidth=max(5.0,linkWidth*k);arrowWidth*=arrowSizeScale;float arrowWidthPx=arrowWidth/transform[0][0];arrowLength=min(0.3,(0.866*arrowWidthPx*2.0)/linkDist);float smoothWidth=2.0;float arrowExtraWidth=arrowWidth-linkWidth;linkWidth+=smoothWidth/2.0;if(useArrow){linkWidth+=arrowExtraWidth;}smoothWidthRatio=smoothWidth/linkWidth;linkWidthArrowWidthRatio=arrowExtraWidth/linkWidth;float linkWidthPx=linkWidth/transform[0][0];vec3 rgbColor=color.rgb;float opacity=color.a*max(linkVisibilityMinTransparency,map(linkDistPx,linkVisibilityDistanceRange.g,linkVisibilityDistanceRange.r,0.0,1.0));if(greyoutStatusA.r>0.0||greyoutStatusB.r>0.0){opacity*=greyoutOpacity;}rgbaColor=vec4(rgbColor,opacity);vec2 point=a+xBasis*position.x+yBasis*linkWidthPx*position.y;vec2 p=2.0*point/spaceSize-1.0;p*=spaceSize/screenSize;vec3 final=transform*vec3(p,1);gl_Position=vec4(final.rg,0,1);}"; // eslint-disable-line

  class Lines extends CoreModule {
      create() {
          this.updateColor();
          this.updateWidth();
      }
      initPrograms() {
          const { reglInstance, config, store, data, points } = this;
          const { pointsTextureSize } = store;
          const geometryLinkBuffer = {
              buffer: reglInstance.buffer([
                  [0, -0.5],
                  [1, -0.5],
                  [1, 0.5],
                  [0, -0.5],
                  [1, 0.5],
                  [0, 0.5],
              ]),
              divisor: 0,
          };
          const instancePoints = [];
          data.completeLinks.forEach(l => {
              const toIndex = data.getSortedIndexById(l.target);
              const fromIndex = data.getSortedIndexById(l.source);
              const fromX = fromIndex % pointsTextureSize;
              const fromY = Math.floor(fromIndex / pointsTextureSize);
              const toX = toIndex % pointsTextureSize;
              const toY = Math.floor(toIndex / pointsTextureSize);
              instancePoints.push([fromX, fromY]);
              instancePoints.push([toX, toY]);
          });
          const pointsBuffer = reglInstance.buffer(instancePoints);
          this.drawStraightCommand = reglInstance({
              vert: drawStraightVert,
              frag: drawStraightFrag,
              attributes: {
                  position: geometryLinkBuffer,
                  pointA: {
                      buffer: () => pointsBuffer,
                      divisor: 1,
                      offset: Float32Array.BYTES_PER_ELEMENT * 0,
                      stride: Float32Array.BYTES_PER_ELEMENT * 4,
                  },
                  pointB: {
                      buffer: () => pointsBuffer,
                      divisor: 1,
                      offset: Float32Array.BYTES_PER_ELEMENT * 2,
                      stride: Float32Array.BYTES_PER_ELEMENT * 4,
                  },
                  color: {
                      buffer: () => this.colorBuffer,
                      divisor: 1,
                      offset: Float32Array.BYTES_PER_ELEMENT * 0,
                      stride: Float32Array.BYTES_PER_ELEMENT * 4,
                  },
                  width: {
                      buffer: () => this.widthBuffer,
                      divisor: 1,
                      offset: Float32Array.BYTES_PER_ELEMENT * 0,
                      stride: Float32Array.BYTES_PER_ELEMENT * 1,
                  },
              },
              uniforms: {
                  positions: () => points === null || points === void 0 ? void 0 : points.currentPositionFbo,
                  particleSize: () => points === null || points === void 0 ? void 0 : points.sizeFbo,
                  particleGreyoutStatus: () => points === null || points === void 0 ? void 0 : points.greyoutStatusFbo,
                  transform: () => store.transform,
                  pointsTextureSize: () => store.pointsTextureSize,
                  nodeSizeScale: () => config.nodeSizeScale,
                  widthScale: () => config.linkWidthScale,
                  useArrow: () => config.linkArrows,
                  arrowSizeScale: () => config.linkArrowsSizeScale,
                  spaceSize: () => config.spaceSize,
                  screenSize: () => store.screenSize,
                  ratio: () => config.pixelRatio,
                  linkVisibilityDistanceRange: () => config.linkVisibilityDistanceRange,
                  linkVisibilityMinTransparency: () => config.linkVisibilityMinTransparency,
                  greyoutOpacity: () => config.linkGreyoutOpacity,
                  scaleNodesOnZoom: () => config.scaleNodesOnZoom,
              },
              cull: {
                  enable: true,
                  face: 'back',
              },
              blend: {
                  enable: true,
                  func: {
                      dstRGB: 'one minus src alpha',
                      srcRGB: 'src alpha',
                      dstAlpha: 'one minus src alpha',
                      srcAlpha: 'one',
                  },
                  equation: {
                      rgb: 'add',
                      alpha: 'add',
                  },
              },
              depth: {
                  enable: false,
                  mask: false,
              },
              count: 6,
              instances: () => data.linksNumber,
          });
      }
      draw() {
          var _a;
          if (!this.colorBuffer || !this.widthBuffer)
              return;
          (_a = this.drawStraightCommand) === null || _a === void 0 ? void 0 : _a.call(this);
      }
      updateColor() {
          const { reglInstance, config, data } = this;
          const instancePoints = [];
          data.completeLinks.forEach(l => {
              var _a;
              const c = (_a = getValue(l, config.linkColor)) !== null && _a !== void 0 ? _a : defaultLinkColor;
              const rgba = getRgbaColor(c);
              instancePoints.push(rgba);
          });
          this.colorBuffer = reglInstance.buffer(instancePoints);
      }
      updateWidth() {
          const { reglInstance, config, data } = this;
          const instancePoints = [];
          data.completeLinks.forEach(l => {
              const linkWidth = getValue(l, config.linkWidth);
              instancePoints.push([linkWidth !== null && linkWidth !== void 0 ? linkWidth : defaultLinkWidth]);
          });
          this.widthBuffer = reglInstance.buffer(instancePoints);
      }
      destroy() {
          var _a, _b;
          (_a = this.colorBuffer) === null || _a === void 0 ? void 0 : _a.destroy();
          (_b = this.widthBuffer) === null || _b === void 0 ? void 0 : _b.destroy();
      }
  }

  function createColorBuffer(data, reglInstance, textureSize, colorAccessor) {
      var _a;
      const initialState = new Float32Array(textureSize * textureSize * 4);
      for (let i = 0; i < data.nodes.length; ++i) {
          const sortedIndex = data.getSortedIndexByInputIndex(i);
          const node = data.nodes[i];
          if (node && sortedIndex !== undefined) {
              const c = (_a = getValue(node, colorAccessor)) !== null && _a !== void 0 ? _a : defaultNodeColor;
              const rgba = getRgbaColor(c);
              initialState[sortedIndex * 4 + 0] = rgba[0];
              initialState[sortedIndex * 4 + 1] = rgba[1];
              initialState[sortedIndex * 4 + 2] = rgba[2];
              initialState[sortedIndex * 4 + 3] = rgba[3];
          }
      }
      const initialTexture = reglInstance.texture({
          data: initialState,
          width: textureSize,
          height: textureSize,
          type: 'float',
      });
      return reglInstance.framebuffer({
          color: initialTexture,
          depth: false,
          stencil: false,
      });
  }
  function createGreyoutStatusBuffer(selectedIndices, reglInstance, textureSize) {
      // Greyout status: 0 - false, highlighted or normal point; 1 - true, greyout point
      const initialState = new Float32Array(textureSize * textureSize * 4)
          .fill(selectedIndices ? 1 : 0);
      if (selectedIndices) {
          for (const selectedIndex of selectedIndices) {
              initialState[selectedIndex * 4] = 0;
          }
      }
      const initialTexture = reglInstance.texture({
          data: initialState,
          width: textureSize,
          height: textureSize,
          type: 'float',
      });
      return reglInstance.framebuffer({
          color: initialTexture,
          depth: false,
          stencil: false,
      });
  }

  var drawPointsFrag = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\nvarying vec2 index;varying vec3 rgbColor;varying float alpha;const float smoothing=0.9;void main(){if(alpha==0.0){discard;}float r=0.0;float delta=0.0;vec2 cxy=2.0*gl_PointCoord-1.0;r=dot(cxy,cxy);float opacity=alpha*(1.0-smoothstep(smoothing,1.0,r));gl_FragColor=vec4(rgbColor,opacity);}"; // eslint-disable-line

  var drawPointsVert = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\nattribute vec2 indexes;uniform sampler2D positions;uniform sampler2D particleColor;uniform sampler2D particleGreyoutStatus;uniform sampler2D particleSize;uniform float ratio;uniform mat3 transform;uniform float pointsTextureSize;uniform float sizeScale;uniform float spaceSize;uniform vec2 screenSize;uniform float greyoutOpacity;uniform bool scaleNodesOnZoom;varying vec2 index;varying vec3 rgbColor;varying float alpha;float pointSize(float size){float pSize;if(scaleNodesOnZoom){pSize=size*ratio*transform[0][0];}else{pSize=size*ratio*min(5.0,max(1.0,transform[0][0]*0.01));}return pSize;}void main(){index=indexes;vec4 pointPosition=texture2D(positions,(index+0.5)/pointsTextureSize);vec2 point=pointPosition.rg;vec2 p=2.0*point/spaceSize-1.0;p*=spaceSize/screenSize;vec3 final=transform*vec3(p,1);gl_Position=vec4(final.rg,0,1);vec4 pSize=texture2D(particleSize,(index+0.5)/pointsTextureSize);float size=pSize.r*sizeScale;vec4 pColor=texture2D(particleColor,(index+0.5)/pointsTextureSize);rgbColor=pColor.rgb;gl_PointSize=pointSize(size);alpha=pColor.a;vec4 greyoutStatus=texture2D(particleGreyoutStatus,(index+0.5)/pointsTextureSize);if(greyoutStatus.r>0.0){alpha*=greyoutOpacity;}}"; // eslint-disable-line

  var findPointOnMouseClickFrag = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\nuniform sampler2D position;uniform sampler2D particleSize;uniform float sizeScale;uniform float spaceSize;uniform vec2 screenSize;uniform float ratio;uniform mat3 transform;uniform vec2 mousePosition;uniform bool scaleNodesOnZoom;uniform float maxPointSize;varying vec2 index;float pointSize(float size){float pSize;if(scaleNodesOnZoom){pSize=size*ratio*transform[0][0];}else{pSize=size*ratio*min(5.0,max(1.0,transform[0][0]*0.01));}return min(pSize,maxPointSize);}float euclideanDistance(float x1,float x2,float y1,float y2){return sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));}void main(){vec4 pointPosition=texture2D(position,index);vec2 p=2.0*pointPosition.rg/spaceSize-1.0;p*=spaceSize/screenSize;vec3 final=transform*vec3(p,1);vec4 pSize=texture2D(particleSize,index);float size=pSize.r*sizeScale;vec2 pointScreenPosition=(final.xy+1.0)*screenSize/2.0;gl_FragColor=vec4(0.0,0.0,pointPosition.rg);if(euclideanDistance(pointScreenPosition.x,mousePosition.x,pointScreenPosition.y,mousePosition.y)<0.5*pointSize(size)){gl_FragColor.r=1.0;}}"; // eslint-disable-line

  var findPointsOnAreaSelectionFrag = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\nuniform sampler2D position;uniform sampler2D particleSize;uniform float sizeScale;uniform float spaceSize;uniform vec2 screenSize;uniform float ratio;uniform mat3 transform;uniform vec2 selection[2];uniform bool scaleNodesOnZoom;uniform float maxPointSize;varying vec2 index;float pointSize(float size){float pSize;if(scaleNodesOnZoom){pSize=size*ratio*transform[0][0];}else{pSize=size*ratio*min(5.0,max(1.0,transform[0][0]*0.01));}return min(pSize,maxPointSize);}void main(){vec4 pointPosition=texture2D(position,index);vec2 p=2.0*pointPosition.rg/spaceSize-1.0;p*=spaceSize/screenSize;vec3 final=transform*vec3(p,1);vec4 pSize=texture2D(particleSize,index);float size=pSize.r*sizeScale;float left=2.0*(selection[0].x-0.5*pointSize(size))/screenSize.x-1.0;float right=2.0*(selection[1].x+0.5*pointSize(size))/screenSize.x-1.0;float top=2.0*(selection[0].y-0.5*pointSize(size))/screenSize.y-1.0;float bottom=2.0*(selection[1].y+0.5*pointSize(size))/screenSize.y-1.0;gl_FragColor=vec4(0.0,0.0,pointPosition.rg);if(final.x>=left&&final.x<=right&&final.y>=top&&final.y<=bottom){gl_FragColor.r=1.0;}}"; // eslint-disable-line

  function createSizeBuffer(data, reglInstance, pointTextureSize, sizeAccessor) {
      const numParticles = data.nodes.length;
      const initialState = new Float32Array(pointTextureSize * pointTextureSize * 4);
      for (let i = 0; i < numParticles; ++i) {
          const sortedIndex = data.getSortedIndexByInputIndex(i);
          const node = data.nodes[i];
          if (node && sortedIndex !== undefined) {
              const size = getValue(node, sizeAccessor);
              initialState[sortedIndex * 4] = size !== null && size !== void 0 ? size : defaultNodeSize;
          }
      }
      const initialTexture = reglInstance.texture({
          data: initialState,
          width: pointTextureSize,
          height: pointTextureSize,
          type: 'float',
      });
      return reglInstance.framebuffer({
          color: initialTexture,
          depth: false,
          stencil: false,
      });
  }

  var updatePositionFrag = "#ifdef GL_ES\nprecision highp float;\n#define GLSLIFY 1\n#endif\nuniform sampler2D position;uniform sampler2D velocity;uniform float friction;uniform float spaceSize;varying vec2 index;void main(){vec4 pointPosition=texture2D(position,index);vec4 pointVelocity=texture2D(velocity,index);pointVelocity.rg*=friction;pointPosition.rg+=pointVelocity.rg;pointPosition.r=clamp(pointPosition.r,0.0,spaceSize);pointPosition.g=clamp(pointPosition.g,0.0,spaceSize);gl_FragColor=pointPosition;}"; // eslint-disable-line

  class Points extends CoreModule {
      create() {
          var _a, _b;
          const { reglInstance, config, store, data } = this;
          const { spaceSize } = config;
          const { pointsTextureSize } = store;
          const numParticles = data.nodes.length;
          const initialState = new Float32Array(pointsTextureSize * pointsTextureSize * 4);
          for (let i = 0; i < numParticles; ++i) {
              const sortedIndex = this.data.getSortedIndexByInputIndex(i);
              const node = data.nodes[i];
              if (node && sortedIndex !== undefined) {
                  initialState[sortedIndex * 4 + 0] = (_a = node.x) !== null && _a !== void 0 ? _a : (spaceSize !== null && spaceSize !== void 0 ? spaceSize : defaultConfigValues.spaceSize) * (store.getRandomFloat(0, 1) * (0.505 - 0.495) + 0.495);
                  initialState[sortedIndex * 4 + 1] = (_b = node.y) !== null && _b !== void 0 ? _b : (spaceSize !== null && spaceSize !== void 0 ? spaceSize : defaultConfigValues.spaceSize) * (store.getRandomFloat(0, 1) * (0.505 - 0.495) + 0.495);
              }
          }
          // Create position buffer
          this.currentPositionFbo = reglInstance.framebuffer({
              color: reglInstance.texture({
                  data: initialState,
                  shape: [pointsTextureSize, pointsTextureSize, 4],
                  type: 'float',
              }),
              depth: false,
              stencil: false,
          });
          this.previousPositionFbo = reglInstance.framebuffer({
              color: reglInstance.texture({
                  data: initialState,
                  shape: [pointsTextureSize, pointsTextureSize, 4],
                  type: 'float',
              }),
              depth: false,
              stencil: false,
          });
          // Create velocity buffer
          this.velocityFbo = reglInstance.framebuffer({
              color: reglInstance.texture({
                  data: new Float32Array(pointsTextureSize * pointsTextureSize * 4).fill(0),
                  shape: [pointsTextureSize, pointsTextureSize, 4],
                  type: 'float',
              }),
              depth: false,
              stencil: false,
          });
          // Create selected points buffer
          this.selectedFbo = reglInstance.framebuffer({
              color: reglInstance.texture({
                  data: initialState,
                  shape: [pointsTextureSize, pointsTextureSize, 4],
                  type: 'float',
              }),
              depth: false,
              stencil: false,
          });
          this.updateSize();
          this.updateColor();
          this.updateGreyoutStatus();
      }
      initPrograms() {
          const { reglInstance, config, store, data } = this;
          this.updatePositionCommand = reglInstance({
              frag: updatePositionFrag,
              vert: updateVert,
              framebuffer: () => this.currentPositionFbo,
              primitive: 'triangle strip',
              count: 4,
              attributes: { quad: createQuadBuffer(reglInstance) },
              uniforms: {
                  position: () => this.previousPositionFbo,
                  velocity: () => this.velocityFbo,
                  friction: () => { var _a; return (_a = config.simulation) === null || _a === void 0 ? void 0 : _a.friction; },
                  spaceSize: () => config.spaceSize,
              },
          });
          this.drawCommand = reglInstance({
              frag: drawPointsFrag,
              vert: drawPointsVert,
              primitive: 'points',
              count: () => data.nodes.length,
              attributes: { indexes: createIndexesBuffer(reglInstance, store.pointsTextureSize) },
              uniforms: {
                  positions: () => this.currentPositionFbo,
                  particleColor: () => this.colorFbo,
                  particleGreyoutStatus: () => this.greyoutStatusFbo,
                  particleSize: () => this.sizeFbo,
                  ratio: () => config.pixelRatio,
                  sizeScale: () => config.nodeSizeScale,
                  pointsTextureSize: () => store.pointsTextureSize,
                  transform: () => store.transform,
                  spaceSize: () => config.spaceSize,
                  screenSize: () => store.screenSize,
                  greyoutOpacity: () => config.nodeGreyoutOpacity,
                  scaleNodesOnZoom: () => config.scaleNodesOnZoom,
              },
              blend: {
                  enable: true,
                  func: {
                      dstRGB: 'one minus src alpha',
                      srcRGB: 'src alpha',
                      dstAlpha: 'one minus src alpha',
                      srcAlpha: 'one',
                  },
                  equation: {
                      rgb: 'add',
                      alpha: 'add',
                  },
              },
              depth: {
                  enable: false,
                  mask: false,
              },
          });
          this.findPointOnMouseClickCommand = reglInstance({
              frag: findPointOnMouseClickFrag,
              vert: updateVert,
              framebuffer: () => this.selectedFbo,
              primitive: 'triangle strip',
              count: 4,
              attributes: { quad: createQuadBuffer(reglInstance) },
              uniforms: {
                  position: () => this.currentPositionFbo,
                  particleSize: () => this.sizeFbo,
                  spaceSize: () => config.spaceSize,
                  screenSize: () => store.screenSize,
                  sizeScale: () => config.nodeSizeScale,
                  transform: () => store.transform,
                  ratio: () => config.pixelRatio,
                  mousePosition: () => store.screenMousePosition,
                  scaleNodesOnZoom: () => config.scaleNodesOnZoom,
                  maxPointSize: () => store.maxPointSize,
              },
          });
          this.findPointsOnAreaSelectionCommand = reglInstance({
              frag: findPointsOnAreaSelectionFrag,
              vert: updateVert,
              framebuffer: () => this.selectedFbo,
              primitive: 'triangle strip',
              count: 4,
              attributes: { quad: createQuadBuffer(reglInstance) },
              uniforms: {
                  position: () => this.currentPositionFbo,
                  particleSize: () => this.sizeFbo,
                  spaceSize: () => config.spaceSize,
                  screenSize: () => store.screenSize,
                  sizeScale: () => config.nodeSizeScale,
                  transform: () => store.transform,
                  ratio: () => config.pixelRatio,
                  'selection[0]': () => store.selectedArea[0],
                  'selection[1]': () => store.selectedArea[1],
                  scaleNodesOnZoom: () => config.scaleNodesOnZoom,
                  maxPointSize: () => store.maxPointSize,
              },
          });
      }
      updateColor() {
          const { reglInstance, config, store, data } = this;
          this.colorFbo = createColorBuffer(data, reglInstance, store.pointsTextureSize, config.nodeColor);
      }
      updateGreyoutStatus() {
          const { reglInstance, store } = this;
          this.greyoutStatusFbo = createGreyoutStatusBuffer(store.selectedIndices, reglInstance, store.pointsTextureSize);
      }
      updateSize() {
          const { reglInstance, config, store, data } = this;
          this.sizeFbo = createSizeBuffer(data, reglInstance, store.pointsTextureSize, config.nodeSize);
      }
      draw() {
          var _a;
          (_a = this.drawCommand) === null || _a === void 0 ? void 0 : _a.call(this);
      }
      updatePosition() {
          var _a;
          (_a = this.updatePositionCommand) === null || _a === void 0 ? void 0 : _a.call(this);
          this.swapFbo();
      }
      findPointsOnAreaSelection() {
          var _a;
          (_a = this.findPointsOnAreaSelectionCommand) === null || _a === void 0 ? void 0 : _a.call(this);
      }
      findPointsOnMouseClick() {
          var _a;
          (_a = this.findPointOnMouseClickCommand) === null || _a === void 0 ? void 0 : _a.call(this);
      }
      destroy() {
          var _a, _b, _c, _d, _e, _f, _g;
          (_a = this.currentPositionFbo) === null || _a === void 0 ? void 0 : _a.destroy();
          (_b = this.previousPositionFbo) === null || _b === void 0 ? void 0 : _b.destroy();
          (_c = this.velocityFbo) === null || _c === void 0 ? void 0 : _c.destroy();
          (_d = this.selectedFbo) === null || _d === void 0 ? void 0 : _d.destroy();
          (_e = this.colorFbo) === null || _e === void 0 ? void 0 : _e.destroy();
          (_f = this.sizeFbo) === null || _f === void 0 ? void 0 : _f.destroy();
          (_g = this.greyoutStatusFbo) === null || _g === void 0 ? void 0 : _g.destroy();
      }
      swapFbo() {
          const temp = this.previousPositionFbo;
          this.previousPositionFbo = this.currentPositionFbo;
          this.currentPositionFbo = temp;
      }
  }

  function ascending$1(a, b) {
    return a == null || b == null ? NaN : a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function descending(a, b) {
    return a == null || b == null ? NaN
      : b < a ? -1
      : b > a ? 1
      : b >= a ? 0
      : NaN;
  }

  function bisector(f) {
    let compare1, compare2, delta;

    // If an accessor is specified, promote it to a comparator. In this case we
    // can test whether the search value is (self-) comparable. We can’t do this
    // for a comparator (except for specific, known comparators) because we can’t
    // tell if the comparator is symmetric, and an asymmetric comparator can’t be
    // used to test whether a single value is comparable.
    if (f.length !== 2) {
      compare1 = ascending$1;
      compare2 = (d, x) => ascending$1(f(d), x);
      delta = (d, x) => f(d) - x;
    } else {
      compare1 = f === ascending$1 || f === descending ? f : zero;
      compare2 = f;
      delta = f;
    }

    function left(a, x, lo = 0, hi = a.length) {
      if (lo < hi) {
        if (compare1(x, x) !== 0) return hi;
        do {
          const mid = (lo + hi) >>> 1;
          if (compare2(a[mid], x) < 0) lo = mid + 1;
          else hi = mid;
        } while (lo < hi);
      }
      return lo;
    }

    function right(a, x, lo = 0, hi = a.length) {
      if (lo < hi) {
        if (compare1(x, x) !== 0) return hi;
        do {
          const mid = (lo + hi) >>> 1;
          if (compare2(a[mid], x) <= 0) lo = mid + 1;
          else hi = mid;
        } while (lo < hi);
      }
      return lo;
    }

    function center(a, x, lo = 0, hi = a.length) {
      const i = left(a, x, lo, hi - 1);
      return i > lo && delta(a[i - 1], x) > -delta(a[i], x) ? i - 1 : i;
    }

    return {left, center, right};
  }

  function zero() {
    return 0;
  }

  function number$1(x) {
    return x === null ? NaN : +x;
  }

  const ascendingBisect = bisector(ascending$1);
  const bisectRight = ascendingBisect.right;
  bisector(number$1).center;

  function extent(values, valueof) {
    let min;
    let max;
    if (valueof === undefined) {
      for (const value of values) {
        if (value != null) {
          if (min === undefined) {
            if (value >= value) min = max = value;
          } else {
            if (min > value) min = value;
            if (max < value) max = value;
          }
        }
      }
    } else {
      let index = -1;
      for (let value of values) {
        if ((value = valueof(value, ++index, values)) != null) {
          if (min === undefined) {
            if (value >= value) min = max = value;
          } else {
            if (min > value) min = value;
            if (max < value) max = value;
          }
        }
      }
    }
    return [min, max];
  }

  var e10 = Math.sqrt(50),
      e5 = Math.sqrt(10),
      e2 = Math.sqrt(2);

  function ticks(start, stop, count) {
    var reverse,
        i = -1,
        n,
        ticks,
        step;

    stop = +stop, start = +start, count = +count;
    if (start === stop && count > 0) return [start];
    if (reverse = stop < start) n = start, start = stop, stop = n;
    if ((step = tickIncrement(start, stop, count)) === 0 || !isFinite(step)) return [];

    if (step > 0) {
      let r0 = Math.round(start / step), r1 = Math.round(stop / step);
      if (r0 * step < start) ++r0;
      if (r1 * step > stop) --r1;
      ticks = new Array(n = r1 - r0 + 1);
      while (++i < n) ticks[i] = (r0 + i) * step;
    } else {
      step = -step;
      let r0 = Math.round(start * step), r1 = Math.round(stop * step);
      if (r0 / step < start) ++r0;
      if (r1 / step > stop) --r1;
      ticks = new Array(n = r1 - r0 + 1);
      while (++i < n) ticks[i] = (r0 + i) / step;
    }

    if (reverse) ticks.reverse();

    return ticks;
  }

  function tickIncrement(start, stop, count) {
    var step = (stop - start) / Math.max(0, count),
        power = Math.floor(Math.log(step) / Math.LN10),
        error = step / Math.pow(10, power);
    return power >= 0
        ? (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1) * Math.pow(10, power)
        : -Math.pow(10, -power) / (error >= e10 ? 10 : error >= e5 ? 5 : error >= e2 ? 2 : 1);
  }

  function tickStep(start, stop, count) {
    var step0 = Math.abs(stop - start) / Math.max(0, count),
        step1 = Math.pow(10, Math.floor(Math.log(step0) / Math.LN10)),
        error = step0 / step1;
    if (error >= e10) step1 *= 10;
    else if (error >= e5) step1 *= 5;
    else if (error >= e2) step1 *= 2;
    return stop < start ? -step1 : step1;
  }

  function initRange(domain, range) {
    switch (arguments.length) {
      case 0: break;
      case 1: this.range(domain); break;
      default: this.range(range).domain(domain); break;
    }
    return this;
  }

  function constants(x) {
    return function() {
      return x;
    };
  }

  function number(x) {
    return +x;
  }

  var unit = [0, 1];

  function identity$2(x) {
    return x;
  }

  function normalize$3(a, b) {
    return (b -= (a = +a))
        ? function(x) { return (x - a) / b; }
        : constants(isNaN(b) ? NaN : 0.5);
  }

  function clamper(a, b) {
    var t;
    if (a > b) t = a, a = b, b = t;
    return function(x) { return Math.max(a, Math.min(b, x)); };
  }

  // normalize(a, b)(x) takes a domain value x in [a,b] and returns the corresponding parameter t in [0,1].
  // interpolate(a, b)(t) takes a parameter t in [0,1] and returns the corresponding range value x in [a,b].
  function bimap(domain, range, interpolate) {
    var d0 = domain[0], d1 = domain[1], r0 = range[0], r1 = range[1];
    if (d1 < d0) d0 = normalize$3(d1, d0), r0 = interpolate(r1, r0);
    else d0 = normalize$3(d0, d1), r0 = interpolate(r0, r1);
    return function(x) { return r0(d0(x)); };
  }

  function polymap(domain, range, interpolate) {
    var j = Math.min(domain.length, range.length) - 1,
        d = new Array(j),
        r = new Array(j),
        i = -1;

    // Reverse descending domains.
    if (domain[j] < domain[0]) {
      domain = domain.slice().reverse();
      range = range.slice().reverse();
    }

    while (++i < j) {
      d[i] = normalize$3(domain[i], domain[i + 1]);
      r[i] = interpolate(range[i], range[i + 1]);
    }

    return function(x) {
      var i = bisectRight(domain, x, 1, j) - 1;
      return r[i](d[i](x));
    };
  }

  function copy(source, target) {
    return target
        .domain(source.domain())
        .range(source.range())
        .interpolate(source.interpolate())
        .clamp(source.clamp())
        .unknown(source.unknown());
  }

  function transformer() {
    var domain = unit,
        range = unit,
        interpolate = interpolate$1,
        transform,
        untransform,
        unknown,
        clamp = identity$2,
        piecewise,
        output,
        input;

    function rescale() {
      var n = Math.min(domain.length, range.length);
      if (clamp !== identity$2) clamp = clamper(domain[0], domain[n - 1]);
      piecewise = n > 2 ? polymap : bimap;
      output = input = null;
      return scale;
    }

    function scale(x) {
      return x == null || isNaN(x = +x) ? unknown : (output || (output = piecewise(domain.map(transform), range, interpolate)))(transform(clamp(x)));
    }

    scale.invert = function(y) {
      return clamp(untransform((input || (input = piecewise(range, domain.map(transform), interpolateNumber)))(y)));
    };

    scale.domain = function(_) {
      return arguments.length ? (domain = Array.from(_, number), rescale()) : domain.slice();
    };

    scale.range = function(_) {
      return arguments.length ? (range = Array.from(_), rescale()) : range.slice();
    };

    scale.rangeRound = function(_) {
      return range = Array.from(_), interpolate = interpolateRound, rescale();
    };

    scale.clamp = function(_) {
      return arguments.length ? (clamp = _ ? true : identity$2, rescale()) : clamp !== identity$2;
    };

    scale.interpolate = function(_) {
      return arguments.length ? (interpolate = _, rescale()) : interpolate;
    };

    scale.unknown = function(_) {
      return arguments.length ? (unknown = _, scale) : unknown;
    };

    return function(t, u) {
      transform = t, untransform = u;
      return rescale();
    };
  }

  function continuous() {
    return transformer()(identity$2, identity$2);
  }

  function formatDecimal(x) {
    return Math.abs(x = Math.round(x)) >= 1e21
        ? x.toLocaleString("en").replace(/,/g, "")
        : x.toString(10);
  }

  // Computes the decimal coefficient and exponent of the specified number x with
  // significant digits p, where x is positive and p is in [1, 21] or undefined.
  // For example, formatDecimalParts(1.23) returns ["123", 0].
  function formatDecimalParts(x, p) {
    if ((i = (x = p ? x.toExponential(p - 1) : x.toExponential()).indexOf("e")) < 0) return null; // NaN, ±Infinity
    var i, coefficient = x.slice(0, i);

    // The string returned by toExponential either has the form \d\.\d+e[-+]\d+
    // (e.g., 1.2e+3) or the form \de[-+]\d+ (e.g., 1e+3).
    return [
      coefficient.length > 1 ? coefficient[0] + coefficient.slice(2) : coefficient,
      +x.slice(i + 1)
    ];
  }

  function exponent(x) {
    return x = formatDecimalParts(Math.abs(x)), x ? x[1] : NaN;
  }

  function formatGroup(grouping, thousands) {
    return function(value, width) {
      var i = value.length,
          t = [],
          j = 0,
          g = grouping[0],
          length = 0;

      while (i > 0 && g > 0) {
        if (length + g + 1 > width) g = Math.max(1, width - length);
        t.push(value.substring(i -= g, i + g));
        if ((length += g + 1) > width) break;
        g = grouping[j = (j + 1) % grouping.length];
      }

      return t.reverse().join(thousands);
    };
  }

  function formatNumerals(numerals) {
    return function(value) {
      return value.replace(/[0-9]/g, function(i) {
        return numerals[+i];
      });
    };
  }

  // [[fill]align][sign][symbol][0][width][,][.precision][~][type]
  var re = /^(?:(.)?([<>=^]))?([+\-( ])?([$#])?(0)?(\d+)?(,)?(\.\d+)?(~)?([a-z%])?$/i;

  function formatSpecifier(specifier) {
    if (!(match = re.exec(specifier))) throw new Error("invalid format: " + specifier);
    var match;
    return new FormatSpecifier({
      fill: match[1],
      align: match[2],
      sign: match[3],
      symbol: match[4],
      zero: match[5],
      width: match[6],
      comma: match[7],
      precision: match[8] && match[8].slice(1),
      trim: match[9],
      type: match[10]
    });
  }

  formatSpecifier.prototype = FormatSpecifier.prototype; // instanceof

  function FormatSpecifier(specifier) {
    this.fill = specifier.fill === undefined ? " " : specifier.fill + "";
    this.align = specifier.align === undefined ? ">" : specifier.align + "";
    this.sign = specifier.sign === undefined ? "-" : specifier.sign + "";
    this.symbol = specifier.symbol === undefined ? "" : specifier.symbol + "";
    this.zero = !!specifier.zero;
    this.width = specifier.width === undefined ? undefined : +specifier.width;
    this.comma = !!specifier.comma;
    this.precision = specifier.precision === undefined ? undefined : +specifier.precision;
    this.trim = !!specifier.trim;
    this.type = specifier.type === undefined ? "" : specifier.type + "";
  }

  FormatSpecifier.prototype.toString = function() {
    return this.fill
        + this.align
        + this.sign
        + this.symbol
        + (this.zero ? "0" : "")
        + (this.width === undefined ? "" : Math.max(1, this.width | 0))
        + (this.comma ? "," : "")
        + (this.precision === undefined ? "" : "." + Math.max(0, this.precision | 0))
        + (this.trim ? "~" : "")
        + this.type;
  };

  // Trims insignificant zeros, e.g., replaces 1.2000k with 1.2k.
  function formatTrim(s) {
    out: for (var n = s.length, i = 1, i0 = -1, i1; i < n; ++i) {
      switch (s[i]) {
        case ".": i0 = i1 = i; break;
        case "0": if (i0 === 0) i0 = i; i1 = i; break;
        default: if (!+s[i]) break out; if (i0 > 0) i0 = 0; break;
      }
    }
    return i0 > 0 ? s.slice(0, i0) + s.slice(i1 + 1) : s;
  }

  var prefixExponent;

  function formatPrefixAuto(x, p) {
    var d = formatDecimalParts(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1],
        i = exponent - (prefixExponent = Math.max(-8, Math.min(8, Math.floor(exponent / 3))) * 3) + 1,
        n = coefficient.length;
    return i === n ? coefficient
        : i > n ? coefficient + new Array(i - n + 1).join("0")
        : i > 0 ? coefficient.slice(0, i) + "." + coefficient.slice(i)
        : "0." + new Array(1 - i).join("0") + formatDecimalParts(x, Math.max(0, p + i - 1))[0]; // less than 1y!
  }

  function formatRounded(x, p) {
    var d = formatDecimalParts(x, p);
    if (!d) return x + "";
    var coefficient = d[0],
        exponent = d[1];
    return exponent < 0 ? "0." + new Array(-exponent).join("0") + coefficient
        : coefficient.length > exponent + 1 ? coefficient.slice(0, exponent + 1) + "." + coefficient.slice(exponent + 1)
        : coefficient + new Array(exponent - coefficient.length + 2).join("0");
  }

  var formatTypes = {
    "%": (x, p) => (x * 100).toFixed(p),
    "b": (x) => Math.round(x).toString(2),
    "c": (x) => x + "",
    "d": formatDecimal,
    "e": (x, p) => x.toExponential(p),
    "f": (x, p) => x.toFixed(p),
    "g": (x, p) => x.toPrecision(p),
    "o": (x) => Math.round(x).toString(8),
    "p": (x, p) => formatRounded(x * 100, p),
    "r": formatRounded,
    "s": formatPrefixAuto,
    "X": (x) => Math.round(x).toString(16).toUpperCase(),
    "x": (x) => Math.round(x).toString(16)
  };

  function identity$1(x) {
    return x;
  }

  var map = Array.prototype.map,
      prefixes = ["y","z","a","f","p","n","µ","m","","k","M","G","T","P","E","Z","Y"];

  function formatLocale$1(locale) {
    var group = locale.grouping === undefined || locale.thousands === undefined ? identity$1 : formatGroup(map.call(locale.grouping, Number), locale.thousands + ""),
        currencyPrefix = locale.currency === undefined ? "" : locale.currency[0] + "",
        currencySuffix = locale.currency === undefined ? "" : locale.currency[1] + "",
        decimal = locale.decimal === undefined ? "." : locale.decimal + "",
        numerals = locale.numerals === undefined ? identity$1 : formatNumerals(map.call(locale.numerals, String)),
        percent = locale.percent === undefined ? "%" : locale.percent + "",
        minus = locale.minus === undefined ? "−" : locale.minus + "",
        nan = locale.nan === undefined ? "NaN" : locale.nan + "";

    function newFormat(specifier) {
      specifier = formatSpecifier(specifier);

      var fill = specifier.fill,
          align = specifier.align,
          sign = specifier.sign,
          symbol = specifier.symbol,
          zero = specifier.zero,
          width = specifier.width,
          comma = specifier.comma,
          precision = specifier.precision,
          trim = specifier.trim,
          type = specifier.type;

      // The "n" type is an alias for ",g".
      if (type === "n") comma = true, type = "g";

      // The "" type, and any invalid type, is an alias for ".12~g".
      else if (!formatTypes[type]) precision === undefined && (precision = 12), trim = true, type = "g";

      // If zero fill is specified, padding goes after sign and before digits.
      if (zero || (fill === "0" && align === "=")) zero = true, fill = "0", align = "=";

      // Compute the prefix and suffix.
      // For SI-prefix, the suffix is lazily computed.
      var prefix = symbol === "$" ? currencyPrefix : symbol === "#" && /[boxX]/.test(type) ? "0" + type.toLowerCase() : "",
          suffix = symbol === "$" ? currencySuffix : /[%p]/.test(type) ? percent : "";

      // What format function should we use?
      // Is this an integer type?
      // Can this type generate exponential notation?
      var formatType = formatTypes[type],
          maybeSuffix = /[defgprs%]/.test(type);

      // Set the default precision if not specified,
      // or clamp the specified precision to the supported range.
      // For significant precision, it must be in [1, 21].
      // For fixed precision, it must be in [0, 20].
      precision = precision === undefined ? 6
          : /[gprs]/.test(type) ? Math.max(1, Math.min(21, precision))
          : Math.max(0, Math.min(20, precision));

      function format(value) {
        var valuePrefix = prefix,
            valueSuffix = suffix,
            i, n, c;

        if (type === "c") {
          valueSuffix = formatType(value) + valueSuffix;
          value = "";
        } else {
          value = +value;

          // Determine the sign. -0 is not less than 0, but 1 / -0 is!
          var valueNegative = value < 0 || 1 / value < 0;

          // Perform the initial formatting.
          value = isNaN(value) ? nan : formatType(Math.abs(value), precision);

          // Trim insignificant zeros.
          if (trim) value = formatTrim(value);

          // If a negative value rounds to zero after formatting, and no explicit positive sign is requested, hide the sign.
          if (valueNegative && +value === 0 && sign !== "+") valueNegative = false;

          // Compute the prefix and suffix.
          valuePrefix = (valueNegative ? (sign === "(" ? sign : minus) : sign === "-" || sign === "(" ? "" : sign) + valuePrefix;
          valueSuffix = (type === "s" ? prefixes[8 + prefixExponent / 3] : "") + valueSuffix + (valueNegative && sign === "(" ? ")" : "");

          // Break the formatted value into the integer “value” part that can be
          // grouped, and fractional or exponential “suffix” part that is not.
          if (maybeSuffix) {
            i = -1, n = value.length;
            while (++i < n) {
              if (c = value.charCodeAt(i), 48 > c || c > 57) {
                valueSuffix = (c === 46 ? decimal + value.slice(i + 1) : value.slice(i)) + valueSuffix;
                value = value.slice(0, i);
                break;
              }
            }
          }
        }

        // If the fill character is not "0", grouping is applied before padding.
        if (comma && !zero) value = group(value, Infinity);

        // Compute the padding.
        var length = valuePrefix.length + value.length + valueSuffix.length,
            padding = length < width ? new Array(width - length + 1).join(fill) : "";

        // If the fill character is "0", grouping is applied after padding.
        if (comma && zero) value = group(padding + value, padding.length ? width - valueSuffix.length : Infinity), padding = "";

        // Reconstruct the final output based on the desired alignment.
        switch (align) {
          case "<": value = valuePrefix + value + valueSuffix + padding; break;
          case "=": value = valuePrefix + padding + value + valueSuffix; break;
          case "^": value = padding.slice(0, length = padding.length >> 1) + valuePrefix + value + valueSuffix + padding.slice(length); break;
          default: value = padding + valuePrefix + value + valueSuffix; break;
        }

        return numerals(value);
      }

      format.toString = function() {
        return specifier + "";
      };

      return format;
    }

    function formatPrefix(specifier, value) {
      var f = newFormat((specifier = formatSpecifier(specifier), specifier.type = "f", specifier)),
          e = Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3,
          k = Math.pow(10, -e),
          prefix = prefixes[8 + e / 3];
      return function(value) {
        return f(k * value) + prefix;
      };
    }

    return {
      format: newFormat,
      formatPrefix: formatPrefix
    };
  }

  var locale$1;
  var format;
  var formatPrefix;

  defaultLocale$1({
    thousands: ",",
    grouping: [3],
    currency: ["$", ""]
  });

  function defaultLocale$1(definition) {
    locale$1 = formatLocale$1(definition);
    format = locale$1.format;
    formatPrefix = locale$1.formatPrefix;
    return locale$1;
  }

  function precisionFixed(step) {
    return Math.max(0, -exponent(Math.abs(step)));
  }

  function precisionPrefix(step, value) {
    return Math.max(0, Math.max(-8, Math.min(8, Math.floor(exponent(value) / 3))) * 3 - exponent(Math.abs(step)));
  }

  function precisionRound(step, max) {
    step = Math.abs(step), max = Math.abs(max) - step;
    return Math.max(0, exponent(max) - exponent(step)) + 1;
  }

  function tickFormat(start, stop, count, specifier) {
    var step = tickStep(start, stop, count),
        precision;
    specifier = formatSpecifier(specifier == null ? ",f" : specifier);
    switch (specifier.type) {
      case "s": {
        var value = Math.max(Math.abs(start), Math.abs(stop));
        if (specifier.precision == null && !isNaN(precision = precisionPrefix(step, value))) specifier.precision = precision;
        return formatPrefix(specifier, value);
      }
      case "":
      case "e":
      case "g":
      case "p":
      case "r": {
        if (specifier.precision == null && !isNaN(precision = precisionRound(step, Math.max(Math.abs(start), Math.abs(stop))))) specifier.precision = precision - (specifier.type === "e");
        break;
      }
      case "f":
      case "%": {
        if (specifier.precision == null && !isNaN(precision = precisionFixed(step))) specifier.precision = precision - (specifier.type === "%") * 2;
        break;
      }
    }
    return format(specifier);
  }

  function linearish(scale) {
    var domain = scale.domain;

    scale.ticks = function(count) {
      var d = domain();
      return ticks(d[0], d[d.length - 1], count == null ? 10 : count);
    };

    scale.tickFormat = function(count, specifier) {
      var d = domain();
      return tickFormat(d[0], d[d.length - 1], count == null ? 10 : count, specifier);
    };

    scale.nice = function(count) {
      if (count == null) count = 10;

      var d = domain();
      var i0 = 0;
      var i1 = d.length - 1;
      var start = d[i0];
      var stop = d[i1];
      var prestep;
      var step;
      var maxIter = 10;

      if (stop < start) {
        step = start, start = stop, stop = step;
        step = i0, i0 = i1, i1 = step;
      }
      
      while (maxIter-- > 0) {
        step = tickIncrement(start, stop, count);
        if (step === prestep) {
          d[i0] = start;
          d[i1] = stop;
          return domain(d);
        } else if (step > 0) {
          start = Math.floor(start / step) * step;
          stop = Math.ceil(stop / step) * step;
        } else if (step < 0) {
          start = Math.ceil(start * step) / step;
          stop = Math.floor(stop * step) / step;
        } else {
          break;
        }
        prestep = step;
      }

      return scale;
    };

    return scale;
  }

  function linear() {
    var scale = continuous();

    scale.copy = function() {
      return copy(scale, linear());
    };

    initRange.apply(scale, arguments);

    return linearish(scale);
  }

  var t0 = new Date,
      t1 = new Date;

  function newInterval(floori, offseti, count, field) {

    function interval(date) {
      return floori(date = arguments.length === 0 ? new Date : new Date(+date)), date;
    }

    interval.floor = function(date) {
      return floori(date = new Date(+date)), date;
    };

    interval.ceil = function(date) {
      return floori(date = new Date(date - 1)), offseti(date, 1), floori(date), date;
    };

    interval.round = function(date) {
      var d0 = interval(date),
          d1 = interval.ceil(date);
      return date - d0 < d1 - date ? d0 : d1;
    };

    interval.offset = function(date, step) {
      return offseti(date = new Date(+date), step == null ? 1 : Math.floor(step)), date;
    };

    interval.range = function(start, stop, step) {
      var range = [], previous;
      start = interval.ceil(start);
      step = step == null ? 1 : Math.floor(step);
      if (!(start < stop) || !(step > 0)) return range; // also handles Invalid Date
      do range.push(previous = new Date(+start)), offseti(start, step), floori(start);
      while (previous < start && start < stop);
      return range;
    };

    interval.filter = function(test) {
      return newInterval(function(date) {
        if (date >= date) while (floori(date), !test(date)) date.setTime(date - 1);
      }, function(date, step) {
        if (date >= date) {
          if (step < 0) while (++step <= 0) {
            while (offseti(date, -1), !test(date)) {} // eslint-disable-line no-empty
          } else while (--step >= 0) {
            while (offseti(date, +1), !test(date)) {} // eslint-disable-line no-empty
          }
        }
      });
    };

    if (count) {
      interval.count = function(start, end) {
        t0.setTime(+start), t1.setTime(+end);
        floori(t0), floori(t1);
        return Math.floor(count(t0, t1));
      };

      interval.every = function(step) {
        step = Math.floor(step);
        return !isFinite(step) || !(step > 0) ? null
            : !(step > 1) ? interval
            : interval.filter(field
                ? function(d) { return field(d) % step === 0; }
                : function(d) { return interval.count(0, d) % step === 0; });
      };
    }

    return interval;
  }

  var millisecond = newInterval(function() {
    // noop
  }, function(date, step) {
    date.setTime(+date + step);
  }, function(start, end) {
    return end - start;
  });

  // An optimized implementation for this simple case.
  millisecond.every = function(k) {
    k = Math.floor(k);
    if (!isFinite(k) || !(k > 0)) return null;
    if (!(k > 1)) return millisecond;
    return newInterval(function(date) {
      date.setTime(Math.floor(date / k) * k);
    }, function(date, step) {
      date.setTime(+date + step * k);
    }, function(start, end) {
      return (end - start) / k;
    });
  };
  millisecond.range;

  const durationSecond = 1000;
  const durationMinute = durationSecond * 60;
  const durationHour = durationMinute * 60;
  const durationDay = durationHour * 24;
  const durationWeek = durationDay * 7;

  var second = newInterval(function(date) {
    date.setTime(date - date.getMilliseconds());
  }, function(date, step) {
    date.setTime(+date + step * durationSecond);
  }, function(start, end) {
    return (end - start) / durationSecond;
  }, function(date) {
    return date.getUTCSeconds();
  });
  second.range;

  var minute = newInterval(function(date) {
    date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond);
  }, function(date, step) {
    date.setTime(+date + step * durationMinute);
  }, function(start, end) {
    return (end - start) / durationMinute;
  }, function(date) {
    return date.getMinutes();
  });
  minute.range;

  var hour = newInterval(function(date) {
    date.setTime(date - date.getMilliseconds() - date.getSeconds() * durationSecond - date.getMinutes() * durationMinute);
  }, function(date, step) {
    date.setTime(+date + step * durationHour);
  }, function(start, end) {
    return (end - start) / durationHour;
  }, function(date) {
    return date.getHours();
  });
  hour.range;

  var day = newInterval(
    date => date.setHours(0, 0, 0, 0),
    (date, step) => date.setDate(date.getDate() + step),
    (start, end) => (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationDay,
    date => date.getDate() - 1
  );
  day.range;

  function weekday(i) {
    return newInterval(function(date) {
      date.setDate(date.getDate() - (date.getDay() + 7 - i) % 7);
      date.setHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setDate(date.getDate() + step * 7);
    }, function(start, end) {
      return (end - start - (end.getTimezoneOffset() - start.getTimezoneOffset()) * durationMinute) / durationWeek;
    });
  }

  var sunday = weekday(0);
  var monday = weekday(1);
  var tuesday = weekday(2);
  var wednesday = weekday(3);
  var thursday = weekday(4);
  var friday = weekday(5);
  var saturday = weekday(6);

  sunday.range;
  monday.range;
  tuesday.range;
  wednesday.range;
  thursday.range;
  friday.range;
  saturday.range;

  var month = newInterval(function(date) {
    date.setDate(1);
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setMonth(date.getMonth() + step);
  }, function(start, end) {
    return end.getMonth() - start.getMonth() + (end.getFullYear() - start.getFullYear()) * 12;
  }, function(date) {
    return date.getMonth();
  });
  month.range;

  var year = newInterval(function(date) {
    date.setMonth(0, 1);
    date.setHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setFullYear(date.getFullYear() + step);
  }, function(start, end) {
    return end.getFullYear() - start.getFullYear();
  }, function(date) {
    return date.getFullYear();
  });

  // An optimized implementation for this simple case.
  year.every = function(k) {
    return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
      date.setFullYear(Math.floor(date.getFullYear() / k) * k);
      date.setMonth(0, 1);
      date.setHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setFullYear(date.getFullYear() + step * k);
    });
  };
  year.range;

  var utcMinute = newInterval(function(date) {
    date.setUTCSeconds(0, 0);
  }, function(date, step) {
    date.setTime(+date + step * durationMinute);
  }, function(start, end) {
    return (end - start) / durationMinute;
  }, function(date) {
    return date.getUTCMinutes();
  });
  utcMinute.range;

  var utcHour = newInterval(function(date) {
    date.setUTCMinutes(0, 0, 0);
  }, function(date, step) {
    date.setTime(+date + step * durationHour);
  }, function(start, end) {
    return (end - start) / durationHour;
  }, function(date) {
    return date.getUTCHours();
  });
  utcHour.range;

  var utcDay = newInterval(function(date) {
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCDate(date.getUTCDate() + step);
  }, function(start, end) {
    return (end - start) / durationDay;
  }, function(date) {
    return date.getUTCDate() - 1;
  });
  utcDay.range;

  function utcWeekday(i) {
    return newInterval(function(date) {
      date.setUTCDate(date.getUTCDate() - (date.getUTCDay() + 7 - i) % 7);
      date.setUTCHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setUTCDate(date.getUTCDate() + step * 7);
    }, function(start, end) {
      return (end - start) / durationWeek;
    });
  }

  var utcSunday = utcWeekday(0);
  var utcMonday = utcWeekday(1);
  var utcTuesday = utcWeekday(2);
  var utcWednesday = utcWeekday(3);
  var utcThursday = utcWeekday(4);
  var utcFriday = utcWeekday(5);
  var utcSaturday = utcWeekday(6);

  utcSunday.range;
  utcMonday.range;
  utcTuesday.range;
  utcWednesday.range;
  utcThursday.range;
  utcFriday.range;
  utcSaturday.range;

  var utcMonth = newInterval(function(date) {
    date.setUTCDate(1);
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCMonth(date.getUTCMonth() + step);
  }, function(start, end) {
    return end.getUTCMonth() - start.getUTCMonth() + (end.getUTCFullYear() - start.getUTCFullYear()) * 12;
  }, function(date) {
    return date.getUTCMonth();
  });
  utcMonth.range;

  var utcYear = newInterval(function(date) {
    date.setUTCMonth(0, 1);
    date.setUTCHours(0, 0, 0, 0);
  }, function(date, step) {
    date.setUTCFullYear(date.getUTCFullYear() + step);
  }, function(start, end) {
    return end.getUTCFullYear() - start.getUTCFullYear();
  }, function(date) {
    return date.getUTCFullYear();
  });

  // An optimized implementation for this simple case.
  utcYear.every = function(k) {
    return !isFinite(k = Math.floor(k)) || !(k > 0) ? null : newInterval(function(date) {
      date.setUTCFullYear(Math.floor(date.getUTCFullYear() / k) * k);
      date.setUTCMonth(0, 1);
      date.setUTCHours(0, 0, 0, 0);
    }, function(date, step) {
      date.setUTCFullYear(date.getUTCFullYear() + step * k);
    });
  };
  utcYear.range;

  function localDate(d) {
    if (0 <= d.y && d.y < 100) {
      var date = new Date(-1, d.m, d.d, d.H, d.M, d.S, d.L);
      date.setFullYear(d.y);
      return date;
    }
    return new Date(d.y, d.m, d.d, d.H, d.M, d.S, d.L);
  }

  function utcDate(d) {
    if (0 <= d.y && d.y < 100) {
      var date = new Date(Date.UTC(-1, d.m, d.d, d.H, d.M, d.S, d.L));
      date.setUTCFullYear(d.y);
      return date;
    }
    return new Date(Date.UTC(d.y, d.m, d.d, d.H, d.M, d.S, d.L));
  }

  function newDate(y, m, d) {
    return {y: y, m: m, d: d, H: 0, M: 0, S: 0, L: 0};
  }

  function formatLocale(locale) {
    var locale_dateTime = locale.dateTime,
        locale_date = locale.date,
        locale_time = locale.time,
        locale_periods = locale.periods,
        locale_weekdays = locale.days,
        locale_shortWeekdays = locale.shortDays,
        locale_months = locale.months,
        locale_shortMonths = locale.shortMonths;

    var periodRe = formatRe(locale_periods),
        periodLookup = formatLookup(locale_periods),
        weekdayRe = formatRe(locale_weekdays),
        weekdayLookup = formatLookup(locale_weekdays),
        shortWeekdayRe = formatRe(locale_shortWeekdays),
        shortWeekdayLookup = formatLookup(locale_shortWeekdays),
        monthRe = formatRe(locale_months),
        monthLookup = formatLookup(locale_months),
        shortMonthRe = formatRe(locale_shortMonths),
        shortMonthLookup = formatLookup(locale_shortMonths);

    var formats = {
      "a": formatShortWeekday,
      "A": formatWeekday,
      "b": formatShortMonth,
      "B": formatMonth,
      "c": null,
      "d": formatDayOfMonth,
      "e": formatDayOfMonth,
      "f": formatMicroseconds,
      "g": formatYearISO,
      "G": formatFullYearISO,
      "H": formatHour24,
      "I": formatHour12,
      "j": formatDayOfYear,
      "L": formatMilliseconds,
      "m": formatMonthNumber,
      "M": formatMinutes,
      "p": formatPeriod,
      "q": formatQuarter,
      "Q": formatUnixTimestamp,
      "s": formatUnixTimestampSeconds,
      "S": formatSeconds,
      "u": formatWeekdayNumberMonday,
      "U": formatWeekNumberSunday,
      "V": formatWeekNumberISO,
      "w": formatWeekdayNumberSunday,
      "W": formatWeekNumberMonday,
      "x": null,
      "X": null,
      "y": formatYear,
      "Y": formatFullYear,
      "Z": formatZone,
      "%": formatLiteralPercent
    };

    var utcFormats = {
      "a": formatUTCShortWeekday,
      "A": formatUTCWeekday,
      "b": formatUTCShortMonth,
      "B": formatUTCMonth,
      "c": null,
      "d": formatUTCDayOfMonth,
      "e": formatUTCDayOfMonth,
      "f": formatUTCMicroseconds,
      "g": formatUTCYearISO,
      "G": formatUTCFullYearISO,
      "H": formatUTCHour24,
      "I": formatUTCHour12,
      "j": formatUTCDayOfYear,
      "L": formatUTCMilliseconds,
      "m": formatUTCMonthNumber,
      "M": formatUTCMinutes,
      "p": formatUTCPeriod,
      "q": formatUTCQuarter,
      "Q": formatUnixTimestamp,
      "s": formatUnixTimestampSeconds,
      "S": formatUTCSeconds,
      "u": formatUTCWeekdayNumberMonday,
      "U": formatUTCWeekNumberSunday,
      "V": formatUTCWeekNumberISO,
      "w": formatUTCWeekdayNumberSunday,
      "W": formatUTCWeekNumberMonday,
      "x": null,
      "X": null,
      "y": formatUTCYear,
      "Y": formatUTCFullYear,
      "Z": formatUTCZone,
      "%": formatLiteralPercent
    };

    var parses = {
      "a": parseShortWeekday,
      "A": parseWeekday,
      "b": parseShortMonth,
      "B": parseMonth,
      "c": parseLocaleDateTime,
      "d": parseDayOfMonth,
      "e": parseDayOfMonth,
      "f": parseMicroseconds,
      "g": parseYear,
      "G": parseFullYear,
      "H": parseHour24,
      "I": parseHour24,
      "j": parseDayOfYear,
      "L": parseMilliseconds,
      "m": parseMonthNumber,
      "M": parseMinutes,
      "p": parsePeriod,
      "q": parseQuarter,
      "Q": parseUnixTimestamp,
      "s": parseUnixTimestampSeconds,
      "S": parseSeconds,
      "u": parseWeekdayNumberMonday,
      "U": parseWeekNumberSunday,
      "V": parseWeekNumberISO,
      "w": parseWeekdayNumberSunday,
      "W": parseWeekNumberMonday,
      "x": parseLocaleDate,
      "X": parseLocaleTime,
      "y": parseYear,
      "Y": parseFullYear,
      "Z": parseZone,
      "%": parseLiteralPercent
    };

    // These recursive directive definitions must be deferred.
    formats.x = newFormat(locale_date, formats);
    formats.X = newFormat(locale_time, formats);
    formats.c = newFormat(locale_dateTime, formats);
    utcFormats.x = newFormat(locale_date, utcFormats);
    utcFormats.X = newFormat(locale_time, utcFormats);
    utcFormats.c = newFormat(locale_dateTime, utcFormats);

    function newFormat(specifier, formats) {
      return function(date) {
        var string = [],
            i = -1,
            j = 0,
            n = specifier.length,
            c,
            pad,
            format;

        if (!(date instanceof Date)) date = new Date(+date);

        while (++i < n) {
          if (specifier.charCodeAt(i) === 37) {
            string.push(specifier.slice(j, i));
            if ((pad = pads[c = specifier.charAt(++i)]) != null) c = specifier.charAt(++i);
            else pad = c === "e" ? " " : "0";
            if (format = formats[c]) c = format(date, pad);
            string.push(c);
            j = i + 1;
          }
        }

        string.push(specifier.slice(j, i));
        return string.join("");
      };
    }

    function newParse(specifier, Z) {
      return function(string) {
        var d = newDate(1900, undefined, 1),
            i = parseSpecifier(d, specifier, string += "", 0),
            week, day$1;
        if (i != string.length) return null;

        // If a UNIX timestamp is specified, return it.
        if ("Q" in d) return new Date(d.Q);
        if ("s" in d) return new Date(d.s * 1000 + ("L" in d ? d.L : 0));

        // If this is utcParse, never use the local timezone.
        if (Z && !("Z" in d)) d.Z = 0;

        // The am-pm flag is 0 for AM, and 1 for PM.
        if ("p" in d) d.H = d.H % 12 + d.p * 12;

        // If the month was not specified, inherit from the quarter.
        if (d.m === undefined) d.m = "q" in d ? d.q : 0;

        // Convert day-of-week and week-of-year to day-of-year.
        if ("V" in d) {
          if (d.V < 1 || d.V > 53) return null;
          if (!("w" in d)) d.w = 1;
          if ("Z" in d) {
            week = utcDate(newDate(d.y, 0, 1)), day$1 = week.getUTCDay();
            week = day$1 > 4 || day$1 === 0 ? utcMonday.ceil(week) : utcMonday(week);
            week = utcDay.offset(week, (d.V - 1) * 7);
            d.y = week.getUTCFullYear();
            d.m = week.getUTCMonth();
            d.d = week.getUTCDate() + (d.w + 6) % 7;
          } else {
            week = localDate(newDate(d.y, 0, 1)), day$1 = week.getDay();
            week = day$1 > 4 || day$1 === 0 ? monday.ceil(week) : monday(week);
            week = day.offset(week, (d.V - 1) * 7);
            d.y = week.getFullYear();
            d.m = week.getMonth();
            d.d = week.getDate() + (d.w + 6) % 7;
          }
        } else if ("W" in d || "U" in d) {
          if (!("w" in d)) d.w = "u" in d ? d.u % 7 : "W" in d ? 1 : 0;
          day$1 = "Z" in d ? utcDate(newDate(d.y, 0, 1)).getUTCDay() : localDate(newDate(d.y, 0, 1)).getDay();
          d.m = 0;
          d.d = "W" in d ? (d.w + 6) % 7 + d.W * 7 - (day$1 + 5) % 7 : d.w + d.U * 7 - (day$1 + 6) % 7;
        }

        // If a time zone is specified, all fields are interpreted as UTC and then
        // offset according to the specified time zone.
        if ("Z" in d) {
          d.H += d.Z / 100 | 0;
          d.M += d.Z % 100;
          return utcDate(d);
        }

        // Otherwise, all fields are in local time.
        return localDate(d);
      };
    }

    function parseSpecifier(d, specifier, string, j) {
      var i = 0,
          n = specifier.length,
          m = string.length,
          c,
          parse;

      while (i < n) {
        if (j >= m) return -1;
        c = specifier.charCodeAt(i++);
        if (c === 37) {
          c = specifier.charAt(i++);
          parse = parses[c in pads ? specifier.charAt(i++) : c];
          if (!parse || ((j = parse(d, string, j)) < 0)) return -1;
        } else if (c != string.charCodeAt(j++)) {
          return -1;
        }
      }

      return j;
    }

    function parsePeriod(d, string, i) {
      var n = periodRe.exec(string.slice(i));
      return n ? (d.p = periodLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }

    function parseShortWeekday(d, string, i) {
      var n = shortWeekdayRe.exec(string.slice(i));
      return n ? (d.w = shortWeekdayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }

    function parseWeekday(d, string, i) {
      var n = weekdayRe.exec(string.slice(i));
      return n ? (d.w = weekdayLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }

    function parseShortMonth(d, string, i) {
      var n = shortMonthRe.exec(string.slice(i));
      return n ? (d.m = shortMonthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }

    function parseMonth(d, string, i) {
      var n = monthRe.exec(string.slice(i));
      return n ? (d.m = monthLookup.get(n[0].toLowerCase()), i + n[0].length) : -1;
    }

    function parseLocaleDateTime(d, string, i) {
      return parseSpecifier(d, locale_dateTime, string, i);
    }

    function parseLocaleDate(d, string, i) {
      return parseSpecifier(d, locale_date, string, i);
    }

    function parseLocaleTime(d, string, i) {
      return parseSpecifier(d, locale_time, string, i);
    }

    function formatShortWeekday(d) {
      return locale_shortWeekdays[d.getDay()];
    }

    function formatWeekday(d) {
      return locale_weekdays[d.getDay()];
    }

    function formatShortMonth(d) {
      return locale_shortMonths[d.getMonth()];
    }

    function formatMonth(d) {
      return locale_months[d.getMonth()];
    }

    function formatPeriod(d) {
      return locale_periods[+(d.getHours() >= 12)];
    }

    function formatQuarter(d) {
      return 1 + ~~(d.getMonth() / 3);
    }

    function formatUTCShortWeekday(d) {
      return locale_shortWeekdays[d.getUTCDay()];
    }

    function formatUTCWeekday(d) {
      return locale_weekdays[d.getUTCDay()];
    }

    function formatUTCShortMonth(d) {
      return locale_shortMonths[d.getUTCMonth()];
    }

    function formatUTCMonth(d) {
      return locale_months[d.getUTCMonth()];
    }

    function formatUTCPeriod(d) {
      return locale_periods[+(d.getUTCHours() >= 12)];
    }

    function formatUTCQuarter(d) {
      return 1 + ~~(d.getUTCMonth() / 3);
    }

    return {
      format: function(specifier) {
        var f = newFormat(specifier += "", formats);
        f.toString = function() { return specifier; };
        return f;
      },
      parse: function(specifier) {
        var p = newParse(specifier += "", false);
        p.toString = function() { return specifier; };
        return p;
      },
      utcFormat: function(specifier) {
        var f = newFormat(specifier += "", utcFormats);
        f.toString = function() { return specifier; };
        return f;
      },
      utcParse: function(specifier) {
        var p = newParse(specifier += "", true);
        p.toString = function() { return specifier; };
        return p;
      }
    };
  }

  var pads = {"-": "", "_": " ", "0": "0"},
      numberRe = /^\s*\d+/, // note: ignores next directive
      percentRe = /^%/,
      requoteRe = /[\\^$*+?|[\]().{}]/g;

  function pad(value, fill, width) {
    var sign = value < 0 ? "-" : "",
        string = (sign ? -value : value) + "",
        length = string.length;
    return sign + (length < width ? new Array(width - length + 1).join(fill) + string : string);
  }

  function requote(s) {
    return s.replace(requoteRe, "\\$&");
  }

  function formatRe(names) {
    return new RegExp("^(?:" + names.map(requote).join("|") + ")", "i");
  }

  function formatLookup(names) {
    return new Map(names.map((name, i) => [name.toLowerCase(), i]));
  }

  function parseWeekdayNumberSunday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.w = +n[0], i + n[0].length) : -1;
  }

  function parseWeekdayNumberMonday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.u = +n[0], i + n[0].length) : -1;
  }

  function parseWeekNumberSunday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.U = +n[0], i + n[0].length) : -1;
  }

  function parseWeekNumberISO(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.V = +n[0], i + n[0].length) : -1;
  }

  function parseWeekNumberMonday(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.W = +n[0], i + n[0].length) : -1;
  }

  function parseFullYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 4));
    return n ? (d.y = +n[0], i + n[0].length) : -1;
  }

  function parseYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.y = +n[0] + (+n[0] > 68 ? 1900 : 2000), i + n[0].length) : -1;
  }

  function parseZone(d, string, i) {
    var n = /^(Z)|([+-]\d\d)(?::?(\d\d))?/.exec(string.slice(i, i + 6));
    return n ? (d.Z = n[1] ? 0 : -(n[2] + (n[3] || "00")), i + n[0].length) : -1;
  }

  function parseQuarter(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 1));
    return n ? (d.q = n[0] * 3 - 3, i + n[0].length) : -1;
  }

  function parseMonthNumber(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.m = n[0] - 1, i + n[0].length) : -1;
  }

  function parseDayOfMonth(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.d = +n[0], i + n[0].length) : -1;
  }

  function parseDayOfYear(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 3));
    return n ? (d.m = 0, d.d = +n[0], i + n[0].length) : -1;
  }

  function parseHour24(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.H = +n[0], i + n[0].length) : -1;
  }

  function parseMinutes(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.M = +n[0], i + n[0].length) : -1;
  }

  function parseSeconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 2));
    return n ? (d.S = +n[0], i + n[0].length) : -1;
  }

  function parseMilliseconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 3));
    return n ? (d.L = +n[0], i + n[0].length) : -1;
  }

  function parseMicroseconds(d, string, i) {
    var n = numberRe.exec(string.slice(i, i + 6));
    return n ? (d.L = Math.floor(n[0] / 1000), i + n[0].length) : -1;
  }

  function parseLiteralPercent(d, string, i) {
    var n = percentRe.exec(string.slice(i, i + 1));
    return n ? i + n[0].length : -1;
  }

  function parseUnixTimestamp(d, string, i) {
    var n = numberRe.exec(string.slice(i));
    return n ? (d.Q = +n[0], i + n[0].length) : -1;
  }

  function parseUnixTimestampSeconds(d, string, i) {
    var n = numberRe.exec(string.slice(i));
    return n ? (d.s = +n[0], i + n[0].length) : -1;
  }

  function formatDayOfMonth(d, p) {
    return pad(d.getDate(), p, 2);
  }

  function formatHour24(d, p) {
    return pad(d.getHours(), p, 2);
  }

  function formatHour12(d, p) {
    return pad(d.getHours() % 12 || 12, p, 2);
  }

  function formatDayOfYear(d, p) {
    return pad(1 + day.count(year(d), d), p, 3);
  }

  function formatMilliseconds(d, p) {
    return pad(d.getMilliseconds(), p, 3);
  }

  function formatMicroseconds(d, p) {
    return formatMilliseconds(d, p) + "000";
  }

  function formatMonthNumber(d, p) {
    return pad(d.getMonth() + 1, p, 2);
  }

  function formatMinutes(d, p) {
    return pad(d.getMinutes(), p, 2);
  }

  function formatSeconds(d, p) {
    return pad(d.getSeconds(), p, 2);
  }

  function formatWeekdayNumberMonday(d) {
    var day = d.getDay();
    return day === 0 ? 7 : day;
  }

  function formatWeekNumberSunday(d, p) {
    return pad(sunday.count(year(d) - 1, d), p, 2);
  }

  function dISO(d) {
    var day = d.getDay();
    return (day >= 4 || day === 0) ? thursday(d) : thursday.ceil(d);
  }

  function formatWeekNumberISO(d, p) {
    d = dISO(d);
    return pad(thursday.count(year(d), d) + (year(d).getDay() === 4), p, 2);
  }

  function formatWeekdayNumberSunday(d) {
    return d.getDay();
  }

  function formatWeekNumberMonday(d, p) {
    return pad(monday.count(year(d) - 1, d), p, 2);
  }

  function formatYear(d, p) {
    return pad(d.getFullYear() % 100, p, 2);
  }

  function formatYearISO(d, p) {
    d = dISO(d);
    return pad(d.getFullYear() % 100, p, 2);
  }

  function formatFullYear(d, p) {
    return pad(d.getFullYear() % 10000, p, 4);
  }

  function formatFullYearISO(d, p) {
    var day = d.getDay();
    d = (day >= 4 || day === 0) ? thursday(d) : thursday.ceil(d);
    return pad(d.getFullYear() % 10000, p, 4);
  }

  function formatZone(d) {
    var z = d.getTimezoneOffset();
    return (z > 0 ? "-" : (z *= -1, "+"))
        + pad(z / 60 | 0, "0", 2)
        + pad(z % 60, "0", 2);
  }

  function formatUTCDayOfMonth(d, p) {
    return pad(d.getUTCDate(), p, 2);
  }

  function formatUTCHour24(d, p) {
    return pad(d.getUTCHours(), p, 2);
  }

  function formatUTCHour12(d, p) {
    return pad(d.getUTCHours() % 12 || 12, p, 2);
  }

  function formatUTCDayOfYear(d, p) {
    return pad(1 + utcDay.count(utcYear(d), d), p, 3);
  }

  function formatUTCMilliseconds(d, p) {
    return pad(d.getUTCMilliseconds(), p, 3);
  }

  function formatUTCMicroseconds(d, p) {
    return formatUTCMilliseconds(d, p) + "000";
  }

  function formatUTCMonthNumber(d, p) {
    return pad(d.getUTCMonth() + 1, p, 2);
  }

  function formatUTCMinutes(d, p) {
    return pad(d.getUTCMinutes(), p, 2);
  }

  function formatUTCSeconds(d, p) {
    return pad(d.getUTCSeconds(), p, 2);
  }

  function formatUTCWeekdayNumberMonday(d) {
    var dow = d.getUTCDay();
    return dow === 0 ? 7 : dow;
  }

  function formatUTCWeekNumberSunday(d, p) {
    return pad(utcSunday.count(utcYear(d) - 1, d), p, 2);
  }

  function UTCdISO(d) {
    var day = d.getUTCDay();
    return (day >= 4 || day === 0) ? utcThursday(d) : utcThursday.ceil(d);
  }

  function formatUTCWeekNumberISO(d, p) {
    d = UTCdISO(d);
    return pad(utcThursday.count(utcYear(d), d) + (utcYear(d).getUTCDay() === 4), p, 2);
  }

  function formatUTCWeekdayNumberSunday(d) {
    return d.getUTCDay();
  }

  function formatUTCWeekNumberMonday(d, p) {
    return pad(utcMonday.count(utcYear(d) - 1, d), p, 2);
  }

  function formatUTCYear(d, p) {
    return pad(d.getUTCFullYear() % 100, p, 2);
  }

  function formatUTCYearISO(d, p) {
    d = UTCdISO(d);
    return pad(d.getUTCFullYear() % 100, p, 2);
  }

  function formatUTCFullYear(d, p) {
    return pad(d.getUTCFullYear() % 10000, p, 4);
  }

  function formatUTCFullYearISO(d, p) {
    var day = d.getUTCDay();
    d = (day >= 4 || day === 0) ? utcThursday(d) : utcThursday.ceil(d);
    return pad(d.getUTCFullYear() % 10000, p, 4);
  }

  function formatUTCZone() {
    return "+0000";
  }

  function formatLiteralPercent() {
    return "%";
  }

  function formatUnixTimestamp(d) {
    return +d;
  }

  function formatUnixTimestampSeconds(d) {
    return Math.floor(+d / 1000);
  }

  var locale;
  var utcFormat;
  var utcParse;

  defaultLocale({
    dateTime: "%x, %X",
    date: "%-m/%-d/%Y",
    time: "%-I:%M:%S %p",
    periods: ["AM", "PM"],
    days: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    shortDays: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    months: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
    shortMonths: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
  });

  function defaultLocale(definition) {
    locale = formatLocale(definition);
    locale.format;
    locale.parse;
    utcFormat = locale.utcFormat;
    utcParse = locale.utcParse;
    return locale;
  }

  var isoSpecifier = "%Y-%m-%dT%H:%M:%S.%LZ";

  function formatIsoNative(date) {
    return date.toISOString();
  }

  Date.prototype.toISOString
      ? formatIsoNative
      : utcFormat(isoSpecifier);

  function parseIsoNative(string) {
    var date = new Date(string);
    return isNaN(date) ? null : date;
  }

  +new Date("2000-01-01T00:00:00.000Z")
      ? parseIsoNative
      : utcParse(isoSpecifier);

  /**
   * Common utilities
   * @module glMatrix
   */
  // Configuration Constants
  var EPSILON = 0.000001;
  var ARRAY_TYPE = typeof Float32Array !== 'undefined' ? Float32Array : Array;
  if (!Math.hypot) Math.hypot = function () {
    var y = 0,
        i = arguments.length;

    while (i--) {
      y += arguments[i] * arguments[i];
    }

    return Math.sqrt(y);
  };

  /**
   * 3x3 Matrix
   * @module mat3
   */

  /**
   * Creates a new identity mat3
   *
   * @returns {mat3} a new 3x3 matrix
   */

  function create$4() {
    var out = new ARRAY_TYPE(9);

    if (ARRAY_TYPE != Float32Array) {
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
      out[5] = 0;
      out[6] = 0;
      out[7] = 0;
    }

    out[0] = 1;
    out[4] = 1;
    out[8] = 1;
    return out;
  }
  /**
   * Translate a mat3 by the given vector
   *
   * @param {mat3} out the receiving matrix
   * @param {ReadonlyMat3} a the matrix to translate
   * @param {ReadonlyVec2} v vector to translate by
   * @returns {mat3} out
   */

  function translate(out, a, v) {
    var a00 = a[0],
        a01 = a[1],
        a02 = a[2],
        a10 = a[3],
        a11 = a[4],
        a12 = a[5],
        a20 = a[6],
        a21 = a[7],
        a22 = a[8],
        x = v[0],
        y = v[1];
    out[0] = a00;
    out[1] = a01;
    out[2] = a02;
    out[3] = a10;
    out[4] = a11;
    out[5] = a12;
    out[6] = x * a00 + y * a10 + a20;
    out[7] = x * a01 + y * a11 + a21;
    out[8] = x * a02 + y * a12 + a22;
    return out;
  }
  /**
   * Scales the mat3 by the dimensions in the given vec2
   *
   * @param {mat3} out the receiving matrix
   * @param {ReadonlyMat3} a the matrix to rotate
   * @param {ReadonlyVec2} v the vec2 to scale the matrix by
   * @returns {mat3} out
   **/

  function scale(out, a, v) {
    var x = v[0],
        y = v[1];
    out[0] = x * a[0];
    out[1] = x * a[1];
    out[2] = x * a[2];
    out[3] = y * a[3];
    out[4] = y * a[4];
    out[5] = y * a[5];
    out[6] = a[6];
    out[7] = a[7];
    out[8] = a[8];
    return out;
  }
  /**
   * Generates a 2D projection matrix with the given bounds
   *
   * @param {mat3} out mat3 frustum matrix will be written into
   * @param {number} width Width of your gl context
   * @param {number} height Height of gl context
   * @returns {mat3} out
   */

  function projection(out, width, height) {
    out[0] = 2 / width;
    out[1] = 0;
    out[2] = 0;
    out[3] = 0;
    out[4] = -2 / height;
    out[5] = 0;
    out[6] = -1;
    out[7] = 1;
    out[8] = 1;
    return out;
  }

  /**
   * 3 Dimensional Vector
   * @module vec3
   */

  /**
   * Creates a new, empty vec3
   *
   * @returns {vec3} a new 3D vector
   */

  function create$3() {
    var out = new ARRAY_TYPE(3);

    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
    }

    return out;
  }
  /**
   * Calculates the length of a vec3
   *
   * @param {ReadonlyVec3} a vector to calculate length of
   * @returns {Number} length of a
   */

  function length(a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    return Math.hypot(x, y, z);
  }
  /**
   * Creates a new vec3 initialized with the given values
   *
   * @param {Number} x X component
   * @param {Number} y Y component
   * @param {Number} z Z component
   * @returns {vec3} a new 3D vector
   */

  function fromValues(x, y, z) {
    var out = new ARRAY_TYPE(3);
    out[0] = x;
    out[1] = y;
    out[2] = z;
    return out;
  }
  /**
   * Normalize a vec3
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a vector to normalize
   * @returns {vec3} out
   */

  function normalize$2(out, a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var len = x * x + y * y + z * z;

    if (len > 0) {
      //TODO: evaluate use of glm_invsqrt here?
      len = 1 / Math.sqrt(len);
    }

    out[0] = a[0] * len;
    out[1] = a[1] * len;
    out[2] = a[2] * len;
    return out;
  }
  /**
   * Calculates the dot product of two vec3's
   *
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @returns {Number} dot product of a and b
   */

  function dot(a, b) {
    return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  }
  /**
   * Computes the cross product of two vec3's
   *
   * @param {vec3} out the receiving vector
   * @param {ReadonlyVec3} a the first operand
   * @param {ReadonlyVec3} b the second operand
   * @returns {vec3} out
   */

  function cross(out, a, b) {
    var ax = a[0],
        ay = a[1],
        az = a[2];
    var bx = b[0],
        by = b[1],
        bz = b[2];
    out[0] = ay * bz - az * by;
    out[1] = az * bx - ax * bz;
    out[2] = ax * by - ay * bx;
    return out;
  }
  /**
   * Alias for {@link vec3.length}
   * @function
   */

  var len = length;
  /**
   * Perform some operation over an array of vec3s.
   *
   * @param {Array} a the array of vectors to iterate over
   * @param {Number} stride Number of elements between the start of each vec3. If 0 assumes tightly packed
   * @param {Number} offset Number of elements to skip at the beginning of the array
   * @param {Number} count Number of vec3s to iterate over. If 0 iterates over entire array
   * @param {Function} fn Function to call for each vector in the array
   * @param {Object} [arg] additional argument to pass to fn
   * @returns {Array} a
   * @function
   */

  (function () {
    var vec = create$3();
    return function (a, stride, offset, count, fn, arg) {
      var i, l;

      if (!stride) {
        stride = 3;
      }

      if (!offset) {
        offset = 0;
      }

      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }

      for (i = offset; i < l; i += stride) {
        vec[0] = a[i];
        vec[1] = a[i + 1];
        vec[2] = a[i + 2];
        fn(vec, vec, arg);
        a[i] = vec[0];
        a[i + 1] = vec[1];
        a[i + 2] = vec[2];
      }

      return a;
    };
  })();

  /**
   * 4 Dimensional Vector
   * @module vec4
   */

  /**
   * Creates a new, empty vec4
   *
   * @returns {vec4} a new 4D vector
   */

  function create$2() {
    var out = new ARRAY_TYPE(4);

    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
      out[3] = 0;
    }

    return out;
  }
  /**
   * Normalize a vec4
   *
   * @param {vec4} out the receiving vector
   * @param {ReadonlyVec4} a vector to normalize
   * @returns {vec4} out
   */

  function normalize$1(out, a) {
    var x = a[0];
    var y = a[1];
    var z = a[2];
    var w = a[3];
    var len = x * x + y * y + z * z + w * w;

    if (len > 0) {
      len = 1 / Math.sqrt(len);
    }

    out[0] = x * len;
    out[1] = y * len;
    out[2] = z * len;
    out[3] = w * len;
    return out;
  }
  /**
   * Perform some operation over an array of vec4s.
   *
   * @param {Array} a the array of vectors to iterate over
   * @param {Number} stride Number of elements between the start of each vec4. If 0 assumes tightly packed
   * @param {Number} offset Number of elements to skip at the beginning of the array
   * @param {Number} count Number of vec4s to iterate over. If 0 iterates over entire array
   * @param {Function} fn Function to call for each vector in the array
   * @param {Object} [arg] additional argument to pass to fn
   * @returns {Array} a
   * @function
   */

  (function () {
    var vec = create$2();
    return function (a, stride, offset, count, fn, arg) {
      var i, l;

      if (!stride) {
        stride = 4;
      }

      if (!offset) {
        offset = 0;
      }

      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }

      for (i = offset; i < l; i += stride) {
        vec[0] = a[i];
        vec[1] = a[i + 1];
        vec[2] = a[i + 2];
        vec[3] = a[i + 3];
        fn(vec, vec, arg);
        a[i] = vec[0];
        a[i + 1] = vec[1];
        a[i + 2] = vec[2];
        a[i + 3] = vec[3];
      }

      return a;
    };
  })();

  /**
   * Quaternion
   * @module quat
   */

  /**
   * Creates a new identity quat
   *
   * @returns {quat} a new quaternion
   */

  function create$1() {
    var out = new ARRAY_TYPE(4);

    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
      out[2] = 0;
    }

    out[3] = 1;
    return out;
  }
  /**
   * Sets a quat from the given angle and rotation axis,
   * then returns it.
   *
   * @param {quat} out the receiving quaternion
   * @param {ReadonlyVec3} axis the axis around which to rotate
   * @param {Number} rad the angle in radians
   * @returns {quat} out
   **/

  function setAxisAngle(out, axis, rad) {
    rad = rad * 0.5;
    var s = Math.sin(rad);
    out[0] = s * axis[0];
    out[1] = s * axis[1];
    out[2] = s * axis[2];
    out[3] = Math.cos(rad);
    return out;
  }
  /**
   * Performs a spherical linear interpolation between two quat
   *
   * @param {quat} out the receiving quaternion
   * @param {ReadonlyQuat} a the first operand
   * @param {ReadonlyQuat} b the second operand
   * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
   * @returns {quat} out
   */

  function slerp(out, a, b, t) {
    // benchmarks:
    //    http://jsperf.com/quaternion-slerp-implementations
    var ax = a[0],
        ay = a[1],
        az = a[2],
        aw = a[3];
    var bx = b[0],
        by = b[1],
        bz = b[2],
        bw = b[3];
    var omega, cosom, sinom, scale0, scale1; // calc cosine

    cosom = ax * bx + ay * by + az * bz + aw * bw; // adjust signs (if necessary)

    if (cosom < 0.0) {
      cosom = -cosom;
      bx = -bx;
      by = -by;
      bz = -bz;
      bw = -bw;
    } // calculate coefficients


    if (1.0 - cosom > EPSILON) {
      // standard case (slerp)
      omega = Math.acos(cosom);
      sinom = Math.sin(omega);
      scale0 = Math.sin((1.0 - t) * omega) / sinom;
      scale1 = Math.sin(t * omega) / sinom;
    } else {
      // "from" and "to" quaternions are very close
      //  ... so we can do a linear interpolation
      scale0 = 1.0 - t;
      scale1 = t;
    } // calculate final values


    out[0] = scale0 * ax + scale1 * bx;
    out[1] = scale0 * ay + scale1 * by;
    out[2] = scale0 * az + scale1 * bz;
    out[3] = scale0 * aw + scale1 * bw;
    return out;
  }
  /**
   * Creates a quaternion from the given 3x3 rotation matrix.
   *
   * NOTE: The resultant quaternion is not normalized, so you should be sure
   * to renormalize the quaternion yourself where necessary.
   *
   * @param {quat} out the receiving quaternion
   * @param {ReadonlyMat3} m rotation matrix
   * @returns {quat} out
   * @function
   */

  function fromMat3(out, m) {
    // Algorithm in Ken Shoemake's article in 1987 SIGGRAPH course notes
    // article "Quaternion Calculus and Fast Animation".
    var fTrace = m[0] + m[4] + m[8];
    var fRoot;

    if (fTrace > 0.0) {
      // |w| > 1/2, may as well choose w > 1/2
      fRoot = Math.sqrt(fTrace + 1.0); // 2w

      out[3] = 0.5 * fRoot;
      fRoot = 0.5 / fRoot; // 1/(4w)

      out[0] = (m[5] - m[7]) * fRoot;
      out[1] = (m[6] - m[2]) * fRoot;
      out[2] = (m[1] - m[3]) * fRoot;
    } else {
      // |w| <= 1/2
      var i = 0;
      if (m[4] > m[0]) i = 1;
      if (m[8] > m[i * 3 + i]) i = 2;
      var j = (i + 1) % 3;
      var k = (i + 2) % 3;
      fRoot = Math.sqrt(m[i * 3 + i] - m[j * 3 + j] - m[k * 3 + k] + 1.0);
      out[i] = 0.5 * fRoot;
      fRoot = 0.5 / fRoot;
      out[3] = (m[j * 3 + k] - m[k * 3 + j]) * fRoot;
      out[j] = (m[j * 3 + i] + m[i * 3 + j]) * fRoot;
      out[k] = (m[k * 3 + i] + m[i * 3 + k]) * fRoot;
    }

    return out;
  }
  /**
   * Normalize a quat
   *
   * @param {quat} out the receiving quaternion
   * @param {ReadonlyQuat} a quaternion to normalize
   * @returns {quat} out
   * @function
   */

  var normalize = normalize$1;
  /**
   * Sets a quaternion to represent the shortest rotation from one
   * vector to another.
   *
   * Both vectors are assumed to be unit length.
   *
   * @param {quat} out the receiving quaternion.
   * @param {ReadonlyVec3} a the initial vector
   * @param {ReadonlyVec3} b the destination vector
   * @returns {quat} out
   */

  (function () {
    var tmpvec3 = create$3();
    var xUnitVec3 = fromValues(1, 0, 0);
    var yUnitVec3 = fromValues(0, 1, 0);
    return function (out, a, b) {
      var dot$1 = dot(a, b);

      if (dot$1 < -0.999999) {
        cross(tmpvec3, xUnitVec3, a);
        if (len(tmpvec3) < 0.000001) cross(tmpvec3, yUnitVec3, a);
        normalize$2(tmpvec3, tmpvec3);
        setAxisAngle(out, tmpvec3, Math.PI);
        return out;
      } else if (dot$1 > 0.999999) {
        out[0] = 0;
        out[1] = 0;
        out[2] = 0;
        out[3] = 1;
        return out;
      } else {
        cross(tmpvec3, a, b);
        out[0] = tmpvec3[0];
        out[1] = tmpvec3[1];
        out[2] = tmpvec3[2];
        out[3] = 1 + dot$1;
        return normalize(out, out);
      }
    };
  })();
  /**
   * Performs a spherical linear interpolation with two control points
   *
   * @param {quat} out the receiving quaternion
   * @param {ReadonlyQuat} a the first operand
   * @param {ReadonlyQuat} b the second operand
   * @param {ReadonlyQuat} c the third operand
   * @param {ReadonlyQuat} d the fourth operand
   * @param {Number} t interpolation amount, in the range [0-1], between the two inputs
   * @returns {quat} out
   */

  (function () {
    var temp1 = create$1();
    var temp2 = create$1();
    return function (out, a, b, c, d, t) {
      slerp(temp1, a, d, t);
      slerp(temp2, b, c, t);
      slerp(out, temp1, temp2, 2 * t * (1 - t));
      return out;
    };
  })();
  /**
   * Sets the specified quaternion with values corresponding to the given
   * axes. Each axis is a vec3 and is expected to be unit length and
   * perpendicular to all other specified axes.
   *
   * @param {ReadonlyVec3} view  the vector representing the viewing direction
   * @param {ReadonlyVec3} right the vector representing the local "right" direction
   * @param {ReadonlyVec3} up    the vector representing the local "up" direction
   * @returns {quat} out
   */

  (function () {
    var matr = create$4();
    return function (out, view, right, up) {
      matr[0] = right[0];
      matr[3] = right[1];
      matr[6] = right[2];
      matr[1] = up[0];
      matr[4] = up[1];
      matr[7] = up[2];
      matr[2] = -view[0];
      matr[5] = -view[1];
      matr[8] = -view[2];
      return normalize(out, fromMat3(out, matr));
    };
  })();

  /**
   * 2 Dimensional Vector
   * @module vec2
   */

  /**
   * Creates a new, empty vec2
   *
   * @returns {vec2} a new 2D vector
   */

  function create() {
    var out = new ARRAY_TYPE(2);

    if (ARRAY_TYPE != Float32Array) {
      out[0] = 0;
      out[1] = 0;
    }

    return out;
  }
  /**
   * Perform some operation over an array of vec2s.
   *
   * @param {Array} a the array of vectors to iterate over
   * @param {Number} stride Number of elements between the start of each vec2. If 0 assumes tightly packed
   * @param {Number} offset Number of elements to skip at the beginning of the array
   * @param {Number} count Number of vec2s to iterate over. If 0 iterates over entire array
   * @param {Function} fn Function to call for each vector in the array
   * @param {Object} [arg] additional argument to pass to fn
   * @returns {Array} a
   * @function
   */

  (function () {
    var vec = create();
    return function (a, stride, offset, count, fn, arg) {
      var i, l;

      if (!stride) {
        stride = 2;
      }

      if (!offset) {
        offset = 0;
      }

      if (count) {
        l = Math.min(count * stride + offset, a.length);
      } else {
        l = a.length;
      }

      for (i = offset; i < l; i += stride) {
        vec[0] = a[i];
        vec[1] = a[i + 1];
        fn(vec, vec, arg);
        a[i] = vec[0];
        a[i + 1] = vec[1];
      }

      return a;
    };
  })();

  var alea$1 = {exports: {}};

  (function (module) {
  	// A port of an algorithm by Johannes Baagøe <baagoe@baagoe.com>, 2010
  	// http://baagoe.com/en/RandomMusings/javascript/
  	// https://github.com/nquinlan/better-random-numbers-for-javascript-mirror
  	// Original work is under MIT license -

  	// Copyright (C) 2010 by Johannes Baagøe <baagoe@baagoe.org>
  	//
  	// Permission is hereby granted, free of charge, to any person obtaining a copy
  	// of this software and associated documentation files (the "Software"), to deal
  	// in the Software without restriction, including without limitation the rights
  	// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  	// copies of the Software, and to permit persons to whom the Software is
  	// furnished to do so, subject to the following conditions:
  	//
  	// The above copyright notice and this permission notice shall be included in
  	// all copies or substantial portions of the Software.
  	//
  	// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  	// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  	// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  	// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  	// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  	// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  	// THE SOFTWARE.



  	(function(global, module, define) {

  	function Alea(seed) {
  	  var me = this, mash = Mash();

  	  me.next = function() {
  	    var t = 2091639 * me.s0 + me.c * 2.3283064365386963e-10; // 2^-32
  	    me.s0 = me.s1;
  	    me.s1 = me.s2;
  	    return me.s2 = t - (me.c = t | 0);
  	  };

  	  // Apply the seeding algorithm from Baagoe.
  	  me.c = 1;
  	  me.s0 = mash(' ');
  	  me.s1 = mash(' ');
  	  me.s2 = mash(' ');
  	  me.s0 -= mash(seed);
  	  if (me.s0 < 0) { me.s0 += 1; }
  	  me.s1 -= mash(seed);
  	  if (me.s1 < 0) { me.s1 += 1; }
  	  me.s2 -= mash(seed);
  	  if (me.s2 < 0) { me.s2 += 1; }
  	  mash = null;
  	}

  	function copy(f, t) {
  	  t.c = f.c;
  	  t.s0 = f.s0;
  	  t.s1 = f.s1;
  	  t.s2 = f.s2;
  	  return t;
  	}

  	function impl(seed, opts) {
  	  var xg = new Alea(seed),
  	      state = opts && opts.state,
  	      prng = xg.next;
  	  prng.int32 = function() { return (xg.next() * 0x100000000) | 0; };
  	  prng.double = function() {
  	    return prng() + (prng() * 0x200000 | 0) * 1.1102230246251565e-16; // 2^-53
  	  };
  	  prng.quick = prng;
  	  if (state) {
  	    if (typeof(state) == 'object') copy(state, xg);
  	    prng.state = function() { return copy(xg, {}); };
  	  }
  	  return prng;
  	}

  	function Mash() {
  	  var n = 0xefc8249d;

  	  var mash = function(data) {
  	    data = String(data);
  	    for (var i = 0; i < data.length; i++) {
  	      n += data.charCodeAt(i);
  	      var h = 0.02519603282416938 * n;
  	      n = h >>> 0;
  	      h -= n;
  	      h *= n;
  	      n = h >>> 0;
  	      h -= n;
  	      n += h * 0x100000000; // 2^32
  	    }
  	    return (n >>> 0) * 2.3283064365386963e-10; // 2^-32
  	  };

  	  return mash;
  	}


  	if (module && module.exports) {
  	  module.exports = impl;
  	} else if (define && define.amd) {
  	  define(function() { return impl; });
  	} else {
  	  this.alea = impl;
  	}

  	})(
  	  commonjsGlobal,
  	  module,    // present in node.js
  	  (typeof undefined) == 'function'    // present with an AMD loader
  	);
  } (alea$1));

  var xor128$1 = {exports: {}};

  (function (module) {
  	// A Javascript implementaion of the "xor128" prng algorithm by
  	// George Marsaglia.  See http://www.jstatsoft.org/v08/i14/paper

  	(function(global, module, define) {

  	function XorGen(seed) {
  	  var me = this, strseed = '';

  	  me.x = 0;
  	  me.y = 0;
  	  me.z = 0;
  	  me.w = 0;

  	  // Set up generator function.
  	  me.next = function() {
  	    var t = me.x ^ (me.x << 11);
  	    me.x = me.y;
  	    me.y = me.z;
  	    me.z = me.w;
  	    return me.w ^= (me.w >>> 19) ^ t ^ (t >>> 8);
  	  };

  	  if (seed === (seed | 0)) {
  	    // Integer seed.
  	    me.x = seed;
  	  } else {
  	    // String seed.
  	    strseed += seed;
  	  }

  	  // Mix in string seed, then discard an initial batch of 64 values.
  	  for (var k = 0; k < strseed.length + 64; k++) {
  	    me.x ^= strseed.charCodeAt(k) | 0;
  	    me.next();
  	  }
  	}

  	function copy(f, t) {
  	  t.x = f.x;
  	  t.y = f.y;
  	  t.z = f.z;
  	  t.w = f.w;
  	  return t;
  	}

  	function impl(seed, opts) {
  	  var xg = new XorGen(seed),
  	      state = opts && opts.state,
  	      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  	  prng.double = function() {
  	    do {
  	      var top = xg.next() >>> 11,
  	          bot = (xg.next() >>> 0) / 0x100000000,
  	          result = (top + bot) / (1 << 21);
  	    } while (result === 0);
  	    return result;
  	  };
  	  prng.int32 = xg.next;
  	  prng.quick = prng;
  	  if (state) {
  	    if (typeof(state) == 'object') copy(state, xg);
  	    prng.state = function() { return copy(xg, {}); };
  	  }
  	  return prng;
  	}

  	if (module && module.exports) {
  	  module.exports = impl;
  	} else if (define && define.amd) {
  	  define(function() { return impl; });
  	} else {
  	  this.xor128 = impl;
  	}

  	})(
  	  commonjsGlobal,
  	  module,    // present in node.js
  	  (typeof undefined) == 'function'    // present with an AMD loader
  	);
  } (xor128$1));

  var xorwow$1 = {exports: {}};

  (function (module) {
  	// A Javascript implementaion of the "xorwow" prng algorithm by
  	// George Marsaglia.  See http://www.jstatsoft.org/v08/i14/paper

  	(function(global, module, define) {

  	function XorGen(seed) {
  	  var me = this, strseed = '';

  	  // Set up generator function.
  	  me.next = function() {
  	    var t = (me.x ^ (me.x >>> 2));
  	    me.x = me.y; me.y = me.z; me.z = me.w; me.w = me.v;
  	    return (me.d = (me.d + 362437 | 0)) +
  	       (me.v = (me.v ^ (me.v << 4)) ^ (t ^ (t << 1))) | 0;
  	  };

  	  me.x = 0;
  	  me.y = 0;
  	  me.z = 0;
  	  me.w = 0;
  	  me.v = 0;

  	  if (seed === (seed | 0)) {
  	    // Integer seed.
  	    me.x = seed;
  	  } else {
  	    // String seed.
  	    strseed += seed;
  	  }

  	  // Mix in string seed, then discard an initial batch of 64 values.
  	  for (var k = 0; k < strseed.length + 64; k++) {
  	    me.x ^= strseed.charCodeAt(k) | 0;
  	    if (k == strseed.length) {
  	      me.d = me.x << 10 ^ me.x >>> 4;
  	    }
  	    me.next();
  	  }
  	}

  	function copy(f, t) {
  	  t.x = f.x;
  	  t.y = f.y;
  	  t.z = f.z;
  	  t.w = f.w;
  	  t.v = f.v;
  	  t.d = f.d;
  	  return t;
  	}

  	function impl(seed, opts) {
  	  var xg = new XorGen(seed),
  	      state = opts && opts.state,
  	      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  	  prng.double = function() {
  	    do {
  	      var top = xg.next() >>> 11,
  	          bot = (xg.next() >>> 0) / 0x100000000,
  	          result = (top + bot) / (1 << 21);
  	    } while (result === 0);
  	    return result;
  	  };
  	  prng.int32 = xg.next;
  	  prng.quick = prng;
  	  if (state) {
  	    if (typeof(state) == 'object') copy(state, xg);
  	    prng.state = function() { return copy(xg, {}); };
  	  }
  	  return prng;
  	}

  	if (module && module.exports) {
  	  module.exports = impl;
  	} else if (define && define.amd) {
  	  define(function() { return impl; });
  	} else {
  	  this.xorwow = impl;
  	}

  	})(
  	  commonjsGlobal,
  	  module,    // present in node.js
  	  (typeof undefined) == 'function'    // present with an AMD loader
  	);
  } (xorwow$1));

  var xorshift7$1 = {exports: {}};

  (function (module) {
  	// A Javascript implementaion of the "xorshift7" algorithm by
  	// François Panneton and Pierre L'ecuyer:
  	// "On the Xorgshift Random Number Generators"
  	// http://saluc.engr.uconn.edu/refs/crypto/rng/panneton05onthexorshift.pdf

  	(function(global, module, define) {

  	function XorGen(seed) {
  	  var me = this;

  	  // Set up generator function.
  	  me.next = function() {
  	    // Update xor generator.
  	    var X = me.x, i = me.i, t, v;
  	    t = X[i]; t ^= (t >>> 7); v = t ^ (t << 24);
  	    t = X[(i + 1) & 7]; v ^= t ^ (t >>> 10);
  	    t = X[(i + 3) & 7]; v ^= t ^ (t >>> 3);
  	    t = X[(i + 4) & 7]; v ^= t ^ (t << 7);
  	    t = X[(i + 7) & 7]; t = t ^ (t << 13); v ^= t ^ (t << 9);
  	    X[i] = v;
  	    me.i = (i + 1) & 7;
  	    return v;
  	  };

  	  function init(me, seed) {
  	    var j, X = [];

  	    if (seed === (seed | 0)) {
  	      // Seed state array using a 32-bit integer.
  	      X[0] = seed;
  	    } else {
  	      // Seed state using a string.
  	      seed = '' + seed;
  	      for (j = 0; j < seed.length; ++j) {
  	        X[j & 7] = (X[j & 7] << 15) ^
  	            (seed.charCodeAt(j) + X[(j + 1) & 7] << 13);
  	      }
  	    }
  	    // Enforce an array length of 8, not all zeroes.
  	    while (X.length < 8) X.push(0);
  	    for (j = 0; j < 8 && X[j] === 0; ++j);
  	    if (j == 8) X[7] = -1; else X[j];

  	    me.x = X;
  	    me.i = 0;

  	    // Discard an initial 256 values.
  	    for (j = 256; j > 0; --j) {
  	      me.next();
  	    }
  	  }

  	  init(me, seed);
  	}

  	function copy(f, t) {
  	  t.x = f.x.slice();
  	  t.i = f.i;
  	  return t;
  	}

  	function impl(seed, opts) {
  	  if (seed == null) seed = +(new Date);
  	  var xg = new XorGen(seed),
  	      state = opts && opts.state,
  	      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  	  prng.double = function() {
  	    do {
  	      var top = xg.next() >>> 11,
  	          bot = (xg.next() >>> 0) / 0x100000000,
  	          result = (top + bot) / (1 << 21);
  	    } while (result === 0);
  	    return result;
  	  };
  	  prng.int32 = xg.next;
  	  prng.quick = prng;
  	  if (state) {
  	    if (state.x) copy(state, xg);
  	    prng.state = function() { return copy(xg, {}); };
  	  }
  	  return prng;
  	}

  	if (module && module.exports) {
  	  module.exports = impl;
  	} else if (define && define.amd) {
  	  define(function() { return impl; });
  	} else {
  	  this.xorshift7 = impl;
  	}

  	})(
  	  commonjsGlobal,
  	  module,    // present in node.js
  	  (typeof undefined) == 'function'    // present with an AMD loader
  	);
  } (xorshift7$1));

  var xor4096$1 = {exports: {}};

  (function (module) {
  	// A Javascript implementaion of Richard Brent's Xorgens xor4096 algorithm.
  	//
  	// This fast non-cryptographic random number generator is designed for
  	// use in Monte-Carlo algorithms. It combines a long-period xorshift
  	// generator with a Weyl generator, and it passes all common batteries
  	// of stasticial tests for randomness while consuming only a few nanoseconds
  	// for each prng generated.  For background on the generator, see Brent's
  	// paper: "Some long-period random number generators using shifts and xors."
  	// http://arxiv.org/pdf/1004.3115v1.pdf
  	//
  	// Usage:
  	//
  	// var xor4096 = require('xor4096');
  	// random = xor4096(1);                        // Seed with int32 or string.
  	// assert.equal(random(), 0.1520436450538547); // (0, 1) range, 53 bits.
  	// assert.equal(random.int32(), 1806534897);   // signed int32, 32 bits.
  	//
  	// For nonzero numeric keys, this impelementation provides a sequence
  	// identical to that by Brent's xorgens 3 implementaion in C.  This
  	// implementation also provides for initalizing the generator with
  	// string seeds, or for saving and restoring the state of the generator.
  	//
  	// On Chrome, this prng benchmarks about 2.1 times slower than
  	// Javascript's built-in Math.random().

  	(function(global, module, define) {

  	function XorGen(seed) {
  	  var me = this;

  	  // Set up generator function.
  	  me.next = function() {
  	    var w = me.w,
  	        X = me.X, i = me.i, t, v;
  	    // Update Weyl generator.
  	    me.w = w = (w + 0x61c88647) | 0;
  	    // Update xor generator.
  	    v = X[(i + 34) & 127];
  	    t = X[i = ((i + 1) & 127)];
  	    v ^= v << 13;
  	    t ^= t << 17;
  	    v ^= v >>> 15;
  	    t ^= t >>> 12;
  	    // Update Xor generator array state.
  	    v = X[i] = v ^ t;
  	    me.i = i;
  	    // Result is the combination.
  	    return (v + (w ^ (w >>> 16))) | 0;
  	  };

  	  function init(me, seed) {
  	    var t, v, i, j, w, X = [], limit = 128;
  	    if (seed === (seed | 0)) {
  	      // Numeric seeds initialize v, which is used to generates X.
  	      v = seed;
  	      seed = null;
  	    } else {
  	      // String seeds are mixed into v and X one character at a time.
  	      seed = seed + '\0';
  	      v = 0;
  	      limit = Math.max(limit, seed.length);
  	    }
  	    // Initialize circular array and weyl value.
  	    for (i = 0, j = -32; j < limit; ++j) {
  	      // Put the unicode characters into the array, and shuffle them.
  	      if (seed) v ^= seed.charCodeAt((j + 32) % seed.length);
  	      // After 32 shuffles, take v as the starting w value.
  	      if (j === 0) w = v;
  	      v ^= v << 10;
  	      v ^= v >>> 15;
  	      v ^= v << 4;
  	      v ^= v >>> 13;
  	      if (j >= 0) {
  	        w = (w + 0x61c88647) | 0;     // Weyl.
  	        t = (X[j & 127] ^= (v + w));  // Combine xor and weyl to init array.
  	        i = (0 == t) ? i + 1 : 0;     // Count zeroes.
  	      }
  	    }
  	    // We have detected all zeroes; make the key nonzero.
  	    if (i >= 128) {
  	      X[(seed && seed.length || 0) & 127] = -1;
  	    }
  	    // Run the generator 512 times to further mix the state before using it.
  	    // Factoring this as a function slows the main generator, so it is just
  	    // unrolled here.  The weyl generator is not advanced while warming up.
  	    i = 127;
  	    for (j = 4 * 128; j > 0; --j) {
  	      v = X[(i + 34) & 127];
  	      t = X[i = ((i + 1) & 127)];
  	      v ^= v << 13;
  	      t ^= t << 17;
  	      v ^= v >>> 15;
  	      t ^= t >>> 12;
  	      X[i] = v ^ t;
  	    }
  	    // Storing state as object members is faster than using closure variables.
  	    me.w = w;
  	    me.X = X;
  	    me.i = i;
  	  }

  	  init(me, seed);
  	}

  	function copy(f, t) {
  	  t.i = f.i;
  	  t.w = f.w;
  	  t.X = f.X.slice();
  	  return t;
  	}
  	function impl(seed, opts) {
  	  if (seed == null) seed = +(new Date);
  	  var xg = new XorGen(seed),
  	      state = opts && opts.state,
  	      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  	  prng.double = function() {
  	    do {
  	      var top = xg.next() >>> 11,
  	          bot = (xg.next() >>> 0) / 0x100000000,
  	          result = (top + bot) / (1 << 21);
  	    } while (result === 0);
  	    return result;
  	  };
  	  prng.int32 = xg.next;
  	  prng.quick = prng;
  	  if (state) {
  	    if (state.X) copy(state, xg);
  	    prng.state = function() { return copy(xg, {}); };
  	  }
  	  return prng;
  	}

  	if (module && module.exports) {
  	  module.exports = impl;
  	} else if (define && define.amd) {
  	  define(function() { return impl; });
  	} else {
  	  this.xor4096 = impl;
  	}

  	})(
  	  commonjsGlobal,                                     // window object or global
  	  module,    // present in node.js
  	  (typeof undefined) == 'function'    // present with an AMD loader
  	);
  } (xor4096$1));

  var tychei$1 = {exports: {}};

  (function (module) {
  	// A Javascript implementaion of the "Tyche-i" prng algorithm by
  	// Samuel Neves and Filipe Araujo.
  	// See https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf

  	(function(global, module, define) {

  	function XorGen(seed) {
  	  var me = this, strseed = '';

  	  // Set up generator function.
  	  me.next = function() {
  	    var b = me.b, c = me.c, d = me.d, a = me.a;
  	    b = (b << 25) ^ (b >>> 7) ^ c;
  	    c = (c - d) | 0;
  	    d = (d << 24) ^ (d >>> 8) ^ a;
  	    a = (a - b) | 0;
  	    me.b = b = (b << 20) ^ (b >>> 12) ^ c;
  	    me.c = c = (c - d) | 0;
  	    me.d = (d << 16) ^ (c >>> 16) ^ a;
  	    return me.a = (a - b) | 0;
  	  };

  	  /* The following is non-inverted tyche, which has better internal
  	   * bit diffusion, but which is about 25% slower than tyche-i in JS.
  	  me.next = function() {
  	    var a = me.a, b = me.b, c = me.c, d = me.d;
  	    a = (me.a + me.b | 0) >>> 0;
  	    d = me.d ^ a; d = d << 16 ^ d >>> 16;
  	    c = me.c + d | 0;
  	    b = me.b ^ c; b = b << 12 ^ d >>> 20;
  	    me.a = a = a + b | 0;
  	    d = d ^ a; me.d = d = d << 8 ^ d >>> 24;
  	    me.c = c = c + d | 0;
  	    b = b ^ c;
  	    return me.b = (b << 7 ^ b >>> 25);
  	  }
  	  */

  	  me.a = 0;
  	  me.b = 0;
  	  me.c = 2654435769 | 0;
  	  me.d = 1367130551;

  	  if (seed === Math.floor(seed)) {
  	    // Integer seed.
  	    me.a = (seed / 0x100000000) | 0;
  	    me.b = seed | 0;
  	  } else {
  	    // String seed.
  	    strseed += seed;
  	  }

  	  // Mix in string seed, then discard an initial batch of 64 values.
  	  for (var k = 0; k < strseed.length + 20; k++) {
  	    me.b ^= strseed.charCodeAt(k) | 0;
  	    me.next();
  	  }
  	}

  	function copy(f, t) {
  	  t.a = f.a;
  	  t.b = f.b;
  	  t.c = f.c;
  	  t.d = f.d;
  	  return t;
  	}
  	function impl(seed, opts) {
  	  var xg = new XorGen(seed),
  	      state = opts && opts.state,
  	      prng = function() { return (xg.next() >>> 0) / 0x100000000; };
  	  prng.double = function() {
  	    do {
  	      var top = xg.next() >>> 11,
  	          bot = (xg.next() >>> 0) / 0x100000000,
  	          result = (top + bot) / (1 << 21);
  	    } while (result === 0);
  	    return result;
  	  };
  	  prng.int32 = xg.next;
  	  prng.quick = prng;
  	  if (state) {
  	    if (typeof(state) == 'object') copy(state, xg);
  	    prng.state = function() { return copy(xg, {}); };
  	  }
  	  return prng;
  	}

  	if (module && module.exports) {
  	  module.exports = impl;
  	} else if (define && define.amd) {
  	  define(function() { return impl; });
  	} else {
  	  this.tychei = impl;
  	}

  	})(
  	  commonjsGlobal,
  	  module,    // present in node.js
  	  (typeof undefined) == 'function'    // present with an AMD loader
  	);
  } (tychei$1));

  var seedrandom$1 = {exports: {}};

  /*
  Copyright 2019 David Bau.

  Permission is hereby granted, free of charge, to any person obtaining
  a copy of this software and associated documentation files (the
  "Software"), to deal in the Software without restriction, including
  without limitation the rights to use, copy, modify, merge, publish,
  distribute, sublicense, and/or sell copies of the Software, and to
  permit persons to whom the Software is furnished to do so, subject to
  the following conditions:

  The above copyright notice and this permission notice shall be
  included in all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

  */

  (function (module) {
  	(function (global, pool, math) {
  	//
  	// The following constants are related to IEEE 754 limits.
  	//

  	var width = 256,        // each RC4 output is 0 <= x < 256
  	    chunks = 6,         // at least six RC4 outputs for each double
  	    digits = 52,        // there are 52 significant digits in a double
  	    rngname = 'random', // rngname: name for Math.random and Math.seedrandom
  	    startdenom = math.pow(width, chunks),
  	    significance = math.pow(2, digits),
  	    overflow = significance * 2,
  	    mask = width - 1,
  	    nodecrypto;         // node.js crypto module, initialized at the bottom.

  	//
  	// seedrandom()
  	// This is the seedrandom function described above.
  	//
  	function seedrandom(seed, options, callback) {
  	  var key = [];
  	  options = (options == true) ? { entropy: true } : (options || {});

  	  // Flatten the seed string or build one from local entropy if needed.
  	  var shortseed = mixkey(flatten(
  	    options.entropy ? [seed, tostring(pool)] :
  	    (seed == null) ? autoseed() : seed, 3), key);

  	  // Use the seed to initialize an ARC4 generator.
  	  var arc4 = new ARC4(key);

  	  // This function returns a random double in [0, 1) that contains
  	  // randomness in every bit of the mantissa of the IEEE 754 value.
  	  var prng = function() {
  	    var n = arc4.g(chunks),             // Start with a numerator n < 2 ^ 48
  	        d = startdenom,                 //   and denominator d = 2 ^ 48.
  	        x = 0;                          //   and no 'extra last byte'.
  	    while (n < significance) {          // Fill up all significant digits by
  	      n = (n + x) * width;              //   shifting numerator and
  	      d *= width;                       //   denominator and generating a
  	      x = arc4.g(1);                    //   new least-significant-byte.
  	    }
  	    while (n >= overflow) {             // To avoid rounding up, before adding
  	      n /= 2;                           //   last byte, shift everything
  	      d /= 2;                           //   right using integer math until
  	      x >>>= 1;                         //   we have exactly the desired bits.
  	    }
  	    return (n + x) / d;                 // Form the number within [0, 1).
  	  };

  	  prng.int32 = function() { return arc4.g(4) | 0; };
  	  prng.quick = function() { return arc4.g(4) / 0x100000000; };
  	  prng.double = prng;

  	  // Mix the randomness into accumulated entropy.
  	  mixkey(tostring(arc4.S), pool);

  	  // Calling convention: what to return as a function of prng, seed, is_math.
  	  return (options.pass || callback ||
  	      function(prng, seed, is_math_call, state) {
  	        if (state) {
  	          // Load the arc4 state from the given state if it has an S array.
  	          if (state.S) { copy(state, arc4); }
  	          // Only provide the .state method if requested via options.state.
  	          prng.state = function() { return copy(arc4, {}); };
  	        }

  	        // If called as a method of Math (Math.seedrandom()), mutate
  	        // Math.random because that is how seedrandom.js has worked since v1.0.
  	        if (is_math_call) { math[rngname] = prng; return seed; }

  	        // Otherwise, it is a newer calling convention, so return the
  	        // prng directly.
  	        else return prng;
  	      })(
  	  prng,
  	  shortseed,
  	  'global' in options ? options.global : (this == math),
  	  options.state);
  	}

  	//
  	// ARC4
  	//
  	// An ARC4 implementation.  The constructor takes a key in the form of
  	// an array of at most (width) integers that should be 0 <= x < (width).
  	//
  	// The g(count) method returns a pseudorandom integer that concatenates
  	// the next (count) outputs from ARC4.  Its return value is a number x
  	// that is in the range 0 <= x < (width ^ count).
  	//
  	function ARC4(key) {
  	  var t, keylen = key.length,
  	      me = this, i = 0, j = me.i = me.j = 0, s = me.S = [];

  	  // The empty key [] is treated as [0].
  	  if (!keylen) { key = [keylen++]; }

  	  // Set up S using the standard key scheduling algorithm.
  	  while (i < width) {
  	    s[i] = i++;
  	  }
  	  for (i = 0; i < width; i++) {
  	    s[i] = s[j = mask & (j + key[i % keylen] + (t = s[i]))];
  	    s[j] = t;
  	  }

  	  // The "g" method returns the next (count) outputs as one number.
  	  (me.g = function(count) {
  	    // Using instance members instead of closure state nearly doubles speed.
  	    var t, r = 0,
  	        i = me.i, j = me.j, s = me.S;
  	    while (count--) {
  	      t = s[i = mask & (i + 1)];
  	      r = r * width + s[mask & ((s[i] = s[j = mask & (j + t)]) + (s[j] = t))];
  	    }
  	    me.i = i; me.j = j;
  	    return r;
  	    // For robust unpredictability, the function call below automatically
  	    // discards an initial batch of values.  This is called RC4-drop[256].
  	    // See http://google.com/search?q=rsa+fluhrer+response&btnI
  	  })(width);
  	}

  	//
  	// copy()
  	// Copies internal state of ARC4 to or from a plain object.
  	//
  	function copy(f, t) {
  	  t.i = f.i;
  	  t.j = f.j;
  	  t.S = f.S.slice();
  	  return t;
  	}
  	//
  	// flatten()
  	// Converts an object tree to nested arrays of strings.
  	//
  	function flatten(obj, depth) {
  	  var result = [], typ = (typeof obj), prop;
  	  if (depth && typ == 'object') {
  	    for (prop in obj) {
  	      try { result.push(flatten(obj[prop], depth - 1)); } catch (e) {}
  	    }
  	  }
  	  return (result.length ? result : typ == 'string' ? obj : obj + '\0');
  	}

  	//
  	// mixkey()
  	// Mixes a string seed into a key that is an array of integers, and
  	// returns a shortened string seed that is equivalent to the result key.
  	//
  	function mixkey(seed, key) {
  	  var stringseed = seed + '', smear, j = 0;
  	  while (j < stringseed.length) {
  	    key[mask & j] =
  	      mask & ((smear ^= key[mask & j] * 19) + stringseed.charCodeAt(j++));
  	  }
  	  return tostring(key);
  	}

  	//
  	// autoseed()
  	// Returns an object for autoseeding, using window.crypto and Node crypto
  	// module if available.
  	//
  	function autoseed() {
  	  try {
  	    var out;
  	    if (nodecrypto && (out = nodecrypto.randomBytes)) {
  	      // The use of 'out' to remember randomBytes makes tight minified code.
  	      out = out(width);
  	    } else {
  	      out = new Uint8Array(width);
  	      (global.crypto || global.msCrypto).getRandomValues(out);
  	    }
  	    return tostring(out);
  	  } catch (e) {
  	    var browser = global.navigator,
  	        plugins = browser && browser.plugins;
  	    return [+new Date, global, plugins, global.screen, tostring(pool)];
  	  }
  	}

  	//
  	// tostring()
  	// Converts an array of charcodes to a string
  	//
  	function tostring(a) {
  	  return String.fromCharCode.apply(0, a);
  	}

  	//
  	// When seedrandom.js is loaded, we immediately mix a few bits
  	// from the built-in RNG into the entropy pool.  Because we do
  	// not want to interfere with deterministic PRNG state later,
  	// seedrandom will not call math.random on its own again after
  	// initialization.
  	//
  	mixkey(math.random(), pool);

  	//
  	// Nodejs and AMD support: export the implementation as a module using
  	// either convention.
  	//
  	if (module.exports) {
  	  module.exports = seedrandom;
  	  // When in node.js, try using crypto package for autoseeding.
  	  try {
  	    nodecrypto = require('crypto');
  	  } catch (ex) {}
  	} else {
  	  // When included as a plain script, set up Math.seedrandom global.
  	  math['seed' + rngname] = seedrandom;
  	}


  	// End anonymous scope, and pass initial values.
  	})(
  	  // global: `self` in browsers (including strict mode and web workers),
  	  // otherwise `this` in Node and other environments
  	  (typeof self !== 'undefined') ? self : commonjsGlobal,
  	  [],     // pool: entropy pool starts empty
  	  Math    // math: package containing random, pow, and seedrandom
  	);
  } (seedrandom$1));

  // A library of seedable RNGs implemented in Javascript.
  //
  // Usage:
  //
  // var seedrandom = require('seedrandom');
  // var random = seedrandom(1); // or any seed.
  // var x = random();       // 0 <= x < 1.  Every bit is random.
  // var x = random.quick(); // 0 <= x < 1.  32 bits of randomness.

  // alea, a 53-bit multiply-with-carry generator by Johannes Baagøe.
  // Period: ~2^116
  // Reported to pass all BigCrush tests.
  var alea = alea$1.exports;

  // xor128, a pure xor-shift generator by George Marsaglia.
  // Period: 2^128-1.
  // Reported to fail: MatrixRank and LinearComp.
  var xor128 = xor128$1.exports;

  // xorwow, George Marsaglia's 160-bit xor-shift combined plus weyl.
  // Period: 2^192-2^32
  // Reported to fail: CollisionOver, SimpPoker, and LinearComp.
  var xorwow = xorwow$1.exports;

  // xorshift7, by François Panneton and Pierre L'ecuyer, takes
  // a different approach: it adds robustness by allowing more shifts
  // than Marsaglia's original three.  It is a 7-shift generator
  // with 256 bits, that passes BigCrush with no systmatic failures.
  // Period 2^256-1.
  // No systematic BigCrush failures reported.
  var xorshift7 = xorshift7$1.exports;

  // xor4096, by Richard Brent, is a 4096-bit xor-shift with a
  // very long period that also adds a Weyl generator. It also passes
  // BigCrush with no systematic failures.  Its long period may
  // be useful if you have many generators and need to avoid
  // collisions.
  // Period: 2^4128-2^32.
  // No systematic BigCrush failures reported.
  var xor4096 = xor4096$1.exports;

  // Tyche-i, by Samuel Neves and Filipe Araujo, is a bit-shifting random
  // number generator derived from ChaCha, a modern stream cipher.
  // https://eden.dei.uc.pt/~sneves/pubs/2011-snfa2.pdf
  // Period: ~2^127
  // No systematic BigCrush failures reported.
  var tychei = tychei$1.exports;

  // The original ARC4-based prng included in this library.
  // Period: ~2^1600
  var sr = seedrandom$1.exports;

  sr.alea = alea;
  sr.xor128 = xor128;
  sr.xorwow = xorwow;
  sr.xorshift7 = xorshift7;
  sr.xor4096 = xor4096;
  sr.tychei = tychei;

  var seedrandom = sr;

  function _defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, _toPropertyKey(descriptor.key), descriptor);
    }
  }
  function _createClass(Constructor, protoProps, staticProps) {
    if (protoProps) _defineProperties(Constructor.prototype, protoProps);
    if (staticProps) _defineProperties(Constructor, staticProps);
    Object.defineProperty(Constructor, "prototype", {
      writable: false
    });
    return Constructor;
  }
  function _inheritsLoose(subClass, superClass) {
    subClass.prototype = Object.create(superClass.prototype);
    subClass.prototype.constructor = subClass;
    _setPrototypeOf(subClass, superClass);
  }
  function _setPrototypeOf(o, p) {
    _setPrototypeOf = Object.setPrototypeOf ? Object.setPrototypeOf.bind() : function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
    return _setPrototypeOf(o, p);
  }
  function _toPrimitive(input, hint) {
    if (typeof input !== "object" || input === null) return input;
    var prim = input[Symbol.toPrimitive];
    if (prim !== undefined) {
      var res = prim.call(input, hint || "default");
      if (typeof res !== "object") return res;
      throw new TypeError("@@toPrimitive must return a primitive value.");
    }
    return (hint === "string" ? String : Number)(input);
  }
  function _toPropertyKey(arg) {
    var key = _toPrimitive(arg, "string");
    return typeof key === "symbol" ? key : String(key);
  }

  var RNG = /*#__PURE__*/function () {
    function RNG() {}
    var _proto = RNG.prototype;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _proto._seed = function _seed(seed, _opts) {
      // TODO: add entropy and stuff
      if (seed === (seed || 0)) {
        return seed;
      } else {
        var strSeed = '' + seed;
        var s = 0;
        for (var k = 0; k < strSeed.length; ++k) {
          s ^= strSeed.charCodeAt(k) | 0;
        }
        return s;
      }
    };
    return RNG;
  }();

  var RNGFunction = /*#__PURE__*/function (_RNG) {
    _inheritsLoose(RNGFunction, _RNG);
    function RNGFunction(thunk, opts) {
      var _this;
      _this = _RNG.call(this) || this;
      _this._rng = void 0;
      _this.seed(thunk, opts);
      return _this;
    }
    var _proto = RNGFunction.prototype;
    _proto.next = function next() {
      return this._rng();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ;
    _proto.seed = function seed(thunk, _opts) {
      this._rng = thunk;
    };
    _proto.clone = function clone(_, opts) {
      return new RNGFunction(this._rng, opts);
    };
    _createClass(RNGFunction, [{
      key: "name",
      get: function get() {
        return 'function';
      }
    }]);
    return RNGFunction;
  }(RNG);

  /**
   * Construct an RNG with variable inputs. Used in calls to Random constructor
   * @param {...*} args - Distribution-specific arguments
   * @return RNG
   *
   * @example
   * new Random(RNGFactory(...args))
   */
  var RNGFactory = (function () {
    var args = [].slice.call(arguments);
    var _args = args,
      _args$ = _args[0],
      arg0 = _args$ === void 0 ? 'default' : _args$;
    switch (typeof arg0) {
      case 'object':
        if (arg0 instanceof RNG) {
          return arg0;
        }
        break;
      case 'function':
        return new RNGFunction(arg0);
      case 'number':
      case 'string':
      default:
        return new RNGFunction(seedrandom.apply(void 0, args));
    }
    throw new Error("invalid RNG \"" + arg0 + "\"");
  });

  var uniform = (function (random, min, max) {
    if (min === void 0) {
      min = 0;
    }
    if (max === void 0) {
      max = 1;
    }
    return function () {
      return random.next() * (max - min) + min;
    };
  });

  function numberValidator(num) {
    return new NumberValidator(num);
  }
  var NumberValidator = function NumberValidator(num) {
    var _this = this;
    this.n = void 0;
    this.isInt = function () {
      if (Number.isInteger(_this.n)) {
        return _this;
      }
      throw new Error("Expected number to be an integer, got " + _this.n);
    };
    this.isPositive = function () {
      if (_this.n > 0) {
        return _this;
      }
      throw new Error("Expected number to be positive, got " + _this.n);
    };
    this.lessThan = function (v) {
      if (_this.n < v) {
        return _this;
      }
      throw new Error("Expected number to be less than " + v + ", got " + _this.n);
    };
    this.greaterThanOrEqual = function (v) {
      if (_this.n >= v) {
        return _this;
      }
      throw new Error("Expected number to be greater than or equal to " + v + ", got " + _this.n);
    };
    this.greaterThan = function (v) {
      if (_this.n > v) {
        return _this;
      }
      throw new Error("Expected number to be greater than " + v + ", got " + _this.n);
    };
    this.n = num;
  };

  var uniformInt = (function (random, min, max) {
    if (min === void 0) {
      min = 0;
    }
    if (max === void 0) {
      max = 1;
    }
    if (max === undefined) {
      max = min === undefined ? 1 : min;
      min = 0;
    }
    numberValidator(min).isInt();
    numberValidator(max).isInt();
    return function () {
      return Math.floor(random.next() * (max - min + 1) + min);
    };
  });

  var uniformBoolean = (function (random) {
    return function () {
      return random.next() >= 0.5;
    };
  });

  var normal = (function (random, mu, sigma) {
    if (mu === void 0) {
      mu = 0;
    }
    if (sigma === void 0) {
      sigma = 1;
    }
    return function () {
      var x, y, r;
      do {
        x = random.next() * 2 - 1;
        y = random.next() * 2 - 1;
        r = x * x + y * y;
      } while (!r || r > 1);
      return mu + sigma * y * Math.sqrt(-2 * Math.log(r) / r);
    };
  });

  var logNormal = (function (random, mu, sigma) {
    if (mu === void 0) {
      mu = 0;
    }
    if (sigma === void 0) {
      sigma = 1;
    }
    var normal = random.normal(mu, sigma);
    return function () {
      return Math.exp(normal());
    };
  });

  var bernoulli = (function (random, p) {
    if (p === void 0) {
      p = 0.5;
    }
    numberValidator(p).greaterThanOrEqual(0).lessThan(1);
    return function () {
      return Math.floor(random.next() + p);
    };
  });

  var binomial = (function (random, n, p) {
    if (n === void 0) {
      n = 1;
    }
    if (p === void 0) {
      p = 0.5;
    }
    numberValidator(n).isInt().isPositive();
    numberValidator(p).greaterThanOrEqual(0).lessThan(1);
    return function () {
      var i = 0;
      var x = 0;
      while (i++ < n) {
        if (random.next() < p) {
          x++;
        }
      }
      return x;
    };
  });

  var geometric = (function (random, p) {
    if (p === void 0) {
      p = 0.5;
    }
    numberValidator(p).greaterThan(0).lessThan(1);
    var invLogP = 1.0 / Math.log(1.0 - p);
    return function () {
      return Math.floor(1 + Math.log(random.next()) * invLogP);
    };
  });

  var logFactorialTable = [0.0, 0.0, 0.69314718055994529, 1.791759469228055, 3.1780538303479458, 4.7874917427820458, 6.5792512120101012, 8.5251613610654147, 10.604602902745251, 12.801827480081469];
  var logFactorial = function logFactorial(k) {
    return logFactorialTable[k];
  };
  var logSqrt2PI = 0.91893853320467267;
  var poisson = (function (random, lambda) {
    if (lambda === void 0) {
      lambda = 1;
    }
    numberValidator(lambda).isPositive();
    if (lambda < 10) {
      // inversion method
      var expMean = Math.exp(-lambda);
      return function () {
        var p = expMean;
        var x = 0;
        var u = random.next();
        while (u > p) {
          u = u - p;
          p = lambda * p / ++x;
        }
        return x;
      };
    } else {
      // generative method
      var smu = Math.sqrt(lambda);
      var b = 0.931 + 2.53 * smu;
      var a = -0.059 + 0.02483 * b;
      var invAlpha = 1.1239 + 1.1328 / (b - 3.4);
      var vR = 0.9277 - 3.6224 / (b - 2);
      return function () {
        while (true) {
          var u = void 0;
          var v = random.next();
          if (v <= 0.86 * vR) {
            u = v / vR - 0.43;
            return Math.floor((2 * a / (0.5 - Math.abs(u)) + b) * u + lambda + 0.445);
          }
          if (v >= vR) {
            u = random.next() - 0.5;
          } else {
            u = v / vR - 0.93;
            u = (u < 0 ? -0.5 : 0.5) - u;
            v = random.next() * vR;
          }
          var us = 0.5 - Math.abs(u);
          if (us < 0.013 && v > us) {
            continue;
          }
          var k = Math.floor((2 * a / us + b) * u + lambda + 0.445);
          v = v * invAlpha / (a / (us * us) + b);
          if (k >= 10) {
            var t = (k + 0.5) * Math.log(lambda / k) - lambda - logSqrt2PI + k - (1 / 12.0 - (1 / 360.0 - 1 / (1260.0 * k * k)) / (k * k)) / k;
            if (Math.log(v * smu) <= t) {
              return k;
            }
          } else if (k >= 0) {
            var _logFactorial;
            var f = (_logFactorial = logFactorial(k)) != null ? _logFactorial : 0;
            if (Math.log(v) <= k * Math.log(lambda) - lambda - f) {
              return k;
            }
          }
        }
      };
    }
  });

  var exponential = (function (random, lambda) {
    if (lambda === void 0) {
      lambda = 1;
    }
    numberValidator(lambda).isPositive();
    return function () {
      return -Math.log(1 - random.next()) / lambda;
    };
  });

  var irwinHall = (function (random, n) {
    if (n === void 0) {
      n = 1;
    }
    numberValidator(n).isInt().greaterThanOrEqual(0);
    return function () {
      var sum = 0;
      for (var i = 0; i < n; ++i) {
        sum += random.next();
      }
      return sum;
    };
  });

  var bates = (function (random, n) {
    if (n === void 0) {
      n = 1;
    }
    numberValidator(n).isInt().isPositive();
    var irwinHall = random.irwinHall(n);
    return function () {
      return irwinHall() / n;
    };
  });

  var pareto = (function (random, alpha) {
    if (alpha === void 0) {
      alpha = 1;
    }
    numberValidator(alpha).greaterThanOrEqual(0);
    var invAlpha = 1.0 / alpha;
    return function () {
      return 1.0 / Math.pow(1.0 - random.next(), invAlpha);
    };
  });

  var RNGMathRandom = /*#__PURE__*/function (_RNG) {
    _inheritsLoose(RNGMathRandom, _RNG);
    function RNGMathRandom() {
      return _RNG.apply(this, arguments) || this;
    }
    var _proto = RNGMathRandom.prototype;
    _proto.next = function next() {
      return Math.random();
    }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ;
    _proto.seed = function seed(_seed, _opts) {
      // intentionally empty
    };
    _proto.clone = function clone() {
      return new RNGMathRandom();
    };
    _createClass(RNGMathRandom, [{
      key: "name",
      get: function get() {
        return 'default';
      }
    }]);
    return RNGMathRandom;
  }(RNG);

  /**
   * Seedable random number generator supporting many common distributions.
   *
   * Defaults to Math.random as its underlying pseudorandom number generator.
   *
   * @name Random
   * @class
   *
   * @param {RNG|function} [rng=Math.random] - Underlying pseudorandom number generator.
   */
  var Random = /*#__PURE__*/function () {
    function Random(rng) {
      var _this = this;
      this._rng = void 0;
      this._patch = void 0;
      this._cache = {};
      this.next = function () {
        return _this._rng.next();
      };
      this["float"] = function (min, max) {
        return _this.uniform(min, max)();
      };
      this["int"] = function (min, max) {
        return _this.uniformInt(min, max)();
      };
      this.integer = function (min, max) {
        return _this.uniformInt(min, max)();
      };
      this.bool = function () {
        return _this.uniformBoolean()();
      };
      this["boolean"] = function () {
        return _this.uniformBoolean()();
      };
      this.uniform = function (min, max) {
        return _this._memoize('uniform', uniform, min, max);
      };
      this.uniformInt = function (min, max) {
        return _this._memoize('uniformInt', uniformInt, min, max);
      };
      this.uniformBoolean = function () {
        return _this._memoize('uniformBoolean', uniformBoolean);
      };
      this.normal = function (mu, sigma) {
        return normal(_this, mu, sigma);
      };
      this.logNormal = function (mu, sigma) {
        return logNormal(_this, mu, sigma);
      };
      this.bernoulli = function (p) {
        return bernoulli(_this, p);
      };
      this.binomial = function (n, p) {
        return binomial(_this, n, p);
      };
      this.geometric = function (p) {
        return geometric(_this, p);
      };
      this.poisson = function (lambda) {
        return poisson(_this, lambda);
      };
      this.exponential = function (lambda) {
        return exponential(_this, lambda);
      };
      this.irwinHall = function (n) {
        return irwinHall(_this, n);
      };
      this.bates = function (n) {
        return bates(_this, n);
      };
      this.pareto = function (alpha) {
        return pareto(_this, alpha);
      };
      if (rng && rng instanceof RNG) {
        this.use(rng);
      } else {
        this.use(new RNGMathRandom());
      }
      this._cache = {};
    }
    /**
     * @member {RNG} Underlying pseudo-random number generator
     */
    var _proto = Random.prototype;
    /**
     * Creates a new `Random` instance, optionally specifying parameters to
     * set a new seed.
     *
     * @see RNG.clone
     *
     * @param {string} [seed] - Optional seed for new RNG.
     * @param {object} [opts] - Optional config for new RNG options.
     * @return {Random}
     */
    _proto.clone = function clone() {
      var args = [].slice.call(arguments);
      if (args.length) {
        return new Random(RNGFactory.apply(void 0, args));
      } else {
        return new Random(this.rng.clone());
      }
    }
    /**
     * Sets the underlying pseudorandom number generator used via
     * either an instance of `seedrandom`, a custom instance of RNG
     * (for PRNG plugins), or a string specifying the PRNG to use
     * along with an optional `seed` and `opts` to initialize the
     * RNG.
     *
     * @example
     * import random from 'random'
     *
     * random.use('example_seedrandom_string')
     * // or
     * random.use(seedrandom('kittens'))
     * // or
     * random.use(Math.random)
     *
     * @param {...*} args
     */;
    _proto.use = function use() {
      this._rng = RNGFactory.apply(void 0, [].slice.call(arguments));
    }
    /**
     * Patches `Math.random` with this Random instance's PRNG.
     */;
    _proto.patch = function patch() {
      if (this._patch) {
        throw new Error('Math.random already patched');
      }
      this._patch = Math.random;
      Math.random = this.uniform();
    }
    /**
     * Restores a previously patched `Math.random` to its original value.
     */;
    _proto.unpatch = function unpatch() {
      if (this._patch) {
        Math.random = this._patch;
        delete this._patch;
      }
    }
    // --------------------------------------------------------------------------
    // Uniform utility functions
    // --------------------------------------------------------------------------
    /**
     * Convenience wrapper around `this.rng.next()`
     *
     * Returns a floating point number in [0, 1).
     *
     * @return {number}
     */;
    /**
     * Returns an item chosen uniformly at trandom from the given array.
     *
     * Convence wrapper around `random.uniformInt()`
     *
     * @param {Array<T>} [array] - Lower bound (integer, inclusive)
     * @return {T | undefined}
     */
    _proto.choice = function choice(array) {
      if (!Array.isArray(array)) {
        throw new Error("Random.choice expected input to be an array, got " + typeof array);
      }
      var length = array == null ? void 0 : array.length;
      if (length > 0) {
        var index = this.uniformInt(0, length - 1)();
        return array[index];
      } else {
        return undefined;
      }
    }
    // --------------------------------------------------------------------------
    // Uniform distributions
    // --------------------------------------------------------------------------
    /**
     * Generates a [Continuous uniform distribution](https://en.wikipedia.org/wiki/Uniform_distribution_(continuous)).
     *
     * @param {number} [min=0] - Lower bound (float, inclusive)
     * @param {number} [max=1] - Upper bound (float, exclusive)
     * @return {function}
     */;
    // --------------------------------------------------------------------------
    // Internal
    // --------------------------------------------------------------------------
    /**
     * Memoizes distributions to ensure they're only created when necessary.
     *
     * Returns a thunk which that returns independent, identically distributed
     * samples from the specified distribution.
     *
     * @private
     *
     * @param {string} label - Name of distribution
     * @param {function} getter - Function which generates a new distribution
     * @param {...*} args - Distribution-specific arguments
     *
     * @return {function}
     */
    _proto._memoize = function _memoize(label, getter) {
      var args = [].slice.call(arguments, 2);
      var key = "" + args.join(';');
      var value = this._cache[label];
      if (value === undefined || value.key !== key) {
        value = {
          key: key,
          distribution: getter.apply(void 0, [this].concat(args))
        };
        this._cache[label] = value;
      }
      return value.distribution;
    };
    _createClass(Random, [{
      key: "rng",
      get: function get() {
        return this._rng;
      }
    }]);
    return Random;
  }();
  // defaults to Math.random as its RNG
  new Random();

  const ALPHA_MIN = 0.001;
  const MAX_POINT_SIZE = 64;
  class Store {
      constructor() {
          this.pointsTextureSize = 0;
          this.linksTextureSize = 0;
          this.alpha = 1;
          this.transform = create$4();
          this.backgroundColor = [0, 0, 0, 0];
          this.screenSize = [0, 0];
          this.mousePosition = [0, 0];
          this.screenMousePosition = [0, 0];
          this.selectedArea = [[0, 0], [0, 0]];
          this.isSimulationRunning = false;
          this.simulationProgress = 0;
          this.selectedIndices = null;
          this.maxPointSize = MAX_POINT_SIZE;
          this.alphaTarget = 0;
          this.scaleNodeX = linear();
          this.scaleNodeY = linear();
          this.random = new Random();
          this.alphaDecay = (decay) => 1 - Math.pow(ALPHA_MIN, 1 / decay);
      }
      addRandomSeed(seed) {
          this.random = this.random.clone(seed);
      }
      getRandomFloat(min, max) {
          return this.random.float(min, max);
      }
      updateScreenSize(width, height, spaceSize) {
          this.screenSize = [width, height];
          this.scaleNodeX
              .domain([0, spaceSize])
              .range([(width - spaceSize) / 2, (width + spaceSize) / 2]);
          this.scaleNodeY
              .domain([spaceSize, 0])
              .range([(height - spaceSize) / 2, (height + spaceSize) / 2]);
      }
      scaleX(x) {
          return this.scaleNodeX(x);
      }
      scaleY(y) {
          return this.scaleNodeY(y);
      }
      addAlpha(decay) {
          return (this.alphaTarget - this.alpha) * this.alphaDecay(decay);
      }
  }

  var xhtml = "http://www.w3.org/1999/xhtml";

  var namespaces = {
    svg: "http://www.w3.org/2000/svg",
    xhtml: xhtml,
    xlink: "http://www.w3.org/1999/xlink",
    xml: "http://www.w3.org/XML/1998/namespace",
    xmlns: "http://www.w3.org/2000/xmlns/"
  };

  function namespace(name) {
    var prefix = name += "", i = prefix.indexOf(":");
    if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
    return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name; // eslint-disable-line no-prototype-builtins
  }

  function creatorInherit(name) {
    return function() {
      var document = this.ownerDocument,
          uri = this.namespaceURI;
      return uri === xhtml && document.documentElement.namespaceURI === xhtml
          ? document.createElement(name)
          : document.createElementNS(uri, name);
    };
  }

  function creatorFixed(fullname) {
    return function() {
      return this.ownerDocument.createElementNS(fullname.space, fullname.local);
    };
  }

  function creator(name) {
    var fullname = namespace(name);
    return (fullname.local
        ? creatorFixed
        : creatorInherit)(fullname);
  }

  function none() {}

  function selector(selector) {
    return selector == null ? none : function() {
      return this.querySelector(selector);
    };
  }

  function selection_select(select) {
    if (typeof select !== "function") select = selector(select);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
        if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
          if ("__data__" in node) subnode.__data__ = node.__data__;
          subgroup[i] = subnode;
        }
      }
    }

    return new Selection(subgroups, this._parents);
  }

  function array(x) {
    return typeof x === "object" && "length" in x
      ? x // Array, TypedArray, NodeList, array-like
      : Array.from(x); // Map, Set, iterable, string, or anything else
  }

  function empty() {
    return [];
  }

  function selectorAll(selector) {
    return selector == null ? empty : function() {
      return this.querySelectorAll(selector);
    };
  }

  function arrayAll(select) {
    return function() {
      var group = select.apply(this, arguments);
      return group == null ? [] : array(group);
    };
  }

  function selection_selectAll(select) {
    if (typeof select === "function") select = arrayAll(select);
    else select = selectorAll(select);

    for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          subgroups.push(select.call(node, node.__data__, i, group));
          parents.push(node);
        }
      }
    }

    return new Selection(subgroups, parents);
  }

  function matcher(selector) {
    return function() {
      return this.matches(selector);
    };
  }

  function childMatcher(selector) {
    return function(node) {
      return node.matches(selector);
    };
  }

  var find = Array.prototype.find;

  function childFind(match) {
    return function() {
      return find.call(this.children, match);
    };
  }

  function childFirst() {
    return this.firstElementChild;
  }

  function selection_selectChild(match) {
    return this.select(match == null ? childFirst
        : childFind(typeof match === "function" ? match : childMatcher(match)));
  }

  var filter = Array.prototype.filter;

  function children() {
    return this.children;
  }

  function childrenFilter(match) {
    return function() {
      return filter.call(this.children, match);
    };
  }

  function selection_selectChildren(match) {
    return this.selectAll(match == null ? children
        : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
  }

  function selection_filter(match) {
    if (typeof match !== "function") match = matcher(match);

    for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
        if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
          subgroup.push(node);
        }
      }
    }

    return new Selection(subgroups, this._parents);
  }

  function sparse(update) {
    return new Array(update.length);
  }

  function selection_enter() {
    return new Selection(this._enter || this._groups.map(sparse), this._parents);
  }

  function EnterNode(parent, datum) {
    this.ownerDocument = parent.ownerDocument;
    this.namespaceURI = parent.namespaceURI;
    this._next = null;
    this._parent = parent;
    this.__data__ = datum;
  }

  EnterNode.prototype = {
    constructor: EnterNode,
    appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
    insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
    querySelector: function(selector) { return this._parent.querySelector(selector); },
    querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
  };

  function constant$1(x) {
    return function() {
      return x;
    };
  }

  function bindIndex(parent, group, enter, update, exit, data) {
    var i = 0,
        node,
        groupLength = group.length,
        dataLength = data.length;

    // Put any non-null nodes that fit into update.
    // Put any null nodes into enter.
    // Put any remaining data into enter.
    for (; i < dataLength; ++i) {
      if (node = group[i]) {
        node.__data__ = data[i];
        update[i] = node;
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }

    // Put any non-null nodes that don’t fit into exit.
    for (; i < groupLength; ++i) {
      if (node = group[i]) {
        exit[i] = node;
      }
    }
  }

  function bindKey(parent, group, enter, update, exit, data, key) {
    var i,
        node,
        nodeByKeyValue = new Map,
        groupLength = group.length,
        dataLength = data.length,
        keyValues = new Array(groupLength),
        keyValue;

    // Compute the key for each node.
    // If multiple nodes have the same key, the duplicates are added to exit.
    for (i = 0; i < groupLength; ++i) {
      if (node = group[i]) {
        keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
        if (nodeByKeyValue.has(keyValue)) {
          exit[i] = node;
        } else {
          nodeByKeyValue.set(keyValue, node);
        }
      }
    }

    // Compute the key for each datum.
    // If there a node associated with this key, join and add it to update.
    // If there is not (or the key is a duplicate), add it to enter.
    for (i = 0; i < dataLength; ++i) {
      keyValue = key.call(parent, data[i], i, data) + "";
      if (node = nodeByKeyValue.get(keyValue)) {
        update[i] = node;
        node.__data__ = data[i];
        nodeByKeyValue.delete(keyValue);
      } else {
        enter[i] = new EnterNode(parent, data[i]);
      }
    }

    // Add any remaining nodes that were not bound to data to exit.
    for (i = 0; i < groupLength; ++i) {
      if ((node = group[i]) && (nodeByKeyValue.get(keyValues[i]) === node)) {
        exit[i] = node;
      }
    }
  }

  function datum(node) {
    return node.__data__;
  }

  function selection_data(value, key) {
    if (!arguments.length) return Array.from(this, datum);

    var bind = key ? bindKey : bindIndex,
        parents = this._parents,
        groups = this._groups;

    if (typeof value !== "function") value = constant$1(value);

    for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
      var parent = parents[j],
          group = groups[j],
          groupLength = group.length,
          data = array(value.call(parent, parent && parent.__data__, j, parents)),
          dataLength = data.length,
          enterGroup = enter[j] = new Array(dataLength),
          updateGroup = update[j] = new Array(dataLength),
          exitGroup = exit[j] = new Array(groupLength);

      bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

      // Now connect the enter nodes to their following update node, such that
      // appendChild can insert the materialized enter node before this node,
      // rather than at the end of the parent node.
      for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
        if (previous = enterGroup[i0]) {
          if (i0 >= i1) i1 = i0 + 1;
          while (!(next = updateGroup[i1]) && ++i1 < dataLength);
          previous._next = next || null;
        }
      }
    }

    update = new Selection(update, parents);
    update._enter = enter;
    update._exit = exit;
    return update;
  }

  function selection_exit() {
    return new Selection(this._exit || this._groups.map(sparse), this._parents);
  }

  function selection_join(onenter, onupdate, onexit) {
    var enter = this.enter(), update = this, exit = this.exit();
    enter = typeof onenter === "function" ? onenter(enter) : enter.append(onenter + "");
    if (onupdate != null) update = onupdate(update);
    if (onexit == null) exit.remove(); else onexit(exit);
    return enter && update ? enter.merge(update).order() : update;
  }

  function selection_merge(selection) {
    if (!(selection instanceof Selection)) throw new Error("invalid merge");

    for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
      for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group0[i] || group1[i]) {
          merge[i] = node;
        }
      }
    }

    for (; j < m0; ++j) {
      merges[j] = groups0[j];
    }

    return new Selection(merges, this._parents);
  }

  function selection_order() {

    for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
      for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
        if (node = group[i]) {
          if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
          next = node;
        }
      }
    }

    return this;
  }

  function selection_sort(compare) {
    if (!compare) compare = ascending;

    function compareNode(a, b) {
      return a && b ? compare(a.__data__, b.__data__) : !a - !b;
    }

    for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
      for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
        if (node = group[i]) {
          sortgroup[i] = node;
        }
      }
      sortgroup.sort(compareNode);
    }

    return new Selection(sortgroups, this._parents).order();
  }

  function ascending(a, b) {
    return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
  }

  function selection_call() {
    var callback = arguments[0];
    arguments[0] = this;
    callback.apply(null, arguments);
    return this;
  }

  function selection_nodes() {
    return Array.from(this);
  }

  function selection_node() {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
        var node = group[i];
        if (node) return node;
      }
    }

    return null;
  }

  function selection_size() {
    let size = 0;
    for (const node of this) ++size; // eslint-disable-line no-unused-vars
    return size;
  }

  function selection_empty() {
    return !this.node();
  }

  function selection_each(callback) {

    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if (node = group[i]) callback.call(node, node.__data__, i, group);
      }
    }

    return this;
  }

  function attrRemove(name) {
    return function() {
      this.removeAttribute(name);
    };
  }

  function attrRemoveNS(fullname) {
    return function() {
      this.removeAttributeNS(fullname.space, fullname.local);
    };
  }

  function attrConstant(name, value) {
    return function() {
      this.setAttribute(name, value);
    };
  }

  function attrConstantNS(fullname, value) {
    return function() {
      this.setAttributeNS(fullname.space, fullname.local, value);
    };
  }

  function attrFunction(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttribute(name);
      else this.setAttribute(name, v);
    };
  }

  function attrFunctionNS(fullname, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
      else this.setAttributeNS(fullname.space, fullname.local, v);
    };
  }

  function selection_attr(name, value) {
    var fullname = namespace(name);

    if (arguments.length < 2) {
      var node = this.node();
      return fullname.local
          ? node.getAttributeNS(fullname.space, fullname.local)
          : node.getAttribute(fullname);
    }

    return this.each((value == null
        ? (fullname.local ? attrRemoveNS : attrRemove) : (typeof value === "function"
        ? (fullname.local ? attrFunctionNS : attrFunction)
        : (fullname.local ? attrConstantNS : attrConstant)))(fullname, value));
  }

  function defaultView(node) {
    return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
        || (node.document && node) // node is a Window
        || node.defaultView; // node is a Document
  }

  function styleRemove(name) {
    return function() {
      this.style.removeProperty(name);
    };
  }

  function styleConstant(name, value, priority) {
    return function() {
      this.style.setProperty(name, value, priority);
    };
  }

  function styleFunction(name, value, priority) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) this.style.removeProperty(name);
      else this.style.setProperty(name, v, priority);
    };
  }

  function selection_style(name, value, priority) {
    return arguments.length > 1
        ? this.each((value == null
              ? styleRemove : typeof value === "function"
              ? styleFunction
              : styleConstant)(name, value, priority == null ? "" : priority))
        : styleValue(this.node(), name);
  }

  function styleValue(node, name) {
    return node.style.getPropertyValue(name)
        || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
  }

  function propertyRemove(name) {
    return function() {
      delete this[name];
    };
  }

  function propertyConstant(name, value) {
    return function() {
      this[name] = value;
    };
  }

  function propertyFunction(name, value) {
    return function() {
      var v = value.apply(this, arguments);
      if (v == null) delete this[name];
      else this[name] = v;
    };
  }

  function selection_property(name, value) {
    return arguments.length > 1
        ? this.each((value == null
            ? propertyRemove : typeof value === "function"
            ? propertyFunction
            : propertyConstant)(name, value))
        : this.node()[name];
  }

  function classArray(string) {
    return string.trim().split(/^|\s+/);
  }

  function classList(node) {
    return node.classList || new ClassList(node);
  }

  function ClassList(node) {
    this._node = node;
    this._names = classArray(node.getAttribute("class") || "");
  }

  ClassList.prototype = {
    add: function(name) {
      var i = this._names.indexOf(name);
      if (i < 0) {
        this._names.push(name);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    remove: function(name) {
      var i = this._names.indexOf(name);
      if (i >= 0) {
        this._names.splice(i, 1);
        this._node.setAttribute("class", this._names.join(" "));
      }
    },
    contains: function(name) {
      return this._names.indexOf(name) >= 0;
    }
  };

  function classedAdd(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.add(names[i]);
  }

  function classedRemove(node, names) {
    var list = classList(node), i = -1, n = names.length;
    while (++i < n) list.remove(names[i]);
  }

  function classedTrue(names) {
    return function() {
      classedAdd(this, names);
    };
  }

  function classedFalse(names) {
    return function() {
      classedRemove(this, names);
    };
  }

  function classedFunction(names, value) {
    return function() {
      (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
    };
  }

  function selection_classed(name, value) {
    var names = classArray(name + "");

    if (arguments.length < 2) {
      var list = classList(this.node()), i = -1, n = names.length;
      while (++i < n) if (!list.contains(names[i])) return false;
      return true;
    }

    return this.each((typeof value === "function"
        ? classedFunction : value
        ? classedTrue
        : classedFalse)(names, value));
  }

  function textRemove() {
    this.textContent = "";
  }

  function textConstant(value) {
    return function() {
      this.textContent = value;
    };
  }

  function textFunction(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.textContent = v == null ? "" : v;
    };
  }

  function selection_text(value) {
    return arguments.length
        ? this.each(value == null
            ? textRemove : (typeof value === "function"
            ? textFunction
            : textConstant)(value))
        : this.node().textContent;
  }

  function htmlRemove() {
    this.innerHTML = "";
  }

  function htmlConstant(value) {
    return function() {
      this.innerHTML = value;
    };
  }

  function htmlFunction(value) {
    return function() {
      var v = value.apply(this, arguments);
      this.innerHTML = v == null ? "" : v;
    };
  }

  function selection_html(value) {
    return arguments.length
        ? this.each(value == null
            ? htmlRemove : (typeof value === "function"
            ? htmlFunction
            : htmlConstant)(value))
        : this.node().innerHTML;
  }

  function raise() {
    if (this.nextSibling) this.parentNode.appendChild(this);
  }

  function selection_raise() {
    return this.each(raise);
  }

  function lower() {
    if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
  }

  function selection_lower() {
    return this.each(lower);
  }

  function selection_append(name) {
    var create = typeof name === "function" ? name : creator(name);
    return this.select(function() {
      return this.appendChild(create.apply(this, arguments));
    });
  }

  function constantNull() {
    return null;
  }

  function selection_insert(name, before) {
    var create = typeof name === "function" ? name : creator(name),
        select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
    return this.select(function() {
      return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
    });
  }

  function remove() {
    var parent = this.parentNode;
    if (parent) parent.removeChild(this);
  }

  function selection_remove() {
    return this.each(remove);
  }

  function selection_cloneShallow() {
    var clone = this.cloneNode(false), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }

  function selection_cloneDeep() {
    var clone = this.cloneNode(true), parent = this.parentNode;
    return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
  }

  function selection_clone(deep) {
    return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
  }

  function selection_datum(value) {
    return arguments.length
        ? this.property("__data__", value)
        : this.node().__data__;
  }

  function contextListener(listener) {
    return function(event) {
      listener.call(this, event, this.__data__);
    };
  }

  function parseTypenames(typenames) {
    return typenames.trim().split(/^|\s+/).map(function(t) {
      var name = "", i = t.indexOf(".");
      if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
      return {type: t, name: name};
    });
  }

  function onRemove(typename) {
    return function() {
      var on = this.__on;
      if (!on) return;
      for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
        if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.options);
        } else {
          on[++i] = o;
        }
      }
      if (++i) on.length = i;
      else delete this.__on;
    };
  }

  function onAdd(typename, value, options) {
    return function() {
      var on = this.__on, o, listener = contextListener(value);
      if (on) for (var j = 0, m = on.length; j < m; ++j) {
        if ((o = on[j]).type === typename.type && o.name === typename.name) {
          this.removeEventListener(o.type, o.listener, o.options);
          this.addEventListener(o.type, o.listener = listener, o.options = options);
          o.value = value;
          return;
        }
      }
      this.addEventListener(typename.type, listener, options);
      o = {type: typename.type, name: typename.name, value: value, listener: listener, options: options};
      if (!on) this.__on = [o];
      else on.push(o);
    };
  }

  function selection_on(typename, value, options) {
    var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

    if (arguments.length < 2) {
      var on = this.node().__on;
      if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
        for (i = 0, o = on[j]; i < n; ++i) {
          if ((t = typenames[i]).type === o.type && t.name === o.name) {
            return o.value;
          }
        }
      }
      return;
    }

    on = value ? onAdd : onRemove;
    for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
    return this;
  }

  function dispatchEvent(node, type, params) {
    var window = defaultView(node),
        event = window.CustomEvent;

    if (typeof event === "function") {
      event = new event(type, params);
    } else {
      event = window.document.createEvent("Event");
      if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
      else event.initEvent(type, false, false);
    }

    node.dispatchEvent(event);
  }

  function dispatchConstant(type, params) {
    return function() {
      return dispatchEvent(this, type, params);
    };
  }

  function dispatchFunction(type, params) {
    return function() {
      return dispatchEvent(this, type, params.apply(this, arguments));
    };
  }

  function selection_dispatch(type, params) {
    return this.each((typeof params === "function"
        ? dispatchFunction
        : dispatchConstant)(type, params));
  }

  function* selection_iterator() {
    for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
      for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
        if (node = group[i]) yield node;
      }
    }
  }

  var root = [null];

  function Selection(groups, parents) {
    this._groups = groups;
    this._parents = parents;
  }

  function selection_selection() {
    return this;
  }

  Selection.prototype = {
    constructor: Selection,
    select: selection_select,
    selectAll: selection_selectAll,
    selectChild: selection_selectChild,
    selectChildren: selection_selectChildren,
    filter: selection_filter,
    data: selection_data,
    enter: selection_enter,
    exit: selection_exit,
    join: selection_join,
    merge: selection_merge,
    selection: selection_selection,
    order: selection_order,
    sort: selection_sort,
    call: selection_call,
    nodes: selection_nodes,
    node: selection_node,
    size: selection_size,
    empty: selection_empty,
    each: selection_each,
    attr: selection_attr,
    style: selection_style,
    property: selection_property,
    classed: selection_classed,
    text: selection_text,
    html: selection_html,
    raise: selection_raise,
    lower: selection_lower,
    append: selection_append,
    insert: selection_insert,
    remove: selection_remove,
    clone: selection_clone,
    datum: selection_datum,
    on: selection_on,
    dispatch: selection_dispatch,
    [Symbol.iterator]: selection_iterator
  };

  function select(selector) {
    return typeof selector === "string"
        ? new Selection([[document.querySelector(selector)]], [document.documentElement])
        : new Selection([[selector]], root);
  }

  var nextId = 0;

  function Local() {
    this._ = "@" + (++nextId).toString(36);
  }

  Local.prototype = {
    constructor: Local,
    get: function(node) {
      var id = this._;
      while (!(id in node)) if (!(node = node.parentNode)) return;
      return node[id];
    },
    set: function(node, value) {
      return node[this._] = value;
    },
    remove: function(node) {
      return this._ in node && delete node[this._];
    },
    toString: function() {
      return this._;
    }
  };

  function noevent$1(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  function dragDisable(view) {
    var root = view.document.documentElement,
        selection = select(view).on("dragstart.drag", noevent$1, true);
    if ("onselectstart" in root) {
      selection.on("selectstart.drag", noevent$1, true);
    } else {
      root.__noselect = root.style.MozUserSelect;
      root.style.MozUserSelect = "none";
    }
  }

  function yesdrag(view, noclick) {
    var root = view.document.documentElement,
        selection = select(view).on("dragstart.drag", null);
    if (noclick) {
      selection.on("click.drag", noevent$1, true);
      setTimeout(function() { selection.on("click.drag", null); }, 0);
    }
    if ("onselectstart" in root) {
      selection.on("selectstart.drag", null);
    } else {
      root.style.MozUserSelect = root.__noselect;
      delete root.__noselect;
    }
  }

  var constant = x => () => x;

  function ZoomEvent(type, {
    sourceEvent,
    target,
    transform,
    dispatch
  }) {
    Object.defineProperties(this, {
      type: {value: type, enumerable: true, configurable: true},
      sourceEvent: {value: sourceEvent, enumerable: true, configurable: true},
      target: {value: target, enumerable: true, configurable: true},
      transform: {value: transform, enumerable: true, configurable: true},
      _: {value: dispatch}
    });
  }

  function Transform(k, x, y) {
    this.k = k;
    this.x = x;
    this.y = y;
  }

  Transform.prototype = {
    constructor: Transform,
    scale: function(k) {
      return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
    },
    translate: function(x, y) {
      return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
    },
    apply: function(point) {
      return [point[0] * this.k + this.x, point[1] * this.k + this.y];
    },
    applyX: function(x) {
      return x * this.k + this.x;
    },
    applyY: function(y) {
      return y * this.k + this.y;
    },
    invert: function(location) {
      return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
    },
    invertX: function(x) {
      return (x - this.x) / this.k;
    },
    invertY: function(y) {
      return (y - this.y) / this.k;
    },
    rescaleX: function(x) {
      return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
    },
    rescaleY: function(y) {
      return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
    },
    toString: function() {
      return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
    }
  };

  var identity = new Transform(1, 0, 0);

  Transform.prototype;

  function nopropagation(event) {
    event.stopImmediatePropagation();
  }

  function noevent(event) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }

  // Ignore right-click, since that should open the context menu.
  // except for pinch-to-zoom, which is sent as a wheel+ctrlKey event
  function defaultFilter(event) {
    return (!event.ctrlKey || event.type === 'wheel') && !event.button;
  }

  function defaultExtent() {
    var e = this;
    if (e instanceof SVGElement) {
      e = e.ownerSVGElement || e;
      if (e.hasAttribute("viewBox")) {
        e = e.viewBox.baseVal;
        return [[e.x, e.y], [e.x + e.width, e.y + e.height]];
      }
      return [[0, 0], [e.width.baseVal.value, e.height.baseVal.value]];
    }
    return [[0, 0], [e.clientWidth, e.clientHeight]];
  }

  function defaultTransform() {
    return this.__zoom || identity;
  }

  function defaultWheelDelta(event) {
    return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) * (event.ctrlKey ? 10 : 1);
  }

  function defaultTouchable() {
    return navigator.maxTouchPoints || ("ontouchstart" in this);
  }

  function defaultConstrain(transform, extent, translateExtent) {
    var dx0 = transform.invertX(extent[0][0]) - translateExtent[0][0],
        dx1 = transform.invertX(extent[1][0]) - translateExtent[1][0],
        dy0 = transform.invertY(extent[0][1]) - translateExtent[0][1],
        dy1 = transform.invertY(extent[1][1]) - translateExtent[1][1];
    return transform.translate(
      dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1),
      dy1 > dy0 ? (dy0 + dy1) / 2 : Math.min(0, dy0) || Math.max(0, dy1)
    );
  }

  function zoom() {
    var filter = defaultFilter,
        extent = defaultExtent,
        constrain = defaultConstrain,
        wheelDelta = defaultWheelDelta,
        touchable = defaultTouchable,
        scaleExtent = [0, Infinity],
        translateExtent = [[-Infinity, -Infinity], [Infinity, Infinity]],
        duration = 250,
        interpolate = interpolateZoom,
        listeners = dispatch("start", "zoom", "end"),
        touchstarting,
        touchfirst,
        touchending,
        touchDelay = 500,
        wheelDelay = 150,
        clickDistance2 = 0,
        tapDistance = 10;

    function zoom(selection) {
      selection
          .property("__zoom", defaultTransform)
          .on("wheel.zoom", wheeled, {passive: false})
          .on("mousedown.zoom", mousedowned)
          .on("dblclick.zoom", dblclicked)
        .filter(touchable)
          .on("touchstart.zoom", touchstarted)
          .on("touchmove.zoom", touchmoved)
          .on("touchend.zoom touchcancel.zoom", touchended)
          .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
    }

    zoom.transform = function(collection, transform, point, event) {
      var selection = collection.selection ? collection.selection() : collection;
      selection.property("__zoom", defaultTransform);
      if (collection !== selection) {
        schedule(collection, transform, point, event);
      } else {
        selection.interrupt().each(function() {
          gesture(this, arguments)
            .event(event)
            .start()
            .zoom(null, typeof transform === "function" ? transform.apply(this, arguments) : transform)
            .end();
        });
      }
    };

    zoom.scaleBy = function(selection, k, p, event) {
      zoom.scaleTo(selection, function() {
        var k0 = this.__zoom.k,
            k1 = typeof k === "function" ? k.apply(this, arguments) : k;
        return k0 * k1;
      }, p, event);
    };

    zoom.scaleTo = function(selection, k, p, event) {
      zoom.transform(selection, function() {
        var e = extent.apply(this, arguments),
            t0 = this.__zoom,
            p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p,
            p1 = t0.invert(p0),
            k1 = typeof k === "function" ? k.apply(this, arguments) : k;
        return constrain(translate(scale(t0, k1), p0, p1), e, translateExtent);
      }, p, event);
    };

    zoom.translateBy = function(selection, x, y, event) {
      zoom.transform(selection, function() {
        return constrain(this.__zoom.translate(
          typeof x === "function" ? x.apply(this, arguments) : x,
          typeof y === "function" ? y.apply(this, arguments) : y
        ), extent.apply(this, arguments), translateExtent);
      }, null, event);
    };

    zoom.translateTo = function(selection, x, y, p, event) {
      zoom.transform(selection, function() {
        var e = extent.apply(this, arguments),
            t = this.__zoom,
            p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p;
        return constrain(identity.translate(p0[0], p0[1]).scale(t.k).translate(
          typeof x === "function" ? -x.apply(this, arguments) : -x,
          typeof y === "function" ? -y.apply(this, arguments) : -y
        ), e, translateExtent);
      }, p, event);
    };

    function scale(transform, k) {
      k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], k));
      return k === transform.k ? transform : new Transform(k, transform.x, transform.y);
    }

    function translate(transform, p0, p1) {
      var x = p0[0] - p1[0] * transform.k, y = p0[1] - p1[1] * transform.k;
      return x === transform.x && y === transform.y ? transform : new Transform(transform.k, x, y);
    }

    function centroid(extent) {
      return [(+extent[0][0] + +extent[1][0]) / 2, (+extent[0][1] + +extent[1][1]) / 2];
    }

    function schedule(transition, transform, point, event) {
      transition
          .on("start.zoom", function() { gesture(this, arguments).event(event).start(); })
          .on("interrupt.zoom end.zoom", function() { gesture(this, arguments).event(event).end(); })
          .tween("zoom", function() {
            var that = this,
                args = arguments,
                g = gesture(that, args).event(event),
                e = extent.apply(that, args),
                p = point == null ? centroid(e) : typeof point === "function" ? point.apply(that, args) : point,
                w = Math.max(e[1][0] - e[0][0], e[1][1] - e[0][1]),
                a = that.__zoom,
                b = typeof transform === "function" ? transform.apply(that, args) : transform,
                i = interpolate(a.invert(p).concat(w / a.k), b.invert(p).concat(w / b.k));
            return function(t) {
              if (t === 1) t = b; // Avoid rounding error on end.
              else { var l = i(t), k = w / l[2]; t = new Transform(k, p[0] - l[0] * k, p[1] - l[1] * k); }
              g.zoom(null, t);
            };
          });
    }

    function gesture(that, args, clean) {
      return (!clean && that.__zooming) || new Gesture(that, args);
    }

    function Gesture(that, args) {
      this.that = that;
      this.args = args;
      this.active = 0;
      this.sourceEvent = null;
      this.extent = extent.apply(that, args);
      this.taps = 0;
    }

    Gesture.prototype = {
      event: function(event) {
        if (event) this.sourceEvent = event;
        return this;
      },
      start: function() {
        if (++this.active === 1) {
          this.that.__zooming = this;
          this.emit("start");
        }
        return this;
      },
      zoom: function(key, transform) {
        if (this.mouse && key !== "mouse") this.mouse[1] = transform.invert(this.mouse[0]);
        if (this.touch0 && key !== "touch") this.touch0[1] = transform.invert(this.touch0[0]);
        if (this.touch1 && key !== "touch") this.touch1[1] = transform.invert(this.touch1[0]);
        this.that.__zoom = transform;
        this.emit("zoom");
        return this;
      },
      end: function() {
        if (--this.active === 0) {
          delete this.that.__zooming;
          this.emit("end");
        }
        return this;
      },
      emit: function(type) {
        var d = select$1(this.that).datum();
        listeners.call(
          type,
          this.that,
          new ZoomEvent(type, {
            sourceEvent: this.sourceEvent,
            target: zoom,
            type,
            transform: this.that.__zoom,
            dispatch: listeners
          }),
          d
        );
      }
    };

    function wheeled(event, ...args) {
      if (!filter.apply(this, arguments)) return;
      var g = gesture(this, args).event(event),
          t = this.__zoom,
          k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], t.k * Math.pow(2, wheelDelta.apply(this, arguments)))),
          p = pointer(event);

      // If the mouse is in the same location as before, reuse it.
      // If there were recent wheel events, reset the wheel idle timeout.
      if (g.wheel) {
        if (g.mouse[0][0] !== p[0] || g.mouse[0][1] !== p[1]) {
          g.mouse[1] = t.invert(g.mouse[0] = p);
        }
        clearTimeout(g.wheel);
      }

      // If this wheel event won’t trigger a transform change, ignore it.
      else if (t.k === k) return;

      // Otherwise, capture the mouse point and location at the start.
      else {
        g.mouse = [p, t.invert(p)];
        interrupt(this);
        g.start();
      }

      noevent(event);
      g.wheel = setTimeout(wheelidled, wheelDelay);
      g.zoom("mouse", constrain(translate(scale(t, k), g.mouse[0], g.mouse[1]), g.extent, translateExtent));

      function wheelidled() {
        g.wheel = null;
        g.end();
      }
    }

    function mousedowned(event, ...args) {
      if (touchending || !filter.apply(this, arguments)) return;
      var currentTarget = event.currentTarget,
          g = gesture(this, args, true).event(event),
          v = select$1(event.view).on("mousemove.zoom", mousemoved, true).on("mouseup.zoom", mouseupped, true),
          p = pointer(event, currentTarget),
          x0 = event.clientX,
          y0 = event.clientY;

      dragDisable(event.view);
      nopropagation(event);
      g.mouse = [p, this.__zoom.invert(p)];
      interrupt(this);
      g.start();

      function mousemoved(event) {
        noevent(event);
        if (!g.moved) {
          var dx = event.clientX - x0, dy = event.clientY - y0;
          g.moved = dx * dx + dy * dy > clickDistance2;
        }
        g.event(event)
         .zoom("mouse", constrain(translate(g.that.__zoom, g.mouse[0] = pointer(event, currentTarget), g.mouse[1]), g.extent, translateExtent));
      }

      function mouseupped(event) {
        v.on("mousemove.zoom mouseup.zoom", null);
        yesdrag(event.view, g.moved);
        noevent(event);
        g.event(event).end();
      }
    }

    function dblclicked(event, ...args) {
      if (!filter.apply(this, arguments)) return;
      var t0 = this.__zoom,
          p0 = pointer(event.changedTouches ? event.changedTouches[0] : event, this),
          p1 = t0.invert(p0),
          k1 = t0.k * (event.shiftKey ? 0.5 : 2),
          t1 = constrain(translate(scale(t0, k1), p0, p1), extent.apply(this, args), translateExtent);

      noevent(event);
      if (duration > 0) select$1(this).transition().duration(duration).call(schedule, t1, p0, event);
      else select$1(this).call(zoom.transform, t1, p0, event);
    }

    function touchstarted(event, ...args) {
      if (!filter.apply(this, arguments)) return;
      var touches = event.touches,
          n = touches.length,
          g = gesture(this, args, event.changedTouches.length === n).event(event),
          started, i, t, p;

      nopropagation(event);
      for (i = 0; i < n; ++i) {
        t = touches[i], p = pointer(t, this);
        p = [p, this.__zoom.invert(p), t.identifier];
        if (!g.touch0) g.touch0 = p, started = true, g.taps = 1 + !!touchstarting;
        else if (!g.touch1 && g.touch0[2] !== p[2]) g.touch1 = p, g.taps = 0;
      }

      if (touchstarting) touchstarting = clearTimeout(touchstarting);

      if (started) {
        if (g.taps < 2) touchfirst = p[0], touchstarting = setTimeout(function() { touchstarting = null; }, touchDelay);
        interrupt(this);
        g.start();
      }
    }

    function touchmoved(event, ...args) {
      if (!this.__zooming) return;
      var g = gesture(this, args).event(event),
          touches = event.changedTouches,
          n = touches.length, i, t, p, l;

      noevent(event);
      for (i = 0; i < n; ++i) {
        t = touches[i], p = pointer(t, this);
        if (g.touch0 && g.touch0[2] === t.identifier) g.touch0[0] = p;
        else if (g.touch1 && g.touch1[2] === t.identifier) g.touch1[0] = p;
      }
      t = g.that.__zoom;
      if (g.touch1) {
        var p0 = g.touch0[0], l0 = g.touch0[1],
            p1 = g.touch1[0], l1 = g.touch1[1],
            dp = (dp = p1[0] - p0[0]) * dp + (dp = p1[1] - p0[1]) * dp,
            dl = (dl = l1[0] - l0[0]) * dl + (dl = l1[1] - l0[1]) * dl;
        t = scale(t, Math.sqrt(dp / dl));
        p = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
        l = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
      }
      else if (g.touch0) p = g.touch0[0], l = g.touch0[1];
      else return;

      g.zoom("touch", constrain(translate(t, p, l), g.extent, translateExtent));
    }

    function touchended(event, ...args) {
      if (!this.__zooming) return;
      var g = gesture(this, args).event(event),
          touches = event.changedTouches,
          n = touches.length, i, t;

      nopropagation(event);
      if (touchending) clearTimeout(touchending);
      touchending = setTimeout(function() { touchending = null; }, touchDelay);
      for (i = 0; i < n; ++i) {
        t = touches[i];
        if (g.touch0 && g.touch0[2] === t.identifier) delete g.touch0;
        else if (g.touch1 && g.touch1[2] === t.identifier) delete g.touch1;
      }
      if (g.touch1 && !g.touch0) g.touch0 = g.touch1, delete g.touch1;
      if (g.touch0) g.touch0[1] = this.__zoom.invert(g.touch0[0]);
      else {
        g.end();
        // If this was a dbltap, reroute to the (optional) dblclick.zoom handler.
        if (g.taps === 2) {
          t = pointer(t, this);
          if (Math.hypot(touchfirst[0] - t[0], touchfirst[1] - t[1]) < tapDistance) {
            var p = select$1(this).on("dblclick.zoom");
            if (p) p.apply(this, arguments);
          }
        }
      }
    }

    zoom.wheelDelta = function(_) {
      return arguments.length ? (wheelDelta = typeof _ === "function" ? _ : constant(+_), zoom) : wheelDelta;
    };

    zoom.filter = function(_) {
      return arguments.length ? (filter = typeof _ === "function" ? _ : constant(!!_), zoom) : filter;
    };

    zoom.touchable = function(_) {
      return arguments.length ? (touchable = typeof _ === "function" ? _ : constant(!!_), zoom) : touchable;
    };

    zoom.extent = function(_) {
      return arguments.length ? (extent = typeof _ === "function" ? _ : constant([[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]]), zoom) : extent;
    };

    zoom.scaleExtent = function(_) {
      return arguments.length ? (scaleExtent[0] = +_[0], scaleExtent[1] = +_[1], zoom) : [scaleExtent[0], scaleExtent[1]];
    };

    zoom.translateExtent = function(_) {
      return arguments.length ? (translateExtent[0][0] = +_[0][0], translateExtent[1][0] = +_[1][0], translateExtent[0][1] = +_[0][1], translateExtent[1][1] = +_[1][1], zoom) : [[translateExtent[0][0], translateExtent[0][1]], [translateExtent[1][0], translateExtent[1][1]]];
    };

    zoom.constrain = function(_) {
      return arguments.length ? (constrain = _, zoom) : constrain;
    };

    zoom.duration = function(_) {
      return arguments.length ? (duration = +_, zoom) : duration;
    };

    zoom.interpolate = function(_) {
      return arguments.length ? (interpolate = _, zoom) : interpolate;
    };

    zoom.on = function() {
      var value = listeners.on.apply(listeners, arguments);
      return value === listeners ? zoom : value;
    };

    zoom.clickDistance = function(_) {
      return arguments.length ? (clickDistance2 = (_ = +_) * _, zoom) : Math.sqrt(clickDistance2);
    };

    zoom.tapDistance = function(_) {
      return arguments.length ? (tapDistance = +_, zoom) : tapDistance;
    };

    return zoom;
  }

  class Zoom {
      constructor(store, config) {
          this.eventTransform = identity;
          this.behavior = zoom()
              .on('start', (e) => {
              var _a, _b, _c;
              this.isRunning = true;
              const userDriven = !!e.sourceEvent;
              (_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.events) === null || _b === void 0 ? void 0 : _b.onZoomStart) === null || _c === void 0 ? void 0 : _c.call(_b, e, userDriven);
          })
              .on('zoom', (e) => {
              var _a, _b, _c;
              this.eventTransform = e.transform;
              const { eventTransform: { x, y, k }, store: { transform, screenSize } } = this;
              const w = screenSize[0];
              const h = screenSize[1];
              projection(transform, w, h);
              translate(transform, transform, [x, y]);
              scale(transform, transform, [k, k]);
              translate(transform, transform, [w / 2, h / 2]);
              scale(transform, transform, [w / 2, h / 2]);
              scale(transform, transform, [1, -1]);
              const userDriven = !!e.sourceEvent;
              (_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.events) === null || _b === void 0 ? void 0 : _b.onZoom) === null || _c === void 0 ? void 0 : _c.call(_b, e, userDriven);
          })
              .on('end', (e) => {
              var _a, _b, _c;
              this.isRunning = false;
              const userDriven = !!e.sourceEvent;
              (_c = (_b = (_a = this.config) === null || _a === void 0 ? void 0 : _a.events) === null || _b === void 0 ? void 0 : _b.onZoomEnd) === null || _c === void 0 ? void 0 : _c.call(_b, e, userDriven);
          });
          this.isRunning = false;
          this.store = store;
          this.config = config;
      }
      getTransform(positions, scale) {
          if (positions.length === 0)
              return this.eventTransform;
          const { store: { screenSize, maxPointSize } } = this;
          const width = screenSize[0];
          const height = screenSize[1];
          const xExtent = extent(positions.map(d => d[0]));
          const yExtent = extent(positions.map(d => d[1]));
          xExtent[0] = this.store.scaleX(xExtent[0] - maxPointSize / 2);
          xExtent[1] = this.store.scaleX(xExtent[1] + maxPointSize / 2);
          yExtent[0] = this.store.scaleY(yExtent[0] - maxPointSize / 2);
          yExtent[1] = this.store.scaleY(yExtent[1] + maxPointSize / 2);
          const xScale = width / (xExtent[1] - xExtent[0]);
          const yScale = height / (yExtent[0] - yExtent[1]);
          const clampedScale = clamp(scale !== null && scale !== void 0 ? scale : Math.min(xScale, yScale), ...this.behavior.scaleExtent());
          const xCenter = (xExtent[1] + xExtent[0]) / 2;
          const yCenter = (yExtent[1] + yExtent[0]) / 2;
          const translateX = width / 2 - xCenter * clampedScale;
          const translateY = height / 2 - yCenter * clampedScale;
          const transform = identity
              .translate(translateX, translateY)
              .scale(clampedScale);
          return transform;
      }
      getDistanceToPoint(position) {
          const { x, y, k } = this.eventTransform;
          const point = this.getTransform([position], k);
          const dx = x - point.x;
          const dy = y - point.y;
          return Math.sqrt(dx * dx + dy * dy);
      }
      getMiddlePointTransform(position) {
          const { store: { screenSize }, eventTransform: { x, y, k } } = this;
          const width = screenSize[0];
          const height = screenSize[1];
          const currX = (width / 2 - x) / k;
          const currY = (height / 2 - y) / k;
          const pointX = this.store.scaleX(position[0]);
          const pointY = this.store.scaleY(position[1]);
          const centerX = (currX + pointX) / 2;
          const centerY = (currY + pointY) / 2;
          const scale = 1;
          const translateX = width / 2 - centerX * scale;
          const translateY = height / 2 - centerY * scale;
          return identity
              .translate(translateX, translateY)
              .scale(scale);
      }
  }

  class Graph {
      constructor(canvas, config) {
          var _a;
          this.config = new GraphConfig();
          this.requestAnimationFrameId = 0;
          this.isRightClickMouse = false;
          this.graph = new GraphData();
          this.store = new Store();
          this.zoomInstance = new Zoom(this.store, this.config);
          this.hasBeenRecentlyDestroyed = false;
          if (config)
              this.config.init(config);
          const w = canvas.clientWidth;
          const h = canvas.clientHeight;
          this.store.updateScreenSize(w, h, this.config.spaceSize);
          canvas.width = w * this.config.pixelRatio;
          canvas.height = h * this.config.pixelRatio;
          // If the canvas element has no CSS width and height style, the clientWidth and the clientHeight will always
          // be equal to the width and height canvas attribute.
          // In order to prevent resize problem assume that canvas CSS style width and height has a value of 100%.
          if (canvas.style.width === '' && canvas.style.height === '') {
              select$1(canvas)
                  .style('width', '100%')
                  .style('height', '100%');
          }
          this.canvas = canvas;
          this.canvasD3Selection = select$1(canvas);
          this.canvasD3Selection
              .call(this.zoomInstance.behavior)
              .on('click', this.onClick.bind(this))
              .on('mousemove', this.onMouseMove.bind(this))
              .on('contextmenu', this.onRightClickMouse.bind(this));
          this.reglInstance = regl({
              canvas: this.canvas,
              attributes: {
                  antialias: false,
                  preserveDrawingBuffer: true,
                  premultipliedAlpha: false,
                  alpha: false,
              },
              extensions: ['OES_texture_float', 'ANGLE_instanced_arrays'],
          });
          this.store.maxPointSize = ((_a = this.reglInstance.limits.pointSizeDims[1]) !== null && _a !== void 0 ? _a : MAX_POINT_SIZE) / this.config.pixelRatio;
          this.points = new Points(this.reglInstance, this.config, this.store, this.graph);
          this.lines = new Lines(this.reglInstance, this.config, this.store, this.graph, this.points);
          this.forceGravity = new ForceGravity(this.reglInstance, this.config, this.store, this.graph, this.points);
          this.forceCenter = new ForceCenter(this.reglInstance, this.config, this.store, this.graph, this.points);
          this.forceManyBody = this.config.useQuadtree
              ? new ForceManyBodyQuadtree(this.reglInstance, this.config, this.store, this.graph, this.points)
              : new ForceManyBody(this.reglInstance, this.config, this.store, this.graph, this.points);
          this.forceLinkIncoming = new ForceLink(this.reglInstance, this.config, this.store, this.graph, this.points);
          this.forceLinkOutgoing = new ForceLink(this.reglInstance, this.config, this.store, this.graph, this.points);
          this.forceMouse = new ForceMouse(this.reglInstance, this.config, this.store, this.graph, this.points);
          this.store.backgroundColor = getRgbaColor(this.config.backgroundColor);
          if (this.config.showFPSMonitor)
              this.fpsMonitor = new FPSMonitor(this.canvas);
          if (this.config.randomSeed !== undefined)
              this.store.addRandomSeed(this.config.randomSeed);
      }
      get progress() {
          return this.store.simulationProgress;
      }
      /**
       * A value that gives information about the running simulation status.
       */
      get isSimulationRunning() {
          return this.store.isSimulationRunning;
      }
      /**
       * The maximum point size.
       * This value is the maximum size of the `gl.POINTS` primitive that WebGL can render on the user's hardware.
       */
      get maxPointSize() {
          return this.store.maxPointSize;
      }
      /**
       * Set or update Cosmos configuration. The changes will be applied in real time.
       * @param config Cosmos configuration object.
       */
      setConfig(config) {
          var _a, _b;
          const prevConfig = { ...this.config };
          this.config.init(config);
          if (prevConfig.linkColor !== this.config.linkColor)
              this.lines.updateColor();
          if (prevConfig.nodeColor !== this.config.nodeColor)
              this.points.updateColor();
          if (prevConfig.nodeSize !== this.config.nodeSize)
              this.points.updateSize();
          if (prevConfig.linkWidth !== this.config.linkWidth)
              this.lines.updateWidth();
          if (prevConfig.backgroundColor !== this.config.backgroundColor)
              this.store.backgroundColor = getRgbaColor(this.config.backgroundColor);
          if (prevConfig.spaceSize !== this.config.spaceSize ||
              prevConfig.simulation.repulsionQuadtreeLevels !== this.config.simulation.repulsionQuadtreeLevels)
              this.update(this.store.isSimulationRunning);
          if (prevConfig.showFPSMonitor !== this.config.showFPSMonitor) {
              if (this.config.showFPSMonitor) {
                  this.fpsMonitor = new FPSMonitor(this.canvas);
              }
              else {
                  (_a = this.fpsMonitor) === null || _a === void 0 ? void 0 : _a.destroy();
                  this.fpsMonitor = undefined;
              }
          }
          if (prevConfig.pixelRatio !== this.config.pixelRatio) {
              this.store.maxPointSize = ((_b = this.reglInstance.limits.pointSizeDims[1]) !== null && _b !== void 0 ? _b : MAX_POINT_SIZE) / this.config.pixelRatio;
          }
      }
      /**
       * Pass data to Cosmos.
       * @param nodes Array of nodes.
       * @param links Array of links.
       * @param runSimulation When set to `false`, the simulation won't be started automatically (`true` by default).
       */
      setData(nodes, links, runSimulation = true) {
          if (!nodes.length && !links.length) {
              this.destroy();
              this.reglInstance.clear({
                  color: this.store.backgroundColor,
                  depth: 1,
                  stencil: 0,
              });
              return;
          }
          this.graph.setData(nodes, links);
          this.update(runSimulation);
      }
      /**
       * Center the view on a node and zoom in, by node id.
       * @param id Id of the node.
       * @param duration Duration of the animation transition in milliseconds (`700` by default).
       */
      zoomToNodeById(id, duration = 700) {
          const node = this.graph.getNodeById(id);
          if (!node)
              return;
          this.zoomToNode(node, duration);
      }
      /**
       * Center the view on a node and zoom in, by node index.
       * @param index The index of the node in the array of nodes.
       * @param duration Duration of the animation transition in milliseconds (`700` by default).
       */
      zoomToNodeByIndex(index, duration = 700) {
          const node = this.graph.getNodeByIndex(index);
          if (!node)
              return;
          this.zoomToNode(node, duration);
      }
      /**
       * Zoom the view in or out to the specified zoom level.
       * @param value Zoom level
       * @param duration Duration of the zoom in/out transition.
       */
      zoom(value, duration = 0) {
          this.setZoomLevel(value, duration);
      }
      /**
       * Zoom the view in or out to the specified zoom level.
       * @param value Zoom level
       * @param duration Duration of the zoom in/out transition.
       */
      setZoomLevel(value, duration = 0) {
          this.canvasD3Selection
              .transition()
              .duration(duration)
              .call(this.zoomInstance.behavior.scaleTo, value);
      }
      /**
       * Get zoom level.
       * @returns Zoom level value of the view.
       */
      getZoomLevel() {
          return this.zoomInstance.eventTransform.k;
      }
      /**
       * Get current X and Y coordinates of the nodes.
       * @returns Object where keys are the ids of the nodes and values are corresponding `{ x: number; y: number }` objects.
       */
      getNodePositions() {
          if (this.hasBeenRecentlyDestroyed)
              return {};
          const particlePositionPixels = readPixels(this.reglInstance, this.points.currentPositionFbo);
          return this.graph.nodes.reduce((acc, curr) => {
              const index = this.graph.getSortedIndexById(curr.id);
              const posX = particlePositionPixels[index * 4 + 0];
              const posY = particlePositionPixels[index * 4 + 1];
              if (posX !== undefined && posY !== undefined) {
                  acc[curr.id] = {
                      x: posX,
                      y: posY,
                  };
              }
              return acc;
          }, {});
      }
      /**
       * Get current X and Y coordinates of the nodes.
       * @returns Map where keys are the ids of the nodes and values are corresponding `[number, number]` with X and Y coordinates of the node.
       */
      getNodePositionsMap() {
          const positionMap = new Map();
          if (this.hasBeenRecentlyDestroyed)
              return positionMap;
          const particlePositionPixels = readPixels(this.reglInstance, this.points.currentPositionFbo);
          return this.graph.nodes.reduce((acc, curr) => {
              const index = this.graph.getSortedIndexById(curr.id);
              const posX = particlePositionPixels[index * 4 + 0];
              const posY = particlePositionPixels[index * 4 + 1];
              if (posX !== undefined && posY !== undefined) {
                  acc.set(curr.id, [posX, posY]);
              }
              return acc;
          }, positionMap);
      }
      /**
       * Get current X and Y coordinates of the nodes.
       * @returns Array of `[x: number, y: number]` arrays.
       */
      getNodePositionsArray() {
          const positions = [];
          if (this.hasBeenRecentlyDestroyed)
              return [];
          const particlePositionPixels = readPixels(this.reglInstance, this.points.currentPositionFbo);
          positions.length = this.graph.nodes.length;
          for (let i = 0; i < this.graph.nodes.length; i += 1) {
              const index = this.graph.getSortedIndexByInputIndex(i);
              const posX = particlePositionPixels[index * 4 + 0];
              const posY = particlePositionPixels[index * 4 + 1];
              if (posX !== undefined && posY !== undefined) {
                  positions[i] = [posX, posY];
              }
          }
          return positions;
      }
      /**
       * Center and zoom in/out the view to fit all nodes in the scene.
       * @param duration Duration of the center and zoom in/out animation in milliseconds (`250` by default).
       */
      fitView(duration = 250) {
          this.setZoomTransformByNodePositions(this.getNodePositionsArray(), duration);
      }
      /**
       * Center and zoom in/out the view to fit nodes by their ids in the scene.
       * @param duration Duration of the center and zoom in/out animation in milliseconds (`250` by default).
       */
      fitViewByNodeIds(ids, duration = 250) {
          const positionsMap = this.getNodePositionsMap();
          const positions = ids.map(id => positionsMap.get(id)).filter((d) => d !== undefined);
          this.setZoomTransformByNodePositions(positions, duration);
      }
      /** Select nodes inside a rectangular area.
       * @param selection - Array of two corner points `[[left, top], [right, bottom]]`.
       * The `left` and `right` coordinates should be from 0 to the width of the canvas.
       * The `top` and `bottom` coordinates should be from 0 to the height of the canvas. */
      selectNodesInRange(selection) {
          if (selection) {
              const h = this.store.screenSize[1];
              this.store.selectedArea = [[selection[0][0], (h - selection[1][1])], [selection[1][0], (h - selection[0][1])]];
              this.points.findPointsOnAreaSelection();
              const pixels = readPixels(this.reglInstance, this.points.selectedFbo);
              this.store.selectedIndices = pixels
                  .map((pixel, i) => {
                  if (i % 4 === 0 && pixel !== 0)
                      return i / 4;
                  else
                      return -1;
              })
                  .filter(d => d !== -1);
          }
          else {
              this.store.selectedIndices = null;
          }
          this.points.updateGreyoutStatus();
      }
      /**
       * Select a node by id. If you want the adjacent nodes to get selected too, provide `true` as the second argument.
       * @param id Id of the node.
       * @param selectAdjacentNodes When set to `true`, selects adjacent nodes (`false` by default).
       */
      selectNodeById(id, selectAdjacentNodes = false) {
          var _a;
          if (selectAdjacentNodes) {
              const adjacentNodes = (_a = this.graph.getAdjacentNodes(id)) !== null && _a !== void 0 ? _a : [];
              this.selectNodesByIds([id, ...adjacentNodes.map(d => d.id)]);
          }
          else
              this.selectNodesByIds([id]);
      }
      /**
       * Select a node by index. If you want the adjacent nodes to get selected too, provide `true` as the second argument.
       * @param index The index of the node in the array of nodes.
       * @param selectAdjacentNodes When set to `true`, selects adjacent nodes (`false` by default).
       */
      selectNodeByIndex(index, selectAdjacentNodes = false) {
          const node = this.graph.getNodeByIndex(index);
          if (node)
              this.selectNodeById(node.id, selectAdjacentNodes);
      }
      /**
       * Select multiples nodes by their ids.
       * @param ids Array of nodes ids.
       */
      selectNodesByIds(ids) {
          this.selectNodesByIndices(ids === null || ids === void 0 ? void 0 : ids.map(d => this.graph.getSortedIndexById(d)));
      }
      /**
       * Select multiples nodes by their indices.
       * @param indices Array of nodes indices.
       */
      selectNodesByIndices(indices) {
          if (!indices) {
              this.store.selectedIndices = null;
          }
          else if (indices.length === 0) {
              this.store.selectedIndices = new Float32Array();
          }
          else {
              this.store.selectedIndices = new Float32Array(indices.filter((d) => d !== undefined));
          }
          this.points.updateGreyoutStatus();
      }
      /**
       * Unselect all nodes.
       */
      unselectNodes() {
          this.store.selectedIndices = null;
          this.points.updateGreyoutStatus();
      }
      /**
       * Get nodes that are currently selected.
       * @returns Array of selected nodes.
       */
      getSelectedNodes() {
          const { selectedIndices } = this.store;
          if (!selectedIndices)
              return null;
          const points = new Array(selectedIndices.length);
          for (const [i, selectedIndex] of selectedIndices.entries()) {
              if (selectedIndex !== undefined) {
                  const index = this.graph.getInputIndexBySortedIndex(selectedIndex);
                  if (index !== undefined)
                      points[i] = this.graph.nodes[index];
              }
          }
          return points;
      }
      /**
       * Get nodes that are adjacent to a specific node by its id.
       * @param id Id of the node.
       * @returns Array of adjacent nodes.
       */
      getAdjacentNodes(id) {
          return this.graph.getAdjacentNodes(id);
      }
      /**
       * Start the simulation.
       * @param alpha Value from 0 to 1. The higher the value, the more initial energy the simulation will get.
       */
      start(alpha = 1) {
          var _a, _b;
          if (!this.graph.nodes.length)
              return;
          this.store.isSimulationRunning = true;
          this.store.alpha = alpha;
          this.store.simulationProgress = 0;
          (_b = (_a = this.config.simulation).onStart) === null || _b === void 0 ? void 0 : _b.call(_a);
          this.stopFrames();
          this.frame();
      }
      /**
       * Pause the simulation.
       */
      pause() {
          var _a, _b;
          this.store.isSimulationRunning = false;
          (_b = (_a = this.config.simulation).onPause) === null || _b === void 0 ? void 0 : _b.call(_a);
      }
      /**
       * Restart the simulation.
       */
      restart() {
          var _a, _b;
          this.store.isSimulationRunning = true;
          (_b = (_a = this.config.simulation).onRestart) === null || _b === void 0 ? void 0 : _b.call(_a);
      }
      /**
       * Render only one frame of the simulation (stops the simulation if it was running).
       */
      step() {
          this.store.isSimulationRunning = false;
          this.stopFrames();
          this.frame();
      }
      /**
       * Destroy this Cosmos instance.
       */
      destroy() {
          var _a;
          this.stopFrames();
          if (this.hasBeenRecentlyDestroyed)
              return;
          this.points.destroy();
          this.lines.destroy();
          this.forceCenter.destroy();
          this.forceLinkIncoming.destroy();
          this.forceLinkOutgoing.destroy();
          (_a = this.forceManyBody) === null || _a === void 0 ? void 0 : _a.destroy();
          this.reglInstance.destroy();
          this.hasBeenRecentlyDestroyed = true;
      }
      /**
       * Create new Cosmos instance.
       */
      create() {
          var _a;
          this.points.create();
          this.lines.create();
          (_a = this.forceManyBody) === null || _a === void 0 ? void 0 : _a.create();
          this.forceLinkIncoming.create(LinkDirection.INCOMING);
          this.forceLinkOutgoing.create(LinkDirection.OUTGOING);
          this.forceCenter.create();
          this.hasBeenRecentlyDestroyed = false;
      }
      update(runSimulation) {
          const { graph } = this;
          this.store.pointsTextureSize = Math.ceil(Math.sqrt(graph.nodes.length));
          this.store.linksTextureSize = Math.ceil(Math.sqrt(graph.linksNumber * 2));
          this.destroy();
          this.create();
          this.initPrograms();
          if (runSimulation) {
              this.start();
          }
          else {
              this.step();
          }
      }
      initPrograms() {
          var _a;
          this.points.initPrograms();
          this.lines.initPrograms();
          this.forceGravity.initPrograms();
          this.forceLinkIncoming.initPrograms();
          this.forceLinkOutgoing.initPrograms();
          this.forceMouse.initPrograms();
          (_a = this.forceManyBody) === null || _a === void 0 ? void 0 : _a.initPrograms();
          this.forceCenter.initPrograms();
      }
      frame() {
          const { config: { simulation, renderLinks }, store: { alpha, isSimulationRunning } } = this;
          if (alpha < ALPHA_MIN && isSimulationRunning)
              this.end();
          this.requestAnimationFrameId = window.requestAnimationFrame((now) => {
              var _a, _b, _c, _d, _e, _f;
              (_a = this.fpsMonitor) === null || _a === void 0 ? void 0 : _a.begin();
              this.resizeCanvas();
              if (this.isRightClickMouse) {
                  if (!isSimulationRunning)
                      this.start(0.1);
                  this.forceMouse.run();
                  this.points.updatePosition();
              }
              if ((isSimulationRunning && !this.zoomInstance.isRunning)) {
                  if (simulation.gravity) {
                      this.forceGravity.run();
                      this.points.updatePosition();
                  }
                  if (simulation.center) {
                      this.forceCenter.run();
                      this.points.updatePosition();
                  }
                  (_b = this.forceManyBody) === null || _b === void 0 ? void 0 : _b.run();
                  this.points.updatePosition();
                  this.forceLinkIncoming.run();
                  this.points.updatePosition();
                  this.forceLinkOutgoing.run();
                  this.points.updatePosition();
                  this.store.alpha += this.store.addAlpha((_c = this.config.simulation.decay) !== null && _c !== void 0 ? _c : defaultConfigValues.simulation.decay);
                  if (this.isRightClickMouse)
                      this.store.alpha = Math.max(this.store.alpha, 0.1);
                  this.store.simulationProgress = Math.sqrt(Math.min(1, ALPHA_MIN / this.store.alpha));
                  (_e = (_d = this.config.simulation).onTick) === null || _e === void 0 ? void 0 : _e.call(_d, this.store.alpha);
              }
              // Clear canvas
              this.reglInstance.clear({
                  color: this.store.backgroundColor,
                  depth: 1,
                  stencil: 0,
              });
              if (renderLinks) {
                  this.lines.draw();
              }
              this.points.draw();
              (_f = this.fpsMonitor) === null || _f === void 0 ? void 0 : _f.end(now);
              this.frame();
          });
      }
      stopFrames() {
          if (this.requestAnimationFrameId)
              window.cancelAnimationFrame(this.requestAnimationFrameId);
      }
      end() {
          var _a, _b;
          this.store.isSimulationRunning = false;
          this.store.simulationProgress = 1;
          (_b = (_a = this.config.simulation).onEnd) === null || _b === void 0 ? void 0 : _b.call(_a);
      }
      onClick(event) {
          var _a, _b;
          this.points.findPointsOnMouseClick();
          const pixels = readPixels(this.reglInstance, this.points.selectedFbo);
          let position;
          const pixelsInSelectedArea = pixels
              .map((pixel, i) => {
              if (i % 4 === 0 && pixel !== 0) {
                  position = [pixels[i + 2], this.config.spaceSize - pixels[i + 3]];
                  return i / 4;
              }
              else
                  return -1;
          })
              .filter(d => d !== -1);
          const clickedIndex = this.graph.getInputIndexBySortedIndex(pixelsInSelectedArea[pixelsInSelectedArea.length - 1]);
          const clickedParticle = (pixelsInSelectedArea.length && clickedIndex !== undefined) ? this.graph.nodes[clickedIndex] : undefined;
          (_b = (_a = this.config.events).onClick) === null || _b === void 0 ? void 0 : _b.call(_a, clickedParticle, clickedIndex, position, event);
      }
      onMouseMove(event) {
          const { x, y, k } = this.zoomInstance.eventTransform;
          const h = this.canvas.clientHeight;
          const mouseX = event.offsetX;
          const mouseY = event.offsetY;
          const invertedX = (mouseX - x) / k;
          const invertedY = (mouseY - y) / k;
          this.store.mousePosition = [invertedX, (h - invertedY)];
          this.store.mousePosition[0] -= (this.store.screenSize[0] - this.config.spaceSize) / 2;
          this.store.mousePosition[1] -= (this.store.screenSize[1] - this.config.spaceSize) / 2;
          this.store.screenMousePosition = [mouseX, (this.store.screenSize[1] - mouseY)];
          this.isRightClickMouse = event.which === 3;
      }
      onRightClickMouse(event) {
          event.preventDefault();
      }
      resizeCanvas() {
          const prevWidth = this.canvas.width;
          const prevHeight = this.canvas.height;
          const w = this.canvas.clientWidth;
          const h = this.canvas.clientHeight;
          if (prevWidth !== w * this.config.pixelRatio || prevHeight !== h * this.config.pixelRatio) {
              this.store.updateScreenSize(w, h, this.config.spaceSize);
              this.canvas.width = w * this.config.pixelRatio;
              this.canvas.height = h * this.config.pixelRatio;
              this.reglInstance.poll();
              this.canvasD3Selection
                  .call(this.zoomInstance.behavior.transform, this.zoomInstance.eventTransform);
          }
      }
      setZoomTransformByNodePositions(positions, duration = 250, scale) {
          const transform = this.zoomInstance.getTransform(positions, scale);
          this.canvasD3Selection
              .transition()
              .ease(quadInOut)
              .duration(duration)
              .call(this.zoomInstance.behavior.transform, transform);
      }
      zoomToNode(node, duration) {
          const { graph, store: { screenSize } } = this;
          const positionPixels = readPixels(this.reglInstance, this.points.currentPositionFbo);
          const nodeIndex = graph.getSortedIndexById(node.id);
          if (nodeIndex === undefined)
              return;
          const posX = positionPixels[nodeIndex * 4 + 0];
          const posY = positionPixels[nodeIndex * 4 + 1];
          if (posX === undefined || posY === undefined)
              return;
          const distance = this.zoomInstance.getDistanceToPoint([posX, posY]);
          if (distance < Math.min(screenSize[0], screenSize[1])) {
              this.setZoomTransformByNodePositions([[posX, posY]], duration, 3);
          }
          else {
              const transform = this.zoomInstance.getTransform([[posX, posY]], 3);
              const middle = this.zoomInstance.getMiddlePointTransform([posX, posY]);
              this.canvasD3Selection
                  .transition()
                  .ease(quadIn)
                  .duration(duration / 2)
                  .call(this.zoomInstance.behavior.transform, middle)
                  .transition()
                  .ease(quadOut)
                  .duration(duration / 2)
                  .call(this.zoomInstance.behavior.transform, transform);
          }
      }
  }

  exports.Graph = Graph;

  Object.defineProperty(exports, '__esModule', { value: true });

  return exports;

})({});
window.cosmos = cosmos
