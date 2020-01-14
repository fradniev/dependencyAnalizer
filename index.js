const dependencyAnalizer = require("./dependencyAnalizer");
let page;
start = async() =>{
    page = await dependencyAnalizer.preparePuppeteer("facebook.com");
    let html = await dependencyAnalizer.searchHtmlWeb(page);
    console.log(dependencyAnalizer.contentLengthWeb(html));
    await dependencyAnalizer.closePuppeteer();
    dependencyAnalizer.readHtmlCsv().then((linksCsv)=>{
        console.log(linksCsv);
    });

}
start();