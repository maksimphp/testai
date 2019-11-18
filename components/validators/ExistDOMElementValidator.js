const PageLoader = require('../PageLoader');
const Validator = require('./Validator');
const chalk = require('chalk');

module.exports = class ExistDOMElementValidator extends Validator {
    constructor(config = {}) {
        super(config);

        this.response = {
            failed: [],
            serverError: [],
        };

        this.selector = '';
        this.checkExist = true;

        if (config.hasOwnProperty('selector')) this.selector = config.selector;
        if (config.hasOwnProperty('checkExist')) this.checkExist = config.checkExist;
    }

    async validate() {
        const pageLoader = new PageLoader({
            links: this.links,
            onPageLoad: async (index, response, page, link) => {
                const status = response.status();
                if (status >= 500 && status <= 600) {
                    console.log(`Server error with code ${status} at: ${link}`);
                    if (!await this.tryRefresh(page, 200, 1000, 3)) {
                        console.log(`Failed!`);
                        this.response.serverError.push(link);
                        return false;
                    }
                    console.log('Ok!');
                }

                const elementsCount = await page.evaluate((selector) => {
                    return document.querySelectorAll(selector).length;
                }, this.selector);

                if (elementsCount === 0 && this.checkExist || elementsCount > 0 && !this.checkExist) {
                    this.response.failed.push(link);
                }
            }
        });

        await pageLoader.start();
        this.showInfo();

        return true;
    }

    async tryRefresh(page, expectedCode, timeout, refreshCount) {
        console.log('Wait for ' + timeout + ' ms');
        await page.waitFor(timeout);
        console.log('Reload page');
        const response = await page.reload();

        if (response.status() === expectedCode) {
            return true;
        }

        if (refreshCount > 0) {
            refreshCount--;
            return await this.tryRefresh(page, expectedCode, timeout, refreshCount);
        }

        return false;
    }
};