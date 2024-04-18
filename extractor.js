const puppeteer = require('puppeteer');
const fs = require('fs');

// Read settings from the JSON file
const settings = JSON.parse(fs.readFileSync('settings.json', 'utf8'));

// Function to generate random delay within a range
function getRandomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  // Navigate to the start URL
  await page.goto(settings.startUrl);

  let hasNextPage = true;

  while (hasNextPage) {
    // Extract URLs from the current page
    const urls = await page.evaluate((urlContainerSelector) => {
      const links = Array.from(document.querySelectorAll(urlContainerSelector + ' a'));
      return links.map(link => link.href);
    }, settings.urlContainerSelector);

    // Iterate over extracted URLs
    for (const url of urls) {
      // Add a random delay before opening the URL
      const openingDelay = getRandomDelay(settings.minOpeningDelay, settings.maxOpeningDelay);
      await page.waitForTimeout(openingDelay);

      // Navigate to the URL
      await page.goto(url);

      // Remove unwanted elements
      await page.evaluate((unwantedElementSelector) => {
        document.querySelectorAll(unwantedElementSelector).forEach(element => {
          element.remove();
        });
      }, settings.unwantedElementSelector);
      
      // Extract desired content
      const extractedContent = await page.evaluate((elementSelector) => {
        const element = document.querySelector(elementSelector);
        return element ? element.outerHTML : '';
      }, settings.elementSelector);

      // Save extracted content to a file
      const pageTitle = await page.title();
      const sanitizedTitle = pageTitle.replace(/[^\w\s]/gi, '_');
      let filename;
      if (settings.outputFormat === 'pdf') {
        filename = `${sanitizedTitle}.pdf`;
        await page.pdf({ path: filename, format: 'A4' });
      } else {
        filename = `${sanitizedTitle}.html`;
        fs.writeFileSync(filename, extractedContent);
      }
    }

    // Check if there is a next page
    if (settings.shouldBrowseNextPage) {
      hasNextPage = await page.evaluate((nextPageSelector) => {
        const nextButton = document.querySelector(nextPageSelector);
        if (nextButton && !nextButton.disabled) {
          nextButton.click();
          return true;
        }
        return false;
      }, settings.nextPageSelector);
      
      // Wait for navigation
      if (hasNextPage) {
        await page.waitForNavigation();
      }
      
      // Add a random delay before navigating to the next page
      const nextPageDelay = getRandomDelay(settings.minNextPageDelay, settings.maxNextPageDelay);
      await page.waitForTimeout(nextPageDelay);
    } else {
      hasNextPage = false; // Exit loop if browsing next page is not enabled
    }
  }

  await browser.close();
})();
