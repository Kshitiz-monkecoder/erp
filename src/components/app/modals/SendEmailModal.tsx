import { Button } from "@/components/ui/button";
import { IModalProps } from "@/lib/types";
import React, { useRef } from "react";
import PurchaseOrderPreviewTable from "../tables/sales-purchase/PurchaseOrderPreviewTable";
import { Label } from "@/components/ui/label";
import { inputClasses, labelClasses } from "@/lib/constants";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const SendEmailModal: React.FC<IModalProps> = ({ isOpen, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 h-[100vh] bg-black/40 flex items-center justify-center z-50 p-10 py-16">
      <div
        className="bg-white rounded-lg w-full max-h-[70dvh] md:max-h-[85dvh] max-w-4xl overflow-y-auto pb-10 animate-in fade-in duration-200"
        ref={modalRef}
      >
        <div>
          <div className="px-6 bg-neutral-100/90 rounded-t-lg py-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <h3 className="sm:text-lg font-semibold">Send Email</h3>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={onClose}
                variant="outline"
                className="shadow-none text-xs sm:text-sm h-7 sm:h-9 font-normal"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#7047EB] text-xs sm:text-sm h-7 sm:h-9 flex items-center font-normal shadow-none hover:bg-[#7047EB] hover:opacity-95"
              >
                Save
              </Button>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            <form className="p-5 space-y-3 md:col-span-1">
              <div className="space-y-1">
                <Label className={`${labelClasses}`} htmlFor="sendName">
                  Send Name <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <Input
                  id="sendName"
                  name="sendName"
                  type="text"
                  className={`${inputClasses} text-xs`}
                  placeholder="Sender Name"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className={`${labelClasses}`} htmlFor="toEmail">
                  To
                </Label>
                <Input
                  id="toEmail"
                  name="toEmail"
                  type="text"
                  className={`${inputClasses} text-xs`}
                  placeholder="Enter email here"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className={`${labelClasses}`} htmlFor="cc">
                  CC
                </Label>
                <Input
                  id="cc"
                  name="cc"
                  type="text"
                  className={`${inputClasses} text-xs`}
                  placeholder="Cc"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className={`${labelClasses}`} htmlFor="replyTo">
                  Reply to <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <Input
                  id="replyTo"
                  name="replyTo"
                  type="text"
                  className={`${inputClasses} text-xs`}
                  placeholder="Enter email"
                  required
                />
              </div>
              <div className="space-y-1">
                <Label className={`${labelClasses}`} htmlFor="subject">
                  Subject <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <Input
                  id="subject"
                  name="subject"
                  type="text"
                  className={`${inputClasses} text-xs`}
                  placeholder="Subject"
                  required
                />
                <div className="flex items-center text-xs underline underline-offset-2">
                  <Plus className="w-4" /> Add Placeholder
                </div>
              </div>
              <div className="space-y-1">
                <Label className={`${labelClasses}`} htmlFor="designTemplate">
                  Design Template{" "}
                  <span className="text-[#F53D6B] -mr-2">*</span>
                </Label>
                <Textarea
                  id="subject"
                  name="subject"
                  className={`${inputClasses} w-full text-xs max-h-32`}
                  placeholder="Hello,"
                  required
                />
              </div>
            </form>
            <div className="text-[8px] md:col-span-2 ">
              <div className="w-full max-w-xl max-h-[50vh] md:max-h-[80dvh] p-4">
                <div className="flex justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <img src="/icons/purchase.svg" className="w-5" />
                    <div className="font-semibold sm:text-lg md:text-xl lg:text-2xl">
                      Purchase Order
                    </div>
                  </div>
                </div>
                <div className="border mt-2 border-neutral-200 p-6">
                  <div className="text-[#8A8AA3]">PO Details</div>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-5 xl:grid-cols-6">
                    <div className="">
                      <div className="font-medium">PO Number:</div>
                      <div>PO00001</div>
                    </div>
                    <div className="">
                      <div className="font-medium">PO Date:</div>
                      <div>02/03/2025</div>
                    </div>
                    <div className="">
                      <div className="font-medium">Delivery Date:</div>
                      <div>02/03/2025</div>
                    </div>
                    <div className="">
                      <div className="font-medium">PO Amendment:</div>
                      <div>0</div>
                    </div>
                    <div className="">
                      <div className="font-medium">PO Amount:</div>
                      <div>₹2,650.00</div>
                    </div>
                    <div className="">
                      <div className="font-medium">No of Items:</div>
                      <div>2</div>
                    </div>
                  </div>
                </div>
                <div className="p-6 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="">
                    <h3 className="font-semibold">NAME AND ADDRESS OF BUYER</h3>
                    <div className="font-medium">GreenTech Supplies</div>
                    <div>
                      <span className="font-medium">GSTIN: </span>
                      03AAKFT8085G1ZW
                    </div>
                    <p>
                      456 Industrial Park, Sector 22, Noida, Uttar Pradesh,
                      India
                    </p>
                  </div>
                  <div className="">
                    <h3 className="font-semibold">
                      NAME AND ADDRESS OF SUPPLIER
                    </h3>
                    <div className="font-medium">GreenTech Supplies</div>
                    <div>
                      <span className="font-medium">GSTIN: </span>
                      03AAKFT8085G1ZW
                    </div>
                    <p>
                      456 Industrial Park, Sector 22, Noida, Uttar Pradesh,
                      India
                    </p>
                  </div>
                  <div className="">
                    <h3 className="font-semibold">SHIPPING DETAILS</h3>
                    <p>
                      456 Industrial Park, Sector 22, Noida, Uttar Pradesh,
                      India
                    </p>
                  </div>
                </div>
                <div className="flex justify-center items-center ">
                  <div className="overflow-auto max-w-64 md:max-w-full">
                    <PurchaseOrderPreviewTable inModal={true} />
                  </div>
                </div>
                <div className="flex gap-5 pb-10 md:flex-row justify-between mt-4 md:mt-7">
                  <div className="space-y-2">
                    <div className="">
                      <div className="font-medium">Terms And Conditions:</div>
                      <p>This is a computer generated document</p>
                    </div>
                    <div>
                      <div className="p-3 space-y-2 text-[8px] bg-gray-100 w-full  max-w-xs">
                        <div>For Ramesh PVT. LTD.</div>
                        <div className="text-gray-400">
                          Authorised Signatory
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-1 text-[8px] w-full  max-w-32">
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
                    <div className="block border" />
                    <div className="flex justify-between items-center gap-2">
                      <div className="font-semibold">Grand Total :</div>
                      <div>₹0.00</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default SendEmailModal;
