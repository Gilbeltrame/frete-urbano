# Página de Conciliação de Orçamentos

## Descrição

A página de conciliação foi desenvolvida para processar planilhas de orçamentos com validação automatizada, classificando cada item como:

- **CONFORME**: Todos os dados estão corretos e dentro dos parâmetros esperados
- **RISCO**: Alguns dados apresentam inconsistências menores que merecem atenção
- **NÃO CONFORME**: Erros críticos que impedem a aprovação do orçamento

## Funcionalidades

### 1. Upload de Planilhas

- Suporte a arquivos Excel (.xlsx, .xls) e CSV
- Template disponível para download
- Processamento em tempo real com barra de progresso
- Validação de formato de arquivo

### 2. Validações Automatizadas

#### Validações Críticas (NÃO CONFORME):

- Placa inválida ou não informada
- Transportadora não informada
- Cidade de destino não informada
- Peso líquido ou bruto inválidos (≤ 0)
- Diferença de peso maior que 15%
- Peso líquido maior que peso bruto
- Peso excede capacidade da frota

#### Validações de Risco:

- Diferença de peso entre 5% e 15%
- Quantidade de eixos incompatível com tipo de veículo
- Data de emissão muito antiga (> 90 dias)
- Data de emissão futura
- Campos opcionais não preenchidos
- Lote não informado

#### Validações Específicas por Tipo de Veículo:

**Veículos Leves (2 eixos):**

- 3/4, FIORINO, HR, VAN/FURGÃO, AUTOMÓVEL, SPRINTERF

**Caminhões (2-4 eixos):**

- TRUCK, BI-TRUCK, TOCO

**Carretas e Cavalos Mecânicos (3-7 eixos):**

- CARRETA BAÚ, CARRETA CARGA BAIXA, CARRETA GRANELEIRA
- CARRETA PRANCHA (CONTAINER), CARRETA SIDER
- CAV MEC SIMPLES, CAV MEC QUATRO EIXOS, CAV MEC LS, CAV MEC VANDERLEIA
- REBOQUE, CARGA SEMI REBOQUE

**Veículos Pesados Especiais (6-9 eixos):**

- BI-TREM, RODO TREM

**Trações Especiais (3-6 eixos):**

- TRAÇÃO CAMINHÃO TRATOR

#### Validações por Tipo de Frota:

- **Leve/Extraleve**: até 3.500 kg
- **Semi Pesado**: até 12.000 kg
- **Pesado**: até 45.000 kg

#### Filiais Válidas (16 unidades):

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

### 3. Análise e Relatórios

- Dashboard com estatísticas em tempo real
- Filtros por status (Conforme, Risco, Não Conforme)
- Busca por transportadora, placa ou cidade
- Exportação de resultados em Excel
- Visualização detalhada de cada item

### 4. Interface Intuitiva

- Cards coloridos por status para fácil identificação
- Alertas detalhados para cada problema encontrado
- Informações sobre diferenças de peso
- Progresso visual durante processamento

## Formato da Planilha

### Colunas Obrigatórias:

- **Filial**: Código da filial (ex: "01")
- **Filial - Nome**: Nome da filial (ex: "01-URBANO MATRIZ")
- **Data Emissao**: Data no formato DD/MM/AAAA
- **CFOP**: Tipo de operação (VENDA, TRANSFERENCIA, etc.)
- **Cidade Destino**: Cidade de destino da carga
- **Cliente - UF**: UF do cliente/destino
- **Lote**: Número do lote
- **Placa**: Placa do veículo (formato brasileiro)
- **Transportadora**: Nome da transportadora
- **Peso Líq Calc**: Peso líquido calculado em kg
- **Peso Bruto**: Peso bruto em kg
- **Tp Veículo**: Tipo do veículo (TRUCK, BI-TREM, 3/4, etc.)
- **Tp Frota**: Tipo da frota (Leve, Semi Pesado, Pesado)
- **Qt Eixos**: Quantidade de eixos do veículo

### Exemplo de Dados:

```
Filial: 01
Filial - Nome: 01-URBANO MATRIZ
Data Emissao: 12/23/2024
CFOP: VENDA
Cidade Destino: FRAIBURGO
Cliente - UF: SC
Lote: 697855
Placa: SXO7G09
Transportadora: TRANSPORTES NARCISO MACIEL LTD
Peso Líq Calc: 15860.00
Peso Bruto: 16047.15
Tp Veículo: TRUCK
Tp Frota: Semi Pesado
Qt Eixos: 3
```

## Como Usar

1. **Baixar Template**: Clique em "Baixar Template" para obter um exemplo da planilha
2. **Preparar Dados**: Organize seus dados seguindo o formato do template
3. **Upload**: Arraste o arquivo ou clique para selecionar
4. **Aguardar Processamento**: Acompanhe o progresso na barra
5. **Analisar Resultados**: Revise os itens classificados por status
6. **Filtrar/Pesquisar**: Use os filtros para focar em problemas específicos
7. **Exportar**: Gere relatório em Excel com todos os resultados

## Benefícios

- **Automatização**: Reduz tempo de análise manual
- **Padronização**: Aplica regras consistentes de validação
- **Rastreabilidade**: Documenta todos os problemas encontrados
- **Eficiência**: Processa grandes volumes rapidamente
- **Compliance**: Garante aderência aos padrões estabelecidos

## Tecnologias Utilizadas

- **React + TypeScript**: Interface moderna e tipada
- **Shadcn/UI**: Componentes visuais elegantes
- **XLSX**: Processamento de planilhas Excel
- **Lucide Icons**: Ícones consistentes
- **Tailwind CSS**: Estilização responsiva

## Suporte

Para dúvidas ou problemas, consulte a documentação técnica ou entre em contato com a equipe de desenvolvimento.
