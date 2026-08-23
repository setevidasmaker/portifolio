(function () {
  const toggle = document.querySelector(".mobile-menu-toggle");
  const navigation = document.getElementById("site-navigation");
  if (!toggle || !navigation) return;

  function setMenu(open) {
    navigation.classList.toggle("is-open", open);
    toggle.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Fechar menu" : "Abrir menu");
  }

  toggle.addEventListener("click", () => {
    setMenu(!navigation.classList.contains("is-open"));
  });

  navigation.addEventListener("click", (event) => {
    if (event.target.closest("a")) setMenu(false);
  });

  document.addEventListener("click", (event) => {
    if (!navigation.classList.contains("is-open")) return;
    if (!navigation.contains(event.target) && !toggle.contains(event.target)) setMenu(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || !navigation.classList.contains("is-open")) return;
    setMenu(false);
    toggle.focus();
  });

  window.addEventListener("resize", () => {
    if (window.innerWidth > 900) setMenu(false);
  });
})();
