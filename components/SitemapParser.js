const puppeteer = require('puppeteer');
const chalk = require('chalk');

module.exports = class SitemapParser {
    constructor(url) {
        this.url = url;
        this.browser = undefined;
    }

    async load() {
        await this.dispose();
        this.browser = await puppeteer.launch({waitUntil: 'domcontentloaded', ignoreHTTPSErrors: true});
        const page = await this.browser.newPage();
        console.log(chalk.yellowBright.bold('Loading sitemap: ' + this.url));

        await page.goto(this.url);
        return page;
    }

    async getLinks() {
        const page = await this.load();
        console.log(chalk.yellowBright.bold('Parse links...'));
        const links = await page.evaluate(() => {
            let links = [];
            const urls = document.getElementsByTagName('urlset')[0].childNodes;
            for (let i = 0; i < urls.length; i++) {
                links.push(urls[i].getElementsByTagName('loc')[0].innerHTML);
            }

            return links;
        });

        console.log(chalk.yellowBright.bold('Successfully parsed ' + links.length + ' links'));
        await this.dispose();

        return links;
    }

    async dispose() {
        if (typeof this.browser !== "undefined") {
            await this.browser.close();
        }
    }
};
