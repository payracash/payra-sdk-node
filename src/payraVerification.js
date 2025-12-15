// src/orderVerification.js
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

/**
 * Get detailed status of an order from Payra smart contract (Node.js version).
 *
 * @param {string} network   Blockchain network ("polygon", "ethereum", "linea", "flare")
 * @param {string} orderId   Unique order identifier
 *
 * @returns {Promise<{
 *   success: boolean,
 *   paid: boolean|null,
 *   token: string|null,
 *   amount: number|null,
 *   fee: number|null,
 *   timestamp: number|null,
 *   error: string|null
 * }>}
 */
 export async function getOrderStatus(network, orderId) {
    try {
        const merchantId = process.env[`PAYRA_${network.toUpperCase()}_MERCHANT_ID`];

        const {
            forwardContract,
            coreIface,
            data,
        } = await prepareForwardCall(
            network,
            "getOrderStatus",
            [merchantId, orderId]
        );

        // forward(bytes) → static call
        const rawResult = await forwardContract.forward.staticCall(data);

        // decode tuple
        const [result] = coreIface.decodeFunctionResult(
            "getOrderStatus",
            rawResult
        );

        return {
            success: true,
            error: null,
            paid: Boolean(result.paid),
            token: result.token,
            amount: Number(result.amount),
            fee: Number(result.fee),
            timestamp: Number(result.timestamp),
        };

    } catch (err) {
        console.error("getOrderStatus failed:", err.message);
        return {
            success: false,
            error: err.message,
            paid: null,
            token: null,
            amount: null,
            fee: null,
            timestamp: null,
        };
    }
}

/**
 * Verify if an order is paid on Payra contract (Node.js version).
 *
 * @param {string} network   Blockchain network ("polygon", "ethereum", "linea", "flare")
 * @param {string} orderId   Unique order identifier
 * @returns {Promise<{success: boolean, paid: boolean|null, error: string|null}>}
 */
 export async function isOrderPaid(network, orderId) {
    try {
        const merchantId = process.env[`PAYRA_${network.toUpperCase()}_MERCHANT_ID`];

        const {
            forwardContract,
            coreIface,
            data,
        } = await prepareForwardCall(
            network,
            "isOrderPaid",
            [merchantId, orderId]
        );

        const rawResult = await forwardContract.forward.staticCall(data);

        const [paid] = coreIface.decodeFunctionResult(
            "isOrderPaid",
            rawResult
        );

        return {
            success: true,
            paid: Boolean(paid),
            error: null,
        };

    } catch (err) {
        console.error("isOrderPaid failed:", err.message);
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

/**
 * Prepare forward() call to Payra Core contract (Node.js).
 *
 * @param {string} network
 * @param {string} coreFunctionName
 * @param {Array}  params
 *
 * @returns {Promise<{
 *   provider: ethers.JsonRpcProvider,
 *   forwardContract: ethers.Contract,
 *   coreIface: ethers.Interface,
 *   data: string
 * }>}
 */
async function prepareForwardCall(network, coreFunctionName, params) {
    const upperNet = network.toUpperCase();
    const rpcUrl = getRpcUrl(upperNet);

    const ok = await checkRpcHealth(rpcUrl);
    if (!ok) throw new Error(`RPC ${rpcUrl} is not responding`);

    const merchantId = process.env[`PAYRA_${upperNet}_MERCHANT_ID`];
    const forwardAddress = process.env[`PAYRA_${upperNet}_CORE_FORWARD_CONTRACT_ADDRESS`];

    if (!merchantId || !forwardAddress) {
        throw new Error(`Missing merchantId or forwardAddress for ${upperNet}`);
    }

    // Provider (read-only)
    const provider = new ethers.JsonRpcProvider(rpcUrl);

    // Load ABI
    const abiPath = path.resolve("./src/contracts/payraABI.json");
    const abiArray = JSON.parse(fs.readFileSync(abiPath, "utf-8"));

    // Core + Forward interfaces
    const coreIface = new ethers.Interface(abiArray);
    const forwardIface = new ethers.Interface([
        "function forward(bytes data) payable returns (bytes)"
    ]);

    // Encode calldata (ethers robi selector + ABI)
    const data = coreIface.encodeFunctionData(coreFunctionName, params);

    // Forward contract
    const forwardContract = new ethers.Contract(
        forwardAddress,
        forwardIface,
        provider
    );

    return {
        provider,
        forwardContract,
        coreIface,
        data,
    };
}
