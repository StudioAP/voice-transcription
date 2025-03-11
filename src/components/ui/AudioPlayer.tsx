'use client'

import { useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AudioPlayerProps {
  audioUrl: string
  className?: string
}

/**
 * シンプルなオーディオプレイヤーコンポーネント
 */
export default function AudioPlayer({
  audioUrl,
  className,
}: AudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  
  const audioRef = useRef<HTMLAudioElement | null>(null)
  
  useEffect(() => {
    const audio = new Audio(audioUrl)
    audioRef.current = audio
    
    const setAudioData = () => {
      setDuration(audio.duration)
    }
    
    const setAudioTime = () => {
      setCurrentTime(audio.currentTime)
    }
    
    const handleAudioEnd = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }
    
    // イベントリスナーを登録
    audio.addEventListener('loadeddata', setAudioData)
    audio.addEventListener('timeupdate', setAudioTime)
    audio.addEventListener('ended', handleAudioEnd)
    
    return () => {
      // クリーンアップ
      audio.pause()
      audio.removeEventListener('loadeddata', setAudioData)
      audio.removeEventListener('timeupdate', setAudioTime)
      audio.removeEventListener('ended', handleAudioEnd)
    }
  }, [audioUrl])
  
  // 再生/一時停止の切り替え
  const togglePlay = () => {
    if (!audioRef.current) return
    
    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    
    setIsPlaying(!isPlaying)
  }
  
  // シークバーの値変更時の処理
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return
    
    const newTime = Number(e.target.value)
    audioRef.current.currentTime = newTime
    setCurrentTime(newTime)
  }
  
  // 時間のフォーマット (mm:ss)
  const formatTime = (time: number) => {
    if (isNaN(time)) return '00:00'
    
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  
  return (
    <div className={cn('bg-white border rounded-lg p-3 shadow', className)}>
      <div className="flex items-center gap-3">
        <button
          onClick={togglePlay}
          className="w-10 h-10 rounded-full flex items-center justify-center bg-blue-500 hover:bg-blue-600 text-white transition-colors"
          aria-label={isPlaying ? '一時停止' : '再生'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5 ml-0.5" />
          )}
        </button>
        
        <div className="flex-1">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
          
          <input
            type="range"
            min={0}
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 rounded-full accent-blue-500 cursor-pointer"
            aria-label="シークバー"
          />
        </div>
        
        <Volume2 className="w-5 h-5 text-gray-400" />
      </div>
    </div>
  )
} 