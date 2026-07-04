const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const message = document.getElementById('message');
const weatherCard = document.getElementById('weatherCard');

const cityName = document.getElementById('cityName');
const dateTime = document.getElementById('dateTime');
const weatherIcon = document.getElementById('weatherIcon');
const temperature = document.getElementById('temperature');
const description = document.getElementById('description');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const precipitation = document.getElementById('precipitation');

// WMO weather codes -> { icon, label }
const WEATHER_CODES = {
  0: ['☀️', 'Clear sky'],
  1: ['🌤️', 'Mainly clear'],
  2: ['⛅', 'Partly cloudy'],
  3: ['☁️', 'Overcast'],
  45: ['🌫️', 'Fog'],
  48: ['🌫️', 'Freezing fog'],
  51: ['🌦️', 'Light drizzle'],
  53: ['🌦️', 'Drizzle'],
  55: ['🌦️', 'Dense drizzle'],
  61: ['🌧️', 'Light rain'],
  63: ['🌧️', 'Rain'],
  65: ['🌧️', 'Heavy rain'],
  71: ['🌨️', 'Light snow'],
  73: ['🌨️', 'Snow'],
  75: ['❄️', 'Heavy snow'],
  80: ['🌧️', 'Rain showers'],
  81: ['🌧️', 'Rain showers'],
  82: ['⛈️', 'Violent rain showers'],
  95: ['⛈️', 'Thunderstorm'],
  96: ['⛈️', 'Thunderstorm with hail'],
  99: ['⛈️', 'Severe thunderstorm']
};

function showMessage(text) {
  message.textContent = text;
}

function clearMessage() {
  message.textContent = '';
}

// Step 1: Geocode city name to lat/lon using Open-Meteo's free geocoding API
async function geocodeCity(city) {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`;
  const res = await fetch(url);
  const data = await res.json();

  if (!data.results || data.results.length === 0) {
    throw new Error('City not found. Try a different spelling.');
  }

  const { latitude, longitude, name, country } = data.results[0];
  return { latitude, longitude, name, country };
}

// Step 2: Fetch current weather for given coordinates
async function fetchWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&timezone=auto`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch weather data.');
  return res.json();
}

function renderWeather(locationLabel, data) {
  const current = data.current;
  const [icon, label] = WEATHER_CODES[current.weather_code] || ['🌡️', 'Unknown'];

  cityName.textContent = locationLabel;
  dateTime.textContent = new Date(current.time).toLocaleString(undefined, {
    weekday: 'long', hour: '2-digit', minute: '2-digit'
  });
  weatherIcon.textContent = icon;
  temperature.textContent = `${Math.round(current.temperature_2m)}°C`;
  description.textContent = label;
  feelsLike.textContent = `${Math.round(current.apparent_temperature)}°C`;
  humidity.textContent = `${current.relative_humidity_2m}%`;
  windSpeed.textContent = `${current.wind_speed_10m} km/h`;
  precipitation.textContent = `${current.precipitation} mm`;

  weatherCard.classList.remove('hidden');
}

async function searchByCity() {
  const city = cityInput.value.trim();
  if (!city) {
    showMessage('Please enter a city name.');
    return;
  }

  clearMessage();
  weatherCard.classList.add('hidden');
  showMessage('Loading...');

  try {
    const { latitude, longitude, name, country } = await geocodeCity(city);
    const data = await fetchWeather(latitude, longitude);
    clearMessage();
    renderWeather(`${name}, ${country}`, data);
  } catch (err) {
    showMessage(err.message || 'Something went wrong.');
  }
}

async function searchByLocation() {
  if (!navigator.geolocation) {
    showMessage('Geolocation is not supported by your browser.');
    return;
  }

  clearMessage();
  weatherCard.classList.add('hidden');
  showMessage('Getting your location...');

  navigator.geolocation.getCurrentPosition(
    async (position) => {
      try {
        const { latitude, longitude } = position.coords;
        const data = await fetchWeather(latitude, longitude);
        clearMessage();
        renderWeather('Your Location', data);
      } catch (err) {
        showMessage(err.message || 'Something went wrong.');
      }
    },
    () => showMessage('Location access denied.')
  );
}

searchBtn.addEventListener('click', searchByCity);
locationBtn.addEventListener('click', searchByLocation);
cityInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') searchByCity();
});
