import { CircleCheck } from "lucide-react";
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

const SuccessToast = (toast: Omit<ToastProps, "id">) => {
  return sonnerToast.custom((id) => (
    <Toast id={id} title={toast.title} description={toast.description} />
  ));
};

const Toast = (props: ToastProps) => {
  const { title, description } = props;
  return (
    <div className="flex rounded-lg bg-green-100 border border-green-200 md:w-full md:max-w-84 items-center p-4">
      <div className="flex flex-1 items-center">
        <div className="w-full flex items-center gap-2">
          <CircleCheck className="w-5 text-green-600" />
          <div className="flex flex-col">
            <p className="text-sm font-medium text-green-600 w-fit">{title}</p>
            <p className="text-xs text-green-600 flex flex-wrap">
              {description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessToast;
