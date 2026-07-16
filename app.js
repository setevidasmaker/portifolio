(function () {
  if (window.location.pathname.endsWith("/index.html")) {
    const cleanPath = window.location.pathname.slice(0, -"index.html".length);
    window.history.replaceState(null, "", cleanPath + window.location.search + window.location.hash);
  }

  const grid = document.getElementById("produtos-grid");
  const filtersEl = document.getElementById("filters");
  document.getElementById("brand-name").textContent = SITE_CONFIG.siteName;
  document.getElementById("brand-name-2").textContent = SITE_CONFIG.siteName;
  document.getElementById("tagline").textContent = SITE_CONFIG.tagline;
  document.title = SITE_CONFIG.siteName + " — Portfólio";

  const contact = SITE_CONFIG.contact || {};
  const whatsappBase = `https://wa.me/${contact.whatsapp || "5518981315272"}`;
  document.querySelectorAll(".js-whatsapp").forEach((link) => {
    link.href = `${whatsappBase}?text=${encodeURIComponent("Olá! Conheci a Sete Vidas Maker pelo site e gostaria de pedir um orçamento.")}`;
    link.target = "_blank";
    link.rel = "noopener";
  });
  document.querySelectorAll(".js-instagram").forEach((link) => {
    link.href = contact.instagram || "https://www.instagram.com/setevidasmaker/";
  });
  const phoneEl = document.querySelector(".contact-phone");
  if (phoneEl) phoneEl.textContent = contact.phoneDisplay || "(18) 98131-5272";

  const categoryMap = {};
  SITE_CONFIG.categories.forEach((c) => (categoryMap[c.id] = c));

  let allProducts = [];
  const requestedFilter = new URLSearchParams(window.location.search).get("categoria");
  let activeFilter = requestedFilter || "infantil";

  function catColor(catId) {
    return (categoryMap[catId] && categoryMap[catId].color) || "#8478AC";
  }
  function catLabel(catId) {
    return (categoryMap[catId] && categoryMap[catId].label) || catId;
  }
  function productCategories(product) {
    const categories = Array.isArray(product.categories) ? product.categories.filter(Boolean) : [];
    if (product.category && !categories.includes(product.category)) categories.unshift(product.category);
    return categories.length ? categories : ["outros"];
  }

  function isChildAbsProduct(product) {
    return productCategories(product).includes("infantil") && /\bABS\b/i.test(product.material || "");
  }

  function renderFilters() {
    const availableCategories = SITE_CONFIG.categories.filter((category) =>
      allProducts.some((product) => productCategories(product).includes(category.id))
    );
    const buttons = [{ id: "all", label: "Todos" }, ...availableCategories.map((c) => ({ id: c.id, label: c.label }))];
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
    const items = activeFilter === "all" ? allProducts : allProducts.filter((p) => productCategories(p).includes(activeFilter));

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
      const displayCategory = activeFilter !== "all" && productCategories(p).includes(activeFilter)
        ? activeFilter
        : (p.category || productCategories(p)[0]);
      const card = document.createElement("article");
      card.className = "card";
      card.style.setProperty("--cat-color", catColor(displayCategory));
      card.style.animationDelay = (i * 0.04) + "s";

      card.innerHTML = `
        <div class="card-image-wrap">
          <span class="cat-chip">${catLabel(displayCategory)}</span>
          <img src="${p.image || "images/logo-mark.png"}" alt="${p.name}" loading="lazy">
        </div>
        <div class="card-body">
          <h3>${p.name}</h3>
          <div class="card-stats">
            ${p.material ? `<span><b>Material</b> ${p.material}</span>` : ""}
            ${p.color ? `<span><b>Cor</b> ${p.color}</span>` : ""}
            ${p.printTime ? `<span><b>Impressão</b> ${p.printTime}</span>` : ""}
          </div>
          <p class="card-desc">${p.description || ""}</p>
          ${isChildAbsProduct(p) ? `<p class="child-safety-note"><strong>Atenção:</strong> peça em ABS, material derivado do petróleo. Não levar à boca e utilizar sob supervisão de um adulto.</p>` : ""}
          ${p.tags && p.tags.length ? `<div class="card-tags">${p.tags.map((t) => `<span class="tag">${t}</span>`).join("")}</div>` : ""}
          <a class="product-link" href="produto.html?id=${encodeURIComponent(p.id)}">Ver detalhes <span aria-hidden="true">→</span></a>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  fetch("products.json?_=" + Date.now())
    .then((r) => r.json())
    .then((data) => {
      allProducts = data;
      const validFilters = new Set(["all", ...allProducts.flatMap(productCategories)]);
      if (!validFilters.has(activeFilter)) activeFilter = "infantil";
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
