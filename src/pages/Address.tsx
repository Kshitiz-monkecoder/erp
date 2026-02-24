import React, { useState, useEffect } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import UniversalTable from "@/components/app/tables";
import { get } from "@/lib/apiService";
import ErrorToast from "@/components/app/toasts/ErrorToast";
import AddLocationsModal from "@/components/app/modals/AddLocationsModal";
import { MapPin, Building2 } from "lucide-react";

// Address/Location interface
interface Address {
  id: number;
  companyName: string;
  locationName: string;
  gstinType: string;
  address1: string;
  address2?: string;
  city: string;
  postalCode: string;
  gstin?: string | null;
  isBillingSame: boolean;
  billingAddressName: string;
  addressType: "billing" | "shipping" | "warehouse";
  createdAt: string;
  updatedAt: string;
  client: {
    id: number;
    name: string;
    email: string;
    clientType: string;
    companyName: string;
    companyEmail: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    country: string;
    pincode: string;
    phoneNo: string;
    gstNumber: string;
    gstType: string;
    gstVerified: boolean;
    companyReferenceCode: string;
    createdAt: string;
    updatedAt: string;
  };
}

const Address: React.FC = () => {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addressType, setAddressType] = useState<"billing" | "shipping">(
    "billing"
  );

  // Fetch addresses
  const fetchAddresses = async () => {
    setIsLoading(true);
    try {
      const response = await get("/locations");
      if (response?.status) {
        setAddresses(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching addresses:", error);
      ErrorToast({
        title: "Error",
        description: "Failed to fetch addresses",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  // Handle add address with type selection
  const handleAddAddress = (type: "billing" | "shipping") => {
    setAddressType(type);
    setShowAddModal(true);
  };

  // Table columns configuration
  const columns: ColumnDef<Address>[] = [
    {
      header: "Location Name",
      accessorKey: "locationName",
      cell: ({ row }) => (
        <div className="flex items-center gap-2 min-w-40">
          <MapPin className="w-4 h-4 text-blue-500" />
          <div>
            <div className="font-medium">{row.getValue("locationName")}</div>
            <div className="text-xs text-gray-500">
              {row.original.companyName}
            </div>
          </div>
        </div>
      ),
    },
    {
      header: "Address",
      accessorKey: "address1",
      cell: ({ row }) => (
        <div className="min-w-60">
          <div className="font-normal">{row.getValue("address1")}</div>
          {row.original.address2 && (
            <div className="text-sm text-gray-600">{row.original.address2}</div>
          )}
          <div className="text-sm text-gray-600">
            {row.original.city}
          </div>
          <div className="text-sm text-gray-600">
            {row.original.client?.state}, {row.original.client?.country} - {row.original.postalCode}
          </div>
        </div>
      ),
    },
    {
      header: "Type",
      accessorKey: "addressType",
      cell: ({ row }) => {
        const type = row.getValue("addressType") as string;
        const typeColors = {
          billing: "bg-blue-100 text-blue-800",
          shipping: "bg-green-100 text-green-800",
          warehouse: "bg-purple-100 text-purple-800",
        };
        return (
          <Badge
            className={`capitalize ${
              typeColors[type as keyof typeof typeColors] ||
              "bg-gray-100 text-gray-800"
            }`}
          >
            {type}
          </Badge>
        );
      },
    },
    {
      header: "GSTIN",
      accessorKey: "gstin",
      cell: ({ row }) => (
        <div className="font-mono text-sm min-w-32">
          {row.getValue("gstin") || "-"}
        </div>
      ),
    },
    // Client column removed
  ];

  // Custom filter section - removed client search
  const customFilterSection = (table: any) => (
    <>
      <div className="flex xl:mt-5 items-end">
        <input
          placeholder="Search locations..."
          value={
            (table.getColumn("locationName")?.getFilterValue() as string) ?? ""
          }
          onChange={(event) =>
            table.getColumn("locationName")?.setFilterValue(event.target.value)
          }
          className="h-8 w-full md:w-[250px] px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div className="flex xl:mt-5 items-end">
        <select
          value={(table.getColumn("addressType")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("addressType")?.setFilterValue(event.target.value || undefined)
          }
          className="h-8 w-full md:w-[150px] px-3 rounded-md border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">All Types</option>
          <option value="billing">Billing</option>
          <option value="shipping">Shipping</option>
          <option value="warehouse">Warehouse</option>
        </select>
      </div>
      {/* Client search bar removed */}
    </>
  );

  // Empty state configuration
  const emptyStateConfig = {
    icon: "/icons/location.svg",
    title: "No Addresses Found",
    description:
      "Start by adding your first address location to manage your business operations efficiently.",
    showCreateButton: true,
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <Building2 className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
            Address Management
          </h1>
        </div>
        <p className="text-gray-600">
          Manage all your business locations, warehouses, and delivery addresses
          in one place.
        </p>
      </div>

      {/* Universal Table */}
      <UniversalTable
        data={addresses}
        columns={columns}
        isLoading={isLoading}
        enableFiltering={true}
        enablePagination={true}
        enableCreate={true}
        createButtonText="Add Address"
        onCreateClick={() => handleAddAddress("billing")}
        emptyStateConfig={emptyStateConfig}
        customFilterSection={customFilterSection}
        searchColumn="locationName"
        className="bg-white rounded-lg shadow-sm"
      />

      {/* Add Location Modal */}
      {showAddModal && (
        <AddLocationsModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          addressType={addressType}
          onLocationAdded={() => {
            setShowAddModal(false);
            fetchAddresses();
          }}
        />
      )}
    </div>
  );
};

export default Address;