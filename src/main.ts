import Uppy from '@uppy/core';
import Dashboard from '@uppy/dashboard';
import AwsS3 from '@uppy/aws-s3';

// Import all CSS directly in your main.ts so Vite bundles it
import '@uppy/core/dist/style.css';
import '@uppy/dashboard/dist/style.css';
import './style.css'; // <--- IMPORTANT: Add this line to import your custom style.css

// ... (rest of your Uppy code, as previously corrected) ...

const uppy = new Uppy({ debug: true, autoProceed: false });

uppy.use(Dashboard, {
  inline: true,
  target: '#drag-drop-area',
  showProgressDetails: true,
});

uppy.use(AwsS3, {
  async getUploadParameters(file: import('@uppy/core').UppyFile<{}, {}>) {
    const currentUser = 'sebastian'; // Replace with actual authenticated user data.

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
} as unknown as import('@uppy/aws-s3').AwsS3Options<{}, {}>);

uppy.on('complete', (result) => {
  console.log('Upload complete! Successful files:', result.successful);
  if (result.failed && result.failed.length > 0) {
    console.error('Upload failed for files:', result.failed);
    alert(`Upload complete with errors. Some files failed: ${result.failed.map(f => f.name).join(', ')}`);
  } else {
    alert('All files uploaded successfully!');
  }
});

uppy.on('upload-success', (file, response) => {
  if (file) {
    console.log('✔ Upload successful:', file.name);
    console.log('S3 Key:', file.meta.s3Key);
    console.log('S3 Response Status:', response.status);
  } else {
    console.warn('upload-success fired but file object was undefined.');
  }
});

uppy.on('upload-error', (file, error) => {
  if (file) {
    console.error('✘ Upload failed:', file.name, error);
    alert(`Upload failed for ${file.name}: ${error.message || error}`);
  } else {
    console.error('✘ Upload error fired but file object was undefined:', error);
    alert(`Upload failed: ${error.message || error}`);
  }
});