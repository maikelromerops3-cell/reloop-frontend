import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { Search, Plus, X, MessageCircle, Heart, Zap, User, Star, Mail, Lock, ImagePlus, Tag, Trash2, CheckCircle, Leaf, MapPin, HandCoins, UserPlus, UserCheck, Send, Trophy, Pencil, Bell, Settings, ShoppingBag, RefreshCw, LayoutGrid, Shirt, Footprints, Watch, TrendingDown, Share2, PackageOpen, Truck, Package } from "lucide-react";
import {
  fetchItems, createItem, updateItem, deleteItem,
  login as apiLogin, register as apiRegister, logout as apiLogout, isLoggedIn, getUsername,
  fetchFavorites, addFavorite, removeFavorite, uploadImage,
  connectStripe, fetchStripeStatus, startCheckout,
  fetchTransactions, createShipmentLabel, confirmReceived, submitReview,
  forgotPassword, resetPassword, verifyEmail, resendVerification,
  fetchChatMessages, sendChatMessage as sendChatMessage_,
  fetchNotifications, markAllNotificationsRead,
  disputeTransaction,
} from "./api";

const CATEGORY_ICONS = { "Todo": LayoutGrid, "Moda": Shirt, "Electrónica": Zap, "Hogar": PackageOpen, "Deporte": Footprints, "Juguetes y ocio": Watch, "Otros": Tag };
const CATEGORIES = ["Todo", "Moda", "Electrónica", "Hogar", "Deporte", "Juguetes y ocio", "Otros"];
const SIZES = ["XS", "S", "M", "L", "XL"];
const SHOE_SIZES = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];
const PALETTE = ["#FF4D6D", "#4DE1C1", "#FFC24D", "#8C7CFF", "#4DA8FF", "#FF8A4D"];

const AUTH_PAGE_STYLES = `
  * { box-sizing: border-box; }
  body { margin: 0; }
  .app { background: #121214; font-family: 'Helvetica Neue', Arial, sans-serif; color: #F2F2F0; }
  .modal { background: #1A1A1E; border: 1px solid #29292f; border-radius: 22px; max-width: 380px; width: 100%; padding: 30px 26px; margin: 20px; }
  .auth-title { font-family: Georgia, serif; font-size: 20px; font-weight: 700; margin: 0 0 18px; text-align: center; }
  label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 14px 0 5px; color: #9A9AA3; }
  .input-icon { display: flex; align-items: center; gap: 8px; border: 1px solid #333; border-radius: 12px; padding: 0 12px; background: #121214; }
  .input-icon svg { color: #6A6A73; flex-shrink: 0; }
  .input-icon input { border: none; padding: 10px 0; background: transparent; color: #F2F2F0; font-family: inherit; font-size: 13px; width: 100%; outline: none; }
  .submit-btn { margin-top: 20px; width: 100%; background: linear-gradient(135deg, #FF4D6D, #FF8A4D); color: #121214; border: none; border-radius: 14px; padding: 13px; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; }
  .offer-sent { display: flex; flex-direction: column; align-items: center; gap: 10px; text-align: center; font-weight: 700; }
  .spin { animation: spin 1s linear infinite; }
  @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
`;

function timeAgo(minutes) {
  if (minutes < 60) return `hace ${minutes} min`;
  if (minutes < 1440) return `hace ${Math.floor(minutes / 60)} h`;
  return `hace ${Math.floor(minutes / 1440)} d`;
}

function timeAgoFromDate(dateString) {
  const minutes = Math.max(0, Math.floor((Date.now() - new Date(dateString).getTime()) / 60000));
  return timeAgo(minutes);
}

// Pequeña espera artificial, solo para las funciones que aún no tienen backend propio (oferta, checkout)
function wait(ms = 400) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Convierte un artículo tal como lo devuelve el backend al formato que usa la interfaz
function normalizeItem(raw) {
  const minutesAgo = raw.createdAt ? Math.max(0, Math.floor((Date.now() - new Date(raw.createdAt).getTime()) / 60000)) : 0;
  return {
    ...raw,
    price: Number(raw.price),
    seller: raw.seller?.username || raw.seller || raw.sellerId,
    photo: raw.images && raw.images.length ? raw.images[0] : `https://picsum.photos/seed/${raw.id}/500/500`,
    minutesAgo,
    city: raw.city || null,
    verified: raw.verified || false,
    featured: raw.featured || false,
  };
}

function ItemCard({ item, onOpen, index, saved, toggleSave }) {
  const tall = index % 3 === 0; // efecto masonry: cada 3 tarjetas, una más alta
  return (
    <div className={"card" + (tall ? " tall" : "")} onClick={() => onOpen(item)}>
      <div className="card-media" style={{ backgroundImage: `url(${item.photo})` }}>
        {item.minutesAgo < 30 && <span className="new-ribbon">Nuevo</span>}
        {item.featured && <span className="featured-ribbon" style={{ top: item.minutesAgo < 30 ? 38 : 10 }}>Destacado</span>}
        <button className={"heart" + (saved ? " on" : "")} onClick={(e) => { e.stopPropagation(); toggleSave(item.id); }}>
          <Heart size={16} fill={saved ? "#FF4D6D" : "none"} color={saved ? "#FF4D6D" : "#fff"} />
        </button>
        <span className="price-pill">{item.price}€</span>
      </div>
      <div className="card-info">
        <h3>{item.title}{item.verified && <CheckCircle size={12} color="#4DE1C1" style={{ marginLeft: 5, verticalAlign: -1 }} />}</h3>
        <p>{item.size ? `${item.size} · ` : ""}{item.condition}</p>
        <p className="card-city"><MapPin size={10} /> {item.city ? `${item.city} · ` : ""}{timeAgo(item.minutesAgo)}</p>
      </div>
    </div>
  );
}

export default function ReloopStreet() {
  const params = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const resetToken = searchParams.get("token");
  const isResetPasswordPage = location.pathname === "/restablecer-contrasena";
  const isVerifyEmailPage = location.pathname === "/verificar-email";

  const [newPassword, setNewPassword] = useState("");
  const [resetDone, setResetDone] = useState(false);
  const [resetError, setResetError] = useState(null);
  const [verifyStatus, setVerifyStatus] = useState("loading"); // loading | ok | error

  useEffect(() => {
    if (isVerifyEmailPage && resetToken) {
      verifyEmail(resetToken).then(() => setVerifyStatus("ok")).catch(() => setVerifyStatus("error"));
    }
  }, [isVerifyEmailPage, resetToken]);

  async function handleResetPassword(e) {
    e.preventDefault();
    setResetError(null);
    try {
      await resetPassword(resetToken, newPassword);
      setResetDone(true);
    } catch (err) {
      setResetError(err.message);
    }
  }

  const [allItems, setAllItems] = useState([]);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Para ti");
  const [following, setFollowing] = useState(new Set());
  const [showOffer, setShowOffer] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showLeague, setShowLeague] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [stripeStatus, setStripeStatus] = useState(null);
  const [showOrders, setShowOrders] = useState(false);
  const [orders, setOrders] = useState({ purchases: [], sales: [] });
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [reviewingTx, setReviewingTx] = useState(null); // transacción que se está valorando
  const [disputingTx, setDisputingTx] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");

  async function handleSubmitDispute(e) {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    try {
      await disputeTransaction(disputingTx.id, disputeReason);
      toast.success("Reembolso solicitado, lo revisaremos en breve");
      setDisputingTx(null);
      setDisputeReason("");
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    }
  }
  const [reviewStars, setReviewStars] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  const [editingItem, setEditingItem] = useState(null);
  const [showLegal, setShowLegal] = useState(null); // "terms" | "privacy" | "cookies" | null
  const [showCookieBanner, setShowCookieBanner] = useState(!localStorage.getItem("reloop_cookies_accepted"));
  const [notifications, setNotifications] = useState([]);
  const [duelVote, setDuelVote] = useState(null);
  const LEADERBOARD = [
    { rank: 1, username: "denia.k", city: "Sevilla", points: 1240 },
    { rank: 2, username: "marina_v", city: "Madrid", points: 1180 },
    { rank: 3, username: "nico_thrift", city: "Barcelona", points: 990 },
    { rank: 4, username: "clara.rt", city: "Valencia", points: 860 },
  ];
  const DUEL = {
    a: { seller: "marina_v", title: "Cazadora vaquera Levi's", votes: 58 },
    b: { seller: "denia.k", title: "Zapatillas Gazelle 39", votes: 42 },
  };
  const [chatItem, setChatItem] = useState(null);
  const [chatThreads, setChatThreads] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerSent, setOfferSent] = useState(false);
  const [showPost, setShowPost] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [openItem, setOpenItem] = useState(null);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [saved, setSaved] = useState(new Set());
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [username, setUsername] = useState(getUsername());

  useEffect(() => {
    if (showSettings && loggedIn) {
      fetchStripeStatus().then(setStripeStatus).catch(() => {});
    }
  }, [showSettings, loggedIn]);

  useEffect(() => {
    if (showNotifs && loggedIn) {
      fetchNotifications().then(setNotifications).catch(() => {});
    }
  }, [showNotifs, loggedIn]);

  async function handleOpenNotifs() {
    setShowNotifs(true);
    if (notifications.some((n) => !n.read)) {
      try {
        await markAllNotificationsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } catch {}
    }
  }

  const loadOrders = useCallback(async () => {
    if (!loggedIn) return;
    setOrdersLoading(true);
    try {
      const data = await fetchTransactions();
      setOrders(data);
    } catch {
      toast.error("No se pudieron cargar tus pedidos");
    } finally {
      setOrdersLoading(false);
    }
  }, [loggedIn]);

  useEffect(() => {
    if (showOrders) loadOrders();
  }, [showOrders, loadOrders]);

  async function handleGenerateLabel(transactionId) {
    try {
      await createShipmentLabel(transactionId);
      toast.success("Etiqueta de envío generada");
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleConfirmReceived(transactionId) {
    try {
      await confirmReceived(transactionId);
      toast.success("Recepción confirmada");
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    try {
      await submitReview(reviewingTx.otherUsername, reviewStars, reviewComment);
      toast.success("¡Gracias por tu valoración!");
      setReviewingTx(null);
      setReviewStars(5);
      setReviewComment("");
    } catch (err) {
      toast.error(err.message);
    }
  }

  const [avatarColor] = useState(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
  const [showProfile, setShowProfile] = useState(false);
  const [profileTab, setProfileTab] = useState("venta");
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [soldItems] = useState([
    { id: "s001", title: "Abrigo de paño", price: 32 },
    { id: "s002", title: "Botas Chelsea", price: 24 },
  ]);
  const [form, setForm] = useState({ title: "", category: "Moda", size: "", isShoe: false, price: "", description: "", condition: "Bueno", images: [] });
  const [uploadingImages, setUploadingImages] = useState([]);
  const [authForm, setAuthForm] = useState({ email: "", password: "", username: "" });
  const [authMode, setAuthMode] = useState("login");
  const [authError, setAuthError] = useState(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotError, setForgotError] = useState(null);

  async function handleForgotPassword(e) {
    e.preventDefault();
    setForgotError(null);
    try {
      await forgotPassword(forgotEmail);
      setForgotSent(true);
    } catch (err) {
      setForgotError(err.message);
    }
  }
  const [postError, setPostError] = useState(null);

  // Carga todos los artículos disponibles desde el backend real
  const loadAllItems = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchItems({});
      setAllItems(data.map(normalizeItem));
    } catch (err) {
      setLoadError("No se pudo conectar con el servidor. Comprueba que el backend (npm run dev) está corriendo en el puerto 4000.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAllItems();
  }, [loadAllItems]);

  // Carga los favoritos guardados del usuario al iniciar sesión
  useEffect(() => {
    if (!loggedIn) { setSaved(new Set()); return; }
    fetchFavorites()
      .then((favs) => setSaved(new Set(favs.map((f) => f.id))))
      .catch(() => {});
  }, [loggedIn]);

  // Filtra en el cliente sobre la lista ya cargada del backend (búsqueda y categoría)
  useEffect(() => {
    const filtered = allItems.filter((it) => {
      const matchQuery = it.title.toLowerCase().includes(query.toLowerCase());
      const matchCat = category === "Todo" || category === "Para ti" || it.category === category;
      return matchQuery && matchCat;
    });
    setItems(filtered);
  }, [allItems, query, category]);

  // Al entrar a la web, si no has iniciado sesión, se muestra el login/registro automáticamente
  useEffect(() => {
    if (!loggedIn) setShowAuth(true);
  }, []);

  // Enlaces directos: si la URL es /item/:id o /perfil/:username, abre lo que corresponda
  useEffect(() => {
    if (params.id && allItems.length) {
      const found = allItems.find((i) => i.id === params.id);
      if (found) setOpenItem(found);
    }
  }, [params.id, allItems]);

  useEffect(() => {
    if (params.username) setShowProfile(true);
  }, [params.username]);

  // Abrir/cerrar el detalle de un artículo actualizando también la URL (para poder compartir el enlace)
  function viewItem(item) {
    setOpenItem(item);
    setGalleryIndex(0);
    navigate(`/item/${item.id}`);
  }
  function closeItemView() {
    setOpenItem(null);
    navigate("/");
  }
  function viewProfile() {
    setShowProfile(true);
    navigate(`/perfil/${username}`);
  }
  function closeProfileView() {
    setShowProfile(false);
    navigate("/");
  }

  async function toggleSave(id) {
    if (!loggedIn) { setShowAuth(true); return; }
    const isSaved = saved.has(id);
    setSaved((prev) => {
      const next = new Set(prev);
      isSaved ? next.delete(id) : next.add(id);
      return next;
    });
    try {
      isSaved ? await removeFavorite(id) : await addFavorite(id);
      toast(isSaved ? "Quitado de favoritos" : "Guardado en favoritos", { icon: isSaved ? "💔" : "❤️" });
    } catch {
      // si falla la llamada, revertimos el cambio visual
      setSaved((prev) => {
        const next = new Set(prev);
        isSaved ? next.add(id) : next.delete(id);
        return next;
      });
      toast.error("No se pudo actualizar favoritos");
    }
  }

  function toggleFollow(seller) {
    if (!loggedIn) { setShowAuth(true); return; }
    setFollowing((prev) => {
      const next = new Set(prev);
      next.has(seller) ? next.delete(seller) : next.add(seller);
      return next;
    });
  }

  async function openChat(item) {
    if (!loggedIn) { setShowAuth(true); return; }
    setChatItem(item);
    setOpenItem(null);
    setShowChat(true);
    try {
      const messages = await fetchChatMessages(item.id);
      setChatThreads((prev) => ({ ...prev, [item.id]: messages }));
    } catch {
      toast.error("No se pudo cargar la conversación");
    }
  }

  async function sendChatMessage(e) {
    e.preventDefault();
    if (!chatInput.trim() || !chatItem) return;
    const itemId = chatItem.id;
    const content = chatInput;
    setChatInput("");
    try {
      const message = await sendChatMessage_(itemId, content);
      setChatThreads((prev) => ({ ...prev, [itemId]: [...(prev[itemId] || []), message] }));
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function sendOffer(e) {
    e.preventDefault();
    await wait(400);
    setOfferSent(true);
    setTimeout(() => { setShowOffer(false); setOfferSent(false); setOfferAmount(""); }, 1400);
  }

  function startEdit(item) {
    setEditingItem(item);
    setForm({ title: item.title, category: item.category, size: item.size || "", isShoe: !!(item.size && SHOE_SIZES.includes(item.size)), price: String(item.price), description: item.description || "", condition: item.condition, images: item.images || [] });
    setShowProfile(false);
    setShowPost(true);
  }

  async function handleImageSelect(e) {
    const files = Array.from(e.target.files || []).slice(0, 6 - form.images.length);
    e.target.value = ""; // permite volver a seleccionar el mismo archivo si se quita y se vuelve a añadir

    for (const file of files) {
      const tempId = `uploading-${Math.random()}`;
      setUploadingImages((prev) => [...prev, tempId]);
      try {
        const url = await uploadImage(file);
        setForm((prev) => ({ ...prev, images: [...prev.images, url] }));
      } catch (err) {
        toast.error(err.message || "No se pudo subir la foto");
      } finally {
        setUploadingImages((prev) => prev.filter((id) => id !== tempId));
      }
    }
  }

  function removeImage(index) {
    setForm((prev) => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  }

  async function deleteOwnItem(id) {
    setAllItems((prev) => prev.filter((i) => i.id !== id)); // optimista
    try {
      await deleteItem(id);
      toast("Prenda eliminada");
    } catch {
      loadAllItems(); // si falla, recargamos la lista real para no dejar el estado inconsistente
      toast.error("No se pudo eliminar");
    }
  }

  const [checkoutError, setCheckoutError] = useState(null);

  async function confirmCheckout() {
    setCheckoutError(null);
    try {
      const url = await startCheckout(openItem.id);
      window.location.href = url; // redirige a la pasarela de pago de Stripe
    } catch (err) {
      setCheckoutError(err.message);
    }
  }

  async function handleConnectStripe() {
    try {
      const url = await connectStripe();
      window.location.href = url; // redirige a Stripe para completar el alta como vendedor
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function removeItem(id) {
    // Borrado por admin: usa el mismo endpoint de borrado del dueño por ahora (el endpoint /admin requiere rol admin real en la BD)
    setAllItems((prev) => prev.filter((i) => i.id !== id));
    setOpenItem(null);
    try {
      await deleteItem(id);
      toast("Publicación eliminada");
    } catch {
      loadAllItems();
      toast.error("No se pudo eliminar");
    }
  }

  async function handlePublish(e) {
    e.preventDefault();
    setPostError(null);
    if (!loggedIn) { setShowPost(false); setShowAuth(true); return; }
    if (!form.title || !form.price) { setPostError("Rellena al menos el título y el precio."); return; }
    if (form.category === "Moda" && !form.size) { setPostError("Elige una talla para artículos de Moda."); return; }

    const payload = {
      title: form.title,
      category: form.category,
      size: form.category === "Moda" ? form.size : null,
      price: Number(form.price),
      description: form.description,
      condition: form.condition,
      images: form.images,
    };

    try {
      if (editingItem) {
        await updateItem(editingItem.id, payload);
        toast.success("Cambios guardados");
      } else {
        await createItem(payload);
        toast.success("¡Prenda publicada!");
      }
      await loadAllItems(); // recargamos desde el backend para tener los datos reales (id, fecha, vendedor...)
      setEditingItem(null);
      setForm({ title: "", category: "Moda", size: "", isShoe: false, price: "", description: "", condition: "Bueno", images: [] });
      setShowPost(false);
    } catch (err) {
      setPostError(err.message);
    }
  }

  async function handleAuth(e) {
    e.preventDefault();
    setAuthError(null);
    try {
      const result = authMode === "login"
        ? await apiLogin(authForm.email, authForm.password)
        : await apiRegister(authForm.email, authForm.password, authForm.username);
      setUsername(result.username);
      setLoggedIn(true);
      setShowAuth(false);
      setAuthForm({ email: "", password: "", username: "" });
      toast.success(authMode === "login" ? `¡Bienvenido, @${result.username}!` : "¡Cuenta creada!");
    } catch (err) {
      setAuthError(err.message);
    }
  }

  if (isResetPasswordPage) {
    return (
      <div className="app" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <style>{AUTH_PAGE_STYLES}</style>
        <div className="modal auth-modal" style={{ position: "static" }}>
          {resetDone ? (
            <div className="offer-sent">
              <CheckCircle size={26} color="#4DE1C1" />
              <p>¡Contraseña actualizada!</p>
              <button className="submit-btn" onClick={() => navigate("/")}>Ir a Reloop</button>
            </div>
          ) : (
            <>
              <p className="auth-title">Elige una contraseña nueva</p>
              <form onSubmit={handleResetPassword}>
                <label>Nueva contraseña</label>
                <div className="input-icon">
                  <Lock size={14} />
                  <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••••" />
                </div>
                {resetError && <p style={{ color: "#FF4D6D", fontSize: 12, marginTop: 10 }}>{resetError}</p>}
                <button className="submit-btn" type="submit">Guardar contraseña</button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  if (isVerifyEmailPage) {
    return (
      <div className="app" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <style>{AUTH_PAGE_STYLES}</style>
        <div className="modal auth-modal" style={{ position: "static" }}>
          <div className="offer-sent">
            {verifyStatus === "loading" && <><RefreshCw size={26} color="#9A9AA3" className="spin" /><p>Verificando...</p></>}
            {verifyStatus === "ok" && <><CheckCircle size={26} color="#4DE1C1" /><p>¡Email confirmado!</p></>}
            {verifyStatus === "error" && <><X size={26} color="#FF4D6D" /><p>Enlace no válido o caducado</p></>}
            <button className="submit-btn" onClick={() => navigate("/")}>Ir a Reloop</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: { background: "#1A1A1E", color: "#F2F2F0", border: "1px solid #29292f", fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: "13px" },
          success: { iconTheme: { primary: "#4DE1C1", secondary: "#1A1A1E" } },
          error: { iconTheme: { primary: "#FF4D6D", secondary: "#1A1A1E" } },
        }}
      />
      <style>{`
        * { box-sizing: border-box; }
        html, body { overflow-x: hidden; margin: 0; }
        .app { min-height: 100vh; max-width: 100vw; overflow-x: hidden; background: #121214; color: #F2F2F0; font-family: 'Helvetica Neue', Arial, sans-serif; }
        header.top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; row-gap: 10px; padding: 16px 20px; position: sticky; top: 0; background: #121214ee; backdrop-filter: blur(6px); z-index: 5; }
        .brand { display: flex; align-items: center; gap: 8px; }
        .brand-mark { width: 30px; height: 30px; border-radius: 9px; background: linear-gradient(135deg, #FF4D6D, #8C7CFF); display: flex; align-items: center; justify-content: center; }
        .brand h1 { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; margin: 0; text-transform: lowercase; }
        .top-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
        .badge { font-size: 12px; background: #1F1F24; border: 1px solid #333; padding: 6px 12px; border-radius: 20px; color: #4DE1C1; }
        .profile-badge { display: flex; align-items: center; gap: 6px; cursor: pointer; color: #F2F2F0; }
        .mini-avatar { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: #121214; }
        .profile-modal { max-width: 400px; padding: 0; }
        .profile-banner { height: 100px; position: relative; overflow: hidden; border-radius: 22px 22px 0 0; }
        .banner-texture { position: absolute; inset: 0; background-image: radial-gradient(#ffffff22 1px, transparent 1px); background-size: 10px 10px; }
        .profile-content { padding: 0 22px 24px; text-align: center; margin-top: -44px; }
        .profile-avatar-lg { width: 84px; height: 84px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; color: #121214; margin: 0 auto 10px; border: 4px solid #1A1A1E; box-shadow: 0 0 0 2px #29292f; }
        .profile-name { font-size: 18px; font-weight: 700; margin: 0; }
        .profile-sub { font-size: 12px; color: #9A9AA3; margin: 4px 0 14px; display: flex; align-items: center; justify-content: center; gap: 4px; }
        .profile-quick-actions { display: flex; justify-content: center; gap: 8px; margin: 4px 0 16px; }
        .edit-profile-btn { border: 1px solid #333; background: #1F1F24; color: #C8C8CE; border-radius: 20px; padding: 7px 16px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .details-toggle { border: none; background: none; color: #4DE1C1; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .profile-details { text-align: left; margin-bottom: 6px; animation: fadeIn .15s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .edit-profile-btn:hover { border-color: #4DE1C1; color: #4DE1C1; }
        .stats-row { display: flex; gap: 10px; margin-bottom: 18px; }
        .stat-box { flex: 1; background: #121214; border: 1px solid #29292f; border-radius: 14px; padding: 14px 10px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .stat-box strong { display: block; font-size: 18px; }
        .stat-box span { font-size: 10px; color: #9A9AA3; text-transform: uppercase; letter-spacing: .5px; }
        .profile-tabs { margin-bottom: 16px; }
        .empty-tab { font-size: 12px; color: #6A6A73; padding: 20px 0; }
        .mini-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; text-align: left; }
        .mini-card { background: #121214; border: 1px solid #29292f; border-radius: 14px; overflow: hidden; cursor: pointer; transition: transform .12s ease, border-color .12s ease; }
        .mini-card:hover { transform: translateY(-2px); border-color: #4DE1C155; }
        .profile-section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9A9AA3; margin: 4px 0 10px; }
        .mini-card.sold { opacity: 0.6; }
        .mini-swatch { height: 60px; }
        .mini-title { font-size: 12px; font-weight: 600; margin: 8px 10px 2px; }
        .mini-price { font-size: 12px; font-weight: 700; color: #4DE1C1; margin: 0 10px 10px; }
        .btn { display: flex; align-items: center; gap: 6px; border: none; border-radius: 20px; padding: 10px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .btn.primary { background: linear-gradient(135deg, #FF4D6D, #FF8A4D); color: #121214; }
        .btn.ghost { background: #1F1F24; color: #F2F2F0; border: 1px solid #333; }
        .admin-toggle { display: flex; align-items: center; gap: 6px; border: 1px solid #333; background: #1F1F24; color: #9A9AA3; border-radius: 20px; padding: 9px 14px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .admin-toggle.on { background: linear-gradient(135deg, #8C7CFF, #4DA8FF); color: #121214; border-color: transparent; }
        .admin-delete-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-top: 10px; border: 1px solid #FF4D6D55; background: #FF4D6D15; color: #FF4D6D; border-radius: 14px; padding: 11px; font-weight: 600; font-size: 12px; cursor: pointer; font-family: inherit; }
        .admin-delete-btn:hover { background: #FF4D6D25; }

        .hero { padding: 46px 26px 10px; max-width: 640px; }
        .hero h2 { font-size: 36px; font-weight: 800; letter-spacing: -1px; line-height: 1.1; margin: 0 0 10px; }
        .hero span.accent { background: linear-gradient(135deg, #FF4D6D, #8C7CFF); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .hero p { color: #9A9AA3; font-size: 14px; }

        .controls { display: flex; gap: 8px; flex-wrap: wrap; padding: 20px 26px; }
        .search-box { display: flex; align-items: center; gap: 8px; background: #1F1F24; border: 1px solid #333; border-radius: 20px; padding: 10px 16px; flex: 1; min-width: 200px; }
        .search-box input { border: none; outline: none; background: transparent; color: #fff; font-size: 13px; width: 100%; font-family: inherit; }
        .chip { border: 1px solid #333; background: #1F1F24; color: #C8C8CE; border-radius: 20px; padding: 8px 14px; font-size: 12px; cursor: pointer; font-family: inherit; }
        .chip.active { background: #F2F2F0; color: #121214; border-color: #F2F2F0; }
        select.chip { appearance: none; }

        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(190px, 1fr)); gap: 16px; padding: 10px 26px 70px; grid-auto-flow: dense; }
        .card { background: #1A1A1E; border-radius: 18px; overflow: hidden; cursor: pointer; transition: transform .15s ease; border: 1px solid #29292f; display: flex; flex-direction: column; }
        .card:hover { transform: translateY(-4px); }
        .card-media { height: 150px; position: relative; background-size: cover; background-position: center; flex-shrink: 0; }
        .card.tall .card-media { height: 230px; }
        .heart { border: none; background: #00000055; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2; position: absolute; top: 10px; right: 10px; }
        .new-ribbon { position: absolute; top: 10px; left: 10px; background: #4DE1C1; color: #121214; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; padding: 4px 9px; border-radius: 10px; z-index: 2; }
        .featured-ribbon { position: absolute; left: 10px; background: linear-gradient(135deg, #FFC24D, #FF8A4D); color: #121214; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; padding: 4px 9px; border-radius: 10px; z-index: 2; }
        .price-pill { position: absolute; bottom: 10px; left: 10px; background: #121214cc; border: 1px solid #333; border-radius: 14px; padding: 4px 10px; font-size: 13px; font-weight: 700; z-index: 2; }
        .card-info { padding: 12px 14px 14px; }
        .card-info h3 { font-size: 14px; margin: 0 0 4px; font-weight: 600; }
        .card-info p { font-size: 12px; color: #9A9AA3; margin: 0; }
        .card-city { display: flex; align-items: center; gap: 3px; margin-top: 3px !important; font-size: 10px !important; color: #6A6A73 !important; }
        .chip.forYou.active { background: linear-gradient(135deg, #FF4D6D, #FF8A4D); color: #121214; border-color: transparent; }
        .sort-chip { min-width: 150px; }
        .price-filter { display: flex; align-items: center; gap: 8px; font-size: 11px; color: #C8C8CE; background: #1F1F24; border: 1px solid #333; border-radius: 20px; padding: 7px 14px; }
        .price-filter input[type=range] { width: 90px; accent-color: #FF4D6D; }
        .follow-btn { display: flex; align-items: center; gap: 5px; border: 1px solid #333; background: #121214; color: #C8C8CE; border-radius: 12px; padding: 7px 11px; font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; }
        .follow-btn.on { background: linear-gradient(135deg, #4DE1C1, #4DA8FF); color: #121214; border-color: transparent; }
        .offer-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid #FFC24D55; background: #FFC24D15; color: #FFC24D; border-radius: 14px; padding: 11px; font-weight: 600; font-size: 12px; cursor: pointer; font-family: inherit; }
        .offer-modal { max-width: 340px; }
        .offer-sent { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 20px 0; font-weight: 700; }
        .league-btn { position: relative; }
        .league-modal { max-width: 400px; }
        .league-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .leaderboard { display: flex; flex-direction: column; gap: 8px; margin-bottom: 22px; }
        .lb-row { display: flex; align-items: center; gap: 10px; background: #121214; border: 1px solid #29292f; border-radius: 12px; padding: 9px 12px; }
        .lb-row.first { border-color: #FFC24D55; background: #FFC24D0d; }
        .lb-rank { font-size: 12px; font-weight: 800; color: #6A6A73; width: 20px; }
        .lb-row.first .lb-rank { color: #FFC24D; }
        .lb-info { flex: 1; }
        .lb-name { font-size: 13px; font-weight: 700; margin: 0; }
        .lb-city { font-size: 10px; color: #9A9AA3; margin: 2px 0 0; display: flex; align-items: center; gap: 3px; }
        .lb-points { font-size: 12px; font-weight: 700; color: #4DE1C1; }
        .duel-box { display: flex; align-items: center; gap: 10px; }
        .duel-side { flex: 1; background: #121214; border: 1px solid #29292f; border-radius: 14px; padding: 12px; cursor: pointer; font-family: inherit; color: #F2F2F0; text-align: center; }
        .duel-side:hover:not(:disabled) { border-color: #FF4D6D55; }
        .duel-side.voted { border-color: #4DE1C1; background: #4DE1C110; }
        .duel-side:disabled { cursor: default; }
        .duel-swatch { height: 50px; border-radius: 10px; margin-bottom: 8px; }
        .duel-title { font-size: 11px; font-weight: 600; margin: 0 0 2px; line-height: 1.3; }
        .duel-seller { font-size: 10px; color: #9A9AA3; margin: 0 0 4px; }
        .duel-votes { font-size: 12px; font-weight: 800; color: #FF4D6D; margin: 0; }
        .duel-vs { font-size: 11px; font-weight: 800; color: #6A6A73; }
        .duel-thanks { font-size: 11px; color: #4DE1C1; text-align: center; margin: 14px 0 0; }
        .icon-btn { position: relative; border: 1px solid #333; background: #1F1F24; color: #F2F2F0; border-radius: 12px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .notif-dot { position: absolute; top: -4px; right: -4px; min-width: 15px; height: 15px; padding: 0 3px; border-radius: 8px; background: #FF4D6D; color: #121214; font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
        .notif-modal { max-width: 360px; }
        .favorites-modal { max-width: 420px; }
        .favorites-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .fav-card { cursor: pointer; }
        .fav-swatch { height: 110px; border-radius: 14px; position: relative; background-size: cover; background-position: center; margin-bottom: 6px; }
        .fav-swatch .heart { top: 8px; right: 8px; }
        .fav-title { font-size: 12px; font-weight: 600; margin: 0 0 2px; }
        .fav-price { font-size: 12px; font-weight: 700; color: #4DE1C1; margin: 0; }
        .notif-row { display: flex; gap: 10px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid #29292f; }
        .notif-row.unread .notif-text { font-weight: 700; }
        .notif-row.unread .notif-icon { color: #FF4D6D; }
        .notif-row:last-child { border-bottom: none; }
        .notif-icon { width: 28px; height: 28px; border-radius: 50%; background: #1F1F24; display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #4DE1C1; }
        .notif-text { font-size: 13px; margin: 0; }
        .notif-time { font-size: 11px; color: #6A6A73; margin: 2px 0 0; }
        .settings-modal { max-width: 380px; }
        .stripe-box { background: #121214; border: 1px solid #29292f; border-radius: 14px; padding: 14px; margin: 16px 0; }
        .stripe-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; margin: 0 0 8px; }
        .stripe-status { font-size: 12px; color: #9A9AA3; margin: 0 0 10px; line-height: 1.4; }
        .stripe-status.ok { display: flex; align-items: center; gap: 6px; color: #4DE1C1; margin: 0; }
        .stripe-connect-btn { width: 100%; border: none; border-radius: 12px; background: linear-gradient(135deg, #635BFF, #4A42E8); color: #fff; padding: 10px; font-weight: 700; font-size: 12px; cursor: pointer; font-family: inherit; }
        .orders-modal { max-width: 400px; }
        .profile-section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #9A9AA3; margin: 16px 0 10px; }
        .order-card { background: #121214; border: 1px solid #29292f; border-radius: 16px; padding: 14px; margin-bottom: 10px; }
        .order-top { display: flex; justify-content: space-between; gap: 8px; }
        .order-title { font-size: 13px; font-weight: 700; margin: 0; }
        .order-price { font-size: 13px; font-weight: 800; color: #4DE1C1; margin: 0; flex-shrink: 0; }
        .order-seller { font-size: 11px; color: #9A9AA3; margin: 2px 0 12px; }
        .order-steps { display: flex; align-items: center; margin-bottom: 12px; }
        .order-step { display: flex; flex-direction: column; align-items: center; gap: 3px; color: #4A4A52; font-size: 9px; text-transform: uppercase; letter-spacing: .3px; flex-shrink: 0; }
        .order-step.done { color: #4DE1C1; }
        .order-step-line { flex: 1; height: 2px; background: #29292f; margin: 0 4px 14px; }
        .order-step-line.done { background: #4DE1C1; }
        .order-action-btn { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; border: none; border-radius: 12px; background: linear-gradient(135deg, #FF4D6D, #FF8A4D); color: #121214; padding: 10px; font-weight: 700; font-size: 12px; cursor: pointer; font-family: inherit; }
        .order-hint { font-size: 11px; color: #6A6A73; margin: 0 0 8px; }
        .dispute-link { font-size: 11px; color: #6A6A73; text-decoration: underline; cursor: pointer; margin: 8px 0 0; text-align: center; }
        .dispute-link:hover { color: #FF4D6D; }
        .rating-modal { max-width: 340px; }
        .star-picker { display: flex; justify-content: center; gap: 8px; margin-bottom: 18px; }
        .star-picker button { background: none; border: none; cursor: pointer; padding: 2px; }
        .settings-toggle-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin: 14px 0; }
        .settings-toggle-row input { width: auto; accent-color: #FF4D6D; }
        .logout-btn { width: 100%; margin-top: 10px; border: 1px solid #FF4D6D55; background: transparent; color: #FF4D6D; border-radius: 14px; padding: 11px; font-weight: 600; font-size: 13px; cursor: pointer; font-family: inherit; }
        .checkout-modal { max-width: 380px; }
        .checkout-summary { background: #121214; border: 1px solid #29292f; border-radius: 14px; padding: 12px 14px; margin: 16px 0; }
        .checkout-note { font-size: 11px; color: #6A6A73; margin: 0; line-height: 1.4; }
        .checkout-row { display: flex; justify-content: space-between; font-size: 12px; color: #9A9AA3; padding: 4px 0; }
        .checkout-row.total { color: #F2F2F0; font-weight: 700; font-size: 14px; border-top: 1px solid #29292f; margin-top: 6px; padding-top: 10px; }
        .checkout-sub { font-size: 12px; color: #9A9AA3; text-align: center; font-weight: 400; }
        .own-card { position: relative; }
        .own-actions { position: absolute; top: 6px; right: 6px; display: flex; gap: 4px; }
        .own-actions button { border: none; background: #00000088; color: #fff; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

        .skeleton-card { background: #1A1A1E; border-radius: 18px; overflow: hidden; border: 1px solid #29292f; padding-bottom: 12px; }
        .skeleton-media { height: 150px; }
        .skeleton-card.tall .skeleton-media { height: 230px; }
        .skeleton-line { height: 10px; border-radius: 5px; margin: 10px 14px 0; }
        .shimmer { background: linear-gradient(100deg, #1F1F24 30%, #2A2A30 50%, #1F1F24 70%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        @keyframes shimmer { 0% { background-position: 150% 0; } 100% { background-position: -50% 0; } }

        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 70px 30px; text-align: center; }
        .site-footer { display: flex; justify-content: center; align-items: center; gap: 8px; flex-wrap: wrap; padding: 20px 26px 100px; color: #6A6A73; font-size: 11px; }
        .site-footer button { background: none; border: none; color: #6A6A73; font-size: 11px; cursor: pointer; font-family: inherit; text-decoration: underline; }
        .site-footer button:hover { color: #F2F2F0; }
        .cookie-banner { position: fixed; bottom: 0; left: 0; right: 0; z-index: 40; background: #1A1A1E; border-top: 1px solid #29292f; padding: 14px 20px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap; justify-content: center; }
        .cookie-banner p { font-size: 12px; color: #C8C8CE; margin: 0; max-width: 560px; }
        .cookie-banner p button { background: none; border: none; color: #4DE1C1; text-decoration: underline; cursor: pointer; font-size: 12px; font-family: inherit; }
        .cookie-accept { background: linear-gradient(135deg, #FF4D6D, #FF8A4D); color: #121214; border: none; border-radius: 12px; padding: 9px 18px; font-weight: 700; font-size: 12px; cursor: pointer; font-family: inherit; flex-shrink: 0; }
        .legal-modal { max-width: 460px; }
        .legal-text { font-size: 13px; color: #C8C8CE; line-height: 1.6; max-height: 55vh; overflow-y: auto; }
        .legal-text p { margin: 0 0 12px; }
        .empty-title { font-size: 14px; font-weight: 700; margin: 6px 0 0; }
        .empty-sub { font-size: 12px; color: #6A6A73; margin: 0 0 14px; max-width: 260px; }

        .detail-media-actions { position: absolute; top: 14px; right: 14px; display: flex; gap: 8px; }
        .gallery-arrow { position: absolute; top: 50%; transform: translateY(-50%); background: #00000066; border: none; color: #fff; width: 30px; height: 30px; border-radius: 50%; font-size: 20px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2; }
        .gallery-arrow.left { left: 10px; }
        .gallery-arrow.right { right: 10px; }
        .gallery-dots { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 5px; z-index: 2; }
        .gallery-dot { width: 6px; height: 6px; border-radius: 50%; background: #ffffff66; cursor: pointer; }
        .gallery-dot.active { background: #fff; width: 16px; border-radius: 3px; }
        .detail-description { font-size: 13px; color: #C8C8CE; line-height: 1.5; margin: 0 0 16px; white-space: pre-wrap; }
        .detail-icon-btn { position: static; }
        .trend-tag { display: flex; align-items: center; gap: 4px; font-size: 10px; color: #4DE1C1; margin: 3px 0 0; white-space: nowrap; }

        .profile-progress { background: #121214; border: 1px solid #29292f; border-radius: 14px; padding: 12px 14px; margin-bottom: 16px; text-align: left; }
        .progress-label { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 6px; }
        .progress-track { height: 6px; background: #29292f; border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #4DE1C1, #4DA8FF); border-radius: 4px; }
        .progress-hint { font-size: 10px; color: #6A6A73; margin: 6px 0 0; }
        .cover-btn { position: absolute; bottom: 8px; right: 44px; display: flex; align-items: center; gap: 5px; background: #00000066; border: none; color: #fff; font-size: 10px; padding: 5px 10px; border-radius: 12px; cursor: pointer; font-family: inherit; }
        .share-profile-btn { position: absolute; bottom: 8px; right: 10px; background: #00000066; border: none; color: #fff; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .milestone-badges { display: inline-flex; gap: 4px; margin-left: 6px; vertical-align: middle; }
        .mstone { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; background: #1F1F24; border: 1px solid #333; border-radius: 50%; font-size: 10px; color: #FFC24D; }
        .profile-meta-row { font-size: 11px; color: #9A9AA3; margin: 4px 0 0; }
        .streak-text { font-size: 11px; color: #FFC24D; margin: 4px 0 10px; font-weight: 600; }
        .verify-row { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin-bottom: 10px; }
        .verify-chip { display: flex; align-items: center; gap: 4px; font-size: 10px; background: #121214; border: 1px solid #29292f; color: #6A6A73; padding: 4px 9px; border-radius: 12px; }
        .verify-chip.done { color: #4DE1C1; border-color: #4DE1C133; }
        .ig-link { display: block; font-size: 11px; color: #9A9AA3; text-decoration: none; margin-bottom: 16px; }
        .ig-link:hover { color: #FF4D6D; }
        .rating-breakdown { background: #121214; border: 1px solid #29292f; border-radius: 14px; padding: 12px 14px; margin-bottom: 16px; text-align: left; }
        .rb-row { font-size: 11px; margin-bottom: 8px; }
        .rb-row:last-child { margin-bottom: 0; }
        .rb-row span { display: block; margin-bottom: 4px; color: #C8C8CE; }
        .rb-track { height: 5px; background: #29292f; border-radius: 3px; overflow: hidden; }
        .rb-fill { height: 100%; background: linear-gradient(90deg, #4DE1C1, #4DA8FF); border-radius: 3px; }
        .chat-modal { max-width: 380px; display: flex; flex-direction: column; height: 520px; max-height: 80vh; padding: 0; }
        .chat-header { display: flex; align-items: center; gap: 10px; padding: 16px 50px 16px 18px; border-bottom: 1px solid #29292f; position: relative; flex-shrink: 0; }
        .chat-close { position: static; margin-left: auto; order: 3; background: #29292f; }
        .chat-seller-name { font-size: 13px; font-weight: 700; margin: 0; }
        .chat-item-ref { font-size: 11px; color: #9A9AA3; margin: 2px 0 0; }
        .chat-thread { flex: 1; overflow-y: auto; padding: 16px 18px; display: flex; flex-direction: column; gap: 10px; }
        .chat-bubble { max-width: 78%; padding: 10px 14px; border-radius: 16px; font-size: 13px; line-height: 1.4; }
        .chat-bubble.seller { background: #1F1F24; border: 1px solid #29292f; align-self: flex-start; border-bottom-left-radius: 4px; }
        .chat-bubble.me { background: linear-gradient(135deg, #FF4D6D, #FF8A4D); color: #121214; align-self: flex-end; border-bottom-right-radius: 4px; font-weight: 500; }
        .chat-input-row { display: flex; gap: 8px; padding: 14px 16px; border-top: 1px solid #29292f; flex-shrink: 0; }
        .chat-input-row input { flex: 1; border: 1px solid #333; border-radius: 20px; padding: 10px 14px; background: #121214; color: #F2F2F0; font-size: 13px; font-family: inherit; }
        .chat-send-btn { border: none; background: linear-gradient(135deg, #FF4D6D, #FF8A4D); color: #121214; border-radius: 50%; width: 38px; height: 38px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }

        .overlay { position: fixed; inset: 0; background: rgba(10,10,12,0.85); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 10; }
        .overlay-top { z-index: 15; }
        .modal { background: #1A1A1E; border: 1px solid #29292f; border-radius: 22px; max-width: 400px; width: 100%; padding: 26px; position: relative; max-height: 88vh; overflow-y: auto; }
        .modal h3 { font-size: 19px; font-weight: 700; margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
        .close-btn { position: absolute; top: 16px; right: 16px; background: #29292f; border: none; border-radius: 50%; width: 28px; height: 28px; color: #fff; cursor: pointer; }
        label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 14px 0 6px; color: #9A9AA3; }
        input, select { width: 100%; border: 1px solid #333; border-radius: 12px; padding: 10px 12px; font-size: 13px; background: #121214; color: #F2F2F0; font-family: inherit; }
        .post-textarea { width: 100%; border: 1px solid #333; border-radius: 12px; padding: 10px 12px; font-size: 13px; background: #121214; color: #F2F2F0; font-family: inherit; resize: vertical; margin-bottom: 4px; }
        .submit-btn { margin-top: 20px; width: 100%; border: none; border-radius: 14px; padding: 13px; background: linear-gradient(135deg, #FF4D6D, #FF8A4D); color: #121214; font-weight: 700; font-size: 13px; cursor: pointer; }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .detail-price { font-size: 30px; font-weight: 800; margin: 10px 0 14px; }
        .seller-row { font-size: 13px; color: #9A9AA3; margin-bottom: 18px; }
        .detail-modal { max-width: 400px; padding: 0; }
        .detail-media { height: 220px; position: relative; border-radius: 22px 22px 0 0; }
        .dark-close { top: 14px; right: 14px; background: #00000066; }
        .detail-heart { position: absolute; top: 14px; right: 14px; }
        .detail-body { padding: 20px 22px 24px; }
        .detail-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
        .detail-title { font-size: 18px; font-weight: 700; margin: 0; line-height: 1.25; }
        .detail-modal .detail-price { margin: 0; white-space: nowrap; }
        .tag-row { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0 18px; }
        .info-tag { font-size: 11px; background: #121214; border: 1px solid #29292f; color: #C8C8CE; padding: 5px 11px; border-radius: 20px; }
        .seller-card { display: flex; align-items: center; gap: 10px; background: #121214; border: 1px solid #29292f; border-radius: 14px; padding: 10px 14px; margin-bottom: 18px; }
        .seller-avatar { width: 34px; height: 34px; font-size: 14px; }
        .seller-name { font-size: 13px; font-weight: 700; margin: 0; }
        .seller-rating { font-size: 11px; color: #9A9AA3; margin: 2px 0 0; display: flex; align-items: center; gap: 4px; }
        .impact-box { display: flex; gap: 10px; align-items: flex-start; background: #4DE1C114; border: 1px solid #4DE1C133; border-radius: 14px; padding: 12px 14px; margin-bottom: 18px; }
        .impact-title { font-size: 12px; font-weight: 700; margin: 0 0 3px; color: #4DE1C1; }
        .impact-sub { font-size: 11px; color: #9A9AA3; margin: 0; line-height: 1.4; }
        .detail-actions { display: flex; gap: 10px; }
        .detail-actions .chat-btn { flex: 1; margin: 0; }
        .buy-btn { flex: 1; border: none; border-radius: 14px; background: linear-gradient(135deg, #FF4D6D, #FF8A4D); color: #121214; font-weight: 700; font-size: 13px; cursor: pointer; }
        .chat-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; border: 1px solid #333; border-radius: 14px; background: transparent; color: #F2F2F0; padding: 12px; font-weight: 600; font-size: 13px; cursor: pointer; }
        .chat-btn:hover { background: #29292f; }
        .empty { padding: 60px 26px; text-align: center; color: #6A6A73; font-size: 13px; }
        .toggle-link { font-size: 12px; margin-top: 14px; text-align: center; cursor: pointer; color: #4DE1C1; }
        .auth-modal { max-width: 380px; }
        .auth-brand { text-align: center; margin-bottom: 20px; }
        .auth-mark { margin: 0 auto 12px; }
        .auth-title { font-size: 18px; font-weight: 700; margin: 0 0 4px; }
        .auth-subtitle { font-size: 12px; color: #9A9AA3; margin: 0; }
        .tabs { display: flex; background: #121214; border: 1px solid #29292f; border-radius: 14px; padding: 4px; margin-bottom: 6px; }
        .tab { flex: 1; border: none; background: transparent; color: #9A9AA3; padding: 9px; border-radius: 10px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .tab.active { background: #F2F2F0; color: #121214; }
        .input-icon { display: flex; align-items: center; gap: 8px; border: 1px solid #333; border-radius: 12px; padding: 0 12px; background: #121214; }
        .input-icon svg { color: #6A6A73; flex-shrink: 0; }
        .input-icon input { border: none; padding: 10px 0; background: transparent; }
        .post-modal { max-width: 400px; }
        .upload-box { display: flex; flex-direction: column; align-items: center; gap: 6px; border: 1.5px dashed #333; border-radius: 16px; padding: 26px 16px; margin-bottom: 18px; color: #C8C8CE; font-size: 13px; font-weight: 600; cursor: pointer; text-align: center; }
        .upload-box:hover { border-color: #FF4D6D; }
        .upload-box { display: flex; flex-direction: column; align-items: center; gap: 6px; }
        .image-preview-row { display: flex; gap: 8px; flex-wrap: wrap; margin-bottom: 4px; }
        .image-preview.uploading { display: flex; align-items: center; justify-content: center; background: #121214; color: #6A6A73; }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .image-preview { position: relative; width: 60px; height: 60px; border-radius: 10px; overflow: hidden; border: 1px solid #333; }
        .image-preview img { width: 100%; height: 100%; object-fit: cover; }
        .image-preview button { position: absolute; top: 2px; right: 2px; background: #000000aa; border: none; color: #fff; border-radius: 50%; width: 16px; height: 16px; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; }
        .upload-hint { font-size: 11px; color: #6A6A73; font-weight: 400; }
        .pill-group { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
        .pill { border: 1px solid #333; background: #121214; color: #C8C8CE; border-radius: 20px; padding: 6px 12px; font-size: 12px; cursor: pointer; font-family: inherit; }
        .pill.active { background: linear-gradient(135deg, #FF4D6D, #FF8A4D); color: #121214; border-color: transparent; font-weight: 700; }
        .price-input { max-width: 140px; }
        .euro-prefix { color: #6A6A73; font-weight: 700; font-size: 14px; }
      `}</style>

      <header className="top">
        <div className="brand">
          <div className="brand-mark"><RefreshCw size={16} color="#121214" /></div>
          <h1>relovia</h1>
        </div>
        <div className="top-actions">
          {loggedIn && (
            <button className="icon-btn" onClick={() => setShowOrders(true)}>
              <Package size={16} />
            </button>
          )}
          {loggedIn && (
            <button className="icon-btn" onClick={() => setShowFavorites(true)}>
              <Heart size={16} fill={saved.size > 0 ? "#FF4D6D" : "none"} color={saved.size > 0 ? "#FF4D6D" : "currentColor"} />
              {saved.size > 0 && <span className="notif-dot">{saved.size}</span>}
            </button>
          )}
          {loggedIn && (
            <button className="icon-btn" onClick={handleOpenNotifs}>
              <Bell size={16} />
              {notifications.some((n) => !n.read) && (
                <span className="notif-dot">{notifications.filter((n) => !n.read).length}</span>
              )}
            </button>
          )}
          {loggedIn && (
            <button className="icon-btn" onClick={() => setShowSettings(true)}><Settings size={16} /></button>
          )}
          {loggedIn && (
            <span className="badge profile-badge" onClick={viewProfile}>
              <span className="mini-avatar" style={{ background: avatarColor }}>{username[0]?.toUpperCase()}</span>
              @{username}
            </span>
          )}
          <button className="btn ghost league-btn" onClick={() => setShowLeague(true)}><Trophy size={14} /> Liga</button>
          <button className="btn primary" onClick={() => { setEditingItem(null); setForm({ title: "", category: "Moda", size: "", isShoe: false, price: "", description: "", condition: "Bueno", images: [] }); setShowPost(true); }}><Plus size={14} /> Vender</button>
          {loggedIn ? (
            <button className="btn ghost" onClick={() => { apiLogout(); setLoggedIn(false); setUsername(""); toast("Sesión cerrada"); }}>Salir</button>
          ) : (
            <button className="btn ghost" onClick={() => setShowAuth(true)}>Entrar</button>
          )}
        </div>
      </header>

      <div className="hero">
        <h2>Lo que ya no usas, <span className="accent">alguien lo está buscando</span>.</h2>
        <p>Compra y vende de todo, de segunda mano. Busca, publica, negocia.</p>
      </div>

      <div className="controls">
        <div className="search-box">
          <Search size={15} color="#9A9AA3" />
          <input placeholder="Buscar prendas..." value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <button className={"chip forYou" + (category === "Para ti" ? " active" : "")} onClick={() => setCategory("Para ti")}>✨ Para ti</button>
        {CATEGORIES.map((c) => {
          const Icon = CATEGORY_ICONS[c];
          return (
            <button key={c} className={"chip" + (category === c ? " active" : "")} onClick={() => setCategory(c)}>
              <Icon size={12} style={{ marginRight: 4, verticalAlign: -2 }} />{c}
            </button>
          );
        })}
      </div>

      {loadError && !loading && (
        <div className="empty-state">
          <RefreshCw size={32} color="#FF4D6D" />
          <p className="empty-title">{loadError}</p>
          <button className="btn primary" onClick={loadAllItems}><RefreshCw size={14} /> Reintentar</button>
        </div>
      )}
      {loading && (
        <div className="grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={"skeleton-card" + (i % 3 === 0 ? " tall" : "")}>
              <div className="skeleton-media shimmer" />
              <div className="skeleton-line shimmer" style={{ width: "70%" }} />
              <div className="skeleton-line shimmer" style={{ width: "40%" }} />
            </div>
          ))}
        </div>
      )}
      {!loading && !loadError && items.length === 0 && (
        <div className="empty-state">
          <PackageOpen size={38} color="#3A3A40" />
          <p className="empty-title">No hay prendas que coincidan</p>
          <p className="empty-sub">Prueba a cambiar los filtros, o sé el primero en publicar algo así.</p>
          <button className="btn primary" onClick={() => { setEditingItem(null); setForm({ title: "", category: "Moda", size: "", isShoe: false, price: "", description: "", condition: "Bueno", images: [] }); setShowPost(true); }}>
            <Plus size={14} /> Publicar la primera
          </button>
        </div>
      )}
      {!loading && items.length > 0 && (
        <div className="grid">
          {items.map((item, i) => (
            <ItemCard key={item.id} item={item} index={i} onOpen={viewItem} saved={saved.has(item.id)} toggleSave={toggleSave} />
          ))}
        </div>
      )}

      <footer className="site-footer">
        <button onClick={() => setShowLegal("terms")}>Términos y condiciones</button>
        <span>·</span>
        <button onClick={() => setShowLegal("privacy")}>Privacidad</button>
        <span>·</span>
        <button onClick={() => setShowLegal("cookies")}>Cookies</button>
      </footer>

      {showCookieBanner && (
        <div className="cookie-banner">
          <p>Usamos cookies esenciales para que la web funcione, y opcionalmente analítica para mejorar la experiencia. <button onClick={() => setShowLegal("cookies")}>Más info</button></p>
          <button
            className="cookie-accept"
            onClick={() => { localStorage.setItem("reloop_cookies_accepted", "1"); setShowCookieBanner(false); }}
          >
            Aceptar
          </button>
        </div>
      )}

      {showLegal && (
        <div className="overlay" onClick={() => setShowLegal(null)}>
          <div className="modal legal-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowLegal(null)}><X size={14} /></button>
            {showLegal === "terms" && (
              <>
                <p className="auth-title">Términos y condiciones</p>
                <div className="legal-text">
                  <p><strong>1. Objeto.</strong> Reloop es una plataforma que conecta a compradores y vendedores de artículos de segunda mano. No somos propietarios de los artículos publicados ni parte de la compraventa entre usuarios.</p>
                  <p><strong>2. Registro.</strong> Debes ser mayor de edad y aportar datos veraces al crear tu cuenta.</p>
                  <p><strong>3. Comisiones.</strong> Reloop cobra una comisión sobre cada venta completada a través de la plataforma, detallada antes de confirmar el pago.</p>
                  <p><strong>4. Responsabilidad.</strong> Cada vendedor es responsable de la veracidad de sus anuncios y del estado real de los artículos. Reloop no garantiza la calidad de los productos.</p>
                  <p><strong>5. Envíos.</strong> Los envíos se gestionan a través de transportistas externos; Reloop facilita la generación de etiquetas pero no es responsable de incidencias del transportista.</p>
                  <p><strong>6. Cuenta.</strong> Podemos suspender cuentas que incumplan estas condiciones o la normativa vigente.</p>
                  <p style={{ color: "#6A6A73", fontSize: 11, marginTop: 16 }}>Este es un texto de ejemplo. Antes de operar de verdad, revísalo con un abogado o gestoría para adaptarlo a tu caso concreto.</p>
                </div>
              </>
            )}
            {showLegal === "privacy" && (
              <>
                <p className="auth-title">Política de privacidad</p>
                <div className="legal-text">
                  <p><strong>Datos que recogemos:</strong> email, nombre de usuario, fotos que subas, mensajes de chat, y datos de pago (procesados por Stripe, nunca los almacenamos nosotros).</p>
                  <p><strong>Para qué los usamos:</strong> gestionar tu cuenta, procesar pagos y envíos, enviarte notificaciones sobre tus compras/ventas, y mejorar el servicio.</p>
                  <p><strong>Con quién los compartimos:</strong> Stripe (pagos), Cloudinary (imágenes), Packlink (envíos) — solo lo necesario para prestar el servicio.</p>
                  <p><strong>Tus derechos:</strong> puedes solicitar acceso, rectificación o eliminación de tus datos escribiendo a nuestro email de contacto.</p>
                  <p style={{ color: "#6A6A73", fontSize: 11, marginTop: 16 }}>Este es un texto de ejemplo. Antes de operar de verdad, revísalo con un abogado para cumplir el RGPD correctamente.</p>
                </div>
              </>
            )}
            {showLegal === "cookies" && (
              <>
                <p className="auth-title">Política de cookies</p>
                <div className="legal-text">
                  <p><strong>Cookies esenciales:</strong> necesarias para que funcione el inicio de sesión y el carrito. No se pueden desactivar.</p>
                  <p><strong>Cookies de análisis (opcionales):</strong> nos ayudan a entender cómo se usa la web, para mejorarla.</p>
                  <p style={{ color: "#6A6A73", fontSize: 11, marginTop: 16 }}>Este es un texto de ejemplo, revísalo antes de operar de verdad.</p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {showPost && (
        <div className="overlay" onClick={() => setShowPost(false)}>
          <div className="modal post-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowPost(false)}><X size={14} /></button>
            <p className="auth-title">{editingItem ? "Editar prenda" : "Nueva prenda"}</p>
            <p className="auth-subtitle" style={{ marginBottom: 18 }}>{editingItem ? "Actualiza los datos de tu prenda" : "Rellena los datos y publícala en segundos"}</p>

            <label htmlFor="photo-upload" className="upload-box">
              <ImagePlus size={22} color="#6A6A73" />
              <span>Añadir fotos</span>
              <span className="upload-hint">Hasta 6 imágenes, formato JPG o PNG</span>
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/png, image/jpeg"
              multiple
              style={{ display: "none" }}
              onChange={handleImageSelect}
            />
            {(form.images.length > 0 || uploadingImages.length > 0) && (
              <div className="image-preview-row">
                {form.images.map((img, i) => (
                  <div key={i} className="image-preview">
                    <img src={img} alt={`Foto ${i + 1}`} />
                    <button type="button" onClick={() => removeImage(i)}><X size={12} /></button>
                  </div>
                ))}
                {uploadingImages.map((id) => (
                  <div key={id} className="image-preview uploading">
                    <RefreshCw size={16} className="spin" />
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handlePublish}>
              <label>Título</label>
              <div className="input-icon">
                <Tag size={14} />
                <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej. Bicicleta urbana, chaqueta vaquera, lámpara..." />
              </div>

              <label>Descripción</label>
              <textarea
                className="post-textarea"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Medidas, estado real, motivo de venta, defectos si los hay..."
                rows={3}
              />

              <label>Categoría</label>
              <div className="pill-group">
                {CATEGORIES.filter((c) => c !== "Todo").map((c) => (
                  <button type="button" key={c} className={"pill" + (form.category === c ? " active" : "")} onClick={() => setForm({ ...form, category: c, size: "", isShoe: false })}>{c}</button>
                ))}
              </div>

              {form.category === "Moda" && (
                <>
                  <label>Tipo de talla</label>
                  <div className="pill-group">
                    <button type="button" className={"pill" + (!form.isShoe ? " active" : "")} onClick={() => setForm({ ...form, isShoe: false, size: "" })}>Ropa (XS-XL)</button>
                    <button type="button" className={"pill" + (form.isShoe ? " active" : "")} onClick={() => setForm({ ...form, isShoe: true, size: "" })}>Calzado (nº)</button>
                  </div>

                  <label>Talla</label>
                  <div className="pill-group">
                    {(form.isShoe ? SHOE_SIZES : SIZES).map((s) => (
                      <button type="button" key={s} className={"pill" + (form.size === s ? " active" : "")} onClick={() => setForm({ ...form, size: s })}>{s}</button>
                    ))}
                  </div>
                </>
              )}

              <label>Estado</label>
              <div className="pill-group">
                {["Como nuevo", "Muy bueno", "Bueno", "Aceptable"].map((c) => (
                  <button type="button" key={c} className={"pill" + (form.condition === c ? " active" : "")} onClick={() => setForm({ ...form, condition: c })}>{c}</button>
                ))}
              </div>

              <label>Precio</label>
              <div className="input-icon price-input">
                <span className="euro-prefix">€</span>
                <input type="number" min="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" />
              </div>

              {postError && <p style={{ color: "#FF4D6D", fontSize: 12, marginTop: 10 }}>{postError}</p>}
              <button className="submit-btn" type="submit" disabled={uploadingImages.length > 0}>
                {uploadingImages.length > 0 ? "Subiendo fotos..." : !loggedIn ? "Iniciar sesión para publicar" : editingItem ? "Guardar cambios" : "Publicar prenda"}
              </button>
            </form>
          </div>
        </div>
      )}

      {showForgotPassword && (
        <div className="overlay" onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotError(null); }}>
          <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotError(null); }}><X size={14} /></button>
            {forgotSent ? (
              <div className="offer-sent">
                <Mail size={26} color="#4DE1C1" />
                <p>¡Revisa tu email!</p>
                <p className="checkout-sub">Si esa dirección está registrada, te hemos enviado un enlace para elegir una contraseña nueva.</p>
              </div>
            ) : (
              <>
                <p className="auth-title">Recuperar contraseña</p>
                <p className="auth-subtitle" style={{ marginBottom: 18 }}>Te enviaremos un enlace a tu email</p>
                <form onSubmit={handleForgotPassword}>
                  <label>Email</label>
                  <div className="input-icon">
                    <Mail size={14} />
                    <input value={forgotEmail} onChange={(e) => setForgotEmail(e.target.value)} placeholder="tu@email.com" />
                  </div>
                  {forgotError && <p style={{ color: "#FF4D6D", fontSize: 12, marginTop: 10 }}>{forgotError}</p>}
                  <button className="submit-btn" type="submit">Enviar enlace</button>
                </form>
                <p className="toggle-link" onClick={() => { setShowForgotPassword(false); setShowAuth(true); }}>Volver a iniciar sesión</p>
              </>
            )}
          </div>
        </div>
      )}

      {showAuth && (
        <div className="overlay" onClick={() => setShowAuth(false)}>
          <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowAuth(false)}><X size={14} /></button>

            <div className="auth-brand">
              <div className="brand-mark auth-mark"><Zap size={18} color="#121214" /></div>
              <p className="auth-title">{authMode === "login" ? "Bienvenido de vuelta" : "Únete a reloop"}</p>
              <p className="auth-subtitle">{authMode === "login" ? "Entra para seguir comprando y vendiendo" : "Crea tu cuenta en unos segundos"}</p>
            </div>

            <div className="tabs">
              <button className={"tab" + (authMode === "login" ? " active" : "")} onClick={() => setAuthMode("login")}>Entrar</button>
              <button className={"tab" + (authMode === "register" ? " active" : "")} onClick={() => setAuthMode("register")}>Crear cuenta</button>
            </div>

            <form onSubmit={handleAuth}>
              {authMode === "register" && (
                <>
                  <label>Usuario</label>
                  <div className="input-icon">
                    <User size={14} />
                    <input value={authForm.username} onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })} placeholder="tu_usuario" />
                  </div>
                </>
              )}
              <label>Email</label>
              <div className="input-icon">
                <Mail size={14} />
                <input value={authForm.email} onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })} placeholder="tu@email.com" />
              </div>
              <label>Contraseña</label>
              <div className="input-icon">
                <Lock size={14} />
                <input type="password" value={authForm.password} onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })} placeholder="••••••••" />
              </div>
              {authError && <p style={{ color: "#FF4D6D", fontSize: 12, marginTop: 10 }}>{authError}</p>}
              <button className="submit-btn" type="submit">{authMode === "login" ? "Entrar" : "Crear cuenta"}</button>
            </form>
            {authMode === "login" && (
              <p className="toggle-link" onClick={() => { setShowAuth(false); setShowForgotPassword(true); }}>¿Olvidaste tu contraseña?</p>
            )}
            <p className="toggle-link" onClick={() => setShowAuth(false)}>Explorar sin cuenta</p>
          </div>
        </div>
      )}

      {showProfile && (
        <div className="overlay" onClick={closeProfileView}>
          <div className="modal profile-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn dark-close" onClick={closeProfileView}><X size={14} /></button>

            <div className="profile-banner" style={{ background: `linear-gradient(135deg, ${avatarColor}, #1A1A1E)` }}>
              <div className="banner-texture" />
              <button className="cover-btn"><ImagePlus size={13} /> Cambiar portada</button>
              <button className="share-profile-btn"><Share2 size={14} /></button>
            </div>

            <div className="profile-content">
              <div className="profile-avatar-lg" style={{ background: avatarColor }}>{username[0]?.toUpperCase()}</div>
              <p className="profile-name">
                @{username}
                <span className="milestone-badges">
                  <span className="mstone" title="10 ventas"><Trophy size={11} /></span>
                </span>
              </p>
              <p className="profile-sub"><Star size={12} fill="#FFC24D" color="#FFC24D" /> 4.8 · miembro desde 2026</p>

              <div className="profile-quick-actions">
                <button className="edit-profile-btn">Editar perfil</button>
                <button className="details-toggle" onClick={() => setShowProfileDetails(!showProfileDetails)}>
                  {showProfileDetails ? "Ocultar detalles" : "Ver más detalles"}
                </button>
              </div>

              {showProfileDetails && (
                <div className="profile-details">
                  <p className="profile-meta-row">Responde en &lt;1h · Activo hoy · 🔥 3 semanas vendiendo</p>

                  <div className="verify-row">
                    <span className="verify-chip done"><CheckCircle size={11} /> Email</span>
                    <span className="verify-chip done"><CheckCircle size={11} /> Teléfono</span>
                    <span className="verify-chip"><CheckCircle size={11} /> DNI</span>
                  </div>

                  <a className="ig-link" href="#" onClick={(e) => e.preventDefault()}>📷 @{username}.style en Instagram</a>

                  <div className="profile-progress">
                    <div className="progress-label"><span>Perfil completo</span><span>66%</span></div>
                    <div className="progress-track"><div className="progress-fill" style={{ width: "66%" }} /></div>
                  </div>

                  <div className="rating-breakdown">
                    <div className="rb-row"><span>Comunicación</span><div className="rb-track"><div className="rb-fill" style={{ width: "96%" }} /></div></div>
                    <div className="rb-row"><span>Fiel a la descripción</span><div className="rb-track"><div className="rb-fill" style={{ width: "90%" }} /></div></div>
                    <div className="rb-row"><span>Rapidez de envío</span><div className="rb-track"><div className="rb-fill" style={{ width: "84%" }} /></div></div>
                  </div>
                </div>
              )}

              <div className="stats-row">
                <div className="stat-box">
                  <Tag size={13} color="#9A9AA3" />
                  <strong>{allItems.filter((i) => i.seller === username).length}</strong>
                  <span>En venta</span>
                </div>
                <div className="stat-box">
                  <CheckCircle size={13} color="#9A9AA3" />
                  <strong>{soldItems.length}</strong>
                  <span>Vendidos</span>
                </div>
                <div className="stat-box">
                  <Heart size={13} color="#9A9AA3" />
                  <strong>{saved.size}</strong>
                  <span>Favoritos</span>
                </div>
              </div>

              <div className="tabs profile-tabs">
                <button className={"tab" + (profileTab === "venta" ? " active" : "")} onClick={() => setProfileTab("venta")}>En venta</button>
                <button className={"tab" + (profileTab === "vendidos" ? " active" : "")} onClick={() => setProfileTab("vendidos")}>Vendidos</button>
                <button className={"tab" + (profileTab === "favoritos" ? " active" : "")} onClick={() => setProfileTab("favoritos")}>Favoritos</button>
              </div>

              {profileTab === "venta" && (
                allItems.filter((i) => i.seller === username).length === 0
                  ? <p className="empty-tab">Aún no tienes prendas publicadas.</p>
                  : <div className="mini-grid">
                      {allItems.filter((i) => i.seller === username).map((i, idx) => (
                        <div key={i.id} className="mini-card own-card">
                          <div className="mini-swatch" style={{ background: PALETTE[idx % PALETTE.length] }} />
                          <p className="mini-title">{i.title}</p>
                          <p className="mini-price">{i.price}€</p>
                          <div className="own-actions">
                            <button onClick={(e) => { e.stopPropagation(); startEdit(i); }}><Pencil size={12} /></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteOwnItem(i.id); }}><Trash2 size={12} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
              )}

              {profileTab === "vendidos" && (
                <div className="mini-grid">
                  {soldItems.map((s, idx) => (
                    <div key={s.id} className="mini-card sold">
                      <div className="mini-swatch" style={{ background: PALETTE[idx % PALETTE.length] }} />
                      <p className="mini-title">{s.title}</p>
                      <p className="mini-price">{s.price}€</p>
                    </div>
                  ))}
                </div>
              )}

              {profileTab === "favoritos" && (
                saved.size === 0
                  ? <p className="empty-tab">Aún no has guardado ninguna prenda.</p>
                  : <div className="mini-grid">
                      {allItems.filter((i) => saved.has(i.id)).map((i, idx) => (
                        <div key={i.id} className="mini-card">
                          <div className="mini-swatch" style={{ background: PALETTE[idx % PALETTE.length] }} />
                          <p className="mini-title">{i.title}</p>
                          <p className="mini-price">{i.price}€</p>
                        </div>
                      ))}
                    </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showOrders && (
        <div className="overlay" onClick={() => setShowOrders(false)}>
          <div className="modal orders-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowOrders(false)}><X size={14} /></button>
            <p className="auth-title" style={{ marginBottom: 4 }}>Mis pedidos</p>
            <p className="auth-subtitle" style={{ marginBottom: 16 }}>Compras y ventas</p>

            {ordersLoading && <p className="empty-tab">Cargando...</p>}

            {!ordersLoading && orders.purchases.length === 0 && orders.sales.length === 0 && (
              <p className="empty-tab">Todavía no tienes compras ni ventas.</p>
            )}

            {!ordersLoading && orders.purchases.length > 0 && (
              <>
                <p className="profile-section-title">Compras</p>
                {orders.purchases.map((tx) => (
                  <div key={tx.id} className="order-card">
                    <div className="order-top">
                      <p className="order-title">{tx.item.title}</p>
                      <p className="order-price">{(Number(tx.amount) + Number(tx.shippingFee || 3.5)).toFixed(2)}€</p>
                    </div>
                    <p className="order-seller">Vendedor: @{tx.seller.username}</p>
                    <div className="order-steps">
                      <div className={"order-step" + (tx.status !== "pending" ? " done" : "")}><ShoppingBag size={13} /><span>Pagado</span></div>
                      <div className={"order-step-line" + (tx.shipment ? " done" : "")} />
                      <div className={"order-step" + (tx.shipment ? " done" : "")}><Truck size={13} /><span>Enviado</span></div>
                      <div className={"order-step-line" + (tx.status === "completed" ? " done" : "")} />
                      <div className={"order-step" + (tx.status === "completed" ? " done" : "")}><CheckCircle size={13} /><span>Recibido</span></div>
                    </div>

                    {tx.shipment && tx.shipment.trackingCode && (
                      <p className="order-hint">Nº de seguimiento: {tx.shipment.trackingCode}</p>
                    )}
                    {!tx.shipment && (
                      <p className="order-hint">Esperando a que @{tx.seller.username} genere el envío...</p>
                    )}
                    {tx.shipment && tx.status !== "completed" && tx.status !== "disputed" && (
                      <button className="order-action-btn" onClick={() => handleConfirmReceived(tx.id)}>
                        Confirmar que me ha llegado
                      </button>
                    )}
                    {tx.status === "completed" && (
                      <button className="order-action-btn" onClick={() => setReviewingTx({ id: tx.id, otherUsername: tx.seller.username })}>
                        <Star size={13} /> Valorar a @{tx.seller.username}
                      </button>
                    )}
                    {tx.status === "disputed" && (
                      <p className="order-hint" style={{ color: "#FF4D6D" }}>Reembolso solicitado, en revisión.</p>
                    )}
                    {["paid", "shipped"].includes(tx.status) && (
                      <p className="dispute-link" onClick={() => setDisputingTx(tx)}>¿Algún problema con este pedido? Solicitar reembolso</p>
                    )}
                  </div>
                ))}
              </>
            )}

            {!ordersLoading && orders.sales.length > 0 && (
              <>
                <p className="profile-section-title">Ventas</p>
                {orders.sales.map((tx) => (
                  <div key={tx.id} className="order-card">
                    <div className="order-top">
                      <p className="order-title">{tx.item.title}</p>
                      <p className="order-price">{(Number(tx.amount) + Number(tx.shippingFee || 3.5)).toFixed(2)}€</p>
                    </div>
                    <p className="order-seller">Comprador: @{tx.buyer.username}</p>
                    <div className="order-steps">
                      <div className={"order-step" + (tx.status !== "pending" ? " done" : "")}><ShoppingBag size={13} /><span>Pagado</span></div>
                      <div className={"order-step-line" + (tx.shipment ? " done" : "")} />
                      <div className={"order-step" + (tx.shipment ? " done" : "")}><Truck size={13} /><span>Enviado</span></div>
                      <div className={"order-step-line" + (tx.status === "completed" ? " done" : "")} />
                      <div className={"order-step" + (tx.status === "completed" ? " done" : "")}><CheckCircle size={13} /><span>Recibido</span></div>
                    </div>

                    {!tx.shipment && tx.status === "paid" && (
                      <button className="order-action-btn" onClick={() => handleGenerateLabel(tx.id)}>
                        <Truck size={13} /> Generar etiqueta de envío
                      </button>
                    )}
                    {tx.shipment && tx.shipment.trackingCode && (
                      <p className="order-hint">Nº de seguimiento: {tx.shipment.trackingCode}</p>
                    )}
                    {tx.status === "completed" && (
                      <button className="order-action-btn" onClick={() => setReviewingTx({ id: tx.id, otherUsername: tx.buyer.username })}>
                        <Star size={13} /> Valorar a @{tx.buyer.username}
                      </button>
                    )}
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {disputingTx && (
        <div className="overlay" onClick={() => setDisputingTx(null)}>
          <div className="modal rating-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setDisputingTx(null)}><X size={14} /></button>
            <p className="auth-title">Solicitar reembolso</p>
            <p className="auth-subtitle" style={{ marginBottom: 18 }}>{disputingTx.item.title}</p>
            <form onSubmit={handleSubmitDispute}>
              <label>Cuéntanos qué ha pasado</label>
              <div className="input-icon">
                <input value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="Ej. No coincide con la descripción..." />
              </div>
              <p style={{ fontSize: 11, color: "#6A6A73", marginTop: 10 }}>Revisaremos tu caso y, si procede, se te devolverá el importe a través de Stripe.</p>
              <button className="submit-btn" type="submit">Enviar solicitud</button>
            </form>
          </div>
        </div>
      )}

      {reviewingTx && (
        <div className="overlay" onClick={() => setReviewingTx(null)}>
          <div className="modal rating-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setReviewingTx(null)}><X size={14} /></button>
            <p className="auth-title">Valorar a @{reviewingTx.otherUsername}</p>
            <form onSubmit={handleSubmitReview}>
              <div className="star-picker">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} onClick={() => setReviewStars(n)}>
                    <Star size={26} fill={n <= reviewStars ? "#FFC24D" : "none"} color={n <= reviewStars ? "#FFC24D" : "#4A4A52"} />
                  </button>
                ))}
              </div>
              <label>Comentario (opcional)</label>
              <div className="input-icon">
                <input value={reviewComment} onChange={(e) => setReviewComment(e.target.value)} placeholder="¿Qué tal la experiencia?" />
              </div>
              <button className="submit-btn" type="submit">Enviar valoración</button>
            </form>
          </div>
        </div>
      )}

      {showFavorites && (
        <div className="overlay" onClick={() => setShowFavorites(false)}>
          <div className="modal favorites-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowFavorites(false)}><X size={14} /></button>
            <p className="auth-title" style={{ marginBottom: 4 }}>Tus favoritos</p>
            <p className="auth-subtitle" style={{ marginBottom: 16 }}>{saved.size} {saved.size === 1 ? "artículo guardado" : "artículos guardados"}</p>

            {saved.size === 0 ? (
              <p className="empty-tab">Aún no has guardado ninguna prenda. Dale al corazón de cualquier artículo para verlo aquí.</p>
            ) : (
              <div className="favorites-grid">
                {allItems.filter((i) => saved.has(i.id)).map((item, idx) => (
                  <div
                    key={item.id}
                    className="fav-card"
                    onClick={() => { setShowFavorites(false); viewItem(item); }}
                  >
                    <div className="fav-swatch" style={{ backgroundImage: `url(${item.photo})` }}>
                      <button className="heart on" onClick={(e) => { e.stopPropagation(); toggleSave(item.id); }}>
                        <Heart size={14} fill="#FF4D6D" color="#FF4D6D" />
                      </button>
                    </div>
                    <p className="fav-title">{item.title}</p>
                    <p className="fav-price">{item.price}€</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showNotifs && (
        <div className="overlay" onClick={() => setShowNotifs(false)}>
          <div className="modal notif-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowNotifs(false)}><X size={14} /></button>
            <p className="auth-title" style={{ marginBottom: 16 }}>Notificaciones</p>
            {notifications.length === 0 && <p className="empty-tab">No tienes notificaciones todavía.</p>}
            {notifications.map((n) => (
              <div
                key={n.id}
                className={"notif-row" + (n.read ? "" : " unread")}
                style={{ cursor: n.link ? "pointer" : "default" }}
                onClick={() => {
                  if (!n.link) return;
                  setShowNotifs(false);
                  const match = n.link.match(/\/item\/(.+)/);
                  if (match) {
                    const found = allItems.find((i) => i.id === match[1]);
                    if (found) setOpenItem(found);
                  }
                }}
              >
                <div className="notif-icon"><Bell size={13} /></div>
                <div>
                  <p className="notif-text">{n.text}</p>
                  <p className="notif-time">{timeAgoFromDate(n.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showSettings && (
        <div className="overlay" onClick={() => setShowSettings(false)}>
          <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowSettings(false)}><X size={14} /></button>
            <p className="auth-title" style={{ marginBottom: 16 }}>Ajustes de cuenta</p>

            <label>Email</label>
            <div className="input-icon"><Mail size={14} /><input defaultValue={`${username}@email.com`} /></div>

            <label>Nueva contraseña</label>
            <div className="input-icon"><Lock size={14} /><input type="password" placeholder="••••••••" /></div>

            <p className="settings-toggle-row">
              <span>Notificaciones de mensajes</span>
              <input type="checkbox" defaultChecked />
            </p>
            <p className="settings-toggle-row">
              <span>Notificaciones de ofertas</span>
              <input type="checkbox" defaultChecked />
            </p>
            <p className="settings-toggle-row">
              <span>Bajadas de precio en favoritos</span>
              <input type="checkbox" defaultChecked />
            </p>

            <div className="stripe-box">
              <p className="stripe-title"><HandCoins size={14} /> Cobros como vendedor</p>
              {stripeStatus?.onboarded ? (
                <p className="stripe-status ok"><CheckCircle size={13} /> Cuenta activa, ya puedes recibir pagos</p>
              ) : (
                <>
                  <p className="stripe-status">Activa Stripe para poder cobrar tus ventas directamente en tu cuenta bancaria.</p>
                  <button className="stripe-connect-btn" onClick={handleConnectStripe}>Conectar con Stripe</button>
                </>
              )}
            </div>

            <button className="submit-btn">Guardar cambios</button>
            <button className="logout-btn" onClick={() => { apiLogout(); setLoggedIn(false); setUsername(""); setShowSettings(false); toast("Sesión cerrada"); }}>Cerrar sesión</button>
          </div>
        </div>
      )}

      {showCheckout && openItem && (
        <div className="overlay overlay-top" onClick={() => { setShowCheckout(false); setCheckoutError(null); }}>
          <div className="modal checkout-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => { setShowCheckout(false); setCheckoutError(null); }}><X size={14} /></button>
            <p className="auth-title">Confirmar compra</p>
            <p className="auth-subtitle" style={{ marginBottom: 18 }}>{openItem.title}</p>

            <div className="checkout-summary">
              <div className="checkout-row"><span>Precio artículo</span><span>{Number(openItem.price).toFixed(2)}€</span></div>
              <div className="checkout-row"><span>Envío</span><span>3,50€</span></div>
              <div className="checkout-row total"><span>Total a pagar</span><span>{(Number(openItem.price) + 3.5).toFixed(2)}€</span></div>
            </div>
            <p className="checkout-note">El envío se genera automáticamente al confirmar el pago. Pago seguro procesado por Stripe.</p>

            {checkoutError && <p style={{ color: "#FF4D6D", fontSize: 12, margin: "10px 0 0" }}>{checkoutError}</p>}

            <button className="submit-btn" onClick={confirmCheckout}>Pagar {(Number(openItem.price) + 3.5).toFixed(2)}€ con Stripe</button>
          </div>
        </div>
      )}

      {showLeague && (
        <div className="overlay" onClick={() => setShowLeague(false)}>
          <div className="modal league-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowLeague(false)}><X size={14} /></button>
            <div className="league-header">
              <Trophy size={20} color="#FFC24D" />
              <p className="auth-title" style={{ margin: 0 }}>Liga de vendedores</p>
            </div>
            <p className="auth-subtitle" style={{ marginBottom: 18 }}>Gana puntos vendiendo, recibiendo buenas valoraciones y ganando duelos de estilo</p>

            <p className="profile-section-title">Ranking esta semana</p>
            <div className="leaderboard">
              {LEADERBOARD.map((u) => (
                <div key={u.username} className={"lb-row" + (u.rank === 1 ? " first" : "")}>
                  <span className="lb-rank">#{u.rank}</span>
                  <div className="mini-avatar" style={{ background: PALETTE[u.rank % PALETTE.length] }}>{u.username[0].toUpperCase()}</div>
                  <div className="lb-info">
                    <p className="lb-name">@{u.username}</p>
                    <p className="lb-city"><MapPin size={10} /> {u.city}</p>
                  </div>
                  <span className="lb-points">{u.points} pts</span>
                </div>
              ))}
            </div>

            <p className="profile-section-title">Duelo de estilo de la semana</p>
            <div className="duel-box">
              <button className={"duel-side" + (duelVote === "a" ? " voted" : "")} onClick={() => setDuelVote("a")} disabled={!!duelVote}>
                <div className="duel-swatch" style={{ background: PALETTE[0] }} />
                <p className="duel-title">{DUEL.a.title}</p>
                <p className="duel-seller">@{DUEL.a.seller}</p>
                <p className="duel-votes">{DUEL.a.votes + (duelVote === "a" ? 1 : 0)} votos</p>
              </button>
              <span className="duel-vs">VS</span>
              <button className={"duel-side" + (duelVote === "b" ? " voted" : "")} onClick={() => setDuelVote("b")} disabled={!!duelVote}>
                <div className="duel-swatch" style={{ background: PALETTE[4] }} />
                <p className="duel-title">{DUEL.b.title}</p>
                <p className="duel-seller">@{DUEL.b.seller}</p>
                <p className="duel-votes">{DUEL.b.votes + (duelVote === "b" ? 1 : 0)} votos</p>
              </button>
            </div>
            {duelVote && <p className="duel-thanks">¡Voto registrado! Vuelve la próxima semana para un nuevo duelo.</p>}
          </div>
        </div>
      )}

      {showChat && chatItem && (
        <div className="overlay" onClick={() => setShowChat(false)}>
          <div className="modal chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-header">
              <button className="close-btn dark-close chat-close" onClick={() => setShowChat(false)}><X size={14} /></button>
              <div className="mini-avatar seller-avatar" style={{ background: PALETTE[chatItem.seller.length % PALETTE.length] }}>
                {chatItem.seller[0]?.toUpperCase()}
              </div>
              <div>
                <p className="chat-seller-name">@{chatItem.seller}</p>
                <p className="chat-item-ref">Sobre: {chatItem.title}</p>
              </div>
            </div>

            <div className="chat-thread">
              {(chatThreads[chatItem.id] || []).map((m) => (
                <div key={m.id} className={"chat-bubble " + (m.sender.username === username ? "me" : "seller")}>{m.content}</div>
              ))}
              {(chatThreads[chatItem.id] || []).length === 0 && (
                <p className="empty-tab">Aún no hay mensajes. Escribe el primero.</p>
              )}
            </div>

            <form className="chat-input-row" onSubmit={sendChatMessage}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escribe un mensaje..."
              />
              <button type="submit" className="chat-send-btn"><Send size={15} /></button>
            </form>
          </div>
        </div>
      )}

      {showOffer && openItem && (
        <div className="overlay overlay-top" onClick={() => setShowOffer(false)}>
          <div className="modal offer-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowOffer(false)}><X size={14} /></button>
            {offerSent ? (
              <div className="offer-sent">
                <HandCoins size={26} color="#4DE1C1" />
                <p>¡Oferta enviada!</p>
              </div>
            ) : (
              <>
                <p className="auth-title">Hacer una oferta</p>
                <p className="auth-subtitle" style={{ marginBottom: 18 }}>Precio original: {openItem.price}€</p>
                <form onSubmit={sendOffer}>
                  <label>Tu oferta</label>
                  <div className="input-icon price-input">
                    <span className="euro-prefix">€</span>
                    <input type="number" min="1" max={openItem.price} value={offerAmount} onChange={(e) => setOfferAmount(e.target.value)} placeholder={String(Math.round(openItem.price * 0.8))} />
                  </div>
                  <button className="submit-btn" type="submit">Enviar oferta</button>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {openItem && (
        <div className="overlay" onClick={closeItemView}>
          <div className="modal detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn dark-close" onClick={closeItemView}><X size={14} /></button>

            <div
              className="detail-media"
              style={{ backgroundImage: `url(${(openItem.images && openItem.images[galleryIndex]) || openItem.photo})`, backgroundSize: "cover", backgroundPosition: "center" }}
            >
              {openItem.images && openItem.images.length > 1 && (
                <>
                  <button
                    className="gallery-arrow left"
                    onClick={() => setGalleryIndex((i) => (i === 0 ? openItem.images.length - 1 : i - 1))}
                  >‹</button>
                  <button
                    className="gallery-arrow right"
                    onClick={() => setGalleryIndex((i) => (i === openItem.images.length - 1 ? 0 : i + 1))}
                  >›</button>
                  <div className="gallery-dots">
                    {openItem.images.map((_, i) => (
                      <span key={i} className={"gallery-dot" + (i === galleryIndex ? " active" : "")} onClick={() => setGalleryIndex(i)} />
                    ))}
                  </div>
                </>
              )}
              <div className="detail-media-actions">
                <button
                  className="heart detail-icon-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/item/${openItem.id}`);
                    toast("Enlace copiado", { icon: "🔗" });
                  }}
                ><Share2 size={16} /></button>
                <button className={"heart detail-icon-btn" + (saved.has(openItem.id) ? " on" : "")} onClick={() => toggleSave(openItem.id)}>
                  <Heart size={18} fill={saved.has(openItem.id) ? "#FF4D6D" : "none"} color={saved.has(openItem.id) ? "#FF4D6D" : "#fff"} />
                </button>
              </div>
            </div>

            <div className="detail-body">
              <div className="detail-top">
                <h3 className="detail-title">{openItem.title}</h3>
                <div>
                  <p className="detail-price">{openItem.price}€</p>
                  {openItem.price < 25 && <p className="trend-tag"><TrendingDown size={11} /> Por debajo de la media</p>}
                </div>
              </div>

              <div className="tag-row">
                <span className="info-tag">{openItem.category}</span>
                {openItem.size && <span className="info-tag">Talla {openItem.size}</span>}
                <span className="info-tag">{openItem.condition}</span>
              </div>

              {openItem.description && (
                <p className="detail-description">{openItem.description}</p>
              )}

              <div className="seller-card">
                <div className="mini-avatar seller-avatar" style={{ background: PALETTE[openItem.seller.length % PALETTE.length] }}>
                  {openItem.seller[0]?.toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <p className="seller-name">
                    @{openItem.seller}
                    {openItem.verified && <CheckCircle size={13} color="#4DE1C1" style={{ marginLeft: 5, verticalAlign: -2 }} />}
                  </p>
                  <p className="seller-rating"><Star size={11} fill="#FFC24D" color="#FFC24D" /> 4.8 · 32 ventas · <MapPin size={11} /> {openItem.city}</p>
                </div>
                <button className={"follow-btn" + (following.has(openItem.seller) ? " on" : "")} onClick={() => toggleFollow(openItem.seller)}>
                  {following.has(openItem.seller) ? <UserCheck size={13} /> : <UserPlus size={13} />}
                  {following.has(openItem.seller) ? "Siguiendo" : "Seguir"}
                </button>
              </div>

              <div className="impact-box">
                <Leaf size={16} color="#4DE1C1" />
                <div>
                  <p className="impact-title">Impacto de esta compra</p>
                  <p className="impact-sub">Ahorras ~{(openItem.price * 2.1).toFixed(0)} kg de CO₂ y {(openItem.price * 90).toFixed(0)} L de agua frente a comprarlo nuevo</p>
                </div>
              </div>

              <div className="detail-actions">
                <button className="chat-btn" onClick={() => openChat(openItem)}><MessageCircle size={15} /> Contactar</button>
                <button className="offer-btn" onClick={() => loggedIn ? setShowOffer(true) : setShowAuth(true)}><HandCoins size={15} /> Ofertar</button>
                <button className="buy-btn" onClick={() => loggedIn ? setShowCheckout(true) : setShowAuth(true)}>Comprar</button>
              </div>

              {allItems.filter((i) => i.seller === openItem.seller && i.id !== openItem.id).length > 0 && (
                <>
                  <p className="profile-section-title">Más de @{openItem.seller}</p>
                  <div className="mini-grid">
                    {allItems.filter((i) => i.seller === openItem.seller && i.id !== openItem.id).map((i, idx) => (
                      <div key={i.id} className="mini-card" onClick={() => viewItem(i)}>
                        <div className="mini-swatch" style={{ background: PALETTE[idx % PALETTE.length] }} />
                        <p className="mini-title">{i.title}</p>
                        <p className="mini-price">{i.price}€</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {isAdmin && (
                <button className="admin-delete-btn" onClick={() => removeItem(openItem.id)}>
                  <Trash2 size={14} /> Eliminar publicación (admin)
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
