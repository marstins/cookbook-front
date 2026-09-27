/**
 * Alerta de sucesso fixo abaixo do cabeçalho.
 * Fica no <body>, fora da página, para continuar visível quando a rota muda
 * logo depois da ação (ex.: rascunho que vira receita e abre a receita).
 */

(function () {
  "use strict";

  window.App = window.App || {};

  var DURATION_MS = 3500;
  var container = null;

  function getContainer() {
    if (!container) {
      container = document.createElement("div");
      container.className = "toast-container";
      container.setAttribute("role", "status");
      container.setAttribute("aria-live", "polite");
      document.body.append(container);
    }
    return container;
  }

  function success(message) {
    var toast = App.dom.createElement("div", { className: "toast toast--success" }, [
      App.dom.createElement("span", { className: "toast-icon", "aria-hidden": "true" }, "✓"),
      App.dom.createElement("span", { className: "toast-message" }, message),
    ]);

    getContainer().append(toast);

    setTimeout(function () {
      toast.classList.add("is-leaving");
      setTimeout(function () {
        toast.remove();
      }, 250);
    }, DURATION_MS);
  }

  App.toast = { success: success };
})();
