require('dotenv').config();
const express = require('express');
const { calcularPesoParaCotacao } = require('./packing');
const { consultarPrecoEPrazo } = require('./correiosClient');
const { SERVICOS, montarTaxaShopify } = require('./rates');

const app = express();
app.use(express.json());

const CEP_ORIGEM = process.env.CEP_ORIGEM;

/**
 * Endpoint chamado pelo Shopify no checkout (callbackUrl do Carrier Service).
 * Formato de entrada e saída documentado em:
 * https://shopify.dev/docs/apps/build/purchase-options/deferred/delivery-and-deferment/carrier-services
 */
app.post('/frete-correios', async (req, res) => {
  try {
    const { rate } = req.body || {};

    if (!rate || !rate.destination || !Array.isArray(rate.items)) {
      return res.json({ rates: [] });
    }

    const cepDestino = (rate.destination.postal_code || '').replace(/\D/g, '');
    if (!cepDestino || !CEP_ORIGEM) {
      return res.json({ rates: [] });
    }

    const { caixa, pesoParaCotacaoGramas } = calcularPesoParaCotacao(rate.items);

    const resultados = await Promise.allSettled(
      SERVICOS.map(async (servico) => {
        const { precoReais, prazoDias } = await consultarPrecoEPrazo({
          cepOrigem: CEP_ORIGEM,
          cepDestino,
          pesoGramas: pesoParaCotacaoGramas,
          comprimentoCm: caixa.comprimento,
          larguraCm: caixa.largura,
          alturaCm: caixa.altura,
          codigoServico: servico.codigo,
        });
        return montarTaxaShopify({ nomeServico: servico.nome, precoReais, prazoDias });
      })
    );

    const rates = resultados
      .filter((resultado) => resultado.status === 'fulfilled')
      .map((resultado) => resultado.value);

    resultados
      .filter((resultado) => resultado.status === 'rejected')
      .forEach((resultado) => console.error('Falha ao cotar serviço:', resultado.reason));

    return res.json({ rates });
  } catch (erro) {
    console.error('Erro ao calcular frete:', erro);
    // Em caso de erro, devolve lista vazia em vez de derrubar o checkout do cliente.
    return res.status(200).json({ rates: [] });
  }
});

app.get('/', (_req, res) => {
  res.send('Servidor de frete Correios - Acid Straps - no ar');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

module.exports = app;
