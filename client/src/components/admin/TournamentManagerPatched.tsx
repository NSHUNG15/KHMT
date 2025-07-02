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
import { format } from "date-fns";
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
  const { data: teams = [], isLoading: teamsLoading } = useQuery<any[]>({
    queryKey: ['/api/teams', selectedTournament?.id],
    enabled: Boolean(selectedTournament) && isTeamsViewOpen,
    staleTime: 5000,
  });

  const { data: matches = [], isLoading: matchesLoading } = useQuery<any[]>({
    queryKey: ['/api/matches', selectedTournament?.id],
    enabled: Boolean(selectedTournament) && isMatchesViewOpen,
    staleTime: 5000,
  });

  const { data: standings = [], isLoading: standingsLoading } = useQuery<any[]>({
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
        // Tạo form mới
        const formRes = await apiRequest('POST', '/api/forms', {
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
        formId: formId || null
      });
    } catch (error: any) {
      toast({
        title: "Lỗi khi tạo biểu mẫu",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    }
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTournament) return;
    
    updateTournamentMutation.mutate({
      id: selectedTournament.id,
      tournamentData: {
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
      },
    });
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

  function formatDate(date: Date, dateFormat: string) {
    return format(date, dateFormat);
  }

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
                            "justify-start text-left font-normal",
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
                            "justify-start text-left font-normal",
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
                          {registrationDeadline ? formatDate(registrationDeadline, "PPP") : <span>Chọn ngày</span>}
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
                    <Label htmlFor="isPublished">Công bố giải đấu</Label>
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
                            "justify-start text-left font-normal",
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
                          {registrationDeadline ? formatDate(registrationDeadline, "PPP") : <span>Chọn ngày</span>}
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
                {updateTournamentMutation.isPending ? "Đang cập nhật..." : "Lưu thay đổi"}
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
              Bạn có chắc chắn muốn xóa giải đấu "{selectedTournament?.name}"? Hành động này không thể hoàn tác.
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
              disabled={deleteTournamentMutation.isPending}
            >
              {deleteTournamentMutation.isPending ? "Đang xóa..." : "Xóa giải đấu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Teams View Dialog */}
      <Dialog open={isTeamsViewOpen} onOpenChange={setIsTeamsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Quản lý Đội - {selectedTournament?.name}</DialogTitle>
            <DialogDescription>
              Danh sách các đội tham gia giải đấu
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <div className="flex justify-between mb-4">
              <Button
                onClick={handleExportTeams}
                disabled={exportTeamsMutation.isPending}
                variant="outline"
              >
                <Download className="h-4 w-4 mr-2" />
                {exportTeamsMutation.isPending ? "Đang xuất..." : "Xuất Excel"}
              </Button>
              
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Thêm đội mới
              </Button>
            </div>
            
            {teamsLoading ? (
              <div className="text-center py-4">Đang tải...</div>
            ) : teams.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Chưa có đội nào đăng ký giải đấu này.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tên đội</TableHead>
                    <TableHead>Đội trưởng</TableHead>
                    <TableHead>Số thành viên</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {teams.map((team: any) => (
                    <TableRow key={team.id}>
                      <TableCell className="font-medium">{team.name}</TableCell>
                      <TableCell>{team.captain?.fullName || 'Không có'}</TableCell>
                      <TableCell>{team.memberCount || '0'}</TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          team.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                          team.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {team.status === 'accepted' ? 'Đã chấp nhận' : 
                           team.status === 'pending' ? 'Đang chờ' : 'Từ chối'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
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
              onClick={() => setIsTeamsViewOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Matches View Dialog */}
      <Dialog open={isMatchesViewOpen} onOpenChange={setIsMatchesViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lịch Thi Đấu - {selectedTournament?.name}</DialogTitle>
            <DialogDescription>
              Quản lý lịch thi đấu và kết quả
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            <div className="flex justify-between mb-4">
              <Button
                onClick={() => openBracketGenDialog(selectedTournament!)}
                variant="outline"
              >
                <CalendarIcon className="h-4 w-4 mr-2" />
                Tạo lịch thi đấu
              </Button>
              
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Thêm trận đấu
              </Button>
            </div>
            
            {matchesLoading ? (
              <div className="text-center py-4">Đang tải...</div>
            ) : matches.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Chưa có lịch thi đấu nào được tạo.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vòng</TableHead>
                    <TableHead>Đội 1</TableHead>
                    <TableHead>Đội 2</TableHead>
                    <TableHead>Tỉ số</TableHead>
                    <TableHead>Địa điểm</TableHead>
                    <TableHead className="text-center">Trạng thái</TableHead>
                    <TableHead className="text-right">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {matches.map((match: any) => (
                    <TableRow key={match.id}>
                      <TableCell>
                        {match.format === 'roundrobin' 
                          ? `Vòng tròn ${match.round}` 
                          : match.format === 'groups' 
                            ? `Bảng ${match.groupName} - Trận ${match.matchNumber}` 
                            : `Vòng ${match.round}`}
                      </TableCell>
                      <TableCell>{match.team1?.name || 'TBD'}</TableCell>
                      <TableCell>{match.team2?.name || 'TBD'}</TableCell>
                      <TableCell>
                        {match.team1Score !== null && match.team2Score !== null
                          ? `${match.team1Score} - ${match.team2Score}`
                          : 'Chưa có'
                        }
                      </TableCell>
                      <TableCell>{match.location || 'Chưa ấn định'}</TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          match.status === 'completed' ? 'bg-green-100 text-green-800' : 
                          match.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {match.status === 'completed' ? 'Đã hoàn thành' : 
                           match.status === 'scheduled' ? 'Đã lên lịch' : 'Chưa bắt đầu'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Pencil className="h-4 w-4" />
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
              onClick={() => setIsMatchesViewOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Standings View Dialog */}
      <Dialog open={isStandingsViewOpen} onOpenChange={setIsStandingsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Bảng Xếp Hạng - {selectedTournament?.name}</DialogTitle>
            <DialogDescription>
              Bảng xếp hạng và thành tích
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4">
            {standingsLoading ? (
              <div className="text-center py-4">Đang tải...</div>
            ) : standings.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">
                Chưa có dữ liệu bảng xếp hạng.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Thứ hạng</TableHead>
                    <TableHead>Đội</TableHead>
                    <TableHead className="text-center">Trận</TableHead>
                    <TableHead className="text-center">Thắng</TableHead>
                    <TableHead className="text-center">Hòa</TableHead>
                    <TableHead className="text-center">Thua</TableHead>
                    <TableHead className="text-center">Hiệu số</TableHead>
                    <TableHead className="text-center">Điểm</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {standings.map((standing: any) => (
                    <TableRow key={standing.id}>
                      <TableCell>{standing.rank || '-'}</TableCell>
                      <TableCell className="font-medium">{standing.team?.name || 'Unknown'}</TableCell>
                      <TableCell className="text-center">{standing.wins + standing.draws + standing.losses}</TableCell>
                      <TableCell className="text-center">{standing.wins}</TableCell>
                      <TableCell className="text-center">{standing.draws}</TableCell>
                      <TableCell className="text-center">{standing.losses}</TableCell>
                      <TableCell className="text-center">
                        {standing.goalsFor !== null && standing.goalsAgainst !== null 
                          ? standing.goalsFor - standing.goalsAgainst 
                          : 0}
                      </TableCell>
                      <TableCell className="text-center font-bold">{standing.points}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          
          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              onClick={() => setIsStandingsViewOpen(false)}
            >
              Đóng
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Generate Brackets Dialog */}
      <Dialog open={isBracketGenDialogOpen} onOpenChange={setIsBracketGenDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tạo lịch thi đấu tự động</DialogTitle>
            <DialogDescription>
              Tạo lịch thi đấu tự động dựa trên định dạng giải đấu và các đội đã đăng ký
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <div className="space-y-4">
              <p>
                Định dạng giải đấu: <strong>
                  {tournamentFormats.find(f => f.value === selectedTournament?.format)?.label || selectedTournament?.format}
                </strong>
              </p>
              
              <p>
                Số đội đăng ký: <strong>{teams.length || 0}</strong>
              </p>
              
              <div className="mt-4 p-4 bg-amber-50 text-amber-800 rounded-md">
                <p className="font-medium">Lưu ý:</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>Thao tác này sẽ xóa tất cả các trận đấu hiện có và tạo lịch mới</li>
                  <li>Đảm bảo tất cả các đội đã được chấp nhận trước khi tạo lịch</li>
                  <li>Đối với định dạng loại trực tiếp, số đội nên là lũy thừa của 2 (ví dụ: 8, 16, 32)</li>
                </ul>
              </div>
            </div>
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
    </div>
  );
};

export default TournamentManager;