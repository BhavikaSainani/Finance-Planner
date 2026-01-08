import { useToast } from "@/components/ui/use-toast";
import { forwardRef } from "react";

const UploadStatement = forwardRef((props, ref) => {
  const { toast } = useToast();

  return (
    <input
      ref={ref}
      type="file"
      accept=".csv"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        console.log("Uploaded file:", file.name);

        toast({
          title: "Statement uploaded ✅",
          description: file.name,
        });
      }}
    />
  );
});

UploadStatement.displayName = "UploadStatement";
export default UploadStatement;
