import { GoogleGenerativeAI, type HarmCategory, type HarmBlockThreshold } from '@google/generative-ai';

// 環境変数のデバッグ出力
console.log('環境変数情報:', {
  NODE_ENV: process.env.NODE_ENV,
  NEXT_PUBLIC_GEMINI_API_KEY_EXISTS: !!process.env.NEXT_PUBLIC_GEMINI_API_KEY,
  NEXT_PUBLIC_GEMINI_MODEL: process.env.NEXT_PUBLIC_GEMINI_MODEL
});

// APIキーと使用するモデルを環境変数から取得
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const MODEL_NAME = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-2.0-flash-lite';

// APIキーが設定されていない場合はエラーメッセージを表示
if (!API_KEY) {
  console.error('Gemini APIキーが設定されていません。Render環境変数またはプロジェクトの.env.localファイルを確認してください。');
}

// セーフティー設定
const safetySettings = [
  {
    category: 'HARM_CATEGORY_HARASSMENT' as HarmCategory,
    threshold: 'BLOCK_MEDIUM_AND_ABOVE' as HarmBlockThreshold,
  },
  {
    category: 'HARM_CATEGORY_HATE_SPEECH' as HarmCategory,
    threshold: 'BLOCK_MEDIUM_AND_ABOVE' as HarmBlockThreshold,
  },
  {
    category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT' as HarmCategory,
    threshold: 'BLOCK_MEDIUM_AND_ABOVE' as HarmBlockThreshold,
  },
  {
    category: 'HARM_CATEGORY_DANGEROUS_CONTENT' as HarmCategory,
    threshold: 'BLOCK_MEDIUM_AND_ABOVE' as HarmBlockThreshold,
  },
];

// 遅延初期化のための変数
let genAIInstance: GoogleGenerativeAI | null = null;

// Gemini APIのインスタンスを遅延して取得するgetter
export const genAI = (): GoogleGenerativeAI => {
  if (!genAIInstance && API_KEY) {
    console.log('Gemini API インスタンスを初期化します');
    genAIInstance = new GoogleGenerativeAI(API_KEY);
  }
  
  if (!genAIInstance) {
    throw new Error('Gemini APIキーが設定されていないため、APIインスタンスを初期化できません。');
  }
  
  return genAIInstance;
};

// モデルの取得
export const getGeminiModel = (temperature: number = 0.1) => {
  // APIキーのデバッグチェック
  if (!API_KEY) {
    console.error('API_KEYが設定されていません。有効なAPIキーが必要です。');
  }
  
  console.log('Geminiモデル初期化:', { model: MODEL_NAME, apiKeyExists: !!API_KEY, temperature });
  
  return genAI().getGenerativeModel({ 
    model: MODEL_NAME,
    safetySettings,
    generationConfig: {
      temperature: temperature,
      topK: 32,
      topP: 0.95,
      maxOutputTokens: 8192,
    }
  });
};

/**
 * 音声データを文字起こしする関数
 * @param audioData - Base64エンコードされた音声データ
 * @param mimeType - 音声データのMIMEタイプ
 * @returns 文字起こしされたテキスト
 */
export async function transcribeAudioWithGemini(audioData: string, mimeType: string): Promise<string> {
  try {
    console.log('音声認識開始:', { mimeType, dataLength: audioData.length });
    
    // APIキーが空の場合は早期にエラーをスロー
    if (!API_KEY) {
      throw new Error('Gemini APIキーが設定されていません。文字起こしを実行できません。');
    }
    
    const model = getGeminiModel();
    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [{
          inlineData: {
            mimeType: mimeType,
            data: audioData
          }
        }, {
          text: '以下の音声を日本語で文字起こししてください。話者の区別や時間などは含めず、純粋なテキストのみを出力してください。'
        }]
      }]
    });
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini APIでの音声文字起こし中にエラーが発生しました:', error);
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
 * テキスト生成を行う関数
 * @param prompt - プロンプト
 * @param temperature - 生成の多様性を調整するパラメータ（0～1）
 * @returns 生成されたテキスト
 */
export async function generateText(prompt: string, temperature: number = 0.1): Promise<string> {
  try {
    // APIキーが空の場合は早期にエラーをスロー
    if (!API_KEY) {
      throw new Error('Gemini APIキーが設定されていません。テキスト生成を実行できません。');
    }
    
    const model = getGeminiModel(temperature);
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error(`Gemini API (temperature=${temperature})でエラーが発生しました:`, error);
    // エラーの詳細情報を出力
    if (error instanceof Error) {
      console.error('エラータイプ:', error.name);
      console.error('エラーメッセージ:', error.message);
      console.error('エラースタック:', error.stack);
    }
    throw new Error(`テキスト生成中にエラーが発生しました (temperature=${temperature})`);
  }
} 