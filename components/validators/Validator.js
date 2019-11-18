const chalk = require('chalk');

module.exports = class Validator {
    constructor(config = {}) {
        this.response = {};
        this.links = [];

        if (config.hasOwnProperty('links')) {
            this.links = config.links;
        }
    }

    async validate() {
    };

    showInfo() {
        let infoTotal = [];

        for (let type in this.response) {
            infoTotal.push(`${type.toUpperCase()}: ${this.response[type].length}/${this.links.length}`);
        }

        console.log(chalk.yellowBright.bold(infoTotal.join(' | ')));
    }
};