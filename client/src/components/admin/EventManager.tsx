import React, { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MoreHorizontal, Plus, Download, Pencil, Trash, Eye, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Event } from "@shared/schema";
import FormBuilder from "@/components/forms/FormBuilder";
import FormSelector from "@/components/forms/FormSelector";

const EventManager = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isRegistrationViewOpen, setIsRegistrationViewOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [registrationDeadline, setRegistrationDeadline] = useState<Date>();
  const [capacity, setCapacity] = useState<number>(0);
  const [isPublished, setIsPublished] = useState(false);
  const [formFields, setFormFields] = useState<any[]>([]);
  
  // Đảm bảo formFields luôn được khởi tạo khi dialog mở
  useEffect(() => {
    if (isCreateDialogOpen) {
      console.log("Initializing form fields for create dialog");
      // Đảm bảo formFields là một mảng trống khi mở dialog tạo mới
      setFormFields([]);
    }
  }, [isCreateDialogOpen]);
  
  // Màn hình cập nhật biểu mẫu riêng
  const [isFormUpdateOpen, setIsFormUpdateOpen] = useState(false);

  // Event query
  const { data: events = [], isLoading } = useQuery<Event[]>({
    queryKey: ['/api/events'],
    staleTime: 10000,
  });

  // Create event mutation
  const createEventMutation = useMutation({
    mutationFn: async (newEvent: any) => {
      const res = await apiRequest('POST', '/api/events', newEvent);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Tạo sự kiện thành công",
        description: "Sự kiện mới đã được tạo",
      });
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi tạo sự kiện",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    },
  });

  // Update event mutation
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, eventData }: { id: number; eventData: any }) => {
      const res = await apiRequest('PATCH', `/api/events/${id}`, eventData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Cập nhật sự kiện thành công",
        description: "Sự kiện đã được cập nhật",
      });
      resetForm();
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi cập nhật sự kiện",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    },
  });

  // Delete event mutation
  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/events'] });
      toast({
        title: "Xóa sự kiện thành công",
        description: "Sự kiện đã được xóa",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi xóa sự kiện",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    },
  });

  // Registration export mutation
  const exportRegistrationsMutation = useMutation({
    mutationFn: async (eventId: number) => {
      const res = await apiRequest('GET', `/api/events/${eventId}/registrations/export`, {});
      return res;
    },
    onSuccess: (data) => {
      toast({
        title: "Xuất dữ liệu thành công",
        description: "Dữ liệu đăng ký đã được xuất",
      });
      // Handle file download
      data.blob().then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `event_registrations_${selectedEvent?.id}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi xuất dữ liệu",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    },
  });

  // Registrations query
  const { data: registrations = [], isLoading: registrationsLoading } = useQuery({
    queryKey: ['/api/events/registrations', selectedEvent?.id],
    enabled: Boolean(selectedEvent) && isRegistrationViewOpen,
    staleTime: 5000,
  });

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setLocation("");
    setStartDate(undefined);
    setEndDate(undefined);
    setRegistrationDeadline(undefined);
    setCapacity(0);
    setIsPublished(false);
    setFormFields([]);
  };

  const loadEventToEdit = (event: Event) => {
    setSelectedEvent(event);
    setTitle(event.title);
    setDescription(event.description);
    setLocation(event.location);
    
    // Xử lý an toàn ngày tháng, tránh lỗi "Invalid time value"
    if (event.startDate) {
      try {
        setStartDate(new Date(event.startDate));
      } catch (e) {
        console.error("Lỗi với startDate:", e);
        setStartDate(undefined);
      }
    } else {
      setStartDate(undefined);
    }
    
    if (event.endDate) {
      try {
        setEndDate(new Date(event.endDate));
      } catch (e) {
        console.error("Lỗi với endDate:", e);
        setEndDate(undefined);
      }
    } else {
      setEndDate(undefined);
    }
    
    if (event.registrationDeadline) {
      try {
        setRegistrationDeadline(new Date(event.registrationDeadline));
      } catch (e) {
        console.error("Lỗi với registrationDeadline:", e);
        setRegistrationDeadline(undefined);
      }
    } else {
      setRegistrationDeadline(undefined);
    }
    
    setCapacity(event.capacity || 0);
    setIsPublished(event.isPublished);
    
    try {
      // Cố gắng phân tích formTemplate từ event
      if (event.formTemplate && typeof event.formTemplate === 'object') {
        const fields = event.formTemplate.fields || [];
        setFormFields(fields);
      } else if (typeof event.formTemplate === 'string') {
        const parsedTemplate = JSON.parse(event.formTemplate);
        const fields = parsedTemplate.fields || [];
        setFormFields(fields);
      } else {
        setFormFields([]);
      }
    } catch (e) {
      console.error("Lỗi khi phân tích biểu mẫu:", e);
      setFormFields([]);
    }
    
    setIsEditDialogOpen(true);
  };

  const confirmDelete = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Lấy dữ liệu người dùng từ localStorage hoặc sử dụng hook auth
    let createdBy = 1; // Mặc định ID = 1 nếu không tìm thấy
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user && user.id) {
        createdBy = user.id;
      }
    } catch (e) {
      console.error("Lỗi khi lấy thông tin người dùng:", e);
    }
    
    const eventData = {
      title,
      description,
      location,
      startDate,
      endDate,
      registrationDeadline,
      capacity: capacity || null,
      isPublished,
      formTemplate: { fields: formFields },
      createdBy,
    };
    
    console.log("Submitting event data:", eventData);
    
    createEventMutation.mutate(eventData);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    
    const eventData = {
      title,
      description,
      location,
      startDate,
      endDate,
      registrationDeadline,
      capacity: capacity || null,
      isPublished,
      formTemplate: { fields: formFields },
    };
    
    console.log("Updating event data:", eventData);
    
    updateEventMutation.mutate({
      id: selectedEvent.id,
      eventData,
    });
  };

  const handleDeleteConfirm = () => {
    if (selectedEvent) {
      deleteEventMutation.mutate(selectedEvent.id);
    }
  };

  const handleExportRegistrations = () => {
    if (selectedEvent) {
      exportRegistrationsMutation.mutate(selectedEvent.id);
    }
  };

  const openRegistrationsView = (event: Event) => {
    setSelectedEvent(event);
    setIsRegistrationViewOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý Sự kiện</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo sự kiện mới
        </Button>
      </div>

      {/* Events List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách sự kiện</CardTitle>
          <CardDescription>
            Quản lý tất cả các sự kiện và hoạt động
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : events.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Chưa có sự kiện nào. Hãy tạo sự kiện mới.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên sự kiện</TableHead>
                  <TableHead>Ngày bắt đầu</TableHead>
                  <TableHead>Địa điểm</TableHead>
                  <TableHead className="text-center">Đăng ký</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <TableRow key={event.id}>
                    <TableCell className="font-medium">{event.title}</TableCell>
                    <TableCell>
                      {event.startDate ? format(new Date(event.startDate), "dd/MM/yyyy") : "Chưa xác định"}
                    </TableCell>
                    <TableCell>{event.location}</TableCell>
                    <TableCell className="text-center">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => openRegistrationsView(event)}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Xem đăng ký
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${event.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {event.isPublished ? 'Đã công bố' : 'Bản nháp'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => loadEventToEdit(event)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setSelectedEvent(event);
                              setIsFormUpdateOpen(true);
                              
                              // Cố gắng phân tích formTemplate từ event
                              try {
                                if (event.formTemplate && typeof event.formTemplate === 'object') {
                                  const fields = event.formTemplate.fields || [];
                                  setFormFields(fields);
                                } else if (typeof event.formTemplate === 'string') {
                                  const parsedTemplate = JSON.parse(event.formTemplate);
                                  const fields = parsedTemplate.fields || [];
                                  setFormFields(fields);
                                } else {
                                  setFormFields([]);
                                }
                              } catch (e) {
                                console.error("Lỗi khi phân tích biểu mẫu:", e);
                                setFormFields([]);
                              }
                            }}
                          >
                            <Pencil className="h-4 w-4 mr-2" />
                            Cập nhật biểu mẫu
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportRegistrations()}>
                            <Download className="h-4 w-4 mr-2" />
                            Xuất đăng ký
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => confirmDelete(event)}
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

      {/* Create Event Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo sự kiện mới</DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết để tạo sự kiện mới
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateSubmit}>
            <Tabs defaultValue="basic" className="mt-4">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
                <TabsTrigger value="dates">Thời gian</TabsTrigger>
                <TabsTrigger value="form">Biểu mẫu đăng ký</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="title">Tên sự kiện</Label>
                    <Input 
                      id="title" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      placeholder="Nhập tên sự kiện"
                      required 
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="description">Mô tả</Label>
                    <Textarea 
                      id="description" 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      placeholder="Mô tả chi tiết về sự kiện"
                      rows={4}
                      required 
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="location">Địa điểm</Label>
                    <Input 
                      id="location" 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)} 
                      placeholder="Nhập địa điểm tổ chức"
                      required 
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="capacity">Số lượng tối đa</Label>
                    <Input 
                      id="capacity" 
                      type="number" 
                      value={capacity} 
                      onChange={(e) => setCapacity(parseInt(e.target.value))} 
                      min={0}
                      placeholder="Để trống nếu không giới hạn"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="isPublished" 
                      checked={isPublished} 
                      onCheckedChange={setIsPublished} 
                    />
                    <Label htmlFor="isPublished">Công bố ngay</Label>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="dates" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Ngày bắt đầu</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : <span>Chọn ngày</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Ngày kết thúc</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : <span>Chọn ngày</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Hạn đăng ký</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "justify-start text-left font-normal",
                            !registrationDeadline && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {registrationDeadline ? format(registrationDeadline, "PPP") : <span>Chọn ngày</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={registrationDeadline}
                          onSelect={setRegistrationDeadline}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="form" className="space-y-4">
                <div className="grid gap-4">
                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium mb-4">Thiết kế biểu mẫu đăng ký</h3>
                    <FormBuilder 
                      onChange={(fields) => {
                        setFormFields(fields);
                      }}
                      initialFields={formFields}
                    />
                  </div>
                  {formFields.length > 0 && (
                    <div className="flex items-center p-2 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        {formFields.length} trường được thêm vào biểu mẫu
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={createEventMutation.isPending}>
                {createEventMutation.isPending ? "Đang xử lý..." : "Tạo sự kiện"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Event Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa sự kiện</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho sự kiện này
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit}>
            <Tabs defaultValue="basic" className="mt-4">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
                <TabsTrigger value="dates">Thời gian</TabsTrigger>
                <TabsTrigger value="form">Biểu mẫu đăng ký</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="edit-title">Tên sự kiện</Label>
                    <Input 
                      id="edit-title" 
                      value={title} 
                      onChange={(e) => setTitle(e.target.value)} 
                      placeholder="Nhập tên sự kiện"
                      required 
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-description">Mô tả</Label>
                    <Textarea 
                      id="edit-description" 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      placeholder="Mô tả chi tiết về sự kiện"
                      rows={4}
                      required 
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-location">Địa điểm</Label>
                    <Input 
                      id="edit-location" 
                      value={location} 
                      onChange={(e) => setLocation(e.target.value)} 
                      placeholder="Nhập địa điểm tổ chức"
                      required 
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="edit-capacity">Số lượng tối đa</Label>
                    <Input 
                      id="edit-capacity" 
                      type="number" 
                      value={capacity} 
                      onChange={(e) => setCapacity(parseInt(e.target.value))} 
                      min={0}
                      placeholder="Để trống nếu không giới hạn"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="edit-isPublished" 
                      checked={isPublished} 
                      onCheckedChange={setIsPublished} 
                    />
                    <Label htmlFor="edit-isPublished">Công bố</Label>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="dates" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label>Ngày bắt đầu</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? format(startDate, "PPP") : <span>Chọn ngày</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Ngày kết thúc</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? format(endDate, "PPP") : <span>Chọn ngày</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label>Hạn đăng ký</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "justify-start text-left font-normal",
                            !registrationDeadline && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {registrationDeadline ? format(registrationDeadline, "PPP") : <span>Chọn ngày</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={registrationDeadline}
                          onSelect={setRegistrationDeadline}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="form" className="space-y-4">
                <div className="grid gap-4">
                  <div className="border rounded-md p-4">
                    <h3 className="text-sm font-medium mb-4">Thiết kế biểu mẫu đăng ký</h3>
                    <FormBuilder 
                      onChange={(fields) => {
                        setFormFields(fields);
                      }}
                      initialFields={formFields}
                    />
                  </div>
                  {formFields.length > 0 && (
                    <div className="flex items-center p-2 bg-muted rounded-md">
                      <p className="text-sm text-muted-foreground">
                        {formFields.length} trường được thêm vào biểu mẫu
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Hủy
              </Button>
              <Button type="submit" disabled={updateEventMutation.isPending}>
                {updateEventMutation.isPending ? "Đang xử lý..." : "Cập nhật"}
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
              Bạn có chắc chắn muốn xóa sự kiện "{selectedEvent?.title}" không? 
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button type="button" variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={deleteEventMutation.isPending}
            >
              {deleteEventMutation.isPending ? "Đang xử lý..." : "Xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Registrations Dialog */}
      <Dialog open={isRegistrationViewOpen} onOpenChange={setIsRegistrationViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Đăng ký cho sự kiện: {selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              Quản lý các đơn đăng ký cho sự kiện này
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="text-lg font-medium">Danh sách đăng ký</h3>
                <p className="text-sm text-muted-foreground">
                  Tổng số: {Array.isArray(registrations) ? registrations.length : 0} đăng ký
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleExportRegistrations}
                disabled={exportRegistrationsMutation.isPending}
              >
                <Download className="h-4 w-4 mr-2" />
                {exportRegistrationsMutation.isPending ? "Đang xuất..." : "Xuất Excel"}
              </Button>
            </div>
            
            {registrationsLoading ? (
              <div className="text-center py-8">Đang tải...</div>
            ) : Array.isArray(registrations) && registrations.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Người dùng</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Thời gian đăng ký</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Array.isArray(registrations) && registrations.map((registration: any) => (
                    <TableRow key={registration.id}>
                      <TableCell className="font-medium">ID: {registration.userId}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          registration.status === 'approved' ? 'bg-green-100 text-green-800' : 
                          registration.status === 'rejected' ? 'bg-red-100 text-red-800' : 
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {registration.status === 'approved' ? 'Đã phê duyệt' : 
                           registration.status === 'rejected' ? 'Từ chối' : 
                           'Đang chờ'}
                        </span>
                      </TableCell>
                      <TableCell>{format(new Date(registration.registeredAt), "dd/MM/yyyy HH:mm")}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 border border-dashed rounded-md">
                <p className="text-muted-foreground">Chưa có đăng ký nào cho sự kiện này</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      
      {/* Form Update Dialog */}
      <Dialog open={isFormUpdateOpen} onOpenChange={setIsFormUpdateOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Cập nhật biểu mẫu đăng ký</DialogTitle>
            <DialogDescription>
              Cập nhật biểu mẫu đăng ký cho sự kiện
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 space-y-4">
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-4">Thiết kế biểu mẫu đăng ký</h3>
              <FormBuilder 
                onChange={(fields) => {
                  setFormFields(fields);
                }}
                initialFields={formFields}
              />
            </div>
            
            {formFields.length > 0 && (
              <div className="flex items-center p-2 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  {formFields.length} trường được thêm vào biểu mẫu
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter className="mt-6">
            <Button type="button" variant="outline" onClick={() => setIsFormUpdateOpen(false)}>
              Hủy
            </Button>
            <Button 
              type="button" 
              disabled={updateEventMutation.isPending}
              onClick={() => {
                if (!selectedEvent) return;
                
                updateEventMutation.mutate({
                  id: selectedEvent.id,
                  eventData: {
                    formTemplate: { fields: formFields },
                  },
                });
              }}
            >
              {updateEventMutation.isPending ? "Đang xử lý..." : "Cập nhật biểu mẫu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventManager;