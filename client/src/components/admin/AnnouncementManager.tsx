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
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoreHorizontal, Plus, Pencil, Trash, Eye } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Announcement } from "@shared/schema";

const AnnouncementManager = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [isPublished, setIsPublished] = useState(true);

  // Announcements query
  const { data: announcements = [], isLoading } = useQuery<Announcement[]>({
    queryKey: ['/api/announcements'],
    staleTime: 10000,
  });

  // Create announcement mutation
  const createAnnouncementMutation = useMutation({
    mutationFn: async (newAnnouncement: any) => {
      const res = await apiRequest('POST', '/api/announcements', newAnnouncement);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({
        title: "Tạo thông báo thành công",
        description: "Thông báo mới đã được tạo",
      });
      resetForm();
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi tạo thông báo",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    },
  });

  // Update announcement mutation
  const updateAnnouncementMutation = useMutation({
    mutationFn: async ({ id, announcementData }: { id: number; announcementData: any }) => {
      const res = await apiRequest('PATCH', `/api/announcements/${id}`, announcementData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({
        title: "Cập nhật thông báo thành công",
        description: "Thông báo đã được cập nhật",
      });
      resetForm();
      setIsEditDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi cập nhật thông báo",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    },
  });

  // Delete announcement mutation
  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/announcements/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/announcements'] });
      toast({
        title: "Xóa thông báo thành công",
        description: "Thông báo đã được xóa",
      });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Lỗi khi xóa thông báo",
        description: error.message || "Đã xảy ra lỗi, vui lòng thử lại sau",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTitle("");
    setContent("");
    setCategory("general");
    setIsPublished(true);
  };

  const loadAnnouncementToEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setTitle(announcement.title);
    setContent(announcement.content);
    setCategory(announcement.category);
    setIsPublished(announcement.isPublished);
    setIsEditDialogOpen(true);
  };

  const viewAnnouncement = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsViewDialogOpen(true);
  };

  const confirmDelete = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsDeleteDialogOpen(true);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const { user } = JSON.parse(localStorage.getItem('userAuth') || '{"user":{"id": 1}}');
    
    // Log the data for debugging
    const newAnnouncement = {
      title,
      content,
      category,
      isPublished,
      createdBy: user?.id || 1,
    };
    
    console.log('Creating announcement with data:', newAnnouncement);
    
    createAnnouncementMutation.mutate(newAnnouncement);
  };

  const handleEditSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAnnouncement) return;
    
    updateAnnouncementMutation.mutate({
      id: selectedAnnouncement.id,
      announcementData: {
        title,
        content,
        category,
        isPublished,
      },
    });
  };

  const handleDeleteConfirm = () => {
    if (selectedAnnouncement) {
      deleteAnnouncementMutation.mutate(selectedAnnouncement.id);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Quản lý Thông báo</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo thông báo mới
        </Button>
      </div>

      {/* Announcements List */}
      <Card>
        <CardHeader>
          <CardTitle>Danh sách thông báo</CardTitle>
          <CardDescription>
            Quản lý tất cả các thông báo và tin tức
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-4">Đang tải...</div>
          ) : announcements.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              Chưa có thông báo nào. Hãy tạo thông báo mới.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiêu đề</TableHead>
                  <TableHead>Danh mục</TableHead>
                  <TableHead>Ngày tạo</TableHead>
                  <TableHead className="text-center">Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell className="font-medium">
                      <div className="truncate max-w-[250px]">{announcement.title}</div>
                    </TableCell>
                    <TableCell>
                      <span className="px-2 py-1 rounded-full text-xs bg-blue-100 text-blue-800">
                        {announcement.category === "general" && "Thông tin chung"}
                        {announcement.category === "academic" && "Học thuật"}
                        {announcement.category === "events" && "Sự kiện"}
                        {announcement.category === "competition" && "Cuộc thi"}
                        {announcement.category === "news" && "Tin tức"}
                        {!announcement.category && "Thông tin chung"}
                      </span>
                    </TableCell>
                    <TableCell>{format(new Date(announcement.createdAt), "dd/MM/yyyy")}</TableCell>
                    <TableCell className="text-center">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        announcement.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {announcement.isPublished ? 'Đã đăng' : 'Bản nháp'}
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
                          <DropdownMenuItem onClick={() => viewAnnouncement(announcement)}>
                            <Eye className="h-4 w-4 mr-2" />
                            Xem chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => loadAnnouncementToEdit(announcement)}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Chỉnh sửa
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={() => confirmDelete(announcement)}
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

      {/* Create Announcement Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Tạo thông báo mới</DialogTitle>
            <DialogDescription>
              Nhập nội dung thông báo và tin tức
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleCreateSubmit}>
            <div className="grid gap-6 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Nhập tiêu đề thông báo"
                  required 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="content">Nội dung</Label>
                <Textarea 
                  id="content" 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  placeholder="Nhập nội dung chi tiết"
                  rows={8}
                  required 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category">Danh mục</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Thông tin chung</SelectItem>
                    <SelectItem value="academic">Học thuật</SelectItem>
                    <SelectItem value="events">Sự kiện</SelectItem>
                    <SelectItem value="competition">Cuộc thi</SelectItem>
                    <SelectItem value="news">Tin tức</SelectItem>
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
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={createAnnouncementMutation.isPending}>
                {createAnnouncementMutation.isPending ? "Đang xử lý..." : "Tạo thông báo"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Announcement Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chỉnh sửa thông báo</DialogTitle>
            <DialogDescription>
              Cập nhật nội dung thông báo
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleEditSubmit}>
            <div className="grid gap-6 mt-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Tiêu đề</Label>
                <Input 
                  id="title" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  placeholder="Nhập tiêu đề thông báo"
                  required 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="content">Nội dung</Label>
                <Textarea 
                  id="content" 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                  placeholder="Nhập nội dung chi tiết"
                  rows={8}
                  required 
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="category">Danh mục</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">Thông tin chung</SelectItem>
                    <SelectItem value="academic">Học thuật</SelectItem>
                    <SelectItem value="events">Sự kiện</SelectItem>
                    <SelectItem value="competition">Cuộc thi</SelectItem>
                    <SelectItem value="news">Tin tức</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  id="isPublished" 
                  checked={isPublished} 
                  onCheckedChange={setIsPublished} 
                />
                <Label htmlFor="isPublished">Đã công bố</Label>
              </div>
            </div>
            
            <DialogFooter className="mt-6">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button type="submit" disabled={updateAnnouncementMutation.isPending}>
                {updateAnnouncementMutation.isPending ? "Đang cập nhật..." : "Lưu thay đổi"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Announcement Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Chi tiết thông báo</DialogTitle>
          </DialogHeader>
          
          {selectedAnnouncement && (
            <div className="mt-4 space-y-4">
              <div>
                <h3 className="text-xl font-bold">{selectedAnnouncement.title}</h3>
                <div className="flex flex-col gap-1 mt-1">
                  <p className="text-sm text-muted-foreground">
                    Ngày tạo: {format(new Date(selectedAnnouncement.createdAt), "dd/MM/yyyy HH:mm")}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Danh mục: </span>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {selectedAnnouncement.category === "general" && "Thông tin chung"}
                      {selectedAnnouncement.category === "academic" && "Học thuật"}
                      {selectedAnnouncement.category === "events" && "Sự kiện"}
                      {selectedAnnouncement.category === "competition" && "Cuộc thi"}
                      {selectedAnnouncement.category === "news" && "Tin tức"}
                      {!selectedAnnouncement.category && "Thông tin chung"}
                    </span>
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Trạng thái: </span>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      selectedAnnouncement.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedAnnouncement.isPublished ? 'Đã đăng' : 'Bản nháp'}
                    </span>
                  </p>
                </div>
              </div>
              
              <div className="border-t pt-4">
                <div className="whitespace-pre-wrap">
                  {selectedAnnouncement.content}
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter className="mt-6">
            <Button 
              type="button" 
              onClick={() => setIsViewDialogOpen(false)}
            >
              Đóng
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsViewDialogOpen(false);
                loadAnnouncementToEdit(selectedAnnouncement!);
              }}
            >
              Chỉnh sửa
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription>
              Bạn có chắc chắn muốn xóa thông báo "{selectedAnnouncement?.title}"? Hành động này không thể hoàn tác.
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
              disabled={deleteAnnouncementMutation.isPending}
            >
              {deleteAnnouncementMutation.isPending ? "Đang xóa..." : "Xóa thông báo"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AnnouncementManager;