(function () {
  "use strict";

  window.App = window.App || {};
  App.pages = App.pages || {};

  var h = App.dom.createElement;

  var NETWORK_ERROR = "Não foi possível conectar ao servidor. Tente novamente.";
  var GENERIC_ERROR = "Ocorreu um erro inesperado. Tente novamente.";

  function extractErrorMessage(err) {
    if (!err.status) return NETWORK_ERROR;

    var data = err.data;
    if (!data || typeof data === "string") return GENERIC_ERROR;

    if (data.message) return data.message;

    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.map(function (e) { return e.msg; }).join(". ");
    }

    return GENERIC_ERROR;
  }

  App.pages.renderLogin = function renderLogin(container, options) {
    var store = options.store;

    var errorMsg = h("p", { className: "login-error" });

    var emailInput = h("input", {
      type: "email",
      className: "login-input",
      placeholder: "E-mail",
      required: "true",
      minlength: "5",
      maxlength: "30",
    });

    var passwordInput = h("input", {
      type: "password",
      className: "login-input",
      placeholder: "Senha (mín. 8 caracteres)",
      required: "true",
      minlength: "8",
      maxlength: "30",
    });

    var submitBtn = h(
      "button",
      { type: "submit", className: "btn btn-primary login-btn-half" },
      "Entrar"
    );

    var registerBtn = h(
      "button",
      { type: "button", className: "btn btn-ghost login-btn-half" },
      "Cadastre-se"
    );

    registerBtn.addEventListener("click", function () {
      store.set("authView", "register");
    });

    var btnRow = h("div", { className: "login-btn-row" }, [registerBtn, submitBtn]);

    var form = h("form", { className: "login-form" }, [
      h("h1", { className: "login-title" }, "Cookbook"),
      h("p", { className: "login-subtitle" }, "Faça login para continuar"),
      errorMsg,
      emailInput,
      passwordInput,
      btnRow,
    ]);

    function setLoading(loading) {
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? "Entrando..." : "Entrar";
      registerBtn.disabled = loading;
      emailInput.disabled = loading;
      passwordInput.disabled = loading;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorMsg.textContent = "";

      var email = emailInput.value.trim();
      var password = passwordInput.value;

      if (!email || !password) {
        errorMsg.textContent = "Preencha todos os campos.";
        return;
      }

      setLoading(true);

      App.http
        .post("/auth/", { email: email, password: password })
        .then(function (user) {
          store.set("user", user);
        })
        .catch(function (err) {
          setLoading(false);
          errorMsg.textContent = extractErrorMessage(err);
        });
    });

    var wrapper = h("div", { className: "login-page" }, [form]);

    container.append(wrapper);
    emailInput.focus();
  };
})();
