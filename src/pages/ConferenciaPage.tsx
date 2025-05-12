import React, { useState, useEffect } from 'react';
import { Box, Button, Container, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';

interface Produto {
  codigo: string;
  nome: string;
  conferido: boolean;
}

const ConferenciaPage = () => {
  const navigate = useNavigate();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [produtosNaoListados, setProdutosNaoListados] = useState<Produto[]>([]);
  const [romaneioCarregado, setRomaneioCarregado] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        // Aqui você implementará a lógica para parser do seu romaneio
        // Este é apenas um exemplo
        const produtosDoRomaneio: Produto[] = [
          { codigo: '123', nome: 'Produto 1', conferido: false },
          { codigo: '456', nome: 'Produto 2', conferido: false },
        ];
        setProdutos(produtosDoRomaneio);
        setRomaneioCarregado(true);
      };
      reader.readAsText(file);
    }
  };

  useEffect(() => {
    if (romaneioCarregado) {
      const scanner = new Html5QrcodeScanner('reader', {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 5,
      });

      scanner.render(onScanSuccess, onScanError);

      function onScanSuccess(decodedText: string) {
        const produtoEncontrado = produtos.find(p => p.codigo === decodedText);
        
        if (produtoEncontrado) {
          setProdutos(prev => prev.map(p => 
            p.codigo === decodedText ? { ...p, conferido: true } : p
          ));
        } else {
          setProdutosNaoListados(prev => [
            ...prev,
            { codigo: decodedText, nome: 'Produto não listado', conferido: true }
          ]);
        }
      }

      function onScanError(error: any) {
        console.warn(error);
      }

      return () => {
        scanner.clear();
      };
    }
  }, [romaneioCarregado, produtos]);

  const handleFinalizar = () => {
    const resultado = {
      produtos,
      produtosNaoListados,
      produtosNaoConferidos: produtos.filter(p => !p.conferido),
    };
    localStorage.setItem('resultadoConferencia', JSON.stringify(resultado));
    navigate('/resultados');
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Conferência de Produtos
        </Typography>

        {!romaneioCarregado ? (
          <Box sx={{ textAlign: 'center', my: 4 }}>
            <Button variant="contained" component="label">
              Carregar Romaneio
              <input type="file" hidden onChange={handleFileUpload} accept=".txt,.csv" />
            </Button>
          </Box>
        ) : (
          <>
            <div id="reader" style={{ width: '100%' }}></div>
            
            <Paper sx={{ mt: 4, p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Produtos do Romaneio
              </Typography>
              <List>
                {produtos.map((produto) => (
                  <ListItem key={produto.codigo}>
                    <ListItemText 
                      primary={produto.nome}
                      sx={{ color: produto.conferido ? 'green' : 'inherit' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>

            {produtosNaoListados.length > 0 && (
              <Paper sx={{ mt: 2, p: 2 }}>
                <Typography variant="h6" gutterBottom color="error">
                  Produtos Não Listados
                </Typography>
                <List>
                  {produtosNaoListados.map((produto, index) => (
                    <ListItem key={index}>
                      <ListItemText 
                        primary={produto.codigo}
                        sx={{ color: 'red' }}
                      />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            )}

            <Box sx={{ mt: 4, textAlign: 'center' }}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleFinalizar}
                size="large"
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