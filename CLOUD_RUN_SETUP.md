# Google Cloud Run Deployment Guide

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed and authenticated
3. **Docker** installed (for local testing)

## Setup Steps

### 1. Install gcloud CLI

```bash
# Download and install gcloud CLI
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Authenticate
gcloud auth login
gcloud auth configure-docker
```

### 2. Set up your project

```bash
# Set your project ID
export PROJECT_ID="syntharacare"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com
```

### 3. Create GCS Secret

```bash
# Create a secret for your GCS credentials
gcloud secrets create GCS_CREDENTIALS --data-file=server/config/gcs-key.json
```

### 4. Deploy to Cloud Run

#### Option A: Using the deployment script
```bash
chmod +x deploy-cloud-run.sh
./deploy-cloud-run.sh
```

#### Option B: Manual deployment
```bash
# Build and push image
gcloud builds submit --tag gcr.io/$PROJECT_ID/syntharacare-api

# Deploy to Cloud Run
gcloud run deploy syntharacare-api \
    --image gcr.io/$PROJECT_ID/syntharacare-api \
    --platform managed \
    --region us-central1 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --set-env-vars NODE_ENV=production \
    --set-secrets GCS_CREDENTIALS=GCS_CREDENTIALS:latest \
    --set-env-vars GCS_PROJECT_ID=$PROJECT_ID \
    --set-env-vars GCS_BUCKET_NAME=syntharauibucket
```

## Environment Variables

Set these in Cloud Run:

- `NODE_ENV=production`
- `PORT=8080`
- `GCS_PROJECT_ID=your-project-id`
- `GCS_BUCKET_NAME=your-bucket-name`
- `GCS_CREDENTIALS` (as secret)

## Database Configuration

Make sure your MongoDB connection string is set in Cloud Run:

```bash
gcloud run services update syntharacare-api \
    --region us-central1 \
    --set-env-vars MONGODB_URI="mongodb+srv://username:password@cluster.mongodb.net/syntharacare"
```

## Frontend Deployment

Update your frontend to point to the new Cloud Run URL:

```javascript
// In client/src/utils/api.js
const API_BASE_URL = 'https://your-cloud-run-url.run.app';
```

## Monitoring

- **Logs**: `gcloud logs read --service=syntharacare-api`
- **Metrics**: Google Cloud Console > Cloud Run > syntharacare-api
- **Health Check**: `https://your-service-url.run.app/health`

## Troubleshooting

### Container fails to start
- Check logs: `gcloud logs read --service=syntharacare-api`
- Verify PORT=8080 is set
- Check health endpoint: `/health`

### GCS errors
- Verify GCS_CREDENTIALS secret is set correctly
- Check service account permissions
- Test GCS connection locally first

### Database connection issues
- Verify MONGODB_URI is set correctly
- Check MongoDB Atlas IP whitelist
- Test connection locally first

## Cost Optimization

- Set `--min-instances=0` for cost savings
- Use `--max-instances=10` to limit costs
- Monitor usage in Cloud Console
- Set up billing alerts
