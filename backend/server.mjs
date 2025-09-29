// server.js
// Node 18+ — Express API para cálculo do piso mínimo de frete (ANTT)
// Fórmula base (Res. ANTT 5.867/2020): piso = (km * CCD) + CC
// Extras opcionais: + pedágio; + retorno vazio (92% do CCD * km_retorno)

import express from "express";
import cors from "cors";

const app = express();
app.use(cors());
app.use(express.json());

// -----------------------------
// TABELAS DE COEFICIENTES (ANEXO II) - A e B
// CCD = coeficiente de deslocamento (R$/km), CC = coeficiente de carga/descarga (R$)
// -----------------------------

// TABELA A — Transporte Rodoviário de Carga LOTAÇÃO
const TABELA_A = {
  "granel_solido": {
    CCD: { 2: 3.7050, 3: 4.6875, 4: 5.3526, 5: 6.0301, 6: 6.7408, 7: 7.3130, 9: 8.2420 },
    CC:  { 2: 426.61, 3: 519.67, 4: 565.14, 5: 615.26, 6: 663.07, 7: 753.88, 9: 808.17 },
  },
  "granel_liquido": {
    CCD: { 2: 3.7622, 3: 4.7615, 4: 5.5685, 5: 6.1801, 6: 6.8811, 7: 7.4723, 9: 8.4114 },
    CC:  { 2: 433.79, 3: 531.46, 4: 607.41, 5: 639.41, 6: 684.54, 7: 780.59, 9: 837.65 },
  },
  "frigorificada_ou_aquecida": {
    CCD: { 2: 4.3393, 3: 5.4569, 4: 6.3427, 5: 7.1099, 6: 7.8970, 7: 8.7884, 9: 9.8648 },
    CC:  { 2: 486.21, 3: 582.22, 4: 662.76, 5: 713.06, 6: 754.06, 7: 932.67, 9: 993.46 },
  },
  "conteinerizada": {
    CCD: { 2: 4.7626, 3: 5.2867, 4: 5.9579, 5: 6.6621, 6: 7.3528, 7: 8.1922 },
    CC:  { 2: 540.34, 3: 547.03, 4: 595.41, 5: 641.42, 6: 764.84, 7: 794.47 },
  },
  "carga_geral": {
    CCD: { 2: 3.6735, 3: 4.6502, 4: 5.3306, 5: 6.0112, 6: 6.7301, 7: 7.3085, 9: 8.2680 },
    CC:  { 2: 417.95, 3: 509.43, 4: 559.08, 5: 610.08, 6: 660.12, 7: 752.64, 9: 815.30 },
  },
  "neogranel": {
    CCD: { 2: 3.3436, 3: 4.6495, 4: 5.3428, 5: 6.0021, 6: 6.7230, 7: 7.3493, 9: 8.2608 },
    CC:  { 2: 417.95, 3: 509.23, 4: 562.44, 5: 607.56, 6: 658.16, 7: 763.86, 9: 813.33 },
  },
  "perigosa_granel_solido": {
    CCD: { 2: 4.4311, 3: 5.4135, 4: 6.1264, 5: 6.8039, 6: 7.5146, 7: 8.1156, 9: 9.0751 },
    CC:  { 2: 565.59, 3: 658.64, 4: 712.46, 5: 762.59, 6: 810.39, 7: 909.14, 9: 971.80 },
  },
  "perigosa_granel_liquido": {
    CCD: { 2: 4.5003, 3: 5.4995, 4: 6.3232, 5: 6.9348, 6: 7.6358, 7: 8.2559, 9: 9.2254 },
    CC:  { 2: 584.61, 3: 682.28, 4: 766.58, 5: 798.58, 6: 843.71, 7: 947.70, 9: 1013.12 },
  },
  "perigosa_frigorificada_ou_aquecida": {
    CCD: { 2: 4.9079, 3: 6.0255, 4: 6.9433, 5: 7.7105, 6: 8.4977, 7: 9.4266, 9: 10.5426 },
    CC:  { 2: 588.72, 3: 684.73, 4: 776.13, 5: 826.43, 6: 867.42, 7: 1056.35, 9: 1128.02 },
  },
  "perigosa_conteinerizada": {
    CCD: { 2: 5.1110, 3: 5.6828, 4: 6.3540, 5: 7.0582, 6: 7.7778, 7: 8.6476 },
    CC:  { 2: 631.35, 3: 646.39, 4: 694.77, 5: 740.78, 6: 872.14, 7: 910.14 },
  },
  "perigosa_carga_geral": {
    CCD: { 2: 4.0218, 3: 4.9986, 4: 5.7267, 5: 6.4073, 6: 7.1262, 7: 7.7334, 9: 8.7233 },
    CC:  { 2: 508.96, 3: 600.44, 4: 658.44, 5: 709.44, 6: 759.49, 7: 859.94, 9: 930.97 },
  },
  "granel_pressurizada": {
    CCD: { 2: 6.3124, 3: 7.0865, 5: 8.7009 },
    CC:  { 2: 692.89, 3: 758.14, 5: 934.37 },
  },
};

// TABELA B — Contratação APENAS DO VEÍCULO AUTOMOTOR DE CARGAS
const TABELA_B = {
  "granel_solido": {
    CCD: { 2: 4.7938, 3: 5.3348, 4: 6.0208, 5: 6.3960, 6: 6.9782 },
    CC:  { 2: 511.74, 3: 556.92, 4: 597.91, 5: 677.24, 6: 701.32 },
  },
  "granel_liquido": {
    CCD: { 2: 4.8560, 3: 5.3970, 4: 6.0829, 5: 6.4582, 6: 7.0404 },
    CC:  { 2: 511.74, 3: 556.92, 4: 597.91, 5: 677.24, 6: 701.32 },
  },
  "frigorificada_ou_aquecida": {
    CCD: { 2: 5.5986, 3: 6.2287, 4: 7.0158, 5: 7.4200, 6: 8.1563 },
    CC:  { 2: 558.42, 3: 603.60, 4: 644.60, 5: 731.86, 6: 764.31 },
  },
  "conteinerizada": {
    CCD: { 2: 4.7938, 3: 5.3348, 4: 6.0208, 5: 6.3960, 6: 6.9782 },
    CC:  { 2: 511.74, 3: 556.92, 4: 597.91, 5: 677.24, 6: 701.32 },
  },
  "carga_geral": {
    CCD: { 2: 4.7938, 3: 5.3348, 4: 6.0208, 5: 6.3960, 6: 6.9782 },
    CC:  { 2: 511.74, 3: 556.92, 4: 597.91, 5: 677.24, 6: 701.32 },
  },
  "neogranel": {
    CCD: { 2: 4.7938, 3: 5.3348, 4: 6.0208, 5: 6.3960, 6: 6.9782 },
    CC:  { 2: 511.74, 3: 556.92, 4: 597.91, 5: 677.24, 6: 701.32 },
  },
  "perigosa_granel_solido": {
    CCD: { 2: 5.5676, 3: 6.1086, 4: 6.7946, 5: 7.1987, 6: 7.8113 },
    CC:  { 2: 659.06, 3: 704.25, 4: 745.24, 5: 832.50, 6: 864.95 },
  },
  "perigosa_granel_liquido": {
    CCD: { 2: 5.6107, 3: 6.1517, 4: 6.8376, 5: 7.2418, 6: 7.8544 },
    CC:  { 2: 670.91, 3: 716.09, 4: 757.08, 5: 844.35, 6: 876.79 },
  },
  "perigosa_frigorificada_ou_aquecida": {
    CCD: { 2: 6.1993, 3: 6.8294, 4: 7.6165, 5: 8.0582, 6: 8.8340 },
    CC:  { 2: 671.79, 3: 716.97, 4: 757.96, 5: 855.55, 6: 898.87 },
  },
  "perigosa_conteinerizada": {
    CCD: { 2: 5.1899, 3: 5.7309, 4: 6.4168, 5: 6.8210, 6: 7.4336 },
    CC:  { 2: 611.10, 3: 656.28, 4: 697.28, 5: 784.54, 6: 816.98 },
  },
  "perigosa_carga_geral": {
    CCD: { 2: 5.1899, 3: 5.7309, 4: 6.4168, 5: 6.8210, 6: 7.4336 },
    CC:  { 2: 611.10, 3: 656.28, 4: 697.28, 5: 784.54, 6: 816.98 },
  },
  "granel_pressurizada": {
    CCD: { 2: 5.3348, 3: 6.0208, 5: 6.9782 },
    CC:  { 2: 556.92, 3: 597.91, 5: 701.32 },
  },
};

function getCoeficientes({ tabela, tipoCarga, eixos }) {
  const T = tabela === "B" ? TABELA_B : TABELA_A;
  const item = T[tipoCarga];
  if (!item) return { erro: `Tipo de carga inválido para tabela ${tabela}` };
  const CCD = item.CCD[eixos];
  const CC  = item.CC[eixos];
  if (typeof CCD !== "number" || typeof CC !== "number") {
    return { erro: `Combinação de eixos ${eixos} não disponível para ${tipoCarga} na tabela ${tabela}` };
  }
  return { CCD, CC };
}

function assertNumber(n, name) {
  if (typeof n !== "number" || Number.isNaN(n) || n < 0) {
    throw new Error(`Campo numérico inválido: ${name}`);
  }
}

app.post("/api/calcula-frete", (req, res) => {
  try {
    const {
      tabela = "A",
      tipoCarga,
      eixos,
      distancia_km,
      retorno_vazio_km = 0,
      pedagio_total = 0,
    } = req.body || {};

    if (!tipoCarga) throw new Error("Informe 'tipoCarga'.");
    if (!eixos) throw new Error("Informe 'eixos'.");
    assertNumber(distancia_km, "distancia_km");
    assertNumber(retorno_vazio_km, "retorno_vazio_km");
    assertNumber(pedagio_total, "pedagio_total");

    const { CCD, CC, erro } = getCoeficientes({ tabela, tipoCarga, eixos });
    if (erro) return res.status(400).json({ erro });

    const pisoBase = distancia_km * CCD + CC;
    const retornoVazioValor = retorno_vazio_km > 0 ? 0.92 * CCD * retorno_vazio_km : 0;
    const total = pisoBase + retornoVazioValor + pedagio_total;

    return res.json({
      input: { tabela, tipoCarga, eixos, distancia_km, retorno_vazio_km, pedagio_total },
      coeficientes: { CCD, CC },
      detalhamento: {
        pisoBase: Math.round(pisoBase * 100) / 100,
        retornoVazioValor: Math.round(retornoVazioValor * 100) / 100,
        pedagio_total: Math.round(pedagio_total * 100) / 100,
      },
      total: Math.round(total * 100) / 100,
      moeda: "BRL",
      observacoes: [
        "Fórmula: (km × CCD) + CC, com acréscimos opcionais de retorno vazio (92% do CCD × km_retorno) e pedágio.",
        "Lucro, tributos e despesas administrativas NÃO estão incluídos no piso — negocie à parte.",
      ],
    });
  } catch (err) {
    return res.status(400).json({ erro: err.message || "Erro ao calcular." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`API de cálculo ANTT rodando na porta ${PORT}`);
});
