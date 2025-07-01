// User permission types based on admin permissions
export const USER_PERMISSIONS = [
  'NEWS_CRUD',
  'ARCHIVES_CRUD',
  'CATEGORY_CRUD',
  'HOMEPAGE_CRUD',
  'USER_CRUD',
  'REMARKS_CRUD',
] as const;

export type UserPermission = typeof USER_PERMISSIONS[number];

// Permission options with labels and descriptions
export const PERMISSION_OPTIONS = [
  {
    value: "NEWS_CRUD" as UserPermission,
    label: "News Management",
    description: "Create, read, update, and delete news articles. Manage news content and publication.",
  },
  {
    value: "ARCHIVES_CRUD" as UserPermission,
    label: "Archives Management",
    description: "Upload, organize, and manage document archives. Control document categories and access.",
  },
  {
    value: "CATEGORY_CRUD" as UserPermission,
    label: "Category Management",
    description: "Create and manage content categories. Organize and structure site content taxonomy.",
  },
  {
    value: "HOMEPAGE_CRUD" as UserPermission,
    label: "Homepage Management",
    description: "Edit homepage content, hero sections, about us, statistics, and landing page elements.",
  },
  {
    value: "USER_CRUD" as UserPermission,
    label: "User Management",
    description: "Create, edit, and manage user accounts. Control user permissions and access levels.",
  },
  {
    value: "REMARKS_CRUD" as UserPermission,
    label: "Remarks Management",
    description: "View and respond to user remarks and feedback. Manage customer communication.",
  },
] as const;

// Helper function to get permission label
export const getPermissionLabel = (permission: UserPermission): string => {
  return PERMISSION_OPTIONS.find(option => option.value === permission)?.label || permission;
};

// Helper function to get permission description
export const getPermissionDescription = (permission: UserPermission): string => {
  return PERMISSION_OPTIONS.find(option => option.value === permission)?.description || '';
};

// Helper function to check if a permission is valid
export const isValidPermission = (permission: string): permission is UserPermission => {
  return USER_PERMISSIONS.includes(permission as UserPermission);
}; 