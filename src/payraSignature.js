// src/signature.js

import { Wallet, keccak256, AbiCoder, toUtf8Bytes } from 'ethers';
import dotenv from 'dotenv';
import { Buffer } from 'buffer';

dotenv.config();

export function generateSignature(network, tokenAddress, orderId, amount, timestamp, payerAddress)
{
    const { privateKey, merchantId } = getPayraConfig(network);

    let key = privateKey.startsWith('0x')
        ? privateKey.slice(2)
        : privateKey;

    if (key.length !== 64)
        throw new Error(`Invalid private key for ${network}`);

    const wallet = new Wallet(key);
    const abi = AbiCoder.defaultAbiCoder();
    const encoded = abi.encode(
        ['address', 'uint256', 'string', 'uint256', 'uint256', 'address'],
        [tokenAddress, merchantId, orderId, amount, timestamp, payerAddress]
    );

    const hash = keccak256(encoded);
    const prefix = toUtf8Bytes('\x19Ethereum Signed Message:\n32');
    const digest = keccak256(Buffer.concat([
        prefix,
        Buffer.from(hash.slice(2), 'hex')
    ]));

    const signature = wallet.signingKey.sign(digest);

    return '0x' +
        signature.r.substring(2).padStart(64, '0') +
        signature.s.substring(2).padStart(64, '0') +
        (signature.v).toString(16).padStart(2, '0');
}

function getPayraConfig(network)
{
    const upper = network.toUpperCase();
    const privateKey = process.env[`PAYRA_${upper}_PRIVATE_KEY`];
    const merchantId = process.env[`PAYRA_${upper}_MERCHANT_ID`];

    if (!privateKey || !merchantId) {
        throw new Error(`Missing PAYRA config for network: ${network}`);
    }

    return { privateKey, merchantId };
}
