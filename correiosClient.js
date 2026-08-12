/**
 * Cliente da API dos Correios.
 *
 * IMPORTANTE — leia antes de colocar em produção:
 * Os caminhos (/token/v1/autentica, /preco/v1/nacional, /prazo/v1/nacional) e os
 * nomes de campo usados abaixo (token, precoFinal, prazoEntrega etc.) seguem a
 * estrutura pública mais comum da API dos Correios, mas podem ter mudado ou
 * variar conforme seu contrato. Antes de ativar de verdade:
 *   1. Confirme os endpoints exatos em https://www.correios.com.br/atendimento/developers
 *   2. Faça uma chamada de teste (Postman/Insomnia) com suas credenciais reais
 *   3. Ajuste as URLs e os nomes de campo abaixo para bater com a resposta real
 *
 * Autenticação: usuário = login do Meu Correios, senha = código de acesso à API
 * (gerado no portal CWS), não a senha do site.
 */

const BASE_URL = process.env.CORREIOS_BASE_URL || 'https://api.correios.com.br';

let tokenCache = { valor: null, expiraEm: 0 };
let ultimaChamada = 0;
const INTERVALO_MINIMO_MS = 350; // Correios limita a ~3 requisições/segundo no /token

async function respeitarLimiteDeTaxa() {
  const agora = Date.now();
  const espera = ultimaChamada + INTERVALO_MINIMO_MS - agora;
  if (espera > 0) {
    await new Promise((resolve) => setTimeout(resolve, espera));
  }
  ultimaChamada = Date.now();
}

async function obterToken() {
  if (tokenCache.valor && Date.now() < tokenCache.expiraEm) {
    return tokenCache.valor;
  }

  await respeitarLimiteDeTaxa();

  const usuario = process.env.CORREIOS_USUARIO;
  const senha = process.env.CORREIOS_SENHA_API;

  if (!usuario || !senha) {
    throw new Error('CORREIOS_USUARIO ou CORREIOS_SENHA_API não configurados no .env');
  }

  const auth = Buffer.from(`${usuario}:${senha}`).toString('base64');

  const resposta = await fetch(`${BASE_URL}/token/v1/autentica`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${auth}`,
      'Content-Type': 'application/json',
    },
  });

  if (!resposta.ok) {
    throw new Error(`Falha ao autenticar nos Correios (status ${resposta.status})`);
  }

  const dados = await resposta.json();
  // Ajuste "dados.token" conforme o nome real do campo no retorno da API.
  tokenCache = {
    valor: dados.token,
    expiraEm: Date.now() + 1000 * 60 * 50, // margem de segurança sobre a validade real do token
  };

  return tokenCache.valor;
}

/**
 * Consulta preço e prazo para um serviço específico (ex: PAC ou SEDEX).
 * Retorna { precoReais, prazoDias }.
 */
async function consultarPrecoEPrazo({
  cepOrigem,
  cepDestino,
  pesoGramas,
  comprimentoCm,
  larguraCm,
  alturaCm,
  codigoServico,
}) {
  const token = await obterToken();

  const params = new URLSearchParams({
    cepOrigem,
    cepDestino,
    peso: String(pesoGramas / 1000),
    comprimento: String(comprimentoCm),
    largura: String(larguraCm),
    altura: String(alturaCm),
    codigoServico,
  });

  const cabecalhos = { Authorization: `Bearer ${token}` };

  const [precoResposta, prazoResposta] = await Promise.all([
    fetch(`${BASE_URL}/preco/v1/nacional?${params.toString()}`, { headers: cabecalhos }),
    fetch(`${BASE_URL}/prazo/v1/nacional?${params.toString()}`, { headers: cabecalhos }),
  ]);

  if (!precoResposta.ok || !prazoResposta.ok) {
    throw new Error('Falha ao consultar preço ou prazo nos Correios');
  }

  const preco = await precoResposta.json();
  const prazo = await prazoResposta.json();

  // Ajuste os nomes de campo abaixo conforme o retorno real da API dos Correios.
  return {
    precoReais: Number(preco.precoFinal ?? preco.preco),
    prazoDias: Number(prazo.prazoEntrega ?? prazo.prazo),
  };
}

module.exports = { consultarPrecoEPrazo, obterToken };
