import { isOrderPaid } from '../src/index.js';

const run = async () =>
{
    const result = await isOrderPaid("polygon", "ord-170");
    console.log(result);
};

run();
