const page = document.documentElement.dataset.page;
const currentPath = window.location.pathname.toLowerCase();

document.querySelectorAll(".site-nav").forEach((nav) => {
  if (!nav.querySelector('[data-nav="cart"]')) {
    const cartLink = document.createElement("a");
    cartLink.href = "cart.html";
    cartLink.dataset.nav = "cart";
    cartLink.className = "cart-nav-link";
    cartLink.innerHTML = `Carrinho <span class="cart-nav-count" id="cart-nav-count">0</span>`;
    nav.appendChild(cartLink);
  }
});

document.querySelectorAll("[data-nav]").forEach((link) => {
  const isCartPage = currentPath.endsWith("/cart.html") || currentPath.endsWith("/checkout.html");
  if (link.dataset.nav === page || (isCartPage && link.dataset.nav === "cart")) {
    link.classList.add("is-active");
  }
});

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector(".site-nav");

if (menuToggle && siteNav) {
  menuToggle.addEventListener("click", () => {
    const open = siteNav.classList.toggle("is-open");
    menuToggle.setAttribute("aria-expanded", String(open));
  });
}

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("is-visible");
    }
  });
}, { threshold: 0.14 });

document.querySelectorAll(".reveal").forEach((item) => observer.observe(item));

const trackTitle = document.getElementById("track-title");
const trackMeta = document.getElementById("track-meta");
const trackDescription = document.getElementById("track-description");
const trackLink = document.getElementById("track-link");
const trackButtons = document.querySelectorAll(".track-chip");

trackButtons.forEach((button) => {
  button.addEventListener("click", () => {
    trackButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    if (trackTitle) trackTitle.textContent = button.dataset.trackTitle || "";
    if (trackMeta) trackMeta.textContent = button.dataset.trackMeta || "";
    if (trackDescription) trackDescription.textContent = button.dataset.trackDescription || "";
    if (trackLink) trackLink.href = button.dataset.trackLink || "#";
  });
});

const filterButtons = document.querySelectorAll(".filter-chip");
const releaseCards = document.querySelectorAll("[data-release]");

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;
    filterButtons.forEach((item) => item.classList.remove("is-active"));
    button.classList.add("is-active");
    releaseCards.forEach((card) => {
      const show = filter === "all" || card.dataset.release === filter;
      card.classList.toggle("is-hidden", !show);
    });
  });
});

const CART_KEY = "saori_kido_cart";

function loadCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "[]");
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function formatBRL(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getCartTotal(cart) {
  return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function upsertCartItem(product, mode = "add") {
  const cart = loadCart();
  const existing = cart.find((item) => item.id === product.id);

  if (existing) {
    existing.quantity = mode === "buy-now" ? existing.quantity + 1 : existing.quantity + 1;
  } else {
    cart.push({ ...product, quantity: 1 });
  }

  saveCart(cart);
}

function changeQuantity(id, delta) {
  const cart = loadCart()
    .map((item) => item.id === id ? { ...item, quantity: item.quantity + delta } : item)
    .filter((item) => item.quantity > 0);

  saveCart(cart);
  renderCartPage();
  renderCheckoutPage();
}

function clearCart() {
  saveCart([]);
  renderCartPage();
  renderCheckoutPage();
}

function cartItemTemplate(item) {
  return `
    <article class="cart-item panel reveal is-visible">
      <img src="${item.image}" alt="${item.name}">
      <div class="cart-copy">
        <h3>${item.name}</h3>
        <p>${item.variant}</p>
        <p class="price">${formatBRL(item.price * item.quantity)}</p>
        <div class="qty-row">
          <button class="qty-btn" type="button" data-qty-action="decrease" data-id="${item.id}">-</button>
          <span>${item.quantity}</span>
          <button class="qty-btn" type="button" data-qty-action="increase" data-id="${item.id}">+</button>
        </div>
      </div>
    </article>
  `;
}

function checkoutItemTemplate(item) {
  return `
    <article class="checkout-item">
      <img src="${item.image}" alt="${item.name}">
      <div>
        <h3>${item.name}</h3>
        <p>Quantity: ${item.quantity}</p>
        <p class="price">${formatBRL(item.price * item.quantity)}</p>
      </div>
    </article>
  `;
}

function renderCartPage() {
  const cartList = document.getElementById("cart-list");
  const cartTotal = document.getElementById("cart-total");
  const checkoutButton = document.getElementById("cart-checkout-button");
  const emptyButton = document.getElementById("empty-cart-button");
  if (!cartList || !cartTotal) return;

  const cart = loadCart();
  cartList.innerHTML = cart.length
    ? cart.map(cartItemTemplate).join("")
    : `<div class="panel cart-empty is-visible"><h3>Seu carrinho esta vazio.</h3><p>Adicione produtos para continuar.</p></div>`;

  cartTotal.textContent = formatBRL(getCartTotal(cart));

  if (checkoutButton) {
    checkoutButton.style.pointerEvents = cart.length ? "auto" : "none";
    checkoutButton.style.opacity = cart.length ? "1" : "0.5";
  }

  if (emptyButton) {
    emptyButton.style.display = cart.length ? "inline-flex" : "none";
  }

  cartList.querySelectorAll("[data-qty-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      const delta = button.dataset.qtyAction === "increase" ? 1 : -1;
      changeQuantity(id, delta);
    });
  });

  if (emptyButton) {
    emptyButton.onclick = () => clearCart();
  }

  updateCartNavCount();
}

function renderCheckoutPage() {
  const checkoutItems = document.getElementById("checkout-items");
  const subtotal = document.getElementById("checkout-subtotal");
  const total = document.getElementById("checkout-total");
  if (!checkoutItems || !subtotal || !total) return;

  const cart = loadCart();
  checkoutItems.innerHTML = cart.length
    ? cart.map(checkoutItemTemplate).join("")
    : `<div class="panel cart-empty is-visible"><h3>Nenhum item no checkout.</h3><p>Volte para a loja e adicione produtos.</p></div>`;

  const cartTotal = formatBRL(getCartTotal(cart));
  subtotal.textContent = cartTotal;
  total.textContent = cartTotal;

  updateCartNavCount();
}

function updateCartNavCount() {
  const count = loadCart().reduce((sum, item) => sum + item.quantity, 0);
  document.querySelectorAll("#cart-nav-count").forEach((badge) => {
    badge.textContent = String(count);
  });
}

document.querySelectorAll("[data-cart-action]").forEach((button) => {
  button.addEventListener("click", (event) => {
    event.preventDefault();
    const product = {
      id: button.dataset.productId || "",
      name: button.dataset.productName || "",
      variant: button.dataset.productVariant || "",
      price: Number(button.dataset.productPrice || "0"),
      image: button.dataset.productImage || "",
    };

    upsertCartItem(product, button.dataset.cartAction);
    window.location.href = button.getAttribute("href") || "cart.html";
  });
});

renderCartPage();
renderCheckoutPage();
updateCartNavCount();
