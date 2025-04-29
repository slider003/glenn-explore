import * as React from 'react'
import { EmailTemplateList } from '../components/templates/EmailTemplateList';
import { EmailTemplateForm } from '../components/templates/EmailTemplateForm';
import { useEmailTemplates } from '../hooks/useEmailTemplates';
import { EmailTemplateDTO } from '@/api/models';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';

export const TemplatesPage: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = React.useState<EmailTemplateDTO | undefined>();
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  
  const { createTemplate, updateTemplate, isCreating, isUpdating } = useEmailTemplates();
  
  const handleCreateNew = () => {
    setSelectedTemplate(undefined);
    setIsDialogOpen(true);
  };
  
  const handleEdit = (template: EmailTemplateDTO) => {
    setSelectedTemplate(template);
    setIsDialogOpen(true);
  };
  
  const handleSubmit = async (data: EmailTemplateDTO) => {
    try {
      if (selectedTemplate?.id) {
        await updateTemplate(selectedTemplate.id, data);
      } else {
        await createTemplate(data);
      }
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to save template:', error);
    }
  };
  
  return (
    <div className="p-4">
      <EmailTemplateList
        onCreateNew={handleCreateNew}
        onEdit={handleEdit}
      />
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedTemplate ? 'Edit Template' : 'Create Template'}
            </DialogTitle>
          </DialogHeader>
          
          <EmailTemplateForm
            initialData={selectedTemplate}
            onSubmit={handleSubmit}
            isSubmitting={isCreating || isUpdating}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
