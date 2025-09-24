import { generateSignature } from '../src/index.js';

async function run() {
    try {
        const network = 'polygon';
        const tokenAddress = '0x0000000000000000000000000000000000001010'; // example token (POL)
        const orderId = 'order_123';
        const amount = 1000000000000000000n; // 1 token (w wei)
        const timestamp = Math.floor(Date.now() / 1000);
        const payerAddress = '0x1111111111111111111111111111111111111111';

        const sig = generateSignature(
            network,
            tokenAddress,
            orderId,
            amount,
            timestamp,
            payerAddress
        );

        console.log('Signature generated:', sig);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

run();
