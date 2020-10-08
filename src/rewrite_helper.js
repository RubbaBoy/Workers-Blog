const {RAW_URL_PREFIX, CONTENT_REPO} = require('./constants')

module.exports = {
    ContentReplacer: ContentReplacer,
    ImageReplacer: ImageReplacer,
    TagsHandler: TagsHandler
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

class StringRewriter {
    constructor(html) {
        this.html = html
        this.rewriter = new HTMLRewriter()
    }

    on(selector, handler) /*: StringRewriter */ {
        this.rewriter = this.rewriter.on(selector, handler)
        return this
    }

    async transform() /*: string */ {
        return await this.rewriter.transform(new Response(this.html)).text()
    }
}
