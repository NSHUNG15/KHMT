import React from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatTimeOnly } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, MapPin, Users, Trophy, Medal, Layout } from "lucide-react";

interface TournamentCardProps {
  tournament: any;
  variant?: "default" | "compact";
}

const TournamentCard = ({ tournament, variant = "default" }: TournamentCardProps) => {
  const now = new Date();
  const startDate = new Date(tournament.startDate);
  const endDate = new Date(tournament.endDate);
  const registrationDeadline = tournament.registrationDeadline ? new Date(tournament.registrationDeadline) : null;
  
  const isUpcoming = startDate > now;
  const isOngoing = startDate <= now && endDate >= now;
  const isPast = endDate < now;
  const isRegistrationClosed = registrationDeadline ? now > registrationDeadline : false;

  // Get teams
  const { data: teams } = useQuery({
    queryKey: [`/api/tournaments/${tournament.id}/teams`],
  });

  const teamsCount = teams?.length || 0;
  const maxTeams = tournament.maxTeams || "Không giới hạn";

  const getStatusBadge = () => {
    if (isPast) {
      return <Badge variant="outline" className="text-gray-500 border-gray-300">Đã kết thúc</Badge>;
    }
    if (isOngoing) {
      return <Badge variant="outline" className="text-green-500 border-green-300">Đang diễn ra</Badge>;
    }
    if (isRegistrationClosed) {
      return <Badge variant="outline" className="text-red-500 border-red-300">Hết hạn đăng ký</Badge>;
    }
    return <Badge variant="outline" className="text-blue-500 border-blue-300">Đang mở đăng ký</Badge>;
  };

  // Generate a sport icon based on sportType
  const getSportIcon = () => {
    switch (tournament.sportType?.toLowerCase()) {
      case 'soccer':
      case 'football':
      case 'bóng đá':
        return "⚽";
      case 'basketball':
      case 'bóng rổ':
        return "🏀";
      case 'volleyball':
      case 'bóng chuyền':
        return "🏐";
      case 'badminton':
      case 'cầu lông':
        return "🏸";
      case 'tennis':
      case 'quần vợt':
        return "🎾";
      case 'table tennis':
      case 'bóng bàn':
        return "🏓";
      case 'chess':
      case 'cờ vua':
        return "♟️";
      case 'swimming':
      case 'bơi lội':
        return "🏊";
      case 'running':
      case 'chạy bộ':
        return "🏃";
      case 'esports':
      case 'thể thao điện tử':
        return "🎮";
      default:
        return "🏆";
    }
  };

  // Generate a tournament image URL
  const getTournamentImageUrl = () => {
    if (tournament.imageUrl) {
      return tournament.imageUrl;
    }
    
    // Default image based on sport type
    const sportType = tournament.sportType?.toLowerCase() || 'default';
    return `/images/tournaments/${sportType}.jpg`;
  };

  if (variant === "compact") {
    return (
      <Card className="overflow-hidden shadow-sm transition-shadow duration-300 hover:shadow-md">
        <CardContent className="p-0">
          <div className="flex overflow-hidden">
            <div className="w-1/3 bg-primary/10 flex items-center justify-center text-4xl">
              {getSportIcon()}
            </div>
            <div className="w-2/3 p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{tournament.name}</h3>
                {getStatusBadge()}
              </div>
              <div className="flex items-center text-sm text-gray-500 mt-1 mb-2">
                <CalendarClock className="mr-1 h-4 w-4" /> 
                {formatDate(tournament.startDate)}
              </div>
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">{tournament.description}</p>
              <div className="flex justify-between items-center">
                <div className="flex items-center text-sm text-gray-500">
                  <Users className="mr-1 h-4 w-4" />
                  <span>{teamsCount}/{maxTeams}</span>
                </div>
                <Link href={`/tournaments/${tournament.id}`}>
                  <Button variant="link" size="sm" className="p-0">
                    Xem chi tiết
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white overflow-hidden shadow-md hover:shadow-lg transition-shadow duration-300">
      <CardContent className="p-0">
        <div className="relative h-48 w-full overflow-hidden bg-primary/10 flex items-center justify-center">
          <span className="text-6xl">{getSportIcon()}</span>
          <div className="absolute top-0 right-0 bg-secondary text-white px-3 py-1 rounded-bl-lg font-medium text-sm">
            {formatDate(tournament.startDate)}
          </div>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-gray-900 mr-2">{tournament.name}</h3>
            {getStatusBadge()}
          </div>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <Trophy className="mr-1 h-4 w-4" /> 
            <span>Môn: {tournament.sportType}</span>
          </div>
          {tournament.location && (
            <div className="flex items-center text-sm text-gray-500 mb-2">
              <MapPin className="mr-1 h-4 w-4" /> 
              <span>{tournament.location}</span>
            </div>
          )}
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <CalendarClock className="mr-1 h-4 w-4" /> 
            <span>{formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}</span>
          </div>
          <p className="text-gray-600 mb-4 line-clamp-3">{tournament.description}</p>
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-1">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-500">
                {teamsCount}/{maxTeams} đội
              </span>
            </div>
            
            <Link href={`/tournaments/${tournament.id}`}>
              <Button 
                variant={isRegistrationClosed || isPast ? "outline" : "default"}
                size="sm"
              >
                {isPast ? 'Xem kết quả' : (isOngoing ? 'Xem lịch đấu' : 'Đăng ký tham gia')}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentCard;