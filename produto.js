(function () {
  const detail = document.getElementById("product-detail");
  const productId = new URLSearchParams(window.location.search).get("id");
  const contact = SITE_CONFIG.contact || {};
  const whatsappBase = `https://wa.me/${contact.whatsapp || "5518981315272"}`;
  const categoryMap = Object.fromEntries(SITE_CONFIG.categories.map((category) => [category.id, category]));

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

  fetch("products.json?_=" + Date.now())
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
      setWhatsappLinks(product.name);
      detail.innerHTML = `
        <article class="product-detail">
          <div class="product-detail-gallery">
            <div class="product-detail-media">
              <img id="product-main-image" src="${galleryImages[0] || "images/logo-mark.png"}" alt="${product.name} — foto 1">
            </div>
            ${galleryImages.length > 1 ? `
              <div class="gallery-thumbnails" aria-label="Fotos do produto">
                ${galleryImages.map((image, index) => `
                  <button class="gallery-thumbnail${index === 0 ? " is-active" : ""}" type="button" data-image="${image}" data-index="${index}" aria-label="Ver foto ${index + 1} de ${galleryImages.length}" aria-pressed="${index === 0}">
                    <img src="${image}" alt="" loading="lazy">
                  </button>`).join("")}
              </div>
              <p class="gallery-hint">Selecione uma miniatura para ampliar</p>` : ""}
          </div>
          <div class="product-detail-copy">
            <div class="detail-categories">
              ${productCategoryIds.map((categoryId) => {
                const category = categoryMap[categoryId] || { label: categoryId, color: "#171515" };
                return `<a class="detail-category" href="./?categoria=${encodeURIComponent(categoryId)}#produtos" style="background:${category.color}">${category.label}</a>`;
              }).join("")}
            </div>
            <h1>${product.name}</h1>
            <p class="detail-description">${product.description || "Peça produzida sob encomenda pela Sete Vidas Maker."}</p>
            <div class="detail-specs">
              <div><span>Material</span><strong>${product.material || "ABS"}</strong></div>
              <div><span>Cor</span><strong>${product.color || "Sob consulta"}</strong></div>
              <div><span>Produção</span><strong>${product.printTime || "Sob encomenda"}</strong></div>
            </div>
            ${product.tags && product.tags.length ? `<div class="detail-tags">${product.tags.map((tag) => `<span class="tag">${tag}</span>`).join("")}</div>` : ""}
            ${isChildAbsProduct(product) ? `<p class="child-safety-note child-safety-note-detail"><strong>Atenção:</strong> peça fabricada em ABS, material derivado do petróleo. Não levar à boca e utilizar sob supervisão de um adulto. Caso prefira, consulte a possibilidade de produção em PLA, material produzido a partir de fontes renováveis, como amido de milho e cana-de-açúcar, conforme a disponibilidade de filamentos.</p>` : ""}
            <p class="filament-note"><strong>Materiais disponíveis:</strong> trabalhamos com PLA, PETG e ABS. Consulte a disponibilidade de cores e filamentos para o seu pedido.</p>
            <div class="detail-actions">
              <a class="button button-primary js-detail-whatsapp" href="${whatsappBase}?text=${encodeURIComponent(`Olá! Vi o produto ${product.name} no site e gostaria de pedir um orçamento.`)}" target="_blank" rel="noopener">Pedir orçamento pelo WhatsApp <span aria-hidden="true">↗</span></a>
              <a class="button button-secondary" href="${categoryUrl}">Ver mais em ${primaryCategory.label}</a>
            </div>
            ${shootingNote}
          </div>
        </article>`;
      setupGallery(product.name);
    })
    .catch(renderNotFound);
})();
