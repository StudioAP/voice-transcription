'use client'

import { useState } from 'react'
import { InfoIcon, BrainCircuit, AlertCircle } from 'lucide-react'
import AudioRecorder from '@/components/recorder/AudioRecorder'
import TranscriptionResult from '@/components/ui/TranscriptionResult'
import AudioPlayer from '@/components/ui/AudioPlayer'
import { transcribeAudio, correctTranscription } from '@/lib/llm'

export default function Home() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [transcription, setTranscription] = useState<string>('')
  const [correctedText, setCorrectedText] = useState<string>('')
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isCorrectingText, setIsCorrectingText] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  // 録音完了時の処理
  const handleRecordingComplete = async (audioBlob: Blob) => {
    // 音声URLを作成
    const url = URL.createObjectURL(audioBlob)
    setAudioUrl(url)
    setErrorMessage(null)
    
    // 文字起こし処理を開始
    setIsTranscribing(true)
    setTranscription('') // 結果をリセット
    setCorrectedText('') // 校正結果もリセット
    try {
      const text = await transcribeAudio(audioBlob)
      setTranscription(text)
      
      // 文字起こしが完了したら、自動的に校正処理を実行
      if (text) {
        setIsCorrectingText(true)
        try {
          const corrected = await correctTranscription(text)
          setCorrectedText(corrected)
        } catch (error) {
          console.error('テキスト校正に失敗しました:', error)
          const errorMsg = error instanceof Error ? error.message : 'テキスト校正に失敗しました'
          setErrorMessage(errorMsg)
        } finally {
          setIsCorrectingText(false)
        }
      }
    } catch (error) {
      console.error('文字起こしに失敗しました:', error)
      const errorMsg = error instanceof Error ? error.message : '文字起こしに失敗しました'
      setErrorMessage(errorMsg)
    } finally {
      setIsTranscribing(false)
    }
  }

  return (
    <main className="flex min-h-screen flex-col pt-6 pb-16 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto w-full">
        {/* ヘッダー */}
        <header className="mb-8 text-center">
          <h1 className="text-3xl font-bold mb-2">音声文字起こしアプリ</h1>
          <p className="text-gray-600">ワンタップで録音し、文字起こしと校正を行います</p>
          <div className="flex items-center justify-center mt-2 text-xs text-blue-600">
            <BrainCircuit className="w-4 h-4 mr-1" />
            <span>Powered by Gemini API</span>
          </div>
        </header>
        
        {/* メインコンテンツ */}
        <div className="space-y-8">
          {/* 使い方ガイド */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <InfoIcon className="w-5 h-5 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h2 className="font-semibold text-blue-800 mb-1">このアプリの使い方</h2>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal pl-4">
                  <li>下の録音ボタンをタップして録音を開始します</li>
                  <li>録音が終わったら停止ボタンをタップします</li>
                  <li>自動的に文字起こしが行われます</li>
                  <li>必要に応じてテキストを校正できます</li>
                  <li>結果をコピー、ダウンロード、または共有できます</li>
                </ol>
              </div>
            </div>
          </div>
          
          {/* エラーメッセージ */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h2 className="font-semibold text-red-800 mb-1">エラーが発生しました</h2>
                  <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* 録音セクション */}
          <div className="flex flex-col items-center py-6">
            <AudioRecorder 
              onRecordingComplete={handleRecordingComplete} 
              className="mb-4"
            />
            <p className="text-sm text-gray-500">
              {isTranscribing ? (
                <span className="flex items-center text-blue-500">
                  <BrainCircuit className="w-4 h-4 mr-1 animate-pulse" />
                  Gemini APIで文字起こし中...
                </span>
              ) : (
                '録音ボタンをクリックして開始'
              )}
            </p>
          </div>
          
          {/* オーディオプレイヤー（録音後のみ表示） */}
          {audioUrl && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">録音された音声</h2>
              <AudioPlayer audioUrl={audioUrl} />
            </div>
          )}
          
          {/* 文字起こしと校正テキストの結果 */}
          <TranscriptionResult
            transcription={transcription}
            minutes={correctedText}
            isLoading={isCorrectingText}
          />
        </div>
      </div>
    </main>
  )
}
