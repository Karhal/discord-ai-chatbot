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
    const browser = await puppeteer.launch();
    try {
      const page = await browser.newPage();
      await page.goto(webpageUrl);
      const bodyContent = await page.evaluate(() => {
        for (const script of document.body.querySelectorAll('script')) script.remove();
        return document.body.innerHTML;
      });
      console.log(bodyContent);
      await browser.close();
      return { content: bodyContent };
    }
    catch (error) {
      await browser.close();
      return { error: 'Failed to fetch webpage content' };
    }
  };
}
