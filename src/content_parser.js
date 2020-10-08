let showdown = require('showdown')

class ParsedContent {
    constructor(title /*: string */, description /*: string */, date /*: string */, tags /*: string[] */, html /*: string */) {
        this.title = title ;
        this.description = description;
        this.date = date;
        this.tags = tags;
        this.html = html;
    }
}

function parsedContent(markdown /*: string */) /*: ParsedContent */ {
    let headerEndIndex = markdown.indexOf('```', 3)
    let header = markdown.substring(4, headerEndIndex)

    let headers = new Map()
    header.trim()
        .split('\n')
        .map(line => line.split(':', 2))
        .forEach(kv => headers.set(kv[0], kv[1]))

    return new ParsedContent(headers.get('title'),
        headers.get('description'),
        headers.get('date'),
        headers.get('tags').split(',').map(tag => tag.trim()),
        new showdown.Converter()
            .makeHtml(markdown.substr(headerEndIndex + 3)))
}

module.exports = {
    ParsedContent: ParsedContent,
    parseContent: parsedContent
}
