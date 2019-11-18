const PageLoader = require('../PageLoader');
const Validator = require('./Validator');
const LinksTransformer = require('../LinksTransformer');
const chalk = require('chalk');

module.exports = class RedirectValidator extends Validator {
    constructor(config = {}) {
        super(config);

        this.redirectLinks = [];
        this.expectedCode = 301;

        /** @define LinksTransformer */
        this.linksTransformer = new LinksTransformer({
            enableTransform: false
        });

        this.response = {
            failed: [],
            skipped: [],
            unexpectedCode: [],
        };

        if (config.hasOwnProperty('redirectLinks')) this.redirectLinks = config.redirectLinks;
        if (config.hasOwnProperty('expectedCode')) this.expectedCode = config.expectedCode;
        if (config.hasOwnProperty('linksTransformer')) this.linksTransformer = config.linksTransformer;

        this.prepareLinks();
    }

    async validate() {
        const pageLoader = new PageLoader({
            links: this.links,
            onPageLoad: async (index, response, page, link) => {
                const expectRedirect = this.expectedCode >= 300 && this.expectedCode < 400;

                if (expectRedirect) {
                    const chain = response.request().redirectChain();
                    if (!chain.length || chain[0].response().status() !== this.expectedCode) {
                        this.response.unexpectedCode.push(link);
                    }
                } else if (response.status() !== this.expectedCode) {
                    this.response.unexpectedCode.push(link);
                }

                const href = await page.evaluate(() => {
                    return window.location.href;
                });

                if (href !== this.redirectLinks[index]) {
                    this.response.failed.push(link);
                }

            }
        });

        await pageLoader.start();
        this.showInfo();

        return true;
    }

    prepareLinks() {
        let processedLinks = [];
        let processedRedirectLinks = [];

        this.links.forEach((link, i) => {
            const transformedLink = this.linksTransformer.transform(link);
            const transformedRedirectLink = this.linksTransformer.transform(this.redirectLinks[i]);

            if (transformedLink && transformedRedirectLink) {
                processedLinks.push(transformedLink);
                processedRedirectLinks.push(transformedRedirectLink);
                return;
            }

            this.response.skipped.push(i + 1);
        });

        this.links = processedLinks;
        this.redirectLinks = processedRedirectLinks;
    }

    showInfo() {
        let infoTotal = [];

        for (let type in this.response) {
            infoTotal.push(`${type.toUpperCase()}: ${this.response[type].length}/${this.links.length}`);
        }

        console.log(chalk.yellowBright.bold(infoTotal.join(' | ')));
    }
};
