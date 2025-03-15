// Google Cloud Speech-to-Text REST APIを直接使用する実装

/**
 * 音声データを文字起こしする関数（サーバーサイド専用）
 * Google Cloud Speech-to-Text REST APIを使用
 * 
 * @param audioData - Base64エンコードされた音声データ
 * @param mimeType - 音声データのMIMEタイプ
 * @returns 文字起こしされたテキスト
 */
export async function transcribeAudioWithSpeechAPI(audioData: string, mimeType: string): Promise<string> {
  try {
    console.log('サーバー: Speech-to-Text API 音声認識開始:', { mimeType, dataLength: audioData.length });
    
    // API キーを環境変数から取得
    const apiKey = process.env.GOOGLE_SPEECH_API_KEY;
    if (!apiKey) {
      throw new Error('Google Cloud Speech API キーが設定されていません');
    }
    
    // リクエストボディを作成
    const requestBody = {
      config: {
        encoding: getEncodingFromMimeType(mimeType),
        sampleRateHertz: 16000,
        languageCode: 'ja-JP',
        model: 'default',
        enableAutomaticPunctuation: true,
      },
      audio: {
        content: audioData
      }
    };
    
    // REST APIリクエストを実行
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Speech API エラーレスポンス:', errorText);
      throw new Error(`Speech API エラー: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.results || data.results.length === 0) {
      throw new Error('音声認識結果が空です');
    }
    
    // 結果の取得とテキスト構築
    const transcription = data.results
      .map((result: any) => {
        if (result.alternatives && result.alternatives.length > 0) {
          return result.alternatives[0].transcript || '';
        }
        return '';
      })
      .join(' ')
      .trim();
    
    console.log('サーバー: 文字起こし完了:', transcription ? transcription.substring(0, 100) + '...' : '結果なし');
    
    if (!transcription || transcription.length === 0) {
      throw new Error('文字起こし結果が空です');
    }
    
    return transcription;
  } catch (error) {
    console.error('サーバー: Speech-to-Text APIでの音声文字起こし中にエラーが発生しました:', error);
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