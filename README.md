
# Payra Node SDK (Backend Signature and Check Order Status)

This package allows you to **generate and verify payment signatures** and **checking the on-chain status of orders** for the [Payra](https://payra.cash) on-chain payment system.  

This SDK provides:  
- Secure generation of **ECDSA signatures** compatible with the Payra smart contract (used for payment verification).  
- Easy integration for **checking the on-chain status of orders** to confirm whether payments have been completed.
-
---

## SETUP

Before installing this package, make sure you have an active Payra account:

- [https://payra.cash](https://payra.cash)

You will need your `merchantID` and a dedicated account wallet (private key) to generate valid payment signatures.

Additionally, you must create a free account at [QuickNode](https://www.quicknode.com/) to obtain an API key.  
This key is required for sending RPC requests to the blockchain in order to verify the on-chain status of orders.

---

## Installation

```bash
npm install payra-sdk-node
```

---

## Usage

```ts
import { generateSignature, isOrderPaid } from 'payra-sdk-node';

// to sign order
const signature = generateSignature(network, tokenAddress, orderId, amount, timestamp, payerAddress);
console.log('Signature:', signature);

// to check order status
const result = await isOrderPaid(network, orderId);
console.log(result);
```

---

### Input Parameters

| Field         | Type     | Description                                  |
|--------------|----------|----------------------------------------------|
| `network`    | `string` | Selected network name                        |
| `tokenAddress` | `string` | ERC20 token contract address                 |
| `orderId`     | `string` | Unique order reference (e.g. ORDER-123)      |
| `amount`      | `string` | Token amount in smallest unit (e.g. wei)     |
| `timestamp`   | `number` | Unix timestamp of signature creation         |
| `payerAddress`   | `string` | Payer Wallet Address                         |

---

## Notes

- Your private key **must be kept safe** and **never** committed to code repositories.
- `PAYRA_WALLET_KEY` can be with or without `0x` prefix — both formats are accepted.
- The returned signature is a standard `0x`-prefixed Ethereum ECDSA signature.

---

## Example `.env`

```env
QUICK_NODE_RPC_API_KEY=your_quick_node_api_key

PAYRA_POLYGON_CORE_FORWARD_CONTRACT_ADDRESS=0xf30070da76B55E5cB5750517E4DECBD6Cc5ce5a8
PAYRA_POLYGON_PRIVATE_KEY=your_private_key_here
PAYRA_POLYGON_MERCHANT_ID=your_merchant_id_here

PAYRA_ETHEREUM_CORE_FORWARD_CONTRACT_ADDRESS=
PAYRA_ETHEREUM_PRIVATE_KEY=
PAYRA_ETHEREUM_MERCHANT_ID=

PAYRA_LINEA_CORE_FORWARD_CONTRACT_ADDRESS=
PAYRA_LINEA_PRIVATE_KEY=
PAYRA_LINEA_MERCHANT_ID=
```

---

## Project

-   [https://payra.cash](https://payra.cash)
-   [https://payra.tech](https://payra.tech)
-   [https://payra.xyz](https://payra.xyz)
-   [https://payra.eth](https://payra.eth)

---

## Social Media

- [Telegram Payra Group](https://t.me/+GhTyJJrd4SMyMDA0)
- [Telegram Announcements](https://t.me/payracash)
- [Twix (X)](https://x.com/PayraCash)
- [Hashnode](https://payra.hashnode.dev)

---

##  License

MIT © [Payra](https://github.com/payracash)
