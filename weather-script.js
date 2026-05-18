class WeatherDashboard {
    constructor() {
        this.apiKey = 'a6d3ca7f4af543d9b2d172328241805'; // Open-Meteo API (free, no key needed) or WeatherAPI
        this.isCelsius = true;
        this.recentSearches = [];
        this.init();
    }

    init() {
        this.loadRecentSearches();
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        document.getElementById('searchBtn').addEventListener('click', () => this.searchWeather());
        document.getElementById('locationBtn').addEventListener('click', () => this.getCurrentLocation());
        document.getElementById('cityInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchWeather();
        });
        document.getElementById('tempToggle').addEventListener('change', (e) => {
            this.isCelsius = !e.target.checked;
            this.render();
        });
    }

    searchWeather() {
        const city = document.getElementById('cityInput').value.trim();
        if (!city) {
            this.showError('Please enter a city name');
            return;
        }
        this.fetchWeatherData(city);
    }

    getCurrentLocation() {
        if (!navigator.geolocation) {
            this.showError('Geolocation is not supported by your browser');
            return;
        }

        this.showLoading(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                this.fetchWeatherByCoordinates(latitude, longitude);
            },
            () => {
                this.showError('Unable to retrieve your location');
                this.showLoading(false);
            }
        );
    }

    fetchWeatherByCoordinates(lat, lon) {
        const url = `https://api.weatherapi.com/v1/current.json?key=${this.apiKey}&q=${lat},${lon}&aqi=yes`;
        this.fetchWeatherData(null, url);
    }

    fetchWeatherData(city, customUrl = null) {
        this.showLoading(true);
        this.showError('');

        const url = customUrl || `https://api.weatherapi.com/v1/current.json?key=${this.apiKey}&q=${city}&aqi=yes`;

        fetch(url)
            .then(response => {
                if (!response.ok) {
                    if (response.status === 400) {
                        throw new Error('City not found. Please try again.');
                    }
                    throw new Error('Unable to fetch weather data');
                }
                return response.json();
            })
            .then(data => {
                this.weatherData = data;
                document.getElementById('cityInput').value = '';
                if (city) this.addRecentSearch(city);
                this.render();
            })
            .catch(error => {
                this.showError(error.message || 'An error occurred. Please try again.');
            })
            .finally(() => {
                this.showLoading(false);
            });
    }

    displayWeather() {
        if (!this.weatherData) return;

        const current = this.weatherData.current;
        const location = this.weatherData.location;

        // Location Info
        document.getElementById('cityName').textContent = `${location.name}, ${location.country}`;
        document.getElementById('updateTime').textContent = `Last updated: ${new Date(current.last_updated).toLocaleString()}`;

        // Temperature
        const temp = this.isCelsius ? current.temp_c : current.temp_f;
        const feelsLike = this.isCelsius ? current.feelslike_c : current.feelslike_f;
        const unit = this.isCelsius ? '°C' : '°F';

        document.getElementById('temperature').textContent = `${Math.round(temp)}${unit}`;
        document.getElementById('weatherDescription').textContent = current.condition.text;
        document.getElementById('feelsLike').textContent = `Feels like ${Math.round(feelsLike)}${unit}`;

        // Weather Icon
        document.getElementById('weatherIcon').src = 'https:' + current.condition.icon;
        document.getElementById('weatherIcon').alt = current.condition.text;

        // Details
        document.getElementById('humidity').textContent = `${current.humidity}%`;
        document.getElementById('windSpeed').textContent = `${this.isCelsius ? current.wind_kph : current.wind_mph} ${this.isCelsius ? 'km/h' : 'mph'}`;
        document.getElementById('pressure').textContent = `${current.pressure_mb} mb`;
        document.getElementById('uvIndex').textContent = `${current.uv}`;
        document.getElementById('visibility').textContent = `${this.isCelsius ? current.vis_km : current.vis_miles} ${this.isCelsius ? 'km' : 'mi'}`;
        document.getElementById('dewPoint').textContent = `${Math.round(this.isCelsius ? current.dewpoint_c : current.dewpoint_f)}${unit}`;

        // Show forecast (using current data, for full forecast we'd need another API call)
        this.displayForecast();
    }

    displayForecast() {
        const forecastList = document.getElementById('forecastList');
        if (!this.weatherData) return;

        // Since WeatherAPI's free tier doesn't include forecast in current endpoint,
        // we'll show a message or remove this section
        // For a complete solution, use the forecast.json endpoint
        document.getElementById('forecastSection').classList.add('hidden');
    }

    addRecentSearch(city) {
        if (!this.recentSearches.includes(city)) {
            this.recentSearches.unshift(city);
            if (this.recentSearches.length > 5) {
                this.recentSearches.pop();
            }
            this.saveRecentSearches();
        }
    }

    displayRecentSearches() {
        const recentSection = document.getElementById('recentSearches');
        const recentList = document.getElementById('recentList');

        if (this.recentSearches.length === 0) {
            recentSection.classList.add('hidden');
            return;
        }

        recentList.innerHTML = '';
        this.recentSearches.forEach(city => {
            const item = document.createElement('div');
            item.className = 'recent-item';
            item.textContent = city;
            item.addEventListener('click', () => {
                document.getElementById('cityInput').value = city;
                this.searchWeather();
            });
            recentList.appendChild(item);
        });

        recentSection.classList.remove('hidden');
    }

    showLoading(show) {
        document.getElementById('loadingState').classList.toggle('hidden', !show);
    }

    showError(message) {
        const errorState = document.getElementById('errorState');
        if (message) {
            errorState.textContent = message;
            errorState.classList.remove('hidden');
        } else {
            errorState.classList.add('hidden');
        }
    }

    render() {
        if (this.weatherData) {
            document.getElementById('currentWeather').classList.remove('hidden');
            this.displayWeather();
        } else {
            document.getElementById('currentWeather').classList.add('hidden');
        }
        this.displayRecentSearches();
    }

    saveRecentSearches() {
        localStorage.setItem('recentSearches', JSON.stringify(this.recentSearches));
    }

    loadRecentSearches() {
        const saved = localStorage.getItem('recentSearches');
        this.recentSearches = saved ? JSON.parse(saved) : [];
    }
}

// Initialize the app
const weatherApp = new WeatherDashboard();
