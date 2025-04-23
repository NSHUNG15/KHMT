
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { ChevronRight, Users, Calendar, Trophy, Bell, FileText, Download } from "lucide-react";
import { Link } from "wouter";
import DataTable from "@/components/admin/DataTable";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

const AdminDashboard = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  // Queries
  const { data: events } = useQuery({
    queryKey: ['/api/events'],
  });

  const { data: tournaments } = useQuery({
    queryKey: ['/api/tournaments'],
  });

  const { data: registrations } = useQuery({
    queryKey: ['/api/events/registrations'],
  });

  if (!user || user.role !== "admin") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Truy cập bị từ chối</h1>
          <p className="mb-4">Bạn không có quyền truy cập trang này.</p>
          <Link href="/">
            <Button>Quay về trang chủ</Button>
          </Link>
        </div>
      </div>
    );
  }

  const handleExportExcel = async (eventId: number) => {
    try {
      const response = await fetch(`/api/events/${eventId}/registrations/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `event-registrations-${eventId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (error) {
      toast({
        title: "Lỗi xuất file",
        description: "Không thể xuất danh sách đăng ký. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard Quản trị</h1>
        <div className="flex items-center space-x-2">
          <span>Xin chào, {user.fullName}</span>
        </div>
      </div>

      <Tabs defaultValue="events" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="events">Sự kiện</TabsTrigger>
          <TabsTrigger value="tournaments">Hội thao</TabsTrigger>
          <TabsTrigger value="registrations">Đăng ký</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Quản lý sự kiện</CardTitle>
                <CardDescription>Tạo và quản lý các sự kiện</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Thêm sự kiện mới</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Thêm sự kiện mới</DialogTitle>
                    <DialogDescription>
                      Điền thông tin sự kiện mới
                    </DialogDescription>
                  </DialogHeader>
                  <div>
                    {/* Form fields will be added here */}
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <DataTable 
                data={events || []}
                columns={[
                  { header: "Tên sự kiện", accessorKey: "title" },
                  { header: "Ngày bắt đầu", accessorKey: "startDate" },
                  { header: "Trạng thái", accessorKey: "status", cell: (row) => row.status || "Đang hoạt động" }
                ]}
                onEdit={(row) => {
                  console.log("Edit event", row);
                }}
                onDelete={(row) => {
                  console.log("Delete event", row);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tournaments">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Quản lý Hội thao</CardTitle>
                <CardDescription>Quản lý giải đấu và kết quả</CardDescription>
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button>Thêm giải đấu mới</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Thêm giải đấu mới</DialogTitle>
                    <DialogDescription>
                      Điền thông tin giải đấu mới
                    </DialogDescription>
                  </DialogHeader>
                  <div>
                    {/* Form fields will be added here */}
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              <DataTable 
                data={tournaments || []}
                columns={[
                  { header: "Tên giải đấu", accessorKey: "name" },
                  { header: "Môn thể thao", accessorKey: "sportType" },
                  { header: "Trạng thái", accessorKey: "status", cell: (row) => row.status || "Đang hoạt động" }
                ]}
                onView={(row) => {
                  console.log("View tournament", row);
                }}
                onEdit={(row) => {
                  console.log("Edit tournament", row);
                }}
                onDelete={(row) => {
                  console.log("Delete tournament", row);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="registrations">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách đăng ký</CardTitle>
              <CardDescription>
                Quản lý đăng ký sự kiện và giải đấu
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DataTable 
                data={registrations || []}
                columns={[
                  { header: "Người đăng ký", accessorKey: "userId", cell: (row) => row.user?.fullName || `Người dùng #${row.userId}` },
                  { header: "Sự kiện", accessorKey: "eventId", cell: (row) => row.event?.title || `Sự kiện #${row.eventId}` },
                  { header: "Ngày đăng ký", accessorKey: "registeredAt" },
                  { header: "Trạng thái", accessorKey: "status", cell: (row) => row.status || "Chờ xác nhận" }
                ]}
                onView={(row) => {
                  console.log("View registration", row);
                }}
                onEdit={(row) => {
                  console.log("Edit registration", row);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;
