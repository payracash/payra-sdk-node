# Payra Node SDK

Official **Node SDK** for integrating **Payra's on-chain payment system** into your backend applications.

This SDK provides:
- Secure generation of **ECDSA signatures** compatible with the Payra smart contract — used for order payment verification.
- Simple methods for **checking the on-chain details of orders** to confirm completed payments.

## How It Works

The typical flow for signing and verifying a Payra transaction:
1. The **frontend** prepares all required payment parameters:
	-  **Network** – blockchain name (e.g. Polygon, Linea)
	-  **Token address** – ERC-20 token contract address
	-  **Order ID** – unique order identifier
	-  **Amount WEI** – already converted to the smallest unit (e.g. wei, 10⁶)
	-  **Timestamp** – Unix timestamp of the order
	-  **Payer wallet address** – the wallet address from which the user will make the on-chain payment
2. The frontend sends these parameters to your **backend**.
3. The **backend** uses this SDK to generate a cryptographic **ECDSA signature** with its signature key (performed **offline**).
4. The backend returns the generated signature to the frontend.
5. The **frontend** calls the Payra smart contract (`payOrder`) with all parameters **plus** the signature.

This process ensures full compatibility between your backend and Payra’s on-chain verification logic.

## Features

- Generates **Ethereum ECDSA signatures** using the `secp256k1` curve.
- Fully compatible with **Payra's Solidity smart contracts** (`ERC-1155` payment verification).
- Supports `.env` and `config/payra.php` configuration for multiple blockchain networks.
- Laravel IoC container integration (easy dependency injection)
- Verifies **order payment details directly on-chain** via RPC or blockchain explorer API.
- Provides **secure backend integration** for signing and verifying transactions.
- Includes optional utility helpers for:
-  **Currency conversion** (via [ExchangeRate API](https://www.exchangerate-api.com/))
-  **USD ⇄ WEI** conversion for token precision handling.

## Setup

Before installing this package, make sure you have an active **Payra** account:

[https://payra.cash/products/on-chain-payments/registration](https://payra.cash/products/on-chain-payments/registration#registration-form)

Before installing this package, make sure you have a **MerchantID**
 
- Your **Merchant ID** (unique for each blockchain network)
- Your **Signature Key** (used to sign Payra transactions securely)

Additionally:
To obtain your **RPC URLs** which are required for reading on-chain order statuses directly from the blockchain, you can use the public free endpoints provided with this package or create an account on one of the following services for better performance and reliability:

-   **QuickNode** – Extremely fast and excellent for Polygon/Mainnet. ([quicknode.com](https://quicknode.com/))
    
-   **Alchemy** – Offers a great developer dashboard and high reliability. ([alchemy.com](https://alchemy.com/))
    
-   **DRPC** – Decentralized RPC with a generous free tier and a strict no-log policy. ([drpc.org](https://drpc.org))
    
-   **Infura** – The industry standard; very stable, especially for Ethereum. ([infura.io](https://infura.io))

Optional (recommended):
- Create a free API key at [ExchangeRate API](https://www.exchangerate-api.com/) to enable **automatic fiat → USD conversions** using the built-in utility helpers.


## Installation

### From NPM

Install the latest stable version from [NPM](https://www.npmjs.com/package/payra-sdk-node):

```bash
npm  install  payra-sdk-node
```

## Environment Configuration

Create a `.env` file in your project root (you can copy from example):

```bash
cp  .env.example  .env
```

This file stores your **private configuration** and connection settings for all supported networks. Never commit `.env` to version control.

### Required Variables

#### Exchange Rate (optional)

Used for automatic fiat → USD conversions via the built-in Payra utilities.

```bash
# Optional — only needed if you want to use the built-in currency conversion helper
PAYRA_EXCHANGE_RATE_API_KEY= # Your ExchangeRate API key (from exchangerate-api.com)
PAYRA_EXCHANGE_RATE_CACHE_TIME=720  # Cache duration in minutes (default: 720 = 12h)

# Polygon Network Configuration
PAYRA_POLYGON_OCP_GATEWAY_CONTRACT_ADDRESS=0xc56c55D9cF0FF05c85A2DF5BFB9a65b34804063b
PAYRA_POLYGON_SIGNATURE_KEY=
PAYRA_POLYGON_MERCHANT_ID=
PAYRA_POLYGON_RPC_URL_1=https://polygon-rpc.com
PAYRA_POLYGON_RPC_URL_2=

# Ethereum Network Configuration
PAYRA_ETHEREUM_OCP_GATEWAY_CONTRACT_ADDRESS=
PAYRA_ETHEREUM_SIGNATURE_KEY=
PAYRA_ETHEREUM_MERCHANT_ID=
PAYRA_ETHEREUM_RPC_URL_1=
PAYRA_ETHEREUM_RPC_URL_2=

# Linea Network Configuration
PAYRA_LINEA_OCP_GATEWAY_CONTRACT_ADDRESS=
PAYRA_LINEA_SIGNATURE__KEY=
PAYRA_LINEA_MERCHANT_ID=
PAYRA_LINEA_RPC_URL_1=
PAYRA_LINEA_RPC_URL_2=
```

#### Important Notes

- The cache automatically refreshes when it expires.
- You can adjust the cache duration by setting `PAYRA_EXCHANGE_RATE_CACHE_TIME`:
	-  `5` → cache for 5 minutes
	-  `60` → cache for 1 hour
	-  `720` → cache for 12 hours (default)
- Each network (Polygon, Ethereum, Linea) has its own **merchant ID**, **signature key**, and **RPC URLs**.
- The SDK automatically detects which chain configuration to use based on the selected network.
- You can use multiple RPC URLs for redundancy (the SDK will automatically fall back if one fails).
- Contract addresses correspond to the deployed Payra Core Forward contracts per network.

## Usage Example

### Generate Signature

```ts
import { generateSignature, PayraUtils } from  'payra-sdk-node';

try {
	// convert to wei if need
	// const amountWei = PayraUtils.toWei(3.34, "polygon", "usdt");

	const  network = 'polygon';
	const  tokenAddress = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'; // example token (USDT)
	const  orderId = 'ord-258';
	const  amountWei = 12340000; // 1 token (in wei)
	const  timestamp = 1760274141;  // Math.floor(Date.now() / 1000)
	const  payerAddress = '0xbCd665bE1393094bfD5013E0e2e21aB6Df1D6078';
	
	const  sig = generateSignature(
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
```

#### Input Parameters

| Field | Type | Description |
|--------------|----------|----------------------------------------------|
| **`network`** | `string` | Selected network name |
| **`tokenAddress`** | `string` | ERC20 token contract address |
| **`orderId`** | `string` | Unique order reference (e.g. ORDER-123) |
| **`amountWei`** | `string` or `integer` | Token amount in smallest unit (e.g. wei) |
| **`timestamp`** | `number` | Unix timestamp of signature creation |
| **`payerAddress`** | `string` | Payer Wallet Address
---

### Get Order Details

Retrieve **full payment details** for a specific order from the Payra smart contract. This method returns the complete on-chain payment data associated with the order, including:
- whether the order has been paid,
- the payment token address,
- the paid amount,
- the fee amount,
- and the payment timestamp.

Use this method when you need **detailed information** about the payment or want to display full transaction data.

```ts
import { getOrderDetails } from  'payra-sdk-node';
const  result = await  getOrderDetails("polygon", "ord-170");
console.log(result);
```

### Example response structure

```ts
{
	success: true,
	paid: true,
	error: null,
	token: '0xc2132D05D31c914a87C6611C10748AEb04B58e8F',
	amount: 400000,
	fee: 3600,
	timestamp: 1765138941
}
```
---

### Check Order Paid Status

Perform a **simple payment check** for a specific order. This method only verifies whether the order has been paid (`true` or `false`) and does **not** return any additional payment details.

Use this method when you only need a **quick boolean confirmation** of the payment status.

```ts
import { isOrderPaid } from  'payra-sdk-node';
const  result = await  isOrderPaid("polygon", "ord-170");
console.log(result);
```


### Example response structure

```ts
{
	success: true,
	paid: true,
	error: null
}
```

**Note:** Network identifiers should always be lowercase (e.g., `"polygon"`, `"ethereum"`, `"linea"`, `"flare"`).

## Utilities / Conversion Helpers  

The SDK includes **helper functions** for working with token amounts and currency conversion.

### 1. Get Token Decimals

```ts
import { PayraUtils } from  'payra-sdk-node';
const  tokenDecimals = PayraUtils.getTokenDecimals("polygon", "usdt");
console.log("Token decimals polygon usdt:", tokenDecimals);
```

Returns the number of decimal places for a given token on a specific network.

---

### 2. Convert USD/Token Amounts to Wei

```ts
import { PayraUtils } from  'payra-sdk-node';
const  amountWei = PayraUtils.toWei(3.34, "polygon", "usdt");
console.log("To Wei:", amountWei);
```
---

### 3. Convert Wei to USD/Token

```ts
import { PayraUtils } from  'payra-sdk-node';
const  amount = PayraUtils.fromWei(amountWei, "polygon", "usdt");
console.log("From Wei:", amount);
```
---

### 4. Currency Conversion (Optional)

Payra processes all payments in **USD**. If your store uses another currency (like EUR, AUD, or GBP), you can:
- Convert the amount to USD on your backend manually, **or**
- Use the built-in helper provided in the SDK. 

```ts
import { PayraUtils } from  'payra-sdk-node';
// Convert 100 EUR to USD
const  usdValue = await  PayraUtils.convertToUSD(100, "EUR");
console.log("100 EUR =", usdValue, "USD");
```

#### Setup for Currency Conversion

To use the conversion helper, you need a free API key from **[exchangerate-api.com](https://exchangerate-api.com/)**.

1. Register a free account and get your API key.
2. Add the key to your `.env` file:
3. 
```php
PAYRA_EXCHANGE_RATE_API_KEY=your_api_key_here
```
4. That’s it — Payra will automatically fetch the exchange rate and calculate the USD amount.

**Note:** The free plan allows 1,500 requests per month, which is sufficient for most stores. Exchange rates on this plan are updated every 24 hours, so with caching, it’s more than enough. Paid plans offer faster update intervals.

## Notes

- Your signature key **must be kept safe** and **never** committed to code repositories.
-  `PAYRA_WALLET_KEY` can be with or without `0x` prefix — both formats are accepted.
- The returned signature is a standard `0x`-prefixed Ethereum ECDSA signature.

## Project

- [https://payra.cash](https://payra.cash)
- [https://payra.tech](https://payra.tech)
- [https://payra.xyz](https://payra.xyz)
- [https://payra.eth](https://payra.eth.limo) - suporrted by Brave and Opera Browser or .limo

## Social Media

- [Telegram Payra Group](https://t.me/+GhTyJJrd4SMyMDA0)
- [Telegram Announcements](https://t.me/payracash)
- [Twix (X)](https://x.com/PayraCash)
- [Dev.to](https://dev.to/payracash)

## License
MIT © [Payra](https://payra.cash)