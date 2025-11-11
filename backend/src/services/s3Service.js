const { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

/**
 * S3 Service Module
 * Handles AWS S3 file operations using AWS SDK v3
 * - Generates presigned URLs for direct client-to-S3 uploads
 * - Generates presigned URLs for secure file downloads
 * - Handles file deletion from S3
 */

class S3Service {
  constructor() {
    // P0 Fix: Align with AWS standard env variable names
    // Support both old and new variable names for backward compatibility
    this.bucketName = process.env.AWS_S3_BUCKET || process.env.AWS_S3_BUCKET_NAME;
    this.region = process.env.AWS_REGION || 'us-east-1';

    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    // Initialize S3 Client with credentials
    this.s3Client = new S3Client({
      region: this.region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    // Validate configuration
    if (!this.isConfigured()) {
      console.error('AWS S3 is not properly configured. Missing required environment variables:');
      if (!this.bucketName) console.error('  - AWS_S3_BUCKET');
      if (!accessKeyId) console.error('  - AWS_ACCESS_KEY_ID');
      if (!secretAccessKey) console.error('  - AWS_SECRET_ACCESS_KEY');
    }
  }

  /**
   * Generate a unique S3 key for file storage
   * @param {String} originalFileName - Original file name
   * @param {String} folder - Folder path (e.g., 'cases', 'profiles', 'messages')
   * @returns {String} - Unique S3 key
   */
  generateFileKey(originalFileName, folder = 'documents') {
    const fileExt = path.extname(originalFileName);
    const timestamp = Date.now();
    const uniqueId = uuidv4();
    return `${folder}/${timestamp}-${uniqueId}${fileExt}`;
  }

  /**
   * Generate presigned URL for uploading file directly from client
   * @param {String} fileName - Original file name
   * @param {String} fileType - MIME type
   * @param {String} folder - S3 folder path
   * @param {Number} expiresIn - URL expiration in seconds (default: 1 hour)
   * @returns {Promise<Object>} - Object with uploadUrl, fileKey, and publicUrl
   */
  async generatePresignedUploadUrl(fileName, fileType, folder = 'documents', expiresIn = 3600) {
    try {
      // Generate unique file key
      const fileKey = this.generateFileKey(fileName, folder);

      // Create PutObject command
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        ContentType: fileType,
      });

      // Generate presigned URL
      const uploadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });

      return {
        success: true,
        uploadUrl,
        fileKey,
        bucket: this.bucketName,
        expiresIn,
      };
    } catch (error) {
      console.error('Error generating presigned upload URL:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Generate presigned URL for downloading/viewing file
   * @param {String} fileKey - S3 object key
   * @param {Number} expiresIn - URL expiration in seconds (default: 1 hour)
   * @returns {Promise<String>} - Presigned download URL
   */
  async generatePresignedDownloadUrl(fileKey, expiresIn = 3600) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      const downloadUrl = await getSignedUrl(this.s3Client, command, { expiresIn });
      return downloadUrl;
    } catch (error) {
      console.error('Error generating presigned download URL:', error);
      throw error;
    }
  }

  /**
   * Upload file to S3 (for backend uploads - backward compatibility)
   * @param {Object} file - File object with buffer (from multer memory storage)
   * @param {String} folder - S3 folder path
   * @returns {Promise<Object>} - Upload result
   */
  async uploadFile(file, folder = 'documents') {
    try {
      // Generate unique file key
      const fileKey = this.generateFileKey(file.originalname, folder);

      // Create upload command
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
        Body: file.buffer,
        ContentType: file.mimetype,
      });

      // Execute upload
      await this.s3Client.send(command);

      // Generate download URL
      const downloadUrl = await this.generatePresignedDownloadUrl(fileKey);

      return {
        success: true,
        url: downloadUrl,
        key: fileKey,
        bucket: this.bucketName,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      };
    } catch (error) {
      console.error('S3 Upload Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Upload multiple files to S3
   * @param {Array} files - Array of file objects
   * @param {String} folder - S3 folder path
   * @returns {Promise<Array>} - Array of upload results
   */
  async uploadMultipleFiles(files, folder = 'documents') {
    const uploadPromises = files.map(file => this.uploadFile(file, folder));
    return Promise.all(uploadPromises);
  }

  /**
   * Delete file from S3
   * @param {String} fileKey - S3 object key
   * @returns {Promise<Object>} - Delete result
   */
  async deleteFile(fileKey) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      });

      await this.s3Client.send(command);

      return {
        success: true,
        key: fileKey,
      };
    } catch (error) {
      console.error('S3 Delete Error:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Delete multiple files from S3
   * @param {Array} fileKeys - Array of S3 object keys
   * @returns {Promise<Array>} - Array of delete results
   */
  async deleteMultipleFiles(fileKeys) {
    const deletePromises = fileKeys.map(key => this.deleteFile(key));
    return Promise.all(deletePromises);
  }

  /**
   * Get file URL (generates presigned URL for private files)
   * @param {String} fileKey - S3 object key
   * @param {Number} expiresIn - URL expiration in seconds
   * @returns {Promise<String>} - File URL
   */
  async getFileUrl(fileKey, expiresIn = 3600) {
    return this.generatePresignedDownloadUrl(fileKey, expiresIn);
  }

  /**
   * Check if S3 service is properly configured
   * P0 Fix: Updated to check standard AWS env variable names
   * @returns {Boolean} - Configuration status
   */
  isConfigured() {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID || process.env.AWS_ACCESS_KEY;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    return !!(
      this.bucketName &&
      accessKeyId &&
      secretAccessKey
    );
  }
}

module.exports = new S3Service();
