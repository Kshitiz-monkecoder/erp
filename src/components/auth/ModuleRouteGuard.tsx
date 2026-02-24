import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePermissions } from "../../contexts/PermissionContext";

interface ModuleRouteGuardProps {
  children: React.ReactElement;
}

const ModuleRouteGuard: React.FC<ModuleRouteGuardProps> = ({ children }) => {
  const location = useLocation();
  const { isModuleAccessible } = usePermissions();

  // Define which routes are always accessible (no permission check needed)
  const publicProtectedRoutes = [
    "/", // Dashboard
    "/settings/my-permissions",
  ];

  // Define route to module mapping
  const routeToModuleMap: Record<string, string> = {
    // Buyers and Suppliers module
    "/buyers-suppliers": "Buyers and Suppliers",
    "/buyers-suppliers/:slug": "Buyers and Suppliers",
    "/addresses": "Buyers and Suppliers",
    "/add-company": "Buyers and Suppliers",
    
    // Inventory module
    "/inventory": "Inventory",
    "/inventory/item-details/:id": "Inventory",
    "/inventory/manual-adjustment": "Inventory",
    "/inventory/store-approval": "Inventory",
    "/inventory/inward-document-preview/:id": "Inventory",
    
    // Sales & Purchase module
    "/sales-purchase": "Sales & Purchase",
    "/sales-purchase/order-details/:id": "Sales & Purchase",
    "/sales-purchase/order-preview": "Sales & Purchase",
    "/sales-purchase/sales-enquiry-preview/:id": "Sales & Purchase",
    "/sales-purchase/order-confirmation/:id": "Sales & Purchase",
    "/sales-purchase/order-confirmation-preview/:id": "Sales & Purchase",
    "/sales-purchase/invoice-preview/:id": "Sales & Purchase",
    "/sales-purchase/delivery-challan-preview/:id": "Sales & Purchase",
    
    // Orders Layout routes (Sales & Purchase module)
    "/sales-purchase/purchase-order": "Sales & Purchase",
    "/sales-purchase/sales-order": "Sales & Purchase",
    "/sales-purchase/purchase-quotation": "Sales & Purchase",
    "/sales-purchase/sales-quotation": "Sales & Purchase",
    "/sales-purchase/purchase-inword/:id": "Sales & Purchase",
    "/sales-purchase/purchase-grn/:id": "Sales & Purchase",
    "/sales-purchase/sales-enquiry": "Sales & Purchase",
    "/sales-purchase/service-order": "Sales & Purchase",
    "/sales-purchase/order-confirmation": "Sales & Purchase",
    "/sales-purchase/delivery-challan/:id": "Sales & Purchase",
    "/sales-purchase/invoice/:id": "Sales & Purchase",
    "/sales-purchase/purchase-invoice/:id": "Sales & Purchase",
    "/sales-purchase/service-confirmation": "Sales & Purchase",
    "/sales-purchase/tax-invoice": "Sales & Purchase",
    "/sales-purchase/adhoc-invoice": "Sales & Purchase",
    
    // Production module
    "/production": "Production",
    "/production/bom/:id": "Production",
    "/production/bom": "Production",
    "/production/bom/create": "Production",
    "/production/bom/edit/:id": "Production",
    "/production/process-details": "Production",
    "/production/create-order": "Production",
    
    // Settings modules
    "/settings/users": "User Management",
    "/settings/teams": "Teams Management",
  };

  // Function to match dynamic routes (with parameters)
  const getModuleForRoute = (pathname: string): string | null => {
    // Check exact match first
    if (routeToModuleMap[pathname]) {
      return routeToModuleMap[pathname];
    }
    
    // Check for dynamic routes
    for (const [routePattern, module] of Object.entries(routeToModuleMap)) {
      if (routePattern.includes(":")) {
        // Convert route pattern to regex
        const pattern = routePattern.replace(/:[^/]+/g, "([^/]+)");
        const regex = new RegExp(`^${pattern}$`);
        
        if (regex.test(pathname)) {
          return module;
        }
      }
    }
    
    return null;
  };

  // Get current route's module
  const currentModule = getModuleForRoute(location.pathname);

  // If route is in public list, allow access
  if (publicProtectedRoutes.includes(location.pathname)) {
    return children;
  }

  // If no module mapping found for this route, allow access (for safety)
  if (!currentModule) {
    console.warn(`No module mapping found for route: ${location.pathname}`);
    return children;
  }

  // Check if user has access to the module
  if (!isModuleAccessible(currentModule as any)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return children;
};

export default ModuleRouteGuard;