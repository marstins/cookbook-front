/**
 * Diálogo de confirmação no estilo da aplicação, no lugar do confirm() nativo.
 * App.confirmDialog({ title, message, confirmLabel }) resolve true ao confirmar
 * e false ao cancelar, clicar fora ou apertar Esc.
 */

(function () {
  "use strict";

  window.App = window.App || {};

  var h = App.dom.createElement;

  App.confirmDialog = function confirmDialog(options) {
    return new Promise(function (resolve) {
      var previousFocus = document.activeElement;

      var cancelBtn = h("button", { type: "button", className: "btn btn-secondary" }, "Cancelar");
      var confirmBtn = h(
        "button",
        { type: "button", className: "btn btn-danger" },
        options.confirmLabel || "Confirmar"
      );

      var dialog = h("div", {
        className: "dialog",
        role: "alertdialog",
        "aria-modal": "true",
        "aria-labelledby": "confirm-dialog-title",
        "aria-describedby": "confirm-dialog-message",
      }, [
        h("h2", { className: "dialog-title", id: "confirm-dialog-title" }, options.title),
        h("p", { className: "dialog-message", id: "confirm-dialog-message" }, options.message),
        h("div", { className: "dialog-actions" }, [cancelBtn, confirmBtn]),
      ]);

      var overlay = h("div", { className: "dialog-overlay" }, [dialog]);

      function close(result) {
        document.removeEventListener("keydown", onKeyDown);
        overlay.remove();
        if (previousFocus && previousFocus.focus) previousFocus.focus();
        resolve(result);
      }

      function onKeyDown(e) {
        if (e.key === "Escape") {
          close(false);
        } else if (e.key === "Tab") {
          var target = e.shiftKey
            ? (document.activeElement === cancelBtn ? confirmBtn : cancelBtn)
            : (document.activeElement === confirmBtn ? cancelBtn : confirmBtn);
          e.preventDefault();
          target.focus();
        }
      }

      cancelBtn.addEventListener("click", function () { close(false); });
      confirmBtn.addEventListener("click", function () { close(true); });
      overlay.addEventListener("click", function (e) {
        if (e.target === overlay) close(false);
      });
      document.addEventListener("keydown", onKeyDown);

      document.body.append(overlay);
      cancelBtn.focus();
    });
  };
})();
