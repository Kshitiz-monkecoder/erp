import React from "react";
import { useParams } from "react-router-dom";
import { Mail, Pencil, PhoneCall, Plus, Trash } from "lucide-react";
import EditDetailsModal from "@/components/app/modals/EditDetailsModal";
import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import AddLocationsModal from "@/components/app/modals/AddLocationsModal";
import { Button } from "@/components/ui/button";
import DeleteBuyerSupplierModal from "@/components/app/modals/DeleteBuyerSupperModal";
import {get} from "@/lib/apiService"; // Assuming you have a get function to fetch data
const BuyerAndSupplierDetails: React.FC = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  // Modal states for adding locations
  const [showBillingModal, setShowBillingModal] = React.useState(false);
  const [showShippingModal, setShowShippingModal] = React.useState(false);

  interface Location {
    id: string;
    locationName: string;
    companyName: string;
    address1: string;
    address2: string;
    city: string;
    country: string;
    postalCode: string;
  }

  const [billingLocations, setBillingLocations] = React.useState<Location[]>(
    [],
  );
  const [shippingLocations, setShippingLocations] = React.useState<Location[]>(
    [],
  );

  // Add loading states
  const [isBillingLoading, setIsBillingLoading] = React.useState<boolean>(true);
  const [isShippingLoading, setIsShippingLoading] =
    React.useState<boolean>(true);

  const { slug } = useParams<{ slug: string }>();
  console.log(slug);

  const [companyData, setCompanyData] = React.useState(() =>
    JSON.parse(localStorage.getItem("currentB&S") || "{}"),
  );
  const [showDeleteModal, setShowDeleteModal] = React.useState<boolean>(false);

  const fetchShippingLocations = async () => {
    setIsShippingLoading(true);
    try {
      
      const data = await get(
        `/agent/locations/${companyData.id}?type=shipping`
      );
      console.log(data);
      setShippingLocations(data.data || []);
    } catch (error) {
      console.error("Error fetching company data:", error);
      setShippingLocations([]);
    } finally {
      setIsShippingLoading(false);
    }
  };

  const fetchBillingLocations = async () => {
    setIsBillingLoading(true);
    try {
      
      const data = await get(`/agent/locations/${companyData.id}?type=billing`);
      console.log(data);
      setBillingLocations(data.data || []);
    } catch (error) {
      console.error("Error fetching billing locations:", error);
      setBillingLocations([]);
    } finally {
      setIsBillingLoading(false);
    }
  };

  useEffect(() => {
    fetchShippingLocations();
    fetchBillingLocations();
  }, [slug]);

  // Handle successful location addition
  const handleLocationAdded = (
    newLocation: any,
    type: "billing" | "shipping",
  ) => {
    if (type === "billing") {
      setBillingLocations((prev) => [...prev, newLocation]);
    } else {
      setShippingLocations((prev) => [...prev, newLocation]);
    }
  };

  const toggleDeleteModal = () => setShowDeleteModal((prev) => !prev);
  return (
    <div>
      <div className="bg-gray-100 flex items-center justify-between gap-2 h-18 px-8 py-4">
        <div className="flex items-center gap-2">
          <div className="rounded-full cursor-pointer shadow-none">
            <img src="/nav-avatar.png" alt="" className="rounded-full" />
          </div>
          <div className="text-sm">
            <div>{companyData?.companyName}</div>
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
          {/* <div className="space-y-1">
            <div className="font-medium">TCS</div>
            <div className="text-xs">None</div>
          </div> */}
          <div className="space-y-1">
            <div className="font-medium">Mobile Number</div>
            <div className="text-xs">+91 {companyData?.phoneNo}</div>
          </div>
        </div>

        {/* Contact Details */}
        <div className="px-3 py-2 text-sm flex items-center justify-between bg-gray-400/10 text-gray-400 font-normal">
          <div>CONTACT DETAILS</div>
          {/* <div className="flex text-xs underline cursor-pointer underline-offset-2 text-[#7047EB] items-center gap-2">
            <Plus className="w-3 h-3" />
            Additional Contact Details
          </div> */}
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
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="font-medium text-sm">
                {companyData?.locationName}
              </div>
              <div className="font-medium">{companyData?.companyName}</div>
              <p>
                {companyData?.addressLine1},<br />
                {companyData?.addressLine2},<br />
                {companyData?.state},<br />
                {companyData?.country} {companyData?.pincode}
              </p>
            </div>
          </div>

          {/* Fixed billing locations logic */}
          {isBillingLoading ? (
            <div className="flex justify-center items-center">
              <LoaderCircle className="animate-spin" />
            </div>
          ) : billingLocations.length > 0 ? (
            billingLocations.map((location) => (
              <div key={location.id} className="space-y-2">
                <div className="space-y-1">
                  <div className="font-medium text-sm">
                    {location?.locationName}
                  </div>
                  <div className="font-medium">{location?.companyName}</div>
                  <p>
                    {location?.address1},<br />
                    {location?.address2},<br />
                    {location?.city}, {location?.country} {location?.postalCode}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex justify-center items-center text-gray-500 text-sm"></div>
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
          <div className="space-y-2">
            <div className="space-y-1">
              <div className="font-medium text-sm">
                {companyData?.locationName}
              </div>
              <div className="font-medium">{companyData?.companyName}</div>
              <p>
                {companyData?.addressLine1},<br />
                {companyData?.addressLine2},<br />
                {companyData?.state},<br />
                {companyData?.country}, {companyData?.pincode}
              </p>
            </div>
          </div>

          {/* Fixed shipping locations logic */}
          {isShippingLoading ? (
            <div className="flex justify-center items-center">
              <LoaderCircle className="animate-spin" />
            </div>
          ) : shippingLocations.length > 0 ? (
            shippingLocations.map((location) => (
              <div key={location.id} className="space-y-2">
                <div className="space-y-1">
                  <div className="font-medium text-sm">
                    {location.locationName}
                  </div>
                  <div className="font-medium">{location.companyName}</div>
                  <p>
                    {location.address1},<br />
                    {location.address2},<br />
                    {location.city}, {location.country}, {location.postalCode}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="flex justify-center items-center text-gray-500 text-sm"></div>
          )}
        </div>

        {/* Opening Balance */}
        {/* <div className="px-3 py-2 text-sm bg-gray-400/10 text-gray-400 font-normal">
          OPENING BALANCE
        </div>
        <div className="grid text-xs sm:grid-cols-3 md:grid-cols-4 gap-2 px-3 py-2">
          <div className="space-y-2">
            <div className="font-medium">Net Payables:</div>
            <div>₹5,000</div>
          </div>
          <div className="space-y-2">
            <div className="font-medium">Net Receivables:</div>
            <div>₹3,000</div>
          </div>
        </div> */}

        {/* Edit Details Modal */}
        <EditDetailsModal
          id={companyData?.id}
          isOpen={isOpen}
          onClose={() => setIsOpen(false)}
          onSuccess={() => {
            // Optionally refresh data after successful edit
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
          onClose={() => setShowDeleteModal((prev) => !prev)}
        />
      </div>
    </div>
  );
};

export default BuyerAndSupplierDetails;
