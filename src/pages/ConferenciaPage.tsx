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
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const textosPagina = textContent.items.map((item: any) => item.str);
        todoTexto += textosPagina.join(' ');
      }

      console.log('Texto extraído do PDF:', todoTexto);
      
      // Objeto para agrupar produtos
      const produtosMap = new Map<string, Produto>();

      // Procurar os totais primeiro
      const totalStrongMatch = todoTexto.match(/TOTAL\s*STRONG\s*BRANCO[^0-9]*(\d+(?:,\d+)?)/i);
      const totalKraftMatch = todoTexto.match(/TOTAL\s*KRAFT\s*MIX[^0-9]*(\d+(?:,\d+)?)/i);

      if (totalStrongMatch) {
        produtosMap.set("JUMBO STRONG BRANCO II", {
          codigo: '00063',
          nome: "JUMBO STRONG BRANCO II",
          pesoTotal: totalStrongMatch[1],
          lotes: []
        });
      }

      if (totalKraftMatch) {
        produtosMap.set("KRAFT MIX", {
          codigo: '00237',
          nome: "KRAFT MIX",
          pesoTotal: totalKraftMatch[1],
          lotes: []
        });
      }

      // Encontrar todos os lotes usando uma expressão regular mais precisa
      const lotesRegex = /GRAMATURA:\s*(\d+)\s*\/\s*FORMATO:\s*(\d+)\s+(\d+(?:,\d+)?)\s+(\d{15})/g;
      let match;

      while ((match = lotesRegex.exec(todoTexto)) !== null) {
        const [, gramatura, formato, peso, lote] = match;
        console.log('Lote encontrado:', { gramatura, formato, peso, lote });

        // Adicionar ao produto correspondente
        for (const [nomeProduto, produto] of produtosMap.entries()) {
          produto.lotes.push({
            gramatura,
            formato,
            peso,
            lote,
            conferido: false
          });
        }
      }

      if (produtosMap.size === 0) {
        throw new Error('Nenhum produto encontrado no PDF. Verifique o formato do arquivo.');
      }

      const produtos = Array.from(produtosMap.values());
      console.log('Produtos processados:', produtos);
      setProdutos(produtos);
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