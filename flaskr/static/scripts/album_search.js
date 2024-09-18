import APIController from './api.js';

const token = await APIController.getToken();
const search = document.querySelector("#search-bar");
const searchResults = document.querySelector("#search-results");
const resultPlaceholder = document.querySelector("#result-placeholder");
const results = document.querySelector("#results");
const albumInfoContainer = document.querySelector("#album-info-container");
const albumTracksContainer = document.querySelector("#album-tracks-container");
let albumDuration = 0;

// Highlight text when entering a query --> delete previous query easier
search.addEventListener('focus', () => {
    search.select();
});

// Responsible for query results as user types in search bar
search.addEventListener('input', async () => {
    const query = search.value.trim().toLowerCase();

    if (query.length > 0) {
        // Search for albums
        let albums = await APIController.searchAlbum(token, query);

        // Keeping track of number of results
        let albumNum = 1;

        // Clear previous results
        searchResults.innerHTML = '';
        if (albums && albums.length > 0) {
            albums.forEach(album => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.innerHTML = `${albumNum}. <i>${album.name}</i> by ${album.artists[0].name}`;
                div.dataset.albumId = album.id;
                albumNum++;

                // Does not add border to bottom of last search result for clean formatting
                if (albums.indexOf(album) === albums.length - 1) {
                    div.style.borderBottom = 'none';
                }

                // Reset search bar + output results when user clicks on a query
                div.addEventListener('click', async () => {
                    search.value = `${album.name}`;
                    hideSearchResults();
                    genResults(album.id);
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

// Clears potential (valid) queries from the search results
function hideSearchResults() {
    searchResults.style.display = 'none';
}

// When user is typing in a query and clicks anywhere on screen besides the query results, 
// the query results disappear
document.addEventListener('click', (event) => {
    if (!search.contains(event.target) && !searchResults.contains(event.target)) {
        hideSearchResults();
    }
});

// Responsible for generating results based on user-selected query
async function genResults(albumID) {
    // Throw error if no ID given
    if (!albumID) { 
        throw new Error("No album with the given name was found.")
    }

    // If nothing has been searched yet, expand results container's height to 100% and margin to appropriate value
    results.style.height = '100%';
    results.style.marginBottom = '40px';

    // Clear placeholder
    resultPlaceholder.innerHTML = '';

    // Obtain *cleaner* album data, since searchAlbums's json format is different
    const album = await APIController.getAlbum(token, albumID);

    genAlbumTracks(album);
    genAlbum(album);
}

// Generates album cover + album-related info
async function genAlbum(album) {
    // Create variables for relevant album info
    const coverURL = album.images[0].url;
    const name = album.name;
    const numTracks = album.total_tracks;
    const linkTo = album.external_urls.spotify;
    const datePrecision = album.release_date_precision;

    // Depending on release date precision, present release date in readable format
    let release = dateConversion(album.release_date);
    if (datePrecision === 'year') {
        release = release.split('-')[2];
    } else if (datePrecision === 'month') {
        release = release.split('-').slice(1).join('-');
    }
    
    const popularity = album.popularity;
    const albumLabel = album.label;
    let genres = album.genres; 
    
    // if array of genres is of length 0, then no genres have been given yet
    if (genres.length < 1) {
        genres = "Not yet classified";
    }

    // Display album name + artist
    albumDuration = albumLengthConversion(albumDuration);
    resultPlaceholder.innerHTML = `<h1 id="album-title" class="mb-3"> <i>${album.name}</i>  by ${album.artists[0].name} </h1>
                                <h4 id="release-date"> ${release} <span class="bullet">&#x2022;</span> ${albumDuration} </h4>`;

    // Clear previous results
    albumInfoContainer.innerHTML = '';

    // Create new 'row' div to store album cover
    const albumCoverRow = document.createElement("div");
    albumCoverRow.classList.add("row", "large-album-cover");

    // Album cover takes space of entire row
    const albumCover = document.createElement("div");
    albumCover.classList.add("col-12", "p-0", "cover-container");
    albumCover.innerHTML = `<a href=${linkTo} class="text-decoration-none" target="_blank"> <img src=${coverURL} alt="${name} Cover" id="album-cover"> </a>`;
    albumCoverRow.appendChild(albumCover);

    // Append row with album cover to container
    albumInfoContainer.appendChild(albumCoverRow);

    // Create new row for album related info (release date, track count, etc.)
    const albumInfoRow = document.createElement("div");
    albumInfoRow.classList.add("row", "album-info");

    // Create col for number of tracks and popularity
    const numTrackCol = document.createElement("div");
    numTrackCol.classList.add("col-12", "d-flex", "align-items-start", "numAndPop", "flex-column");
    numTrackCol.innerHTML = `<div class="num-and-pop-wrapper ms-auto me-auto">
                                <h4 id="release-date"> <i class="bi bi-music-note-list"></i> &nbsp;&nbsp; Number of tracks: ${numTracks} </h4>
                                <h4 id="pop-score"> <i class="bi bi-graph-up-arrow"></i> &nbsp;&nbsp; Popularity Score: ${popularity} </h4>
                                <h4 id="genres"> <i class="bi bi-collection"></i> &nbsp;&nbsp; Genres: ${typeof genres === 'string' ? genres : genres.splice(0, 3).join(", ")} </h4>
                                <h4 id="label"> <i class="bi bi-disc"></i> &nbsp;&nbsp; Label: ${albumLabel} </h4>
                            </div>`;
    albumInfoRow.appendChild(numTrackCol);

    // Append info row to container
    albumInfoContainer.appendChild(albumInfoRow);
}

// Generates album tracklist
async function genAlbumTracks(album) {
    let tracks = album.tracks.items;
    let trackNum = 1;
    // Reset duration to 0
    albumDuration = 0;

    // Clear previous results
    albumTracksContainer.innerHTML = '';

    // Create column headers for tracks, e.g. title, duration, etc.
    const cols = document.createElement("div");
    cols.classList.add("row", "col-headers", "align-items-center");

    // Column denoting track number (1 through 10)
    const numberCol = document.createElement("div");
    numberCol.classList.add("col-1", "p-2", "text-center");
    numberCol.innerHTML = `<h3 id="number-col" style="margin: 0"> # </h3> `;
    cols.appendChild(numberCol);

    // Column denoting title of song
    const titleCol = document.createElement("div");
    titleCol.classList.add("col", "col-sm-8", "ps-0");
    titleCol.innerHTML = `<h3 id="title-col" style="margin: 0"> Title </h3> `;
    cols.appendChild(titleCol);

    // Column denoting track length
    const durationCol = document.createElement("div");
    durationCol.classList.add("col", "col-sm-1", "clock-container", "d-flex", "justify-content-center", "ms-auto", "me-auto");
    durationCol.innerHTML = `<i class="bi bi-clock"></i>`; // Clock icon from bootstrap
    cols.appendChild(durationCol);

    // Append column headers to track container
    albumTracksContainer.appendChild(cols);

    // For each album track, extract relevant info
    tracks.forEach(track => {
        const name = track.name;
        const linkTo = track.artists[0].external_urls.spotify;
        const duration = msToMinutesAndSeconds(track.duration_ms);
        albumDuration += track.duration_ms;
        const popularity = track.popularity;
        
        const div = document.createElement("div");
        div.classList.add("row", "track-item", "align-items-center");
        
        // Create col for track number, only 1/12 of row --> child of track-item row
        const trackNumber = document.createElement("div");
        trackNumber.classList.add("col-1", "p-2", "track-number-container", "text-center");
        trackNumber.innerHTML = `<h5 id="track-number"> ${trackNum}</h5>`;
        div.appendChild(trackNumber);

        // Create col for track name
        const trackName = document.createElement("div");
        trackName.classList.add("col", "col-sm-8", "track-name-container");
        trackName.innerHTML = `<h5 class="top-track-name"> ${name}</h5>`;
        div.appendChild(trackName);

        //Create col for track duration
        const durationContainer = document.createElement("div");
        durationContainer.classList.add("col", "col-sm-1", "duration-container", "ms-auto", "me-auto");
        durationContainer.innerHTML = `<p id="track-duration"> ${duration} </p>`;
        div.appendChild(durationContainer);

        // Append album-item row to albumContainer
        albumTracksContainer.appendChild(div);

        trackNum++;
    });
}

// Convert MS to min:sec format due to how API stores track length
const msToMinutesAndSeconds = function(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Calculates album length based on MS input
const albumLengthConversion = function(ms) {
    // Convert milliseconds to seconds
    let totalSeconds = Math.floor(ms / 1000);

    // Get hours, minutes, and seconds
    const hours = Math.floor(totalSeconds / 3600);
    totalSeconds %= 3600;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    // Output based on whether the duration exceeds an hour or not
    if (hours > 0) {
        return `${hours} hr${hours > 1 ? 's' : ''} ${minutes} min${minutes > 1 ? 's' : ''} ${seconds} sec`;
    } else {
        return `${minutes} min${minutes > 1 ? 's' : ''} ${seconds} sec`;
    }
}

// Converts date into readable format due to API format incompatibility 
const dateConversion = function(date) {

    // Split the input date by hyphens
    const [year, day, month] = date.split('-');
    
    // Rearrange the date to DD-MM-YYYY format
    return `${day}-${month}-${year}`;
}