const socket = new WebSocket('ws://localhost:5502');

socket.onopen = function(event) {
    console.log('WebSocket connection established', event);
};

socket.onmessage = function(event) {
    console.log("Data received:", event.data);
    const trackInfo = JSON.parse(event.data);
    updateTrackInfo(trackInfo);
};

socket.onerror = function(error) {
    console.error('WebSocket Error:', error);
};

function updateTrackInfo(trackInfo) {
    const trackInfoDiv = document.getElementById('trackInfo');

    if (trackInfo && trackInfoDiv) {
        trackInfoDiv.innerHTML = `
        <h2>Now Playing</h2>
        <p><strong>Track:</strong> ${trackInfo.name}</p>
        <p><strong>Artist:</strong> ${trackInfo.artist}</p>
        <p><strong>Album:</strong> ${trackInfo.album}</p>
        <img src="${trackInfo.albumImageUrl}" alt="Album Cover" style="width:200px;">
        `;
    } else {
        trackInfoDiv.innerHTML = "<p>No track is currently playing.</p>";
    }
}

window.onunload = function() {
    socket.close();
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



