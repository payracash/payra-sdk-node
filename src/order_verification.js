// src/orderVerification.js
import { ethers } from "ethers";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

/**
 * Verify if an order is paid on Payra contract (Node.js version).
 *
 * @param {string} network   Blockchain network ("polygon", "ethereum", "linea", "flare")
 * @param {string} orderId   Unique order identifier
 * @returns {Promise<{success: boolean, paid: boolean|null, error: string|null}>}
 */
export async function isOrderPaid(network, orderId) {
    try {
        const upperNet = network.toUpperCase();

        const quickNodeUrl = getQuickNodeUrl(upperNet);

        const merchantId = process.env[`PAYRA_${upperNet}_MERCHANT_ID`];
        const forwardAddress = process.env[`PAYRA_${upperNet}_CORE_FORWARD_CONTRACT_ADDRESS`];

        if (!merchantId || !forwardAddress) {
            throw new Error(`Missing merchantId or forwardAddress for ${upperNet}`);
        }

        // Provider (read-only, RPC)
        const provider = new ethers.JsonRpcProvider(quickNodeUrl);

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
function getQuickNodeUrl(network) {
    const rpcMap = {
        POLYGON: "https://warmhearted-ancient-shadow.matic.quiknode.pro/{API_KEY}",
        ETHEREUM: "https://warmhearted-ancient-shadow.quiknode.pro/{API_KEY}",
        LINEA: "https://warmhearted-ancient-shadow.linea-mainnet.quiknode.pro/{API_KEY}",
        FLARE: "https://warmhearted-ancient-shadow.flare-mainnet.quiknode.pro/{API_KEY}/ext/bc/C/rpc/",
    };

    const apiKey = process.env.QUICK_NODE_RPC_API_KEY;

    if (!apiKey) {
        throw new Error("QUICK_NODE_RPC_API_KEY is not set!");
    }

    if (!rpcMap[network]) {
        throw new Error(`Unsupported network: ${network}`);
    }

    return rpcMap[network].replace("{API_KEY}", apiKey);
}
