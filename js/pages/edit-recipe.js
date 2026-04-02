(function () {
  "use strict";

  window.App = window.App || {};
  App.pages = App.pages || {};

  var h = App.dom.createElement;

  var NETWORK_ERROR = "Não foi possível conectar ao servidor. Tente novamente.";
  var GENERIC_ERROR = "Ocorreu um erro inesperado. Tente novamente.";

  function extractRecipeId(path) {
    var parts = path.split("/");
    return parts[parts.length - 1] || "";
  }

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

  function createIngredientRow(list, value) {
    var input = h("input", {
      type: "text",
      className: "login-input",
      placeholder: "Ingrediente",
      required: "true",
      minlength: "5",
      maxlength: "30",
      value: value || "",
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

  function renderEditForm(recipe, container) {
    var errorMsg = h("p", { className: "login-error" });
    var successMsg = h("p", { className: "login-success" });

    var titleInput = h("input", {
      type: "text",
      className: "login-input",
      placeholder: "Título",
      required: "true",
      minlength: "1",
      maxlength: "20",
      value: recipe.title,
    });

    var descInput = h("input", {
      type: "text",
      className: "login-input",
      placeholder: "Descrição",
      required: "true",
      minlength: "10",
      maxlength: "30",
      value: recipe.description,
    });

    var instructionsInput = h("textarea", {
      className: "login-input form-textarea",
      placeholder: "Instruções de preparo",
      required: "true",
      minlength: "10",
      maxlength: "800",
      rows: "6",
    });
    instructionsInput.value = recipe.instructions;

    var ingredientList = h("div", { className: "ingredient-list" });
    for (var i = 0; i < recipe.ingredients.length; i++) {
      ingredientList.append(
        createIngredientRow(ingredientList, recipe.ingredients[i].description)
      );
    }

    if (recipe.ingredients.length === 0) {
      ingredientList.append(createIngredientRow(ingredientList, ""));
    }

    var addIngredientBtn = h(
      "button",
      { type: "button", className: "btn btn-secondary btn-add-ingredient" },
      "+ Ingrediente"
    );

    addIngredientBtn.addEventListener("click", function () {
      ingredientList.append(createIngredientRow(ingredientList, ""));
    });

    var submitBtn = h(
      "button",
      { type: "submit", className: "btn btn-primary form-submit" },
      "Salvar alterações"
    );

    var toggleCheckbox = h("input", {
      type: "checkbox",
      className: "toggle-input",
      id: "is-public-toggle-edit",
    });
    toggleCheckbox.checked = recipe.is_public;

    var toggleSwitch = h("label", { className: "toggle", for: "is-public-toggle-edit" }, [
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
      submitBtn.textContent = loading ? "Salvando..." : "Salvar alterações";
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
      for (var j = 0; j < ingredientRows.length; j++) {
        var val = ingredientRows[j].value.trim();
        if (val) ingredients.push({ description: val });
      }

      if (!title || !description || !instructions || ingredients.length === 0) {
        errorMsg.textContent = "Preencha todos os campos e adicione ao menos um ingrediente.";
        return;
      }

      setLoading(true);

      App.http
        .put("/recipes/" + recipe.id, {
          title: title,
          description: description,
          instructions: instructions,
          ingredients: ingredients,
          is_public: toggleCheckbox.checked,
        })
        .then(function () {
          successMsg.textContent = "Receita atualizada com sucesso!";
          setLoading(false);
        })
        .catch(function (err) {
          setLoading(false);
          errorMsg.textContent = extractErrorMessage(err);
        });
    });

    var backBtn = h(
      "button",
      { type: "button", className: "btn btn-secondary form-back-btn" },
      "Voltar à receita"
    );

    backBtn.addEventListener("click", function () {
      window.location.hash = "#/recipe/" + recipe.id;
    });

    var page = h("div", { className: "page" }, [
      h("h1", { className: "page-title" }, "Editar Receita"),
      h("p", { className: "page-subtitle" }, recipe.title),
      h("div", { className: "form-create-recipe" }, [backBtn]),
      form,
    ]);

    container.append(page);
    titleInput.focus();
  }

  App.pages.renderEditRecipe = function renderEditRecipe(container, path) {
    var recipeId = extractRecipeId(path);
    var loading = h("p", { className: "page-empty" }, "Carregando receita...");
    var page = h("div", { className: "page" });

    page.append(loading);
    container.append(page);

    if (!recipeId) {
      loading.textContent = "Receita não encontrada.";
      return;
    }

    App.http
      .get("/recipes/" + recipeId)
      .then(function (recipe) {
        var store = App._store;
        var user = store.get("user");

        if (!user || recipe.author_id !== user.id) {
          loading.textContent = "Você não tem permissão para editar esta receita.";
          return;
        }

        page.remove();
        renderEditForm(recipe, container);
      })
      .catch(function (err) {
        if (err.status === 404) {
          loading.textContent = "Receita não encontrada.";
          return;
        }
        loading.textContent = "Erro ao carregar receita.";
      });
  };
})();
