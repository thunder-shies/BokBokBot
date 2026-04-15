import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 90000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 分析用戶輸入
export const analyzeUserInput = async (userInput: string) => {
  try {
    const response = await apiClient.post('/api/chat/analyze', {
      userInput,
    });
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// 獲取對話歷史
export const getChatHistory = async () => {
  try {
    const response = await apiClient.get('/api/chat/history');
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// 生成語音
export const generateSpeech = async (text: string) => {
  try {
    const response = await apiClient.post(
      '/api/chat/speak',
      { text },
      { responseType: 'blob' }
    );
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// 偵測畫面是否有人
export const detectPersonInFrame = async (frameBlob: Blob) => {
  try {
    const formData = new FormData();
    formData.append('frame', frameBlob, 'frame.jpg');

    const response = await apiClient.post('/api/vision/detect-person', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data as {
      detected: boolean;
      count: number;
      confidence: number;
    };
  } catch (error) {
    console.error('Vision API Error:', error);
    throw error;
  }
};

export default apiClient;
