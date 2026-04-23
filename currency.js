const key = "991f791a4583dc1a120bb0b3";
const cache = "currRates";
const cacheTime = "currTime";
const expire = 3600000; // 1 hour
const list = ["USD", "CAD", "EUR", "GBP", "JPY", "AUD", "CHF", "CNY", "INR", "MXN"];

// debounce timer — prevents hammering the API on rapid clicks
let debounceTimer = null;

async function getRates() {
    const now = Date.now();
    const savedTime = sessionStorage.getItem(cacheTime);
    const savedData = sessionStorage.getItem(cache);

    // return cached rates if still within the expiry window
    if (savedData && savedTime && now - savedTime < expire) {
        return { rates: JSON.parse(savedData), fromCache: true };
    }

    try {
        const res  = await fetch(`https://v6.exchangerate-api.com/v6/${key}/latest/USD`);
        const data = await res.json();
        sessionStorage.setItem(cache, JSON.stringify(data.conversion_rates));
        sessionStorage.setItem(cacheTime, now.toString());
        return { rates: data.conversion_rates, fromCache: false };
    } catch (err) {
        return null;
    }
}

async function setup() {
    const fromSel = document.getElementById("from-c");
    const toSel   = document.getElementById("to-c");

    // Populate both selects
    list.forEach(c => {
        fromSel.add(new Option(c, c));
        toSel.add(new Option(c, c));
    });

    // Default selection
    toSel.value = "CAD";

    // Convert button with debounce
    document.getElementById("btn").addEventListener("click", () => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(doConvert, 300);
    });

    // Also convert on Enter key in amount field
    document.getElementById("amt").addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(doConvert, 300);
        }
    });
}

async function doConvert() {
    const amt  = parseFloat(document.getElementById("amt").value);
    const from = document.getElementById("from-c").value;
    const to   = document.getElementById("to-c").value;

    if (isNaN(amt) || amt <= 0) {
        alert("Please enter a valid amount greater than zero.");
        return;
    }

    const result = await getRates();

    if (!result) {
        document.getElementById("rt").innerText = "Error fetching rates. Please try again.";
        return;
    }

    const { rates, fromCache } = result;
    const rateFrom  = rates[from];
    const rateTo    = rates[to];
    const exchange  = rateTo / rateFrom;
    const total     = amt * exchange;

    // Format numbers — JPY doesn't use decimals
    const noDecimals = ["JPY", "KRW"];
    const toDecimals = noDecimals.includes(to) ? 0 : 2;
    const fmtTotal   = new Intl.NumberFormat("en-CA", {
        minimumFractionDigits: toDecimals,
        maximumFractionDigits: toDecimals
    }).format(total);
    const fmtRate = exchange.toFixed(4);

    // --- Update the result display block ---
    const resultBlock = document.getElementById("result-display");
    resultBlock.style.display = "block";

    // Re-trigger CSS animation by cloning and re-inserting (or toggling a class)
    resultBlock.style.animation = "none";
    resultBlock.offsetHeight; // force reflow
    resultBlock.style.animation = "";

    document.getElementById("res-from").innerText = `${amt.toLocaleString("en-CA")} ${from}`;
    document.getElementById("res-to").innerText   = `${fmtTotal} ${to}`;
    document.getElementById("rt").innerText       = `1 ${from} = ${fmtRate} ${to}`;

    // Cache indicator
    const cacheLabel = document.getElementById("cache-label");
    if (cacheLabel) {
        cacheLabel.innerText     = fromCache ? "⚡ Served from session cache" : "🌐 Fetched live from API";
        cacheLabel.style.color   = fromCache ? "#ffc94d" : "#2ed573";
    }
}

setup();
