# PLIX — Plataforma Pessoal de Streaming para Homelab

O **Plix** é uma plataforma pessoal e doméstica de streaming de filmes, séries, animes e doramas projetada especificamente para execução em computadores e servidores locais (Homelab). O sistema é acessível via navegador por celulares, computadores, tablets e Smart TVs (incluindo Android TV / Google TV) através do controle remoto (D-Pad).

---

## 🌟 Principais Recursos

- **Catálogo Completo**:
  - Filmes, Séries, Animes e Doramas.
  - Navegação fluida por fileiras horizontais com carregamento progressivo e cache.
  - Filtro por gêneros (Ação, Comédia, Drama, Romance, Terror, etc.).
- **Metadados Ricos (TMDB)**:
  - Títulos, sinopses em pt-BR, capas, backdrops cinematográficos, notas e elencos.
  - Navegação detalhada de séries com seletor de temporadas e episódios com thumbnails 16:9.
- **Reprodução Otimizada**:
  - Player embutido via iframe responsivo direto da fonte externa (sem sobrecarga de proxy no servidor local).
  - Suporte a tela cheia (Fullscreen) e modo sem duplicação de interface (`#noEpList`).
  - Navegação simplificada para o próximo episódio.
- **Estado do Usuário & Privacidade**:
  - **Minha Lista**: adicione e gerencie seus títulos prediletos no seu próprio banco de dados local.
  - **Histórico & Continuar Assistindo**: acompanhamento dos episódios e filmes iniciados e marcação manual de "Assistido".
- **Experiência Multiplataforma**:
  - **Smart TV & Android TV**: suporte completo a navegação espacial por setas (`ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`), `Enter` e `Back/Escape`, com foco visual de alto contraste.
  - **Mobile First**: navegação inferior por toque com botões ergonômicos.
  - **Desktop**: layout widescreen com botões de rolagem suave.
- **Arquitetura Desacoplada (Providers)**:
  - `CatalogProvider`: abstrai a listagem e gêneros externos.
  - `MetadataProvider`: abstrai TMDB com cache persistente no PostgreSQL e fallback offline.
  - `PlaybackProvider`: constrói links seguros de reprodução com sanitização estrita.

---

## 🏗️ Arquitetura

O Plix é construído como um monorepo full-stack enxuto e de alta performance:

```
[Smart TV / Celular / PC]
          ↓ (HTTP/LAN)
   [Next.js 15 (Node.js)]
      ├─ App Router / Server Components
      ├─ Auth & API Routes
      ├─ Providers (Catalog, Metadata, Playback)
      └─ Prisma ORM
          ↓
  [PostgreSQL externo]
```

---

## 🚀 Instalação com Docker Compose

### Pré-requisitos
- [Docker](https://docs.docker.com/get-docker/) e Docker Compose instalados no servidor.

### 1. Clonar o Repositório e Configurar Variáveis
```bash
git clone https://github.com/pedro/plix.git
cd plix

# Crie o arquivo .env a partir do modelo
cp .env.example .env
```

Edite o arquivo `.env` para configurar a conexão com seu PostgreSQL externo e inserir seu token de leitura da API do TMDB:
```ini
DATABASE_URL="postgresql://USUARIO:SENHA@HOST:5432/BANCO?schema=public"
TMDB_ACCESS_TOKEN="seu_token_bearer_tmdb_aqui"
```

O banco deve estar criado e acessível pelo container da aplicação. O Compose não cria nem inicia um PostgreSQL.

### 2. Iniciar os Containers
```bash
docker compose up -d --build
```

O comando irá:
1. Construir e iniciar a aplicação Next.js standalone.
2. Sincronizar o schema (`prisma db push`) no banco configurado em `DATABASE_URL`.
3. Criar o usuário inicial (`prisma/seed.js`), caso ainda não exista.

Se a conexão com o banco ou a sincronização do schema falhar, a aplicação não inicia. O projeto ainda não possui migrations versionadas; essa sincronização cria ou atualiza as tabelas conforme `prisma/schema.prisma`.

### 3. Acessar a Plataforma
Abra no navegador de qualquer dispositivo conectado na sua rede Wi-Fi/LAN:
```
http://IP_DO_SEU_SERVIDOR:3200
```
*(Exemplo: `http://192.168.1.100:3200` ou `http://localhost:3200`)*

**Credenciais Iniciais:**
- **Usuário:** `admin`
- **Senha:** `password123`

---

## 💻 Execução Local para Desenvolvimento (Sem Docker)

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar PostgreSQL local
Certifique-se de que o PostgreSQL está rodando e configure a URL de conexão no arquivo `.env`:
```ini
DATABASE_URL="postgresql://plix:plix_secret@127.0.0.1:5432/plix?schema=public"
```

### 3. Sincronizar banco e criar usuário inicial
```bash
npm run db:push
npm run db:seed
```

### 4. Iniciar servidor de desenvolvimento
```bash
npm run dev
```
Acesse em: `http://localhost:3000`

---

## 🧪 Testes Automatizados

A suíte de testes do projeto valida isoladamente os fluxos críticos (autenticação com bcrypt, contratos do catálogo externo, geração segura de URLs do player e fluxo completo E2E):

```bash
npm test
```

---

## ⚙️ Variáveis de Ambiente (`.env`)

| Variável | Descrição | Padrão |
| :--- | :--- | :--- |
| `DATABASE_URL` | String de conexão com o PostgreSQL externo | Obrigatória no Docker Compose |
| `TMDB_ACCESS_TOKEN` | Bearer Token de leitura da API TMDB | `""` |
| `TMDB_LANGUAGE` | Idioma de busca no TMDB | `pt-BR` |
| `TMDB_REGION` | Região de classificação indicativa | `BR` |
| `CATALOG_PROVIDER_BASE_URL` | URL base da API do catálogo WarezCDN | `https://warezcdn.sbs` |
| `PLAYBACK_PROVIDER_BASE_URL` | URL base do player WarezCDN | `https://warezcdn.sbs` |
| `POMFY_PLAYBACK_BASE_URL` | URL base do player Pomfy | `https://api.pomfy.stream` |
| `POMFY_CATALOG_BASE_URL` | URL base da listagem Pomfy | `https://api.pomfy.stream` |
| `STREAMBETTER_PLAYBACK_BASE_URL` | URL base do player StreamBetter | `https://streambetter.shop` |
| `DEFAULT_PLAYBACK_PROVIDER` | Provedor de reprodução padrão (`warez`, `pomfy` ou `streambetter`) | `warez` |
| `AUTH_SECRET` | Chave de segurança para sessões de cookie | String aleatória (32+ caracteres) |
| `ADMIN_INITIAL_USERNAME` | Usuário administrador inicial | `admin` |
| `ADMIN_INITIAL_PASSWORD` | Senha inicial do administrador | `password123` |
| `PORT` | Porta de escuta do servidor | `3000` |
| `HOST` | Interface de rede para binding | `0.0.0.0` (acessível na LAN) |

---

## 📺 Dicas para Smart TV e Android TV

1. **Acesso no Navegador da TV**: Abra o navegador da sua TV (ex: Google Chrome, Silk Browser ou TV Bro no Android TV) e acesse o IP local do servidor: `http://192.168.x.x:3000`.
2. **Navegação D-Pad**: Use as setas do controle remoto para percorrer os cards e botões. O elemento ativo sempre terá um anel de destaque luminoso.
3. **Seleção e Voltar**: Pressione o botão `OK / Enter` do controle para selecionar e `Voltar / Back` para retornar da tela de detalhes ou player.
4. **Campo de Busca**: O campo de pesquisa do Plix é um input nativo padrão, permitindo utilizar diretamente a digitação ou busca por voz do teclado virtual da sua TV.

---

## 🛡️ Atribuição TMDB

Este produto utiliza a API do **The Movie Database (TMDB)** para enriquecimento de títulos, sinopses e imagens, mas não é certificado ou endossado pelo TMDB. Mais detalhes podem ser conferidos na tela `/sobre` da aplicação.
