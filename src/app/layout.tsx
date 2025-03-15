import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// フォントの最適化: 必要最小限のウェイトのみをロード
const inter = Inter({ 
  subsets: ["latin"],
  display: 'swap',
  preload: true,
  weight: ['400', '600'], // 必要なウェイトのみを指定
  variable: '--font-inter',
  fallback: ['system-ui', 'arial'], // フォールバックフォントを指定
  adjustFontFallback: true, // フォントフォールバックの自動調整
});

// メタデータの拡張（パフォーマンス最適化）
export const metadata: Metadata = {
  title: "しゃべりを校正くん",
  description: "音声録音から文字起こし・校正まで、ワンクリックでできるシンプルなアプリ",
  keywords: ["音声認識", "文字起こし", "校正", "AI", "Gemini API"],
  other: {
    'darkreader-lock': 'true', // DarkReaderの自動適用を防止
  },
  themeColor: '#ffffff',
};

// ビューポート設定の最適化
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#ffffff',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html 
      lang="ja" 
      className={inter.variable}
      style={{ colorScheme: 'light' }} // ダークモード切り替え時のちらつきを防止
    >
      <body className="bg-gray-50 antialiased">{children}</body>
    </html>
  );
}
