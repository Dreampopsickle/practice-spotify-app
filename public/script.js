// const host = window.location.host;
const socket = new WebSocket(`ws://localhost:5502`);

socket.onopen = function(event) {
    console.log('WebSocket connection established', event);
};

socket.onmessage = (event) => {
    // console.log("Data received:", event.data);
    const trackInfo = JSON.parse(event.data);
    console.log('Track info recieved:', trackInfo)

    updateTrackInfoUI(trackInfo);
    updateTimer(trackInfo.progress_ms, trackInfo.duration_ms);
};

socket.onerror = function(error) {
    console.error('WebSocket Error:', error);
};

function updateTrackInfoUI(trackInfo) {
    const trackInfoDiv = document.getElementById('trackInfo');
    const trackName = document.getElementById('trackName');
    const trackArtist = document.getElementById('artistName');
    const trackAlbum = document.getElementById('albumName');
    const trackCover = document.getElementById('albumCover');

    if (trackInfo && trackInfoDiv) {
        trackName.textContent = "Track: " + trackInfo.name;
        trackArtist.textContent = "Artist: " + trackInfo.artist;
        trackAlbum.textContent = "Album: " + trackInfo.album;
        trackCover.src = trackInfo.albumImageUrl;
        
    } else {
        trackInfoDiv.innerHTML = "<p>No track is currently playing.</p>";
    }
}

socket.onclose = function (event) {
    console.log('WebSocket connection closed', event);
}
//toDO: set up track timer

function updateTimer(progress, duration) {
    const startTime = Date.now() - progress;
    function update() {
        const elapsed = Date.now() - startTime;
        const timeLeft = duration - elapsedTime;
        return 

    }
}



localStorage.setItem('isLoggedIn', 'true');

if(localStorage.getItem('isLoggedIn') === 'true') {
    console.log('User is authenticated');
} else {
    console.log('User is not authenticated');
};


function logOut() {
    localStorage.removeItem('isLoggedIn');
    window.location.href = 'http://localhost:5502/logged.html';
};



