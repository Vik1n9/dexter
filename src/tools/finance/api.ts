/**
 * FinMind API Client
 *
 * 所有財經工具（fundamentals、key-ratios、earnings 等）都透過此模組存取資料，
 * 只需修改此檔即可切換資料來源。
 *
 * FinMind API 文件：https://finmindtrade.com/analysis/#/data/api
 */

const BASE_URL = 'https://api.finmindtrade.com/api/v4';

/**
 * 從環境變數讀取 FinMind token
 * 使用者需在 .env 中設定 FINMIND_API_KEY=your_token
 */
function getApiKey(): string {
  return process.env.FINMIND_API_KEY || '';
}

/**
 * FinMind API 請求工具
 * 會自動在 URL 加上 token 參數，並處理回傳的標準格式。
 */
class FinMindApi {
  private apiKey: string;

  constructor() {
    this.apiKey = getApiKey();
    if (!this.apiKey) {
      console.warn('Warning: FINMIND_API_KEY not set in environment variables.');
    }
  }

  /**
   * 發送 GET 請求
   * @param dataset - FinMind 資料集名稱（例如 "TaiwanStockFinancialStatements"）
   * @param params - 查詢參數（不含 token）
   * @returns API 回應的 data 欄位（已解析）
   */
  async get(dataset: string, params: Record<string, string | number> = {}): Promise<any> {
    return this.executeRequest(dataset, params, 'GET');
  }

  /**
   * 發送 POST 請求（FinMind 主要使用 GET，此處保留以兼容舊架構）
   * @param dataset - 資料集名稱
   * @param body - 請求內容（會作為查詢參數送出，FinMind 不支援標準 POST body）
   * @returns API 回應的 data 欄位
   */
  async post(dataset: string, body: Record<string, any> = {}): Promise<any> {
    // FinMind 所有端點都是 GET，此處將 body 轉為 query params
    return this.executeRequest(dataset, body, 'POST');
  }

  /**
   * 內部請求執行函式
   */
  private async executeRequest(
    dataset: string,
    params: Record<string, string | number>,
    _method: 'GET' | 'POST'
  ): Promise<any> {
    const url = new URL(`${BASE_URL}/data`);
    url.searchParams.append('dataset', dataset);
    url.searchParams.append('token', this.apiKey);

    // 附加其他查詢參數
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });

    try {
      const response = await fetch(url.toString(), {
        method: 'GET', // FinMind 僅支援 GET
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`FinMind API error: ${response.status} ${response.statusText}`);
      }

      const json = await response.json();

      // FinMind 回傳格式：{ msg: "success", status: 200, data: [...] }
      if (json.status !== 200) {
        throw new Error(`FinMind API returned status ${json.status}: ${json.msg}`);
      }

      return json.data; // 直接回傳純資料陣列，由各工具自行處理格式
    } catch (error) {
      console.error(`Failed to fetch FinMind dataset="${dataset}":`, error);
      throw error;
    }
  }
}

// 匯出單一實例，供所有財經工具使用
export const api = new FinMindApi();
