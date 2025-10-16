import { PayraUtils } from "../src/index.js";

const run = async () =>
{
    const tokenDecimals = PayraUtils.getTokenDecimals("polygon", "usdt");
    console.log("Token decimals polygon usdt:", tokenDecimals);

    const amountWei = PayraUtils.toWei(3.34, "polygon", "usdt");
    console.log("To Wei:", amountWei);

    const amount = PayraUtils.fromWei(amountWei, "polygon", "usdt");
    console.log("From Wei:", amount);

    try {
        const usdValue = await PayraUtils.convertToUSD(100, "EUR");
        console.log("100 EUR =", usdValue, "USD");
    } catch (err) {
        console.error("Error:", err.message);
    }
};

run();
