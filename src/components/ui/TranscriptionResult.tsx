'use client'

import { useState, useRef, useEffect } from 'react'
import { Copy, Download, Share2, MessageSquare, Sparkles, Check } from 'lucide-react'
import { cn, copyToClipboard, downloadFile, shareContent } from '@/lib/utils'
import { format } from 'date-fns'
import { ja } from 'date-fns/locale'

interface TranscriptionResultProps {
  transcription: string
  correctedText: string
  isLoading?: boolean
  className?: string
}

/**
 * 文字起こし結果と校正テキストを表示するコンポーネント
 */
export default function TranscriptionResult({
  transcription,
  correctedText,
  isLoading = false,
  className,
}: TranscriptionResultProps) {
  const [editableTexts, setEditableTexts] = useState({
    transcription: transcription || '',
    corrected: correctedText || ''
  })
  
  const [copyStatus, setCopyStatus] = useState({
    transcription: false,
    corrected: false
  })
  
  const [showCopyNotification, setShowCopyNotification] = useState(false)
  
  // 各種テキストエリアへの参照
  const textareaRefs = {
    transcription: useRef<HTMLTextAreaElement>(null),
    corrected: useRef<HTMLTextAreaElement>(null)
  }
  
  // props更新時にstate更新
  if (transcription !== editableTexts.transcription) {
    setEditableTexts(prev => ({ ...prev, transcription }))
  }
  
  // correctedText更新時の処理（stateの更新と自動コピー）
  useEffect(() => {
    if (correctedText && correctedText !== editableTexts.corrected) {
      setEditableTexts(prev => ({ ...prev, corrected: correctedText }))
      
      // 校正テキストが更新され、空でない場合に自動コピー
      if (correctedText.trim()) {
        const performCopy = async () => {
          const success = await copyToClipboard(correctedText)
          if (success) {
            // コピー成功通知を表示
            setCopyStatus(prev => ({ ...prev, corrected: true }))
            setShowCopyNotification(true)
            
            // 3秒後に通知を非表示
            setTimeout(() => {
              setCopyStatus(prev => ({ ...prev, corrected: false }))
              setShowCopyNotification(false)
            }, 3000)
          }
        }
        
        performCopy()
      }
    }
  }, [correctedText])
  
  // クリップボードにコピー
  const handleCopy = async (type: 'transcription' | 'corrected') => {
    const text = editableTexts[type]
    if (!text) return
    
    const success = await copyToClipboard(text)
    if (success) {
      setCopyStatus(prev => ({ ...prev, [type]: true }))
      
      if (type === 'corrected') {
        setShowCopyNotification(true)
      }
      
      setTimeout(() => {
        setCopyStatus(prev => ({ ...prev, [type]: false }))
        if (type === 'corrected') {
          setShowCopyNotification(false)
        }
      }, 2000)
    }
  }
  
  // ファイルとしてダウンロード
  const handleDownload = (type: 'transcription' | 'corrected') => {
    const content = editableTexts[type]
    if (!content) return
    
    const today = format(new Date(), 'yyyy-MM-dd_HH-mm', { locale: ja })
    let filename = ''
    
    switch (type) {
      case 'transcription':
        filename = `文字起こし_${today}.txt`
        break
      case 'corrected':
        filename = `校正済み_${today}.txt`
        break
    }
    
    downloadFile(content, filename)
  }

  // 外部サービスで共有
  const handleShare = async (type: 'transcription' | 'corrected') => {
    const content = editableTexts[type]
    if (!content) return
    
    let title = ''
    
    switch (type) {
      case 'transcription':
        title = '文字起こし結果'
        break
      case 'corrected':
        title = '校正済みテキスト'
        break
    }
    
    await shareContent(content, title)
  }

  // テキストエリアの変更処理
  const handleTextAreaChange = (e: React.ChangeEvent<HTMLTextAreaElement>, type: 'transcription' | 'corrected') => {
    const newText = e.target.value
    setEditableTexts(prev => ({
      ...prev,
      [type]: newText
    }))
  }
  
  // テキストが利用可能かどうかを確認
  const hasContent = transcription && transcription.trim().length > 0
  
  // テキストエリアの最適化されたサイズを計算
  const getTextareaHeight = () => {
    // モバイルでは小さめに、デスクトップでは少し大きめに
    return 'min-h-[150px] max-h-[200px]'
  }
  
  // テキストカード表示
  const renderTextCard = (type: 'transcription' | 'corrected') => {
    let title = '', icon = null, bgColor = ''
    
    switch (type) {
      case 'transcription':
        title = '文字起こし'
        icon = <MessageSquare className="w-3.5 h-3.5 text-blue-500" />
        bgColor = 'bg-blue-50'
        break
      case 'corrected':
        title = '校正済み'
        icon = <Sparkles className="w-3.5 h-3.5 text-amber-500" />
        bgColor = 'bg-amber-50'
        break
    }
    
    return (
      <div className="bg-white border rounded-lg shadow-sm p-1.5 flex flex-col h-full">
        <div className="flex justify-between items-center mb-1">
          <h3 className="text-xs font-semibold flex items-center gap-1">
            {icon}
            <span>{title}</span>
          </h3>
          <div className="flex gap-0.5">
            <button
              onClick={() => handleCopy(type)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              aria-label="クリップボードにコピー"
              title="クリップボードにコピー"
            >
              {copyStatus[type] ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-gray-500" />
              )}
            </button>
            <button
              onClick={() => handleDownload(type)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              aria-label="ファイルをダウンロード"
              title="ファイルをダウンロード"
            >
              <Download className="w-3.5 h-3.5 text-gray-500" />
            </button>
            <button
              onClick={() => handleShare(type)}
              className="p-1 rounded hover:bg-gray-100 transition-colors"
              aria-label="外部サービスで共有"
              title="外部サービスで共有"
            >
              <Share2 className="w-3.5 h-3.5 text-gray-500" />
            </button>
          </div>
        </div>

        <textarea
          ref={textareaRefs[type]}
          value={editableTexts[type]}
          onChange={(e) => handleTextAreaChange(e, type)}
          className={`flex-grow w-full ${getTextareaHeight()} border p-1.5 rounded text-xs ${bgColor} whitespace-pre-wrap resize-none focus:ring-1 focus:ring-blue-300 focus:outline-none`}
          placeholder={`${title}結果がここに表示されます`}
        />
      </div>
    )
  }
  
  return (
    <div className={cn('space-y-1.5 relative', className)}>
      {/* コピー通知 */}
      {showCopyNotification && (
        <div className="fixed bottom-20 left-0 right-0 flex justify-center z-50">
          <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-2 rounded-md shadow-md flex items-center">
            <Check className="w-4 h-4 mr-2" />
            校正済みをコピーしました！
          </div>
        </div>
      )}
      
      {/* 最初の案内 */}
      {!hasContent && !isLoading && (
        <div className="text-center text-gray-500 py-3 mb-20">
          <span className="text-sm">画面下部の録音ボタンをタップしてください</span>
        </div>
      )}
      
      {hasContent && !isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pb-2">
          {renderTextCard('transcription')}
          {renderTextCard('corrected')}
        </div>
      )}
      
      {/* ロード中表示 */}
      {isLoading && (
        <div className="text-center text-gray-500 py-3 mb-20">
          <span className="flex items-center justify-center text-blue-500 text-sm">
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            テキスト処理中...
          </span>
        </div>
      )}
    </div>
  )
} 