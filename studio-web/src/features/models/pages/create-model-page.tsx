import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/shared/components/ui/use-toast';
import { usePostApiModels } from '@/api/hooks/api';
import { ModelForm } from '../components/model-form/model-form';
import { CreateModelRequestDTO, UpdateModelRequestDTO } from '@/api/models';

const defaultCarConfig = {
  model: {
    obj: '/model.glb',
    type: 'glb',
    scale: 5,
    units: 'meters',
    rotation: { x: 90, y: 0, z: 0 },
    anchor: 'center',
    elevationOffset: 0.7
  },
  physics: {
    maxSpeed: 0.1,
    acceleration: 0.0003,
    brakeForce: 0.004,
    reverseSpeed: 0.01,
    turnSpeed: 1,
    friction: 0.99
  },
  drivingAnimation: {
    drivingAnimation: 'Body.001Action.001'
  }
};

const defaultWalkingConfig = {
  model: {
    obj: '/model.glb',
    type: 'glb',
    scale: 1,
    units: 'meters',
    rotation: { x: 90, y: 0, z: 0 },
    anchor: 'center',
    elevationOffset: 0
  },
  physics: {
    walkMaxVelocity: 0.01,
    runMaxVelocity: 0.03,
    walkAcceleration: 0.001,
    runAcceleration: 0.001,
    deceleration: 0.95,
    rotationSpeed: 1,
    jumpForce: 0.15,
    gravity: 0.005
  },
  walkingAnimation: {
    walkSpeed: 2,
    runSpeed: 3,
    idleAnimation: 'idle',
    walkAnimation: 'walk',
    runAnimation: 'running'
  }
};

export const CreateModelPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { mutateAsync: createModel, isPending } = usePostApiModels();

  const initialData = {
    name: '',
    type: '',
    isPremium: false,
    price: 0,
    configJson: JSON.stringify(defaultCarConfig),
    thumbnailUrl: null,
    modelUrl: null,
    thumbnailFileId: null,
    modelFileId: null,
  };

  const handleSubmit = async (data: CreateModelRequestDTO) => {
    try {
      // Update configJson based on model type
      const config = data.type === 'car' ? defaultCarConfig : defaultWalkingConfig;
      const updatedData = {
        ...data,
        configJson: JSON.stringify(config)
      };

      await createModel({ data: updatedData });
      toast({
        title: 'Success',
        description: 'Model created successfully',
      });
      navigate('/studio/models');
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to create model',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="container max-w-5xl py-8">
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight">Create New Model</h1>
          <p className="text-muted-foreground text-lg">
            Add a new 3D model to your collection
          </p>
        </div>

        <ModelForm 
          initialData={initialData}
          onSubmit={handleSubmit as (data: CreateModelRequestDTO | UpdateModelRequestDTO) => Promise<void>} 
          isLoading={isPending} 
        />
      </div>
    </div>
  );
}; 