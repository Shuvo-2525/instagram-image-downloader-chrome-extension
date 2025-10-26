// This script runs on Instagram post pages

// SVG icon for our DIRECT download button (single arrow)
const DIRECT_DOWNLOAD_SVG_ICON = `
<svg aria-label="Download" class="_ab6-" color="rgb(0, 0, 0)" fill="rgb(0, 0, 0)" height="24" role="img" viewBox="0 0 24 24" width="24">
  <path d="M12 16.5c.8 0 1.5.7 1.5 1.5s-.7 1.5-1.5 1.5-1.5-.7-1.5-1.5.7-1.5 1.5-1.5m0-11c.8 0 1.5.7 1.5 1.5v6c0 .8-.7 1.5-1.5 1.5s-1.5-.7-1.5-1.5v-6c0-.8.7-1.5 1.5-1.5m5.4 7.5c.4.4.4 1 0 1.4l-3.5 3.5c-.4.4-1 .4-1.4 0s-.4-1 0-1.4l3.5-3.5c.4-.4 1-.4 1.4 0m-9.8 1.4c.4.4 1 .4 1.4 0l3.5-3.5c.4-.4.4-1 0-1.4s-1-.4-1.4 0l-3.5 3.5c-.4.4-.4 1 0 1.4M19.5 6c-1.2 0-2.3.5-3.2 1.3C15.5 5.2 13.9 4 12 4s-3.5 1.2-4.3 3.3c-.9-.8-2-1.3-3.2-1.3C2 6 0 8 0 10.5 0 13 2 15 4.5 15h15C22 15 24 13 24 10.5 24 8 22 6 19.5 6z" />
</svg>
`;

// SVG icon for our ZIP download button (folder/album)
const ZIP_DOWNLOAD_SVG_ICON = `
<svg aria-label="Download Album as Zip" class="_ab6-" color="rgb(0, 0, 0)" fill="rgb(0, 0, 0)" height="24" role="img" viewBox="0 0 24 24" width="24">
  <path d="M21 5.5h-8.2c-.4 0-.7-.2-.9-.5L11 4.1c-.3-.4-.7-.6-1.1-.6H4c-1.1 0-2 .9-2 2v13c0 1.1.9 2 2 2h17c1.1 0 2-.9 2-2V7.5c0-1.1-.9-2-2-2zM20.6 19H4.4c-.2 0-.4-.2-.4-.4V6.4c0-.2.2-.4.4-.4h5.9c.2 0 .4.1.5.3l.9 1.2c.3.4.7.6 1.1.6h8.2c.2 0 .4.2.4.4v10.1c0 .2-.2.4-.4.4z"></path>
  <path d="M12.6 12.5H11v-1c0-.6-.4-1-1-1s-1 .4-1 1v1H7.4c-.6 0-1 .4-1 1s.4 1 1 1H9v1c0 .6.4 1 1 1s1-.4 1-1v-1h1.6c.6 0 1-.4 1-1s-.4-1-1-1z"></path>
</svg>
`;

// This function checks if our buttons are already on the page and adds them if not.
function addDownloadButtons() {
  // Check if we are on a post page
  if (!window.location.pathname.startsWith('/p/') && !window.location.pathname.startsWith('/reel/')) {
    return;
  }

  // Find the "action bar" where the like, comment, share buttons are.
  const article = document.querySelector('article');
  if (!article) return;

  const buttonBar = article.querySelector('section span button')?.parentElement;
  if (!buttonBar) return; // Not found, try again later

  // Check if our buttons are already there
  if (document.getElementById('insta-zip-downloader-btn')) {
    return;
  }

  // --- Create Direct Download Button ---
  const directDownloadButton = document.createElement('button');
  directDownloadButton.id = 'insta-direct-downloader-btn';
  directDownloadButton.type = 'button';
  directDownloadButton.className = 'insta-downloader-button-direct'; // For styling
  directDownloadButton.innerHTML = DIRECT_DOWNLOAD_SVG_ICON;
  directDownloadButton.title = 'Download files individually';
  directDownloadButton.onclick = (e) => handleDownload(e, 'individual');

  // --- Create Zip Download Button ---
  const zipDownloadButton = document.createElement('button');
  zipDownloadButton.id = 'insta-zip-downloader-btn';
  zipDownloadButton.type = 'button';
  zipDownloadButton.className = 'insta-downloader-button-zip'; // For styling
  zipDownloadButton.innerHTML = ZIP_DOWNLOAD_SVG_ICON;
  zipDownloadButton.title = 'Download all as .zip';
  zipDownloadButton.onclick = (e) => handleDownload(e, 'zip');

  // Add the buttons to the bar. We'll add them before the bookmark button.
  const bookmarkButton = buttonBar.querySelector('button[aria-label="Save"]');
  const container = bookmarkButton ? bookmarkButton.parentElement : buttonBar;
  
  if (bookmarkButton) {
    container.insertBefore(directDownloadButton, bookmarkButton);
    container.insertBefore(zipDownloadButton, bookmarkButton);
  } else {
    // Fallback: just append them
    container.appendChild(directDownloadButton);
    container.appendChild(zipDownloadButton);
  }
}

// Generic helper function to get post data
async function getPostData() {
  const postUrl = new URL(window.location.href.split('?')[0]);
  postUrl.searchParams.set('__a', '1');
  postUrl.searchParams.set('__d', '1');

  const response = await fetch(postUrl.href);
  const data = await response.json();
  const postData = data.items[0];
  const mediaUrls = [];

  if (postData.carousel_media) {
    // This is an album
    postData.carousel_media.forEach(item => {
      if (item.video_url) {
        mediaUrls.push({ url: item.video_url, type: 'video' });
      } else {
        mediaUrls.push({ url: item.image_versions2.candidates[0].url, type: 'image' });
      }
    });
  } else {
    // This is a single image or video
    if (postData.video_url) {
      mediaUrls.push({ url: postData.video_url, type: 'video' });
    } else {
      mediaUrls.push({ url: postData.image_versions2.candidates[0].url, type: 'image' });
    }
  }

  return {
    mediaUrls,
    username: postData.user.username,
    postCode: postData.code
  };
}

// This function is called when ANY download button is clicked
async function handleDownload(e, downloadType) {
  const button = e.currentTarget;
  button.disabled = true;
  button.style.opacity = '0.5'; // Show loading state

  try {
    const { mediaUrls, username, postCode } = await getPostData();

    if (downloadType === 'zip') {
      // --- ZIP DOWNLOAD ---
      const filename = `${username}_${postCode}.zip`;
      chrome.runtime.sendMessage(
        {
          action: 'download_zip',
          urls: mediaUrls,
          filename: filename
        },
        (response) => handleResponse(button, response)
      );
    } else {
      // --- INDIVIDUAL DOWNLOAD ---
      chrome.runtime.sendMessage(
        {
          action: 'download_individual',
          urls: mediaUrls,
          username: username,
          postCode: postCode
        },
        (response) => handleResponse(button, response)
      );
    }

  } catch (error) {
    console.error('Failed to download Instagram post:', error);
    alert('Failed to download. See console for details.');
    button.disabled = false;
    button.style.opacity = '1';
  }
}

function handleResponse(button, response) {
  if (response.success) {
    console.log('Download initiated by background script.');
  } else {
    console.error('Download failed.');
  }
  // Reset button
  button.disabled = false;
  button.style.opacity = '1';
}

// Instagram is a Single Page App (SPA), so the page doesn't reload.
// We need to constantly check if a new post has loaded.
setInterval(addDownloadButtons, 1000);

