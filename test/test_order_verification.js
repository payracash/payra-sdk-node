import { isOrderPaid } from '../src/index.js';

const run = async () =>
{
    const result = await isOrderPaid("polygon", "ORDER-1765138911744-126-5");
    console.log(result);
};

run();
