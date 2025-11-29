async function searchIngredients(req, res) {
  try {
    const q = (req.query.q || "").trim();
    if (q.length < 2) return res.json({ items: [] });

    const apiKey = process.env.SPOONACULAR_KEY;
    if (!apiKey) {
      console.warn("[/api/ingredients] Missing SPOONACULAR_KEY");
      return res.json({ items: [] });
    }

    const url = new URL("https://api.spoonacular.com/food/ingredients/autocomplete");
    url.searchParams.set("query", q);
    url.searchParams.set("number", "8");
    url.searchParams.set("metaInformation", "true");
    url.searchParams.set("apiKey", apiKey);

    const r = await fetch(url, { headers: { Accept: "application/json" } });
    if (r.status === 429) return res.status(429).json({ error: "Rate limited" });
    if (!r.ok)      return res.status(r.status).json({ error: "Upstream error" });

    const data = await r.json(); // array
    const items = (data || []).map(d => ({
      id: d.id,
      name: d.name,
      aisle: d.aisle || "",
      image: d.image ? `https://spoonacular.com/cdn/ingredients_100x100/${d.image}` : "",
    }));

    res.json({ items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "search failed" });
  }
}

module.exports = { searchIngredients };
