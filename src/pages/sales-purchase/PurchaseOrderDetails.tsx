import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Check, PlusIcon } from "lucide-react";
import React from "react";
import { useLocation, useNavigate, useParams } from "react-router";
import moment from "moment";
import { get } from "../../lib/apiService";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PurchaseOrderDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const PO = location.state || {};

  const [timeline, setTimeline] = React.useState<any[]>([]);
  const [user] = React.useState(
    JSON.parse(localStorage.getItem("User") || "{}")
  );
  const [poSingleData, setPOSingleData] = React.useState<any>(null);

  React.useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const data = await get(`/inventory/purchase-timeline/${id}`);
        // console.log(data?.data || []);
        setTimeline(data?.data || []);
        // localStorage.setItem(
        //   "purchaseOrderTimeline",
        //   JSON.stringify(data?.data || [])
        // );
      } catch (error) {
        console.error("Error fetching timeline:", error);
      }
    };

    const fetchPOSingleData = async () => {
      try {
        const data = await get(`/inventory/purchase-order/${id}`);
        setPOSingleData(data?.data || null);
      } catch (error) {
        console.error("Error fetching PO single data:", error);
      }
    };

    if (id) {
      fetchTimeline();
      fetchPOSingleData();
    }
  }, [id]);

  return (
    <div className="min-h-screen ">
      <div className="px-5 pl-10 py-4 text-xs md:text-sm bg-[#F7F7F8]">
        <div className="w-full grid sm:grid-cols-2 md:grid-cols-3 md:justify-between md:items-center gap-2">
          <div className="flex items-center gap-2">
            <div className="font-medium">Buyer:</div>
            {localStorage.getItem("User")
              ? JSON.parse(localStorage.getItem("User") || "{}").name
              : "Ramesh PVT. LTD."}
          </div>
          <div className="flex w-full md:justify-center gap-2">
            <div className="font-medium">Supplier:</div>
            {PO?.supplier?.name}
          </div>
          <div className="flex w-full md:justify-end items-center gap-2">
            <div className="font-medium">Start Date:</div>
            {PO?.documentDate}
          </div>
        </div>
      </div>
      <div className="p-5 grid md:grid-cols-2 gap-5 bg-[#F7F7F880]">
        {/* Dashboard */}
        <div className="rounded-2xl text-sm bg-white border-[1.5px] border-neutral-200 p-4">
          <div className="flex justify-between items-center gap-2">
            <h3 className="text-[#8A8AA3]">DASHBOARD</h3>
            <div className="flex text-xs items-center gap-2">
              <div className="px-2 py-1 rounded-lg flex items-center gap-1 text-[#8A6100] bg-[#FFF9EB]">
                <div className="hidden xl:flex">Invoice :</div>Invoice Created
              </div>
              <div className="px-2 py-1 rounded-lg flex items-center gap-1 text-[#17663A] bg-[#EEFBF4]">
                <div className="hidden xl:flex">Goods :</div> Received
              </div>
            </div>
          </div>
          <div className="text-xs mt-4 grid md:grid-cols-2 lg:grid-cols-3 md:text-sm">
            <div className="space-y-2 pr-5">
              <h3 className="font-bold text-lg md:text-xl lg:text-2xl">10</h3>
              <p>Pending Tasks for you</p>
            </div>
            <div className="space-y-2 border-l md:border-neutral-200 pl-5">
              <h3 className="font-bold text-lg md:text-xl lg:text-2xl">0</h3>
              <p>Pending Tasks for you</p>
            </div>
            <div className="flex col-span-2 lg:col-span-1 mt-3 justify-end lg:justify-center items-end lg:items-center">
              <Button variant="outline" className="h-7 w-fit px-2 text-xs">
                View All Tasks
              </Button>
            </div>
          </div>
        </div>
        {/* Actions */}
        <div className="rounded-2xl text-sm h-full flex flex-col justify-between bg-white border-[1.5px] border-neutral-200 p-4">
          <div className="flex  items-center gap-2">
            <h3 className="text-[#8A8AA3]">ACTIONS</h3>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 mt-3 items-center gap-2">
            {/* <Button className="bg-[#7047EB] w-full h-7 text-xs font-normal hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2">
              <PlusIcon className="" />
              Create Document
            </Button> */}

            <div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="focus-visible:ring-0">
                  <Button className="bg-[#7047EB] w-full h-7 text-xs font-normal hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2">
                    <PlusIcon className="mr-1 h-3 w-3" />
                    Create Document
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="shadow-none">
                  <DropdownMenuGroup className="space-y-1">
                    <DropdownMenuItem
                      onClick={() => {
                        navigate(`/sales-purchase/purchase-invoice/${id}`, {
                          state: { purchaseOrder: poSingleData },
                        });
                      }}
                      className="[&:not(:last-child)]:border-b p-1 rounded-none focus:bg-white focus:text-neutral-600 duration-200 ease-out transition-all [&:not(:last-child)]:border-neutral-200"
                    >
                      Create Invoice
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => {
                        navigate(`/sales-purchase/purchase-invoice/${id}?performa=true`, {
                          state: { purchaseOrder: poSingleData },
                        });
                      }}
                      className="[&:not(:last-child)]:border-b p-1 rounded-none focus:bg-white focus:text-neutral-600 duration-200 ease-out transition-all [&:not(:last-child)]:border-neutral-200"
                    >
                      Create Performa Invoice
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Button variant="outline" className="h-7 w-full px-2 text-xs">
              Transaction Tags
            </Button>
            <Button
              variant="secondary"
              className="h-7 col-span-2 lg:col-span-1 w-full px-2 text-xs"
            >
              Cancel Transaction
            </Button>
          </div>
        </div>
      </div>
      <div className="grid gap-10 lg:grid-cols-4 p-5">
        {/* Transaction Timeline */}
        <div className="lg:col-span-1">
          <h3 className="font-semibold">TRANSACTION TIMELINE</h3>
          <div className="mt-4">
            {timeline.map((item, index) => {
              console.log("item", item);
              return (
                <div key={index}>
                  <div className="flex items-center gap-2 text-xs">
                    <Button
                      size="icon"
                      className={
                        "rounded-full h-6 w-6 shadow-none  bg-green-600 hover:bg-green-600"
                      }
                    >
                      <Check className="w-2" />
                    </Button>
                    {/* <img src="/icons/success.svg" className="w-5 lg:w-6" /> */}
                    <div className="">
                      <div className="font-medium">{item.type}</div>
                      <div className="text-[#6C6C89]">
                        {moment(item.date).format("DD-MM-YYYY hh:mm:ss A")}
                      </div>
                    </div>
                  </div>
                  {index < timeline.length - 1 && (
                    <Separator
                      orientation="vertical"
                      className="h-12 ml-[11px]"
                    />
                  )}
                </div>
              );
            })}

            {/* <div className="flex items-center gap-2 text-xs">
              <Button
                size="icon"
                className={clsx(
                  "rounded-full h-6 w-6 shadow-none bg-neutral-300 hover:bg-neutral-300",
                  {
                    "bg-green-600 hover:bg-green-600": timeline
                      .map((title) => title.type)
                      .includes("INWARD"),
                  }
                )}
              >
                <Check className="w-2" />
              </Button>
              <div className="">
                <div className="font-medium">Invard</div>
                <div className="text-[#6C6C89]">2/03/2025</div>
              </div>
            </div>
            <Separator orientation="vertical" className="h-12 ml-[11px]" />
            <div className="flex items-center gap-2 text-xs">
              <Button
                size="icon"
                className={clsx(
                  "rounded-full h-6 w-6 shadow-none bg-neutral-300 hover:bg-neutral-300",
                  {
                    "bg-green-600 hover:bg-green-600": timeline
                      .map((title) => title.type)
                      .includes("GRN"),
                  }
                )}
              >
                <Check className="w-2" />
              </Button>
              <div className="">
                <div className="font-medium">Invoice</div>
                <div className="text-[#6C6C89]">2/03/2025</div>
              </div>
            </div> */}
          </div>
        </div>
        <div className="space-y-4 mt-4 lg:mt-8 lg:col-span-3">
          {/* Dynamic Timeline Cards */}
          {timeline.map((item, index) => (
            <div
              key={index}
              className="p-3 rounded-lg space-y-3 text-xs border-[1.5px] border-neutral-200"
            >
              <div className="flex justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-neutral-600"></div>
                  <div>
                    <h5 className="font-medium">{item?.type}</h5>
                    <div className="text-[#6C6C89] text-xs">
                      {user?.company?.name || "Ramesh PVT. LTD."}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-[#6C6C89]">
                  {item.details.documentDate}
                </div>
              </div>
              <div className="rounded-lg font-normal bg-[#F7F7F8] p-4 w-full flex gap-5 items-center">
                <img src="/icons/purchase.svg" alt="" className="w-10" />
                <div className="flex flex-col justify-between space-y-1 w-full">
                  <div>
                    Purchase Order:{" "}
                    <span className="text-[#7047EB] border-[#7047EB] border-b border-dashed">
                      {item.documentNumber}
                    </span>
                  </div>

                  <div className="flex justify-between items-end md:items-center w-full">
                    <div className="grid sm:grid-cols-2 md:grid-cols-3 max-w-lg items-center md:gap-10 gap-2 w-full">
                      <div className="text-nowrap">
                        Number of Items:{" "}
                        <span className="font-medium">
                          {item.details.items?.length || 0}
                        </span>
                      </div>
                      {item.type == "PO" && (
                        <div className="flex items-center gap-2">
                          Amount:{" "}
                          <span className="font-medium">
                            ₹{item.details.totalAmount}
                          </span>
                        </div>
                      )}

                      {item.type === "PO" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="text-xs p-0 w-fit">
                                View PO Details
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white text-neutral-800 border">
                              <div className="">
                                <div className="space-y-2 text-xs">
                                  <div>
                                    Document Number:{" "}
                                    {item.details.documentNumber}
                                  </div>
                                  <div>Title: {item.details.title}</div>
                                  <div>
                                    Place of Supply:{" "}
                                    {item.details.placeOfSupplyCity}
                                  </div>
                                  <div>OC Number: {item.details.ocNumber}</div>
                                  <div>OC Date: {item.details.ocDate}</div>
                                  <div>
                                    Indent Number: {item.details.indentNumber}
                                  </div>
                                  <div>
                                    Indent Date: {item.details.indentDate}
                                  </div>
                                  <div>
                                    Supplier:{" "}
                                    {item.details.supplier.companyName}
                                  </div>
                                  <div>
                                    GST Number:{" "}
                                    {item.details.supplier.gstNumber}
                                  </div>
                                  <div>Status: {item.details.status}</div>
                                  <div>
                                    GRN Status: {item.details.grnStatus}
                                  </div>
                                  <div>
                                    Created By: {item.details.createdBy.name}
                                  </div>
                                  <div>Signature: {item.details.signature}</div>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {item.type === "INWARD" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="text-xs p-0 w-fit">
                                View Inward Details
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white text-neutral-800 border">
                              <div className="space-y-2 text-xs">
                                <div>Invoice: {item.details.invoice}</div>
                                <div>
                                  Invoice Date: {item.details.invoiceDate}
                                </div>
                                <div>
                                  Delivery Challan:{" "}
                                  {item.details.deliveryChallanNumber}
                                </div>
                                <div>
                                  Delivery Date: {item.details.deliveryDate}
                                </div>
                                <div>
                                  Transporter: {item.details.transporterName}
                                </div>
                                <div>
                                  Vehicle Number: {item.details.vehicleNumber}
                                </div>
                                <div>
                                  Transport Doc:{" "}
                                  {item.details.transportationDocumentNumber}
                                </div>
                                <div>
                                  Transport Doc Date:{" "}
                                  {item.details.transportationDocumentDate}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}

                      {item.type === "GRN" && (
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button className="text-xs p-0 w-fit">
                                View GRN Details
                              </button>
                            </TooltipTrigger>
                            <TooltipContent className="bg-white text-neutral-800 border">
                              <div className="space-y-2 text-xs">
                                <div>
                                  Document Number: {item.details.documentNumber}
                                </div>
                                <div>
                                  Document Date: {item.details.documentDate}
                                </div>
                                <div>
                                  Delivery Date: {item.details.deliveryDate}
                                </div>
                                <div>GRN Status: {item.details.grnStatus}</div>
                                <div>Amendment: {item.details.amendment}</div>
                                <div>
                                  Remarks: {item.details.remarks || "N/A"}
                                </div>
                                <div>
                                  Supplier: {item.details.supplier.companyName}
                                </div>
                                <div>
                                  Created By: {item.details.createdBy.name}
                                </div>
                                <div className="font-medium mt-2">
                                  Inward Details:
                                </div>
                                <div>
                                  Invoice: {item.details.purchaseInword.invoice}
                                </div>
                                <div>
                                  Invoice Date:{" "}
                                  {item.details.purchaseInword.invoiceDate}
                                </div>
                                <div>
                                  Delivery Challan:{" "}
                                  {
                                    item.details.purchaseInword
                                      .deliveryChallanNumber
                                  }
                                </div>
                                <div>
                                  Transporter:{" "}
                                  {item.details.purchaseInword.transporterName}
                                </div>
                                <div>
                                  Vehicle Number:{" "}
                                  {item.details.purchaseInword.vehicleNumber}
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      )}
                      {/* <div>
                      Due Date: <span className="font-medium">{formatDate(item.details.expectedReplyDate)}</span>
                    </div> */}
                    </div>
                    <div className="flex items-end h-full">
                      <div className="w-full flex justify-end items-end h-full">
                        {item.type == "PO" && (
                          <Button
                            onClick={() => {
                              // localStorage.setItem(
                              //   "currentPO",
                              //   JSON.stringify(item)
                              // );
                              // window.location.href =
                              //   "/sales-purchase/purchase-inword";
                              navigate(`/sales-purchase/purchase-inword/${id}`);
                            }}
                            variant="outline"
                            className="h-7 px-2 text-xs"
                          >
                            Create Inward
                          </Button>
                        )}

                        {item.type === "INWARD" && (
                          <Button
                            onClick={() => {
                              localStorage.setItem(
                                "currentInward",
                                JSON.stringify(item)
                              );
                              navigate(
                                `/sales-purchase/purchase-grn/${item.id}`
                              );
                              // window.location.href =
                              //   "/sales-purchase/purchase-grn";
                            }}
                            variant="outline"
                            className="h-7 px-2 text-xs"
                          >
                            Create GRN
                          </Button>
                        )}

                        {item.type === "INVOICE" && (
                          <Button
                            onClick={() =>
                              navigate(
                                `/sales-purchase/invoice-preview/${item.id}`
                              )
                            }
                            variant="outline"
                            className="h-7 px-2 text-xs"
                          >
                            View
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="block border border-dashed border-[#D1D1DB]" />
              <div className="flex text-[#0000ff] items-center gap-3 justify-between text-xs">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 pr-2 border-r border-[#6C6C89]">
                    <img src="/icons/comment.svg" className="w-5" />
                    Comments: 0
                  </div>
                  <div>Attachments: 0</div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="flex items-center cursor-pointer text-[#7047EB] gap-1 pr-2 ">
                    <img src="/icons/add-comment.svg" className="w-5" />
                    <div className="hidden md:flex">Add Comment</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PurchaseOrderDetails;
