(function () {
  "use strict";

  window.App = window.App || {};
  App.pages = App.pages || {};

  var h = App.dom.createElement;

  App.pages.renderNotFound = function renderNotFound(container) {
    var page = h("div", { className: "not-found" }, [
      h("span", { className: "not-found-code" }, "404"),
      h(
        "p",
        { className: "not-found-message" },
        "A página que você procura não foi encontrada."
      ),
      h(
        "a",
        { href: "#/", className: "btn btn-primary" },
        "Voltar para Home"
      ),
    ]);

    container.append(page);
  };
})();
