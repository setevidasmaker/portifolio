(() => {
  const storageKey = "seteVidasAnalyticsConsent";

  function trackContactClick(channel, link) {
    if (typeof window.gtag !== "function") return;
    window.gtag("event", "generate_lead", {
      contact_channel: channel,
      link_url: link.href,
      page_location: window.location.href
    });
  }

  document.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link) return;

    if (link.matches(".js-whatsapp, .js-detail-whatsapp, .card-whatsapp") || link.href.includes("wa.me/")) {
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
