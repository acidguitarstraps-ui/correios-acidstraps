/**
 * Empacotamento e cálculo de peso para cotação.
 *
 * AJUSTE AQUI: troque as medidas abaixo pelas caixas reais que a Acid Straps usa.
 * comprimento/largura/altura em centímetros, pesoMaximoGramas é o limite de peso
 * real de itens que cabem nessa caixa (ajuste conforme sua embalagem).
 */
const CAIXAS = [
  { nome: 'pequena', comprimento: 30, largura: 20, altura: 5, pesoMaximoGramas: 1000 },
  { nome: 'media', comprimento: 40, largura: 30, altura: 10, pesoMaximoGramas: 3000 },
];

/**
 * Peso volumétrico em gramas, pela fórmula padrão dos Correios:
 * (comprimento x largura x altura em cm) / 6000, resultado em kg.
 */
function pesoVolumetricoGramas(comprimentoCm, larguraCm, alturaCm) {
  const volumeCm3 = comprimentoCm * larguraCm * alturaCm;
  const pesoVolumetricoKg = volumeCm3 / 6000;
  return Math.round(pesoVolumetricoKg * 1000);
}

function escolherCaixa(pesoTotalGramas) {
  const caixa = CAIXAS.find((c) => pesoTotalGramas <= c.pesoMaximoGramas);
  return caixa || CAIXAS[CAIXAS.length - 1];
}

/**
 * Recebe os itens no formato que o Shopify envia (rate.items) e devolve
 * a caixa escolhida e o peso a ser usado na cotação (o maior entre real e volumétrico).
 */
function calcularPesoParaCotacao(itens) {
  const pesoRealGramas = itens.reduce(
    (soma, item) => soma + (item.grams || 0) * (item.quantity || 1),
    0
  );

  const caixa = escolherCaixa(pesoRealGramas);
  const pesoVolumetrico = pesoVolumetricoGramas(caixa.comprimento, caixa.largura, caixa.altura);
  const pesoParaCotacaoGramas = Math.max(pesoRealGramas, pesoVolumetrico);

  return {
    caixa,
    pesoRealGramas,
    pesoVolumetricoGramas: pesoVolumetrico,
    pesoParaCotacaoGramas,
  };
}

module.exports = { calcularPesoParaCotacao, CAIXAS, pesoVolumetricoGramas };
