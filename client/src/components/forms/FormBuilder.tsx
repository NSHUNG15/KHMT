import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Trash, GripVertical, Plus, Settings, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Định nghĩa các loại field có thể thêm vào form
const fieldTypes = [
  { value: "text", label: "Văn bản ngắn" },
  { value: "textarea", label: "Văn bản dài" },
  { value: "number", label: "Số" },
  { value: "email", label: "Email" },
  { value: "date", label: "Ngày tháng" },
  { value: "select", label: "Lựa chọn" },
  { value: "radio", label: "Lựa chọn một" },
  { value: "checkbox", label: "Hộp kiểm" },
];

// Interface cho một field
interface FormField {
  id: string;
  type: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  description?: string;
}

// Props cho component
interface FormBuilderProps {
  initialFields?: FormField[];
  onChange: (fields: FormField[]) => void;
  readOnly?: boolean;
}

const FormBuilder: React.FC<FormBuilderProps> = ({
  initialFields = [],
  onChange,
  readOnly = false,
}) => {
  const { toast } = useToast();
  const [fields, setFields] = useState<FormField[]>(initialFields || []);
  const [editingField, setEditingField] = useState<FormField | null>(null);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Thêm field mới
  const handleAddField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      type: "text",
      label: "Câu hỏi mới",
      placeholder: "",
      required: false,
      options: ["Tùy chọn 1", "Tùy chọn 2"],
    };
    setEditingField(newField);
    setIsFieldDialogOpen(true);
  };

  // Lưu field đang chỉnh sửa
  const handleSaveField = () => {
    if (editingField) {
      if (!editingField.label.trim()) {
        toast({
          title: "Lỗi",
          description: "Tên trường không được để trống",
          variant: "destructive",
        });
        return;
      }

      let updatedFields: FormField[];
      
      // Kiểm tra xem đang thêm mới hay cập nhật
      const existingFieldIndex = fields.findIndex(f => f.id === editingField.id);
      
      if (existingFieldIndex >= 0) {
        // Cập nhật field hiện có
        updatedFields = fields.map((field, index) => 
          index === existingFieldIndex ? editingField : field
        );
      } else {
        // Thêm field mới
        updatedFields = [...fields, editingField];
      }
      
      setFields(updatedFields);
      onChange(updatedFields);
      setIsFieldDialogOpen(false);
      setEditingField(null);
    }
  };

  // Xóa một field
  const handleDeleteField = (id: string) => {
    const updatedFields = fields.filter(field => field.id !== id);
    setFields(updatedFields);
    onChange(updatedFields);
  };

  // Mở dialog chỉnh sửa field
  const handleEditField = (field: FormField) => {
    setEditingField({...field});
    setIsFieldDialogOpen(true);
  };

  // Xử lý kéo thả để sắp xếp lại các field
  const handleDragEnd = (result: any) => {
    if (!result.destination) return;

    const items = Array.from(fields);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    setFields(items);
    onChange(items);
  };

  // Xử lý thêm option mới cho select, radio, checkbox
  const handleAddOption = () => {
    if (!editingField) return;
    const options = editingField.options || [];
    setEditingField({
      ...editingField,
      options: [...options, `Tùy chọn ${options.length + 1}`]
    });
  };

  // Xử lý xóa option
  const handleDeleteOption = (index: number) => {
    if (!editingField || !editingField.options) return;
    const options = [...editingField.options];
    options.splice(index, 1);
    setEditingField({
      ...editingField,
      options: options
    });
  };

  // Xử lý cập nhật option
  const handleUpdateOption = (index: number, value: string) => {
    if (!editingField || !editingField.options) return;
    const options = [...editingField.options];
    options[index] = value;
    setEditingField({
      ...editingField,
      options: options
    });
  };

  // Render các options cho select, radio, checkbox
  const renderOptions = () => {
    if (!editingField || !["select", "radio", "checkbox"].includes(editingField.type)) return null;
    
    return (
      <div className="space-y-3 mt-4">
        <div className="flex justify-between items-center">
          <Label>Các tùy chọn</Label>
          <Button 
            type="button" 
            size="sm" 
            variant="outline" 
            onClick={handleAddOption}
          >
            <Plus className="w-4 h-4 mr-2" /> Thêm
          </Button>
        </div>
        
        <div className="space-y-2">
          {editingField.options?.map((option, index) => (
            <div key={index} className="flex items-center space-x-2">
              <Input
                value={option}
                onChange={(e) => handleUpdateOption(index, e.target.value)}
                placeholder={`Tùy chọn ${index + 1}`}
              />
              <Button 
                type="button" 
                size="icon" 
                variant="ghost" 
                onClick={() => handleDeleteOption(index)}
              >
                <Trash className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Render một field để xem trước
  const renderPreviewField = (field: FormField) => {
    switch(field.type) {
      case 'text':
      case 'email':
      case 'number':
        return (
          <Input
            type={field.type}
            placeholder={field.placeholder}
            disabled
          />
        );
      case 'textarea':
        return (
          <Textarea
            placeholder={field.placeholder}
            disabled
          />
        );
      case 'date':
        return (
          <Input
            type="date"
            disabled
          />
        );
      case 'select':
        return (
          <Select disabled>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder || "Chọn..."} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option, i) => (
                <SelectItem key={i} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case 'radio':
        return (
          <div className="space-y-2">
            {field.options?.map((option, i) => (
              <div key={i} className="flex items-center space-x-2">
                <input type="radio" disabled id={`preview-${field.id}-${i}`} />
                <Label htmlFor={`preview-${field.id}-${i}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      case 'checkbox':
        return (
          <div className="space-y-2">
            {field.options?.map((option, i) => (
              <div key={i} className="flex items-center space-x-2">
                <input type="checkbox" disabled id={`preview-${field.id}-${i}`} />
                <Label htmlFor={`preview-${field.id}-${i}`}>{option}</Label>
              </div>
            ))}
          </div>
        );
      default:
        return <Input disabled />;
    }
  };

  // Sắp xếp các fields
  const moveField = (fromIndex: number, toIndex: number) => {
    const updatedFields = [...fields];
    const [movedItem] = updatedFields.splice(fromIndex, 1);
    updatedFields.splice(toIndex, 0, movedItem);
    setFields(updatedFields);
    onChange(updatedFields);
  };

  return (
    <div className="w-full">
      {/* Action buttons */}
      {!readOnly && (
        <div className="flex justify-between mb-4">
          <Button
            variant="outline"
            onClick={() => setIsPreviewOpen(true)}
          >
            <Eye className="w-4 h-4 mr-2" />
            Xem trước
          </Button>
          
          <Button onClick={handleAddField}>
            <Plus className="w-4 h-4 mr-2" />
            Thêm trường
          </Button>
        </div>
      )}

      {/* Field list */}
      <div className="space-y-3">
        {fields.length === 0 ? (
          <div className="text-center p-8 border border-dashed rounded-md">
            <p className="text-muted-foreground">
              {readOnly 
                ? "Biểu mẫu này chưa có trường nào." 
                : "Biểu mẫu trống. Nhấn 'Thêm trường' để bắt đầu tạo biểu mẫu."}
            </p>
          </div>
        ) : (
          fields.map((field, index) => (
            <div
              key={field.id}
              className="border rounded-md p-3 bg-card relative"
            >
              <div className="flex justify-between items-start mb-1">
                <div className="flex items-center">
                  {!readOnly && (
                    <div className="flex flex-col mr-2 text-muted-foreground">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => index > 0 && moveField(index, index - 1)}
                        disabled={index === 0}
                        className="h-5 w-5"
                      >
                        ↑
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => index < fields.length - 1 && moveField(index, index + 1)}
                        disabled={index === fields.length - 1}
                        className="h-5 w-5"
                      >
                        ↓
                      </Button>
                    </div>
                  )}
                  <div>
                    <p className="font-medium">{field.label}</p>
                    <p className="text-xs text-muted-foreground">
                      {fieldTypes.find(t => t.value === field.type)?.label || field.type}
                      {field.required && " • Bắt buộc"}
                    </p>
                  </div>
                </div>
                
                {!readOnly && (
                  <div className="flex space-x-1">
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleEditField(field)}
                    >
                      <Settings className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => handleDeleteField(field.id)}
                    >
                      <Trash className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                )}
              </div>
              
              {field.description && (
                <p className="text-sm text-muted-foreground mb-2">{field.description}</p>
              )}
            </div>
          ))
        )}
      </div>

      {/* Field edit dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingField && fields.some(f => f.id === editingField.id) 
                ? "Chỉnh sửa trường" 
                : "Thêm trường mới"}
            </DialogTitle>
            <DialogDescription>
              Thiết lập thông tin cho trường trong biểu mẫu
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="field-type">Loại trường</Label>
              <Select
                value={editingField?.type}
                onValueChange={(value) => 
                  setEditingField(prev => prev ? {...prev, type: value} : null)
                }
              >
                <SelectTrigger id="field-type">
                  <SelectValue placeholder="Chọn loại trường" />
                </SelectTrigger>
                <SelectContent>
                  {fieldTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="field-label">Nhãn</Label>
              <Input
                id="field-label"
                value={editingField?.label || ""}
                onChange={(e) => 
                  setEditingField(prev => prev ? {...prev, label: e.target.value} : null)
                }
                placeholder="Nhập nhãn cho trường"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="field-description">Mô tả (tùy chọn)</Label>
              <Input
                id="field-description"
                value={editingField?.description || ""}
                onChange={(e) => 
                  setEditingField(prev => prev ? {...prev, description: e.target.value} : null)
                }
                placeholder="Nhập mô tả cho trường"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="field-placeholder">Hướng dẫn nhập</Label>
              <Input
                id="field-placeholder"
                value={editingField?.placeholder || ""}
                onChange={(e) => 
                  setEditingField(prev => prev ? {...prev, placeholder: e.target.value} : null)
                }
                placeholder="Ví dụ: Nhập họ và tên của bạn"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="field-required"
                checked={editingField?.required || false}
                onCheckedChange={(checked) => 
                  setEditingField(prev => prev ? {...prev, required: checked} : null)
                }
              />
              <Label htmlFor="field-required">Bắt buộc</Label>
            </div>

            {/* Options cho select, radio, checkbox */}
            {renderOptions()}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsFieldDialogOpen(false);
                setEditingField(null);
              }}
            >
              Hủy
            </Button>
            <Button onClick={handleSaveField}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form preview dialog */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Xem trước biểu mẫu</DialogTitle>
            <DialogDescription>
              Đây là cách biểu mẫu sẽ hiển thị với người dùng
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            {fields.length === 0 ? (
              <div className="text-center p-8 border border-dashed rounded-md">
                <p className="text-muted-foreground">
                  Biểu mẫu này chưa có trường nào.
                </p>
              </div>
            ) : (
              fields.map((field) => (
                <div key={field.id} className="space-y-2">
                  <Label>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {field.description && (
                    <p className="text-sm text-muted-foreground">{field.description}</p>
                  )}
                  {renderPreviewField(field)}
                </div>
              ))
            )}
          </div>

          <DialogFooter>
            <Button
              onClick={() => setIsPreviewOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormBuilder;