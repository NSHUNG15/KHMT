import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import TournamentCard from "@/components/tournaments/TournamentCard";
import { Search, Filter, Trophy } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const TournamentsPage = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: tournaments, isLoading, error } = useQuery({
    queryKey: ['/api/tournaments'],
  });

  React.useEffect(() => {
    if (error) {
      toast({
        title: "Không thể tải giải đấu",
        description: "Đã xảy ra lỗi khi tải dữ liệu giải đấu. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  // Sport types and filters
  const [selectedSport, setSelectedSport] = useState("all");

  // Get unique sport types from tournaments
  const sportTypes = React.useMemo(() => {
    if (!tournaments) return [];
    
    const types = new Set(tournaments.map((tournament: any) => tournament.sportType));
    return Array.from(types);
  }, [tournaments]);

  // Calculate upcoming, ongoing and past tournaments
  const { upcomingTournaments, ongoingTournaments, pastTournaments } = React.useMemo(() => {
    if (!tournaments) {
      return { upcomingTournaments: [], ongoingTournaments: [], pastTournaments: [] };
    }

    const now = new Date();
    
    // Filter tournaments based on search query and sport type
    const filtered = tournaments.filter((tournament: any) => {
      const matchesSearch = tournament.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           tournament.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesSport = selectedSport === "all" || tournament.sportType === selectedSport;
      
      return matchesSearch && matchesSport;
    });
    
    // Split into upcoming, ongoing and past
    const upcoming = filtered.filter((tournament: any) => new Date(tournament.startDate) > now)
      .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime());
    
    const ongoing = filtered.filter((tournament: any) => 
      new Date(tournament.startDate) <= now && new Date(tournament.endDate) >= now
    );
    
    const past = filtered.filter((tournament: any) => new Date(tournament.endDate) < now)
      .sort((a: any, b: any) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
    
    return { upcomingTournaments: upcoming, ongoingTournaments: ongoing, pastTournaments: past };
  }, [tournaments, searchQuery, selectedSport]);

  // Tournament Card Skeleton
  const TournamentCardSkeleton = () => (
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
          <h1 className="text-3xl font-bold font-special">Hội thao sinh viên</h1>
          <p className="text-gray-500 mt-2">Xem lịch thi đấu và tham gia các giải đấu thể thao của Đoàn trường</p>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              placeholder="Tìm kiếm giải đấu..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="text-gray-400" />
            <Select
              value={selectedSport}
              onValueChange={setSelectedSport}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Môn thể thao" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả môn thể thao</SelectItem>
                {sportTypes.map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    {sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <Tabs defaultValue="ongoing" className="space-y-6">
          <TabsList>
            <TabsTrigger value="ongoing">Đang diễn ra</TabsTrigger>
            <TabsTrigger value="upcoming">Sắp diễn ra</TabsTrigger>
            <TabsTrigger value="past">Đã kết thúc</TabsTrigger>
          </TabsList>
          
          <TabsContent value="ongoing" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <TournamentCardSkeleton />
                <TournamentCardSkeleton />
                <TournamentCardSkeleton />
              </div>
            ) : ongoingTournaments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {ongoingTournaments.map((tournament: any) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                <h2 className="mt-4 text-lg font-medium text-gray-900">Không có giải đấu đang diễn ra</h2>
                <p className="mt-2 text-gray-500">
                  {searchQuery || selectedSport !== "all" 
                    ? "Không có giải đấu nào phù hợp với tìm kiếm của bạn. Vui lòng thử lại với các từ khóa khác."
                    : "Hiện tại không có giải đấu nào đang diễn ra."}
                </p>
                {(searchQuery || selectedSport !== "all") && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedSport("all");
                    }}
                  >
                    Xóa bộ lọc
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="upcoming" className="space-y-6">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <TournamentCardSkeleton />
                <TournamentCardSkeleton />
                <TournamentCardSkeleton />
              </div>
            ) : upcomingTournaments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {upcomingTournaments.map((tournament: any) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                <h2 className="mt-4 text-lg font-medium text-gray-900">Không có giải đấu sắp diễn ra</h2>
                <p className="mt-2 text-gray-500">
                  {searchQuery || selectedSport !== "all" 
                    ? "Không có giải đấu nào phù hợp với tìm kiếm của bạn. Vui lòng thử lại với các từ khóa khác."
                    : "Hiện tại chưa có giải đấu nào sắp diễn ra."}
                </p>
                {(searchQuery || selectedSport !== "all") && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedSport("all");
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
                <TournamentCardSkeleton />
                <TournamentCardSkeleton />
                <TournamentCardSkeleton />
              </div>
            ) : pastTournaments.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {pastTournaments.map((tournament: any) => (
                  <TournamentCard key={tournament.id} tournament={tournament} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <Trophy className="mx-auto h-12 w-12 text-gray-400" />
                <h2 className="mt-4 text-lg font-medium text-gray-900">Không có giải đấu đã kết thúc</h2>
                <p className="mt-2 text-gray-500">
                  {searchQuery || selectedSport !== "all" 
                    ? "Không có giải đấu nào phù hợp với tìm kiếm của bạn. Vui lòng thử lại với các từ khóa khác."
                    : "Hiện tại chưa có giải đấu nào đã kết thúc."}
                </p>
                {(searchQuery || selectedSport !== "all") && (
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedSport("all");
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

export default TournamentsPage;
