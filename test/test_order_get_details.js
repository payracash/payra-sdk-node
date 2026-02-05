import { getOrderDetails } from '../src/index.js';

const run = async () =>
{
    const result = await getOrderDetails("polygon", "ord-258");
    console.log(result);
};

run();
