import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatTimeOnly, getBracketLines } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";

interface BracketDisplayProps {
  tournamentId: number | string;
}

const BracketDisplay = ({ tournamentId }: BracketDisplayProps) => {
  const { data: matches, isLoading: matchesLoading } = useQuery({
    queryKey: [`/api/tournaments/${tournamentId}/matches`],
  });
  
  const { data: teams, isLoading: teamsLoading } = useQuery({
    queryKey: [`/api/tournaments/${tournamentId}/teams`],
  });
  
  const isLoading = matchesLoading || teamsLoading;

  const getTeamName = (teamId: number | undefined) => {
    if (!teamId || !teams) return "TBD";
    const team = teams.find((team: any) => team.id === teamId);
    return team ? team.name : "TBD";
  };

  // Calculate the number of rounds in the tournament
  const totalRounds = React.useMemo(() => {
    if (!matches || matches.length === 0) return 0;
    return Math.max(...matches.map((match: any) => match.round));
  }, [matches]);

  // Group matches by round
  const matchesByRound = React.useMemo(() => {
    if (!matches) return [];
    
    const grouped: any[] = [];
    
    for (let round = 1; round <= totalRounds; round++) {
      grouped[round - 1] = matches
        .filter((match: any) => match.round === round)
        .sort((a: any, b: any) => a.matchNumber - b.matchNumber);
    }
    
    return grouped;
  }, [matches, totalRounds]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <div className="text-center py-10">
        <p className="text-gray-500">Chưa có trận đấu nào được tạo cho giải đấu này.</p>
      </div>
    );
  }

  const isKnockout = matchesByRound.length > 1;
  
  if (!isKnockout) {
    // For round-robin or groups, show a simple list
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Lịch thi đấu</h3>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {matches.map((match: any) => (
            <Card key={match.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-500">Trận #{match.matchNumber}</span>
                  <Badge variant="outline">
                    {match.status === 'completed' ? 'Hoàn thành' : 
                     match.status === 'in_progress' ? 'Đang diễn ra' : 
                     'Lên lịch'}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <div className="flex flex-col items-center text-center w-5/12">
                    <span className="font-medium">{getTeamName(match.team1Id)}</span>
                    {match.status === 'completed' && (
                      <span className="text-xl font-bold">{match.team1Score}</span>
                    )}
                  </div>
                  <div className="w-2/12 text-center text-sm text-gray-500">VS</div>
                  <div className="flex flex-col items-center text-center w-5/12">
                    <span className="font-medium">{getTeamName(match.team2Id)}</span>
                    {match.status === 'completed' && (
                      <span className="text-xl font-bold">{match.team2Score}</span>
                    )}
                  </div>
                </div>
                <div className="mt-3 text-xs text-gray-500 text-center">
                  {match.startTime ? formatDate(match.startTime) + ' ' + formatTimeOnly(match.startTime) : 'Thời gian chưa xác định'}
                  {match.location && ` • ${match.location}`}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // For knockout format, render a bracket
  return (
    <div className="overflow-x-auto pb-8">
      <div className="flex space-x-8" style={{ minWidth: `${totalRounds * 300}px` }}>
        {matchesByRound.map((roundMatches, roundIndex) => (
          <div key={roundIndex} className="flex flex-col space-y-4 flex-shrink-0" style={{ width: '280px' }}>
            <h3 className="text-lg font-medium text-center">
              {roundIndex === 0 ? 'Vòng 1' : 
               roundIndex === totalRounds - 1 ? 'Chung kết' : 
               roundIndex === totalRounds - 2 ? 'Bán kết' : 
               roundIndex === totalRounds - 3 ? 'Tứ kết' : 
               `Vòng ${roundIndex + 1}`}
            </h3>
            <div className="flex flex-col space-y-4" style={{ 
              marginTop: `${roundIndex > 0 ? Math.pow(2, roundIndex) * 30 - 30 : 0}px`,
              height: `${Math.pow(2, totalRounds - roundIndex - 1) * 120 - 20}px` 
            }}>
              {roundMatches.map((match: any, matchIndex: number) => (
                <div 
                  key={match.id} 
                  className={`relative flex-1 flex items-center ${getBracketLines(roundIndex + 1, matchIndex + 1, totalRounds)}`}
                  style={{ 
                    height: `${120}px`, 
                    marginBottom: `${(Math.pow(2, totalRounds - roundIndex - 1) - 1) * 120}px` 
                  }}
                >
                  <Card className="w-full overflow-hidden shadow-sm">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs text-gray-500">#{match.matchNumber}</span>
                        <Badge variant="outline" className="text-xs">
                          {match.status === 'completed' ? 'Hoàn thành' : 
                           match.status === 'in_progress' ? 'Đang diễn ra' : 
                           'Lên lịch'}
                        </Badge>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <div className={`flex justify-between items-center ${match.winnerId === match.team1Id ? 'font-bold' : ''}`}>
                          <span className="truncate">{getTeamName(match.team1Id)}</span>
                          {(match.status === 'completed' || match.status === 'in_progress') && (
                            <span>{match.team1Score}</span>
                          )}
                        </div>
                        <div className={`flex justify-between items-center ${match.winnerId === match.team2Id ? 'font-bold' : ''}`}>
                          <span className="truncate">{getTeamName(match.team2Id)}</span>
                          {(match.status === 'completed' || match.status === 'in_progress') && (
                            <span>{match.team2Score}</span>
                          )}
                        </div>
                      </div>
                      {match.startTime && (
                        <div className="mt-1 text-xs text-gray-500">
                          {formatDate(match.startTime)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BracketDisplay;
