import { generateSignature } from '../src/index.js';

const run = async () =>
{
    try {
        const network       = 'polygon';
        const tokenAddress  = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F';  // example token (USDT)
        const orderId       = 'ORDER-1760273788561-93-661';
        const amountWei     = 12340000;   // 1 token (in wei)
        const timestamp     = 1769978053  // Math.floor(Date.now() / 1000);
        const payerAddress  = '0xbCd665bE1393094bfD5013E0e2e21aB6Df1D6078';

        const sig = generateSignature(
            network,
            tokenAddress,
            orderId,
            amountWei,
            timestamp,
            payerAddress
        );

        console.log('Signature generated:', sig);
    } catch (err) {
        console.error('Error:', err.message);
    }
}

run();
