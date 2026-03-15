# Pilot Light Platform - Netlify Deployment

## Prerequisites Completed
- ✅ Mux account created
- ✅ Mux API credentials obtained

## Step 1: Update Airtable Schema

Add a new field to your **Pilots** table in Airtable:
- **Field Name:** `playbackId`
- **Field Type:** Single line text

This field will store the Mux playback ID for each uploaded video.

> **Note:** Your existing `videoUrl` field can remain for legacy support. The platform will check for `playbackId` first, then fall back to `videoUrl`.

## Step 2: Deploy to Netlify

### Option A: Drag & Drop (Easiest)
1. Go to [app.netlify.com](https://app.netlify.com)
2. Sign up / Log in
3. Drag the entire `pilot-light-netlify` folder onto the Netlify dashboard
4. Wait for deployment to complete

### Option B: Connect Git Repository
1. Push this folder to a GitHub/GitLab repository
2. Connect the repository to Netlify
3. Deploy

## Step 3: Add Environment Variables

After deployment, configure your Mux credentials:

1. Go to your Netlify site dashboard
2. Click **Site settings** → **Environment variables**
3. Add these two variables:

| Key | Value |
|-----|-------|
| `MUX_TOKEN_ID` | `eae7ea16-f4d1-42b6-95a3-19a6b8ef0844` |
| `MUX_TOKEN_SECRET` | `PlXmHybTNo3MI+iTT+d/9MNKqYm/y08Wq74Q4QCAh426ikgMJO6SQD/XAjzUdfsIqJc770y2QYa` |

4. Click **Save**
5. Go to **Deploys** → **Trigger deploy** → **Deploy site** (to apply the new variables)

## Step 4: Test the Integration

1. Visit your Netlify site URL (e.g., `https://your-site.netlify.app`)
2. Log in as a creator
3. Upload a new pilot with an MP4 video
4. The video should upload, process, and become streamable

## File Structure

```
pilot-light-netlify/
├── index.html              # Main application
├── netlify.toml            # Netlify configuration
├── README.md               # This file
└── netlify/
    └── functions/
        ├── mux-upload.js   # Creates upload URLs
        └── mux-status.js   # Checks processing status
```

## Local Development

For local testing before deployment:

1. Install Netlify CLI: `npm install -g netlify-cli`
2. Run: `netlify dev`
3. Open: `http://localhost:8888`

## Troubleshooting

### Video upload fails
- Check browser console for errors
- Verify Mux credentials in Netlify environment variables
- Ensure the video is under 500MB and is a valid format (MP4, MOV, etc.)

### Video not playing after upload
- Wait 1-2 minutes for Mux to finish processing
- Check if `playbackId` was saved to Airtable
- Verify the Mux asset status in your Mux dashboard

### "Failed to get upload URL" error
- Redeploy the site after adding environment variables
- Check that both `MUX_TOKEN_ID` and `MUX_TOKEN_SECRET` are set correctly

## Security Notes

- Your Mux credentials are stored securely as Netlify environment variables
- They are never exposed to the browser
- Only the serverless functions have access to them
- Consider adding rate limiting for production use
