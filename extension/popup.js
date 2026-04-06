// popup.js
const apiUrlInput = document.getElementById('apiUrl');
const pageNameInput = document.getElementById('pageName');
const captureBtn = document.getElementById('captureBtn');
const openDashboardBtn = document.getElementById('openDashboard');
const statusDiv = document.getElementById('status');
const listingCountDiv = document.getElementById('listingCount');
const countSpan = document.getElementById('count');

// Load saved settings
chrome.storage.sync.get(['apiUrl', 'pageName'], (result) => {
  if (result.apiUrl) apiUrlInput.value = result.apiUrl;
  if (result.pageName) pageNameInput.value = result.pageName;
});

// Save settings on change
apiUrlInput.addEventListener('change', () => {
  chrome.storage.sync.set({ apiUrl: apiUrlInput.value });
});
pageNameInput.addEventListener('change', () => {
  chrome.storage.sync.set({ pageName: pageNameInput.value });
});

// Get current tab
async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Show status
function showStatus(message, type) {
  statusDiv.className = 'status ' + type;
  statusDiv.textContent = message;
  statusDiv.style.display = 'block';
}

// Capture button
captureBtn.addEventListener('click', async () => {
  const apiUrl = apiUrlInput.value.replace(/\/+$/, '');
  if (!apiUrl) {
    showStatus('Please enter your API URL', 'error');
    return;
  }

  captureBtn.disabled = true;
  captureBtn.textContent = 'Capturing...';
  showStatus('Injecting content script...', 'info');

  const tab = await getCurrentTab();
  const url = tab.url;
  const pageName = pageNameInput.value || url;

  try {
    // Execute content script in the current tab
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: extractListings,
    });

    const listings = results[0]?.result || [];
    countSpan.textContent = listings.length;
    listingCountDiv.style.display = 'block';

    if (listings.length === 0) {
      showStatus('No listings detected. Try scrolling the page first.', 'info');
      captureBtn.disabled = false;
      captureBtn.textContent = 'Capture Listings';
      return;
    }

    showStatus('Sending data to server...', 'info');

    // Send to API
    const response = await fetch(apiUrl + '/api/capture', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url,
        listings,
        name: pageName,
      }),
    });

    const contentType = response.headers.get('content-type') || '';
    if (!response.ok) {
      const text = await response.text();
      if (contentType.includes('text/html')) {
        throw new Error('Server error ' + response.status + '. Check that DATABASE_URL is set in Vercel.');
      }
      try {
        const errData = JSON.parse(text);
        throw new Error(errData.error || 'Server returned ' + response.status);
      } catch (e) {
        throw new Error('Server returned ' + response.status + ': ' + text.substring(0, 100));
      }
    }

    let data;
    if (contentType.includes('application/json')) {
      data = await response.json();
    } else {
      const text = await response.text();
      throw new Error('Server returned non-JSON response (' + response.status + '): ' + text.substring(0, 200));
    }

    if (data.summary) {
      showStatus('OK: ' + (data.summary.text || 'Capture successful!'), 'success');
    } else {
      showStatus('OK: Capture successful! First baseline established.', 'success');
    }
  } catch (error) {
    showStatus('ERROR: ' + error.message, 'error');
  } finally {
    captureBtn.disabled = false;
    captureBtn.textContent = 'Capture Listings';
  }
});

// Open dashboard
openDashboardBtn.addEventListener('click', () => {
  const apiUrl = apiUrlInput.value.replace(/\/+$/, '');
  if (apiUrl) {
    chrome.tabs.create({ url: apiUrl });
  } else {
    showStatus('Please set your API URL first', 'error');
  }
});

// Listing extraction function (injected into page)
function extractListings() {
  const listings = [];
  
  // Look for common yacht listing patterns
  const selectors = [
    // YachtWorld
    '.listing-card', '.boat-listing', '.search-result', '.listing-item',
    // Boat24
    '[class*="listing"]', '[class*="boat-card"]', '[class*="boat-item"]',
    // Generic
    'article', '.card', '.listing', '.product',
  ];

  // Try each selector
  for (const selector of selectors) {
    const elements = document.querySelectorAll(selector);
    if (elements.length > 2) {
      elements.forEach((el) => {
        const listing = {};
        
        // Try to extract title
        const titleEl = el.querySelector('h2, h3, .title, [class*="title"], [class*="name"]');
        listing.title = titleEl?.textContent?.trim() || '';
        
        // Try to extract price
        const priceEl = el.querySelector('.price, [class*="price"], [class*="cost"]');
        listing.price = priceEl?.textContent?.trim() || '';
        
        // Try to extract size
        const sizeText = el.textContent.match(/(\d+\s*(ft|m|meter|feet))/i);
        listing.size = sizeText ? sizeText[0] : '';
        
        // Try to extract year
        const yearMatch = el.textContent.match(/\b(19|20)\d{2}\b/);
        listing.year = yearMatch ? yearMatch[0] : '';
        
        // Try to extract location
        const locationEl = el.querySelector('.location, [class*="location"], [class*="city"]');
        listing.location = locationEl?.textContent?.trim() || '';
        
        // Try to extract link
        const linkEl = el.querySelector('a[href]');
        listing.url = linkEl?.href || '';
        
        // Generate ID from title+url
        listing.id = listing.title.substring(0, 50) + '_' + (listing.url || '').substring(0, 50);
        
        // Only add if we got some data
        if (listing.title || listing.price || listing.url) {
          listings.push(listing);
        }
      });
      
      // If we found listings, stop trying
      if (listings.length > 0) break;
    }
  }

  // Fallback: try to find any structured content that looks like listings
  if (listings.length === 0) {
    // Look for elements containing price-like patterns
    const allElements = document.querySelectorAll('div, article, li');
    const priceRegex = /(€|\$|£|SEK|EUR|USD)\s*[\d,]+|\d[\d,]+\s*(€|\$|£|SEK|EUR)/i;
    
    allElements.forEach((el) => {
      if (el.children.length > 2 && el.children.length < 30) {
        const text = el.textContent;
        if (priceRegex.test(text) && text.length > 50 && text.length < 2000) {
          const listing = {};
          listing.title = el.querySelector('h1, h2, h3, h4, a')?.textContent?.trim() || '';
          listing.price = text.match(priceRegex)?.[0] || '';
          const sizeMatch = text.match(/(\d+\s*(ft|m|meter|feet))/i);
          listing.size = sizeMatch ? sizeMatch[0] : '';
          const yearMatch = text.match(/\b(19|20)\d{2}\b/);
          listing.year = yearMatch ? yearMatch[0] : '';
          listing.url = el.querySelector('a[href]')?.href || '';
          listing.id = listing.title.substring(0, 50);
          
          if (listing.title || listing.price) {
            listings.push(listing);
          }
        }
      }
    });
  }

  // Deduplicate
  const seen = new Set();
  return listings.filter((l) => {
    const key = l.id;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}