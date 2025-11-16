import React, { useEffect, useState } from "react";
import Sidebar from "./Sidebar";
import { ArrowLeft } from "lucide-react";
// import { Button } from "../ui/button";
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
      <div className="flex text-sm md:text-base items-center justify-between w-full py-3 ml-8 pr-8">
        <div className="font-bold">
          {location.pathname === "/" ? (
            "Hello Yash"
          ) : location.pathname === "/buyers-suppliers" ||
            location.pathname.startsWith("/buyers-suppliers/") ? (
            <div className="flex items-center gap-2">
              <ArrowLeft
                className="text-[#8A8AA3] cursor-pointer w-5 h-5 sm:w-6 sm:h-6"
                onClick={() => navigateTo(-1)}
              />
              Buyers & Suppliers
            </div>
          ) : location.pathname === "/add-company" ? (
            <div
              className="flex items-center gap-2"
              onClick={() => navigateTo(-1)}
            >
              <ArrowLeft className="text-[#8A8AA3] cursor-pointer w-5 h-5 sm:w-6 sm:h-6" />
              Add Company
            </div>
          ) : location.pathname === "/inventory" ? (
            <div className="flex items-center gap-2">Item Master</div>
          ) : location.pathname.startsWith("/inventory/item-details/") ? (
            <div
              className="flex items-center gap-2"
              onClick={() => navigateTo(-1)}
            >
              <ArrowLeft className="text-[#8A8AA3] cursor-pointer w-5 h-5 sm:w-6 sm:h-6" />
              Item Details
            </div>
          ) : location.pathname.startsWith("/inventory/store-approval") ? (
            <div
              className="flex items-center gap-2"
              onClick={() => navigateTo(-1)}
            >
              <ArrowLeft className="text-[#8A8AA3] cursor-pointer w-5 h-5 sm:w-6 sm:h-6" />
              <span className="font-medium">Store Entry/Issue Approval</span>{" "}
              IAP00005{" "}
              <span className="text-xs bg-green-50 py-1 text-green-600 font-normal px-2 rounded-full">
                Approved
              </span>
            </div>
          ) : location.pathname.startsWith("/inventory/manual-adjustment") ? (
            <div
              className="flex items-center gap-2"
              onClick={() => navigateTo(-1)}
            >
              <ArrowLeft className="text-[#8A8AA3] cursor-pointer w-5 h-5 sm:w-6 sm:h-6" />
              MAJ00
              {
                JSON.parse(
                  localStorage.getItem("selectedStockMovement") || "{}",
                ).documentNumber
              }{" "}
              {(() => {
                const status =
                  JSON.parse(
                    localStorage.getItem("selectedStockMovement") || "{}",
                  ).status || "";
                let colorClasses = "bg-gray-100 text-gray-600";
                if (status === "APPROVED")
                  colorClasses = "bg-green-50 text-green-600";
                else if (status === "PENDING")
                  colorClasses = "bg-yellow-50 text-yellow-600";
                else if (status === "REJECTED")
                  colorClasses = "bg-red-50 text-red-600";
                return (
                  <span
                    className={`text-xs py-1 font-normal px-2 rounded-full ${colorClasses}`}
                  >
                    {status}
                  </span>
                );
              })()}
            </div>
          ) : location.pathname === "/sales-purchase" ? (
            <div
              className="flex items-center gap-2"
              onClick={() => navigateTo(-1)}
            >
              <ArrowLeft className="text-[#8A8AA3] cursor-pointer w-5 h-5 sm:w-6 sm:h-6" />
              Sales & Purchase
            </div>
          ) : location.pathname === "/sales-purchase/order-details" ? (
            <div
              className="flex items-center gap-2"
              onClick={() => navigateTo(-1)}
            >
              <ArrowLeft className="text-[#8A8AA3] cursor-pointer w-5 h-5 sm:w-6 sm:h-6" />
              Purchase Order{" "}
              <span className="hidden md:flex -ml-1">for Raw Material</span>
            </div>
          ) : location.pathname.includes("production") ? (
            <div
              className="flex items-center gap-2"
              onClick={() => navigateTo(-1)}
            >
              Production
            </div>
          ) : (
            ""
          )}
        </div>
        {/* <div className="flex items-center gap-4">
          <Button className="bg-[#7047EB] h-8 text-sm hover:opacity-95 duration-150 transition-all ease-in-out hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2">
            <PlusIcon className="" />
            <span className="hidden md:flex">Add New</span>
          </Button>

         
          
        </div> */}
      </div>
    </nav>
  );
};

export default Navbar;
