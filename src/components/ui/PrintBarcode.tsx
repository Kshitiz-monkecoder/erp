// components/app/PrintBarcode.tsx
import React, { useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { Printer, Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// Barcode data type
interface BarcodeData {
  barcodeNumber: string;
  mainQuantity: string;
  id: string;
  createdAt: string;
  isActive: boolean;
  grnDocumentNumber?: string;
  itemName?: string;
  itemSku?: string;
  manufacturingDate?: string;
  expiryDate?: string;
  companyName?: string;
}

interface PrintBarcodeProps {
  barcode: BarcodeData;
  isOpen: boolean;
  onClose: () => void;
}

const PrintBarcode: React.FC<PrintBarcodeProps> = ({
  barcode,
  isOpen,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Function to handle print
  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print Barcode - ${barcode.barcodeNumber}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                
                body {
                  font-family: 'Inter', sans-serif;
                  margin: 0;
                  padding: 20px;
                  background: white;
                }
                
                .print-container {
                  max-width: 3.5in;
                  min-height: 2in;
                  margin: 0 auto;
                  padding: 10px;
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  box-shadow: 0 1px 3px rgba(0,0,0,0.1);
                }
                
                .barcode-header {
                  text-align: center;
                  border-bottom: 2px solid #3b82f6;
                  padding-bottom: 5px;
                  margin-bottom: 10px;
                }
                
                .barcode-title {
                  font-size: 16px;
                  font-weight: 700;
                  color: #1f2937;
                  margin: 0;
                }
                
                .barcode-subtitle {
                  font-size: 12px;
                  color: #6b7280;
                  margin: 2px 0;
                }
                
                .barcode-content {
                  text-align: center;
                  padding: 10px 0;
                }
                
                .barcode-number {
                  font-size: 20px;
                  font-weight: 700;
                  color: #111827;
                  letter-spacing: 2px;
                  margin: 8px 0;
                  font-family: 'Courier New', monospace;
                }
                
                .barcode-info {
                  font-size: 11px;
                  color: #374151;
                  line-height: 1.4;
                  margin: 4px 0;
                }
                
                .barcode-label {
                  font-weight: 600;
                  color: #4b5563;
                }
                
                .barcode-grid {
                  display: grid;
                  grid-template-columns: 1fr 1fr;
                  gap: 8px;
                  margin-top: 12px;
                  font-size: 11px;
                }
                
                .footer {
                  text-align: center;
                  font-size: 10px;
                  color: #9ca3af;
                  margin-top: 10px;
                  border-top: 1px dashed #d1d5db;
                  padding-top: 5px;
                }
                
                @media print {
                  body {
                    padding: 0;
                  }
                  
                  .print-container {
                    border: none;
                    box-shadow: none;
                    page-break-inside: avoid;
                  }
                  
                  .no-print {
                    display: none !important;
                  }
                }
                
                /* Barcode styling */
                .barcode-container {
                  margin: 10px auto;
                  padding: 5px;
                  background: white;
                  display: inline-block;
                }
                
                .barcode-stripes {
                  display: flex;
                  height: 50px;
                  align-items: flex-end;
                }
                
                .barcode-stripe {
                  background: black;
                  height: 40px;
                  margin: 0 1px;
                  min-width: 2px;
                }
                
                .thin { width: 2px; }
                .medium { width: 3px; }
                .thick { width: 4px; }
              </style>
            </head>
            <body>
              <div class="print-container">
                <div class="barcode-header">
                  <h2 class="barcode-title">INVENTORY BARCODE</h2>
                  <div class="barcode-subtitle">Stock Tracking System</div>
                </div>
                
                <div class="barcode-content">
                  <div class="barcode-number">${barcode.barcodeNumber}</div>
                  
                  <!-- Simulated barcode -->
                  <div class="barcode-container">
                    <div class="barcode-stripes" id="barcode-stripes"></div>
                  </div>
                  
                  <div class="barcode-info">
                    <div><span class="barcode-label">SKU:</span> ${barcode.itemSku || "N/A"}</div>
                    <div><span class="barcode-label">Item:</span> ${barcode.itemName || "N/A"}</div>
                  </div>
                  
                  <div class="barcode-grid">
                    <div><span class="barcode-label">Qty:</span> ${barcode.mainQuantity}</div>
                    <div><span class="barcode-label">GRN:</span> ${barcode.grnDocumentNumber || "N/A"}</div>
                    <div><span class="barcode-label">MFG:</span> ${barcode.manufacturingDate ? new Date(barcode.manufacturingDate).toLocaleDateString() : "N/A"}</div>
                    <div><span class="barcode-label">EXP:</span> ${barcode.expiryDate ? new Date(barcode.expiryDate).toLocaleDateString() : "N/A"}</div>
                  </div>
                </div>
                
                <div class="footer">
                  Generated on ${new Date().toLocaleDateString()} | ${barcode.companyName || "Inventory System"}
                </div>
              </div>
              
              <script>
                // Generate barcode stripes based on barcode number
                function generateBarcodeStrips(barcodeNumber) {
                  const container = document.getElementById('barcode-stripes');
                  container.innerHTML = '';
                  
                  // Convert barcode to binary-like pattern
                  let pattern = '';
                  for(let i = 0; i < barcodeNumber.length; i++) {
                    const charCode = barcodeNumber.charCodeAt(i);
                    pattern += charCode.toString(2).padStart(8, '0');
                  }
                  
                  // Create stripes based on pattern
                  for(let i = 0; i < pattern.length; i++) {
                    const stripe = document.createElement('div');
                    stripe.className = 'barcode-stripe';
                    
                    if (pattern[i] === '1') {
                      stripe.classList.add('thick');
                      stripe.style.height = '40px';
                    } else {
                      stripe.classList.add('thin');
                      stripe.style.height = '30px';
                    }
                    
                    // Alternate heights for visual effect
                    if (i % 3 === 0) {
                      stripe.style.height = '35px';
                    } else if (i % 5 === 0) {
                      stripe.style.height = '45px';
                    }
                    
                    container.appendChild(stripe);
                  }
                }
                
                // Generate barcode on load
                generateBarcodeStrips("${barcode.barcodeNumber}");
                
                // Auto print after a short delay
                setTimeout(() => {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
                }, 500);
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();
      }
    }
  };

  // Function to download as PDF (simplified version)
  const handleDownload = () => {
    if (printRef.current) {
      // Create printable content
      const content = `
        Barcode: ${barcode.barcodeNumber}
        GRN Document: ${barcode.grnDocumentNumber || "N/A"}
        Item: ${barcode.itemName || "N/A"} (${barcode.itemSku || "N/A"})
        Quantity: ${barcode.mainQuantity}
        Manufacturing Date: ${barcode.manufacturingDate || "N/A"}
        Expiry Date: ${barcode.expiryDate || "N/A"}
        Status: ${barcode.isActive ? "Active" : "Inactive"}
        Generated: ${new Date().toLocaleDateString()}
      `;

      // Create blob and download
      const blob = new Blob([content], { type: "text/plain" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `barcode_${barcode.barcodeNumber}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Auto-print when dialog opens (optional)
  useEffect(() => {
    if (isOpen) {
      // You can enable auto-print if desired
      // handlePrint();
    }
  }, [isOpen]);

  return ReactDOM.createPortal(
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print Barcode
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div
            ref={printRef}
            className="bg-white p-6 rounded-lg border shadow-sm"
          >
            {/* Barcode Preview */}
            <div className="text-center">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  INVENTORY BARCODE
                </h3>
                <p className="text-sm text-gray-500">Stock Tracking System</p>
              </div>

              <div className="my-6">
                <div className="text-2xl font-bold text-gray-900 font-mono tracking-wider">
                  {barcode.barcodeNumber}
                </div>
                
                {/* Barcode visual representation */}
                <div className="my-4 mx-auto w-full max-w-xs">
                  <div className="flex justify-center items-end h-16">
                    {barcode.barcodeNumber.split("").map((_char, index) => (
                      <div
                        key={index}
                        className={`bg-black mx-[1px] ${
                          index % 3 === 0
                            ? "h-12"
                            : index % 2 === 0
                            ? "h-14"
                            : "h-10"
                        } ${index % 5 === 0 ? "w-[3px]" : "w-[2px]"}`}
                      />
                    ))}
                  </div>
                  <div className="h-0.5 bg-black mt-1"></div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-left text-sm">
                <div>
                  <span className="font-medium text-gray-700">SKU:</span>
                  <span className="ml-2 text-gray-900">
                    {barcode.itemSku || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Item:</span>
                  <span className="ml-2 text-gray-900">
                    {barcode.itemName || "N/A"}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Quantity:</span>
                  <span className="ml-2 text-gray-900">
                    {barcode.mainQuantity}
                  </span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">GRN:</span>
                  <span className="ml-2 text-gray-900">
                    {barcode.grnDocumentNumber || "N/A"}
                  </span>
                </div>
                {barcode.manufacturingDate && (
                  <div>
                    <span className="font-medium text-gray-700">MFG Date:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(barcode.manufacturingDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {barcode.expiryDate && (
                  <div>
                    <span className="font-medium text-gray-700">EXP Date:</span>
                    <span className="ml-2 text-gray-900">
                      {new Date(barcode.expiryDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t text-xs text-gray-500">
                <p>Generated on {new Date().toLocaleDateString()}</p>
                <p>{barcode.companyName || "Inventory System"}</p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} className="no-print">
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button
            variant="outline"
            onClick={handleDownload}
            className="no-print"
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button onClick={handlePrint} className="no-print">
            <Printer className="h-4 w-4 mr-2" />
            Print Barcode
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>,
    document.body
  );
};

export default PrintBarcode;