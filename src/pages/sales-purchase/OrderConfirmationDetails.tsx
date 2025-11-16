import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, PlusIcon } from "lucide-react";
import React from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import moment from "moment";
import { get } from "../../lib/apiService";
import SelectBuyerModal from "../../components/app/modals/SelectBuyerModal";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface TimelineItem {
  type: "OC" | "DC" | "PO" | "INWARD" | "GRN" | "INVOICE"; // Added INVOICE type
  id: number;
  documentNumber: string;
  date: string;
  status: string;
  details: {
    buyer?: {
      id: number;
      name: string;
      companyName: string;
      gstVerified: boolean;
      gstNumber: string;
    };
    supplier?: {
      companyName: string;
      gstNumber?: string;
    };
    totalAmount: string;
    tax: string;
    status: string;
    createdBy: {
      id: number;
      email: string;
      name: string;
      phone: string;
      userType: string;
    };
    items: Array<{
      hsn?: string;
      quantity: string;
      unitPrice?: string;
      totalPrice?: string;
      tax?: string;
      id: number;
      createdAt: string;
      updatedAt: string;
    }>;
    company: {
      id: number;
      name: string;
      type: string;
      createdAt: string;
      updatedAt: string;
    };
    placeOfSupplyCity?: string;
    title?: string;
    documentNumber: string;
    documentDate: string;
    deliveryDate?: string;
    warehouse?: {
      name: string;
      address1: string;
      address2: string;
      city: string;
      postalCode: string;
      id: number;
    };
    amendment: number | null;
    poNumber?: string;
    poDate?: string;
    quotationNumber?: string;
    quotationDate?: string;
    paymentType?: string;
    customerEnquiryNumber?: string;
    customerEnquiryDate?: string;
    kindAttention?: string;
    attachments: any | null;
    signature: string | null;
    remark?: string;
    id: number;
    createdAt: string;
    updatedAt: string;
    // Additional fields for INWARD type
    invoice?: string;
    invoiceDate?: string;
    deliveryChallanNumber?: string;
    transporterName?: string;
    transporterGstNumber?: string;
    vehicleNumber?: string;
    transportationDocumentNumber?: string;
    transportationDocumentDate?: string;
    payToTransporter?: string;
    deliveryNote?: string;
    // Additional fields for GRN type
    grnStatus?: string;
    purchaseInword?: {
      invoice: string;
      invoiceDate: string;
      deliveryChallanNumber: string;
      transporterName: string;
      vehicleNumber: string;
    };
    ocNumber?: string;
    ocDate?: string;
    indentNumber?: string;
    indentDate?: string;
    // Adding invoice specific fields
    invoiceNumber?: string;
    paymentTerms?: string;
    paymentMethod?: string;
    totalDiscount?: string;
    totalTaxAmount?: string;
  };
}

const OrderConfirmationDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { orderConfirmation } = location.state || {};

  const [timeline, setTimeline] = React.useState<TimelineItem[]>([]);
  const [user] = React.useState(
    JSON.parse(localStorage.getItem("User") || "{}")
  );
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [_selectedOcId, setSelectedOcId] = React.useState<number | null>(null);
  const [ocSingleData, setOCSingleData] = React.useState<any>(null);

  //   console.log("orderConfirmation", orderConfirmation)

  React.useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const data = await get(
          `/inventory/sales-timeline/order-confirmation/${id}`
        );
        setTimeline(data?.data || []);
      } catch (error) {
        console.error("Error fetching timeline:", error);
      }
    };

    const fetchOCSingleData = async () => {
      try {
        const data = await get(`/inventory/order-confirmation/${id}`);
        setOCSingleData(data?.data || null);
      } catch (error) {
        console.error("Error fetching OC single data:", error);
      }
    };

    if (id) {
      fetchOCSingleData();
      fetchTimeline();
    }
  }, [id]);

  // Helper function to get document type label
  const getDocumentTypeLabel = (type: string) => {
    switch (type) {
      case "OC":
        return "OC";
      case "DC":
        return "Delivery Challan";
      case "PO":
        return "Purchase Order";
      case "INWARD":
        return "Inward";
      case "GRN":
        return "Goods Receipt Note";
      case "INVOICE":
        return "Invoice";
      default:
        return type;
    }
  };

  // Format date helper function
  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return moment(dateString).format("DD-MM-YYYY");
  };

  const handleCreateDC = (ocId: number) => {
    setSelectedOcId(ocId);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleContinueBuyer = () => {
    navigate(`/sales-purchase/delivery-challan/${id}`);
  };

  return (
    <div className="min-h-screen">
      <div className="px-5 pl-10 py-4 text-xs md:text-sm bg-[#F7F7F8]">
        <div className="w-full grid sm:grid-cols-2 md:grid-cols-3 md:justify-between md:items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="font-medium">Supplier:</div>
            {localStorage.getItem("User")
              ? JSON.parse(localStorage.getItem("User") || "{}").name
              : "Ramesh PVT. LTD."}
          </div>
          <div className="flex w-full md:justify-center gap-2">
            <div className="font-medium">Buyer:</div>
            {orderConfirmation?.buyer?.name}
          </div>
          <div className="flex w-full md:justify-end items-center gap-2">
            <div className="font-medium">Start Date:</div>
            {formatDate(orderConfirmation?.documentDate)}
          </div>
        </div>
      </div>
      <div className="p-5 grid md:grid-cols-2 gap-5 bg-[#F7F7F880]">
        {/* Dashboard */}
        <div className="rounded-2xl text-sm bg-white border-[1.5px] border-neutral-200 p-4">
          <div className="flex justify-between items-center gap-2">
            <h3 className="text-[#8A8AA3]">DASHBOARD</h3>
            <div className="flex text-xs items-center gap-2">
              <div className="px-2 py-1 rounded-lg flex items-center gap-1 text-[#8A6100] bg-[#FFF9EB]">
                <div className="hidden xl:flex">Invoice :</div>Invoice Created
              </div>
              <div className="px-2 py-1 rounded-lg flex items-center gap-1 text-[#17663A] bg-[#EEFBF4]">
                <div className="hidden xl:flex">Goods :</div> Received
              </div>
            </div>
          </div>
          <div className="text-xs mt-4 grid md:grid-cols-2 lg:grid-cols-3 md:text-sm">
            <div className="space-y-2 pr-5">
              <h3 className="font-bold text-lg md:text-xl lg:text-2xl">10</h3>
              <p>Pending Tasks for you</p>
            </div>
            <div className="space-y-2 border-l md:border-neutral-200 pl-5">
              <h3 className="font-bold text-lg md:text-xl lg:text-2xl">0</h3>
              <p>Completed Tasks</p>
            </div>
            <div className="flex col-span-2 lg:col-span-1 mt-3 justify-end lg:justify-center items-end lg:items-center">
              <Button variant="outline" className="h-7 w-fit px-2 text-xs">
                View All Tasks
              </Button>
            </div>
          </div>
        </div>
        {/* Actions */}
        <div className="rounded-2xl text-sm h-full flex flex-col justify-between bg-white border-[1.5px] border-neutral-200 p-4">
          <div className="flex items-center gap-2">
            <h3 className="text-[#8A8AA3]">ACTIONS</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 mt-3 items-center gap-2">
            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="focus-visible:ring-0">
                  <Button className="bg-[#7047EB] w-full h-7 text-xs font-normal hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2">
                    <PlusIcon className="mr-1 h-3 w-3" />
                    Create Document
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="shadow-none">
                  <DropdownMenuGroup className="space-y-1">
                    <DropdownMenuItem
                      onClick={() => {
                        localStorage.setItem(
                          "selectedBuyer",
                          JSON.stringify(orderConfirmation?.buyer ?? {})
                        );
                        navigate(`/sales-purchase/invoice/${id}`, {
                          state: { orderConfirmation: ocSingleData },
                        });
                      }}
                      className="[&:not(:last-child)]:border-b p-1 rounded-none focus:bg-white focus:text-neutral-600 duration-200 ease-out transition-all [&:not(:last-child)]:border-neutral-200"
                    >
                      Create Invoice
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => {
                        localStorage.setItem(
                          "selectedBuyer",
                          JSON.stringify(orderConfirmation?.buyer ?? {})
                        );
                        navigate(`/sales-purchase/invoice/${id}?performa=true`, {
                          state: { orderConfirmation: ocSingleData },
                        });
                      }}
                      className="[&:not(:last-child)]:border-b p-1 rounded-none focus:bg-white focus:text-neutral-600 duration-200 ease-out transition-all [&:not(:last-child)]:border-neutral-200"
                    >
                      Create Performa Invoice
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => handleCreateDC(Number(id))}
                      className="[&:not(:last-child)]:border-b p-1 rounded-none focus:bg-white focus:text-neutral-600 duration-200 ease-out transition-all [&:not(:last-child)]:border-neutral-200"
                    >
                      Create DC
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button variant="outline" className="h-7 w-full px-2 text-xs">
              Transaction Tags
            </Button>
            <Button
              variant="secondary"
              className="h-7 col-span-2 lg:col-span-1 w-full px-2 text-xs"
            >
              Cancel Transaction
            </Button>
          </div>
        </div>
      </div>
      <div className="grid gap-10 lg:grid-cols-4 p-5">
        {/* Transaction Timeline */}
        <div className="lg:col-span-1">
          <h3 className="font-semibold">TRANSACTION TIMELINE</h3>
          <div className="mt-4">
            {timeline.map((item, index) => (
              <div key={index}>
                <div className="flex items-center gap-2 text-xs">
                  <Button
                    size="icon"
                    className="rounded-full h-6 w-6 shadow-none bg-green-600 hover:bg-green-600"
                  >
                    <Check className="w-2" />
                  </Button>
                  <div className="">
                    <div className="font-medium">
                      {getDocumentTypeLabel(item.type)}
                    </div>
                    <div className="text-[#6C6C89]">
                      {formatDate(item.date)}
                    </div>
                  </div>
                </div>
                {index < timeline.length - 1 && (
                  <Separator
                    orientation="vertical"
                    className="h-12 ml-[11px]"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-4 mt-4 lg:mt-8 lg:col-span-3">
          {/* Dynamic Timeline Cards */}
          {timeline.map((item, index) => (
            <div
              key={index}
              className="p-3 rounded-lg space-y-3 text-xs border-[1.5px] border-neutral-200"
            >
              <div className="flex justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-600"></div>
                  <div>
                    <h5 className="font-medium">
                      {getDocumentTypeLabel(item.type)}
                    </h5>
                    <div className="text-[#6C6C89] text-xs">
                      {user?.company?.name || "Ramesh PVT. LTD."}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`px-2 py-1 rounded-md text-xs ${
                    // Positive/Success statuses
                    item.details.status === "COMPLETED" || 
                    item.details.status === "APPROVED" ||
                    item.details.status === "DELIVERED" ||
                    item.details.status === "GRN_RECEIVED" ||
                    item.details.status === "GRN_APPROVED" ||
                    item.details.status === "GRN_COMPLETED"
                      ? "bg-[#EEFBF4] text-[#17663A]"
                      
                    // Warning/Pending statuses  
                    : item.details.status === "PENDING" || 
                      item.details.status === "IN_PROGRESS" ||
                      item.details.status === "SHIPPED" ||
                      item.details.status === "GRN_PENDING" ||
                      item.details.status === "GRN_IN_PROGRESS"
                      ? "bg-[#FFF9EB] text-[#8A6100]"
                      
                    // Caution/Partial statuses
                    : item.details.status === "PARTIALLY_RECEIVED" ||
                      item.details.status === "PARTIALLY_APPROVED" ||
                      item.details.status === "PARTIALLY_CANCELLED" ||
                      item.details.status === "PARTIALLY_REJECTED" ||
                      item.details.status === "GRN_PARTIALLY_RECEIVED" ||
                      item.details.status === "GRN_PARTIALLY_REJECTED" ||
                      item.details.status === "ON_HOLD" ||
                      item.details.status === "GRN_ON_HOLD"
                      ? "bg-[#FFF0E6] text-[#D46B08]"
                      
                    // Error/Negative statuses
                    : item.details.status === "CANCELLED" ||
                      item.details.status === "REJECTED" ||
                      item.details.status === "RETURNED" ||
                      item.details.status === "GRN_REJECTED" ||
                      item.details.status === "GRN_CANCELLED"
                      ? "bg-[#FFF1F0] text-[#CF1322]"
                      
                    // Default case
                    : "bg-gray-100 text-gray-600"
                  }`}>
                    {item.details.status || "N/A"}
                  </div>
                  <div className="text-xs text-[#6C6C89]">
                    {item.type === "INVOICE" 
                      ? formatDate(item.details.invoiceDate)
                      : formatDate(item.details.documentDate)}
                  </div>
                </div>
              </div>
              <div className="rounded-lg font-normal bg-[#F7F7F8] p-4 w-full flex gap-5 items-center">
                <img src="/icons/purchase.svg" alt="" className="w-10" />
                <div className="flex flex-col justify-between space-y-1 w-full">
                  <div>
                    {getDocumentTypeLabel(item.type)}:{" "}
                    <span className="text-[#7047EB] border-[#7047EB] border-b border-dashed">
                      {item.documentNumber}
                    </span>
                  </div>

                  <div className="flex justify-between items-end md:items-center w-full">
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 max-w-lg items-center md:gap-10 gap-2 w-full">
                      <div className="text-nowrap">
                        Number of Items:{" "}
                        <span className="font-medium">
                          {item.details.items?.length || 0}
                        </span>
                      </div>
                      {(item.type === "OC" ||
                        item.type === "PO" ||
                        item.type === "DC" ||
                        item.type === "INVOICE") && (
                        <div className="flex items-center gap-2">
                          Amount:{" "}
                          <span className="font-medium">
                            ₹{item.details.totalAmount}
                          </span>
                        </div>
                      )}

                      {item.type === "OC" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="text-xs p-0 w-fit">
                                View Order Details
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white text-neutral-800 border">
                              <div className="">
                                <div className="space-y-2 text-xs">
                                  <div>
                                    Document Number:{" "}
                                    {item.details.documentNumber || "N/A"}
                                  </div>
                                  <div>
                                    Title: {item.details.title || "N/A"}
                                  </div>
                                  <div>
                                    Place of Supply:{" "}
                                    {item.details.placeOfSupplyCity || "N/A"}
                                  </div>
                                  <div>
                                    Quotation Number:{" "}
                                    {item.details.quotationNumber || "N/A"}
                                  </div>
                                  <div>
                                    Quotation Date:{" "}
                                    {formatDate(item.details.quotationDate)}
                                  </div>
                                  <div>
                                    PO Number: {item.details.poNumber || "N/A"}
                                  </div>
                                  <div>
                                    PO Date: {formatDate(item.details.poDate)}
                                  </div>
                                  <div>
                                    Buyer:{" "}
                                    {item.details.buyer?.companyName || "N/A"}
                                  </div>
                                  <div>
                                    GST Number:{" "}
                                    {item.details.buyer?.gstNumber || "N/A"}
                                  </div>
                                  <div>
                                    Status: {item.details.status || "N/A"}
                                  </div>
                                  <div>
                                    Created By:{" "}
                                    {item.details.createdBy?.name || "N/A"}
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {item.type === "PO" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="text-xs p-0 w-fit">
                                View PO Details
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white text-neutral-800 border">
                              <div className="">
                                <div className="space-y-2 text-xs">
                                  <div>
                                    Document Number:{" "}
                                    {item.details.documentNumber || "N/A"}
                                  </div>
                                  <div>
                                    Title: {item.details.title || "N/A"}
                                  </div>
                                  <div>
                                    Place of Supply:{" "}
                                    {item.details.placeOfSupplyCity || "N/A"}
                                  </div>
                                  <div>
                                    OC Number: {item.details.ocNumber || "N/A"}
                                  </div>
                                  <div>
                                    OC Date: {formatDate(item.details.ocDate)}
                                  </div>
                                  <div>
                                    Indent Number:{" "}
                                    {item.details.indentNumber || "N/A"}
                                  </div>
                                  <div>
                                    Indent Date:{" "}
                                    {formatDate(item.details.indentDate)}
                                  </div>
                                  <div>
                                    Supplier:{" "}
                                    {item.details.supplier?.companyName ||
                                      "N/A"}
                                  </div>
                                  <div>
                                    GST Number:{" "}
                                    {item.details.supplier?.gstNumber || "N/A"}
                                  </div>
                                  <div>
                                    Status: {item.details.status || "N/A"}
                                  </div>
                                  <div>
                                    GRN Status:{" "}
                                    {item.details.grnStatus || "N/A"}
                                  </div>
                                  <div>
                                    Created By:{" "}
                                    {item.details.createdBy?.name || "N/A"}
                                  </div>
                                  <div>
                                    Signature: {item.details.signature || "N/A"}
                                  </div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {item.type === "DC" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="text-xs p-0 w-fit">
                                View Challan Details
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white text-neutral-800 border">
                              <div className="space-y-2 text-xs">
                                <div>
                                  Document Number:{" "}
                                  {item.details.documentNumber || "N/A"}
                                </div>
                                <div>
                                  Document Date:{" "}
                                  {formatDate(item.details.documentDate)}
                                </div>
                                <div>
                                  Transporter:{" "}
                                  {item.details.transporterName || "N/A"}
                                </div>
                                <div>
                                  GST Number:{" "}
                                  {item.details.transporterGstNumber || "N/A"}
                                </div>
                                <div>
                                  Vehicle Number:{" "}
                                  {item.details.vehicleNumber || "N/A"}
                                </div>
                                <div>
                                  Pay to Transporter:{" "}
                                  {item.details.payToTransporter || "N/A"}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {item.type === "INWARD" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="text-xs p-0 w-fit">
                                View Inward Details
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white text-neutral-800 border">
                              <div className="space-y-2 text-xs">
                                <div>
                                  Invoice: {item.details.invoice || "N/A"}
                                </div>
                                <div>
                                  Invoice Date:{" "}
                                  {formatDate(item.details.invoiceDate)}
                                </div>
                                <div>
                                  Delivery Challan:{" "}
                                  {item.details.deliveryChallanNumber || "N/A"}
                                </div>
                                <div>
                                  Delivery Date:{" "}
                                  {formatDate(item.details.deliveryDate)}
                                </div>
                                <div>
                                  Transporter:{" "}
                                  {item.details.transporterName || "N/A"}
                                </div>
                                <div>
                                  Vehicle Number:{" "}
                                  {item.details.vehicleNumber || "N/A"}
                                </div>
                                <div>
                                  Transport Doc:{" "}
                                  {item.details.transportationDocumentNumber ||
                                    "N/A"}
                                </div>
                                <div>
                                  Transport Doc Date:{" "}
                                  {formatDate(
                                    item.details.transportationDocumentDate
                                  )}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {item.type === "GRN" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="text-xs p-0 w-fit">
                                View GRN Details
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white text-neutral-800 border">
                              <div className="space-y-2 text-xs">
                                <div>
                                  Document Number:{" "}
                                  {item.details.documentNumber || "N/A"}
                                </div>
                                <div>
                                  Document Date:{" "}
                                  {formatDate(item.details.documentDate)}
                                </div>
                                <div>
                                  Delivery Date:{" "}
                                  {formatDate(item.details.deliveryDate)}
                                </div>
                                <div>
                                  GRN Status: {item.details.grnStatus || "N/A"}
                                </div>
                                <div>
                                  Amendment: {item.details.amendment || "N/A"}
                                </div>
                                <div>
                                  Remarks: {item.details.remark || "N/A"}
                                </div>
                                <div>
                                  Supplier:{" "}
                                  {item.details.supplier?.companyName || "N/A"}
                                </div>
                                <div>
                                  Created By:{" "}
                                  {item.details.createdBy?.name || "N/A"}
                                </div>
                                {item.details.purchaseInword && (
                                  <>
                                    <div className="font-medium mt-2">
                                      Inward Details:
                                    </div>
                                    <div>
                                      Invoice:{" "}
                                      {item.details.purchaseInword?.invoice ||
                                        "N/A"}
                                    </div>
                                    <div>
                                      Invoice Date:{" "}
                                      {formatDate(
                                        item.details.purchaseInword?.invoiceDate
                                      )}
                                    </div>
                                    <div>
                                      Delivery Challan:{" "}
                                      {item.details.purchaseInword
                                        ?.deliveryChallanNumber || "N/A"}
                                    </div>
                                    <div>
                                      Transporter:{" "}
                                      {item.details.purchaseInword
                                        ?.transporterName || "N/A"}
                                    </div>
                                    <div>
                                      Vehicle Number:{" "}
                                      {item.details.purchaseInword
                                        ?.vehicleNumber || "N/A"}
                                    </div>
                                  </>
                                )}
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {item.type === "INVOICE" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="text-xs p-0 w-fit">
                                View Invoice Details
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white text-neutral-800 border">
                              <div className="space-y-2 text-xs">
                                <div>
                                  Invoice Number: {item.details.invoiceNumber || "N/A"}
                                </div>
                                <div>
                                  Invoice Date: {formatDate(item.details.invoiceDate)}
                                </div>
                                <div>
                                  Place of Supply: {item.details.placeOfSupplyCity || "N/A"}
                                </div>
                                <div>
                                  PO Number: {item.details.poNumber || "N/A"}
                                </div>
                                <div>
                                  PO Date: {formatDate(item.details.poDate)}
                                </div>
                                <div>
                                  Buyer: {item.details.buyer?.companyName || "N/A"}
                                </div>
                                <div>
                                  GST Number: {item.details.buyer?.gstNumber || "N/A"}
                                </div>
                                <div>
                                  Payment Terms: {item.details.paymentTerms || "N/A"}
                                </div>
                                <div>
                                  Payment Method: {item.details.paymentMethod || "N/A"}
                                </div>
                                <div>
                                  Total Amount: ₹{item.details.totalAmount || "0.00"}
                                </div>
                                <div>
                                  Tax Amount: ₹{item.details.totalTaxAmount || "0.00"}
                                </div>
                                <div>
                                  Discount: ₹{item.details.totalDiscount || "0.00"}
                                </div>
                                <div>
                                  Status: {item.details.status || "N/A"}
                                </div>
                                <div>
                                  Created By: {item.details.createdBy?.name || "N/A"}
                                </div>
                                <div>
                                  Remark: {item.details.remark || "N/A"}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                    </div>
                    <div className="flex items-end h-full">
                      <div className="w-full flex justify-end items-end h-full">
                        {item.type === "OC" && (
                          <Button
                            onClick={() => handleCreateDC(item.id)}
                            variant="outline"
                            className="h-7 px-2 text-xs"
                          >
                            Create DC
                          </Button>
                        )}

                        {item.type === "DC" && (
                          <Button
                            onClick={() =>
                              navigate(
                                `/sales-purchase/delivery-challan-preview/${item.id}`
                              )
                            }
                            variant="outline"
                            className="h-7 px-2 text-xs"
                          >
                            View
                          </Button>
                        )}

                        {item.type === "INVOICE" && (
                          <Button
                            onClick={() =>
                              navigate(
                                `/sales-purchase/invoice-preview/${item.id}`
                              )
                            }
                            variant="outline"
                            className="h-7 px-2 text-xs"
                          >
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="block border border-dashed border-[#D1D1DB]" />
              <div className="flex text-[#0000ff] items-center gap-3 justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 pr-2 border-r border-[#6C6C89]">
                    <img
                      src="/icons/comment.svg"
                      className="w-5"
                      alt="Comments"
                    />
                    Comments: 0
                  </div>
                  <div>Attachments: {item.details.attachments ? "1" : "0"}</div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex items-center cursor-pointer text-[#7047EB] gap-1 pr-2">
                    <img
                      src="/icons/add-comment.svg"
                      className="w-5"
                      alt="Add comment"
                    />
                    <div className="hidden md:flex">Add Comment</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add the modal component */}
      <SelectBuyerModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onContinue={handleContinueBuyer}
      />
    </div>
  );
};

export default OrderConfirmationDetails;
