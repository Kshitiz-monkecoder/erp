import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import MainLayout from "./components/app/MainLayout";
import Dashboard from "./pages/Dashboard";
import LoginPage from "./pages/auth/LoginPage";
import RegisterPage from "./pages/auth/RegisterPage";
import OrganizationPage from "./pages/auth/OrganizationPage";
import BuyerAndSupplier from "./pages/BuyerAndSupplier";
import AddCompany from "./pages/AddCompany";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import { Toaster } from "sonner";
import BuyerAndSupplierDetails from "./pages/BuyerAndSupplierDetails";
import Production from "./pages/Production";
import ManualAdjustment from "./pages/ManualAdjustment";
import StoreApproval from "./pages/StoreApproval";
import SalesAndPurchase from "./pages/sales-purchase/SalesAndPurchase";
import OrdersLayout from "./components/app/OrdersLayout";
import PurchaseOrder from "./pages/sales-purchase/PurchaseOrder";
import ServiceOrder from "./pages/sales-purchase/ServiceOrder";
import OrderConfirmation from "./pages/sales-purchase/OrderConfirmation";
import ServiceConfirmation from "./pages/sales-purchase/ServiceConfirmation";
import TaxInvoice from "./pages/sales-purchase/TaxInvoice";
import AdhocInvoice from "./pages/sales-purchase/AdhocInvoice";
import PurchaseOrderDetails from "./pages/sales-purchase/PurchaseOrderDetails";
import PurchaseOrderPreview from "./pages/sales-purchase/PurchaseOrderPreview";
import CreateQuotation from "./pages/sales-purchase/CreateQuotation";
import CreateInword from "./pages/sales-purchase/CreateInword";
import CreateGRN from "./pages/sales-purchase/CreateGRN";
import SalesOrder from "./pages/sales-purchase/SalesOrder";
import CreateSalesEnquiry from "./pages/sales-purchase/CreateSalesEnquiry";
import SalesEnquiryPreview from "./pages/sales-purchase/SalesEnquiryPreview";
import DeliveryChallan from "./pages/sales-purchase/DeliveryChallan";
import OrderConfirmationPreview from "./pages/sales-purchase/OrderConfirmationPreview";
import OrderConfirmationDetails from "./pages/sales-purchase/OrderConfirmationDetails";
import DeliveryChallanPreview from "./pages/sales-purchase/DeliveryChallanPreview";
import Invoice from "./pages/sales-purchase/Invoice";
import InvoicePreview from "./pages/sales-purchase/InvoicePreview";
import Address from "./pages/Address";
import Inventory from "./pages/inventory/index";
import SingleItem from "./pages/inventory/SingleItem";
import CreateSalesQuotation from "./pages/sales-purchase/CreateSalesQuotation";
import PurchaseInvoice from "./pages/sales-purchase/PurchaseInvoice";
import InwardDocumentPreview from "./pages/inventory/InwardDocumentPreview";
import BOMDetails from "./components/app/modals/BOMDetails";
import BillOfMaterialTable from "./components/app/tables/production/BillOfMaterialTable";
import CreateBom from "./components/app/CreateBOM";
import CreateProductionOrder from "./components/app/tables/production/create-production-order";
import EditBOM from "./pages/bom-edit";
import ProcessDetails from "./pages/ProcessDeatils";
import UserManagement from "./pages/setting/UserManagement";
import Teams from "./pages/setting/TeamPage"; 


const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/organization" element={<OrganizationPage />} />
        
        <Route element={<ProtectedRoute />}>
          {/* Main Layout Routes (with sidebar) */}
          <Route path="/" element={<MainLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="buyers-suppliers" element={<BuyerAndSupplier />} />
            <Route path="addresses" element={<Address />} />
            {/* Might Change this :slug to other name in future */}
            <Route
              path="buyers-suppliers/:slug"
              element={<BuyerAndSupplierDetails />}
            />
            <Route path="add-company" element={<AddCompany />} />
            <Route path="inventory" element={<Inventory />} />
            <Route path="sales-purchase" element={<SalesAndPurchase />} />
            <Route
              path="sales-purchase/order-details/:id"
              element={<PurchaseOrderDetails />}
            />
            <Route
              path="sales-purchase/order-preview"
              element={<PurchaseOrderPreview />}
            />
            <Route
              path="sales-purchase/sales-enquiry-preview/:id"
              element={<SalesEnquiryPreview />}
            />
            <Route
              path="sales-purchase/order-confirmation/:id"
              element={<OrderConfirmationDetails />}
            />
            <Route
              path="sales-purchase/order-confirmation-preview/:id"
              element={<OrderConfirmationPreview />}
            />
            <Route
              path="sales-purchase/invoice-preview/:id"
              element={<InvoicePreview />}
            />
            <Route
              path="sales-purchase/delivery-challan-preview/:id"
              element={<DeliveryChallanPreview />}
            />
            <Route
              path="inventory/item-details/:id"
              element={<SingleItem />}
            />
            <Route
              path="inventory/manual-adjustment"
              element={<ManualAdjustment />}
            />
            <Route
              path="inventory/store-approval"
              element={<StoreApproval />}
            />
            <Route 
              path="inventory/inward-document-preview/:id" 
              element={<InwardDocumentPreview />} 
            />
            <Route path="production" element={<Production />} />
            <Route path="production/bom/:id" element={<BOMDetails />} />
            
            {/* ADD THESE INSIDE MainLayout TO SHOW WITH SIDEBAR */}
            <Route path="production/bom" element={<BillOfMaterialTable />} />
            <Route path="production/bom/create" element={<CreateBom />} />
            <Route path="/production/bom/edit/:id" element={<EditBOM />} />
            <Route path ="/production/process-details" element={<ProcessDetails/>}/>
            
            {/* ADD THIS TO MainLayout ROUTE GROUP */}
            <Route path="production/create-order" element={<CreateProductionOrder />} />

            {/* Settings*/}
            <Route path="settings/users" element={<UserManagement />} />
            <Route path="settings/teams" element={<Teams />} />
          </Route>
          
          {/* Orders Layout Routes (different layout) */}
          <Route path="/" element={<OrdersLayout />}>
            <Route
              path="sales-purchase/purchase-order"
              element={<PurchaseOrder />}
            />
            <Route path="sales-purchase/sales-order" element={<SalesOrder />} />
            <Route
              path="sales-purchase/purchase-quotation"
              element={<CreateQuotation />}
            />
            <Route
              path="sales-purchase/sales-quotation"
              element={<CreateSalesQuotation />}
            />
            <Route
              path="sales-purchase/purchase-inword/:id"
              element={<CreateInword />}
            />
            <Route
              path="sales-purchase/purchase-grn/:id"
              element={<CreateGRN />}
            />
            <Route
              path="sales-purchase/sales-enquiry"
              element={<CreateSalesEnquiry />}
            />
            <Route
              path="sales-purchase/service-order"
              element={<ServiceOrder />}
            />
            <Route
              path="sales-purchase/order-confirmation"
              element={<OrderConfirmation />}
            />
            <Route
              path="sales-purchase/delivery-challan/:id"
              element={<DeliveryChallan />}
            />
            <Route
              path="sales-purchase/invoice/:id"
              element={<Invoice />}
            />
            <Route
              path="sales-purchase/purchase-invoice/:id"
              element={<PurchaseInvoice />}
            />
            <Route
              path="sales-purchase/service-confirmation"
              element={<ServiceConfirmation />}
            />
            <Route path="sales-purchase/tax-invoice" element={<TaxInvoice />} />
            <Route
              path="sales-purchase/adhoc-invoice"
              element={<AdhocInvoice />}
            />
          </Route>
        </Route>

        <Route path="*" element={<div>Not Found</div>} />
      </Routes>
      <Toaster position="top-center" />
    </BrowserRouter>
  );
};

export default App;