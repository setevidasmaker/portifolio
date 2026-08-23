(function () {
  const detail = document.getElementById("product-detail");
  const productId = new URLSearchParams(window.location.search).get("id");
  const contact = SITE_CONFIG.contact || {};
  const whatsappBase = `https://wa.me/${contact.whatsapp || "5518981315272"}`;
  const categoryMap = Object.fromEntries(SITE_CONFIG.categories.map((category) => [category.id, category]));

  function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    })[character]);
  }

  function setMeta(selector, value) {
    const element = document.querySelector(selector);
    if (element) element.setAttribute("content", value);
  }

  function productCategories(product) {
    const categories = Array.isArray(product.categories) ? product.categories.filter(Boolean) : [];
    if (product.category && !categories.includes(product.category)) categories.unshift(product.category);
    return categories.length ? categories : ["outros"];
  }

  function isChildAbsProduct(product) {
    return productCategories(product).includes("infantil") && /\bABS\b/i.test(product.material || "");
  }

  document.getElementById("detail-brand-name").textContent = SITE_CONFIG.siteName;
  document.getElementById("detail-instagram").href = contact.instagram || "https://www.instagram.com/setevidasmaker/";

  function whatsappProductLabel(product) {
    return product?.name || "";
  }

  function setWhatsappLinks(product) {
    const productLabel = whatsappProductLabel(product);
    const message = productLabel
      ? `Olá! Vi o produto ${productLabel} no site e gostaria de pedir um orçamento.`
      : "Olá! Conheci a Sete Vidas Maker pelo site e gostaria de pedir um orçamento.";
    document.querySelectorAll(".js-detail-whatsapp").forEach((link) => {
      link.href = `${whatsappBase}?text=${encodeURIComponent(message)}`;
      link.target = "_blank";
      link.rel = "noopener";
    });
  }

  function renderNotFound() {
    setWhatsappLinks();
    detail.setAttribute("aria-busy", "false");
    detail.innerHTML = `
      <div class="product-not-found">
        <h1>Produto não encontrado</h1>
        <p>Este item pode ter sido removido ou o endereço está incompleto.</p>
        <a class="button button-primary" href="./#produtos">Ver catálogo</a>
      </div>`;
  }

  function setupGallery(productName) {
    const mainImage = document.getElementById("product-main-image");
    const thumbnails = document.querySelectorAll(".gallery-thumbnail");
    if (!mainImage || !thumbnails.length) return;

    thumbnails.forEach((thumbnail) => {
      thumbnail.addEventListener("click", () => {
        mainImage.src = thumbnail.dataset.image;
        mainImage.alt = `${productName} — foto ${Number(thumbnail.dataset.index) + 1}`;
        thumbnails.forEach((item) => {
          const isActive = item === thumbnail;
          item.classList.toggle("is-active", isActive);
          item.setAttribute("aria-pressed", String(isActive));
        });
      });
    });
  }

  fetch("products.json", { cache: "no-cache" })
    .then((response) => {
      if (!response.ok) throw new Error("Falha ao carregar catálogo");
      return response.json();
    })
    .then((products) => {
      const product = products.find((item) => item.id === productId);
      if (!product) return renderNotFound();

      const productCategoryIds = productCategories(product);
      const primaryCategoryId = product.category || productCategoryIds[0];
      const primaryCategory = categoryMap[primaryCategoryId] || { label: primaryCategoryId, color: "#171515" };
      const categoryUrl = `./?categoria=${encodeURIComponent(primaryCategoryId)}#produtos`;
      const galleryImages = [product.image, ...(product.images || [])].filter((image, index, items) => image && items.indexOf(image) === index);
      const shootingNote = productCategoryIds.includes("tiro-esportivo")
        ? `<p class="shooting-note">Produto destinado exclusivamente à organização e ao armazenamento. Munições não acompanham o produto. Utilize sempre de acordo com a legislação vigente.</p>`
        : "";

      document.title = `${product.name} — ${SITE_CONFIG.siteName}`;
      const metaDescription = `${product.description || "Peça produzida sob encomenda."} Consulte materiais, cores e peça um orçamento.`;
      const canonicalUrl = new URL("produto.html", window.location.href);
      canonicalUrl.searchParams.set("id", product.id);
      const productImageUrl = new URL(galleryImages[0] || "images/logo.png", window.location.href).href;
      document.querySelector('meta[name="description"]').setAttribute("content", metaDescription);
      document.getElementById("canonical-url").href = canonicalUrl.href;
      setMeta('meta[property="og:title"]', `${product.name} — ${SITE_CONFIG.siteName}`);
      setMeta('meta[property="og:description"]', metaDescription);
      setMeta('meta[property="og:image"]', productImageUrl);
      const productSchema = document.createElement("script");
      productSchema.type = "application/ld+json";
      productSchema.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description || "Peça produzida sob encomenda pela Sete Vidas Maker.",
        image: galleryImages.map((image) => new URL(image, window.location.href).href),
        material: product.material || undefined,
        brand: { "@type": "Brand", name: SITE_CONFIG.siteName },
      });
      document.head.appendChild(productSchema);
      setWhatsappLinks(product);
      detail.innerHTML = `
        <article class="product-detail">
          <div class="product-detail-gallery">
            <div class="product-detail-media">
              <img id="product-main-image" src="${escapeHtml(galleryImages[0] || "images/logo-mark.png")}" alt="${escapeHtml(product.name)} — foto 1" fetchpriority="high" decoding="async">
            </div>
            ${galleryImages.length > 1 ? `
              <div class="gallery-thumbnails" aria-label="Fotos do produto">
                ${galleryImages.map((image, index) => `
                  <button class="gallery-thumbnail${index === 0 ? " is-active" : ""}" type="button" data-image="${escapeHtml(image)}" data-index="${index}" aria-label="Ver foto ${index + 1} de ${galleryImages.length}" aria-pressed="${index === 0}">
                    <img src="${escapeHtml(image)}" alt="" loading="lazy" decoding="async">
                  </button>`).join("")}
              </div>
              <p class="gallery-hint">Selecione uma miniatura para ampliar</p>` : ""}
          </div>
          <div class="product-detail-copy">
            <div class="detail-categories">
              ${productCategoryIds.map((categoryId) => {
                const category = categoryMap[categoryId] || { label: categoryId, color: "#171515" };
                return `<a class="detail-category" href="./?categoria=${encodeURIComponent(categoryId)}#produtos" style="background:${escapeHtml(category.color)}">${escapeHtml(category.label)}</a>`;
              }).join("")}
            </div>
            <h1>${escapeHtml(product.name)}</h1>
            <p class="detail-description">${escapeHtml(product.description || "Peça produzida sob encomenda pela Sete Vidas Maker.")}</p>
            <div class="detail-specs">
              <div><span>Material</span><strong>${escapeHtml(product.material || "ABS")}</strong></div>
              <div><span>Cor</span><strong>${escapeHtml(product.color || "Sob consulta")}</strong></div>
              <div><span>Produção</span><strong>${escapeHtml(product.printTime || "Sob encomenda")}</strong></div>
            </div>
            ${product.tags && product.tags.length ? `<div class="detail-tags">${product.tags.map((tag) => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}</div>` : ""}
            ${isChildAbsProduct(product) ? `<p class="child-safety-note child-safety-note-detail"><strong>Atenção:</strong> peça fabricada em ABS, material derivado do petróleo. Não levar à boca e utilizar sob supervisão de um adulto. Caso prefira, solicite a produção em PLA, material produzido a partir de fontes renováveis, como amido de milho e cana-de-açúcar.</p>` : ""}
            <p class="filament-note"><strong>Cor e material sob pedido:</strong> trabalhamos com PLA, PETG e ABS. Se a combinação desejada não estiver em estoque, providenciaremos a compra do filamento para atender ao pedido; o prazo será informado no orçamento.</p>
            <div class="detail-actions">
              <a class="button button-primary js-detail-whatsapp" href="${whatsappBase}?text=${encodeURIComponent(`Olá! Vi o produto ${whatsappProductLabel(product)} no site e gostaria de pedir um orçamento.`)}" target="_blank" rel="noopener">Consultar valor e prazo no WhatsApp <span aria-hidden="true">↗</span></a>
              <a class="button button-secondary" href="${categoryUrl}">Ver mais em ${escapeHtml(primaryCategory.label)}</a>
            </div>
            ${shootingNote}
          </div>
        </article>`;
      detail.setAttribute("aria-busy", "false");
      setupGallery(product.name);
      const analyticsProduct = {
        productId: product.id,
        productName: product.name,
        productCategory: primaryCategory.label,
      };
      document.querySelectorAll(".js-detail-whatsapp").forEach((link) => {
        Object.assign(link.dataset, analyticsProduct);
      });
      window.SVMAnalytics?.viewProduct(analyticsProduct);
    })
    .catch(renderNotFound);
})();
