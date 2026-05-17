export type CarouselStatus = "pending" | "approved" | "declined";

export interface Carousel {
  id: string;
  status: CarouselStatus;
  post_number: number | null;
  topic: string;
  caption: string | null;
  created_at: string;
  approved_at: string | null;
  declined_at: string | null;
  slides?: Slide[];
}

export interface Slide {
  id: string;
  carousel_id: string;
  slide_number: number;
  html_content: string;   // DB column name — never changes
  image_url: string | null;
  created_at: string;
}

export interface GeneratedCarousel {
  topic: string;
  caption: string;
  slides: GeneratedSlide[];
}

// Claude returns "html" (not "html_content") — mapped on save
export interface GeneratedSlide {
  slide_number: number;
  html: string;
}
