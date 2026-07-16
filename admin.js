(function () {
  const $ = (id) => document.getElementById(id);

  const connectPanel = $("connect-panel");
  const formPanel = $("form-panel");
  const listPanel = $("list-panel");
  const connectBtn = $("connect-btn");
  const disconnectBtn = $("disconnect-btn");
  const connectStatus = $("connect-status");
  const saveStatus = $("save-status");
  const listStatus = $("list-status");
  const saveBtn = $("save-btn");
  const categorySelect = $("p-category");
  const productListEl = $("product-list");

  let state = {
    pat: null,
    owner: null,
    repo: null,
    branch: "main",
    productsSha: null,
    products: [],
  };

  // ---------- helpers ----------
  function showStatus(el, msg, kind) {
    el.textContent = msg;
    el.className = "status-line show " + kind;
  }
  function hideStatus(el) {
    el.className = "status-line";
  }

  // UTF-8 safe base64
  function b64Encode(str) {
    return btoa(unescape(encodeURIComponent(str)));
  }
  function b64Decode(str) {
    return decodeURIComponent(escape(atob(str.replace(/\n/g, ""))));
  }
  function arrayBufferToBase64(buffer) {
    let binary = "";
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary);
  }

  function apiUrl(path) {
    return `https://api.github.com/repos/${state.owner}/${state.repo}/contents/${path}`;
  }

  async function ghRequest(path, options = {}) {
    const res = await fetch(apiUrl(path) + (options.branchQuery ? `?ref=${state.branch}` : ""), {
      method: options.method || "GET",
      headers: {
        Authorization: `token ${state.pat}`,
        Accept: "application/vnd.github+json",
        ...(options.body ? { "Content-Type": "application/json" } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(`${res.status} ${res.statusText}: ${errBody.message || "erro na API do GitHub"}`);
    }
    return res.json();
  }

  async function ghGetFile(path) {
    try {
      return await ghRequest(path, { branchQuery: true });
    } catch (e) {
      if (e.message.startsWith("404")) return null;
      throw e;
    }
  }

  async function ghPutFile(path, base64Content, message, sha) {
    return ghRequest(path, {
      method: "PUT",
      body: {
        message,
        content: base64Content,
        branch: state.branch,
        ...(sha ? { sha } : {}),
      },
    });
  }

  // ---------- category select ----------
  function populateCategories() {
    categorySelect.innerHTML = SITE_CONFIG.categories
      .map((c) => `<option value="${c.id}">${c.label}</option>`)
      .join("");
  }

  // ---------- connect ----------
  function loadSavedConnection() {
    const saved = sessionStorage.getItem("gh_admin_conn");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        $("pat").value = parsed.pat || "";
        $("owner").value = parsed.owner || SITE_CONFIG.github.owner;
        $("repo").value = parsed.repo || SITE_CONFIG.github.repo;
        return parsed;
      } catch (e) {}
    }
    $("owner").value = SITE_CONFIG.github.owner;
    $("repo").value = SITE_CONFIG.github.repo;
    return null;
  }

  async function connect() {
    const pat = $("pat").value.trim();
    const owner = $("owner").value.trim();
    const repo = $("repo").value.trim();
    if (!pat || !owner || !repo) {
      showStatus(connectStatus, "Preencha token, usuário e repositório.", "err");
      return;
    }
    state.pat = pat;
    state.owner = owner;
    state.repo = repo;
    state.branch = SITE_CONFIG.github.branch || "main";

    showStatus(connectStatus, "Conectando...", "busy");
    try {
      await ghRequest(""); // valida acesso ao repo
      sessionStorage.setItem("gh_admin_conn", JSON.stringify({ pat, owner, repo }));
      showStatus(connectStatus, "Conectado com sucesso.", "ok");
      connectBtn.style.display = "none";
      disconnectBtn.style.display = "inline-block";
      formPanel.style.display = "block";
      listPanel.style.display = "block";
      await refreshProducts();
    } catch (e) {
      showStatus(connectStatus, "Falha ao conectar: " + e.message, "err");
    }
  }

  function disconnect() {
    sessionStorage.removeItem("gh_admin_conn");
    state = { pat: null, owner: null, repo: null, branch: "main", productsSha: null, products: [] };
    connectBtn.style.display = "inline-block";
    disconnectBtn.style.display = "none";
    formPanel.style.display = "none";
    listPanel.style.display = "none";
    hideStatus(connectStatus);
    $("pat").value = "";
  }

  // ---------- products ----------
  async function refreshProducts() {
    showStatus(listStatus, "Carregando produtos...", "busy");
    try {
      const file = await ghGetFile("products.json");
      if (file) {
        state.productsSha = file.sha;
        state.products = JSON.parse(b64Decode(file.content));
      } else {
        state.productsSha = null;
        state.products = [];
      }
      renderList();
      hideStatus(listStatus);
    } catch (e) {
      showStatus(listStatus, "Erro ao carregar: " + e.message, "err");
    }
  }

  function renderList() {
    if (state.products.length === 0) {
      productListEl.innerHTML = `<p class="hint">Nenhum produto cadastrado ainda.</p>`;
      return;
    }
    productListEl.innerHTML = "";
    state.products.forEach((p) => {
      const row = document.createElement("div");
      row.className = "admin-list-item";
      row.innerHTML = `
        <img src="${p.image || "images/logo-mark.png"}" alt="">
        <div class="info">
          <strong>${p.name}</strong>
          <span>${p.category} · ${p.material || "—"} · ${p.printTime || "—"}</span>
        </div>
        <button class="btn btn-danger btn-small" data-id="${p.id}">Excluir</button>
      `;
      row.querySelector("button").addEventListener("click", () => deleteProduct(p.id));
      productListEl.appendChild(row);
    });
  }

  async function commitProducts(message) {
    const content = b64Encode(JSON.stringify(state.products, null, 2));
    const result = await ghPutFile("products.json", content, message, state.productsSha);
    state.productsSha = result.content.sha;
  }

  async function deleteProduct(id) {
    if (!confirm("Excluir este produto do site?")) return;
    showStatus(listStatus, "Excluindo...", "busy");
    try {
      state.products = state.products.filter((p) => p.id !== id);
      await commitProducts(`Remove produto ${id}`);
      renderList();
      showStatus(listStatus, "Produto excluído.", "ok");
    } catch (e) {
      showStatus(listStatus, "Erro ao excluir: " + e.message, "err");
    }
  }

  async function uploadImageIfAny() {
    const fileInput = $("p-image");
    const file = fileInput.files[0];
    if (!file) return null;

    const buffer = await file.arrayBuffer();
    const base64 = arrayBufferToBase64(buffer);
    const ext = file.name.split(".").pop();
    const safeName = `${Date.now()}.${ext}`;
    const path = `images/${safeName}`;

    await ghPutFile(path, base64, `Adiciona imagem ${safeName}`);
    return path;
  }

  async function saveProduct() {
    const name = $("p-name").value.trim();
    if (!name) {
      showStatus(saveStatus, "Dá um nome pro produto antes de salvar.", "err");
      return;
    }

    saveBtn.disabled = true;
    showStatus(saveStatus, "Salvando...", "busy");
    try {
      let imagePath = null;
      if ($("p-image").files[0]) {
        showStatus(saveStatus, "Enviando imagem...", "busy");
        imagePath = await uploadImageIfAny();
      }

      const newProduct = {
        id: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now().toString(36),
        name,
        category: categorySelect.value,
        material: $("p-material").value.trim(),
        color: $("p-color").value.trim(),
        printTime: $("p-printtime").value.trim(),
        description: $("p-desc").value.trim(),
        tags: $("p-tags").value.split(",").map((t) => t.trim()).filter(Boolean),
        image: imagePath || "images/logo-mark.png",
      };

      showStatus(saveStatus, "Gravando no repositório...", "busy");
      state.products.push(newProduct);
      await commitProducts(`Adiciona produto: ${name}`);

      showStatus(saveStatus, "Produto salvo! O site atualiza em cerca de 1 minuto.", "ok");
      ["p-name", "p-material", "p-color", "p-printtime", "p-desc", "p-tags"].forEach((id) => ($(id).value = ""));
      $("p-image").value = "";
      renderList();
    } catch (e) {
      showStatus(saveStatus, "Erro ao salvar: " + e.message, "err");
    } finally {
      saveBtn.disabled = false;
    }
  }

  // ---------- init ----------
  populateCategories();
  const saved = loadSavedConnection();
  connectBtn.addEventListener("click", connect);
  disconnectBtn.addEventListener("click", disconnect);
  saveBtn.addEventListener("click", saveProduct);

  if (saved && saved.pat) {
    connect();
  }
})();
