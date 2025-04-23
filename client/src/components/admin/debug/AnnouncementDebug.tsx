import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

const AnnouncementDebug = () => {
  const { toast } = useToast();
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const createTestAnnouncement = async () => {
    try {
      setError(null);
      setResult(null);
      
      const testData = {
        title: "Test Announcement",
        content: "This is a test announcement",
        category: "general",
        isPublished: true,
        createdBy: 1,
      };
      
      console.log("Sending data:", JSON.stringify(testData));
      const res = await apiRequest('POST', '/api/announcements', testData);
      
      // Check response
      console.log("Response status:", res.status);
      const data = await res.json();
      console.log("Response data:", data);
      
      setResult(JSON.stringify(data, null, 2));
      toast({
        title: "Thành công",
        description: "Đã tạo thông báo test thành công",
      });
    } catch (error: any) {
      console.error("Error creating announcement:", error);
      setError(error.toString());
      toast({
        title: "Lỗi",
        description: "Không thể tạo thông báo test. Kiểm tra console để biết chi tiết.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="p-4 space-y-4">
      <h2 className="text-xl font-bold mb-4">Debug Tools</h2>
      <div className="space-x-4">
        <Button onClick={createTestAnnouncement}>
          Tạo Thông Báo Test
        </Button>
      </div>
      
      {error && (
        <Card className="border-red-300 bg-red-50">
          <CardContent className="pt-4">
            <h3 className="font-bold text-red-700 mb-2">Lỗi:</h3>
            <pre className="text-sm bg-white p-2 rounded border overflow-auto max-h-[200px]">{error}</pre>
          </CardContent>
        </Card>
      )}
      
      {result && (
        <Card className="border-green-300 bg-green-50">
          <CardContent className="pt-4">
            <h3 className="font-bold text-green-700 mb-2">Kết quả:</h3>
            <pre className="text-sm bg-white p-2 rounded border overflow-auto max-h-[200px]">{result}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnnouncementDebug;
