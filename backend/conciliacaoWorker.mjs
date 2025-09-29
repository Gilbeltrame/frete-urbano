// conciliacaoWorker.mjs
// Worker Node.js para processamento de conciliação em background

import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import XLSX from 'xlsx';
import { calculateCityDistance } from './routeService.mjs';

// Constantes de limitação
const LIMITE_LINHAS_PLANILHA = 20;

// Se este arquivo está sendo executado como worker
if (!isMainThread) {
  const { filePath, options = {} } = workerData;

  // Função assíncrona principal do worker
  async function processarConciliacao() {
    const startTime = Date.now();
    
    try {
    console.log(`🚀 [WORKER] Iniciando processamento: ${filePath}`);
    
    // Log de início
    parentPort.postMessage({
      type: 'progress',
      data: { step: 'reading', message: 'Lendo arquivo Excel...' }
    });

    // Ler o arquivo Excel
    const workbook = XLSX.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    
    // Converter para JSON
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (rawData.length === 0) {
      throw new Error('Arquivo vazio ou sem dados válidos');
    }

    // Headers (primeira linha)
    const headers = rawData[0];
    let dataRows = rawData.slice(1);
    const originalCount = dataRows.length;
    
    console.log(`📊 [WORKER] Dados lidos: ${originalCount} linhas, headers: ${headers.length}`);

    // Aplicar limitação de linhas
    let truncatedInfo = null;
    if (dataRows.length > LIMITE_LINHAS_PLANILHA) {
      console.log(`✂️ [TRUNCATE] Limitando de ${dataRows.length} para ${LIMITE_LINHAS_PLANILHA} linhas`);
      dataRows = dataRows.slice(0, LIMITE_LINHAS_PLANILHA);
      truncatedInfo = {
        wasTruncated: true,
        originalCount,
        processedCount: LIMITE_LINHAS_PLANILHA,
        message: `Arquivo truncado de ${originalCount.toLocaleString()} para ${LIMITE_LINHAS_PLANILHA.toLocaleString()} linhas devido aos limites de processamento.`
      };
    }

    parentPort.postMessage({
      type: 'progress',
      data: { 
        step: 'parsing', 
        message: `Processando ${dataRows.length} linhas${truncatedInfo ? ' (arquivo truncado)' : ''}...`,
        total: dataRows.length,
        processed: 0
      }
    });

        // Mapeamento de filiais para cidades de origem
    const filiaisOrigem = {
      "01-URBANO MATRIZ": { cidade: "FOZ DO IGUACU", uf: "PR" },
      "01-BROTO LEGAL CAMPINAS": { cidade: "CAMPINAS", uf: "SP" },
      "21-FORMOSA": { cidade: "FRAIBURGO", uf: "SC" }, // Padrão quando desconhecido
      "14-PONTA GROSSA": { cidade: "PONTA GROSSA", uf: "PR" },
      "15-VARZEA GRANDE": { cidade: "VARZEA GRANDE", uf: "MT" },
      "02-SAO GABRIEL": { cidade: "SAO GABRIEL", uf: "RS" },
      "03-MELEIRO": { cidade: "MELEIRO", uf: "SC" },
      "03-BROTO LEGAL URUGUAIANA": { cidade: "URUGUAIANA", uf: "RS" },
      "04-SINOP": { cidade: "SINOP", uf: "MT" },
      "10-SALVADOR": { cidade: "SALVADOR", uf: "BA" },
      "06-CABO DE STO AGO": { cidade: "CABO DE SANTO AGOSTINHO", uf: "PE" },
      "02-BROTO LEGAL PORTO FERREIRA": { cidade: "PORTO FERREIRA", uf: "SP" },
      "08-BRASILIA": { cidade: "BRASILIA", uf: "DF" },
      "12-GUARULHOS 2": { cidade: "GUARULHOS", uf: "SP" },
      "07-FORTALEZA": { cidade: "FORTALEZA", uf: "CE" },
      "11-GUARULHOS 1": { cidade: "GUARULHOS", uf: "SP" }
    };

    

    // Encontrar colunas nos dados reais
    const columnMapping = {};
    
    // Buscar coluna de filial nome
    const filialNomeIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('filial - nome')
    );
    columnMapping.filial_nome = filialNomeIndex;
    
    // Buscar coluna de cidade destino
    const destinoIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('cidade destino')
    );
    if (destinoIndex === -1) {
      throw new Error('Coluna "Cidade Destino" não encontrada');
    }
    columnMapping.cidade_destino = destinoIndex;

    // Buscar coluna de quantidade de eixos
    const eixosIndex = headers.findIndex(h => 
      h && (h.toString().toLowerCase().includes('qt eixos') || h.toString().toLowerCase().includes('eixos'))
    );
    if (eixosIndex === -1) {
      throw new Error('Coluna "Qt Eixos" não encontrada');
    }
    columnMapping.eixos = eixosIndex;

    // Buscar coluna UF destino
    const ufDestinoIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('cliente - uf')
    );
    columnMapping.uf_destino = ufDestinoIndex;

    // Buscar coluna valor de frete (nova)
    const valorFreteIndex = headers.findIndex(h => 
      h && (h.toString().toLowerCase().includes('valor frete') || 
            h.toString().toLowerCase().includes('valor do frete') ||
            h.toString().toLowerCase().includes('frete'))
    );
    columnMapping.valor_frete = valorFreteIndex;

    // Buscar coluna tipo de veículo (opcional)
    const tipoVeiculoIndex = headers.findIndex(h => 
      h && h.toString().toLowerCase().includes('tp veículo')
    );
    columnMapping.tipo_veiculo = tipoVeiculoIndex;

    // Colunas opcionais
    const pesoIndex = headers.findIndex(h => 
      h && (h.toString().toLowerCase().includes('peso bruto') || h.toString().toLowerCase().includes('peso'))
    );
    columnMapping.peso = pesoIndex;

    // Processamento otimizado: reduzir delay entre lotes drasticamente
    const results = [];
    const errors = [];
    const BATCH_SIZE = 5; // Lotes menores mas com delay menor
    const BATCH_DELAY = 3000; // 3 segundos entre lotes (5 req em 3s = 100 req/min)
    
    console.log(`⚡ [PROCESSING] Iniciando processamento OTIMIZADO: lotes de ${BATCH_SIZE} com delay de ${BATCH_DELAY/1000}s`);
    
    for (let batchStart = 0; batchStart < dataRows.length; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, dataRows.length);
      const batch = dataRows.slice(batchStart, batchEnd);
      
      console.log(`📦 [BATCH] Processando lote ${Math.floor(batchStart/BATCH_SIZE) + 1}: linhas ${batchStart + 1}-${batchEnd}`);
      
      const batchStartTime = Date.now();
      
      // Processar lote em paralelo
      const batchPromises = batch.map(async (row, batchIndex) => {
        const i = batchStart + batchIndex;
        
        try {
          console.log(`🔍 [LINHA ${i + 1}] Processando...`);
          
          // Extrair dados da linha com base nas colunas disponíveis
          const filialNome = columnMapping.filial_nome >= 0 ? row[columnMapping.filial_nome]?.toString().trim() : '';
          const cidadeDestino = row[columnMapping.cidade_destino]?.toString().trim();
          const ufDestino = columnMapping.uf_destino >= 0 ? row[columnMapping.uf_destino]?.toString().trim() : '';
          const qtEixos = parseInt(row[columnMapping.eixos]) || 2;
          const tipoVeiculo = columnMapping.tipo_veiculo >= 0 ? row[columnMapping.tipo_veiculo]?.toString().trim() : '';
          const peso = columnMapping.peso >= 0 ? parseFloat(row[columnMapping.peso]?.toString().replace(/[^\d.,]/g, '').replace(',', '.')) || 0 : 0;
          
          // Tentar extrair valor do frete da planilha
          let valorFreteCobrado = null;
          if (columnMapping.valor_frete >= 0) {
            const valorStr = row[columnMapping.valor_frete]?.toString().replace(/[^\d.,]/g, '').replace(',', '.');
            valorFreteCobrado = parseFloat(valorStr) || null;
          }

          // Determinar origem baseada na filial
          const origemInfo = filiaisOrigem[filialNome] || { cidade: "FRAIBURGO", uf: "SC" }; // Fallback para FRAIBURGO
          const cidadeOrigem = origemInfo.cidade;
          const ufOrigem = origemInfo.uf;
          
          console.log(`🗺️ [LINHA ${i + 1}] Rota: ${cidadeOrigem}/${ufOrigem} → ${cidadeDestino}/${ufDestino || 'N/A'}`);

          // Validar dados obrigatórios
          if (!cidadeDestino) {
            throw new Error(`Linha ${i + 2}: Cidade destino é obrigatória`);
          }

          // Calcular distância real usando OpenRouteService
          console.log(`⏳ [LINHA ${i + 1}] Calculando distância...`);
          const routeStartTime = Date.now();
          const routeResult = await calculateCityDistance(cidadeOrigem, ufOrigem, cidadeDestino, ufDestino);
          const routeTime = Date.now() - routeStartTime;
          
          console.log(`✅ [LINHA ${i + 1}] Distância calculada em ${routeTime}ms: ${routeResult.km}km (${routeResult.method})`);
          
          // Log específico para métodos de fallback
          if (routeResult.method !== 'ors_route') {
            console.log(`⚠️ [LINHA ${i + 1}] ATENÇÃO: Usando método alternativo ${routeResult.method} - pode afetar precisão do cálculo`);
          }
          
          const distanciaKm = routeResult.km;
          const metodoCalculo = routeResult.method;
          const origemLabel = routeResult.origem;
          const destinoLabel = routeResult.destino;

          // Mapear tipo de veículo para tipo de carga
          const tipoCarga = mapearTipoCarga(tipoVeiculo, peso);

          const dados = {
            cidade_origem: cidadeOrigem,
            cidade_destino: cidadeDestino,
            uf_origem: ufOrigem,
            uf_destino: ufDestino,
            distancia_km: distanciaKm,
            eixos: qtEixos,
            tipo_carga: tipoCarga,
            tipo_veiculo: tipoVeiculo,
            peso_bruto: peso,
            pedagio: 0,
            retorno_vazio: 0,
            filial: filialNome,
            metodo_calculo: metodoCalculo,
            origem_label: origemLabel,
            destino_label: destinoLabel
          };

          // Calcular frete
          const freteCalculado = calcularFrete(dados);
          
          return {
            linha: i + 2,
            ...dados,
            ...freteCalculado,
            valor_frete_cobrado: valorFreteCobrado,
            status: 'sucesso'
          };

        } catch (error) {
          return {
            linha: i + 2,
            erro: error.message,
            dados: row,
            status: 'erro'
          };
        }
      });

      // Aguardar processamento do lote
      const batchResults = await Promise.all(batchPromises);
      const batchTime = Date.now() - batchStartTime;
      
      console.log(`⚡ [BATCH CONCLUÍDO] Lote processado em ${batchTime}ms (${batchTime/batch.length}ms por linha)`);
      
      // Processar resultados e análise de conformidade
      for (const result of batchResults) {
        if (result.status === 'sucesso') {
          // Análise de conformidade
          const valorFreteCobradoReal = result.valor_frete_cobrado || (result.valor_total * (0.8 + Math.random() * 0.4));
          const isSimulado = !result.valor_frete_cobrado;
          
          // Calcular diferenças
          const diferençaValor = valorFreteCobradoReal - result.valor_total;
          const diferençaPercentual = ((diferençaValor / result.valor_total) * 100);
          
          // Determinar status de conformidade
          let status;
          let observacoes = [];
          
          // Regra crítica: Se o frete cobrado está abaixo do piso mínimo ANTT
          if (valorFreteCobradoReal < result.valor_total) {
            status = 'ERRO_CALCULO';
            observacoes.push('ALERTA: Frete cobrado está abaixo do piso mínimo ANTT - situação irregular');
          } else {
            // Aplicar regras normais de variação percentual
            if (Math.abs(diferençaPercentual) <= 5) {
              status = 'CONFORME';
            } else if (Math.abs(diferençaPercentual) <= 15) {
              status = 'DIVERGENTE';
            } else {
              status = 'ERRO_CALCULO';
            }
          
          console.log(`📊 [CONFORMIDADE] Linha ${result.linha}: ${status} (Diferença: ${diferençaPercentual.toFixed(1)}%)`);
          
          // Log correlacionando método de cálculo com resultado de conformidade
          const metodoUsado = result.metodo_calculo;
          const isApiFailure = metodoUsado !== 'ors_route';
          if (isApiFailure && status === 'ERRO_CALCULO') {
            console.log(`🚨 [CORRELAÇÃO] Linha ${result.linha}: ERRO_CALCULO com método alternativo '${metodoUsado}' - POSSÍVEL CORRELAÇÃO API/PRECISÃO!`);
          } else if (isApiFailure && (status === 'DIVERGENTE' || status === 'ERRO_CALCULO')) {
            console.log(`⚠️ [CORRELAÇÃO] Linha ${result.linha}: ${status} com método '${metodoUsado}' - verificar precisão`);
          } else if (!isApiFailure && status === 'CONFORME') {
            console.log(`✅ [CORRELAÇÃO] Linha ${result.linha}: ${status} com método padrão '${metodoUsado}' - cálculo preciso`);
          }
          
          if (isSimulado) {
            observacoes.push('Valor do frete simulado (não encontrado na planilha)');
          }
          }
          
          // Adicionar observação sobre simulação se necessário
          if (isSimulado) {
            observacoes.push('Valor do frete simulado - adicione coluna "Valor Frete" na planilha');
          }

          // Estrutura compatível com frontend
          const conciliacaoResult = {
            item: {
              filial: result.filial?.substring(0, 2) || '01',
              filialNome: result.filial || 'URBANO MATRIZ',
              dataEmissao: '2024-01-01',
              cfop: '5102',
              cidadeOrigem: result.cidade_origem,
              origemUF: result.uf_origem,
              cidadeDestino: result.cidade_destino,
              destinoUF: result.uf_destino,
              lote: `L${result.linha}`,
              placa: `ABC${String(result.linha).padStart(4, '0')}`,
              transportadora: `Transportadora ${result.linha}`,
              valorFrete: Number(valorFreteCobradoReal.toFixed(2)),
              pesoLiqCalc: result.peso_bruto * 0.9,
              pesoBruto: result.peso_bruto,
              tpVeiculo: result.tipo_veiculo,
              tpFrota: 'Própria',
              qtEixos: result.eixos,
              tipoCarga: result.tipo_carga,
              tabelaFrete: 'A',
              distanciaKm: result.distancia_km,
              retornoVazioKm: 0,
              pedagioTotal: 0
            },
            detalhes: {
              valorMinimo: result.valor_total,
              diferençaValor: Number(diferençaValor.toFixed(2)),
              diferençaPercentual: Number(diferençaPercentual.toFixed(2)),
              CCD: result.CCD,
              CC: result.CC,
              distanciaKm: result.distancia_km,
              eixosUtilizados: result.eixos,
              tipoCaregaUtilizada: result.tipo_carga,
              metodoCalculo: result.metodo_calculo,
              origemLabel: result.origem_label,
              destinoLabel: result.destino_label
            },
            status,
            observacoes
          };

          results.push(conciliacaoResult);
        } else {
          errors.push({
            linha: result.linha,
            erro: result.erro,
            dados: result.dados
          });
        }
      }

      // Enviar progresso a cada lote processado
      const processed = batchStart + batch.length;
      console.log(`📈 [PROGRESSO] ${processed}/${dataRows.length} linhas processadas (${Math.round((processed / dataRows.length) * 100)}%)`);
      
      parentPort.postMessage({
        type: 'progress',
        data: {
          step: 'processing',
          processed,
          total: dataRows.length,
          percentage: Math.round((processed / dataRows.length) * 100),
          message: `Processado ${processed} de ${dataRows.length} linhas (lote ${Math.ceil((batchStart + 1) / BATCH_SIZE)})`
        }
      });

      // Delay entre lotes para respeitar rate limit
      if (batchStart + BATCH_SIZE < dataRows.length) {
        console.log(`⏸️ [DELAY] Aguardando ${BATCH_DELAY/1000}s antes do próximo lote...`);
        await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
      }
    }

    const totalTime = Date.now() - startTime;
    console.log(`🏁 [FINALIZADO] Processamento completo em ${totalTime}ms (${(totalTime/dataRows.length).toFixed(0)}ms por linha)`);

    // Calcular estatísticas finais
    const conforme = results.filter(r => r.status === 'CONFORME').length;
    const divergente = results.filter(r => r.status === 'DIVERGENTE').length;
    const erroCalculo = results.filter(r => r.status === 'ERRO_CALCULO').length;

    // Análise de correlação API vs Conformidade
    const orsRouteResults = results.filter(r => r.detalhes.metodoCalculo === 'ors_route');
    const fallbackResults = results.filter(r => r.detalhes.metodoCalculo !== 'ors_route');
    
    const orsConforme = orsRouteResults.filter(r => r.status === 'CONFORME').length;
    const orsErro = orsRouteResults.filter(r => r.status === 'ERRO_CALCULO').length;
    const fallbackConforme = fallbackResults.filter(r => r.status === 'CONFORME').length;
    const fallbackErro = fallbackResults.filter(r => r.status === 'ERRO_CALCULO').length;
    
    console.log(`📊 [ANÁLISE CORRELAÇÃO API/CONFORMIDADE]`);
    console.log(`   API OpenRouteService (ors_route): ${orsRouteResults.length} linhas`);
    console.log(`     ✅ Conforme: ${orsConforme} (${orsRouteResults.length ? ((orsConforme/orsRouteResults.length)*100).toFixed(1) : 0}%)`);
    console.log(`     ❌ Erro Cálculo: ${orsErro} (${orsRouteResults.length ? ((orsErro/orsRouteResults.length)*100).toFixed(1) : 0}%)`);
    console.log(`   Métodos Alternativos: ${fallbackResults.length} linhas`);
    console.log(`     ✅ Conforme: ${fallbackConforme} (${fallbackResults.length ? ((fallbackConforme/fallbackResults.length)*100).toFixed(1) : 0}%)`);
    console.log(`     ❌ Erro Cálculo: ${fallbackErro} (${fallbackResults.length ? ((fallbackErro/fallbackResults.length)*100).toFixed(1) : 0}%)`);
    
    if (fallbackResults.length > 0 && orsRouteResults.length > 0) {
      const orsErrorRate = (orsErro / orsRouteResults.length) * 100;
      const fallbackErrorRate = (fallbackErro / fallbackResults.length) * 100;
      const difference = fallbackErrorRate - orsErrorRate;
      
      if (difference > 10) {
        console.log(`🚨 [CORRELAÇÃO DETECTADA] Métodos alternativos têm ${difference.toFixed(1)}% mais erros que API padrão!`);
      } else if (difference > 5) {
        console.log(`⚠️ [POSSÍVEL CORRELAÇÃO] Métodos alternativos têm ${difference.toFixed(1)}% mais erros que API padrão`);
      } else {
        console.log(`✅ [SEM CORRELAÇÃO] Diferença de erro entre métodos: ${Math.abs(difference).toFixed(1)}%`);
      }
    }

    // Enviar resultado final
    parentPort.postMessage({
      type: 'completed',
      data: {
        resultados: results,
        erros: errors,
        truncatedInfo,
        stats: {
          total: dataRows.length,
          conforme,
          divergente,
          erroCalculo,
          tempoProcessamento: Date.now() - startTime
        },
        observacoes: truncatedInfo ? [truncatedInfo.message] : []
      }
    });

    } catch (error) {
      parentPort.postMessage({
        type: 'error',
        error: error.message
      });
    }
  }

  // Executar processamento
  processarConciliacao().catch(error => {
    parentPort.postMessage({
      type: 'error',
      error: error.message
    });
  });
}

// Funções auxiliares
function mapearTipoCarga(tipoVeiculo, peso) {
  if (!tipoVeiculo) return 'carga_geral';
  
  const tipo = tipoVeiculo.toLowerCase();
  
  if (tipo.includes('truck') || tipo.includes('semi')) {
    return 'carga_geral';
  }
  if (tipo.includes('bi-trem') || tipo.includes('bitrem')) {
    if (peso > 30000) return 'granel_solido';
    return 'carga_geral';
  }
  if (tipo.includes('3/4') || tipo.includes('leve')) {
    return 'carga_geral';
  }
  
  return 'carga_geral'; // Padrão
}

// Função de cálculo de frete (copiada do servidor principal)
function calcularFrete({ distancia_km, eixos, tipo_carga, pedagio = 0, retorno_vazio = 0 }) {
  // Tabelas de coeficientes (versão resumida para o worker)
  const TABELA_A = {
    "carga_geral": {
      CCD: { 2: 3.6735, 3: 4.6502, 4: 5.3306, 5: 6.0112, 6: 6.7301, 7: 7.3085, 9: 8.2680 },
      CC: { 2: 417.95, 3: 509.43, 4: 559.08, 5: 610.08, 6: 660.12, 7: 752.64, 9: 815.30 }
    },
    "granel_solido": {
      CCD: { 2: 3.7050, 3: 4.6875, 4: 5.3526, 5: 6.0301, 6: 6.7408, 7: 7.3130, 9: 8.2420 },
      CC: { 2: 426.61, 3: 519.67, 4: 565.14, 5: 615.26, 6: 663.07, 7: 753.88, 9: 808.17 }
    }
    // ... outras cargas
  };

  const tipoCarregaKey = tipo_carga in TABELA_A ? tipo_carga : "carga_geral";
  const tabela = TABELA_A[tipoCarregaKey];

  // Encontrar coeficientes para o número de eixos
  const eixosDisponiveis = Object.keys(tabela.CCD).map(Number).sort((a, b) => a - b);
  const eixosValido = eixosDisponiveis.find(e => e >= eixos) || eixosDisponiveis[eixosDisponiveis.length - 1];

  const CCD = tabela.CCD[eixosValido];
  const CC = tabela.CC[eixosValido];

  // Cálculo base
  const valorBase = (distancia_km * CCD) + CC;
  
  // Retorno vazio (92% do CCD * km de retorno)
  const valorRetornoVazio = retorno_vazio * (CCD * 0.92);
  
  // Total
  const valorTotal = valorBase + valorRetornoVazio + pedagio;

  return {
    distancia_km,
    eixos: eixosValido,
    tipo_carga: tipoCarregaKey,
    CCD,
    CC,
    valor_base: Math.round(valorBase * 100) / 100,
    valor_retorno_vazio: Math.round(valorRetornoVazio * 100) / 100,
    pedagio,
    valor_total: Math.round(valorTotal * 100) / 100
  };
}

// Exportar função para criar worker
export function createConciliacaoWorker(filePath, options = {}) {
  const workerPath = import.meta.url.startsWith('file://') 
    ? import.meta.url.slice(8) // Remove 'file:///' no Windows
    : new URL(import.meta.url).pathname;
    
  return new Worker(workerPath, {
    workerData: { filePath, options }
  });
}