"use client";

import React, { useState, useEffect, useCallback } from "react";
import { createClient } from "@supabase/supabase-js";

// ── Supabase client (anon / read-only) ──────────────────────
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ────────────────────────────────────────────────────
interface Review {
  id: string;
  customer_name: string;
  rating: number;
  review_text: string;
  ai_reply: string;
  status: "positive" | "negative";
  created_at: string;
}

// ── Toast system ─────────────────────────────────────────────
let toastId = 0;
interface Toast { id: number; msg: string; type: "ok" | "err" | "info" }

function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = useCallback((msg: string, type: Toast["type"] = "info") => {
    const id = ++toastId;
    setToasts((p) => [...p, { id, msg, type }]);
    setTimeout(() => setToasts((p) => p.filter((t) => t.id !== id)), 4000);
  }, []);
  return { toasts, push };
}

// ══════════════════════════════════════════════════════════════
// Dashboard
// ══════════════════════════════════════════════════════════════
export default function Dashboard() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const { toasts, push } = useToast();

  // ── form state ──
  const [name, setName] = useState("");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState("");

  // ── fetch reviews ──
  const fetchReviews = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("customer_reviews")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReviews((data as Review[]) || []);
    } catch {
      push("فشل تحميل المراجعات", "err");
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => { fetchReviews(); }, [fetchReviews]);
  useEffect(() => {
    const iv = setInterval(fetchReviews, 15000);
    return () => clearInterval(iv);
  }, [fetchReviews]);

  // ── submit review ──
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { push("اسم العميل مطلوب", "err"); return; }
    if (rating === 0) { push("يرجى اختيار التقييم", "err"); return; }
    if (!text.trim()) { push("نص المراجعة مطلوب", "err"); return; }

    setSubmitting(true);
    try {
      const res = await fetch("/api/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name.trim(),
          rating,
          review_text: text.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || "خطأ");
      push("✅ تم معالجة المراجعة بنجاح!", "ok");
      setName(""); setRating(0); setText("");
      await fetchReviews();
    } catch (err) {
      push(err instanceof Error ? err.message : "حدث خطأ", "err");
    } finally {
      setSubmitting(false);
    }
  };

  // ── stats ──
  const pos = reviews.filter((r) => r.status === "positive").length;
  const neg = reviews.filter((r) => r.status === "negative").length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50" dir="rtl">
      {/* ── Toasts ── */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-full max-w-sm px-4">
        {toasts.map((t) => (
          <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all
            ${t.type === "ok" ? "bg-green-600" : t.type === "err" ? "bg-red-600" : "bg-blue-600"}`}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* ── Header ── */}
      <header className="bg-white/80 backdrop-blur border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl shadow-lg shadow-blue-200">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                <path d="M14 9.5a1 1 0 1 1-2 0 1 1 0 0 1 2 0z" fill="currentColor"/>
                <path d="M8.5 9.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" fill="currentColor"/>
                <path d="M15.5 9.5a.5.5 0 1 0 0-1 .5.5 0 0 0 0 1z" fill="currentColor"/>
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Smart Review Responder</h1>
              <p className="text-xs text-gray-500">نظام الرد الذكي على مراجعات العملاء</p>
            </div>
          </div>
          <button onClick={() => { fetchReviews(); push("تم التحديث", "info"); }}
            className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition">
            🔄 تحديث
          </button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ── Stats ── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <StatCard icon="📊" value={reviews.length} label="إجمالي المراجعات" color="blue" />
          <StatCard icon="👍" value={pos} label="مراجعات إيجابية" color="green" />
          <StatCard icon="👎" value={neg} label="مراجعات سلبية" color="red" />
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* ── Sidebar form ── */}
          <aside className="w-full lg:w-96 flex-shrink-0">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-bold text-gray-900 mb-1">إضافة مراجعة جديدة</h2>
              <p className="text-sm text-gray-500 mb-5">أدخل بيانات العميل للحصول على رد ذكي</p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Name */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">اسم العميل</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} disabled={submitting}
                    placeholder="مثال: أحمد محمد"
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400
                      focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 disabled:bg-gray-100" />
                </div>

                {/* Stars */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">التقييم</label>
                  <div className="flex gap-1" dir="ltr">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button key={s} type="button" disabled={submitting}
                        onClick={() => setRating(s)}
                        onMouseEnter={() => setHover(s)}
                        onMouseLeave={() => setHover(0)}
                        className="p-0.5 transition-transform hover:scale-110 disabled:cursor-not-allowed">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-7 h-7 transition-colors"
                          fill={s <= (hover || rating) ? "#facc15" : "none"}
                          stroke={s <= (hover || rating) ? "#facc15" : "#d1d5db"}
                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                        </svg>
                      </button>
                    ))}
                  </div>
                  {rating > 0 && <p className="mt-1 text-sm text-gray-500">{rating}/5 نجوم</p>}
                </div>

                {/* Text */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">نص المراجعة</label>
                  <textarea value={text} onChange={(e) => setText(e.target.value)} disabled={submitting}
                    placeholder="اكتب مراجعة العميل هنا..." rows={4}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-300 text-gray-900 placeholder-gray-400 resize-none
                      focus:outline-none focus:ring-2 focus:ring-blue-300 focus:border-blue-400 disabled:bg-gray-100" />
                </div>

                {/* Submit */}
                <button type="submit" disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold
                    rounded-lg shadow-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400
                    focus:ring-offset-2 transition disabled:bg-blue-400 disabled:cursor-not-allowed">
                  {submitting ? (
                    <><svg className="animate-spin w-5 h-5" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                    </svg> جاري المعالجة...</>
                  ) : "📤 إرسال المراجعة"}
                </button>
              </form>
            </div>
          </aside>

          {/* ── Reviews Grid ── */}
          <section className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-900">سجل المراجعات</h2>
              <span className="text-sm text-gray-500">{reviews.length} مراجعة</span>
            </div>

            {loading ? (
              <div className="flex flex-col items-center py-20">
                <svg className="animate-spin w-8 h-8 text-blue-500 mb-3" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"/>
                </svg>
                <p className="text-gray-500">جاري تحميل المراجعات...</p>
              </div>
            ) : reviews.length === 0 ? (
              <div className="flex flex-col items-center py-20 bg-white rounded-xl border border-gray-200">
                <span className="text-5xl mb-3">📭</span>
                <p className="text-gray-500 font-medium">لا توجد مراجعات بعد</p>
                <p className="text-sm text-gray-400 mt-1">أضف أول مراجعة من النموذج</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reviews.map((r) => <ReviewCard key={r.id} review={r} onCopied={() => push("تم نسخ الرد!", "ok")} />)}
              </div>
            )}
          </section>
        </div>
      </main>

      <footer className="mt-12 py-6 border-t border-gray-200 bg-white/50">
        <p className="text-center text-sm text-gray-400">Smart Review Responder &copy; 2026 — Powered by Gemini AI</p>
      </footer>
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────
function StatCard({ icon, value, label, color }: { icon: string; value: number; label: string; color: string }) {
  const bg = color === "green" ? "bg-green-100" : color === "red" ? "bg-red-100" : "bg-blue-100";
  const txt = color === "green" ? "text-green-600" : color === "red" ? "text-red-600" : "text-gray-900";
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-3 shadow-sm">
      <div className={`p-2 ${bg} rounded-lg text-xl`}>{icon}</div>
      <div>
        <p className={`text-2xl font-bold ${txt}`}>{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

// ── Review Card ──────────────────────────────────────────────
function ReviewCard({ review, onCopied }: { review: Review; onCopied: () => void }) {
  const [copied, setCopied] = useState(false);
  const neg = review.status === "negative";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(review.ai_reply);
    } catch {
      const ta = document.createElement("textarea");
      ta.value = review.ai_reply;
      ta.style.position = "fixed";
      ta.style.left = "-9999px";
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
    }
    setCopied(true);
    onCopied();
    setTimeout(() => setCopied(false), 2000);
  };

  const date = (() => {
    try {
      return new Date(review.created_at).toLocaleDateString("ar-SA", {
        year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
      });
    } catch { return review.created_at; }
  })();

  return (
    <div className={`rounded-xl border-2 bg-white shadow-sm hover:shadow-md transition overflow-hidden
      ${neg ? "border-red-300 hover:border-red-400" : "border-green-300 hover:border-green-400"}`}>
      {/* Header */}
      <div className={`px-5 py-3 flex items-center justify-between ${neg ? "bg-red-50" : "bg-green-50"}`}>
        <div className="flex items-center gap-2">
          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white
            ${neg ? "bg-red-500" : "bg-green-500"}`}>
            {review.customer_name.charAt(0)}
          </span>
          <span className="font-bold text-gray-800">{review.customer_name}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-0.5" dir="ltr">
            {[1, 2, 3, 4, 5].map((s) => (
              <svg key={s} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-4 h-4"
                fill={s <= review.rating ? "#facc15" : "none"}
                stroke={s <= review.rating ? "#facc15" : "#d1d5db"} strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            ))}
          </div>
          {neg ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
              ⚠️ تنبيه: عميل غاضب
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
              ✅ عميل راضي
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="px-5 py-4 space-y-4">
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1">💬 مراجعة العميل</p>
          <p className="text-gray-700 text-sm leading-relaxed bg-gray-50 rounded-lg p-3">{review.review_text}</p>
        </div>
        <div>
          <p className="text-xs font-semibold text-blue-500 mb-1">🤖 رد الذكاء الاصطناعي</p>
          <p className={`text-sm leading-relaxed rounded-lg p-3 ${neg ? "bg-red-50 text-red-800" : "bg-green-50 text-green-800"}`}>
            {review.ai_reply}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
        <span className="text-xs text-gray-400">🕐 {date}</span>
        <button onClick={copy}
          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition
            ${copied ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700 hover:bg-blue-200"}`}>
          {copied ? "✅ تم النسخ!" : "📋 نسخ الرد"}
        </button>
      </div>
    </div>
  );
}
