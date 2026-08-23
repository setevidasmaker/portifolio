(() => {
  const storageKey = "seteVidasAnalyticsConsent";

  function productItem(source) {
    const itemId = source?.dataset?.productId;
    const itemName = source?.dataset?.productName;
    if (!itemId || !itemName) return null;
    return {
      item_id: itemId,
      item_name: itemName,
      item_category: source.dataset.productCategory || "Outros"
    };
  }

  function trackProductEvent(eventName, source, parameters = {}) {
    if (typeof window.gtag !== "function") return;
    const item = productItem(source);
    window.gtag("event", eventName, {
      ...parameters,
      ...(item ? { items: [item] } : {})
    });
  }

  window.SVMAnalytics = {
    viewProduct(product) {
      trackProductEvent("view_item", { dataset: product });
    }
  };

  function trackContactClick(channel, link) {
    trackProductEvent("generate_lead", link, {
      contact_channel: channel,
      link_url: link.href,
      page_location: window.location.href
    });
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;

    if (link.matches(".product-link")) {
      trackProductEvent("select_item", link, {
        item_list_name: link.dataset.itemListName || "Catálogo de produtos"
      });
    } else if (link.matches(".js-whatsapp, .js-detail-whatsapp, .card-whatsapp") || link.href.includes("wa.me/")) {
      trackContactClick("whatsapp", link);
    } else if (link.matches(".js-instagram, #detail-instagram") || link.href.includes("instagram.com/")) {
      trackContactClick("instagram", link);
    }
  });

  if (localStorage.getItem(storageKey)) return;

  const notice = document.createElement("aside");
  notice.className = "analytics-consent";
  notice.setAttribute("role", "dialog");
  notice.setAttribute("aria-label", "Preferências de privacidade");
  notice.innerHTML = `
    <p><strong>Podemos medir as visitas?</strong> Usamos o Google Analytics para entender quais páginas são mais acessadas e melhorar o portfólio.</p>
    <div>
      <button class="button button-secondary" type="button" data-consent="denied">Agora não</button>
      <button class="button button-primary" type="button" data-consent="granted">Permitir</button>
    </div>
  `;

  notice.addEventListener("click", (event) => {
    const button = event.target.closest("[data-consent]");
    if (!button) return;
    const consent = button.dataset.consent;
    localStorage.setItem(storageKey, consent);
    window.gtag?.("consent", "update", { analytics_storage: consent });
    notice.remove();
  });

  document.body.appendChild(notice);
})();
