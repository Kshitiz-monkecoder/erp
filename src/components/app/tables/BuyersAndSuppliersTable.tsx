import { useMemo, useState, useEffect } from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedMinMaxValues,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  RowData,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpRight, PlusIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "../../ui/button";
import { Link, useNavigate } from "react-router";
import TableLoading from "../TableLoading";
import TablePagenation from "../TablePagenation";
import FilterInput from "../FilterInput";
import { toast } from "sonner";
import { get } from "@/lib/apiService"; 

declare module "@tanstack/react-table" {
  interface ColumnMeta<TData extends RowData, TValue> {
    filterVariant?: "text" | "range" | "select";
  }
}

type Tag = {
  id: number;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

type Item = {
  id: string;
  tags: Tag[];
  companyName: string;
  companyAddress: string;
  category: string;
  contactNumber: string;
  addedDate: string;
};

const BuyersAndSuppliersTable = ({
  tab,
  updatedItems,
  isLoading,
}: {
  tab: string | null;
  updatedItems: Item[];
  isLoading: boolean;
  isEmpty: boolean;
}) => {
  const searchParams = new URLSearchParams(location.search);
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");
  const [tagFilteredItems, setTagFilteredItems] = useState<Item[]>(updatedItems);
  const [loadingTagItems, setLoadingTagItems] = useState(false);
  const navigateTo = useNavigate();

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await get("/tag"); 
        
        if (response.status && Array.isArray(response.data)) {
          setTags(response.data);
        } else {
          toast.error("Failed to load tags");
        }
      } catch (error) {
        console.error("Error fetching tags:", error);
        toast.error("Error loading tags");
      } finally {
      }
    };

    fetchTags();
  }, []);

  // Fetch clients when tag is selected
  useEffect(() => {
    const fetchClientsByTag = async () => {
      if (!selectedTag) {
        setTagFilteredItems(updatedItems);
        return;
      }

      try {
        setLoadingTagItems(true);
        const response = await get(`/client?tagId=${selectedTag}`);
        
        // Handle different response structures
        let clientsArray: any[] = [];
        
        if (Array.isArray(response.data)) {
          clientsArray = response.data;
        } else if (response.data && Array.isArray(response.data.list)) {
          clientsArray = response.data.list;
        } else if (response.data && typeof response.data === "object") {
          clientsArray = [response.data];
        }
        
        if (response.status && clientsArray.length > 0) {
          // Transform the API response to match the Item type
          const transformedItems = clientsArray.map((client) => ({
            id: client.id.toString(),
            tags: client.tags || [],
            companyName: client.companyName || "",
            companyAddress: `${client.addressLine1 || ""}, ${client.city || ""}, ${client.state || ""}, ${client.country || ""}`.replace(/, ,/g, ",").replace(/,\s*$/, ""),
            category: client.clientType || "",
            contactNumber: client.phoneNo || "",
            addedDate: new Date(client.createdAt).toLocaleDateString(),
          }));
          setTagFilteredItems(transformedItems);
        } else {
          toast.error("Failed to load filtered clients");
          setTagFilteredItems([]);
        }
      } catch (error) {
        console.error("Error fetching clients by tag:", error);
        toast.error("Error loading filtered clients");
        setTagFilteredItems([]);
      } finally {
        setLoadingTagItems(false);
      }
    };

    fetchClientsByTag();
  }, [selectedTag, updatedItems]);

  const columns: ColumnDef<Item>[] = [
    {
      header: "Company Name",
      accessorKey: "companyName",
      cell: ({ row }) => (
        <div
          onClick={() => {
            // 1. serialize and save the item
            localStorage.setItem("currentB&S", JSON.stringify(row.original));
            // 2. navigate
            navigateTo(`/buyers-suppliers/${row.getValue("companyName")}`);
          }}
          className="font-normal gap-2 text-blue-500 min-w-32 flex items-center cursor-pointer"
        >
          {row.getValue("companyName")}
          <ArrowUpRight className="text-blue-500 w-5" />
        </div>
      ),
    },
    {
      header: "Company Address",
      accessorKey: "companyAddress",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.getValue("companyAddress")}
        </div>
      ),
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.getValue("category")}</div>
      ),
      filterFn: "equals",
    },
    {
      header: "Contact Number",
      accessorKey: "contactNumber",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">
          {row.getValue("contactNumber")}
        </div>
      ),
    },
    {
      header: "Added On",
      accessorKey: "addedDate",
      cell: ({ row }) => (
        <div className="font-normal min-w-32">{row.getValue("addedDate")}</div>
      ),
    },
    {
      header: "Tags",
      accessorKey: "tags",
      cell: ({ row }) => {
        const tags = row.getValue("tags") as Tag[];
        const tagNames = tags.map(tag => tag.name);
        return (
          <div className="font-normal min-w-32">
            {tagNames.join(", ")}
          </div>
        );
      },
    },
  ];

  // performance optimization
  const filteredItems = useMemo(() => {
    // Start with tag-filtered items
    let filtered = tagFilteredItems;

    // Apply category filtering
    if (tab && tab !== "all") {
      filtered = filtered.filter(
        (item) =>
          item.category.toLowerCase() === tab.toLowerCase() ||
          item.category.toLowerCase() === "both",
      );
    }

    // Then apply date filtering if both dates are present
    if (startDate && endDate) {
      filtered = filtered.filter((item) => {
        const itemDate = new Date(item.addedDate);
        const start = new Date(startDate);
        const end = new Date(endDate);

        // Add one day to end date to include the end date in results
        end.setDate(end.getDate() + 1);

        // Check if item date is between start and end dates
        return itemDate >= start && itemDate < end;
      });
    }

    return filtered;
  }, [tab, startDate, endDate, tagFilteredItems]);

  const table = useReactTable({
    data: filteredItems,
    columns,
    initialState: {
      pagination: {
        pageIndex: 0,
        pageSize: 10,
      },
    },
    state: {
      columnFilters,
    },
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), //client-side filtering
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(), // client-side faceting
    getFacetedUniqueValues: getFacetedUniqueValues(), // generate unique values for select filter/autocomplete
    getFacetedMinMaxValues: getFacetedMinMaxValues(), // generate min/max values for range filter
    enableSortingRemoval: false,
  });


  const clearTagFilter = () => {
    setSelectedTag("");
  };

  return (
    <div>
      <div className="space-y-6">
        <section className="mt-4 px-5">
          <div className="flex md:items-center flex-col md:flex-row gap-4 justify-between">
            <div className="w-full flex flex-col sm:flex-row gap-4 justify-start">
              <div className="w-full sm:w-44">
                <FilterInput column={table.getColumn("companyName")!} />
              </div>
              
              {/* Tag Filter Select */}
              {/* <div className="w-full sm:w-64">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <Select
                    value={selectedTag}
                    onValueChange={handleTagChange}
                    disabled={loadingTags}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Filter by Tag" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tags</SelectItem>
                      {loadingTags ? (
                        <SelectItem value="loading" disabled>
                          Loading tags...
                        </SelectItem>
                      ) : (
                        tags.map((tag) => (
                          <SelectItem key={tag.id} value={tag.id.toString()}>
                            {tag.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  {selectedTag && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearTagFilter}
                      className="h-8 px-2"
                    >
                      Clear
                    </Button>
                  )}
                </div>
              </div> */}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 md:items-center">
              <div className="flex items-center gap-4">
                <Link to="/add-company">
                  <Button className="bg-[#7047EB] font-light text-sm hover:bg-[#7047EB] shadow-none text-white rounded-md px-4 py-2">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Add Company
                  </Button>
                </Link>
              </div>
            </div>
          </div>
          
          {/* Selected Tag Info */}
          {selectedTag && (
            <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-blue-800">
                    Showing clients with tag:
                  </span>
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
                    {tags.find(tag => tag.id.toString() === selectedTag)?.name || selectedTag}
                  </span>
                </div>
                {loadingTagItems && (
                  <span className="text-sm text-blue-600">Loading...</span>
                )}
              </div>
            </div>
          )}
        </section>

        <div className="px-5">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/50 border">
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead
                        key={header.id}
                        className="relative h-10 border-t select-none border-r"
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>

            {(isLoading || loadingTagItems) ? (
              <TableLoading columnLength={columns.length} />
            ) : (
              <TableBody>
                {table.getRowModel().rows?.length ? (
                  table.getRowModel().rows.map((row) => (
                    <TableRow
                      key={row.id}
                      data-state={row.getIsSelected() && "selected"}
                      className="border"
                    >
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id} className="border">
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext(),
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-96 text-center"
                    >
                      <div className="w-full flex flex-col gap-3 justify-center items-center">
                        <img src="/folder.svg" alt="" />
                        <h4 className="font-bold text-lg">No Results Found</h4>
                        <p className="max-w-xs text-[#121217] text-sm">
                          {selectedTag 
                            ? "No clients found with the selected tag. Try a different tag or clear the filter."
                            : "Please shorten the search string to see more results."
                          }
                        </p>
                        {selectedTag && (
                          <Button
                            variant="outline"
                            onClick={clearTagFilter}
                            className="mt-2"
                          >
                            Clear Tag Filter
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            )}
          </Table>
        </div>
        {table.getRowModel().rows.length > 0 && (
          <TablePagenation table={table} />
        )}
      </div>
    </div>
  );
};

export default BuyersAndSuppliersTable;