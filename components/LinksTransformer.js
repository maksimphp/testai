module.exports = class LinksTransformer {
    constructor(config = {}) {
        this.enableTransform = true;
        this.protocol = 'https';
        this.prefix = '';
        this.postfix = '';

        if (config.hasOwnProperty('protocol')) this.protocol = config.protocol;
        if (config.hasOwnProperty('prefix')) this.prefix = config.prefix;
        if (config.hasOwnProperty('postfix')) this.postfix = config.postfix;
    }

    transformArray(links) {
        return links.map((link) => this.transform(link));
    }

    transform(string) {
        const link = this.parseLink(string);

        if (!this.enableTransform || !link) {
            return link;
        }

        const newLink = new URL(link);
        newLink.protocol = this.protocol;
        newLink.host = this.prefix + newLink.host + this.postfix;

        return newLink.href;
    }

    parseLink(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const match = text.match(urlRegex);

        return match ? match[0] : '';
    }
};
