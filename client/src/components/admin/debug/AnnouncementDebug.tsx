import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

const AnnouncementDebug = () => {
  const { toast } = useToast();

  const createTestAnnouncement = async () => {
    try {
      const res = await apiRequest('POST', '/api/announcements', {
        title: "Test Announcement",
        content: "This is a test announcement",
        category: "general",
        isPublished: true,
        createdBy: 1,
      });
      
      const data = await res.json();
      toast({
        title: "Thành công",
        description: "Đã tạo thông báo test thành công",
      });
      console.log("Created announcement:", data);
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tạo thông báo test",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Debug Tools</h2>
      <Button onClick={createTestAnnouncement}>
        Create Test Announcement
      </Button>
    </div>
  );
};

export default AnnouncementDebug;
