# Portfólio de produtos 3D — guia rápido

Site estático (GitHub Pages) com uma vitrine pública de produtos e uma página de
cadastro privada. Não precisa de servidor nem banco de dados: os produtos ficam
salvos no arquivo `products.json` deste próprio repositório, e a página de
admin escreve nele direto pela API do GitHub.

## Estrutura

```
index.html      → site público (vitrine)
admin.html       → página de cadastro (só funciona com seu token)
app.js           → lógica do site público
admin.js         → lógica do admin (fala com a API do GitHub)
config.js        → nome da marca, categorias, dados do repositório
style.css        → visual
products.json    → "banco de dados" dos produtos
images/          → fotos + placeholders por categoria
```

## 1. Criar o repositório

1. Crie um repositório novo no GitHub (pode ser público ou privado — Pages
   funciona nos dois, mas em repo privado o GitHub Pages exige plano pago
   para deixar o *site* privado; deixando o repo **público** o Pages é
   grátis e o site fica visível pra qualquer um, o que é o normal pra um
   portfólio).
2. Suba todos os arquivos desta pasta pra raiz do repositório.

## 2. Ativar o GitHub Pages

1. No repositório, vá em **Settings → Pages**.
2. Em "Build and deployment", escolha **Deploy from a branch**.
3. Branch: `main`, pasta `/ (root)`. Salve.
4. Em alguns minutos o site fica em `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/`.

## 3. Editar `config.js`

Abra `config.js` e preencha:

```js
github: {
  owner: "seu-usuario-github",
  repo: "nome-do-repositorio",
  branch: "main",
},
```

Aproveite pra trocar `siteName` e `tagline` pelo nome da sua marca.

## 4. Criar o token de acesso (pra usar o admin)

1. No GitHub: **Settings da sua conta → Developer settings → Personal access
   tokens → Fine-grained tokens → Generate new token**.
2. Em "Repository access", escolha **Only select repositories** e selecione
   este repositório.
3. Em "Permissions", dê **Contents: Read and write**. Não precisa de mais nada.
4. Gere o token e copie (ele só aparece uma vez).

**Importante:** esse token dá acesso de escrita só a este repositório — mesmo
assim, trate como senha. Não cole em computador público, e se desconfiar que
vazou, revogue no GitHub e gere outro.

## 5. Cadastrar produtos

1. Acesse `https://SEU-USUARIO.github.io/SEU-REPOSITORIO/admin.html`.
2. Cole o token, confirme usuário/repositório e clique em **Conectar**.
   Por segurança, ele fica disponível somente até você fechar o navegador.
3. Preencha o formulário e clique em **Salvar produto**.
4. Isso faz um commit automático no `products.json`. O site público atualiza
   sozinho em ~1 minuto (tempo do GitHub Pages rebuildar).

A página `admin.html` é pública no sentido de que qualquer um pode *abrir* a
URL — mas sem o seu token ninguém consegue salvar nada. Se quiser, dá pra
esconder ainda mais depois (por exemplo tirando o link dela do menu, o que já
está assim por padrão).

## 6. Trocar as fotos

Cada produto tem um placeholder colorido por categoria até você subir foto de
verdade. No formulário do admin, o campo "Foto" já faz upload da imagem pro
repositório (pasta `images/`) e associa ao produto automaticamente.

## Limitações que vale saber

- Sem foto = sem login: qualquer pessoa com o link do admin só consegue ver o
  formulário, não conseguindo salvar sem o token — mas isso não é uma "conta"
  de verdade, é um repositório com permissão de escrita. Pra uso pessoal
  (só você cadastrando) é suficiente e é exatamente o modelo que ferramentas
  como o Decap CMS usam por trás dos panos.
- Cada salvamento é um commit — o histórico do repositório vira também um
  histórico de cadastro dos seus produtos, o que é meio interessante.
- Se um dia quiser evoluir pra login "de verdade" (com senha, múltiplos
  usuários etc.), aí sim entra a conversa de ter um backend — mas pra um
  portfólio de uma pessoa só, isso aqui resolve sem custo nenhum.
