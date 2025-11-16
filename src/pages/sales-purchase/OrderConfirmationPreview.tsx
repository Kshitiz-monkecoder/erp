import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Share2 } from "lucide-react";
import SendEmailModal from "@/components/app/modals/SendEmailModal";
import { get } from "../../lib/apiService";
import OrderConfirmationPreviewTable from "@/components/app/tables/sales-purchase/OrderConfirmationPreviewTable";
import { useParams } from "react-router";

const OrderConfirmationPreview: React.FC = () => {
  const { id } = useParams();
  const [showSendEmailModal, setShowSendEmailModal] = useState<boolean>(false);

  const toggleSendEmailModal = () => setShowSendEmailModal((prev) => !prev);
  const [orderData, setOrderData] = useState<any>(null);
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
    get(`/inventory/order-confirmation/${id}`)
      .then((data) => {
        // localStorage.setItem("User", JSON.stringify(data?.data));
        setOrderData(data?.data);
      })
      .catch((error) => {
        console.error("Error fetching profile:", error);
      });
  }, []);

  useEffect(() => {
    if (orderData) {
      const items = orderData.items || [];
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
  }, [orderData]);

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
                Order Confirmation
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
            <div className="text-[#8A8AA3]">OC Details</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 xl:grid-cols-6">
              <div className="space-y-2">
                <div className="font-medium">OC Number:</div>
                <div>{orderData?.documentNumber || "OC00001"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">OC Date:</div>
                <div>{orderData?.documentDate || "12/06/2025"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Delivery/Dispatch Date:</div>
                <div>{orderData?.deliveryDate || "22/06/2025"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">OC Amendment:</div>
                <div>{orderData?.amendment || "0"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">PO Number:</div>
                <div>{orderData?.poNumber || "PO00098"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">PO Date:</div>
                <div>{orderData?.poDate || "12/06/2025"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">No of Items:</div>
                <div>{orderData?.items?.length || "1"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">OC Amount:</div>
                <div>₹{orderData?.totalAmount || "7,500.00"}</div>
              </div>
            </div>
          </div>
          <div className="p-6 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <h3 className="font-semibold">NAME AND ADDRESS OF SUPPLIER</h3>
              {/* <div className="font-medium">
                {orderData?.supplier?.name || "fastdeep pvt ltd"}
              </div>
              <div>Main Address,</div>
              <div>Mumbai (Maharashtra- 27 )</div>
              <div>India - 400001</div>
              <div>
                <span className="font-medium">GSTIN: </span>
                {orderData?.supplier?.gstNumber || "27AACCF7457K1Z7"}
              </div>
              <div>
                <span className="font-medium">Place of Supply: </span>
                Mumbai, Maharashtra (27)
              </div> */}
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">NAME AND ADDRESS OF BUYER</h3>
              <div className="font-medium">{orderData?.buyer?.companyName}</div>
              <div>{orderData?.buyer?.addressLine1}</div>
              <div>{orderData?.buyer?.addressLine2}</div>
              <div>
                {orderData?.buyer?.city}, {orderData?.buyer?.state}
              </div>
              <div>
                {orderData?.buyer?.country} - {orderData?.buyer?.pincode}
              </div>
              <div>
                <span className="font-medium">GSTIN: </span>
                {orderData?.buyer?.gstNumber}
              </div>
              <div>
                <span className="font-medium">Contact: </span>
                {orderData?.buyer?.phoneNo}
              </div>
              <div>
                <span className="font-medium">Email: </span>
                {orderData?.buyer?.companyEmail}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">SHIPPING DETAILS</h3>
              <div className="font-medium">
                {orderData?.shippingAddress?.companyName}
              </div>
              <div>{orderData?.shippingAddress?.locationName}</div>
              <div>{orderData?.shippingAddress?.address1}</div>
              <div>{orderData?.shippingAddress?.address2}</div>
              <div>
                {orderData?.shippingAddress?.city},{" "}
                {orderData?.shippingAddress?.postalCode}
              </div>
              <div>
                <span className="font-medium">GSTIN: </span>
                {orderData?.shippingAddress?.gstin}
              </div>
              <div>
                <span className="font-medium">GSTIN Type: </span>
                {orderData?.shippingAddress?.gstinType}
              </div>
            </div>
          </div>
          <OrderConfirmationPreviewTable items={itemData} inModal={false} />

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
                <div>₹{orderData?.totalAmount}</div>
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

export default OrderConfirmationPreview;
