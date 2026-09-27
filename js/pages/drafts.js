(function () {
  "use strict";

  window.App = window.App || {};
  App.pages = App.pages || {};

  var h = App.dom.createElement;
  var DEFAULT_PER_PAGE = 10;

  var TRASH_ICON =
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

  function icon(markup) {
    var wrap = document.createElement("span");
    wrap.className = "icon";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML = markup;
    return wrap;
  }

  function renderDraftCard(draft, onDeleted) {
    var ingredientsList = h("ul", { className: "recipe-ingredients" });
    var ingredients = Array.isArray(draft.ingredients) ? draft.ingredients : [];

    for (var i = 0; i < ingredients.length; i++) {
      ingredientsList.append(
        h("li", {}, ingredients[i].description || "")
      );
    }

    if (ingredients.length === 0) {
      ingredientsList.append(h("li", {}, "Nenhum ingrediente"));
    }

    var editBtn = h(
      "button",
      { type: "button", className: "btn btn-primary btn-sm btn-view-recipe" },
      "Editar"
    );

    editBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      window.location.hash = "#/edit-draft/" + draft.id;
    });

    var deleteBtn = h(
      "button",
      {
        type: "button",
        className: "btn-icon-delete",
        "aria-label": "Excluir rascunho",
        title: "Excluir rascunho",
      },
      [icon(TRASH_ICON)]
    );

    deleteBtn.addEventListener("click", function (e) {
      e.stopPropagation();

      App.confirmDialog({
        title: "Excluir rascunho?",
        message: "O rascunho \"" + (draft.title || "Sem título") + "\" será excluído. Essa ação não pode ser desfeita.",
        confirmLabel: "Excluir",
      }).then(function (confirmed) {
        if (!confirmed) return;

        deleteBtn.disabled = true;

        App.http
          .delete("/drafts/" + draft.id)
          .then(function () {
            onDeleted();
          })
          .catch(function (err) {
            deleteBtn.disabled = false;
            var data = err.data;
            var msg = data && data.message ? data.message : "Erro ao excluir rascunho.";
            alert(msg);
          });
      });
    });

    var card = h("div", { className: "recipe-card recipe-card--clickable" }, [
      h("div", { className: "recipe-card-body" }, [
        h("h3", { className: "recipe-card-title" }, draft.title || "Sem título"),
        h("p", { className: "recipe-card-desc" }, draft.description || "Sem descrição"),
        h("span", { className: "recipe-card-label" }, "Ingredientes"),
        ingredientsList,
        h("span", { className: "recipe-card-label" }, "Modo de preparo"),
        h("p", { className: "recipe-card-instructions" }, draft.instructions || "Sem instruções"),
      ]),
      h("div", { className: "recipe-card-footer" }, [
        deleteBtn,
        editBtn,
      ]),
    ]);

    card.addEventListener("click", function () {
      window.location.hash = "#/edit-draft/" + draft.id;
    });

    return card;
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
      pag.total_items + (pag.total_items === 1 ? " rascunho" : " rascunhos")
    );

    container.append(prevBtn, pageInfo, nextBtn, totalInfo);
  }

  App.pages.renderDrafts = function renderDrafts(container) {
    var store = App._store;
    var user = store.get("user");

    var grid = h("div", { className: "recipe-grid" });
    var emptyMsg = h("p", { className: "page-empty" }, "Carregando rascunhos...");
    var pagination = h("div", { className: "pagination" });

    var page = h("div", { className: "page" }, [
      h("h1", { className: "page-title" }, "Rascunhos"),
      h("p", { className: "page-subtitle" }, "Importações e edições que ainda não viraram receita."),
      emptyMsg,
      grid,
      pagination,
    ]);

    container.append(page);

    function loadPage(pageNum) {
      grid.innerHTML = "";
      emptyMsg.textContent = "Carregando rascunhos...";
      pagination.innerHTML = "";

      App.http
        .get("/drafts/author/" + user.id + "?page=" + pageNum + "&per_page=" + DEFAULT_PER_PAGE)
        .then(function (response) {
          var drafts = response.items;
          var pag = response.pagination;

          emptyMsg.textContent = "";

          if (!drafts || drafts.length === 0) {
            emptyMsg.textContent = pageNum === 1
              ? "Você ainda não tem rascunhos."
              : "Nenhum rascunho nesta página.";
            if (pag && pag.total_pages > 0) {
              renderPagination(pagination, pag, loadPage);
            }
            return;
          }

          for (var i = 0; i < drafts.length; i++) {
            grid.append(renderDraftCard(drafts[i], function () {
              loadPage(pageNum);
            }));
          }

          renderPagination(pagination, pag, loadPage);
        })
        .catch(function () {
          emptyMsg.textContent = "Erro ao carregar rascunhos.";
        });
    }

    loadPage(1);
  };
})();
