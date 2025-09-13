#!/bin/bash

# Google Cloud Run Deployment Script for SyntharaCare

# Configuration
PROJECT_ID="syntharacare"
SERVICE_NAME="syntharacare-api"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Deploying SyntharaCare to Google Cloud Run..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    echo "   Visit: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ Not authenticated with gcloud. Please run: gcloud auth login"
    exit 1
fi

# Set the project
echo "📋 Setting project to $PROJECT_ID..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable containerregistry.googleapis.com

# Build and push the image
echo "🏗️ Building and pushing Docker image..."
gcloud builds submit --tag $IMAGE_NAME


# Create custom service account if it doesn't exist
echo "🔐 Setting up service account..."
gcloud iam service-accounts create syntharacare-run \
    --display-name="SyntharaCare Cloud Run Service Account" \
    --description="Service account for SyntharaCare Cloud Run deployment" 2>/dev/null || echo "Service account already exists"

# Grant necessary permissions
echo "🔑 Granting permissions..."
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:syntharacare-run@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/secretmanager.secretAccessor" 2>/dev/null || echo "Secret accessor role already granted"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:syntharacare-run@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/storage.objectAdmin" 2>/dev/null || echo "Storage admin role already granted"

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image $IMAGE_NAME \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --port 8080 \
    --memory 1Gi \
    --cpu 1 \
    --max-instances 10 \
    --service-account syntharacare-run@$PROJECT_ID.iam.gserviceaccount.com \
    --set-env-vars NODE_ENV=production \
    --set-env-vars GEMINI_API_KEY=AIzaSyBlmnCUVeDPrPj_zBOsneSjbI3_dlnTb2g \
    --set-secrets GCS_CREDENTIALS=GCS_CREDENTIALS:latest \
    --set-env-vars GCS_PROJECT_ID=$PROJECT_ID \
    --set-env-vars GCS_BUCKET_NAME=syntharauibucket

echo "✅ Deployment complete!"
echo "🌐 Your service is available at:"
gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)"
