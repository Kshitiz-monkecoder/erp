import React from "react";
import { TableBody, TableCell, TableRow } from "../ui/table";
import { LoaderCircle } from "lucide-react";

interface ITableLoadingProps {
  columnLength: number;
}

const TableLoading: React.FC<ITableLoadingProps> = ({ columnLength }) => {
  return (
    <TableBody>
      <TableRow>
        <TableCell colSpan={columnLength} className="h-96 text-center p-0">
          <div className="flex justify-center items-center h-44 w-full">
            <LoaderCircle className="text-neutral-500 w-6 animate-spin" />
          </div>
        </TableCell>
      </TableRow>
    </TableBody>
  );
};
export default TableLoading;
