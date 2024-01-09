



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
            // refreshPage(data);
            // setInterval(fetchAndUpdate, 1000);

            clearTokenURL();
        })
        .catch((error) => {
            console.error('Error:', error);
        });
    } 
     
};

const socket = new WebSocket('wss://localhost:5502')

socket.onmessage = function (event) {
    const trackData = JSON.parse(event.data);
    displayTrackInfo(trackData);
};

// const socket = new WebSocket('ws://localhost:5502')



function refreshPage(trackData) {
    const trackProgress = trackTime(trackData.songProgress);
    const trackDuration = trackTime(trackData.songDuration);
    const timeLeft = (trackDuration - trackProgress);
    return setTimeout(fetchAndUpdate, timeLeft)

}

function clearTokenURL() {
    const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;     
    window.history.pushState({ path: newUrl }, '', newUrl); 
}

function fetchAndUpdate() {
    fetchCurrentlyPlaying()
};

// function fetchCurrentlyPlaying() {
//     fetch('http://localhost:5502/currently-playing')
//         .then(response => response.json())
//         .then(data => {
//             console.log(data);
//             displayTrackInfo(data);
//         })
//         .catch(error => {
//             console.error('Error:', error);
//         });
// }


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
    let minutes = Math.floor(ms / 60000); 
    seconds = (seconds % 60);
    minutes = (minutes % 60);
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