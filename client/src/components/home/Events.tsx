import React from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatTimeOnly, generateEventImageUrl, calculateRemainingSpots } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { CalendarClock, MapPin } from "lucide-react";

const EventCard = ({ event }: { event: any }) => {
  const now = new Date();
  const registrationDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
  const isRegistrationClosed = registrationDeadline ? now > registrationDeadline : false;

  // Get registration status
  const { data: registrations } = useQuery({
    queryKey: [`/api/events/${event.id}/registrations`],
    enabled: event.capacity !== null && event.capacity !== undefined,
  });

  const registeredCount = Array.isArray(registrations) ? registrations.length : 0;
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
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
        <div className="flex items-center text-sm text-gray-500 mb-2">
          <CalendarClock className="mr-1 h-4 w-4" /> 
          {formatTimeOnly(event.startDate)} - {formatTimeOnly(event.endDate)}
          <span className="mx-2">•</span>
          <MapPin className="mr-1 h-4 w-4" /> {event.location}
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">{event.title}</h3>
        <p className="text-gray-600 mb-4 line-clamp-2">{event.description}</p>
        <div className="flex justify-between items-center">
          {event.capacity ? (
            <span className={`text-sm font-medium px-2 py-1 rounded-full ${
              isRegistrationClosed 
                ? "text-red-600 bg-red-50" 
                : registeredCount >= event.capacity
                ? "text-red-600 bg-red-50"
                : "text-accent bg-accent-50"
            }`}>
              {isRegistrationClosed 
                ? "Đã hết hạn đăng ký" 
                : registeredCount >= event.capacity
                ? "Đã hết chỗ"
                : calculateRemainingSpots(event.capacity, registeredCount)
              }
            </span>
          ) : (
            <span className="text-sm font-medium text-accent bg-accent-50 px-2 py-1 rounded-full">
              {isRegistrationClosed ? "Đã hết hạn đăng ký" : "Đang mở đăng ký"}
            </span>
          )}
          
          <Link 
            href={`/events/${event.id}`} 
            className={`${
              isRegistrationClosed || (event.capacity && registeredCount >= event.capacity)
                ? "text-gray-400 cursor-not-allowed" 
                : "text-primary hover:text-primary-800"
            } font-medium`}
          >
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

const EventSkeleton = () => (
  <div className="bg-white rounded-xl shadow-md overflow-hidden">
    <Skeleton className="h-48 w-full" />
    <div className="p-6 space-y-3">
      <div className="flex items-center">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-32 ml-auto" />
      </div>
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
      <div className="flex justify-between pt-2">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-5 w-24" />
      </div>
    </div>
  </div>
);

const Events = () => {
  const { toast } = useToast();
  
  const { data: events = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/events', { limit: 3 }],
    retry: 1,
  });
  
  React.useEffect(() => {
    if (error) {
      toast({
        title: "Không thể tải sự kiện",
        description: "Đã xảy ra lỗi khi tải sự kiện. Vui lòng thử lại sau.",
        variant: "destructive",
      });
    }
  }, [error, toast]);

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-special">Sự kiện sắp diễn ra</h2>
          <p className="mt-2 text-base text-gray-600">Đăng ký tham gia các hoạt động hấp dẫn của Đoàn trường</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {isLoading ? (
            <>
              <EventSkeleton />
              <EventSkeleton />
              <EventSkeleton />
            </>
          ) : events && events.length > 0 ? (
            events.map((event: any) => (
              <EventCard key={event.id} event={event} />
            ))
          ) : (
            <div className="col-span-3 text-center py-12">
              <CalendarClock className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-lg font-medium text-gray-900">Không có sự kiện</h3>
              <p className="mt-1 text-sm text-gray-500">Hiện chưa có sự kiện nào sắp diễn ra.</p>
            </div>
          )}
        </div>

        <div className="text-center mt-10">
          <Button asChild>
            <Link href="/events">
              Xem tất cả sự kiện
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
};

export default Events;
