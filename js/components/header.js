(function () {
  "use strict";

  window.App = window.App || {};
  App.components = App.components || {};

  var h = App.dom.createElement;
  var qsa = App.dom.qsa;

  var NAV_ITEMS = [
    { label: "Livro de Receitas", path: "/" },
    { label: "Criar Receita", path: "/create-recipe" },
    { label: "Descobrir", path: "/discover" },
  ];

  App.components.renderHeader = function renderHeader(container, options) {
    var store = options.store;
    var user = store.get("user");

    var brand = h("a", { href: "#/", className: "header-brand" }, [
      store.get("appName"),
    ]);

    var nav = h("nav", { className: "header-nav" });
    for (var i = 0; i < NAV_ITEMS.length; i++) {
      var item = NAV_ITEMS[i];
      nav.append(
        h("a", { href: "#" + item.path, className: "header-nav-link" }, item.label)
      );
    }

    var logoutBtn = h("button", { className: "btn-logout" }, "Sair");
    logoutBtn.addEventListener("click", function () {
      store.set("user", null);
    });

    var userInfo = h("div", { className: "header-user" }, [
      h("span", { className: "header-user-name" }, user ? user.name : ""),
      logoutBtn,
    ]);

    var menuToggle = h(
      "button",
      { className: "btn-menu-toggle", "aria-label": "Menu" },
      [h("span", {}, "☰")]
    );

    menuToggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });

    var inner = h("div", { className: "header-inner" }, [
      brand,
      nav,
      h("div", { className: "header-actions" }, [userInfo, menuToggle]),
    ]);

    container.append(inner);

    updateActiveLink(window.location.hash.slice(1) || "/");

    window.addEventListener("route:changed", function (e) {
      updateActiveLink(e.detail.path);
      nav.classList.remove("open");
    });
  };

  function updateActiveLink(currentPath) {
    var links = qsa(".header-nav-link");
    for (var i = 0; i < links.length; i++) {
      var linkPath = links[i].getAttribute("href").slice(1);
      links[i].classList.toggle("active", linkPath === currentPath);
    }
  }
})();
