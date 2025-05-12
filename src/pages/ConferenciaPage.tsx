import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Typography, Paper, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';

// Configuração do worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.js';

interface Produto {
  codigo: string;
  nome: string;
  conferido: boolean;
  quantidade: number;
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

      // Aqui você deve implementar a lógica para extrair os produtos do texto do PDF
      const linhas = todoTexto.split('\n');
      const produtosExtraidos: Produto[] = [];

      linhas.forEach((linha, index) => {
        console.log(`Analisando linha ${index}:`, linha);
        
        // Adapte este regex de acordo com o formato do seu PDF
        const match = linha.match(/([0-9]+)\s+(.+?)\s+(\d+)/);
        if (match) {
          const produto = {
            codigo: match[1],
            nome: match[2],
            quantidade: parseInt(match[3]),
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
        // Procurar o produto na lista
        const produto = produtos.find(p => p.codigo === decodedText);
        
        if (produto) {
          setProdutos(prev => 
            prev.map(p => 
              p.codigo === decodedText 
                ? { ...p, conferido: true, quantidade: p.quantidade } 
                : p
            )
          );
        } else {
          setProdutosNaoListados(prev => [
            ...prev,
            {
              codigo: decodedText,
              nome: 'Produto não identificado',
              conferido: true,
              quantidade: 1
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
                  <ListItem key={produto.codigo}>
                    <ListItemText
                      primary={produto.nome}
                      secondary={`Código: ${produto.codigo} - Quantidade: ${produto.quantidade}`}
                      sx={{
                        color: produto.conferido ? 'success.main' : 'text.primary',
                      }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>

            {produtosNaoListados.length > 0 && (
              <Paper sx={{ p: 2, mb: 2 }}>
                <Typography variant="h6" gutterBottom color="error">
                  Produtos Não Listados
                </Typography>
                <List>
                  {produtosNaoListados.map((produto) => (
                    <ListItem key={produto.codigo}>
                      <ListItemText
                        primary={produto.nome}
                        secondary={`Código: ${produto.codigo} - Quantidade: ${produto.quantidade}`}
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
                  // Salvar resultados no localStorage
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