const { chromium } = require('playwright');

/**
 * Generate a random delay between min and max milliseconds
 * @param {number} min - Minimum delay in milliseconds
 * @param {number} max - Maximum delay in milliseconds
 * @returns {number} - Random delay duration
 */
function randomDelay(min = 1000, max = 5000) {
  return Math.floor(Math.random() * (max - min) + min);
}

/**
 * Sleep for the specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} - Promise that resolves after the delay
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Human-like typing with variable speed
 * @param {Object} page - Playwright page object
 * @param {string} selector - Element selector to type into
 * @param {string} text - Text to type
 */
async function humanTyping(page, selector, text) {
  await page.focus(selector);
  
  // Clear any existing text first
  await page.fill(selector, '');
  
  // Type each character with variable delay
  for (const char of text) {
    await page.type(selector, char, { delay: randomDelay(50, 250) });
    
    // Occasionally pause while typing, as humans do
    if (Math.random() < 0.1) {
      await sleep(randomDelay(500, 2000));
    }
  }
  
  // Sometimes people review what they typed
  if (Math.random() < 0.3) {
    await sleep(randomDelay(1000, 3000));
  }
}

/**
 * Human-like mouse movement and clicking
 * @param {Object} page - Playwright page object
 * @param {string} selector - Element selector to click
 */
async function humanClick(page, selector) {
  // Wait for element to be visible
  await page.waitForSelector(selector, { state: 'visible' });
  
  // Get element position
  const elementHandle = await page.$(selector);
  const boundingBox = await elementHandle.boundingBox();
  
  // Move to element with a slightly indirect path (more human-like)
  const startPoint = {
    x: boundingBox.x + boundingBox.width / 2 + (Math.random() * 100 - 50),
    y: boundingBox.y + boundingBox.height / 2 + (Math.random() * 100 - 50)
  };
  
  // Move to approximate position first, then to exact target
  await page.mouse.move(startPoint.x, startPoint.y, { steps: 10 });
  await sleep(randomDelay(100, 500));
  
  // Move to actual element and click
  await page.mouse.move(
    boundingBox.x + boundingBox.width / 2 + (Math.random() * 10 - 5),
    boundingBox.y + boundingBox.height / 2 + (Math.random() * 10 - 5),
    { steps: 10 }
  );
  
  // Pause before clicking
  await sleep(randomDelay(200, 600));
  
  // Click with random delay
  await page.click(selector, { delay: randomDelay(50, 150) });
  
  // Pause after clicking before next action
  await sleep(randomDelay(500, 2000));
}

/**
 * Automated script to post items for sale on Craigslist with human-like behavior
 * @param {Object} itemDetails - Details of the item to be listed
 */
async function postToCraigslist(itemDetails) {
  // Launch the browser in non-headless mode so you can see what's happening
  const browser = await chromium.launch({
    headless: false,
    slowMo: 0 // We'll handle our own delays
  });

  // Set a viewport size similar to a typical user
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.110 Safari/537.36'
  });
  
  const page = await context.newPage();

  try {
    // Navigate to Craigslist
    console.log('Navigating to Craigslist...');
    await page.goto('https://craigslist.org');
    await sleep(randomDelay(2000, 5000));

    // Select your location or use the nearest one if already selected
    console.log('Selecting location...');
    await humanClick(page, '.nearby');

    // Simulate looking at the page before proceeding
    await sleep(randomDelay(3000, 8000));

    // Click on "create a posting" button
    console.log('Creating a new posting...');
    await humanClick(page, 'a:has-text("create a posting")');

    // Select "for sale by owner" category
    await sleep(randomDelay(1000, 3000));
    await humanClick(page, 'input[name="id"][value="fso"]');

    // Select the appropriate category for your item
    console.log('Selecting category...');
    await sleep(randomDelay(2000, 4000));
    await humanClick(page, `a:has-text("${itemDetails.category}")`);

    // Fill the posting form
    console.log('Filling out the posting form...');
    await sleep(randomDelay(2000, 5000));
    
    // Post title
    await humanTyping(page, 'input#PostingTitle', itemDetails.title);
    
    // Price - add a short pause as if thinking about price
    await sleep(randomDelay(1000, 3000));
    await humanTyping(page, 'input.price', itemDetails.price.toString());
    
    // Postal code
    await sleep(randomDelay(500, 2000));
    await humanTyping(page, 'input#postal_code', itemDetails.postalCode);
    
    // Description - longer pause as if composing the description
    await sleep(randomDelay(2000, 5000));
    await humanTyping(page, 'textarea#PostingBody', itemDetails.description);
    
    // Location information
    await sleep(randomDelay(1000, 2500));
    await humanTyping(page, 'input#geographic_area', itemDetails.location);
    
    // If you have specific neighborhoods to select
    if (itemDetails.neighborhood) {
      await sleep(randomDelay(1000, 2000));
      await page.selectOption('select#ui-id-1-area', itemDetails.neighborhood);
      await sleep(randomDelay(500, 1500));
    }

    // Pause as if reviewing the form before continuing
    await sleep(randomDelay(3000, 8000));

    // Click "continue" to proceed to next screen
    await humanClick(page, 'button.continue.bigbutton');

    // Handle image uploads if provided
    if (itemDetails.images && itemDetails.images.length > 0) {
      console.log('Uploading images...');
      await sleep(randomDelay(2000, 5000));
      
      // Wait for the image upload area to be visible
      await page.waitForSelector('input[type="file"]');
      
      // Upload multiple images
      const fileChooserPromise = page.waitForEvent('filechooser');
      await humanClick(page, 'a:has-text("Add images")');
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(itemDetails.images);
      
      // Wait for uploads to complete with random pauses to check progress
      await page.waitForSelector('.done');
      console.log('Waiting for image uploads to complete...');
      
      // Simulate checking on upload progress
      for (let i = 0; i < 3; i++) {
        await sleep(randomDelay(2000, 5000));
        console.log('Still uploading images...');
      }
      
      // Click "done with images" after uploads complete
      await sleep(randomDelay(1000, 3000));
      await humanClick(page, 'button:has-text("done with images")');
    }

    // Final location verification screen - just continue
    await sleep(randomDelay(2000, 4000));
    await humanClick(page, 'button.continue.bigbutton');

    // Pause as if reviewing the final posting
    await sleep(randomDelay(4000, 10000));

    // Final review screen
    console.log('Reviewing posting...');
    await humanClick(page, 'button.continue.bigbutton');

    // Handle email verification if needed (first-time users)
    if (await page.isVisible('input[type="email"]')) {
      console.log('Email verification required...');
      await sleep(randomDelay(1500, 3000));
      await humanTyping(page, 'input[type="email"]', itemDetails.email);
      await sleep(randomDelay(1000, 2000));
      await humanClick(page, 'button.continue.bigbutton');
    }

    // Wait for the success page
    await page.waitForSelector('h2:has-text("your posting")');
    console.log('Posting successful!');

    // Pause to simulate reading the confirmation page
    await sleep(randomDelay(3000, 6000));

    // Optional: take a screenshot of the confirmation page
    await page.screenshot({ path: 'craigslist-confirmation.png' });

  } catch (error) {
    console.error('An error occurred:', error);
    await page.screenshot({ path: 'error-screenshot.png' });
  } finally {
    // Close browser only if specified
    if (itemDetails.closeBrowser) {
      console.log('Closing browser...');
      await sleep(randomDelay(2000, 5000));
      await browser.close();
    } else {
      console.log('Browser left open as requested. You will need to close it manually.');
    }
  }
}

// Example usage:
(async () => {
  const itemDetails = {
    title: "Vintage Mid-Century Desk Chair",
    price: 85,
    category: "furniture - by owner",
    postalCode: "12345",
    location: "Downtown",
    neighborhood: "central", // optional
    description: `Vintage mid-century desk chair in excellent condition.
    
- Solid wood frame with original finish
- New high-quality upholstery
- Adjustable height
- Swivel function works smoothly
- Dimensions: 24"W x 26"D x 32-36"H
    
No damage or repairs. Non-smoking home. Cash only, local pickup.
Contact me with questions.`,
    images: [
      "/path/to/image1.jpg",
      "/path/to/image2.jpg",
      "/path/to/image3.jpg"
    ],
    email: "your-email@example.com",
    closeBrowser: false // Set to true if you want the browser to close automatically
  };

  await postToCraigslist(itemDetails);
})();
