export interface AIHealthStatus {
  ok: boolean;
  aiConfigured: boolean;
  model: string;
}

export interface AIAssistResponse {
  available: boolean;
  text?: string;
  model?: string;
  code?: string;
  message?: string;
}

export async function checkAIHealth(): Promise<AIHealthStatus> {
  try {
    const res = await fetch('/api/health');
    if (!res.ok) {
      return { ok: false, aiConfigured: false, model: 'unavailable' };
    }
    return (await res.json()) as AIHealthStatus;
  } catch {
    return { ok: false, aiConfigured: false, model: 'offline' };
  }
}

export async function callLiteratureAI(params: {
  task: string;
  prompt: string;
  context?: string;
}): Promise<AIAssistResponse> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      available: false,
      code: 'OFFLINE',
      message:
        'Thiết bị đang ngoại tuyến. Trợ lý AI trực tuyến tạm thời chưa khả dụng, bạn vẫn có thể soạn đề, chỉnh sửa ma trận, bài giảng và xuất tài liệu bình thường.',
    };
  }

  try {
    const res = await fetch('/api/ai/assist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = (await res.json()) as AIAssistResponse;
    if (!res.ok) {
      return {
        available: false,
        code: data.code || 'ERROR',
        message:
          data.message ||
          'Dịch vụ AI tạm thời không khả dụng. Các tính năng thủ công vẫn hoạt động bình thường.',
      };
    }
    return data;
  } catch {
    return {
      available: false,
      code: 'NETWORK_ERROR',
      message:
        'Không thể kết nối tới máy chủ AI. Dữ liệu làm việc của bạn vẫn được lưu an toàn trong IndexedDB.',
    };
  }
}
