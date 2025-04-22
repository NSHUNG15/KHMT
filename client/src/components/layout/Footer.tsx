import { Logo } from "@/components/ui/logo";

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white">
      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="mb-4 md:mb-0">
            <Logo size="md" withText={false} className="text-white" />
          </div>
          <div className="text-sm text-gray-400">
            <p>© {new Date().getFullYear()} Đoàn trường Khoa học Máy tính - Đại học Duy Tân. Tất cả các quyền được bảo lưu.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
