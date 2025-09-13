#!/bin/bash

# Production Deployment Script for SyntharaCare
# This script ensures all environment variables are set correctly

set -e  # Exit on any error

# Configuration
PROJECT_ID="syntharacare"
SERVICE_NAME="syntharacare-api"
REGION="us-central1"
IMAGE_NAME="gcr.io/$PROJECT_ID/$SERVICE_NAME"

echo "🚀 Deploying SyntharaCare to Google Cloud Run (Production)..."

# Check if required environment variables are set
if [ -z "$MONGODB_URI" ]; then
    echo "❌ Error: MONGODB_URI environment variable is not set"
    echo "Please set it with: export MONGODB_URI='your-mongodb-connection-string'"
    exit 1
fi

if [ -z "$JWT_SECRET" ]; then
    echo "❌ Error: JWT_SECRET environment variable is not set"
    echo "Please set it with: export JWT_SECRET='your-jwt-secret'"
    exit 1
fi

echo "✅ Environment variables validated"

# Check if gcloud is installed and authenticated
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI is not installed. Please install it first."
    echo "   Visit: https://cloud.google.com/sdk/docs/install"
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

# Deploy to Cloud Run with ALL environment variables
echo "🚀 Deploying to Cloud Run with all environment variables..."
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
    --set-env-vars MONGODB_URI="$MONGODB_URI" \
    --set-env-vars JWT_SECRET="$JWT_SECRET" \
    --set-secrets GCS_CREDENTIALS=GCS_CREDENTIALS:latest \
    --set-env-vars GCS_PROJECT_ID=$PROJECT_ID \
    --set-env-vars GCS_BUCKET_NAME=syntharauibucket

echo "✅ Deployment complete!"
echo "🌐 Your service is available at:"
gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)"

echo ""
echo "🔍 Testing the deployment..."
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --format="value(status.url)")
curl -s "$SERVICE_URL/health" | jq '.' || echo "Health check failed - check logs"

echo ""
echo "📝 Next steps:"
echo "1. Test login at your frontend"
echo "2. Check logs: gcloud logs read --service=$SERVICE_NAME --limit=20"
echo "3. Monitor: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME"
