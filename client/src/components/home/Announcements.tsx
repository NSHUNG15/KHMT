import React from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatRelativeTime, truncateText } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Megaphone, Calendar, Award } from "lucide-react";

const AnnouncementCard = ({ announcement }: { announcement: any }) => {
  // Get the appropriate icon based on category
  const getIcon = () => {
    switch (announcement.category.toLowerCase()) {
      case 'event':
        return <Calendar className="text-xl text-primary" />;
      case 'award':
        return <Award className="text-xl text-accent" />;
      default:
        return <Megaphone className="text-xl text-primary" />;
    }
  };

  // Get the appropriate color class based on category
  const getColorClass = () => {
    switch (announcement.category.toLowerCase()) {
      case 'event':
        return 'bg-primary-100';
      case 'award':
        return 'bg-accent-100';
      case 'tournament':
        return 'bg-secondary-100';
      default:
        return 'bg-primary-100';
    }
  };

  return (
    <Card className="bg-white overflow-hidden shadow rounded-lg border border-gray-200 transition-all hover:shadow-md">
      <CardContent className="p-0">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className={`flex-shrink-0 ${getColorClass()} rounded-md p-3`}>
              {getIcon()}
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">{announcement.title}</h3>
              <p className="text-sm text-gray-500 mt-1">
                {formatRelativeTime(announcement.createdAt)}
              </p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-gray-600">{truncateText(announcement.content, 120)}</p>
          </div>
          <div className="mt-4">
            <Link href={`/announcements/${announcement.id}`} className="text-primary hover:text-primary-700 font-medium flex items-center">
              Xem chi tiết
              <i className="ri-arrow-right-line ml-1"></i>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const AnnouncementSkeleton = () => (
  <Card className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
    <CardContent className="p-0">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <Skeleton className="h-12 w-12 rounded-md" />
          <div className="ml-4 space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="mt-4 space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-3/4" />
        </div>
        <div className="mt-4">
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
    </CardContent>
  </Card>
);

const Announcements = () => {
  const { toast } = useToast();
  
  const { data: announcements, isLoading, error } = useQuery({
    queryKey: ['/api/announcements', { limit: 3 }],
    retry: 1,
  });
  
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Không thể tải thông báo",
        description: "Đã xảy ra lỗi khi tải thông báo. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-special">Thông báo mới nhất</h2>
          <p className="mt-2 text-base text-gray-600">Cập nhật các thông tin quan trọng từ Đoàn trường</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <>
              <AnnouncementSkeleton />
              <AnnouncementSkeleton />
              <AnnouncementSkeleton />
            </>
          ) : announcements && announcements.length > 0 ? (
            announcements.map((announcement: any) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <Megaphone className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Không có thông báo</h3>
              <p className="mt-1 text-sm text-gray-500">Hiện chưa có thông báo nào được đăng tải.</p>
            </div>
          )}
        </div>
        
        <div className="text-center mt-8">
          <Button variant="outline" asChild>
            <Link href="/announcements">
              Xem tất cả thông báo
              <i className="ri-arrow-right-line ml-2"></i>
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Announcements;
