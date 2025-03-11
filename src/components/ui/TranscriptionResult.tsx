'use client'

import { useState } from 'react'
import { Copy, Download, Check, RefreshCw, BrainCircuit, Share2 } from 'lucide-react'
import { cn, copyToClipboard, downloadFile, shareContent } from '@/lib/utils'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface TranscriptionResultProps {
  transcription: string
  minutes?: string
  isLoading?: boolean
  onGenerateMinutes?: () => void
  className?: string
}

/**
 * 文字起こし結果と議事録を表示するコンポーネント
 */
export default function TranscriptionResult({
  transcription,
  minutes,
  isLoading = false,
  onGenerateMinutes,
  className,
}: TranscriptionResultProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')
  const [copyMinutesStatus, setCopyMinutesStatus] = useState<'idle' | 'copied'>('idle')
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared'>('idle')
  const [shareMinutesStatus, setShareMinutesStatus] = useState<'idle' | 'shared'>('idle')
  
  // クリップボードにコピー
  const handleCopy = async (text: string, setCopyFunc: (status: 'idle' | 'copied') => void) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopyFunc('copied')
      setTimeout(() => setCopyFunc('idle'), 2000)
    }
  }
  
  // ファイルとしてダウンロード
  const handleDownload = (content: string, type: 'transcription' | 'minutes') => {
    const today = format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: ja })
    const filename = type === 'transcription' 
      ? `文字起こし_${today}.txt` 
      : `議事録_${today}.txt`
    downloadFile(content, filename)
  }

  // 外部サービスで共有
  const handleShare = async (content: string, type: 'transcription' | 'minutes') => {
    const title = type === 'transcription' ? '文字起こし結果' : '議事録'
    const setShareFunc = type === 'transcription' ? setShareStatus : setShareMinutesStatus
    const success = await shareContent(content, title)
    if (success) {
      setShareFunc('shared')
      setTimeout(() => setShareFunc('idle'), 2000)
    }
  }
  
  // 内容があるかどうかを確認
  const hasContent = transcription && transcription.trim().length > 0
  const hasMinutes = minutes && minutes.trim().length > 0
  
  return (
    <div className={cn('space-y-6', className)}>
      {/* 文字起こし結果 */}
      {hasContent && (
        <div className="bg-white border rounded-lg p-4 shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">文字起こし結果</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(transcription, setCopyStatus)}
                className="p-2 rounded hover:bg-gray-100 transition-colors"
                aria-label="クリップボードにコピー"
              >
                {copyStatus === 'copied' ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-500" />
                )}
              </button>
              <button
                onClick={() => handleDownload(transcription, 'transcription')}
                className="p-2 rounded hover:bg-gray-100 transition-colors"
                aria-label="ファイルをダウンロード"
              >
                <Download className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={() => handleShare(transcription, 'transcription')}
                className="p-2 rounded hover:bg-gray-100 transition-colors"
                aria-label="外部サービスで共有"
              >
                {shareStatus === 'shared' ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Share2 className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>
          <div className="border p-3 rounded bg-gray-50 whitespace-pre-wrap">
            {transcription}
          </div>
        </div>
      )}
      
      {/* 議事録生成ボタン */}
      {hasContent && !hasMinutes && !isLoading && onGenerateMinutes && (
        <div className="flex justify-center">
          <button
            onClick={onGenerateMinutes}
            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition-colors"
          >
            <BrainCircuit className="w-5 h-5" />
            議事録を生成する
          </button>
        </div>
      )}
      
      {/* 議事録読み込み中 */}
      {isLoading && (
        <div className="flex justify-center items-center p-4 text-blue-600">
          <BrainCircuit className="w-6 h-6 animate-pulse mr-2" />
          <span>Gemini APIで議事録を生成中...</span>
        </div>
      )}
      
      {/* 議事録結果 */}
      {hasMinutes && (
        <div className="bg-white border rounded-lg p-4 shadow">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">議事録</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(minutes, setCopyMinutesStatus)}
                className="p-2 rounded hover:bg-gray-100 transition-colors"
                aria-label="クリップボードにコピー"
              >
                {copyMinutesStatus === 'copied' ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Copy className="w-5 h-5 text-gray-500" />
                )}
              </button>
              <button
                onClick={() => handleDownload(minutes, 'minutes')}
                className="p-2 rounded hover:bg-gray-100 transition-colors"
                aria-label="ファイルをダウンロード"
              >
                <Download className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={() => handleShare(minutes, 'minutes')}
                className="p-2 rounded hover:bg-gray-100 transition-colors"
                aria-label="外部サービスで共有"
              >
                {shareMinutesStatus === 'shared' ? (
                  <Check className="w-5 h-5 text-green-500" />
                ) : (
                  <Share2 className="w-5 h-5 text-gray-500" />
                )}
              </button>
            </div>
          </div>
          <div className="border p-3 rounded bg-gray-50 whitespace-pre-wrap">
            {minutes}
          </div>
        </div>
      )}
      
      {/* コンテンツがない場合 */}
      {!hasContent && !isLoading && (
        <div className="text-center text-gray-500 py-4">
          音声を録音すると、ここに文字起こし結果が表示されます。
        </div>
      )}
    </div>
  )
} 