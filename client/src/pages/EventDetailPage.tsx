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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatDateTime, formatTimeOnly, generateEventImageUrl } from "@/lib/utils";
import { Calendar, Clock, MapPin, Users, AlertCircle, Calendar as CalendarIcon, ArrowLeft } from "lucide-react";

interface EventDetailPageProps {
  id: string;
}

const EventDetailPage = ({ id }: EventDetailPageProps) => {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isRegistering, setIsRegistering] = useState(false);

  // Fetch event details
  const { 
    data: event, 
    isLoading: eventLoading, 
    error: eventError 
  } = useQuery({
    queryKey: [`/api/events/${id}`],
  });

  // Fetch event registrations if the user is authenticated
  const { 
    data: userRegistration,
    isLoading: registrationLoading
  } = useQuery({
    queryKey: [`/api/events/${id}/my-registration`],
    enabled: !!user,
  });

  // Error handling
  React.useEffect(() => {
    if (eventError) {
      toast({
        title: "Không thể tải sự kiện",
        description: "Sự kiện không tồn tại hoặc đã bị xóa.",
        variant: "destructive",
      });
      setLocation("/events");
    }
  }, [eventError, toast, setLocation]);

  // Calculate event status
  const now = new Date();
  const eventStatus = React.useMemo(() => {
    if (!event) return {};
    
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    const registrationDeadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;
    
    const isEventOver = now > endDate;
    const isEventOngoing = now >= startDate && now <= endDate;
    const isRegistrationClosed = registrationDeadline ? now > registrationDeadline : false;
    
    return {
      isEventOver,
      isEventOngoing,
      isRegistrationClosed,
      startDate,
      endDate,
      registrationDeadline
    };
  }, [event, now]);

  // Create registration form schema based on event.formTemplate
  const createDynamicSchema = () => {
    if (!event || !event.formTemplate || !Array.isArray(event.formTemplate.fields)) {
      return z.object({});
    }

    const schemaObj: Record<string, any> = {};
    
    event.formTemplate.fields.forEach((field: any) => {
      let fieldSchema;
      
      if (field.type === 'text' || field.type === 'textarea') {
        fieldSchema = z.string();
        if (field.required) {
          fieldSchema = fieldSchema.min(1, { message: `${field.label} không được để trống` });
        } else {
          fieldSchema = fieldSchema.optional();
        }
      } else if (field.type === 'email') {
        fieldSchema = field.required 
          ? z.string().min(1, { message: `${field.label} không được để trống` }).email({ message: 'Email không hợp lệ' })
          : z.string().email({ message: 'Email không hợp lệ' }).optional();
      } else if (field.type === 'number') {
        fieldSchema = z.string().refine(val => !isNaN(Number(val)), { message: 'Phải là số' });
        if (field.required) {
          fieldSchema = fieldSchema.min(1, { message: `${field.label} không được để trống` });
        } else {
          fieldSchema = fieldSchema.optional();
        }
      } else if (field.type === 'checkbox') {
        fieldSchema = field.required 
          ? z.boolean().refine(val => val === true, { message: `${field.label} phải được chọn` })
          : z.boolean().optional();
      } else {
        fieldSchema = field.required ? z.string().min(1) : z.string().optional();
      }
      
      schemaObj[field.id] = fieldSchema;
    });
    
    return z.object(schemaObj);
  };

  const dynamicSchema = React.useMemo(createDynamicSchema, [event]);

  // Registration form
  const form = useForm<z.infer<typeof dynamicSchema>>({
    resolver: zodResolver(dynamicSchema),
    defaultValues: {},
  });

  // Registration mutation
  const registerMutation = useMutation({
    mutationFn: async (formData: z.infer<typeof dynamicSchema>) => {
      return await apiRequest('POST', `/api/events/${id}/register`, {
        formData,
      });
    },
    onSuccess: () => {
      toast({
        title: "Đăng ký thành công",
        description: "Bạn đã đăng ký tham gia sự kiện thành công.",
      });
      setIsRegistering(false);
      queryClient.invalidateQueries({ queryKey: [`/api/events/${id}/my-registration`] });
    },
    onError: (error) => {
      toast({
        title: "Đăng ký thất bại",
        description: error.message || "Có lỗi xảy ra khi đăng ký. Vui lòng thử lại.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof dynamicSchema>) => {
    registerMutation.mutate(data);
  };

  // Render registration form fields dynamically
  const renderFormFields = () => {
    if (!event || !event.formTemplate || !Array.isArray(event.formTemplate.fields)) {
      return <p>Không có trường dữ liệu nào để điền.</p>;
    }

    return event.formTemplate.fields.map((field: any) => {
      if (field.type === 'text' || field.type === 'email' || field.type === 'number') {
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}{field.required && <span className="text-red-500">*</span>}</FormLabel>
                <FormControl>
                  <Input 
                    placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}`} 
                    type={field.type === 'number' ? 'number' : field.type}
                    {...formField} 
                  />
                </FormControl>
                {field.description && <FormDescription>{field.description}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );
      } else if (field.type === 'textarea') {
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem>
                <FormLabel>{field.label}{field.required && <span className="text-red-500">*</span>}</FormLabel>
                <FormControl>
                  <Textarea 
                    placeholder={field.placeholder || `Nhập ${field.label.toLowerCase()}`} 
                    {...formField} 
                  />
                </FormControl>
                {field.description && <FormDescription>{field.description}</FormDescription>}
                <FormMessage />
              </FormItem>
            )}
          />
        );
      } else if (field.type === 'checkbox') {
        return (
          <FormField
            key={field.id}
            control={form.control}
            name={field.id}
            render={({ field: formField }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0 py-4">
                <FormControl>
                  <Checkbox
                    checked={formField.value as boolean}
                    onCheckedChange={formField.onChange}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel>
                    {field.label}{field.required && <span className="text-red-500">*</span>}
                  </FormLabel>
                  {field.description && <FormDescription>{field.description}</FormDescription>}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        );
      }
      
      return null;
    });
  };

  if (eventLoading) {
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
        <Skeleton className="h-32 w-full mb-6" />
        <Skeleton className="h-6 w-48 mb-4" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!event) {
    return (
      <div className="max-w-4xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="text-center py-12">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h2 className="mt-4 text-lg font-medium text-gray-900">Không tìm thấy sự kiện</h2>
          <p className="mt-2 text-gray-500">Sự kiện này không tồn tại hoặc đã bị xóa.</p>
          <Button variant="outline" className="mt-4" onClick={() => setLocation("/events")}>
            Quay lại danh sách sự kiện
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
        onClick={() => setLocation("/events")}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Quay lại danh sách sự kiện
      </Button>
      
      <div className="space-y-8">
        {/* Event Header */}
        <div>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div>
              <h1 className="text-3xl font-bold">{event.title}</h1>
              <div className="flex items-center gap-2 mt-2 text-gray-500">
                <Calendar className="h-4 w-4" />
                <span>{formatDate(event.startDate)}</span>
                {eventStatus.isEventOver && (
                  <Badge variant="outline" className="ml-2 text-red-500 border-red-300">Đã kết thúc</Badge>
                )}
                {eventStatus.isEventOngoing && (
                  <Badge variant="outline" className="ml-2 text-green-500 border-green-300">Đang diễn ra</Badge>
                )}
                {!eventStatus.isEventOver && !eventStatus.isEventOngoing && (
                  <Badge variant="outline" className="ml-2 text-blue-500 border-blue-300">Sắp diễn ra</Badge>
                )}
              </div>
            </div>
            
            {!eventStatus.isEventOver && !registrationLoading && (
              <div>
                {user ? (
                  userRegistration ? (
                    <Button variant="outline" className="pointer-events-none">
                      <Calendar className="mr-2 h-4 w-4" />
                      Đã đăng ký
                    </Button>
                  ) : (
                    eventStatus.isRegistrationClosed ? (
                      <Button variant="outline" disabled>
                        Đã hết hạn đăng ký
                      </Button>
                    ) : (
                      <Dialog open={isRegistering} onOpenChange={setIsRegistering}>
                        <DialogTrigger asChild>
                          <Button>
                            Đăng ký tham gia
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[500px]">
                          <DialogHeader>
                            <DialogTitle>Đăng ký tham gia sự kiện</DialogTitle>
                            <DialogDescription>
                              Vui lòng điền đầy đủ thông tin sau để đăng ký tham gia sự kiện.
                            </DialogDescription>
                          </DialogHeader>
                          
                          <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                              {renderFormFields()}
                              
                              <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsRegistering(false)}>
                                  Hủy
                                </Button>
                                <Button type="submit" disabled={registerMutation.isPending}>
                                  {registerMutation.isPending ? "Đang đăng ký..." : "Xác nhận đăng ký"}
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
              src={generateEventImageUrl(event.imageUrl)} 
              alt={event.title} 
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        
        {/* Event Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Calendar className="h-5 w-5 text-primary mr-3" />
                <div>
                  <h3 className="font-medium">Thời gian</h3>
                  <p className="text-sm text-gray-500">{formatDateTime(event.startDate)}</p>
                  <p className="text-sm text-gray-500">đến {formatDateTime(event.endDate)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MapPin className="h-5 w-5 text-primary mr-3" />
                <div>
                  <h3 className="font-medium">Địa điểm</h3>
                  <p className="text-sm text-gray-500">{event.location}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-5 w-5 text-primary mr-3" />
                <div>
                  <h3 className="font-medium">Số lượng</h3>
                  <p className="text-sm text-gray-500">
                    {event.capacity 
                      ? `Tối đa ${event.capacity} người tham gia` 
                      : "Không giới hạn số lượng"}
                  </p>
                  {eventStatus.registrationDeadline && (
                    <p className="text-xs text-gray-500 mt-1">
                      Hạn đăng ký: {formatDate(eventStatus.registrationDeadline)}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Event Details */}
        <Tabs defaultValue="details" className="space-y-6">
          <TabsList>
            <TabsTrigger value="details">Chi tiết</TabsTrigger>
            <TabsTrigger value="agenda">Lịch trình</TabsTrigger>
            <TabsTrigger value="faq">FAQ</TabsTrigger>
          </TabsList>
          
          <TabsContent value="details" className="space-y-4">
            <div className="prose prose-blue max-w-none">
              <h2 className="text-xl font-bold">Giới thiệu</h2>
              <div className="whitespace-pre-line">{event.description}</div>
            </div>
          </TabsContent>
          
          <TabsContent value="agenda">
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Lịch trình sự kiện</h2>
              
              {event.agenda && event.agenda.length > 0 ? (
                <div className="space-y-4">
                  {event.agenda.map((item: any, index: number) => (
                    <div key={index} className="flex gap-4 p-4 border rounded-lg">
                      <div className="text-center min-w-[80px]">
                        <div className="text-sm font-medium text-primary">{formatTimeOnly(item.startTime)}</div>
                        <div className="text-xs text-gray-500">đến {formatTimeOnly(item.endTime)}</div>
                      </div>
                      <div>
                        <h3 className="font-medium">{item.title}</h3>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">{item.description}</p>
                        )}
                        {item.speaker && (
                          <p className="text-sm font-medium mt-1">
                            <span className="text-gray-500">Người trình bày:</span> {item.speaker}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Chưa có thông tin lịch trình chi tiết.</p>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="faq">
            <div className="space-y-6">
              <h2 className="text-xl font-bold">Câu hỏi thường gặp</h2>
              
              {event.faq && event.faq.length > 0 ? (
                <Accordion type="single" collapsible className="w-full">
                  {event.faq.map((item: any, index: number) => (
                    <AccordionItem key={index} value={`item-${index}`}>
                      <AccordionTrigger className="text-left">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent>
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              ) : (
                <p className="text-gray-500">Chưa có câu hỏi thường gặp nào.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
        
        {/* Registration Instructions */}
        {!eventStatus.isEventOver && (
          <Card>
            <CardHeader>
              <CardTitle className="text-xl">Thông tin đăng ký</CardTitle>
              <CardDescription>
                Hướng dẫn và quy định khi đăng ký tham gia sự kiện
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                {eventStatus.isRegistrationClosed
                  ? "Thời hạn đăng ký đã kết thúc. Rất tiếc bạn không thể đăng ký tham gia sự kiện này."
                  : "Vui lòng đăng ký tham gia trước thời hạn để đảm bảo có chỗ tham dự sự kiện."}
              </p>
              
              {event.registrationInstructions && (
                <div className="whitespace-pre-line">{event.registrationInstructions}</div>
              )}
              
              {!eventStatus.isRegistrationClosed && (
                <div className="mt-4 bg-blue-50 p-4 rounded-md">
                  <div className="flex">
                    <CalendarIcon className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
                    <div>
                      <h4 className="font-medium text-blue-800">Thời hạn đăng ký</h4>
                      <p className="text-sm text-blue-700">
                        {eventStatus.registrationDeadline
                          ? `Hạn cuối đăng ký: ${formatDateTime(eventStatus.registrationDeadline)}`
                          : "Bạn có thể đăng ký tham gia đến khi sự kiện bắt đầu."
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default EventDetailPage;
