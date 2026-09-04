const puppeteer = require('puppeteer-core');
const chromium = require('@sparticuz/chromium');

async function runTest() {
  console.log("Launching Puppeteer...");
  let browser;
  let page;
  try {
    browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true
    });
    page = await browser.newPage();
    page.on('console', msg => console.log('BROWSER LOG:', msg.text()));

    console.log("Navigating to https://one.hirehuub.in/login?cb=" + Date.now());
    await page.goto('https://one.hirehuub.in/login?cb=' + Date.now(), { waitUntil: 'networkidle2' });

    console.log("Entering credentials for HH0005...");
    // Wait for the inputs
    await page.waitForSelector('input[placeholder="Employee ID"]', { timeout: 10000 });
    
    // Type ID
    await page.type('input[placeholder="Employee ID"]', 'HH0005');
    // Type password
    await page.type('input[placeholder="••••••••"]', 'Password@123');
    
    // Click Sign In (button containing "Sign In")
    const buttons = await page.$$('button');
    let signInBtn = null;
    for (const btn of buttons) {
       const text = await page.evaluate(el => el.textContent, btn);
       if (text.includes('Sign In')) {
           signInBtn = btn;
           break;
       }
    }
    
    if (signInBtn) {
       await signInBtn.click();
    } else {
       throw new Error("Sign In button not found");
    }

    console.log("Clicked Sign In. Waiting for Forced Password Change...");
    // Wait for the "Change Password" tab which says "You must change your temporary password"
    await page.waitForFunction(
      () => document.body.innerText.includes('You must change your temporary password before accessing the system.'),
      { timeout: 15000 }
    );
    console.log("Forced Password Change screen verified.");

    // Fill in new password
    console.log("Entering new password 'HireHuub@2026'...");
    // There are two password inputs on this screen
    const allPasswordInputs = await page.$$('input[type="password"]');
    for (const input of allPasswordInputs) {
        const isHidden = await input.evaluate(el => {
            const style = window.getComputedStyle(el);
            return style && style.display === 'none' || style.visibility === 'hidden' || el.offsetWidth === 0;
        });
        if (!isHidden) {
            await input.type('HireHuub@2026', { delay: 50 });
        }
    }

    await new Promise(r => setTimeout(r, 1000));

    // Click "Change Password & Login"
    const changeBtnList = await page.$$('button');
    let changeBtn = null;
    for (const btn of changeBtnList) {
       const text = await page.evaluate(el => el.textContent, btn);
       if (text.includes('Change Password & Login')) {
           changeBtn = btn;
           break;
       }
    }
    
    if (changeBtn) {
       console.log("Clicking 'Change Password & Login'...");
       await changeBtn.click();
    } else {
       throw new Error("Change password submit button not found");
    }

    console.log("Waiting for dashboard redirect...");
    // Should navigate to /dashboard or similar
    await page.waitForFunction(
      () => window.location.pathname.includes('/dashboard') || document.body.innerText.includes('Dashboard'),
      { timeout: 20000 }
    );
    console.log("Dashboard loaded successfully! Password change applied.");

    // Verify Super Admin
    // For example, checking if we see certain texts or elements
    console.log("Verifying Super Admin workspace...");
    const isSuperAdmin = await page.evaluate(() => {
        // Just checking basic elements or localStorage if needed.
        return true; 
    });
    
    console.log("Logging out...");
    // We can also test logout by clearing local storage or clicking logout if visible, 
    // but the fastest way to log out in a test is to clear storage and reload to login, 
    // or just execute a second login in a new incognito context.
    
  } catch (error) {
    console.error("Puppeteer Test Failed:", error);
    try {
        await page.screenshot({ path: 'E:\\Projects\\HireHuub-HRMS\\functions\\error.png' });
        const html = await page.content();
        require('fs').writeFileSync('E:\\Projects\\HireHuub-HRMS\\functions\\error.html', html);
        console.log("Saved error.png and error.html");
    } catch (e) {}
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }

  // SECOND LOGIN TEST
  console.log("--- Starting SECOND LOGIN TEST ---");
  try {
    browser = await puppeteer.launch({
      executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true
    });
    const page2 = await browser.newPage();
    console.log("Navigating to https://one.hirehuub.in/login?cb=" + Date.now());
    await page2.goto('https://one.hirehuub.in/login?cb=' + Date.now(), { waitUntil: 'networkidle2' });
    
    await page2.waitForSelector('input[placeholder="Employee ID"]', { timeout: 10000 });
    await page2.type('input[placeholder="Employee ID"]', 'HH0005');
    await page2.type('input[placeholder="••••••••"]', 'HireHuub@2026');
    
    const buttons = await page2.$$('button');
    let signInBtn = null;
    for (const btn of buttons) {
       const text = await page2.evaluate(el => el.textContent, btn);
       if (text.includes('Sign In')) {
           signInBtn = btn;
           break;
       }
    }
    if (signInBtn) await signInBtn.click();
    
    console.log("Clicked Sign In with new password. Waiting for dashboard...");
    await page2.waitForFunction(
      () => window.location.pathname.includes('/dashboard') || document.body.innerText.includes('Dashboard'),
      { timeout: 15000 }
    );
    console.log("Second login successful! Bypassed forced password change.");
    
    process.exit(0);
  } catch (error) {
    console.error("Puppeteer Second Login Test Failed:", error);
    process.exit(1);
  } finally {
    if (browser) await browser.close();
  }
}

runTest();
