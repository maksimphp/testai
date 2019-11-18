const puppeteer = require('puppeteer');
const chalk = require('chalk');
const math = require('lodash/math');
const configCommon = require('../config/common');
const config = require('../config/link-checker');
const {performance} = require('perf_hooks');

module.exports = class PageLoader {
    constructor(config = {}) {
        this.links = config.links;

        this.progress = 0;
        this.estimatedTime = 0;
        this.timeValues = [];

        if (config.hasOwnProperty('onPageLoad') && typeof config.onPageLoad === "function") {
            this.onPageLoad = config.onPageLoad;
        }
    }

    async start() {
        const LINKS_COUNT = this.links.length;
        const BROWSER_TABS = configCommon.MAX_BROWSER_TABS;
        const PARTS = Math.ceil(LINKS_COUNT / BROWSER_TABS);

        console.log(chalk.yellowBright.bold('Start processing...'));

        const browser = await puppeteer.launch(config.PUPPETEER);

        let pages = [];
        let promises = [];

        for (let i = 0; i < BROWSER_TABS; i++) {
            pages.push(await browser.newPage());
        }

        for (let i = 0; i < LINKS_COUNT; i += BROWSER_TABS) {
            for (let j = 0; j < BROWSER_TABS && j + i < LINKS_COUNT; j++) {
                const link = this.links[i + j];

                promises.push(pages[j].goto(link, {waitUntil: 'domcontentloaded'}).then(async response => {
                    await this.onPageLoad(i + j, response, pages[j], link);
                }));
            }

            const t = [performance.now()];
            await Promise.all(promises);
            t.push(performance.now());

            this.timeValues.push((t[1] - t[0]) / 1000);
            this.estimatedTime = math.mean(this.timeValues) * (PARTS - Math.ceil(i / BROWSER_TABS));

            promises = [];

            this.updateProgress(i, LINKS_COUNT, true);
        }

        await browser.close();

        this.updateProgress(1, 1, true);
        this.showInfo();
    }

    async onPageLoad(index, response, page, link) {
    };

    updateProgress(num, from, log = false) {
        const next = Math.floor((num / from * 100));

        if (next === 100) {
            this.estimatedTime = 0;
        }

        if (log && next !== this.progress) {
            console.log("Estimated time: " + this.convertToHMS(this.estimatedTime) + " | Processed: " + next + "%");
        }

        this.progress = next;
    }

    convertToHMS(secondsValue) {
        const sec = parseInt(secondsValue, 10);

        let hours = Math.floor(sec / 3600);
        let minutes = Math.floor((sec - (hours * 3600)) / 60);
        let seconds = sec - (hours * 3600) - (minutes * 60);

        return [hours, minutes, seconds].map(num => num < 10 ? `0${num}` : num).join(':');
    }

    showInfo() {
        let info = `Elapsed: ${this.convertToHMS(math.sum(this.timeValues))}`;
        console.log(chalk.yellowBright.bold(info));
    }
};
