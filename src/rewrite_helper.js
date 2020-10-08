module.exports = {
    ContentReplacer: ContentReplacer
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
