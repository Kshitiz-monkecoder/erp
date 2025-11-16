import { Ban } from "lucide-react";
import { toast as sonnerToast } from "sonner";

interface ToastProps {
  id: string | number;
  title: string;
  description: string;
  button?: {
    label: string;
    onClick: () => void;
  };
}

const ErrorToast = (toast: Omit<ToastProps, "id">) => {
  return sonnerToast.custom((id) => (
    <Toast id={id} title={toast.title} description={toast.description} />
  ));
};

const Toast = (props: ToastProps) => {
  const { title, description } = props;
  return (
    <div className="flex rounded-lg bg-red-100 border border-red-200 md:w-full md:min-w-72 md:max-w-84 items-center p-4">
      <div className="flex flex-1 items-center">
        <div className="w-full flex items-center gap-2">
          <Ban className="w-5 text-red-600" />
          <div className="flex flex-col">
            <p className="text-sm font-medium text-red-600 w-fit">{title}</p>
            <p className="text-xs text-red-600 flex flex-wrap">{description}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorToast;
