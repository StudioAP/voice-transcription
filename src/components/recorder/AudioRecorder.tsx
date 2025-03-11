'use client'

import { useRef, useState, useEffect } from 'react'
import { Mic, Square, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void
  maxDurationMs?: number
  className?: string
}

/**
 * 音声録音コンポーネント
 * シンプルなワンタップ操作で録音を開始・停止できます
 */
export default function AudioRecorder({
  onRecordingComplete,
  maxDurationMs = 60000 * 5, // デフォルト最大5分
  className,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [isProcessing, setIsProcessing] = useState(false)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // 録音時間の更新
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          // 最大録音時間に達したら録音を停止
          if (prev + 1000 >= maxDurationMs) {
            stopRecording()
            return prev
          }
          return prev + 1000
        })
      }, 1000)
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isRecording, maxDurationMs])
  
  // 録音開始
  const startRecording = async () => {
    try {
      setIsProcessing(true)
      
      // 高品質な音声設定でストリームを取得
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000
        } 
      })
      
      // サポートされる音声形式を確認
      const mimeTypes = [
        'audio/mp4',
        'audio/mp3',
        'audio/webm',
        'audio/wav',
        'audio/mpeg'
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log(`サポートされている音声形式: ${mimeType}`);
          break;
        }
      }
      
      // MediaRecorderの設定
      const options = selectedMimeType ? { mimeType: selectedMimeType } : undefined;
      console.log('使用する録音設定:', options);
      
      // MediaRecorderの作成
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          console.log(`録音データを取得: ${event.data.size} bytes, タイプ: ${event.data.type}`);
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = async () => {
        // 録音データを適切なフォーマットに変換
        const audioBlob = new Blob(audioChunksRef.current, { 
          type: selectedMimeType || 'audio/webm' 
        });
        
        console.log(`最終的な録音ファイル: サイズ ${audioBlob.size} bytes, タイプ: ${audioBlob.type}`);
        
        // オーディオデータを検証
        if (audioBlob.size === 0) {
          console.error('録音データが空です');
          alert('録音データを取得できませんでした。もう一度お試しください。');
          setIsProcessing(false);
          return;
        }
        
        // MP3に変換するためのAudioContext処理（必要な場合）
        onRecordingComplete(audioBlob);
        
        // ストリームの全トラックを停止
        stream.getTracks().forEach(track => track.stop());
        setIsProcessing(false);
        setRecordingTime(0);
      };
      
      // 250ms間隔でデータを取得
      mediaRecorder.start(250);
      setIsRecording(true);
      setIsProcessing(false);
    } catch (err) {
      console.error('録音の開始に失敗しました:', err);
      setIsProcessing(false);
      alert('録音の開始に失敗しました。マイクへのアクセス許可を確認してください。');
    }
  };
  
  // 録音停止
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      setIsProcessing(true);
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };
  
  // 録音時間のフォーマット (mm:ss)
  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <div className={cn('flex flex-col items-center', className)}>
      <div className="flex flex-col items-center">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing}
          className={cn(
            'w-16 h-16 rounded-full flex items-center justify-center transition-all',
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600',
            isProcessing && 'opacity-70 cursor-not-allowed'
          )}
          aria-label={isRecording ? '録音停止' : '録音開始'}
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : isRecording ? (
            <Square className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </button>
        
        {isRecording && (
          <div className="mt-2 text-lg font-semibold animate-pulse text-red-500">
            録音中... {formatTime(recordingTime)}
          </div>
        )}
      </div>
    </div>
  );
} 