// ============================================================
// CONFIGURAÇÃO DO SITE — edite estes valores com os seus dados
// ============================================================
const SITE_CONFIG = {
  // Nome que aparece no topo do site.
  siteName: "Sete Vidas Maker",
  tagline: "Impressão 3D para jogos, organização, presentes e projetos personalizados — do desenho à peça pronta.",

  contact: {
    phoneDisplay: "(18) 98131-5272",
    whatsapp: "5518981315272",
    instagram: "https://www.instagram.com/setevidasmaker/",
  },

  // Dados do repositório GitHub onde este site vai morar.
  // Depois de criar o repo no GitHub, preencha aqui:
  github: {
    owner: "setevidasmaker",
    repo: "portifolio",
    branch: "main",
  },

  // Categorias de produto. Cada uma tem uma cor de destaque (estilo "cor de carta").
  categories: [
    { id: "jogos", label: "TCG & Jogos", color: "#8D0F20" },
    { id: "chaveiros", label: "Chaveiros", color: "#2A2525" },
    { id: "decoracao", label: "Decoração", color: "#A35D31" },
    { id: "escritorio", label: "Organização de escritório", color: "#C89F43" },
    { id: "tiro-esportivo", label: "Tiro esportivo", color: "#4F5D4A" },
    { id: "infantil", label: "Infantil", color: "#5B7685" },
    { id: "outros", label: "Outros", color: "#6F6863" },
  ],
};
