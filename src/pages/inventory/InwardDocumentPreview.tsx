// src/pages/inventory/InwardDocumentPreview.tsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Share2, Barcode } from "lucide-react";
import SendEmailModal from "@/components/app/modals/SendEmailModal";
import BarcodeDialog from "@/components/app/modals/BarcodeDialogue";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { get } from "@/lib/apiService";

/**
 * InwardDocumentPreview
 * - reads route param (tries inwardId | id | documentNumber | fallback last path segment)
 * - attempts to fetch using:
 *    1) GET /inventory/grn?documentNumber=<param>
 *    2) GET /inventory/grn/<id> (if numeric)
 *    3) fallback: GET /inventory/grn and find the match
 */

const InwardDocumentPreview: React.FC = () => {
  const navigate = useNavigate();
  const params = useParams();
  const location = useLocation();

  const inwardParam =
    (params as any).inwardId ||
    (params as any).id ||
    (params as any).documentNumber ||
    location.pathname.split("/").filter(Boolean).slice(-1)[0];

  const [showSendEmailModal, setShowSendEmailModal] = useState(false);
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

  // map API object to display fields safely
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
      {/* Top Bar */}
      <div className="bg-[#EEFBF4] py-4 px-8 flex flex-col sm:flex-row justify-between items-center text-sm">
        <div>
          Download Mobile App to share your documents instantly!{" "}
          <a href="#" className="font-bold text-blue-600 underline">
            DOWNLOAD APP
          </a>
        </div>
        <div className="flex gap-3 mt-3 sm:mt-0">
          <Button className="bg-[#105076] hover:bg-[#105076]/90">Share via Email</Button>
          <Button variant="outline">WhatsApp</Button>
          <Button variant="secondary">Copy Link</Button>
        </div>
      </div>

      {/* Main Document */}
      <div className="max-w-5xl mx-auto mt-8 bg-white shadow-lg rounded-lg overflow-hidden">
        {/* Header */}
        <div className="border-b px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-xl">Back</button>
            <div className="flex items-center gap-3">
              <span className="text-xl font-bold text-[#105076]">{mapped.inwardNumber}</span>
              <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs">{mapped.status}</span>
            </div>
          </div>
          <Button variant="outline" size="sm">Go to Transaction</Button>
        </div>

        {/* Title + Actions */}
        <div className="p-6 border-b flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="bg-purple-100 p-3 rounded-lg">
              <img src="/icons/inward.svg" alt="inward" className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-bold">Inward Document</h1>
          </div>

          <div className="flex gap-3">
            <Button variant="outline" size="sm"><Printer className="w-4 h-4 mr-2" />Print</Button>
            <Button variant="outline" size="sm"><Share2 className="w-4 h-4 mr-2" />Share</Button>
            <Button onClick={() => setShowBarcodeDialog(true)} className="bg-[#105076] hover:bg-[#105076]/90">
              <Barcode className="w-4 h-4 mr-2" />Barcode
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

      {/* ---------- PASS grnId and items to BarcodeDialog ---------- */}
      <BarcodeDialog
        open={showBarcodeDialog}
        onOpenChange={setShowBarcodeDialog}
        grnId={inwardData?.id}
        items={(inwardData?.items ?? [])}
      />

      <SendEmailModal isOpen={showSendEmailModal} onClose={() => setShowSendEmailModal(false)} />
    </div>
  );
};

export default InwardDocumentPreview;
