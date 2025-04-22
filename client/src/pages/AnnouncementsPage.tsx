import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime, formatDate } from "@/lib/utils";
import { Search, Calendar, Award, Megaphone, ListFilter } from "lucide-react";

const AnnouncementsPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  const { data: announcements, isLoading, error } = useQuery({
    queryKey: ['/api/announcements'],
  });

  // Handle error
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Không thể tải thông báo",
        description: "Đã xảy ra lỗi khi tải thông báo. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Filter announcements based on search and category
  const filteredAnnouncements = React.useMemo(() => {
    if (!announcements) return [];

    return announcements.filter((announcement: any) => {
      const matchesSearch = announcement.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           announcement.content.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === "all" || announcement.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [announcements, searchQuery, categoryFilter]);

  // Get the appropriate icon based on category
  const getCategoryIcon = (category: string) => {
    switch (category.toLowerCase()) {
      case 'event':
        return <Calendar className="h-5 w-5 text-primary" />;
      case 'award':
        return <Award className="h-5 w-5 text-accent" />;
      default:
        return <Megaphone className="h-5 w-5 text-primary" />;
    }
  };

  // Get the appropriate color class based on category
  const getCategoryClass = (category: string) => {
    switch (category.toLowerCase()) {
      case 'event':
        return 'bg-primary-100 text-primary-800';
      case 'award':
        return 'bg-accent-100 text-accent-800';
      case 'tournament':
        return 'bg-secondary-100 text-secondary-800';
      default:
        return 'bg-primary-100 text-primary-800';
    }
  };

  const getCategoryName = (category: string) => {
    switch (category.toLowerCase()) {
      case 'event':
        return 'Sự kiện';
      case 'award':
        return 'Giải thưởng';
      case 'tournament':
        return 'Giải đấu';
      default:
        return 'Thông báo';
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-special">Thông báo và hoạt động</h1>
          <p className="text-gray-500 mt-2">Cập nhật tin tức mới nhất từ Đoàn trường Khoa học Máy tính</p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Tìm kiếm thông báo..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <ListFilter className="text-gray-400" />
            <Select
              value={categoryFilter}
              onValueChange={setCategoryFilter}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Lọc theo danh mục" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả danh mục</SelectItem>
                <SelectItem value="general">Thông báo chung</SelectItem>
                <SelectItem value="event">Sự kiện</SelectItem>
                <SelectItem value="award">Giải thưởng</SelectItem>
                <SelectItem value="tournament">Giải đấu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <Skeleton className="h-6 w-64" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-11/12 mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {filteredAnnouncements.length > 0 ? (
              filteredAnnouncements.map((announcement: any) => (
                <Card key={announcement.id} className="overflow-hidden">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-xl">{announcement.title}</CardTitle>
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <span>{formatRelativeTime(announcement.createdAt)}</span>
                          <span className="mx-1">•</span>
                          <span>{formatDate(announcement.createdAt)}</span>
                        </CardDescription>
                      </div>
                      <div className={`rounded-full px-3 py-1 text-sm font-medium ${getCategoryClass(announcement.category)}`}>
                        <div className="flex items-center gap-1">
                          {getCategoryIcon(announcement.category)}
                          <span>{getCategoryName(announcement.category)}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-line text-gray-700">{announcement.content}</div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Megaphone className="mx-auto h-12 w-12 text-gray-400" />
                <h2 className="mt-4 text-lg font-medium text-gray-900">Không tìm thấy thông báo</h2>
                <p className="mt-2 text-gray-500">
                  {searchQuery || categoryFilter !== "all" 
                    ? "Không có thông báo nào phù hợp với tìm kiếm của bạn. Vui lòng thử lại với các từ khóa khác."
                    : "Hiện tại chưa có thông báo nào được đăng."}
                </p>
                {(searchQuery || categoryFilter !== "all") && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setCategoryFilter("all");
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementsPage;
