import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { ArrowLeft } from "lucide-react";
import { useLocation, useNavigate } from "react-router";

interface NavbarProps {
  isLargeScreen: boolean;
  setIsLargeScreen: (arg: boolean) => void;
}

const Navbar: React.FC<NavbarProps> = ({ isLargeScreen, setIsLargeScreen }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const location = useLocation();
  const navigateTo = useNavigate();

  useEffect(() => {
    function handleResize() {
      const isLarge = window.innerWidth > 1024;
      setIsLargeScreen(isLarge);
      setIsOpen(isLarge);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [setIsLargeScreen]);

  // Helper function to get page title based on path
  const getPageTitle = () => {
    if (location.pathname === "/") return "Hello Yash";
    
    // Settings routes - all show "Settings" with back arrow
    if (location.pathname.startsWith("/settings")) {
      return (
        <div className="flex items-center gap-2">
          {/* <ArrowLeft
            className="text-[#8A8AA3] cursor-pointer w-5 h-5 sm:w-6 sm:h-6"
            onClick={() => navigateTo(-1)}
          /> */}
          Settings
        </div>
      );
    }
    
    // Other existing routes
    if (location.pathname === "/buyers-suppliers" || location.pathname.startsWith("/buyers-suppliers/")) {
      return (
        <div className="flex items-center gap-2">
          {/* <ArrowLeft
            className="text-[#8A8AA3] cursor-pointer w-5 h-5 sm:w-6 sm:h-6"
            onClick={() => navigateTo(-1)}
          /> */}
          Buyers & Suppliers
        </div>
      );
    }
    
    if (location.pathname === "/add-company") {
      return (
        <div className="flex items-center gap-2" onClick={() => navigateTo(-1)}>
          <ArrowLeft className="text-[#8A8AA3] cursor-pointer w-5 h-5 sm:w-6 sm:h-6" />
          Add Company
        </div>
      );
    }
    
    if (location.pathname === "/inventory") {
      return <div className="flex items-center gap-2">Inventory</div>;
    }
    
    if (location.pathname.startsWith("/inventory/item-details/")) {
      return (
        <div className="flex items-center gap-2" onClick={() => navigateTo(-1)}>
          <ArrowLeft className="text-[#8A8AA3] cursor-pointer w-5 h-5 sm:w-6 sm:h-6" />
          Item Details
        </div>
      );
    }
    
    if (location.pathname.startsWith("/inventory/store-approval")) {
      return (
        <div className="flex items-center gap-2" onClick={() => navigateTo(-1)}>
          <ArrowLeft className="text-[#8A8AA3] cursor-pointer w-5 h-5 sm:w-6 sm:h-6" />
          <span className="font-medium">Store Entry/Issue Approval</span> IAP00005{" "}
          <span className="text-xs bg-green-50 py-1 text-green-600 font-normal px-2 rounded-full">
            Approved
          </span>
        </div>
      );
    }
    
    if (location.pathname.startsWith("/inventory/manual-adjustment")) {
      const stockMovement = JSON.parse(
        localStorage.getItem("selectedStockMovement") || "{}"
      );
      const documentNumber = stockMovement.documentNumber || "";
      const status = stockMovement.status || "";
      
      let colorClasses = "bg-gray-100 text-gray-600";
      if (status === "APPROVED") colorClasses = "bg-green-50 text-green-600";
      else if (status === "PENDING") colorClasses = "bg-yellow-50 text-yellow-600";
      else if (status === "REJECTED") colorClasses = "bg-red-50 text-red-600";
      
      return (
        <div className="flex items-center gap-2" onClick={() => navigateTo(-1)}>
          <ArrowLeft className="text-[#8A8AA3] cursor-pointer w-5 h-5 sm:w-6 sm:h-6" />
          MAJ00{documentNumber}{" "}
          <span className={`text-xs py-1 font-normal px-2 rounded-full ${colorClasses}`}>
            {status}
          </span>
        </div>
      );
    }
    
    if (location.pathname === "/sales-purchase") {
      return (
        <div className="flex items-center gap-2" onClick={() => navigateTo(-1)}>
          {/* <ArrowLeft className="text-[#8A8AA3] cursor-pointer w-5 h-5 sm:w-6 sm:h-6" /> */}
          Sales & Purchase
        </div>
      );
    }
    
    if (location.pathname === "/sales-purchase/order-details") {
      return (
        <div className="flex items-center gap-2" onClick={() => navigateTo(-1)}>
          <ArrowLeft className="text-[#8A8AA3] cursor-pointer w-5 h-5 sm:w-6 sm:h-6" />
          Purchase Order{" "}
          <span className="hidden md:flex -ml-1">for Raw Material</span>
        </div>
      );
    }
    
    const firstSegment = location.pathname.split("/")[1];

switch (firstSegment) {
  case "production":
    return <div onClick={() => navigateTo(-1)}>Production</div>;

  case "reports":
    return <div onClick={() => navigateTo(-1)}>Reports & Intelligence</div>;

  case "resource-planning":
    return <div onClick={() => navigateTo(-1)}>Resource Planning</div>;

  default:
    return null;
}
    
    // Default empty
    return "";
  };

  return (
    <nav
      className={`h-12 fixed z-50 bg-white flex items-center w-full pb-2 border-b ${
        isLargeScreen ? "pl-[240px]" : ""
      }`}
    >
      <Sidebar
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        isLargeScreen={isLargeScreen}
      />
      <div className="flex text-sm md:text-base items-center justify-between w-full py-3 px-6">
        <div className="font-bold">
          {getPageTitle()}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;