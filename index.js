const dependencyAnalizer = require("./dependencyAnalizer");
let page;
start = async() =>{
    let links;
    await dependencyAnalizer.readHtmlCsv().then((linksCsv)=>{
        links = linksCsv;
    });
    page = await dependencyAnalizer.preparePuppeteer(links[2].Link);
    await dependencyAnalizer.closePuppeteer();
    let html = dependencyAnalizer.searchHtmlLocal(links[0].Link);
    console.log(dependencyAnalizer.contentLengthLocal(links[0].Link));

}
start();