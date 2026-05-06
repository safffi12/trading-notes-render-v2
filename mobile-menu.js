document.addEventListener("DOMContentLoaded", () => {
  const menu = document.querySelector("[data-mobile-quick-menu]");

  if (!menu) {
    return;
  }

  const button = menu.querySelector("[data-mobile-menu-toggle]");
  const panel = menu.querySelector("[data-mobile-menu-panel]");

  if (!button || !panel) {
    return;
  }

  function openMenu() {
    menu.classList.add("is-open");
    button.setAttribute("aria-expanded", "true");
  }

  function closeMenu() {
    menu.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  }

  button.addEventListener("click", (event) => {
    event.stopPropagation();

    if (menu.classList.contains("is-open")) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  panel.addEventListener("click", (event) => {
    event.stopPropagation();
  });

  document.addEventListener("click", () => {
    closeMenu();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
});