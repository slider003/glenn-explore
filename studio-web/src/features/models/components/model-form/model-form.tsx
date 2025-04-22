import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { Switch } from '@/shared/components/ui/switch';
import { ModelUpload } from './model-upload';
import { ModelConfig } from './model-config';
import { CreateModelRequestDTO, ModelDetailsDtoDTO, UpdateModelRequestDTO } from '@/api/models';
import { cn } from '@/shared/utils/utils';
import { motion } from 'framer-motion';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.string().min(1, 'Type is required'),
  isPremium: z.boolean().default(false),
  price: z.number().min(0).optional(),
  configJson: z.string().optional(),
  thumbnailUrl: z.string().nullable().optional(),
  modelUrl: z.string().nullable().optional(),
  thumbnailFileId: z.string().nullable().optional(),
  modelFileId: z.string().nullable().optional(),
});

type ModelFormValues = z.infer<typeof formSchema>;

interface ModelFormProps {
  initialData?: ModelDetailsDtoDTO;
  onSubmit: (data: CreateModelRequestDTO | UpdateModelRequestDTO) => Promise<void>;
  isLoading?: boolean;
}

const MotionFormField = motion(FormField) as typeof FormField;

const PriceInput: React.FC<{
  value: number;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => {
  const [inputValue, setInputValue] = React.useState(value.toString());

  React.useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Handle empty string, single decimal point
    if (newValue === '' || newValue === '.') {
      return;
    }

    // Parse the number, handling both comma and dot as decimal separators
    const parsedValue = parseFloat(newValue.replace(',', '.'));
    
    // Only update if it's a valid number and non-negative
    if (!isNaN(parsedValue) && parsedValue >= 0) {
      onChange(parsedValue);
    }
  };

  // Handle blur to clean up the input
  const handleBlur = () => {
    const parsedValue = parseFloat(inputValue.replace(',', '.'));
    if (isNaN(parsedValue) || parsedValue < 0) {
      setInputValue('0');
      onChange(0);
    } else {
      // Format to 2 decimal places
      const formatted = parsedValue.toFixed(2);
      setInputValue(formatted);
    }
  };

  return (
    <div className="relative">
      <Input
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleChange}
        onBlur={handleBlur}
        className="pl-8 text-xl h-12 border-none bg-muted/30"
      />
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
        $
      </span>
    </div>
  );
};

export const ModelForm: React.FC<ModelFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
}) => {
  const form = useForm<ModelFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      type: initialData?.type || '',
      isPremium: initialData?.isPremium || false,
      price: initialData?.price || 0,
      configJson: initialData?.configJson || '',
      thumbnailUrl: initialData?.thumbnailUrl,
      modelUrl: initialData?.modelUrl,
      thumbnailFileId: initialData?.thumbnailFileId,
      modelFileId: initialData?.modelFileId,
    },
  });

  const isPremium = form.watch('isPremium');
  const modelType = form.watch('type');

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-12">
        {/* Basic Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-8"
        >
          <MotionFormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Enter model name"
                    className="text-3xl font-light border-none bg-transparent px-0 h-auto placeholder:text-muted-foreground/50"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <MotionFormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full text-xl border-none bg-muted/30 h-12">
                      <SelectValue placeholder="Select model type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="car">🚗 Car</SelectItem>
                    <SelectItem value="walking">🚶 Character</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <MotionFormField
            control={form.control}
            name="isPremium"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border border-border/10 p-4 bg-muted/30">
                <div className="space-y-1">
                  <FormLabel className="text-lg">Premium Model</FormLabel>
                  <FormDescription className="text-base">
                    Make this model available for purchase
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="scale-125"
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {isPremium && (
            <MotionFormField
              control={form.control}
              name="price"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <PriceInput
                      value={field.value ?? 0}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </motion.div>

        {/* Model Configuration */}
        {modelType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            <ModelConfig
              type={modelType}
              value={form.watch('configJson')}
              onChange={(value) => form.setValue('configJson', value)}
            />
          </motion.div>
        )}

        {/* File Upload Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <ModelUpload
            thumbnailUrl={form.watch('thumbnailUrl')}
            modelUrl={form.watch('modelUrl')}
            onThumbnailChange={({id, url}) => {
              form.setValue('thumbnailUrl', url);
              form.setValue('thumbnailFileId', id);
            }}
            onModelChange={({id, url}) => {
              form.setValue('modelUrl', url);
              form.setValue('modelFileId', id);
            }}
          />
        </motion.div>

        {/* Submit Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="sticky bottom-0 bg-background/80 backdrop-blur-sm py-4 -mx-8 px-8"
        >
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 text-lg"
          >
            {isLoading ? 'Creating...' : 'Create Model'}
          </Button>
        </motion.div>
      </form>
    </Form>
  );
}; 