import { Pencil, Trash } from 'lucide-react';
import { Card, CardContent } from '@/shared/components/ui/card';
import { Button } from '@/shared/components/ui/button';
import { EmailTemplateDTO } from '@/api/models';

type EmailTemplateCardProps = {
  template: EmailTemplateDTO;
  onEdit?: (template: EmailTemplateDTO) => void;
  onDelete?: (template: EmailTemplateDTO) => void;
};

export const EmailTemplateCard: React.FC<EmailTemplateCardProps> = ({
  template,
  onEdit,
  onDelete,
}) => {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="space-y-4">
          <div className="space-y-1">
            <h3 className="font-semibold">{template.name}</h3>
            <p className="text-sm text-muted-foreground">{template.subject}</p>
          </div>
          
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onEdit(template)}
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
            )}
            
            {onDelete && (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onDelete(template)}
              >
                <Trash className="h-4 w-4 mr-2" />
                Delete
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
