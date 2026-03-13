import request, { CookieJar } from "@kyxzz/request";
import { load } from "cheerio";

const BASE_URL = "https://musicaldown.com";

export class MusicalDown {
  #session = request.extend({
    cookieJar: new CookieJar(),
    timeout: 30_000,
    retry: { limit: 2, methods: ["get", "post"] },
    headers: {
      "user-agent": "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36",
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
      "accept-language": "id-ID,id;q=0.9",
      "upgrade-insecure-requests": "1",
    },
  });

  async download(tiktokUrl) {
    const homeHtml = await this.#session.get(`${BASE_URL}/id`, { throwHttpErrors: false }).text();

    const $home = load(homeHtml);
    const form = $home("#submit-form");
    if (!form.length) throw new Error("Form not found");

    const body = new URLSearchParams();
    let urlFieldName = null;

    form.find("input").each((_, el) => {
      const name = $home(el).attr("name");
      const type = $home(el).attr("type") ?? "text";
      const value = $home(el).attr("value") ?? "";
      if (!name) return;
      if (type === "text") { urlFieldName = name; body.set(name, tiktokUrl); }
      else body.set(name, value);
    });

    if (!urlFieldName) throw new Error("URL input field not found");

    const resultHtml = await this.#session.post(`${BASE_URL}/id/download`, {
      body: body.toString(),
      headers: {
        "content-type": "application/x-www-form-urlencoded",
        origin: BASE_URL,
        referer: `${BASE_URL}/id`,
      },
      throwHttpErrors: false,
    }).text();

    const $ = load(resultHtml);

    if (!!$("#SlideButton").length) {
      const mp3Url = $('a.download[data-event="mp3_download_click"]').attr("href") ?? null;

      let sliderData = null;
      $("script").each((_, el) => {
        const m = ($(el).html() ?? "").match(/data:\s*["']([A-Za-z0-9+/=]+)["']/);
        if (m && !sliderData) {
          try { sliderData = JSON.parse(Buffer.from(m[1], "base64").toString()); } catch {}
        }
      });

      const photos = [];
      $(".card").each((_, card) => {
        const thumbnail = $(card).find(".card-image img").attr("src") ?? null;
        const downloadUrl = $(card).find(".card-action a[href]").attr("href") ?? null;
        if (thumbnail && downloadUrl) photos.push({ thumbnail, downloadUrl });
      });

      return { type: "slideshow", mp3Url, sliderData, photos };
    }

    const author = $(".video-author b").first().text().trim() || $(".video-author").first().text().trim() || null;
    const description = $(".video-desc").first().text().trim() || null;
    const thumbnail = $(".bg-overlay").first().attr("style")?.match(/url\(([^)]+)\)/)?.[1] ?? null;
    const avatar = $(".img-area img").first().attr("src") ?? null;

    const links = [];
    $("a.download[href], a[data-event][href]").each((_, el) => {
      const href = $(el).attr("href");
      const event = $(el).attr("data-event") ?? "";
      const label = $(el).text().replace(/\s+/g, " ").trim();
      if (!href?.startsWith("http") || href.includes("/id")) return;
      const src = (event + label).toLowerCase();
      const type = src.includes("mp3") ? "mp3" : src.includes("hd") ? "mp4_hd" : src.includes("watermark") ? "mp4_watermark" : "mp4";
      links.push({ label, url: href, type });
    });

    return { type: "video", author, description, thumbnail, avatar, links };
  }
}

const client = new MusicalDown();

// test 
const result = await client.download("https://vt.tiktok.com/ZSmsjEk1q/");
console.log(result);
