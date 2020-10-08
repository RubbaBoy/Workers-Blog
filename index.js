const constants = require('./src/constants')
const postHandler = require('./src/post_handler')
const indexHandler = require('./src/index_handler')

const contentTypes = {'css': 'text/css', 'html': 'text/html', 'json': 'application/json', 'svg': 'image/svg+xml'}

addEventListener("fetch", async event => {
    event.respondWith(handleRequest(event.request))
})

async function handleRequest(request) {
    let url = new URL(request.url)
    if (isRedirect(url)) {
        return await handleRedirect(request, url)
    } else {
        return await handleModified(request, url)
    }
}

async function handleRedirect(request /*: Request */, url /*: URL */) {
    let extension = getExtension(url)
    const redirectUrl = constants.RAW_URL_PREFIX + constants.TEMPLATE_REPO + url.pathname
    request = new Request(request)

    if (contentTypes.hasOwnProperty(extension)) {
        let response = await fetch(redirectUrl, request)
        response = new Response(response.body, response)
        response.headers.set("Content-Type", contentTypes[extension])
        return response
    } else {
        return Response.redirect(redirectUrl, 301)
    }
}

let handles = [
    indexHandler.handleIndex,
    postHandler.handlePage
]

async function handleModified(request /*: Request */, url /*: URL */) {
    for (let i in handles) {
        let res = await handles[i](url)
        if (res !== null) {
            return res
        }
    }

    return new Response('Uh oh', {status: 400})
}

function getExtension(url /*: URL */) {
    return url.pathname.substring(url.pathname.lastIndexOf('.') + 1);
}

function isRedirect(url /*: URL */) {
    return url.pathname.includes('.')
}
