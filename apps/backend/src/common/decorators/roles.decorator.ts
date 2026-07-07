import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/** 角色 RBAC 装饰器（与 JwtAuthGuard + RolesGuard 配合） */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
