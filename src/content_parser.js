let showdown = require('showdown')

class ParsedContent {
    constructor(title /*: string */, description /*: string */, date /*: string */, tags /*: string[] */, html /*: string */) {
        this.title = title;
        this.description = description;
        this.date = date;
        this.tags = tags;
        this.html = html;
    }
}

// If contentUntil is null, it parses all content. If not, it parses until the given string.
function parsedContent(markdown /*: string */, {contentUntil /*: string */ = null, trimContent = true}) /*: ParsedContent */ {
    let headerEndIndex = markdown.indexOf('```', 3)
    let header = markdown.substring(4, headerEndIndex)

    let headers = new Map()
    header.trim()
        .split('\n')
        .map(line => line.split(':', 2))
        .forEach(kv => headers.set(kv[0], kv[1]))

    let content = markdown.substr(headerEndIndex + 3)
    if (contentUntil !== null) {
        let stopIndex = content.indexOf(contentUntil)
        if (stopIndex !== -1) {
            content = content.substr(0, stopIndex)
        }
    }

    if (trimContent) {
        content = content.trim()
    }

    return new ParsedContent(headers.get('title'),
        headers.get('description'),
        headers.get('date'),
        headers.get('tags').split(',').map(tag => tag.trim()),
        content ? new showdown.Converter()
            .makeHtml(content) : null)
}

module.exports = {
    ParsedContent: ParsedContent,
    parseContent: parsedContent
}
