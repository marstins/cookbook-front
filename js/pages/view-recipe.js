(function () {
  "use strict";

  window.App = window.App || {};
  App.pages = App.pages || {};

  var h = App.dom.createElement;

  var COPY_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

  function icon(markup) {
    var wrap = document.createElement("span");
    wrap.className = "icon";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = markup;
    return wrap;
  }

  function formatRecipeText(recipe) {
    var lines = [recipe.title || "", "", "Ingredientes"];
    var ingredients = recipe.ingredients || [];

    for (var i = 0; i < ingredients.length; i++) {
      var item = ingredients[i];
      var description = item && item.description ? item.description : item;
      lines.push("- " + description);
    }

    lines.push("", "Modo de preparo", recipe.instructions || "");
    return lines.join("\n");
  }

  function copyWithExecCommand(text) {
    return new Promise(function (resolve, reject) {
      var textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();

      try {
        var ok = document.execCommand("copy");
        document.body.removeChild(textarea);
        if (ok) resolve();
        else reject(new Error("copy failed"));
      } catch (err) {
        document.body.removeChild(textarea);
        reject(err);
      }
    });
  }

  function copyToClipboard(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text).catch(function () {
        return copyWithExecCommand(text);
      });
    }

    return copyWithExecCommand(text);
  }

  function extractRecipeId(path) {
    var parts = path.split("/");
    return parts[parts.length - 1] || "";
  }

  function renderRecipeDetail(recipe, container, userId) {
    var ingredientsList = h("ul", { className: "detail-ingredients" });

    for (var i = 0; i < recipe.ingredients.length; i++) {
      ingredientsList.append(
        h("li", {}, recipe.ingredients[i].description)
      );
    }

    var actions = h("div", { className: "detail-actions" });

    var backBtn = h(
      "button",
      { type: "button", className: "btn btn-secondary" },
      "Voltar"
    );

    backBtn.addEventListener("click", function () {
      window.location.hash = "#/";
    });

    actions.append(backBtn);

    if (recipe.author_id === userId) {
      var deleteBtn = h(
        "button",
        { type: "button", className: "btn btn-danger" },
        "Deletar"
      );

      deleteBtn.addEventListener("click", function () {
        App.confirmDialog({
          title: "Deletar receita?",
          message: "A receita \"" + recipe.title + "\" será deletada. Essa ação não pode ser desfeita.",
          confirmLabel: "Deletar",
        }).then(function (confirmed) {
          if (!confirmed) return;

          deleteBtn.disabled = true;
          deleteBtn.textContent = "Deletando...";

          App.http
            .delete("/recipes/" + recipe.id)
            .then(function () {
              window.location.hash = "#/";
            })
            .catch(function (err) {
              deleteBtn.disabled = false;
              deleteBtn.textContent = "Deletar";

              var data = err.data;
              var msg = (data && data.message) ? data.message : "Erro ao deletar receita.";
              alert(msg);
            });
        });
      });

      var editBtn = h(
        "button",
        { type: "button", className: "btn btn-primary" },
        "Editar"
      );

      editBtn.addEventListener("click", function () {
        window.location.hash = "#/edit-recipe/" + recipe.id;
      });

      actions.append(editBtn);
      actions.prepend(deleteBtn);
    } else if (userId) {
      var saveBtn = h(
        "button",
        { type: "button", className: "btn btn-primary" },
        "Salvar"
      );

      saveBtn.addEventListener("click", function () {
        saveBtn.disabled = true;
        saveBtn.textContent = "Salvando...";

        App.http
          .post("/recipes/save", { recipe_id: recipe.id })
          .then(function () {
            window.location.hash = "#/discover";
          })
          .catch(function (err) {
            saveBtn.disabled = false;
            saveBtn.textContent = "Salvar";

            var data = err.data;
            var msg = (data && data.message) ? data.message : "Erro ao salvar receita.";
            alert(msg);
          });
      });

      actions.append(saveBtn);
    }

    var visibilityBadge = h(
      "span",
      { className: recipe.is_public ? "badge badge-public" : "badge badge-private" },
      recipe.is_public ? "Pública" : "Privada"
    );

    var copyBtn = h(
      "button",
      {
        type: "button",
        className: "btn-icon-copy",
        "aria-label": "Copiar receita",
        title: "Copiar receita",
      },
      [icon(COPY_ICON)]
    );

    var copyFeedback = h("span", { className: "copy-feedback", role: "status" });
    var copyTimer = null;

    copyBtn.addEventListener("click", function () {
      copyToClipboard(formatRecipeText(recipe))
        .then(function () {
          clearTimeout(copyTimer);
          copyBtn.classList.add("is-copied");
          copyFeedback.textContent = "Copiado!";
          copyTimer = setTimeout(function () {
            copyBtn.classList.remove("is-copied");
            copyFeedback.textContent = "";
          }, 2000);
        })
        .catch(function () {
          alert("Não foi possível copiar a receita.");
        });
    });

    var metaChildren = [
      h("span", { className: "detail-author" }, "Por " + recipe.author_name),
      h("span", { className: "detail-date" }, new Date(recipe.created_at).toLocaleDateString("pt-BR")),
    ];

    var cardChildren = [
      h("div", { className: "detail-header" }, [
        h("div", { className: "detail-title-group" }, [
          h("h1", { className: "detail-title" }, recipe.title),
          copyBtn,
          copyFeedback,
        ]),
        visibilityBadge,
      ]),
      h("p", { className: "detail-desc" }, recipe.description),
      h("div", { className: "detail-meta" }, metaChildren),
    ];

    if (recipe.original_author_name && recipe.original_recipe_id) {
      var originalLink = h(
        "a",
        { href: "#/recipe/" + recipe.original_recipe_id, className: "original-recipe-link" },
        "Receita original"
      );

      cardChildren.push(
        h("p", { className: "detail-original" }, [
          originalLink,
          " por " + recipe.original_author_name,
        ])
      );
    }

    cardChildren.push(
      h("hr", { className: "detail-divider" }),
      h("h2", { className: "detail-section-title" }, "Ingredientes"),
      ingredientsList,
      h("h2", { className: "detail-section-title" }, "Modo de Preparo"),
      h("p", { className: "detail-instructions" }, recipe.instructions),
      h("hr", { className: "detail-divider" }),
      actions
    );

    var card = h("div", { className: "detail-card" }, cardChildren);

    container.append(card);
  }

  App.pages.renderViewRecipe = function renderViewRecipe(container, path) {
    var store = App._store;
    var user = store.get("user");
    var recipeId = extractRecipeId(path);

    var page = h("div", { className: "page detail-page" });
    var loading = h("p", { className: "page-empty" }, "Carregando receita...");

    page.append(loading);
    container.append(page);

    if (!recipeId) {
      loading.textContent = "Receita não encontrada.";
      return;
    }

    App.http
      .get("/recipes/" + recipeId)
      .then(function (recipe) {
        loading.remove();
        renderRecipeDetail(recipe, page, user ? user.id : null);
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
