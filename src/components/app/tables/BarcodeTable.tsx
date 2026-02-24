import React, { useState, useEffect, useRef } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowData,
  useReactTable,
} from "@tanstack/react-table";
import { Download, List, Printer, X } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../../ui/button";
import SelectFilter, { OptionType } from "../SelectFilter";
import MultiSelectWithSearch from "../MultiSelectWithSearch";
import TablePagenation from "../TablePagenation";
import { get } from "@/lib/apiService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import * as XLSX from "xlsx";
import ReactDOM from "react-dom";

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

// Define types for the API response
type ApiBarcodeItem = {
  id?: number | string;
  barcodeNumber?: string;
  mainQuantity?: string;
  createdAt?: string;
  updatedAt?: string;
  isActive?: boolean;
  info?: string | null;
  comment?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  grn?: {
    id?: number | string;
    documentNumber?: string;
    supplier?: {
      companyName?: string;
      name?: string;
    };
    warehouse?: {
      name?: string;
    };
  };
  item?: {
    id?: number | string;
    name?: string;
    sku?: string;
  };
  createdBy?: {
    name?: string;
  };
  company?: {
    name?: string;
  };
};

type BarcodeItem = {
  id: string;
  barcodeNumber: string;
  approvalNumber: string;
  toStore: string;
  itemId: string;
  itemName: string;
  quantityIn: number;
  quantityOut: number;
  quantityConsumed: number;
  balanceQuantity: number;
  returnQuantity: number;
  createdBy: string;
  creationDate: string;
  manufacturingDate: string;
  expiryDate: string;
  info1: string;
  info2: string;
  fromStore: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  status: string;
  grnDocumentNumber: string;
  itemSku: string;
  mainQuantity: string;
  companyName: string;
  // New fields for grouping
  grnId: string;
  totalBarcodes: number;
  allBarcodes: Array<{
    barcodeNumber: string;
    mainQuantity: string;
    id: string;
    createdAt: string;
    isActive: boolean;
    grnDocumentNumber?: string;
    itemName?: string;
    itemSku?: string;
    manufacturingDate?: string | null;
    expiryDate?: string | null;
    companyName?: string;
  }>;
};

// Barcode data type for printing
interface BarcodeData {
  barcodeNumber: string;
  mainQuantity: string;
  id: string;
  createdAt: string;
  isActive: boolean;
  grnDocumentNumber?: string;
  itemName?: string;
  itemSku?: string;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  companyName?: string;
}

// Print Barcode Component
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

  if (!isOpen) return null;

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

// Print All Barcodes Component
interface PrintAllBarcodesProps {
  barcodes: BarcodeData[];
  grnDocumentNumber: string;
  itemName: string;
  itemSku: string;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
}

const PrintAllBarcodes: React.FC<PrintAllBarcodesProps> = ({
  barcodes,
  grnDocumentNumber,
  itemName,
  itemSku,
  companyName,
  isOpen,
  onClose,
}) => {
  const printRef = useRef<HTMLDivElement>(null);

  // Function to handle print all barcodes
  const handlePrint = () => {
    if (printRef.current) {
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        // Calculate total quantity
        const totalQuantity = barcodes.reduce(
          (sum, barcode) => sum + parseFloat(barcode.mainQuantity || "0"),
          0
        );

        printWindow.document.write(`
          <!DOCTYPE html>
          <html>
            <head>
              <title>Print All Barcodes - ${grnDocumentNumber}</title>
              <style>
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
                
                body {
                  font-family: 'Inter', sans-serif;
                  margin: 0;
                  padding: 20px;
                  background: white;
                }
                
                .page-header {
                  text-align: center;
                  margin-bottom: 20px;
                  padding-bottom: 10px;
                  border-bottom: 3px solid #3b82f6;
                }
                
                .page-title {
                  font-size: 24px;
                  font-weight: 700;
                  color: #1f2937;
                  margin: 0 0 5px 0;
                }
                
                .page-subtitle {
                  font-size: 14px;
                  color: #6b7280;
                  margin: 0;
                }
                
                .summary-info {
                  display: grid;
                  grid-template-columns: repeat(4, 1fr);
                  gap: 10px;
                  margin-bottom: 20px;
                  padding: 15px;
                  background: #f9fafb;
                  border-radius: 8px;
                  font-size: 12px;
                }
                
                .summary-item {
                  text-align: center;
                }
                
                .summary-label {
                  font-weight: 600;
                  color: #4b5563;
                  display: block;
                }
                
                .summary-value {
                  color: #111827;
                  font-weight: 500;
                }
                
                .barcodes-grid {
                  display: grid;
                  grid-template-columns: repeat(2, 1fr);
                  gap: 15px;
                  margin-top: 20px;
                }
                
                @media print {
                  body {
                    padding: 10px;
                  }
                  
                  .barcode-card {
                    page-break-inside: avoid;
                  }
                  
                  .no-print {
                    display: none !important;
                  }
                }
                
                @media print and (orientation: landscape) {
                  .barcodes-grid {
                    grid-template-columns: repeat(3, 1fr);
                  }
                }
                
                .barcode-card {
                  border: 1px solid #e5e7eb;
                  border-radius: 8px;
                  padding: 10px;
                  background: white;
                  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
                }
                
                .barcode-header {
                  text-align: center;
                  padding-bottom: 5px;
                  margin-bottom: 8px;
                  border-bottom: 1px solid #e5e7eb;
                }
                
                .barcode-title {
                  font-size: 12px;
                  font-weight: 600;
                  color: #1f2937;
                  margin: 0;
                }
                
                .barcode-number {
                  font-size: 14px;
                  font-weight: 700;
                  color: #111827;
                  letter-spacing: 1px;
                  margin: 5px 0;
                  font-family: 'Courier New', monospace;
                  text-align: center;
                }
                
                .barcode-stripes {
                  display: flex;
                  height: 30px;
                  align-items: flex-end;
                  justify-content: center;
                  margin: 5px 0;
                }
                
                .barcode-stripe {
                  background: black;
                  height: 25px;
                  margin: 0 1px;
                  min-width: 1px;
                }
                
                .barcode-info {
                  font-size: 9px;
                  color: #374151;
                  line-height: 1.3;
                }
                
                .barcode-label {
                  font-weight: 600;
                  color: #4b5563;
                }
                
                .footer {
                  text-align: center;
                  font-size: 10px;
                  color: #9ca3af;
                  margin-top: 20px;
                  padding-top: 10px;
                  border-top: 1px dashed #d1d5db;
                }
              </style>
            </head>
            <body>
              <div class="page-header">
                <h1 class="page-title">Barcode Labels - ${grnDocumentNumber}</h1>
                <p class="page-subtitle">Total: ${barcodes.length} barcodes | ${itemName} (${itemSku})</p>
              </div>
              
              <div class="summary-info">
                <div class="summary-item">
                  <span class="summary-label">GRN Document</span>
                  <span class="summary-value">${grnDocumentNumber}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Item</span>
                  <span class="summary-value">${itemName}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Total Barcodes</span>
                  <span class="summary-value">${barcodes.length}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Total Quantity</span>
                  <span class="summary-value">${totalQuantity.toFixed(2)}</span>
                </div>
              </div>
              
              <div class="barcodes-grid">
                ${barcodes.map(barcode => `
                  <div class="barcode-card">
                    <div class="barcode-header">
                      <div class="barcode-title">INVENTORY BARCODE</div>
                    </div>
                    
                    <div class="barcode-number">${barcode.barcodeNumber}</div>
                    
                    <div class="barcode-stripes" id="barcode-stripes-${barcode.id}"></div>
                    
                    <div class="barcode-info">
                      <div><span class="barcode-label">SKU:</span> ${itemSku}</div>
                      <div><span class="barcode-label">Qty:</span> ${barcode.mainQuantity}</div>
                      <div><span class="barcode-label">GRN:</span> ${grnDocumentNumber}</div>
                      ${barcode.manufacturingDate ? `<div><span class="barcode-label">MFG:</span> ${new Date(barcode.manufacturingDate).toLocaleDateString()}</div>` : ''}
                      ${barcode.expiryDate ? `<div><span class="barcode-label">EXP:</span> ${new Date(barcode.expiryDate).toLocaleDateString()}</div>` : ''}
                    </div>
                  </div>
                `).join('')}
              </div>
              
              <div class="footer">
                Generated on ${new Date().toLocaleDateString()} | ${companyName || "Inventory System"}
              </div>
              
              <script>
                // Generate barcode stripes for each barcode
                function generateBarcodeStrips(barcodeNumber, elementId) {
                  const container = document.getElementById(elementId);
                  if (!container) return;
                  
                  container.innerHTML = '';
                  
                  // Convert barcode to binary-like pattern
                  let pattern = '';
                  for(let i = 0; i < barcodeNumber.length; i++) {
                    const charCode = barcodeNumber.charCodeAt(i);
                    pattern += charCode.toString(2).padStart(8, '0');
                  }
                  
                  // Take first 20 characters for display
                  pattern = pattern.substring(0, 20);
                  
                  // Create stripes based on pattern
                  for(let i = 0; i < pattern.length; i++) {
                    const stripe = document.createElement('div');
                    stripe.className = 'barcode-stripe';
                    stripe.style.width = pattern[i] === '1' ? '2px' : '1px';
                    stripe.style.height = (20 + (i % 10)) + 'px';
                    container.appendChild(stripe);
                  }
                }
                
                // Generate barcodes for all items
                ${barcodes.map(barcode => `
                  generateBarcodeStrips("${barcode.barcodeNumber}", "barcode-stripes-${barcode.id}");
                `).join('')}
                
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

  // Function to download all barcodes
  const handleDownload = () => {
    const content = barcodes.map(barcode => `
      Barcode: ${barcode.barcodeNumber}
      Quantity: ${barcode.mainQuantity}
      GRN: ${grnDocumentNumber}
      Item: ${itemName} (${itemSku})
      Manufacturing Date: ${barcode.manufacturingDate || "N/A"}
      Expiry Date: ${barcode.expiryDate || "N/A"}
      Status: ${barcode.isActive ? "Active" : "Inactive"}
      ---
    `).join('\n');

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `barcodes_${grnDocumentNumber}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return ReactDOM.createPortal(
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Printer className="h-5 w-5" />
            Print All Barcodes - {grnDocumentNumber}
          </DialogTitle>
        </DialogHeader>

        <div className="py-4">
          <div
            ref={printRef}
            className="bg-white p-6 rounded-lg border shadow-sm"
          >
            {/* Preview Header */}
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                Barcode Labels - {grnDocumentNumber}
              </h3>
              <p className="text-sm text-gray-500">
                Total: {barcodes.length} barcodes | {itemName} ({itemSku})
              </p>
            </div>

            {/* Summary Info */}
            <div className="grid grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700">GRN Document</div>
                <div className="text-lg font-semibold text-gray-900">{grnDocumentNumber}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700">Item</div>
                <div className="text-lg font-semibold text-gray-900">{itemName}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700">Total Barcodes</div>
                <div className="text-lg font-semibold text-gray-900">{barcodes.length}</div>
              </div>
              <div className="text-center">
                <div className="text-sm font-medium text-gray-700">Total Quantity</div>
                <div className="text-lg font-semibold text-gray-900">
                  {barcodes.reduce((sum, barcode) => sum + parseFloat(barcode.mainQuantity || "0"), 0).toFixed(2)}
                </div>
              </div>
            </div>

            {/* Barcodes Grid Preview */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-h-[400px] overflow-y-auto p-2">
              {barcodes.map((barcode) => (
                <div key={barcode.id} className="border rounded-lg p-3 bg-white shadow-sm">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-gray-900 mb-1">
                      INVENTORY BARCODE
                    </div>
                    <div className="text-sm font-bold text-gray-900 font-mono mb-2">
                      {barcode.barcodeNumber}
                    </div>
                    
                    {/* Barcode visual */}
                    <div className="flex justify-center items-end h-12 mb-2">
                      {barcode.barcodeNumber.split("").slice(0, 10).map((_char, index) => (
                        <div
                          key={index}
                          className={`bg-black mx-[0.5px] ${
                            index % 3 === 0
                              ? "h-8"
                              : index % 2 === 0
                              ? "h-10"
                              : "h-6"
                          } ${index % 5 === 0 ? "w-[1.5px]" : "w-[1px]"}`}
                        />
                      ))}
                    </div>
                    
                    <div className="text-[10px] space-y-1">
                      <div>
                        <span className="font-medium">Qty:</span> {barcode.mainQuantity}
                      </div>
                      <div>
                        <span className="font-medium">GRN:</span> {grnDocumentNumber}
                      </div>
                      {barcode.manufacturingDate && (
                        <div>
                          <span className="font-medium">MFG:</span>{" "}
                          {new Date(barcode.manufacturingDate).toLocaleDateString()}
                        </div>
                      )}
                      {barcode.expiryDate && (
                        <div>
                          <span className="font-medium">EXP:</span>{" "}
                          {new Date(barcode.expiryDate).toLocaleDateString()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 pt-4 border-t text-xs text-gray-500 text-center">
              <p>Generated on {new Date().toLocaleDateString()}</p>
              <p>{companyName || "Inventory System"}</p>
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
            Download List
          </Button>
          <Button onClick={handlePrint} className="no-print">
            <Printer className="h-4 w-4 mr-2" />
            Print All Barcodes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>,
    document.body
  );
};

// Dialog component to show all barcodes for a GRN
const AllBarcodesDialog: React.FC<{
  grnId: string;
  grnDocumentNumber: string;
  barcodes: Array<{
    barcodeNumber: string;
    mainQuantity: string;
    id: string;
    createdAt: string;
    isActive: boolean;
    grnDocumentNumber?: string;
    itemName?: string;
    itemSku?: string;
    manufacturingDate?: string | null;
    expiryDate?: string | null;
    companyName?: string;
  }>;
  onPrintBarcode: (barcode: any) => void;
  onPrintAllBarcodes: (barcodes: any[], grnDocumentNumber: string, itemName: string, itemSku: string, companyName: string) => void;
  itemName: string;
  itemSku: string;
  companyName: string;
}> = ({ grnDocumentNumber, barcodes, onPrintBarcode, onPrintAllBarcodes, itemName, itemSku, companyName }) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <List className="h-3 w-3 mr-1" />
          See All Barcodes ({barcodes.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>
              All Barcodes for GRN: {grnDocumentNumber}
            </DialogTitle>
            <Button
              variant="default"
              size="sm"
              onClick={() => onPrintAllBarcodes(barcodes, grnDocumentNumber, itemName, itemSku, companyName)}
            >
              <Printer className="h-3 w-3 mr-1" />
              Print All ({barcodes.length})
            </Button>
          </div>
        </DialogHeader>
        <div className="mt-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Barcode Number</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {barcodes.map((barcode) => (
                <TableRow key={barcode.id}>
                  <TableCell>
                    <span className="bg-blue-50 px-2 py-1 rounded text-sm font-mono">
                      {barcode.barcodeNumber}
                    </span>
                  </TableCell>
                  <TableCell>{barcode.mainQuantity}</TableCell>
                  <TableCell>
                    {new Date(barcode.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`px-2 py-1 text-xs rounded-full ${
                        barcode.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {barcode.isActive ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPrintBarcode({...barcode, grnDocumentNumber})}
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Print
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const columns = (
  handlePrintBarcode: (barcode: any, grnDocumentNumber?: string) => void,
  handlePrintAllBarcodes: (barcodes: any[], grnDocumentNumber: string, itemName: string, itemSku: string, companyName: string) => void
): ColumnDef<BarcodeItem>[] => [
  {
    header: "GRN Document",
    accessorKey: "grnDocumentNumber",
    cell: ({ row }) => (
      <div className="font-normal min-w-32 text-blue-600">
        {row.getValue("grnDocumentNumber")}
      </div>
    ),
  },
  {
    header: "Barcodes",
    id: "barcodes",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        <div className="flex items-center gap-2">
          <span className="bg-blue-50 px-2 py-1 rounded text-sm font-mono">
            {row.original.barcodeNumber}
          </span>
          <span className="text-xs text-gray-500">
            + {row.original.totalBarcodes - 1} more
          </span>
        </div>
        <div className="mt-1 flex gap-2">
          <AllBarcodesDialog
            grnId={row.original.grnId}
            grnDocumentNumber={row.original.grnDocumentNumber}
            barcodes={row.original.allBarcodes}
            onPrintBarcode={(barcode) => handlePrintBarcode(barcode, row.original.grnDocumentNumber)}
            onPrintAllBarcodes={handlePrintAllBarcodes}
            itemName={row.original.itemName}
            itemSku={row.original.itemSku}
            companyName={row.original.companyName}
          />
          {/* <Button
            variant="outline"
            size="sm"
            onClick={() => handlePrintAllBarcodes(
              row.original.allBarcodes,
              row.original.grnDocumentNumber,
              row.original.itemName,
              row.original.itemSku,
              row.original.companyName
            )}
          >
            <Printer className="h-3 w-3 mr-1" />
            Print All
          </Button> */}
        </div>
      </div>
    ),
  },
  {
    header: "Item SKU",
    accessorKey: "itemSku",
    cell: ({ row }) => (
      <div className="font-normal min-w-32 font-mono text-sm">
        {row.getValue("itemSku")}
      </div>
    ),
  },
  {
    header: "Item Name",
    accessorKey: "itemName",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("itemName")}</div>
    ),
  },
  {
    header: "Total Quantity",
    id: "totalQuantity",
    cell: ({ row }) => {
      const totalQuantity = row.original.allBarcodes.reduce(
        (sum, barcode) => sum + parseFloat(barcode.mainQuantity || "0"),
        0
      );
      return (
        <div className="font-normal min-w-32 font-medium">
          {totalQuantity.toFixed(2)}
        </div>
      );
    },
  },
  {
    header: "Manufacturing Date",
    accessorKey: "manufacturingDate",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        {row.getValue("manufacturingDate") || "N/A"}
      </div>
    ),
  },
  {
    header: "Expiry Date",
    accessorKey: "expiryDate",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">
        {row.getValue("expiryDate") || "N/A"}
      </div>
    ),
  },
  {
    header: "Company",
    accessorKey: "companyName",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("companyName")}</div>
    ),
  },
  {
    header: "Created By",
    accessorKey: "createdBy",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("createdBy")}</div>
    ),
  },
  {
    header: "Creation Date",
    accessorKey: "creationDate",
    cell: ({ row }) => (
      <div className="font-normal min-w-32">{row.getValue("creationDate")}</div>
    ),
  },
  {
    header: "Status",
    accessorKey: "status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <span
          className={`px-2 py-1 text-xs rounded-full ${
            status === "Active"
              ? "bg-green-100 text-green-800"
              : status === "Inactive"
              ? "bg-red-100 text-red-800"
              : "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </span>
      );
    },
  },
  {
    header: "Actions",
    id: "actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePrintAllBarcodes(
            row.original.allBarcodes,
            row.original.grnDocumentNumber,
            row.original.itemName,
            row.original.itemSku,
            row.original.companyName
          )}
        >
          <Printer className="h-3 w-3 mr-1" />
          Print All
        </Button>
      </div>
    ),
  },
];

// Function to group barcodes by GRN ID with proper typing
const groupBarcodesByGRN = (barcodeData: ApiBarcodeItem[]): BarcodeItem[] => {
  const groupedByGRN: Record<string, BarcodeItem> = {};
  
  barcodeData.forEach((current) => {
    const grnId = current.grn?.id?.toString() || "unknown";
    
    if (!groupedByGRN[grnId]) {
      // Create new group for this GRN with proper typing
      const newGroup: BarcodeItem = {
        id: grnId,
        barcodeNumber: current.barcodeNumber || "",
        approvalNumber: current.grn?.documentNumber || "",
        toStore: current.grn?.supplier?.companyName || "",
        itemId: current.item?.id?.toString() || "",
        itemName: current.item?.name || "",
        quantityIn: 0,
        quantityOut: 0,
        quantityConsumed: 0,
        balanceQuantity: 0,
        returnQuantity: 0,
        createdBy: current.createdBy?.name || "System",
        creationDate: new Date(current.createdAt || Date.now()).toLocaleDateString(),
        manufacturingDate: current.manufacturingDate || "",
        expiryDate: current.expiryDate || "",
        info1: current.info || "",
        info2: current.comment || "",
        fromStore: current.grn?.warehouse?.name || "",
        lastModifiedBy: current.createdBy?.name || "System",
        lastModifiedDate: new Date(current.updatedAt || Date.now()).toLocaleDateString(),
        status: current.isActive ? "Active" : "Inactive",
        grnDocumentNumber: current.grn?.documentNumber || "",
        itemSku: current.item?.sku || "",
        mainQuantity: current.mainQuantity || "0",
        companyName: current.grn?.supplier?.companyName || "",
        grnId: grnId,
        totalBarcodes: 0,
        allBarcodes: []
      };
      
      groupedByGRN[grnId] = newGroup;
    }
    
    // Add this barcode to the group
    groupedByGRN[grnId].allBarcodes.push({
      barcodeNumber: current.barcodeNumber || "",
      mainQuantity: current.mainQuantity || "0",
      id: current.id?.toString() || "",
      createdAt: current.createdAt || "",
      isActive: current.isActive || false,
      grnDocumentNumber: current.grn?.documentNumber,
      itemName: current.item?.name,
      itemSku: current.item?.sku,
      manufacturingDate: current.manufacturingDate || null,
      expiryDate: current.expiryDate || null,
      companyName: current.grn?.supplier?.companyName
    });
  });
  
  // Convert to array and set totalBarcodes count
  return Object.values(groupedByGRN).map(group => ({
    ...group,
    totalBarcodes: group.allBarcodes.length,
    // Use the first barcode number as the display barcode
    barcodeNumber: group.allBarcodes[0]?.barcodeNumber || ""
  }));
};

// Function to export all barcodes to Excel
const exportBarcodesToExcel = (barcodeData: BarcodeItem[]) => {
  try {
    // Flatten all barcodes from grouped data
    const allBarcodes: any[] = [];
    
    barcodeData.forEach(group => {
      group.allBarcodes.forEach(barcode => {
        allBarcodes.push({
          'GRN Document Number': group.grnDocumentNumber,
          'Barcode Number': barcode.barcodeNumber,
          'Item SKU': group.itemSku,
          'Item Name': group.itemName,
          'Quantity': barcode.mainQuantity,
          'Manufacturing Date': group.manufacturingDate || 'N/A',
          'Expiry Date': group.expiryDate || 'N/A',
          'Company': group.companyName,
          'Created By': group.createdBy,
          'Creation Date': group.creationDate,
          'Status': group.status,
          'GRN ID': group.grnId,
          'Barcode ID': barcode.id,
          'Created At': new Date(barcode.createdAt).toLocaleDateString(),
          'Barcode Status': barcode.isActive ? 'Active' : 'Inactive'
        });
      });
    });
    
    if (allBarcodes.length === 0) {
      alert('No barcodes to export');
      return;
    }
    
    // Create worksheet
    const worksheet = XLSX.utils.json_to_sheet(allBarcodes);
    
    // Create workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Barcodes');
    
    // Generate Excel file
    const fileName = `Barcodes_Export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
    
    console.log(`Exported ${allBarcodes.length} barcodes to ${fileName}`);
  } catch (error) {
    console.error('Error exporting barcodes:', error);
    alert('Error exporting barcodes. Please try again.');
  }
};

const BarcodeTable: React.FC = () => {
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [barcodes, setBarcodes] = useState<BarcodeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rawBarcodeData, setRawBarcodeData] = useState<ApiBarcodeItem[]>([]);
  const [selectedBarcode, setSelectedBarcode] = useState<BarcodeData | null>(null);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [selectedAllBarcodes, setSelectedAllBarcodes] = useState<BarcodeData[]>([]);
  const [showPrintAllDialog, setShowPrintAllDialog] = useState(false);
  const [selectedAllBarcodeInfo, setSelectedAllBarcodeInfo] = useState<{
    grnDocumentNumber: string;
    itemName: string;
    itemSku: string;
    companyName: string;
  }>({
    grnDocumentNumber: '',
    itemName: '',
    itemSku: '',
    companyName: ''
  });

  // Handle printing single barcode
  const handlePrintBarcode = (barcodeData: any, grnDocumentNumber?: string) => {
    // Find the corresponding grouped barcode for additional info
    const groupedBarcode = barcodes.find(b => 
      b.allBarcodes.some(bc => bc.id === barcodeData.id)
    );
    
    // Prepare barcode data with all necessary information
    const barcodeToPrint: BarcodeData = {
      barcodeNumber: barcodeData.barcodeNumber,
      mainQuantity: barcodeData.mainQuantity,
      id: barcodeData.id,
      createdAt: barcodeData.createdAt,
      isActive: barcodeData.isActive,
      grnDocumentNumber: grnDocumentNumber || groupedBarcode?.grnDocumentNumber || barcodeData.grnDocumentNumber,
      itemName: groupedBarcode?.itemName || barcodeData.itemName,
      itemSku: groupedBarcode?.itemSku || barcodeData.itemSku,
      manufacturingDate: groupedBarcode?.manufacturingDate || barcodeData.manufacturingDate || null,
      expiryDate: groupedBarcode?.expiryDate || barcodeData.expiryDate || null,
      companyName: groupedBarcode?.companyName || barcodeData.companyName,
    };
    
    setSelectedBarcode(barcodeToPrint);
    setShowPrintDialog(true);
  };

  // Handle printing all barcodes for a GRN
  const handlePrintAllBarcodes = (
    barcodes: BarcodeData[], 
    grnDocumentNumber: string, 
    itemName: string, 
    itemSku: string, 
    companyName: string
  ) => {
    setSelectedAllBarcodes(barcodes);
    setSelectedAllBarcodeInfo({
      grnDocumentNumber,
      itemName,
      itemSku,
      companyName
    });
    setShowPrintAllDialog(true);
  };

  // Fetch barcodes from API
  useEffect(() => {
    const fetchBarcodes = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch all barcodes - adjust API endpoint as needed
        const response = await get("/inventory/grn/barcodes/list");
        
        let apiData: ApiBarcodeItem[] = [];
        
        if (response?.data?.data) {
          // Group barcodes by GRN ID
          apiData = response.data.data;
          const groupedBarcodes = groupBarcodesByGRN(apiData);
          setBarcodes(groupedBarcodes);
          setRawBarcodeData(apiData);
        } else if (response?.data) {
          // If data is not nested under .data property
          apiData = response.data;
          const groupedBarcodes = groupBarcodesByGRN(apiData);
          setBarcodes(groupedBarcodes);
          setRawBarcodeData(apiData);
        } else {
          // Use mock data if API doesn't return data
          const mockData = transformMockData();
          setBarcodes(mockData);
          setRawBarcodeData(transformMockDataToRaw());
        }
      } catch (err) {
        console.error("Error fetching barcodes:", err);
        setError("Failed to load barcodes");
        // Fallback to mock data
        const mockData = transformMockData();
        setBarcodes(mockData);
        setRawBarcodeData(transformMockDataToRaw());
      } finally {
        setLoading(false);
      }
    };

    fetchBarcodes();
  }, []);

  // Transform the barcode response you provided into table format
  const transformMockData = (): BarcodeItem[] => {
    // Mock data based on your response structure
    const barcodeData: ApiBarcodeItem[] = [
      {
        id: 1,
        barcodeNumber: "Bill001",
        grn: { 
          id: 23,
          documentNumber: "DOC-0089",
          supplier: { companyName: "xyz", name: "Test" },
          warehouse: { name: "test" }
        },
        item: { id: 23, name: "testt", sku: "d6fe9b85-6704-495e-80ef-39ed6b5f723d" },
        createdBy: { name: "Shalini Maurya" },
        createdAt: "2025-12-01T11:18:46.578Z",
        manufacturingDate: null,
        expiryDate: null,
        info: null,
        comment: null,
        isActive: true,
        mainQuantity: "11.00",
        updatedAt: "2025-12-01T11:18:46.578Z"
      },
      {
        id: 2,
        barcodeNumber: "Bill002",
        grn: { 
          id: 23,
          documentNumber: "DOC-0089",
          supplier: { companyName: "xyz", name: "Test" },
          warehouse: { name: "test" }
        },
        item: { id: 23, name: "testt", sku: "d6fe9b85-6704-495e-80ef-39ed6b5f723d" },
        createdBy: { name: "Shalini Maurya" },
        createdAt: "2025-12-01T11:18:46.578Z",
        manufacturingDate: null,
        expiryDate: null,
        info: null,
        comment: null,
        isActive: true,
        mainQuantity: "1.00",
        updatedAt: "2025-12-01T11:18:46.578Z"
      },
      // Add more items as needed...
      {
        id: 3,
        barcodeNumber: "Bill003",
        grn: { 
          id: 23,
          documentNumber: "DOC-0089",
          supplier: { companyName: "xyz", name: "Test" },
          warehouse: { name: "test" }
        },
        item: { id: 23, name: "testt", sku: "d6fe9b85-6704-495e-80ef-39ed6b5f723d" },
        createdBy: { name: "Shalini Maurya" },
        createdAt: "2025-12-01T11:18:46.578Z",
        manufacturingDate: null,
        expiryDate: null,
        info: null,
        comment: null,
        isActive: true,
        mainQuantity: "1.00",
        updatedAt: "2025-12-01T11:18:46.578Z"
      },
    ];

    return groupBarcodesByGRN(barcodeData);
  };

  const transformMockDataToRaw = (): ApiBarcodeItem[] => {
    return [
      {
        id: 1,
        barcodeNumber: "Bill001",
        grn: { 
          id: 23,
          documentNumber: "DOC-0089",
          supplier: { companyName: "xyz", name: "Test" },
          warehouse: { name: "test" }
        },
        item: { id: 23, name: "testt", sku: "d6fe9b85-6704-495e-80ef-39ed6b5f723d" },
        createdBy: { name: "Shalini Maurya" },
        createdAt: "2025-12-01T11:18:46.578Z",
        manufacturingDate: null,
        expiryDate: null,
        info: null,
        comment: null,
        isActive: true,
        mainQuantity: "11.00",
        updatedAt: "2025-12-01T11:18:46.578Z"
      },
      {
        id: 2,
        barcodeNumber: "Bill002",
        grn: { 
          id: 23,
          documentNumber: "DOC-0089",
          supplier: { companyName: "xyz", name: "Test" },
          warehouse: { name: "test" }
        },
        item: { id: 23, name: "testt", sku: "d6fe9b85-6704-495e-80ef-39ed6b5f723d" },
        createdBy: { name: "Shalini Maurya" },
        createdAt: "2025-12-01T11:18:46.578Z",
        manufacturingDate: null,
        expiryDate: null,
        info: null,
        comment: null,
        isActive: true,
        mainQuantity: "1.00",
        updatedAt: "2025-12-01T11:18:46.578Z"
      },
      {
        id: 3,
        barcodeNumber: "Bill003",
        grn: { 
          id: 23,
          documentNumber: "DOC-0089",
          supplier: { companyName: "xyz", name: "Test" },
          warehouse: { name: "test" }
        },
        item: { id: 23, name: "testt", sku: "d6fe9b85-6704-495e-80ef-39ed6b5f723d" },
        createdBy: { name: "Shalini Maurya" },
        createdAt: "2025-12-01T11:18:46.578Z",
        manufacturingDate: null,
        expiryDate: null,
        info: null,
        comment: null,
        isActive: true,
        mainQuantity: "1.00",
        updatedAt: "2025-12-01T11:18:46.578Z"
      },
    ];
  };

  const table = useReactTable({
    data: barcodes,
    columns: columns(handlePrintBarcode, handlePrintAllBarcodes),
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
      columnVisibility: {
        grnDocumentNumber: true,
        barcodes: true,
        itemSku: true,
        itemName: true,
        totalQuantity: true,
        manufacturingDate: true,
        expiryDate: true,
        companyName: true,
        createdBy: false,
        creationDate: false,
        status: true,
        actions: true,
      },
    },
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    enableSortingRemoval: false,
  });

  const itemStatusOptions: OptionType[] = [
    { label: "All", value: "all" },
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "Inactive" },
  ];

  const handleStatusFilter = (value: string) => {
    if (value === "all") {
      table.getColumn("status")?.setFilterValue(undefined);
    } else {
      table.getColumn("status")?.setFilterValue(value);
    }
  };

  // Handle export functionality
  const handleExport = () => {
    // Flatten all barcodes from raw data for export
    if (rawBarcodeData.length === 0) {
      alert('No barcode data available to export');
      return;
    }
    
    // Export using the raw barcode data
    exportBarcodesToExcel(groupBarcodesByGRN(rawBarcodeData));
  };

  return (
    <div>
      <div className="space-y-6">
        <section className="px-5">
          <div className="flex justify-between items-center mb-4">
            <div className="flex flex-wrap gap-4 items-center">
              <SelectFilter
                label="Barcode Status"
                items={itemStatusOptions}
                onValueChange={handleStatusFilter}
              />
              <MultiSelectWithSearch
                columns={table.getAllColumns()}
                label="Show/Hide Columns"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline"
                onClick={handleExport}
                disabled={rawBarcodeData.length === 0}
              >
                <Download className="h-4 w-4 mr-2" />
                Export ({rawBarcodeData.length})
              </Button>
            </div>
          </div>
        </section>
        
        {loading ? (
          <div className="px-5 h-96 flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7047EB] mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading barcodes...</p>
            </div>
          </div>
        ) : error ? (
          <div className="px-5 h-96 flex items-center justify-center">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </div>
        ) : barcodes.length === 0 ? (
          <div className="px-5">
            <div className="border rounded-lg h-96 flex flex-col items-center justify-center">
              <img src="/folder.svg" alt="No data" className="w-24 h-24 mb-4" />
              <h4 className="font-bold text-lg mb-2">No Barcodes Generated</h4>
              <p className="max-w-xs text-gray-600 text-sm text-center mb-6">
                Generate barcodes from inward documents to track your inventory efficiently.
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="px-5">
              <div className="border rounded-lg bg-white overflow-hidden">
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id} className="bg-muted/50">
                        {headerGroup.headers.map((header) => (
                          <TableHead
                            key={header.id}
                            className="h-10 border-r last:border-r-0"
                          >
                            {flexRender(
                              header.column.columnDef.header,
                              header.getContext(),
                            )}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id} className="border-b">
                              {flexRender(
                                cell.column.columnDef.cell,
                                cell.getContext(),
                              )}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={columns.length}
                          className="h-96 text-center"
                        >
                          <div className="w-full flex flex-col gap-3 justify-center items-center">
                            <img src="/folder.svg" alt="" />
                            <h4 className="font-bold text-lg">No Barcodes Found</h4>
                            <p className="max-w-xs text-gray-600 text-sm">
                              No barcodes match your current filters.
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            {table.getRowModel().rows.length > 0 && (
              <TablePagenation table={table} />
            )}
          </>
        )}
      </div>

      {/* Print Single Barcode Dialog */}
      {selectedBarcode && (
        <PrintBarcode
          barcode={selectedBarcode}
          isOpen={showPrintDialog}
          onClose={() => {
            setShowPrintDialog(false);
            setSelectedBarcode(null);
          }}
        />
      )}

      {/* Print All Barcodes Dialog */}
      {selectedAllBarcodes.length > 0 && (
        <PrintAllBarcodes
          barcodes={selectedAllBarcodes}
          grnDocumentNumber={selectedAllBarcodeInfo.grnDocumentNumber}
          itemName={selectedAllBarcodeInfo.itemName}
          itemSku={selectedAllBarcodeInfo.itemSku}
          companyName={selectedAllBarcodeInfo.companyName}
          isOpen={showPrintAllDialog}
          onClose={() => {
            setShowPrintAllDialog(false);
            setSelectedAllBarcodes([]);
          }}
        />
      )}
    </div>
  );
};

export default BarcodeTable;