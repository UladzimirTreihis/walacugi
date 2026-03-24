export interface NewsItem {
  _id: string;
  title: string;
  images: string[];
  description: string;
  createdAt: string;
}

export interface EventItem {
  _id: string;
  title: string;
  images: string[];
  description: string;
  date?: string;
  createdAt: string;
}
