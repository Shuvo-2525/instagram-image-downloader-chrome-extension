// Saves options to chrome.storage
function saveOptions() {
  const photoPath = document.getElementById('photo-path').value;
  const videoPath = document.getElementById('video-path').value;
  const albumPath = document.getElementById('album-path').value;
  const status = document.getElementById('status-message');

  chrome.storage.sync.set(
    {
      photoPath: photoPath,
      videoPath: videoPath,
      albumPath: albumPath
    },
    () => {
      // Update status to let user know options were saved.
      status.textContent = 'Settings saved.';
      setTimeout(() => {
        status.textContent = '';
      }, 1500);
    }
  );
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
  // Default values
  const defaults = {
    photoPath: 'Instagram/Photos',
    videoPath: 'Instagram/Videos',
    albumPath: 'Instagram/Albums (Zip)'
  };

  chrome.storage.sync.get(defaults, (items) => {
    document.getElementById('photo-path').value = items.photoPath;
    document.getElementById('video-path').value = items.videoPath;
    document.getElementById('album-path').value = items.albumPath;
  });
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save-button').addEventListener('click', saveOptions);
