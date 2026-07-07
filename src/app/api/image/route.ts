// Image scraping from Amazon.com has been disabled — it violates Amazon's ToS.
// ProductImage components gracefully fall back to a placeholder on 404.
// To display real Amazon product images, use Amazon's official product APIs.

export async function GET() {
    return new Response(null, { status: 404 });
}
