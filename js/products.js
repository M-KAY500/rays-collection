/* =========================================================
   Ray's Collection — product catalog
   Products now live in Supabase (table: products) instead of
   localStorage, so changes made from the admin dashboard are
   visible to every visitor, on every device, immediately.
   ========================================================= */

const RC_PHONE = "0550031274";
const RC_PHONE_INTL = "+233550031274";
const RC_LOCATION = "Kasoa TopHill";
const RC_HOURS = "Mon – Fri, 7:00 am – 7:00 pm";
const RC_MAPS_URL = "https://www.google.com/maps/search/?api=1&query=RAY%27s%20Collection%20Top%20Hill%20Kasoa";

/* Used only by "Reset to Default Items" in the admin dashboard. */
const RC_DEFAULT_PRODUCTS = [
  { name: "NOW", brand: "Rave", category: "Unisex", price: "", description: "A bold, magnetic eau de parfum in a sleek geometric bottle — modern, confident, unforgettable.", image: "images/now-rave.jpg", inStock: true },
  { name: "Eclaire", brand: "Diese", category: "For Her", price: "", description: "Warm and radiant, with a soft golden trail that lingers — poured in a sculpted heart-shaped flacon.", image: "images/eclaire.jpg", inStock: true },
  { name: "Morning of Camellias", brand: "", category: "For Her", price: "", description: "A delicate floral opening inspired by camellia blossoms at first light — fresh, tender, elegant.", image: "images/morning-of-camellias.jpg", inStock: true },
  { name: "Paris Purple", brand: "", category: "For Her", price: "", description: "A rich, velvety fragrance wrapped in violet and amber notes — Parisian glamour in every spray.", image: "images/paris-purple.jpg", inStock: true },
  { name: "Noble Black", brand: "Hanna's Secret", category: "For Him", price: "", description: "Deep, distinguished and smoky — a signature scent for the man who commands a room.", image: "images/noble-black.jpg", inStock: true },
  { name: "Royal Seduction Secret", brand: "Hanna's Secret", category: "For Her", price: "", description: "Sensual and mysterious, built around dark florals and a whisper of spice.", image: "images/royal-seduction-secret.jpg", inStock: true },
  { name: "Elea", brand: "", category: "For Her", price: "", description: "A luminous, crystal-cut bottle holding a soft floral-fruity blend — light, graceful, timeless.", image: "images/elea.jpg", inStock: true },
  { name: "Club de Nuit Intense", brand: "Armaf", category: "For Him", price: "", description: "A cult-favourite oriental fragrance — intense, long-lasting and instantly recognisable.", image: "images/club-de-nuit-intense.jpg", inStock: true },
  { name: "Red Elve", brand: "Hanna's Secret", category: "Unisex", price: "", description: "A daring, spicy-sweet composition in a deep red box — for the bold at heart.", image: "images/red-elve.jpg", inStock: true },
  { name: "Bloom for Love", brand: "", category: "For Her", price: "", description: "A romantic bouquet of blooming petals — soft, pretty, and made for everyday elegance.", image: "images/bloom-for-love.jpg", inStock: true },
  { name: "Blue Snow Whisper", brand: "Vzyca", category: "For Her", price: "", description: "A cool, powdery floral in a violet-blue bottle — quiet, fresh and gently sweet.", image: "images/blue-snow-whisper.jpg", inStock: true },
  { name: "Vibrant Tulips", brand: "Vzyca", category: "For Her", price: "", description: "Cheerful and bright, wrapped in painted tulip artwork — a fresh floral pick-me-up.", image: "images/vibrant-tulips.jpg", inStock: true },
  { name: "Violet", brand: "", category: "For Her", price: "", description: "Soft purple florals and a hint of powder — gentle, romantic and easy to wear daily.", image: "images/violet.jpg", inStock: true },
  { name: "Royal", brand: "Hanna's Secret", category: "For Him", price: "", description: "A limited-edition blend in a rich amber bottle — warm, refined, and quietly luxurious.", image: "images/royal-hannas-secret.jpg", inStock: true },
  { name: "Hayati", brand: "Rafah", category: "Unisex", price: "", description: "Meaning 'my life' — a natural spray eau de parfum with a soft, comforting signature scent.", image: "images/hayati.jpg", inStock: true }
];

/* ---------- row <-> app-object mapping ----------
   DB columns are snake_case (in_stock); the rest of the app
   uses camelCase (inStock), so we translate at the boundary. */
function rcRowToProduct(row) {
  return {
    id: row.id,
    name: row.name,
    brand: row.brand || "",
    category: row.category || "",
    price: row.price || "",
    description: row.description || "",
    image: row.image || "",
    inStock: row.in_stock !== false
  };
}

function rcProductToRow(p) {
  return {
    name: p.name,
    brand: p.brand || null,
    category: p.category || null,
    price: p.price || null,
    description: p.description,
    image: p.image || null,
    in_stock: p.inStock !== false
  };
}

/* ---------- reads ---------- */
async function rcLoadProducts() {
  const { data, error } = await rcSupabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("rcLoadProducts:", error.message);
    return [];
  }
  return (data || []).map(rcRowToProduct);
}

/* ---------- writes (admin only — enforced by RLS) ---------- */
async function rcAddProduct(p) {
  const { data, error } = await rcSupabase
    .from("products")
    .insert(rcProductToRow(p))
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, product: rcRowToProduct(data) };
}

async function rcUpdateProduct(id, p) {
  const { data, error } = await rcSupabase
    .from("products")
    .update(rcProductToRow(p))
    .eq("id", id)
    .select()
    .single();
  if (error) return { ok: false, error: error.message };
  return { ok: true, product: rcRowToProduct(data) };
}

async function rcDeleteProduct(id) {
  const { error } = await rcSupabase.from("products").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/* Wipes the catalog and reloads it with the starting collection. */
async function rcResetProducts() {
  const { error: delErr } = await rcSupabase
    .from("products")
    .delete()
    .not("id", "is", null); // delete every row

  if (delErr) return { ok: false, error: delErr.message };

  const { error: insErr } = await rcSupabase
    .from("products")
    .insert(RC_DEFAULT_PRODUCTS.map(rcProductToRow));
  if (insErr) return { ok: false, error: insErr.message };

  return { ok: true };
}

/* ---------- image upload (Supabase Storage) ----------
   Uploads a File to the product-images bucket and returns its
   public URL, which is what gets stored in products.image. */
async function rcUploadProductImage(file) {
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
  const path = `${crypto.randomUUID()}.${ext}`;

  const { error } = await rcSupabase.storage
    .from(RC_IMAGE_BUCKET)
    .upload(path, file, { cacheControl: "3600", upsert: false });

  if (error) return { ok: false, error: error.message };

  const { data } = rcSupabase.storage.from(RC_IMAGE_BUCKET).getPublicUrl(path);
  return { ok: true, url: data.publicUrl };
}

/* ---------- helpers ---------- */
function rcEscape(str) {
  return String(str || "").replace(/[&<>"']/g, s => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[s]));
}

function rcCallHref() {
  return "tel:" + RC_PHONE_INTL;
}

/* Renders a product card. `product` is a plain object from Supabase. */
function rcProductCard(p) {
  const priceHtml = p.price
    ? `<span class="card-price">GH₵ ${rcEscape(p.price)}</span>`
    : `<span class="card-price tbc">Call for price</span>`;
  const img = p.image && p.image.trim() ? p.image : "images/logo.png";
  const outOfStock = p.inStock === false;
  return `
    <article class="card">
      <div class="card-media">
        ${p.category ? `<span class="card-tag">${rcEscape(p.category)}</span>` : ""}
        <img src="${rcEscape(img)}" alt="${rcEscape(p.name)} perfume by Ray's Collection" loading="lazy">
      </div>
      <div class="card-body">
        <span class="card-cat">${rcEscape(p.brand || "Ray's Collection")}</span>
        <h3 class="card-name">${rcEscape(p.name)}</h3>
        <p class="card-desc">${rcEscape(p.description)}</p>
        <div class="card-foot">
          ${outOfStock ? `<span class="badge out">Out of stock</span>` : priceHtml}
          <a class="call-link" href="${rcCallHref()}">Call to order</a>
        </div>
      </div>
    </article>`;
}

async function rcRenderGrid(containerId, options = {}) {
  const el = document.getElementById(containerId);
  if (!el) return;

  el.innerHTML = `<div class="empty-note">Loading fragrances…</div>`;

  let products = await rcLoadProducts();

  if (options.inStockOnly) {
    products = products.filter(p => p.inStock !== false);
  }
  if (options.category && options.category !== "all") {
    products = products.filter(p => (p.category || "").toLowerCase() === options.category.toLowerCase());
  }
  if (options.limit) {
    products = products.slice(0, options.limit);
  }

  if (products.length === 0) {
    el.innerHTML = `<div class="empty-note">No fragrances to show here yet — check back soon.</div>`;
    return;
  }
  el.innerHTML = products.map(rcProductCard).join("");
}
