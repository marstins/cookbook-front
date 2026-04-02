/**
 * Utilitários para criação e manipulação de elementos DOM.
 */

(function () {
  "use strict";

  window.App = window.App || {};
  window.App.dom = {};

  App.dom.createElement = function createElement(tag, attributes, children) {
    attributes = attributes || {};
    children = children || [];

    var el = document.createElement(tag);

    var keys = Object.keys(attributes);
    for (var i = 0; i < keys.length; i++) {
      var key = keys[i];
      var value = attributes[key];

      if (key === "className") {
        el.className = value;
      } else if (key === "dataset") {
        Object.assign(el.dataset, value);
      } else if (key.indexOf("on") === 0 && typeof value === "function") {
        el.addEventListener(key.slice(2).toLowerCase(), value);
      } else {
        el.setAttribute(key, value);
      }
    }

    var list = [].concat(children);
    for (var j = 0; j < list.length; j++) {
      var child = list[j];
      if (child == null || child === false) continue;
      el.append(typeof child === "string" ? document.createTextNode(child) : child);
    }

    return el;
  };

  App.dom.qsa = function qsa(selector, scope) {
    return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
  };
})();
