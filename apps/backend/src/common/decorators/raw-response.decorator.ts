import { SetMetadata } from '@nestjs/common';

export const RAW_RESPONSE_KEY = 'raw_response';

/** 跳过 ResponseInterceptor 的统一封装（如 Swagger 文件、webhook 回调） */
export const RawResponse = () => SetMetadata(RAW_RESPONSE_KEY, true);
