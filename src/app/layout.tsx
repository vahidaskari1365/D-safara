import type { Metadata, Viewport } from "next";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/500.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/800.css";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: {
    default: "دی‌صفارا | آکادمی تخصصی آموزش ترید و بازارهای مالی",
    template: "%s | دی‌صفارا",
  },
  description:
    "دی‌صفارا (D.Safara) پلتفرم جامع آموزش ترید، تحلیل تکنیکال و مدیریت سرمایه با منتورهای حرفه‌ای، ورک‌اسپیس معاملاتی، ژورنال معاملات و مسیرهای یادگیری ساختاریافته برای رسیدن به معامله‌گری حرفه‌ای.",
  keywords: [
    "آموزش ترید",
    "آموزش فارکس",
    "تحلیل تکنیکال",
    "مدیریت سرمایه",
    "آکادمی معاملهگری",
    "دی صفارا",
    "D.Safara",
    "تریدینگ ویو",
    "آموزش کریپتو",
    "منتور معاملهگری",
  ],
  authors: [{ name: "D.Safara" }],
  creator: "D.Safara",
  publisher: "D.Safara",
  formatDetection: { telephone: false },
  openGraph: {
    title: "دی‌صفارا | آکادمی تخصصی آموزش ترید و بازارهای مالی",
    description:
      "پلتفرم جامع آموزش ترید با منتورهای حرفه‌ای، ورک‌اسپیس معاملاتی و مسیرهای یادگیری ساختاریافته",
    siteName: "D.Safara",
    locale: "fa_IR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "دی‌صفارا | آکادمی تخصصی آموزش ترید",
    description: "پلتفرم جامع آموزش ترید و بازارهای مالی با منتورینگ حرفه‌ای",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
};

export const viewport: Viewport = {
  themeColor: "#101827",
  width: "device-width",
  initialScale: 1,
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "EducationalOrganization",
  name: "D.Safara | دی‌صفارا",
  alternateName: "دی صفارا",
  description: "آکادمی تخصصی آموزش ترید و بازارهای مالی با منتورینگ حرفه‌ای",
  url: "https://dsafara.com",
  logo: "https://dsafara.com/logo.png",
  sameAs: ["https://instagram.com/dsafara", "https://t.me/dsafara", "https://youtube.com/@dsafara"],
  address: { "@type": "PostalAddress", addressCountry: "IR", addressLocality: "تهران" },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="font-sans antialiased" style={{ fontFamily: "Vazirmatn, sans-serif" }}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Toaster />
      </body>
    </html>
  );
}
