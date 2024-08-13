import ConfigManager from '../configManager';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Page } from 'puppeteer-extra-plugin/dist/puppeteer';
import FileHandler from '../handlers/file-handler';
import SongHandler from '../handlers/song-handler';

puppeteer.use(StealthPlugin());

const addCookies = async function(page: Page, cookieValue: string) {
  const longDate = new Date();
  longDate.setFullYear(longDate.getFullYear() + 1);
  const shortDate = new Date();
  shortDate.setHours(shortDate.getHours() + 1);

  const cookies = cookieValue.split(';');
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];

    const cookieSplit = cookie.split('=');
    const name = cookieSplit[0].trim();
    const cookieToAdd: any = {
      name: name,
      value: cookieSplit[1]
    };

    if (['__cf_bm', '__client', '_cfuvid'].includes(name)) {
      cookieToAdd.domain = 'clerk.suno.com';
    }
    else {
      cookieToAdd.domain = 'suno.com';
    }
    if (['__client_uat', '__client'].includes(name)) {
      cookieToAdd.expires = longDate.getTime();
    }
    else if (['__cf_bm', '__session'].includes(name)) {
      cookieToAdd.expires = shortDate.getTime();
    }
    else if (name != '_cfuvid') {
      cookieToAdd.expires = shortDate.getTime();
    }
    if (['__cf_bm', '__client', '_cfuvid'].includes(name)) {
      cookieToAdd.httpOnly = true;
    }
    if (
      ['__cf_bm', '__client', '_cfuvid', '__client_uat', '__session'].includes(
        name
      )
    ) {
      cookieToAdd.secure = true;
    }
    if (['__cf_bm', '_cfuvid'].includes(name)) {
      cookieToAdd.sameSite = 'None';
    }
    else {
      cookieToAdd.sameSite = 'Lax';
    }
    try {
      await page.setCookie(cookieToAdd);
      console.log('ok for cookie ' + cookieToAdd.name);
    }
    catch (e) {
      console.log('ko for cookie ' + cookieToAdd.name);
    }
  }
};

const resetTimeOfDay = function(date: Date) {
  const tmp = new Date(date);
  tmp.setHours(0);
  tmp.setMinutes(0);
  tmp.setSeconds(0);
  tmp.setMilliseconds(0);
  return tmp;
};

const checkAvailableSong = function(maxByDay: number) {
  if (SongHandler.lastSong) {
    const today = resetTimeOfDay(new Date());
    const last = resetTimeOfDay(new Date(SongHandler.lastSong));
    if (today.getTime() !== last.getTime()) {
      SongHandler.songNumber = 0;
    }
    else {
      SongHandler.songNumber++;
    }
    if (SongHandler.songNumber > maxByDay) {
      return 'Too many songs requested today, please wait for tomorrow';
    }
  }
  if (
    SongHandler.lastSong &&
    new Date().getTime() - 40000 < SongHandler.lastSong
  ) {
    return 'Too many songs requested, please wait a little';
  }
  return '';
};

const _createSong = async function(query: string) {
  const config = ConfigManager.getConfig();
  const cookieValue: string = config.suno.cookieKey;
  const maxByDay: number = config.suno.maxByDay;

  console.log('launch with last song : ', SongHandler.lastSong);
  if (!cookieValue) {
    return 'Suno is not configured';
  }
  const cantPlay = checkAvailableSong(maxByDay);
  if (cantPlay) {
    return cantPlay;
  }

  return new Promise(function(resolve) {
    SongHandler.lastSong = new Date().getTime();

    const parsedQuery = JSON.parse(query);
    const prompt = parsedQuery.song;

    launchCreateSong(resolve, prompt, cookieValue);
  });
};

const launchCreateSong = async function(
  resolve,
  prompt: string,
  cookieValue: string
) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await addCookies(page, cookieValue);
  console.log('Connect to website (bypass anti bot)');
  try {
    await page.goto('https://suno.com/create');
    setTimeout(async function() {
      launchPromptAndCreate(prompt, resolve, page);
    }, 5000);
  }
  catch (e) {
    console.log('error launchCreateSong', e);
    saveErrorFile('launchCreateSong', page);
    resolve('something was bad');
  }
};

const launchPromptAndCreate = async function(
  prompt: string,
  resolve,
  page: Page
) {
  try {
    console.log('Launch generation song');
    await page.locator('textarea.w-full').fill(prompt);
    await page.locator('.create-button button').click();
    setTimeout(async function() {
      waitCreateSong(resolve, page);
    }, 30000);
  }
  catch (e) {
    console.log('error launchPromptAndCreate', e);
    saveErrorFile('launchPromptAndCreate', page);
    resolve('something was bad');
  }
};

const waitCreateSong = async function(resolve, page: Page) {
  try {
    console.log('Go to song page');
    saveErrorFile('beforegethref', page);
    const href = await page.$eval(
      '.react-aria-GridList [data-key]:first-child a',
      (anchor) => anchor.getAttribute('href')
    );

    if (!href) {
      saveErrorFile('waitCreateSongnohref', page);
      resolve('something was bad');
    }
    else {
      console.log('Go to page for play music generated', href);
      await page.goto('https://suno.com' + href);

      setTimeout(async function() {
        openAndSaveSong(resolve, page);
      }, 2000);
    }
  }
  catch (e) {
    console.log('error waitCreateSong', e);
    saveErrorFile('waitCreateSong', page);
    resolve('something was bad');
  }
};

const openAndSaveSong = async function(resolve, page: Page) {
  try {
    console.log('play music');
    await page.locator('[src="/icons/play.svg"]').click();
    const audioSrc = await page.$eval(
      'audio#active-audio-play',
      (audioElement) => audioElement.getAttribute('src')
    );
    if (!audioSrc) {
      resolve('Song was created but i can\'t find its url');
    }
    else {
      console.log('download music');
      const response = await fetch(audioSrc);
      const responseBuffer = await response.arrayBuffer();
      const songData = Buffer.from(responseBuffer);
      const songPath = saveSong(songData);
      if (songPath === '') {
        resolve('Song was created but i can\'t save the song file');
      }
      else {
        resolve(JSON.stringify({ song_url: songPath }));
      }
    }
  }
  catch (e) {
    console.log('error openAndSaveSong', e);
    saveErrorFile('openAndSaveSong', page);
    resolve('something was bad');
  }
};

const saveSong = function(songData: Buffer): string {
  const songName = new Date().getTime() + '.mp3';
  const songPath = FileHandler.saveArrayBufferToFile(songName, songData);

  return songPath;
};

const saveErrorFile = function(errorName: string, page: Page) {
  (async function() {
    const content = await page.content();
    const htmlErrorFile = FileHandler.saveStringToFile(
      new Date().getTime() + '-' + errorName + '.html',
      content
    );
    console.log('error page on suno.com was saved to ' + htmlErrorFile);
  })();
};

const createSong = {
  type: 'function',
  function: {
    function: _createSong,
    description:
      'Use this tool only when you need to create a song. song parameter must be less than 200 characters' +
      'Include the response in the "content" property of the JSON object.' +
      'Use a strictly valid markdown image syntax to display the song in the response.' +
      ' ex: ![Texte alternatif](/chemin/access/chanson.mp3 "Titre de a chanson") and [Link text Here](https://link-url-here.org)',
    parameters: {
      type: 'object',
      properties: {
        song: { type: 'string' }
      }
    }
  }
};

export default createSong;
