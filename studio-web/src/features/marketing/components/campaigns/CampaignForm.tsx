import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { useEmailTemplates } from '../../hooks/useEmailTemplates';
import { CampaignDTO } from '@/api/models';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  emailTemplateId: z.string().min(1, 'Template is required'),
  description: z.string().optional(),
  userIds: z.array(z.string()).min(1, 'At least one user must be selected'),
});

type CampaignFormData = z.infer<typeof schema>;

type CampaignFormProps = {
  onSubmit: (data: CampaignFormData) => void;
  initialData?: CampaignDTO;
  isSubmitting?: boolean;
};

export const CampaignForm: React.FC<CampaignFormProps> = ({
  onSubmit,
  initialData,
  isSubmitting,
}) => {
  const form = useForm<CampaignFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name || '',
      emailTemplateId: initialData?.emailTemplateId ?? undefined,
      description: initialData?.description || '',
      userIds: initialData?.recipients?.map(r => r.userId) ?? [],
    },
  });

  const { templates, isLoading: isLoadingTemplates } = useEmailTemplates();

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Campaign Name</FormLabel>
              <FormControl>
                <Input placeholder="Enter campaign name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="emailTemplateId"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Email Template</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isLoadingTemplates}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {templates
                    .filter((template): template is typeof template & { id: string } => 
                      typeof template.id === 'string' && template.id.length > 0
                    )
                    .map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        {template.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="userIds"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Recipients</FormLabel>
              <FormControl>
                {/* TODO: Add a proper user selection component here */}
                <Input 
                  type="text" 
                  placeholder="Enter comma-separated user IDs"
                  value={field.value.join(', ')}
                  onChange={(e) => field.onChange(e.target.value.split(',').map(id => id.trim()))}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }: { field: any }) => (
            <FormItem>
              <FormLabel>Description (optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter campaign description"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Campaign'}
        </Button>
      </form>
    </Form>
  );
};
