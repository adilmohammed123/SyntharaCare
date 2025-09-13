# GCS Credentials Setup Guide

This guide explains how to set up Google Cloud Storage credentials for your SyntharaCare application.

## What are GCS Credentials?

GCS credentials are authentication information that allows your application to access your Google Cloud Storage bucket. They contain:
- Project ID
- Service account email
- Private key
- Authentication URLs

## Step-by-Step Setup

### Step 1: Create a Service Account

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Navigate to **IAM & Admin** > **Service Accounts**
3. Click **Create Service Account**
4. Fill in the details:
   - **Name**: `syntharacare-storage` (or any name you prefer)
   - **Description**: `Service account for SyntharaCare file uploads`
5. Click **Create and Continue**

### Step 2: Assign Roles

Grant the following roles to your service account:
- **Storage Object Admin** (for full access to objects)
- **Storage Legacy Bucket Reader** (for bucket access)

### Step 3: Generate Service Account Key

1. Find your newly created service account in the list
2. Click on the service account email
3. Go to the **Keys** tab
4. Click **Add Key** > **Create New Key**
5. Choose **JSON** format
6. Click **Create**
7. The JSON file will be downloaded automatically

### Step 4: Configure Credentials

You have two options for providing credentials:

#### Option A: Environment Variable (Recommended)

1. Open the downloaded JSON file
2. Copy the entire JSON content
3. Add it to your `.env` file in the `server` directory:

```env
# Google Cloud Storage Configuration
GCS_PROJECT_ID=your-project-id
GCS_BUCKET_NAME=your-bucket-name
GCS_CREDENTIALS={"type":"service_account","project_id":"your-project-id","private_key_id":"abc123...","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n","client_email":"your-service-account@your-project-id.iam.gserviceaccount.com","client_id":"123456789...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/your-service-account%40your-project-id.iam.gserviceaccount.com"}
```

**Important**: The entire JSON must be on a single line with escaped quotes.

#### Option B: Key File (Development Only)

1. Place the downloaded JSON file in `server/config/gcs-key.json`
2. Update the GCS service configuration in `server/services/gcsService.js`:

```javascript
this.storage = new Storage({
  keyFilename: path.join(__dirname, '../config/gcs-key.json'),
  projectId: process.env.GCS_PROJECT_ID
});
```

## Example .env File

Here's a complete example of what your `.env` file should look like:

```env
# Database
MONGODB_URI=mongodb://localhost:27017/hospital_management

# JWT
JWT_SECRET=your-jwt-secret

# Google Cloud Storage
GCS_PROJECT_ID=my-syntharacare-project
GCS_BUCKET_NAME=my-syntharacare-bucket
GCS_CREDENTIALS={"type":"service_account","project_id":"my-syntharacare-project","private_key_id":"abc123def456","private_key":"-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC7VJTUt9Us8cKB\nwEiLt77OTiGGY2RYM1DMjjH2blWQtMio6C5p77F8V8zKp3Ckp3I6t3I6t3I6t3I6\nt3I6t3I6t3I6t3I6t3I6t3I6t3I6t3I6t3I6t3I6t3I6t3I6t3I6t3I6t3I6t3I6\n-----END PRIVATE KEY-----\n","client_email":"syntharacare-storage@my-syntharacare-project.iam.gserviceaccount.com","client_id":"123456789012345678901","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"https://www.googleapis.com/robot/v1/metadata/x509/syntharacare-storage%40my-syntharacare-project.iam.gserviceaccount.com"}

# File Upload Settings
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=application/pdf,image/jpeg,image/png,image/gif,text/plain,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

## Testing Your Credentials

After setting up your credentials, test them using the provided test script:

```bash
cd server
node scripts/testGCS.js
```

This will verify that:
- Your credentials are valid
- You can access your bucket
- You can upload, download, and delete files

## Security Best Practices

1. **Never commit credentials to version control**
2. **Use environment variables in production**
3. **Regularly rotate your service account keys**
4. **Use the principle of least privilege** (only grant necessary permissions)
5. **Monitor your GCS usage and costs**

## Troubleshooting

### Common Issues

1. **"Invalid credentials" error**:
   - Check that your JSON is properly formatted
   - Ensure all quotes are escaped in the environment variable
   - Verify the service account has the correct permissions

2. **"Bucket not found" error**:
   - Check your bucket name
   - Ensure the bucket exists in the correct project
   - Verify the service account has access to the bucket

3. **"Permission denied" error**:
   - Check that your service account has the required roles
   - Ensure the bucket permissions are set correctly

### Getting Help

If you're still having issues:
1. Check the server logs for detailed error messages
2. Verify your GCS configuration using the health check endpoint
3. Test your credentials using the Google Cloud Console
4. Review the GCS_SETUP.md guide for additional troubleshooting

## Alternative: Using Application Default Credentials

For development, you can also use Application Default Credentials:

1. Install the Google Cloud CLI
2. Run `gcloud auth application-default login`
3. Remove the credentials configuration from your code

This method is convenient for development but not recommended for production.
