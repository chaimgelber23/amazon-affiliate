// Image scraping from Amazon.com has been disabled — it violates Amazon's ToS.
// ProductImage components gracefully fall back to a placeholder on 404.
// To display real Amazon product images, register for the Amazon Product Advertising API (PA API).

export async function GET() {
    return new Response(null, { status: 404 });
}
