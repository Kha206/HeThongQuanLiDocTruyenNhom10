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

const CHARACTER_AVATARS = {
  'spider-man': 'https://comicvine.gamespot.com/a/uploads/scale_small/0/3848/127622-130694-spider-man.jpg',
  'green goblin': 'https://comicvine.gamespot.com/a/uploads/square_small/12/124259/7758728-7653156-spiderman_850_parrillo_virgin_1024x1024.jpg',
  'doctor octopus': 'https://comicvine.gamespot.com/a/uploads/square_small/12/124259/8273265-xwo2dl8g0c381.jpg',
  'sandman': 'https://comicvine.gamespot.com/a/uploads/square_small/11144/111442876/8791112-cerec.jpg',
  'sandman (flint marko)': 'https://comicvine.gamespot.com/a/uploads/square_small/11144/111442876/8791112-cerec.jpg',
  'lizard': 'https://comicvine.gamespot.com/a/uploads/square_small/11144/111442876/8791115-dfgeges.jpg',
  'lizard (dr. curt connors)': 'https://comicvine.gamespot.com/a/uploads/square_small/11144/111442876/8791115-dfgeges.jpg',
  'electro': 'https://comicvine.gamespot.com/a/uploads/square_small/11144/111442876/8791114-fbege.jpg',
  'electro (max dillon)': 'https://comicvine.gamespot.com/a/uploads/square_small/11144/111442876/8791114-fbege.jpg',
  'chameleon': 'https://comicvine.gamespot.com/a/uploads/scale_small/12/124259/8002168-250072_1446175_1.jpg',
  'doctor doom': 'https://comicvine.gamespot.com/a/uploads/scale_small/4/49448/1724175-doctor_doom.jpg',
  'captain america': 'https://comicvine.gamespot.com/a/uploads/scale_small/3/33913/921103-108_the_marvels_project_4_epting_variant_.jpg',
  'iron man': 'https://comicvine.gamespot.com/a/uploads/scale_small/2/26163/504218-iron_man_armor_mk_i_001.png',
  'thor': 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2593422-thor1.png',
  'hulk': 'https://comicvine.gamespot.com/a/uploads/scale_small/1/15776/9971293-hulk.jpg',
  'thanos': 'https://comicvine.gamespot.com/a/uploads/scale_small/0/394/77995-21433-thanos.png',
  'wolverine': 'https://comicvine.gamespot.com/a/uploads/scale_small/4/49076/1863600-200px_wolverine_first_claws.jpg',
  'j. jonah jameson': 'https://comicvine.gamespot.com/a/uploads/scale_small/6/64137/2725615-asm2_jj.jpg',
  'aunt may': 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2733264-marvel_knights_spider_man__4___page_3.jpg',
  'flash thompson': 'https://comicvine.gamespot.com/a/uploads/scale_small/12/124259/8056388-extreme_carnage_alpha_vol_1_1_616_comics_and_jolzar_collectibles_exclusive_virgin_variant.jpg',
  'human torch': 'https://comicvine.gamespot.com/a/uploads/scale_small/12/124259/8338234-b5866c56-93ff-4db0-aeca-9844ff09eac3_rw_1200.jpg',
  'reed richards': 'https://comicvine.gamespot.com/a/uploads/scale_small/11112/111123579/7316596-fantastic_four_vol_6_1_mr._fantastic_variant_textless.jpg',
  'ant-man': 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2930199-talestoastonish049.jpg',
  'wasp': 'https://comicvine.gamespot.com/a/uploads/scale_small/1/15776/10190293-wasp.jpg',
  'loki': 'https://comicvine.gamespot.com/a/uploads/scale_small/2/28391/2713359-128.jpg',
  'cyclops': 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2930260-talestoastonish050.jpg',
  'jean grey': 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2930269-talestoastonish051.jpg',
  'magneto': 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2930271-talestoastonish052.jpg',
  'silver surfer': 'https://comicvine.gamespot.com/a/uploads/scale_small/7/71975/2215796-047.jpg',
  'adam warlock': 'https://comicvine.gamespot.com/a/uploads/scale_small/7/71975/2215797-048.jpg',
  'mephisto': 'https://comicvine.gamespot.com/a/uploads/scale_small/7/71975/2215798-049.jpg',
  'nebula': 'https://comicvine.gamespot.com/a/uploads/scale_small/7/71975/2215799-050.jpg',
  'mistress death': 'https://comicvine.gamespot.com/a/uploads/scale_small/7/71975/2215800-051.jpg',
  'beyonder': 'https://comicvine.gamespot.com/a/uploads/scale_small/6/67663/2754348-04_cropped.jpg',
  'mallen': 'https://comicvine.gamespot.com/a/uploads/scale_small/11/118064/4096618-9691217218-11686.jpg',
  'maya hansen': 'https://comicvine.gamespot.com/a/uploads/scale_small/11/118064/4096612-7617155689-11686.jpg',
  'beast': 'https://comicvine.gamespot.com/a/uploads/scale_medium/11112/111123579/7166569-x-force_vol_6_6_textless.jpg',
  'professor x': 'https://comicvine.gamespot.com/a/uploads/scale_small/8/83882/2039151-260136_185357_professor_x.jpg',
  'quicksilver': 'https://comicvine.gamespot.com/a/uploads/scale_small/11/117763/2594178-quicks.png',
  'scarlet witch': 'https://comicvine.gamespot.com/a/uploads/scale_small/1/15776/9986552-scarlet_witch.jpg',
  'doctor strange': 'https://comicvine.gamespot.com/a/uploads/square_small/12/124259/8753901-ezgif-3-69b95d2d1b.jpg',
  'she-hulk': 'https://comicvine.gamespot.com/a/uploads/scale_small/1/11307/448626-she_hulk_01_00.jpg',
  'hawkeye': 'https://comicvine.gamespot.com/a/uploads/scale_small/0/3133/108921-190878-hawkeye.jpg',
  'tinkerer': 'https://comicvine.gamespot.com/a/uploads/square_small/10/101073/2055173-tinkerer.png',
  'living brain': 'https://comicvine.gamespot.com/a/uploads/square_small/0/229/96809-38759-living-brain.jpg',
  'montana': 'https://comicvine.gamespot.com/a/uploads/square_small/8/84205/3863997-301372-160841-montana.jpg',
  'ox': 'https://comicvine.gamespot.com/a/uploads/square_small/8/84205/3864141-134835-31206-the-ox.jpg',
  'fancy dan': 'https://comicvine.gamespot.com/a/uploads/square_small/2/26485/522489-fancy_dan.jpg',
  'betty brant': 'https://comicvine.gamespot.com/a/uploads/square_small/0/5599/180421-38371-betty-brant.jpg',
  'hercules': 'https://comicvine.gamespot.com/a/uploads/square_small/10/100239/2849284-__addme___marvel_milestones_v9999__2___page_1.jpg',
  'goliath (bill foster)': 'https://comicvine.gamespot.com/a/uploads/square_small/10/100555/2788526-2788520-1357297442wonder_comics_1_pg_22.jpg',
  'punisher': 'https://comicvine.gamespot.com/a/uploads/square_small/0/5756/684096-pfc_066_01.jpg',
  'black panther': 'https://comicvine.gamespot.com/a/uploads/square_small/11128/111284329/8780700-0001.jpg',
  'speedball (penance)': 'https://comicvine.gamespot.com/a/uploads/square_small/12/124259/9998859-large-4357933.jpg',
  'eternity': 'https://comicvine.gamespot.com/a/uploads/square_small/1/15776/440685-eternaltwilight.jpg',
  'living tribunal': 'https://comicvine.gamespot.com/a/uploads/square_small/0/77/148172-123031-living-tribunal.jpg',
  'gamora': 'https://comicvine.gamespot.com/a/uploads/square_small/12/124259/9357825-ezgif-7-563a93dc1b.jpg',
  'pip the troll': 'https://comicvine.gamespot.com/a/uploads/square_small/3/31666/2695349-xfact2005246cov_col.jpg',
  'namor the sub-mariner': 'https://comicvine.gamespot.com/a/uploads/square_small/12/124259/7642506-0083aa18cc79f26640e29a8594e2e51e.jpg',
  'namor': 'https://comicvine.gamespot.com/a/uploads/square_small/0/4/29367-4406-32633-1-namor-the-sub-marin.jpg',
  'baron zemo': 'https://comicvine.gamespot.com/a/uploads/square_small/11156/111564182/9796396-zemoimmonenre-size.jpg',
  'black knight': 'https://comicvine.gamespot.com/a/uploads/square_small/6/67663/5254526-01.jpg',
  'melter': 'https://comicvine.gamespot.com/a/uploads/square_small/12/124259/8115760-morbius_vol_1_5_textless.jpg',
  'enchantress': 'https://comicvine.gamespot.com/a/uploads/square_small/12/124259/9314849-large-9836064.jpg',
  'executioner': 'https://comicvine.gamespot.com/a/uploads/square_small/12/124259/9649791-large-1556556.jpg',
  'kang the conqueror': 'https://comicvine.gamespot.com/a/uploads/square_small/6/67663/8111353-01.jpg',
  'wonder man (simon williams)': 'https://comicvine.gamespot.com/a/uploads/square_small/11159/111592040/9311802-img_4496.jpeg',
  'wonder man': 'https://comicvine.gamespot.com/a/uploads/square_small/11159/111592040/9298021-img_4328.jpeg',
  'immortus': 'https://comicvine.gamespot.com/a/uploads/square_small/11115/111158055/7196385-immortus02.jpg',
  'sal kennedy': 'https://comicvine.gamespot.com/a/uploads/square_small/1/11635/334619-36740-sal-kennedy.jpeg',
  'sentry': 'https://comicvine.gamespot.com/a/uploads/square_small/1/10812/1487325-val_hd.jpg',
  'nick fury': 'https://comicvine.gamespot.com/a/uploads/square_small/0/3848/5808855-stl025079.jpg',
  'marvel girl (jean grey)': 'https://comicvine.gamespot.com/a/uploads/square_small/6/67663/6084537-01.jpg',
  'angel': 'https://comicvine.gamespot.com/a/uploads/square_small/0/5344/1288499-rsz_x_campus_1_0012.jpg',
  'iceman': 'https://comicvine.gamespot.com/a/uploads/square_small/11161/111612243/9579059-iceman.jpg',
  'vanisher': 'https://comicvine.gamespot.com/a/uploads/square_small/11119/111198274/4251552-vanisher.jpg',
  'blob (fred dukes)': 'https://comicvine.gamespot.com/a/uploads/square_small/0/3125/2213755-fred1.jpg',
  'blob': 'https://comicvine.gamespot.com/a/uploads/square_small/11161/111612243/9489486-6848530197-GYGTkWUXUAAQ-sn.jpg',
  'toad': 'https://comicvine.gamespot.com/a/uploads/square_small/12/124259/7040861-toad.jpg',
  'unus the untouchable': 'https://comicvine.gamespot.com/a/uploads/square_small/11/111746/7129223-gunther_bain_%28earth-616%29_from_all-new_x-men_vol_2_19_001.jpg',
  'ka-zar': 'https://comicvine.gamespot.com/a/uploads/square_small/1/15776/10147061-ka-zar.jpg',
  'shadrak': 'https://comicvine.gamespot.com/a/uploads/square_small/0/5344/2828232-shadrak_01.jpg',
  'titania': 'https://comicvine.gamespot.com/a/uploads/square_small/11146/111464511/8635835-mary_macpherran_%28earth-616%29_from_she-hulk_vol_4_1_001.jpg',
  'galactus': 'https://comicvine.gamespot.com/a/uploads/square_small/11112/111121983/6106786-9280042005-image_gallery',
  'monica rambeau': 'https://comicvine.gamespot.com/a/uploads/square_small/12/124259/8750592-ezgif-2-7f56b04d7b.jpg',
  'shang-chi': 'https://comicvine.gamespot.com/a/uploads/square_small/11141/111414280/8458264-6757923068-clean.jpg',
  'spider-man (black suit)': 'https://comicvine.gamespot.com/a/uploads/square_small/6/67663/7175957-01.jpg',
  'doctor doom (god doom)': 'https://comicvine.gamespot.com/a/uploads/square_small/0/2747/113913-18532-108893-1-doom-the-emperor-re.JPG',
  'tony stark': 'https://comicvine.gamespot.com/a/uploads/square_small/6/67663/6477334-01.jpg',
  'iron man (tony stark)': 'https://comicvine.gamespot.com/a/uploads/square_small/11161/111615891/9345991-1.jpg',
  'thor (clone ragnarok)': 'https://comicvine.gamespot.com/a/uploads/square_small/11111/111113340/8071870-00_rag.jpg',
  'thor (present)': 'https://comicvine.gamespot.com/a/uploads/square_small/6/67663/6489021-02.jpg',
  'young thor': 'https://comicvine.gamespot.com/a/uploads/square_small/6/67663/4412560-01.jpg',
  'young thor (viking era)': 'https://comicvine.gamespot.com/a/uploads/square_small/4/48397/1063259-title_thor.jpg',
  'king thor': 'https://comicvine.gamespot.com/a/uploads/square_small/6/67663/6799266-10.jpg',
  'king thor (old all-father)': 'https://comicvine.gamespot.com/a/uploads/square_small/6/67663/7284905-01.jpg',
  'avenger thor': 'https://comicvine.gamespot.com/a/uploads/square_small/6/67663/6586820-5342931570-70941.jpg',
  'gorr the god butcher': 'https://comicvine.gamespot.com/a/uploads/square_small/6/67663/3073997-01.jpg',
  'gorr': 'https://comicvine.gamespot.com/a/uploads/square_small/6/66303/3107937-screen%20shot%202013-06-14%20at%202.17.20%20pm.png',
  'vulture (adrian toomes)': 'https://comicvine.gamespot.com/a/uploads/square_small/13/135098/8587010-adrain-cat.jpg',
  'vulture': 'https://comicvine.gamespot.com/a/uploads/square_small/6/67663/2191259-07.jpg'
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
   * Normalizes character credits ensuring authentic avatar mapping and strictly NO duplicates
   */
  normalizeCharacterCredits(characterCredits) {
    if (!Array.isArray(characterCredits)) return [];
    const seenUrls = new Set();
    return characterCredits.map((c) => {
      if (!c) return null;
      const cleanName = (typeof c === 'string' ? c : c.name || '').trim();
      if (!cleanName) return null;
      const lower = cleanName.toLowerCase();
      let icon = null;

      // 1. If provided an authentic icon from ComicVine character API/proxy
      if (typeof c === 'object' && c.icon_url) {
        const rawIcon = c.icon_url.trim();
        const isBorrowed = Object.entries(CHARACTER_AVATARS).some(([nameKey, url]) => {
          return url === rawIcon && !lower.includes(nameKey) && !nameKey.includes(lower);
        });
        if (!isBorrowed && !rawIcon.includes('talestoastonish') && !rawIcon.includes('strangers-in-paradis')) {
          icon = rawIcon;
        }
      }

      // 2. Fallback to dictionary if no icon provided
      if (!icon) {
        icon = CHARACTER_AVATARS[lower] || null;
      }

      // 3. Strictly deduplicate: no two different characters may share the exact same icon URL
      if (icon) {
        if (seenUrls.has(icon)) {
          icon = null;
        } else {
          seenUrls.add(icon);
        }
      }

      return {
        id: (c && typeof c === 'object' && c.id) ? c.id : null,
        name: cleanName,
        icon_url: icon
      };
    }).filter(Boolean);
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
   * Parse ComicVine character URL and extract the character ID (digits after 4005-)
   * E.g. https://comicvine.gamespot.com/thor/4005-2268/ => 2268
   */
  parseComicVineCharacterUrl(rawUrl) {
    if (!rawUrl || typeof rawUrl !== 'string') {
      const err = new Error('Link không hợp lệ, vui lòng dán đúng link nhân vật từ comicvine.gamespot.com (chứa 4005-ID)');
      err.statusCode = 400;
      throw err;
    }
    const trimmed = rawUrl.trim();
    if (!trimmed.includes('comicvine.gamespot.com') && !/4005-\d+/.test(trimmed)) {
      const err = new Error('Link không hợp lệ, vui lòng dán đúng link nhân vật từ comicvine.gamespot.com (chứa 4005-ID)');
      err.statusCode = 400;
      throw err;
    }
    const match = trimmed.match(/\/4005-(\d+)/) || trimmed.match(/4005-(\d+)/);
    if (!match || !match[1]) {
      const err = new Error('Link không hợp lệ, vui lòng dán đúng link nhân vật từ comicvine.gamespot.com (chứa 4005-ID)');
      err.statusCode = 400;
      throw err;
    }
    return match[1];
  }

  /**
   * Fetch single character details by URL or ID from ComicVine
   */
  async fetchCharacterByUrl(rawUrl) {
    const charId = this.parseComicVineCharacterUrl(rawUrl);
    const activeKey = this.apiKey || process.env.COMICVINE_API_KEY;
    if (!activeKey) {
      throw new Error('COMICVINE_API_KEY is not defined in .env');
    }

    try {
      const response = await this.client.get(`/character/4005-${charId}/`, {
        params: {
          api_key: activeKey,
          format: 'json',
          field_list: 'id,name,image'
        }
      });

      if (!response.data || response.data.status_code !== 1) {
        const errorMsg = response.data?.error || `ComicVine status code ${response.data?.status_code}`;
        const err = new Error(`ComicVine API trả về lỗi: ${errorMsg}`);
        err.statusCode = response.data?.status_code === 100 ? 401 : (response.data?.status_code === 101 ? 404 : 400);
        throw err;
      }

      const res = response.data.results;
      if (!res) {
        const err = new Error('Không tìm thấy thông tin nhân vật này trên ComicVine');
        err.statusCode = 404;
        throw err;
      }

      const iconUrl = res.image?.icon_url ||
                      res.image?.square_avatar ||
                      res.image?.small_url ||
                      res.image?.medium_url ||
                      res.image?.original_url ||
                      CHARACTER_AVATARS[res.name?.toLowerCase()] ||
                      null;

      return {
        id: res.id || parseInt(charId, 10),
        name: res.name || '',
        icon_url: iconUrl
      };
    } catch (apiErr) {
      if (apiErr.response?.status === 401 || apiErr.comicVineStatusCode === 100) {
        const err = new Error('COMICVINE_API_KEY không hợp lệ hoặc đã hết hạn.');
        err.statusCode = 401;
        throw err;
      }
      if (apiErr.response?.status === 404 || apiErr.comicVineStatusCode === 101) {
        const err = new Error('Không tìm thấy nhân vật này trên ComicVine');
        err.statusCode = 404;
        throw err;
      }
      if (apiErr.response?.status === 420 || apiErr.response?.status === 429 || apiErr.comicVineStatusCode === 107) {
        const err = new Error('Đã vượt quá giới hạn lượt gọi ComicVine API. Vui lòng thử lại sau.');
        err.statusCode = 429;
        throw err;
      }
      throw apiErr;
    }
  }

  /**
   * Fetch issue details directly using its ComicVine URL
   */
  async fetchIssueByUrl(rawUrl) {
    const issueId = this.parseComicVineUrl(rawUrl);

    let activeKey = (this.apiKey || process.env.COMICVINE_API_KEY || '').trim();
    if (!activeKey) {
      try {
        require('dotenv').config();
        activeKey = (process.env.COMICVINE_API_KEY || '').trim();
        if (activeKey) {
          this.apiKey = activeKey;
        }
      } catch (e) {}
    }

    if (!activeKey) {
      const err = new Error('Thiếu COMICVINE_API_KEY trong file backend/.env. Vui lòng thêm API key để lấy dữ liệu từ ComicVine.');
      err.statusCode = 500;
      throw err;
    }

    try {
      await sleep(1200); // 1.2s delay to strictly respect 200 req/hr rate limit
      const response = await this.client.get(`/issue/4000-${issueId}/`, {
        params: {
          api_key: activeKey,
          format: 'json',
          field_list: 'name,issue_number,cover_date,store_date,description,image,character_credits,volume'
        }
      });

      // Temporary console.log at backend/src/services/comicVineService.js:304 (can be deleted later)
      console.log(`=== [COMICVINE TEMPORARY LOG - comicVineService.js:304] issueId: ${issueId}, status_code: ${response.data?.status_code}, error: ${response.data?.error || null} ===`);

      if (!response.data || response.data.status_code !== 1) {
        const errorMsg = response.data?.error || `ComicVine status code ${response.data?.status_code}`;
        const err = new Error(`ComicVine API trả về lỗi: ${errorMsg}`);
        err.statusCode = response.data?.status_code === 100 ? 401 : (response.data?.status_code === 101 ? 404 : 400);
        err.comicVineStatusCode = response.data?.status_code;
        throw err;
      }

      const res = response.data.results;
      if (!res) {
        const err = new Error('Không tìm thấy thông tin issue này trên ComicVine');
        err.statusCode = 404;
        throw err;
      }

      const issueNumber = res.issue_number ? String(res.issue_number) : '';
      const volumeName = res.volume?.name || '';
      const name = res.name || (issueNumber ? `${volumeName || 'Issue'} #${issueNumber}` : '');

      // coverUrl: prioritize image.original_url, fallback super_url / medium_url
      const coverUrl = res.image?.original_url ||
                       res.image?.super_url ||
                       res.image?.medium_url ||
                       res.image?.small_url ||
                       res.image?.icon_url ||
                       '';

      // releaseDate: store_date hoặc cover_date, định dạng YYYY-MM-DD
      let releaseDate = '';
      const rawDate = res.store_date || res.cover_date || '';
      if (rawDate) {
        const d = new Date(rawDate);
        if (!isNaN(d.getTime())) {
          releaseDate = d.toISOString().split('T')[0];
        } else {
          const match = String(rawDate).match(/^(\d{4}-\d{2}-\d{2})/);
          if (match) releaseDate = match[1];
        }
      }

      // description: strip HTML
      const description = res.description
        ? res.description.replace(/<[^>]*>?/gm, '').trim()
        : '';

      // character_credits: list of characters with authentic images (max 8)
      const rawCredits = Array.isArray(res.character_credits) ? res.character_credits.slice(0, 8) : [];
      let charImageMap = new Map();
      const charIds = rawCredits.map(c => c.id).filter(Boolean);

      if (charIds.length > 0) {
        try {
          const batchRes = await this.client.get('/characters/', {
            params: {
              api_key: activeKey,
              format: 'json',
              filter: `id:${charIds.join('|')}`,
              field_list: 'id,name,image'
            }
          });
          if (batchRes.data && batchRes.data.results) {
            batchRes.data.results.forEach(c => {
              const icon = c.image?.icon_url ||
                           c.image?.square_avatar ||
                           c.image?.small_url ||
                           c.image?.medium_url ||
                           c.image?.original_url;
              if (icon) charImageMap.set(c.id, icon);
            });
          }
        } catch (batchErr) {
          console.warn('Could not batch fetch character images from ComicVine:', batchErr.message);
        }
      }

      const mappedCredits = rawCredits.map(c => {
        const name = (typeof c === 'string' ? c : c.name || '').trim();
        const id = c.id || null;
        const icon = (id && charImageMap.get(id)) || (c.image?.icon_url) || CHARACTER_AVATARS[name.toLowerCase()] || null;
        return { id, name, icon_url: icon };
      });

      const character_credits = this.normalizeCharacterCredits(mappedCredits);
      const characters = character_credits.map(c => c.name);

      return {
        id: res.id || parseInt(issueId, 10),
        comicvine_issue_id: res.id || parseInt(issueId, 10),
        issueNumber,
        issue_number: issueNumber,
        name,
        title: name,
        coverUrl,
        cover_image: coverUrl,
        image: {
          icon_url: res.image?.icon_url || coverUrl,
          medium_url: res.image?.medium_url || coverUrl,
          original_url: res.image?.original_url || coverUrl,
          super_url: res.image?.super_url || coverUrl
        },
        releaseDate,
        release_date: releaseDate,
        description,
        content: description,
        characters,
        character_credits,
        volumeName,
        volume_name: volumeName,
        volume_id: res.volume?.id ? String(res.volume.id) : null
      };
    } catch (apiErr) {
      // Temporary console.log at backend/src/services/comicVineService.js:380 (can be deleted later)
      console.log(`=== [COMICVINE TEMPORARY LOG - comicVineService.js:380] issueId: ${issueId}, status_code: ${apiErr.comicVineStatusCode || apiErr.response?.data?.status_code || apiErr.response?.status || null}, error: ${apiErr.message} ===`);

      if (apiErr.response?.status === 401 || apiErr.comicVineStatusCode === 100) {
        const err = new Error('COMICVINE_API_KEY không hợp lệ hoặc đã hết hạn (status_code: 100). Vui lòng kiểm tra lại API key.');
        err.statusCode = 401;
        throw err;
      }
      if (apiErr.response?.status === 404 || apiErr.comicVineStatusCode === 101) {
        const err = new Error('Không tìm thấy issue này trên ComicVine');
        err.statusCode = 404;
        throw err;
      }
      if (apiErr.response?.status === 420 || apiErr.response?.status === 429 || apiErr.comicVineStatusCode === 107) {
        const err = new Error('Đã vượt quá giới hạn lượt gọi ComicVine API (Rate Limit 200 req/giờ). Vui lòng thử lại sau.');
        err.statusCode = 429;
        throw err;
      }
      throw apiErr;
    }
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

