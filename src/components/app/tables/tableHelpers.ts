import { OptionType } from "../SelectFilter";

// Define interface for table configuration
export interface TableConfig {
  searchColumn?: string;
  enableDateFiltering?: boolean;
  dateColumn?: string;
  enableCreate?: boolean;
  createButtonText?: string;
  enableColumnVisibility?: boolean;
  initialColumnVisibility?: Record<string, boolean>;
  filterOptions?: {
    label: string;
    column: string;
    options: OptionType[];
  }[];
  emptyStateConfig?: {
    title: string;
    description: string;
    showCreateButton?: boolean;
  };
}

// Common filter options
export const filterOptions = {
  status: [
    { label: "All", value: "All" },
    { label: "Pending", value: "Pending" },
    { label: "Completed", value: "Completed" },
    { label: "Approved", value: "Approved" },
    { label: "Rejected", value: "Rejected" },
    { label: "Cancelled", value: "Cancelled" },
  ],

  grnStatus: [
    { label: "All", value: "All" },
    { label: "Completed", value: "completed" },
    { label: "Pending", value: "pending" },
    { label: "Cancelled", value: "cancelled" },
  ],

  inwardStatus: [
    { label: "All", value: "All" },
    { label: "Completed", value: "COMPLETED" },
    { label: "Pending", value: "PENDING" },
    { label: "In Progress", value: "IN_PROGRESS" },
  ],
};

// Sample configurations for different table types
export const tableConfigs: Record<string, TableConfig> = {
  grn: {
    searchColumn: "documentNumber",
    enableDateFiltering: true,
    dateColumn: "documentDate",
    enableCreate: true,
    createButtonText: "Create GRN",
    filterOptions: [
      {
        label: "GRN Status",
        column: "grnStatus",
        options: filterOptions.grnStatus,
      },
    ],
    emptyStateConfig: {
      title: "No GRN Added",
      description: "Please add a GRN document to get started and manage your operations efficiently.",
    },
  },

  inward: {
    searchColumn: "supplierName",
    enableDateFiltering: true,
    dateColumn: "deliveryDate",
    enableCreate: true,
    createButtonText: "Create Document",
    filterOptions: [
      {
        label: "Status",
        column: "inwardStatus",
        options: filterOptions.inwardStatus,
      },
    ],
    emptyStateConfig: {
      title: "No Inward Documents",
      description: "Please add an inward document to get started and manage your inventory efficiently.",
    },
  },

  approval: {
    enableColumnVisibility: true,
    initialColumnVisibility: {
      approvalId: false,
      documentType: true,
      documentNumber: true,
      documentAction: true,
      approvalStatus: true,
      createdBy: true,
      date: true,
    },
    filterOptions: [
      {
        label: "Approval Status",
        column: "approvalStatus",
        options: filterOptions.status,
      },
    ],
    emptyStateConfig: {
      title: "No Item Added",
      description: "Please add a document to get started and manage your operations efficiently.",
      showCreateButton: false,
    },
  },
};
