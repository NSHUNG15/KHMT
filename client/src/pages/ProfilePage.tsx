import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { UserAvatar } from "@/components/ui/user-avatar";
import { Skeleton } from "@/components/ui/skeleton";

// Define the EventRegistration type if not imported from elsewhere
type EventRegistration = {
  id: string;
  eventId: string;
  registeredAt: string;
  status: 'approved' | 'rejected' | 'pending';
  event?: {
    title?: string;
  };
};

const profileFormSchema = z.object({
  fullName: z.string().min(2, {
    message: "Họ và tên phải có ít nhất 2 ký tự",
  }),
  email: z.string().email({
    message: "Email không hợp lệ",
  }),
  studentId: z.string().optional(),
  faculty: z.string().optional(),
  major: z.string().optional(),
});

const passwordFormSchema = z.object({
  currentPassword: z.string().min(6, {
    message: "Mật khẩu phải có ít nhất 6 ký tự",
  }),
  newPassword: z.string().min(6, {
    message: "Mật khẩu mới phải có ít nhất 6 ký tự",
  }),
  confirmPassword: z.string().min(6, {
    message: "Xác nhận mật khẩu mới phải có ít nhất 6 ký tự",
  }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: "Mật khẩu mới và xác nhận mật khẩu mới phải trùng khớp",
  path: ["confirmPassword"],
});

type ProfileFormValues = z.infer<typeof profileFormSchema>;
type PasswordFormValues = z.infer<typeof passwordFormSchema>;

const ProfilePage = () => {
  const [, setLocation] = useLocation();
  const { user, updateProfile } = useAuth();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  // Get user registrations
  const { 
    data: registrations, 
    isLoading: registrationsLoading 
  } = useQuery<EventRegistration[]>({
    queryKey: ['/api/events/registrations'],
    enabled: !!user,
  });

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || "",
      email: user?.email || "",
      studentId: user?.studentId || "",
      faculty: user?.faculty || "",
      major: user?.major || "",
    },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  // Update form fields when user data is loaded
  useEffect(() => {
    if (user) {
      profileForm.reset({
        fullName: user.fullName || "",
        email: user.email || "",
        studentId: user.studentId || "",
        faculty: user.faculty || "",
        major: user.major || "",
      });
    }
  }, [user, profileForm]);

  const onProfileSubmit = async (data: ProfileFormValues) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      await updateProfile(data);
      toast({
        title: "Hồ sơ đã được cập nhật",
        description: "Thông tin cá nhân của bạn đã được cập nhật thành công.",
      });
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Cập nhật hồ sơ không thành công. Vui lòng thử lại.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordFormValues) => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      await apiRequest("PUT", `/api/users/${user.id}`, {
        password: data.newPassword,
        currentPassword: data.currentPassword,
      });
      toast({
        title: "Mật khẩu đã được cập nhật",
        description: "Mật khẩu của bạn đã được cập nhật thành công.",
      });
      passwordForm.reset();
    } catch (error) {
      toast({
        title: "Lỗi",
        description: "Cập nhật mật khẩu không thành công. Mật khẩu hiện tại có thể không đúng.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    return <div>Bạn cần đăng nhập để xem trang này.</div>;
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Hồ sơ cá nhân</h1>
          <p className="text-gray-500">Quản lý thông tin tài khoản và các hoạt động của bạn</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Card>
              <CardHeader>
                <div className="flex justify-center">
                  <UserAvatar user={user} className="h-24 w-24" />
                </div>
                <CardTitle className="text-center">{user.fullName}</CardTitle>
                <CardDescription className="text-center">{user.email}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Tên đăng nhập:</span>
                    <span className="text-sm font-medium">{user.username}</span>
                  </div>
                  {user.studentId && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Mã sinh viên:</span>
                      <span className="text-sm font-medium">{user.studentId}</span>
                    </div>
                  )}
                  {user.faculty && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Khoa:</span>
                      <span className="text-sm font-medium">{user.faculty}</span>
                    </div>
                  )}
                  {user.major && (
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-500">Chuyên ngành:</span>
                      <span className="text-sm font-medium">{user.major}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-500">Vai trò:</span>
                    <span className="text-sm font-medium">
                      {user.role === "admin" ? "Quản trị viên" : "Thành viên"}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="md:col-span-2">
            <Tabs defaultValue="profile">
              <TabsList className="mb-4">
                <TabsTrigger value="profile">Hồ sơ</TabsTrigger>
                <TabsTrigger value="password">Mật khẩu</TabsTrigger>
                <TabsTrigger value="activities">Hoạt động</TabsTrigger>
              </TabsList>
              
              <TabsContent value="profile">
                <Card>
                  <CardHeader>
                    <CardTitle>Thông tin cá nhân</CardTitle>
                    <CardDescription>
                      Cập nhật thông tin cá nhân của bạn
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-6">
                        <FormField
                          control={profileForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Họ và tên</FormLabel>
                              <FormControl>
                                <Input placeholder="Nhập họ và tên" {...field} disabled={isLoading} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Email</FormLabel>
                              <FormControl>
                                <Input placeholder="Nhập email" {...field} disabled={isLoading} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={profileForm.control}
                          name="studentId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mã sinh viên</FormLabel>
                              <FormControl>
                                <Input placeholder="Nhập mã sinh viên" {...field} disabled={isLoading} />
                              </FormControl>
                              <FormDescription>
                                Không bắt buộc nhưng giúp xác thực danh tính sinh viên của bạn.
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                          <FormField
                            control={profileForm.control}
                            name="faculty"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Khoa</FormLabel>
                                <Select 
                                  onValueChange={field.onChange} 
                                  defaultValue={field.value}
                                  disabled={isLoading}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Chọn khoa" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="Khoa học Máy tính">Khoa học Máy tính</SelectItem>
                                    <SelectItem value="Công nghệ Phần mềm">Công nghệ Phần mềm</SelectItem>
                                    <SelectItem value="Kỹ thuật Máy tính & Điện tử">Kỹ thuật Máy tính & Điện tử</SelectItem>
                                    <SelectItem value="Hệ thống Thông tin">Hệ thống Thông tin</SelectItem>
                                    <SelectItem value="Truyền thông & Mạng máy tính">Truyền thông & Mạng máy tính</SelectItem>
                                    <SelectItem value="Khác">Khác</SelectItem>
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={profileForm.control}
                            name="major"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Chuyên ngành</FormLabel>
                                <FormControl>
                                  <Input placeholder="Nhập chuyên ngành" {...field} disabled={isLoading} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? "Đang cập nhật..." : "Cập nhật hồ sơ"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="password">
                <Card>
                  <CardHeader>
                    <CardTitle>Thay đổi mật khẩu</CardTitle>
                    <CardDescription>
                      Cập nhật mật khẩu để bảo vệ tài khoản của bạn
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...passwordForm}>
                      <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-6">
                        <FormField
                          control={passwordForm.control}
                          name="currentPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mật khẩu hiện tại</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Nhập mật khẩu hiện tại" 
                                  {...field} 
                                  disabled={isLoading} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="newPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Mật khẩu mới</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Nhập mật khẩu mới" 
                                  {...field} 
                                  disabled={isLoading} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={passwordForm.control}
                          name="confirmPassword"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Xác nhận mật khẩu mới</FormLabel>
                              <FormControl>
                                <Input 
                                  type="password" 
                                  placeholder="Nhập lại mật khẩu mới" 
                                  {...field} 
                                  disabled={isLoading} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <Button type="submit" disabled={isLoading}>
                          {isLoading ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="activities">
                <Card>
                  <CardHeader>
                    <CardTitle>Hoạt động đã đăng ký</CardTitle>
                    <CardDescription>
                      Danh sách các sự kiện và hoạt động mà bạn đã đăng ký tham gia
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {registrationsLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-12 w-full" />
                      </div>
                    ) : registrations && registrations.length > 0 ? (
                      <div className="space-y-4">
                        {registrations.map((registration: any) => (
                          <div key={registration.id} className="border rounded-md p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-medium">{registration.event?.title || "Sự kiện"}</h3>
                                <p className="text-sm text-gray-500">
                                  Đăng ký: {new Date(registration.registeredAt).toLocaleDateString('vi-VN')}
                                </p>
                              </div>
                              <div>
                                <span className={`text-xs rounded-full px-2 py-1 ${
                                  registration.status === 'approved' 
                                  ? 'bg-green-100 text-green-800' 
                                  : registration.status === 'rejected'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {registration.status === 'approved' 
                                    ? 'Đã duyệt' 
                                    : registration.status === 'rejected'
                                    ? 'Đã từ chối'
                                    : 'Đang chờ duyệt'}
                                </span>
                              </div>
                            </div>
                            <Button 
                              variant="link" 
                              size="sm" 
                              className="p-0 mt-2" 
                              onClick={() => setLocation(`/events/${registration.eventId}`)}
                            >
                              Xem chi tiết sự kiện
                            </Button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-gray-500">Bạn chưa đăng ký tham gia hoạt động nào.</p>
                        <Button 
                          variant="link" 
                          className="mt-2" 
                          onClick={() => setLocation("/events")}
                        >
                          Khám phá các sự kiện
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
