// ELO3 PROMO — Proxy Definitivo | Versão 3.1 🚀
const fetch = require('node-fetch');

exports.handler = async (event) => {
  const { q, category, limit = 24 } = event.queryStringParameters;

  try {
    const params = new URLSearchParams();
    if (q) params.append('q', q);
    if (category) params.append('category', category);
    params.append('limit', limit);
    params.append('sort', 'relevance');

    const apiRes = await fetch(`https://api.mercadolibre.com/sites/MLB/search?${params}`, {
      headers: { Accept: 'application/json' },
      timeout: 8000
    });

    if (!apiRes.ok) throw new Error(`API Error: ${apiRes.status}`);
    const data = await apiRes.json();

    const produtos = data.results.map(item => {
      const desconto = item.original_price ? Math.round((1 - item.price / item.original_price) * 100) : 0;
      return {
        id: item.id,
        nome: item.title,
        precoOriginal: item.original_price || item.price,
        precoAtual: item.price,
        desconto,
        imagem: item.thumbnail.replace('I.jpg', 'O.webp').replace('I.webp', 'O.webp'),
        linkBase: item.permalink,
        loja: item.seller?.nickname ? `Mercado Livre • ${item.seller.nickname}` : 'Mercado Livre',
        temFreteGratis: item.shipping?.free_shipping || false,
        temDesconto: desconto > 0
      };
    });

    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=300'
      },
      body: JSON.stringify(produtos)
    };

  } catch (erro) {
    console.error(erro);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Falha na busca', mensagem: erro.message })
    };
  }
};
