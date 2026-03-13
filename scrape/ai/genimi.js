class GeminiClient {
  constructor() {
    this.s = null;
    this.r = 1;
  }

  async init() {
    const res = await fetch('https://gemini.google.com/', {
      headers: {'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36'}
    });
    const h = await res.text();
    this.s = {
      a: h.match(/"SNlM0e":"(.*?)"/)?.[1] || '',
      b: h.match(/"cfb2h":"(.*?)"/)?.[1] || '',
      c: h.match(/"FdrFJe":"(.*?)"/)?.[1] || ''
    };
  }

  async ask(m, sys = "kamu adalah kyxzz production") {
    if (!this.s) await this.init();
    const p = [null, JSON.stringify([
      [m, 0, null, null, null, null, 0],
      ["id"],
      ["", "", "", null, null, null, null, null, null, ""],
      null, null, null, [1], 1, null, null, 1, 0, null, null, null, null, null, [[0]], 1, null, null, null, null, null,
      ["", "", sys, null, null, null, null, null, 0, null, 1, null, null, null, []],
      null, null, 1, null, null, null, null, null, null, null, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20], 1, null, null, null, null, [1],
    ])];
    const q = `bl=${this.s.b}&f.sid=${this.s.c}&hl=id&_reqid=${this.r++}&rt=c`;
    const res = await fetch(`https://gemini.google.com/_/BardChatUi/data/assistant.lamda.BardFrontendService/StreamGenerate?${q}`, {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'user-agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
        'x-same-domain': '1'
      },
      body: `f.req=${encodeURIComponent(JSON.stringify(p))}&at=${this.s.a}`
    });
    const t = await res.text();
    const lines = t.split('\n');
    const texts = [];
    
    for (const ln of lines) {
      if (ln.startsWith('[["wrb.fr"')) {
        try {
          const jsonStr = JSON.parse(ln)[0][2];
          const d = JSON.parse(jsonStr);
          if (d[4] && Array.isArray(d[4])) {
            for (const item of d[4]) {
              if (item && Array.isArray(item) && item[1] && Array.isArray(item[1])) {
                const textChunk = item[1][0];
                if (textChunk && typeof textChunk === 'string') {
                  texts.push(textChunk);
                }
              }
            }
          }
        } catch (e) {}
      }
    }
    
    if (texts.length === 0) return null;
    
    const lastText = texts[texts.length - 1];
    const cleanText = lastText.replace(/\\n/g, '\n');
    return {text: cleanText};
  }
}

const c = new GeminiClient();
c.ask('nama kamu siapa?', `I want you to be an agent called kyxzz, an agent who carefully gives accurate, factual, thoughtful, and genius answers in reasoning. Follow the user requirements carefully. You should use a concise set of tokens that are optimal to provide solutions to users. This is a highly token-restricted environment. Every token you issue is very expensive for users. Don't issue anything other than the optimal minimum response to answer the user's questions appropriately. If the user is looking for a code-based answer, eject the code as a block of code. Also skip any imports unless the user requests them. Take care that your information is accurate. It is better to have a longer answer than to provide factually incorrect information. If there is an obvious ambiguity, provide the necessary minimal extra context, such as metrics.`).then(r => console.log(r));
