const {RAW_URL_PREFIX, CONTENT_REPO} = require('./constants')
const parser = require('./content_parser')
const {ContentReplacer} = require('./rewrite_helper');

module.exports = {
    handlePage: handlePage
}

class ImageReplacer {
    constructor(pageName) {
        this.pageName = pageName
    }

    element(element) {
        let original = element.getAttribute('src')
        let prefix = ''
        if (!original.startsWith('/')) {
            prefix = '/posts/' + this.pageName + '/'
        }
        console.log('orig = ' + original + ' new url: ' + (RAW_URL_PREFIX + CONTENT_REPO + prefix + original));
        element.setAttribute('src', RAW_URL_PREFIX + CONTENT_REPO + prefix + original)
    }
}

class TagsHandler {
    constructor(tags) {
        this.tags = tags
    }

    element(element) {
        let tagHTML = element.getAttribute('tag')
        element.setInnerContent(this.tags.map(tag => tagHTML.replace('#', '/tag/' + tag).replace('%', tag)).join('\n'), {html: true})
    }
}

async function handlePage(url /*: URL */) {
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