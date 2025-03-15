import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudioWithSpeechAPI } from '@/lib/server/speech-to-text-server';

export async function POST(req: NextRequest) {
  try {
    // リクエストボディを取得
    const body = await req.json();
    const { audioData, mimeType } = body;
    
    if (!audioData || !mimeType) {
      return NextResponse.json(
        { error: '音声データとMIMEタイプが必要です' },
        { status: 400 }
      );
    }
    
    console.log('API Route: 音声認識リクエスト受信', { mimeType, dataLength: audioData.length });
    
    // サーバーサイドでSpeech-to-Text APIを呼び出し
    const transcription = await transcribeAudioWithSpeechAPI(audioData, mimeType);
    
    return NextResponse.json({ transcription }, { status: 200 });
  } catch (error) {
    console.error('API Route: 音声認識中にエラーが発生しました:', error);
    
    let errorMessage = '音声認識に失敗しました';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
} 