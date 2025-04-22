import React from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, generateTournamentImageUrl } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, MapPin, Users, Trophy } from "lucide-react";

interface TournamentCardProps {
  tournament: any;
  variant?: "default" | "compact";
}

const TournamentCard = ({ tournament, variant = "default" }: TournamentCardProps) => {
  const now = new Date();
  const startDate = new Date(tournament.startDate);
  const registrationDeadline = tournament.registrationDeadline ? new Date(tournament.registrationDeadline) : null;
  const isUpcoming = startDate > now;
  const isRegistrationClosed = registrationDeadline ? now > registrationDeadline : false;
  const isOngoing = now >= startDate && now <= new Date(tournament.endDate);
  const isCompleted = now > new Date(tournament.endDate);

  // Get teams data
  const { data: teams } = useQuery({
    queryKey: [`/api/tournaments/${tournament.id}/teams`],
    enabled: tournament.maxTeams !== null && tournament.maxTeams !== undefined,
  });

  const teamsCount = teams?.length || 0;
  const isFull = tournament.maxTeams ? teamsCount >= tournament.maxTeams : false;

  const getStatusBadge = () => {
    if (isCompleted) {
      return <Badge variant="outline" className="text-gray-500 border-gray-300">Đã kết thúc</Badge>;
    }
    if (isOngoing) {
      return <Badge variant="outline" className="text-blue-500 border-blue-300">Đang diễn ra</Badge>;
    }
    if (isRegistrationClosed) {
      return <Badge variant="outline" className="text-red-500 border-red-300">Hết hạn đăng ký</Badge>;
    }
    if (isFull) {
      return <Badge variant="outline" className="text-red-500 border-red-300">Đủ đội tham gia</Badge>;
    }
    return <Badge variant="outline" className="text-green-500 border-green-300">Đang mở đăng ký</Badge>;
  };

  if (variant === "compact") {
    return (
      <Card className="overflow-hidden shadow-sm transition-shadow duration-300 hover:shadow-md">
        <CardContent className="p-0">
          <div className="flex overflow-hidden">
            <div className="w-1/3">
              <img 
                className="w-full h-full object-cover" 
                src={generateTournamentImageUrl(tournament.sportType, tournament.imageUrl)} 
                alt={tournament.name} 
              />
            </div>
            <div className="w-2/3 p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{tournament.name}</h3>
                {getStatusBadge()}
              </div>
              <div className="flex items-center text-sm text-gray-500 mt-1 mb-2">
                <Trophy className="mr-1 h-4 w-4" /> 
                {tournament.sportType}
                <span className="mx-1">•</span>
                <CalendarClock className="mr-1 h-4 w-4" /> 
                {formatDate(tournament.startDate)}
              </div>
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">{tournament.description}</p>
              <div className="flex justify-between items-center">
                {tournament.maxTeams && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="mr-1 h-4 w-4" />
                    <span>{teamsCount}/{tournament.maxTeams} đội</span>
                  </div>
                )}
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
        <div className="relative h-48 w-full overflow-hidden">
          <img 
            className="w-full h-full object-cover" 
            src={generateTournamentImageUrl(tournament.sportType, tournament.imageUrl)} 
            alt={tournament.name} 
          />
          <div className="absolute top-0 right-0 bg-secondary text-white px-3 py-1 rounded-bl-lg font-medium text-sm">
            {formatDate(tournament.startDate)}
          </div>
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent px-4 py-3">
            <h3 className="text-xl font-bold text-white">{tournament.name}</h3>
          </div>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center text-sm font-medium">
              <Trophy className="mr-1 h-5 w-5 text-primary" /> 
              {tournament.sportType}
            </div>
            {getStatusBadge()}
          </div>
          <p className="text-gray-600 mb-4 line-clamp-3">{tournament.description}</p>
          <div className="flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-sm text-gray-600">
                {tournament.format === "knockout" ? "Thể thức loại trực tiếp" : 
                 tournament.format === "round-robin" ? "Thể thức vòng tròn" : 
                 tournament.format === "group" ? "Thể thức bảng đấu" : 
                 "Thể thức đấu"}
              </span>
              {tournament.maxTeams && (
                <span className="text-sm text-gray-600">
                  {teamsCount}/{tournament.maxTeams} đội tham gia
                </span>
              )}
            </div>
            
            <Link href={`/tournaments/${tournament.id}`}>
              <Button 
                variant="default"
                size="sm"
              >
                Xem chi tiết
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default TournamentCard;
