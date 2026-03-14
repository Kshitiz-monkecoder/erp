import React, { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./contexts/AuthContext";
import { PermissionProvider } from "./contexts/PermissionContext";

// ── Eagerly loaded (tiny, needed on first paint / auth flow) ──────────────────
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ModuleRouteGuard from "./components/auth/ModuleRouteGuard";
import MainLayout from "./components/app/MainLayout";
import OrdersLayout from "./components/app/OrdersLayout";

// ── Auth pages ────────────────────────────────────────────────────────────────
const LoginPage               = lazy(() => import("./pages/auth/LoginPage"));
const RegisterPage            = lazy(() => import("./pages/auth/RegisterPage"));
const OrganizationPage        = lazy(() => import("./pages/auth/OrganizationPage"));
const JoinTeamPage            = lazy(() => import("./pages/auth/JoinTeamPage"));
const Unauthorized            = lazy(() => import("./pages/unauthorized"));

// ── Core app pages ────────────────────────────────────────────────────────────
const Dashboard               = lazy(() => import("./pages/Dashboard"));
const BuyerAndSupplier        = lazy(() => import("./pages/BuyerAndSupplier"));
const BuyerAndSupplierDetails = lazy(() => import("./pages/BuyerAndSupplierDetails"));
const AddCompany              = lazy(() => import("./pages/AddCompany"));
const Address                 = lazy(() => import("./pages/Address"));

// ── Inventory ─────────────────────────────────────────────────────────────────
const Inventory               = lazy(() => import("./pages/inventory/index"));
const SingleItem              = lazy(() => import("./pages/inventory/SingleItem"));
const ManualAdjustment        = lazy(() => import("./pages/ManualAdjustment"));
const StoreApproval           = lazy(() => import("./pages/StoreApproval"));
const InwardDocumentPreview   = lazy(() => import("./pages/inventory/InwardDocumentPreview"));

// ── Sales & Purchase ──────────────────────────────────────────────────────────
const SalesAndPurchase        = lazy(() => import("./pages/sales-purchase/SalesAndPurchase"));
const PurchaseOrderDetails    = lazy(() => import("./pages/sales-purchase/PurchaseOrderDetails"));
const PurchaseOrderPreview    = lazy(() => import("./pages/sales-purchase/PurchaseOrderPreview"));
const SalesEnquiryPreview     = lazy(() => import("./pages/sales-purchase/SalesEnquiryPreview"));
const OrderConfirmationDetails= lazy(() => import("./pages/sales-purchase/OrderConfirmationDetails"));
const OrderConfirmationPreview= lazy(() => import("./pages/sales-purchase/OrderConfirmationPreview"));
const InvoicePreview          = lazy(() => import("./pages/sales-purchase/InvoicePreview"));
const DeliveryChallanPreview  = lazy(() => import("./pages/sales-purchase/DeliveryChallanPreview"));

// ── Sales & Purchase – order-layout pages ────────────────────────────────────
const PurchaseOrder           = lazy(() => import("./pages/sales-purchase/PurchaseOrder"));
const SalesOrder              = lazy(() => import("./pages/sales-purchase/SalesOrder"));
const CreateQuotation         = lazy(() => import("./pages/sales-purchase/CreateQuotation"));
const CreateSalesQuotation    = lazy(() => import("./pages/sales-purchase/CreateSalesQuotation"));
const CreateInword            = lazy(() => import("./pages/sales-purchase/CreateInword"));
const CreateGRN               = lazy(() => import("./pages/sales-purchase/CreateGRN"));
const CreateSalesEnquiry      = lazy(() => import("./pages/sales-purchase/CreateSalesEnquiry"));
const ServiceOrder            = lazy(() => import("./pages/sales-purchase/ServiceOrder"));
const OrderConfirmation       = lazy(() => import("./pages/sales-purchase/OrderConfirmation"));
const DeliveryChallan         = lazy(() => import("./pages/sales-purchase/DeliveryChallan"));
const Invoice                 = lazy(() => import("./pages/sales-purchase/Invoice"));
const PurchaseInvoice         = lazy(() => import("./pages/sales-purchase/PurchaseInvoice"));
const ServiceConfirmation     = lazy(() => import("./pages/sales-purchase/ServiceConfirmation"));
const TaxInvoice              = lazy(() => import("./pages/sales-purchase/TaxInvoice"));
const AdhocInvoice            = lazy(() => import("./pages/sales-purchase/AdhocInvoice"));

// ── Production ────────────────────────────────────────────────────────────────
const Production              = lazy(() => import("./pages/Production"));
const BillOfMaterialTable     = lazy(() => import("./components/app/tables/production/BillOfMaterialTable"));
const CreateBom               = lazy(() => import("./components/app/CreateBOM"));
const EditBOM                 = lazy(() => import("./pages/bom-edit"));
const BOMDetails              = lazy(() => import("./components/app/modals/BOMDetails"));
const ProcessDetails          = lazy(() => import("./pages/ProcessDeatils"));
const CreateProductionOrder   = lazy(() => import("./components/app/tables/production/create-production-order"));

// ── Reports & Resource Planning ───────────────────────────────────────────────
const Reports                 = lazy(() => import("./pages/reports/page"));
const ResourcePlanning        = lazy(() => import("./pages/reports/resource-planning/ResourcePlanning"));

// ── Settings ─────────────────────────────────────────────────────────────────
const UserManagement          = lazy(() => import("./pages/setting/UserManagement"));
const Teams                   = lazy(() => import("./pages/setting/TeamPage"));
const MyPermissionsPage       = lazy(() => import("./components/app/modals/MyPermissions"));

// ── Shared loading fallback ───────────────────────────────────────────────────
const PageLoader = () => (
  <div className="flex h-screen w-full items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
  </div>
);

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PermissionProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/login"        element={<LoginPage />} />
              <Route path="/register"     element={<RegisterPage />} />
              <Route path="/organization" element={<OrganizationPage />} />
              <Route path="/join"         element={<JoinTeamPage />} />
              <Route path="/unauthorized" element={<Unauthorized />} />

              <Route element={<ProtectedRoute />}>
                {/* ── Main Layout (with sidebar) ───────────────────────── */}
                <Route
                  path="/"
                  element={
                    <ModuleRouteGuard>
                      <MainLayout />
                    </ModuleRouteGuard>
                  }
                >
                  <Route index element={<Dashboard />} />

                  {/* Buyers & Suppliers */}
                  <Route path="buyers-suppliers"       element={<BuyerAndSupplier />} />
                  <Route path="buyers-suppliers/:slug" element={<BuyerAndSupplierDetails />} />
                  <Route path="addresses"              element={<Address />} />
                  <Route path="add-company"            element={<AddCompany />} />

                  {/* Inventory */}
                  <Route path="inventory"                           element={<Inventory />} />
                  <Route path="inventory/item-details/:id"          element={<SingleItem />} />
                  <Route path="inventory/manual-adjustment"         element={<ManualAdjustment />} />
                  <Route path="inventory/store-approval"            element={<StoreApproval />} />
                  <Route path="inventory/inward-document-preview/:id" element={<InwardDocumentPreview />} />

                  {/* Sales & Purchase – overview + detail views */}
                  <Route path="sales-purchase"                              element={<SalesAndPurchase />} />
                  <Route path="sales-purchase/order-details/:id"           element={<PurchaseOrderDetails />} />
                  <Route path="sales-purchase/order-preview"               element={<PurchaseOrderPreview />} />
                  <Route path="sales-purchase/sales-enquiry-preview/:id"   element={<SalesEnquiryPreview />} />
                  <Route path="sales-purchase/order-confirmation/:id"      element={<OrderConfirmationDetails />} />
                  <Route path="sales-purchase/order-confirmation-preview/:id" element={<OrderConfirmationPreview />} />
                  <Route path="sales-purchase/invoice-preview/:id"         element={<InvoicePreview />} />
                  <Route path="sales-purchase/delivery-challan-preview/:id" element={<DeliveryChallanPreview />} />

                  {/* Production */}
                  <Route path="production"               element={<Production />} />
                  <Route path="production/bom"           element={<BillOfMaterialTable />} />
                  <Route path="production/bom/create"    element={<CreateBom />} />
                  <Route path="production/bom/edit/:id"  element={<EditBOM />} />
                  <Route path="production/bom/:id"       element={<BOMDetails />} />
                  <Route path="production/process-details" element={<ProcessDetails />} />
                  <Route path="production/create-order"  element={<CreateProductionOrder />} />

                  {/* Reports */}
                  <Route path="/reports"     element={<Reports />} />
                  <Route path="/reports/:id" element={<Reports />} />

                  {/* Resource Planning */}
                  <Route path="/resource-planning"     element={<ResourcePlanning />} />
                  <Route path="/resource-planning/:id" element={<ResourcePlanning />} />

                  {/* Settings */}
                  <Route path="settings/users"          element={<UserManagement />} />
                  <Route path="settings/teams"          element={<Teams />} />
                  <Route path="settings/my-permissions" element={<MyPermissionsPage />} />
                </Route>

                {/* ── Orders Layout (different layout) ────────────────── */}
                <Route
                  path="/"
                  element={
                    <ModuleRouteGuard>
                      <OrdersLayout />
                    </ModuleRouteGuard>
                  }
                >
                  <Route path="sales-purchase/purchase-order"        element={<PurchaseOrder />} />
                  <Route path="sales-purchase/sales-order"           element={<SalesOrder />} />
                  <Route path="sales-purchase/purchase-quotation"    element={<CreateQuotation />} />
                  <Route path="sales-purchase/sales-quotation"       element={<CreateSalesQuotation />} />
                  <Route path="sales-purchase/purchase-inword/:id"   element={<CreateInword />} />
                  <Route path="sales-purchase/purchase-grn/:id"      element={<CreateGRN />} />
                  <Route path="sales-purchase/sales-enquiry"         element={<CreateSalesEnquiry />} />
                  <Route path="sales-purchase/service-order"         element={<ServiceOrder />} />
                  <Route path="sales-purchase/order-confirmation"    element={<OrderConfirmation />} />
                  <Route path="sales-purchase/delivery-challan/:id"  element={<DeliveryChallan />} />
                  <Route path="sales-purchase/invoice/:id"           element={<Invoice />} />
                  <Route path="sales-purchase/purchase-invoice/:id"  element={<PurchaseInvoice />} />
                  <Route path="sales-purchase/service-confirmation"  element={<ServiceConfirmation />} />
                  <Route path="sales-purchase/tax-invoice"           element={<TaxInvoice />} />
                  <Route path="sales-purchase/adhoc-invoice"         element={<AdhocInvoice />} />
                </Route>
              </Route>

              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Suspense>
          <Toaster position="top-center" richColors />
        </PermissionProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;