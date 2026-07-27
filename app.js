(function () {
  if (window.location.pathname.endsWith("/index.html")) {
    const cleanPath = window.location.pathname.slice(0, -"index.html".length);
    window.history.replaceState(null, "", cleanPath + window.location.search + window.location.hash);
  }

  const grid = document.getElementById("produtos-grid");
  const filtersEl = document.getElementById("filters");
  const filtersStatusEl = document.getElementById("filters-status");
  grid.setAttribute("aria-busy", "true");
  document.getElementById("brand-name").textContent = SITE_CONFIG.siteName;
  document.getElementById("brand-name-2").textContent = SITE_CONFIG.siteName;
  document.getElementById("tagline").textContent = SITE_CONFIG.tagline;
  document.title = SITE_CONFIG.siteName + " — Impressão 3D sob medida em Birigui";

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

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[character]);
  }

  function whatsappHref(productName) {
    const message = productName
      ? `Olá! Vi o produto ${productName} no site e gostaria de pedir um orçamento.`
      : "Olá! Conheci a Sete Vidas Maker pelo site e gostaria de pedir um orçamento.";
    return `${whatsappBase}?text=${encodeURIComponent(message)}`;
  }

  let allProducts = [];
  const requestedFilter = new URLSearchParams(window.location.search).get("categoria");
  let activeFilter = requestedFilter || "all";

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
      btn.type = "button";
      btn.setAttribute("aria-pressed", String(b.id === activeFilter));
      btn.addEventListener("click", () => {
        activeFilter = b.id;
        const nextUrl = new URL(window.location.href);
        if (activeFilter === "all") nextUrl.searchParams.delete("categoria");
        else nextUrl.searchParams.set("categoria", activeFilter);
        window.history.replaceState(null, "", nextUrl);
        renderFilters();
        renderGrid();
      });
      filtersEl.appendChild(btn);
    });
  }

  function renderGrid() {
    const items = activeFilter === "all" ? allProducts : allProducts.filter((p) => productCategories(p).includes(activeFilter));
    if (filtersStatusEl) {
      const selection = activeFilter === "all" ? "todas as categorias" : catLabel(activeFilter);
      filtersStatusEl.innerHTML = `<strong>${items.length}</strong> ${items.length === 1 ? "produto" : "produtos"} em <b>${selection}</b>`;
    }

    if (items.length === 0) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3>Ainda não há uma peça nessa categoria</h3>
          <p>Isso não significa que sua ideia não possa ser produzida. Conte o que você precisa e avaliamos juntos.</p>
          <a class="button button-primary" href="${whatsappHref()}" target="_blank" rel="noopener">Conversar pelo WhatsApp</a>
        </div>`;
      grid.setAttribute("aria-busy", "false");
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

      const productName = escapeHtml(p.name);
      const productUrl = `produto.html?id=${encodeURIComponent(p.id)}`;
      card.innerHTML = `
        <div class="card-image-wrap">
          <span class="cat-chip">${escapeHtml(catLabel(displayCategory))}</span>
          <img src="${escapeHtml(p.image || "images/logo-mark.png")}" alt="${productName}" loading="lazy" decoding="async">
        </div>
        <div class="card-body">
          <h3>${productName}</h3>
          <div class="card-stats">
            ${p.material ? `<span><b>Material</b> ${escapeHtml(p.material)}</span>` : ""}
            ${p.color ? `<span><b>Cor</b> ${escapeHtml(p.color)}</span>` : ""}
            ${p.printTime ? `<span><b>Produção</b> ${escapeHtml(p.printTime)}</span>` : ""}
          </div>
          <p class="card-desc">${escapeHtml(p.description || "")}</p>
          ${p.tags && p.tags.length ? `<div class="card-tags">${p.tags.map((t) => `<span class="tag">${escapeHtml(t)}</span>`).join("")}</div>` : ""}
          <div class="card-actions">
            <a class="product-link" href="${productUrl}">Ver detalhes <span aria-hidden="true">→</span></a>
            <a class="card-whatsapp" href="${whatsappHref(p.name)}" target="_blank" rel="noopener" aria-label="Pedir orçamento de ${productName}">Pedir orçamento</a>
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
    grid.setAttribute("aria-busy", "false");
  }

  fetch("products.json", { cache: "no-cache" })
    .then((response) => {
      if (!response.ok) throw new Error("Falha ao carregar catálogo");
      return response.json();
    })
    .then((data) => {
      allProducts = data;
      const validFilters = new Set(["all", ...allProducts.flatMap(productCategories)]);
      if (!validFilters.has(activeFilter)) activeFilter = "all";
      renderFilters();
      renderGrid();
    })
    .catch(() => {
      grid.setAttribute("aria-busy", "false");
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3>O catálogo não carregou agora</h3>
          <p>Atualize a página em alguns instantes ou fale diretamente conosco.</p>
          <a class="button button-primary" href="${whatsappHref()}" target="_blank" rel="noopener">Conversar pelo WhatsApp</a>
        </div>`;
    });
})();
