const constants = require('./constants')
const parser = require('./content_parser')

module.exports = {
    handlePage: handlePage
}

class ContentReplacer {
    constructor(content, isHTML = false) {
        this.content = content
        this.isHTML = isHTML
    }

    element(el) {
        el.setInnerContent(this.content, {html: this.isHTML})
    }
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
        console.log('orig = ' + original + ' new url: ' + (constants.RAW_URL_PREFIX + constants.CONTENT_REPO + prefix + original));
        element.setAttribute('src', constants.RAW_URL_PREFIX + constants.CONTENT_REPO + prefix + original)
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

    let pageContent = await fetch(`${constants.RAW_URL_PREFIX}${constants.CONTENT_REPO}/posts/${post}/${post}.md`)
    let pageTemplate = await fetch(`${constants.RAW_URL_PREFIX}${constants.TEMPLATE_REPO}/post.html`)

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