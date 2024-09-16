const APIController = (function() {
    
    const CLIENT_ID = '943baf2551b047c9a9fc96f062b8a5e9';
    const CLIENT_SECRET = '8cce0a7a70794acdbdb3e7d6c841ae3e';

    // private methods
    const _getToken = async () => {

        // make call to token endpoints via HTTP POST request w/ authorization
        const result = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type' : 'application/x-www-form-urlencoded', 
                'Authorization' : 'Basic ' + btoa(CLIENT_ID + ':' + CLIENT_SECRET)
            },
            body: 'grant_type=client_credentials'
        });

        const data = await result.json();
        return data.access_token;
    }

    // Returns endpoint of first 10 track found given a trackName & relevant track details (artist, length, etc)
    const _searchTrack = async (token, trackName) => {
        const result = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(trackName)}&type=track&limit=10`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data.tracks.items; 
    }

    // Returns track features e.g. danceability, energy, valence, etc.
    const _getTrackAudioFeatures = async (token, trackId) => {
        const result = await fetch(`https://api.spotify.com/v1/audio-features/${trackId}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data;
    }

    // Returns endpoints artists that most closely match 'artistName' with a limit of 10
    const _searchArtist = async (token, artistName) => {
        const result = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(artistName)}&type=artist&limit=10`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data.artists.items; 
    }

    // Returns artistObject, given an artistId
    const _getArtist = async (token, artistId) => {
        const result = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data;
    }

    // Returns (up to) 20 albums from an artist, given the artistId
    const _getArtistAlbums = async (token, artistId) => { 
        const result = await fetch(`https://api.spotify.com/v1/artists/${artistId}/albums?limit=20`, {
            method: 'GET',
            headers: {'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data.items; // Returns an array of albums
    }

    // Returns top 10 tracks of an artist, given the artistId
    const _getTopTracks = async (token, artistId) => { 
        const result = await fetch(`https://api.spotify.com/v1/artists/${artistId}/top-tracks`, { 
            method: 'GET',
            headers: {'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data.tracks;
    }

    // Returns array of ArtistObjects that represent similar artists to an artist, given an artistId
    const _getRelatedArtists = async (token, artistId, numSimilar) => {
        const result = await fetch(`https://api.spotify.com/v1/artists/${artistId}/related-artists`, {
            method: 'GET',
            headers: {'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data.artists.slice(0, numSimilar);
    }

    // Returns top 10 AlbumObjects for a given album name
    const _searchAlbum = async (token, albumName) => {
        const result = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(albumName)}&type=album&limit=10`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data.albums.items;
    }

    // Returns AlbumObject for a given albumId (includes album tracks)
    const _getAlbum = async (token, albumId) => {
        const result = await fetch(`https://api.spotify.com/v1/albums/${albumId}`, {
            method: 'GET',
            headers: { 'Authorization': 'Bearer ' + token }
        });

        const data = await result.json();
        return data;
    }

    return {
        getToken() {
            return _getToken();
        },
        searchTrack(token, trackName) {
            return _searchTrack(token, trackName);
        },
        getTrackAudioFeatures(token, trackId) {
            return _getTrackAudioFeatures(token, trackId);
        },
        searchArtist(token, artistName) {
            return _searchArtist(token, artistName);
        },
        getArtist(token, artistId) {
            return _getArtist(token, artistId);
        },
        getArtistAlbums(token, artistId) { 
            return _getArtistAlbums(token, artistId);
        },
        getTopTracks(token, artistId) { 
            return _getTopTracks(token, artistId);
        },
        getRelatedArtists(token, artistId, numSimilar) {
            return _getRelatedArtists(token, artistId, numSimilar);
        },
        searchAlbum(token, albumId) {
            return _searchAlbum(token, albumId);
        },
        getAlbum(token, albumId) {
            return _getAlbum(token, albumId)
        }
    }
})(); // We add parens here b/c IIFE function (immediately invoked func. expression) 

export default APIController;
