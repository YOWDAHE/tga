# Archives Server Storage Migration

## Overview

The archives system has been migrated from Cloudinary to server storage, similar to how partner images are handled in the landing page. This change provides better performance, cost savings, and eliminates dependency on external services for document storage.

## What Changed

### Backend Changes

1. **Uploads Controller** (`backend/src/controllers/uploads.controller.ts`):
   - Removed Cloudinary upload logic
   - Added server storage logic using Node.js file system
   - Files are saved to `backend/uploads/documents/` directory
   - Added `serveDocument` function to serve files
   - Added migration function for existing Cloudinary documents

2. **Uploads Router** (`backend/src/routes/uploads.route.ts`):
   - Added route for serving documents: `GET /documents/:filename`
   - Added migration route: `POST /migrate-cloudinary`

3. **Server Configuration** (`backend/src/server.ts`):
   - Added static file serving for documents directory
   - Configured proper headers for PDF files

4. **Database Schema** (`backend/src/db/schema.ts`):
   - Updated comments to reflect server storage instead of Cloudinary
   - `file_url` now points to server path
   - `public_id` now stores filename instead of Cloudinary public_id

### Frontend Changes

1. **API Routes** (`app/api/uploads/[...path]/route.ts`):
   - Updated to handle both `partners` and `documents` folders
   - Added proper routing for document serving

2. **Migration API** (`app/api/archives/migrate-cloudinary/route.ts`):
   - New route to handle migration of existing documents

3. **Test Page** (`app/archives/server-storage-test/page.tsx`):
   - Test page to verify server storage functionality
   - Includes migration testing

## File Structure

```
backend/
├── uploads/
│   ├── partners/          # Partner images (existing)
│   └── documents/         # Archive documents (new)
│       ├── document_1234567890_abc123.pdf
│       └── document_1234567891_def456.pdf
```

## URL Structure

- **Old (Cloudinary)**: `https://res.cloudinary.com/.../uploads/...`
- **New (Server)**: `http://localhost:3000/uploads/documents/document_1234567890_abc123.pdf`

## Migration Process

### Automatic Migration

1. Access the test page: `/archives/server-storage-test`
2. Click "Test Migration (Cloudinary to Server)"
3. The system will identify Cloudinary URLs and update them

### Manual Migration

If you have existing documents with Cloudinary URLs, you can run the migration:

```bash
# Via API
POST /api/archives/migrate-cloudinary

# Via backend directly
POST /uploads/migrate-cloudinary
```

## Benefits

1. **Cost Savings**: No more Cloudinary costs for document storage
2. **Performance**: Faster file serving from local server
3. **Control**: Full control over file storage and access
4. **Consistency**: Same approach as partner images
5. **Simplicity**: Reduced external dependencies

## Security Considerations

1. **File Validation**: Only PDF files are accepted
2. **Path Validation**: Directory traversal protection in place
3. **Access Control**: Files are served through authenticated routes
4. **File Size Limits**: Implemented in upload validation

## Testing

1. **Upload Test**: Upload a new document and verify it's stored on server
2. **Serving Test**: Verify documents can be downloaded/viewed
3. **Migration Test**: Test migration of existing Cloudinary documents
4. **Delete Test**: Verify file deletion removes both database entry and server file

## Rollback Plan

If needed, you can rollback to Cloudinary by:

1. Reverting the controller changes
2. Updating the upload logic to use Cloudinary
3. Migrating files back to Cloudinary
4. Updating database URLs

## Monitoring

Monitor the following after migration:

1. File upload success rates
2. File serving performance
3. Disk space usage in `backend/uploads/documents/`
4. Error logs for file operations

## Future Enhancements

1. **File Compression**: Implement PDF compression to save space
2. **CDN Integration**: Add CDN for better global performance
3. **Backup Strategy**: Implement automated backups of document directory
4. **File Versioning**: Add support for document versioning 