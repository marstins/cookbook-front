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

  App.pages.renderRegister = function renderRegister(container, options) {
    var store = options.store;

    var errorMsg = h("p", { className: "login-error" });
    var successMsg = h("p", { className: "login-success" });

    var nameInput = h("input", {
      type: "text",
      className: "login-input",
      placeholder: "Nome de usuário",
      required: "true",
      minlength: "5",
      maxlength: "20",
    });

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

    var confirmInput = h("input", {
      type: "password",
      className: "login-input",
      placeholder: "Confirme a senha",
      required: "true",
      minlength: "8",
      maxlength: "30",
    });

    var submitBtn = h(
      "button",
      { type: "submit", className: "btn btn-primary login-btn-half" },
      "Criar conta"
    );

    var backBtn = h(
      "button",
      { type: "button", className: "btn btn-ghost login-btn-half" },
      "Voltar"
    );

    backBtn.addEventListener("click", function () {
      store.set("authView", "login");
    });

    var btnRow = h("div", { className: "login-btn-row" }, [backBtn, submitBtn]);

    var form = h("form", { className: "login-form" }, [
      h("h1", { className: "login-title" }, "Cookbook"),
      h("p", { className: "login-subtitle" }, "Crie sua conta"),
      errorMsg,
      successMsg,
      nameInput,
      emailInput,
      passwordInput,
      confirmInput,
      btnRow,
    ]);

    function setLoading(loading) {
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? "Criando..." : "Criar conta";
      backBtn.disabled = loading;
      nameInput.disabled = loading;
      emailInput.disabled = loading;
      passwordInput.disabled = loading;
      confirmInput.disabled = loading;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorMsg.textContent = "";
      successMsg.textContent = "";

      var name = nameInput.value.trim();
      var email = emailInput.value.trim();
      var password = passwordInput.value;
      var confirm = confirmInput.value;

      if (!name || !email || !password || !confirm) {
        errorMsg.textContent = "Preencha todos os campos.";
        return;
      }

      if (password !== confirm) {
        errorMsg.textContent = "As senhas não coincidem.";
        return;
      }

      setLoading(true);

      App.http
        .post("/users/", { name: name, email: email, password: password })
        .then(function () {
          return App.http.post("/auth/", { email: email, password: password });
        })
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
    nameInput.focus();
  };
})();
