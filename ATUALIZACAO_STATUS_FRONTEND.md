# ✅ Atualização do Frontend - Novo Status ATENCAO

## 📝 Resumo das Alterações

O frontend foi atualizado para receber e exibir corretamente o novo status **ATENCAO** do backend.

---

## 🎨 Arquivos Modificados

### 1. **Types (`frontend/src/types/index.ts`)**

```typescript
// Antes
export type StatusConciliacao = "CONFORME" | "DIVERGENTE" | "ERRO_CALCULO";

// Depois
export type StatusConciliacao = "CONFORME" | "DIVERGENTE" | "ERRO_CALCULO" | "ATENCAO";
```

---

### 2. **StatusBadge (`frontend/src/components/StatusBadge.tsx`)**

Adicionado novo badge laranja para o status ATENCAO:

```tsx
if (status === "ATENCAO") {
	return (
		<span className={cn(base, "bg-orange-50/70 border-orange-200 text-orange-700 shadow-sm")}>
			<AlertTriangle className='w-3.5 h-3.5 text-orange-500' />
			<span className='leading-none'>Atenção</span>
		</span>
	);
}
```

**Visual:**

- 🟠 Cor laranja (orange-500)
- ⚠️ Ícone AlertTriangle
- ✨ Borda e fundo laranja claro

---

### 3. **StatusChart (`frontend/src/components/StatusChart.tsx`)**

Atualizado para incluir ATENCAO nos gráficos:

```typescript
const STATUS_COLORS: Record<StatusConciliacao, ...> = {
  CONFORME: { ... },
  DIVERGENTE: { ... },
  ATENCAO: {
    bgVar: "var(--status-atencao-bg)",
    fgVar: "var(--status-atencao)",
    text: "Atenção",
    label: "Atenção"
  },
  ERRO_CALCULO: { ... },
};

const counts = { CONFORME: 0, DIVERGENTE: 0, ATENCAO: 0, ERRO_CALCULO: 0 };
```

---

### 4. **CSS Styles (`frontend/src/styles.css`)**

Adicionadas variáveis CSS para cores do status ATENCAO:

#### Light Mode:

```css
--status-atencao: #ea580c; /* Laranja escuro */
--status-atencao-bg: #ffedd5; /* Laranja claro */
```

#### Dark Mode:

```css
--status-atencao: #f97316; /* Laranja vibrante */
--status-atencao-bg: #431407; /* Laranja escuro */
```

---

### 5. **Filtros (`frontend/src/components/ResultadosFiltroPanel.tsx`)**

Adicionado ATENCAO no dropdown de filtros:

```tsx
<SelectContent>
	<SelectItem value='TODOS'>Todos os Status</SelectItem>
	<SelectItem value='CONFORME'>Conforme ANTT</SelectItem>
	<SelectItem value='DIVERGENTE'>Necessita Revisão</SelectItem>
	<SelectItem value='ATENCAO'>Atenção</SelectItem> {/* NOVO */}
	<SelectItem value='ERRO_CALCULO'>Não Conforme</SelectItem>
</SelectContent>
```

---

## 🎯 Status Disponíveis Agora

| Status           | Cor         | Ícone           | Significado       | Uso                       |
| ---------------- | ----------- | --------------- | ----------------- | ------------------------- |
| **CONFORME**     | 🟢 Verde    | ✓ CheckCircle   | Conforme ANTT     | 0% a +10% do mínimo       |
| **DIVERGENTE**   | 🟡 Amarelo  | ⚠ AlertTriangle | Necessita Revisão | +10% a +30% do mínimo     |
| **ATENCAO**      | 🟠 Laranja  | ⚠ AlertTriangle | Atenção           | -10% a 0% OU +30% a +100% |
| **ERRO_CALCULO** | 🔴 Vermelho | ✗ XCircle       | Não Conforme      | < -10% do mínimo          |

---

## 📊 Lógica de Classificação (Backend)

```javascript
// < -10% do mínimo
ERRO_CALCULO(ABAIXO_PISO);

// -10% a 0% do mínimo
ATENCAO(LEVEMENTE_ABAIXO);

// 0% a +10% do mínimo
CONFORME(DENTRO_TOLERANCIA);

// +10% a +30% do mínimo
DIVERGENTE(VARIACAO_MEDIA);

// +30% a +100% do mínimo
ATENCAO(SOBREPRECO);

// > +100% do mínimo
ATENCAO(VARIACAO_EXCESSIVA_POSITIVA);
```

---

## 🧪 Como Testar

1. **Build do Frontend:**

   ```bash
   cd frontend
   npm run build
   ```

2. **Fazer Upload de Planilha** com valores variados:

   - Valores abaixo do mínimo (< -10%) → **ERRO_CALCULO**
   - Valores levemente abaixo (-10% a 0%) → **ATENCAO**
   - Valores adequados (0% a +10%) → **CONFORME**
   - Valores médios (+10% a +30%) → **DIVERGENTE**
   - Valores altos (+30% a +100%) → **ATENCAO**
   - Valores muito altos (> +100%) → **ATENCAO**

3. **Verificar Interface:**
   - ✅ Badges exibem cores corretas
   - ✅ Gráfico mostra barra laranja para ATENCAO
   - ✅ Filtro permite selecionar "Atenção"
   - ✅ Exportação inclui status ATENCAO

---

## 🚀 Deploy

### Desenvolvimento Local:

```bash
cd frontend
npm run dev
```

### Produção (Dokploy):

```bash
git add .
git commit -m "feat: adiciona status ATENCAO no frontend"
git push origin main
```

No Dokploy, o frontend será reconstruído automaticamente após o push.

---

## 🎨 Paleta de Cores

### Light Mode

| Status       | Background | Foreground | Border    |
| ------------ | ---------- | ---------- | --------- |
| CONFORME     | `#dcfce7`  | `#16a34a`  | `#bbf7d0` |
| DIVERGENTE   | `#fef9c3`  | `#ca8a04`  | `#fde047` |
| ATENCAO      | `#ffedd5`  | `#ea580c`  | `#fdba74` |
| ERRO_CALCULO | `#fee2e2`  | `#dc2626`  | `#fca5a5` |

### Dark Mode

| Status       | Background | Foreground | Border    |
| ------------ | ---------- | ---------- | --------- |
| CONFORME     | `#14532d`  | `#22c55e`  | `#166534` |
| DIVERGENTE   | `#3f2e07`  | `#d8a324`  | `#713f12` |
| ATENCAO      | `#431407`  | `#f97316`  | `#7c2d12` |
| ERRO_CALCULO | `#4c0d0d`  | `#ef4444`  | `#7f1d1d` |

---

## ✅ Checklist de Validação

- [x] Tipo `StatusConciliacao` atualizado
- [x] `StatusBadge` renderiza ATENCAO corretamente
- [x] `StatusChart` conta e exibe ATENCAO
- [x] CSS vars para cores light/dark adicionadas
- [x] Filtro de status inclui ATENCAO
- [x] Cores consistentes com design system
- [x] Ícones apropriados (AlertTriangle)

---

## 📝 Observações

1. **Ícone Compartilhado:** ATENCAO e DIVERGENTE usam o mesmo ícone `AlertTriangle`, mas cores diferentes (laranja vs amarelo)

2. **Semântica de Cores:**

   - 🟢 Verde = Tudo OK
   - 🟡 Amarelo = Revisar
   - 🟠 Laranja = Atenção (não crítico mas importante)
   - 🔴 Vermelho = Erro/Irregular

3. **Compatibilidade:** Todas as funcionalidades existentes (filtros, gráficos, exportação) funcionam com o novo status

4. **Performance:** Sem impacto - apenas adição de um novo enum value

---

**Status:** ✅ Frontend atualizado e pronto para receber o novo status ATENCAO do backend!
