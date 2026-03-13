// src/pages/inventory/InwardDocumentPreview.tsx
import React, { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Barcode, ArrowLeft } from "lucide-react";
import BarcodeDialog from "@/components/app/modals/BarcodeDialogue";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { get } from "@/lib/apiService";

const InwardDocumentPreview: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();
  const printRef = useRef<HTMLDivElement>(null);

  const inwardParam =
    (params as any).inwardId ||
    (params as any).id ||
    (params as any).documentNumber ||
    location.pathname.split("/").filter(Boolean).slice(-1)[0];

  const [showBarcodeDialog, setShowBarcodeDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [inwardData, setInwardData] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchSpecificGRN = async () => {
      setLoading(true);
      setErrorMsg(null);
      setInwardData(null);

      try {
        if (!inwardParam) {
          setErrorMsg("No document id/number provided in the route.");
          setLoading(false);
          return;
        }

        // Try numeric id endpoint first
        const numericId = Number(inwardParam);
        if (!Number.isNaN(numericId) && Number.isFinite(numericId)) {
          try {
            const respById = await get(`/inventory/grn/${numericId}`);
            const respDataById = respById?.data?.data ?? respById?.data ?? respById;
            if (respById && (respById.status === 200 || respById.status === 201) && respDataById) {
              setInwardData(respDataById);
              setLoading(false);
              return;
            }
          } catch (err) {
            console.debug("Fetch by numeric id failed, will try query/fallback", err);
          }
        }

        // Try query by documentNumber
        try {
          const respByDoc = await get(`/inventory/grn?documentNumber=${encodeURIComponent(inwardParam)}`);
          const normalized = respByDoc?.data?.data ?? respByDoc?.data ?? respByDoc;
          if (Array.isArray(normalized) && normalized.length > 0) {
            setInwardData(normalized[0]);
            setLoading(false);
            return;
          }
          if (normalized && !Array.isArray(normalized)) {
            setInwardData(normalized);
            setLoading(false);
            return;
          }
        } catch (err) {
          console.debug("Fetch by documentNumber query failed, will fallback to full list", err);
        }

        // Final fallback: fetch all and find match
        try {
          const allResp = await get("/inventory/grn");
          const all = allResp?.data?.data ?? allResp?.data ?? allResp;
          if (Array.isArray(all)) {
            const lowerParam = String(inwardParam).toLowerCase();
            const match = all.find((item: any) => {
              return (
                String(item?.documentNumber || "").toLowerCase() === lowerParam ||
                String(item?.purchaseInword?.documentNumber || "").toLowerCase() === lowerParam ||
                String(item?.purchaseOrder?.documentNumber || "").toLowerCase() === lowerParam ||
                String(item?.id || "").toLowerCase() === lowerParam ||
                String(item?.purchaseInword?.id || "").toLowerCase() === lowerParam
              );
            });
            if (match) {
              setInwardData(match);
              setLoading(false);
              return;
            } else {
              setErrorMsg(`No document found for: ${inwardParam}`);
              setLoading(false);
              return;
            }
          } else {
            setErrorMsg("Unexpected API response shape while fetching all GRNs.");
            setLoading(false);
            return;
          }
        } catch (err) {
          console.error("Final fallback fetch failed:", err);
          setErrorMsg("Error fetching GRN data from server.");
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Unexpected error while fetching GRN:", err);
        setErrorMsg("Unexpected error occurred.");
        setLoading(false);
      }
    };

    fetchSpecificGRN();
  }, [inwardParam]);

  // Handle Print functionality
  const handlePrint = () => {
    if (!printRef.current) return;

    const printContent = printRef.current.innerHTML;
    const printWindow = window.open('', '_blank');

    if (!printWindow) {
      alert('Please allow pop-ups to print the document');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Inward Document - ${inwardData?.documentNumber || inwardData?.purchaseInword?.documentNumber || 'Document'}</title>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            @media print {
              body {
                margin: 0;
                padding: 20px;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                color: #000;
                background: white;
              }
              
              .no-print {
                display: none !important;
              }
              
              .print-only {
                display: block !important;
              }
              
              .print-container {
                width: 100%;
                max-width: 100%;
              }
              
              table {
                width: 100%;
                border-collapse: collapse;
                margin: 20px 0;
                font-size: 12px;
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
              
              .header-section {
                text-align: center;
                margin-bottom: 30px;
                border-bottom: 2px solid #105076;
                padding-bottom: 20px;
              }
              
              .document-title {
                font-size: 24px;
                font-weight: bold;
                margin: 10px 0;
                color: #105076;
              }
              
              .status-badge {
                background-color: #d1fae5;
                color: #065f46;
                padding: 4px 12px;
                border-radius: 4px;
                font-size: 12px;
                display: inline-block;
                margin-left: 10px;
              }
              
              .address-section {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 30px;
                margin: 30px 0;
                border: 1px solid #e5e7eb;
                padding: 20px;
                border-radius: 8px;
              }
              
              .address-title {
                font-size: 14px;
                font-weight: 600;
                color: #374151;
                margin-bottom: 8px;
              }
              
              .address-content {
                font-size: 13px;
                line-height: 1.5;
              }
              
              .details-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 20px;
                margin: 20px 0;
                background-color: #f9fafb;
                padding: 20px;
                border-radius: 8px;
              }
              
              .detail-item {
                margin-bottom: 10px;
              }
              
              .detail-label {
                font-size: 12px;
                color: #6b7280;
                margin-bottom: 4px;
              }
              
              .detail-value {
                font-size: 14px;
                font-weight: 500;
                color: #111827;
              }
              
              .footer {
                margin-top: 50px;
                border-top: 1px solid #e5e7eb;
                padding-top: 30px;
                display: flex;
                justify-content: space-between;
              }
              
              .terms {
                font-size: 12px;
                color: #6b7280;
                max-width: 400px;
              }
              
              .signature-box {
                background-color: #f3f4f6;
                padding: 20px 40px;
                text-align: center;
                border-radius: 8px;
              }
              
              .company-name {
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 20px;
              }
              
              .signatory-text {
                font-size: 12px;
                color: #6b7280;
                margin-top: 40px;
              }
              
              .page-break {
                page-break-before: always;
              }
              
              .print-date {
                text-align: right;
                font-size: 12px;
                color: #6b7280;
                margin-bottom: 20px;
              }
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
          <div class="print-container">
            ${printContent}
          </div>
          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() {
                window.close();
              }, 1000);
            };
            
            window.onafterprint = function() {
              window.close();
            };
          </script>
        </body>
      </html>
    `);

    printWindow.document.close();
  };

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center text-gray-500">
        Loading Inward Document...
      </div>
    );

  if (errorMsg)
    return (
      <div className="h-screen flex flex-col items-center justify-center text-gray-500 p-4">
        <div className="mb-4 text-lg"> {errorMsg} </div>
        <div className="text-sm text-gray-400">
          Check browser console for route param and API response diagnostics.
        </div>
        <div className="mt-6">
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </div>
    );

  // Map API object to display fields safely
  const mapped = {
    inwardNumber: inwardData?.documentNumber || inwardData?.purchaseInword?.documentNumber || `ID-${inwardData?.id}`,
    status: inwardData?.grnStatus || inwardData?.purchaseInword?.inwardStatus || "-",
    receivedByCompany: inwardData?.warehouse?.name || "-",
    receivedAddress:
      `${inwardData?.warehouse?.address1 || ""}${inwardData?.warehouse?.city ? ", " + inwardData?.warehouse?.city : ""}\n${inwardData?.warehouse?.postalCode || ""}`,
    supplierName: inwardData?.supplier?.name || "-",
    supplierAddress:
      `${inwardData?.supplier?.addressLine1 || ""}${inwardData?.supplier?.city ? ", " + inwardData?.supplier?.city : ""}${inwardData?.supplier?.state ? ", " + inwardData?.supplier?.state : ""}\n${inwardData?.supplier?.pincode || ""}`,
    supplierGSTIN: inwardData?.supplier?.gstNumber || "",
    deliveryDate: inwardData?.deliveryDate || inwardData?.purchaseInword?.deliveryDate || "-",
    inwardDate: inwardData?.documentDate || inwardData?.purchaseInword?.documentDate || "-",
    poNumber: inwardData?.purchaseOrder?.documentNumber || "-",
    poDate: inwardData?.purchaseOrder?.documentDate || "-",
    amendment: inwardData?.amendment || inwardData?.purchaseInword?.amendment || "0",
    items:
      (inwardData?.items && Array.isArray(inwardData.items) && inwardData.items.length > 0)
        ? inwardData.items.map((item: any, index: number) => ({
          description: inwardData?.purchaseOrder?.title || item?.description || `Item ${index + 1}`,
          itemCode: item?.id ? `ITM-${item.id}` : `ITM-${index + 1}`,
          totalQuantity: item.accepted ?? item.quantity ?? "0",
          deliveredEarlier: item.deliveredEarlier ?? "0",
          deliveredToday: item.accepted ?? item.deliveredToday ?? "0",
          balance: item.balance ?? "0",
          rawItem: item, // keep original item object for barcode
        }))
        : [],
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Inline print styles for non-print elements */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Document */}
      <div ref={printRef} className="max-w-7xl mx-auto mt-10 bg-white shadow-lg rounded-lg overflow-hidden print:shadow-none print:border">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="no-print"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-[#105076]">{mapped.inwardNumber}</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{mapped.status}</span>
            </div>
          </div>
        </div>

        {/* Title + Actions */}
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <img src="/icons/inward.svg" alt="inward" className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">Inward Document</h1>
          </div>

          <div className="flex gap-3 no-print">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
            <Button
              onClick={() => setShowBarcodeDialog(true)}
              className="bg-[#105076] hover:bg-[#105076]/90 flex items-center gap-2"
            >
              <Barcode className="w-4 h-4" />
              Barcode
            </Button>
          </div>
        </div>

        {/* Addresses */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-8 border-b">
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Goods Received By</h3>
            <p className="font-medium">{mapped.receivedByCompany}</p>
            <p className="text-sm text-gray-600 whitespace-pre-line">{mapped.receivedAddress}</p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Goods Sent By</h3>
            <p className="font-medium">{mapped.supplierName}</p>
            <p className="text-sm text-gray-600 whitespace-pre-line">
              {mapped.supplierAddress}
              <br />
              <span className="font-medium">GSTIN:</span> {mapped.supplierGSTIN}
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gray-700 mb-2">Shipped To</h3>
            <p className="font-medium">{mapped.receivedByCompany} Warehouse</p>
            <p className="text-sm text-gray-600">{mapped.receivedAddress.split("\n")[1]}</p>
          </div>
        </div>

        {/* Document Details */}
        <div className="p-6 bg-gray-50 border-b">
          <h3 className="font-semibold text-gray-600 mb-4 text-sm">INWARD DOCUMENT DETAILS</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-sm">
            <div>
              <div className="text-gray-500">Inward Number</div>
              <div className="font-medium">{mapped.inwardNumber}</div>
            </div>
            <div>
              <div className="text-gray-500">Delivery Date</div>
              <div className="font-medium">{mapped.deliveryDate}</div>
            </div>
            <div>
              <div className="text-gray-500">PO Number</div>
              <div className="font-medium">{mapped.poNumber}</div>
            </div>
            <div>
              <div className="text-gray-500">Inward Date</div>
              <div className="font-medium">{mapped.inwardDate}</div>
            </div>
            <div>
              <div className="text-gray-500">Amendment</div>
              <div className="font-medium">{mapped.amendment}</div>
            </div>
            <div>
              <div className="text-gray-500">PO Date</div>
              <div className="font-medium">{mapped.poDate}</div>
            </div>
          </div>
        </div>

        {/* Items Table */}
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Description</th>
                <th className="px-4 py-3 text-right">Quantity</th>
                <th className="px-4 py-3 text-right">Delivered Earlier</th>
                <th className="px-4 py-3 text-right">Delivered Today</th>
                <th className="px-4 py-3 text-right">Balance</th>
              </tr>
            </thead>
            <tbody>
              {mapped.items.length ? mapped.items.map((item: any, i: number) => (
                <tr key={i} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3">{i + 1}</td>
                  <td className="px-4 py-3">
                    <div>{item.description}</div>
                    <div className="text-xs text-gray-500">Item ID: {item.itemCode}</div>
                  </td>
                  <td className="px-4 py-3 text-right">{item.totalQuantity}</td>
                  <td className="px-4 py-3 text-right">{item.deliveredEarlier}</td>
                  <td className="px-4 py-3 text-right text-green-600 font-medium">{item.deliveredToday}</td>
                  <td className="px-4 py-3 text-right">{item.balance}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-center text-gray-500">No items found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t">
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <div className="font-semibold mb-2">Terms And Conditions:</div>
              <p className="text-sm text-gray-600">This is a computer generated document</p>
            </div>
            <div className="text-right">
              <div className="inline-block bg-gray-200 px-8 py-16 rounded">
                <div className="text-sm">For {mapped.receivedByCompany}</div>
                <div className="text-xs text-gray-500 mt-12">Authorised Signatory</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Barcode Dialog */}
      {/*
        FIX: Map raw inwardData.items → BarcodeItem[] so that:
          - id        = grnItemId  (the outer `id` on each grn item row)
          - itemId    = item.item.id  (the actual inventory item record)
          - itemCode  = item.item.sku
          - description = item.item.name
          - quantity  = item.accepted  (actual accepted quantity, not 0)
          - unit      = "pcs" (extend if your API provides unit)
      */}
      <BarcodeDialog
        open={showBarcodeDialog}
        onOpenChange={setShowBarcodeDialog}
        sourceType="GRN"
        grnId={inwardData?.id}
        referenceLabel={inwardData?.documentNumber ?? ""}
        items={(inwardData?.items ?? []).map((grnItem: any) => ({
          id:          grnItem.id,                              // grnItemId
          itemId:      grnItem.item?.id ?? grnItem.id,         // inventory item id
          itemCode:    grnItem.item?.sku ?? `ITM-${grnItem.id}`,
          description: grnItem.item?.name ?? `Item ${grnItem.id}`,
          quantity:    Number(
                         grnItem.accepted                      // accepted qty (most accurate)
                         ?? grnItem.inwordItem?.quantity       // fallback: inward qty
                         ?? grnItem.poItem?.quantity           // fallback: PO qty
                         ?? 0
                       ),
          unit:        grnItem.item?.unit ?? "pcs",
        }))}
      />
    </div>
  );
};

export default InwardDocumentPreview;