/**
 * Type definitions for the Smart Review Responder
 */

export interface Review {
  id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  ai_reply: string;
  status: "positive" | "negative";
  created_at: string;
}

export interface ReviewFormData {
  customer_name: string;
  rating: number;
  review_text: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
  data?: Record<string, unknown>;
}
