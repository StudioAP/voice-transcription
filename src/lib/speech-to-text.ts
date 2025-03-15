import speech from '@google-cloud/speech';

// 環境変数のデバッグ出力
console.log('Speech-to-Text 環境変数情報:', {
  NODE_ENV: process.env.NODE_ENV,
  GOOGLE_APPLICATION_CREDENTIALS_EXISTS: !!process.env.GOOGLE_APPLICATION_CREDENTIALS
});

/**
 * 音声データを文字起こしする関数
 * Google Cloud Speech-to-Text APIを使用
 * 
 * @param audioData - Base64エンコードされた音声データ
 * @param mimeType - 音声データのMIMEタイプ
 * @returns 文字起こしされたテキスト
 */
export async function transcribeAudioWithSpeechAPI(audioData: string, mimeType: string): Promise<string> {
  try {
    console.log('Speech-to-Text API 音声認識開始:', { mimeType, dataLength: audioData.length });
    
    // Speech-to-Text クライアントの作成
    const client = new speech.SpeechClient();
    
    // Base64データをバイナリデータに変換
    const audioBytes = Buffer.from(audioData, 'base64');
    
    // リクエスト設定
    const config = {
      encoding: getEncodingFromMimeType(mimeType),
      sampleRateHertz: 16000, // サンプルレートは音声によって異なる場合があります
      languageCode: 'ja-JP',
      model: 'default',
      enableAutomaticPunctuation: true,
      enableWordTimeOffsets: false,
    };
    
    // 音声認識リクエストの作成
    const request = {
      audio: {
        content: audioBytes,
      },
      config: config,
    };
    
    // 音声認識の実行
    const [response] = await client.recognize(request);
    
    if (!response || !response.results || response.results.length === 0) {
      throw new Error('音声認識結果が空です');
    }
    
    // 結果の取得とテキスト構築
    const transcription = response.results
      .map(result => result.alternatives && result.alternatives[0] ? result.alternatives[0].transcript : '')
      .join(' ')
      .trim();
    
    console.log('文字起こし完了:', transcription ? transcription.substring(0, 100) + '...' : '結果なし');
    
    if (!transcription || transcription.length === 0) {
      throw new Error('文字起こし結果が空です');
    }
    
    return transcription;
  } catch (error) {
    console.error('Speech-to-Text APIでの音声文字起こし中にエラーが発生しました:', error);
    // エラーの詳細情報を出力
    if (error instanceof Error) {
      console.error('エラータイプ:', error.name);
      console.error('エラーメッセージ:', error.message);
      console.error('エラースタック:', error.stack);
    }
    throw error;
  }
}

/**
 * MIMEタイプからSpeech-to-Text APIのエンコーディングタイプを取得する
 * @param mimeType - 音声データのMIMEタイプ
 * @returns Speech-to-Text APIのエンコーディングタイプ
 */
function getEncodingFromMimeType(mimeType: string): string {
  switch (mimeType) {
    case 'audio/wav':
    case 'audio/x-wav':
      return 'LINEAR16';
    case 'audio/webm':
      return 'WEBM_OPUS';
    case 'audio/mp3':
    case 'audio/mpeg':
      return 'MP3';
    case 'audio/ogg':
      return 'OGG_OPUS';
    case 'audio/flac':
      return 'FLAC';
    default:
      console.warn(`未知のMIMEタイプ: ${mimeType}, デフォルトのLINEAR16を使用します`);
      return 'LINEAR16';
  }
} 