import * as React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/components/ui/tabs';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { EmailTemplateDTO } from '@/api/models';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  subject: z.string().min(1, 'Subject is required'),
  htmlContent: z.string().min(1, 'HTML content is required'),
  textContent: z.string().min(1, 'Text content is required'),
});

type EmailTemplateFormData = z.infer<typeof schema>;

type EmailTemplateFormProps = {
  onSubmit: (data: EmailTemplateFormData) => void;
  initialData?: EmailTemplateDTO;
  isSubmitting?: boolean;
};

export const EmailTemplateForm: React.FC<EmailTemplateFormProps> = ({
  onSubmit,
  initialData,
  isSubmitting,
}) => {
  const form = useForm<EmailTemplateFormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initialData?.name ?? '',
      subject: initialData?.subject ?? '',
      htmlContent: initialData?.htmlContent ?? '',
      textContent: initialData?.textContent ?? '',
    },
  });

  const watchedHtmlContent = form.watch('htmlContent');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <Tabs defaultValue="editor" className="space-y-4">
          <TabsList>
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>

          <TabsContent value="editor" className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Template Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter template name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="subject"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Email Subject</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter email subject" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="htmlContent"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>HTML Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter HTML content"
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="textContent"
              render={({ field }: { field: any }) => (
                <FormItem>
                  <FormLabel>Text Content (Fallback)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter plain text content (used as fallback)"
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="preview">
            <Card>
              <CardHeader>
                <CardTitle>Email Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg overflow-hidden bg-white dark:bg-zinc-900">
                  <div className="p-2 bg-secondary text-secondary-foreground text-sm font-medium border-b flex items-center justify-between">
                    <span>Email Preview</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(`data:text/html;charset=utf-8,${encodeURIComponent(watchedHtmlContent || '')}`, '_blank')}
                    >
                      Open in New Tab
                    </Button>
                  </div>
                  <div className="p-4">
                    <iframe
                      srcDoc={watchedHtmlContent}
                      className="w-full h-[600px] border-0 rounded bg-white"
                      sandbox="allow-same-origin"
                      title="Email Preview"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Template'}
        </Button>
      </form>
    </Form>
  );
};
