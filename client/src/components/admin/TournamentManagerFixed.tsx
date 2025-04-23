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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, MoreHorizontal, Plus, Download, Pencil, Trash, UsersRound, Trophy, Table2, FileText } from "lucide-react";
import { format as formatDate } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Tournament } from "@shared/schema";
import TournamentFormTab from "./TournamentFormTab";

const sportTypes = [
  { value: "football", label: "Bóng đá" },
  { value: "basketball", label: "Bóng rổ" },
  { value: "volleyball", label: "Bóng chuyền" },
  { value: "badminton", label: "Cầu lông" },
  { value: "tabletennis", label: "Bóng bàn" },
  { value: "chess", label: "Cờ vua" },
  { value: "esports", label: "Thể thao điện tử" },
  { value: "other", label: "Khác" }
];

const tournamentFormats = [
  { value: "knockout", label: "Loại trực tiếp" },
  { value: "roundrobin", label: "Vòng tròn" },
  { value: "groups", label: "Chia bảng" }
];

const statusOptions = [
  { value: "upcoming", label: "Sắp diễn ra" },
  { value: "ongoing", label: "Đang diễn ra" },
  { value: "completed", label: "Đã kết thúc" },
  { value: "cancelled", label: "Đã hủy" }
];

const TournamentManager: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State quản lý dialog
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState("overview");

  // State quản lý form
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(undefined);
  const [endDate, setEndDate] = useState<Date | undefined>(undefined);
  const [registrationDeadline, setRegistrationDeadline] = useState<Date | undefined>(undefined);
  const [sportType, setSportType] = useState<string>("football");
  const [format, setFormat] = useState<string>("knockout");
  const [maxTeams, setMaxTeams] = useState<number | undefined>(undefined);
  const [isPublished, setIsPublished] = useState(false);
  const [status, setStatus] = useState<string>("upcoming");
  const [selectedFormId, setSelectedFormId] = useState<number | undefined>(undefined);
  const [formFields, setFormFields] = useState<any[]>([]);

  // State giải đấu đang được xử lý
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);

  // Query data
  const { data: tournaments = [], isLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
    staleTime: 1000 * 60,
  });

  // Mutations
  const createTournamentMutation = useMutation({
    mutationFn: (tournament: any) => 
      apiRequest('POST', '/api/tournaments', tournament),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      resetForm();
      setIsCreateDialogOpen(false);
      toast({
        title: "Tạo giải đấu thành công",
        description: "Giải đấu đã được tạo thành công"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi tạo giải đấu",
        description: error.message || "Có lỗi xảy ra, vui lòng thử lại sau",
        variant: "destructive",
      });
    }
  });

  const updateTournamentMutation = useMutation({
    mutationFn: (data: { id: number, tournament: any }) => 
      apiRequest('PUT', `/api/tournaments/${data.id}`, data.tournament),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      resetForm();
      setIsEditDialogOpen(false);
      toast({
        title: "Cập nhật giải đấu thành công",
        description: "Giải đấu đã được cập nhật thành công"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi cập nhật giải đấu",
        description: error.message || "Có lỗi xảy ra, vui lòng thử lại sau",
        variant: "destructive",
      });
    }
  });

  const deleteTournamentMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest('DELETE', `/api/tournaments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Xóa giải đấu thành công",
        description: "Giải đấu đã được xóa thành công"
      });
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi xóa giải đấu",
        description: error.message || "Có lỗi xảy ra, vui lòng thử lại sau",
        variant: "destructive",
      });
    }
  });

  // Reset form
  const resetForm = () => {
    setName("");
    setDescription("");
    setStartDate(undefined);
    setEndDate(undefined);
    setRegistrationDeadline(undefined);
    setSportType("football");
    setFormat("knockout");
    setMaxTeams(undefined);
    setIsPublished(false);
    setStatus("upcoming");
    setSelectedFormId(undefined);
    setFormFields([]);
    setSelectedTournament(null);
    setCurrentTab("overview");
  };

  // Open edit dialog
  const openEditDialog = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setName(tournament.name);
    setDescription(tournament.description || "");
    setStartDate(tournament.startDate ? new Date(tournament.startDate) : undefined);
    setEndDate(tournament.endDate ? new Date(tournament.endDate) : undefined);
    setRegistrationDeadline(tournament.registrationDeadline ? new Date(tournament.registrationDeadline) : undefined);
    setSportType(tournament.sportType || "football");
    setFormat(tournament.format || "knockout");
    setMaxTeams(tournament.maxTeams || undefined);
    setIsPublished(tournament.isPublished);
    setStatus(tournament.status);
    setSelectedFormId(tournament.formId);
    setIsEditDialogOpen(true);
  };

  const confirmDelete = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    try {
      // Nếu có formFields mới và không chọn form có sẵn, tạo form mới
      let formId = selectedFormId;
      
      if (!formId && formFields.length > 0) {
        try {
          // Sửa lại endpoint từ forms thành custom-forms
          const formRes = await apiRequest('POST', '/api/custom-forms', {
            name: `Form đăng ký giải đấu ${name}`,
            fields: formFields,
            createdBy: user.id
          });
          
          // Kiểm tra phản hồi trước khi parse JSON
          if (!formRes.ok) {
            const errorText = await formRes.text();
            console.error("Lỗi tạo biểu mẫu:", {
              status: formRes.status,
              statusText: formRes.statusText,
              body: errorText.substring(0, 200) // Chỉ log một phần để tránh quá nhiều dữ liệu
            });
            throw new Error(`Lỗi tạo biểu mẫu: ${formRes.status} ${formRes.statusText}`);
          }
          
          const newForm = await formRes.json();
          formId = newForm.id;
          
          toast({
            title: "Tạo biểu mẫu thành công",
            description: "Biểu mẫu đăng ký đã được tạo"
          });
        } catch (formError: any) {
          console.error("Lỗi khi tạo biểu mẫu:", formError);
          toast({
            title: "Lỗi khi tạo biểu mẫu",
            description: formError.message || "Không thể tạo biểu mẫu đăng ký",
            variant: "destructive",
          });
          // Ngăn tiếp tục tạo giải đấu
          return;
        }
      }
      
      // Tạo giải đấu với biểu mẫu (nếu có)
      createTournamentMutation.mutate({
        name,
        description,
        startDate,
        endDate,
        registrationDeadline,
        sportType,
        format,
        maxTeams: maxTeams || null,
        isPublished,
        status,
        createdBy: user.id,
        formId: formId ? formId : undefined
      });
    } catch (error: any) {
      toast({
        title: "Lỗi khi tạo giải đấu",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTournament) return;
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    try {
      // Nếu có formFields mới và không chọn form có sẵn, tạo form mới
      let formId = selectedFormId;
      
      if (!formId && formFields.length > 0) {
        try {
          // Sửa lại endpoint từ forms thành custom-forms
          const formRes = await apiRequest('POST', '/api/custom-forms', {
            name: `Form đăng ký giải đấu ${name}`,
            fields: formFields,
            createdBy: user.id
          });
          
          // Kiểm tra phản hồi trước khi parse JSON
          if (!formRes.ok) {
            const errorText = await formRes.text();
            console.error("Lỗi tạo biểu mẫu:", {
              status: formRes.status,
              statusText: formRes.statusText,
              body: errorText.substring(0, 200) // Chỉ log một phần để tránh quá nhiều dữ liệu
            });
            throw new Error(`Lỗi tạo biểu mẫu: ${formRes.status} ${formRes.statusText}`);
          }
          
          const newForm = await formRes.json();
          formId = newForm.id;
          
          toast({
            title: "Tạo biểu mẫu thành công",
            description: "Biểu mẫu đăng ký đã được tạo"
          });
        } catch (formError: any) {
          console.error("Lỗi khi tạo biểu mẫu:", formError);
          toast({
            title: "Lỗi khi tạo biểu mẫu",
            description: formError.message || "Không thể tạo biểu mẫu đăng ký",
            variant: "destructive",
          });
          // Ngăn tiếp tục cập nhật giải đấu
          return;
        }
      }
      
      // Cập nhật giải đấu
      updateTournamentMutation.mutate({
        id: selectedTournament.id,
        tournament: {
          name,
          description,
          startDate,
          endDate,
          registrationDeadline,
          sportType,
          format,
          maxTeams: maxTeams || null,
          isPublished,
          status,
          updatedBy: user.id,
          formId: formId || null  // Nếu không có formId, gửi null
        }
      });
    } catch (error: any) {
      toast({
        title: "Lỗi khi cập nhật giải đấu",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    }
  };

  // Render table
  const renderTable = () => {
    if (isLoading) {
      return (
        <div className="flex justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      );
    }

    if (tournaments.length === 0) {
      return (
        <div className="text-center p-8 text-muted-foreground">
          Chưa có giải đấu nào. Nhấn nút "Tạo giải đấu" để bắt đầu.
        </div>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên giải đấu</TableHead>
            <TableHead>Loại</TableHead>
            <TableHead>Thời gian</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Thao tác</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tournaments.map((tournament) => (
            <TableRow key={tournament.id}>
              <TableCell className="font-medium">{tournament.name}</TableCell>
              <TableCell>{sportTypes.find(s => s.value === tournament.sportType)?.label || tournament.sportType}</TableCell>
              <TableCell>
                {tournament.startDate && (
                  <div className="text-sm">
                    <div>
                      Bắt đầu: {formatDate(new Date(tournament.startDate), 'dd/MM/yyyy')}
                    </div>
                    {tournament.endDate && (
                      <div>
                        Kết thúc: {formatDate(new Date(tournament.endDate), 'dd/MM/yyyy')}
                      </div>
                    )}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
                  tournament.status === "upcoming" && "bg-blue-100 text-blue-800",
                  tournament.status === "ongoing" && "bg-green-100 text-green-800",
                  tournament.status === "completed" && "bg-gray-100 text-gray-800",
                  tournament.status === "cancelled" && "bg-red-100 text-red-800"
                )}>
                  {statusOptions.find(s => s.value === tournament.status)?.label || tournament.status}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Mở menu</span>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => openEditDialog(tournament)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Chỉnh sửa
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => confirmDelete(tournament)}>
                      <Trash className="mr-2 h-4 w-4" />
                      Xóa
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  // Render Form
  const renderForm = (isEdit: boolean = false) => {
    return (
      <form onSubmit={isEdit ? handleEditSubmit : handleCreateSubmit} className="space-y-6">
        <Tabs 
          defaultValue="overview" 
          value={currentTab}
          onValueChange={setCurrentTab}
          className="w-full"
        >
          <TabsList className="grid grid-cols-3 mb-4">
            <TabsTrigger value="overview">Thông tin chung</TabsTrigger>
            <TabsTrigger value="format">Thể thức thi đấu</TabsTrigger>
            <TabsTrigger value="form">Biểu mẫu đăng ký</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Tên giải đấu <span className="text-destructive">*</span></Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nhập tên giải đấu"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chi tiết về giải đấu"
                  rows={4}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="sportType">Bộ môn <span className="text-destructive">*</span></Label>
                <Select 
                  value={sportType} 
                  onValueChange={setSportType}
                  required
                >
                  <SelectTrigger id="sportType">
                    <SelectValue placeholder="Chọn bộ môn" />
                  </SelectTrigger>
                  <SelectContent>
                    {sportTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label>Thời gian</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Ngày bắt đầu</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? formatDate(startDate, "dd/MM/yyyy") : "Chọn ngày"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={startDate}
                          onSelect={setStartDate}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Ngày kết thúc</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant={"outline"}
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? formatDate(endDate, "dd/MM/yyyy") : "Chọn ngày"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => startDate ? date < startDate : false}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="registrationDeadline">Hạn đăng ký</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !registrationDeadline && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {registrationDeadline ? formatDate(registrationDeadline, "dd/MM/yyyy") : "Chọn ngày"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={registrationDeadline}
                      onSelect={setRegistrationDeadline}
                      disabled={(date) => startDate ? date > startDate : false}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="status">Trạng thái</Label>
                <Select 
                  value={status} 
                  onValueChange={setStatus}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Chọn trạng thái" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublished"
                  checked={isPublished}
                  onCheckedChange={setIsPublished}
                />
                <Label htmlFor="isPublished">Công khai</Label>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="format" className="space-y-4">
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="format">Thể thức thi đấu <span className="text-destructive">*</span></Label>
                <Select 
                  value={format} 
                  onValueChange={setFormat}
                  required
                >
                  <SelectTrigger id="format">
                    <SelectValue placeholder="Chọn thể thức" />
                  </SelectTrigger>
                  <SelectContent>
                    {tournamentFormats.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <p className="text-sm text-muted-foreground mt-1">
                  {format === "knockout" && "Các đội sẽ thi đấu loại trực tiếp, đội thua sẽ bị loại."}
                  {format === "roundrobin" && "Tất cả các đội sẽ thi đấu với nhau, đội có điểm cao nhất sẽ chiến thắng."}
                  {format === "groups" && "Các đội sẽ được chia thành các bảng đấu, thi đấu vòng tròn trong bảng trước khi vào vòng loại trực tiếp."}
                </p>
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="maxTeams">Số đội tối đa</Label>
                <Input
                  id="maxTeams"
                  type="number"
                  min={2}
                  value={maxTeams || ""}
                  onChange={(e) => setMaxTeams(e.target.value ? parseInt(e.target.value) : undefined)}
                  placeholder="Nhập số đội tối đa"
                />
                
                <p className="text-sm text-muted-foreground mt-1">
                  {format === "knockout" && maxTeams && `Nên chọn số đội là 2^n (2, 4, 8, 16, 32...) để tạo bảng đấu cân đối.`}
                  {format === "groups" && maxTeams && `Nên chọn số đội chia hết cho số đội trong mỗi bảng.`}
                </p>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="form" className="space-y-4">
            <TournamentFormTab
              selectedFormId={selectedFormId}
              setSelectedFormId={setSelectedFormId}
              formFields={formFields}
              setFormFields={setFormFields}
            />
          </TabsContent>
        </Tabs>
        
        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => isEdit ? setIsEditDialogOpen(false) : setIsCreateDialogOpen(false)}
          >
            Hủy
          </Button>
          <Button type="submit" disabled={createTournamentMutation.isPending || updateTournamentMutation.isPending}>
            {(createTournamentMutation.isPending || updateTournamentMutation.isPending) && (
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"></div>
            )}
            {isEdit ? "Cập nhật" : "Tạo giải đấu"}
          </Button>
        </DialogFooter>
      </form>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Quản lý giải đấu</h2>
          <p className="text-muted-foreground">
            Tạo và quản lý các giải đấu thể thao
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Tạo giải đấu
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          {renderTable()}
        </CardContent>
      </Card>

      {/* Dialog tạo giải đấu */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tạo giải đấu mới</DialogTitle>
            <DialogDescription>
              Nhập thông tin chi tiết về giải đấu
            </DialogDescription>
          </DialogHeader>
          {renderForm()}
        </DialogContent>
      </Dialog>

      {/* Dialog sửa giải đấu */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Sửa thông tin giải đấu</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin chi tiết về giải đấu
            </DialogDescription>
          </DialogHeader>
          {renderForm(true)}
        </DialogContent>
      </Dialog>

      {/* Dialog xác nhận xóa */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa giải đấu "{selectedTournament?.name}"?
              Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Hủy
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => selectedTournament && deleteTournamentMutation.mutate(selectedTournament.id)}
              disabled={deleteTournamentMutation.isPending}
            >
              {deleteTournamentMutation.isPending && (
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-background border-t-foreground"></div>
              )}
              Xóa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentManager;