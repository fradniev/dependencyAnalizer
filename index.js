const dependencyAnalizer = require("./dependencyAnalizer");
let page;
start = async() =>{
    let links;
    await dependencyAnalizer.readHtmlCsv().then(async(linksCsv)=>{
        let dependencies = await dependencyAnalizer.iterateLinks(linksCsv);
        console.log(dependencies);
    });
}
start();