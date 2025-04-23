import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import FormSelector from "@/components/forms/FormSelector";
import FormBuilder from "@/components/forms/FormBuilder";

interface TournamentFormTabProps {
  selectedFormId?: number;
  setSelectedFormId: (id?: number) => void;
  formFields: any[];
  setFormFields: (fields: any[]) => void;
}

const TournamentFormTab: React.FC<TournamentFormTabProps> = ({
  selectedFormId,
  setSelectedFormId,
  formFields,
  setFormFields
}) => {
  const { toast } = useToast();
  const [formTabValue, setFormTabValue] = useState<string>(selectedFormId ? "existing" : "new");

  const handleFormTypeChange = (value: string) => {
    setFormTabValue(value);
    if (value === "existing") {
      // Khi chọn sử dụng form có sẵn, reset formFields
      setFormFields([]);
    } else {
      // Khi chọn tạo form mới, reset selectedFormId
      setSelectedFormId(undefined);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="text-lg">Biểu mẫu đăng ký</CardTitle>
          <CardDescription>
            Chọn hoặc tạo biểu mẫu đăng ký cho đội tham gia giải đấu
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={formTabValue} onValueChange={handleFormTypeChange} className="w-full">
            <TabsList className="grid grid-cols-2 mb-4">
              <TabsTrigger value="existing">Sử dụng biểu mẫu có sẵn</TabsTrigger>
              <TabsTrigger value="new">Tạo biểu mẫu mới</TabsTrigger>
            </TabsList>
            
            <TabsContent value="existing">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Chọn một biểu mẫu có sẵn từ danh sách các biểu mẫu bạn đã tạo
                </p>
                
                <FormSelector 
                  onSelect={(formId) => {
                    setSelectedFormId(formId);
                    toast({
                      title: "Đã chọn biểu mẫu",
                      description: "Biểu mẫu đã được chọn thành công"
                    });
                  }}
                  selectedFormId={selectedFormId}
                  buttonText="Chọn biểu mẫu"
                />
                
                {selectedFormId && (
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-sm font-medium">Biểu mẫu đã chọn: ID #{selectedFormId}</p>
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="new">
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Tạo biểu mẫu đăng ký mới cho giải đấu này
                </p>
                
                <div className="border rounded-md p-4">
                  <h3 className="text-sm font-medium mb-4">Thiết kế biểu mẫu</h3>
                  <FormBuilder 
                    onChange={(fields) => {
                      setFormFields(fields);
                    }}
                    initialFields={formFields}
                  />
                </div>
                
                {formFields.length > 0 && (
                  <div className="flex items-center p-2 bg-muted rounded-md">
                    <p className="text-sm text-muted-foreground">
                      {formFields.length} trường được thêm vào biểu mẫu
                    </p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default TournamentFormTab;