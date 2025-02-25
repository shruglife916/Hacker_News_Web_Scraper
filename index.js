// EDIT THIS FILE TO COMPLETE ASSIGNMENT QUESTION 1
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

// Ensure necessary directories and files exist
// Defines file paths for logs, screenshots, and reports. 

const screenshotDir = "screenshots";
const logFile = "sorting_errors.log";
const csvFile = "sorting_errors.csv";
const reportFile = "report.html";

/*
Ensures files/directories exist: 
fs.existsSync(path) → Checks if a file or folder exists. 
fs.mkdirSync(path) → Creates a directory. 
fs.writeFileSync(file, content) → Creates a file if it doesn’t exist. 
*/
if (!fs.existsSync(screenshotDir)) fs.mkdirSync(screenshotDir);
if (!fs.existsSync(logFile)) fs.writeFileSync(logFile, ""); // Initialize log file
if (!fs.existsSync(csvFile)) fs.writeFileSync(csvFile, "Position,Actual Date,Expected Date\n"); // Initialize CSV file

// Function to generate a timestamped filename
function getTimestampedFilename() {
  // new Date() → Creates a Date object representing the current date & time. The now variable now holds the current timestamp.
  const now = new Date(); 
  /*
  Year	now.getFullYear()	Extracts 4-digit year	2025
  Month	now.getMonth() + 1	Returns 0-based month, so add +1	02 (for February)
  Day	now.getDate()	Gets the day of the month	23
  Hour	now.getHours()	Extracts hour (24-hour format)	14 (for 2:00 PM)
  Minutes	now.getMinutes()	Extracts minutes	30
  Seconds	now.getSeconds()	Extracts seconds	45
  getMonth() returns 0 for January, 1 for February, etc. Without formatting, January would display as 1 instead of 01.
  String(value).padStart(2, "0") → Converts value to a string and ensures it’s at least 2 digits. If the number is single-digit, it adds a 0 in front.

  String(9).padStart(2, "0");   
  String(11).padStart(2, "0");  
  */

  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}_`
  /*
   Dashes (-) separate date components → YYYY-MM-DD
   Underscore (_) separates date and time → YYYY-MM-DD_HH-MM-SS
   Dashes (-) separate time components → HH-MM-SS
  */
       + `${String(now.getHours()).padStart(2, "0")}-${String(now.getMinutes()).padStart(2, "0")}-${String(now.getSeconds()).padStart(2, "0")}`;
}
/*
async → Marks the function as asynchronous, allowing the use of await for handling promises.
function sortHackerNewsArticles() → Declares a named function.

*/
async function sortHackerNewsArticles() {
   /*
    A Promise in JavaScript is an object that represents the eventual completion (or failure) of an asynchronous operation. 
    It allows you to handle asynchronous code in a cleaner way without using deeply nested callbacks.
    Promises are asynchronous – They don’t block the execution of the rest of the code.
    A Promise has three states:
           pending → Initial state, operation is still in progress.
           fulfilled → Operation completed successfully.
           rejected → Operation failed.
    A Promise is immutable – Once resolved or rejected, it cannot be changed.

    Methods	.then() (on success), .catch() (on failure), .finally() (always runs)
    Better Alternative	Use async/await for better readability

   await is a keyword in JavaScript used inside an asynchronous function (async function). 
   It pauses the execution of the function until a Promise is resolved, then returns the resolved value.
   Each await statement waits for the previous task to complete before moving to the next.
   Without await, JavaScript wouldn’t wait, and the page might not load properly.
   In short, await makes handling asynchronous operations easier and cleaner!
   */


  // Launches a Chromium browser. headless: false → Opens a visible browser window (for debugging).
  // This ensures that Playwright runs without opening a browser window, making it suitable for servers.
  const browser = await chromium.launch({ headless: false });
  // Creates a new browsing context (like a fresh user session).
  const context = await browser.newContext();
  // Opens a new tab/page in the browser.
  const page = await context.newPage();

  // await page.goto(url) → Navigates to Hacker News "newest" page.
  await page.goto("https://news.ycombinator.com/newest");
  // await page.waitForSelector(".athing") Waits for the article elements (.athing class) to load.

  /*
  The .athing class is a CSS selector used to identify each individual article on the Hacker News "newest" page.
  What Does .athing Represent?
  On the Hacker News website, each news article is structured in the HTML like this:

   <tr class="athing" id="123456">
     <td> ... </td>
     <td class="title"><a href="article_link">Article Title</a></td>
   </tr>
   <tr>
     <td> ... </td>
      <td class="subtext">
    <span class="age" title="2025-02-23T12:34:56">1 hour ago</span>
   </td>
  </tr>

    Each article is in a <tr> (table row) element with the class .athing, making it a unique identifier for articles.
    This ensures that the page has fully loaded before we try to extract article data.

    If the articles haven’t loaded yet, the script might try to scrape non-existent elements, causing errors.
  */
  await page.waitForSelector(".athing");

  // Extract timestamps
  /*
     We use .athing because:  It uniquely identifies each article row on Hacker News.
     It allows us to locate the associated timestamp for sorting.
     It ensures our scraper waits until the articles are loaded, preventing errors.

     Selects all elements that match the given CSS selector (".athing").
     Executes the callback function on the selected elements.
     Returns the result of the callback function.
     Await is used because Playwright returns a Promise, meaning it waits for the elements to be selected before proceeding.
  */
  const articles = await page.$$eval(".athing", (elements) =>

    // Takes only the first 100 articles from the list. Loops over each selected article element (el).
    // Extracts the publication timestamp from the next row.
    elements.slice(0, 100).map(el => {
      //Each article row (.athing) is followed by a row with a timestamp. This line selects the next row, which contains the timestamp.
      const nextRow = el.nextElementSibling; //  Moves to the next <tr> row, where the timestamp (.age class) is stored
      // Extracts the publication time of each article
      // Finds the timestamp inside the next row (<span class="age">). If nextRow exists, find the timestamp element. If not, return null.
      const ageElement = nextRow ? nextRow.querySelector(".age") : null; 
      // Gets the timestamp value from the title attribute of <span class="age">. 
      // <span class="age" title="2025-02-23T12:34:56">1 hour ago</span> The extracted value would be "2025-02-23T12:34:56" (ISO 8601 format).
      // If ageElement exists, return the timestamp. Otherwise, return null
      return ageElement ? ageElement.getAttribute("title") : null;

      /*
         Final Output
           The articles array will contain timestamps (or null if missing):

             [
               "2025-02-23T12:34:56",
               "2025-02-23T12:30:12",
               "2025-02-23T12:25:45",
               ...
            ]
            This timestamp array is later converted into JavaScript Date objects for sorting.

      */
    })
  );

  // Convert timestamps to Date objects
  /*
  The articles array contains timestamps (e.g., "2025-02-23T12:34:56").
  .map(...) applies a function to each timestamp, converting it into a Date object.
  The resulting dates array now contains JavaScript Date objects.
  */
  const dates = articles.map(dateString => new Date(dateString));
  /*
  [...dates]: Creates a copy of the dates array to avoid modifying the original.
  .sort((a, b) => b - a):
  JavaScript's .sort() method sorts elements in place.
  (a, b) => b - a: Compares two dates numerically.
  Descending order (newest first).
  */
  const sortedDates = [...dates].sort((a, b) => b - a); // Newest first

  // Checking if the articles are already sorted
  /*
    Converts both arrays into JSON strings for comparison.
    If they match, the articles were already sorted correctly.
    If they differ, the articles are not in correct order.
  */
  if (JSON.stringify(dates) === JSON.stringify(sortedDates)) {
    console.log(" Articles are correctly sorted by time!");
  } else {
    console.log(" Articles are NOT sorted correctly!");

    // Generate timestamped screenshot filename
    // getTimestampedFilename(): Generates a timestamped filename for the screenshot.
    const timestamp = getTimestampedFilename();
    // path.join(...): Creates the full file path for the screenshot.
    const screenshotPath = path.join(screenshotDir, `sorting_error_${timestamp}.png`);

    console.log(`Capturing screenshot: ${screenshotPath}`);
    // Captures a full-page screenshot and saves it to screenshotPath.
    await page.screenshot({ path: screenshotPath, fullPage: true });

    console.log("Screenshot saved!");

    // Save mismatched articles in log and CSV
    // csvData and logData are initialized as empty strings.
    // The logData string starts with a timestamped header.
    let csvData = "";
    let logData = `Sorting Errors (${timestamp}):\n`;

    for (let i = 0; i < dates.length; i++) { // Loops through all extracted dates.
      // Compares each original date to the expected sorted date.
      // .getTime() converts Date objects into timestamps for accurate comparison.
      // If dates[i].getTime() is not equal to sortedDates[i].getTime(), it means the article is not in the correct position.
      if (dates[i].getTime() !== sortedDates[i].getTime()) {
        // Logs the issue to the console.
        console.log(`Position ${i + 1}: ${dates[i]} (should be ${sortedDates[i]})`);
         // Adds the error to csvData and logData.
        csvData += `${i + 1},${dates[i]},${sortedDates[i]}\n`;
        logData += `Position ${i + 1}: ${dates[i]} (should be ${sortedDates[i]})\n`;
      }
    }
     /*
     fs.appendFileSync(file, data):
         Appends csvData and logData to the corresponding files.
         This ensures sorting errors are persistently stored.
     */
    fs.appendFileSync(csvFile, csvData);
    fs.appendFileSync(logFile, logData);

    console.log(" Errors logged in sorting_errors.log and sorting_errors.csv");

    // Generate HTML report
    /*
    Calls generateReport(screenshotPath), which:
    Creates an HTML file summarizing the sorting failure.
    Embeds the captured screenshot and error logs.
    */
    generateReport(screenshotPath);
  }
  // Ensure the Playwright browser instance is properly closed after execution.
  await browser.close();
}

// Function to generate an HTML report
function generateReport(screenshotPath) {
  /*
  Creates a multi-line string (using backticks ` for template literals) that represents an HTML file.

  Dynamic Values Inserted Using ${}:

  ${screenshotPath} inserts the screenshot file path.
  ${csvFile} inserts the CSV log file path.
  ${logFile} inserts the text log file path.
  HTML Structure:

  <title>Sorting Validation Report</title> → Sets the title of the report page.
  <h1>Sorting Validation Report</h1> → Main heading.
  <p>Sorting Status: Failed</p> → Displays failure message.
  <img src="${screenshotPath}" alt="Sorting Error" width="600"/> → Displays the screenshot of the error.
  <p><a href="${csvFile}" download>Download CSV Log</a></p> → Provides a download link for the CSV log.
  <p><a href="${logFile}" download>Download Log File</a></p> → Provides a download link for the log file.
  */
  
  const reportContent = `
    <html>
      <head><title>Sorting Validation Report</title></head>
      <body>
        <h1>Sorting Validation Report</h1>
        <p>Sorting Status: Failed</p>
        <h2>Screenshot of the issue:</h2>
        <img src="${screenshotPath}" alt="Sorting Error" width="600"/>
        <h2>Download Sorting Errors:</h2>
        <p><a href="${csvFile}" download>Download CSV Log</a></p>
        <p><a href="${logFile}" download>Download Log File</a></p>
      </body>
    </html>`;
  /*
  Uses Node.js fs (File System) module to synchronously write reportContent to reportFile (the HTML file).
  writeFileSync ensures that the file is completely written before the script moves on.
  */
  fs.writeFileSync(reportFile, reportContent);
  // Prints a message to the console confirming that the report was saved.
  console.log(` Report saved as ${reportFile}`);

  // Calls openReport(filePath), which automatically opens the HTML report in the default web browser.
  openReport(reportFile);
}

// Function to open the report automatically
// Takes one parameter, filePath, which represents the path to the report file that needs to be opened.
function openReport(filePath) {
  /*
  process.platform is a built-in Node.js property that returns a string indicating the OS.
  The returned value can be:
  "darwin" → macOS
  "win32" → Windows
  "linux" → Linux (or Unix-based systems)
  */
  const platform = process.platform;
  // exec(command) is part of the Node.js child_process module. It runs system commands.
  // For MacOS, it uses the open command, which opens files and URLs in the default application.
  if (platform === "darwin") exec(`open ${filePath}`); 
  // For Windows, it uses the start command, which opens files in their default program.
  else if (platform === "win32") exec(`start ${filePath}`); 
  // For Linux, Uses xdg-open, a common Linux command to open files in the default application.
  else exec(`xdg-open ${filePath}`); 
}

// Function to schedule job every 30 minutes
function scheduleJob() {
  // Prints a message to the console to indicate that the scheduled job is active.
  console.log(" Running job every 30 minutes...");
  // setInterval(callback, delay) to automatically run a function at regular time intervals.
  // The callback function (async () => {}) executes asynchronously every 30 minutes.
  setInterval(async () => {
    // Displays a message every time the job runs.
    console.log(" Running scheduled job...");
    // Calls sortHackerNewsArticles() to check if Hacker News articles are sorted correctly.
    // Uses await because sortHackerNewsArticles is an async function (it involves web scraping).
    await sortHackerNewsArticles();
    /* 
      The delay is set to 30 * 60 * 1000 milliseconds.
       30 minutes × 60 seconds × 1000 ms = 1,800,000 ms (30 minutes)
      The function executes every 30 minutes.
    */
  }, 30 * 60 * 1000);
}

//  runs the sortHackerNewsArticles function once and then sets up a scheduled job to run it every 30 minutes.
/*
Defines an Immediately Invoked Function Expression (IIFE).
async keyword makes it an asynchronous function so we can use await inside it.
The function is wrapped in () and executed immediately.
*/
(async () => {
  /*
  Runs the sorting function immediately when the script starts.
  Uses await because sortHackerNewsArticles() is an asynchronous function (it scrapes the web).
  */
  await sortHackerNewsArticles();
  // Calls scheduleJob(), which sets up a recurring execution of sortHackerNewsArticles every 30 minutes.
  scheduleJob();
  // The () at the end immediately executes the function when the script runs.
})();

