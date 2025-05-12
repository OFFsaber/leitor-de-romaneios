import React, { useEffect, useState } from 'react';
import { Box, Button, Container, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import jsPDF from 'jspdf';

interface Produto {
  codigo: string;
  nome: string;
  conferido: boolean;
}

interface Resultado {
  produtos: Produto[];
  produtosNaoListados: Produto[];
  produtosNaoConferidos: Produto[];
}

const ResultadosPage = () => {
  const navigate = useNavigate();
  const [resultado, setResultado] = useState<Resultado | null>(null);

  useEffect(() => {
    const resultadoSalvo = localStorage.getItem('resultadoConferencia');
    if (resultadoSalvo) {
      setResultado(JSON.parse(resultadoSalvo));
    }
  }, []);

  const exportarPDF = () => {
    if (!resultado) return;

    const doc = new jsPDF();
    let yPos = 20;

    // Título
    doc.setFontSize(20);
    doc.text('Relatório de Conferência', 20, yPos);
    yPos += 20;

    // Produtos Conferidos
    doc.setFontSize(16);
    doc.text('Produtos Conferidos:', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    resultado.produtos.filter(p => p.conferido).forEach(produto => {
      doc.text(`${produto.codigo} - ${produto.nome}`, 30, yPos);
      yPos += 7;
    });

    // Produtos Não Conferidos
    yPos += 10;
    doc.setFontSize(16);
    doc.text('Produtos Não Conferidos:', 20, yPos);
    yPos += 10;
    doc.setFontSize(12);
    resultado.produtosNaoConferidos.forEach(produto => {
      doc.text(`${produto.codigo} - ${produto.nome}`, 30, yPos);
      yPos += 7;
    });

    // Produtos Não Listados
    if (resultado.produtosNaoListados.length > 0) {
      yPos += 10;
      doc.setFontSize(16);
      doc.text('Produtos Não Listados:', 20, yPos);
      yPos += 10;
      doc.setFontSize(12);
      resultado.produtosNaoListados.forEach(produto => {
        doc.text(`${produto.codigo}`, 30, yPos);
        yPos += 7;
      });
    }

    doc.save('relatorio-conferencia.pdf');
  };

  if (!resultado) {
    return (
      <Container maxWidth="sm">
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="h5">Nenhum resultado encontrado</Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/')}
            sx={{ mt: 2 }}
          >
            Voltar ao Início
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Resultados da Conferência
        </Typography>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Produtos Conferidos ({resultado.produtos.filter(p => p.conferido).length})
          </Typography>
          <List>
            {resultado.produtos
              .filter(p => p.conferido)
              .map((produto) => (
                <ListItem key={produto.codigo}>
                  <ListItemText
                    primary={`${produto.codigo} - ${produto.nome}`}
                    sx={{ color: 'green' }}
                  />
                </ListItem>
              ))}
          </List>
        </Paper>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom>
            Produtos Não Conferidos ({resultado.produtosNaoConferidos.length})
          </Typography>
          <List>
            {resultado.produtosNaoConferidos.map((produto) => (
              <ListItem key={produto.codigo}>
                <ListItemText
                  primary={`${produto.codigo} - ${produto.nome}`}
                  sx={{ color: 'error.main' }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>

        {resultado.produtosNaoListados.length > 0 && (
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="h6" gutterBottom>
              Produtos Não Listados ({resultado.produtosNaoListados.length})
            </Typography>
            <List>
              {resultado.produtosNaoListados.map((produto, index) => (
                <ListItem key={index}>
                  <ListItemText
                    primary={produto.codigo}
                    sx={{ color: 'error.main' }}
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        )}

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'center' }}>
          <Button
            variant="contained"
            onClick={exportarPDF}
          >
            Exportar PDF
          </Button>
          <Button
            variant="outlined"
            onClick={() => navigate('/')}
          >
            Nova Conferência
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default ResultadosPage; 