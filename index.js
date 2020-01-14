const dependencyAnalizer = require("./dependencyAnalizer");

start = async() =>{
    await dependencyAnalizer.preparePuppeteer("facebook.com");
    await dependencyAnalizer.closePuppeteer();
}
start();