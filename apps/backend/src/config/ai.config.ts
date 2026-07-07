import { registerAs } from '@nestjs/config';

export default registerAs('ai', () => ({
  deepseek: {
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseUrl: process.env.DEEPSEEK_BASE_URL ?? 'https://api.deepseek.com',
  },
  glm: {
    apiKey: process.env.GLM_API_KEY,
    baseUrl: process.env.GLM_BASE_URL ?? 'https://open.bigmodel.cn/api/paas/v4',
  },
  qwen: { apiKey: process.env.QWEN_API_KEY },
  siliconflow: {
    apiKey: process.env.SILICONFLOW_API_KEY,
    baseUrl: process.env.SILICONFLOW_BASE_URL ?? 'https://api.siliconflow.cn/v1',
  },
  tongyi: { apiKey: process.env.TONGYI_API_KEY },
  volcano: {
    appId: process.env.VOLCANO_APP_ID,
    apiKey: process.env.VOLCANO_API_KEY,
    tts: {
      appId: process.env.VOLCANO_TTS_APPID,
      token: process.env.VOLCANO_TTS_TOKEN,
      cluster: process.env.VOLCANO_TTS_CLUSTER ?? 'volcano_tts',
    },
  },
  jimeng: { apiKey: process.env.JIMENG_API_KEY },
  budget: {
    dailySoftCents: Number(process.env.AI_DAILY_BUDGET_CENTS ?? 10000),
    dailyHardCents: Number(process.env.AI_DAILY_BUDGET_HARD_LIMIT_CENTS ?? 20000),
    agentCents: Number(process.env.AI_AGENT_DAILY_BUDGET_CENTS ?? 8000),
    videoCents: Number(process.env.AI_VIDEO_DAILY_BUDGET_CENTS ?? 20000),
  },
}));
