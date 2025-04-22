import React from "react";
import Hero from "@/components/home/Hero";
import Announcements from "@/components/home/Announcements";
import Events from "@/components/home/Events";
import SportsTournament from "@/components/home/SportsTournament";
import Gallery from "@/components/home/Gallery";
import Newsletter from "@/components/home/Newsletter";

const HomePage = () => {
  return (
    <>
      <Hero />
      <Announcements />
      <Events />
      <SportsTournament />
      <Gallery />
      <Newsletter />
      
      <div className="bg-gray-50 py-16" id="about">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-special">Giới thiệu về Đoàn trường KHMT</h2>
            <p className="mt-2 text-base text-gray-600">Tìm hiểu thêm về tổ chức và sứ mệnh của chúng tôi</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Sứ mệnh của chúng tôi</h3>
              <p className="text-gray-600 mb-4">
                Đoàn trường Khoa học Máy tính tại Đại học Duy Tân là tổ chức đoàn thể chính trị - xã hội của sinh viên khoa KHMT, 
                hoạt động dưới sự lãnh đạo của Đoàn Thanh niên Cộng sản Hồ Chí Minh.
              </p>
              <p className="text-gray-600 mb-4">
                Chúng tôi cam kết phát triển phong trào học tập, nghiên cứu khoa học, hoạt động xã hội và rèn luyện kỹ năng cho sinh viên. 
                Đồng thời, tạo môi trường để sinh viên phát triển toàn diện cả về chuyên môn lẫn kỹ năng mềm.
              </p>
              <p className="text-gray-600">
                Qua nhiều năm hoạt động, Đoàn trường KHMT đã xây dựng được nhiều chương trình có ý nghĩa, 
                góp phần nâng cao chất lượng đào tạo và giúp sinh viên có cơ hội việc làm tốt sau khi tốt nghiệp.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Các hoạt động chính</h3>
              <ul className="space-y-2">
                <li className="flex items-start">
                  <i className="ri-checkbox-circle-line text-primary mt-1 mr-2"></i>
                  <span>Tổ chức các hội thảo, workshop về công nghệ thông tin và khoa học máy tính</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-checkbox-circle-line text-primary mt-1 mr-2"></i>
                  <span>Tổ chức các cuộc thi lập trình, hackathon và chia sẻ kiến thức công nghệ</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-checkbox-circle-line text-primary mt-1 mr-2"></i>
                  <span>Thúc đẩy hoạt động nghiên cứu khoa học trong sinh viên</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-checkbox-circle-line text-primary mt-1 mr-2"></i>
                  <span>Tổ chức các giải đấu thể thao, văn nghệ để rèn luyện sức khỏe và tinh thần đoàn kết</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-checkbox-circle-line text-primary mt-1 mr-2"></i>
                  <span>Hoạt động tình nguyện, thiện nguyện và công tác xã hội</span>
                </li>
                <li className="flex items-start">
                  <i className="ri-checkbox-circle-line text-primary mt-1 mr-2"></i>
                  <span>Kết nối sinh viên với các doanh nghiệp, cơ hội thực tập và việc làm</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default HomePage;
