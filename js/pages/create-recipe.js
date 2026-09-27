(function () {
  "use strict";

  window.App = window.App || {};
  App.pages = App.pages || {};

  var h = App.dom.createElement;

  var NETWORK_ERROR = "Não foi possível conectar ao servidor. Tente novamente.";
  var GENERIC_ERROR = "Ocorreu um erro inesperado. Tente novamente.";
  var FILE_TOO_LARGE = "O arquivo enviado é grande demais.";
  var FILE_TYPE_INVALID = "Envie um arquivo PNG, JPG ou PDF.";
  var ALLOWED_TYPES = {
    "image/jpeg": true,
    "image/png": true,
    "application/pdf": true,
  };

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

  function inferFileType(file) {
    if (file.type && ALLOWED_TYPES[file.type]) return file.type;
    var name = (file.name || "").toLowerCase();
    if (name.slice(-4) === ".jpg" || name.slice(-5) === ".jpeg") return "image/jpeg";
    if (name.slice(-4) === ".png") return "image/png";
    if (name.slice(-4) === ".pdf") return "application/pdf";
    return "";
  }

  function normalizeDataUri(dataUri) {
    return dataUri.replace(/^data:image\/jpg;base64,/i, "data:image/jpeg;base64,");
  }

  function readFileAsDataUri(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () {
        resolve(normalizeDataUri(String(reader.result || "")));
      };
      reader.onerror = function () {
        reject(new Error("Não foi possível ler o arquivo."));
      };
      reader.readAsDataURL(file);
    });
  }

  function createIngredientRow(list, value) {
    var input = h("input", {
      type: "text",
      className: "login-input",
      placeholder: "Ingrediente",
      required: "true",
      minlength: "1",
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
    for (var i = 0; i < ingredientRows.length; i++) {
      var val = ingredientRows[i].value.trim();
      if (val) ingredients.push({ description: val });
    }
    return ingredients;
  }

  App.pages.renderCreateRecipe = function renderCreateRecipe(container) {
    var draftId = null;

    var uploadError = h("p", { className: "login-error form-upload-error" });
    var fileInput = h("input", {
      type: "file",
      className: "form-upload-input",
      accept: "image/png,image/jpeg,application/pdf,.png,.jpg,.jpeg,.pdf",
    });
    var uploadBtn = h(
      "button",
      { type: "button", className: "btn btn-primary form-upload-btn" },
      "Enviar arquivo"
    );

    var errorMsg = h("p", { className: "login-error" });

    var titleInput = h("input", {
      type: "text",
      className: "login-input",
      placeholder: "Título",
      required: "true",
      minlength: "1",
      maxlength: "40",
    });

    var descInput = h("input", {
      type: "text",
      className: "login-input",
      placeholder: "Descrição",
      required: "true",
      minlength: "1",
      maxlength: "50",
    });

    var instructionsInput = h("textarea", {
      className: "login-input form-textarea",
      placeholder: "Instruções de preparo",
      required: "true",
      minlength: "1",
      maxlength: "1000",
      rows: "6",
    });

    var ingredientList = h("div", { className: "ingredient-list" });
    ingredientList.append(createIngredientRow(ingredientList, ""));

    var addIngredientBtn = h(
      "button",
      { type: "button", className: "btn btn-secondary btn-add-ingredient" },
      "+ Ingrediente"
    );

    addIngredientBtn.addEventListener("click", function () {
      ingredientList.append(createIngredientRow(ingredientList, ""));
    });

    var submitDraftBtn = h(
      "button",
      { type: "button", className: "btn btn-draft form-submit" },
      "Salvar rascunho"
    );
    submitDraftBtn.hidden = true;

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

    var actions = h("div", { className: "form-actions" }, [submitDraftBtn, submitBtn]);

    var form = h("form", { className: "form-create-recipe", novalidate: "true" }, [
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
      uploadBtn.disabled = loading;
      fileInput.disabled = loading;
      submitDraftBtn.disabled = loading;
      submitDraftBtn.textContent = "Salvar rascunho";
      submitBtn.disabled = loading;
      submitBtn.textContent = loading ? "Criando..." : "Criar Receita";
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

    function fillFormFromDraft(draft) {
      draftId = draft.id;
      titleInput.value = draft.title || "";
      descInput.value = draft.description || "";
      instructionsInput.value = draft.instructions || "";

      ingredientList.innerHTML = "";
      var ingredients = Array.isArray(draft.ingredients) ? draft.ingredients : [];
      if (ingredients.length === 0) {
        ingredientList.append(createIngredientRow(ingredientList, ""));
      } else {
        for (var i = 0; i < ingredients.length; i++) {
          ingredientList.append(
            createIngredientRow(ingredientList, ingredients[i].description || "")
          );
        }
      }

      var isDraft = !!(draft.id && draft.is_draft === true);
      submitDraftBtn.hidden = !isDraft;
      toggleSwitch.hidden = isDraft;
      if (isDraft) toggleCheckbox.checked = false;
      App.charCounter.refresh(form);
      form.scrollIntoView({ behavior: "smooth", block: "start" });
      titleInput.focus();
    }

    function saveDraft() {
      if (!draftId) return;

      errorMsg.textContent = "";
      setLoading(true);
      submitDraftBtn.textContent = "Salvando...";

      var fields = readFields();

      App.http
        .put("/drafts/" + draftId, {
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

    function createRecipe() {
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

      var request = App.http.post("/recipes/", payload);
      if (draftId) {
        request = request.then(function () {
          return App.http.delete("/drafts/" + draftId).catch(function () {});
        });
      }

      request
        .then(function () {
          App.toast.success("Receita criada com sucesso!");
          window.location.hash = "#/";
        })
        .catch(function (err) {
          setLoading(false);
          errorMsg.textContent = extractErrorMessage(err);
        });
    }

    function importFile(file) {
      uploadError.textContent = "";
      errorMsg.textContent = "";

      if (!file) return;

      if (!inferFileType(file)) {
        uploadError.textContent = FILE_TYPE_INVALID;
        fileInput.value = "";
        return;
      }

      if (file.size > App.config.MAX_UPLOAD_BYTES) {
        uploadError.textContent = FILE_TOO_LARGE;
        fileInput.value = "";
        return;
      }

      setLoading(true);
      uploadBtn.textContent = "Lendo arquivo...";

      readFileAsDataUri(file)
        .then(function (sourceData) {
          uploadBtn.textContent = "Extraindo o texto...";
          return App.http.post("/drafts/", { source_data: sourceData });
        })
        .then(function (draft) {
          setLoading(false);
          uploadBtn.textContent = "Enviar arquivo";
          fileInput.value = "";
          if (!draft || !draft.id) {
            uploadError.textContent = GENERIC_ERROR;
            return;
          }
          fillFormFromDraft(draft);
        })
        .catch(function (err) {
          setLoading(false);
          uploadBtn.textContent = "Enviar arquivo";
          fileInput.value = "";
          if (err && err.status === 413) {
            uploadError.textContent = FILE_TOO_LARGE;
            return;
          }
          uploadError.textContent = err && err.message === "Não foi possível ler o arquivo."
            ? err.message
            : extractErrorMessage(err);
        });
    }

    uploadBtn.addEventListener("click", function () {
      fileInput.click();
    });

    fileInput.addEventListener("change", function () {
      importFile(fileInput.files && fileInput.files[0]);
    });

    submitDraftBtn.addEventListener("click", saveDraft);

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      createRecipe();
    });

    var page = h("div", { className: "page" }, [
      h("h1", { className: "page-title" }, "Criar Receita"),
      h("p", { className: "page-subtitle" }, "Crie e compartilhe uma nova receita."),
      h("div", { className: "form-upload" }, [
        uploadError,
        fileInput,
        uploadBtn,
        h("p", { className: "form-upload-hint" }, "PNG, JPG ou PDF, até 1 MB."),
      ]),
      h("p", { className: "form-or" }, "ou"),
      form,
    ]);

    container.append(page);
  };
})();
