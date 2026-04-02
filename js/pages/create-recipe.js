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

  function createIngredientRow(list) {
    var input = h("input", {
      type: "text",
      className: "login-input",
      placeholder: "Ingrediente",
      required: "true",
      minlength: "5",
      maxlength: "30",
    });

    var removeBtn = h("button", {
      type: "button",
      className: "btn btn-icon-remove",
      "aria-label": "Remover",
    }, "×");

    var row = h("div", { className: "ingredient-row" }, [input, removeBtn]);

    removeBtn.addEventListener("click", function () {
      if (list.querySelectorAll(".ingredient-row").length > 1) {
        row.remove();
      }
    });

    return row;
  }

  App.pages.renderCreateRecipe = function renderCreateRecipe(container) {
    var store = App._store;
    var errorMsg = h("p", { className: "login-error" });
    var successMsg = h("p", { className: "login-success" });

    var titleInput = h("input", {
      type: "text",
      className: "login-input",
      placeholder: "Título",
      required: "true",
      minlength: "1",
      maxlength: "20",
    });

    var descInput = h("input", {
      type: "text",
      className: "login-input",
      placeholder: "Descrição",
      required: "true",
      minlength: "10",
      maxlength: "30",
    });

    var instructionsInput = h("textarea", {
      className: "login-input form-textarea",
      placeholder: "Instruções de preparo",
      required: "true",
      minlength: "10",
      maxlength: "800",
      rows: "6",
    });

    var ingredientList = h("div", { className: "ingredient-list" });
    ingredientList.append(createIngredientRow(ingredientList));

    var addIngredientBtn = h(
      "button",
      { type: "button", className: "btn btn-secondary btn-add-ingredient" },
      "+ Ingrediente"
    );

    addIngredientBtn.addEventListener("click", function () {
      ingredientList.append(createIngredientRow(ingredientList));
    });

    var submitBtn = h(
      "button",
      { type: "submit", className: "btn btn-primary form-submit" },
      "Criar Receita"
    );

    var toggleCheckbox = h("input", {
      type: "checkbox",
      className: "toggle-input",
      id: "is-public-toggle",
    });

    var toggleSwitch = h("label", { className: "toggle", for: "is-public-toggle" }, [
      toggleCheckbox,
      h("span", { className: "toggle-slider" }),
      h("span", { className: "toggle-label" }, "Receita pública"),
    ]);

    var form = h("form", { className: "form-create-recipe" }, [
      errorMsg,
      successMsg,
      h("label", { className: "form-label" }, "Título"),
      titleInput,
      h("label", { className: "form-label" }, "Descrição"),
      descInput,
      h("label", { className: "form-label" }, "Ingredientes"),
      ingredientList,
      addIngredientBtn,
      h("label", { className: "form-label" }, "Instruções"),
      instructionsInput,
      toggleSwitch,
      submitBtn,
    ]);

    function setLoading(loading) {
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? "Criando..." : "Criar Receita";
      addIngredientBtn.disabled = loading;
      titleInput.disabled = loading;
      descInput.disabled = loading;
      instructionsInput.disabled = loading;
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      errorMsg.textContent = "";
      successMsg.textContent = "";

      var title = titleInput.value.trim();
      var description = descInput.value.trim();
      var instructions = instructionsInput.value.trim();

      var ingredientRows = ingredientList.querySelectorAll(".ingredient-row input");
      var ingredients = [];
      for (var i = 0; i < ingredientRows.length; i++) {
        var val = ingredientRows[i].value.trim();
        if (val) ingredients.push({ description: val });
      }

      if (!title || !description || !instructions || ingredients.length === 0) {
        errorMsg.textContent = "Preencha todos os campos e adicione ao menos um ingrediente.";
        return;
      }

      setLoading(true);

      App.http
        .post("/recipes/", {
          title: title,
          description: description,
          instructions: instructions,
          ingredients: ingredients,
          is_public: toggleCheckbox.checked,
        })
        .then(function () {
          successMsg.textContent = "Receita criada com sucesso!";
          form.reset();
          ingredientList.innerHTML = "";
          ingredientList.append(createIngredientRow(ingredientList));
          setLoading(false);
        })
        .catch(function (err) {
          setLoading(false);
          errorMsg.textContent = extractErrorMessage(err);
        });
    });

    var page = h("div", { className: "page" }, [
      h("h1", { className: "page-title" }, "Criar Receita"),
      h("p", { className: "page-subtitle" }, "Crie e compartilhe uma nova receita."),
      form,
    ]);

    container.append(page);
    titleInput.focus();
  };
})();
