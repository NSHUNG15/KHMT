import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { ChevronRight, Users, Calendar, Trophy, Bell, FileText } from "lucide-react";
import { Link } from "wouter";

const AdminDashboard = () => {
  const { user } = useAuth();

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

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Dashboard Quản trị</h1>
        <div className="flex items-center space-x-2">
          <span>Xin chào, {user.fullName}</span>
        </div>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="content">Quản lý nội dung</TabsTrigger>
          <TabsTrigger value="users">Quản lý người dùng</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Tổng số người dùng
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
                <Users className="w-4 h-4 text-muted-foreground mt-1" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Sự kiện hoạt động
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
                <Calendar className="w-4 h-4 text-muted-foreground mt-1" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Giải đấu hoạt động
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
                <Trophy className="w-4 h-4 text-muted-foreground mt-1" />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Thông báo mới
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
                <Bell className="w-4 h-4 text-muted-foreground mt-1" />
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Hoạt động gần đây</CardTitle>
                <CardDescription>
                  Các hoạt động mới nhất trong hệ thống
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Không có hoạt động nào gần đây
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Sắp tới</CardTitle>
                <CardDescription>
                  Các sự kiện và giải đấu sắp diễn ra
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-muted-foreground">
                  Không có sự kiện nào sắp tới
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="content">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="hover:bg-secondary/10 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Bell className="w-5 h-5 mr-2" />
                    Thông báo
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  Quản lý thông báo và tin tức
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="hover:bg-secondary/10 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Calendar className="w-5 h-5 mr-2" />
                    Sự kiện
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  Quản lý các sự kiện và đăng ký
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="hover:bg-secondary/10 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Trophy className="w-5 h-5 mr-2" />
                    Giải đấu
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  Quản lý các giải đấu thể thao
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="hover:bg-secondary/10 transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 mr-2" />
                    Biểu mẫu
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </CardTitle>
                <CardDescription>
                  Tạo và quản lý biểu mẫu tùy chỉnh
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>Danh sách người dùng</CardTitle>
              <CardDescription>
                Quản lý tài khoản người dùng trong hệ thống
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Không có dữ liệu người dùng
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminDashboard;