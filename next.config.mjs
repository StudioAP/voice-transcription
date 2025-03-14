/** @type {import('next').NextConfig} */
const nextConfig = {
  // 本番環境最適化
  reactStrictMode: true,
  swcMinify: true,
  
  // 環境変数の設定
  env: {
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    NEXT_PUBLIC_GEMINI_MODEL: process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash-lite'
  },
  
  // エラー出力を詳細に
  onDemandEntries: {
    // ページをメモリに保持する時間
    maxInactiveAge: 25 * 1000,
    // 同時に保持するページ数
    pagesBufferLength: 2,
  },
  
  // パフォーマンス最適化
  poweredByHeader: false
};

export default nextConfig;
