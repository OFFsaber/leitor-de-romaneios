# Leitor de Romaneios

Aplicação web para conferência de produtos através de leitura de códigos de barras, comparando com romaneios de fornecedores.

## Funcionalidades

- Upload de romaneios em formato TXT ou CSV
- Leitura de códigos de barras usando a câmera do dispositivo
- Conferência em tempo real dos produtos
- Identificação de produtos não listados
- Geração de relatório em PDF com os resultados

## Como usar

1. Acesse a aplicação através do GitHub Pages
2. Clique em "Iniciar Conferência"
3. Faça upload do arquivo de romaneio
4. Permita o acesso à câmera do dispositivo
5. Aponte a câmera para os códigos de barras dos produtos
6. Acompanhe a conferência em tempo real
7. Ao finalizar, exporte o relatório em PDF

## Desenvolvimento local

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Gerar build para produção
npm run build
```

## Tecnologias utilizadas

- React
- TypeScript
- Vite
- Material-UI
- HTML5-QRCode
- jsPDF
