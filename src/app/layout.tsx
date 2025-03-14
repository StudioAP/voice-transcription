import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// フォントの最適化: サブセットを限定し、表示スワップを有効化
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  weight: ['400', '600'],
  variable: '--font-inter',
});

// メタデータの拡張
export const metadata: Metadata = {
  title: "しゃべりを校正くん",
  description: "音声録音から文字起こし・校正まで、ワンクリックでできるシンプルなアプリ",
  keywords: ["音声認識", "文字起こし", "校正", "AI", "Gemini API"],
};

// ビューポート設定の最適化
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={inter.variable}>
      <body className="bg-gray-50">{children}</body>
    </html>
  );
}
