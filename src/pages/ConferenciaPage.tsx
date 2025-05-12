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
        todoTexto += textosPagina.join(' ') + '\n';
      }

      console.log('Texto extraído do PDF:', todoTexto);
      const linhas = todoTexto.split('\n');
      
      // Objeto para agrupar produtos
      const produtosMap = new Map<string, Produto>();
      
      let produtoAtual: string | null = null;
      let pesoTotal: string | null = null;

      linhas.forEach((linha) => {
        // Procura pelo cabeçalho do produto (ex: 00063 - JUMBO STRONG BRANCO II KG 752,000)
        const cabecalhoMatch = linha.match(/(\d{5}\s*-\s*[^KG]+)\s*KG\s*(\d+[,.]?\d*)/);
        if (cabecalhoMatch) {
          produtoAtual = cabecalhoMatch[1].trim();
          pesoTotal = cabecalhoMatch[2];
          if (!produtosMap.has(produtoAtual)) {
            produtosMap.set(produtoAtual, {
              codigo: '',
              nome: produtoAtual,
              pesoTotal: pesoTotal,
              lotes: []
            });
          }
        }

        // Procura por linhas de lote
        const loteMatch = linha.match(/FORMATO:\s*(\d+)\s+(\d+[,.]?\d*)\s+(\d{15})\s+GRAMATURA:\s*(\d+)/);
        if (loteMatch && produtoAtual) {
          const produto = produtosMap.get(produtoAtual);
          if (produto) {
            produto.lotes.push({
              formato: loteMatch[1],
              peso: loteMatch[2],
              lote: loteMatch[3],
              gramatura: loteMatch[4],
              conferido: false
            });
          }
        }
      });

      if (produtosMap.size === 0) {
        throw new Error('Nenhum produto encontrado no PDF. Verifique o formato do arquivo.');
      }

      setProdutos(Array.from(produtosMap.values()));
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
        // Procurar o produto na lista pelo código de barras (que deve ser o lote)
        const produto = produtos.find(p => p.lotes.some(l => l.lote === decodedText));
        
        if (produto) {
          setProdutos(prev => 
            prev.map(p => 
              p.lotes.find(l => l.lote === decodedText)
                ? { ...p, lotes: p.lotes.map(l => l.lote === decodedText ? { ...l, conferido: true } : l) }
                : p
            )
          );
        } else {
          setProdutosNaoListados(prev => [
            ...prev,
            {
              gramatura: '',
              formato: '',
              peso: '',
              lote: decodedText,
              conferido: true
            }
          ]);
        }
      }, (error) => {
        // Ignorar erros de leitura
      });

      return () => {
        scanner.clear();
      };
    }
  }, [romaneioCarregado, produtos]);

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
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Scanner de Código de Barras
              </Typography>
              <div id="reader" style={{ width: '100%', maxWidth: '640px', margin: '0 auto' }}></div>
            </Box>

            {produtos.map((produto) => (
              <Paper key={produto.nome} sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom>
                  {produto.nome}
                </Typography>
                <Typography variant="subtitle1" gutterBottom color="primary">
                  Peso Total: {produto.pesoTotal} KG
                </Typography>
                
                <TableContainer>
                  <Table size="small">
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
                      {produto.lotes.map((lote) => (
                        <TableRow 
                          key={lote.lote}
                          sx={{
                            backgroundColor: lote.conferido ? 'success.light' : 'inherit'
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
              </Paper>
            ))}

            {produtosNaoListados.length > 0 && (
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom color="error">
                  Produtos Não Listados
                </Typography>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Lote</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {produtosNaoListados.map((produto) => (
                        <TableRow key={produto.lote}>
                          <TableCell>{produto.lote}</TableCell>
                          <TableCell sx={{ color: 'error.main' }}>
                            Não encontrado no romaneio
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Paper>
            )}

            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setProdutos([]);
                  setProdutosNaoListados([]);
                  setRomaneioCarregado(false);
                }}
              >
                Cancelar Conferência
              </Button>
              <Button
                variant="contained"
                color="success"
                onClick={() => {
                  localStorage.setItem('resultadoConferencia', JSON.stringify({
                    produtos,
                    produtosNaoListados
                  }));
                  navigate('/resultados');
                }}
              >
                Finalizar Conferência
              </Button>
            </Box>
          </>
        )}
      </Box>
    </Container>
  );
};

export default ConferenciaPage; 