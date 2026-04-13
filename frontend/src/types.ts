export interface NewsItem {
  _id: string;
  title: string;
  images: string[];
  description: string;
  datedAt?: string;
  pinned?: boolean;
  location?: string;
  countries?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface EventItem {
  _id: string;
  title: string;
  images: string[];
  description: string;
  budget?: string;
  currency?: string;
  datedAt?: string;
  startDate?: string;
  endDate?: string;
  approxDate?: string;
  countries?: string[];
  location?: string;
  ageRestriction?: string;
  chatLink?: string;
  difficultyLevel?: number;
  createdAt: string;
  updatedAt?: string;
  pinned?: boolean;
}

export interface EquipmentModelItem {
  _id: string;
  category: string;
  title: string;
  description: string;
  pricePerDay: number;
  currency?: string;
  size?: string;
  images: string[];
  active: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface EquipmentUnitItem {
  _id: string;
  modelId: string;
  unitNumber: number;
  unitCode: string;
  condition?: string;
  status: "active" | "maintenance" | "retired";
  createdAt: string;
  updatedAt?: string;
}

export interface EquipmentAvailabilityItem {
  unitId: string;
  available: boolean;
  reason?: string;
}

export interface CheckoutItem {
  unitId: string;
  unitCode: string;
  modelId: string;
  modelTitle: string;
  modelImage?: string;
  pricePerDay?: number;
  currency?: string;
  startDate: string;
  endDate: string;
}
