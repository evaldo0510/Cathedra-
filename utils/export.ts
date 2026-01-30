
import { SavedItem } from '../types';

interface PDFOptions {
  title: string;
  content: string;
  mode: 'study' | 'prayer';
  metadata?: any;
}

/**
 * Gera a estrutura de dados para exportação em PDF.
 * O layout muda de acordo com o modo: 'study' foca em estrutura, 'contemplative' em beleza.
 */
export function generatePDF({ title, content, mode, metadata }: PDFOptions) {
  // Simulação de geração de PDF. Em um ambiente real, aqui integraríamos com jsPDF ou similar.
  // Retornamos o objeto de configuração do layout conforme especificação.
  const layout = mode === "prayer" ? "contemplative" : "study";
  
  console.log(`[Export] Gerando PDF no layout: ${layout}`);
  
  return {
    title,
    layout,
    content,
    timestamp: new Date().toISOString(),
    institution: "Cathedra Digital Sanctuarium",
    watermark: "Ad Maiorem Dei Gloriam",
    metadata
  };
}

export const downloadPDF = (config: ReturnType<typeof generatePDF>) => {
  // Lógica para disparar o download real do PDF (ex: abrir nova aba com visualização de impressão)
  const printWindow = window.open('', '_blank');
  if (printWindow) {
    const isContemplative = config.layout === 'contemplative';
    printWindow.document.write(`
      <html>
        <head>
          <title>${config.title}</title>
          <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,400&family=Inter:wght@400;700&display=swap" rel="stylesheet">
          <style>
            body { font-family: 'Inter', sans-serif; padding: 50px; color: #1a1a1a; line-height: 1.6; }
            h1 { font-family: 'Playfair Display', serif; font-size: 32px; border-bottom: 2px solid #d4af37; padding-bottom: 10px; }
            .content { font-family: 'Playfair Display', serif; font-size: 20px; font-style: ${isContemplative ? 'italic' : 'normal'}; margin-top: 30px; text-align: justify; }
            .footer { margin-top: 50px; font-size: 10px; text-transform: uppercase; letter-spacing: 2px; color: #666; text-align: center; border-top: 1px solid #eee; pt: 20px; }
          </style>
        </head>
        <body>
          <h1>${config.title}</h1>
          <div class="content">${config.content}</div>
          <div class="footer">
            ${config.institution} • ${config.watermark}<br>
            Exportado em ${new Date(config.timestamp).toLocaleDateString()}
          </div>
          <script>window.onload = () => { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }
};
