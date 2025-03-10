const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Interface for command line input
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to prompt for input
const prompt = (question) => new Promise((resolve) => {
  rl.question(question, (answer) => resolve(answer));
});

// Function to generate random delay between minMs and maxMs
function randomDelay(minMs = 500, maxMs = 3000) {
  return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
}

// Human-like delay function
async function humanDelay(page, minMs = 500, maxMs = 3000) {
  const delay = randomDelay(minMs, maxMs);
  console.log(`Waiting for ${(delay / 1000).toFixed(1)} seconds...`);
  await page.waitForTimeout(delay);
}

// Human-like typing function
async function humanType(page, selector, text, minDelayMs = 50, maxDelayMs = 200) {
  await page.focus(selector);
  
  // Clear any existing text first
  await page.fill(selector, '');
  
  // Type each character with random delay
  for (const char of text) {
    await page.type(selector, char, { delay: randomDelay(minDelayMs, maxDelayMs) });
    
    // Occasionally pause while typing like a human would
    if (Math.random() < 0.1) {
      await humanDelay(page, 200, 800);
    }
  }
}

// Random mouse movements
async function randomMouseMovements(page, count = 3) {
  console.log('Moving mouse randomly...');
  const viewport = page.viewportSize();
  
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * viewport.width * 0.8) + viewport.width * 0.1;
    const y = Math.floor(Math.random() * viewport.height * 0.8) + viewport.height * 0.1;
    await page.mouse.move(x, y);
    await page.waitForTimeout(randomDelay(100, 500));
  }
}

// Main function to post items on Nextdoor
async function postItemOnNextdoor(itemDetails) {
  console.log('Starting Nextdoor posting automation...');
  
  // Launch the browser in non-headless mode
  const browser = await chromium.launch({
    headless: false,
    slowMo: randomDelay(50, 150) // Random slow down for base actions
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
  });
  
  // Add some randomness to the viewport size to look more human
  const viewportWidth = 1280 + Math.floor(Math.random() * 200);
  const viewportHeight = 800 + Math.floor(Math.random() * 100);
  await context.setViewportSize({ width: viewportWidth, height: viewportHeight });
  
  const page = await context.newPage();
  
  try {
    // Navigate to Nextdoor
    console.log('Navigating to Nextdoor...');
    await page.goto('https://nextdoor.com/login');
    
    // Random delay after page load
    await humanDelay(page, 2000, 5000);
    
    // Random mouse movements before login
    await randomMouseMovements(page);
    
    // Check if we need to log in
    if (await page.isVisible('input[name="email"]')) {
      console.log('Login page detected. Logging in...');
      
      // Enter email with human-like typing
      await humanType(page, 'input[name="email"]', itemDetails.email);
      
      // Wait like a human would after typing email
      await humanDelay(page, 800, 2000);
      
      // Click continue with random delay before clicking
      await humanDelay(page, 500, 1500);
      await page.click('button[type="submit"]');
      
      // Wait for password field with random delay
      await humanDelay(page, 2000, 4000);
      await page.waitForSelector('input[name="password"]', { timeout: 60000 });
      
      // Enter password with human-like typing
      await humanType(page, 'input[name="password"]', itemDetails.password);
      
      // Random delay before submitting
      await humanDelay(page, 1000, 3000);
      
      // Random mouse movement before clicking
      await randomMouseMovements(page);
      
      // Click sign in
      await page.click('button[type="submit"]');
      
      // Wait for successful login with longer delay
      console.log('Waiting for login to complete...');
      await page.waitForNavigation({ timeout: 60000 });
      await humanDelay(page, 3000, 7000);
    } else {
      console.log('Already logged in or login form not found.');
    }
    
    // Wait for page to load completely
    await page.waitForLoadState('networkidle');
    await humanDelay(page, 2000, 5000);
    
    // Random scrolling to simulate reading
    console.log('Scrolling page randomly...');
    await page.evaluate(() => {
      window.scrollTo(0, Math.floor(Math.random() * 500));
    });
    await humanDelay(page, 1000, 3000);
    
    // Navigate to the "For Sale & Free" section
    console.log('Navigating to the For Sale section...');
    await page.goto('https://nextdoor.com/for_sale_and_free/');
    
    // Wait for page to load with random delay
    await page.waitForLoadState('networkidle');
    await humanDelay(page, 2000, 6000);
    
    // Random scroll
    await page.evaluate(() => {
      window.scrollTo(0, Math.floor(Math.random() * 700));
    });
    await humanDelay(page, 1000, 3000);
    
    // Click on the "Post" or "Sell" button
    console.log('Looking for Post/Sell button...');
    
    // Random mouse movements before clicking important button
    await randomMouseMovements(page, 5);
    
    // Try different selectors for the post button (might change with site updates)
    const postSelectors = [
      'button:has-text("Post")',
      'button:has-text("Sell")',
      'a:has-text("Sell something")',
      '[data-testid="compose-button"]'
    ];
    
    for (const selector of postSelectors) {
      if (await page.isVisible(selector)) {
        console.log(`Found post button with selector: ${selector}`);
        await humanDelay(page, 800, 2500);
        await page.click(selector);
        break;
      }
    }
    
    // Wait for the listing form to appear with random delay
    console.log('Waiting for listing form...');
    await humanDelay(page, 2000, 5000);
    await page.waitForSelector('input[placeholder="What are you selling?"], input[name="title"]', { timeout: 60000 });
    
    // Random delay before starting to fill form
    await humanDelay(page, 1500, 4000);
    
    // Fill in the item title with human typing
    console.log('Filling in item details...');
    await humanType(page, 'input[placeholder="What are you selling?"], input[name="title"]', itemDetails.title);
    
    // Random delay between form fields
    await humanDelay(page, 1000, 3000);
    
    // Fill in the price with human typing
    const priceSelector = 'input[placeholder="Price"], input[name="price"]';
    await page.waitForSelector(priceSelector);
    await humanType(page, priceSelector, itemDetails.price.toString());
    
    // Random delay before description
    await humanDelay(page, 1500, 4000);
    
    // Fill in the description with human typing (longer delays for thoughtful writing)
    const descriptionSelector = 'textarea[placeholder="Describe your item"], textarea[name="description"]';
    await humanType(page, descriptionSelector, itemDetails.description, 80, 250);
    
    // Random delay after writing description
    await humanDelay(page, 2000, 5000);
    
    // Random mouse movements
    await randomMouseMovements(page);
    
    // Select category if needed
    if (await page.isVisible('button:has-text("Select category"), select[name="category"]')) {
      await humanDelay(page, 1000, 2500);
      await page.click('button:has-text("Select category"), select[name="category"]');
      // Wait for dropdown with random delay
      await humanDelay(page, 1000, 2500);
      // Select category from dropdown
      await page.click(`text="${itemDetails.category}"`);
      await humanDelay(page, 800, 2000);
    }
    
    // Upload photos if provided
    if (itemDetails.photosPaths && itemDetails.photosPaths.length > 0) {
      console.log('Uploading photos...');
      
      // Find the file input element
      const fileInputSelector = 'input[type="file"]';
      await page.waitForSelector(fileInputSelector, { state: 'attached' });
      
      // Upload each photo with delays between uploads
      for (const photoPath of itemDetails.photosPaths) {
        if (fs.existsSync(photoPath)) {
          await humanDelay(page, 1500, 4000);
          await page.setInputFiles(fileInputSelector, photoPath);
          // Wait for upload with variation
          await humanDelay(page, 3000, 8000);
        } else {
          console.warn(`Photo not found: ${photoPath}`);
        }
      }
    }
    
    // Set location if needed
    if (itemDetails.location && await page.isVisible('input[placeholder="Location"], input[name="location"]')) {
      await humanDelay(page, 1000, 3000);
      await humanType(page, 'input[placeholder="Location"], input[name="location"]', itemDetails.location);
      await humanDelay(page, 1000, 2000);
    }
    
    // Human-like review pause (longer)
    console.log('Form filled. Taking time to review...');
    await humanDelay(page, 5000, 10000);
    
    // Random scroll to review form
    await page.evaluate(() => {
      window.scrollTo(0, Math.floor(Math.random() * 300));
    });
    await humanDelay(page, 2000, 4000);
    
    // Wait to review the form before submission
    console.log('Form filled. Ready for submission...');
    
    // Ask for confirmation before submitting
    const confirmSubmit = await prompt('Review the form. Press Enter to submit or type "cancel" to abort: ');
    
    if (confirmSubmit.toLowerCase() === 'cancel') {
      console.log('Submission cancelled by user.');
    } else {
      // Random delay before final submission
      await humanDelay(page, 2000, 5000);
      
      // Random mouse movements before important click
      await randomMouseMovements(page, 4);
      
      // Click the submit/post button
      const submitSelectors = [
        'button:has-text("Post")',
        'button:has-text("Submit")',
        'button[type="submit"]',
        'button:has-text("List item")'
      ];
      
      for (const selector of submitSelectors) {
        if (await page.isVisible(selector)) {
          console.log(`Found submit button with selector: ${selector}`);
          await humanDelay(page, 1000, 3000);
          await page.click(selector);
          break;
        }
      }
      
      // Wait for confirmation of successful posting with longer wait time
      console.log('Waiting for confirmation...');
      await humanDelay(page, 5000, 12000);
      
      // Take a screenshot of the result
      await page.screenshot({ path: 'nextdoor-post-result.png' });
      console.log('Screenshot saved as nextdoor-post-result.png');
    }
    
    // Optional: Wait for user to review the result
    await prompt('Press Enter to close the browser when finished: ');
    
  } catch (error) {
    console.error('An error occurred:', error);
    // Take screenshot on error
    await page.screenshot({ path: 'nextdoor-error.png' });
    console.log('Error screenshot saved as nextdoor-error.png');
  } finally {
    // Close the readline interface
    rl.close();
    
    // Close the browser
    await browser.close();
    console.log('Browser closed. Operation complete.');
  }
}

// Example usage
async function main() {
  console.log('Nextdoor Item Listing Automation');
  console.log('================================');
  
  const email = await prompt('Enter your Nextdoor email: ');
  const password = await prompt('Enter your Nextdoor password: ');
  const title = await prompt('Enter item title: ');
  const price = await prompt('Enter price (numbers only): ');
  const description = await prompt('Enter item description: ');
  const category = await prompt('Enter category (e.g., Furniture, Electronics): ');
  const location = await prompt('Enter pickup location (optional): ');
  
  const photosInput = await prompt('Enter photo file paths (comma-separated, optional): ');
  const photosPaths = photosInput ? photosInput.split(',').map(p => p.trim()) : [];
  
  const itemDetails = {
    email,
    password,
    title,
    price,
    description,
    category,
    location,
    photosPaths
  };
  
  await postItemOnNextdoor(itemDetails);
}

// Run the program
main().catch(console.error);
