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

O frontend espera a API do backend na **mesma origem** por padrão. Se o backend rodar em outra porta, ajuste `API_BASE` no `App.tsx`.

## 🧮 Cálculo

- Fórmula: `total = (km * CCD) + CC + 0.92 * CCD * km_retorno + pedagio_total`
- Default: Tabela **A** (Lotação) • **Carga Geral** • **5 eixos** • **1 lote** (cada lote = uma viagem)
- Retorno vazio e pedágio são opcionais (campos do formulário).

## 🗺️ Rotas

- Botão **“Calcular KM pela rota (OpenRouteService)”** geocodifica CEP via **ViaCEP** → **ORS** (fallback: CEP direto no ORS) e preenche o **KM total** automaticamente.
