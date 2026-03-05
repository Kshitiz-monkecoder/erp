import React, { useState } from "react";
import { useRef, useEffect } from "react";
import { Menu, ChevronDown,  LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import clsx from "clsx";
import {
  SalesAndPurchaseSubLinks,
  InventorySubLinks,
  BuyersAndSuppliersSubLinks,
  ProductionSubLinks,
  settingSubLinks,
  ReportsSubLinks,
  ResourcePlanningSubLinks
} from "@/lib/subnavLinks";
import { get } from "../../lib/apiService";
import { usePermissions } from "../../contexts/PermissionContext";

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (arg: boolean | ((prev: boolean) => boolean)) => void;
  isLargeScreen: boolean;
}

interface IMenuLink {
  icon: string;
  name: string;
  link: string;
  nestedLinks?: any[];
  module: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  isLargeScreen,
  isOpen,
  setIsOpen,
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [showNestedLinks, setShowNestedLinks] = useState<boolean>(false);
  const [activeNestedMenu, setActiveNestedMenu] = useState<string>("");
  const navigateTo = useNavigate();
  const searchParams = new URLSearchParams(window.location.search);
  const tab = searchParams.get("tab");
  
  const { isModuleAccessible } = usePermissions();

  // Define menu links with exact module mapping
  const menuLinks: IMenuLink[] = [
    {
      icon: "/sidebar/dashboard.svg",
      name: "Dashboard",
      nestedLinks: [],
      link: "/",
      module: "Dashboard",
    },
    {
      icon: "/sidebar/clipboard.svg",
      name: "Sales & Purchase",
      nestedLinks: SalesAndPurchaseSubLinks,
      link: "/sales-purchase",
      module: "Sales & Purchase",
    },
    {
      icon: "/sidebar/inventory.svg",
      name: "Inventory",
      nestedLinks: InventorySubLinks,
      link: "/inventory",
      module: "Inventory",
    },
    {
      icon: "/sidebar/production.svg",
      name: "Production",
      nestedLinks: ProductionSubLinks,
      link: "/production",
      module: "Production",
    },
    {
      icon: "/sidebar/buyer.svg",
      name: "Buyers and Suppliers",
      nestedLinks: BuyersAndSuppliersSubLinks,
      link: "/buyers-suppliers",
      module: "Buyers and Suppliers",
    },
    {
      icon: "/sidebar/location.svg",
      name: "Addresses",
      nestedLinks: [],
      link: "/addresses",
      module: "Buyers and Suppliers", // Addresses is part of Buyers and Suppliers module
    },
    
    {
  icon: "/sidebar/reports.svg",
  name: "Reports & Intelligence",
  nestedLinks: ReportsSubLinks,
  link: "/reports",
  module: "Buyers and Suppliers",    // Using Buyers and Suppliers module for now since we don't have a separate Reports module in permissions. Adjust as needed when implementing permissions for Reports.
},
{
  icon: "/sidebar/resource-planning.svg",
  name: "Resource Planning",
  nestedLinks: ResourcePlanningSubLinks,
  link: "/resource-planning",
  module: "Buyers and Suppliers",
},
    {
      icon: "/sidebar/settings.svg",
      name: "Settings",
      nestedLinks: settingSubLinks,
      link: "#",
      module: "Settings",
    },
  ];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node) &&
        !isLargeScreen
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [setIsOpen, isLargeScreen]);

  const toggleSidebar = () => {
    if (!isLargeScreen) {
      setIsOpen((prev) => !prev);
    }
  };

  const handleNestedLinkClick = (link: string) => {
    if (link !== activeNestedMenu && link !== "") {
      setShowNestedLinks(false);
    }
    setActiveNestedMenu(link);
    setShowNestedLinks((prev) => !prev);
  };

  const handleLogout = async () => {
    try {
      const res = await get("/logout");
      if (!res.status) {
        console.warn("Logout request failed:", await res.text());
      }
    } catch (err) {
      console.error("Network error while logging out:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("User");
      localStorage.removeItem("userPermissions");
      navigateTo("/login");
    }
  };

  // Check if any settings item is accessible
  const isSettingsAccessible = React.useMemo(() => {
    // First check if Settings module itself is accessible
    if (isModuleAccessible("Settings")) {
      return true;
    }
    
    // Then check individual settings items
    return settingSubLinks.some(link => {
      if (link.name === "User Management") {
        return isModuleAccessible("User Management");
      }
      if (link.name === "Teams") {
        return isModuleAccessible("Teams Management");
      }
      if (link.name === "My Permissions") {
        return true; // Always accessible for logged in users
      }
      return false;
    });
  }, [isModuleAccessible]);

  // Filter menu links based on permissions
  const filteredMenuLinks = menuLinks.filter((menu) => {
    // If no module specified, show it
    if (!menu.module) return true;
    
    // For Settings, use the special check
    if (menu.name === "Settings") {
      return isSettingsAccessible;
    }
    
    // Check if module is accessible
    return isModuleAccessible(menu.module as any);
  });

  return (
    <>
      {!isLargeScreen && !isOpen && (
        <div className="fixed top-0 left-0 z-[1000] p-2 pt-[15px]">
          <Menu
            className="text-neutral-900 cursor-pointer"
            onClick={toggleSidebar}
          />
        </div>
      )}
      {isOpen && !isLargeScreen && (
        <div className="fixed inset-0 bg-black/10 z-50 transition-opacity duration-300" />
      )}
      <div
        ref={sidebarRef}
        className={`shadow-right fixed top-0 left-0 h-screen flex flex-col bg-[#105076] z-50 transition-transform duration-300 ease-in-out w-[240px] transform ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="border-b-2 flex items-center justify-between gap-2 border-white/10 p-4">
          <div className="rounded-full cursor-pointer shadow-none">
            <img src="/nav-avatar.png" alt="" className="rounded-full" />
          </div>
          <div className="cursor-pointer">
            <div className="text-white font-light text-sm">Benco & Company</div>
            <div className="text-white/50 text-xs">Admin</div>
          </div>
          <ChevronDown className="text-white w-5 ml-2" />
        </div>
        <div className="p-2 flex flex-col gap-1">
          {filteredMenuLinks.map((menu, index) => {
            return (
              <div
                className="font-light text-white cursor-pointer"
                key={`${menu.link}-${index}`}
              >
                {menu.nestedLinks && menu.nestedLinks.length > 0 ? (
                  <div className="flex flex-col">
                    <div
                      className="flex items-center gap-2 hover:bg-white/8 duration-200 ease-out transition-all rounded-md p-2"
                      onClick={() => handleNestedLinkClick(menu.name)}
                    >
                      <img src={menu.icon} alt={menu.name} className="w-6" />
                      <div className="flex text-sm w-full justify-between items-center">
                        {menu.name}
                        <ChevronDown
                          className={`text-white w-5 transition-transform duration-200 ${
                            showNestedLinks && activeNestedMenu === menu.name
                              ? "rotate-180"
                              : ""
                          }`}
                        />
                      </div>
                    </div>
                    {showNestedLinks && activeNestedMenu === menu.name && (
                      <div className="flex flex-col text-sm gap-1 mt-1">
                        {menu.nestedLinks.map((nestedLink: any, nestedIndex: number) => {
                          // Filter nested links based on permissions
                          if (menu.name === "Settings") {
                            if (nestedLink.name === "User Management" && 
                                !isModuleAccessible("User Management")) {
                              return null;
                            }
                            if (nestedLink.name === "Teams" && 
                                !isModuleAccessible("Teams Management")) {
                              return null;
                            }
                            // My Permissions is always accessible
                          }
                          
                          // For other modules, show all nested links if parent module is accessible
                          return (
                            <Link
                              key={`${nestedLink.link}-${nestedIndex}`}
                              to={nestedLink.link}
                              className={clsx(
                                "px-4 text-white/70 hover:text-white py-2 pl-10 hover:bg-white/8 duration-200 ease-out transition-all rounded-md",
                                {
                                  "bg-white/8 text-white":
                                    tab === new URLSearchParams(nestedLink.link.split("?")[1]).get("tab"),
                                }
                              )}
                            >
                              {nestedLink.name}
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    to={menu.link}
                    className={clsx(
                      "flex items-center gap-2 text-white font-light p-2 hover:bg-white/8 duration-200 ease-out transition-all rounded-md",
                      {
                        "bg-white/8": menu.link === window.location.pathname,
                      }
                    )}
                  >
                    <img src={menu.icon} alt={menu.name} className="w-6" />
                    <div className="flex text-sm w-full justify-between items-center">
                      {menu.name}
                    </div>
                  </Link>
                )}
              </div>
            );
          })}
        </div>
        <button
          onClick={handleLogout}
          className="mt-auto flex m-2 mb-8 px-4 items-center gap-2 text-white font-light p-2 hover:bg-white/8 duration-200 transition-all rounded-md"
        >
          <LogOut className="w-5" />
          Logout
        </button>
      </div>
    </>
  );
};

export default Sidebar;