import React from 'react';
import { Label } from "@/components/ui/label";
import FormBuilder from "@/components/forms/FormBuilder";
import FormSelector from "@/components/forms/FormSelector";

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
  return (
    <div className="grid gap-4">
      <div className="grid gap-2">
        <Label>Biểu mẫu đăng ký</Label>
        <div className="border rounded-md p-4 bg-muted/30">
          <div className="mb-4">
            <p className="text-sm text-muted-foreground mb-2">
              Bạn có thể chọn một biểu mẫu đã tạo hoặc tạo biểu mẫu mới cho giải đấu này.
            </p>
            <FormSelector 
              onSelect={setSelectedFormId} 
              selectedFormId={selectedFormId}
              buttonText="Chọn biểu mẫu có sẵn" 
            />
          </div>
          
          {!selectedFormId && (
            <>
              <div className="my-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-background px-2 text-muted-foreground">
                      Hoặc tạo biểu mẫu mới
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4">
                <FormBuilder
                  initialFields={formFields}
                  onChange={setFormFields}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TournamentFormTab;