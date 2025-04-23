import React from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate, formatTimeOnly, generateEventImageUrl, calculateRemainingSpots } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { CalendarClock, MapPin, Users } from "lucide-react";

interface EventCardProps {
  event: any;
  variant?: "default" | "compact";
}

const EventCard = ({ event, variant = "default" }: EventCardProps) => {
  const now = new Date();
  
  // Xử lý an toàn các giá trị ngày tháng
  let startDate: Date | null = null;
  let endDate: Date | null = null;
  let registrationDeadline: Date | null = null;
  
  try {
    if (event.startDate) {
      startDate = new Date(event.startDate);
    }
  } catch (error) {
    console.error("Invalid startDate format:", error, event.startDate);
  }
  
  try {
    if (event.endDate) {
      endDate = new Date(event.endDate);
    }
  } catch (error) {
    console.error("Invalid endDate format:", error, event.endDate);
  }
  
  try {
    if (event.registrationDeadline) {
      registrationDeadline = new Date(event.registrationDeadline);
    }
  } catch (error) {
    console.error("Invalid registrationDeadline format:", error, event.registrationDeadline);
  }
  
  const isUpcoming = startDate ? startDate > now : false;
  const isRegistrationClosed = registrationDeadline ? now > registrationDeadline : false;
  const isEventOver = endDate ? now > endDate : false;

  // Get registration status
  const { data: registrations } = useQuery({
    queryKey: [`/api/events/${event.id}/registrations`],
    enabled: event.capacity !== null && event.capacity !== undefined,
  });

  const registeredCount = Array.isArray(registrations) ? registrations.length : 0;
  const isFull = event.capacity ? registeredCount >= event.capacity : false;

  const getStatusBadge = () => {
    if (isEventOver) {
      return <Badge variant="outline" className="text-gray-500 border-gray-300">Đã kết thúc</Badge>;
    }
    if (isRegistrationClosed) {
      return <Badge variant="outline" className="text-red-500 border-red-300">Hết hạn đăng ký</Badge>;
    }
    if (isFull) {
      return <Badge variant="outline" className="text-red-500 border-red-300">Đã hết chỗ</Badge>;
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
                src={generateEventImageUrl(event.imageUrl)} 
                alt={event.title} 
              />
            </div>
            <div className="w-2/3 p-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold text-gray-900 line-clamp-1">{event.title}</h3>
                {getStatusBadge()}
              </div>
              <div className="flex items-center text-sm text-gray-500 mt-1 mb-2">
                <CalendarClock className="mr-1 h-4 w-4" /> 
                {formatDate(event.startDate)}
                <span className="mx-1">•</span>
                <MapPin className="mr-1 h-4 w-4" /> {event.location}
              </div>
              <p className="text-gray-600 text-sm line-clamp-2 mb-3">{event.description}</p>
              <div className="flex justify-between items-center">
                {event.capacity && (
                  <div className="flex items-center text-sm text-gray-500">
                    <Users className="mr-1 h-4 w-4" />
                    <span>{registeredCount}/{event.capacity}</span>
                  </div>
                )}
                <Link href={`/events/${event.id}`}>
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
            src={generateEventImageUrl(event.imageUrl)} 
            alt={event.title} 
          />
          <div className="absolute top-0 right-0 bg-secondary text-white px-3 py-1 rounded-bl-lg font-medium text-sm">
            {formatDate(event.startDate)}
          </div>
        </div>
        <div className="p-6">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-gray-900 mr-2">{event.title}</h3>
            {getStatusBadge()}
          </div>
          <div className="flex items-center text-sm text-gray-500 mb-2">
            <CalendarClock className="mr-1 h-4 w-4" /> 
            {formatTimeOnly(event.startDate)} - {formatTimeOnly(event.endDate)}
            <span className="mx-2">•</span>
            <MapPin className="mr-1 h-4 w-4" /> {event.location}
          </div>
          <p className="text-gray-600 mb-4 line-clamp-3">{event.description}</p>
          <div className="flex justify-between items-center">
            {event.capacity ? (
              <span className="text-sm flex items-center">
                <Users className="mr-1 h-4 w-4 text-gray-500" />
                <span>
                  {registeredCount}/{event.capacity} đăng ký
                </span>
              </span>
            ) : (
              <span></span>
            )}
            
            <Link href={`/events/${event.id}`}>
              <Button 
                variant={isRegistrationClosed || isFull || isEventOver ? "outline" : "default"}
                size="sm"
              >
                {isRegistrationClosed || isFull || isEventOver ? 'Xem chi tiết' : 'Đăng ký ngay'}
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default EventCard;
