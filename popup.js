document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentVideoUrl = tabs[0]?.url;
        const videoId = getVideoId(currentVideoUrl);

        if (videoId) {
            console.log("Video ID:", videoId);
            displayBookmarks(videoId); // Display existing bookmarks on load

            const addBookmarkBtn = document.getElementById("addBookmarkBtn");
            addBookmarkBtn.addEventListener("click", () => {
                const note = document.getElementById("noteInput").value;

                chrome.tabs.executeScript({
                    code: "document.querySelector('video').currentTime;"
                }, (result) => {
                    const currentTime = result[0];
                    if (currentTime !== undefined) {
                        addBookmark(videoId, currentTime, note);
                        document.getElementById("noteInput").value = "";
                    } else {
                        console.error("Could not retrieve current time.");
                    }
                });
            });
        } else {
            console.error("Video URL is not valid or does not contain 'v=' parameter");
        }
    });
});

const getVideoId = (url) => {
    try {
        const urlObj = new URL(url);
        if (urlObj.hostname.includes("youtube.com")) {
            return urlObj.searchParams.get("v");
        } else if (urlObj.hostname.includes("youtu.be")) {
            return urlObj.pathname.split("/").pop();
        }
    } catch (error) {
        console.error("Invalid URL format", error);
    }
    return null;
};

const addBookmark = (videoId, time, note) => {
    chrome.storage.sync.get([videoId], (result) => {
        const bookmarks = result[videoId] ? JSON.parse(result[videoId]) : [];
        
        const existingBookmark = bookmarks.find(bookmark => bookmark.note === note);

        if (!existingBookmark) {
            const newBookmark = { time, note };
            bookmarks.push(newBookmark);

            // Calculate the size of the bookmarks in bytes
            const newDataSize = new Blob([JSON.stringify(bookmarks)]).size;

            // Check the total size of the existing bookmarks
            chrome.storage.sync.getBytesInUse(videoId, (bytesUsed) => {
                if (bytesUsed + newDataSize > 102400) { // 100 KB limit
                    alert("Storage limit reached! Please clean up some bookmarks to save new ones.");
                } else {
                    chrome.storage.sync.set({ [videoId]: JSON.stringify(bookmarks) }, () => {
                        console.log("Bookmark added:", newBookmark);
                        displayBookmarks(videoId); // Refresh bookmark display
                    });
                }
            });
        } else {
            alert("A bookmark with this note already exists.");
        }
    });
};


const displayBookmarks = (videoId) => {
    chrome.storage.sync.get([videoId], (result) => {
        const bookmarks = result[videoId] ? JSON.parse(result[videoId]) : [];
        const bookmarkList = document.getElementById("bookmarkList");
        bookmarkList.innerHTML = ""; // Clear the list before displaying

        bookmarks.forEach((bookmark, index) => {
            const listItem = document.createElement("li");
            const timestampLink = document.createElement("a");
            timestampLink.href = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(bookmark.time)}s`;
            timestampLink.target = "_blank"; // Open in new tab
            timestampLink.textContent = `Time: ${getFormattedTime(bookmark.time)} - Note: ${bookmark.note}`;
            listItem.appendChild(timestampLink);
            
            // Create a delete button
            const deleteButton = document.createElement("button");
            deleteButton.textContent = "Delete";
            deleteButton.style.marginLeft = "10px"; // Add margin to the left of the delete button
            deleteButton.addEventListener("click", () => {
                deleteBookmark(videoId, index);
            });

            listItem.appendChild(deleteButton);
            bookmarkList.appendChild(listItem);
        });
    });
};

const deleteBookmark = (videoId, index) => {
    chrome.storage.sync.get([videoId], (result) => {
        const bookmarks = result[videoId] ? JSON.parse(result[videoId]) : [];

        if (index > -1) {
            bookmarks.splice(index, 1); // Remove the bookmark at the specified index
        }

        // Update storage
        chrome.storage.sync.set({ [videoId]: JSON.stringify(bookmarks) }, () => {
            console.log("Bookmark deleted");
            displayBookmarks(videoId); // Refresh bookmark display
        });
    });
};

const getFormattedTime = (seconds) => {
    const date = new Date(0);
    date.setSeconds(seconds);
    return date.toISOString().substr(11, 8); // Format as HH:MM:SS
};

const deleteButton = document.createElement("button");
deleteButton.textContent = "Delete";
deleteButton.classList.add("delete-button"); // Add the CSS class
deleteButton.addEventListener("click", () => {
    deleteBookmark(videoId, index);
});

