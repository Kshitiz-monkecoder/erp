// ShowLocations.tsx
import React, { useEffect, useRef, useState } from "react";
import { inputClasses, labelClasses } from "@/lib/constants";
import { X, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import AddLocationsModal from "./AddLocationsModal";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface IModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectLocation?: (location: any) => void;
  title?: string; // Optional title prop
}

import {get} from "../../../lib/apiService"

const ShowLocations: React.FC<IModalProps> = ({
  isOpen,
  onClose,
  onSelectLocation,
  title = "Delivery Location"
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [locations, setLocations] = useState<any[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Get selected buyer ID from localStorage
  const getSelectedBuyerId = () => {
    try {
      const selectedBuyer = localStorage.getItem("selectedBuyer");
      return selectedBuyer ? JSON.parse(selectedBuyer)?.id : undefined;
    } catch (error) {
      console.error("Error parsing selectedBuyer from localStorage:", error);
      return undefined;
    }
  };

  const fetchLocations = async () => {
    try {
      const data = await get("/locations");
      if (!data.status){
        console.error("Error fetching locations:", data.message);
        return;
      }
      console.log(data);
      setLocations(data.data || []);
    } catch (error) {
      console.error("Error fetching locations:", error);
    }
  };

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchLocations();
      // Reset selection when modal opens
      setSelectedLocationId("");
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedLocationId("");
      setIsAddModalOpen(false);
    }
  }, [isOpen]);

  useEffect(() => {
    const selectedLocation = locations.find(
      (loc) => loc.id == selectedLocationId,
    );
    if (selectedLocation && selectedLocationId) {
      localStorage.setItem(
        "selectedDeliveryLocation",
        JSON.stringify(selectedLocation),
      );
      onSelectLocation?.(selectedLocation);
    }
  }, [selectedLocationId, locations, onSelectLocation]);

  const handleLocationAdded = (newLocation: any) => {
    // Refresh the locations list after adding a new location
    fetchLocations();
    // Optionally auto-select the newly added location
    if (newLocation?.id) {
      setTimeout(() => {
        setSelectedLocationId(String(newLocation.id));
      }, 100);
    }
    // DON'T close the main modal - just close the add modal
    setIsAddModalOpen(false);
  };

  // const handleSelectAndClose = () => {
  //   // Only close if a location is actually selected
  //   if (selectedLocationId) {
  //     onClose();
  //   }
  // };

  const handleClose = () => {
    // Reset state before closing
    setSelectedLocationId("");
    setIsAddModalOpen(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-10">
        <div
          className="bg-white rounded-lg w-full max-w-xl pb-10 animate-in fade-in duration-200"
          ref={modalRef}
        >
          <div className="p-4 bg-[#F7F7F8] rounded-t-lg flex items-center justify-between">
            <h4 className="font-semibold md:text-lg lg:text-xl">
              Please Select {title}
            </h4>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="p-2 bg-[#7047EB] text-white rounded-md hover:bg-[#5f3dc4] flex items-center gap-1"
                size="sm"
              >
                <Plus className="w-4 h-4" />
                Add
              </Button>
              <X
                className="text-[#8A8AA3] cursor-pointer w-5"
                onClick={handleClose}
              />
            </div>
          </div>

          <div className="p-4">
            <div className="space-y-4">
              <div className="space-y-1">
                <Label className={labelClasses} htmlFor="selectLocation">
                  Select Location{" "}
                  <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>

                <Select
                  value={selectedLocationId}
                  onValueChange={setSelectedLocationId}
                >
                  <SelectTrigger className={`${inputClasses} w-full`}>
                    <SelectValue placeholder="Select a Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {(locations || []).map((loc) => (
                        <SelectItem key={loc.id} value={String(loc.id)}>
                          {[
                            loc.companyName,
                            loc.locationName,
                            loc.address1,
                            loc.address2,
                            loc?.city,
                            loc?.state,
                            loc.postalCode,
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>

              {/* Add action buttons */}
              {/* <div className="flex justify-end gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="px-4 py-2"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSelectAndClose}
                  disabled={!selectedLocationId}
                  className="px-4 py-2 bg-[#7047EB] text-white hover:bg-[#5f3dc4] disabled:opacity-50"
                >
                  Select Location
                </Button>
              </div> */}
            </div>
          </div>
        </div>
      </div>

      {/* Add Locations Modal */}
      <AddLocationsModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLocationAdded={handleLocationAdded}
        clientId={getSelectedBuyerId()}
        addressType="shipping" // You can make this dynamic based on your needs
      />
    </>
  );
};

export default ShowLocations;
