# Atualizações da Página de Conciliação - Dados Reais

## 🎯 **Atualizações Implementadas**

### 1. **Tipos de Veículos Reais (24 tipos)**

**Veículos Leves (2 eixos):**

- 3/4, 3/4., FIORINO, HR, VAN/FURGÃO, AUTOMÓVEL, SPRINTERF

**Caminhões (2-4 eixos):**

- TRUCK, BI-TRUCK, TOCO

**Carretas e Cavalos Mecânicos (3-7 eixos):**

- CARRETA BAÚ
- CARRETA CARGA BAIXA
- CARRETA GRANELEIRA
- CARRETA PRANCHA (CONTAINER)
- CARRETA SIDER
- CAV MEC SIMPLES
- CAV MEC QUATRO EIXOS (exatos 4 eixos)
- CAV MEC LS
- CAV MEC VANDERLEIA
- REBOQUE
- CARGA SEMI REBOQUE

**Veículos Pesados Especiais (6-9 eixos):**

- BI-TREM
- RODO TREM

**Trações Especiais (3-6 eixos):**

- TRAÇÃO CAMINHÃO TRATOR / TRAÇÃO CAMINHÃO TRATOR

### 2. **Filiais Válidas (16 unidades)**

**Matriz e Regionais:**

- 01-URBANO MATRIZ
- 02-SAO GABRIEL
- 03-MELEIRO
- 04-SINOP
- 06-CABO DE STO AGO
- 07-FORTALEZA
- 08-BRASILIA
- 10-SALVADOR
- 11-GUARULHOS 1
- 12-GUARULHOS 2
- 14-PONTA GROSSA
- 15-VARZEA GRANDE
- 21-FORMOSA

**Rede Broto Legal:**

- 01-BROTO LEGAL CAMPINAS
- 02-BROTO LEGAL PORTO FERREIRA
- 03-BROTO LEGAL URUGUAIANA

### 3. **Validações Específicas por Tipo**

#### **Validação de Eixos Detalhada:**

- **3/4, FIORINO, HR, VAN, AUTOMÓVEL, SPRINTERF**: Exatamente 2 eixos
- **TRUCK, BI-TRUCK, TOCO**: 2-4 eixos
- **CAV MEC QUATRO EIXOS**: Exatamente 4 eixos
- **CAV MEC SIMPLES**: 3-5 eixos
- **Carretas gerais**: 3-7 eixos
- **BI-TREM, RODO TREM**: 6-9 eixos
- **Semi-reboques**: 4-6 eixos
- **Trações**: 3-6 eixos

#### **Validação de Filiais:**

- Verifica se a filial informada está na lista de 16 filiais válidas
- Alerta para filiais não reconhecidas (status RISCO)
- Erro crítico se filial não informada (status NÃO CONFORME)

#### **Validação de Tipos de Veículos:**

- Verifica se o tipo está na lista de 24 tipos válidos
- Busca flexível (inclui partial matching)
- Alerta para tipos não reconhecidos (status RISCO)

### 4. **Arquivos Atualizados**

- **`conciliacaoWorker.ts`**: Lógica de validação com dados reais
- **`useTemplateDownload.ts`**: Template com exemplos reais
- **`CONCILIACAO.md`**: Documentação atualizada
- **`exemplo_orcamentos_real.csv`**: Arquivo de exemplo com dados reais

### 5. **Funcionalidades Mantidas**

- ✅ **Web Workers** para processamento pesado
- ✅ **Streaming** em tempo real
- ✅ **Limites de uso** (200 linhas, 1800 consultas/dia)
- ✅ **Validações de peso** por tipo de frota
- ✅ **Validação de placas** brasileiras
- ✅ **Export** de resultados
- ✅ **Interface** responsiva e intuitiva

### 6. **Novos Alertas Implementados**

- **Filial não reconhecida**: Lista específica de 16 filiais
- **Tipo de veículo não reconhecido**: Lista específica de 24 tipos
- **Eixos incompatíveis**: Validação específica por tipo de veículo
- **Validações mais granulares**: CAV MEC QUATRO EIXOS deve ter exatos 4 eixos

## 🚀 **Status: Pronto para Uso**

O sistema agora está configurado com os **dados reais** encontrados e pode processar planilhas com:

1. **16 filiais** específicas da empresa
2. **24 tipos de veículos** reais
3. **Validações precisas** de eixos por tipo
4. **Alertas específicos** para dados não reconhecidos
5. **Performance otimizada** com web workers

**Próximos Passos:**

- Testar com planilhas reais
- Ajustar validações conforme feedback
- Adicionar novos tipos/filiais conforme necessário
