(function () {
  "use strict";

  window.App = window.App || {};
  App.pages = App.pages || {};

  var h = App.dom.createElement;
  var DEFAULT_PER_PAGE = 10;

  function renderRecipeCard(recipe) {
    var ingredientsList = h("ul", { className: "recipe-ingredients" });

    for (var i = 0; i < recipe.ingredients.length; i++) {
      ingredientsList.append(
        h("li", {}, recipe.ingredients[i].description)
      );
    }

    var viewBtn = h(
      "button",
      { type: "button", className: "btn btn-primary btn-sm btn-view-recipe" },
      "Ver receita"
    );

    viewBtn.addEventListener("click", function () {
      window.location.hash = "#/recipe/" + recipe.id;
    });

    var bodyChildren = [
      h("h3", { className: "recipe-card-title" }, recipe.title),
      h("p", { className: "recipe-card-desc" }, recipe.description),
      h("span", { className: "recipe-card-label" }, "Ingredientes"),
      ingredientsList,
      h("span", { className: "recipe-card-label" }, "Modo de preparo"),
      h("p", { className: "recipe-card-instructions" }, recipe.instructions),
    ];

    if (recipe.original_author_name && recipe.original_recipe_id) {
      var originalLink = h(
        "a",
        { href: "#/recipe/" + recipe.original_recipe_id, className: "original-recipe-link" },
        "Receita original"
      );

      bodyChildren.push(
        h("p", { className: "recipe-card-original" }, [
          originalLink,
          " por " + recipe.original_author_name,
        ])
      );
    }

    return h("div", { className: "recipe-card" }, [
      h("div", { className: "recipe-card-body" }, bodyChildren),
      h("div", { className: "recipe-card-footer recipe-card-footer--end" }, [
        viewBtn,
      ]),
    ]);
  }

  function renderPagination(container, pag, onPageChange) {
    container.innerHTML = "";

    var prevBtn = h(
      "button",
      { type: "button", className: "btn btn-secondary btn-sm" },
      "Anterior"
    );
    prevBtn.disabled = pag.page <= 1;
    prevBtn.addEventListener("click", function () {
      if (pag.page > 1) onPageChange(pag.page - 1);
    });

    var pageInfo = h("span", { className: "pagination-info" },
      "Página " + pag.page + " de " + pag.total_pages
    );

    var nextBtn = h(
      "button",
      { type: "button", className: "btn btn-secondary btn-sm" },
      "Próxima"
    );
    nextBtn.disabled = pag.page >= pag.total_pages;
    nextBtn.addEventListener("click", function () {
      if (pag.page < pag.total_pages) onPageChange(pag.page + 1);
    });

    var totalInfo = h("span", { className: "pagination-total" },
      pag.total_items + (pag.total_items === 1 ? " receita" : " receitas")
    );

    container.append(prevBtn, pageInfo, nextBtn, totalInfo);
  }

  App.pages.renderCookbook = function renderCookbook(container) {
    var store = App._store;
    var user = store.get("user");

    var grid = h("div", { className: "recipe-grid" });
    var emptyMsg = h("p", { className: "page-empty" }, "Carregando receitas...");
    var pagination = h("div", { className: "pagination" });

    var page = h("div", { className: "page" }, [
      h("h1", { className: "page-title" }, "Livro de Receitas"),
      h("p", { className: "page-subtitle" }, "Suas receitas salvas aparecem aqui."),
      emptyMsg,
      grid,
      pagination,
    ]);

    container.append(page);

    function loadPage(pageNum) {
      grid.innerHTML = "";
      emptyMsg.textContent = "Carregando receitas...";
      pagination.innerHTML = "";

      App.http
        .get("/recipes/author/" + user.id + "?page=" + pageNum + "&per_page=" + DEFAULT_PER_PAGE)
        .then(function (response) {
          var recipes = response.items;
          var pag = response.pagination;

          emptyMsg.textContent = "";

          if (!recipes || recipes.length === 0) {
            emptyMsg.textContent = pageNum === 1
              ? "Você ainda não tem receitas."
              : "Nenhuma receita nesta página.";
            if (pag.total_pages > 0) {
              renderPagination(pagination, pag, loadPage);
            }
            return;
          }

          for (var i = 0; i < recipes.length; i++) {
            grid.append(renderRecipeCard(recipes[i]));
          }

          renderPagination(pagination, pag, loadPage);
        })
        .catch(function () {
          emptyMsg.textContent = "Erro ao carregar receitas.";
        });
    }

    loadPage(1);
  };
})();
