'use client'

import { useState, useEffect, lazy, Suspense } from 'react'
import { InfoIcon, BrainCircuit, AlertCircle } from 'lucide-react'
import { transcribeAudio, correctTranscription } from '@/lib/llm'

// コンポーネントの動的インポート - 必要なタイミングで遅延ロード
const AudioRecorder = lazy(() => 
  import('@/components/recorder/AudioRecorder')
    .then(mod => ({
      default: mod.default
    }))
    .catch(err => {
      console.error('AudioRecorderのロードに失敗しました:', err);
      return { default: () => <div>録音機能を読み込めませんでした</div> };
    })
);

const TranscriptionResult = lazy(() => 
  import('@/components/ui/TranscriptionResult')
    .then(mod => ({
      default: mod.default
    }))
    .catch(err => {
      console.error('TranscriptionResultのロードに失敗しました:', err);
      return { default: () => <div>結果表示コンポーネントを読み込めませんでした</div> };
    })
);

const AudioPlayer = lazy(() => 
  import('@/components/ui/AudioPlayer')
    .then(mod => ({
      default: mod.default
    }))
    .catch(err => {
      console.error('AudioPlayerのロードに失敗しました:', err);
      return { default: () => <div>音声プレーヤーを読み込めませんでした</div> };
    })
);

// ローディングフォールバックコンポーネント - より軽量化
const LoadingFallback = () => (
  <div className="flex justify-center items-center p-2">
    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
  </div>
)

/**
 * 音声文字起こしアプリ
 * パフォーマンスを最適化し、初期ロード時間を短縮
 */
export default function Home() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcription, setTranscription] = useState<string>('')
  const [correctedText, setCorrectedText] = useState<string>('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [showGuide, setShowGuide] = useState<boolean>(true)
  const [isRecorderVisible, setIsRecorderVisible] = useState<boolean>(false)
  
  // APIキーのチェックを最適化（本番環境では最小限の処理に）
  const hasApiKey = !!process.env.NEXT_PUBLIC_GEMINI_API_KEY
  
  // 録音ボタンを表示するタイミングを遅延
  useEffect(() => {
    // アプリケーションがロードされてから500ms後に録音ボタンを表示
    const timer = setTimeout(() => {
      setIsRecorderVisible(true);
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);
  
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
    setCorrectedText('') // 校正テキストもリセット
    
    try {
      if (!hasApiKey) {
        throw new Error('Gemini APIキーが設定されていません。')
      }
      
      // 文字起こし実行
      const text = await transcribeAudio(audioBlob)
      setTranscription(text)
      
      // テキスト処理を開始
      if (text) {
        setIsProcessing(true)
        
        try {
          // 校正処理を実行
          const corrected = await correctTranscription(text, 0.5)
          setCorrectedText(corrected)
        } catch (error) {
          console.error('テキスト処理に失敗しました:', error)
          setErrorMessage(error instanceof Error ? error.message : 'テキスト処理に失敗しました')
        } finally {
          setIsProcessing(false)
        }
      }
    } catch (error) {
      console.error('文字起こしに失敗しました:', error)
      setErrorMessage(error instanceof Error ? error.message : '文字起こしに失敗しました')
      setTranscription('')
    } finally {
      setIsTranscribing(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col pt-2 pb-24 px-2 sm:px-4 relative">
      <div className="max-w-3xl mx-auto w-full">
        {/* ヘッダー - よりコンパクトに */}
        <header className="mb-2 text-center">
          <div className="flex items-center justify-center gap-1">
            <h1 className="text-xl font-bold">しゃべりを校正くん</h1>
            <BrainCircuit className="w-4 h-4 text-blue-600" />
          </div>
        </header>
        
        {/* メインコンテンツ - より密集したレイアウト */}
        <div className="space-y-2">
          {/* エラー表示 */}
          {(!hasApiKey || errorMessage) && (
            <div className={`text-xs p-1.5 rounded-md ${!hasApiKey ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
              <div className="flex items-start gap-1">
                <AlertCircle className="w-3 h-3 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  {!hasApiKey ? (
                    <span className="text-red-700">APIキーが見つかりません。環境変数を確認してください。</span>
                  ) : (
                    <span className="text-amber-700">{errorMessage}</span>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {/* 使い方ガイド - 非常にコンパクトに */}
          {showGuide && (
            <div className="bg-blue-50 border border-blue-100 rounded-md p-1.5 mb-1 relative">
              <button 
                className="absolute top-0 right-0 text-blue-400 hover:text-blue-600 text-xs"
                onClick={() => setShowGuide(false)}
              >
                ✕
              </button>
              <div className="flex items-start gap-1">
                <InfoIcon className="w-3 h-3 text-blue-500 mt-0.5 flex-shrink-0" />
                <div className="text-[10px] leading-tight text-blue-700">
                  <span className="text-xs font-semibold block mb-0.5">使い方</span>
                  <ol className="list-decimal pl-3 space-y-0">
                    <li>画面下部の録音ボタンをタップ</li>
                    <li>停止ボタンで終了</li>
                    <li>結果を同時表示</li>
                  </ol>
                </div>
              </div>
            </div>
          )}
          
          {/* オーディオプレイヤー - 動的ロード */}
          {audioUrl && (
            <div className="mb-2">
              <h2 className="text-sm font-medium mb-1">録音音声</h2>
              <Suspense fallback={<div className="h-8 bg-gray-100 rounded animate-pulse"></div>}>
                <AudioPlayer audioUrl={audioUrl} />
              </Suspense>
            </div>
          )}
          
          {/* 録音ステータス表示 */}
          {isTranscribing && (
            <div className="text-center p-1.5 bg-blue-50 border border-blue-100 rounded-md mb-2">
              <span className="flex items-center justify-center text-blue-600 text-xs">
                <BrainCircuit className="w-3 h-3 mr-1 animate-pulse" />
                文字起こし処理中...
              </span>
            </div>
          )}
          
          {/* 文字起こしと処理結果 - 動的ロード */}
          {(transcription || correctedText) && (
            <Suspense fallback={<LoadingFallback />}>
              <TranscriptionResult
                transcription={transcription}
                correctedText={correctedText}
                isLoading={isTranscribing || isProcessing}
              />
            </Suspense>
          )}
        </div>
      </div>
      
      {/* 録音ボタンを画面下部に固定 - 動的ロード */}
      <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center bg-white bg-opacity-90 border-t border-gray-200 py-2 px-4 shadow-lg z-10">
        <div className="w-full max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex-1 text-xs text-center text-gray-500">
            {isTranscribing ? (
              <span className="text-blue-600">処理中...</span>
            ) : transcription ? (
              <span className="text-green-600">録音完了</span>
            ) : (
              <span>録音ボタンをタップ</span>
            )}
          </div>
          
          {isRecorderVisible ? (
            <Suspense fallback={<LoadingFallback />}>
              <AudioRecorder 
                onRecordingComplete={handleRecordingComplete} 
                className="px-6"
              />
            </Suspense>
          ) : (
            <div className="h-10 flex items-center justify-center">
              <div className="animate-pulse rounded-full h-8 w-8 bg-gray-200"></div>
            </div>
          )}
          
          <div className="flex-1"></div>
        </div>
      </div>
    </main>
  )
}
