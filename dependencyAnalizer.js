'use strict'

const puppeteer = require('puppeteer');
const csv = require('csv-parser');
const fs = require('fs');

let browser;
let page;

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
}
module.exports = DependencyAnalizer;