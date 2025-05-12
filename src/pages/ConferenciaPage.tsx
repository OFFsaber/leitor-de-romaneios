import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress } from '@mui/material';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry';

// Configuração do worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface ProdutoLote {
  gramatura: string;
  formato: string;
  peso: string;
  lote: string;
  conferido: boolean;
}

interface Produto {
  codigo: string;
  nome: string;
  pesoTotal: string;
  lotes: ProdutoLote[];
}

const ConferenciaPage = () => {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosNaoListados, setProdutosNaoListados] = useState<ProdutoLote[]>([]);
  const [romaneioCarregado, setRomaneioCarregado] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processarPDF = async (arrayBuffer: ArrayBuffer) => {
    try {
      console.log('Iniciando processamento do PDF...');
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      console.log('PDF carregado com sucesso. Número de páginas:', pdf.numPages);
      
      let todoTexto = '';
      
      // Extrair todo o texto do PDF
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const textosPagina = textContent.items.map((item: any) => item.str);
        todoTexto += textosPagina.join(' ');
      }

      console.log('Texto extraído:', todoTexto);

      const produtosProcessados = new Map<string, Produto>();

      // Procurar por cada produto individualmente
      const produtosAlvo = [
        {
          codigo: '00063',
          nome: 'JUMBO STRONG BRANCO II',
          gramaturaEsperada: '45'
        },
        {
          codigo: '00237',
          nome: 'KRAFT MIX',
          gramaturaEsperada: '38'
        }
      ];

      for (const produtoInfo of produtosAlvo) {
        // Procurar pelo código ou nome do produto
        if (todoTexto.includes(produtoInfo.codigo) || todoTexto.includes(produtoInfo.nome)) {
          console.log(`Encontrado produto: ${produtoInfo.nome}`);

          // Procurar pelo peso total
          let pesoTotal = '0';
          const regexPesoTotal = new RegExp(`${produtoInfo.nome}[^0-9]*(\\d+(?:[.,]\\d+)?)`);
          const matchPesoTotal = todoTexto.match(regexPesoTotal);
          if (matchPesoTotal) {
            pesoTotal = matchPesoTotal[1];
            console.log(`Peso total encontrado para ${produtoInfo.nome}: ${pesoTotal}`);
          }

          // Criar produto
          const produto: Produto = {
            codigo: produtoInfo.codigo,
            nome: produtoInfo.nome,
            pesoTotal: pesoTotal,
            lotes: []
          };

          // Procurar por todos os padrões possíveis de lote
          const padroes = [
            // Padrão específico para o formato do seu PDF
            /GRAMATURA:\s*(\d+)\s*\/\s*FORMATO:\s*(\d+)\s+(\d+(?:[.,]\d+)?)\s+(\d{10,15})/g
          ];

          for (const padrao of padroes) {
            let match;
            while ((match = padrao.exec(todoTexto)) !== null) {
              try {
                const [, gramaturaRaw, formatoRaw, pesoRaw, loteRaw] = match;
                
                // Garantir que todos os valores existem e fazer trim com segurança
                const gramatura = (gramaturaRaw || '').toString().trim();
                const formato = (formatoRaw || '').toString().trim();
                const peso = (pesoRaw || '').toString().trim();
                const lote = (loteRaw || '').toString().trim();

                // Verificar se os valores são válidos antes de adicionar
                if (gramatura && formato && peso && lote) {
                  console.log(`Lote encontrado para ${produtoInfo.nome}:`, { gramatura, formato, peso, lote });

                  // Verificar se a gramatura corresponde ao produto
                  if (gramatura === produtoInfo.gramaturaEsperada) {
                    produto.lotes.push({
                      gramatura,
                      formato,
                      peso,
                      lote,
                      conferido: false
                    });
                  }
                }
              } catch (error) {
                console.error('Erro ao processar lote:', error);
                continue; // Continuar para o próximo lote em caso de erro
              }
            }
          }

          if (produto.lotes.length > 0) {
            produtosProcessados.set(produtoInfo.nome, produto);
            console.log(`Produto ${produtoInfo.nome} adicionado com ${produto.lotes.length} lotes`);
          }
        }
      }

      if (produtosProcessados.size === 0) {
        throw new Error('Nenhum produto encontrado no PDF. Verifique se o arquivo está correto.');
      }

      const produtosFinais = Array.from(produtosProcessados.values());
      console.log('Produtos processados:', produtosFinais);
      setProdutos(produtosFinais);
      setRomaneioCarregado(true);
      setError(null);
    } catch (err) {
      console.error('Erro ao processar PDF:', err);
      setError('Erro ao processar o PDF. Verifique se o arquivo está correto e tente novamente.');
      setRomaneioCarregado(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setLoading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      await processarPDF(arrayBuffer);
    } catch (err) {
      console.error('Erro ao ler o arquivo:', err);
      setError('Erro ao ler o arquivo. Verifique se é um PDF válido.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (romaneioCarregado) {
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      };
      
      const scanner = new Html5QrcodeScanner(
        "reader",
        config,
        /* verbose= */ false
      );

      scanner.render((decodedText) => {
        console.log('Código escaneado:', decodedText);
        // Atualizar o status do lote escaneado
        setProdutos(prevProdutos => 
          prevProdutos.map(produto => ({
            ...produto,
            lotes: produto.lotes.map(lote => 
              lote.lote === decodedText 
                ? { ...lote, conferido: true }
                : lote
            )
          }))
        );
      }, (error) => {
        // Ignorar erros de leitura
        console.log('Erro de leitura ignorado:', error);
      });

      return () => {
        scanner.clear();
      };
    }
  }, [romaneioCarregado]);

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Conferência de Produtos
        </Typography>

        {!romaneioCarregado && (
          <Box sx={{ textAlign: 'center', my: 4 }}>
            <Button variant="contained" component="label" disabled={loading}>
              {loading ? 'Carregando...' : 'CARREGAR ROMANEIO'}
              <input type="file" hidden onChange={handleFileUpload} accept=".pdf" />
            </Button>
            {loading && (
              <Box sx={{ mt: 2 }}>
                <CircularProgress />
              </Box>
            )}
            {error && (
              <Typography color="error" sx={{ mt: 2 }}>
                {error}
              </Typography>
            )}
          </Box>
        )}

        {romaneioCarregado && (
          <>
            <Box id="reader" sx={{ mb: 4 }}></Box>
            
            {produtos.map((produto) => (
              <Box key={produto.codigo} sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  {produto.nome}
                  <Typography component="span" color="primary" sx={{ ml: 2 }}>
                    Peso Total: {produto.pesoTotal} KG
                  </Typography>
                </Typography>

                <TableContainer component={Paper}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Gramatura</TableCell>
                        <TableCell>Formato</TableCell>
                        <TableCell>Peso</TableCell>
                        <TableCell>Lote</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {produto.lotes.map((lote, index) => (
                        <TableRow 
                          key={index}
                          sx={{ 
                            backgroundColor: lote.conferido ? '#e8f5e9' : 'inherit'
                          }}
                        >
                          <TableCell>{lote.gramatura}</TableCell>
                          <TableCell>{lote.formato}</TableCell>
                          <TableCell>{lote.peso}</TableCell>
                          <TableCell>{lote.lote}</TableCell>
                          <TableCell>
                            {lote.conferido ? 'Conferido' : 'Pendente'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            ))}

            <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
              <Button 
                variant="outlined" 
                color="secondary" 
                onClick={() => {
                  setProdutos([]);
                  setProdutosNaoListados([]);
                  setRomaneioCarregado(false);
                }}
              >
                CANCELAR CONFERÊNCIA
              </Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={() => navigate('/resultados')}
              >
                FINALIZAR CONFERÊNCIA
              </Button>
            </Box>
          </>
        )}

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default ConferenciaPage; 