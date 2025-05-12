import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import HomePage from './pages/HomePage';
import ConferenciaPage from './pages/ConferenciaPage';
import ResultadosPage from './pages/ResultadosPage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/conferencia" element={<ConferenciaPage />} />
          <Route path="/resultados" element={<ResultadosPage />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
