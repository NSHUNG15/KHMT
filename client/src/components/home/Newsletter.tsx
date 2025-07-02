import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Mail, Phone } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, { message: "Tên phải có ít nhất 2 ký tự" }),
  email: z.string().email({ message: "Email không hợp lệ" }),
  studentId: z.string().optional(),
  terms: z.boolean().refine(val => val === true, {
    message: "Bạn phải đồng ý nhận email thông báo",
  }),
});

type FormValues = z.infer<typeof formSchema>;

const Newsletter = () => {
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      studentId: "",
      terms: false,
    },
  });

  const onSubmit = (data: FormValues) => {
    console.log(data);
    toast({
      title: "Đăng ký thành công!",
      description: "Cảm ơn bạn đã đăng ký nhận thông báo.",
    });
    form.reset();
  };

  return (
    <section className="py-12 bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold font-special mb-6">Liên hệ với chúng tôi</h2>
            <div className="space-y-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <MapPin className="h-5 w-5 text-secondary-400" />
                </div>
                <div className="ml-3 text-gray-300">
                  <p>Phòng A210, Tòa nhà A, Đại học Duy Tân</p>
                  <p>254 Nguyễn Văn Linh, Thanh Khê, Đà Nẵng</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Mail className="h-5 w-5 text-secondary-400" />
                </div>
                <div className="ml-3 text-gray-300">
                  <p>doankhmt@duytan.edu.vn</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 mt-1">
                  <Phone className="h-5 w-5 text-secondary-400" />
                </div>
                <div className="ml-3 text-gray-300">
                  <p>(+84) 236 3650 403</p>
                </div>
              </div>
              <div className="pt-4">
                <h3 className="text-lg font-medium mb-2">Theo dõi chúng tôi</h3>
                <div className="flex space-x-4">
                  <a href="#" className="text-gray-400 hover:text-white">
                    <i className="ri-facebook-circle-fill text-2xl"></i>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white">
                    <i className="ri-instagram-fill text-2xl"></i>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white">
                    <i className="ri-youtube-fill text-2xl"></i>
                  </a>
                  <a href="#" className="text-gray-400 hover:text-white">
                    <i className="ri-telegram-fill text-2xl"></i>
                  </a>
                </div>
              </div>
            </div>
          </div>
          
          <div>
            <h2 className="text-2xl font-bold font-special mb-6">Đăng ký nhận thông báo</h2>
            <p className="text-gray-300 mb-4">Nhận thông báo về các sự kiện và hoạt động mới nhất của Đoàn trường KHMT.</p>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Họ và tên</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nhập họ và tên" 
                          {...field} 
                          className="bg-gray-800 border-gray-600 text-white focus:ring-primary-500 focus:border-primary-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nhập địa chỉ email" 
                          type="email" 
                          {...field} 
                          className="bg-gray-800 border-gray-600 text-white focus:ring-primary-500 focus:border-primary-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="studentId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-300">Mã sinh viên</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nhập mã sinh viên (không bắt buộc)" 
                          {...field} 
                          className="bg-gray-800 border-gray-600 text-white focus:ring-primary-500 focus:border-primary-500"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="terms"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          className="data-[state=checked]:bg-primary-600"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="text-gray-300">
                          Tôi đồng ý nhận email thông báo
                        </FormLabel>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button 
                  type="submit" 
                  className="w-full bg-secondary hover:bg-secondary-700 text-black"
                >
                  Đăng ký
                </Button>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
