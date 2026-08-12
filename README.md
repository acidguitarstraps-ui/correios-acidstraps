# Servidor de frete Correios — Acid Straps

Servidor que calcula frete (PAC e SEDEX) em tempo real no checkout do Shopify,
consultando a API dos Correios com o seu convênio. Foi feito para ser usado como
o `callbackUrl` de um Carrier Service do Shopify.

## O que já foi testado

- A lógica de empacotamento (`src/packing.js`) e de formatação da taxa para o
  Shopify (`src/rates.js`) foram testadas e conferidas — os cálculos de peso
  volumétrico e o formato da resposta (`total_price` em centavos, datas etc.)
  estão corretos.
- A sintaxe de todos os arquivos foi verificada.

## O que **ainda precisa ser confirmado por você (ou seu dev) antes de ativar**

O arquivo `src/correiosClient.js` usa os caminhos e nomes de campo mais comuns
da API dos Correios (`/token/v1/autentica`, `/preco/v1/nacional`,
`/prazo/v1/nacional`, campos como `token`, `precoFinal`, `prazoEntrega`), mas eu
não tenho acesso à internet neste ambiente para testar uma chamada real contra
a API dos Correios. Antes de colocar em produção:

1. Gere suas credenciais no portal CWS (usuário do Meu Correios + código de
   acesso à API — não é a senha do site).
2. Faça uma chamada de teste real (pelo Postman, Insomnia, ou até `curl`) para
   confirmar os endpoints exatos e os nomes dos campos na resposta:
   https://www.correios.com.br/atendimento/developers
3. Ajuste as URLs e os nomes de campo em `src/correiosClient.js` para bater
   com o que a API realmente devolve, se for diferente do que está no código.
4. Confirme com seu representante comercial que o serviço 38210 (API Prazos)
   está vinculado ao seu convênio.

## Antes de publicar: ajuste as caixas

Em `src/packing.js`, troque as medidas de `CAIXAS` pelas caixas reais que
você usa para embalar as straps (comprimento, largura e altura em cm).

## Testar localmente

```bash
npm install
cp .env.example .env
# edite o .env com CEP_ORIGEM e suas credenciais dos Correios
npm start
```

O servidor sobe em `http://localhost:3000`. Para simular uma chamada do
Shopify:

```bash
curl -X POST http://localhost:3000/frete-correios \
  -H "Content-Type: application/json" \
  -d '{
    "rate": {
      "origin": { "postal_code": "01000000" },
      "destination": { "postal_code": "20000000" },
      "items": [{ "grams": 250, "quantity": 1 }],
      "currency": "BRL"
    }
  }'
```

## Publicar (deploy) no Render — passo a passo

O Render tem plano gratuito e é o mais simples pra quem não mexe com servidor
no dia a dia.

1. Crie uma conta em https://render.com (dá pra entrar com GitHub).
2. Suba esta pasta para um repositório no GitHub (pode ser privado).
3. No Render, clique em **New > Web Service** e conecte esse repositório.
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Em **Environment**, adicione as mesmas variáveis do `.env.example`
   (`CEP_ORIGEM`, `CORREIOS_USUARIO`, `CORREIOS_SENHA_API`, `CORREIOS_BASE_URL`)
   com seus valores reais.
6. Clique em **Create Web Service** e aguarde o deploy.
7. Quando terminar, o Render te dá uma URL pública, algo como
   `https://correios-acidstraps.onrender.com`.
8. A `callbackUrl` do seu Carrier Service vai ser essa URL + `/frete-correios`,
   por exemplo: `https://correios-acidstraps.onrender.com/frete-correios`.

## Depois do deploy

Me manda essa URL pronta que eu registro o Carrier Service direto na sua loja
Shopify (já tenho a permissão necessária pela conexão que uso aqui). Só depois
disso ele aparece pra você adicionar na zona de entrega em
**Configurações > Frete e entrega**.
