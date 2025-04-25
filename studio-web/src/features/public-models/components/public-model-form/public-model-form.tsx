import React from 'react';
import { useForm } from 'react-hook-form';
import { useToast } from '@/shared/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Button } from '@/shared/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/components/ui/select';
import { CreateModelRequestDTO, UpdateModelRequestDTO, ModelDetailsDtoDTO } from '@/api/models';
import { cn } from '@/shared/utils/utils';
import { motion } from 'framer-motion';
import { ModelUpload } from '@/features/models/components/model-form/model-upload';
import { ModelPreview } from '@/features/models/components/model-preview/model-preview';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be less than 50 characters'),
  type: z.string().min(1, 'Type is required'),
  configJson: z.string(),
  thumbnailUrl: z.string().nullable().optional(),
  modelUrl: z.string().nullable().optional(),
  thumbnailFileId: z.string().nullable().optional(),
  modelFileId: z.string().nullable().optional(),
  carSpeed: z.enum(['slow', 'fast']).optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'car' && !data.carSpeed) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['carSpeed'],
      message: 'Car speed is required for car models',
    });
  }

  if (!data.thumbnailUrl || !data.thumbnailFileId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['thumbnailUrl'],
      message: 'Thumbnail is required',
    });
  }

  if (!data.modelUrl || !data.modelFileId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['modelUrl'],
      message: 'Model file is required',
    });
  }
});

type ModelFormValues = z.infer<typeof formSchema>;

interface PublicModelFormProps {
  onSubmit: (data: CreateModelRequestDTO | UpdateModelRequestDTO) => Promise<void>;
  isLoading?: boolean;
  initialData?: ModelDetailsDtoDTO;
}

// Predefined configurations for different car speeds
const CAR_SPEEDS = {
  slow: {
    maxSpeed: 0.07,
    acceleration: 0.0002,
    brakeForce: 0.003,
    reverseSpeed: 0.05,
    turnSpeed: 1,
    friction: 0.99,
  },
  fast: {
    maxSpeed: 0.1,
    acceleration: 0.0003,
    brakeForce: 0.004,
    reverseSpeed: 0.1,
    turnSpeed: 1,
    friction: 0.99,
  },
};

export const PublicModelForm: React.FC<PublicModelFormProps> = ({
  onSubmit,
  isLoading = false,
  initialData,
}) => {
  console.log(initialData)
  const { toast } = useToast();
  const form = useForm<ModelFormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: initialData
      ? {
          name: initialData.name || '',
          type: initialData.type || '',
          configJson: JSON.parse(initialData.configJson!) || JSON.stringify({
            model: {
              anchor: "center",
              type: 'glb',
              units: 'meters',
              scale: 1,
              rotation: { x: 0, y: 0, z: 0 },
              position: { x: 0, y: 0, z: 0 },
            },
          }),
          thumbnailUrl: initialData.thumbnailUrl || null,
          modelUrl: initialData.modelUrl || null,
          thumbnailFileId: initialData.thumbnailFileId || null,
          modelFileId: initialData.modelFileId || null,
          carSpeed: initialData.type === 'car' ? (JSON.parse(initialData.configJson || '{}')?.physics?.maxSpeed > 0.2 ? 'fast' : 'slow') : undefined,
        }
      : {
          name: '',
          type: '',
          configJson: JSON.stringify({
            model: {
              anchor: "center",
              type: 'glb',
              units: 'meters',
              scale: 1,
              rotation: { x: 0, y: 0, z: 0 },
              position: { x: 0, y: 0, z: 0 },
            },
          }),
        },
  });

  const [scale, setScale] = React.useState<number>(initialData?.configJson ? JSON.parse(initialData.configJson)?.model?.scale || 1 : 1);
  const [rotation, setRotation] = React.useState<{ x: number; y: number; z: number }>(initialData?.configJson ? JSON.parse(initialData.configJson)?.model?.rotation || { x: 0, y: 0, z: 0 } : { x: 0, y: 0, z: 0 });

  const modelType = form.watch('type');
  const carSpeed = form.watch('carSpeed');

  // Update the config when scale, rotation, or car speed changes
  React.useEffect(() => {
    const baseConfig = {
      model: {
        anchor: "center",
        type: 'glb',
        units: 'meters',
        scale,
        rotation,
        position: { x: 0, y: 0, z: 0 },
      },
    };

    // Add physics config for cars
    if (modelType === 'car') {
      const physicsConfig = carSpeed === 'fast' ? CAR_SPEEDS.fast : CAR_SPEEDS.slow;
      Object.assign(baseConfig, { physics: physicsConfig });
    }

    form.setValue('configJson', JSON.stringify(baseConfig));
  }, [scale, rotation, modelType, carSpeed, form]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await form.trigger();

    if (!result) {
      const errors = form.formState.errors;
      const errorMessages = Object.entries(errors)
        .map(([field, error]) => `${field}: ${error?.message}`)
        .join('\n');
      toast({
        title: 'Validation Error',
        description: errorMessages,
        variant: 'destructive',
      });
      return;
    }

    const data = form.getValues();
    try {
      await onSubmit({
        ...data,
        isPremium: false,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create model. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-6">
            {/* Basic Info */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <input
                        type="text"
                        {...field}
                        className={cn(
                          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                        )}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
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

              {modelType === 'car' && (
                <FormField
                  control={form.control}
                  name="carSpeed"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Car Speed</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select car speed" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="slow">🐌 Slow Car</SelectItem>
                          <SelectItem value="fast">⚡ Fast Car</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </motion.div>

            {/* Transformation Controls */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="space-y-4"
            >
              <div>
                <FormLabel>Scale</FormLabel>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="0.1"
                    max="2"
                    step="0.1"
                    value={scale}
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <span className="w-12 text-sm">{scale.toFixed(1)}</span>
                </div>
              </div>

              <div>
                <FormLabel>Rotation</FormLabel>
                <div className="space-y-2">
                  {['x', 'y', 'z'].map((axis) => (
                    <div key={axis} className="flex items-center gap-2">
                      <span className="w-8 text-sm uppercase">{axis}</span>
                      <input
                        type="range"
                        min="-180"
                        max="180"
                        value={rotation[axis as keyof typeof rotation]}
                        onChange={(e) =>
                          setRotation((prev) => ({
                            ...prev,
                            [axis]: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full"
                      />
                      <span className="w-12 text-sm">
                        {rotation[axis as keyof typeof rotation]}°
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* File Upload Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <ModelUpload
                thumbnailUrl={form.watch('thumbnailUrl')}
                modelUrl={form.watch('modelUrl')}
                onThumbnailChange={({ id, url }) => {
                  form.setValue('thumbnailUrl', url);
                  form.setValue('thumbnailFileId', id);
                }}
                onModelChange={({ id, url }) => {
                  form.setValue('modelUrl', url);
                  form.setValue('modelFileId', id);
                }}
              />
            </motion.div>

            {/* Submit Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="sticky bottom-0 bg-background/80 backdrop-blur-sm py-4 -mx-8 px-8"
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-lg"
              >
                {isLoading ? 'Saving...' : initialData ? 'Update Model' : 'Create Model'}
              </Button>
            </motion.div>
          </div>

          {/* Model Preview */}
          <div className="sticky top-4 h-[calc(100vh-6rem)]">
            <ModelPreview
              url={form.watch('modelUrl') || ''}
              scale={{ x: scale, y: scale, z: scale }}
              rotation={rotation}
              position={{ x: 0, y: 0, z: 0 }}
            />
          </div>
        </div>
      </form>
    </Form>
  );
};
