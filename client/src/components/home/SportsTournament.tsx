import React from "react";
import { Link } from "wouter";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, getMatchStatusClass } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Trophy, Clock, Check } from "lucide-react";

// Upcoming Matches component
const UpcomingMatches = () => {
  const { data: tournaments, isLoading: tournamentsLoading } = useQuery({
    queryKey: ['/api/tournaments', { limit: 1 }],
  });
  
  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: ['/api/tournaments', tournaments?.[0]?.id, 'matches'],
    enabled: !!tournaments?.[0]?.id,
  });
  
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: ['/api/tournaments', tournaments?.[0]?.id, 'teams'],
    enabled: !!tournaments?.[0]?.id,
  });
  
  const isLoading = tournamentsLoading || matchesLoading || teamsLoading;
  
  // Helper to get team name by ID
  const getTeamName = (teamId: number) => {
    if (!teams) return "TBD";
    const team = teams.find((t: any) => t.id === teamId);
    return team ? team.name : "TBD";
  };
  
  // Filter upcoming matches and sort by date
  const upcomingMatches = React.useMemo(() => {
    if (!matches) return [];
    
    return matches
      .filter((match: any) => match.status !== "completed")
      .sort((a: any, b: any) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      })
      .slice(0, 3);
  }, [matches]);
  
  const getSportIcon = (sportType: string) => {
    const sportType_lower = sportType.toLowerCase();
    if (sportType_lower.includes('bóng đá')) return 'ri-football-line';
    if (sportType_lower.includes('bóng rổ')) return 'ri-basketball-line';
    if (sportType_lower.includes('bóng bàn')) return 'ri-ping-pong-line';
    if (sportType_lower.includes('cầu lông')) return 'ri-gamepad-line';
    if (sportType_lower.includes('bơi')) return 'ri-waterfall-line';
    return 'ri-award-line';
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const tournament = tournaments?.[0];

  if (!tournament || upcomingMatches.length === 0) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 text-center">
        <Trophy className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Không có trận đấu</h3>
        <p className="mt-1 text-sm text-gray-500">Hiện chưa có trận đấu nào được lên lịch.</p>
      </div>
    );
  }

  return (
    <div className="bg-white shadow overflow-hidden sm:rounded-lg">
      <div className="px-4 py-5 sm:px-6 bg-gray-50 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Lịch thi đấu sắp tới</h3>
        <Link href={`/tournaments/${tournament.id}`} className="text-sm text-primary hover:underline">
          {tournament.name}
        </Link>
      </div>
      <div className="border-t border-gray-200">
        <dl>
          {upcomingMatches.map((match: any) => (
            <div key={match.id} className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500 flex items-center">
                <span className="inline-flex items-center justify-center h-8 w-8 rounded-full bg-primary-100 text-primary mr-2">
                  <i className={getSportIcon(tournament.sportType)}></i>
                </span>
                {tournament.sportType}
              </dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0">
                <div className="flex justify-between items-center">
                  <div className="font-medium">
                    {match.team1Id ? getTeamName(match.team1Id) : 'TBD'} vs {match.team2Id ? getTeamName(match.team2Id) : 'TBD'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {match.startTime ? formatDate(match.startTime) : 'TBD'}
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {match.round === 1 ? 'Vòng bảng' : 
                   match.round === 2 ? 'Tứ kết' : 
                   match.round === 3 ? 'Bán kết' : 
                   match.round === 4 ? 'Chung kết' : `Vòng ${match.round}`} - 
                  {match.location ? ` ${match.location}` : ''}
                </div>
              </dd>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 text-right">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getMatchStatusClass(match.status)}`}>
                  {match.status === 'scheduled' ? 'Lên lịch' : 
                   match.status === 'in_progress' ? 'Đang diễn ra' : 
                   'Hoàn thành'}
                </span>
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
};

// Team Rankings component
const TeamRankings = () => {
  const { data: tournaments, isLoading: tournamentsLoading } = useQuery({
    queryKey: ['/api/tournaments', { limit: 1 }],
  });
  
  const { data: standings, isLoading: standingsLoading } = useQuery({
    queryKey: ['/api/tournaments', tournaments?.[0]?.id, 'standings'],
    enabled: !!tournaments?.[0]?.id,
  });
  
  const isLoading = tournamentsLoading || standingsLoading;
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }
  
  const tournament = tournaments?.[0];
  
  if (!tournament || !standings || standings.length === 0) {
    return (
      <div className="bg-white shadow-md rounded-lg overflow-hidden p-6 text-center">
        <Trophy className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-lg font-medium text-gray-900">Không có bảng xếp hạng</h3>
        <p className="mt-1 text-sm text-gray-500">Hiện chưa có dữ liệu xếp hạng.</p>
      </div>
    );
  }

  // Take only top 4 teams for display
  const topTeams = standings.slice(0, 4);

  return (
    <div className="bg-white shadow-md rounded-lg overflow-hidden">
      <div className="px-4 py-5 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg leading-6 font-medium text-gray-900">Bảng xếp hạng - {tournament.sportType}</h3>
        <Link href={`/tournaments/${tournament.id}`} className="text-sm text-primary hover:underline">
          Xem chi tiết
        </Link>
      </div>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              #
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Đội
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Thắng
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Điểm
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {topTeams.map((standing: any, index: number) => (
            <tr key={standing.id}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {index + 1}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                {standing.team?.name || `Team ${standing.teamId}`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {standing.wins}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {standing.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="px-4 py-3 bg-gray-50 text-right sm:px-6">
        <Link href={`/tournaments/${tournament.id}`} className="text-sm text-primary hover:text-primary-900">
          Xem thêm bảng xếp hạng <i className="ri-arrow-right-line inline-block ml-1"></i>
        </Link>
      </div>
    </div>
  );
};

// Tournament Registration component
const TournamentRegistration = () => {
  const { data: activeTournament, isLoading } = useQuery({
    queryKey: ['/api/tournaments', { limit: 1 }],
  });

  if (isLoading) {
    return (
      <Skeleton className="h-64 w-full rounded-lg" />
    );
  }

  const tournament = activeTournament?.[0];

  return (
    <div className="mt-8 bg-gradient rounded-lg shadow-md p-6">
      <h3 className="text-xl font-bold mb-4">Đăng ký tham gia Hội thao</h3>
      <p className="mb-4">Hãy tham gia và thể hiện tài năng thể thao của bạn tại Hội thao sinh viên 2023!</p>
      <ul className="mb-4 space-y-2">
        <li className="flex items-center">
          <Check className="mr-2 h-5 w-5" />
          <span>Nhiều môn thể thao đa dạng</span>
        </li>
        <li className="flex items-center">
          <Check className="mr-2 h-5 w-5" />
          <span>Giải thưởng giá trị</span>
        </li>
        <li className="flex items-center">
          <Check className="mr-2 h-5 w-5" />
          <span>Giao lưu kết bạn</span>
        </li>
      </ul>
      <Button 
        variant="secondary"
        className="inline-block w-full text-center bg-white text-primary-700 font-medium"
        asChild
      >
        <Link href={tournament ? `/tournaments/${tournament.id}` : "/tournaments"}>
          Đăng ký ngay
        </Link>
      </Button>
    </div>
  );
};

// Main Sports Tournament section
const SportsTournament = () => {
  const { toast } = useToast();
  
  const { error } = useQuery({
    queryKey: ['/api/tournaments'],
    retry: 1,
  });
  
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Không thể tải giải đấu",
        description: "Đã xảy ra lỗi khi tải thông tin giải đấu. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <section className="py-12 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-special">Hội thao sinh viên 2023</h2>
          <p className="mt-2 text-base text-gray-600">Theo dõi lịch thi đấu và kết quả các môn thể thao</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <UpcomingMatches />
            <div className="mt-6 text-center">
              <Button variant="outline" asChild>
                <Link href="/tournaments">
                  Xem tất cả lịch thi đấu
                </Link>
              </Button>
            </div>
          </div>

          <div>
            <TeamRankings />
            <TournamentRegistration />
          </div>
        </div>
      </div>
    </section>
  );
};

export default SportsTournament;
