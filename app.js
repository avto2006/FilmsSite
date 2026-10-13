let moviesData = [];
let watchlist = JSON.parse(localStorage.getItem('cinematix_watchlist')) || [];

// Hero Slider Variables
let currentHeroIndex = 0;
let heroSliderInterval = null;
let heroMovies = [];

// Carousel Variables
let trendingPage = 0; // 0, 1, 2 (სულ 3 გვერდი, თითოზე 4 ფილმი = 12)
let trendingInterval = null;
const TOTAL_TRENDING_MOVIES = 12;

// DOM Elements
const trendingGrid = document.getElementById('trendingGrid');
const topRatedGrid = document.getElementById('topRatedGrid');
const allMoviesGrid = document.getElementById('allMoviesGrid');
const watchlistGrid = document.getElementById('watchlistGrid');
const emptyWatchlistMsg = document.getElementById('emptyWatchlistMsg');
const searchInput = document.getElementById('searchInput');
const themeToggle = document.getElementById('themeToggle');
const videoModal = document.getElementById('videoModal');
const closeModal = document.getElementById('closeModal');
const mainVideoPlayer = document.getElementById('mainVideoPlayer');
const heroContent = document.querySelector('.hero-content');
const prevTrendingBtn = document.getElementById('prevTrending');
const nextTrendingBtn = document.getElementById('nextTrending');

// Init Platform
document.addEventListener('DOMContentLoaded', async () => {
  await fetchMovies();
  if (moviesData.length > 0) {
    heroMovies = moviesData.filter(m => m.trending).slice(0, 5);
    if (heroMovies.length === 0) heroMovies = moviesData.slice(0, 5);

    setupHeroSlider();
    renderAllSections(moviesData);
    setupTrendingCarousel();
    updateWatchlistBadge();
  }
});

// Fetch JSON Data
async function fetchMovies() {
  try {
    const res = await fetch('movies.json');
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    moviesData = await res.json();
  } catch (err) {
    console.error('ფილმების ჩატვირთვის შეცდომა:', err);
  }
}

// Hero Slider (4 წამი)
function setupHeroSlider() {
  updateHeroContent(heroMovies[currentHeroIndex]);

  if (heroSliderInterval) clearInterval(heroSliderInterval);

  heroSliderInterval = setInterval(() => {
    currentHeroIndex = (currentHeroIndex + 1) % heroMovies.length;
    if (heroContent) heroContent.classList.add('fade-out');

    setTimeout(() => {
      updateHeroContent(heroMovies[currentHeroIndex]);
      if (heroContent) heroContent.classList.remove('fade-out');
    }, 400);
  }, 4000);
}

function updateHeroContent(movie) {
  if (!movie) return;
  document.getElementById('heroTitle').textContent = movie.title;
  document.getElementById('heroDesc').textContent = movie.description;
  document.getElementById('heroRating').innerHTML = `<i class="fa-solid fa-star"></i> ${movie.rating}`;
  document.getElementById('heroYear').textContent = movie.year;
  document.getElementById('heroGenre').textContent = movie.genre;
  document.getElementById('heroBackdrop').style.backgroundImage = `url('${movie.backdrop}')`;

  document.getElementById('heroPlayBtn').onclick = () => openPlayer(movie);
  
  const heroBookmarkBtn = document.getElementById('heroBookmarkBtn');
  if (heroBookmarkBtn) {
    const isBookmarked = watchlist.includes(movie.id);
    heroBookmarkBtn.innerHTML = `<i class="fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark"></i> ${isBookmarked ? 'სიაშია' : 'სიაში დამატება'}`;
    heroBookmarkBtn.onclick = (e) => toggleWatchlist(e, movie.id);
  }
}

// Trending 12-Movie Carousel Setup
function setupTrendingCarousel() {
  const trendingMovies = moviesData.slice(0, TOTAL_TRENDING_MOVIES);
  renderGrid(trendingGrid, trendingMovies);

  startTrendingAutoSlide();

  if (nextTrendingBtn) {
    nextTrendingBtn.onclick = () => {
      resetTrendingAutoSlide();
      moveTrending(1);
    };
  }

  if (prevTrendingBtn) {
    prevTrendingBtn.onclick = () => {
      resetTrendingAutoSlide();
      moveTrending(-1);
    };
  }
}

function moveTrending(direction) {
  const totalPages = Math.ceil(TOTAL_TRENDING_MOVIES / 4); // 3 გვერდი
  trendingPage = (trendingPage + direction + totalPages) % totalPages;

  // 100% ტრეკის გადაწევა + gap-ის გათვალისწინება
  const offset = trendingPage * 100;
  if (trendingGrid) {
    trendingGrid.style.transform = `translateX(-${offset}%)`;
  }
}

function startTrendingAutoSlide() {
  if (trendingInterval) clearInterval(trendingInterval);
  trendingInterval = setInterval(() => {
    moveTrending(1);
  }, 4000);
}

function resetTrendingAutoSlide() {
  clearInterval(trendingInterval);
  startTrendingAutoSlide();
}

// Render Grids
function renderAllSections(movies) {
  renderGrid(topRatedGrid, [...movies].sort((a, b) => b.rating - a.rating));
  renderGrid(allMoviesGrid, movies);
  renderWatchlist();
}

function renderGrid(container, movies) {
  if (!container) return;
  container.innerHTML = '';
  movies.forEach(movie => {
    const isBookmarked = watchlist.includes(movie.id);
    const card = document.createElement('div');
    card.className = 'movie-card';
    card.innerHTML = `
      <div class="bookmark-icon ${isBookmarked ? 'active' : ''}" onclick="toggleWatchlist(event, ${movie.id})">
        <i class="fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark"></i>
      </div>
      <div class="card-poster">
        <img src="${movie.poster}" alt="${movie.title}" loading="lazy">
        <div class="play-overlay">
          <i class="fa-solid fa-play"></i>
        </div>
      </div>
      <div class="card-details">
        <div class="card-title">${movie.title}</div>
        <div class="card-meta">
          <span>${movie.year} • ${movie.genre}</span>
          <span style="color: var(--star-color)"><i class="fa-solid fa-star"></i> ${movie.rating}</span>
        </div>
      </div>
    `;
    card.onclick = (e) => {
      if (!e.target.closest('.bookmark-icon')) openPlayer(movie);
    };
    container.appendChild(card);
  });
}

// Watchlist
function toggleWatchlist(e, movieId) {
  if (e) e.stopPropagation();
  if (watchlist.includes(movieId)) {
    watchlist = watchlist.filter(id => id !== movieId);
  } else {
    watchlist.push(movieId);
  }
  localStorage.setItem('cinematix_watchlist', JSON.stringify(watchlist));
  renderAllSections(moviesData);
  setupTrendingCarousel();
  updateWatchlistBadge();
  updateHeroContent(heroMovies[currentHeroIndex]);
}

function renderWatchlist() {
  const watchlistedMovies = moviesData.filter(m => watchlist.includes(m.id));
  if (watchlistedMovies.length === 0) {
    if (emptyWatchlistMsg) emptyWatchlistMsg.classList.remove('hidden');
    if (watchlistGrid) watchlistGrid.innerHTML = '';
  } else {
    if (emptyWatchlistMsg) emptyWatchlistMsg.classList.add('hidden');
    renderGrid(watchlistGrid, watchlistedMovies);
  }
}

function updateWatchlistBadge() {
  const badge = document.getElementById('watchlist-count');
  if (badge) badge.textContent = watchlist.length;
}

// Video Player Modal
function openPlayer(movie) {
  document.getElementById('modalMovieTitle').textContent = movie.title;
  document.getElementById('modalMovieDesc').textContent = movie.description;
  mainVideoPlayer.src = movie.videoUrl;
  videoModal.style.display = 'flex';
  mainVideoPlayer.play();
}

if (closeModal) {
  closeModal.onclick = () => {
    videoModal.style.display = 'none';
    mainVideoPlayer.pause();
    mainVideoPlayer.src = '';
  };
}

// Search & Genre Filter
const genrePills = document.getElementById('genrePills');
if (genrePills) {
  genrePills.addEventListener('click', (e) => {
    if (!e.target.classList.contains('pill')) return;
    document.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
    e.target.classList.add('active');

    const genre = e.target.dataset.genre;
    const filtered = genre === 'all' ? moviesData : moviesData.filter(m => m.genre === genre);
    renderAllSections(filtered);
  });
}

if (searchInput) {
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    const filtered = moviesData.filter(m => 
      m.title.toLowerCase().includes(query) || m.genre.toLowerCase().includes(query)
    );
    renderAllSections(filtered);
  });
}
// ffs
// Theme Toggle
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    themeToggle.innerHTML = `<i class="fa-solid fa-${isLight ? 'sun' : 'moon'}"></i>`;
  });
}