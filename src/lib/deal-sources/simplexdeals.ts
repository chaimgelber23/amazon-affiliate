import { createShopifySource } from './_base';

export default createShopifySource({
    id: 'simplexdeals',
    displayName: 'SimplexDeals',
    baseUrl: 'http://www.simplexdeals.com', // HTTP — SSL cert expired
    limit: 50,
});
