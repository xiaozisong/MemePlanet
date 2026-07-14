/**
 * BullMQ 队列共享配置
 *
 * 所有队列名称、连接配置、Job 默认选项在此统一管理。
 * Worker 进程和 NestJS 后端进程共用此配置。
 */

import { ConnectionOptions, DefaultJobOptions } from 'bullmq';

/** Redis 连接配置（从环境变量读取，与 backend 主进程共享同一 Redis） */
export const QUEUE_CONNECTION: ConnectionOptions = {
  host: process.env.REDIS_HOST ?? 'localhost',
  port: Number(process.env.REDIS_PORT ?? 6379),
};

/** creation_jobs 队列名称 */
export const CREATION_QUEUE_NAME = 'creation_jobs' as const;

/** creation_jobs Job 默认选项 */
export const CREATION_JOB_CONFIG: DefaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential',
    delay: 2000, // 初始 2s，指数退避
  },
  removeOnComplete: {
    age: 24 * 3600, // 完成后保留 24h
    count: 100,
  },
  removeOnFail: {
    age: 7 * 24 * 3600, // 失败后保留 7 天
    count: 500,
  },
};

/** creation_jobs Worker 配置 */
export const CREATION_WORKER_CONFIG = {
  concurrency: 5,
  // 单个 Job 超时 60s（含重试之间的耗时不累计）
  timeout: 60_000,
} as const;
