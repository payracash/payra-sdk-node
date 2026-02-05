// src/orderService.js
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
export async function getOrderDetails(network, orderId) {
    try {
        const { userDataContract, merchantId } = await getPayraContracts(network);
        const order = await userDataContract.getOrderDetails(merchantId, orderId);

        return {
            success: true,
            error: null,
            paid: Boolean(order.paid),
            token: order.token,
            amount: Number(order.amount),
            fee: Number(order.fee),
            timestamp: Number(order.timestamp),
        };
    } catch (err) {
        console.error("getOrderStatus failed:", err.message);
        return { success: false, error: err.message, paid: null, token: null, amount: null, fee: null, timestamp: null };
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
        const { userDataContract, merchantId } = await getPayraContracts(network);
        const isPaid = await userDataContract.isOrderPaid(merchantId, orderId);
        
        return {
            success: true,
            paid: Boolean(isPaid),
            error: null,
        };
    } catch (err) {
        console.error("isOrderPaid failed:", err.message);
        return { success: false, paid: null, error: err.message };
    }
}

/**
 * Internal helper to initialize Payra contracts and provider.
 */
async function getPayraContracts(network) {
    const upperNet = network.toUpperCase();
    const rpcUrl = getRpcUrl(upperNet);

    const ok = await checkRpcHealth(rpcUrl);
    if (!ok) throw new Error(`RPC ${rpcUrl} is not responding`);

    const merchantId = process.env[`PAYRA_${upperNet}_MERCHANT_ID`];
    const gatewayAddr = process.env[`PAYRA_${upperNet}_OCP_GATEWAY_CONTRACT_ADDRESS`];

    if (!merchantId || !gatewayAddr) {
        throw new Error(`Missing merchantId or gatewayAddr for ${upperNet}`);
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const abiPath = path.resolve("./src/contracts/payraABI.json");
    const payraABI = JSON.parse(fs.readFileSync(abiPath, 'utf8'));

    const gatewayContract = new ethers.Contract(gatewayAddr, payraABI, provider);
    const [ , , userDataAddr, ] = await gatewayContract.getRegistryDetails();
    const userDataContract = new ethers.Contract(userDataAddr, payraABI, provider);

    return { userDataContract, merchantId: BigInt(merchantId) };
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