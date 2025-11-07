# Sistema ANTT - Análise de Frete Mínimo

Sistema de análise de conformidade de frete conforme **Resolução ANTT 5.867/2020**.

⚠️ **IMPORTANTE**: Este sistema opera com **100% de conformidade** - não há atalhos ou cálculos aproximados.

## 🚀 Como Usar

### 1. Iniciar o Backend (OBRIGATÓRIO)

```bash
# Execute o arquivo:
start-backend.bat
```

O backend **DEVE** estar rodando em `http://localhost:3000` para garantir conformidade total.

### 2. Iniciar o Frontend

```bash
# Execute o arquivo:
start-frontend.bat
```

Frontend estará disponível em `http://localhost:5173`

## ✅ Conformidade ANTT

- **API Obrigatória**: Todos os cálculos são feitos via API backend que implementa a Resolução ANTT 5.867/2020
- **Sem Fallbacks**: Se a API não estiver disponível, o processamento será interrompido
- **Tabelas Oficiais**: Utiliza os coeficientes oficiais das tabelas A e B da ANTT
- **Limite de 200 itens**: Para garantir performance e conformidade

Monorepo com **backend (Express)** + **frontend (Vite + React)**.

## 🧩 Estrutura

```
frete-minimo/
  backend/
    server.mjs
    package.json
  frontend/
    index.html
    vite.config.ts
    tsconfig.json
    package.json
    .env.example
    src/
      main.tsx
      App.tsx
      styles.css
      components/ui/... (placeholders simples)
```

> Obs.: Os componentes shadcn/ui foram substituídos por placeholders minimalistas para o projeto abrir sem configuração adicional. Se quiser usar **shadcn/ui real**, basta instalar e trocar os imports em `src/components/ui`.

---

## ▶️ Como rodar

### 1) Backend

```bash
cd backend
npm i
npm run start
# API em http://localhost:3000/api/calcula-frete
```

### 2) Frontend

```bash
cd ../frontend
npm i
cp .env.example .env.local
# Edite a VITE_ORS_API_KEY com sua chave do OpenRouteService
npm run dev
# App em http://localhost:5173
```

## 🔑 Variáveis (frontend)

Crie `.env.local`:

```
VITE_ORS_API_KEY=coloque_sua_chave_aqui
```

## 🔗 Integração

Por padrão em desenvolvimento usamos origens separadas (`localhost:5173` e `localhost:3000`). Em produção você pode escolher:

### Multi-domain (recomendado para simplicidade)

Frontend: `https://app.seudominio.com`  
Backend/API: `https://api.seudominio.com`

1. Crie dois apps/projetos no Dockploy/Hostinger ou mapeie dois domínios para o mesmo compose (dependendo do painel):
   - Backend expõe porta 3000 → domínio `api.seudominio.com`
   - Frontend expõe porta 8080 → domínio `app.seudominio.com`
2. Defina variável `FRONTEND_API_BASE_URL` no ambiente de build do frontend (compose build arg) apontando para a URL pública da API (ex: `https://api.seudominio.com`).
3. O `Dockerfile.frontend` injeta `VITE_API_BASE_URL` no build (ARG + ENV). Dentro do código, use `import.meta.env.VITE_API_BASE_URL`.
4. Certifique-se de NÃO hardcodear `http://backend:3000` em produção.

### Single-domain (alternativa)

Servir SPA e proxy `/api` via Nginx. Nesse modo você edita `nginx.conf` adicionando:

```
location /api/ {
  proxy_pass http://backend:3000/api/;
  proxy_set_header Host $host;
  proxy_set_header X-Real-IP $remote_addr;
}
```

E então o frontend chama apenas `/api/...`.

### Variáveis de Ambiente em Produção

- Backend: definir `ORS_API_KEY` como secret (não commitá a chave real).
- Frontend: definir build arg `VITE_API_BASE_URL`.

### Passos de Deploy (Dockploy / Hostinger)

1. Conectar repositório GitHub `Gilbeltrame/frete-urbano`.
2. Tipo: Docker Compose — arquivo `docker-compose.yml` na raiz.
3. Adicionar variável/secret `ORS_API_KEY` ao serviço backend (ou usar arquivo `.env` montado).
4. Adicionar variável `FRONTEND_API_BASE_URL=https://api.seudominio.com` para build do frontend.
5. Executar primeiro build/deploy. Verificar logs: backend deve logar `API de cálculo ANTT rodando na porta 3000`.
6. Testar endpoint: `curl https://api.seudominio.com/api/calcula-frete` (POST com JSON válido).
7. Acessar frontend: `https://app.seudominio.com` e verificar chamadas à API (Network → 200).

### Healthchecks (opcional)

Você pode adicionar no `docker-compose.yml`:

```
  backend:
    healthcheck:
      test: ["CMD", "node", "-e", "fetch('http://localhost:3000/api/route/status').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]
      interval: 30s
      timeout: 5s
      retries: 3
```

---

## 🧮 Cálculo

- Fórmula: `total = (km * CCD) + CC + 0.92 * CCD * km_retorno + pedagio_total`
- Default: Tabela **A** (Lotação) • **Carga Geral** • **5 eixos** • **1 lote** (cada lote = uma viagem)
- Retorno vazio e pedágio são opcionais (campos do formulário).

## 🗺️ Rotas

- Botão **“Calcular KM pela rota (OpenRouteService)”** geocodifica CEP via **ViaCEP** → **ORS** (fallback: CEP direto no ORS) e preenche o **KM total** automaticamente.
