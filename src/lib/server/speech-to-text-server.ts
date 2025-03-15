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
    console.log('Speech-to-Text API認識開始:', { 
      mimeType, 
      dataLength: audioData.length,
      dataPreview: audioData.substring(0, 50) + '...' 
    });

    // APIキーの取得とバリデーション
    const apiKey = process.env.GOOGLE_SPEECH_API_KEY;
    if (!apiKey) {
      console.error('Google Speech APIキーが設定されていません');
      throw new Error('Speech-to-Text APIキーが設定されていません');
    }
    
    console.log('Google Speech APIキー検出:', apiKey.substring(0, 3) + '...' + apiKey.substring(apiKey.length - 3));

    // エンコーディングタイプの決定
    let encoding = '';
    if (mimeType.includes('webm')) {
      encoding = 'WEBM_OPUS';
      console.log('WebMフォーマットを検出: WEBM_OPUS エンコーディングを使用');
    } else if (mimeType.includes('mp3') || mimeType.includes('mpeg')) {
      encoding = 'MP3';
      console.log('MP3フォーマットを検出: MP3 エンコーディングを使用');
    } else if (mimeType.includes('wav')) {
      encoding = 'LINEAR16';
      console.log('WAVフォーマットを検出: LINEAR16 エンコーディングを使用');
    } else if (mimeType.includes('flac')) {
      encoding = 'FLAC';
      console.log('FLACフォーマットを検出: FLAC エンコーディングを使用');
    } else {
      encoding = 'OGG_OPUS';
      console.log('デフォルトエンコーディング: OGG_OPUS を使用');
    }

    // サンプルレートの設定（WebMは48000Hz、その他は16000Hz）
    const sampleRateHertz = mimeType.includes('webm') ? 48000 : 16000;
    console.log(`サンプルレート設定: ${sampleRateHertz}Hz`);

    // リクエストボディの構築
    const requestBody = {
      config: {
        encoding: encoding,
        sampleRateHertz: sampleRateHertz,
        languageCode: 'ja-JP',
        enableAutomaticPunctuation: true,
      },
      audio: {
        content: audioData
      }
    };

    console.log('APIリクエスト構築:', {
      encoding: requestBody.config.encoding,
      sampleRate: requestBody.config.sampleRateHertz,
      languageCode: requestBody.config.languageCode,
      audioContentLength: requestBody.audio.content.length
    });

    // Speech APIへのリクエスト
    const response = await fetch(
      `https://speech.googleapis.com/v1/speech:recognize?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    console.log('Speech API レスポンスステータス:', response.status, response.statusText);
    console.log('Speech API レスポンスヘッダー:', Object.fromEntries([...response.headers.entries()]));

    // レスポンスの処理
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Speech API エラーレスポンス:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      });
      throw new Error(`Speech API エラー: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Speech API レスポンス構造:', JSON.stringify(data, null, 2).substring(0, 500) + '...');

    // 音声認識結果の処理
    if (!data.results || data.results.length === 0) {
      console.error('Speech API: 結果がありません', data);
      throw new Error('音声認識結果が空です。クリアに発音してみてください。');
    }

    // 認識されたテキストを連結
    let transcription = '';
    data.results.forEach((result: any) => {
      if (result.alternatives && result.alternatives.length > 0) {
        transcription += result.alternatives[0].transcript + ' ';
      }
    });

    console.log('Speech API 認識結果:', transcription);

    if (!transcription || transcription.trim().length === 0) {
      console.error('Speech API: 空の認識結果');
      throw new Error('認識結果が空です。別の音声を試してみてください。');
    }

    return transcription.trim();
  } catch (error) {
    console.error('Speech-to-Text API処理中にエラーが発生しました:', error);
    
    // エラーメッセージの詳細化
    let errorMessage = '音声認識に失敗しました';
    if (error instanceof Error) {
      errorMessage = `Speech API エラー: ${error.message}`;
      console.error('エラータイプ:', error.name);
      console.error('エラースタック:', error.stack);
    }
    
    throw new Error(errorMessage);
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