"use strict";

// Default image URL used if the API doesn't give us an image.
const defaultImageUrl = "https://tinyurl.com/missing-tv";
// Base URL for the TVMaze API — we're using HTTPS for security.
const tvmazeApiUrl = "https://api.tvmaze.com/";

//main DOM elements for easy access.
const $showsList = $("#showsList");
const $episodesList = $("#episodesList");
const $episodesArea = $("#episodesArea");
const $searchForm = $("#searchForm");

// getShowsByTerm:
// this function calls the TVMaze API to grab a list of shows that match.
// It returns a promise that resolves to an array of show objects in the format:
// { id, name, summary, image } (uses defaultImageUrl if no image is provided).
async function getShowsByTerm(term) {
  const response = await axios({
    baseURL: tvmazeApiUrl,
    url: "search/shows",
    method: "GET",
    params: { q: term },
  });

  // Converts the API response into the format our app expects.
  return response.data.map(result => {
    const show = result.show;
    return {
      id: show.id,
      name: show.name,
      summary: show.summary,
      image: show.image ? show.image.medium : defaultImageUrl,
    };
  });
}

// populateShows:
// This function receives an array of show objects, creates an HTML card for each one,
// and appends them to the DOM. Each card shows the show's image, name, and summary,
// plus it has an "Episodes" button.
function populateShows(shows) {
  $showsList.empty();

  for (let show of shows) {
    const $show = $(`
      <div data-show-id="${show.id}" class="Show col-md-12 col-lg-6 mb-4">
         <div class="media">
           <img src="${show.image}" alt="${show.name}" class="w-25 me-3">
           <div class="media-body">
             <h5 class="text-primary">${show.name}</h5>
             <div><small>${show.summary}</small></div>
             <button class="btn btn-outline-light btn-sm Show-getEpisodes">
               Episodes
             </button>
           </div>
         </div>
      </div>
    `);
    $showsList.append($show);
  }
}

// searchForShowAndDisplay:
// When the user submits the search form, this function gets the search term,
// calls getShowsByTerm to fetch matching shows,
// then calls populateShows to display them.
// It also hides the episodes area since we're starting a new search.
async function searchForShowAndDisplay() {
  const term = $("#searchForm-term").val();
  const shows = await getShowsByTerm(term);
  $episodesArea.hide();
  populateShows(shows);
}

// Sets up the event listener for the search form submission.
$searchForm.on("submit", async function (evt) {
  evt.preventDefault();
  await searchForShowAndDisplay();
});

// getEpisodesOfShow:
// Given a show ID, this function calls the TVMaze API to get all episodes for that show.
// It returns a promise that resolves to an array of episode objects in the format:
// { id, name, season, number }.
async function getEpisodesOfShow(id) {
  const response = await axios({
    baseURL: tvmazeApiUrl,
    url: `shows/${id}/episodes`,
    method: "GET",
  });

  return response.data.map(e => ({
    id: e.id,
    name: e.name,
    season: e.season,
    number: e.number,
  }));
}

// populateEpisodes:
// This function takes an array of episode objects, creates an <li> for each,
// appends them to the episodes list in the DOM, and then shows the episodes area.
function populateEpisodes(episodes) {
  $episodesList.empty();

  for (let episode of episodes) {
    const $item = $(`
      <li>
         ${episode.name} (season ${episode.season}, episode ${episode.number})
      </li>
    `);
    $episodesList.append($item);
  }
  $episodesArea.show();
}

// getEpisodesAndDisplay:
// This function handles the click on an "Episodes" button.
// It finds the closest container with the show id,
// fetches that show's episodes using getEpisodesOfShow,
// and then displays them using populateEpisodes.
async function getEpisodesAndDisplay(evt) {
  const showId = $(evt.target).closest(".Show").data("show-id");
  const episodes = await getEpisodesOfShow(showId);
  populateEpisodes(episodes);
}

// Attaches the click event listener for the Episodes buttons.
$showsList.on("click", ".Show-getEpisodes", getEpisodesAndDisplay);
