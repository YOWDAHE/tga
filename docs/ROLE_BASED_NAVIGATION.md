# Role-Based Navigation System

This document explains how to use the role-based navigation system that automatically shows/hides navigation items based on user permissions.

## Overview

The role-based navigation system consists of:

1. **AuthContext** - Provides permission checking functions
2. **AdminLayout** - Automatically filters navigation items based on permissions
3. **AuthGuard** - Protects pages based on permissions
4. **ProtectedPage** - Wrapper components for common permission patterns

## Available Permissions

The system supports the following permissions:

- `NEWS_CRUD` - News Management
- `ARCHIVES_CRUD` - Archives Management  
- `CATEGORY_CRUD` - Category Management
- `HOMEPAGE_CRUD` - Homepage Management
- `USER_CRUD` - User Management
- `REMARKS_CRUD` - Remarks Management

## How It Works

### 1. Navigation Filtering

The `AdminLayout` component automatically filters navigation items based on user permissions:

```tsx
// Navigation items with permission requirements
const navigationItems: NavigationItem[] = [
  { label: "Dashboard", icon: IconDashboard, href: "/" },
  { label: "News Management", icon: IconNews, href: "/news", permission: "NEWS_CRUD" },
  { label: "Users", icon: IconUsers, href: "/users", permission: "USER_CRUD" },
  // ... more items
]

// Items are filtered based on user permissions
const filteredNavigationItems = navigationItems.filter(item => {
  if (!item.permission) return true; // Show to all users
  return hasPermission(item.permission); // Check specific permission
});
```

### 2. Permission Checking in Components

Use the `useAuth` hook to check permissions in your components:

```tsx
import { useAuth } from "@/contexts/AuthContext"

function MyComponent() {
  const { hasPermission, hasAnyPermission, hasAllPermissions } = useAuth()
  
  // Check single permission
  const canManageNews = hasPermission("NEWS_CRUD")
  
  // Check if user has any of the permissions
  const canManageContent = hasAnyPermission(["NEWS_CRUD", "ARCHIVES_CRUD"])
  
  // Check if user has all permissions
  const isFullAdmin = hasAllPermissions(["USER_CRUD", "NEWS_CRUD", "ARCHIVES_CRUD"])
  
  return (
    <div>
      {canManageNews && <NewsManagementButton />}
      {canManageContent && <ContentManagementButton />}
      {isFullAdmin && <AdminPanel />}
    </div>
  )
}
```

### 3. Page Protection

Protect entire pages using the `AuthGuard` component:

```tsx
import AuthGuard from "@/components/AuthGuard"

export default function NewsPage() {
  return (
    <AuthGuard requiredPermissions={["NEWS_CRUD"]}>
      <NewsManagement />
    </AuthGuard>
  )
}
```

Or use pre-configured wrappers:

```tsx
import { NewsProtectedPage } from "@/components/ProtectedPage"

export default function NewsPage() {
  return (
    <NewsProtectedPage>
      <NewsManagement />
    </NewsProtectedPage>
  )
}
```

### 4. Conditional Rendering

Show/hide UI elements based on permissions:

```tsx
function NewsCard({ news }) {
  const { hasPermission } = useAuth()
  
  return (
    <Card>
      <Text>{news.title}</Text>
      <Text>{news.content}</Text>
      
      {/* Only show edit button if user has permission */}
      {hasPermission("NEWS_CRUD") && (
        <Button onClick={() => editNews(news.id)}>
          Edit
        </Button>
      )}
    </Card>
  )
}
```

## Usage Examples

### Example 1: Simple Permission Check

```tsx
function UserProfile() {
  const { user, hasPermission } = useAuth()
  
  return (
    <div>
      <h1>{user?.username}</h1>
      
      {/* Only show admin section if user has USER_CRUD permission */}
      {hasPermission("USER_CRUD") && (
        <div>
          <h2>Admin Section</h2>
          <UserManagement />
        </div>
      )}
    </div>
  )
}
```

### Example 2: Multiple Permission Check

```tsx
function Dashboard() {
  const { hasAnyPermission } = useAuth()
  
  // Show content management if user can manage news OR archives
  const canManageContent = hasAnyPermission(["NEWS_CRUD", "ARCHIVES_CRUD"])
  
  return (
    <div>
      <h1>Dashboard</h1>
      
      {canManageContent && (
        <div>
          <h2>Content Management</h2>
          <ContentManagementTools />
        </div>
      )}
    </div>
  )
}
```

### Example 3: Protected Page

```tsx
// app/news/page.tsx
import { NewsProtectedPage } from "@/components/ProtectedPage"

export default function NewsPage() {
  return (
    <NewsProtectedPage>
      <NewsManagement />
    </NewsProtectedPage>
  )
}
```

### Example 4: Custom Permission Check

```tsx
function AdminOnlyPage() {
  return (
    <AuthGuard 
      requiredPermissions={["USER_CRUD", "NEWS_CRUD", "ARCHIVES_CRUD"]}
      requireAny={false} // User must have ALL permissions
    >
      <AdminPanel />
    </AuthGuard>
  )
}
```

## Testing Permissions

Visit `/permissions-demo` to see a live demonstration of how permissions work with your current user account.

## Best Practices

1. **Use specific permissions** - Don't use broad permissions when specific ones will do
2. **Check permissions at multiple levels** - Page level, component level, and action level
3. **Provide fallback UI** - Show appropriate messages when users don't have permissions
4. **Test with different user roles** - Ensure the system works correctly for all user types
5. **Document permission requirements** - Make it clear which permissions are needed for each feature

## Troubleshooting

### Navigation items not showing

1. Check that the user has the required permission in their roles
2. Verify the permission name matches exactly (case-sensitive)
3. Check the browser console for any errors

### Permission checks not working

1. Ensure the user is properly authenticated
2. Check that the user's roles are being loaded correctly
3. Verify the permission names match the defined permissions

### Page access denied

1. Check the required permissions for the page
2. Verify the user has the necessary permissions
3. Check the `requireAny` parameter (true = any permission, false = all permissions)

## Adding New Permissions

To add a new permission:

1. Add it to `types/permissions.ts`:
```tsx
export const USER_PERMISSIONS = [
  // ... existing permissions
  'NEW_PERMISSION',
] as const;
```

2. Add it to the permission options:
```tsx
export const PERMISSION_OPTIONS = [
  // ... existing options
  {
    value: "NEW_PERMISSION" as UserPermission,
    label: "New Feature",
    description: "Description of the new permission",
  },
]
```

3. Use it in navigation items:
```tsx
{ label: "New Feature", icon: IconNew, href: "/new-feature", permission: "NEW_PERMISSION" }
```

4. Use it in permission checks:
```tsx
const canUseNewFeature = hasPermission("NEW_PERMISSION")
``` 