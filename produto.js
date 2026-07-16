(function () {
  const detail = document.getElementById("product-detail");
  const productId = new URLSearchParams(window.location.search).get("id");
  const contact = SITE_CONFIG.contact || {};
  const whatsappBase = `https://wa.me/${contact.whatsapp || "5518981315272"}`;
  const categoryMap = Object.fromEntries(SITE_CONFIG.categories.map((category) => [category.id, category]));

  document.getElementById("detail-brand-name").textContent = SITE_CONFIG.siteName;
  document.getElementById("detail-instagram").href = contact.instagram || "https://www.instagram.com/setevidasmaker/";

  function setWhatsappLinks(productName) {
    const message = productName
      ? `Olá! Vi o produto ${productName} no site e gostaria de pedir um orçamento.`
      : "Olá! Conheci a Sete Vidas Maker pelo site e gostaria de pedir um orçamento.";
    document.querySelectorAll(".js-detail-whatsapp").forEach((link) => {
      link.href = `${whatsappBase}?text=${encodeURIComponent(message)}`;
      link.target = "_blank";
      link.rel = "noopener";
    });
  }

  function renderNotFound() {
    setWhatsappLinks();
    detail.innerHTML = `
      <div class="product-not-found">
        <h1>Produto não encontrado</h1>
        <p>Este item pode ter sido removido ou o endereço está incompleto.</p>
        <a class="button button-primary" href="index.html#produtos">Ver catálogo</a>
      </div>`;
  }

  fetch("products.json?_=" + Date.now())
    .then((response) => {
      if (!response.ok) throw new Error("Falha ao carregar catálogo");
      return response.json();
    })
    .then((products) => {
      const product = products.find((item) => item.id === productId);
      if (!product) return renderNotFound();

      const category = categoryMap[product.category] || { label: product.category, color: "#171515" };
      const categoryUrl = `index.html?categoria=${encodeURIComponent(product.category)}#produtos`;
      const shootingNote = product.category === "tiro-esportivo"
        ? `<p class="shooting-note">Produto destinado exclusivamente à organização e ao armazenamento. Munições não acompanham o produto. Utilize sempre de acordo com a legislação vigente.</p>`
        : "";

      document.title = `${product.name} — ${SITE_CONFIG.siteName}`;
      setWhatsappLinks(product.name);
      detail.innerHTML = `
        <article class="product-detail">
          <div class="product-detail-media">
            <img src="${product.image || "images/logo-mark.png"}" alt="${product.name}">
          </div>
          <div class="product-detail-copy">
            <a class="detail-category" href="${categoryUrl}" style="background:${category.color}">${category.label}</a>
            <h1>${product.name}</h1>
            <p class="detail-description">${product.description || "Peça produzida sob encomenda pela Sete Vidas Maker."}</p>
            <div class="detail-specs">
              <div><span>Material</span><strong>${product.material || "ABS"}</strong></div>
              <div><span>Cor</span><strong>${product.color || "Sob consulta"}</strong></div>
              <div><span>Produção</span><strong>${product.printTime || "Sob encomenda"}</strong></div>
            </div>
            ${product.tags && product.tags.length ? `<div class="detail-tags">${product.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>` : ""}
            <div class="detail-actions">
              <a class="button button-primary js-detail-whatsapp" href="${whatsappBase}?text=${encodeURIComponent(`Olá! Vi o produto ${product.name} no site e gostaria de pedir um orçamento.`)}" target="_blank" rel="noopener">Pedir orçamento pelo WhatsApp <span aria-hidden="true">↗</span></a>
              <a class="button button-secondary" href="${categoryUrl}">Ver mais desta categoria</a>
            </div>
            ${shootingNote}
          </div>
        </article>`;
    })
    .catch(renderNotFound);
})();
