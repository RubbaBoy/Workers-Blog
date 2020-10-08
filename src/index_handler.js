const {ContentReplacer, TagsHandler, StringRewriter} = require('./rewrite_helper');
const {CacheManager} = require('./cache_manager');
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

async function handleIndex(event /*: FetchEvent */, url /*: URL */) {
    if (url.pathname !== '/') {
        return null;
    }

    return new CacheManager(event)
        .cache((_) => handleIndexUncached())
}

async function handleIndexUncached() {
    let template = ''
    let pageTemplate = await (await fetch(`${RAW_URL_PREFIX}${TEMPLATE_REPO}/index.html`)).text()

    await (new StringRewriter(pageTemplate)
        .on('.preview-container .row span', new TemplateFinder(found =>
            template = found
                .replaceAll(/(?<!\\)'/g, '"')
                .replaceAll('\\\'', '\''))))
        .transform()

    let posts = []
    let listing = await (await fetch(`${API_REPOS}${CONTENT_RAW_REPO}/contents/posts`, fetchOptions)).json()
    for (const list of listing) {
        let name = list.name
        if (name.includes('.')) {
            continue
        }

        let parsed = parser.parseContent(await (await fetch(`${RAW_URL_PREFIX}${CONTENT_REPO}/posts/${name}/${name}.md`,
            fetchOptions)).text(), '[//]: <> "End preview"')

        posts.push({
            title: parsed.title,
            date: parsed.date,
            content: parsed.html,
            tags: parsed.tags
        })
    }

    let postHTML = ''
    for (const post of posts) {
        postHTML += await (new StringRewriter(template)
            .on('.post-title', new ContentReplacer(post.title))
            .on('.post-date', new ContentReplacer(post.date))
            .on('.post-content', new ContentReplacer(post.content, true)))
            .on('.tags', new TagsHandler(post.tags))
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
