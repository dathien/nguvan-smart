import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY' || apiKey.trim() === '') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  // Health & AI capability status (never exposes secrets)
  app.get('/api/health', (_req, res) => {
    const apiKey = process.env.GEMINI_API_KEY;
    const aiConfigured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim() !== '');
    res.json({
      ok: true,
      aiConfigured,
      model: 'gemini-4-hydrogen',
      timestamp: new Date().toISOString(),
    });
  });

  // Server-side Literature AI Assistant endpoint
  app.post('/api/ai/assist', async (req, res) => {
    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        available: false,
        code: 'AI_UNCONFIGURED',
        message:
          'Dịch vụ Trợ lý AI chưa được kích hoạt khóa API trên máy chủ. Các công cụ soạn đề, ma trận, bản đặc tả và xuất tài liệu vẫn hoạt động đầy đủ.',
      });
    }

    const { task, prompt, context } = req.body as {
      task?: string;
      prompt?: string;
      context?: string;
    };

    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        available: true,
        code: 'INVALID_INPUT',
        message: 'Vui lòng nhập nội dung yêu cầu cho Trợ lý AI Ngữ văn.',
      });
    }

    const systemInstruction = `Bạn là chuyên gia giáo dục Ngữ văn THPT theo Chương trình GDPT 2018 tại Việt Nam.
NGUYÊN TẮC BẮT BUỘC:
1. Chỉ phân tích và gợi ý dựa trên ngữ liệu, đề bài hoặc thông tin thực tế do giáo viên/học sinh cung cấp.
2. Tuyệt đối KHÔNG tự bịa tác giả, tác phẩm, dẫn chứng, nhà xuất bản hoặc số trang không có trong ngữ liệu. Nếu thiếu thông tin nguồn, hãy nêu rõ cần giáo viên bổ sung hoặc kiểm chứng.
3. Không viết hộ toàn bộ bài văn hoàn chỉnh để học sinh sao chép; với phần luyện viết, chỉ gợi ý tìm ý, lập dàn ý, luận điểm và nhận xét theo tiêu chí.
4. Trình bày bằng tiếng Việt chuẩn mực, rõ ràng, phù hợp chuyên môn Ngữ văn THPT lớp 10, 11, 12.`;

    const fullContents = context
      ? `Nhiệm vụ: ${task || 'Hỗ trợ chuyên môn Ngữ văn'}\n\nNgữ liệu / Ngữ cảnh cung cấp:\n${context}\n\nYêu cầu cụ thể:\n${prompt}`
      : `Nhiệm vụ: ${task || 'Hỗ trợ chuyên môn Ngữ văn'}\n\nYêu cầu cụ thể:\n${prompt}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: fullContents,
        config: {
          systemInstruction,
        },
      });

      return res.json({
        available: true,
        text: response.text ?? '',
        model: 'gemini-4-hydrogen',
      });
    } catch (error: unknown) {
      const errMsg = error instanceof Error ? error.message : String(error);
      if (errMsg.includes('RESOURCE_EXHAUSTED') || errMsg.includes('429')) {
        return res.status(429).json({
          available: false,
          code: 'QUOTA_EXHAUSTED',
          message:
            'Dịch vụ AI tạm thời hết hạn mức sử dụng. Bạn vẫn có thể soạn thảo thủ công, sử dụng mẫu nghiệp vụ và lưu/xuất tài liệu bình thường.',
        });
      }
      if (errMsg.includes('PERMISSION_DENIED') || errMsg.includes('API_KEY_INVALID') || errMsg.includes('403') || errMsg.includes('400')) {
        return res.status(503).json({
          available: false,
          code: 'API_KEY_INVALID',
          message:
            'Khóa dịch vụ AI trên máy chủ chưa hợp lệ hoặc chưa được cấp quyền. Các chức năng cốt lõi không phụ thuộc AI vẫn hoạt động bình thường.',
        });
      }
      return res.status(500).json({
        available: false,
        code: 'AI_ERROR',
        message: 'Không thể kết nối tới dịch vụ AI lúc này. Dữ liệu của bạn vẫn được bảo toàn cục bộ.',
      });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Văn Học Thông Minh server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
