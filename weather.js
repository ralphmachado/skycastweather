const key = "65e81e1f628bdd1d0a6cd01e96fefc2f";
const loc = "Calgary";
const cache = "weatherData";
const cacheTime = "weatherTime";
const expire = 600000; // 10 minutes

async function getWeather() {
    const now = Date.now();
    const savedTime = localStorage.getItem(cacheTime);
    const savedData = localStorage.getItem(cache);

    // serve from localStorage if it's still fresh
    if (savedData && savedTime && now - savedTime < expire) {
        showWeather(JSON.parse(savedData), true);
        return;
    }

    try {
        const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${loc}&appid=${key}&units=metric`);
        const data = await res.json();
        localStorage.setItem(cache, JSON.stringify(data));
        localStorage.setItem(cacheTime, now.toString());
        showWeather(data, false);
    } catch (err) {
        document.getElementById("desc").innerText = "Error loading weather.";
        document.getElementById("cache-status").innerText = "Failed to fetch data";
    }
}

function showWeather(data, fromCache) {
    const temp      = Math.round(data.main.temp);
    const feelsLike = Math.round(data.main.feels_like);
    const humidity  = data.main.humidity;
    const windKmh   = Math.round(data.wind.speed * 3.6);
    const pressure  = data.main.pressure;
    const desc      = data.weather[0].description;
    const iconCode  = data.weather[0].icon;

    // --- Big hero values ---
    document.getElementById("temp").innerText   = temp;
    document.getElementById("desc").innerText   = desc;
    document.getElementById("time").innerText   = "Updated: " + new Date().toLocaleString();

    // --- Weather icon ---
    const iconEl = document.getElementById("weather-icon");
    if (iconEl && iconCode) {
        iconEl.src = `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
        iconEl.alt = desc;
    }

    // --- Right-side meta grid ---
    const heroMeta = document.getElementById("hero-meta");
    if (heroMeta) {
        heroMeta.style.display = "grid";
        document.getElementById("feels").innerText    = feelsLike + "°C";
        document.getElementById("humidity").innerText = humidity + "%";
        document.getElementById("wind").innerText     = windKmh + " km/h";
        document.getElementById("pressure").innerText = pressure + " hPa";
    }

    // --- Detail strip cards ---
    document.getElementById("feels-strip").innerText    = feelsLike + "°C";
    document.getElementById("humidity-strip").innerText = humidity + "%";
    document.getElementById("wind-strip").innerText     = windKmh + " km/h";
    document.getElementById("pressure-strip").innerText = pressure + " hPa";

    // --- Cache status card ---
    const statusEl = document.getElementById("cache-status");
    if (statusEl) {
        statusEl.innerText = fromCache ? "Loaded from cache (< 10 min)" : "Live from OpenWeatherMap";
        statusEl.style.color = fromCache ? "#ffc94d" : "#2ed573";
    }

    // --- Humidity progress bar ---
    const barFill  = document.getElementById("humidity-bar-fill");
    const barLabel = document.getElementById("humidity-bar-label");
    if (barFill)  barFill.style.width  = humidity + "%";
    if (barLabel) barLabel.innerText   = humidity + "%";
}

getWeather();
