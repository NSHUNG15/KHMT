import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Dialog, 
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { MoreHorizontal, Plus, Copy, Pencil, Trash, Eye } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { CustomForm } from "@shared/schema";

// Form field types
const fieldTypes = [
  { value: "text", label: "Văn bản ngắn" },
  { value: "textarea", label: "Văn bản dài" },
  { value: "number", label: "Số" },
  { value: "select", label: "Danh sách chọn" },
  { value: "radio", label: "Nút radio" },
  { value: "checkbox", label: "Hộp chọn" },
  { value: "date", label: "Ngày" },
  { value: "file", label: "Tải tệp lên" }
];

interface FormField {
  id: string;
  name: string;
  label: string;
  type: string;
  required: boolean;
  placeholder?: string;
  options?: { label: string; value: string }[];
  description?: string;
}

const FormManager = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedForm, setSelectedForm] = useState<CustomForm | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [fields, setFields] = useState<FormField[]>([]);
  const [currentField, setCurrentField] = useState<FormField | null>(null);
  const [isEditingField, setIsEditingField] = useState(false);
  const [fieldEditIndex, setFieldEditIndex] = useState(-1);

  // Empty field template
  const emptyField: FormField = {
    id: "",
    name: "",
    label: "",
    type: "text",
    required: false,
    placeholder: "",
    options: [],
    description: ""
  };

  // Forms query
  const { data: forms = [], isLoading } = useQuery<CustomForm[]>({
    queryKey: ['/api/custom-forms'],
    staleTime: 10000,
  });

  // Create form mutation
  const createFormMutation = useMutation({
    mutationFn: async (newForm: any) => {
      const res = await apiRequest('POST', '/api/custom-forms', newForm);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-forms'] });
      toast({
        title: "Tạo biểu mẫu thành công",
        description: "Biểu mẫu mới đã được tạo",
      });
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi tạo biểu mẫu",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    },
  });

  // Update form mutation
  const updateFormMutation = useMutation({
    mutationFn: async ({ id, formData }: { id: number; formData: any }) => {
      const res = await apiRequest('PATCH', `/api/custom-forms/${id}`, formData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-forms'] });
      toast({
        title: "Cập nhật biểu mẫu thành công",
        description: "Biểu mẫu đã được cập nhật",
      });
      resetForm();
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi cập nhật biểu mẫu",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    },
  });

  // Delete form mutation
  const deleteFormMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/custom-forms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/custom-forms'] });
      toast({
        title: "Xóa biểu mẫu thành công",
        description: "Biểu mẫu đã được xóa",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi xóa biểu mẫu",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setFields([]);
    setCurrentField(null);
    setIsEditingField(false);
    setFieldEditIndex(-1);
  };

  const loadFormToEdit = (form: CustomForm) => {
    setSelectedForm(form);
    setName(form.name);
    setDescription(form.description || "");
    
    try {
      // Check if fields are directly available in form object
      if (Array.isArray(form.fields)) {
        console.log("Loading fields directly from form.fields:", form.fields);
        setFields(form.fields);
      } 
      // Try to fallback to old structure format if needed
      else if (form.structure) {
        console.log("Attempting to load fields from structure");
        const formStructure = typeof form.structure === 'string' 
          ? JSON.parse(form.structure) 
          : form.structure;
        
        setFields(formStructure.fields || []);
      } else {
        console.log("No fields found in form");
        setFields([]);
      }
    } catch (e) {
      console.error("Error parsing form data:", e);
      setFields([]);
    }
    
    setIsEditDialogOpen(true);
  };

  const confirmDelete = (form: CustomForm) => {
    setSelectedForm(form);
    setIsDeleteDialogOpen(true);
  };

  const previewForm = (form: CustomForm) => {
    setSelectedForm(form);
    setIsPreviewDialogOpen(true);
  };

  const duplicateForm = async (form: CustomForm) => {
    try {
      setName(`${form.name} (Copy)`);
      setDescription(form.description || "");
      
      try {
        // Check if fields are directly available in form object
        if (Array.isArray(form.fields)) {
          console.log("Duplicating fields directly from form.fields:", form.fields);
          setFields(form.fields);
        } 
        // Try to fallback to old structure format if needed
        else if (form.structure) {
          console.log("Attempting to duplicate fields from structure");
          const formStructure = typeof form.structure === 'string' 
            ? JSON.parse(form.structure) 
            : form.structure;
          
          setFields(formStructure.fields || []);
        } else {
          console.log("No fields found to duplicate");
          setFields([]);
        }
      } catch (e) {
        console.error("Error parsing form data for duplication:", e);
        setFields([]);
      }
      
      setIsCreateDialogOpen(true);
      
      toast({
        title: "Biểu mẫu đã được sao chép",
        description: "Hãy chỉnh sửa và lưu để tạo biểu mẫu mới",
      });
    } catch (error) {
      toast({
        title: "Lỗi khi sao chép biểu mẫu",
        description: "Không thể sao chép biểu mẫu này",
        variant: "destructive",
      });
    }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields have unique names
    const fieldNames = fields.map(field => field.name);
    if (new Set(fieldNames).size !== fieldNames.length) {
      toast({
        title: "Lỗi tạo biểu mẫu",
        description: "Tên các trường phải là duy nhất",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Attempting to create form with fields:", fields);
    createFormMutation.mutate({
      name,
      description,
      fields: fields, // Send fields directly
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedForm) return;
    
    // Validate fields have unique names
    const fieldNames = fields.map(field => field.name);
    if (new Set(fieldNames).size !== fieldNames.length) {
      toast({
        title: "Lỗi cập nhật biểu mẫu",
        description: "Tên các trường phải là duy nhất",
        variant: "destructive",
      });
      return;
    }
    
    console.log("Attempting to update form with fields:", fields);
    updateFormMutation.mutate({
      id: selectedForm.id,
      formData: {
        name,
        description,
        fields: fields, // Send fields directly
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (selectedForm) {
      deleteFormMutation.mutate(selectedForm.id);
    }
  };

  const addField = () => {
    setCurrentField({
      ...emptyField,
      id: `field_${Date.now()}`,
      name: `field_${fields.length + 1}`,
      label: `Trường ${fields.length + 1}`,
    });
    setIsEditingField(false);
  };

  const editField = (index: number) => {
    setCurrentField(fields[index]);
    setFieldEditIndex(index);
    setIsEditingField(true);
  };

  const deleteField = (index: number) => {
    const newFields = [...fields];
    newFields.splice(index, 1);
    setFields(newFields);
  };

  const saveField = () => {
    if (!currentField) return;
    
    if (!currentField.name || !currentField.label) {
      toast({
        title: "Lỗi lưu trường",
        description: "Tên và nhãn trường là bắt buộc",
        variant: "destructive",
      });
      return;
    }
    
    const newFields = [...fields];
    
    if (isEditingField && fieldEditIndex >= 0) {
      newFields[fieldEditIndex] = currentField;
    } else {
      newFields.push(currentField);
    }
    
    setFields(newFields);
    setCurrentField(null);
    setIsEditingField(false);
    setFieldEditIndex(-1);
  };

  const addOption = () => {
    if (!currentField) return;
    
    const options = [...(currentField.options || [])];
    options.push({ label: `Lựa chọn ${options.length + 1}`, value: `option_${options.length + 1}` });
    
    setCurrentField({
      ...currentField,
      options,
    });
  };

  const updateOption = (index: number, field: 'label' | 'value', value: string) => {
    if (!currentField || !currentField.options) return;
    
    const options = [...currentField.options];
    options[index] = { ...options[index], [field]: value };
    
    setCurrentField({
      ...currentField,
      options,
    });
  };

  const removeOption = (index: number) => {
    if (!currentField || !currentField.options) return;
    
    const options = [...currentField.options];
    options.splice(index, 1);
    
    setCurrentField({
      ...currentField,
      options,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý Biểu mẫu</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo biểu mẫu mới
        </Button>
      </div>

      {/* Forms List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách biểu mẫu</CardTitle>
          <CardDescription>
            Quản lý các biểu mẫu tùy chỉnh cho sự kiện và đăng ký
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : forms.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Chưa có biểu mẫu nào. Hãy tạo biểu mẫu mới.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên biểu mẫu</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead>Số trường</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {forms.map((form) => (
                  <TableRow key={form.id}>
                    <TableCell className="font-medium">{form.name}</TableCell>
                    <TableCell>{form.description}</TableCell>
                    <TableCell>{format(new Date(form.createdAt), "dd/MM/yyyy")}</TableCell>
                    <TableCell>
                      {(() => {
                        try {
                          // Try to get fields directly from form.fields first
                          if (Array.isArray(form.fields)) {
                            return form.fields.length;
                          }
                          
                          // Fall back to old structure.fields format if needed
                          if (form.structure) {
                            const structure = typeof form.structure === 'string'
                              ? JSON.parse(form.structure)
                              : form.structure;
                            return structure.fields?.length || 0;
                          }
                          
                          return 0;
                        } catch (e) {
                          console.error("Error parsing form fields:", e);
                          return 0;
                        }
                      })()}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => previewForm(form)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Xem trước
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => loadFormToEdit(form)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => duplicateForm(form)}>
                            <Copy className="h-4 w-4 mr-2" />
                            Tạo bản sao
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => confirmDelete(form)}
                          >
                            <Trash className="h-4 w-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Create Form Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo biểu mẫu mới</DialogTitle>
            <DialogDescription>
              Thiết kế biểu mẫu tùy chỉnh cho đăng ký sự kiện, giải đấu hoặc khảo sát
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateSubmit}>
            <div className="grid gap-6 mt-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Tên biểu mẫu</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Nhập tên biểu mẫu"
                    required 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Mô tả ngắn về biểu mẫu này"
                    rows={2}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Các trường biểu mẫu</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addField}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm trường
                  </Button>
                </div>
                
                {fields.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-md">
                    <p className="text-muted-foreground">Chưa có trường nào. Bấm "Thêm trường" để bắt đầu.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên trường</TableHead>
                        <TableHead>Nhãn</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Bắt buộc</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id || index}>
                          <TableCell>{field.name}</TableCell>
                          <TableCell>{field.label}</TableCell>
                          <TableCell>
                            {fieldTypes.find(type => type.value === field.type)?.label || field.type}
                          </TableCell>
                          <TableCell>{field.required ? "Có" : "Không"}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => editField(index)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteField(index)}
                              className="text-red-600"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                {currentField && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>{isEditingField ? "Chỉnh sửa trường" : "Thêm trường mới"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="fieldName">Tên trường (không dấu)</Label>
                          <Input 
                            id="fieldName" 
                            value={currentField.name} 
                            onChange={(e) => setCurrentField({...currentField, name: e.target.value})} 
                            placeholder="Ví dụ: full_name"
                            required 
                          />
                          <p className="text-xs text-muted-foreground">
                            Tên trường không nên chứa dấu cách hoặc ký tự đặc biệt
                          </p>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="fieldLabel">Nhãn hiển thị</Label>
                          <Input 
                            id="fieldLabel" 
                            value={currentField.label} 
                            onChange={(e) => setCurrentField({...currentField, label: e.target.value})} 
                            placeholder="Ví dụ: Họ và tên"
                            required 
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="fieldType">Loại trường</Label>
                          <Select 
                            value={currentField.type} 
                            onValueChange={(value) => setCurrentField({
                              ...currentField, 
                              type: value, 
                              options: value === 'select' || value === 'radio' || value === 'checkbox' ? [] : undefined
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại trường" />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="fieldPlaceholder">Placeholder</Label>
                          <Input 
                            id="fieldPlaceholder" 
                            value={currentField.placeholder || ''} 
                            onChange={(e) => setCurrentField({...currentField, placeholder: e.target.value})} 
                            placeholder="Ví dụ: Nhập họ và tên đầy đủ"
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="fieldDescription">Mô tả trợ giúp</Label>
                          <Input 
                            id="fieldDescription" 
                            value={currentField.description || ''} 
                            onChange={(e) => setCurrentField({...currentField, description: e.target.value})} 
                            placeholder="Mô tả hoặc hướng dẫn cho trường này"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-4">
                          <Switch 
                            id="required" 
                            checked={currentField.required} 
                            onCheckedChange={(checked) => setCurrentField({...currentField, required: checked})} 
                          />
                          <Label htmlFor="required">Trường bắt buộc</Label>
                        </div>
                      </div>
                      
                      {/* Options for select, radio, checkbox */}
                      {(currentField.type === 'select' || currentField.type === 'radio' || currentField.type === 'checkbox') && (
                        <div className="mt-6">
                          <div className="flex justify-between items-center mb-2">
                            <Label>Các lựa chọn</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addOption}>
                              <Plus className="h-4 w-4 mr-2" />
                              Thêm lựa chọn
                            </Button>
                          </div>
                          
                          {(!currentField.options || currentField.options.length === 0) ? (
                            <div className="text-center py-4 border border-dashed rounded-md">
                              <p className="text-muted-foreground">Chưa có lựa chọn nào. Bấm "Thêm lựa chọn" để bắt đầu.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {currentField.options.map((option, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input 
                                    value={option.label} 
                                    onChange={(e) => updateOption(index, 'label', e.target.value)} 
                                    placeholder="Nhãn"
                                    className="flex-1"
                                  />
                                  <Input 
                                    value={option.value} 
                                    onChange={(e) => updateOption(index, 'value', e.target.value)} 
                                    placeholder="Giá trị"
                                    className="flex-1"
                                  />
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-red-600"
                                    onClick={() => removeOption(index)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-end mt-4 space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setCurrentField(null);
                            setIsEditingField(false);
                            setFieldEditIndex(-1);
                          }}
                        >
                          Hủy
                        </Button>
                        <Button type="button" onClick={saveField}>
                          {isEditingField ? "Cập nhật" : "Thêm"} trường
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setIsCreateDialogOpen(false);
                }}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={createFormMutation.isPending}>
                {createFormMutation.isPending ? "Đang xử lý..." : "Tạo biểu mẫu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Form Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa biểu mẫu</DialogTitle>
            <DialogDescription>
              Cập nhật thiết kế biểu mẫu tùy chỉnh
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-6 mt-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="name">Tên biểu mẫu</Label>
                  <Input 
                    id="name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    placeholder="Nhập tên biểu mẫu"
                    required 
                  />
                </div>
                
                <div className="grid gap-2">
                  <Label htmlFor="description">Mô tả</Label>
                  <Textarea 
                    id="description" 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                    placeholder="Mô tả ngắn về biểu mẫu này"
                    rows={2}
                  />
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Các trường biểu mẫu</h3>
                  <Button type="button" variant="outline" size="sm" onClick={addField}>
                    <Plus className="h-4 w-4 mr-2" />
                    Thêm trường
                  </Button>
                </div>
                
                {fields.length === 0 ? (
                  <div className="text-center py-8 border border-dashed rounded-md">
                    <p className="text-muted-foreground">Chưa có trường nào. Bấm "Thêm trường" để bắt đầu.</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Tên trường</TableHead>
                        <TableHead>Nhãn</TableHead>
                        <TableHead>Loại</TableHead>
                        <TableHead>Bắt buộc</TableHead>
                        <TableHead className="text-right">Thao tác</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {fields.map((field, index) => (
                        <TableRow key={field.id || index}>
                          <TableCell>{field.name}</TableCell>
                          <TableCell>{field.label}</TableCell>
                          <TableCell>
                            {fieldTypes.find(type => type.value === field.type)?.label || field.type}
                          </TableCell>
                          <TableCell>{field.required ? "Có" : "Không"}</TableCell>
                          <TableCell className="text-right">
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => editField(index)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteField(index)}
                              className="text-red-600"
                            >
                              <Trash className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
                
                {currentField && (
                  <Card className="mt-4">
                    <CardHeader>
                      <CardTitle>{isEditingField ? "Chỉnh sửa trường" : "Thêm trường mới"}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="fieldName">Tên trường (không dấu)</Label>
                          <Input 
                            id="fieldName" 
                            value={currentField.name} 
                            onChange={(e) => setCurrentField({...currentField, name: e.target.value})} 
                            placeholder="Ví dụ: full_name"
                            required 
                          />
                          <p className="text-xs text-muted-foreground">
                            Tên trường không nên chứa dấu cách hoặc ký tự đặc biệt
                          </p>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="fieldLabel">Nhãn hiển thị</Label>
                          <Input 
                            id="fieldLabel" 
                            value={currentField.label} 
                            onChange={(e) => setCurrentField({...currentField, label: e.target.value})} 
                            placeholder="Ví dụ: Họ và tên"
                            required 
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="fieldType">Loại trường</Label>
                          <Select 
                            value={currentField.type} 
                            onValueChange={(value) => setCurrentField({
                              ...currentField, 
                              type: value, 
                              options: value === 'select' || value === 'radio' || value === 'checkbox' ? [] : undefined
                            })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Chọn loại trường" />
                            </SelectTrigger>
                            <SelectContent>
                              {fieldTypes.map(type => (
                                <SelectItem key={type.value} value={type.value}>
                                  {type.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="fieldPlaceholder">Placeholder</Label>
                          <Input 
                            id="fieldPlaceholder" 
                            value={currentField.placeholder || ''} 
                            onChange={(e) => setCurrentField({...currentField, placeholder: e.target.value})} 
                            placeholder="Ví dụ: Nhập họ và tên đầy đủ"
                          />
                        </div>
                        
                        <div className="grid gap-2">
                          <Label htmlFor="fieldDescription">Mô tả trợ giúp</Label>
                          <Input 
                            id="fieldDescription" 
                            value={currentField.description || ''} 
                            onChange={(e) => setCurrentField({...currentField, description: e.target.value})} 
                            placeholder="Mô tả hoặc hướng dẫn cho trường này"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-4">
                          <Switch 
                            id="required" 
                            checked={currentField.required} 
                            onCheckedChange={(checked) => setCurrentField({...currentField, required: checked})} 
                          />
                          <Label htmlFor="required">Trường bắt buộc</Label>
                        </div>
                      </div>
                      
                      {/* Options for select, radio, checkbox */}
                      {(currentField.type === 'select' || currentField.type === 'radio' || currentField.type === 'checkbox') && (
                        <div className="mt-6">
                          <div className="flex justify-between items-center mb-2">
                            <Label>Các lựa chọn</Label>
                            <Button type="button" variant="outline" size="sm" onClick={addOption}>
                              <Plus className="h-4 w-4 mr-2" />
                              Thêm lựa chọn
                            </Button>
                          </div>
                          
                          {(!currentField.options || currentField.options.length === 0) ? (
                            <div className="text-center py-4 border border-dashed rounded-md">
                              <p className="text-muted-foreground">Chưa có lựa chọn nào. Bấm "Thêm lựa chọn" để bắt đầu.</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {currentField.options.map((option, index) => (
                                <div key={index} className="flex items-center gap-2">
                                  <Input 
                                    value={option.label} 
                                    onChange={(e) => updateOption(index, 'label', e.target.value)} 
                                    placeholder="Nhãn"
                                    className="flex-1"
                                  />
                                  <Input 
                                    value={option.value} 
                                    onChange={(e) => updateOption(index, 'value', e.target.value)} 
                                    placeholder="Giá trị"
                                    className="flex-1"
                                  />
                                  <Button 
                                    type="button" 
                                    variant="ghost" 
                                    size="sm" 
                                    className="text-red-600"
                                    onClick={() => removeOption(index)}
                                  >
                                    <Trash className="h-4 w-4" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-end mt-4 space-x-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={() => {
                            setCurrentField(null);
                            setIsEditingField(false);
                            setFieldEditIndex(-1);
                          }}
                        >
                          Hủy
                        </Button>
                        <Button type="button" onClick={saveField}>
                          {isEditingField ? "Cập nhật" : "Thêm"} trường
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setIsEditDialogOpen(false);
                }}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={updateFormMutation.isPending}>
                {updateFormMutation.isPending ? "Đang cập nhật..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa biểu mẫu "{selectedForm?.name}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteFormMutation.isPending}
            >
              {deleteFormMutation.isPending ? "Đang xóa..." : "Xóa biểu mẫu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Form Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Xem trước biểu mẫu - {selectedForm?.name}</DialogTitle>
            <DialogDescription>
              Xem trước giao diện biểu mẫu
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 border p-6 rounded-md bg-slate-50">
            <h2 className="text-xl font-bold mb-2">{selectedForm?.name}</h2>
            <p className="text-gray-600 mb-6">{selectedForm?.description}</p>
            
            <div className="space-y-4">
              {(() => {
                try {
                  // Try to get fields directly first
                  let formFields = [];
                  
                  if (selectedForm && Array.isArray(selectedForm.fields)) {
                    console.log("Preview: Using fields directly");
                    formFields = selectedForm.fields;
                  } 
                  // Fall back to structure if needed
                  else if (selectedForm?.structure) {
                    console.log("Preview: Extracting fields from structure");
                    const formStructure = typeof selectedForm.structure === 'string'
                      ? JSON.parse(selectedForm.structure)
                      : selectedForm.structure;
                      
                    formFields = formStructure?.fields || [];
                  }
                  
                  return formFields.map((field: FormField, index: number) => (
                    <div key={index} className="space-y-2">
                      <Label className="font-medium">
                        {field.label}
                        {field.required && <span className="text-red-500 ml-1">*</span>}
                      </Label>
                      
                      {field.description && (
                        <p className="text-sm text-gray-500">{field.description}</p>
                      )}
                      
                      {field.type === 'text' && (
                        <Input placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}`} disabled />
                      )}
                      
                      {field.type === 'textarea' && (
                        <Textarea placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}`} disabled rows={3} />
                      )}
                      
                      {field.type === 'number' && (
                        <Input type="number" placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}`} disabled />
                      )}
                      
                      {field.type === 'date' && (
                        <Input type="date" disabled />
                      )}
                      
                      {field.type === 'select' && (
                        <Select disabled>
                          <SelectTrigger>
                            <SelectValue placeholder={field.placeholder || "Chọn một tùy chọn"} />
                          </SelectTrigger>
                          <SelectContent>
                            {(field.options || []).map((option, i) => (
                              <SelectItem key={i} value={option.value}>{option.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      
                      {field.type === 'radio' && (
                        <div className="space-y-2">
                          {(field.options || []).map((option, i) => (
                            <div key={i} className="flex items-center space-x-2">
                              <input type="radio" id={`${field.name}_${i}`} name={field.name} value={option.value} disabled />
                              <Label htmlFor={`${field.name}_${i}`}>{option.label}</Label>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {field.type === 'checkbox' && (
                        <div className="space-y-2">
                          {(field.options || []).map((option, i) => (
                            <div key={i} className="flex items-center space-x-2">
                              <input type="checkbox" id={`${field.name}_${i}`} name={field.name} value={option.value} disabled />
                              <Label htmlFor={`${field.name}_${i}`}>{option.label}</Label>
                            </div>
                          ))}
                        </div>
                      )}
                      
                      {field.type === 'file' && (
                        <Input type="file" disabled />
                      )}
                    </div>
                  ));
                } catch (e) {
                  return (
                    <div className="text-center py-6 text-gray-500">
                      Không thể hiển thị biểu mẫu. Cấu trúc không hợp lệ.
                    </div>
                  );
                }
              })()}
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button type="button" disabled>Gửi biểu mẫu</Button>
            </div>
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              onClick={() => setIsPreviewDialogOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FormManager;