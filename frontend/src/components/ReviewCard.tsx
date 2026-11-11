"use client";

import React, { useState } from "react";
import {
  Star,
  Copy,
  Check,
  AlertTriangle,
  User,
  MessageSquareText,
  Bot,
  Clock,
} from "lucide-react";
import { Review } from "@/lib/types";

interface ReviewCardProps {
  review: Review;
}

export default function ReviewCard({ review }: ReviewCardProps) {
  const [copied, setCopied] = useState(false);

  const isNegative = review.status === "negative";

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(review.ai_reply);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = review.ai_reply;
      textArea.style.position = "fixed";
      textArea.style.left = "-9999px";
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand("copy");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        alert("فشل في نسخ النص. يرجى النسخ يدوياً.");
      }
      document.body.removeChild(textArea);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("ar-SA", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div
      className={`rounded-xl border-2 bg-white shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden
        ${
          isNegative
            ? "border-red-300 hover:border-red-400"
            : "border-green-300 hover:border-green-400"
        }`}
    >
      {/* Header */}
      <div
        className={`px-5 py-3 flex items-center justify-between
          ${isNegative ? "bg-red-50" : "bg-green-50"}`}
      >
        <div className="flex items-center gap-2">
          <div
            className={`p-1.5 rounded-full ${
              isNegative ? "bg-red-100" : "bg-green-100"
            }`}
          >
            <User
              size={16}
              className={isNegative ? "text-red-600" : "text-green-600"}
            />
          </div>
          <span className="font-bold text-gray-800">
            {review.customer_name}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Star Rating */}
          <div className="flex gap-0.5" dir="ltr">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                size={16}
                className={
                  star <= review.rating
                    ? "text-yellow-400 fill-yellow-400"
                    : "text-gray-300"
                }
              />
            ))}
          </div>

          {/* Warning Badge for Negative */}
          {isNegative && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
              <AlertTriangle size={12} />
              ⚠️ تنبيه: عميل غاضب
            </span>
          )}

          {!isNegative && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
              ✅ عميل راضي
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        {/* Customer Review */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <MessageSquareText size={14} className="text-gray-400" />
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              مراجعة العميل
            </span>
          </div>
          <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-lg p-3">
            {review.review_text}
          </p>
        </div>

        {/* AI Reply */}
        <div>
          <div className="flex items-center gap-1.5 mb-1.5">
            <Bot size={14} className="text-blue-400" />
            <span className="text-xs font-semibold text-blue-500 uppercase tracking-wide">
              رد الذكاء الاصطناعي
            </span>
          </div>
          <p
            className={`text-sm leading-relaxed rounded-lg p-3 ${
              isNegative ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"
            }`}
          >
            {review.ai_reply}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs text-gray-400">
          <Clock size={12} />
          {formatDate(review.created_at)}
        </div>

        <button
          onClick={handleCopy}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium
            transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-1
            ${
              copied
                ? "bg-green-100 text-green-700 focus:ring-green-300"
                : "bg-blue-100 text-blue-700 hover:bg-blue-200 focus:ring-blue-300"
            }`}
        >
          {copied ? (
            <>
              <Check size={14} />
              تم النسخ!
            </>
          ) : (
            <>
              <Copy size={14} />
              نسخ الرد
            </>
          )}
        </button>
      </div>
    </div>
  );
}
