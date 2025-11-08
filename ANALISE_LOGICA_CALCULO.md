# 🔍 Análise da Lógica de Cálculo - Conciliação de Fretes

## 📊 Dados Analisados da Tabela

### Caso 1: FOZ DO IGUAÇU → SÃO PAULO

```
Tipo Veículo: 3/4 (2 eixos)
Peso: 1.350 kg
Frete Cobrado: R$ 820,00
Frete Mín. ANTT Calculado: R$ 3.908,51
Diferença: -R$ 3.088,51 (-79.0%)
Status: Não Conforme
```

**Análise:**

- Distância FOZ → SP: ~600-650 km
- Cálculo esperado: (600 × 3.6735) + 417.95 = R$ 2.622,05
- **Problema:** Sistema calculou R$ 3.908,51 (50% maior!)
- **Hipótese:** API de rotas pode estar retornando distância incorreta ou rota muito longa

---

### Caso 2: SINOP → CUIABÁ

```
Tipo Veículo: BI-TRUCK (4 eixos)
Peso: 13.500 kg
Frete Cobrado: R$ 950,00
Frete Mín. ANTT Calculado: R$ 3.236,64
Diferença: -R$ 2.286,64 (-70.7%)
Status: Não Conforme
```

**Análise:**

- Distância SINOP → CUIABÁ: ~500-520 km
- Cálculo esperado: (500 × 5.3306) + 559.08 = R$ 3.224,38 ✅
- **OK:** Cálculo está correto!
- **Problema Real:** Transportadora cobrou R$ 950 (70% abaixo do mínimo) - IRREGULAR

---

### Caso 3: FORTALEZA → FORTALEZA (mesma cidade)

```
Tipo Veículo: BI-TREM (7 eixos)
Peso: 31.500 kg
Frete Cobrado: R$ 5.850,00
Frete Mín. ANTT Calculado: R$ 753,88
Diferença: +R$ 5.096,12 (+676.0%)
Status: Não Conforme
```

**Análise:**

- Distância: 0 km (mesma cidade)
- Cálculo esperado: (0 × 7.3085) + 752.64 = R$ 752,64 ✅
- **OK:** Cálculo está correto para 0 km!
- **Observação:** Frete cobrado R$ 5.850 pode ser correto (frete urbano + carga pesada)

---

### Caso 4: GUARULHOS → GUARULHOS

```
Tipo Veículo: CAV MEC SIMPLES (4 eixos)
Peso: 10.800 kg
Frete Cobrado: R$ 520,00
Frete Mín. ANTT Calculado: R$ 559,08
Diferença: -R$ 39,08 (-7.0%)
Status: Não Conforme
```

**Análise:**

- Distância: 0 km (mesma cidade)
- Cálculo esperado: (0 × 5.3306) + 559.08 = R$ 559,08 ✅
- **OK:** Cálculo correto!
- **Problema Real:** Frete cobrado R$ 520 (7% abaixo) - limite aceitável?

---

### Caso 5: FRAIBURGO → CAUCAIA

```
Tipo Veículo: BI-TREM (7 eixos)
Peso: 36.800 kg
Frete Cobrado: R$ 3.100,00
Frete Mín. ANTT Calculado: R$ 25.172,72
Diferença: -R$ 22.072,72 (-87.7%)
Status: Não Conforme
```

**Análise:**

- Distância FRAIBURGO-SC → CAUCAIA-CE: ~3.300 km
- Cálculo esperado: (3.300 × 7.3085) + 752.64 = R$ 24.870,69 ✅
- **OK:** Cálculo está correto!
- **Problema GRAVE:** Frete cobrado R$ 3.100 (87% abaixo!) - **IRREGULAR**

---

### Caso 8: URUGUAIANA → URUGUAIANA

```
Tipo Veículo: RODO TREM (9 eixos)
Peso: 7.800 kg
Frete Cobrado: R$ 1.800,00
Frete Mín. ANTT Calculado: R$ 815,30
Diferença: +R$ 984,70 (+120.8%)
Status: Não Conforme
```

**Análise:**

- Distância: 0 km (mesma cidade)
- Cálculo esperado: (0 × 8.2680) + 815.30 = R$ 815,30 ✅
- **OK:** Cálculo correto!
- **Observação:** Frete cobrado está 120% acima - pode ser justificável

---

### Caso 9: PONTA GROSSA → GUARULHOS

```
Tipo Veículo: BI-TREM (7 eixos)
Peso: 39.810 kg
Frete Cobrado: R$ 6.100,00
Frete Mín. ANTT Calculado: R$ 4.396,49
Diferença: +R$ 1.703,51 (+38.8%)
Status: Não Conforme
```

**Análise:**

- Distância PONTA GROSSA → GUARULHOS: ~400 km
- Cálculo esperado: (400 × 7.3085) + 752.64 = R$ 3.676,04
- **Problema:** Sistema calculou R$ 4.396,49 (20% maior!)
- **Hipótese:** Distância pode estar sendo calculada em ~500 km

---

## 🎯 Conclusões

### ✅ O que está CORRETO:

1. **Fórmula de cálculo:** `(distancia_km × CCD) + CC` está correta
2. **Coeficientes TABELA_A:** Valores de CCD e CC estão corretos
3. **Mapeamento de eixos:** Correlação tipo veículo → eixos está ok
4. **Cálculo para mesma cidade (0 km):** Funcionando perfeitamente

### ⚠️ O que precisa INVESTIGAR:

#### 1. **Distâncias Calculadas pela API**

O maior problema parece ser a **precisão das distâncias** retornadas pela API:

```javascript
const routeResult = await calculateCityDistance(cidadeOrigem, ufOrigem, cidadeDestino, ufDestino);
const distancia_km = routeResult.km;
```

**Exemplos de possíveis erros:**

- FOZ → SP: Sistema pode estar retornando ~700+ km em vez de ~600 km
- PONTA GROSSA → GUARULHOS: Pode estar retornando ~500 km em vez de ~400 km

**Ações recomendadas:**

- ✅ Adicionar log da distância calculada em cada linha
- ✅ Comparar com Google Maps / outras fontes
- ✅ Verificar se API está retornando rota mais longa (não otimizada)
- ✅ Considerar fallback para distância em linha reta × 1.2

#### 2. **Critérios de Conformidade**

A lógica atual classifica como "Não Conforme" variações de **-79% a +676%**, o que é excessivo.

**Sugestões:**

```javascript
// Tolerância atual: ±5% = CONFORME | ±15% = DIVERGENTE | >15% = ERRO_CALCULO

// Proposta ajustada:
if (valorCobrado < valorMinimo * 0.95) {
	status = "ERRO_CALCULO";
	motivoStatus = "ABAIXO_PISO"; // IRREGULAR - Frete abaixo do mínimo ANTT
} else if (valorCobrado <= valorMinimo * 1.1) {
	status = "CONFORME"; // Até 10% acima do mínimo
} else if (valorCobrado <= valorMinimo * 1.3) {
	status = "DIVERGENTE"; // 10-30% acima - Verificar negociação
} else {
	status = "ATENCAO"; // >30% acima - Possível sobrepreço
}
```

#### 3. **Casos Especiais - Mesma Cidade**

Para frete urbano (mesma cidade), o mínimo ANTT pode não ser aplicável:

- FORTALEZA → FORTALEZA: Mínimo R$ 753, cobrado R$ 5.850
- GUARULHOS → GUARULHOS: Mínimo R$ 559, cobrado R$ 520

**Sugestão:**

```javascript
if (cidadeOrigem === cidadeDestino && ufOrigem === ufDestino) {
	observacoes.push("FRETE URBANO: Mínimo ANTT pode não se aplicar");
	// Aplicar regras diferentes ou apenas informativo
}
```

---

## 🔧 Melhorias Recomendadas

### 1. **Adicionar Logs de Debug Detalhados**

```javascript
console.log(`📍 [DISTANCIA] Linha ${i + 2}: ${cidadeOrigem}-${ufOrigem} → ${cidadeDestino}-${ufDestino} = ${routeResult.km}km (${routeResult.method})`);
console.log(`💰 [CALCULO] Linha ${i + 2}: (${routeResult.km} × ${CCD}) + ${CC} = R$ ${valor_total.toFixed(2)}`);
console.log(`📊 [COMPARACAO] Linha ${i + 2}: Cobrado R$ ${valorFreteCobrado} vs Mínimo R$ ${valor_total} (${diferençaPercentual.toFixed(1)}%)`);
```

### 2. **Validar Distâncias Suspeitas**

```javascript
// Se distância muito diferente da linha reta, alertar
const distanciaLinhaReta = calcularDistanciaLinhaReta(origemCoords, destinoCoords);
const razaoDistancia = routeResult.km / distanciaLinhaReta;

if (razaoDistancia > 1.5) {
	console.log(`⚠️ [ROTA SUSPEITA] Linha ${i + 2}: Distância rodoviária ${routeResult.km}km é ${razaoDistancia.toFixed(1)}x maior que linha reta ${distanciaLinhaReta}km`);
	observacoes.push("Rota pode estar muito longa - verificar alternativas");
}
```

### 3. **Exportar Detalhes para Análise**

No resultado final, incluir:

```javascript
{
  ...resultado,
  detalhes_calculo: {
    distancia_calculada: routeResult.km,
    metodo_rota: routeResult.method,
    CCD_utilizado: CCD,
    CC_utilizado: CC,
    eixos_mapeados: eixosValido,
    tipo_carga_classificado: tipoCarregaKey,
    formula: `(${routeResult.km} × ${CCD}) + ${CC} = ${valor_total}`
  }
}
```

---

## 🧪 Teste Prático Recomendado

Execute a conciliação com logs verbosos e compare:

1. **Distância retornada vs Google Maps**
2. **Cálculo manual vs sistema:**

   ```
   Exemplo: SINOP → CUIABÁ (500 km, BI-TRUCK 4 eixos)
   Manual: (500 × 5.3306) + 559.08 = R$ 3.224,38
   Sistema: R$ ???
   ```

3. **Verificar método de rota usado:**
   - ✅ `ors_route` = API OpenRouteService (mais preciso)
   - ⚠️ `haversine` = Linha reta × 1.2 (aproximado)
   - ⚠️ `fallback` = Valor padrão (impreciso)

---

## 📝 Resumo Final

| Item                   | Status        | Observação                             |
| ---------------------- | ------------- | -------------------------------------- |
| Fórmula de cálculo     | ✅ CORRETO    | `(km × CCD) + CC` está ok              |
| Coeficientes ANTT      | ✅ CORRETO    | Valores de tabela estão ok             |
| Mapeamento eixos       | ✅ CORRETO    | Tipos de veículo → eixos ok            |
| **Distâncias API**     | ⚠️ INVESTIGAR | Pode estar retornando valores inflados |
| Critérios conformidade | ⚠️ AJUSTAR    | Tolerâncias muito rígidas              |
| Frete urbano           | ⚠️ AJUSTAR    | Mesma cidade precisa regra especial    |

---

**Próximo passo:** Adicionar logs detalhados de distância e validar contra fonte confiável (Google Maps).
