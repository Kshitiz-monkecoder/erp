interface INavlinks {
  name: string;
  link: string;
}

export const SalesAndPurchaseSubLinks: INavlinks[] = [
  {
    name: "Purchase",
    link: "/sales-purchase?tab=purchase",
  },
  {
    name: "Purchase Quotations",
    link: "/sales-purchase?tab=purchase-quotations",
  },
  {
    name: "Sales Quotations",
    link: "/sales-purchase?tab=sales-quotations",
  },

  // {
  //   name: "Inword",
  //   link: "/sales-purchase?tab=inword",
  // },
  // {
  //   name: "GRN",
  //   link: "/sales-purchase?tab=grn",
  // },
  {
    name: "Sales Enquiry",
    link: "/sales-purchase?tab=sales-enquiry",
  },
  {
    name : "Order Confirmation",
    link: "/sales-purchase?tab=order-confirmation",
  },
  // {
  //   name : "Delivery Challan",
  //   link : "/sales-purchase?tab=delivery-challan"
  // }
  // {
  //   name: "All Documents",
  //   link: "/sales-purchase?tab=all-documents",
  // },
];

export const InventorySubLinks: INavlinks[] = [
  {
    name: "Item Master",
    link: "/inventory?tab=item-master",
  },
  {
    name: "Inventory Approvals",
    link: "/inventory?tab=approvals",
  },
  {
    name: "Stock Movement",
    link: "/inventory?tab=stock-movement",
  },
  {
    name: "Barcode",
    link: "/inventory?tab=barcode",
  },
  {
    name: "Category Master",
    link: "/inventory?tab=categories-master",
  },
   {
    name: "Warehouse Master",
    link: "/inventory?tab=warehouse-master",
  },

];

export const BuyersAndSuppliersSubLinks: INavlinks[] = [
  {
    name: "All",
    link: "/buyers-suppliers?tab=all",
  },
  {
    name: "Buyers",
    link: "/buyers-suppliers?tab=buyer",
  },
  {
    name: "Suppliers",
    link: "/buyers-suppliers?tab=supplier",
  },
];

export const ProductionSubLinks: INavlinks[] = [
  {
    name: "All Production Process",
    link: "/production?tab=all-production-process",
  },
  {
    name: "Work Orders",
    link: "/production?tab=work-orders",
  },
  {
    name: "Sub Contract",
    link: "/production?tab=sub-contract",
  },
  {
    name: "Bill of Materials",
    link: "/production?tab=bill-of-materials",
  },
    {
    name: "Create BOM",
    link: "/production/bom/create",
  },
];


export const settingSubLinks : INavlinks[] = [
  { 
    name: "User Management", 
    link: "/settings/users?tab=user-management" 
  },
  { 
    name: "Teams", 
    link: "/settings/teams?tab=teams" 
  },
]