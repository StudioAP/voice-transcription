'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { InfoIcon, BrainCircuit, AlertCircle } from 'lucide-react'
import AudioRecorder from '@/components/recorder/AudioRecorder'
import TranscriptionResult from '@/components/ui/TranscriptionResult'
import { transcribeAudio, correctTranscription, removeFillerSounds } from '@/lib/llm'

// 音声プレイヤーコンポーネントを遅延ロード
const AudioPlayer = lazy(() => import('@/components/ui/AudioPlayer'))

/**
 * 音声文字起こしアプリ
 * 音声を録音して文字起こしと校正を行います
 */
export default function Home() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcription, setTranscription] = useState<string>('')
  const [fillerRemovedText, setFillerRemovedText] = useState<string>('')
  const [correctedText, setCorrectedText] = useState<string>('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [apiKeyError, setApiKeyError] = useState<boolean>(false)
  const [showGuide, setShowGuide] = useState<boolean>(true)
  
  // API Keyのチェック - 初回レンダリング時のみ実行
  useEffect(() => {
    // APIキーが設定されているか確認（処理を最小限に）
    if (!process.env.NEXT_PUBLIC_GEMINI_API_KEY) {
      setApiKeyError(true)
    }
  }, [])
  
  /**
   * 録音完了時のハンドラー
   * 録音データを文字起こしします
   */
  const handleRecordingComplete = async (audioBlob: Blob) => {
    if (!audioBlob || audioBlob.size === 0) {
      setErrorMessage('有効な音声データがありません。もう一度録音してください。')
      return
    }
    
    // 音声URLを作成
    const url = URL.createObjectURL(audioBlob)
    setAudioUrl(url)
    setErrorMessage(null)
    
    // 文字起こし処理を開始
    setIsTranscribing(true)
    setTranscription('') // 結果をリセット
    setFillerRemovedText('') // フィラー除去テキストもリセット
    setCorrectedText('') // 校正テキストもリセット
    
    try {
      if (apiKeyError) {
        throw new Error('Gemini APIキーが設定されていません。Render環境変数を確認してください。')
      }
      
      // 文字起こし実行
      const text = await transcribeAudio(audioBlob)
      setTranscription(text)
      
      // テキスト処理を開始
      if (text) {
        setIsProcessing(true)
        
        try {
          // 並行して処理を実行
          const [fillerRemoved, corrected] = await Promise.all([
            removeFillerSounds(text),
            correctTranscription(text, 0)
          ])
          
          setFillerRemovedText(fillerRemoved)
          setCorrectedText(corrected)
        } catch (error) {
          console.error('テキスト処理に失敗しました:', error)
          const errorMsg = error instanceof Error ? error.message : 'テキスト処理に失敗しました'
          setErrorMessage(errorMsg)
        } finally {
          setIsProcessing(false)
        }
      }
    } catch (error) {
      console.error('文字起こしに失敗しました:', error)
      const errorMsg = error instanceof Error ? error.message : '文字起こしに失敗しました'
      setErrorMessage(errorMsg)
      setTranscription('')
    } finally {
      setIsTranscribing(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col pt-2 pb-4 px-2 sm:px-4">
      <div className="max-w-3xl mx-auto w-full">
        {/* ヘッダー - よりコンパクトに */}
        <header className="mb-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <h1 className="text-xl font-bold">音声文字起こしアプリ</h1>
            <BrainCircuit className="w-4 h-4 text-blue-600" />
          </div>
        </header>
        
        {/* メインコンテンツ - より密集したレイアウト */}
        <div className="space-y-2">
          {/* コンパクト化したエラー表示 */}
          {(apiKeyError || errorMessage) && (
            <div className={`text-xs p-1.5 rounded-md ${apiKeyError ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex items-start gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  {apiKeyError ? (
                    <span className="text-red-700">APIキーが見つかりません。環境変数を確認してください。</span>
                  ) : (
                    <span className="text-amber-700">{errorMessage}</span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* 録音と音声プレーヤーを横に並べる */}
          <div className="flex flex-col sm:flex-row sm:items-start gap-2">
            {/* 録音セクション - コンパクト化 */}
            <div className="flex-shrink-0 py-2 flex flex-col items-center">
              <AudioRecorder 
                onRecordingComplete={handleRecordingComplete} 
              />
              <p className="text-xs text-gray-500 mt-1 min-h-[20px]">
                {isTranscribing ? (
                  <span className="flex items-center text-blue-500 text-xs">
                    <BrainCircuit className="w-3 h-3 mr-1 animate-pulse" />
                    文字起こし中...
                  </span>
                ) : (
                  '録音ボタンをクリック'
                )}
              </p>
              
              {/* 使い方ガイド - 非常にコンパクトに */}
              {showGuide && (
                <div className="bg-blue-50 border border-blue-100 rounded-md p-1.5 mt-1 max-w-xs relative">
                  <button 
                    className="absolute top-0 right-0 text-blue-400 hover:text-blue-600 text-xs"
                    onClick={() => setShowGuide(false)}
                  >
                    ✕
                  </button>
                  <div className="flex items-start gap-1">
                    <InfoIcon className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                    <div className="text-xxs text-blue-700">
                      <span className="text-xs font-semibold block mb-0.5">使い方</span>
                      <ol className="list-decimal pl-3 space-y-0 leading-tight">
                        <li>録音ボタンをタップ</li>
                        <li>停止ボタンで終了</li>
                        <li>結果を同時表示</li>
                      </ol>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* オーディオプレイヤー - より小さく */}
            {audioUrl && (
              <div className="flex-grow">
                <h2 className="text-sm font-medium mb-1">録音音声</h2>
                <Suspense fallback={<div className="h-8 bg-gray-100 rounded animate-pulse"></div>}>
                  <AudioPlayer audioUrl={audioUrl} />
                </Suspense>
              </div>
            )}
          </div>
          
          {/* 文字起こしと処理結果 */}
          <TranscriptionResult
            transcription={transcription}
            fillerRemovedText={fillerRemovedText}
            correctedText={correctedText}
            isLoading={isTranscribing || isProcessing}
          />
        </div>
      </div>
    </main>
  )
}
