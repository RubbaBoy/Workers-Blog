class CacheManager {
    constructor(event /*: FetchEvent */) {
        this.event = event
    }

    // uncachedResponse takes in a URL and returns a Promise of the Response
    async cache(uncachedResponse /*: Promise */, cacheTime = 30) /*: Response */ {
        const request = this.event.request
        const cacheKey = new Request(request.url, request)
        const cache = caches.default

        let response = await cache.match(cacheKey)

        if (!response) {
            console.log('Uncached!');
            response = await uncachedResponse(new URL(request.url))
            response = new Response(response.body, response)
            response.headers.append("Cache-Control", `max-age=${cacheTime}`)
            this.event.waitUntil(cache.put(cacheKey, response.clone()))
        } else {
            console.log('Cached!');
        }

        return response
    }

}

module.exports = {
    CacheManager: CacheManager
}
