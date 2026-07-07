import 'reflect-metadata';
import { Logger } from '@nestjs/common';
import { config } from 'dotenv';

config({ path: ['.env', '../../.env'] });

async function main() {
  const logger = new Logger('WorkerMain');
  logger.log('🛠  BullMQ Worker 进程启动');

  // 动态 import，避免在 main.ts 启动时加载 worker
  const { AgentJobWorker } = await import('./agent-job.worker.js');
  const { VideoJobWorker } = await import('./video-job.worker.js');

  const agentWorker = new AgentJobWorker();
  const videoWorker = new VideoJobWorker();

  const shutdown = (sig: string) => {
    logger.log(`收到 ${sig}，关闭 worker...`);
    void Promise.all([agentWorker.close(), videoWorker.close()]).then(() => process.exit(0));
  };
  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
  process.exit(1);
});
