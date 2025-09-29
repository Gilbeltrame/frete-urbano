# 🔍 Lógica de Não Conformidade - Sistema de Conciliação

## 📋 **Visão Geral**

O sistema classifica cada item da planilha em **3 níveis de conformidade**:

- 🟢 **CONFORME**: Todos os dados corretos e dentro dos parâmetros
- 🟡 **RISCO**: Inconsistências menores que merecem atenção
- 🔴 **NÃO CONFORME**: Erros críticos que impedem aprovação

## ⚙️ **Mecânica de Classificação**

### **Estado Inicial**

Cada item começa como `CONFORME` e pode ser "rebaixado" conforme problemas são encontrados:

```typescript
let status: "CONFORME" | "RISCO" | "NAO_CONFORME" = "CONFORME";
```

### **Hierarquia de Severidade**

```
CONFORME → RISCO → NÃO CONFORME
   ↓         ↓         ↓
 Passa    Atenção   Bloqueado
```

**Regra importante:** Uma vez que o status vira `NAO_CONFORME`, ele não pode mais voltar.

## 🚨 **Validações que Geram NÃO CONFORME**

### **1. Campos Obrigatórios Ausentes**

```typescript
// Transportadora obrigatória
if (!item.transportadora || item.transportadora.trim() === "") {
	alertas.push("Transportadora não informada");
	status = "NAO_CONFORME";
}

// Cidade destino obrigatória
if (!item.cidadeDestino || item.cidadeDestino.trim() === "") {
	alertas.push("Cidade de destino não informada");
	status = "NAO_CONFORME";
}

// Nome da filial obrigatório
if (!item.filialNome || item.filialNome.trim() === "") {
	alertas.push("Nome da filial não informado");
	status = "NAO_CONFORME";
}
```

### **2. Placa Inválida**

```typescript
if (!this.validarPlaca(item.placa)) {
	alertas.push("Placa inválida ou não informada");
	status = "NAO_CONFORME";
}
```

**Validação de placa brasileira:**

- Formato antigo: ABC1234
- Formato Mercosul: ABC1D23

### **3. Pesos Inválidos**

```typescript
// Peso líquido inválido
if (item.pesoLiqCalc <= 0) {
	alertas.push("Peso líquido calculado não informado ou inválido");
	status = "NAO_CONFORME";
}

// Peso bruto inválido
if (item.pesoBruto <= 0) {
	alertas.push("Peso bruto não informado ou inválido");
	status = "NAO_CONFORME";
}
```

### **4. Inconsistência Lógica de Peso**

```typescript
// Peso líquido maior que bruto (impossível fisicamente)
if (item.pesoLiqCalc > item.pesoBruto) {
	alertas.push("Peso líquido maior que peso bruto (inconsistência)");
	status = "NAO_CONFORME";
}
```

### **5. Diferença Crítica de Peso (>15%)**

```typescript
const diferençaPeso = Math.abs(item.pesoBruto - item.pesoLiqCalc);
const percentualDiferenca = (diferençaPeso / item.pesoBruto) * 100;

if (percentualDiferenca > 15) {
	status = "NAO_CONFORME";
}
```

### **6. Excesso de Capacidade da Frota**

```typescript
if (capacidadeMaxima > 0 && item.pesoBruto > capacidadeMaxima) {
	alertas.push(`Peso ${item.pesoBruto.toLocaleString()}kg excede capacidade da frota ${tipoFrota}`);
	status = "NAO_CONFORME";
}
```

**Limites por tipo de frota:**

- **Leve/Extraleve**: 3.500 kg
- **Semi Pesado**: 12.000 kg
- **Pesado**: 45.000 kg

## ⚠️ **Validações que Geram RISCO**

### **1. Campos Opcionais Ausentes**

```typescript
// Lote não informado
if (!item.lote || item.lote.trim() === "") {
	alertas.push("Número do lote não informado");
	status = status === "CONFORME" ? "RISCO" : status;
}
```

### **2. Filial Não Reconhecida**

```typescript
if (!this.filiaisValidas.has(item.filialNome.trim())) {
	alertas.push(`Filial '${item.filialNome}' não reconhecida no sistema`);
	status = status === "CONFORME" ? "RISCO" : status;
}
```

### **3. Diferença Moderada de Peso (5-15%)**

```typescript
if (percentualDiferenca > 5 && percentualDiferenca <= 15) {
	alertas.push(`Diferença significativa entre pesos: ${percentualDiferenca.toFixed(2)}%`);
	status = status === "CONFORME" ? "RISCO" : status;
}
```

### **4. Tipo de Veículo Não Reconhecido**

```typescript
if (!tipoReconhecido) {
	alertas.push(`Tipo de veículo '${item.tpVeiculo}' não reconhecido no sistema`);
	status = status === "CONFORME" ? "RISCO" : status;
}
```

### **5. Incompatibilidade de Eixos**

```typescript
if (!validacaoEixos.valido) {
	alertas.push(validacaoEixos.mensagem);
	status = status === "CONFORME" ? "RISCO" : status;
}
```

### **6. Problemas de Data**

```typescript
// Data muito antiga (> 90 dias)
if (diffDays > 90) {
	alertas.push("Data de emissão muito antiga (> 90 dias)");
	status = status === "CONFORME" ? "RISCO" : status;
}

// Data futura
if (dataEmissao > hoje) {
	alertas.push("Data de emissão é futura");
	status = status === "CONFORME" ? "RISCO" : status;
}
```

### **7. Peso Próximo ao Limite (>90%)**

```typescript
if (item.pesoBruto > capacidadeMaxima * 0.9 && item.pesoBruto <= capacidadeMaxima) {
	alertas.push(`Peso próximo ao limite da frota ${tipoFrota}: ${percentual}%`);
	status = status === "CONFORME" ? "RISCO" : status;
}
```

## 🔒 **Lógica de Proteção**

### **Proteção contra Downgrade**

```typescript
// Esta lógica protege contra "melhorar" um status já crítico
status = status === "CONFORME" ? "RISCO" : status;
```

**Significa:**

- Se já é `CONFORME` → pode virar `RISCO`
- Se já é `RISCO` → mantém `RISCO`
- Se já é `NAO_CONFORME` → mantém `NAO_CONFORME`

### **Downgrade Direto para Crítico**

```typescript
// Para erros críticos, força status independente do anterior
status = "NAO_CONFORME";
```

## 📊 **Exemplo Prático**

### **Item que vira NÃO CONFORME:**

```typescript
{
  transportadora: "", // ❌ Campo obrigatório vazio
  pesoBruto: 50000,   // ❌ Excede limite de frota leve (3500kg)
  placa: "INVALID"    // ❌ Placa inválida
}
// Resultado: NAO_CONFORME
```

### **Item que vira RISCO:**

```typescript
{
  transportadora: "TRANSPORTES ABC", // ✅ OK
  pesoBruto: 3400,                   // ✅ Dentro do limite
  pesoLiqCalc: 3000,                 // ⚠️ Diferença de 11.7% (5-15%)
  dataEmissao: "01/01/2025",         // ⚠️ Mais de 90 dias
  lote: ""                           // ⚠️ Campo opcional vazio
}
// Resultado: RISCO
```

### **Item CONFORME:**

```typescript
{
  transportadora: "TRANSPORTES ABC",     // ✅ OK
  cidadeDestino: "SAO PAULO",           // ✅ OK
  filialNome: "01-URBANO MATRIZ",       // ✅ Filial válida
  placa: "ABC1234",                     // ✅ Placa válida
  pesoBruto: 3200,                      // ✅ Dentro do limite
  pesoLiqCalc: 3100,                    // ✅ Diferença de 3% (<5%)
  tpVeiculo: "TRUCK",                   // ✅ Tipo reconhecido
  qtEixos: 3                            // ✅ Compatible com TRUCK
}
// Resultado: CONFORME
```

## 🎯 **Resumo da Lógica**

1. **Inicia CONFORME** para todos os itens
2. **Aplica validações** em ordem sequencial
3. **"Rebaixa" o status** conforme problemas são encontrados
4. **Protege contra melhorias** de status crítico
5. **Acumula todos os alertas** para feedback detalhado
6. **Retorna classificação final** com justificativas

A lógica é **conservadora**: na dúvida, classifica como risco ou não conforme para garantir que apenas dados realmente confiáveis sejam aprovados automaticamente.
