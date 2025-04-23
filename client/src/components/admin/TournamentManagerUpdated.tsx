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
  { value: "soccer", label: "Bóng đá" },
  { value: "basketball", label: "Bóng rổ" },
  { value: "volleyball", label: "Bóng chuyền" },
  { value: "badminton", label: "Cầu lông" },
  { value: "tabletennis", label: "Bóng bàn" },
  { value: "chess", label: "Cờ vua" },
  { value: "other", label: "Khác" }
];

const tournamentFormats = [
  { value: "knockout", label: "Loại trực tiếp" },
  { value: "roundrobin", label: "Vòng tròn" },
  { value: "groups", label: "Chia bảng + Loại trực tiếp" }
];

const TournamentManager = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedTournament, setSelectedTournament] = useState<Tournament | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isTeamsViewOpen, setIsTeamsViewOpen] = useState(false);
  const [isMatchesViewOpen, setIsMatchesViewOpen] = useState(false);
  const [isStandingsViewOpen, setIsStandingsViewOpen] = useState(false);
  const [isBracketGenDialogOpen, setIsBracketGenDialogOpen] = useState(false);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [registrationDeadline, setRegistrationDeadline] = useState<Date>();
  const [sportType, setSportType] = useState("");
  const [format, setFormat] = useState("");
  const [maxTeams, setMaxTeams] = useState<number>(0);
  const [isPublished, setIsPublished] = useState(false);
  const [status, setStatus] = useState("draft");
  const [selectedFormId, setSelectedFormId] = useState<number | undefined>(undefined);
  const [formFields, setFormFields] = useState<any[]>([]);

  // Tournament query
  const { data: tournaments = [], isLoading } = useQuery<Tournament[]>({
    queryKey: ['/api/tournaments'],
    staleTime: 10000,
  });

  // Create tournament mutation
  const createTournamentMutation = useMutation({
    mutationFn: async (newTournament: any) => {
      const res = await apiRequest('POST', '/api/tournaments', newTournament);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      toast({
        title: "Tạo giải đấu thành công",
        description: "Giải đấu mới đã được tạo",
      });
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi tạo giải đấu",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    },
  });

  // Update tournament mutation
  const updateTournamentMutation = useMutation({
    mutationFn: async ({ id, tournamentData }: { id: number; tournamentData: any }) => {
      const res = await apiRequest('PATCH', `/api/tournaments/${id}`, tournamentData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      toast({
        title: "Cập nhật giải đấu thành công",
        description: "Giải đấu đã được cập nhật",
      });
      resetForm();
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi cập nhật giải đấu",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    },
  });

  // Delete tournament mutation
  const deleteTournamentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/tournaments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      toast({
        title: "Xóa giải đấu thành công",
        description: "Giải đấu đã được xóa",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi xóa giải đấu",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    },
  });

  // Generate brackets mutation
  const generateBracketsMutation = useMutation({
    mutationFn: async (tournamentId: number) => {
      const res = await apiRequest('POST', `/api/tournaments/${tournamentId}/generate-brackets`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tournaments'] });
      queryClient.invalidateQueries({ queryKey: ['/api/matches'] });
      toast({
        title: "Tạo lịch thi đấu thành công",
        description: "Lịch thi đấu đã được tạo và cập nhật",
      });
      setIsBracketGenDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi tạo lịch thi đấu",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    },
  });

  // Export teams mutation
  const exportTeamsMutation = useMutation({
    mutationFn: async (tournamentId: number) => {
      const res = await apiRequest('GET', `/api/tournaments/${tournamentId}/export-teams`, {});
      return res;
    },
    onSuccess: (data) => {
      toast({
        title: "Xuất dữ liệu thành công",
        description: "Dữ liệu đội thi đấu đã được xuất",
      });
      // Handle file download
      data.blob().then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tournament_teams_${selectedTournament?.id}.xlsx`;
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

  // Teams, Matches and Standings queries
  const { data: teams = [], isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/teams', selectedTournament?.id],
    enabled: Boolean(selectedTournament) && isTeamsViewOpen,
    staleTime: 5000,
  });

  const { data: matches = [], isLoading: matchesLoading } = useQuery({
    queryKey: ['/api/matches', selectedTournament?.id],
    enabled: Boolean(selectedTournament) && isMatchesViewOpen,
    staleTime: 5000,
  });

  const { data: standings = [], isLoading: standingsLoading } = useQuery({
    queryKey: ['/api/standings', selectedTournament?.id],
    enabled: Boolean(selectedTournament) && isStandingsViewOpen,
    staleTime: 5000,
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setStartDate(undefined);
    setEndDate(undefined);
    setRegistrationDeadline(undefined);
    setSportType("");
    setFormat("");
    setMaxTeams(0);
    setIsPublished(false);
    setStatus("draft");
    setSelectedFormId(undefined);
    setFormFields([]);
  };

  const loadTournamentToEdit = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setName(tournament.name);
    setDescription(tournament.description);
    setStartDate(new Date(tournament.startDate));
    setEndDate(new Date(tournament.endDate));
    setRegistrationDeadline(new Date(tournament.registrationDeadline));
    setSportType(tournament.sportType);
    setFormat(tournament.format);
    setMaxTeams(tournament.maxTeams || 0);
    setIsPublished(tournament.isPublished);
    setStatus(tournament.status);
    // Handle undefined or null here
    setSelectedFormId(tournament.formId || undefined);
    setIsEditDialogOpen(true);
  };

  const confirmDelete = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Nếu người dùng chưa điền thông tin cơ bản, hiển thị thông báo
    if (!name || !description || !sportType || !format) {
      toast({
        title: "Thiếu thông tin",
        description: "Vui lòng điền đầy đủ thông tin cơ bản cho giải đấu",
        variant: "destructive",
      });
      return;
    }
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    try {
      // Nếu có formFields mới và không chọn form có sẵn, tạo form mới
      let formId = selectedFormId;
      
      if (!formId && formFields.length > 0) {
        // Tạo form mới
        const formRes = await apiRequest('POST', '/api/custom-forms', {
          name: `Form đăng ký giải đấu ${name}`,
          fields: formFields,
          createdBy: user.id
        });
        const newForm = await formRes.json();
        formId = newForm.id;
        
        toast({
          title: "Tạo biểu mẫu thành công",
          description: "Biểu mẫu đăng ký đã được tạo"
        });
      }
      
      // Tạo giải đấu với biểu mẫu (nếu có)
      // Chuyển đổi các đối tượng Date thành chuỗi ISO để tương thích với schema
      createTournamentMutation.mutate({
        name,
        description,
        startDate: startDate ? startDate.toISOString() : undefined,
        endDate: endDate ? endDate.toISOString() : undefined,
        registrationDeadline: registrationDeadline ? registrationDeadline.toISOString() : undefined,
        sportType,
        format,
        maxTeams: maxTeams || undefined,
        isPublished,
        status,
        createdBy: user.id,
        formId: formId || undefined
      });
    } catch (error: any) {
      toast({
        title: "Lỗi khi tạo biểu mẫu",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;
    
    try {
      // Nếu có formFields mới và không chọn form có sẵn, tạo form mới
      let formId = selectedFormId;
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      if (!formId && formFields.length > 0) {
        // Tạo form mới
        const formRes = await apiRequest('POST', '/api/custom-forms', {
          name: `Form đăng ký giải đấu ${name}`,
          fields: formFields,
          createdBy: user.id
        });
        const newForm = await formRes.json();
        formId = newForm.id;
        
        toast({
          title: "Tạo biểu mẫu thành công",
          description: "Biểu mẫu đăng ký đã được tạo"
        });
      }
      
      // Chuyển đổi các đối tượng Date thành chuỗi ISO để tương thích với schema
      updateTournamentMutation.mutate({
        id: selectedTournament.id,
        tournamentData: {
          name,
          description,
          startDate: startDate ? startDate.toISOString() : undefined,
          endDate: endDate ? endDate.toISOString() : undefined,
          registrationDeadline: registrationDeadline ? registrationDeadline.toISOString() : undefined,
          sportType,
          format,
          maxTeams: maxTeams || undefined,
          isPublished,
          status,
          formId: formId || undefined
        },
      });
    } catch (error: any) {
      toast({
        title: "Lỗi khi cập nhật giải đấu",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    }
  };

  const handleDeleteConfirm = () => {
    if (selectedTournament) {
      deleteTournamentMutation.mutate(selectedTournament.id);
    }
  };

  const handleGenerateBrackets = () => {
    if (selectedTournament) {
      generateBracketsMutation.mutate(selectedTournament.id);
    }
  };

  const handleExportTeams = () => {
    if (selectedTournament) {
      exportTeamsMutation.mutate(selectedTournament.id);
    }
  };

  const openTeamsView = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setIsTeamsViewOpen(true);
  };

  const openMatchesView = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setIsMatchesViewOpen(true);
  };

  const openStandingsView = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setIsStandingsViewOpen(true);
  };

  const openBracketGenDialog = (tournament: Tournament) => {
    setSelectedTournament(tournament);
    setIsBracketGenDialogOpen(true);
  };

  // Chúng ta đã import formatDate từ date-fns ở trên nên không cần định nghĩa lại
  // function formatDate(date: Date, formatStr: string) { 
  //   return format(date, formatStr);
  // }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý Giải đấu</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo giải đấu mới
        </Button>
      </div>

      {/* Tournaments List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách giải đấu</CardTitle>
          <CardDescription>
            Quản lý tất cả các giải đấu và hội thao
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : tournaments.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Chưa có giải đấu nào. Hãy tạo giải đấu mới.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên giải đấu</TableHead>
                  <TableHead>Bộ môn</TableHead>
                  <TableHead>Định dạng</TableHead>
                  <TableHead>Ngày bắt đầu</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tournaments.map((tournament) => (
                  <TableRow key={tournament.id}>
                    <TableCell className="font-medium">{tournament.name}</TableCell>
                    <TableCell>
                      {sportTypes.find(s => s.value === tournament.sportType)?.label || tournament.sportType}
                    </TableCell>
                    <TableCell>
                      {tournamentFormats.find(f => f.value === tournament.format)?.label || tournament.format}
                    </TableCell>
                    <TableCell>{formatDate(new Date(tournament.startDate), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        tournament.status === 'ongoing' ? 'bg-green-100 text-green-800' : 
                        tournament.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {tournament.status === 'ongoing' ? 'Đang diễn ra' : 
                         tournament.status === 'completed' ? 'Đã kết thúc' : 'Bản nháp'}
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
                          <DropdownMenuItem onClick={() => loadTournamentToEdit(tournament)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openTeamsView(tournament)}>
                            <UsersRound className="h-4 w-4 mr-2" />
                            Quản lý đội
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openMatchesView(tournament)}>
                            <Trophy className="h-4 w-4 mr-2" />
                            Lịch thi đấu
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openStandingsView(tournament)}>
                            <Table2 className="h-4 w-4 mr-2" />
                            Bảng xếp hạng
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openBracketGenDialog(tournament)}>
                            <CalendarIcon className="h-4 w-4 mr-2" />
                            Tạo lịch thi đấu
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleExportTeams()}>
                            <Download className="h-4 w-4 mr-2" />
                            Xuất danh sách đội
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => confirmDelete(tournament)}
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

      {/* Create Tournament Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo giải đấu mới</DialogTitle>
            <DialogDescription>
              Điền thông tin chi tiết để tạo giải đấu mới
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateSubmit}>
            <Tabs defaultValue="basic" className="mt-4">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
                <TabsTrigger value="dates">Thời gian</TabsTrigger>
                <TabsTrigger value="format">Định dạng giải đấu</TabsTrigger>
                <TabsTrigger value="form">Biểu mẫu đăng ký</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Tên giải đấu</Label>
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
                      required 
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="sportType">Bộ môn thể thao</Label>
                    <Select value={sportType} onValueChange={setSportType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn bộ môn" />
                      </SelectTrigger>
                      <SelectContent>
                        {sportTypes.map(sport => (
                          <SelectItem key={sport.value} value={sport.value}>
                            {sport.label}
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
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? formatDate(startDate, "PPP") : <span>Chọn ngày</span>}
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
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? formatDate(endDate, "PPP") : <span>Chọn ngày</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => 
                            startDate ? date < startDate : false
                          }
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
                            "w-full justify-start text-left font-normal",
                            !registrationDeadline && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {registrationDeadline ? formatDate(registrationDeadline, "PPP") : <span>Chọn ngày</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={registrationDeadline}
                          onSelect={setRegistrationDeadline}
                          disabled={(date) => 
                            startDate ? date > startDate : false
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="format" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="format">Định dạng thi đấu</Label>
                    <Select value={format} onValueChange={setFormat} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn định dạng" />
                      </SelectTrigger>
                      <SelectContent>
                        {tournamentFormats.map(f => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Định dạng thi đấu sẽ quyết định cách thức tổ chức và xếp cặp đấu.
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="maxTeams">Số đội tối đa</Label>
                    <Input 
                      id="maxTeams" 
                      type="number" 
                      value={maxTeams} 
                      onChange={(e) => setMaxTeams(parseInt(e.target.value))} 
                      min={0}
                      placeholder="Để trống nếu không giới hạn"
                    />
                    <p className="text-sm text-muted-foreground">
                      Một số định dạng thi đấu yêu cầu số đội là lũy thừa của 2 (ví dụ: 8, 16, 32).
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="status">Trạng thái</Label>
                    <Select value={status} onValueChange={setStatus} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Bản nháp</SelectItem>
                        <SelectItem value="ongoing">Đang diễn ra</SelectItem>
                        <SelectItem value="completed">Đã kết thúc</SelectItem>
                      </SelectContent>
                    </Select>
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
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={createTournamentMutation.isPending}>
                {createTournamentMutation.isPending ? "Đang xử lý..." : "Tạo giải đấu"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Tournament Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa giải đấu</DialogTitle>
            <DialogDescription>
              Cập nhật thông tin cho giải đấu
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit}>
            <Tabs defaultValue="basic" className="mt-4">
              <TabsList className="mb-4">
                <TabsTrigger value="basic">Thông tin cơ bản</TabsTrigger>
                <TabsTrigger value="dates">Thời gian</TabsTrigger>
                <TabsTrigger value="format">Định dạng giải đấu</TabsTrigger>
                <TabsTrigger value="form">Biểu mẫu đăng ký</TabsTrigger>
              </TabsList>
              
              <TabsContent value="basic" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="name">Tên giải đấu</Label>
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
                      required 
                    />
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="sportType">Bộ môn thể thao</Label>
                    <Select value={sportType} onValueChange={setSportType} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn bộ môn" />
                      </SelectTrigger>
                      <SelectContent>
                        {sportTypes.map(sport => (
                          <SelectItem key={sport.value} value={sport.value}>
                            {sport.label}
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
                    <Label htmlFor="isPublished">Công bố</Label>
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
                            "w-full justify-start text-left font-normal",
                            !startDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {startDate ? formatDate(startDate, "PPP") : <span>Chọn ngày</span>}
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
                            "w-full justify-start text-left font-normal",
                            !endDate && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endDate ? formatDate(endDate, "PPP") : <span>Chọn ngày</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={endDate}
                          onSelect={setEndDate}
                          disabled={(date) => 
                            startDate ? date < startDate : false
                          }
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
                            "w-full justify-start text-left font-normal",
                            !registrationDeadline && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {registrationDeadline ? formatDate(registrationDeadline, "PPP") : <span>Chọn ngày</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={registrationDeadline}
                          onSelect={setRegistrationDeadline}
                          disabled={(date) => 
                            startDate ? date > startDate : false
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="format" className="space-y-4">
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="format">Định dạng thi đấu</Label>
                    <Select value={format} onValueChange={setFormat} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn định dạng" />
                      </SelectTrigger>
                      <SelectContent>
                        {tournamentFormats.map(f => (
                          <SelectItem key={f.value} value={f.value}>
                            {f.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      Định dạng thi đấu sẽ quyết định cách thức tổ chức và xếp cặp đấu.
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="maxTeams">Số đội tối đa</Label>
                    <Input 
                      id="maxTeams" 
                      type="number" 
                      value={maxTeams} 
                      onChange={(e) => setMaxTeams(parseInt(e.target.value))} 
                      min={0}
                      placeholder="Để trống nếu không giới hạn"
                    />
                    <p className="text-sm text-muted-foreground">
                      Một số định dạng thi đấu yêu cầu số đội là lũy thừa của 2 (ví dụ: 8, 16, 32).
                    </p>
                  </div>
                  
                  <div className="grid gap-2">
                    <Label htmlFor="status">Trạng thái</Label>
                    <Select value={status} onValueChange={setStatus} required>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn trạng thái" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">Bản nháp</SelectItem>
                        <SelectItem value="ongoing">Đang diễn ra</SelectItem>
                        <SelectItem value="completed">Đã kết thúc</SelectItem>
                      </SelectContent>
                    </Select>
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
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={updateTournamentMutation.isPending}>
                {updateTournamentMutation.isPending ? "Đang xử lý..." : "Cập nhật"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa giải đấu</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa giải đấu này? Thao tác này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4 pb-2">
            {selectedTournament && (
              <div className="border rounded-md p-4 mb-4">
                <p className="font-medium">{selectedTournament.name}</p>
                <p className="text-sm text-muted-foreground mt-1">{selectedTournament.description}</p>
              </div>
            )}
          </div>
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
              disabled={deleteTournamentMutation.isPending}
            >
              {deleteTournamentMutation.isPending ? "Đang xử lý..." : "Xác nhận xóa"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Generate Brackets Dialog */}
      <Dialog open={isBracketGenDialogOpen} onOpenChange={setIsBracketGenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo lịch thi đấu</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn tạo lịch thi đấu cho giải đấu này? Lưu ý rằng bất kỳ lịch thi đấu hiện có nào sẽ bị xóa.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-4 pb-2">
            {selectedTournament && (
              <div className="border rounded-md p-4 mb-4">
                <p className="font-medium">{selectedTournament.name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {tournamentFormats.find(f => f.value === selectedTournament.format)?.label || selectedTournament.format}
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsBracketGenDialogOpen(false)}
            >
              Hủy
            </Button>
            <Button 
              type="button" 
              onClick={handleGenerateBrackets}
              disabled={generateBracketsMutation.isPending}
            >
              {generateBracketsMutation.isPending ? "Đang xử lý..." : "Tạo lịch thi đấu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teams View Dialog */}
      <Dialog open={isTeamsViewOpen} onOpenChange={setIsTeamsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quản lý đội thi đấu</DialogTitle>
            <DialogDescription>
              {selectedTournament?.name} - Danh sách đội tham gia
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {teamsLoading ? (
              <div className="text-center py-8">Đang tải dữ liệu...</div>
            ) : Array.isArray(teams) && teams.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có đội nào đăng ký tham gia.
              </div>
            ) : (
              <div className="space-y-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tên đội</TableHead>
                      <TableHead>Đội trưởng</TableHead>
                      <TableHead>Số thành viên</TableHead>
                      <TableHead>Ngày đăng ký</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(teams) && teams.map((team: any) => (
                      <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>{team.captainName}</TableCell>
                        <TableCell>{team.memberCount || '-'}</TableCell>
                        <TableCell>{formatDate(new Date(team.createdAt), "dd/MM/yyyy")}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            <FileText className="h-4 w-4 mr-2" />
                            Chi tiết
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsTeamsViewOpen(false)}
            >
              Đóng
            </Button>
            <Button 
              type="button" 
              onClick={handleExportTeams}
              disabled={exportTeamsMutation.isPending}
            >
              {exportTeamsMutation.isPending 
                ? "Đang xuất..." 
                : <>
                    <Download className="h-4 w-4 mr-2" />
                    Xuất Excel
                  </>
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Matches View Dialog */}
      <Dialog open={isMatchesViewOpen} onOpenChange={setIsMatchesViewOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lịch thi đấu</DialogTitle>
            <DialogDescription>
              {selectedTournament?.name} - Lịch thi đấu
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {matchesLoading ? (
              <div className="text-center py-8">Đang tải dữ liệu...</div>
            ) : Array.isArray(matches) && matches.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có lịch thi đấu nào được tạo.
                <div className="mt-4">
                  <Button onClick={() => {
                    setIsMatchesViewOpen(false);
                    setIsBracketGenDialogOpen(true);
                  }}>
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    Tạo lịch thi đấu
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vòng đấu</TableHead>
                      <TableHead>Đội 1</TableHead>
                      <TableHead>Tỉ số</TableHead>
                      <TableHead>Đội 2</TableHead>
                      <TableHead>Ngày thi đấu</TableHead>
                      <TableHead>Trạng thái</TableHead>
                      <TableHead className="text-right">Thao tác</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(matches) && matches.map((match: any) => (
                      <TableRow key={match.id}>
                        <TableCell>{match.round}</TableCell>
                        <TableCell>{match.team1Name}</TableCell>
                        <TableCell>
                          {match.status === 'completed' 
                            ? `${match.team1Score} - ${match.team2Score}`
                            : '-'
                          }
                        </TableCell>
                        <TableCell>{match.team2Name}</TableCell>
                        <TableCell>
                          {match.matchDate ? formatDate(new Date(match.matchDate), "dd/MM/yyyy") : 'TBD'}
                        </TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            match.status === 'completed' ? 'bg-green-100 text-green-800' : 
                            match.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {match.status === 'completed' ? 'Đã kết thúc' : 
                            match.status === 'ongoing' ? 'Đang diễn ra' : 
                            'Chưa bắt đầu'}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm">
                            <Pencil className="h-4 w-4 mr-2" />
                            Cập nhật
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsMatchesViewOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Standings View Dialog */}
      <Dialog open={isStandingsViewOpen} onOpenChange={setIsStandingsViewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bảng xếp hạng</DialogTitle>
            <DialogDescription>
              {selectedTournament?.name} - Bảng xếp hạng
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            {standingsLoading ? (
              <div className="text-center py-8">Đang tải dữ liệu...</div>
            ) : Array.isArray(standings) && standings.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Chưa có bảng xếp hạng nào được tạo.
              </div>
            ) : (
              <div className="space-y-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hạng</TableHead>
                      <TableHead>Đội</TableHead>
                      <TableHead>Điểm</TableHead>
                      <TableHead>Thắng</TableHead>
                      <TableHead>Hòa</TableHead>
                      <TableHead>Thua</TableHead>
                      <TableHead>Hiệu số</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {Array.isArray(standings) && standings.map((standing: any, index: number) => (
                      <TableRow key={standing.id}>
                        <TableCell>{index + 1}</TableCell>
                        <TableCell className="font-medium">{standing.teamName}</TableCell>
                        <TableCell>{standing.points}</TableCell>
                        <TableCell>{standing.wins}</TableCell>
                        <TableCell>{standing.draws}</TableCell>
                        <TableCell>{standing.losses}</TableCell>
                        <TableCell>{standing.goalsFor - standing.goalsAgainst}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsStandingsViewOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TournamentManager;