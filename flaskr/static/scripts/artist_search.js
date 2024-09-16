import APIController from './api.js';

const search = document.querySelector("#search-bar");
const searchResults = document.querySelector("#search-results");
const resultPlaceholder = document.querySelector("#result-placeholder");
const results = document.querySelector("#results");
const albumContainer = document.querySelector("#album-container");
const viewMoreBtn = document.querySelector("#view-more-btn");
const tracksContainer = document.querySelector("#top-tracks-container");

search.addEventListener('input', async () => {
    const query = search.value.trim().toLowerCase();

    if (query.length > 0) {
        // Fetch the token
        const token = await APIController.getToken();

        // Search for artists
        let artists = await APIController.searchArtist(token, query);

        // Score and sort artists
        if (artists && artists.length > 0) {
            artists = artists.map(artist => {
                // Assign a match score based on how closely the artist's name matches the query
                let matchScore = 0;
                const artistName = artist.name.toLowerCase();

                // Exact match (highest score)
                if (artistName === query) {
                    matchScore = 3;
                }
                // Artist name starts with the query (next highest score)
                else if (artistName.startsWith(query)) {
                    matchScore = 2;
                }
                // Query is contained within the artist name (lowest score)
                else if (artistName.includes(query)) {
                    matchScore = 1;
                }

                return {
                    ...artist,
                    matchScore: matchScore
                };
            });

            // First sort by matchScore, then by followers for artists with the same matchScore
            artists.sort((a, b) => {
                if (b.matchScore === a.matchScore) {
                    return b.followers.total - a.followers.total;
                }
                return b.matchScore - a.matchScore;
            });
        }

        // Keeping track of number of results
        let artistNum = 1;

        // Clear previous results
        searchResults.innerHTML = '';
        if (artists && artists.length > 0) {
            artists.forEach(artist => {
                const div = document.createElement('div');
                div.className = 'search-result-item';
                div.textContent = `${artistNum}. ${artist.name} (${artist.followers.total} followers)`;
                div.dataset.artistId = artist.id;
                artistNum++;

                // Does not add border to bottom of last search result for clean formatting
                if (artists.indexOf(artist) === artists.length - 1) {
                    div.style.borderBottom = 'none';
                }

                // Optional: Handle click on the suggestion
                div.addEventListener('click', async () => {
                    search.value = `${artist.name}`;
                    hideSearchResults();
                    genResults(artist);
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

// Handles album (discography) & top track API calls, then calls their respective functions
// to display the results of these calls
async function genResults(artist) {
    const token = await APIController.getToken();
    const artistID = artist.id;

    // Throw error if no ID given
    if (!artistID) { 
        throw new Error("No Artist with the given name was found.")
    }

    // If nothing has been searched yet, expand results container's height to 100%
    results.style.height = '100%';

    // Clear placeholder
    resultPlaceholder.innerHTML = `<h1> ${artist.name} </h1>`;

    const albums = await APIController.getArtistAlbums(token, artistID);
    genAlbums(albums);

    const topTracks = await APIController.getTopTracks(token, artistID);
    genTopTracks(topTracks);

    results.style.marginBottom = '40px';
    
    const toolTips = document.querySelectorAll('.tool-tip');
    toolTips.forEach(t => new bootstrap.Tooltip(t));
}

async function genAlbums(albums) {
    albumContainer.innerHTML = '<h2 id="discography-title" class="mt-sm-5 mt-lg-0"> Discography </h2>';

    // Keep track of number of valid album types
    let albumCount = 0
    albums.forEach(album => {
        // Only consider the album to be a part of the discography if it's not a single
        if (album.album_type === "album" && album.album_group === "album") {
            albumCount++;
            // Create variables for relevant album info
            const name = album.name;
            const numTracks = album.total_tracks;
            const coverURL = album.images[0].url;
            const linkTo = album.external_urls.spotify;
            const release = album.release_date;
            const datePrecision = album.release_date_precision;

            // Create new 'row' div to store each album-item in
            const div = document.createElement("div");
            div.classList.add("row", "album-item", "align-items-center");
            
            // Create col for album cover, left 33% of row --> child of album-item row
            const albumCover = document.createElement("div");
            albumCover.classList.add("col-12", "col-sm-4", "p-0", "cover-container");
            // Clicking image will also link user to Spotify's website for that album
            albumCover.innerHTML = `<a href=${linkTo} class="text-decoration-none" target="_blank"> <img src=${coverURL} alt="${name} Cover" class="album-cover"> </a>`;
            div.appendChild(albumCover);

            // Create col for album info, right 66% of row --> child of album-item row
            const albumInfo = document.createElement("div");
            albumInfo.classList.add("col-12", "col-sm-8", "ps-3", "pe-0");
            albumInfo.innerHTML = `
            <h3 class="album-title"> ${name}</h3>
            <p class="album-info"> ${release} <br> ${numTracks} tracks`;
            div.appendChild(albumInfo);

            // Append album-item row to albumContainer
            albumContainer.appendChild(div);
        }
    });

    // Only show 'view more albums' button if artist actually has more than 3 albums
    viewMoreBtn.style.display = 'none';
    console.log(albums)
    if (albumCount > 3) {
        viewMoreBtn.style.display = 'flex';
    }
}

viewMoreBtn.addEventListener("click", (e) => {
    let hiddenAlbums = document.querySelectorAll(".album-item:nth-child(n+5)");

    hiddenAlbums.forEach(album => {
        album.style.display = 'flex';
    });

    e.target.style.display = 'none';
});

async function genTopTracks(tracks) {
    const msToMinutesAndSeconds = function(ms) {
        const totalSeconds = Math.floor(ms / 1000);
        const minutes = Math.floor(totalSeconds / 60);
        const seconds = totalSeconds % 60;
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Clear previous results
    tracksContainer.innerHTML = '<h2 id="tracks-title" class="mb-3"> Top 10 Tracks </h2>';
    let trackNum = 1

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
    titleCol.classList.add("col", "col-sm-6", "ps-0");
    titleCol.innerHTML = `<h3 id="title-col" style="margin: 0"> Title </h3> `;
    cols.appendChild(titleCol);

    // Column denoting popularity of song
    const popCol = document.createElement("div");
    popCol.classList.add("col-2", "col-sm-3", "text-center");
    popCol.innerHTML = `<button type="button" class="btn tool-tip"
                        data-bs-toggle="tooltip" data-bs-placement="top"
                        data-bs-title="A rank of a song is determined by how 'popular' it is relative to other songs made by the same artist.">
                        <h3 style="margin: 0"> Rank </h3>
                        </button>`;
    cols.appendChild(popCol);

    // Column denoting track length
    const durationCol = document.createElement("div");
    durationCol.classList.add("col-2", "col-sm-2", "ps-3", "clock-container");
    durationCol.innerHTML = `<i class="bi bi-clock"></i>`; // Clock icon from bootstrap
    cols.appendChild(durationCol);

    // Append column headers to track container
    tracksContainer.appendChild(cols);


    tracks.forEach(track => {
        const name = track.name;
        const coverURL = track.album.images[0].url;
        const linkTo = track.artists[0].external_urls.spotify;
        const albumName = track.album.name;
        const duration = msToMinutesAndSeconds(track.duration_ms);
        const popularity = track.popularity;
        
        const div = document.createElement("div");
        div.classList.add("row", "track-item", "align-items-center");
        
        // Create col for track number, only 1/12 of row --> child of track-item row
        const trackNumber = document.createElement("div");
        trackNumber.classList.add("col-1", "p-2", "track-number-container", "text-center");
        trackNumber.innerHTML = `<h3 id="track-number"> ${trackNum}</h3>`;
        div.appendChild(trackNumber);

        // Create col for small icon-like image for album the song belongs to, 
        const trackAlbumImgContainer = document.createElement("div");
        trackAlbumImgContainer.classList.add("col-2", "col-sm-1", "track-album-img-container");
        trackAlbumImgContainer.innerHTML = `<a href=${linkTo} class="text-decoration-none" target="_blank"> <img src=${coverURL} alt="${name} Cover" class="album-cover-icon"> </a>`;    
        div.appendChild(trackAlbumImgContainer);

        // Create col for track name
        const trackName = document.createElement("div");
        trackName.classList.add("col", "col-sm-6", "track-name-container");
        trackName.innerHTML = `<h6 class="top-track-name"> ${name}</h6>`;
        div.appendChild(trackName);

        // Create col for popularity rating
        const popRating = document.createElement("div");
        popRating.classList.add("col-1", "col-sm-1", "pop-rating-container", "text-center");
        popRating.innerHTML = `<h4 id="pop-rating"> ${popularity} </h4>`;
        div.appendChild(popRating);

        //Create col for track duration
        const durationContainer = document.createElement("div");
        durationContainer.classList.add("col-2", "col-sm-1", "duration-container", "ms-auto", "me-auto");
        durationContainer.innerHTML = `<p id="track-duration"> ${duration} </p>`;
        div.appendChild(durationContainer);

        // Append album-item row to albumContainer
        tracksContainer.appendChild(div);

        trackNum++;
    })
}



// const related = await APIController.getRelatedArtists(token, artistID, 5);

