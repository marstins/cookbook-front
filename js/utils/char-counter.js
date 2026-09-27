/**
 * Contador de caracteres para campos com limite de receita.
 * O valor pode passar do limite quando vem preenchido de um rascunho;
 * nesse caso o contador fica em destaque até o usuário cortar o texto.
 */

(function () {
  "use strict";

  window.App = window.App || {};

  var updaters = new WeakMap();

  function attach(input, max) {
    var counter = document.createElement("span");
    counter.className = "char-counter";

    function update() {
      var length = input.value.length;
      counter.textContent = length + "/" + max;
      counter.classList.toggle("is-over", length > max);
    }

    input.addEventListener("input", update);
    updaters.set(input, update);
    update();

    return counter;
  }

  function refresh(scope) {
    var fields = (scope || document).querySelectorAll("input, textarea");
    for (var i = 0; i < fields.length; i++) {
      var update = updaters.get(fields[i]);
      if (update) update();
    }
  }

  App.charCounter = { attach: attach, refresh: refresh };
})();
