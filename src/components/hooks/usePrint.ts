// src/hooks/usePrint.ts
import { useCallback, RefObject } from 'react';

interface PrintOptions {
  title?: string;
  styles?: string;
  onBeforePrint?: () => void;
  onAfterPrint?: () => void;
}

export const usePrint = () => {
  const print = useCallback((contentRef: RefObject<HTMLElement | null>, options: PrintOptions = {}) => {
    const {
      title = 'Document',
      styles = '',
      onBeforePrint,
      onAfterPrint
    } = options;

    if (!contentRef.current) {
      console.error('No content to print');
      return;
    }

    if (onBeforePrint) {
      onBeforePrint();
    }

    const content = contentRef.current.innerHTML;
    const printWindow = window.open('', '_blank');
    
    if (!printWindow) {
      alert('Please allow pop-ups to print the document');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media print {
              body {
                margin: 0;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                color: #000;
                background: white;
                font-size: 12px;
              }
              
              .no-print {
                display: none !important;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
              }
              
              th, td {
                border: 1px solid #ddd;
                padding: 8px 12px;
                text-align: left;
              }
              
              th {
                background-color: #f5f5f5;
                font-weight: bold;
              }
              
              .print-date {
                text-align: right;
                font-size: 11px;
                color: #6b7280;
                margin-bottom: 10px;
              }
              
              ${styles}
            }
            
            @media screen {
              body {
                background: white;
                padding: 20px;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-date">Printed on: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</div>
          ${content}
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
                ${onAfterPrint ? 'if (window.opener && window.opener.onAfterPrint) window.opener.onAfterPrint();' : ''}
              }, 1000);
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  }, []);

  return { print };
};