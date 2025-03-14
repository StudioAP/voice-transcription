import { generateText, getGeminiModel, transcribeAudioWithGemini } from './gemini-api';

/**
 * 音声の文字起こしを行う関数
 * Gemini APIを使用して音声認識を行います
 * 
 * @param audioBlob - 音声データ
 * @returns 文字起こし結果
 */
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  try {
    console.log('文字起こし処理開始 - 環境情報:', {
      env: process.env.NODE_ENV,
      isClient: typeof window !== 'undefined',
      isServer: typeof window === 'undefined'
    });
    
    console.log('Geminiへの音声送信を開始:', audioBlob.type, audioBlob.size, 'bytes');
    
    // 音声形式の検証
    if (!audioBlob.type || audioBlob.size === 0) {
      console.error('無効な音声データです:', { type: audioBlob.type, size: audioBlob.size });
      throw new Error('無効な音声データ形式です。録音を再試行してください。');
    }
    
    // デバッグ用：現在のブラウザがサポートしている音声形式を確認
    const supportedTypes: string[] = [];
    try {
      ['audio/mp4', 'audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/mp3'].forEach(type => {
        if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) {
          supportedTypes.push(type);
        }
      });
      console.log('ブラウザがサポートする音声形式:', supportedTypes);
    } catch (err) {
      console.warn('MediaRecorder APIにアクセスできません:', err);
    }
    
    // 音声ファイルをbase64に変換
    try {
      const base64Audio = await blobToBase64(audioBlob);
      console.log('Base64変換完了: データ長', base64Audio.length);
      
      if (!base64Audio || base64Audio.length === 0) {
        throw new Error('音声データのBase64変換に失敗しました');
      }
      
      // Gemini APIで対応している形式かチェック
      const supportedMimeTypes = ['audio/webm', 'audio/mp3', 'audio/wav', 'audio/mpeg', 'audio/mp4'];
      const mimeType = audioBlob.type;
      console.log(`音声フォーマット: ${mimeType}, サポート状況: ${supportedMimeTypes.includes(mimeType)}`);
      
      // Gemini APIを使用して文字起こしを実行
      const transcription = await transcribeAudioWithGemini(base64Audio, mimeType);
      console.log('文字起こし完了:', transcription ? transcription.substring(0, 100) + '...' : '結果なし');
      
      if (!transcription || transcription.trim().length === 0) {
        throw new Error('文字起こし結果が空です。音声認識に失敗しました。');
      }
      
      return transcription.trim();
    } catch (convError) {
      console.error('音声データ処理中にエラーが発生しました:', convError);
      throw convError;
    }
  } catch (error) {
    console.error('文字起こし処理中にエラーが発生しました:', error);
    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message);
      console.error('エラータイプ:', error.name);
      console.error('エラースタック:', error.stack);
    }
    
    throw new Error('文字起こしに失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
  }
}

/**
 * 文字起こしテキストからフィラー音を除去する関数
 * 
 * @param transcription - 文字起こしテキスト
 * @returns フィラー音を除去したテキスト
 */
export async function removeFillerSounds(transcription: string): Promise<string> {
  try {
    if (!transcription || transcription.trim().length === 0) {
      throw new Error('処理するテキストが空です');
    }
    
    console.log('フィラー音除去開始:', transcription.substring(0, 100) + '...');
    
    // フィラー音のパターン
    const fillerPatterns = [
      /あー+/g, /えー+/g, /うー+/g, /んー+/g, /その+/g, /まぁ+/g, /ま、/g, 
      /あの+/g, /えっと/g, /んと/g, /あのー+/g, /えーと/g, /えっとー+/g,
      /ええと/g, /まあ/g, /ええ+/g, /うーん+/g, /えっとですね/g
    ];
    
    // フィラー音を除去
    let cleanedText = transcription;
    fillerPatterns.forEach(pattern => {
      cleanedText = cleanedText.replace(pattern, '');
    });
    
    // 複数のスペースを1つに置換
    cleanedText = cleanedText.replace(/\s+/g, ' ').trim();
    
    console.log('フィラー音除去完了:', cleanedText.substring(0, 100) + '...');
    
    if (!cleanedText || cleanedText.trim().length === 0) {
      throw new Error('フィラー音除去結果が空です');
    }
    
    return cleanedText.trim();
  } catch (error) {
    console.error('フィラー音除去中にエラーが発生しました:', error);
    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message);
      console.error('エラータイプ:', error.name);
      console.error('エラースタック:', error.stack);
    }
    throw new Error('フィラー音の除去に失敗しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
  }
}

/**
 * 文字起こしテキストを校正する関数
 * Gemini APIを使用して文字起こしテキストを校正します
 * 
 * @param transcription - 文字起こしテキスト
 * @param temperature - 生成の多様性を調整するパラメータ（0～1）
 * @returns 校正済みテキスト
 */
export async function correctTranscription(transcription: string, temperature: number = 0): Promise<string> {
  try {
    if (!transcription || transcription.trim().length === 0) {
      throw new Error('校正するテキストが空です');
    }
    
    console.log(`テキスト校正開始 (temperature=${temperature}):`, transcription.substring(0, 100) + '...');
    
    const prompt = `
      あなたは文章校正の専門家です。
      以下の文字起こしテキストを校正してください。
      
      # 文字起こしテキスト:
      ${transcription}
      
      # 指示:
      以下の点に注意して校正してください：
      1. 誤字脱字の修正
      2. 句読点の適切な配置
      3. 文法的な誤りの修正
      4. 文章の自然な流れの改善
      5. 話し言葉から書き言葉への適切な変換
      
      校正したテキストのみを出力してください。元のテキストの意味を変えないように注意してください。
      コメントや説明は不要です。校正済みテキストのみを返してください。
    `;
    
    const correctedText = await generateText(prompt, temperature);
    console.log(`テキスト校正完了 (temperature=${temperature}):`, correctedText.substring(0, 100) + '...');
    
    if (!correctedText || correctedText.trim().length === 0) {
      throw new Error('校正結果が空です');
    }
    
    return correctedText.trim();
  } catch (error) {
    console.error(`テキスト校正中にエラーが発生しました (temperature=${temperature}):`, error);
    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message);
      console.error('エラータイプ:', error.name);
      console.error('エラースタック:', error.stack);
    }
    throw new Error(`テキストの校正に失敗しました (temperature=${temperature}): ` + (error instanceof Error ? error.message : '不明なエラー'));
  }
}

/**
 * BlobをBase64に変換する関数
 * @param blob - 変換するBlob
 * @returns Base64形式の文字列
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      try {
        if (typeof reader.result === 'string') {
          const base64 = reader.result.split(',')[1];
          if (!base64) {
            reject(new Error('Base64変換結果が不正です'));
            return;
          }
          resolve(base64);
        } else {
          reject(new Error('FileReader結果が文字列ではありません'));
        }
      } catch (e) {
        reject(new Error('Base64変換処理中にエラーが発生しました: ' + e));
      }
    };
    reader.onerror = (e) => {
      reject(new Error('FileReader読み込みエラー: ' + e));
    };
    reader.readAsDataURL(blob);
  });
} 