/**
 * HTTP client wrapper sobre fetch.
 * Resolve paths relativos contra App.config.API_BASE_URL e
 * injeta Authorization: Bearer quando existe token no store.
 */

(function () {
  "use strict";

  window.App = window.App || {};

  var DEFAULT_HEADERS = {
    "Content-Type": "application/json",
  };

  function resolveUrl(path) {
    if (path.indexOf("http") === 0) return path;
    var base = (App.config && App.config.API_BASE_URL) || "";
    return base.replace(/\/+$/, "") + "/" + path.replace(/^\/+/, "");
  }

  var TOKEN_ERRORS = {
    TOKEN_NOT_FOUND: true,
    TOKEN_EXPIRED: true,
    INVALID_TOKEN: true,
  };

  function clearSessionOnInvalidToken(body) {
    var store = App._store;
    if (!store || !store.get("user")) return;
    if (!body || !TOKEN_ERRORS[body.code]) return;
    store.set("user", null);
  }

  function authHeaders() {
    var store = App._store;
    if (!store) return {};

    var user = store.get("user");
    if (!user || !user.token) return {};

    return { Authorization: "Bearer " + user.token };
  }

  function request(url, options) {
    options = options || {};

    var config = Object.assign({}, options, {
      headers: Object.assign({}, DEFAULT_HEADERS, authHeaders(), options.headers),
    });

    return fetch(resolveUrl(url), config).then(function (response) {
      var contentType = response.headers.get("content-type") || "";
      var isJson = contentType.indexOf("application/json") !== -1;

      if (!response.ok) {
        return (isJson ? response.json() : response.text()).then(function (body) {
          var error = new Error("HTTP " + response.status + ": " + response.statusText);
          error.status = response.status;
          error.data = body;
          clearSessionOnInvalidToken(body);
          throw error;
        });
      }

      if (isJson) return response.json();
      return response.text();
    });
  }

  App.http = {
    get: function (url, options) {
      return request(url, Object.assign({}, options, { method: "GET" }));
    },
    post: function (url, body, options) {
      return request(url, Object.assign({}, options, { method: "POST", body: JSON.stringify(body) }));
    },
    put: function (url, body, options) {
      return request(url, Object.assign({}, options, { method: "PUT", body: JSON.stringify(body) }));
    },
    delete: function (url, options) {
      return request(url, Object.assign({}, options, { method: "DELETE" }));
    },
  };
})();
