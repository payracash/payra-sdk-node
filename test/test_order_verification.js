import { isOrderPaid } from '../src/index.js';

const run = async () => {
    const result = await isOrderPaid("polygon", "shop-1-187");
    console.log(result);
};

run();
