import { NETLIFY_FUNCTIONS_URL } from '../config';

// Mux Upload Helper Functions
const MuxUploader = {
  // Request a direct upload URL from our Netlify function
  getUploadUrl: async () => {
    const response = await fetch(`${NETLIFY_FUNCTIONS_URL}/.netlify/functions/mux-upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    if (!response.ok) {
      const error = await response.json();
      console.error('Mux upload error details:', error);
      throw new Error(error.details || error.error || 'Failed to get upload URL');
    }
    return response.json();
  },

  // Upload video file directly to Mux
  uploadVideo: async (file, uploadUrl, onProgress) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable && onProgress) {
          const percentage = Math.round((event.loaded / event.total) * 100);
          onProgress(percentage);
        }
      });

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve({ success: true });
        } else {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => reject(new Error('Upload failed')));
      xhr.addEventListener('abort', () => reject(new Error('Upload cancelled')));

      xhr.open('PUT', uploadUrl);
      xhr.setRequestHeader('Content-Type', file.type);
      xhr.send(file);
    });
  },

  // Check upload status and get playback ID
  getUploadStatus: async (uploadId) => {
    const response = await fetch(`${NETLIFY_FUNCTIONS_URL}/.netlify/functions/mux-status?uploadId=${uploadId}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to get upload status');
    }
    return response.json();
  },

  // Poll for playback ID until asset is ready
  waitForPlaybackId: async (uploadId, maxAttempts = 60, interval = 2000) => {
    for (let i = 0; i < maxAttempts; i++) {
      const status = await MuxUploader.getUploadStatus(uploadId);

      if (status.playbackId && status.assetStatus === 'ready') {
        return status;
      }

      if (status.status === 'errored') {
        throw new Error('Video processing failed');
      }

      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, interval));
    }
    throw new Error('Timeout waiting for video to process');
  }
};

export default MuxUploader;
