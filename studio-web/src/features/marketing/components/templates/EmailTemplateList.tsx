import { Plus } from 'lucide-react';
import { EmailTemplateCard } from './EmailTemplateCard';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import { EmailTemplateDTO } from '@/api/models';
import { Button } from '@/shared/components/ui/button';

type EmailTemplateListProps = {
  onCreateNew?: () => void;
  onEdit?: (template: EmailTemplateDTO) => void;
  onDelete?: (template: EmailTemplateDTO) => void;
};

export const EmailTemplateList: React.FC<EmailTemplateListProps> = ({
  onCreateNew,
  onEdit,
  onDelete,
}) => {
  const { templates, isLoading } = useEmailTemplates();

  if (isLoading) {
    return <div className="text-muted-foreground">Loading templates...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Email Templates</h2>
        {onCreateNew && (
          <Button onClick={onCreateNew}>
            <Plus className="h-4 w-4 mr-2" />
            Create Template
          </Button>
        )}
      </div>

      {templates.length === 0 ? (
        <p className="text-muted-foreground">No templates found. Create your first one!</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((template) => (
            <EmailTemplateCard
              key={template.id}
              template={template}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};
