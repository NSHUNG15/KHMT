import React, { useState } from "react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import BracketDisplay from "@/components/tournaments/BracketDisplay";
import { formatDate, formatDateTime, generateTournamentImageUrl } from "@/lib/utils";
import { 
  Calendar, 
  MapPin, 
  Trophy, 
  Users, 
  AlertCircle, 
  CalendarRange, 
  ArrowLeft, 
  Clock, 
  Flag
} from "lucide-react";

interface TournamentDetailPageProps {
  id: string;
}

const TournamentDetailPage = ({ id }: TournamentDetailPageProps) => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRegistering, setIsRegistering] = useState(false);

  // Fetch tournament details
  const { 
    data: tournament, 
    isLoading: tournamentLoading, 
    error: tournamentError 
  } = useQuery({
    queryKey: [`/api/tournaments/${id}`],
  });

  // Fetch teams
  const { 
    data: teams,
    isLoading: teamsLoading
  } = useQuery({
    queryKey: [`/api/tournaments/${id}/teams`],
    enabled: !!tournament,
  });

  // Fetch standings
  const { 
    data: standings,
    isLoading: standingsLoading
  } = useQuery({
    queryKey: [`/api/tournaments/${id}/standings`],
    enabled: !!tournament,
  });

  // Fetch user's team if the user is authenticated
  const { 
    data: userTeam,
    isLoading: userTeamLoading
  } = useQuery({
    queryKey: [`/api/tournaments/${id}/my-team`],
    enabled: !!user && !!tournament,
  });

  // Error handling
  React.useEffect(() => {
    if (tournamentError) {
      toast({
        title: "Không thể tải giải đấu",
        description: "Giải đấu không tồn tại hoặc đã bị xóa.",
        variant: "destructive",
      });
      setLocation("/tournaments");
    }
  }, [tournamentError, toast, setLocation]);

  // Team registration form schema
  const teamFormSchema = z.object({
    name: z.string().min(3, {
      message: "Tên đội phải có ít nhất 3 ký tự",
    }),
  });

  // Team registration form
  const form = useForm<z.infer<typeof teamFormSchema>>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      name: "",
    },
  });

  // Team registration mutation
  const registerTeamMutation = useMutation({
    mutationFn: async (data: z.infer<typeof teamFormSchema>) => {
      return await apiRequest('POST', `/api/tournaments/${id}/teams`, data);
    },
    onSuccess: () => {
      toast({
        title: "Đăng ký thành công",
        description: "Đội của bạn đã được đăng ký tham gia giải đấu.",
      });
      setIsRegistering(false);
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${id}/teams`] });
      queryClient.invalidateQueries({ queryKey: [`/api/tournaments/${id}/my-team`] });
    },
    onError: (error) => {
      toast({
        title: "Đăng ký thất bại",
        description: error.message || "Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof teamFormSchema>) => {
    registerTeamMutation.mutate(data);
  };

  // Calculate tournament status
  const tournamentStatus = React.useMemo(() => {
    if (!tournament) return {};
    
    const now = new Date();
    const startDate = new Date(tournament.startDate);
    const endDate = new Date(tournament.endDate);
    const registrationDeadline = tournament.registrationDeadline ? new Date(tournament.registrationDeadline) : null;
    
    const isOver = now > endDate;
    const isOngoing = now >= startDate && now <= endDate;
    const isRegistrationClosed = registrationDeadline ? now > registrationDeadline : false;
    const isFull = tournament.maxTeams ? (teams?.length || 0) >= tournament.maxTeams : false;
    
    let statusText = "";
    let statusClass = "";
    
    if (isOver) {
      statusText = "Đã kết thúc";
      statusClass = "text-gray-500 border-gray-300";
    } else if (isOngoing) {
      statusText = "Đang diễn ra";
      statusClass = "text-green-500 border-green-300";
    } else if (isRegistrationClosed || isFull) {
      statusText = isRegistrationClosed ? "Đã hết hạn đăng ký" : "Đã đủ đội tham gia";
      statusClass = "text-red-500 border-red-300";
    } else {
      statusText = "Mở đăng ký";
      statusClass = "text-blue-500 border-blue-300";
    }
    
    return {
      isOver,
      isOngoing,
      isRegistrationClosed,
      isFull,
      startDate,
      endDate,
      registrationDeadline,
      statusText,
      statusClass
    };
  }, [tournament, teams]);

  if (tournamentLoading) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <Skeleton className="h-8 w-96 mb-4" />
        <Skeleton className="h-6 w-64 mb-8" />
        <Skeleton className="h-64 w-full mb-6 rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
          <Skeleton className="h-24 rounded-lg" />
        </div>
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-64 w-full mb-6" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">Không tìm thấy giải đấu</h2>
          <p className="mt-2 text-gray-500">Giải đấu này không tồn tại hoặc đã bị xóa.</p>
          <Button variant="outline" className="mt-4" onClick={() => setLocation("/tournaments")}>
            Quay lại danh sách giải đấu
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <Button 
        variant="ghost" 
        className="mb-6 pl-0 flex items-center"
        onClick={() => setLocation("/tournaments")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại danh sách giải đấu
      </Button>
      
      <div className="space-y-8">
        {/* Tournament Header */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-3xl font-bold">{tournament.name}</h1>
                <Badge variant="outline" className={tournamentStatus.statusClass}>
                  {tournamentStatus.statusText}
                </Badge>
              </div>
              <div className="flex items-center gap-2 mt-2 text-gray-500">
                <Trophy className="h-4 w-4" />
                <span>{tournament.sportType}</span>
                <span className="mx-1">•</span>
                <span>{tournament.format === "knockout" ? "Thể thức loại trực tiếp" : 
                       tournament.format === "round-robin" ? "Thể thức vòng tròn" : 
                       tournament.format === "group" ? "Thể thức bảng đấu" : 
                       "Thể thức đấu"}</span>
              </div>
            </div>
            
            {!tournamentStatus.isOver && !userTeamLoading && (
              <div>
                {user ? (
                  userTeam ? (
                    <Button variant="outline" className="pointer-events-none">
                      <Users className="mr-2 h-4 w-4" />
                      Đã đăng ký đội
                    </Button>
                  ) : (
                    tournamentStatus.isRegistrationClosed || tournamentStatus.isFull ? (
                      <Button variant="outline" disabled>
                        {tournamentStatus.isRegistrationClosed ? "Đã hết hạn đăng ký" : "Đã đủ đội tham gia"}
                      </Button>
                    ) : (
                      <Dialog open={isRegistering} onOpenChange={setIsRegistering}>
                        <DialogTrigger asChild>
                          <Button>
                            Đăng ký đội tham gia
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                          <DialogHeader>
                            <DialogTitle>Đăng ký đội tham gia giải đấu</DialogTitle>
                            <DialogDescription>
                              Tạo đội của bạn để tham gia giải đấu. Bạn sẽ là đội trưởng.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)}>
                              <FormField
                                control={form.control}
                                name="name"
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Tên đội</FormLabel>
                                    <FormControl>
                                      <Input placeholder="Nhập tên đội của bạn" {...field} />
                                    </FormControl>
                                    <FormDescription>
                                      Chọn một tên đội phù hợp và dễ nhớ
                                    </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              
                              <DialogFooter className="mt-4">
                                <Button type="button" variant="outline" onClick={() => setIsRegistering(false)}>
                                  Hủy
                                </Button>
                                <Button type="submit" disabled={registerTeamMutation.isPending}>
                                  {registerTeamMutation.isPending ? "Đang đăng ký..." : "Tạo đội"}
                                </Button>
                              </DialogFooter>
                            </form>
                          </Form>
                        </DialogContent>
                      </Dialog>
                    )
                  )
                ) : (
                  <Button onClick={() => setLocation("/login")}>
                    Đăng nhập để đăng ký
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <div className="rounded-lg overflow-hidden h-64 md:h-80">
            <img 
              src={generateTournamentImageUrl(tournament.sportType, tournament.imageUrl)} 
              alt={tournament.name} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Tournament Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <CalendarRange className="h-5 w-5 text-primary mr-3" />
                <div>
                  <h3 className="font-medium">Thời gian diễn ra</h3>
                  <p className="text-sm text-gray-500">{formatDate(tournament.startDate)}</p>
                  <p className="text-sm text-gray-500">đến {formatDate(tournament.endDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Clock className="h-5 w-5 text-primary mr-3" />
                <div>
                  <h3 className="font-medium">Hạn đăng ký</h3>
                  <p className="text-sm text-gray-500">
                    {tournament.registrationDeadline 
                      ? formatDate(tournament.registrationDeadline) 
                      : "Không có thời hạn cụ thể"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-primary mr-3" />
                <div>
                  <h3 className="font-medium">Đội tham gia</h3>
                  <p className="text-sm text-gray-500">
                    {teamsLoading 
                      ? "Đang tải..." 
                      : tournament.maxTeams 
                        ? `${teams?.length || 0}/${tournament.maxTeams} đội` 
                        : `${teams?.length || 0} đội`}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Tournament Description */}
        <Card>
          <CardHeader>
            <CardTitle>Thông tin giải đấu</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="prose prose-blue max-w-none">
              <div className="whitespace-pre-line">{tournament.description}</div>
            </div>
          </CardContent>
        </Card>
        
        {/* Tournament Content */}
        <Tabs defaultValue="bracket" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bracket">Lịch thi đấu</TabsTrigger>
            <TabsTrigger value="standings">Bảng xếp hạng</TabsTrigger>
            <TabsTrigger value="teams">Các đội tham gia</TabsTrigger>
          </TabsList>
          
          <TabsContent value="bracket" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Lịch thi đấu và kết quả</CardTitle>
                <CardDescription>
                  {tournament.format === "knockout" 
                    ? "Các trận đấu theo thể thức loại trực tiếp" 
                    : tournament.format === "round-robin" 
                    ? "Các trận đấu theo thể thức vòng tròn"
                    : tournament.format === "group"
                    ? "Các trận đấu theo thể thức bảng đấu"
                    : "Các trận đấu của giải"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <BracketDisplay tournamentId={id} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="standings" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Bảng xếp hạng</CardTitle>
                <CardDescription>
                  Thứ hạng các đội tham gia giải đấu
                </CardDescription>
              </CardHeader>
              <CardContent>
                {standingsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-8 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : standings && standings.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="px-4 py-2 text-left text-gray-500 font-medium text-sm tracking-wider">Hạng</th>
                          <th className="px-4 py-2 text-left text-gray-500 font-medium text-sm tracking-wider">Đội</th>
                          <th className="px-4 py-2 text-center text-gray-500 font-medium text-sm tracking-wider">Thắng</th>
                          <th className="px-4 py-2 text-center text-gray-500 font-medium text-sm tracking-wider">Hòa</th>
                          <th className="px-4 py-2 text-center text-gray-500 font-medium text-sm tracking-wider">Thua</th>
                          <th className="px-4 py-2 text-center text-gray-500 font-medium text-sm tracking-wider">Hiệu số</th>
                          <th className="px-4 py-2 text-center text-gray-500 font-medium text-sm tracking-wider">Điểm</th>
                        </tr>
                      </thead>
                      <tbody>
                        {standings.map((standing: any, index: number) => (
                          <tr key={standing.id} className="border-b hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-800">{standing.rank || index + 1}</td>
                            <td className="px-4 py-3 font-medium">{standing.team?.name || `Đội ${standing.teamId}`}</td>
                            <td className="px-4 py-3 text-center">{standing.wins}</td>
                            <td className="px-4 py-3 text-center">{standing.draws}</td>
                            <td className="px-4 py-3 text-center">{standing.losses}</td>
                            <td className="px-4 py-3 text-center">
                              {((standing.goalsFor || 0) - (standing.goalsAgainst || 0)) >= 0 ? "+" : ""}
                              {(standing.goalsFor || 0) - (standing.goalsAgainst || 0)}
                            </td>
                            <td className="px-4 py-3 text-center font-medium">{standing.points}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Flag className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-gray-500">Chưa có dữ liệu bảng xếp hạng.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="teams" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Các đội tham gia</CardTitle>
                <CardDescription>
                  Danh sách các đội đã đăng ký tham gia giải đấu
                </CardDescription>
              </CardHeader>
              <CardContent>
                {teamsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : teams && teams.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {teams.map((team: any) => (
                      <Card key={team.id} className="overflow-hidden">
                        <CardContent className="p-4">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 bg-primary-100 text-primary-800 rounded-full h-10 w-10 flex items-center justify-center font-bold">
                              {team.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="ml-4">
                              <h3 className="font-medium">{team.name}</h3>
                              <p className="text-sm text-gray-500">
                                {team.createdAt ? `Đăng ký: ${formatDate(team.createdAt)}` : ""}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Users className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-gray-500">Chưa có đội nào đăng ký tham gia.</p>
                    {!tournamentStatus.isRegistrationClosed && !tournamentStatus.isOver && (
                      <Button 
                        className="mt-4" 
                        onClick={() => {
                          if (user) {
                            setIsRegistering(true);
                          } else {
                            setLocation("/login");
                          }
                        }}
                      >
                        Đăng ký đội tham gia
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Tournament Registration Info */}
        {!tournamentStatus.isOver && (
          <Card>
            <CardHeader>
              <CardTitle>Thông tin đăng ký</CardTitle>
              <CardDescription>
                Hướng dẫn và quy định khi đăng ký tham gia giải đấu
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                {tournamentStatus.isRegistrationClosed || tournamentStatus.isFull
                  ? "Đăng ký đã đóng. Không thể đăng ký thêm đội tham gia."
                  : "Để tham gia giải đấu, bạn cần đăng ký đội của mình trước thời hạn."}
              </p>
              
              {tournament.registrationInstructions && (
                <div className="whitespace-pre-line">{tournament.registrationInstructions}</div>
              )}
              
              <div className="mt-4 space-y-2">
                <div className="flex items-center">
                  <Trophy className="h-5 w-5 text-primary mr-3" />
                  <p className="text-sm font-medium">
                    Thể thức thi đấu: {tournament.format === "knockout" 
                      ? "Loại trực tiếp" 
                      : tournament.format === "round-robin" 
                      ? "Vòng tròn"
                      : tournament.format === "group"
                      ? "Bảng đấu"
                      : "Hỗn hợp"}
                  </p>
                </div>
                
                {tournament.maxTeams && (
                  <div className="flex items-center">
                    <Users className="h-5 w-5 text-primary mr-3" />
                    <p className="text-sm font-medium">
                      Số đội tối đa: {tournament.maxTeams} đội
                    </p>
                  </div>
                )}
                
                {tournament.registrationDeadline && (
                  <div className="flex items-center">
                    <Clock className="h-5 w-5 text-primary mr-3" />
                    <p className="text-sm font-medium">
                      Hạn chót đăng ký: {formatDateTime(tournament.registrationDeadline)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
            {!tournamentStatus.isRegistrationClosed && !tournamentStatus.isFull && !tournamentStatus.isOver && !userTeam && (
              <CardFooter>
                <Button 
                  className="w-full"
                  onClick={() => {
                    if (user) {
                      setIsRegistering(true);
                    } else {
                      setLocation("/login");
                    }
                  }}
                >
                  Đăng ký đội tham gia
                </Button>
              </CardFooter>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};

export default TournamentDetailPage;
