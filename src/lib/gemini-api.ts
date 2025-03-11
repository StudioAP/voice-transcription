import { GoogleGenerativeAI, type HarmCategory, type HarmBlockThreshold } from '@google/generative-ai';

// APIキーと使用するモデルを環境変数から取得
const API_KEY = process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
const MODEL_NAME = process.env.NEXT_PUBLIC_GEMINI_MODEL || 'gemini-1.5-flash-002';

// APIキーが設定されていない場合はエラーメッセージを表示
if (!API_KEY) {
  console.error('Gemini APIキーが設定されていません。.env.localファイルを確認してください。');
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

// Gemini APIのインスタンスを作成
export const genAI = new GoogleGenerativeAI(API_KEY);

// モデルの取得
export const getGeminiModel = () => {
  return genAI.getGenerativeModel({ 
    model: MODEL_NAME,
    safetySettings,
    generationConfig: {
      temperature: 0.4,
      topK: 32,
      topP: 0.95,
      maxOutputTokens: 2048,
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
    throw error;
  }
}

/**
 * テキスト生成を行う関数
 * @param prompt - プロンプト
 * @returns 生成されたテキスト
 */
export async function generateText(prompt: string): Promise<string> {
  try {
    const model = getGeminiModel();
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini APIでエラーが発生しました:', error);
    throw new Error('テキスト生成中にエラーが発生しました');
  }
} 