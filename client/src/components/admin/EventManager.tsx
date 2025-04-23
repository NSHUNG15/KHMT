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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MoreHorizontal, Plus, Download, Pencil, Trash, Eye, Users } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Event } from "@shared/schema";

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
  const [formTemplate, setFormTemplate] = useState("{}");

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
      const res = await apiRequest('GET', `/api/events/${eventId}/export`, {});
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
    setFormTemplate("{}");
  };

  const loadEventToEdit = (event: Event) => {
    setSelectedEvent(event);
    setTitle(event.title);
    setDescription(event.description);
    setLocation(event.location);
    setStartDate(new Date(event.startDate));
    setEndDate(new Date(event.endDate));
    setRegistrationDeadline(event.registrationDeadline ? new Date(event.registrationDeadline) : undefined);
    setCapacity(event.capacity || 0);
    setIsPublished(event.isPublished);
    setFormTemplate(JSON.stringify(event.formTemplate || {}));
    setIsEditDialogOpen(true);
  };

  const confirmDelete = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    let formTemplateObj = {};
    try {
      formTemplateObj = JSON.parse(formTemplate);
    } catch (e) {
      toast({
        title: "Lỗi cú pháp biểu mẫu",
        description: "Biểu mẫu JSON không hợp lệ",
        variant: "destructive",
      });
      return;
    }

    createEventMutation.mutate({
      title,
      description,
      location,
      startDate,
      endDate,
      registrationDeadline,
      capacity: capacity || null,
      isPublished,
      formTemplate: formTemplateObj,
      createdBy: user.id,
    });
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEvent) return;
    
    let formTemplateObj = {};
    try {
      formTemplateObj = JSON.parse(formTemplate);
    } catch (e) {
      toast({
        title: "Lỗi cú pháp biểu mẫu",
        description: "Biểu mẫu JSON không hợp lệ",
        variant: "destructive",
      });
      return;
    }

    updateEventMutation.mutate({
      id: selectedEvent.id,
      eventData: {
        title,
        description,
        location,
        startDate,
        endDate,
        registrationDeadline,
        capacity: capacity || null,
        isPublished,
        formTemplate: formTemplateObj,
      },
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
                    <TableCell>{format(new Date(event.startDate), "dd/MM/yyyy")}</TableCell>
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
                  <div className="grid gap-2">
                    <Label htmlFor="formTemplate">Mẫu biểu đăng ký (JSON)</Label>
                    <Textarea 
                      id="formTemplate" 
                      value={formTemplate} 
                      onChange={(e) => setFormTemplate(e.target.value)} 
                      placeholder='{"fields": [{"name": "fullName", "label": "Họ và tên", "type": "text", "required": true}]}'
                      rows={10}
                    />
                    <p className="text-sm text-muted-foreground">
                      Định nghĩa các trường dữ liệu cho biểu mẫu đăng ký dưới dạng JSON.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
              >
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
              Cập nhật thông tin cho sự kiện
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
                    <Label htmlFor="isPublished">Công bố sự kiện</Label>
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
                  <div className="grid gap-2">
                    <Label htmlFor="formTemplate">Mẫu biểu đăng ký (JSON)</Label>
                    <Textarea 
                      id="formTemplate" 
                      value={formTemplate} 
                      onChange={(e) => setFormTemplate(e.target.value)} 
                      placeholder='{"fields": [{"name": "fullName", "label": "Họ và tên", "type": "text", "required": true}]}'
                      rows={10}
                    />
                    <p className="text-sm text-muted-foreground">
                      Định nghĩa các trường dữ liệu cho biểu mẫu đăng ký dưới dạng JSON.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={updateEventMutation.isPending}>
                {updateEventMutation.isPending ? "Đang cập nhật..." : "Lưu thay đổi"}
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
              Bạn có chắc chắn muốn xóa sự kiện "{selectedEvent?.title}"? Hành động này không thể hoàn tác.
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
              disabled={deleteEventMutation.isPending}
            >
              {deleteEventMutation.isPending ? "Đang xóa..." : "Xóa sự kiện"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registrations View Dialog */}
      <Dialog open={isRegistrationViewOpen} onOpenChange={setIsRegistrationViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Danh sách đăng ký - {selectedEvent?.title}</DialogTitle>
            <DialogDescription>
              Danh sách người tham gia sự kiện
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <Button
              onClick={handleExportRegistrations}
              disabled={exportRegistrationsMutation.isPending}
              variant="outline"
              className="mb-4"
            >
              <Download className="h-4 w-4 mr-2" />
              {exportRegistrationsMutation.isPending ? "Đang xuất..." : "Xuất Excel"}
            </Button>
            
            {registrationsLoading ? (
              <div className="text-center py-4">Đang tải...</div>
            ) : registrations.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Chưa có người tham gia đăng ký sự kiện này.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên người dùng</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Thời gian đăng ký</TableHead>
                    <TableHead>Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registrations.map((registration: any) => (
                    <TableRow key={registration.id}>
                      <TableCell>{registration.user?.fullName || registration.user?.username}</TableCell>
                      <TableCell>{registration.user?.email}</TableCell>
                      <TableCell>{format(new Date(registration.registeredAt), "dd/MM/yyyy HH:mm")}</TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          registration.status === 'confirmed' ? 'bg-green-100 text-green-800' : 
                          registration.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {registration.status === 'confirmed' ? 'Đã xác nhận' : 
                           registration.status === 'pending' ? 'Đang chờ' : 'Từ chối'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              onClick={() => setIsRegistrationViewOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventManager;