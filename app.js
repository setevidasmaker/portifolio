(function () {
  const grid = document.getElementById("produtos");
  const filtersEl = document.getElementById("filters");
  document.getElementById("brand-name").textContent = SITE_CONFIG.siteName;
  document.getElementById("brand-name-2").textContent = SITE_CONFIG.siteName;
  document.getElementById("tagline").textContent = SITE_CONFIG.tagline;
  document.title = SITE_CONFIG.siteName + " — Portfólio";

  const categoryMap = {};
  SITE_CONFIG.categories.forEach((c) => (categoryMap[c.id] = c));

  let allProducts = [];
  let activeFilter = "all";

  function catColor(catId) {
    return (categoryMap[catId] && categoryMap[catId].color) || "#8478AC";
  }
  function catLabel(catId) {
    return (categoryMap[catId] && categoryMap[catId].label) || catId;
  }

  function renderFilters() {
    const buttons = [{ id: "all", label: "Todos" }, ...SITE_CONFIG.categories.map((c) => ({ id: c.id, label: c.label }))];
    filtersEl.innerHTML = "";
    buttons.forEach((b) => {
      const btn = document.createElement("button");
      btn.className = "filter-btn" + (b.id === activeFilter ? " active" : "");
      btn.textContent = b.label;
      btn.addEventListener("click", () => {
        activeFilter = b.id;
        renderFilters();
        renderGrid();
      });
      filtersEl.appendChild(btn);
    });
  }

  function renderGrid() {
    const items = activeFilter === "all" ? allProducts : allProducts.filter((p) => p.category === activeFilter);

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3>Nenhuma peça catalogada ainda</h3>
          <p>Bora imprimir a primeira e cadastrar pelo painel de admin?</p>
        </div>`;
      return;
    }

    grid.innerHTML = "";
    items.forEach((p, i) => {
      const card = document.createElement("article");
      card.className = "card";
      card.style.setProperty("--cat-color", catColor(p.category));
      card.style.animationDelay = (i * 0.04) + "s";

      card.innerHTML = `
        <div class="card-image-wrap">
          <span class="cat-chip">${catLabel(p.category)}</span>
          <img src="${p.image || "images/placeholder-" + p.category + ".svg"}" alt="${p.name}" loading="lazy">
        </div>
        <div class="card-body">
          <h3>${p.name}</h3>
          <div class="card-stats">
            ${p.material ? `<span><b>Material</b> ${p.material}</span>` : ""}
            ${p.color ? `<span><b>Cor</b> ${p.color}</span>` : ""}
            ${p.printTime ? `<span><b>Impressão</b> ${p.printTime}</span>` : ""}
          </div>
          <p class="card-desc">${p.description || ""}</p>
          ${p.tags && p.tags.length ? `<div class="card-tags">${p.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>` : ""}
        </div>
      `;
      grid.appendChild(card);
    });
  }

  fetch("products.json?_=" + Date.now())
    .then((r) => r.json())
    .then((data) => {
      allProducts = data;
      renderFilters();
      renderGrid();
    })
    .catch(() => {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3>Não consegui carregar os produtos</h3>
          <p>Confira se o arquivo products.json existe no repositório.</p>
        </div>`;
    });
})();
