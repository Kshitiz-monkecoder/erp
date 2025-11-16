import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Share2 } from "lucide-react";
import SendEmailModal from "@/components/app/modals/SendEmailModal";
import { get } from "../../lib/apiService";
import { useParams } from "react-router";
import DeliveryChallanPreviewTable from "@/components/app/tables/sales-purchase/DeliveryChallanPreviewTable";

const DeliveryChallanPreview: React.FC = () => {
  const { id } = useParams();
  const [showSendEmailModal, setShowSendEmailModal] = useState<boolean>(false);

  const toggleSendEmailModal = () => setShowSendEmailModal((prev) => !prev);
  const [challanData, setCallanData] = useState<any>(null);
  const [totalBeforeTax, setTotalBeforeTax] = useState<number>(0);
  const [totalTax, setTotalTax] = useState<number>(0);
  const [itemData, setItemData] = useState<any[]>([]);
  const [_user, setUser] = useState<any>(null);

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
    get(`/inventory/delivery-challan/${id}`)
      .then((data) => {
        setCallanData(data?.data);
      })
      .catch((error) => {
        console.error("Error fetching delivery challan:", error);
      });
  }, []);

  useEffect(() => {
    if (challanData) {
      const items = challanData.items || [];
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
  }, [challanData]);

  return (
    <div className="min-h-screen pb-16">
      <div className="py-4 px-8 flex text-sm md:text-base items-center justify-between bg-[#EEFBF4]">
        <div className="text-xs sm:text-sm">
          Share this document with your{" "}
          <span className="font-semibold">Supplier</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleSendEmailModal}
            className="bg-[#7047EB] gap-1 px-3 flex items-center h-7 text-xs font-normal hover:bg-[#7047EB] shadow-none text-white rounded-md py-2"
          >
            <img src="/icons/mail.svg" className="w-4" />
            <div className="hidden md:flex">Share via Email</div>
          </Button>
          <Button
            variant="outline"
            className="gap-1 px-3 flex items-center h-7 text-xs font-normal shadow-none rounded-md py-2"
          >
            <img src="/icons/whatsapp.svg" className="w-4" />
            <div className="hidden md:flex">WhatsApp</div>
          </Button>
          <Button
            variant="secondary"
            className="gap-1 px-3 flex items-center h-7 text-xs font-normal shadow-none rounded-md py-2"
          >
            <img src="/icons/link.svg" className="w-4" />
            <div className="hidden md:flex">Copy Link</div>
          </Button>
        </div>
      </div>
      <div className="px-10 mt-10 text-xs flex justify-center items-center">
        <div className="w-full max-w-6xl shadow space-y-2 p-4">
          <div className="flex justify-between gap-2">
            <div className="flex items-center gap-2">
              <img src="/icons/purchase.svg" className="w-5 md:w-7 lg:w-10" />
              <div className="font-semibold sm:text-lg md:text-xl lg:text-2xl">
                Delivery Challan
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                className="gap-1 px-3 flex items-center h-7 text-xs font-normal shadow-none rounded-md py-2"
              >
                <Printer className="w-5 text-[#3F3F50]" />
                <div className="hidden md:flex">Print</div>
              </Button>
              <Button
                variant="outline"
                className="gap-1 px-3 flex items-center h-7 text-xs font-normal shadow-none rounded-md py-2"
              >
                <Share2 className="w-5 text-[#8A8AA3]" />
                <div className="hidden md:flex">Copy Link</div>
              </Button>
            </div>
          </div>
          <div className="border space-y-2 mt-4 border-neutral-200 p-6">
            <div className="text-[#8A8AA3]">DC Details</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 xl:grid-cols-6">
              <div className="space-y-2">
                <div className="font-medium">DC Number:</div>
                <div>{challanData?.documentNumber || "DC00001"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">DC Date:</div>
                <div>{challanData?.documentDate || "12/06/2025"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Delivery/Dispatch Date:</div>
                <div>{challanData?.deliveryDate || "22/06/2025"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">DC Amendment:</div>
                <div>{challanData?.amendment || "0"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">PO Number:</div>
                <div>{challanData?.poNumber || "PO00098"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">PO Date:</div>
                <div>{challanData?.poDate || "12/06/2025"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">No of Items:</div>
                <div>{challanData?.items?.length || "1"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">DC Amount:</div>
                <div>₹{challanData?.totalAmount || "7,500.00"}</div>
              </div>
            </div>
          </div>
          <div className="p-6 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <h3 className="font-semibold">NAME AND ADDRESS OF SUPPLIER</h3>
              {/* Supplier details here */}
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">NAME AND ADDRESS OF BUYER</h3>
              <div className="font-medium">{challanData?.buyer?.companyName}</div>
              <div>{challanData?.buyer?.addressLine1}</div>
              <div>{challanData?.buyer?.addressLine2}</div>
              <div>
                {challanData?.buyer?.city}, {challanData?.buyer?.state}
              </div>
              <div>
                {challanData?.buyer?.country} - {challanData?.buyer?.pincode}
              </div>
              <div>
                <span className="font-medium">GSTIN: </span>
                {challanData?.buyer?.gstNumber}
              </div>
              <div>
                <span className="font-medium">Contact: </span>
                {challanData?.buyer?.phoneNo}
              </div>
              <div>
                <span className="font-medium">Email: </span>
                {challanData?.buyer?.companyEmail}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">SHIPPING DETAILS</h3>
              <div className="font-medium">
                {challanData?.shippingAddress?.companyName}
              </div>
              <div>{challanData?.shippingAddress?.locationName}</div>
              <div>{challanData?.shippingAddress?.address1}</div>
              <div>{challanData?.shippingAddress?.address2}</div>
              <div>
                {challanData?.shippingAddress?.city},{" "}
                {challanData?.shippingAddress?.postalCode}
              </div>
              <div>
                <span className="font-medium">GSTIN: </span>
                {challanData?.shippingAddress?.gstin}
              </div>
              <div>
                <span className="font-medium">GSTIN Type: </span>
                {challanData?.shippingAddress?.gstinType}
              </div>
            </div>
          </div>
          <DeliveryChallanPreviewTable items={itemData} inModal={false} />

          <div className="flex flex-col gap-5 md:flex-row justify-between mt-4 md:mt-7">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="font-medium">Terms And Conditions:</div>
                <p>This is a computer generated document</p>
              </div>
              <div>
                <div className="p-3 space-y-8 text-xs bg-gray-100 w-full  max-w-xs">
                  <div>For Ramesh PVT. LTD.</div>
                  <div className="text-gray-400">Authorised Signatory</div>
                </div>
              </div>
            </div>
            <div className="space-y-3 text-xs w-full max-w-84">
              <div className="flex justify-between items-center gap-2">
                <div className="font-semibold">Total (before tax) :</div>
                <div>₹{totalBeforeTax}.00</div>
              </div>
              <div className="flex justify-between items-center gap-2">
                <div className="font-semibold">Total Tax :</div>
                <div>₹{totalTax}.00</div>
              </div>
              <div className="flex justify-between items-center gap-2">
                <div className="font-semibold">Total (after tax) :</div>
                <div>₹{totalBeforeTax + totalTax}.00</div>
              </div>
              <div className="block border" />
              <div className="flex justify-between items-center gap-2">
                <div className="font-semibold">Grand Total :</div>
                <div>₹{challanData?.totalAmount}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <SendEmailModal
        isOpen={showSendEmailModal}
        onClose={toggleSendEmailModal}
      />
    </div>
  );
};

export default DeliveryChallanPreview;
