import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { Textarea } from '@/shared/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog';
import { Import } from 'lucide-react';
import { useToast } from '@/shared/components/ui/use-toast';

interface ModelConfigImportProps {
  onImport: (config: any) => void;
  modelType: 'car' | 'walking';
}

export const ModelConfigImport: React.FC<ModelConfigImportProps> = ({
  onImport,
  modelType,
}) => {
  const [jsonInput, setJsonInput] = React.useState('');
  const [open, setOpen] = React.useState(false);
  const { toast } = useToast();

  const handleImport = () => {
    try {
      // Try to parse the input as JSON, but also handle raw JSON objects
      let parsed;
      try {
        // First, try to parse it as a JSON string
        parsed = JSON.parse(jsonInput);
      } catch (e) {
        // If that fails, try to evaluate it as a raw JSON object
        try {
          // Remove any potential line breaks and normalize the input
          const normalizedInput = jsonInput
            .replace(/[\n\r]/g, '')
            .replace(/:\s+/g, ':')
            .replace(/,\s+/g, ',')
            .replace(/{\s+/g, '{')
            .replace(/}\s+/g, '}');
            
          // Use Function constructor to safely evaluate the JSON object
          // This allows us to handle raw JSON that was copied and pasted
          parsed = new Function('return ' + normalizedInput)();
        } catch (evalError) {
          throw new Error('Invalid JSON format. Please check your input.');
        }
      }

      // Check if the input is a direct model configuration or a collection
      let modelConfig = parsed;

      // If it's a collection (CAR_MODELS/PLAYER_MODELS), extract the first model
      if (parsed.CAR_MODELS || parsed.PLAYER_MODELS) {
        const models = parsed.CAR_MODELS || parsed.PLAYER_MODELS;
        modelConfig = Object.values(models)[0] || models;
      }

      // Validate the structure based on model type
      if (modelType === 'car') {
        // Check if it's already in the correct format
        if (modelConfig.model && modelConfig.physics && modelConfig.drivingAnimation) {
          onImport(modelConfig);
        } else {
          throw new Error('Invalid car model configuration format. Required fields: model, physics, drivingAnimation');
        }
      } else {
        if (modelConfig.model && modelConfig.physics && modelConfig.walkingAnimation) {
          onImport(modelConfig);
        } else {
          throw new Error('Invalid character model configuration format. Required fields: model, physics, walkingAnimation');
        }
      }

      setOpen(false);
      setJsonInput('');
      
      toast({
        title: 'Success',
        description: 'Configuration imported successfully',
      });
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Invalid JSON format',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Import className="h-4 w-4 mr-2" />
          Import Config
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Model Configuration</DialogTitle>
          <DialogDescription>
            Paste your {modelType === 'car' ? 'car' : 'character'} model configuration.
            You can paste either a JSON string or a raw JavaScript object.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <Textarea
            value={jsonInput}
            onChange={(e) => setJsonInput(e.target.value)}
            placeholder={`Paste your configuration here...
You can paste either format:

1. Raw object:
{
  model: {
    obj: '/model.glb',
    type: 'glb',
    scale: 1,
    units: 'meters',
    rotation: { x: 0, y: 0, z: 0 },
    anchor: 'center',
    elevationOffset: 0
  },
  physics: {
    ${modelType === 'car' 
      ? `maxSpeed: 0.1,
    acceleration: 0.0003,
    brakeForce: 0.001,
    reverseSpeed: 0.05,
    turnSpeed: 1.0,
    friction: 0.95` 
      : `walkMaxVelocity: 0.01,
    runMaxVelocity: 0.03,
    walkAcceleration: 0.01,
    runAcceleration: 0.02,
    jumpForce: 0.2,
    gravity: -9.81`}
  },
  ${modelType === 'car' 
    ? `drivingAnimation: {
    drivingAnimation: 'AnimationName'
  }` 
    : `walkingAnimation: {
    walkSpeed: 2,
    runSpeed: 3,
    idleAnimation: 'idle',
    walkAnimation: 'walk',
    runAnimation: 'run'
  }`}
}

2. JSON string:
{
  "model": {
    "obj": "/model.glb",
    ...
  }
}`}
            className="min-h-[300px] font-mono text-sm"
          />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleImport}>
            Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 