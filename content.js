console.log("YouTube Timestamp extension script loaded");

let currentVideoId = "";
let currentVideoBookmarks = [];
let youtubePlayer;
let buttonAdded = false;

// Function to fetch bookmarks from storage
const fetchBookmarks = () => {
  return new Promise((resolve) => {
    chrome.storage.sync.get([currentVideoId], (obj) => {
      resolve(obj[currentVideoId] ? JSON.parse(obj[currentVideoId]) : []);
    });
  });
};

// Function to add a bookmark
const addBookmark = (time, note) => {
  const newBookmark = {
    time: time,
    note: note,
  };

  chrome.storage.sync.get([currentVideoId], (result) => {
    const bookmarks = result[currentVideoId] ? JSON.parse(result[currentVideoId]) : [];
    bookmarks.push(newBookmark);
    chrome.storage.sync.set({ [currentVideoId]: JSON.stringify(bookmarks) }, () => {
      console.log("Bookmark saved:", newBookmark);
      alert(`Timestamp ${getFormattedTime(time)} added with note: "${note}"`);
    });
  });
};

// Function to create the bookmark button
const createBookmarkButton = () => {
  if (buttonAdded) return;

  const button = document.createElement("button");
  button.innerText = "Add Timestamp";
  button.id = "yt-timestamp-button"; // For easier debugging
  button.style.position = "fixed";
  button.style.top = "10px";
  button.style.right = "10px";
  button.style.zIndex = "10000";
  button.style.padding = "10px 15px";
  button.style.backgroundColor = "#ff0000";
  button.style.color = "#ffffff";
  button.style.border = "none";
  button.style.borderRadius = "5px";
  button.style.cursor = "pointer";

  button.onclick = () => {
    const currentTime = youtubePlayer.currentTime;
    const note = prompt("Enter a note for this timestamp:");
    if (note) {
      addBookmark(currentTime, note);
    }
  };

  document.body.appendChild(button);
  buttonAdded = true;

  console.log("Bookmark button added to the page");
};

// Function to format time into HH:MM:SS
const getFormattedTime = (seconds) => {
  const date = new Date(0);
  date.setSeconds(seconds);
  return date.toISOString().substr(11, 8);
};

// Initialization function to find the YouTube player and set up the button
const init = () => {
  youtubePlayer = document.querySelector("video");
  if (youtubePlayer) {
    console.log("YouTube player found");
    currentVideoId = getVideoId(window.location.href);
    createBookmarkButton();
  } else {
    console.log("YouTube player not found, retrying...");
    setTimeout(init, 1000);
  }
};

// Function to extract the video ID from the URL
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

document.addEventListener('DOMContentLoaded', init);
init();
