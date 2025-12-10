// src/pages/production/process-details.tsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Trash2,
  ChevronDown,
  ChevronUp,
  Package,
  GitBranch,
  DollarSign,
  Loader2,
  Eye,
  EyeOff,
  Calendar,
  CheckCircle,
  Clock,
  AlertCircle,
  Users,
  Factory,
  Zap,
  Wrench,
  FileText,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { productionAPI, type ProductionItem, type RawMaterialItem, type RoutingStep, type ScrapItem, type OtherCharge } from "@/services/productionService";

// -------------------- TYPES --------------------
interface ProcessDetailsType {
  processNumber: string;
  processName: string;
  status: string;
  stage: string;
  lastModifiedBy: string;
  lastModifiedDate: string;
  createdBy: string;
  creationDate: string;
  orderDeliveryDate: string;
  expectedCompletionDate: string;
  description: string;
  comments: string;
}

interface RelatedProcess {
  processNumber: string;
  stage: string;
  finishedGood: string;
  targetQty: string;
  completedQty: string;
  pendingQty: string;
  approvalState: string;
  serviceOrderNumber: string;
  bom: string;
  creationDate: string;
  orderRelated: string;
}

interface ProcessLevelData {
  expanded: {
    finishedGoods: boolean;
    rawMaterials: boolean;
    routing: boolean;
    scrap: boolean;
    otherCharges: boolean;
  };
  finishedGoods: ProductionItem[];
  rawMaterials: RawMaterialItem[];
  routing: RoutingStep[];
  scrapItems: ScrapItem[];
  otherCharges: OtherCharge[];
}

// -------------------- COMPONENT --------------------
const ProcessDetails: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [showProcessCost, setShowProcessCost] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [processId, setProcessId] = useState<string | null>(null);
  const [processLogsOpen, setProcessLogsOpen] = useState(false);
  
  const [processDetails, setProcessDetails] = useState<ProcessDetailsType>({
    processNumber: "",
    processName: "",
    status: "planned",
    stage: "Planning",
    lastModifiedBy: "",
    lastModifiedDate: "",
    createdBy: "",
    creationDate: "",
    orderDeliveryDate: "",
    expectedCompletionDate: "",
    description: "",
    comments: ""
  });

  const [relatedProcesses, setRelatedProcesses] = useState<RelatedProcess[]>([]);

  const [levels, setLevels] = useState<ProcessLevelData[]>([
    {
      expanded: {
        finishedGoods: true,
        rawMaterials: true,
        routing: true,
        scrap: true,
        otherCharges: true,
      },
      finishedGoods: [],
      rawMaterials: [],
      routing: [],
      scrapItems: [],
      otherCharges: []
    }
  ]);

  // Fetch process details from API
  useEffect(() => {
    const fetchProcessDetails = async () => {
      const id = searchParams.get("processId");
      if (!id) {
        toast.error("No process ID provided");
        navigate("/production");
        return;
      }

      setProcessId(id);

      try {
        setLoading(true);
        const response = await productionAPI.getProductionById(parseInt(id));

        if (response?.status && response.data) {
          const processData = response.data;
          
          // Map API response to process details
          setProcessDetails({
            processNumber: processData.docNumber,
            processName: `Production Process ${processData.docNumber}`,
            status: processData.status,
            stage: getStageFromStatus(processData.status),
            lastModifiedBy: processData.createdBy?.name || "Unknown",
            lastModifiedDate: processData.updatedAt 
              ? new Date(processData.updatedAt).toLocaleDateString('en-GB') + ' - ' + 
                new Date(processData.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : "-",
            createdBy: processData.createdBy?.name || "Unknown",
            creationDate: processData.createdAt 
              ? new Date(processData.createdAt).toLocaleDateString('en-GB') + ' - ' + 
                new Date(processData.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : "-",
            orderDeliveryDate: processData.orderDeliveryDate || "",
            expectedCompletionDate: processData.expectedCompletionDate || "",
            description: "Use this space to describe the process in detail",
            comments: "Use this space to provide guidelines/instructions to the team"
          });

          // Map finished goods from API
          const finishedGoods: ProductionItem[] = processData.productionItems?.map((item, index) => ({
            id: item.id || index + 1,
            itemId: item.itemId,
            itemName: item.itemName || `Finished Good #${index + 1}`,
            quantity: item.quantity || 0,
            unit: item.unit || "pcs",
            costAllocation: 100, // Default cost allocation
            completedQuantity: item.completedQuantity || 0,
            targetQuantity: item.targetQuantity || 0,
            comment: ""
          })) || [];

          // Map raw materials from API
          const rawMaterials: RawMaterialItem[] = processData.rawMaterialItems?.map((item, index) => ({
            id: item.id || index + 1,
            itemId: item.itemId,
            itemName: item.itemName || `Raw Material #${index + 1}`,
            quantity: item.quantity || 0,
            unit: item.unit || "pcs",
            costAllocation: item.costAllocation || 0,
            required: item.required || 0,
            issued: item.issued || 0,
            balance: item.balance || 0,
            comment: ""
          })) || [];

          // Map routing steps from API
          const routingSteps: RoutingStep[] = processData.routingSteps?.map((step, index) => ({
            id: step.id || index + 1,
            routingId: step.routingId,
            name: step.name || `Step ${index + 1}`,
            description: step.description || "",
            comment: step.comment || "",
            completed: step.completed || false,
            startedAt: step.startedAt || "",
            completedAt: step.completedAt || ""
          })) || [];

          // Map scrap items from API
          const scrapItems: ScrapItem[] = processData.scrapItems?.map((item, index) => ({
            id: item.id || index + 1,
            itemId: item.itemId,
            itemName: item.itemName || `Scrap #${index + 1}`,
            quantity: item.quantity || 0,
            unit: item.unit || "kg",
            costAllocation: item.costAllocation || 0,
            comment: ""
          })) || [];

          // Map other charges - hardcoded 4 rows as per requirement
          const otherCharges: OtherCharge[] = [
            {
              id: 1,
              classification: "Labour Charges",
              charges: 0,
              comment: ""
            },
            {
              id: 2,
              classification: "Machinery Charges",
              charges: 0,
              comment: ""
            },
            {
              id: 3,
              classification: "Electricity Charges",
              charges: 0,
              comment: ""
            },
            {
              id: 4,
              classification: "Other Charges",
              charges: 0,
              comment: ""
            }
          ];

          // Update other charges with actual data if available from API
          if (processData.otherCharges && processData.otherCharges.length > 0) {
            processData.otherCharges.forEach((charge, index) => {
              if (index < 4) {
                otherCharges[index] = {
                  ...otherCharges[index],
                  charges: charge.charges || 0,
                  comment: charge.comment || ""
                };
              }
            });
          }

          // Update levels with API data
          setLevels([{
            expanded: {
              finishedGoods: true,
              rawMaterials: true,
              routing: true,
              scrap: true,
              otherCharges: true,
            },
            finishedGoods,
            rawMaterials,
            routing: routingSteps,
            scrapItems,
            otherCharges
          }]);

          // Set related processes (dummy data for now)
          setRelatedProcesses([
            {
              processNumber: processData.docNumber,
              stage: getStageFromStatus(processData.status),
              finishedGood: finishedGoods[0]?.itemName || "Finished Good",
              targetQty: `${finishedGoods[0]?.targetQuantity || 0} ${finishedGoods[0]?.unit || "pcs"}`,
              completedQty: `${finishedGoods[0]?.completedQuantity || 0} ${finishedGoods[0]?.unit || "pcs"}`,
              pendingQty: `${(finishedGoods[0]?.targetQuantity || 0) - (finishedGoods[0]?.completedQuantity || 0)} ${finishedGoods[0]?.unit || "pcs"}`,
              approvalState: "-",
              serviceOrderNumber: "-",
              bom: "-",
              creationDate: processData.createdAt ? new Date(processData.createdAt).toLocaleDateString('en-GB') : "-",
              orderRelated: "-"
            }
          ]);

        } else {
          toast.error("Failed to load process details");
        }
      } catch (error) {
        console.error("Error fetching process details:", error);
        toast.error("Failed to load process details");
      } finally {
        setLoading(false);
      }
    };

    fetchProcessDetails();
  }, [searchParams, navigate]);

  // Helper function to convert status to stage
  const getStageFromStatus = (status: string): string => {
    switch (status) {
      case 'planned': return 'Planning';
      case 'publish': return 'In Progress';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return 'Planning';
    }
  };

  // Calculate costs
  const calculateCosts = () => {
    let totalRawMaterialCost = 0;
    let totalOtherCharges = 0;

    levels.forEach(level => {
      level.rawMaterials.forEach(rm => {
        totalRawMaterialCost += (rm.quantity || 0) * 100; // Assuming price per unit is 100
      });
      level.otherCharges.forEach(oc => {
        totalOtherCharges += oc.charges || 0;
      });
    });

    return {
      totalRawMaterialCost,
      totalOtherCharges,
      totalProcessCost: totalRawMaterialCost + totalOtherCharges
    };
  };

  const costs = calculateCosts();

  // Update process details
  const handleProcessDetailsChange = (field: keyof ProcessDetailsType, value: string) => {
    setProcessDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Update production process
  // const handleUpdateProduction = async () => {
  //   if (!processId) {
  //     toast.error("No process ID found");
  //     return;
  //   }

  //   try {
  //     setSaving(true);
      
  //     const updateData = {
  //       orderDeliveryDate: processDetails.orderDeliveryDate,
  //       expectedCompletionDate: processDetails.expectedCompletionDate,
  //       status: processDetails.status.toLowerCase() as "planned" | "publish" | "completed" | "cancelled"
  //     };

  //     const response = await productionAPI.updateProduction(parseInt(processId), updateData);

  //     if (response.status) {
  //       toast.success("Process updated successfully!");
  //       // Refresh the page data
  //       window.location.reload();
  //     } else {
  //       toast.error(response.message || "Failed to update process");
  //     }
  //   } catch (error) {
  //     console.error("Error updating process:", error);
  //     toast.error("Failed to update process");
  //   } finally {
  //     setSaving(false);
  //   }
  // };

  // Publish process
  const handlePublish = async () => {
    if (!processId) {
      toast.error("No process ID found");
      return;
    }

    try {
      setSaving(true);
      
      const response = await productionAPI.publishProduction(parseInt(processId));

      if (response.status) {
        toast.success("Process publish successfully!");
        setProcessDetails(prev => ({
          ...prev,
          status: "publish",
          stage: "In Progress"
        }));
        // Refresh the page data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(response.message || "Failed to publish process");
      }
    } catch (error) {
      console.error("Error publishing process:", error);
      toast.error("Failed to publish process");
    } finally {
      setSaving(false);
    }
  };

  // Complete process
  const handleComplete = async () => {
    if (!processId) {
      toast.error("No process ID found");
      return;
    }

    try {
      setSaving(true);
      
      const response = await productionAPI.completeProduction(parseInt(processId));

      if (response.status) {
        toast.success("Process completed successfully!");
        setProcessDetails(prev => ({
          ...prev,
          status: "completed",
          stage: "Completed"
        }));
        // Refresh the page data
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else {
        toast.error(response.message || "Failed to complete process");
      }
    } catch (error) {
      console.error("Error completing process:", error);
      toast.error("Failed to complete process");
    } finally {
      setSaving(false);
    }
  };

  // Delete process
  const handleDelete = async () => {
    if (!processId) {
      toast.error("No process ID found");
      return;
    }

    if (!window.confirm("Are you sure you want to delete this production process? This action cannot be undone.")) {
      return;
    }

    try {
      setSaving(true);
      
      const response = await productionAPI.deleteProduction(parseInt(processId));

      if (response.status) {
        toast.success("Process deleted successfully!");
        navigate("/production");
      } else {
        toast.error(response.message || "Failed to delete process");
      }
    } catch (error) {
      console.error("Error deleting process:", error);
      toast.error("Failed to delete process");
    } finally {
      setSaving(false);
    }
  };

  // Component for each process level
  const ProcessLevel: React.FC<{
    levelIndex: number;
    data: ProcessLevelData;
  }> = ({ levelIndex, data }) => {
    const toggleLocalSection = (section: keyof ProcessLevelData["expanded"]) => {
      const updatedLevel = { ...data };
      updatedLevel.expanded[section] = !updatedLevel.expanded[section];
      const updatedLevels = [...levels];
      updatedLevels[levelIndex] = updatedLevel;
      setLevels(updatedLevels);
    };

    return (
      <div className="border-2 border-gray-200 rounded-lg bg-white mt-8 first:mt-0 shadow-sm">
        {/* Level Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-[#105076] text-white rounded-t-lg">
          <h2 className="text-xl font-bold">Process Level {levelIndex + 1}</h2>
        </div>

        {/* Finished Goods Section */}
        <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 border-b" 
             onClick={() => toggleLocalSection("finishedGoods")}>
          <h3 className="text-lg font-semibold flex items-center gap-2 text-[#105076]">
            <Package className="h-5 w-5 text-green-600" /> Finished Goods
          </h3>
          {data.expanded.finishedGoods ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {data.expanded.finishedGoods && (
          <div className="p-6 border-b bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Finished Goods List</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">ITEM ID</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">ITEM NAME</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">QUANTITY</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">UNIT</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">COST ALLOC (%)</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">TARGET QTY</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">COMPLETED QTY</th>
                  </tr>
                </thead>
                <tbody>
                  {data.finishedGoods.map((fg) => (
                    <tr key={fg.id} className="border-t hover:bg-white">
                      <td className="px-4 py-3 border font-medium">{fg.itemId}</td>
                      <td className="px-4 py-3 border font-medium">{fg.itemName}</td>
                      <td className="px-4 py-3 border text-center">{fg.quantity}</td>
                      <td className="px-4 py-3 border text-center">{fg.unit}</td>
                      <td className="px-4 py-3 border text-center">{fg.costAllocation}%</td>
                      <td className="px-4 py-3 border text-center">{fg.targetQuantity}</td>
                      <td className="px-4 py-3 border text-center">{fg.completedQuantity}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Raw Materials Section */}
        <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 border-b" 
             onClick={() => toggleLocalSection("rawMaterials")}>
          <h3 className="text-lg font-semibold flex items-center gap-2 text-[#105076]">
            <Package className="h-5 w-5 text-blue-600" /> Raw Materials
          </h3>
          {data.expanded.rawMaterials ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {data.expanded.rawMaterials && (
          <div className="p-6 border-b bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Raw Materials Required</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">ITEM ID</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">ITEM NAME</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">QUANTITY</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">UNIT</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">COST ALLOC (%)</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">REQUIRED</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">ISSUED</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">BALANCE</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rawMaterials.map((rm) => (
                    <tr key={rm.id} className="border-t hover:bg-white">
                      <td className="px-4 py-3 border font-medium">{rm.itemId}</td>
                      <td className="px-4 py-3 border">{rm.itemName}</td>
                      <td className="px-4 py-3 border text-center">{rm.quantity}</td>
                      <td className="px-4 py-3 border text-center">{rm.unit}</td>
                      <td className="px-4 py-3 border text-center">{rm.costAllocation}%</td>
                      <td className="px-4 py-3 border text-center">{rm.required}</td>
                      <td className="px-4 py-3 border text-center">{rm.issued}</td>
                      <td className="px-4 py-3 border text-center">{rm.balance}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Routing Section */}
        <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 border-b" 
             onClick={() => toggleLocalSection("routing")}>
          <h3 className="text-lg font-semibold flex items-center gap-2 text-[#105076]">
            <GitBranch className="h-5 w-5 text-purple-600" /> Routing / Process Steps
          </h3>
          {data.expanded.routing ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {data.expanded.routing && (
          <div className="p-6 border-b bg-gray-50">
            {data.routing.length > 0 ? (
              <div className="space-y-4">
                {data.routing.map((route) => (
                  <div key={route.id} className="border rounded-lg p-4 bg-white">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-lg">{route.name}</h4>
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs rounded ${route.completed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {route.completed ? 'Completed' : 'Pending'}
                        </span>
                      </div>
                    </div>
                    {route.description && (
                      <p className="text-sm text-gray-600 mb-3">{route.description}</p>
                    )}
                    {route.comment && (
                      <p className="text-sm text-gray-500 mb-3">Comment: {route.comment}</p>
                    )}
                    <div className="flex justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        <span>Started: {route.startedAt || 'Not started'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3 w-3" />
                        <span>Completed: {route.completedAt || 'Not completed'}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No routing steps defined
              </div>
            )}
          </div>
        )}

        {/* Scrap Section */}
        <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50 border-b" 
             onClick={() => toggleLocalSection("scrap")}>
          <h3 className="text-lg font-semibold flex items-center gap-2 text-[#105076]">
            <Trash2 className="h-5 w-5 text-orange-600" /> Scrap Materials
          </h3>
          {data.expanded.scrap ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {data.expanded.scrap && (
          <div className="p-6 border-b bg-gray-50">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Scrap Materials</h4>
            </div>
            {data.scrapItems.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border">ITEM ID</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border">ITEM NAME</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border">QUANTITY</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border">UNIT</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-700 border">COST ALLOC (%)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.scrapItems.map((scrap) => (
                      <tr key={scrap.id} className="border-t hover:bg-white">
                        <td className="px-4 py-3 border font-medium">{scrap.itemId}</td>
                        <td className="px-4 py-3 border">{scrap.itemName}</td>
                        <td className="px-4 py-3 border text-center">{scrap.quantity}</td>
                        <td className="px-4 py-3 border text-center">{scrap.unit}</td>
                        <td className="px-4 py-3 border text-center">{scrap.costAllocation}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-4 text-gray-500">
                No scrap materials defined
              </div>
            )}
          </div>
        )}

        {/* Other Charges Section */}
        <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-gray-50" 
             onClick={() => toggleLocalSection("otherCharges")}>
          <h3 className="text-lg font-semibold flex items-center gap-2 text-[#105076]">
            <DollarSign className="h-5 w-5 text-teal-600" /> Other Charges
          </h3>
          {data.expanded.otherCharges ? <ChevronUp /> : <ChevronDown />}
        </div>
        
        {data.expanded.otherCharges && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-medium">Other Charges</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">#</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">CLASSIFICATION</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">ESTIMATED AMOUNT</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">ACTUAL AMOUNT</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700 border">COMMENT</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Hardcoded 4 compulsory rows */}
                  {data.otherCharges.map((charge, index) => (
                    <tr key={charge.id} className="border-t hover:bg-white">
                      <td className="px-4 py-3 border">{index + 1}</td>
                      <td className="px-4 py-3 border">
                        <div className="flex items-center gap-2">
                          {index === 0 && <Users className="h-4 w-4 text-gray-400" />}
                          {index === 1 && <Factory className="h-4 w-4 text-gray-400" />}
                          {index === 2 && <Zap className="h-4 w-4 text-gray-400" />}
                          {index === 3 && <Wrench className="h-4 w-4 text-gray-400" />}
                          <span className="font-medium">{charge.classification}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 border">
                        <Input 
                          type="number" 
                          value={charge.charges}
                          onChange={(e) => {
                            const updatedLevels = [...levels];
                            updatedLevels[levelIndex].otherCharges[index].charges = parseFloat(e.target.value) || 0;
                            setLevels(updatedLevels);
                          }}
                          className="w-32 text-right" 
                        />
                      </td>
                      <td className="px-4 py-3 border">
                        <Input 
                          type="number" 
                          value={0}
                          className="w-32 text-right bg-gray-50" 
                          readOnly
                        />
                      </td>
                      <td className="px-4 py-3 border">
                        <Input 
                          value={charge.comment || ""}
                          onChange={(e) => {
                            const updatedLevels = [...levels];
                            updatedLevels[levelIndex].otherCharges[index].comment = e.target.value;
                            setLevels(updatedLevels);
                          }}
                          className="border-0" 
                          placeholder="Add comment..."
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Process Logs Dialog Component
  const ProcessLogsDialog = () => (
    <Dialog open={processLogsOpen} onOpenChange={setProcessLogsOpen}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-gray-800">
            Process Logs
          </DialogTitle>
          <DialogDescription className="text-gray-600">
            View all activities and changes made to this production process.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto pr-4">
          <div className="space-y-6">
            {/* Process Information Summary */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Process Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Process ID:</span>
                  <span className="font-medium ml-2">{processDetails.processNumber}</span>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium ml-2 capitalize">{processDetails.status}</span>
                </div>
                <div>
                  <span className="text-gray-600">Created By:</span>
                  <span className="font-medium ml-2">{processDetails.createdBy}</span>
                </div>
                <div>
                  <span className="text-gray-600">Created Date:</span>
                  <span className="font-medium ml-2">{processDetails.creationDate}</span>
                </div>
              </div>
            </div>

            {/* Logs Table */}
            <div>
              <h3 className="font-semibold text-gray-700 mb-3">Activity Log</h3>
              <div className="border rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Timestamp</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Action</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">User</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {/* Placeholder for logs - Replace with actual data from API */}
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-gray-600">2024-01-15 14:30:00</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Created</span>
                        </td>
                        <td className="px-4 py-3 font-medium">{processDetails.createdBy}</td>
                        <td className="px-4 py-3 text-gray-600">
                          Production process created with ID {processDetails.processNumber}
                        </td>
                      </tr>
                      <tr className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div className="text-gray-600">2024-01-16 10:15:00</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Updated</span>
                        </td>
                        <td className="px-4 py-3 font-medium">{processDetails.lastModifiedBy}</td>
                        <td className="px-4 py-3 text-gray-600">
                          Updated expected completion date
                        </td>
                      </tr>
                      {processDetails.status === 'publish' && (
                        <tr className="hover:bg-gray-50">
                          <td className="px-4 py-3">
                            <div className="text-gray-600">{processDetails.lastModifiedDate}</div>
                          </td>
                          <td className="px-4 py-3">
                            <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">publish</span>
                          </td>
                          <td className="px-4 py-3 font-medium">{processDetails.lastModifiedBy}</td>
                          <td className="px-4 py-3 text-gray-600">
                            Process publish and moved to In Progress status
                          </td>
                        </tr>
                      )}
                      {/* Add more log entries here based on actual API data */}
                    </tbody>
                  </table>
                </div>
              </div>
              
              {/* No Logs Message */}
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No logs available yet. Logs will appear as actions are performed on this process.</p>
              </div>
            </div>

            {/* Export Section */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold text-gray-700 mb-2">Export Logs</h3>
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  Export as CSV
                </Button>
                <Button variant="outline" size="sm">
                  Export as PDF
                </Button>
                <Button variant="outline" size="sm">
                  Print Logs
                </Button>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-6 pt-4 border-t">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
          <Button onClick={() => {
            // Implement refresh logs functionality here
            toast.info("Refreshing logs...");
          }}>
            Refresh Logs
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading production process details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Process ID and Status */}
      <div className="bg-white border-b">
        <div className="max-w-8xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-6 h-6" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Production Process Details</h1>
                <div className="flex items-center gap-4 mt-1">
                  <div className="text-sm text-gray-500">
                    Process ID: <span className="font-semibold text-gray-700">{processDetails.processNumber}</span>
                  </div>
                  <div className="text-sm">
                    Status: <span className={`font-semibold ${
                      processDetails.status === 'planned' ? 'text-blue-600' :
                      processDetails.status === 'publish' ? 'text-yellow-600' :
                      processDetails.status === 'completed' ? 'text-green-600' :
                      'text-red-600'
                    }`}>
                      {processDetails.status.charAt(0).toUpperCase() + processDetails.status.slice(1)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {/* View Process Cost Toggle Button */}
              <Button
                variant="outline"
                onClick={() => setShowProcessCost(!showProcessCost)}
                className={`flex items-center gap-2 ${
                  showProcessCost ? "bg-blue-50 border-blue-200 text-blue-700" : ""
                }`}
              >
                {showProcessCost ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showProcessCost ? "Hide Cost" : "View Process Cost"}
              </Button>

              {/* Delete Button (only for planned status) */}
              {processDetails.status === 'planned' && (
                <Button 
                  variant="outline"
                  onClick={handleDelete}
                  disabled={saving}
                  className="text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </Button>
              )}

              {/* Complete Button (only for publish status) */}
              {processDetails.status === 'publish' && (
                <Button 
                  variant="outline"
                  onClick={handleComplete}
                  disabled={saving}
                  className="text-green-600 border-green-200 hover:bg-green-50 hover:text-green-700"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Complete Process
                </Button>
              )}

              {/* Process Logs Button */}
              <Dialog open={processLogsOpen} onOpenChange={setProcessLogsOpen}>
                <DialogTrigger asChild>
                  <Button 
                    variant="outline"
                    disabled={saving}
                    className="flex items-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    Process Logs
                  </Button>
                </DialogTrigger>
                <ProcessLogsDialog />
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-8xl mx-auto px-8 py-6">
        {/* Process Details */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Process Details</h2>
          </div>
          <div className="p-6">
            {/* Process Information */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Last Modified By:</span>
                  <span className="text-sm">{processDetails.lastModifiedBy}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Creation Date:</span>
                  <span className="text-sm">{processDetails.creationDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Created By:</span>
                  <span className="text-sm">{processDetails.createdBy}</span>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-600">Process Name:</span>
                  <Input 
                    value={processDetails.processName}
                    onChange={(e) => handleProcessDetailsChange('processName', e.target.value)}
                    className="w-48"
                  />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Last Modified Date:</span>
                  <span className="text-sm">{processDetails.lastModifiedDate}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600">Status:</span>
                  <span className={`px-2 py-1 text-xs rounded ${
                    processDetails.status === 'planned' ? 'bg-blue-100 text-blue-800' :
                    processDetails.status === 'publish' ? 'bg-yellow-100 text-yellow-800' :
                    processDetails.status === 'completed' ? 'bg-green-100 text-green-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {processDetails.status.charAt(0).toUpperCase() + processDetails.status.slice(1)}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery Dates */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Order Delivery Date</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="date"
                    value={processDetails.orderDeliveryDate}
                    onChange={(e) => handleProcessDetailsChange('orderDeliveryDate', e.target.value)}
                    className="flex-1"
                  />
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium text-gray-700">Expected Completion Date</Label>
                <div className="flex items-center gap-2">
                  <Input 
                    type="date"
                    value={processDetails.expectedCompletionDate}
                    onChange={(e) => handleProcessDetailsChange('expectedCompletionDate', e.target.value)}
                    className="flex-1"
                  />
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Description and Comments */}
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Process Description
                </Label>
                <Textarea 
                  value={processDetails.description}
                  onChange={(e) => handleProcessDetailsChange('description', e.target.value)}
                  className="min-h-[100px] text-sm"
                  placeholder="Use this space to describe the process in detail"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Comments & Instructions
                </Label>
                <Textarea 
                  value={processDetails.comments}
                  onChange={(e) => handleProcessDetailsChange('comments', e.target.value)}
                  className="min-h-[100px] text-sm"
                  placeholder="Use this space to provide guidelines/instructions to the team"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Related Processes Table with Horizontal Scroll */}
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b">
            <h2 className="text-lg font-semibold">Related Processes</h2>
          </div>
          <div className="p-6">
            {relatedProcesses.length > 0 ? (
              <div className="overflow-x-auto">
                <div className="min-w-full inline-block align-middle">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">PROCESS NUMBER</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">STAGE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">FINISHED GOOD</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">TARGET QTY.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">COMPLETED QTY.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">PENDING QTY.</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">APPROVAL STATE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">SERVICE ORDER NUMBER</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">BOM</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">CREATION DATE</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider whitespace-nowrap">ORDER RELATED</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {relatedProcesses.map((process, index) => (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{process.processNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs rounded ${
                              process.stage === 'Planning' ? 'bg-blue-100 text-blue-800' :
                              process.stage === 'In Progress' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {process.stage}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{process.finishedGood}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{process.targetQty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{process.completedQty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{process.pendingQty}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{process.approvalState}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{process.serviceOrderNumber}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 cursor-pointer hover:underline">
                            {process.bom}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{process.creationDate}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{process.orderRelated}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No related processes found
              </div>
            )}
          </div>
        </div>

        {/* Process Cost Section */}
        {showProcessCost && (
          <div className="bg-white rounded-lg shadow-sm border mb-6">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Process Cost Summary</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-3 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Raw Materials Cost</h3>
                  <p className="text-2xl font-bold text-blue-600">₹{costs.totalRawMaterialCost.toFixed(2)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Other Charges</h3>
                  <p className="text-2xl font-bold text-green-600">₹{costs.totalOtherCharges.toFixed(2)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="text-sm font-medium text-gray-600 mb-1">Total Process Cost</h3>
                  <p className="text-2xl font-bold text-purple-600">₹{costs.totalProcessCost.toFixed(2)}</p>
                </div>
              </div>

              {/* Raw Materials Cost Table */}
              {levels[0].rawMaterials.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-gray-700 mb-4">Raw Materials Cost Breakdown</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm border">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left font-medium text-gray-700 border">ITEM NAME</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700 border">QUANTITY</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700 border">UNIT</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700 border">EST. PRICE/UNIT</th>
                          <th className="px-4 py-3 text-left font-medium text-gray-700 border">TOTAL COST</th>
                        </tr>
                      </thead>
                      <tbody>
                        {levels[0].rawMaterials.map((rm, index) => (
                          <tr key={index} className="border-t hover:bg-gray-50">
                            <td className="px-4 py-3 border">{rm.itemName}</td>
                            <td className="px-4 py-3 border text-right">{rm.quantity}</td>
                            <td className="px-4 py-3 border">{rm.unit}</td>
                            <td className="px-4 py-3 border text-right">₹100.00</td>
                            <td className="px-4 py-3 border text-right">₹{(rm.quantity * 100).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-gray-50">
                          <td colSpan={4} className="px-4 py-3 border text-right font-semibold">Total Raw Materials Cost:</td>
                          <td className="px-4 py-3 border text-right font-semibold">₹{costs.totalRawMaterialCost.toFixed(2)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )}

              {/* Other Charges Table */}
              <div>
                <h3 className="font-semibold text-gray-700 mb-4">Other Charges Breakdown</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border">#</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border">CLASSIFICATION</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border">ESTIMATED AMOUNT</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border">ACTUAL AMOUNT</th>
                        <th className="px-4 py-3 text-left font-medium text-gray-700 border">COMMENT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {levels[0].otherCharges.map((charge, index) => (
                        <tr key={index} className="border-t hover:bg-gray-50">
                          <td className="px-4 py-3 border">{index + 1}</td>
                          <td className="px-4 py-3 border font-medium">{charge.classification}</td>
                          <td className="px-4 py-3 border text-right">₹{charge.charges.toFixed(2)}</td>
                          <td className="px-4 py-3 border text-right">₹0.00</td>
                          <td className="px-4 py-3 border">{charge.comment || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-gray-50">
                        <td colSpan={2} className="px-4 py-3 border text-right font-semibold">Total Other Charges:</td>
                        <td className="px-4 py-3 border text-right font-semibold">₹{costs.totalOtherCharges.toFixed(2)}</td>
                        <td className="px-4 py-3 border"></td>
                        <td className="px-4 py-3 border"></td>
                      </tr>
                      <tr className="bg-green-50">
                        <td colSpan={2} className="px-4 py-3 border text-right font-bold text-lg">Total Process Cost:</td>
                        <td className="px-4 py-3 border font-bold text-lg text-green-600">₹{costs.totalProcessCost.toFixed(2)}</td>
                        <td className="px-4 py-3 border"></td>
                        <td className="px-4 py-3 border"></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* All Process Levels */}
        {levels.map((levelData, idx) => (
          <ProcessLevel
            key={idx}
            levelIndex={idx}
            data={levelData}
          />
        ))}

        {/* Footer Buttons */}
        <div className="sticky bottom-0 border-t bg-white shadow-lg mt-8">
          <div className="max-w-8xl mx-auto px-6 py-4 flex justify-between">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <AlertCircle className="h-4 w-4" />
              <span>Process ID: {processDetails.processNumber}</span>
              <span className="mx-2">•</span>
              <span>Status: {processDetails.status}</span>
            </div>
            <div className="flex gap-4">
              {processDetails.status === 'planned' && (
                <Button 
                  onClick={handlePublish} 
                  className="bg-[#105076] hover:bg-[#0d4566]" 
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                  Publish Process
                </Button>
              )}
              {processDetails.status === 'publish' && (
                <Button 
                  onClick={handleComplete} 
                  className="bg-green-600 hover:bg-green-700" 
                  disabled={saving}
                >
                  {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                  Complete Process
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProcessDetails;