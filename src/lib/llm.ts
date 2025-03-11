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
    console.log('Geminiへの音声送信を開始:', audioBlob.type, audioBlob.size, 'bytes');
    
    // デバッグ用：現在のブラウザがサポートしている音声形式を確認
    const supportedTypes = [];
    ['audio/mp4', 'audio/webm', 'audio/ogg', 'audio/wav', 'audio/mpeg', 'audio/mp3'].forEach(type => {
      if (MediaRecorder.isTypeSupported(type)) {
        supportedTypes.push(type);
      }
    });
    console.log('ブラウザがサポートする音声形式:', supportedTypes);
    
    // 音声ファイルをbase64に変換
    const base64Audio = await blobToBase64(audioBlob);
    console.log('Base64変換完了: データ長', base64Audio.length);
    
    // Gemini APIを使用して文字起こしを実行
    const transcription = await transcribeAudioWithGemini(base64Audio, audioBlob.type);
    console.log('文字起こし完了:', transcription.substring(0, 100) + '...');
    
    return transcription.trim();
  } catch (error) {
    console.error('文字起こし処理中にエラーが発生しました:', error);
    // エラーの詳細をログに出力
    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message);
      console.error('エラータイプ:', error.name);
      console.error('エラースタック:', error.stack);
    }
    
    throw new Error('文字起こしに失敗しました');
  }
}

/**
 * 文字起こしテキストから議事録を生成する関数
 * Gemini APIを使用して議事録を生成します
 * 
 * @param transcription - 文字起こしテキスト
 * @returns 議事録
 */
export async function generateMinutes(transcription: string): Promise<string> {
  try {
    console.log('議事録生成開始:', transcription.substring(0, 100) + '...');
    
    const prompt = `
      あなたは議事録作成の専門家です。
      以下の文字起こしテキストから、構造化された議事録を作成してください。
      
      # 文字起こしテキスト:
      ${transcription}
      
      # 出力形式:
      以下の形式で議事録を作成してください：
      
      # 会議議事録
      
      ## 日時
      ${new Date().toLocaleDateString('ja-JP')}
      
      ## 参加者
      [文字起こしから推測される参加者のリスト]
      
      ## 議題
      [文字起こしから特定された主要な議題のリスト]
      
      ## 議事内容
      [各議題についての詳細な議論内容]
      
      ## 決定事項
      [会議で決定された事項のリスト]
      
      ## アクションアイテム
      [次回までに実行すべきタスクとその担当者]
      
      以上
    `;
    
    const minutes = await generateText(prompt);
    console.log('議事録生成完了:', minutes.substring(0, 100) + '...');
    return minutes.trim();
  } catch (error) {
    console.error('議事録生成中にエラーが発生しました:', error);
    if (error instanceof Error) {
      console.error('エラーメッセージ:', error.message);
    }
    throw new Error('議事録の生成に失敗しました');
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
      if (typeof reader.result === 'string') {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      } else {
        reject(new Error('Base64変換に失敗しました'));
      }
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
} 