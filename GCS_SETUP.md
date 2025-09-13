# Google Cloud Storage Setup Guide

This guide will help you set up Google Cloud Storage (GCS) for file uploads in your SyntharaCare application.

## Prerequisites

1. A Google Cloud Platform (GCP) account
2. A GCP project with billing enabled
3. A GCS bucket created

## Step 1: Create a GCS Bucket

1. Go to the [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **Cloud Storage** > **Buckets**
3. Click **Create Bucket**
4. Choose a unique bucket name (e.g., `syntharacare-uploads`)
5. Select a location for your bucket
6. Choose **Standard** storage class
7. Set access control to **Uniform**
8. Click **Create**

## Step 2: Create a Service Account

1. In the Google Cloud Console, go to **IAM & Admin** > **Service Accounts**
2. Click **Create Service Account**
3. Enter a name (e.g., `syntharacare-storage`)
4. Add a description (optional)
5. Click **Create and Continue**
6. Grant the following roles:
   - **Storage Object Admin** (for full access to objects)
   - **Storage Legacy Bucket Reader** (for bucket access)
7. Click **Continue** and then **Done**

## Step 3: Generate Service Account Key

1. Find your newly created service account in the list
2. Click on the service account email
3. Go to the **Keys** tab
4. Click **Add Key** > **Create New Key**
5. Choose **JSON** format
6. Click **Create**
7. The key file will be downloaded automatically

## Step 4: Configure Environment Variables

### Option 1: Using Environment Variables (Recommended for Production)

Add the following to your `.env` file in the `server` directory:

```env
# Google Cloud Storage Configuration
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-bucket-name
GCS_CREDENTIALS={"type":"service_account","project_id":"your-project-id","private_key_id":"...","private_key":"...","client_email":"...","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}

# File upload settings
MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_FILE_TYPES=application/pdf,image/jpeg,image/png,image/gif,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

**Important**: Copy the entire JSON content from your service account key file and paste it as a single line for the `GCS_CREDENTIALS` value.

### Option 2: Using Service Account Key File (Development)

1. Place your downloaded JSON key file in `server/config/gcs-key.json`
2. Update the GCS service configuration in `server/services/gcsService.js`:

```javascript
this.storage = new Storage({
  keyFilename: path.join(__dirname, '../config/gcs-key.json'),
  projectId: process.env.GCS_PROJECT_ID
});
```

## Step 5: Configure Bucket Permissions

### Make Bucket Public (for public file access)

1. Go to your bucket in the Google Cloud Console
2. Click on the **Permissions** tab
3. Click **Add Principal**
4. Add `allUsers` as the principal
5. Grant the **Storage Object Viewer** role
6. Click **Save**

### Alternative: Use Signed URLs (for private access)

If you prefer to keep files private and use signed URLs:

1. Skip the public bucket configuration above
2. The application will automatically generate signed URLs for file access
3. Files will be accessible only through the application

## Step 6: Test the Configuration

1. Start your server:
   ```bash
   cd server
   npm run dev
   ```

2. Test the GCS connection by making a request to:
   ```
   GET /api/uploads/health-check
   ```
   (Requires admin authentication)

3. Try uploading a file through the health history upload feature

## Step 7: Update Frontend Configuration

The frontend is already configured to work with the new GCS setup. The existing health history upload feature will automatically use GCS instead of local storage.

## File Structure in GCS

Files will be organized in your bucket as follows:

```
your-bucket-name/
├── health-history/
│   ├── document-1234567890-123456789.pdf
│   ├── image-1234567890-123456789.jpg
│   └── ...
├── general/
│   ├── file-1234567890-123456789.txt
│   └── ...
└── prescriptions/
    ├── prescription-1234567890-123456789.pdf
    └── ...
```

## Security Considerations

1. **Never commit your service account key to version control**
2. **Use environment variables in production**
3. **Regularly rotate your service account keys**
4. **Monitor your GCS usage and costs**
5. **Set up appropriate IAM policies for your use case**

## Troubleshooting

### Common Issues

1. **Authentication Error**: Check your service account key and permissions
2. **Bucket Not Found**: Verify the bucket name and project ID
3. **Permission Denied**: Ensure the service account has the correct roles
4. **File Upload Fails**: Check file size limits and allowed file types

### Debug Mode

Enable debug mode by setting `NODE_ENV=development` to see detailed error messages.

### Health Check

Use the health check endpoint to verify your GCS configuration:

```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:5000/api/uploads/health-check
```

## Cost Optimization

1. **Set up lifecycle policies** to automatically delete old files
2. **Use appropriate storage classes** (Standard, Nearline, Coldline, Archive)
3. **Monitor usage** through the GCP Console
4. **Set up billing alerts** to avoid unexpected charges

## Migration from Local Storage

If you're migrating from local storage:

1. The new system will automatically use GCS for new uploads
2. Existing files in local storage will continue to work
3. Consider migrating existing files to GCS for consistency

## Support

For issues with this setup:

1. Check the server logs for detailed error messages
2. Verify your GCS configuration using the health check endpoint
3. Ensure your service account has the correct permissions
4. Check the GCP Console for any service issues
