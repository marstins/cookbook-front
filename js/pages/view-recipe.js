(function () {
  "use strict";

  window.App = window.App || {};
  App.pages = App.pages || {};

  var h = App.dom.createElement;

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
        if (!confirm("Tem certeza que deseja deletar esta receita?")) return;

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

    var metaChildren = [
      h("span", { className: "detail-author" }, "Por " + recipe.author_name),
      h("span", { className: "detail-date" }, new Date(recipe.created_at).toLocaleDateString("pt-BR")),
    ];

    var cardChildren = [
      h("div", { className: "detail-header" }, [
        h("h1", { className: "detail-title" }, recipe.title),
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
