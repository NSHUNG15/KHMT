import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import EventCard from "@/components/events/EventCard";
import { Search, Filter, CalendarClock } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const EventsPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: events, isLoading, error } = useQuery({
    queryKey: ['/api/events'],
  });

  React.useEffect(() => {
    if (error) {
      toast({
        title: "Không thể tải sự kiện",
        description: "Đã xảy ra lỗi khi tải dữ liệu sự kiện. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Categories and filters
  const [selectedCategory, setSelectedCategory] = useState("all");

  // Calculate upcoming events and past events
  const { upcomingEvents, pastEvents } = React.useMemo(() => {
    if (!events) {
      return { upcomingEvents: [], pastEvents: [] };
    }

    const now = new Date();
    
    // Filter events based on date, search query, and category
    const filtered = events.filter((event: any) => {
      const matchesSearch = event.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           event.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      let matchesCategory = true;
      if (selectedCategory !== "all") {
        if (selectedCategory === "open_registration") {
          const registrationDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
          matchesCategory = registrationDeadline ? now <= registrationDeadline : true;
        } else {
          // Additional categories can be added here if needed
          matchesCategory = true;
        }
      }
      
      return matchesSearch && matchesCategory;
    });
    
    // Split into upcoming and past
    const upcoming = filtered.filter((event: any) => new Date(event.startDate) >= now)
      .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    const past = filtered.filter((event: any) => new Date(event.startDate) < now)
      .sort((a: any, b: any) => new Date(b.startDate).getTime() - new Date(a.startDate).getTime());
    
    return { upcomingEvents: upcoming, pastEvents: past };
  }, [events, searchQuery, selectedCategory]);

  // Event Card Skeleton
  const EventCardSkeleton = () => (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-6 space-y-4">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-16 w-full" />
        <div className="flex justify-between items-center">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-10 w-28" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold font-special">Sự kiện</h1>
          <p className="text-gray-500 mt-2">Khám phá và đăng ký tham gia các sự kiện hấp dẫn của Đoàn trường</p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Tìm kiếm sự kiện..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400" />
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-[210px]">
                <SelectValue placeholder="Tất cả sự kiện" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả sự kiện</SelectItem>
                <SelectItem value="open_registration">Đang mở đăng ký</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="upcoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="upcoming">Sắp diễn ra</TabsTrigger>
            <TabsTrigger value="past">Đã diễn ra</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upcoming" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <EventCardSkeleton />
                <EventCardSkeleton />
                <EventCardSkeleton />
                <EventCardSkeleton />
                <EventCardSkeleton />
                <EventCardSkeleton />
              </div>
            ) : upcomingEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {upcomingEvents.map((event: any) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <CalendarClock className="mx-auto h-12 w-12 text-gray-400" />
                <h2 className="mt-4 text-lg font-medium text-gray-900">Không tìm thấy sự kiện</h2>
                <p className="mt-2 text-gray-500">
                  {searchQuery || selectedCategory !== "all" 
                    ? "Không có sự kiện nào phù hợp với tìm kiếm của bạn. Vui lòng thử lại với các từ khóa khác."
                    : "Hiện tại chưa có sự kiện nào sắp diễn ra."}
                </p>
                {(searchQuery || selectedCategory !== "all") && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="past" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <EventCardSkeleton />
                <EventCardSkeleton />
                <EventCardSkeleton />
              </div>
            ) : pastEvents.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pastEvents.map((event: any) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <CalendarClock className="mx-auto h-12 w-12 text-gray-400" />
                <h2 className="mt-4 text-lg font-medium text-gray-900">Không tìm thấy sự kiện đã diễn ra</h2>
                <p className="mt-2 text-gray-500">
                  {searchQuery || selectedCategory !== "all" 
                    ? "Không có sự kiện nào phù hợp với tìm kiếm của bạn. Vui lòng thử lại với các từ khóa khác."
                    : "Hiện tại chưa có sự kiện nào đã diễn ra."}
                </p>
                {(searchQuery || selectedCategory !== "all") && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default EventsPage;
