let moviesData = [];
let watchlist = JSON.parse(localStorage.getItem('cinematix_watchlist')) || [];

// Hero Slider Variables
let currentHeroIndex = 0;
let heroSliderInterval = null;
let heroMovies = [];

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

// Init Platform
document.addEventListener('DOMContentLoaded', async () => {
  await fetchMovies();
  if (moviesData.length > 0) {
    // ამოვიღოთ 5 ტრენდული/ფავორიტი ფილმი სლაიდერისთვის
    heroMovies = moviesData.filter(m => m.trending).slice(0, 5);
    if (heroMovies.length === 0) heroMovies = moviesData.slice(0, 5);

    setupHeroSlider();
    renderAllSections(moviesData);
    updateWatchlistBadge();
  } else {
    console.error('ფილმების მონაცემები ცარიელია!');
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

// Hero Slider (ყოველ 4 წამში იცვლება)
function setupHeroSlider() {
  updateHeroContent(heroMovies[currentHeroIndex]);

  // გავასუფთაოთ წინა ინტერვალი თუ არსებობდა
  if (heroSliderInterval) clearInterval(heroSliderInterval);

  // 4000ms = 4 წამი
  heroSliderInterval = setInterval(() => {
    currentHeroIndex = (currentHeroIndex + 1) % heroMovies.length;
    
    // გლუვი გადასვლის (fade) ეფექტი
    if (heroContent) heroContent.classList.add('fade-out');

    setTimeout(() => {
      updateHeroContent(heroMovies[currentHeroIndex]);
      if (heroContent) heroContent.classList.remove('fade-out');
    }, 400); // ტექსტის შეცვლა ანიმაციის ნახევარზე
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

  // Play Button
  document.getElementById('heroPlayBtn').onclick = () => openPlayer(movie);
  
  // Bookmark Button Update
  const heroBookmarkBtn = document.getElementById('heroBookmarkBtn');
  if (heroBookmarkBtn) {
    const isBookmarked = watchlist.includes(movie.id);
    heroBookmarkBtn.innerHTML = `<i class="fa-${isBookmarked ? 'solid' : 'regular'} fa-bookmark"></i> ${isBookmarked ? 'სიაშია' : 'სიაში დამატება'}`;
    heroBookmarkBtn.onclick = (e) => toggleWatchlist(e, movie.id);
  }
}

// Render Grids
function renderAllSections(movies) {
  renderGrid(trendingGrid, movies.filter(m => m.trending));
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

// Watchlist Functionality
function toggleWatchlist(e, movieId) {
  if (e) e.stopPropagation();
  if (watchlist.includes(movieId)) {
    watchlist = watchlist.filter(id => id !== movieId);
  } else {
    watchlist.push(movieId);
  }
  localStorage.setItem('cinematix_watchlist', JSON.stringify(watchlist));
  renderAllSections(moviesData);
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

// Player Modal
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

// Filtering & Search
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

// Theme Switcher
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light-theme');
    const isLight = document.body.classList.contains('light-theme');
    themeToggle.innerHTML = `<i class="fa-solid fa-${isLight ? 'sun' : 'moon'}"></i>`;
  });
}