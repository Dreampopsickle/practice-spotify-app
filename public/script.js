document.addEventListener('DOMContentLoaded', () => {
    const trackInfoDiv = document.getElementById('trackInfo');
    if (!trackInfoDiv) {
        console.error('trackInfoDiv element not found.')
        return;
    }

    // Connect to Websocket Server
    const ws = new WebSocket('ws://localhost:5502');
    ws.onopen = () => console.log('WebSocket connection established.');
    ws.onerror = (error) => console.error('WebSocket Error:', error);

    ws.onmessage = (event) => {
        try {
            const track = JSON.parse(event.data);
            console.log("Received track data:", track);
            if (track) {
                trackInfoDiv.innerHTML = `
                <h2>${track.name}</h2>
                <p>Artist: ${track.artist}</p>
                <p>Album: ${track.album}</p>
                <img src="${track.albumImageUrl}" alt="${track.album}">
                `;
            } else {
                trackInfoDiv.innerHTML = "<p>No Track is currently playing</p>";
            }
        } catch (error) {
            console.error("Error processing WebSocket message:", error);
        }
    };
});


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



