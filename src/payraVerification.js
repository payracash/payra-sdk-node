// src/orderVerification.js
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Verify if an order is paid on Payra contract (Node.js version).
 *
 * @param {string} network   Blockchain network ("polygon", "ethereum", "linea", "flare")
 * @param {string} orderId   Unique order identifier
 * @returns {Promise<{success: boolean, paid: boolean|null, error: string|null}>}
 */
export async function isOrderPaid(network, orderId)
{
    try {
        const upperNet = network.toUpperCase();
        const rpcUrl = getRpcUrl(upperNet);
        const ok = await checkRpcHealth(rpcUrl);
        if (!ok) throw new Error(`RPC ${rpcUrl} is not responding`);
        const merchantId = process.env[`PAYRA_${upperNet}_MERCHANT_ID`];
        const forwardAddress = process.env[`PAYRA_${upperNet}_CORE_FORWARD_CONTRACT_ADDRESS`];

        if (!merchantId || !forwardAddress) {
            throw new Error(`Missing merchantId or forwardAddress for ${upperNet}`);
        }

        // Provider (read-only, RPC)
        const provider = new ethers.JsonRpcProvider(rpcUrl);

        // ABI dla forward i core
        const abiPath = path.resolve("./src/contracts/payraABI.json");
        const abiArray = JSON.parse(fs.readFileSync(abiPath, "utf-8"));

        const forwardIface = new ethers.Interface([
            "function forward(bytes data) payable returns (bytes)"
        ]);
        const coreIface = new ethers.Interface([
            "function isOrderPaid(uint256 _id, string _orderId) view returns (bool)"
        ]);

        // Encode call isOrderPaid
        const encodedIsOrderPaid = coreIface.encodeFunctionData("isOrderPaid", [
            merchantId,
            orderId,
        ]);

        // Forward contract (only provider = read-only)
        const forwardContract = new ethers.Contract(forwardAddress, forwardIface, provider);

        // Call forward(bytes) as staticCall
        const rawResult = await forwardContract.forward.staticCall(encodedIsOrderPaid);

        // Decode result isOrderPaid()
        const [isPaid] = coreIface.decodeFunctionResult("isOrderPaid", rawResult);

        return {
            success: true,
            paid: Boolean(isPaid),
            error: null,
        };
    } catch (err) {
        console.error("Verification failed:", err.message);
        return {
            success: false,
            paid: null,
            error: err.message,
        };
    }
}

/**
 * Get QuickNode RPC endpoint URL
 */
function getRpcUrl(network)
{
    const upperNet = network.toUpperCase();
    const urls = [];

    let i = 1;
    while (true) {
        const key = `PAYRA_${upperNet}_RPC_URL_${i}`;
        const value = process.env[key];
        if (!value) break;
        urls.push(value.trim());
        i++;
    }

    if (urls.length === 0) {
        throw new Error(`No RPC URLs found for network: ${upperNet}`);
    }

    // Random 1 url
    const randomUrl = urls[Math.floor(Math.random() * urls.length)];
    return randomUrl;
}

async function checkRpcHealth(url)
{
    const timeout = 3000; // 3 seconds

    try {
        const response = await axios.post(
            url,
            {
                jsonrpc: "2.0",
                method: "eth_blockNumber",
                id: 1,
                params: []
            },
            {
                timeout,
                headers: { 'Content-Type': 'application/json' }
            }
        );

        // Check if response is valid
        return (
            response.status === 200 &&
            response.data &&
            typeof response.data.result === 'string'
        );
    } catch (error) {
        console.log(`RPC ${url} failed:`, error.message);
        return false;
    }
}
