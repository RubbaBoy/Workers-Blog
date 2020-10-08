module.exports = {
    handleIndex: handleIndex
}

async function handleIndex(url /*: URL */) {
    if (url.pathname !== '/') {
        return null;
    }

    return new Response('Index here', {headers: {'Content-Type': 'text/html'}})
}
