import React from 'react';
import { Box, Button, Container, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import QrCodeScannerIcon from '@mui/icons-material/QrCodeScanner';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <Typography variant="h3" component="h1" align="center" gutterBottom>
          Leitor de Romaneios
        </Typography>
        
        <Typography variant="body1" align="center" color="text.secondary" paragraph>
          Sistema de conferência de produtos através de leitura de códigos de barras
        </Typography>

        <Button
          variant="contained"
          size="large"
          startIcon={<QrCodeScannerIcon />}
          onClick={() => navigate('/conferencia')}
          sx={{ fontSize: '1.2rem', padding: '12px 24px' }}
        >
          Iniciar Conferência
        </Button>
      </Box>
    </Container>
  );
};

export default HomePage; 