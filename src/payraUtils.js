import fs from "fs";
//import os from "os";
import path from "path";
import dotenv from "dotenv";
import BigNumber from "bignumber.js";

dotenv.config();

export class PayraUtils
{
    static defaultDecimals =
    {
        POLYGON_USDT: 6,
        POLYGON_USDC: 6,
    };

    /**
     * Get token decimals from .env or fallback defaults
     */
    static getTokenDecimals(network, symbol)
    {
        const key = `${network}_${symbol}`.toUpperCase();
        const envKey = `PAYRA_${key}_DECIMALS`;
        const envValue = process.env[envKey];

        if (envValue) {
            return parseInt(envValue);
        }

        return this.defaultDecimals[key] ?? 18;
    }

    /**
     * Convert amount to Wei (integer string)
     */
    static toWei(amount, network, symbol)
    {
        const decimals = this.getTokenDecimals(network, symbol);
        const multiplier = new BigNumber(10).pow(decimals);
        return new BigNumber(amount).times(multiplier).toFixed(0);
    }

    /**
     * Convert Wei to decimal token amount
     */
    static fromWei(amountWei, network, symbol, precision = 2)
    {
        const decimals = this.getTokenDecimals(network, symbol);
        const divisor = new BigNumber(10).pow(decimals);
        const value = new BigNumber(amountWei).dividedBy(divisor);
        return value.toFixed(precision);
    }

    /**
     * Convert given amount from any supported currency to USD
     * using the ExchangeRate API (https://www.exchangerate-api.com/).
     *
     * The .env must contain:
     * EXCHANGE_RATE_API_KEY=https://v6.exchangerate-api.com/v6/your_key/latest/USD
     */


/*
     static async convertToUSD(amount, fromCurrency) {
         const apiKey = process.env.EXCHANGE_RATE_API_KEY;
         if (!apiKey) {
           throw new Error(
             "EXCHANGE_RATE_API_KEY is not set. Please provide your API key from exchangerate-api.com"
           );
         }

         const cacheMinutes = parseInt(process.env.EXCHANGE_RATE_CACHE_TIME || "720", 10);
         const cacheTTL = cacheMinutes * 60; // in seconds

         // Cache file path (e.g., ~/.payra/exchange_rate_cache.json)
         const cacheDir = path.join(os.homedir(), ".payra");
         const cachePath = path.join(cacheDir, "exchange_rate_cache.json");
console.log(cacheDir, cachePath);
         const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
         fromCurrency = fromCurrency.toUpperCase();
         const now = Math.floor(Date.now() / 1000);

         let data = null;

         // 🔹 1. Try read cache
         if (fs.existsSync(cachePath)) {
           try {
             const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
             if (cache.timestamp && (now - cache.timestamp) < cacheTTL) {
               data = cache.data;
               console.log("✅ Using cached exchange rates.");
             }
           } catch {
             // Ignore broken cache
           }
         }

         // 🔹 2. Fetch new data if no valid cache
         if (!data) {
           console.log("🌐 Fetching fresh data from ExchangeRate API...");
           const response = await fetch(apiUrl, { timeout: 10000 });
           if (!response.ok) {
             // fallback: use old cache if available
             if (fs.existsSync(cachePath)) {
               const cache = JSON.parse(fs.readFileSync(cachePath, "utf8"));
               data = cache.data;
               console.warn("⚠️ API request failed, using stale cache data.");
             } else {
               throw new Error(`Failed to connect to ExchangeRate API (${response.status})`);
             }
           } else {
             data = await response.json();
             // save cache
             fs.mkdirSync(cacheDir, { recursive: true });
             fs.writeFileSync(cachePath, JSON.stringify({ timestamp: now, data }), "utf8");
           }
         }

         // 🔹 3. Validate and convert
         if (!data.conversion_rates || !data.conversion_rates[fromCurrency]) {
           throw new Error(`Conversion rate for ${fromCurrency} not found in API response`);
         }

         const rate = data.conversion_rates[fromCurrency];
         const usdValue = parseFloat((amount / rate).toFixed(2));

         return usdValue;
       }

*/
    static async convertToUSD(amount, fromCurrency)
    {
        const apiKey = process.env.EXCHANGE_RATE_API_KEY;
        if (!apiKey) {
            throw new Error(
                "EXCHANGE_RATE_API_KEY is not set. Please provide your API key from exchangerate-api.com"
            );
        }

        // Cache time in minutes (default: 720)
        const cacheMinutes = parseInt(process.env.EXCHANGE_RATE_CACHE_TIME || "720", 10);
        const cacheTTL = cacheMinutes * 60 * 1000; // milliseconds

        // Cache file path (saved inside SDK package directory)
        const cacheFile = path.join(process.cwd(), "payra_exchange_rate_cache.json");

        const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
        fromCurrency = fromCurrency.toUpperCase();
        const currentTime = Date.now();

        // --- Try to read cache
        let cachedData = null;

        try {
            if (fs.existsSync(cacheFile)) {
                const fileData = JSON.parse(fs.readFileSync(cacheFile, "utf8"));
                if (currentTime - fileData.timestamp < cacheTTL) {
                    console.log("Using cached exchange rates");
                    cachedData = fileData.data;
                }
            }
        } catch (err) {
            console.warn("Failed to read cache file:", err.message);
        }

        let data = cachedData;

        // --- Fetch from API if cache missing or expired
        if (!data) {
            console.log("Fetching fresh exchange rates from API...");
            try {
                const response = await fetch(apiUrl);
                if (!response.ok) {
                    throw new Error(`Failed to connect to ExchangeRate API (${response.status})`);
                }

                data = await response.json();

                // Save to cache file
                fs.writeFileSync(
                    cacheFile,
                    JSON.stringify({ timestamp: currentTime, data }),
                    "utf8"
                );
                console.log("Exchange rates cached successfully");
            } catch (err) {
                // If API fails, but we have old cache, use it
                if (cachedData) {
                    console.warn("Using old cached data due to API failure:", err.message);
                    data = cachedData;
               } else {
                  throw new Error(`Failed to fetch ExchangeRate API: ${err.message}`);
               }
            }
        }

        // --- Validate and convert
        if (!data.conversion_rates || !data.conversion_rates[fromCurrency]) {
            throw new Error(`Conversion rate for ${fromCurrency} not found in API response`);
        }

        const rate = data.conversion_rates[fromCurrency];
        const usdValue = parseFloat((amount / rate).toFixed(2));
        return usdValue;
   }


    /*
    static async convertToUSD(amount, fromCurrency)
    {
        const apiKey = process.env.EXCHANGE_RATE_API_KEY;
        if (!apiKey) {
            throw new Error(
               "EXCHANGE_RATE_API_KEY is not set. Please provide your API key from exchangerate-api.com"
            );
        }

        const apiUrl = `https://v6.exchangerate-api.com/v6/${apiKey}/latest/USD`;
        fromCurrency = fromCurrency.toUpperCase();

        try {
            const response = await fetch(apiUrl, { timeout: 10000 });
            if (!response.ok) {
                throw new Error(`Failed to connect to ExchangeRate API (${response.status})`);
            }

            const data = await response.json();

            if (!data.conversion_rates || !data.conversion_rates[fromCurrency]) {
                throw new Error(`Conversion rate for ${fromCurrency} not found in API response`);
            }

            const rate = data.conversion_rates[fromCurrency];
            const usdValue = parseFloat((amount / rate).toFixed(2));

            return usdValue;
        } catch (err) {
            throw new Error(`Failed to fetch ExchangeRate API: ${err.message}`);
        }
    }*/
}
