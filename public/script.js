const socket = new WebSocket('ws://localhost:5502')

socket.onmessage = function (event) {
    const trackData = JSON.parse(event.data);
    displayTrackInfo(trackData);
};



window.onload = function() {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    const code = urlParams.get('code');

    if (code) {
        fetch('http://localhost:5502/callback', {
            method: "POST",
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ code: code })
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);
            fetchAndUpdate(data);
            clearTokenURL(); 
        })
        .catch(error => {
            console.error('Error:', error);
        });
    } 
     
};

function clearTokenURL() {
    const newUrl = window.location.origin + window.location.pathname;     
    window.history.replaceState({ path: newUrl }, '', newUrl); 
}

// function fetchAndUpdate() {
//     fetchCurrentlyPlaying()
// };

function displayTrackInfo(trackInfo) {
    if (!trackInfo) {
        console.log('No track info available');
        return;
    }
    console.log(trackInfo);
    document.getElementById('songName').textContent = 'Song: ' + trackInfo.songName;
    document.getElementById('artistName').textContent = 'Artist: ' + trackInfo.artistName;
    document.getElementById('albumName').textContent = 'Album: ' + trackInfo.albumName;
    document.getElementById('albumArt').src = trackInfo.albumCoverArt;
    document.getElementById('songTime').textContent = formatTime(trackInfo.songDuration);
    
}

function formatTime(ms) {
    let seconds = Math.floor(ms / 1000);
    let minutes = Math.floor(seconds / 60); 
    seconds = (seconds % 60);
    if (seconds < 10) {
        seconds = '0' + seconds;
    }
    return `${minutes}:${seconds}`;

};

// function removeLogin() {
//     const delBtn = document.getElementById('login');
//     delBtn.parentNode.removeChild(delBtn); 
//     return false;

document.getElementById('login').addEventListener('click', function() {
    window.location.href = 'http://localhost:5502/login';
});