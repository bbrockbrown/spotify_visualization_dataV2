// Importing API function calls from parent script
import APIController from './api.js';

const contentContainer = document.querySelector(".content-container");
const search = document.querySelector("#search-bar");
const searchResults = document.querySelector("#search-results");
const results = document.querySelector("#results");
const graphContainer = document.querySelector('#graph-container');
const measurements = document.querySelector("#reading-measurements");
const resultPlaceholder = document.querySelector("#result-placeholder");

const myCarouselElement = document.querySelector('#readings-carousel');

const carousel = new bootstrap.Carousel(myCarouselElement, {
    interval: 5000,
    touch: false
});

// Highlight text when entering a query --> delete previous query easier
search.addEventListener('focus', () => {
    search.select();
});

// Responsible for query results as user types in search bar
search.addEventListener('input', async () => {
    const query = search.value.trim();

    if (query.length > 0) {
        // Fetch the token
        const token = await APIController.getToken();

        // Search for tracks
        const tracks = await APIController.searchTrack(token, query);

        // Keeping track of number of results
        let trackNum = 1

        // Clear previous results
        searchResults.innerHTML = '';

        if (tracks && tracks.length > 0) {
            tracks.forEach(track => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.textContent = `${trackNum}. "${track.name}" by ${track.artists.map(artist => artist.name).join(', ')}`;
                div.dataset.trackId = track.id;
                trackNum++;

                // Does not add border to bottom of last search result for clean formatting
                if (tracks.indexOf(track) === tracks.length - 1) {
                    div.style.borderBottom = 'none';
                }

                // Reset search bar + output results when user clicks on a query
                div.addEventListener('click', async () => {
                    search.value = `"${track.name}" by ${track.artists.map(artist => artist.name).join(', ')}`
                    hideSearchResults();

                    // Use same token as above to obtain track's audio features (aka song 'reading')
                    trackToGraph(track);
                });

                searchResults.appendChild(div);
            });

            // Show the results container
            searchResults.style.display = 'block';
        } else {
            searchResults.style.display = 'none';
        }
    } else {
        searchResults.style.display = 'none';
    }
});

// Generates song reading from track
async function trackToGraph(track) {
    const token = await APIController.getToken();
    const trackID = track.id;

    // Throw error if no ID/endpoint is found 
    if (!trackID) {
        console.error('Track not found');
        return;
    }
    
    // Display current search query
    resultPlaceholder.innerHTML = `<h1>"${track.name}" by ${track.artists.map(artist => artist.name).join(', ')}</h1>`;

    // 1:1 aspect ratio for image
    graphContainer.style.paddingBottom = '100%';

    // Use track ID to get audio features
    const audioFeatures = await APIController.getTrackAudioFeatures(token, trackID);
    sendDataToServer(audioFeatures);
}


function hideSearchResults() {
    searchResults.style.display = 'none';
}


document.addEventListener('click', (event) => {
    if (!search.contains(event.target) && !searchResults.contains(event.target)) {
        hideSearchResults();
    }
});

// Communicates with python script to get image
async function sendDataToServer(data) {
    try {
        const response = await fetch('/web/song-reading-page', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                danceability: data.danceability,
                speechiness: data.speechiness,
                valence: data.valence,
                energy: data.energy,
                liveness: data.liveness,
                acousticness: data.acousticness
            })
        });

        const readings = {
            "Danceability": data.danceability,
            "Speechiness": data.speechiness,
            "Valence": data.valence,
            "Energy": data.energy,
            "Liveness": data.liveness,
            "Acousticness": data.acousticness
        }

        if (response.ok) {
            // path to reading image/result
            const result = await response.json();
            // titles for each of the columns + clear previous results
            measurements.innerHTML = '<h3 id="measurements-title"> Song Reading Measurements </h3>';
            graphContainer.innerHTML = '<h3 id="graph-title"> Song Reading Graph </h3>';
    
            for (const [reading, val] of Object.entries(readings)) {
                let measure = document.createElement("p");
                measure.classList.add("measurement");
                // Round reading values to nearest thousandth
                measure.textContent = `${reading}: ${val.toFixed(3)}`;
                measurements.appendChild(measure);
            }
            
            // Link to how these measurements are defined
            const measurementsDefLink = document.createElement("div");
            measurementsDefLink.classList.add("measurement", "measurements-link", "mt-4", "mt-lg-5");
            measurementsDefLink.innerHTML = `<a class="text-decoration-none" href="https://developer.spotify.com/documentation/web-api/reference/get-audio-features" target="_blank">
                                            <h6 class="measurement"> See how these measurements are defined here. </h6>  
                                            </a>`;
            measurements.appendChild(measurementsDefLink);

            // Update the image src to display the generated graph
            graphContainer.innerHTML += `<img src="${result.reading_url}" alt="Reading cannot be displayed" id="song-reading-img" class="rounded">`;
            results.style.transform = 'translateY(-50px)';
            results.style.height = '100%';
            
        } else {
            const errorDetails = await response.text(); // Fetch more info
            console.error('Failed to send data:', errorDetails);
        }
    } catch (error) {
        console.error('Error:', error);
    }
}
