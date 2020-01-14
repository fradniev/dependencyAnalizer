'use strict'

const puppeteer = require('puppeteer');
const csv = require('csv-parser');
const fs = require('fs');

let browser;
let page;

const pathToCsv = "./websites.csv";

const DependencyAnalizer = {
    preparePuppeteer: async function(linkToPage){
        if(linkToPage.indexOf("https") == -1 && linkToPage.indexOf("http") == -1){
            linkToPage = "https://"+linkToPage;
        }
        browser = await puppeteer.launch();
        page = await browser.newPage();
        await page.setRequestInterception(true);
        await page.setViewport({width: 1280, height: 800});
        try {
            page.on('request', (req) => req.continue());
            await page.goto(linkToPage, {waitUntil: 'networkidle2'});
            console.log(await page.title());
        } catch(e) {
            console.log(e);
        }
        return page;
    },
    closePuppeteer: async function(){
        await browser.close();
    },
    readHtmlCsv: async function() {
        let links = [];
        return new Promise((resolve,reject) => {
            fs.createReadStream(pathToCsv)
                .pipe(csv())
                .on('data', (data) => {
                    links.push(data);
                })
                .on('end', () => {
                    resolve(links);
                });
        });
    },
    searchHtmlWeb: async function(page) {
        const html = await page.content();
        return html;
    },
    contentLengthWeb: function(html){
        return Buffer.byteLength(html, 'utf8');
    },
    contentLengthLocal: function(filepath){
        let stats = fs.statSync(this.correctFilePath(filepath));
        return stats["size"];
    },
    searchHtmlLocal: function(filepath) {
        return fs.readFileSync(this.correctFilePath(filepath), "utf8").toString();
    },
    correctFilePath: function(filepath) {
        return filepath.replace("~","./sites").trim();
    },
}
module.exports = DependencyAnalizer;