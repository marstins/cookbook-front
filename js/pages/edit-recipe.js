(function () {
  "use strict";

  window.App = window.App || {};
  App.pages = App.pages || {};

  var h = App.dom.createElement;

  var NETWORK_ERROR = "Não foi possível conectar ao servidor. Tente novamente.";
  var GENERIC_ERROR = "Ocorreu um erro inesperado. Tente novamente.";

  function extractId(path) {
    var parts = path.split("/");
    return parts[parts.length - 1] || "";
  }

  function isDraftPath(path) {
    return path.indexOf("/edit-draft") === 0;
  }

  function extractErrorMessage(err) {
    if (!err.status) return NETWORK_ERROR;
    var data = err.data;
    if (!data || typeof data === "string") return GENERIC_ERROR;
    if (data.message) return data.message;
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors.map(function (e) { return e.msg || e.message; }).join(". ");
    }
    return GENERIC_ERROR;
  }

  function createIngredientRow(list, value) {
    var input = h("input", {
      type: "text",
      className: "login-input",
      placeholder: "Ingrediente",
      minlength: "5",
      maxlength: "30",
      value: value || "",
    });

    var removeBtn = h("button", {
      type: "button",
      className: "btn btn-icon-remove",
      "aria-label": "Remover",
    }, "×");

    var row = h("div", { className: "ingredient-row" }, [
      input,
      App.charCounter.attach(input, 30),
      removeBtn,
    ]);

    removeBtn.addEventListener("click", function () {
      if (list.querySelectorAll(".ingredient-row").length > 1) {
        row.remove();
      }
    });

    return row;
  }

  function collectIngredients(ingredientList) {
    var ingredientRows = ingredientList.querySelectorAll(".ingredient-row input");
    var ingredients = [];
    for (var j = 0; j < ingredientRows.length; j++) {
      var val = ingredientRows[j].value.trim();
      if (val) ingredients.push({ description: val });
    }
    return ingredients;
  }

  function renderEditForm(record, container, isDraft) {
    var errorMsg = h("p", { className: "login-error" });

    var titleInput = h("input", {
      type: "text",
      className: "login-input",
      placeholder: "Título",
      minlength: "1",
      maxlength: "40",
      value: record.title || "",
    });

    var descInput = h("input", {
      type: "text",
      className: "login-input",
      placeholder: "Descrição",
      minlength: "10",
      maxlength: "50",
      value: record.description || "",
    });

    var instructionsInput = h("textarea", {
      className: "login-input form-textarea",
      placeholder: "Instruções de preparo",
      minlength: "10",
      maxlength: "1000",
      rows: "6",
    });
    instructionsInput.value = record.instructions || "";

    var ingredientList = h("div", { className: "ingredient-list" });
    var ingredients = record.ingredients || [];
    for (var i = 0; i < ingredients.length; i++) {
      ingredientList.append(
        createIngredientRow(ingredientList, ingredients[i].description)
      );
    }

    if (ingredients.length === 0) {
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

    var submitDraftBtn = null;
    if (isDraft) {
      submitDraftBtn = h(
        "button",
        { type: "button", className: "btn btn-draft form-submit" },
        "Salvar rascunho"
      );
    }

    var submitBtn = h(
      "button",
      { type: "submit", className: "btn btn-primary form-submit" },
      isDraft ? "Salvar receita" : "Salvar alterações"
    );

    var toggleCheckbox = h("input", {
      type: "checkbox",
      className: "toggle-input",
      id: "is-public-toggle-edit",
    });
    toggleCheckbox.checked = !isDraft && !!record.is_public;

    var toggleSwitch = h("label", { className: "toggle", for: "is-public-toggle-edit" }, [
      toggleCheckbox,
      h("span", { className: "toggle-slider" }),
      h("span", { className: "toggle-label" }, "Receita pública"),
    ]);
    toggleSwitch.hidden = isDraft;

    var discardBtn = h(
      "button",
      { type: "button", className: "btn btn-danger form-submit" },
      isDraft ? "Descartar rascunho" : "Deletar receita"
    );

    var actions = h("div", { className: "form-actions" }, [submitBtn, discardBtn]);
    if (submitDraftBtn) {
      actions.prepend(submitDraftBtn);
    }

    var form = h("form", { className: "form-create-recipe" }, [
      errorMsg,
      h("label", { className: "form-label" }, "Título"),
      titleInput,
      App.charCounter.attach(titleInput, 40),
      h("label", { className: "form-label" }, "Descrição"),
      descInput,
      App.charCounter.attach(descInput, 50),
      h("label", { className: "form-label" }, "Ingredientes"),
      ingredientList,
      addIngredientBtn,
      h("label", { className: "form-label" }, "Instruções"),
      instructionsInput,
      App.charCounter.attach(instructionsInput, 1000),
      toggleSwitch,
      actions,
    ]);

    function setLoading(loading) {
      if (submitDraftBtn) {
        submitDraftBtn.disabled = loading;
        submitDraftBtn.textContent = loading ? "Salvando..." : "Salvar rascunho";
      }
      submitBtn.disabled = loading;
      submitBtn.textContent = loading
        ? "Salvando..."
        : isDraft
          ? "Salvar receita"
          : "Salvar alterações";
      discardBtn.disabled = loading;
      discardBtn.textContent = isDraft ? "Descartar rascunho" : "Deletar receita";
      addIngredientBtn.disabled = loading;
      titleInput.disabled = loading;
      descInput.disabled = loading;
      instructionsInput.disabled = loading;
    }

    function readFields() {
      return {
        title: titleInput.value.trim(),
        description: descInput.value.trim(),
        instructions: instructionsInput.value.trim(),
        ingredients: collectIngredients(ingredientList),
      };
    }

    function saveDraft() {
      var fields = readFields();
      errorMsg.textContent = "";
      setLoading(true);

      App.http
        .put("/drafts/" + record.id, {
          title: fields.title || null,
          description: fields.description || null,
          instructions: fields.instructions || null,
          ingredients: fields.ingredients,
        })
        .then(function () {
          App.toast.success("Rascunho salvo.");
          window.location.hash = "#/drafts";
        })
        .catch(function (err) {
          setLoading(false);
          errorMsg.textContent = extractErrorMessage(err);
        });
    }

    function saveRecipe() {
      var fields = readFields();
      errorMsg.textContent = "";

      if (!fields.title || !fields.description || !fields.instructions || fields.ingredients.length === 0) {
        errorMsg.textContent = "Preencha todos os campos e adicione ao menos um ingrediente.";
        return;
      }

      setLoading(true);

      var payload = {
        title: fields.title,
        description: fields.description,
        instructions: fields.instructions,
        ingredients: fields.ingredients,
        is_public: toggleCheckbox.checked,
      };

      var request = isDraft
        ? App.http.post("/recipes/", payload).then(function () {
            return App.http.delete("/drafts/" + record.id).catch(function () {});
          })
        : App.http.put("/recipes/" + record.id, payload);

      request
        .then(function () {
          if (isDraft) {
            App.toast.success("Receita criada com sucesso!");
            window.location.hash = "#/";
            return;
          }
          App.toast.success("Receita atualizada com sucesso.");
          setLoading(false);
        })
        .catch(function (err) {
          setLoading(false);
          errorMsg.textContent = extractErrorMessage(err);
        });
    }

    function discardRecord() {
      var confirmMsg = isDraft
        ? "Tem certeza que deseja descartar este rascunho?"
        : "Tem certeza que deseja deletar esta receita?";
      if (!confirm(confirmMsg)) return;

      errorMsg.textContent = "";
      setLoading(true);
      discardBtn.textContent = isDraft ? "Descartando..." : "Deletando...";

      var endpoint = isDraft ? "/drafts/" + record.id : "/recipes/" + record.id;

      App.http
        .delete(endpoint)
        .then(function () {
          window.location.hash = isDraft ? "#/drafts" : "#/";
        })
        .catch(function (err) {
          setLoading(false);
          errorMsg.textContent = extractErrorMessage(err);
        });
    }

    if (submitDraftBtn) {
      submitDraftBtn.addEventListener("click", saveDraft);
    }

    discardBtn.addEventListener("click", discardRecord);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      saveRecipe();
    });

    var backBtn = h(
      "button",
      { type: "button", className: "btn btn-secondary form-back-btn" },
      isDraft ? "Voltar" : "Voltar à receita"
    );

    backBtn.addEventListener("click", function () {
      window.location.hash = isDraft ? "#/drafts" : "#/recipe/" + record.id;
    });

    var page = h("div", { className: "page" }, [
      h("h1", { className: "page-title" }, isDraft ? "Editar rascunho" : "Editar Receita"),
      h("p", { className: "page-subtitle" }, record.title || "Sem título"),
      h("div", { className: "form-create-recipe" }, [backBtn]),
      form,
    ]);

    container.append(page);
    titleInput.focus();
  }

  App.pages.renderEditRecipe = function renderEditRecipe(container, path) {
    var isDraft = isDraftPath(path);
    var recordId = extractId(path);
    var loading = h("p", { className: "page-empty" }, isDraft ? "Carregando rascunho..." : "Carregando receita...");
    var page = h("div", { className: "page" });

    page.append(loading);
    container.append(page);

    if (!recordId || recordId === "edit-recipe" || recordId === "edit-draft") {
      loading.textContent = isDraft ? "Rascunho não encontrado." : "Receita não encontrada.";
      return;
    }

    var endpoint = isDraft ? "/drafts/" + recordId : "/recipes/" + recordId;

    App.http
      .get(endpoint)
      .then(function (record) {
        var store = App._store;
        var user = store.get("user");

        if (!user || record.author_id !== user.id) {
          loading.textContent = isDraft
            ? "Você não tem permissão para editar este rascunho."
            : "Você não tem permissão para editar esta receita.";
          return;
        }

        page.remove();
        renderEditForm(record, container, isDraft);
      })
      .catch(function (err) {
        if (err.status === 404) {
          loading.textContent = isDraft ? "Rascunho não encontrado." : "Receita não encontrada.";
          return;
        }
        loading.textContent = isDraft ? "Erro ao carregar rascunho." : "Erro ao carregar receita.";
      });
  };
})();
