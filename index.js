const dependencyAnalizer = require("./dependencyAnalizer");
let page;
start = async() =>{
    let links;
    await dependencyAnalizer.readHtmlCsv().then((linksCsv)=>{
        links = linksCsv;
    });
    page = await dependencyAnalizer.preparePuppeteer(links[2].Link);
    let htmlWeb = await dependencyAnalizer.searchHtmlWeb(page);
    let scriptWeb = dependencyAnalizer.getScripts(htmlWeb);
    let srcWeb = dependencyAnalizer.getSrcString(scriptWeb[0]);
    let dependencyWeb = dependencyAnalizer.getJsName(srcWeb);
    console.log(scriptWeb[0]);
    console.log(srcWeb);
    console.log(dependencyWeb);
    let htmlLocal = dependencyAnalizer.searchHtmlLocal(links[0].Link);
    let scriptLocal = dependencyAnalizer.getScripts(htmlLocal);
    let srcLocal = dependencyAnalizer.getSrcString(scriptLocal[0]);
    let dependencyLocal = dependencyAnalizer.getJsName(srcLocal);
    console.log(scriptLocal[0]);
    console.log(srcLocal);
    console.log(dependencyLocal);
    await dependencyAnalizer.closePuppeteer();
}
start();