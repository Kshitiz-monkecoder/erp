import React, { useState } from "react";
import { useRef, useEffect } from "react";
import { Menu, ChevronDown, ChevronUp, LogOut } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import clsx from "clsx";
import {
  SalesAndPurchaseSubLinks,
  InventorySubLinks,
  BuyersAndSuppliersSubLinks,
  ProductionSubLinks,
  settingSubLinks,
} from "@/lib/subnavLinks";
import {get} from "../../lib/apiService"; // Adjust the import path as necessary
interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (arg: boolean | ((prev: boolean) => boolean)) => void;
  isLargeScreen: boolean;
}

interface IMenuLink {
  icon: string;
  name: string;
  link: string;
  nestedLinks?: Omit<IMenuLink, "icon">[];
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
  const tab = searchParams.get("tab"); // extracting tab vlaue here to higlight current nested value

  const menuLinks: IMenuLink[] = [
    {
      icon: "/sidebar/dashboard.svg",
      name: "Dashboard",
      nestedLinks: [],
      link: "/",
    },
    {
      icon: "/sidebar/clipboard.svg",
      name: "Sales & Purchase",
      nestedLinks: [...SalesAndPurchaseSubLinks],
      link: "/sales-purchase",
    },
    {
      icon: "/sidebar/inventory.svg",
      name: "Inventory",
      nestedLinks: [...InventorySubLinks],
      link: "/inventory",
    },
    {
      icon: "/sidebar/production.svg",
      name: "Production",
      nestedLinks: [...ProductionSubLinks],
      link: "/production",
    },
    {
      icon: "/sidebar/buyer.svg",
      name: "Buyers and Suppliers",
      nestedLinks: [...BuyersAndSuppliersSubLinks],
      link: "/buyers-suppliers",
    },
    {
      icon: "/sidebar/location.svg",
      name: "Addresses",
      nestedLinks: [],
      link: "/addresses",
    },
    {
      icon: "/sidebar/settings.svg",
      name: "Settings",
      nestedLinks: [...settingSubLinks],
      link: "#",
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
      const res = await get("/logout")
      if (!res.status) {
        console.warn("Logout request failed:", await res.text());
      }
    } catch (err) {
      console.error("Network error while logging out:", err);
    } finally {
      localStorage.removeItem("token");
      navigateTo("/login");
    }
  };

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
          {menuLinks.map((menu, _) => {
            return (
              <div
                className="font-light text-white cursor-pointer"
                key={menu.link}
              >
                {(menu.nestedLinks?.length ?? 0 > 0) ? (
                  <div className="flex flex-col">
                    <div
                      className="flex items-center gap-2 hover:bg-white/8 duration-200 ease-out transition-all rounded-md p-2"
                      onClick={() => handleNestedLinkClick(menu.name)}
                    >
                      <img src={menu.icon} alt={menu.name} className="w-6" />
                      <div className="flex text-sm w-full justify-between items-center">
                        {menu.name}
                        {(menu.nestedLinks?.length ?? 0) > 0 && (
                          <>
                            {showNestedLinks &&
                            activeNestedMenu === menu.name ? (
                              <ChevronUp className="text-white w-5" />
                            ) : (
                              <ChevronDown className="text-white w-5" />
                            )}
                          </>
                        )}
                      </div>
                    </div>
                    {showNestedLinks && activeNestedMenu === menu.name && (
  <div className="flex flex-col text-sm gap-1 mt-1">
    {menu.nestedLinks?.map((nestedLink: any) => {
      return (
        <Link
          key={nestedLink.link || nestedLink.name} // ADD THIS KEY PROP
          to={nestedLink.link}
          className={clsx(
            "px-4 text-white/70 hover:text-white py-2 pl-10 hover:bg-white/8 duration-200 ease-out transition-all rounded-md p-2",
            {
              "bg-white/8":
                tab ===
                new URLSearchParams(
                  nestedLink.link.split("?")[1],
                ).get("tab"),
            },
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
                      },
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
