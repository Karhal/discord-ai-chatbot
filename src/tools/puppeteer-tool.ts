import ConfigManager from '../configManager';
import AbstractTool from './absract-tool';
import puppeteer from 'puppeteer';

export default class PuppeteerTool extends AbstractTool {
  readonly toolName = 'puppeteer';
  readonly isActivated = ConfigManager.config.puppeteer.active;

  readonly description =
    'Use this tool to read the webpage and provide a summary of the content \
    or to give user information about the webpage.';

  readonly parameters = {
    type: 'object',
    properties: {
      webpageUrl: { type: 'string' }
    }
  };

  readonly execute = async (webpageUrl: string) => {
    webpageUrl = JSON.parse(webpageUrl).webpageUrl;

    const timeout = ConfigManager.config.puppeteer.timeout || 180000;
    const browser = await puppeteer.launch({
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--timeout', timeout.toString()],
      timeout: timeout
    });
    try {
      const page = await browser.newPage();

      page.setDefaultTimeout(timeout);
      page.setDefaultNavigationTimeout(timeout);

      await page.goto(webpageUrl, {
        timeout: timeout,
        waitUntil: 'networkidle0'
      });

      const bodyContent = await page.evaluate(() => {
        const elementsToRemove = [
          'script',
          'style',
          'nav',
          'footer',
          'header',
          'aside',
          'iframe',
          'noscript',
          '.advertisement',
          '.ads',
          '#cookie-banner',
          '.cookie-notice',
          '.social-share',
          '.comments-section'
        ];

        elementsToRemove.forEach(selector => {
          document.querySelectorAll(selector).forEach(element => element.remove());
        });

        const content = document.body.innerHTML;
        return content.replace(/data:image\/[^;]+;base64[^"']+/g, '[image]');
      });
      return bodyContent;
    }
    catch (error) {
      return { error: 'Failed to fetch webpage content' };
    }
    finally {
      await browser.close();
    }
  };
}
