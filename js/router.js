/**
 * Hash-based SPA router.
 *
 * Cada rota mapeia um path (sem '#') a uma função render(container, path).
 * Suporta fallback para 404 e prefix match para subpaths (ex.: /recipe/*).
 */

(function () {
  "use strict";

  window.App = window.App || {};

  function Router(outletSelector) {
    this._routes = {};
    this._fallback = null;
    this._outlet = document.querySelector(outletSelector);

    if (!this._outlet) {
      throw new Error('Router outlet "' + outletSelector + '" not found in DOM');
    }

    var self = this;
    window.addEventListener("hashchange", function () {
      self._resolve();
    });
  }

  Router.prototype.addRoute = function (path, renderFn) {
    this._routes[path] = renderFn;
    return this;
  };

  Router.prototype.setFallback = function (renderFn) {
    this._fallback = renderFn;
    return this;
  };

  Router.prototype.start = function () {
    if (!window.location.hash) {
      window.location.hash = "#/";
    }
    this._resolve();
    return this;
  };

  Router.prototype._resolve = function () {
    var path = window.location.hash.slice(1) || "/";

    var renderFn = this._routes[path];

    if (!renderFn) {
      var keys = Object.keys(this._routes);
      for (var i = 0; i < keys.length; i++) {
        if (keys[i] !== "/" && path.indexOf(keys[i] + "/") === 0) {
          renderFn = this._routes[keys[i]];
          break;
        }
      }
    }

    renderFn = renderFn || this._fallback;

    if (!renderFn) {
      return;
    }

    this._outlet.innerHTML = "";
    renderFn(this._outlet, path);

    window.dispatchEvent(new CustomEvent("route:changed", { detail: { path: path } }));
  };

  App.Router = Router;
})();
