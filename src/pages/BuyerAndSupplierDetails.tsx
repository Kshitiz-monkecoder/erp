import React from "react";
import { useParams } from "react-router-dom";
import { Mail, Pencil, PhoneCall, Plus, Trash } from "lucide-react";
import EditDetailsModal from "@/components/app/modals/EditDetailsModal";
import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import AddLocationsModal from "@/components/app/modals/AddLocationsModal";
import { Button } from "@/components/ui/button";
import DeleteBuyerSupplierModal from "@/components/app/modals/DeleteBuyerSupperModal";
import { get } from "@/lib/apiService";
import { useNavigate } from "react-router-dom";

const BuyerAndSupplierDetails: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();

  // Modal states for adding locations
  const [showBillingModal, setShowBillingModal] = React.useState(false);
  const [showShippingModal, setShowShippingModal] = React.useState(false);

  // Update the Location interface to match API response
  interface Location {
    id: number;
    locationName: string;
    companyName: string;
    address1: string;
    address2: string;
    city: string;
    gstin: string;
    gstinType: string;
    postalCode: string;
    isBillingSame: boolean;
    billingAddressName: string;
    addressType: string;
    createdAt: string;
    updatedAt: string;
    // Note: API response doesn't have 'country' field
  }

  const [billingLocations, setBillingLocations] = React.useState<Location[]>([]);
  const [shippingLocations, setShippingLocations] = React.useState<Location[]>([]);

  // Add loading states
  const [isBillingLoading, setIsBillingLoading] = React.useState<boolean>(true);
  const [isShippingLoading, setIsShippingLoading] = React.useState<boolean>(true);
  const [isCompanyLoading, setIsCompanyLoading] = React.useState<boolean>(true);

  const { slug } = useParams<{ slug: string }>();
  console.log("Slug from URL:", slug);

  // Update to fetch company data from API instead of localStorage
  const [companyData, setCompanyData] = React.useState<any>(null);
  const [showDeleteModal, setShowDeleteModal] = React.useState<boolean>(false);

  // Fetch company data from API
  const fetchCompanyData = async () => {
    setIsCompanyLoading(true);
    try {
      // First check if we have an ID from localStorage
      const storedData = localStorage.getItem("currentB&S");
      let companyId;
      
      if (storedData) {
        const parsedData = JSON.parse(storedData);
        companyId = parsedData.id;
        console.log("Found company ID from localStorage:", companyId);
      } else if (slug) {
        // Try to extract ID from slug
        companyId = slug;
        console.log("Using slug as company ID:", companyId);
      }
      
      if (companyId) {
        const response = await get(`/client/${companyId}`);
        console.log("Company API response:", response);
        
        if (response?.data) {
          setCompanyData(response.data);
          // Update localStorage with fresh data
          localStorage.setItem("currentB&S", JSON.stringify(response.data));
        }
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
      // Fallback to localStorage data if API fails
      const storedData = localStorage.getItem("currentB&S");
      if (storedData) {
        setCompanyData(JSON.parse(storedData));
      }
    } finally {
      setIsCompanyLoading(false);
    }
  };

  const fetchShippingLocations = async () => {
    if (!companyData?.id) return;
    
    setIsShippingLoading(true);
    try {
      const response = await get(`/agent/locations/${companyData.id}?type=shipping`);
      console.log("Shipping locations API response:", response);
      
      if (response?.data) {
        setShippingLocations(response.data);
      } else {
        setShippingLocations([]);
      }
    } catch (error) {
      console.error("Error fetching shipping locations:", error);
      setShippingLocations([]);
    } finally {
      setIsShippingLoading(false);
    }
  };

  const fetchBillingLocations = async () => {
    if (!companyData?.id) return;
    
    setIsBillingLoading(true);
    try {
      const response = await get(`/agent/locations/${companyData.id}?type=billing`);
      console.log("Billing locations API response:", response);
      
      if (response?.data) {
        setBillingLocations(response.data);
      } else {
        setBillingLocations([]);
      }
    } catch (error) {
      console.error("Error fetching billing locations:", error);
      setBillingLocations([]);
    } finally {
      setIsBillingLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanyData();
  }, [slug]);

  useEffect(() => {
    if (companyData?.id) {
      fetchShippingLocations();
      fetchBillingLocations();
    }
  }, [companyData?.id]);

  // Handle successful location addition
  const handleLocationAdded = (
    newLocation: any,
    type: "billing" | "shipping"
  ) => {
    if (type === "billing") {
      setBillingLocations((prev) => [...prev, newLocation]);
    } else {
      setShippingLocations((prev) => [...prev, newLocation]);
    }
  };

  const toggleDeleteModal = () => setShowDeleteModal((prev) => !prev);

  // Show loading state while fetching company data
  if (isCompanyLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <LoaderCircle className="animate-spin w-8 h-8 text-[#7047EB]" />
        <span className="ml-3">Loading company details...</span>
      </div>
    );
  }

  // Show error state if no company data
  if (!companyData) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <div className="text-lg text-gray-600 mb-4">No company data found</div>
        <Button onClick={() => navigate("/buyers-suppliers")}>
          Go Back to List
        </Button>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-gray-100 flex items-center justify-between gap-2 h-18 px-8 py-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full cursor-pointer shadow-none">
            <img src="/nav-avatar.png" alt="" className="rounded-full w-10 h-10" />
          </div>
          <div className="text-sm">
            <div className="font-medium">{companyData?.companyName}</div>
            <p className="text-neutral-500 text-xs">
              {companyData?.companyEmail}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-xs sm:text-sm rounded-full text-green-700 px-3 border border-green-400 bg-green-50">
            {companyData?.clientType}
          </div>
          <Button size="icon" variant="outline" onClick={toggleDeleteModal}>
            <Trash className="w-4.5 h-4.5 text-red-700 cursor-pointer" />
          </Button>
        </div>
      </div>

      {/* Company details */}
      <div className="p-5 space-y-4">
        {/* Primary Company Details */}
        <div className="px-3 py-2 text-sm flex items-center justify-between bg-gray-400/10 text-gray-400 font-normal">
          <div>PRIMARY COMPANY DETAILS</div>
          <div
            onClick={() => setIsOpen(true)}
            className="flex text-xs underline cursor-pointer underline-offset-2 text-[#7047EB] items-center gap-2"
          >
            <Pencil className="w-3 h-3" />
            Edit Details
          </div>
        </div>
        <div className="grid text-xs sm:grid-cols-3 gap-2 px-3 py-2">
          <div className="space-y-1">
            <div className="font-medium">Company Name</div>
            <div className="text-xs">{companyData?.companyName}</div>
          </div>
          <div className="space-y-1">
            <div className="font-medium">Mobile Number</div>
            <div className="text-xs">+91 {companyData?.phoneNo}</div>
          </div>
          <div className="space-y-1">
            <div className="font-medium">GST Number</div>
            <div className="text-xs">{companyData?.gstNumber || "N/A"}</div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="px-3 py-2 text-sm flex items-center justify-between bg-gray-400/10 text-gray-400 font-normal">
          <div>CONTACT DETAILS</div>
        </div>
        <div className="text-xs px-3 py-2">
          <div className="space-y-2">
            <div className="text-sm flex items-center gap-1 font-semibold">
              {companyData?.name}
            </div>
            <div className="text-xs flex items-center gap-6">
              <div className="flex items-center gap-1">
                <PhoneCall className="text-gray-400 w-3 h-3" /> +91{" "}
                {companyData?.phoneNo}
              </div>
              <div className="flex items-center gap-1">
                <Mail className="text-gray-400 w-3 h-3" /> {companyData?.email}
              </div>
            </div>
          </div>
        </div>

        {/* Billing addresses */}
        <div className="px-3 py-2 text-sm flex items-center justify-between bg-gray-400/10 text-gray-400 font-normal">
          <div>BILLING ADDRESSES</div>
          <div
            onClick={() => setShowBillingModal(true)}
            className="flex text-xs underline cursor-pointer underline-offset-2 text-[#7047EB] items-center gap-2"
          >
            <Plus className="w-3 h-3" />
            Add Billing Addresses
          </div>
        </div>
        <div className="grid text-xs sm:grid-cols-3 gap-2 px-3 py-2">
          {/* Primary billing address from company data */}
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="font-medium text-sm">Primary Address</div>
              <div className="font-medium">{companyData?.companyName}</div>
              <p className="text-xs">
                {companyData?.addressLine1},<br />
                {companyData?.addressLine2 && `${companyData.addressLine2},`}<br />
                {companyData?.city}, {companyData?.state}<br />
                {companyData?.country} - {companyData?.pincode}
              </p>
              <div className="text-xs text-gray-500 mt-1">
                GST: {companyData?.gstNumber || "N/A"}
              </div>
            </div>
          </div>

          {/* Additional billing locations from API */}
          {isBillingLoading ? (
            <div className="flex justify-center items-center">
              <LoaderCircle className="animate-spin w-5 h-5" />
            </div>
          ) : billingLocations.length > 0 ? (
            billingLocations.map((location) => (
              <div key={location.id} className="space-y-2">
                <div className="space-y-1">
                  <div className="font-medium text-sm">
                    {location?.locationName || "Billing Location"}
                  </div>
                  <div className="font-medium">{location?.companyName}</div>
                  <p className="text-xs">
                    {location?.address1},<br />
                    {location?.address2 && `${location.address2},`}<br />
                    {location?.city} - {location?.postalCode}
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    GST: {location?.gstin || "N/A"} ({location?.gstinType})
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex justify-center items-center text-gray-500 text-sm">
              No additional billing addresses
            </div>
          )}
        </div>

        {/* Delivery Location */}
        <div className="px-3 py-2 text-sm flex items-center justify-between bg-gray-400/10 text-gray-400 font-normal">
          <div>DELIVERY LOCATIONS</div>
          <div
            onClick={() => setShowShippingModal(true)}
            className="flex text-xs underline cursor-pointer underline-offset-2 text-[#7047EB] items-center gap-2"
          >
            <Plus className="w-3 h-3" />
            Add Delivery Location
          </div>
        </div>
        <div className="grid text-xs sm:grid-cols-3 gap-2 px-3 py-2">
          {/* Primary shipping address from company data */}
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="font-medium text-sm">Primary Address</div>
              <div className="font-medium">{companyData?.companyName}</div>
              <p className="text-xs">
                {companyData?.addressLine1},<br />
                {companyData?.addressLine2 && `${companyData.addressLine2},`}<br />
                {companyData?.city}, {companyData?.state}<br />
                {companyData?.country} - {companyData?.pincode}
              </p>
            </div>
          </div>

          {/* Additional shipping locations from API */}
          {isShippingLoading ? (
            <div className="flex justify-center items-center">
              <LoaderCircle className="animate-spin w-5 h-5" />
            </div>
          ) : shippingLocations.length > 0 ? (
            shippingLocations.map((location) => (
              <div key={location.id} className="space-y-2">
                <div className="space-y-1">
                  <div className="font-medium text-sm">
                    {location.locationName || "Shipping Location"}
                  </div>
                  <div className="font-medium">{location.companyName}</div>
                  <p className="text-xs">
                    {location.address1},<br />
                    {location.address2 && `${location.address2},`}<br />
                    {location.city} - {location.postalCode}
                  </p>
                  <div className="text-xs text-gray-500 mt-1">
                    GST: {location.gstin || "N/A"} ({location.gstinType})
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex justify-center items-center text-gray-500 text-sm">
              No additional shipping addresses
            </div>
          )}
        </div>

        {/* Edit Details Modal */}
        <EditDetailsModal
          id={companyData?.id}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            // Refresh company data after successful edit
            fetchCompanyData();
            setIsOpen(false);
          }}
          setCompanyData={setCompanyData}
        />

        {/* Add Billing Location Modal */}
        <AddLocationsModal
          isOpen={showBillingModal}
          onClose={() => setShowBillingModal(false)}
          onLocationAdded={(location) =>
            handleLocationAdded(location, "billing")
          }
          clientId={companyData?.id}
          addressType="billing"
        />

        {/* Add Shipping Location Modal */}
        <AddLocationsModal
          isOpen={showShippingModal}
          onClose={() => setShowShippingModal(false)}
          onLocationAdded={(location) =>
            handleLocationAdded(location, "shipping")
          }
          clientId={companyData?.id}
          addressType="shipping"
        />
        
        <DeleteBuyerSupplierModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          clientId={companyData?.id}
          onSuccess={() => {
            navigate("/buyers-suppliers?tab=all");
          }}
        />
      </div>
    </div>
  );
};

export default BuyerAndSupplierDetails;