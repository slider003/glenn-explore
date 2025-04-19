import { ModelInfo, UnlockedModel } from './types/ModelTypes';

export class ModelClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `/api/models`;
  }

  /**
   * Get all available models with unlock status
   */
  public async getAvailableModels(): Promise<ModelInfo[]> {
    try {
      const response = await fetch(`${this.baseUrl}/available`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch models: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching available models:', error);
      return [];
    }
  }

  /**
   * Get user's unlocked models
   */
  public async getUnlockedModels(): Promise<UnlockedModel[]> {
    try {
      const response = await fetch(`${this.baseUrl}/unlocked`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch unlocked models: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching unlocked models:', error);
      return [];
    }
  }

  /**
   * Check if a specific model is unlocked
   */
  public async checkModelAccess(modelId: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/check/${modelId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error(`Failed to check model access: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error checking access for model ${modelId}:`, error);
      return false;
    }
  }

  /**
   * Purchase a model (get Stripe checkout URL)
   */
  public async purchaseModel(modelId: string): Promise<{checkoutUrl: string}> {
    try {
      const response = await fetch(`${this.baseUrl}/purchase/${modelId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to purchase model: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error purchasing model ${modelId}:`, error);
      throw error;
    }
  }
} 