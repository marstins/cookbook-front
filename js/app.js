(function () {
  "use strict";

  var appRoot = document.getElementById("app");

  var STORAGE_KEY = "cookbook_user";

  var savedUser = null;
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (raw) savedUser = JSON.parse(raw);
  } catch (_) {}

  var store = new App.Store({
    appName: "Cookbook",
    user: savedUser,
    authView: "login",
  });

  App._store = store;

  function bootstrap() {
    appRoot.innerHTML = "";

    var user = store.get("user");

    if (!user) {
      renderAuthView();
      return;
    }

    renderAppShell();
  }

  function renderAuthView() {
    var view = store.get("authView");

    if (view === "register") {
      App.pages.renderRegister(appRoot, { store: store });
      return;
    }

    App.pages.renderLogin(appRoot, { store: store });
  }

  function renderAppShell() {
    var header = App.dom.createElement("header", { id: "app-header" });
    var main = App.dom.createElement("main", { id: "app-main" });

    appRoot.append(header, main);

    new App.Router("#app-main")
      .addRoute("/", App.pages.renderCookbook)
      .addRoute("/create-recipe", App.pages.renderCreateRecipe)
      .addRoute("/recipe", App.pages.renderViewRecipe)
      .addRoute("/edit-recipe", App.pages.renderEditRecipe)
      .addRoute("/discover", App.pages.renderDiscover)
      .setFallback(App.pages.renderNotFound)
      .start();

    App.components.renderHeader(header, { store: store });
  }

  store.subscribe("user", function (user) {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    bootstrap();
  });

  store.subscribe("authView", function () {
    if (!store.get("user")) {
      bootstrap();
    }
  });

  bootstrap();
})();
