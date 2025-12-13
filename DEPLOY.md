# Deploying to Google Cloud Run

Since you are migrating to a Node.js server, we need to build the Docker container and deploy it to Cloud Run.

## Prerequisites
- Google Cloud SDK (`gcloud`) installed and authenticated.
- A Google Cloud Project created.

## 1. Set your Project ID
Replace `YOUR_PROJECT_ID` with your actual Google Cloud Project ID.
```bash
gcloud config set project YOUR_PROJECT_ID
```

## 2. Build the Container
We need to use `gcloud builds submit` to build the image in the cloud. 
**Crucial:** We must pass the `GEMINI_API_KEY` as a build argument so it gets baked into the frontend static files.

```bash
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/grove-foundation \
  --build-arg=GEMINI_API_KEY="your-actual-api-key-here" .
```

## 3. Deploy to Cloud Run
Now deploy the image. We pass the environment variables for the **runtime** (Server) here.

```bash
gcloud run deploy grove-foundation \
  --image gcr.io/YOUR_PROJECT_ID/grove-foundation \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GEMINI_API_KEY=your-actual-api-key-here,GCS_BUCKET_NAME=grove-assets"
```

## Summary of Secrets
- **Build Time**: Passed via `--build-arg`. Used by Vite to inline the key into the React app (client-side).
- **Run Time**: Passed via `--set-env-vars`. Used by `server.js` to generate audio (server-side).

## Troubleshooting
- **403 Forbidden on Deployment**: Ensure "Cloud Run Admin" and "Service Account User" roles are enabled.
- **Audio Generation Fails**: Check Cloud Run logs. Ensure the service account has "Storage Object Admin" on `grove-assets`.
