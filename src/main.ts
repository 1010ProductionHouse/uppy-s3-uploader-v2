// REMOVED: Uppy imports because they are loaded from CDN in index.html
// REMOVED: Uppy CSS imports because they are loaded from CDN in index.html

import './style.css'; // Keep this line to import your custom styles

// --- Type Declarations for Global Uppy (FOR THIS WORKAROUND ONLY) ---
// This tells TypeScript that window.Uppy exists and what its structure is.
// In a proper npm-based setup, Uppy's own type definitions handle this automatically.
declare global {
  interface Window {
    Uppy: {
      Core: new (options: any) => any; // Define Uppy.Core as a constructor that takes any options and returns any type
      Dashboard: new (uppy: any, options: any) => any; // Define Uppy.Dashboard similarly
      AwsS3: new (uppy: any, options: any) => any; // Define Uppy.AwsS3 similarly
      // Add other Uppy components you use from CDN here if needed (e.g., Tus, XHRUpload)
    };
  }
}
// --- END Type Declarations ---


// Use global Uppy objects exposed by the CDN
const uppy = new window.Uppy.Core({ debug: true, autoProceed: false });

uppy.use(window.Uppy.Dashboard, {
  inline: true,
  target: '#drag-drop-area', // Ensure this ID exists in your index.html
  showProgressDetails: true,
});

uppy.use(window.Uppy.AwsS3, {
  async getUploadParameters(file: any) { // Using 'any' for quick workaround
    const currentUser = 'sebastian'; // IMPORTANT: Replace securely in production!

    const response = await fetch('https://qfiknfbru7xmrtczcqy2767hju0innfi.lambda-url.us-west-2.on.aws/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        username: currentUser,
        filename: file.name,
        filetype: file.type
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lambda response error:', response.status, response.statusText, errorText);
      throw new Error(`Failed to get presigned URL from Lambda: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (!data.presignedUrl) {
      console.error("Lambda response missing presignedUrl:", data);
      throw new Error("Lambda response did not contain 'presignedUrl'.");
    }

    console.log('Received presigned URL:', data.presignedUrl);
    console.log('Expected S3 Key:', data.key);

    return {
      method: 'PUT',
      url: data.presignedUrl,
      fields: {},
      headers: {
        'Content-Type': file.type
      }
    };
  }
} as any); // Using 'any' for quick workaround

uppy.on('complete', (result: any) => { // Using 'any' for quick workaround
  console.log('Upload complete! Successful files:', result.successful);
  if (result.failed && result.failed.length > 0) {
    // FIX: Parameter 'f' implicitly has an 'any' type.
    alert(`Upload complete with errors. Some files failed: ${result.failed.map((f: any) => f.name).join(', ')}`);
  } else {
    alert('All files uploaded successfully!');
  }
});

uppy.on('upload-success', (file: any, response: any) => { // Using 'any' for quick workaround
  if (file) {
    console.log('✔ Upload successful:', file.name);
    console.log('S3 Key:', file.meta.s3Key);
    console.log('S3 Response Status:', response.status);
  } else {
    console.warn('upload-success fired but file object was undefined.');
  }
});

uppy.on('upload-error', (file: any, error: any) => { // Using 'any' for quick workaround
  if (file) {
    console.error('✘ Upload failed:', file.name, error);
    alert(`Upload failed for ${file.name}: ${error.message || error}`);
  } else {
    console.error('✘ Upload error fired but file object was undefined:', error);
    alert(`Upload failed: ${error.message || error}`);
  }
});