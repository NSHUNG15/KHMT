import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const Hero = () => {
  return (
    <div className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">
        <div className="flex flex-col md:flex-row items-center">
          <div className="md:w-1/2 mb-8 md:mb-0">
            <h2 className="text-3xl md:text-4xl font-bold font-special mb-4">Đoàn trường Khoa học Máy tính</h2>
            <p className="text-lg mb-6 text-primary-100">Kết nối, phát triển và đồng hành cùng sinh viên DTU</p>
            <div className="space-x-4">
              <Button
                variant="secondary"
                className="bg-white text-primary hover:bg-primary-50"
                asChild
              >
                <Link href="/events">
                  Tham gia ngay
                </Link>
              </Button>
              <Button
                variant="outline"
                className="text-white bg-primary-700 hover:bg-primary-800 border-white"
                asChild
              >
                <a href="#about">
                  Tìm hiểu thêm
                </a>
              </Button>
            </div>
          </div>
          <div className="md:w-1/2">
            <img 
              src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?ixlib=rb-1.2.1&auto=format&fit=crop&w=1050&h=700&q=80" 
              alt="Sinh viên Đại học Duy Tân" 
              className="rounded-lg shadow-lg w-full h-64 md:h-auto object-cover"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
