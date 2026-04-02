/**
 * Store reativo minimalista.
 *
 * Mantém estado centralizado e notifica listeners em cada mutação.
 * Listeners se inscrevem por chave; use a chave "*" para todas as mudanças.
 */

(function () {
  "use strict";

  window.App = window.App || {};

  function Store(initialState) {
    this._state = JSON.parse(JSON.stringify(initialState || {}));
    this._listeners = {};
  }

  Store.prototype.get = function (key) {
    return this._state[key];
  };

  Store.prototype.set = function (key, value) {
    var prev = this._state[key];
    if (prev === value) return;

    this._state[key] = value;
    this._notify(key, value, prev);
  };

  Store.prototype.subscribe = function (key, callback) {
    if (!this._listeners[key]) {
      this._listeners[key] = [];
    }
    this._listeners[key].push(callback);

    var listeners = this._listeners;
    return function () {
      var list = listeners[key];
      if (!list) return;
      var idx = list.indexOf(callback);
      if (idx !== -1) list.splice(idx, 1);
    };
  };

  Store.prototype._notify = function (key, value, prev) {
    var specific = this._listeners[key] || [];
    var global = this._listeners["*"] || [];

    for (var i = 0; i < specific.length; i++) specific[i](value, prev, key);
    for (var j = 0; j < global.length; j++) global[j](value, prev, key);
  };

  App.Store = Store;
})();
