export const ADMIN_PERMISSIONS = [
    'NEWS_CRUD',
    'ARCHIVES_CRUD',
    'CATEGORY_CRUD',
    'HOMEPAGE_CRUD',
    'USER_CRUD',
    'REMARKS_CRUD',
] as const;
export type AdminPermission = typeof ADMIN_PERMISSIONS[number];