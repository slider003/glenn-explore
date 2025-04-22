import React from 'react';
import { useForm } from 'react-hook-form';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/ui/form';
import { Input } from '@/shared/components/ui/input';
import { Slider } from '@/shared/components/ui/slider';
import { useGetApiModelsConfigTypesType } from '@/api/hooks/api';
import { motion } from 'framer-motion';
import { ModelConfigImport } from './model-config-import';

interface ModelConfigProps {
  type: string;
  value?: string;
  onChange: (value: string) => void;
}

type ModelFormType = {
  model: {
    obj: string;
    type: string;
    scale: number;
    units: string;
    rotation: {
      x: number;
      y: number;
      z: number;
    };
    anchor: string;
    elevationOffset: number;
  };
  physics: {
    // Car physics
    maxSpeed?: number;
    acceleration?: number;
    brakeForce?: number;
    reverseSpeed?: number;
    turnSpeed?: number;
    friction?: number;
    // Player physics
    walkMaxVelocity?: number;
    runMaxVelocity?: number;
    walkAcceleration?: number;
    runAcceleration?: number;
    deceleration?: number;
    rotationSpeed?: number;
    jumpForce?: number;
    gravity?: number;
  };
  drivingAnimation?: {
    drivingAnimation: string;
  };
  walkingAnimation?: {
    walkSpeed: number;
    runSpeed: number;
    idleAnimation: string;
    walkAnimation: string;
    runAnimation: string;
  };
};

type FieldPath = keyof ModelFormType | 
  `model.${keyof ModelFormType['model']}` | 
  `model.rotation.${keyof ModelFormType['model']['rotation']}` |
  `physics.${keyof ModelFormType['physics']}` |
  `drivingAnimation.${keyof NonNullable<ModelFormType['drivingAnimation']>}` |
  `walkingAnimation.${keyof NonNullable<ModelFormType['walkingAnimation']>}`;

interface NumberInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  defaultValue?: number;
}

const NumberInput: React.FC<NumberInputProps> = ({
  value,
  onChange,
  min,
  max,
  step = 0.1,
  defaultValue = 0
}) => {
  // Keep track of the input string separately from the numeric value
  const [inputValue, setInputValue] = React.useState(value.toString());

  // Update input value when the numeric value changes externally
  React.useEffect(() => {
    setInputValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Handle empty string, single minus sign, or decimal point
    if (newValue === '' || newValue === '-' || newValue === '.') {
      return;
    }

    // Parse the number, handling both comma and dot as decimal separators
    const parsedValue = parseFloat(newValue.replace(',', '.'));
    
    // Only update if it's a valid number and within bounds
    if (!isNaN(parsedValue)) {
      if (min !== undefined && parsedValue < min) return;
      if (max !== undefined && parsedValue > max) return;
      onChange(parsedValue);
    }
  };

  // Handle blur to clean up the input
  const handleBlur = () => {
    const parsedValue = parseFloat(inputValue.replace(',', '.'));
    if (isNaN(parsedValue)) {
      setInputValue(defaultValue.toString());
      onChange(defaultValue);
    } else {
      // Format the number to a reasonable precision
      const formatted = parsedValue.toString();
      setInputValue(formatted);
    }
  };

  return (
    <Input
      type="text"
      inputMode="decimal"
      value={inputValue}
      onChange={handleChange}
      onBlur={handleBlur}
      className="w-20 h-7 text-sm bg-muted/30 border-none"
    />
  );
};

export const ModelConfig: React.FC<ModelConfigProps> = ({
  type,
  value,
  onChange,
}) => {
  const { data: configType } = useGetApiModelsConfigTypesType(type);

  const form = useForm<ModelFormType>({
    defaultValues: value ? JSON.parse(value) : configType,
  });

  React.useEffect(() => {
    const subscription = form.watch((value) => {
      onChange(JSON.stringify(value));
    });
    return () => subscription.unsubscribe();
  }, [form, onChange]);

  const handleImport = (config: any) => {
    onChange(JSON.stringify(config));
  };

  if (!configType) return null;

  const SliderField = ({ 
    name,
    label,
    min,
    max,
    step,
    defaultValue,
    tooltip = '',
  }: {
    name: FieldPath;
    label: string;
    min?: number;
    max?: number;
    step?: number;
    defaultValue?: number;
    tooltip?: string;
  }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => {
        // Ensure we have a numeric value
        const numericValue = typeof field.value === 'number' ? field.value : (defaultValue ?? 0);
        return (
          <FormItem className="space-y-1">
            <div className="flex justify-between items-center gap-4">
              <div className="flex items-center gap-2">
                <FormLabel className="min-w-[120px] text-sm">{label}</FormLabel>
                {tooltip && (
                  <span className="text-xs text-muted-foreground">({tooltip})</span>
                )}
              </div>
              <div className="flex items-center gap-3 flex-1">
                <Slider
                  min={min}
                  max={max}
                  step={step}
                  value={[numericValue]}
                  onValueChange={([val]) => field.onChange(val)}
                  className="flex-1 [&_[role=slider]]:h-3 [&_[role=slider]]:w-3"
                />
                <FormControl>
                  <NumberInput
                    value={numericValue}
                    onChange={field.onChange}
                    min={min}
                    max={max}
                    step={step}
                    defaultValue={defaultValue}
                  />
                </FormControl>
              </div>
            </div>
            <FormMessage className="text-xs" />
          </FormItem>
        );
      }}
    />
  );

  const InputField = ({ 
    name, 
    label,
    placeholder = '',
    tooltip = ''
  }: { 
    name: FieldPath; 
    label: string;
    placeholder?: string;
    tooltip?: string;
  }) => (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem className="space-y-1">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <FormLabel className="min-w-[120px] text-sm">{label}</FormLabel>
              {tooltip && (
                <span className="text-xs text-muted-foreground">({tooltip})</span>
              )}
            </div>
            <FormControl>
              <Input 
                {...field} 
                placeholder={placeholder}
                value={typeof field.value === 'string' ? field.value : ''} 
                className="flex-1 h-7 text-sm bg-muted/30 border-none" 
              />
            </FormControl>
          </div>
          <FormMessage className="text-xs" />
        </FormItem>
      )}
    />
  );

  const renderModelFields = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-medium uppercase text-muted-foreground">Model Settings</h3>
          <ModelConfigImport onImport={handleImport} modelType={type as 'car' | 'walking'} />
        </div>
        <div className="space-y-3">
          <InputField
            name="model.obj"
            label="Model Path"
            placeholder="/model.glb"
            tooltip="Path to the GLB file"
          />
          <InputField
            name="model.type"
            label="Model Type"
            placeholder="glb"
            tooltip="Usually 'glb'"
          />
          <SliderField
            name="model.scale"
            label="Scale"
            min={0.1}
            max={10}
            step={0.1}
            defaultValue={1}
            tooltip="Usually 1-5"
          />
          <InputField
            name="model.units"
            label="Units"
            placeholder="meters"
            tooltip="Usually 'meters'"
          />
          <InputField
            name="model.anchor"
            label="Anchor"
            placeholder="center"
            tooltip="Usually 'center'"
          />
          <SliderField
            name="model.elevationOffset"
            label="Elevation"
            min={0}
            max={2}
            step={0.1}
            defaultValue={0.7}
            tooltip="Usually 0.7"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium uppercase text-muted-foreground">Rotation</h3>
        <div className="space-y-3">
          <SliderField
            name="model.rotation.x"
            label="X Rotation"
            min={-180}
            max={180}
            step={90}
            defaultValue={90}
            tooltip="Usually 90°"
          />
          <SliderField
            name="model.rotation.y"
            label="Y Rotation"
            min={-180}
            max={180}
            step={90}
            defaultValue={0}
            tooltip="0° or 90°"
          />
          <SliderField
            name="model.rotation.z"
            label="Z Rotation"
            min={-180}
            max={180}
            step={90}
            defaultValue={0}
            tooltip="Usually 0°"
          />
        </div>
      </div>
    </motion.div>
  );

  const renderCarFields = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <h3 className="text-sm font-medium uppercase text-muted-foreground">Vehicle Physics</h3>
        <div className="space-y-3">
          <SliderField
            name="physics.maxSpeed"
            label="Max Speed"
            min={0.01}
            max={0.2}
            step={0.01}
            defaultValue={0.1}
            tooltip="0.04-0.15"
          />
          <SliderField
            name="physics.acceleration"
            label="Acceleration"
            min={0.0001}
            max={0.001}
            step={0.0001}
            defaultValue={0.0003}
            tooltip="0.0001-0.0003"
          />
          <SliderField
            name="physics.brakeForce"
            label="Brake Force"
            min={0.001}
            max={0.01}
            step={0.001}
            defaultValue={0.004}
            tooltip="Usually 0.004"
          />
          <SliderField
            name="physics.reverseSpeed"
            label="Reverse Speed"
            min={0.005}
            max={0.02}
            step={0.001}
            defaultValue={0.01}
            tooltip="Usually 0.01"
          />
          <SliderField
            name="physics.turnSpeed"
            label="Turn Speed"
            min={0.5}
            max={2}
            step={0.1}
            defaultValue={1}
            tooltip="0.7-1.2"
          />
          <SliderField
            name="physics.friction"
            label="Friction"
            min={0.9}
            max={1}
            step={0.001}
            defaultValue={0.99}
            tooltip="0.99-0.999"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium uppercase text-muted-foreground">Animation</h3>
        <div className="space-y-3">
          <InputField
            name="drivingAnimation.drivingAnimation"
            label="Animation Name"
            placeholder="Body.001Action.001"
            tooltip="Animation clip name"
          />
        </div>
      </div>
    </motion.div>
  );

  const renderWalkingFields = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      <div className="space-y-4">
        <h3 className="text-sm font-medium uppercase text-muted-foreground">Character Physics</h3>
        <div className="space-y-3">
          <SliderField
            name="physics.walkMaxVelocity"
            label="Walk Speed"
            min={0.005}
            max={0.02}
            step={0.001}
            defaultValue={0.01}
            tooltip="Usually 0.01"
          />
          <SliderField
            name="physics.runMaxVelocity"
            label="Run Speed"
            min={0.01}
            max={0.05}
            step={0.001}
            defaultValue={0.03}
            tooltip="Usually 0.03"
          />
          <SliderField
            name="physics.walkAcceleration"
            label="Walk Accel."
            min={0.0005}
            max={0.002}
            step={0.0001}
            defaultValue={0.001}
            tooltip="Usually 0.001"
          />
          <SliderField
            name="physics.runAcceleration"
            label="Run Accel."
            min={0.0005}
            max={0.002}
            step={0.0001}
            defaultValue={0.001}
            tooltip="Usually 0.001"
          />
          <SliderField
            name="physics.deceleration"
            label="Deceleration"
            min={0.9}
            max={0.99}
            step={0.01}
            defaultValue={0.95}
            tooltip="Usually 0.95"
          />
          <SliderField
            name="physics.rotationSpeed"
            label="Turn Speed"
            min={0.5}
            max={2}
            step={0.1}
            defaultValue={1}
            tooltip="Usually 1"
          />
          <SliderField
            name="physics.jumpForce"
            label="Jump Force"
            min={0.1}
            max={0.3}
            step={0.01}
            defaultValue={0.15}
            tooltip="0.15-0.2"
          />
          <SliderField
            name="physics.gravity"
            label="Gravity"
            min={0.001}
            max={0.01}
            step={0.001}
            defaultValue={0.005}
            tooltip="Usually 0.005"
          />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-sm font-medium uppercase text-muted-foreground">Animation Settings</h3>
        <div className="space-y-3">
          <SliderField
            name="walkingAnimation.walkSpeed"
            label="Walk Anim. Speed"
            min={1}
            max={5}
            step={0.1}
            defaultValue={2}
            tooltip="Usually 2-3"
          />
          <SliderField
            name="walkingAnimation.runSpeed"
            label="Run Anim. Speed"
            min={2}
            max={6}
            step={0.1}
            defaultValue={3}
            tooltip="Usually 3-4"
          />
          <InputField
            name="walkingAnimation.idleAnimation"
            label="Idle Animation"
            placeholder="idle"
            tooltip="Animation clip name"
          />
          <InputField
            name="walkingAnimation.walkAnimation"
            label="Walk Animation"
            placeholder="walk"
            tooltip="Animation clip name"
          />
          <InputField
            name="walkingAnimation.runAnimation"
            label="Run Animation"
            placeholder="running"
            tooltip="Animation clip name"
          />
        </div>
      </div>
    </motion.div>
  );

  return (
    <Form {...form}>
      <div className="space-y-8 py-2">
        {renderModelFields()}
        {type === 'car' && renderCarFields()}
        {type === 'walking' && renderWalkingFields()}
      </div>
    </Form>
  );
}; 