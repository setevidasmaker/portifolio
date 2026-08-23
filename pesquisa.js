(function () {
  const results = document.getElementById("search-results");
  const status = document.getElementById("search-results-status");
  const title = document.getElementById("search-results-title");
  const form = document.getElementById("product-search-form");
  const input = document.getElementById("product-search-input");
  const clearButton = document.getElementById("search-clear");
  const contact = SITE_CONFIG.contact || {};
  const whatsappBase = `https://wa.me/${contact.whatsapp || "5518981315272"}`;
  const categoryMap = Object.fromEntries(SITE_CONFIG.categories.map((category) => [category.id, category]));
  let products = [];

  document.getElementById("search-brand-name").textContent = SITE_CONFIG.siteName;

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;",
    })[character]);
  }

  function normalize(value) {
    return String(value ?? "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function productCategories(product) {
    const categories = Array.isArray(product.categories) ? product.categories.filter(Boolean) : [];
    if (product.category && !categories.includes(product.category)) categories.unshift(product.category);
    return categories.length ? categories : ["outros"];
  }

  function categoryLabel(categoryId) {
    return categoryMap[categoryId]?.label || categoryId;
  }

  function searchableText(product) {
    const categoryText = productCategories(product).flatMap((id) => [id, categoryLabel(id)]);
    return normalize([
      product.name,
      product.description,
      product.material,
      product.color,
      ...(product.tags || []),
      ...categoryText,
    ].join(" "));
  }

  function whatsappHref(productName) {
    const message = productName
      ? `Olá! Vi o produto ${productName} no site e gostaria de pedir um orçamento.`
      : "Olá! Conheci a Sete Vidas Maker pelo site e gostaria de pedir um orçamento.";
    return `${whatsappBase}?text=${encodeURIComponent(message)}`;
  }

  document.querySelectorAll(".js-whatsapp").forEach((link) => {
    link.href = whatsappHref();
    link.target = "_blank";
    link.rel = "noopener";
  });
  document.querySelectorAll(".js-instagram").forEach((link) => {
    link.href = contact.instagram || "https://www.instagram.com/setevidasmaker/";
  });

  function matchingProducts(query) {
    const terms = normalize(query).split(" ").filter(Boolean);
    if (!terms.length) return products;
    return products.filter((product) => {
      const text = searchableText(product);
      return terms.every((term) => text.includes(term));
    });
  }

  function productCard(product, index) {
    const categoryId = product.category || productCategories(product)[0];
    const category = categoryMap[categoryId] || { label: categoryId, color: "#6F6863" };
    const productName = escapeHtml(product.name);
    const analyticsAttributes = `data-product-id="${escapeHtml(product.id)}" data-product-name="${productName}" data-product-category="${escapeHtml(category.label)}" data-item-list-name="Pesquisa de produtos"`;
    return `
      <article class="card" style="--cat-color:${escapeHtml(category.color)};animation-delay:${index * 0.04}s">
        <div class="card-image-wrap">
          <span class="cat-chip">${escapeHtml(category.label)}</span>
          <img src="${escapeHtml(product.image || "images/logo-mark.png")}" alt="${productName}" loading="lazy" decoding="async">
        </div>
        <div class="card-body">
          <h3>${productName}</h3>
          <div class="card-stats">
            ${product.material ? `<span><b>Material</b> ${escapeHtml(product.material)}</span>` : ""}
            <span><b>Produção</b> Sob encomenda</span>
          </div>
          <p class="card-desc">${escapeHtml(product.description || "")}</p>
          <div class="card-actions">
            <a class="product-link" href="produto.html?id=${encodeURIComponent(product.id)}" ${analyticsAttributes}>Ver detalhes <span aria-hidden="true">→</span></a>
            <a class="card-whatsapp" href="${whatsappHref(product.name)}" target="_blank" rel="noopener" aria-label="Pedir orçamento de ${productName}" ${analyticsAttributes}>Pedir orçamento</a>
          </div>
        </div>
      </article>`;
  }

  function render(query, updateUrl = true) {
    const cleanQuery = query.trim();
    const matches = matchingProducts(cleanQuery);
    input.value = query;
    clearButton.hidden = !cleanQuery;
    title.textContent = cleanQuery ? `Resultados para “${cleanQuery}”` : "Todos os produtos";
    status.textContent = `${matches.length} ${matches.length === 1 ? "produto encontrado" : "produtos encontrados"}`;

    if (updateUrl) {
      const nextUrl = new URL(window.location.href);
      if (cleanQuery) nextUrl.searchParams.set("q", cleanQuery);
      else nextUrl.searchParams.delete("q");
      window.history.replaceState(null, "", nextUrl);
    }

    if (matches.length) {
      results.innerHTML = matches.map(productCard).join("");
    } else {
      results.innerHTML = `
        <div class="empty-state search-empty-state">
          <span class="empty-search-icon" aria-hidden="true"></span>
          <h3>Não encontramos essa peça no portfólio</h3>
          <p>Isso não significa que ela não possa ser produzida. Envie uma referência ou explique o que precisa para avaliarmos a criação sob encomenda.</p>
          <div class="search-empty-actions">
            <button class="button button-secondary" type="button" data-clear-search>Limpar pesquisa</button>
            <a class="button button-primary js-whatsapp" href="${whatsappHref()}" target="_blank" rel="noopener">Solicitar uma peça personalizada <span aria-hidden="true">↗</span></a>
          </div>
        </div>`;
    }
    results.setAttribute("aria-busy", "false");
  }

  let typingTimer;
  input.addEventListener("input", () => {
    window.clearTimeout(typingTimer);
    typingTimer = window.setTimeout(() => render(input.value), 180);
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    window.clearTimeout(typingTimer);
    render(input.value);
  });

  clearButton.addEventListener("click", () => {
    render("");
    input.focus();
  });

  document.querySelectorAll("[data-search-term]").forEach((button) => {
    button.addEventListener("click", () => {
      render(button.dataset.searchTerm || "");
      input.focus();
    });
  });

  results.addEventListener("click", (event) => {
    if (!event.target.closest("[data-clear-search]")) return;
    render("");
    input.focus();
  });

  const initialQuery = new URLSearchParams(window.location.search).get("q") || "";
  input.value = initialQuery;

  fetch("products.json", { cache: "no-cache" })
    .then((response) => {
      if (!response.ok) throw new Error("Falha ao carregar catálogo");
      return response.json();
    })
    .then((data) => {
      products = data;
      render(initialQuery, false);
    })
    .catch(() => {
      results.setAttribute("aria-busy", "false");
      status.textContent = "Não foi possível carregar os produtos agora.";
      results.innerHTML = `<div class="empty-state"><h3>A pesquisa está indisponível</h3><p>Atualize a página em alguns instantes ou fale diretamente conosco.</p><a class="button button-primary" href="${whatsappHref()}" target="_blank" rel="noopener">Conversar pelo WhatsApp</a></div>`;
    });
})();
