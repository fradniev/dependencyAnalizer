'use strict'

const puppeteer = require('puppeteer');
const csv = require('csv-parser');
const fs = require('fs');

let browser;
let page;

const pathToCsv = "./websites.csv";

const readline = require('readline').createInterface({
    input: process.stdin,
    output: process.stdout
});

const DependencyAnalizer = {
    /**
     * 
     * ASYNC. Prepares and launches puppeteer to link provided.
     * Returns the page object.
     * Parameter: LinkToPage string. 
     */
    preparePuppeteer: async function(linkToPage){
        linkToPage = this.putHttpsToLink(linkToPage);
        browser = await puppeteer.launch();
        page = await browser.newPage();
        await page.setRequestInterception(true);
        await page.setViewport({width: 1280, height: 800});
        try {
            page.on('request', (req) => req.continue());
            await page.goto(linkToPage, {waitUntil: 'networkidle2'});
        } catch(e) {
            console.log(e);
        }
        return page;
    },
    /**
     * Closes Puppeteer.
     */
    closePuppeteer: async function(){
        await browser.close();
    },
    /**
     * ASYNC. Reads the Csv websites.csv in the base folder and returns a promise with the names and links.
     * The promise contains an array of objects: [...,{Name:name, Link:link}]
     */
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
    /**
     * 
     * ASYNC. Search and returns the page content as string.
     * Parameter: Page object from puppeteer.
     */
    searchHtmlWeb: async function(page) {
        const html = await page.content();
        return html;
    },

    /**
     * 
     * Returns the content length of an html string as bytes.
     * Parameter: Html string.
     */
    contentLengthWeb: function(html){
        return Buffer.byteLength(html, 'utf8');
    },
    /**
     * 
     * Returns the size of the file index.html.
     * Parameter: filepath string.
     */
    contentLengthLocal: function(filepath){
        let stats = fs.statSync(this.correctFilePath(filepath));
        return stats["size"];
    },
    /**
     * 
     * Returns the html string from the index.html saved on local.
     * Parameter: filepath string.
     */
    searchHtmlLocal: function(filepath) {
        return fs.readFileSync(this.correctFilePath(filepath), "utf8").toString();
    },
    /**
     * 
     * Corrects the filepath from the csv file, changing the ~ to ./sites.
     * Parameter: filepath string.
     */
    correctFilePath: function(filepath) {
        return filepath.replace("~","./sites").trim();
    },
    /**
     * 
     * Get all the scripts from the html using regex. Returns an array of strings.
     * Parameter: htmlContent string.
     */
    getScripts: function (htmlContent) {
        //Gets text from '<script' until '>'.
        const pattern = /<script(.*?)\>/g;
        let matchs = htmlContent.match(pattern);
        if (!matchs){
            throw new Error('Empty string');
        } else {
            return matchs;
        }
    },
    /**
     * 
     * Extracts the substring src="" from the scripts and ignores the rest.
     * Parameter: scriptString string.
     */
    getSrcString: function(scriptString){
        let srcString = scriptString.substring(scriptString.indexOf("src="));
        srcString = srcString.substring(0,srcString.indexOf('"',6));
        return srcString;
    },
    /**
     * 
     * Returns the js name of the dependency. If not js present returns empty.
     * Captures everything from the last "/" to ".js".
     * Parameter: srcString string.
     */
    getJsName: function(srcString){
        if(srcString.indexOf(".js")!=-1){
            let dependency = srcString.substring(srcString.lastIndexOf("/")+1,srcString.indexOf(".js")+3);
            return dependency;
        } else {
            return "";
        }
    },
    /**
     * 
     * Executes all the funtions to demonstrate how to use them and organize the data.
     * Returns Object with the frequency and origin of dependency and content length of site.
     * {dependenciesFrequency:{}, dependenciesOrigin:[], siteContentLength:{}}
     * Parameter: links array [...,{Name:name, Link:link}]
     */
    iterateLinks: async function(links){
        let results = {
            dependenciesFrequency : {},
            dependenciesOrigin : [],
            siteContentLength : {},
        }
        //Checks if the dependency is old or new.
        let dependenciesCheck = [];
        //Current dependency.
        let dependency = "";
        //Loop through all the links on the csv or just the one from the console input.
        for (let i = 0; i < links.length; i++) {
            let htmlContent = "";
            let contentLength = 0;
            //Checks if the link is local or to be used with puppeteer.
            if(links[i].Link.indexOf("http")!=-1){
                page = await this.preparePuppeteer(links[i].Link);
                htmlContent = await this.searchHtmlWeb(page);
                contentLength = this.contentLengthWeb(htmlContent);
            } else {
                htmlContent = this.searchHtmlLocal(links[i].Link);
                contentLength = this.contentLengthLocal(links[i].Link);
            }
            //Save the site content Length with the site name.
            results.siteContentLength[links[i].Name] = contentLength;
            try {
                //Get all scripts from the page.
                let scripts= this.getScripts(htmlContent);
                //Loop through all scripts.
                for (let j = 0; j < scripts.length; j++) {
                    //Checks if exist js to exclude from the search.
                    if(scripts[j].indexOf(".js")!=-1){
                        let srcString = this.getSrcString(scripts[j]);
                        dependency = this.getJsName(srcString);
                        //If dependency not empty and dependency is old the add 1 to frequency.
                        if(dependenciesCheck.includes(dependency) && dependency != ""){
                            results.dependenciesFrequency[dependency] += 1;
                        //If depency is new then add to frequency and check.
                        } else if(dependency != ""){
                            results.dependenciesFrequency[dependency] = 1;
                            let dependencyObject = {};
                            //Dependency is saved with the name of the site
                            dependencyObject[links[i].Name] = dependency;
                            results.dependenciesOrigin.push(dependencyObject);
                            dependenciesCheck.push(dependency);
                        }
                    }
                }
            } catch (error) {
                console.log(error)
            }
            //If the link was web then close puppeteer.
            if(links[i].Link.indexOf("http")!=-1){
                await this.closePuppeteer();
            }
        }
        return results;
    },
    /**
     * 
     * Inserts https protocol to links to be used with puppeteer.
     * Returns string.
     * Parameter: linkToPage string.
     */
    putHttpsToLink: function(linkToPage){
        if(linkToPage.indexOf("https") == -1 && linkToPage.indexOf("http") == -1){
            linkToPage = "https://"+linkToPage;
        }
        return linkToPage;
    },
    /**
     * Questions to search by csv or console input.
     */
    initialQuestions: function(){
        readline.question('Would you like to use a csv? Y/N: ', (responseCsv) => {
            if(responseCsv=="N" || responseCsv=="n"){
                readline.question('Then would you like to use a link? Y/N: ', (responseLink) => {
                    if(responseLink=="Y" || responseLink=="y"){
                        readline.question('Please provide the NAME of the site: ', (name) => {
                            readline.question('Please provide the Link of the site: ', async(link) => {
                                //If the link provide didn't have https then add it
                                link = this.putHttpsToLink(link);
                                let dependencies = await this.iterateLinks([{Name:name,Link:link}]);
                                console.log(dependencies);
                                readline.close()
                            });
                        });
                    } else if(responseLink=="N" || responseLink=="n"){
                        console.log("Then have a good day!");
                        readline.close()
                    } else {
                        this.initialQuestions();
                    }
                });
            } else if(responseCsv=="Y" || responseCsv=="y") {
                console.log("Ok, the program will read the csv in the base folder with the name of websites.csv");
                this.readHtmlCsv(pathToCsv).then(async(linksCsv)=>{
                    let dependencies = await this.iterateLinks(linksCsv);
                    console.log(dependencies);
                });
                readline.close()
            } else {
                this.initialQuestions();
            }
        })
    },

}
module.exports = DependencyAnalizer;