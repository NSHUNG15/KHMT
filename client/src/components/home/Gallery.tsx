import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { ZoomIn } from "lucide-react";

interface GalleryImage {
  src: string;
  alt: string;
}

const Gallery = () => {
  const [selectedImage, setSelectedImage] = useState<GalleryImage | null>(null);
  
  // Sample gallery images
  const galleryImages: GalleryImage[] = [
    { 
      src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80", 
      alt: "Sinh viên làm việc nhóm trong thư viện" 
    },
    { 
      src: "https://images.unsplash.com/photo-1501386761578-eac5c94b800a?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80", 
      alt: "Sinh viên tham gia hoạt động ngoại khóa" 
    },
    { 
      src: "https://images.unsplash.com/photo-1543269865-cbf427effbad?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80", 
      alt: "Sinh viên trò chuyện trong khuôn viên trường" 
    },
    { 
      src: "https://images.unsplash.com/photo-1511632765486-a01980e01a18?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80", 
      alt: "Sinh viên đang tham gia bài giảng" 
    },
    { 
      src: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80", 
      alt: "Sinh viên làm việc với máy tính" 
    },
    { 
      src: "https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80", 
      alt: "Sinh viên vui vẻ trong hoạt động ngoại khóa" 
    },
    { 
      src: "https://images.unsplash.com/photo-1517486808906-6ca8b3f8e1c1?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80", 
      alt: "Sinh viên khoa CNTT đang lập trình" 
    },
    { 
      src: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?ixlib=rb-1.2.1&auto=format&fit=crop&w=300&h=200&q=80", 
      alt: "Sinh viên thuyết trình trong lớp học" 
    },
  ];

  const openImageModal = (image: GalleryImage) => {
    setSelectedImage(image);
  };

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-900 font-special">Khoảnh khắc hoạt động</h2>
          <p className="mt-2 text-base text-gray-600">Hình ảnh từ các hoạt động của Đoàn trường</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {galleryImages.map((image, index) => (
            <div key={index} className="relative group overflow-hidden rounded-lg shadow-md">
              <img 
                className="w-full h-48 object-cover transition duration-300 transform group-hover:scale-105" 
                src={image.src} 
                alt={image.alt} 
              />
              <div className="absolute inset-0 bg-black bg-opacity-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <button 
                  type="button" 
                  className="text-white hover:text-gray-200"
                  onClick={() => openImageModal(image)}
                >
                  <ZoomIn className="h-6 w-6" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <Button variant="outline">
            Xem thêm hình ảnh
          </Button>
        </div>

        {/* Image Modal */}
        <Dialog open={!!selectedImage} onOpenChange={() => setSelectedImage(null)}>
          <DialogContent className="sm:max-w-3xl">
            <DialogHeader>
              <DialogTitle>Hình ảnh hoạt động</DialogTitle>
              <DialogDescription>
                {selectedImage?.alt}
              </DialogDescription>
            </DialogHeader>
            <div className="flex justify-center">
              <img 
                src={selectedImage?.src} 
                alt={selectedImage?.alt} 
                className="max-h-[70vh] object-contain"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </section>
  );
};

export default Gallery;
