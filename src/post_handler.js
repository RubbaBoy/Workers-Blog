const {RAW_URL_PREFIX, TEMPLATE_REPO, CONTENT_REPO} = require('./constants')
const parser = require('./content_parser')
const {ContentReplacer, ImageReplacer, TagsHandler} = require('./rewrite_helper');

module.exports = {
    handlePage: handlePage
}

async function handlePage(event /*: FetchEvent */, url /*: URL */) {
    if (!url.pathname.startsWith('/post/')) {
        return null;
    }

    let post = url.pathname.substr(6)

    let pageContent = await fetch(`${RAW_URL_PREFIX}${CONTENT_REPO}/posts/${post}/${post}.md`)
    let pageTemplate = await fetch(`${RAW_URL_PREFIX}${TEMPLATE_REPO}/post.html`)

    let parsed = parser.parseContent(await pageContent.text())

    let contentHTML = await (new HTMLRewriter()
        .on('img', new ImageReplacer(post))
        .transform(new Response(parsed.html))
        .text())

    return new HTMLRewriter()
        .on('.post-title', new ContentReplacer(parsed.title))
        .on('.post-date', new ContentReplacer(parsed.date))
        .on('.post-content', new ContentReplacer(contentHTML, true))
        .on('.tags', new TagsHandler(parsed.tags))
        .transform(new Response(pageTemplate.body, {headers: {'Content-Type': 'text/html'}}))
}