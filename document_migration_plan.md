# Alternative Storage: Cloudflare R2 Migration

This plan addresses the 500MB limit of Supabase Storage by integrating **Cloudflare R2**, which offers 10GB of free storage with zero egress fees.

## User Review Required

> [!IMPORTANT]
> **Cloudflare Setup**: You will need to create a Cloudflare account, enable R2, and create a bucket (e.g., `grahamly-docs`).
> 
> **Credentials**: We will need `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, and `R2_ENDPOINT` (found in R2 settings). These should be added to your Supabase Edge Function secrets.

## Proposed Changes

### 1. Backend: Supabase Edge Function
- **[NEW] `supabase/functions/get-r2-upload-url/index.ts`**: A new function that uses the S3 SDK to generate a pre-signed URL for uploading files directly to R2. This ensures your Secret Keys are never exposed to the frontend.

### 2. Frontend: Document Management
- **[MODIFY] [Documents.tsx](file:///C:/Users/akisd/Downloads/dashboard/src/pages/Documents.tsx)**:
  - Update `handleFileUpload` to first call the Edge Function to get a pre-signed URL.
  - Use `fetch` to PUT the file directly to Cloudflare R2.
  - Continue storing the resulting public URL in the Supabase `documents` table for indexing and display.

## Verification Plan

### Manual Verification
1. **Direct Upload Test**: Upload a file through the Documents page and verify it appears in the Cloudflare R2 dashboard.
2. **Persistence Test**: Verify the file appears in the app's file list and can be downloaded.
3. **Security Test**: Ensure that no R2 credentials are visible in the browser's Network tab (only the pre-signed URL).
