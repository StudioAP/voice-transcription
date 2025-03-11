import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Tailwindクラスを効率的に結合するためのユーティリティ関数
 * @param inputs - 結合するクラス名
 * @returns 結合されたクラス名
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * ファイルをダウンロードするユーティリティ関数
 * @param content - ダウンロードするコンテンツ
 * @param filename - ファイル名
 * @param contentType - コンテンツタイプ
 */
export function downloadFile(content: string, filename: string, contentType: string = 'text/plain') {
  const a = document.createElement('a');
  const file = new Blob([content], { type: contentType });
  a.href = URL.createObjectURL(file);
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * テキストをクリップボードにコピーするユーティリティ関数
 * @param text - コピーするテキスト
 * @returns コピーが成功したかどうか
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    console.error('クリップボードへのコピーに失敗しました:', err);
    return false;
  }
}

/**
 * テキストを外部サービスで共有する関数
 * @param text - 共有するテキスト
 * @param title - 共有時のタイトル
 * @returns 共有が成功したかどうか
 */
export async function shareContent(text: string, title: string): Promise<boolean> {
  try {
    if (navigator.share) {
      await navigator.share({
        title: title,
        text: text,
      });
      return true;
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    return false;
  } catch (error) {
    console.error('共有に失敗しました:', error);
    return false;
  }
} 