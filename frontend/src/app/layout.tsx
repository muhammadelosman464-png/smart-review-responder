import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Review Responder | لوحة التحكم",
  description: "نظام ذكي للرد على مراجعات العملاء باستخدام الذكاء الاصطناعي",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased bg-gray-100 min-h-screen">{children}</body>
    </html>
  );
}
