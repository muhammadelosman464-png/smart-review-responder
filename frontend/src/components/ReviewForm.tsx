"use client";

import React, { useState } from "react";
import { Send, Star, Loader2 } from "lucide-react";
import { ReviewFormData } from "@/lib/types";

interface ReviewFormProps {
  onSubmit: (data: ReviewFormData) => Promise<void>;
  isSubmitting: boolean;
}

export default function ReviewForm({ onSubmit, isSubmitting }: ReviewFormProps) {
  const [customerName, setCustomerName] = useState("");
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!customerName.trim()) {
      newErrors.customerName = "اسم العميل مطلوب";
    }
    if (rating === 0) {
      newErrors.rating = "يرجى اختيار التقييم";
    }
    if (!reviewText.trim()) {
      newErrors.reviewText = "نص المراجعة مطلوب";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    await onSubmit({
      customer_name: customerName.trim(),
      rating,
      review_text: reviewText.trim(),
    });

    // Reset form on success
    setCustomerName("");
    setRating(0);
    setReviewText("");
    setErrors({});
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Customer Name */}
      <div>
        <label
          htmlFor="customerName"
          className="block text-sm font-semibold text-gray-700 mb-1.5"
        >
          اسم العميل
        </label>
        <input
          id="customerName"
          type="text"
          value={customerName}
          onChange={(e) => {
            setCustomerName(e.target.value);
            if (errors.customerName) {
              setErrors((prev) => ({ ...prev, customerName: "" }));
            }
          }}
          placeholder="مثال: أحمد محمد"
          disabled={isSubmitting}
          className={`w-full px-4 py-2.5 rounded-lg border text-gray-900 placeholder-gray-400 
            focus:outline-none focus:ring-2 transition-colors duration-200
            ${
              errors.customerName
                ? "border-red-400 focus:ring-red-300"
                : "border-gray-300 focus:ring-blue-300 focus:border-blue-400"
            }
            disabled:bg-gray-100 disabled:cursor-not-allowed`}
        />
        {errors.customerName && (
          <p className="mt-1 text-sm text-red-500">{errors.customerName}</p>
        )}
      </div>

      {/* Star Rating */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          التقييم
        </label>
        <div className="flex gap-1" dir="ltr">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              disabled={isSubmitting}
              onClick={() => {
                setRating(star);
                if (errors.rating) {
                  setErrors((prev) => ({ ...prev, rating: "" }));
                }
              }}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              className="p-0.5 transition-transform duration-150 hover:scale-110 disabled:cursor-not-allowed"
              aria-label={`${star} نجوم`}
            >
              <Star
                size={28}
                className={`transition-colors duration-150 ${
                  star <= (hoverRating || rating)
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }`}
              />
            </button>
          ))}
        </div>
        {rating > 0 && (
          <p className="mt-1 text-sm text-gray-500">
            {rating}/5 نجوم
          </p>
        )}
        {errors.rating && (
          <p className="mt-1 text-sm text-red-500">{errors.rating}</p>
        )}
      </div>

      {/* Review Text */}
      <div>
        <label
          htmlFor="reviewText"
          className="block text-sm font-semibold text-gray-700 mb-1.5"
        >
          نص المراجعة
        </label>
        <textarea
          id="reviewText"
          value={reviewText}
          onChange={(e) => {
            setReviewText(e.target.value);
            if (errors.reviewText) {
              setErrors((prev) => ({ ...prev, reviewText: "" }));
            }
          }}
          placeholder="اكتب مراجعة العميل هنا..."
          rows={4}
          disabled={isSubmitting}
          className={`w-full px-4 py-2.5 rounded-lg border text-gray-900 placeholder-gray-400 resize-none
            focus:outline-none focus:ring-2 transition-colors duration-200
            ${
              errors.reviewText
                ? "border-red-400 focus:ring-red-300"
                : "border-gray-300 focus:ring-blue-300 focus:border-blue-400"
            }
            disabled:bg-gray-100 disabled:cursor-not-allowed`}
        />
        {errors.reviewText && (
          <p className="mt-1 text-sm text-red-500">{errors.reviewText}</p>
        )}
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold 
          rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400 
          focus:ring-offset-2 transition-all duration-200 disabled:bg-blue-400 disabled:cursor-not-allowed"
      >
        {isSubmitting ? (
          <>
            <Loader2 size={20} className="animate-spin" />
            جاري المعالجة...
          </>
        ) : (
          <>
            <Send size={20} />
            إرسال المراجعة
          </>
        )}
      </button>
    </form>
  );
}
