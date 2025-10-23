import fs from "fs";
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
     * PAYRA_EXCHANGE_RATE_API_KEY=https://v6.exchangerate-api.com/v6/your_key/latest/USD
     */
    static async convertToUSD(amount, fromCurrency)
    {
        const apiKey = process.env.PAYRA_EXCHANGE_RATE_API_KEY;
        if (!apiKey) {
            throw new Error(
                "PAYRA_EXCHANGE_RATE_API_KEY is not set. Please provide your API key from exchangerate-api.com"
            );
        }

        // Cache time in minutes (default: 720)
        const cacheMinutes = parseInt(process.env.PAYRA_EXCHANGE_RATE_CACHE_TIME || "720", 10);
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
}
