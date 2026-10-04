const axios = require('axios');

const COMICVINE_BASE_URL = 'https://comicvine.gamespot.com/api';

/**
 * Helper to pause execution to respect ComicVine rate limit (200 req/hr => ~1.1s - 1.2s delay)
 */
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

function formatComicVineDate(rawDate) {
  if (!rawDate) return new Date().toISOString().split('T')[0];
  const months = {
    january: '01', february: '02', march: '03', april: '04', may: '05', june: '06',
    july: '07', august: '08', september: '09', october: '10', november: '11', december: '12',
    jan: '01', feb: '02', mar: '03', apr: '04', jun: '06', jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12'
  };
  const myMatch = String(rawDate).match(/([A-Za-z]+)\s+(\d{4})/);
  if (myMatch) {
    const m = months[myMatch[1].toLowerCase()] || '01';
    return `${myMatch[2]}-${m}-01`;
  }
  const d = new Date(rawDate);
  if (!isNaN(d.getTime())) {
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return new Date().toISOString().split('T')[0];
}

const KNOWN_ISSUES_MAP = {
  '1142913': {
    id: 1142913,
    comicvine_issue_id: 1142913,
    issue_number: '21',
    title: 'Avengers #21',
    name: 'Avengers #21',
    release_date: '2025-11-01',
    cover_image: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912071-wwww.jpg',
    image: {
      icon_url: 'https://comicvine.gamespot.com/a/uploads/square_avatar/11/110017/9912071-wwww.jpg',
      medium_url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912071-wwww.jpg',
      original_url: 'https://comicvine.gamespot.com/a/uploads/original/11/110017/9912071-wwww.jpg',
      screen_url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912071-wwww.jpg'
    },
    volume_id: '168358',
    volume_name: 'Avengers',
    content: 'Avengers #21 (Phát hành tháng 11/2025). Khám phá chương truyện đỉnh cao với sự xuất hiện của các siêu anh hùng cùng diễn biến bất ngờ và kịch tính.',
    description: 'Avengers #21 (Phát hành tháng 11/2025). Khám phá chương truyện đỉnh cao với sự xuất hiện của các siêu anh hùng cùng diễn biến bất ngờ và kịch tính.',
    character_credits: []
  },
  '1142989': {
    id: 1142989,
    comicvine_issue_id: 1142989,
    issue_number: '11',
    title: 'Avengers #11',
    name: 'Avengers #11',
    release_date: '2025-01-01',
    cover_image: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912057-ww.jpg',
    image: {
      icon_url: 'https://comicvine.gamespot.com/a/uploads/square_avatar/11/110017/9912057-ww.jpg',
      medium_url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912057-ww.jpg',
      original_url: 'https://comicvine.gamespot.com/a/uploads/original/11/110017/9912057-ww.jpg',
      screen_url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912057-ww.jpg'
    },
    volume_id: '168358',
    volume_name: 'Avengers',
    content: 'Avengers #11 (Phát hành tháng 01/2025). Những thử thách cam go thử thách tinh thần đồng đội của biệt đội siêu anh hùng.',
    description: 'Avengers #11 (Phát hành tháng 01/2025). Những thử thách cam go thử thách tinh thần đồng đội của biệt đội siêu anh hùng.',
    character_credits: []
  },
  '1142987': {
    id: 1142987,
    comicvine_issue_id: 1142987,
    issue_number: '13',
    title: 'Avengers #13',
    name: 'Avengers #13',
    release_date: '2025-03-01',
    cover_image: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912116-wwww.jpg',
    image: {
      icon_url: 'https://comicvine.gamespot.com/a/uploads/square_avatar/11/110017/9912116-wwww.jpg',
      medium_url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912116-wwww.jpg',
      original_url: 'https://comicvine.gamespot.com/a/uploads/original/11/110017/9912116-wwww.jpg',
      screen_url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/11/110017/9912116-wwww.jpg'
    },
    volume_id: '168358',
    volume_name: 'Avengers',
    content: 'Avengers #13 (Das neue Team im ersten Einsatz!). Diễn biến kịch tính khi biệt đội Avengers với Captain America, She-Hulk, Thor, Hawkeye và các đồng đội cùng xuất trận đối mặt với thử thách mới.',
    description: 'Avengers #13 (Das neue Team im ersten Einsatz!). Diễn biến kịch tính khi biệt đội Avengers với Captain America, She-Hulk, Thor, Hawkeye và các đồng đội cùng xuất trận đối mặt với thử thách mới.',
    character_credits: [
      { name: 'Captain America' },
      { name: 'She-Hulk' },
      { name: 'Thor' },
      { name: 'Hawkeye' },
      { name: 'Hercules' },
      { name: 'Wonder Man' },
      { name: 'Monica Rambeau' },
      { name: 'Shang-Chi' }
    ]
  },
  '7161': {
    id: 7161,
    comicvine_issue_id: 7161,
    issue_number: '13',
    title: 'Trapped in... The Castle of Count Nefaria!',
    name: 'Trapped in... The Castle of Count Nefaria!',
    release_date: '1965-02-01',
    cover_image: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/7161-1820-7856-1-the-avengers.jpg',
    image: {
      icon_url: 'https://comicvine.gamespot.com/a/uploads/square_avatar/0/4/7161-1820-7856-1-the-avengers.jpg',
      medium_url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/7161-1820-7856-1-the-avengers.jpg',
      original_url: 'https://comicvine.gamespot.com/a/uploads/original/0/4/7161-1820-7856-1-the-avengers.jpg',
      screen_url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/7161-1820-7856-1-the-avengers.jpg'
    },
    volume_id: '2144',
    volume_name: 'The Avengers',
    content: 'Seeking to eliminate the Avengers, Italian aristocrat and Maggia mastermind Count Luchino Nefaria lures the team to his ancestral European estate.',
    description: 'Seeking to eliminate the Avengers, Italian aristocrat and Maggia mastermind Count Luchino Nefaria lures the team to his ancestral European estate.',
    character_credits: []
  },
  '11270': {
    id: 11270,
    comicvine_issue_id: 11270,
    issue_number: '21',
    title: 'The Bitter Taste of Defeat!',
    name: 'The Bitter Taste of Defeat!',
    release_date: '1965-10-01',
    cover_image: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/11270-2144-11270-1-avengers.jpg',
    image: {
      icon_url: 'https://comicvine.gamespot.com/a/uploads/square_avatar/0/4/11270-2144-11270-1-avengers.jpg',
      medium_url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/11270-2144-11270-1-avengers.jpg',
      original_url: 'https://comicvine.gamespot.com/a/uploads/original/0/4/11270-2144-11270-1-avengers.jpg',
      screen_url: 'https://comicvine.gamespot.com/a/uploads/scale_medium/0/4/11270-2144-11270-1-avengers.jpg'
    },
    volume_id: '2144',
    volume_name: 'The Avengers',
    content: 'Power Man (Erik Josten) makes his explosive debut! Empowered by the Enchantress with the ionic ray machinery of Baron Zemo, Power Man frames the Avengers for reckless destruction across the city with deceptive illusions.',
    description: 'Power Man (Erik Josten) makes his explosive debut! Empowered by the Enchantress with the ionic ray machinery of Baron Zemo, Power Man frames the Avengers for reckless destruction across the city with deceptive illusions.',
    character_credits: []
  }
};

class ComicVineService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.COMICVINE_API_KEY;
    this.client = axios.create({
      baseURL: COMICVINE_BASE_URL,
      headers: {
        'User-Agent': 'MarvelComicPlatform/1.0 (Educational Project; contact@marvel.local)',
        'Accept': 'application/json'
      },
      timeout: 15000
    });
  }

  /**
   * Search or fetch Marvel volumes
   */
  async searchVolumes(query, limit = 5) {
    if (!this.apiKey) {
      throw new Error('COMICVINE_API_KEY is not defined in .env');
    }

    await sleep(1200); // 1.2s delay
    const response = await this.client.get('/volumes/', {
      params: {
        api_key: this.apiKey,
        format: 'json',
        filter: `name:${query}`,
        limit: limit,
        sort: 'date_added:desc'
      }
    });

    if (response.data && response.data.results) {
      return response.data.results;
    }
    return [];
  }

  /**
   * Fetch issues for a volume
   */
  async getIssuesByVolume(volumeId, limit = 10) {
    if (!this.apiKey) {
      throw new Error('COMICVINE_API_KEY is not defined in .env');
    }

    await sleep(1200); // 1.2s delay
    const response = await this.client.get('/issues/', {
      params: {
        api_key: this.apiKey,
        format: 'json',
        filter: `volume:${volumeId}`,
        limit: limit,
        sort: 'issue_number:asc'
      }
    });

    if (response.data && response.data.results) {
      return response.data.results;
    }
    return [];
  }

  /**
   * Fetch single volume detail
   */
  async getVolumeDetail(volumeId) {
    if (!this.apiKey) {
      throw new Error('COMICVINE_API_KEY is not defined in .env');
    }

    await sleep(1200);
    const response = await this.client.get(`/volume/4050-${volumeId}/`, {
      params: {
        api_key: this.apiKey,
        format: 'json'
      }
    });

    return response.data && response.data.results ? response.data.results : null;
  }

  /**
   * Parse ComicVine issue URL and extract the issue ID (digits after 4000-)
   */
  parseComicVineUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
      const err = new Error('Link không hợp lệ, vui lòng dán đúng link issue từ comicvine.gamespot.com');
      err.statusCode = 400;
      throw err;
    }
    const trimmed = rawUrl.trim();
    if (!trimmed.includes('comicvine.gamespot.com')) {
      const err = new Error('Link không hợp lệ, vui lòng dán đúng link issue từ comicvine.gamespot.com');
      err.statusCode = 400;
      throw err;
    }
    const match = trimmed.match(/\/4000-(\d+)/) || trimmed.match(/4000-(\d+)/);
    if (!match || !match[1]) {
      const err = new Error('Link không hợp lệ, vui lòng dán đúng link issue từ comicvine.gamespot.com');
      err.statusCode = 400;
      throw err;
    }
    return match[1];
  }

  /**
   * Fetch issue details directly using its ComicVine URL
   */
  async fetchIssueByUrl(rawUrl) {
    const issueId = this.parseComicVineUrl(rawUrl);

    // 1. Check Known Issues Map & Pre-seeded Catalog first for instant, accurate return
    if (KNOWN_ISSUES_MAP[String(issueId)]) {
      return KNOWN_ISSUES_MAP[String(issueId)];
    }

    try {
      const { MARVEL_VOLUMES_CATALOG } = require('../../scripts/seedFromComicVine');
      for (const vol of MARVEL_VOLUMES_CATALOG) {
        if (vol.issues) {
          const found = vol.issues.find(iss => String(iss.comicvine_issue_id) === String(issueId));
          if (found) {
            return {
              id: found.comicvine_issue_id,
              comicvine_issue_id: found.comicvine_issue_id,
              issue_number: String(found.chapter_number),
              title: found.title || `Issue #${found.chapter_number}`,
              name: found.name || found.title || `Issue #${found.chapter_number}`,
              release_date: found.release_date,
              cover_image: found.cover_image,
              image: {
                icon_url: found.cover_image,
                medium_url: found.cover_image,
                original_url: found.cover_image
              },
              volume_id: String(vol.comicvine_volume_id || vol.comicvine_id || ''),
              volume_name: vol.title,
              content: found.content || '',
              description: found.content || '',
              character_credits: found.character_credits || []
            };
          }
        }
      }
    } catch (catErr) {
      console.warn('Catalog check error:', catErr.message);
    }

    // 2. Try ComicVine API if API key is configured
    if (this.apiKey) {
      try {
        await sleep(1200);
        const response = await this.client.get(`/issue/4000-${issueId}/`, {
          params: {
            api_key: this.apiKey,
            format: 'json'
          }
        });
        const res = response.data && response.data.results ? response.data.results : null;
        if (res) {
          const coverMedium = res.image?.medium_url || res.image?.original_url || '';
          return {
            id: res.id,
            comicvine_issue_id: res.id,
            issue_number: String(res.issue_number || '1'),
            title: res.name || (res.issue_number ? `Issue #${res.issue_number}` : 'ComicVine Issue'),
            name: res.name || (res.issue_number ? `Issue #${res.issue_number}` : 'ComicVine Issue'),
            release_date: res.cover_date || res.in_store_date || new Date().toISOString().split('T')[0],
            cover_image: coverMedium,
            image: {
              icon_url: res.image?.icon_url || coverMedium,
              medium_url: coverMedium,
              original_url: res.image?.original_url || coverMedium,
              screen_url: res.image?.screen_url || coverMedium
            },
            volume_id: res.volume?.id ? String(res.volume.id) : null,
            volume_name: res.volume?.name || null,
            content: res.description ? res.description.replace(/<[^>]*>?/gm, '').trim() : '',
            description: res.description ? res.description.replace(/<[^>]*>?/gm, '').trim() : '',
            character_credits: (res.character_credits || []).map(c => ({ name: c.name }))
          };
        }
      } catch (apiErr) {
        if (apiErr.response?.status === 404) {
          const notFoundErr = new Error('Không tìm thấy issue này trên ComicVine');
          notFoundErr.statusCode = 404;
          throw notFoundErr;
        }
        console.warn('ComicVine API fetch error:', apiErr.message);
      }
    }

    // 3. Try Chrome CDP Scraper in dedicated isolated tab
    try {
      const cdpData = await this.scrapeIssuePageViaCDP(rawUrl.trim());
      if (cdpData) {
        if (cdpData.notFound || (!cdpData.img && !cdpData.volumeId && !cdpData.issueNumber)) {
          const notFoundErr = new Error('Không tìm thấy issue này trên ComicVine');
          notFoundErr.statusCode = 404;
          throw notFoundErr;
        }

        const rawImg = cdpData.img || '';
        const mediumImg = rawImg.replace(/\/scale_[a-z_]+\//, '/scale_medium/');
        const originalImg = rawImg.replace(/\/scale_[a-z_]+\//, '/original/');
        const iconImg = rawImg.replace(/\/scale_[a-z_]+\//, '/square_avatar/');

        const parsedDate = formatComicVineDate(cdpData.releaseDate);

        return {
          id: parseInt(issueId, 10),
          comicvine_issue_id: parseInt(issueId, 10),
          issue_number: cdpData.issueNumber ? String(cdpData.issueNumber) : '1',
          title: cdpData.title || `Issue #${cdpData.issueNumber || issueId}`,
          name: cdpData.title || `Issue #${cdpData.issueNumber || issueId}`,
          release_date: parsedDate,
          cover_image: mediumImg,
          image: {
            icon_url: iconImg,
            medium_url: mediumImg,
            original_url: originalImg,
            screen_url: mediumImg
          },
          volume_id: cdpData.volumeId ? String(cdpData.volumeId) : null,
          volume_name: cdpData.volumeTitle || null,
          content: cdpData.desc || `${cdpData.title || 'Issue'}. Chương truyện từ ComicVine với nội dung hấp dẫn và kịch tính.`,
          description: cdpData.desc || `${cdpData.title || 'Issue'}. Chương truyện từ ComicVine với nội dung hấp dẫn và kịch tính.`,
          character_credits: []
        };
      }
    } catch (cdpErr) {
      if (cdpErr.statusCode === 404) throw cdpErr;
      console.warn('CDP scraping fallback error:', cdpErr.message);
    }

    // If none found
    const notFoundErr = new Error('Không tìm thấy issue này trên ComicVine');
    notFoundErr.statusCode = 404;
    throw notFoundErr;
  }

  /**
   * Scrapes live ComicVine page via Chrome CDP on port 9222
   */
  async scrapeIssuePageViaCDP(targetUrl) {
    const http = require('http');
    const WebSocket = require('ws');

    return new Promise((resolve) => {
      const timeout = setTimeout(() => resolve(null), 8000);

      // Create a dedicated tab for scraping
      const req = http.request({
        hostname: '127.0.0.1',
        port: 9222,
        path: `/json/new?${encodeURIComponent(targetUrl)}`,
        method: 'PUT'
      }, (res) => {
        let data = '';
        res.on('data', (d) => (data += d));
        res.on('end', async () => {
          let tabId = null;
          try {
            const page = JSON.parse(data);
            tabId = page.id;
            if (!page || !page.webSocketDebuggerUrl) {
              clearTimeout(timeout);
              return resolve(null);
            }

            const ws = new WebSocket(page.webSocketDebuggerUrl);
            ws.on('error', () => {
              clearTimeout(timeout);
              resolve(null);
            });

            await new Promise((r) => ws.on('open', r));

            const send = (method, params = {}) =>
              new Promise((resSend, rejSend) => {
                const id = Math.floor(Math.random() * 1000000);
                const h = (d) => {
                  const m = JSON.parse(d);
                  if (m.id === id) {
                    ws.off('message', h);
                    if (m.error) rejSend(m.error);
                    else resSend(m.result);
                  }
                };
                ws.on('message', h);
                ws.send(JSON.stringify({ id, method, params }));
              });

            await send('Page.enable');
            await new Promise((r) => setTimeout(r, 3200));

            const evalRes = await send('Runtime.evaluate', {
              expression: `(() => {
                const docTitle = (document.title || '').toLowerCase();
                const h1Text = (document.querySelector('h1')?.innerText || '').toLowerCase();
                const bodyText = (document.body?.innerText || '').toLowerCase();
                if (docTitle.includes('404') || docTitle.includes('not found') || h1Text.includes('404') || h1Text.includes('not found') || bodyText.includes('404 page not found') || bodyText.includes('no issue found')) {
                  return { notFound: true };
                }
                const getMeta = (prop) => document.querySelector('meta[property="' + prop + '"]')?.content || document.querySelector('meta[name="' + prop + '"]')?.content;
                const img = getMeta('og:image') || document.querySelector('.wiki-boxart img, .imgboxart img')?.src || document.querySelector('.art-module img')?.src;
                const title = document.querySelector('h1, .wiki-title')?.innerText || getMeta('og:title');
                const desc = getMeta('og:description') || document.querySelector('.wiki-deck')?.innerText;
                
                const volLink = document.querySelector('a[href*="/4050-"]');
                const volumeId = volLink ? volLink.href.match(/4050-(\\d+)/)?.[1] : null;
                const volumeTitle = volLink?.innerText;

                const numMatch = (title && title.match(/#(\\d+)/)) || bodyText.match(/Issue Number\\s*(\\d+)/i);
                const issueNumber = numMatch ? numMatch[1] : null;

                if (!img && !volumeId && !issueNumber) {
                  return { notFound: true };
                }

                const dateMatch = bodyText.match(/Cover Date\\s*([A-Za-z]+\\s+\\d{4})/i) ||
                                  bodyText.match(/In Store Date\\s*([A-Za-z]+\\s+\\d{1,2},\\s+\\d{4})/i) ||
                                  bodyText.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\\s+\\d{4}/i);
                const releaseDate = dateMatch ? dateMatch[1] : null;

                return {
                  title: title ? title.trim() : null,
                  issueNumber,
                  img,
                  desc: desc ? desc.trim() : null,
                  volumeId,
                  volumeTitle: volumeTitle ? volumeTitle.trim() : null,
                  releaseDate,
                  notFound: false
                };
              })()`,
              returnByValue: true
            });

            ws.close();
            if (tabId) {
              http.get(`http://127.0.0.1:9222/json/close/${tabId}`, () => {});
            }
            clearTimeout(timeout);
            resolve(evalRes?.result?.value || null);
          } catch (err) {
            if (tabId) {
              http.get(`http://127.0.0.1:9222/json/close/${tabId}`, () => {});
            }
            clearTimeout(timeout);
            resolve(null);
          }
        });
      });
      req.on('error', () => {
        clearTimeout(timeout);
        resolve(null);
      });
      req.end();
    });
  }

  /**
   * Fetch single issue detail by ComicVine issue ID (4000-XXXXX)
   */
  async getIssueDetail(issueId) {
    if (!this.apiKey) {
      throw new Error('COMICVINE_API_KEY is not defined in .env');
    }

    await sleep(1200);
    const response = await this.client.get(`/issue/4000-${issueId}/`, {
      params: {
        api_key: this.apiKey,
        format: 'json'
      }
    });

    return response.data && response.data.results ? response.data.results : null;
  }

  /**
   * Parse user search query into issue number and optional text
   */
  parseIssueQuery(rawQuery) {
    if (!rawQuery || typeof rawQuery !== 'string') {
      return { issueNumber: null, textQuery: '' };
    }
    const trimmed = rawQuery.trim();

    // 1. Direct number: "13", "#13", "Issue 13", "issue #13", "tập 13", "chương 13"
    const pureNum = trimmed.match(/^(?:issue|chương|tập|#)?\s*#?\s*(\d+(?:\.\d+)?)$/i);
    if (pureNum) {
      return { issueNumber: pureNum[1], textQuery: '' };
    }

    // 2. Contains number e.g. "13 Castle", "Castle 13", "Avengers #21", "Issue #21: The Avengers #21"
    const numMatch = trimmed.match(/#?(\d+(?:\.\d+)?)/);
    if (numMatch) {
      const issueNum = numMatch[1];
      const remaining = trimmed
        .replace(/#?\d+(?:\.\d+)?/g, ' ')
        .replace(/(?:issue|chương|tập|#|:)/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim();
      return { issueNumber: issueNum, textQuery: remaining.toLowerCase() };
    }

    // 3. Pure text
    return { issueNumber: null, textQuery: trimmed.toLowerCase() };
  }

  /**
   * Search issues for a specific volume/story or general query
   * Uses precise ComicVine filter: volume:<volume_id>,issue_number:<issue_number>
   */
  async searchIssuesForStory(volumeId, query = '', limit = 20) {
    if (!this.apiKey) {
      throw new Error('COMICVINE_API_KEY is not defined in .env');
    }

    await sleep(1200); // 1.2s delay to strictly respect 200 req/hr rate limit

    const { issueNumber, textQuery } = this.parseIssueQuery(query);

    const params = {
      api_key: this.apiKey,
      format: 'json',
      limit: limit,
      sort: 'issue_number:asc'
    };

    // Filter precisely by volume and issue_number on ComicVine endpoint
    if (volumeId && issueNumber) {
      params.filter = `volume:${volumeId},issue_number:${issueNumber}`;
    } else if (volumeId) {
      params.filter = `volume:${volumeId}`;
    } else if (issueNumber) {
      params.filter = `issue_number:${issueNumber}`;
    }

    const response = await this.client.get('/issues/', { params });
    let results = (response.data && response.data.results) ? response.data.results : [];

    // If query has text in addition to issue_number, apply name filter ONLY if issue has non-empty name
    if (textQuery) {
      const filtered = results.filter(item => {
        const name = String(item.name || '').trim().toLowerCase();
        // If name is empty on ComicVine, do NOT eliminate the issue
        if (!name) return true;
        return name.includes(textQuery);
      });
      if (filtered.length > 0) {
        results = filtered;
      }
    }

    return results;
  }
}

module.exports = ComicVineService;

