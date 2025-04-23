import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { FileText, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FormSelectorProps {
  onSelect: (formId: number) => void;
  selectedFormId?: number;
  triggerComponent?: React.ReactNode;
  buttonText?: string;
}

interface Form {
  id: number;
  name: string;
  fields: any;
  createdAt: string;
}

const FormSelector: React.FC<FormSelectorProps> = ({
  onSelect,
  selectedFormId,
  triggerComponent,
  buttonText = "Chọn biểu mẫu"
}) => {
  const [open, setOpen] = useState(false);
  const [selectedForm, setSelectedForm] = useState<string | undefined>(
    selectedFormId ? selectedFormId.toString() : undefined
  );
  const { toast } = useToast();

  // Load danh sách các biểu mẫu
  const { data: forms = [], isLoading, error } = useQuery<Form[]>({
    queryKey: ['/api/forms'],
    staleTime: 10000,
  });

  useEffect(() => {
    if (selectedFormId) {
      setSelectedForm(selectedFormId.toString());
    }
  }, [selectedFormId]);

  const handleSelect = () => {
    if (!selectedForm) {
      toast({
        title: "Lỗi",
        description: "Vui lòng chọn một biểu mẫu",
        variant: "destructive",
      });
      return;
    }

    onSelect(parseInt(selectedForm));
    setOpen(false);
  };

  return (
    <>
      {triggerComponent ? (
        <div onClick={() => setOpen(true)}>{triggerComponent}</div>
      ) : (
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={() => setOpen(true)}
        >
          <FileText className="mr-2 h-4 w-4" />
          {selectedFormId
            ? forms.find(f => f.id === selectedFormId)?.name || buttonText
            : buttonText}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Chọn biểu mẫu</DialogTitle>
            <DialogDescription>
              Chọn biểu mẫu có sẵn trong danh sách hoặc tạo mới
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            {isLoading ? (
              <div className="text-center py-4">Đang tải...</div>
            ) : error ? (
              <div className="text-center py-4 text-destructive">
                Lỗi khi tải danh sách biểu mẫu
              </div>
            ) : forms.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Chưa có biểu mẫu nào. Hãy tạo biểu mẫu mới.
              </div>
            ) : (
              <Select 
                value={selectedForm} 
                onValueChange={setSelectedForm}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Chọn biểu mẫu" />
                </SelectTrigger>
                <SelectContent>
                  {forms.map((form) => (
                    <SelectItem key={form.id} value={form.id.toString()}>
                      {form.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button 
              variant="outline" 
              onClick={() => setOpen(false)}
            >
              Hủy
            </Button>
            <Button
              onClick={handleSelect}
              disabled={!selectedForm}
            >
              Chọn
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default FormSelector;