/* =========================================================
   Ray's Collection — admin dashboard logic (add / edit / remove)
   ========================================================= */

let rcEditingId = null;
let rcPendingImageFile = null; // holds a newly chosen File until saved
let rcPendingImagePreviewUrl = null; // local blob URL, just for the preview box

function rcFormatCount(n) {
  return n === 1 ? "1 item" : n + " items";
}

function rcRenderStats(products) {
  document.getElementById("stat-total").textContent = products.length;
  document.getElementById("stat-instock").textContent = products.filter(p => p.inStock !== false).length;
  document.getElementById("stat-outstock").textContent = products.filter(p => p.inStock === false).length;
}

let rcTableProducts = []; // cached so edit/delete don't need another round trip

async function rcRenderTable() {
  const tbody = document.getElementById("admin-tbody");
  const empty = document.getElementById("admin-empty");

  const products = await rcLoadProducts();
  rcTableProducts = products;
  rcRenderStats(products);

  if (products.length === 0) {
    tbody.innerHTML = "";
    empty.style.display = "block";
    return;
  }
  empty.style.display = "none";

  tbody.innerHTML = products.map(p => `
    <tr>
      <td><img class="thumb" src="${rcEscape(p.image || 'images/logo.png')}" alt=""></td>
      <td>
        <div class="p-name">${rcEscape(p.name)}</div>
        <div style="color:var(--cream-dim); font-size:.78rem;">${rcEscape(p.brand || "—")}</div>
      </td>
      <td>${rcEscape(p.category || "—")}</td>
      <td>${p.price ? "GH₵ " + rcEscape(p.price) : "Call for price"}</td>
      <td>${p.inStock === false ? '<span class="badge out">Out of stock</span>' : '<span class="badge in">In stock</span>'}</td>
      <td>
        <div class="row-actions">
          <button class="icon-btn" title="Edit" onclick="rcOpenEdit('${p.id}')">✎</button>
          <button class="icon-btn danger" title="Remove" onclick="rcConfirmDelete('${p.id}')">🗑</button>
        </div>
      </td>
    </tr>
  `).join("");
}

/* ---------- modal open/close ---------- */
function rcOpenAdd() {
  rcEditingId = null;
  rcPendingImageFile = null;
  rcPendingImagePreviewUrl = null;
  document.getElementById("modal-title").textContent = "Add New Fragrance";
  document.getElementById("f-name").value = "";
  document.getElementById("f-brand").value = "";
  document.getElementById("f-category").value = "";
  document.getElementById("f-price").value = "";
  document.getElementById("f-desc").value = "";
  document.getElementById("f-instock").checked = true;
  document.getElementById("f-image").value = "";
  rcSetPreview("");
  document.getElementById("modal-backdrop").classList.add("open");
}

function rcOpenEdit(id) {
  const p = rcTableProducts.find(x => x.id === id);
  if (!p) return;

  rcEditingId = id;
  rcPendingImageFile = null;
  rcPendingImagePreviewUrl = null;
  document.getElementById("modal-title").textContent = "Edit Fragrance";
  document.getElementById("f-name").value = p.name || "";
  document.getElementById("f-brand").value = p.brand || "";
  document.getElementById("f-category").value = p.category || "";
  document.getElementById("f-price").value = p.price || "";
  document.getElementById("f-desc").value = p.description || "";
  document.getElementById("f-instock").checked = p.inStock !== false;
  document.getElementById("f-image").value = "";
  rcSetPreview(p.image || "");
  document.getElementById("modal-backdrop").classList.add("open");
}

function rcCloseModal() {
  document.getElementById("modal-backdrop").classList.remove("open");
}

function rcSetPreview(src) {
  const box = document.getElementById("img-preview-box");
  if (src) {
    box.innerHTML = `<img src="${rcEscape(src)}" alt="">`;
  } else {
    box.innerHTML = `<span>No image selected</span>`;
  }
}

/* ---------- image selection (upload happens on save) ---------- */
document.addEventListener("DOMContentLoaded", () => {
  const fileInput = document.getElementById("f-image");
  if (fileInput) {
    fileInput.addEventListener("change", () => {
      const file = fileInput.files[0];
      if (!file) return;
      rcPendingImageFile = file;
      rcPendingImagePreviewUrl = URL.createObjectURL(file);
      rcSetPreview(rcPendingImagePreviewUrl);
    });
  }
});

/* ---------- save (add or update) ---------- */
async function rcSaveProduct(e) {
  e.preventDefault();

  const name = document.getElementById("f-name").value.trim();
  const brand = document.getElementById("f-brand").value.trim();
  const category = document.getElementById("f-category").value;
  const price = document.getElementById("f-price").value.trim();
  const description = document.getElementById("f-desc").value.trim();
  const inStock = document.getElementById("f-instock").checked;

  if (!name || !description) {
    alert("Please give the fragrance a name and a short description.");
    return;
  }

  const saveBtn = document.querySelector("#product-form button[type=submit]");
  saveBtn.disabled = true;
  saveBtn.textContent = "Saving…";

  try {
    let imageUrl = null;

    if (rcPendingImageFile) {
      const uploaded = await rcUploadProductImage(rcPendingImageFile);
      if (!uploaded.ok) {
        alert("Image upload failed: " + uploaded.error);
        return;
      }
      imageUrl = uploaded.url;
    }

    if (rcEditingId) {
      const existing = rcTableProducts.find(p => p.id === rcEditingId);
      const result = await rcUpdateProduct(rcEditingId, {
        name, brand, category, price, description, inStock,
        image: imageUrl || (existing ? existing.image : "")
      });
      if (!result.ok) {
        alert("Couldn't save changes: " + result.error);
        return;
      }
    } else {
      const result = await rcAddProduct({
        name, brand, category, price, description, inStock,
        image: imageUrl || "images/logo.png"
      });
      if (!result.ok) {
        alert("Couldn't add fragrance: " + result.error);
        return;
      }
    }

    rcCloseModal();
    await rcRenderTable();
  } finally {
    saveBtn.disabled = false;
    saveBtn.textContent = "Save Fragrance";
  }
}

/* ---------- delete ---------- */
async function rcConfirmDelete(id) {
  const p = rcTableProducts.find(x => x.id === id);
  if (!p) return;
  if (!confirm(`Remove "${p.name}" from the catalog? This cannot be undone.`)) return;

  const result = await rcDeleteProduct(id);
  if (!result.ok) {
    alert("Couldn't remove item: " + result.error);
    return;
  }
  await rcRenderTable();
}
