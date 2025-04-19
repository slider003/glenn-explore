export interface ModelInfo {
  modelId: string;
  name: string;
  price: number;
  isPremium: boolean;
  isUnlocked: boolean;
}

export interface UnlockedModel {
  modelId: string;
  purchasedAt: string;
}

export interface PurchaseResponse {
  checkoutUrl: string;
} 