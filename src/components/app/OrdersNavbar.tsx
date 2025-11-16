import { useLocation, useNavigate } from "react-router";
import { Button } from "../ui/button";
import { X } from "lucide-react";

const OrdersNavbar = () => {
  const { pathname } = useLocation();
  const navigateTo = useNavigate();
  return (
    <nav className="fixed p-4 md:px-8 py-4 z-50 bg-white flex items-center w-full border-b">
      <div className="flex justify-between items-center w-full">
        <div className="font-semibold">
          {pathname.split("/")[2] === "purchase-order"
            ? "Purchase Order"
            : pathname.split("/")[2] === "service-order"
            ? "Service Order"
            : pathname.split("/")[2] === "sales-order"
            ? "Sales Order"
            : pathname.split("/")[2] === "purchase-quotation"
            ? "Quotation"
            : pathname.split("/")[2] === "purchase-inword"
            ? "Inword"
            : pathname.split("/")[2] === "purchase-grn"
            ? "GRN"
            : pathname.split("/")[2] === "order-confirmation"
            ? "Order Confirmation"
            : pathname.split("/")[2] === "service-confirmation"
            ? "Service Confirmation"
            : pathname.split("/")[2] === "sales-enquiry"
            ? "Sales Enquiry"
            : pathname.split("/")[2] === "delivery-challan"
            ? "Delivery Challan"
            : "Sales & Purchase"}
        </div>
        <div className="flex items-center gap-2">
          {/* <Button
            variant="outline"
            className="shadow-none h-8 w-8 border border-gray-400"
          >
            <Minus className="text-[#8A8AA3]" />
          </Button>
          <Button
            variant="outline"
            className="shadow-none h-8 w-8 border border-gray-400"
          >
            <Minimize className="text-[#8A8AA3]" />
          </Button> */}
          <Button
            variant="outline"
            onClick={() => navigateTo(-1)}
            className="shadow-none hidden md:flex h-8 text-sm md:px-2.5 border border-gray-400"
          >
            <X className="text-[#8A8AA3]" />
            <span className="hidden md:flex">Close</span>
          </Button>
          {/* <Button variant="secondary" className="shadow-none text-sm h-8">
            <span className="hidden md:flex">Save as</span>
            <span className="md:hidden">Draft</span>
            <span className="hidden md:flex -ml-1">draft</span>
          </Button>
          <Button className="shadow-none text-sm h-8 bg-[#7047EB] hover:bg-[#7047EB] hover:opacity-95 duration-200 ease-out transition-all">
            Save
          </Button> */}
        </div>
      </div>
    </nav>
  );
};

export default OrdersNavbar;
