const {ContentReplacer} = require('./rewrite_helper');
const {RAW_URL_PREFIX, TEMPLATE_REPO, CONTENT_REPO} = require('./constants')

module.exports = {
    handleIndex: handleIndex
}

async function handleIndex(url /*: URL */) {
    if (url.pathname !== '/') {
        return null;
    }

    let template = ''

    let pageTemplate = await (await fetch(`${RAW_URL_PREFIX}${TEMPLATE_REPO}/index.html`)).text()

    await (new StringRewriter(pageTemplate)
        .on('.foo', new TemplateFinder(tem => template = tem)))
        .transform()

    let posts = [
        {
            title: 'Some title',
            date: '10/8/2020',
            content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nam sit amet auctor tellus. Maecenas vel libero ipsum. Cras vitae molestie arcu. Suspendisse potenti. Sed dictum quam vel nisl egestas, sit amet volutpat purus aliquet. Donec cursus sagittis sapien sit amet sollicitudin. Nam et velit id nulla pellentesque feugiat. Nulla facilisi. Curabitur hendrerit lectus ut mi luctus dignissim.'
        },
        {
            title: 'Another one',
            date: '10/1/2020',
            content: 'Maecenas mattis neque ac sodales commodo. Vivamus commodo massa vel purus pulvinar, sed mollis magna facilisis. Sed imperdiet ultricies iaculis. Suspendisse nec ultricies tortor, non gravida nisi. In nunc orci, viverra sit amet fermentum sed, laoreet at odio. Cras at vestibulum ex, sit amet mattis velit. In ullamcorper rutrum tortor. Quisque hendrerit eu elit vitae eleifend.'
        },
        {
            title: 'More stuff',
            date: '9/28/2020',
            content: 'Pellentesque ultrices lacus tortor, eu semper mauris imperdiet sed. Nullam pretium commodo purus, eu posuere nisl. Aliquam imperdiet gravida neque, et aliquet odio. Sed non sapien non sem hendrerit accumsan. Maecenas et felis urna. Praesent facilisis nunc nec venenatis faucibus. Donec quis lobortis libero. Donec vitae sollicitudin risus, nec venenatis est. Sed euismod est in sodales molestie.'
        },
    ]

    let postHTML = ''
    for (const post of posts) {
        postHTML += await (new StringRewriter(template)
                .on('.post-title', new ContentReplacer(post.title))
                .on('.post-date', new ContentReplacer(post.date))
                .on('.post-content', new ContentReplacer(post.content))).transform()
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
