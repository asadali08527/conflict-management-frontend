# S3 File Upload - Deployment Checklist

## ✅ Backend Implementation Status

### Package Installation
- [x] `@aws-sdk/client-s3` installed
- [x] `@aws-sdk/s3-request-presigner` installed
- [x] `uuid` already installed (used for unique file keys)

### Core Services
- [x] `src/services/s3Service.js` - Complete AWS SDK v3 implementation
  - [x] S3Client initialized with credentials
  - [x] `generatePresignedUploadUrl()` - Creates upload URLs
  - [x] `generatePresignedDownloadUrl()` - Creates download URLs
  - [x] `uploadFile()` - Backend upload (backward compatibility)
  - [x] `uploadMultipleFiles()` - Batch uploads
  - [x] `deleteFile()` - File deletion
  - [x] `deleteMultipleFiles()` - Batch deletion
  - [x] `getFileUrl()` - Get presigned URL
  - [x] `isConfigured()` - Configuration check

### Controllers
- [x] `src/controllers/fileController.js` - New file controller
  - [x] `generateUploadUrl` - Presigned URL generation
  - [x] `saveFileRecord` - Save file metadata
  - [x] `getDownloadUrl` - Get download URL
  - [x] `deleteFile` - Delete file
  - [x] `getUploadConfig` - Get configuration
- [x] Updated `src/controllers/caseSubmissionController.js`
  - [x] Step 6 supports new flow
  - [x] Backward compatible with old flow
- [x] Updated `src/controllers/userController.js`
  - [x] Profile picture upload supports new flow
  - [x] Backward compatible with old flow
- [x] Updated `src/controllers/caseController.js`
  - [x] Document upload supports new flow
  - [x] Backward compatible with old flow

### Routes
- [x] `src/routes/files.js` - New file routes
  - [x] GET `/api/files/config`
  - [x] POST `/api/files/generate-upload-url`
  - [x] POST `/api/files/save-file-record`
  - [x] GET `/api/files/download-url/:fileKey`
  - [x] DELETE `/api/files/:fileKey`
- [x] Routes registered in `src/app.js`
- [x] All routes protected with JWT authentication
- [x] Swagger documentation added

### Validation
- [x] `src/utils/validators.js` enhanced with:
  - [x] `generateUploadUrlSchema` - Upload URL validation
  - [x] `saveFileRecordSchema` - File record validation
  - [x] `validateFileType()` - File type validation
  - [x] `validateFileSize()` - File size validation
  - [x] `sanitizeFileName()` - Filename sanitization
  - [x] `FILE_TYPES` - File type configurations
  - [x] `UPLOAD_CONTEXTS` - Context configurations

### Models
- [x] `Case.documents` - Has `url` and `key` fields ✓
- [x] `CaseFile` - Has `uploadUrl` and `storageKey` ✓
- [x] `Message.attachments` - Has `url` and `key` ✓
- [x] `User.profilePicture` - Has `url` and `key` ✓

### Testing
- [x] Server starts without errors
- [x] MongoDB connection successful
- [x] Health endpoint responds correctly
- [x] All routes registered properly

### Documentation
- [x] `S3_FILE_UPLOAD_GUIDE.md` - Frontend integration guide
- [x] `S3_IMPLEMENTATION_SUMMARY.md` - Implementation overview
- [x] `S3_CORS_CONFIGURATION.md` - CORS setup guide
- [x] `DEPLOYMENT_CHECKLIST.md` - This file
- [x] Swagger API documentation
- [x] Code comments and JSDoc

## ⚠️ Pre-Deployment Tasks

### 1. AWS S3 Configuration
- [ ] **S3 Bucket Created**: `conflict-management-files`
- [ ] **IAM User Created** with permissions:
  - [ ] `s3:PutObject`
  - [ ] `s3:GetObject`
  - [ ] `s3:DeleteObject`
  - [ ] `s3:ListBucket`
- [ ] **CORS Configured** on S3 bucket (see `S3_CORS_CONFIGURATION.md`)
- [ ] **Block Public Access** configured appropriately
- [ ] **Bucket Policy** set (if needed)

### 2. Environment Variables
Verify `.env` has:
```env

AWS_REGION=us-east-1
AWS_S3_BUCKET_NAME=conflict-management-files
```

**For Production:**
- [ ] Use different IAM credentials (not the same as dev)
- [ ] Store credentials securely (AWS Secrets Manager, env variables)
- [ ] Never commit `.env` to version control

### 3. CORS Configuration (CRITICAL!)
- [ ] Add CORS configuration to S3 bucket
- [ ] Include all frontend domains in `AllowedOrigins`
- [ ] Test CORS from browser (see `S3_CORS_CONFIGURATION.md`)

Example CORS configuration:
```json
{
  "AllowedOrigins": [
    "http://localhost:3000",
    "https://yourdomain.com"
  ],
  "AllowedMethods": ["GET", "PUT", "POST", "DELETE"],
  "AllowedHeaders": ["*"],
  "ExposeHeaders": ["ETag"],
  "MaxAgeSeconds": 3600
}
```

### 4. Security Checklist
- [ ] JWT authentication working on all file endpoints
- [ ] File type validation enabled
- [ ] File size limits configured
- [ ] Filename sanitization working
- [ ] S3 bucket is private (not public)
- [ ] Presigned URLs expire after 1 hour
- [ ] IAM user has minimal required permissions

### 5. Testing Checklist
- [ ] Test presigned URL generation
- [ ] Test file upload to S3
- [ ] Test file record saving
- [ ] Test file download URL generation
- [ ] Test file deletion
- [ ] Test with different file types
- [ ] Test with large files (near size limits)
- [ ] Test authentication (invalid tokens rejected)
- [ ] Test CORS from frontend

## 🚀 Deployment Steps

### Step 1: Verify Backend Changes
```bash
# 1. Install dependencies
npm install

# 2. Start server
npm run dev

# 3. Check for errors
# Should see: "Server running in development mode on port 8000"
# Should see: "MongoDB Connected: ..."
```

### Step 2: Configure AWS S3
1. Create S3 bucket (if not exists): `conflict-management-files`
2. Configure CORS (see `S3_CORS_CONFIGURATION.md`)
3. Set bucket policy for presigned URL access
4. Verify IAM user permissions

### Step 3: Test API Endpoints
```bash
# Get auth token first
TOKEN="your-jwt-token"

# Test config endpoint
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8000/api/files/config

# Test presigned URL generation
curl -X POST http://localhost:8000/api/files/generate-upload-url \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fileName": "test.pdf",
    "fileType": "application/pdf",
    "fileSize": 1024,
    "uploadContext": "case"
  }'
```

### Step 4: Frontend Integration
1. Share `S3_FILE_UPLOAD_GUIDE.md` with frontend team
2. Provide API endpoint URLs
3. Provide test credentials (for dev environment)
4. Help with implementation if needed

### Step 5: Production Deployment
1. Update `.env` with production AWS credentials
2. Update CORS configuration with production domain
3. Deploy backend to production server
4. Test file upload from production frontend
5. Monitor logs for errors

## 📊 Monitoring & Maintenance

### What to Monitor
- [ ] S3 storage usage (AWS Console)
- [ ] API error rates (check logs)
- [ ] Upload success/failure rates
- [ ] Presigned URL expiry issues
- [ ] CORS errors (frontend console)

### Logs to Check
```bash
# Backend logs
tail -f logs/app.log

# Look for:
# - "S3 Upload Error"
# - "Error generating presigned URL"
# - "Failed to save file record"
```

### Common Issues

**Issue 1: CORS errors**
- Solution: Check S3 CORS configuration
- Verify frontend domain in AllowedOrigins

**Issue 2: "Signature expired"**
- Solution: Presigned URLs expire after 1 hour
- User needs to request new URL

**Issue 3: "Access Denied"**
- Solution: Check IAM user permissions
- Verify bucket policy

**Issue 4: File not found**
- Solution: Check S3 bucket name
- Verify file key is correct

## 🔄 Rollback Plan

If something goes wrong:

1. **Frontend issues only**: Frontend can fall back to old upload method
   - Old endpoints still work: `PUT /api/users/profile`, `POST /api/cases/:id/documents`

2. **Backend issues**:
   - Revert to previous commit
   - Remove file routes from `src/app.js`
   - Old multer-based uploads continue working

3. **S3 issues**:
   - Check AWS credentials
   - Check S3 bucket configuration
   - Check CORS settings

## 📈 Performance Optimization

### Recommended Settings
- **S3 Transfer Acceleration**: Enable for faster uploads
- **CloudFront CDN**: For faster downloads (optional)
- **S3 Lifecycle Policies**: Archive old files to Glacier
- **S3 Intelligent Tiering**: Automatic cost optimization

### Code Optimizations
- [x] Direct S3 uploads (no backend bottleneck)
- [x] Presigned URLs cached for 1 hour
- [x] Minimal database writes
- [ ] Consider: Batch file operations
- [ ] Consider: Background job for cleanup

## 🎯 Success Criteria

- ✅ Backend deploys without errors
- ✅ Server starts successfully
- ✅ Health endpoint returns 200
- ✅ File routes accessible
- ✅ JWT authentication working
- ✅ S3 uploads successful
- ✅ File records saved to database
- ✅ Download URLs generated
- ✅ No CORS errors from frontend
- ✅ Files accessible via presigned URLs

## 📞 Support Contacts

**For AWS Issues:**
- Check AWS Support documentation
- Review IAM permissions
- Check S3 bucket policies

**For Backend Issues:**
- Check server logs
- Review error messages
- Verify environment variables

**For Frontend Issues:**
- Check browser console
- Verify API endpoints
- Test with Postman/curl first

## 📝 Post-Deployment Tasks

- [ ] Update API documentation
- [ ] Inform frontend team of changes
- [ ] Schedule cleanup of old files (if needed)
- [ ] Set up monitoring/alerts
- [ ] Document any production-specific configurations
- [ ] Update README with new endpoints

---

**Implementation Date**: January 2025
**Status**: ✅ Backend Complete - Ready for Deployment
**Next Step**: Configure S3 CORS and test with frontend
