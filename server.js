const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
const PORTA = process.env.PORT || 3000;

// 🔑 SUAS CHAVES DO MERCADO LIVRE (JÁ CONFIGURADAS!)
const CLIENT_ID = '4368692357634027';
const CLIENT_SECRET = 'QHR7xYORKmuoOtwCO2QLXawHLX3dHRno';
const TAG_AFILIADO = 'elo3promoo'; // ✅ Sua TAG de afiliado correta!

app.use(cors());
app.use(express.static('.')); // Servir arquivos do site (index.html, etc.)

// 🔄 Função para pegar Token de Acesso (renova automático)
async function pegarToken() {
  try {
    const resposta = await fetch('https://api.mercadolibre.com/oauth/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `grant_type=client_credentials&client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}`
    });
    const dados = await resposta.json();
    return dados.access_token;
  } catch (erro) {
    console.error('❌ Erro ao obter token:', erro);
    return null;
  }
}

// 🛒 ROTA PRINCIPAL: Buscar Produtos + TAG Automática
app.get('/api/buscar-produtos', async (req, res) => {
  const termo = req.query.q || 'promocoes'; // Padrão: busca promoções
  const limite = Number(req.query.limite) || 12; // Quantidade de produtos

  const token = await pegarToken();
  if (!token) return res.status(500).json({erro:'Falha na autenticação com Mercado Livre'});

  try {
    const resposta = await fetch(`https://api.mercadolibre.com/sites/MLB/search?q=${encodeURIComponent(termo)}&limit=${limite}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const dados = await resposta.json();

    // 🧹 Organiza dados e insere sua TAG nos links
    const produtosFormatados = dados.results.map(prod => ({
      id: prod.id,
      titulo: prod.title,
      preco: prod.price,
      precoAntigo: prod.original_price,
      imagem: prod.thumbnail?.replace('I.jpg', 'O.jpg') || '', // Imagem de qualidade
      link: `https://mercadolibre.com/sec/${prod.id}?aff_id=${TAG_AFILIADO}`, // Link comissão
      freteGratis: prod.shipping?.free_shipping || false,
      desconto: prod.original_price ? Math.round((1 - prod.price / prod.original_price) * 100) : 0
    }));

    res.json(produtosFormatados);
  } catch (erro) {
    console.error('❌ Erro na busca de produtos:', erro);
    res.status(500).json({erro:'Falha ao carregar ofertas'});
  }
});

// 🚀 Inicia o Servidor
app.listen(PORTA, () => {
  console.log(`✅ Servidor ELO3 Promo rodando na porta ${PORTA}`);
  console.log(`🔗 API pronta e conectada ao Mercado Livre!`);
});
