import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Printer, Share2 } from "lucide-react";
import SendEmailModal from "@/components/app/modals/SendEmailModal";
import { get } from "../../lib/apiService";
import OrderConfirmationPreviewTable from "@/components/app/tables/sales-purchase/OrderConfirmationPreviewTable";
import { useParams } from "react-router";
import { formatDate } from "@/lib/utils";

const InvoicePreview: React.FC = () => {
  const { id } = useParams();
  const [showSendEmailModal, setShowSendEmailModal] = useState<boolean>(false);

  const toggleSendEmailModal = () => setShowSendEmailModal((prev) => !prev);
  const [invoiceData, setInvoiceData] = useState<any>(null);
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
    get(`/inventory/tax-invoice/${id}`)
      .then((data) => {
        setInvoiceData(data?.data);
      })
      .catch((error) => {
        console.error("Error fetching invoice:", error);
      });
  }, [id]);

  useEffect(() => {
    if (invoiceData) {
      const items = invoiceData.items || [];
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
  }, [invoiceData]);

  return (
    <div className="min-h-screen pb-16">
      <div className="py-4 px-8 flex text-sm md:text-base items-center justify-between bg-[#EEFBF4]">
        <div className="text-xs sm:text-sm">
          Share this document with your{" "}
          <span className="font-semibold">Buyer</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleSendEmailModal}
            className="bg-[#7047EB] gap-1 px-3 flex items-center h-7 text-xs font-normal hover:bg-[#7047EB] shadow-none text-white rounded-md py-2"
          >
            <img src="/icons/mail.svg" className="w-4" alt="email" />
            <div className="hidden md:flex">Share via Email</div>
          </Button>
          <Button
            variant="outline"
            className="gap-1 px-3 flex items-center h-7 text-xs font-normal shadow-none rounded-md py-2"
          >
            <img src="/icons/whatsapp.svg" className="w-4" alt="whatsapp" />
            <div className="hidden md:flex">WhatsApp</div>
          </Button>
          <Button
            variant="secondary"
            className="gap-1 px-3 flex items-center h-7 text-xs font-normal shadow-none rounded-md py-2"
          >
            <img src="/icons/link.svg" className="w-4" alt="link" />
            <div className="hidden md:flex">Copy Link</div>
          </Button>
        </div>
      </div>
      <div className="px-10 mt-10 text-xs flex justify-center items-center">
        <div className="w-full max-w-6xl shadow space-y-2 p-4">
          <div className="flex justify-between gap-2">
            <div className="flex items-center gap-2">
              <img src="/icons/purchase.svg" className="w-5 md:w-7 lg:w-10" alt="invoice" />
              <div className="font-semibold sm:text-lg md:text-xl lg:text-2xl">
                Invoice
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
            <div className="text-[#8A8AA3]">Invoice Details</div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-5 xl:grid-cols-4">
              <div className="space-y-2">
                <div className="font-medium">Invoice Number:</div>
                <div>{invoiceData?.invoiceNumber || "N/A"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Invoice Date:</div>
                <div>{formatDate(invoiceData?.invoiceDate) || "N/A"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Status:</div>
                <div>{invoiceData?.status || "N/A"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Payment Terms:</div>
                <div>{invoiceData?.paymentTerms || "N/A"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Payment Method:</div>
                <div>{invoiceData?.paymentMethod || "N/A"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">PO Number:</div>
                <div>{invoiceData?.poNumber || "N/A"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">PO Date:</div>
                <div>{formatDate(invoiceData?.poDate) || "N/A"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">OC Number:</div>
                <div>{invoiceData?.oc?.documentNumber || "N/A"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">OC Date:</div>
                <div>{formatDate(invoiceData?.oc?.documentDate) || "N/A"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">No of Items:</div>
                <div>{invoiceData?.items?.length || "0"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Invoice Amount:</div>
                <div>₹{invoiceData?.totalAmount || "0.00"}</div>
              </div>
              <div className="space-y-2">
                <div className="font-medium">Warehouse:</div>
                <div>{invoiceData?.warehouse?.name || "N/A"}</div>
              </div>
            </div>
          </div>
          <div className="p-6 grid gap-8 sm:grid-cols-2 xl:grid-cols-3">
            <div className="space-y-2">
              <h3 className="font-semibold">FROM</h3>
              <div className="font-medium">{invoiceData?.company?.name}</div>
              <div>{invoiceData?.company?.type} Ltd.</div>
              {/* Add company address details when available */}
              <div>
                <span className="font-medium">Created By: </span>
                {invoiceData?.createdBy?.name}
              </div>
              <div>
                <span className="font-medium">Email: </span>
                {invoiceData?.createdBy?.email}
              </div>
              <div>
                <span className="font-medium">Phone: </span>
                {invoiceData?.createdBy?.phone}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">BILL TO</h3>
              <div className="font-medium">{invoiceData?.buyer?.companyName}</div>
              <div>{invoiceData?.billingAddress?.address1 || invoiceData?.buyer?.addressLine1}</div>
              <div>{invoiceData?.billingAddress?.address2 || invoiceData?.buyer?.addressLine2}</div>
              <div>
                {invoiceData?.billingAddress?.city || invoiceData?.buyer?.city}, 
                {invoiceData?.buyer?.state}
              </div>
              <div>
                {invoiceData?.buyer?.country} - {invoiceData?.billingAddress?.postalCode || invoiceData?.buyer?.pincode}
              </div>
              <div>
                <span className="font-medium">GSTIN: </span>
                {invoiceData?.billingAddress?.gstin || invoiceData?.buyer?.gstNumber}
              </div>
              <div>
                <span className="font-medium">Contact: </span>
                {invoiceData?.buyer?.phoneNo}
              </div>
              <div>
                <span className="font-medium">Email: </span>
                {invoiceData?.buyer?.companyEmail}
              </div>
            </div>
            <div className="space-y-2">
              <h3 className="font-semibold">PLACE OF SUPPLY</h3>
              <div className="font-medium">
                {invoiceData?.placeOfSupplyCity}, {invoiceData?.placeOfSupplyState?.name}
              </div>
              <div>
                <span className="font-medium">Country: </span>
                {invoiceData?.placeOfSupplyCountry?.name}
              </div>
              <div>
                <span className="font-medium">Delivery Note: </span>
                {invoiceData?.deliveryNote || "N/A"}
              </div>
              <div>
                <span className="font-medium">Kind Attention: </span>
                {invoiceData?.kindAttention || "N/A"}
              </div>
              {invoiceData?.shippingAddress && (
                <>
                  <div className="font-medium mt-2">Shipping Address:</div>
                  <div>{invoiceData?.shippingAddress?.locationName}</div>
                  <div>{invoiceData?.shippingAddress?.address1}</div>
                  <div>{invoiceData?.shippingAddress?.address2}</div>
                  <div>
                    {invoiceData?.shippingAddress?.city} - {invoiceData?.shippingAddress?.postalCode}
                  </div>
                </>
              )}
            </div>
          </div>
          <OrderConfirmationPreviewTable items={itemData} inModal={false} />

          <div className="flex flex-col gap-5 md:flex-row justify-between mt-4 md:mt-7">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="font-medium">Terms And Conditions:</div>
                <p>{invoiceData?.remark || "This is a computer generated document"}</p>
              </div>
              <div>
                <div className="p-3 space-y-8 text-xs bg-gray-100 w-full max-w-xs">
                  <div>For {invoiceData?.company?.name}</div>
                  <div className="text-gray-400">{invoiceData?.signature || "Authorised Signatory"}</div>
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
                <div className="font-semibold">Total Tax Amount :</div>
                <div>₹{invoiceData?.totalTaxAmount || "0.00"}</div>
              </div>
              {Number(invoiceData?.totalDiscount) > 0 && (
                <div className="flex justify-between items-center gap-2">
                  <div className="font-semibold">Discount :</div>
                  <div>₹{invoiceData?.totalDiscount || "0.00"}</div>
                </div>
              )}
              <div className="block border" />
              <div className="flex justify-between items-center gap-2">
                <div className="font-semibold">Grand Total :</div>
                <div>₹{invoiceData?.totalAmount || "0.00"}</div>
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

export default InvoicePreview;
