import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Share2 } from "lucide-react";
import PurchaseOrderPreviewTable from "@/components/app/tables/sales-purchase/PurchaseOrderPreviewTable";
import SendEmailModal from "@/components/app/modals/SendEmailModal";
import { get } from "../../lib/apiService";
import { usePrint } from "../../components/hooks/usePrint"; 

const PurchaseOrderPreview: React.FC = () => {
  const [showSendEmailModal, setShowSendEmailModal] = useState<boolean>(false);
  const [purchaseOrder, setPurchaseOrder] = useState<any>(null);
  const [totalBeforeTax, setTotalBeforeTax] = useState<number>(0);
  const [totalTax, setTotalTax] = useState<number>(0);
  const [itemData, setItemData] = useState<any[]>([]);
  const [user, setUser] = useState<any>(null);
  
  // Add ref for print content
  const printRef = useRef<HTMLDivElement>(null);
  const { print } = usePrint(); // Use the hook

  const toggleSendEmailModal = () => setShowSendEmailModal((prev) => !prev);

  // Print function
  const handlePrint = () => {
    print(printRef, {
      title: `Purchase Order - ${purchaseOrder?.documentNumber || ''}`,
      styles: `
        .document-title { 
          font-size: 24px; 
          font-weight: bold; 
          margin: 10px 0; 
          color: #7047EB; 
        }
        
        .po-details-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 15px;
          margin: 20px 0;
          background-color: #f9fafb;
          padding: 15px;
          border-radius: 8px;
          border: 1px solid #e5e7eb;
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
        
        .summary-section {
          display: flex;
          justify-content: space-between;
          margin-top: 40px;
          border-top: 1px solid #e5e7eb;
          padding-top: 30px;
        }
        
        .signature-box {
          background-color: #f3f4f6;
          padding: 20px 40px;
          text-align: center;
          border-radius: 8px;
          display: inline-block;
        }
        
        .amounts-section {
          width: 300px;
        }
        
        .amount-row {
          display: flex;
          justify-content: space-between;
          padding: 6px 0;
          border-bottom: 1px solid #f3f4f6;
        }
        
        .grand-total {
          font-weight: bold;
          font-size: 16px;
          color: #111827;
          border-top: 2px solid #e5e7eb;
          padding-top: 10px;
          margin-top: 10px;
        }
      `,
    });
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      get("/profile")
        .then((data) => {
          localStorage.setItem("User", JSON.stringify(data?.data));
          setUser(data?.data);
        })
        .catch((error) => {
          console.error("Error fetching profile:", error);
        });
    }
  }, []);

  useEffect(() => {
    const po = localStorage.getItem("purchaseOrder");
    if (po) {
      setPurchaseOrder(JSON.parse(po));
    }
  }, []);

  useEffect(() => {
    if (purchaseOrder) {
      const items = purchaseOrder.items || [];
      setItemData(items);
      const beforeTax = items.reduce((acc: number, item: any) => {
        return acc + (Number(item.totalPrice) || 0);
      }, 0);
      const tax = items.reduce((acc: number, item: any) => {
        return acc + ((Number(item.tax) * Number(item.totalPrice)) / 100 || 0);
      }, 0);
      setTotalBeforeTax(beforeTax);
      setTotalTax(tax);
    }
  }, [purchaseOrder]);

  return (
    <div className="min-h-screen pb-16">
      {/* Inline print styles */}
      <style>{`
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header actions bar - hidden during print */}
      <div className="py-4 px-8 flex text-sm md:text-base items-center justify-between bg-[#EEFBF4] no-print">
        <div className="text-xs sm:text-sm">
          Share this document with your{" "}
          <span className="font-semibold">Supplier</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleSendEmailModal}
            className="bg-[#7047EB] gap-1 px-3 flex items-center h-7 text-xs font-normal hover:bg-[#7047EB] shadow-none text-white rounded-md py-2"
          >
            <img src="/icons/mail.svg" className="w-4" alt="Email" />
            <div className="hidden md:flex">Share via Email</div>
          </Button>
          <Button
            variant="outline"
            className=" gap-1 px-3 flex items-center h-7 text-xs font-normal shadow-none rounded-md py-2"
          >
            <img src="/icons/whatsapp.svg" className="w-4" alt="WhatsApp" />
            <div className="hidden md:flex">WhatsApp</div>
          </Button>
          <Button
            variant="secondary"
            className=" gap-1 px-3 flex items-center h-7 text-xs font-normal shadow-none rounded-md py-2"
          >
            <img src="/icons/link.svg" className="w-4" alt="Copy Link" />
            <div className="hidden md:flex">Copy Link</div>
          </Button>
        </div>
      </div>

      {/* Main content - Printable area */}
      <div ref={printRef} className="px-10 mt-10 text-xs flex justify-center items-center">
        <div className="w-full max-w-6xl shadow space-y-2 p-4">
          {/* Header with document title and actions */}
          <div className="flex justify-between gap-2">
            <div className="flex items-center gap-2">
              <img src="/icons/purchase.svg" className="w-5 md:w-7 lg:w-10" alt="Purchase Order" />
              <div className="font-semibold sm:text-lg md:text-xl lg:text-2xl">
                Purchase Order
              </div>
            </div>
            <div className="flex items-center gap-2 no-print">
              <Button
                variant="outline"
                className=" gap-1 px-3 flex items-center h-7 text-xs font-normal shadow-none rounded-md py-2"
                onClick={handlePrint}
              >
                <Printer className="w-5 text-[#3F3F50]" />
                <div className="hidden md:flex">Print</div>
              </Button>
              <Button
                variant="outline"
                className=" gap-1 px-3 flex items-center h-7 text-xs font-normal shadow-none rounded-md py-2"
              >
                <Share2 className="w-5 text-[#8A8AA3]" />
                <div className="hidden md:flex">Copy Link</div>
              </Button>
            </div>
          </div>

          {/* Rest of your component remains exactly the same */}
          {/* PO Details */}
          <div className="border space-y-2 mt-4 border-neutral-200 p-6">
            <div className="text-[#8A8AA3]">PO Details</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 xl:grid-cols-6">
              <div className="space-y-2">
                <div className="font-medium">PO Number:</div>
                <div>{purchaseOrder?.documentNumber}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">PO Date:</div>
                <div>{purchaseOrder?.documentDate}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Delivery Date:</div>
                <div>{purchaseOrder?.deliveryDate}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">PO Amendment:</div>
                <div>{purchaseOrder?.amendment}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">PO Amount:</div>
                <div>₹{purchaseOrder?.totalAmount}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">No of Items:</div>
                <div>{purchaseOrder?.items?.length}</div>
              </div>
            </div>
          </div>

          {/* Address Sections */}
          <div className="p-6 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <h3 className="font-semibold">NAME AND CONTACT OF BUYER</h3>
              <div>
                <span className="font-medium">{user?.company?.name} </span>
              </div>
              <div>
                <span className="font-medium">Contact Person: </span>
                {user?.name}
              </div>
              <p>+91 {user?.phone}</p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">NAME AND ADDRESS OF SUPPLIER</h3>
              <div className="font-medium">{purchaseOrder?.supplier?.name}</div>
              <div>
                <span className="font-medium">GSTIN: </span>
                {purchaseOrder?.supplier?.gstNumber}
              </div>
              <p>
                {[
                  purchaseOrder?.supplier?.addressLine1,
                  purchaseOrder?.supplier?.addressLine2,
                  purchaseOrder?.supplier?.city,
                  purchaseOrder?.supplier?.state,
                  purchaseOrder?.supplier?.country,
                  purchaseOrder?.supplier?.pincode,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">SHIPPING DETAILS</h3>
              <p>{purchaseOrder?.placeOfSupplyCity}</p>
            </div>
          </div>

          {/* Items Table */}
          <PurchaseOrderPreviewTable items={itemData} inModal={false} />

          {/* Footer with Terms and Amounts */}
          <div className="flex flex-col gap-5 md:flex-row justify-between mt-4 md:mt-7">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="font-medium">Terms And Conditions:</div>
                <p>This is a computer generated document</p>
              </div>
              <div>
                <div className="p-3 space-y-8 text-xs bg-gray-100 w-full max-w-xs">
                  <div>For {user?.company?.name || "Company Name"}</div>
                  <div className="text-gray-400">Authorised Signatory</div>
                </div>
              </div>
            </div>
            <div className="space-y-3 text-xs w-full max-w-84">
              <div className="flex justify-between items-center gap-2">
                <div className="font-semibold">Total (before tax) :</div>
                <div>₹{totalBeforeTax.toFixed(2)}</div>
              </div>
              <div className="flex justify-between items-center gap-2">
                <div className="font-semibold">Total Tax :</div>
                <div>₹{totalTax.toFixed(2)}</div>
              </div>
              <div className="flex justify-between items-center gap-2">
                <div className="font-semibold">Total (after tax) :</div>
                <div>₹{(totalBeforeTax + totalTax).toFixed(2)}</div>
              </div>
              <div className="block border" />
              <div className="flex justify-between items-center gap-2">
                <div className="font-semibold">Grand Total :</div>
                <div>₹{Number(purchaseOrder?.totalAmount || 0).toFixed(2)}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <SendEmailModal
        isOpen={showSendEmailModal}
        onClose={toggleSendEmailModal}
      />
    </div>
  );
};

export default PurchaseOrderPreview;