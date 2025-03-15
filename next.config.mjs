/** @type {import('next').NextConfig} */

import withBundleAnalyzer from '@next/bundle-analyzer'

const nextConfig = {
  // 本番環境での最適化
  productionBrowserSourceMaps: false, // ソースマップを無効化
  compress: true, // 圧縮を有効化
  poweredByHeader: false, // X-Powered-By ヘッダーを無効化
  
  // 画像最適化
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 48, 64, 96],
  },
  
  // キャッシュの最適化
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // 1時間
    pagesBufferLength: 5,
  },
  
  // 実験的機能の制御
  experimental: {
    optimizeCss: {
      enabled: true,
      cssModules: true,
    },
  },
  
  // ビルド設定
  swcMinify: true, // SWCミニファイを使用
  reactStrictMode: true,
  
  // 環境変数の型チェック
  env: {
    NEXT_PUBLIC_GEMINI_API_KEY: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    NEXT_PUBLIC_GEMINI_MODEL: process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-pro',
  },
  
  // webpack設定のカスタマイズ
  webpack: (config, { dev, isServer }) => {
    // 本番環境でのみ最適化を適用
    if (!dev && !isServer) {
      // モジュールの最適化
      config.optimization.moduleIds = 'deterministic'
      config.optimization.runtimeChunk = 'single'
      config.optimization.splitChunks = {
        chunks: 'all',
        maxInitialRequests: 25,
        minSize: 20000,
        cacheGroups: {
          default: false,
          vendors: false,
          // ベンダーチャンクの最適化
          vendor: {
            name: 'vendor',
            chunks: 'all',
            test: /[\\/]node_modules[\\/]/,
            priority: 20,
          },
          // 共通チャンクの最適化
          common: {
            name: 'common',
            minChunks: 2,
            chunks: 'all',
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      }
    }
    return config
  },
}

// バンドルアナライザーを開発環境でのみ有効化
const withBundleAnalyzerConfig = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

export default process.env.ANALYZE === 'true' 
  ? withBundleAnalyzerConfig(nextConfig)
  : nextConfig
