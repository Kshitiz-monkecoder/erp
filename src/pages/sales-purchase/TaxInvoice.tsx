import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { inputClasses, labelClasses } from "@/lib/constants";
import { SelectItem } from "@radix-ui/react-select";
import { Plus } from "lucide-react";
import TaxInvoiceTable from "@/components/app/tables/sales-purchase/TaxInvoiceTable";

// TODO: add props here or fetch the data form the backend
const TaxInvoice: React.FC = () => {
  const states = ["A", "a", "C"];
  const countries = ["A", "a", "C"];
  return (
    <div className="pt-5 pb-16">
      <div className="grid md:grid-cols-3 gap-5">
        <div className="flex flex-col h-fit justify-between space-y-6">
          {/* Buyer and details Card */}
          <div className="border-[1.5px]  rounded-lg border-neutral-200 text-sm">
            <div className="px-3 py-2 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Buyers Details</h4>
              <Button
                variant="outline"
                className="border h-7 px-2 border-gray-400 font-normal"
              >
                <img src="/icons/edit.svg" className="h-4 -mr-1" />
                Edit
              </Button>
            </div>
            <div className="px-3 py-2 space-y-1">
              <div className="font-medium">GreenTech Supplies</div>
              <div>
                <span className="font-medium">GSTIN:</span> 03AAKFT8085G1ZW
              </div>
              <p>456 Industrial Park, Sector 22, Noida, Uttar Pradesh, India</p>
            </div>
          </div>
          {/* Suppliers details Card */}
          <div className="border-[1.5px] h-fit rounded-lg border-neutral-200 text-sm">
            <div className="px-3 py-2 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Supplier Details</h4>
              <Button
                variant="outline"
                className="border h-7 px-2 border-gray-400 font-normal"
              >
                <img src="/icons/edit.svg" className="h-4 -mr-1" />
                Edit
              </Button>
            </div>
            <div className="px-3 py-2 space-y-1">
              <div className="font-medium">GreenTech Supplies</div>
              <div>
                <span className="font-medium">GSTIN:</span> 03AAKFT8085G1ZW
              </div>
              <p>456 Industrial Park, Sector 22, Noida, Uttar Pradesh, India</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col w-full space-y-6">
          {/* Delivery Location Card */}
          <div className="border-[1.5px] min-h-44 rounded-lg border-neutral-200 text-sm">
            <div className="px-3 py-2 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Delivery Location</h4>
              <Button
                variant="outline"
                className="border h-7 px-2 border-gray-400 font-normal"
              >
                <img src="/icons/edit.svg" className="h-4 -mr-1" />
                Edit
              </Button>
            </div>
            <div className="px-3 py-2 space-y-1 min-h-16">
              <p>456 Industrial Park, Sector 22, Noida, Uttar Pradesh, India</p>
            </div>
          </div>
          {/* Place of Supply Card */}
          <div className="border-[1.5px] h-fit rounded-lg border-neutral-200 text-sm">
            <div className="px-3 py-2 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Place Of Supply</h4>
            </div>
            <div className="px-3 py-2 space-y-3">
              <div className="space-y-2">
                <Label className={labelClasses} htmlFor="city">
                  City <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <Input
                  className={inputClasses}
                  placeholder="City"
                  name="city"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="state">
                    State <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Select name="state">
                    <SelectTrigger className={`${inputClasses} w-full`}>
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {states.map((state) => (
                          <SelectItem value={state} key={state}>
                            {state}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="country">
                    Country <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Select name="country">
                    <SelectTrigger className={`${inputClasses} w-full`}>
                      <SelectValue placeholder="Country" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {countries.map((country) => (
                          <SelectItem value={country} key={country}>
                            {country}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div>
          {/* Place of Supply form */}
          <div className="border-[1.5px] h-fit rounded-lg border-neutral-200 text-sm">
            <div className="px-4 py-3 flex bg-[#F7F7F8] rounded-t-lg justify-between items-center gap-2">
              <h4 className="font-semibold">Place Of Supply</h4>
            </div>
            <form className="space-y-2 px-4 py-3 ">
              <div className="space-y-2">
                <Label className={labelClasses} htmlFor="title">
                  Title <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <Input
                  className={inputClasses}
                  placeholder="Title"
                  name="title"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="invoiceNumber">
                    Invoice Number{" "}
                    <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Select name="invoiceNumber">
                    <SelectTrigger className={`${inputClasses} w-full`}>
                      <SelectValue placeholder="POOO2" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {states.map((number) => (
                          <SelectItem value={number} key={number}>
                            {number}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="documentDate">
                    Document Date{" "}
                    <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Input
                    className={inputClasses}
                    placeholder="DD-MM-YYYY"
                    name="documentDate"
                    id="documentDate"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="poNumber">
                    PO Number
                  </Label>
                  <Input
                    className={inputClasses}
                    placeholder="DD-MM-YYYY"
                    name="poNumber"
                    id="poNumber"
                  />
                </div>
                <div className="space-y-2">
                  <Label className={labelClasses} htmlFor="poDate">
                    PO Date <span className="text-[#F53D6B] -mr-2">*</span>
                  </Label>
                  <Input
                    className={inputClasses}
                    placeholder="DD-MM-YYYY"
                    name="poDate"
                    id="poDate"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className={labelClasses} htmlFor="paymentTerm">
                  Payment Term <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <Select name="paymentTerm">
                  <SelectTrigger className={`${inputClasses} w-full`}>
                    <SelectValue placeholder="POOO2" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {states.map((term) => (
                        <SelectItem value={term} key={term}>
                          {term}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={labelClasses} htmlFor="store">
                  Store <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <Select name="store">
                  <SelectTrigger className={`${inputClasses} w-full`}>
                    <SelectValue placeholder="Store" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      {states.map((store) => (
                        <SelectItem value={store} key={store}>
                          {store}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className={labelClasses} htmlFor="deliveryNote">
                  Delivery Note
                </Label>
                <Textarea
                  className={`${inputClasses} max-h-32`}
                  placeholder=""
                  name="deliveryNote"
                  id="deliveryNote"
                />
              </div>
              <div className="space-y-2">
                <Label className={labelClasses} htmlFor="kindAttention">
                  Kind Attention
                </Label>
                <Textarea
                  className={`${inputClasses} max-h-32`}
                  placeholder=""
                  name="kindAttention"
                />
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="mt-5 md:mt-10 border rounded-md py-2">
        <TaxInvoiceTable />
      </div>
      {/* Fields form and summary */}
      <div className="flex mt-8 md:mt-10 lg:mt-16 justify-between flex-col md:flex-row gap-5">
        <div className="w-full max-w-96 text-sm space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className={labelClasses} htmlFor="emailRecipients">
                Email Recipients <span className="text-[#F53D6B] -mr-2">*</span>
              </Label>
              <Input
                className={inputClasses}
                placeholder="Email Recipients"
                name="emailRecipients"
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClasses} htmlFor="emailRecipients">
                Description (Optional)
              </Label>
              <Textarea
                className={`${inputClasses} max-h-32`}
                placeholder="Email Recipients"
                name="emailRecipients"
              />
            </div>
            <div className="text-[#7047EB] text-xs gap-1 underline underline-offset-2 flex items-center">
              <Plus className="w-3" />
              Add Fields
            </div>
          </div>
        </div>
        <div className="space-y-3 text-xs md:text-sm w-full max-w-84">
          <div className="flex justify-between items-center gap-2">
            <div className="font-semibold">Total (before tax) :</div>
            <div>₹0.00</div>
          </div>
          <div className="flex justify-between items-center gap-2">
            <div className="font-semibold">Total Tax :</div>
            <div>₹0.00</div>
          </div>
          <div className="flex justify-between items-center gap-2">
            <div className="font-semibold">Total (after tax) :</div>
            <div>₹0.00</div>
          </div>
          <div className="flex items-center text-xs gap-2 text-[#7047EB]">
            <Plus className="w-3" />
            Add Charges/Discount
          </div>
          <div className="block border" />
          <div className="flex justify-between items-center gap-2">
            <div className="font-semibold">Grand Total :</div>
            <div>₹0.00</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaxInvoice;
