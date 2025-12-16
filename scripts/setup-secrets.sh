#!/bin/bash
# One-time setup: Store GEMINI_API_KEY in Google Secret Manager
# Run this once per project to enable automatic secret injection during deploys

set -e

PROJECT_ID="${GCP_PROJECT_ID:-gen-lang-client-0939607979}"
SECRET_NAME="GEMINI_API_KEY"

echo "=== Grove Foundation Secret Manager Setup ==="
echo "Project: $PROJECT_ID"
echo ""

# Check if gcloud is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | head -n1 > /dev/null 2>&1; then
    echo "Error: Not authenticated with gcloud. Run: gcloud auth login"
    exit 1
fi

# Check if secret exists
if gcloud secrets describe $SECRET_NAME --project=$PROJECT_ID &>/dev/null; then
    echo "✓ Secret '$SECRET_NAME' already exists"
    echo ""
    echo "To update the secret value:"
    echo "  echo -n 'YOUR_API_KEY' | gcloud secrets versions add $SECRET_NAME --project=$PROJECT_ID --data-file=-"
    echo ""
else
    echo "Creating secret '$SECRET_NAME'..."
    gcloud secrets create $SECRET_NAME \
        --project=$PROJECT_ID \
        --replication-policy="automatic"
    echo "✓ Secret created"
    echo ""
    echo "Add your API key with:"
    echo "  echo -n 'YOUR_API_KEY' | gcloud secrets versions add $SECRET_NAME --project=$PROJECT_ID --data-file=-"
    echo ""
fi

# Grant Cloud Run access
echo "Granting Cloud Run service account access..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')
SERVICE_ACCOUNT="${PROJECT_NUMBER}-compute@developer.gserviceaccount.com"

if gcloud secrets add-iam-policy-binding $SECRET_NAME \
    --project=$PROJECT_ID \
    --member="serviceAccount:${SERVICE_ACCOUNT}" \
    --role="roles/secretmanager.secretAccessor" &>/dev/null; then
    echo "✓ IAM binding added for $SERVICE_ACCOUNT"
else
    echo "✓ IAM binding already exists"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "The secret is now configured. Cloud Build will automatically inject"
echo "GEMINI_API_KEY into Cloud Run during deployments."
echo ""
echo "To verify the secret value:"
echo "  gcloud secrets versions access latest --secret=$SECRET_NAME --project=$PROJECT_ID"
echo ""
echo "To deploy:"
echo "  gcloud builds submit --config cloudbuild.yaml"
