/**
 * Serviços que serão cotados. Ajuste os códigos conforme seu contrato
 * (código de serviço dos Correios pode variar entre convênios).
 */
const SERVICOS = [
  { codigo: '03220', nome: 'PAC' },
  { codigo: '03140', nome: 'SEDEX' },
];

function formatarDataEntrega(prazoDias) {
  const data = new Date();
  data.setDate(data.getDate() + prazoDias);
  return data.toISOString().slice(0, 10);
}

/**
 * Monta uma taxa no formato exigido pela Carrier Service API do Shopify.
 * total_price precisa ser string, em centavos (subunidade da moeda).
 */
function montarTaxaShopify({ nomeServico, precoReais, prazoDias }) {
  return {
    service_name: nomeServico,
    service_code: nomeServico.replace(/\s+/g, '_').toUpperCase(),
    total_price: String(Math.round(precoReais * 100)),
    currency: 'BRL',
    min_delivery_date: formatarDataEntrega(prazoDias),
    max_delivery_date: formatarDataEntrega(prazoDias + 2),
  };
}

module.exports = { SERVICOS, montarTaxaShopify, formatarDataEntrega };
