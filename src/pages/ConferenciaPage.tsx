import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Typography, Paper, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import pdfjsWorker from 'pdfjs-dist/legacy/build/pdf.worker.entry';

// Configuração do worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker.toString();

interface Produto {
  codigo: string;
  nome: string;
  conferido: boolean;
  formato: string;
  gramatura: string;
  peso: string;
  lote: string;
}

const ConferenciaPage = () => {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosNaoListados, setProdutosNaoListados] = useState<Produto[]>([]);
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
        console.log(`Processando página ${i}...`);
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();
        const textosPagina = textContent.items.map((item: any) => item.str);
        todoTexto += textosPagina.join(' ') + '\n';
      }

      console.log('Texto extraído do PDF:', todoTexto);

      const linhas = todoTexto.split('\n');
      const produtosExtraidos: Produto[] = [];

      linhas.forEach((linha, index) => {
        console.log(`Analisando linha ${index}:`, linha);
        
        // Regex atualizado para capturar o formato específico
        // Procura por padrões como "FORMATO: 40 118,000" e "GRAMATURA: 45" seguido por um número de lote
        const formatoMatch = linha.match(/FORMATO:\s*(\d+)\s+(\d+[,.]?\d*)/);
        const gramaturaMatch = linha.match(/GRAMATURA:\s*(\d+)/);
        const loteMatch = linha.match(/(\d{15})/); // 15 dígitos para o lote

        if (formatoMatch && gramaturaMatch && loteMatch) {
          const produto = {
            codigo: '', // Será preenchido pelo código de barras
            nome: `F:${formatoMatch[1]} G:${gramaturaMatch[1]} P:${formatoMatch[2]}`,
            formato: formatoMatch[1],
            gramatura: gramaturaMatch[1],
            peso: formatoMatch[2],
            lote: loteMatch[1],
            conferido: false
          };
          console.log('Produto encontrado:', produto);
          produtosExtraidos.push(produto);
        }
      });

      if (produtosExtraidos.length === 0) {
        throw new Error('Nenhum produto encontrado no PDF. Verifique o formato do arquivo.');
      }

      console.log('Total de produtos encontrados:', produtosExtraidos.length);
      setProdutos(produtosExtraidos);
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
        const produto = produtos.find(p => p.lote === decodedText);
        
        if (produto) {
          setProdutos(prev => 
            prev.map(p => 
              p.lote === decodedText 
                ? { ...p, conferido: true } 
                : p
            )
          );
        } else {
          setProdutosNaoListados(prev => [
            ...prev,
            {
              codigo: '',
              nome: 'Produto não identificado',
              formato: '',
              gramatura: '',
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
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Conferência de Produtos
        </Typography>

        {!romaneioCarregado && (
          <Box sx={{ textAlign: 'center', my: 4 }}>
            <Button variant="contained" component="label" disabled={loading}>
              {loading ? 'Carregando...' : 'Carregar Romaneio'}
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

            <Paper sx={{ p: 2, mb: 2 }}>
              <Typography variant="h6" gutterBottom>
                Produtos do Romaneio
              </Typography>
              <List>
                {produtos.map((produto) => (
                  <ListItem key={produto.lote}>
                    <ListItemText
                      primary={produto.nome}
                      secondary={`Lote: ${produto.lote}`}
                      sx={{
                        color: produto.conferido ? 'success.main' : 'text.primary',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
              <Box sx={{ mt: 2, borderTop: 1, pt: 2, borderColor: 'divider' }}>
                <Typography variant="subtitle1" gutterBottom>
                  Total de Peso: {produtos.reduce((acc, curr) => acc + parseFloat(curr.peso.replace(',', '.')), 0).toLocaleString('pt-BR')} KG
                </Typography>
              </Box>
            </Paper>

            {produtosNaoListados.length > 0 && (
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom color="error">
                  Produtos Não Listados
                </Typography>
                <List>
                  {produtosNaoListados.map((produto) => (
                    <ListItem key={produto.lote}>
                      <ListItemText
                        primary={produto.nome}
                        secondary={`Lote: ${produto.lote}`}
                        sx={{ color: 'error.main' }}
                      />
                    </ListItem>
                  ))}
                </List>
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
                    produtosNaoListados,
                    produtosNaoConferidos: produtos.filter(p => !p.conferido)
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