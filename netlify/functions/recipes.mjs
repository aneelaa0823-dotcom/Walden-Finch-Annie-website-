// Public Recipe Box: everyone reads the published recipes; only the owner can change them.
// The owner password is the OWNER_PASSWORD environment variable in Netlify.
import { getStore } from "@netlify/blobs";

const json = (body, status = 200) =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

const store = () => getStore({ name: "recipe-box", consistency: "strong" });

function isOwner(req) {
  const want = Netlify.env.get("OWNER_PASSWORD") || "";
  const got = req.headers.get("x-owner-key") || "";
  if (!want || got.length !== want.length) return false;
  let diff = 0;
  for (let i = 0; i < want.length; i++) diff |= want.charCodeAt(i) ^ got.charCodeAt(i);
  return diff === 0;
}

export default async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const data = await store().get("public");
    return data ? json(data) : json({ error: "not published yet" }, 404);
  }

  if (!Netlify.env.get("OWNER_PASSWORD")) return json({ error: "owner password not set up" }, 503);
  if (!isOwner(req)) {
    await new Promise((r) => setTimeout(r, 800));
    return json({ error: "wrong password" }, 401);
  }

  if (req.method === "POST" && url.searchParams.has("check")) return json({ ok: true });

  if (req.method === "PUT") {
    const text = await req.text();
    if (text.length > 4500000) return json({ error: "too big" }, 413);
    let d;
    try {
      d = JSON.parse(text);
      if (!d || !Array.isArray(d.R)) throw 0;
    } catch (e) {
      return json({ error: "bad data" }, 400);
    }
    await store().set("public", JSON.stringify({ R: d.R, rt: d.rt || {}, del: d.del || {}, at: Date.now() }));
    return json({ ok: true });
  }

  return json({ error: "method" }, 405);
};

export const config = { path: "/api/recipes" };
