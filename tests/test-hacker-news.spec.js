import { test, expect } from '@playwright/test';

test('first 100 articles are sorted from newest to oldest', async ({ page }) => {
  // Navigate to the Hacker News "newest" page.
  await page.goto('https://news.ycombinator.com/newest');

  // We will collect the timestamps of the first 100 articles.
  const TARGET = 100;
  const timestamps = [];

  while (timestamps.length < TARGET) {
    // Locate all the spans with the class "age" on the current page.
    // These spans contain the article timestamps in their title attributes.
    const ageSpans = page.locator('span.age');
    const count = await ageSpans.count();

    for (let i = 0; i < count && timestamps.length < TARGET; ++i) {
      const title = await ageSpans.nth(i).getAttribute('title');
      if (!title) throw new Error('title attribute not found on span');

      // Each title is expected to be in the format "YYYY-MM-DDTHH:MM:SS UET".
      // "YYYY-MM-DDTHH:MM:SS" represents the ISO 8601 string and "UET" represents the Unix Epoch timestamp in seconds.
      // E.g., title="2025-05-26T22:19:17 1748297957"

      // Because the titles are in a format that's incompatible with the Date constructor, we need to extract either the ISO string or the Unix timestamp.
      // Also, because JavaScript expects time values in milliseconds for its Date objects, we would have to convert the Unix timestamp from seconds to milliseconds.
      // So, for simplicity, we'll just extract the ISO strings and create Date objects from those.
      const [isoString] = title.split(' ');
      timestamps.push(new Date(isoString));
    }

    // If we haven't collected enough timestamps, we click the "More" link to load more articles.
    // We wait for the network idle state to guarantee that the new articles are fully loaded before proceeding.
    if (timestamps.length < TARGET) {
      await Promise.all([
        page.click('a.morelink'),
        page.waitForLoadState('networkidle')
      ]);
    }
  }

  // At this point, we assert that we have collected exactly 100 timestamps.
  expect(timestamps.length).toBe(TARGET);

  // Finally, we assert that the timestamps are sorted from newest to oldest.
  for (let i = 1; i < timestamps.length; ++i) {
    expect(timestamps[i - 1].getTime(), `Article #${i}'s timestamp (${timestamps[i - 1].toISOString()}) is newer than article #${i + 1}'s (${timestamps[i].toISOString()}).`).toBeGreaterThanOrEqual(timestamps[i].getTime());
  }
});