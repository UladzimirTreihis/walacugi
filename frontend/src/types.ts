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
  startDate?: string;
  endDate?: string;
  approxDate?: string;
  countries?: string[];
  location?: string;
  ageRestriction?: string;
  chatLink?: string;
  difficultyLevel?: number;
  createdAt: string;
}
