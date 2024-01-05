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
            fetchAndUpdate();
            setInterval(fetchAndUpdate, 1000);
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    }        
};

function fetchAndUpdate() {
    fetchCurrentlyPlaying()
};

function fetchCurrentlyPlaying() {
    fetch('http://localhost:5502/currently-playing')
        .then(response => response.json())
        .then(data => {
            console.log(data);
            displayTrackInfo(data);
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

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
    
    const trackProgress = trackTime(trackInfo.songProgress);
    const trackDuration = trackTime(trackInfo.songDuration);
     
    document.getElementById('songTime').textContent = `${trackProgress} / ${trackDuration}`;
    
}

function trackTime(ms) {
    let seconds = Math.floor(ms / 1000);
    let minutes = parseInt(seconds / 60); 
    seconds = (seconds % 60);
    if (seconds < 10) {
        seconds = '0' + seconds;
    }
    return `${minutes}:${seconds}`;

};

function removeLogin() {
    const delBtn = document.getElementById('login');
    delBtn.parentNode.removeChild(delBtn); 
    return false;
}
document.getElementById('login').addEventListener('click', function() {
    window.location.href = 'http://localhost:5502/login';
});