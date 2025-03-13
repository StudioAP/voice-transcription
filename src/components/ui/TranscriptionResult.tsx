'use client'

import { useState, useEffect, useRef } from 'react'
import { Copy, Download, Check, RefreshCw, BrainCircuit, Share2, ClipboardCopy } from 'lucide-react'
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
 * 文字起こし結果と校正テキストを表示するコンポーネント
 */
export default function TranscriptionResult({
  transcription,
  minutes: correctedText,
  isLoading = false,
  onGenerateMinutes: onCorrectText,
  className,
}: TranscriptionResultProps) {
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copied'>('idle')
  const [copyMinutesStatus, setCopyMinutesStatus] = useState<'idle' | 'copied'>('idle')
  const [shareStatus, setShareStatus] = useState<'idle' | 'shared'>('idle')
  const [shareMinutesStatus, setShareMinutesStatus] = useState<'idle' | 'shared'>('idle')
  const [editableCorrectedText, setEditableCorrectedText] = useState<string>('')
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  
  // 校正テキストが更新されたら、編集可能なテキストも更新して、クリップボードにコピー
  useEffect(() => {
    if (correctedText && correctedText.trim().length > 0) {
      setEditableCorrectedText(correctedText)
      handleCopyWithNotification(correctedText)
    }
  }, [correctedText])

  // 通知付きでクリップボードにコピー
  const handleCopyWithNotification = async (text: string) => {
    if (!text) return
    
    const success = await copyToClipboard(text)
    if (success) {
      setShowCopyNotification(true)
      setTimeout(() => setShowCopyNotification(false), 3000)
    }
  }
  
  // クリップボードにコピー
  const handleCopy = async (text: string, setCopyFunc: (status: 'idle' | 'copied') => void) => {
    const success = await copyToClipboard(text)
    if (success) {
      setCopyFunc('copied')
      setTimeout(() => setCopyFunc('idle'), 2000)
    }
  }
  
  // ファイルとしてダウンロード
  const handleDownload = (content: string, type: 'transcription' | 'corrected') => {
    const today = format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: ja })
    const filename = type === 'transcription' 
      ? `文字起こし_${today}.txt` 
      : `校正済み_${today}.txt`
    downloadFile(content, filename)
  }

  // 外部サービスで共有
  const handleShare = async (content: string, type: 'transcription' | 'corrected') => {
    const title = type === 'transcription' ? '文字起こし結果' : '校正済みテキスト'
    const setShareFunc = type === 'transcription' ? setShareStatus : setShareMinutesStatus
    const success = await shareContent(content, title)
    if (success) {
      setShareFunc('shared')
      setTimeout(() => setShareFunc('idle'), 2000)
    }
  }

  // テキストエリアの変更処理
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value
    setEditableCorrectedText(newText)
    handleCopyWithNotification(newText)
  }
  
  // 内容があるかどうかを確認
  const hasContent = transcription && transcription.trim().length > 0
  const hasCorrectedText = correctedText && correctedText.trim().length > 0
  
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
      
      {/* テキスト校正中 */}
      {isLoading && (
        <div className="flex justify-center items-center p-4 text-blue-600">
          <BrainCircuit className="w-6 h-6 animate-pulse mr-2" />
          <span>Gemini APIでテキストを校正中...</span>
        </div>
      )}
      
      {/* 校正テキスト結果（編集可能） */}
      {hasCorrectedText && (
        <div className="bg-white border rounded-lg p-4 shadow relative">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">校正済みテキスト（編集可能）</h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleCopy(editableCorrectedText, setCopyMinutesStatus)}
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
                onClick={() => handleDownload(editableCorrectedText, 'corrected')}
                className="p-2 rounded hover:bg-gray-100 transition-colors"
                aria-label="ファイルをダウンロード"
              >
                <Download className="w-5 h-5 text-gray-500" />
              </button>
              <button
                onClick={() => handleShare(editableCorrectedText, 'corrected')}
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

          {/* 編集可能なテキストエリア */}
          <textarea
            ref={textareaRef}
            value={editableCorrectedText}
            onChange={handleTextAreaChange}
            className="w-full min-h-[200px] border p-3 rounded bg-gray-50 whitespace-pre-wrap resize-y focus:ring-2 focus:ring-blue-300 focus:outline-none"
          />
          
          {/* コピー通知 */}
          {showCopyNotification && (
            <div className="absolute bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-md shadow-lg flex items-center">
              <ClipboardCopy className="w-4 h-4 mr-2" />
              <span>コピーしました！</span>
            </div>
          )}
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