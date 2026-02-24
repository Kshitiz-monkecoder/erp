import { Outlet } from "react-router";
import { useState, useEffect } from "react";
import Navbar from "./Navbar";
import { get } from "@/lib/apiService";
import { usePermissions } from "../../contexts/PermissionContext"; 

const decodeJWT = (token: any) => {
  if (!token) return null;

  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const decodedData = atob(base64);
    return JSON.parse(decodedData);
  } catch (e) {
    console.error("Failed to decode JWT:", e);
    return null;
  }
};

const MainLayout = () => {
  const [isLargeScreen, setIsLargeScreen] = useState(window.innerWidth >= 1024);
  const { setPermissions } = usePermissions();

  useEffect(() => {
    function handleResize() {
      setIsLargeScreen(window.innerWidth >= 1024);
    }

    window.addEventListener("resize", handleResize);

    const token = localStorage.getItem("token");
    const decoded = decodeJWT(token);
    if (decoded) {
      console.log("Decoded JWT:", decoded);
    }
    localStorage.setItem("user", JSON.stringify(decoded));

    get("/profile")
      .then((data) => {
        localStorage.setItem("User", JSON.stringify(data?.data));
        
        // Save permissions to context and localStorage
        if (data?.data?.team?.permissions) {
          setPermissions(data.data.team.permissions);
          localStorage.setItem('userPermissions', JSON.stringify(data.data.team.permissions));
        }
      })
      .catch((error) => console.error("Error fetching profile:", error));

    return () => window.removeEventListener("resize", handleResize);
  }, [setPermissions]);

  return (
    <main className="min-h-screen">
      <header className="flex flex-col w-full">
        <div className="w-full fixed top-0 bg-white p-2 z-10">
          <Navbar
            isLargeScreen={isLargeScreen}
            setIsLargeScreen={setIsLargeScreen}
          />
        </div>
      </header>
      <div
        className={`flex-1 w-full mt-[3.4rem] ${isLargeScreen ? "pl-[240px]" : ""}`}
      >
        <Outlet />
      </div>
    </main>
  );
};

export default MainLayout;