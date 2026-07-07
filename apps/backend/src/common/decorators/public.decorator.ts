import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'is_public';

/** 标记接口为公开（无需 JWT） */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
