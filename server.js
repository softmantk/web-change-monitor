const express = require('express');
const bodyParser = require('body-parser');
const axios = require("axios");
const puppeteer = require('puppeteer');
const uuid = require("uuid").v4;
const path = require("path");
const { WebClient } = require('@slack/web-api');

//Express configuration
const app = express();
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.set('view engine', 'ejs');
const PORT = process.env.PORT || 5002;


//Main configuration variables
// const urlToCheck = `https://service2.diplo.de/rktermin/extern/choose_realmList.do?locationCode=newd&request_locale=en`;
const urlToCheck = `https://service2.diplo.de/rktermin/extern/choose_realmList.do?locationCode=banga&request_locale=en`;
const elementsToSearchFor = ['continue',];
const checkingFrequency = (5) * 60000; //first number represent the checkingFrequency in minutes
const SLACK_WEBHOOK_URL = 'https://hooks.slack.com/services/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';
const slack = require('slack-notify')(SLACK_WEBHOOK_URL);
const slackChannel = 'site-up'
const serverUrl = "http://localhost:3000"
const web = new WebClient(SLACK_WEBHOOK_URL);

const main = async function () {
    console.log("running...");
    try {
        const response = await axios.get(urlToCheck);
        console.log(":response.data", response.data);
        const found = elementsToSearchFor.some((el) => response.data.toLowerCase().includes(el.toLowerCase()));
        console.log("main:found", found);
        if (found) {
            try {
                const screenshotPath = await takeScreenshot(urlToCheck);
                const imageUrl = serverUrl + '/screenshots/' + screenshotPath
                const slackOptions = {
                    channel: slackChannel,
                    text: `🔥🔥🔥  <${urlToCheck}/|Change detected in ${urlToCheck}>  🔥🔥🔥 `,
                    attachments: [
                        {
                            fallback: 'AAA',
                            "image_url": imageUrl,
                            "fields": [
                                {
                                    "title": "URL",
                                    "value": imageUrl,
                                }
                            ]
                        }
                    ]
                }
                await slack.alert(slackOptions);
            } catch (e) {
                console.error("Error sending alert", e)
            }
        }
    } catch (e) {
        console.error('Error vising site...');
    }
}




const intervalId = setInterval(main, checkingFrequency);

async function takeScreenshot(url = urlToCheck) {
    const browser = await puppeteer.launch({headless: true});
    const page = await browser.newPage();
    await page.goto(url);
    const filename = uuid() + '.png';
    const folder = path.join(__dirname, 'public/screenshots')
    const filePath = path.join(folder, filename);
    console.log("takeScreenshot:filePath", filePath);
    await page.screenshot({path: filePath, fullPage: true});
    await browser.close();
    return filename;
}

async function slackUploadFile(fileName){
    try {
        // Call the files.upload method using the WebClient
        const result = await client.files.upload({
            // channels can be a list of one to many strings
            channels: slackChannel,
            initial_comment: "Here\'s my file :smile:",
            // Include your filename in a ReadStream here
            file: createReadStream(fileName)
        });

        console.log(result);
    }
    catch (error) {
        console.error(error);
    }
}


//Index page render
app.get('/', function (req, res) {
    res.render('index', null);
});


//Server start
app.listen(PORT, function () {
    console.log(`Example app listening on port ${PORT}!`);

});
