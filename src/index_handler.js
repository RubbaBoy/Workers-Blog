const {ContentReplacer} = require('./rewrite_helper');
const parser = require('./content_parser')
const {API_REPOS, RAW_URL_PREFIX, TEMPLATE_REPO, CONTENT_REPO, CONTENT_RAW_REPO} = require('./constants')

module.exports = {
    handleIndex: handleIndex
}

const fetchOptions = {
    method: 'GET',
    headers: {
        'User-Agent': 'Cloudflare Workers Blog',
        'Access-Control-Allow-Origin': '*'
    },
}

async function handleIndex(url /*: URL */) {
    if (url.pathname !== '/') {
        return null;
    }

    let template = ''
    let pageTemplate = await (await fetch(`${RAW_URL_PREFIX}${TEMPLATE_REPO}/index.html`)).text()

    await (new StringRewriter(pageTemplate)
        .on('.preview-container .row span', new TemplateFinder(tem => template = tem)))
        .transform()

    let posts = []

    let listing = await (await fetch(`${API_REPOS}${CONTENT_RAW_REPO}/contents/posts`, fetchOptions)).json()

    for (const list of listing) {
        let name = list.name
        if (name.includes('.')) {
            continue
        }

        let parsed = parser.parseContent(await (await fetch(`${RAW_URL_PREFIX}${CONTENT_REPO}/posts/${name}/${name}.md`,
            fetchOptions)).text(), {contentUntil: '[//]: <> "End preview"'})

        posts.push({
            title: parsed.title,
            date: parsed.date,
            content: parsed.html
        })
    }

    let postHTML = ''
    for (const post of posts) {
        postHTML += await (new StringRewriter(template)
            .on('.post-title', new ContentReplacer(post.title))
            .on('.post-date', new ContentReplacer(post.date))
            .on('.post-content', new ContentReplacer(post.content, true)))
            .transform()
    }

    let newHTML = await (new StringRewriter(pageTemplate)
        .on('.row', new ContentReplacer(postHTML, true)))
        .transform()

    return new Response(newHTML, {headers: {'Content-Type': 'text/html'}})
}

class TemplateFinder {
    constructor(callback) {
        this.callback = callback
    }

    element(el) {
        this.callback(el.getAttribute('template'))
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
