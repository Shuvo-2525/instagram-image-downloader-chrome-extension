// Import the JSZip library
// This is required for service workers in Manifest V3
try {
  importScripts('jszip.min.js');
} catch (e) {
  console.error(e);
}

// Listen for messages from the content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'download_zip') {
    // Start the ZIP download process
    downloadAndZip(request.urls, request.filename)
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error('Error during zip download:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Async response
  
  } else if (request.action === 'download_individual') {
    // Start the INDIVIDUAL download process
    downloadIndividual(request.urls, request.username, request.postCode)
      .then(() => sendResponse({ success: true }))
      .catch((error) => {
        console.error('Error during individual download:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true; // Async response
  }
});

// Helper function to get saved paths from storage
function getStoragePaths() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      {
        photoPath: 'Instagram/Photos',
        videoPath: 'Instagram/Videos',
        albumPath: 'Instagram/Albums (Zip)'
      },
      (items) => resolve(items)
    );
  });
}

// New function to download files one-by-one
async function downloadIndividual(mediaUrls, username, postCode) {
  const paths = await getStoragePaths();

  for (let i = 0; i < mediaUrls.length; i++) {
    const item = mediaUrls[i];
    const fileExtension = item.type === 'video' ? 'mp4' : 'jpg';
    const path = item.type === 'video' ? paths.videoPath : paths.photoPath;
    
    // Create a filename like "Instagram/Photos/username_postcode_1.jpg"
    const filename = `${path}/${username}_${postCode}_${i + 1}.${fileExtension}`;

    chrome.downloads.download({
      url: item.url,
      filename: filename,
      saveAs: false // Set to false to not spam the user with dialogs
    }, (downloadId) => {
      if (chrome.runtime.lastError) {
        console.error(`Download failed for ${filename}:`, chrome.runtime.lastError.message);
      }
    });
  }
}


// Updated function to download and zip
async function downloadAndZip(mediaUrls, baseFilename) {
  const paths = await getStoragePaths();
  const zip = new JSZip();

  // We need to fetch each image/video one by one
  for (let i = 0; i < mediaUrls.length; i++) {
    const item = mediaUrls[i];
    
    try {
      const response = await fetch(item.url);
      if (!response.ok) {
        console.warn(`Failed to fetch ${item.url}`);
        continue;
      }
      const blob = await response.blob();
      
      const fileExtension = item.type === 'video' ? 'mp4' : 'jpg';
      zip.file(`${item.type}_${i + 1}.${fileExtension}`, blob);

    } catch (error) {
      console.error(`Error fetching or adding file ${item.url}:`, error);
    }
  }

  // Generate the zip file as a blob
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const blobUrl = URL.createObjectURL(zipBlob);

  // Prepend the saved album path
  const finalFilename = `${paths.albumPath}/${baseFilename}`;

  // Use the chrome.downloads API to save the file
  chrome.downloads.download({
    url: blobUrl,
    filename: finalFilename,
    saveAs: true // Ask the user where to save the zip
  }, (downloadId) => {
    URL.revokeObjectURL(blobUrl);
    if (chrome.runtime.lastError) {
      console.error('Download failed:', chrome.runtime.lastError.message);
    }
  });
}

