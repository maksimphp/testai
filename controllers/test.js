const path = require('path');
const chalk = require('chalk');
const SitemapParser = require("../components/SitemapParser");
const LinksTransformer = require("../components/LinksTransformer");
const RedirectValidator = require("../components/validators/RedirectValidator");
const ExistDOMElementValidator = require("../components/validators/ExistDOMElementValidator");

exports.index = function (req, res) {
    res.sendFile(path.resolve(__dirname, '../public/test.html'));
};

exports.testSitemapRedirects = async function (req, res) {
    req.setTimeout(0);

    const url = req.body['sitemap-url'];
    const links = await (new SitemapParser(url)).getLinks().catch(() => {
        console.log(chalk.red.bold('Invalid input data'));
        res.send('');
        return false;
    });

    if (!links) return false;

    const redirectValidator = new RedirectValidator({
        links: links,
        redirectLinks: links,
        expectedCode: 200
    });

    await redirectValidator.validate();
    res.send(redirectValidator.response);
};

exports.testSitemapLinksExist = async function (req, res) {
    const url = req.body['sitemap-url'];
    const links = await (new SitemapParser(url)).getLinks().catch(() => {
        console.log(chalk.red.bold('Invalid input data'));
        res.send('');
        return false;
    });

    if (!links) return false;

    const checkExist = !!req.body['check-exist'];
    let checkLinks = req.body['links'];

    checkLinks = checkLinks.split("\n");

    let occurrences = checkLinks.filter(checkLink => links.includes(checkLink.replace(/(\r\n|\n|\r)/gm, '')) !== checkExist);
    res.send({failed: occurrences});
};

exports.testRedirects = async function (req, res) {
    req.setTimeout(0);

    const required = ['protocol', 'redirect-from', 'redirect-to', 'expectedCode', 'sheet-data'];

    for (let prop in req.body) {
        if (required.includes(prop) && !req.body[prop]) {
            console.log(chalk.red.bold('Invalid input data'));
            res.send('');
            return false;
        }
    }

    const linksTransformer = new LinksTransformer({
        protocol: req.body['protocol'],
        prefix: req.body['url-prefix'],
        postfix: req.body['url-postfix'],
    });

    const sheetData = JSON.parse(req.body['sheet-data']);
    const expectedCode = parseInt(req.body['expected-code']);

    const colFrom = req.body['redirect-from'];
    const colTo = req.body['redirect-to'];

    let links = [];
    let redirectLinks = [];

    for (let i = 0; i < sheetData.length; i++) {
        links.push(sheetData[i][colFrom]);
        redirectLinks.push(sheetData[i][colTo]);
    }

    const redirectValidator = new RedirectValidator({
        links: links,
        redirectLinks: redirectLinks,
        linksTransformer: linksTransformer,
        expectedCode: expectedCode,
    });

    const validated = await redirectValidator.validate().catch(() => {
        console.log(chalk.red.bold('Invalid input data'));
        res.send('');
        return false;
    });

    if (!validated) return false;

    res.send(redirectValidator.response);
};

exports.testDomElementExist = async function (req, res) {
    req.setTimeout(0);

    let checkLinks = req.body['links'];
    const checkExist = !!req.body['check-exist'];
    const selector = req.body['selector'];

    const linksTransformer = new LinksTransformer({
        protocol: req.body['protocol'],
        prefix: req.body['url-prefix'],
        postfix: req.body['url-postfix'],
    });

    checkLinks = checkLinks.split("\n");
    checkLinks = checkLinks.map(link => link.replace(/(\r\n|\n|\r)/gm, ''));
    checkLinks = linksTransformer.transformArray(checkLinks);

    const existDOMElementValidator = new ExistDOMElementValidator({
        links: checkLinks,
        selector: selector,
        checkExist: checkExist
    });

    const validated = await existDOMElementValidator.validate().catch(() => {
        console.log(chalk.red.bold('Invalid input data'));
        res.send('');
        return false;
    });

    if (!validated) return false;

    res.send(existDOMElementValidator.response);
};
