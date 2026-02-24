import { Button } from "@/components/ui/button";
import clsx from "clsx";
import React, { useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import BuyersAndSuppliersTable from "@/components/app/tables/BuyersAndSuppliersTable";
import { useEffect, useState } from "react";
import { formatDate } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { get } from "@/lib/apiService";

// Define Tag type to match BuyersAndSuppliersTable
type Tag = {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

// Define Item type to match BuyersAndSuppliersTable
type Item = {
  id: string;
  tags: Tag[];  // Changed from string[] to Tag[]
  companyName: string;
  companyAddress: string;
  category: string;
  contactNumber: string;
  addedDate: string;
};

// Define API response types
type ClientFromAPI = {
  id: number;
  name: string;
  email: string;
  clientType: string;
  companyName: string;
  companyEmail: string;
  addressLine1: string;
  city: string;
  state: string;
  country: string;
  gstVerified: boolean;
  phoneNo: string;
  gstNumber: string;
  gstType: string;
  addressLine2: string;
  pincode: string;
  companyReferenceCode: string;
  createdAt: string;
  updatedAt: string;
  tags: Tag[];
};

const BuyerAndSupplier: React.FC = () => {
  const [updatedItems, setUpdatedItems] = useState<Item[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isEmpty, setIsEmpty] = useState<boolean>(false);
  const [allTags, setAllTags] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("none");

  const location = useLocation();
  const navigateTo = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const tab = searchParams.get("tab");

  useEffect(() => {
    if (searchParams.size === 0) {
      navigateTo("/buyers-suppliers?tab=all");
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const response = await get(`/client`);
        console.log("API Response:", response.data);

        // Normalize: extract the actual array of clients
        let clientsArray: ClientFromAPI[] = [];

        if (Array.isArray(response.data)) {
          clientsArray = response.data;
        } else if (response.data && Array.isArray(response.data.list)) {
          clientsArray = response.data.list;
        } else if (response.data && typeof response.data === "object") {
          // In case it's a single object (like the example you showed)
          clientsArray = [response.data as ClientFromAPI];
        } else {
          clientsArray = [];
        }

        // Extract all tag names for the dropdown
        const fetchedTagNames = clientsArray.flatMap((item: ClientFromAPI) =>
          Array.isArray(item.tags) ? item.tags.map((tag: Tag) => tag.name) : []
        );
        const uniqueTagNames = Array.from(new Set(fetchedTagNames.filter(Boolean)));
        setAllTags(uniqueTagNames);

        // Map to your Item type (matching BuyersAndSuppliersTable)
        const mappedItems: Item[] = clientsArray.map((item: ClientFromAPI) => ({
          id: item.id.toString(),
          tags: Array.isArray(item.tags) ? item.tags : [],
          companyName: item.companyName || "",
          companyAddress: 
            [item.addressLine1, item.addressLine2, item.city, item.state, item.country]
              .filter(Boolean)
              .join(", "),
          category: item.clientType || "",
          contactNumber: item.phoneNo || "",
          addedDate: formatDate(item.createdAt),
        }));

        setUpdatedItems(mappedItems);
        setIsEmpty(mappedItems.length === 0);
      } catch (error) {
        console.error("Error fetching clients:", error);
        setUpdatedItems([]);
        setIsEmpty(true);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [tab]);

  const tabLinks = [
    { name: "All", link: "all" },
    { name: "Buyer", link: "buyer" },
    { name: "Supplier", link: "supplier" },
  ];

  // Filter items by selected tag (tag name)
  const filteredItems = useMemo(() => {
    if (selectedTag === "none") {
      return updatedItems;
    }
    
    return updatedItems.filter((item) => 
      item.tags.some(tag => tag.name === selectedTag)
    );
  }, [selectedTag, updatedItems]);

  return (
    <div className="min-h-screen bg-neutral-50 pl-5 py-7">
      <div className="flex items-center gap-2 px-5">
        {tabLinks.map((tabLink) => (
          <Link
            to={`/buyers-suppliers?tab=${tabLink.link}`}
            key={tabLink.name}
          >
            <Button
              className={clsx(
                "bg-neutral-100 duration-150 hover:bg-neutral-200 shadow-none text-neutral-700",
                {
                  "bg-neutral-200": tabLink.link === tab,
                }
              )}
            >
              {tabLink.name}
            </Button>
          </Link>
        ))}
        <div className="px-5">
          <div className="flex items-center gap-2 group relative max-w-32">
            <Label className="absolute rounded-full text-neutral-400 font-normal bg-neutral-50 start-1 top-0 z-10 block -translate-y-1/2 px-2 text-xs">
              Tags
            </Label>
            <Select
              value={selectedTag}
              onValueChange={(value) => setSelectedTag(value)}
            >
              <SelectTrigger className="focus-visible:ring-0 shadow-none">
                <SelectValue placeholder="Select a tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <BuyersAndSuppliersTable
          isEmpty={isEmpty}
          tab={tab}
          updatedItems={filteredItems}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default BuyerAndSupplier;