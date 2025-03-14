'use client'

import { useRef, useState, useEffect } from 'react'
import { Mic, Square, Loader2, AlertTriangle } from 'lucide-react'
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
  const [error, setError] = useState<string | null>(null)
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // コンポーネントマウント時に機能サポートを確認
  useEffect(() => {
    const checkMediaSupport = async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError('お使いのブラウザは音声録音をサポートしていません。');
          return false;
        }
        
        // MediaRecorderが利用可能か確認
        if (typeof MediaRecorder === 'undefined') {
          setError('お使いのブラウザはMediaRecorderをサポートしていません。');
          return false;
        }
        
        return true;
      } catch (err) {
        console.error('メディアサポートチェック中にエラーが発生しました:', err);
        setError('音声録音機能のチェック中にエラーが発生しました。');
        return false;
      }
    };
    
    checkMediaSupport();
  }, []);
  
  // 録音時間の更新
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => {
          // 最大録音時間に達したら録音を停止
          if (prev + 1000 >= maxDurationMs) {
            stopRecording();
            return prev;
          }
          return prev + 1000;
        });
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [isRecording, maxDurationMs]);
  
  // 録音開始
  const startRecording = async () => {
    try {
      setIsProcessing(true);
      setError(null);
      
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('お使いのブラウザは音声録音をサポートしていません。');
      }
      
      // 高品質な音声設定でストリームを取得
      console.log('マイク入力の取得を開始します...');
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 16000
        } 
      });
      console.log('マイク入力の取得に成功しました');
      
      // サポートされる音声形式を確認
      const mimeTypes = [
        'audio/webm',
        'audio/mp4',
        'audio/mp3',
        'audio/wav',
        'audio/mpeg',
        'audio/ogg'
      ];
      
      let selectedMimeType = '';
      for (const mimeType of mimeTypes) {
        if (MediaRecorder && MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(mimeType)) {
          selectedMimeType = mimeType;
          console.log(`サポートされている音声形式: ${mimeType}`);
          break;
        }
      }
      
      if (!selectedMimeType) {
        console.warn('サポートされている音声形式が見つかりませんでした。デフォルト形式を使用します。');
      }
      
      // MediaRecorderの設定
      const options = selectedMimeType ? { mimeType: selectedMimeType, audioBitsPerSecond: 128000 } : undefined;
      console.log('使用する録音設定:', options);
      
      // MediaRecorderの作成
      const mediaRecorder = new MediaRecorder(stream, options);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          console.log(`録音データを取得: ${event.data.size} bytes, タイプ: ${event.data.type}`);
          audioChunksRef.current.push(event.data);
        } else {
          console.warn('録音データが空またはサイズがゼロです');
        }
      };
      
      mediaRecorder.onerror = (event) => {
        console.error('MediaRecorderエラー:', event);
        setError('録音中にエラーが発生しました');
        stopRecording();
      };
      
      mediaRecorder.onstop = async () => {
        try {
          // 録音データが存在するか確認
          if (audioChunksRef.current.length === 0) {
            throw new Error('録音データが取得できませんでした');
          }
          
          // 録音データを適切なフォーマットに変換
          const finalMimeType = selectedMimeType || 'audio/webm';
          const audioBlob = new Blob(audioChunksRef.current, { type: finalMimeType });
          
          console.log(`最終的な録音ファイル: サイズ ${audioBlob.size} bytes, タイプ: ${audioBlob.type}`);
          
          // オーディオデータを検証
          if (audioBlob.size === 0) {
            throw new Error('録音データが空です');
          }
          
          // コールバックを実行
          onRecordingComplete(audioBlob);
        } catch (err) {
          console.error('録音処理中にエラーが発生しました:', err);
          setError(err instanceof Error ? err.message : '録音の処理中にエラーが発生しました');
        } finally {
          // ストリームの全トラックを停止
          stream.getTracks().forEach(track => track.stop());
          setIsProcessing(false);
          setRecordingTime(0);
        }
      };
      
      // 250ms間隔でデータを取得
      mediaRecorder.start(250);
      console.log('録音を開始しました');
      setIsRecording(true);
      setIsProcessing(false);
    } catch (err) {
      console.error('録音の開始に失敗しました:', err);
      setIsProcessing(false);
      setError(err instanceof Error ? err.message : '録音の開始に失敗しました');
    }
  };
  
  // 録音停止
  const stopRecording = () => {
    try {
      if (mediaRecorderRef.current && isRecording) {
        setIsProcessing(true);
        console.log('録音を停止します');
        mediaRecorderRef.current.stop();
        setIsRecording(false);
      }
    } catch (err) {
      console.error('録音の停止中にエラーが発生しました:', err);
      setError(err instanceof Error ? err.message : '録音の停止中にエラーが発生しました');
      setIsProcessing(false);
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
      {error ? (
        <div className="mb-2 p-2 bg-red-50 border border-red-200 rounded-md text-red-700 flex items-center gap-1 max-w-md">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <p className="text-xs">{error}</p>
        </div>
      ) : null}
      
      <div className="flex flex-col items-center">
        <button
          onClick={isRecording ? stopRecording : startRecording}
          disabled={isProcessing || !!error}
          className={cn(
            'w-18 h-18 rounded-full flex items-center justify-center transition-all shadow-lg active:scale-95',
            isRecording 
              ? 'bg-red-500 hover:bg-red-600' 
              : 'bg-blue-500 hover:bg-blue-600',
            (isProcessing || !!error) && 'opacity-70 cursor-not-allowed'
          )}
          aria-label={isRecording ? '録音停止' : '録音開始'}
          style={{ width: '3.5rem', height: '3.5rem' }} // 親指操作用に少し大きめに
        >
          {isProcessing ? (
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          ) : isRecording ? (
            <Square className="w-8 h-8 text-white" />
          ) : (
            <Mic className="w-8 h-8 text-white" />
          )}
        </button>
        
        {/* 録音時間表示 */}
        {isRecording && (
          <div className="mt-1 px-2 py-0.5 bg-red-100 rounded-full text-xs text-red-600 font-medium">
            {formatTime(recordingTime)}
          </div>
        )}
      </div>
    </div>
  );
} 