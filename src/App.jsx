import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Cropper from "react-easy-crop";
import { Search, Plus, X, MessageCircle, Heart, Zap, User, Star, Mail, Lock, ImagePlus, Tag, Trash2, CheckCircle, Leaf, MapPin, HandCoins, UserPlus, UserCheck, Send, Trophy, Pencil, Bell, Settings, ShoppingBag, RefreshCw, LayoutGrid, Shirt, Footprints, Watch, TrendingDown, TrendingUp, Share2, PackageOpen, Truck, Package, ArrowLeft, ShieldCheck, FileWarning, SlidersHorizontal, FileCheck, LogOut, LogIn, MoreHorizontal, Home, Instagram, Facebook, Twitter, Camera, Car, BookOpen, Sparkles, Baby, Wrench, Guitar, Crop, Shield, Eye, Sun, Moon } from "lucide-react";
import {
  fetchItems, createItem, updateItem, deleteItem,
  login as apiLogin, register as apiRegister, logout as apiLogout, isLoggedIn, getUsername, getRole,
  fetchFavorites, addFavorite, removeFavorite, uploadImage,
  connectStripe, fetchStripeStatus, startCheckout, boostItem,
  fetchTransactions, createShipmentLabel, confirmReceived, submitReview, fetchReviews,
  fetchProfile, updateMyLocation, loginWithGoogle, searchByImage, deleteMyAccount,
  fetchMyFollowing, followUser, unfollowUser, subscribeNewsletter,
  fetchItemQuestions, askItemQuestion, answerItemQuestion, deleteItemQuestion, respondToOffer,
  forgotPassword, resetPassword, verifyEmail, resendVerification,
  fetchChatMessages, sendChatMessage as sendChatMessage_,
  fetchNotifications, markAllNotificationsRead,
  disputeTransaction,
  fetchAdminUsers, fetchAdminStats, fetchAdminDisputes, refundTransaction,
  banUser, unbanUser, fetchAdminReports, resolveReport, fetchAdminLogs, fetchAdminTop, fetchAdminTimeseries, submitReport,
  submitSupportMessage, fetchMySupportMessages, fetchAdminSupport, replySupportMessage,
  fetchPublicSettings, fetchAdminSettings, updateAdminSettings, adminEditItem, exportUsersCsv, exportTransactionsCsv, changeUserRole,
} from "./api";

const CATEGORY_ICONS = { "Todo": LayoutGrid, "Moda": Shirt, "Electrónica": Zap, "Hogar": PackageOpen, "Deporte": Footprints, "Juguetes y ocio": Watch, "Vehículos": Car, "Libros y música": BookOpen, "Belleza y cuidado personal": Sparkles, "Bebé e infantil": Baby, "Jardín y herramientas": Wrench, "Instrumentos musicales": Guitar, "Otros": Tag };
const CATEGORY_COLORS = { "Todo": "#C8C8CE", "Moda": "#FF4D6D", "Electrónica": "#4DA8FF", "Hogar": "#FFC24D", "Deporte": "#4DE1C1", "Juguetes y ocio": "#8C7CFF", "Vehículos": "#6A9BFF", "Libros y música": "#E0A458", "Belleza y cuidado personal": "#FF8FB1", "Bebé e infantil": "#7FD8A6", "Jardín y herramientas": "#A3C96B", "Instrumentos musicales": "#C97BFF", "Otros": "#FF8A4D" };
const CATEGORIES = ["Todo", "Moda", "Electrónica", "Hogar", "Deporte", "Juguetes y ocio", "Vehículos", "Libros y música", "Belleza y cuidado personal", "Bebé e infantil", "Jardín y herramientas", "Instrumentos musicales", "Otros"];
function buildFaqItems(s) {
  return [
    { q: "¿Cómo publico una prenda?", a: "Dale al botón \"Vender\", añade fotos, título, precio y descripción, y publícala. Aparecerá al momento en el feed." },
    { q: "¿Cómo recibo el dinero de una venta?", a: "Conecta tu cuenta de Stripe desde Ajustes. En cuanto se confirme el pago del comprador, el dinero (menos la comisión) se transfiere a tu cuenta." },
    { q: "¿Cuánto cobra Ropelin por cada venta?", a: `Una comisión del ${s.commissionPercent}% sobre el precio del artículo. El comprador paga además ${s.shippingFee.toFixed(2)}€ de gastos de envío fijos.` },
    { q: "¿Qué hago si el comprador no genera la etiqueta o no responde?", a: "Puedes contactar con el comprador desde el chat de la compra. Si no se resuelve, escríbenos desde \"Contactar\" y lo revisamos." },
    { q: "¿Puedo devolver un artículo si no era como esperaba?", a: "Contacta primero con el vendedor. Si no llegáis a un acuerdo, puedes abrir una disputa desde tus compras y nuestro equipo lo revisará." },
    { q: "¿Qué es \"Destacar\" una prenda?", a: `Por ${s.boostPrice.toFixed(2)}€ tu artículo aparece arriba del todo del feed durante ${s.boostDurationHours} horas, para que lo vea más gente.` },
  ];
}
const SIZES = ["XS", "S", "M", "L", "XL"];
const SHOE_SIZES = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];
const PALETTE = ["#FF4D6D", "#4DE1C1", "#FFC24D", "#8C7CFF", "#4DA8FF", "#FF8A4D"];
function miniSwatchStyle(item, idx) {
  const photo = (item.images && item.images[0]) || item.photo;
  return photo
    ? { backgroundImage: `url(${photo})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: PALETTE[idx % PALETTE.length] };
}

const AUTH_PAGE_STYLES = `
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #121214; }
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
// A partir de una imagen y el área seleccionada en el recortador, genera el archivo final ya recortado
function getCroppedImageFile(imageSrc, croppedAreaPixels, fileName) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = croppedAreaPixels.width;
      canvas.height = croppedAreaPixels.height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(
        img,
        croppedAreaPixels.x, croppedAreaPixels.y, croppedAreaPixels.width, croppedAreaPixels.height,
        0, 0, croppedAreaPixels.width, croppedAreaPixels.height
      );
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("No se pudo recortar la imagen"));
        resolve(new File([blob], fileName, { type: "image/jpeg" }));
      }, "image/jpeg", 0.92);
    };
    img.onerror = () => reject(new Error("No se pudo cargar la imagen"));
    img.src = imageSrc;
  });
}

function TikTokIcon({ size = 16 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M16.6 5.82a4.28 4.28 0 0 1-3.28-1.9V16.5a4.7 4.7 0 1 1-4-4.64v2.5a2.2 2.2 0 1 0 1.5 2.1V2h2.4a4.28 4.28 0 0 0 3.38 4.2v2.5a6.77 6.77 0 0 1-3.38-.92v.02c0-.03 3.38.02 3.38.02V5.82z" />
    </svg>
  );
}

function normalizeItem(raw) {
  const minutesAgo = raw.createdAt ? Math.max(0, Math.floor((Date.now() - new Date(raw.createdAt).getTime()) / 60000)) : 0;
  return {
    ...raw,
    price: Number(raw.price),
    seller: raw.seller?.username || raw.seller || raw.sellerId,
    photo: raw.images && raw.images.length ? raw.images[0] : `https://picsum.photos/seed/${raw.id}/500/500`,
    minutesAgo,
    city: raw.seller?.city || null,
    sellerLat: raw.seller?.latitude ?? null,
    sellerLng: raw.seller?.longitude ?? null,
    distanceKm: raw.distanceKm ?? null,
    verified: raw.verified || false,
    featured: raw.isFeatured || (raw.featuredUntil ? new Date(raw.featuredUntil) > new Date() : false),
    featuredUntil: raw.featuredUntil || null,
    favoritesCount: raw._count?.favoritedBy ?? raw.favoritesCount ?? 0,
  };
}

function ItemCard({ item, onOpen, index, saved, toggleSave }) {
  return (
    <div className="card" onClick={() => onOpen(item)}>
      <div className="card-media" style={{ backgroundImage: `url(${item.photo})` }}>
        {item.minutesAgo < 30 && <span className="new-ribbon">Nuevo</span>}
        {item.featured && <span className="featured-ribbon" style={{ top: item.minutesAgo < 30 ? 38 : 10 }}>Destacado</span>}
        <button className={"heart" + (saved ? " on" : "")} onClick={(e) => { e.stopPropagation(); toggleSave(item.id); }}>
          <Heart size={16} fill={saved ? "#FF4D6D" : "none"} color={saved ? "#FF4D6D" : "#fff"} />
        </button>
        <span className="price-pill">{item.price}€</span>
      </div>
      <div className="card-info">
        <h3>{item.title}</h3>
        <p>{item.size ? `${item.size} · ` : ""}{item.condition}</p>
        <p className="card-city"><MapPin size={10} /> {item.distanceKm !== null ? `a ${item.distanceKm < 1 ? "menos de 1" : Math.round(item.distanceKm)} km · ` : item.city ? `${item.city} · ` : ""}{timeAgo(item.minutesAgo)}</p>
      </div>
    </div>
  );
}

export default function RopelinApp() {
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
  const [photoSearchResults, setPhotoSearchResults] = useState(null); // null = búsqueda normal, array = resultados por foto
  const [photoSearchKeywords, setPhotoSearchKeywords] = useState([]);
  const [searchingPhoto, setSearchingPhoto] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Para ti");
  const [priceFilter, setPriceFilter] = useState({ min: "", max: "" });
  const [sizeFilter, setSizeFilter] = useState("");
  const [distanceFilter, setDistanceFilter] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [myLocation, setMyLocation] = useState(() => {
    try {
      const saved = localStorage.getItem("reloop_location");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [locatingMe, setLocatingMe] = useState(false);
  const [following, setFollowing] = useState(new Set());
  const [showOffer, setShowOffer] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showLeague, setShowLeague] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
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
  const [showLegal, setShowLegal] = useState(null); // "about" | "terms" | "privacy" | "cookies" | null
  const [cookieChoice, setCookieChoice] = useState(() => localStorage.getItem("reloop_cookie_consent") || null);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [cropperState, setCropperState] = useState(null); // { imageSrc, target, aspect, queue } | null
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const LEADERBOARD = [
    { rank: 1, username: "denia.k", city: "Sevilla", points: 1240 },
    { rank: 2, username: "marina_v", city: "Madrid", points: 1180 },
    { rank: 3, username: "nico_thrift", city: "Barcelona", points: 990 },
    { rank: 4, username: "clara.rt", city: "Valencia", points: 860 },
    { rank: 5, username: "pau_vintage", city: "Bilbao", points: 810 },
    { rank: 6, username: "irene.ok", city: "Zaragoza", points: 770 },
    { rank: 7, username: "marcos_rl", city: "Málaga", points: 740 },
    { rank: 8, username: "sofia.wear", city: "Murcia", points: 705 },
    { rank: 9, username: "davidcloset", city: "Alicante", points: 680 },
    { rank: 10, username: "lucia_re", city: "Vigo", points: 650 },
    { rank: 11, username: "hugo.mkt", city: "Gijón", points: 610 },
    { rank: 12, username: "carla_v2", city: "Granada", points: 585 },
    { rank: 13, username: "adrian.tx", city: "Córdoba", points: 560 },
    { rank: 14, username: "noa_shop", city: "Valladolid", points: 540 },
    { rank: 15, username: "diego.rl", city: "San Sebastián", points: 515 },
    { rank: 16, username: "vera_thrift", city: "Palma", points: 490 },
    { rank: 17, username: "alex_rw", city: "Santander", points: 470 },
    { rank: 18, username: "julia.mk", city: "Tarragona", points: 450 },
    { rank: 19, username: "sergio_v", city: "A Coruña", points: 430 },
    { rank: 20, username: "elena.re", city: "Castellón", points: 410 },
  ];

  function leagueBenefit(rank) {
    if (rank <= 3) return { label: "Envío gratis", className: "tier-gold" };
    if (rank <= 10) return { label: "-50% envío", className: "tier-silver" };
    return { label: "-25% envío", className: "tier-bronze" };
  }
  const [chatItem, setChatItem] = useState(null);
  const [chatThreads, setChatThreads] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerSent, setOfferSent] = useState(false);
  const [showPost, setShowPost] = useState(false);
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [openItem, setOpenItem] = useState(null);
  const [itemQuestions, setItemQuestions] = useState([]);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [sendingQuestion, setSendingQuestion] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [saved, setSaved] = useState(new Set());
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [theme, setTheme] = useState(() => localStorage.getItem("reloop_theme") || "dark");
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("reloop_theme", theme);
  }, [theme]);
  const [numCols, setNumCols] = useState(2);
  const [feedRowsShown, setFeedRowsShown] = useState(5);
  useEffect(() => { setFeedRowsShown(5); if (photoSearchResults !== null) clearPhotoSearch(); }, [category, query]);

  // Scroll infinito: al acercarnos al final de la página, mostramos más filas del feed automáticamente
  const displayItemsLengthRef = useRef(0);
  useEffect(() => {
    displayItemsLengthRef.current = (photoSearchResults !== null ? photoSearchResults : items).length;
  });
  useEffect(() => {
    function onScroll() {
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 800) {
        setFeedRowsShown((n) => {
          const maxRows = Math.ceil(displayItemsLengthRef.current / Math.max(numCols, 1));
          return n < maxRows ? n + 5 : n;
        });
      }
    }
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [numCols]);

  useEffect(() => {
    function updateCols() {
      const w = window.innerWidth;
      setNumCols(w >= 1500 ? 5 : w >= 1100 ? 4 : w >= 780 ? 3 : 2);
    }
    updateCols();
    window.addEventListener("resize", updateCols);
    return () => window.removeEventListener("resize", updateCols);
  }, []);
  const [username, setUsername] = useState(getUsername());

  useEffect(() => {
    fetchPublicSettings().then(setPlatformSettings).catch(() => {});
  }, []);

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
  const [viewingProfile, setViewingProfile] = useState(null); // username que se está viendo (null = el tuyo)
  const [otherProfileData, setOtherProfileData] = useState(null);
  const [otherProfileLoading, setOtherProfileLoading] = useState(false);

  function openProfile(uname) {
    const targetUsername = uname || username;
    setProfileReviews(null);
    fetchReviews(targetUsername).then(setProfileReviews).catch(() => {});

    if (!uname || uname === username) {
      setViewingProfile(null);
      setOtherProfileData(null);
      setProfileTab("venta");
      setShowProfile(true);
      fetchProfile(username).then((data) => {
        if (data.avatarUrl) { setMyAvatarUrl(data.avatarUrl); localStorage.setItem("reloop_avatar", data.avatarUrl); }
        if (data.coverUrl) { setMyCoverUrl(data.coverUrl); localStorage.setItem("reloop_cover", data.coverUrl); }
        if (data.bio) setMyBio(data.bio);
      }).catch(() => {});
      return;
    }
    setViewingProfile(uname);
    setOtherProfileData(null);
    setProfileTab("venta");
    setShowProfile(true);
    setOtherProfileLoading(true);
    fetchProfile(uname)
      .then(setOtherProfileData)
      .catch(() => toast.error("No se pudo cargar ese perfil"))
      .finally(() => setOtherProfileLoading(false));
  }
  const [profileReviews, setProfileReviews] = useState(null);
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [editProfileForm, setEditProfileForm] = useState({ bio: "", city: "" });
  const [myBio, setMyBio] = useState("");
  const [myAvatarUrl, setMyAvatarUrl] = useState(() => localStorage.getItem("reloop_avatar") || "");
  const [myCoverUrl, setMyCoverUrl] = useState(() => localStorage.getItem("reloop_cover") || "");
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [userRole, setUserRole] = useState(getRole());
  const isAdmin = userRole === "admin";
  const isModerator = userRole === "admin" || userRole === "moderator";
  const [showAdminPanel, setShowAdminPanel] = useState(false);

  // Bloquea el scroll de la página de fondo mientras haya cualquier ventana/modal abierto,
  // para que en móvil arrastrar dentro del modal no mueva el feed de detrás.
  // El detalle de la prenda (openItem) solo cuenta como "modal" en móvil: en escritorio es la página normal, no una ventana flotante, y necesita su propio scroll.
  const legalPageOpen = !!showLegal;
  // En escritorio, cuando se muestra el detalle de un artículo, el formulario de publicar, o Quiénes somos/Novedades como página, se oculta el feed de detrás (en vez de quedar apilado debajo)
  const hidesFeedOnDesktop = numCols >= 3 && openItem;
  // En Vender, Novedades, Quiénes somos, el apartado legal y la Ayuda se ocultan las tarjetas de artículos, pero el bloque de impacto y el boletín se quedan visibles
  const hidesFeedCardsOnDesktop = numCols >= 3 && (showPost || legalPageOpen || showHelpCenter);
  const anyModalOpen = !!(
    (openItem && numCols < 3) || showAuth || showProfile || showChat ||
    (showLegal && !(numCols >= 3 && legalPageOpen)) ||
    (showHelpCenter && numCols < 3) ||
    showSettings || showOrders || showFavorites || showLeague || showAdminPanel || cropperState
  );
  useEffect(() => {
    if (anyModalOpen) {
      const scrollY = window.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.overflow = "hidden";
    } else {
      const savedScrollY = document.body.style.top;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
      if (savedScrollY) {
        window.scrollTo(0, parseInt(savedScrollY || "0", 10) * -1);
      }
    }
    return () => {
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.overflow = "";
    };
  }, [anyModalOpen]);
  const [adminSection, setAdminSection] = useState(null); // null = menú principal del panel
  const [adminTab, setAdminTab] = useState("users");
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [adminDisputes, setAdminDisputes] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminUserSearch, setAdminUserSearch] = useState("");
  const [adminReports, setAdminReports] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [adminTop, setAdminTop] = useState(null);
  const [adminTimeseries, setAdminTimeseries] = useState([]);
  const [adminSupport, setAdminSupport] = useState([]);
  const [supportReplyDrafts, setSupportReplyDrafts] = useState({});
  const [banningUser, setBanningUser] = useState(null); // usuario sobre el que se está escribiendo el motivo de suspensión
  const [banReason, setBanReason] = useState("");
  const [showReportForm, setShowReportForm] = useState(null); // { targetType, itemId?, reportedUsername? }
  const [reportReason, setReportReason] = useState("");
  const [helpTab, setHelpTab] = useState("faq");
  const [supportSubject, setSupportSubject] = useState("");
  const [supportMessage, setSupportMessage] = useState("");
  const [mySupportMessages, setMySupportMessages] = useState([]);
  const [platformSettings, setPlatformSettings] = useState({ commissionPercent: 8, shippingFee: 3.5, boostPrice: 1.99, boostDurationHours: 48, categories: CATEGORIES.filter((c) => c !== "Todo"), instagramUrl: "", tiktokUrl: "", facebookUrl: "", twitterUrl: "", updatesText: "" });
  const [adminSettingsForm, setAdminSettingsForm] = useState(null);
  const [adminUserFilters, setAdminUserFilters] = useState({ verified: "", stripeConnected: "" });
  const [adminUserPage, setAdminUserPage] = useState(1);
  const [adminUserPages, setAdminUserPages] = useState(1);
  const [editingAdminItem, setEditingAdminItem] = useState(null);
  const [adminItemEditForm, setAdminItemEditForm] = useState({ title: "", description: "" });
  const [soldItems] = useState([
    { id: "s001", title: "Abrigo de paño", price: 32 },
    { id: "s002", title: "Botas Chelsea", price: 24 },
  ]);
  const [form, setForm] = useState({ title: "", category: "Moda", size: "", isShoe: false, price: "", description: "", condition: "Bueno", images: [] });
  const [uploadingImages, setUploadingImages] = useState([]);
  const [authForm, setAuthForm] = useState({ email: "", password: "", username: "", city: "" });
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
      const data = await fetchItems(myLocation ? { lat: myLocation.latitude, lng: myLocation.longitude } : {});
      setAllItems(data.map(normalizeItem));
    } catch (err) {
      setLoadError("No se pudo conectar con el servidor. Puede que esté reiniciándose o que no esté disponible ahora mismo.");
    } finally {
      setLoading(false);
    }
  }, [myLocation]);

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

  // Carga a quién sigo al iniciar sesión, igual que los favoritos
  useEffect(() => {
    if (!loggedIn) { setFollowing(new Set()); return; }
    fetchMyFollowing()
      .then((usernames) => setFollowing(new Set(usernames)))
      .catch(() => {});
  }, [loggedIn]);

  // Filtra en el cliente sobre la lista ya cargada del backend (búsqueda, categoría, precio, talla, distancia y orden)
  useEffect(() => {
    let filtered = allItems.filter((it) => {
      const matchQuery = it.title.toLowerCase().includes(query.toLowerCase());
      const matchCat = category === "Todo" || category === "Para ti" || it.category === category;
      const matchMin = !priceFilter.min || Number(it.price) >= Number(priceFilter.min);
      const matchMax = !priceFilter.max || Number(it.price) <= Number(priceFilter.max);
      const matchSize = !sizeFilter || it.size === sizeFilter;
      const matchDistance = !distanceFilter || (it.distanceKm !== null && it.distanceKm <= Number(distanceFilter));
      return matchQuery && matchCat && matchMin && matchMax && matchSize && matchDistance;
    });

    if (sortBy === "price_asc") {
      filtered = [...filtered].sort((a, b) => (b.isFeatured - a.isFeatured) || (Number(a.price) - Number(b.price)));
    } else if (sortBy === "price_desc") {
      filtered = [...filtered].sort((a, b) => (b.isFeatured - a.isFeatured) || (Number(b.price) - Number(a.price)));
    } else if (sortBy === "distance") {
      filtered = [...filtered].sort((a, b) => (b.isFeatured - a.isFeatured) || ((a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity)));
    }

    setItems(filtered);
  }, [allItems, query, category, priceFilter, sizeFilter, distanceFilter, sortBy]);

  // Al entrar a la web desde escritorio, si no has iniciado sesión, se muestra el login/registro automáticamente.
  // En móvil no se fuerza: solo queda el botón de "Entrar" normal.
  useEffect(() => {
    if (!loggedIn && window.innerWidth >= 780) setShowAuth(true);
  }, []);

  // Enlaces directos: si la URL es /item/:id o /perfil/:username, abre lo que corresponda
  useEffect(() => {
    if (params.id && allItems.length) {
      const found = allItems.find((i) => i.id === params.id);
      if (found) setOpenItem(found);
    }
  }, [params.id, allItems]);

  useEffect(() => {
    if (params.username) openProfile(params.username);
  }, [params.username]);

  // Abrir/cerrar el detalle de un artículo actualizando también la URL (para poder compartir el enlace)
  function viewItem(item) {
    setShowLegal(null);
    setShowPost(false);
    setShowHelpCenter(false);
    setOpenItem(item);
    setGalleryIndex(0);
    navigate(`/item/${item.id}`);
  }

  // Abre el formulario para publicar un artículo nuevo, cerrando antes cualquier otra página abierta (para que no se apilen)
  function openPostForm() {
    setShowLegal(null);
    setOpenItem(null);
    setShowHelpCenter(false);
    setEditingItem(null);
    setForm({ title: "", category: "Moda", size: "", isShoe: false, price: "", description: "", condition: "Bueno", images: [] });
    setShowPost(true);
  }

  // Abre una página legal/informativa (Quiénes somos, Novedades...), cerrando antes las demás páginas
  function openLegalPage(type) {
    setShowPost(false);
    setOpenItem(null);
    setShowHelpCenter(false);
    setShowLegal(type);
  }

  useEffect(() => {
    if (openItem) {
      document.title = `${openItem.title} — ${openItem.price}€ | Ropelin, segunda mano`;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", `${openItem.title} de segunda mano por ${openItem.price}€. ${openItem.category ? `Categoría: ${openItem.category}.` : ""} Cómpralo en Ropelin, la app de compraventa de segunda mano.`);
    } else {
      document.title = "Ropelin — Compra y vende de segunda mano en España | Ropa, electrónica y más";
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) metaDesc.setAttribute("content", "Compra y vende de segunda mano en España: ropa, electrónica, hogar, vehículos y mucho más. Publica gratis en segundos, chatea con otros usuarios y paga seguro.");
    }
  }, [openItem]);

  // Carga las preguntas públicas del artículo abierto
  useEffect(() => {
    if (!openItem) { setItemQuestions([]); return; }
    fetchItemQuestions(openItem.id).then(setItemQuestions).catch(() => {});
  }, [openItem?.id]);

  async function handleAskQuestion(e) {
    e.preventDefault();
    if (!loggedIn) { setShowAuth(true); return; }
    if (!newQuestionText.trim()) return;
    setSendingQuestion(true);
    try {
      await askItemQuestion(openItem.id, newQuestionText.trim());
      setNewQuestionText("");
      toast.success("Pregunta enviada");
      fetchItemQuestions(openItem.id).then(setItemQuestions).catch(() => {});
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingQuestion(false);
    }
  }

  async function handleAnswerQuestion(questionId) {
    const answer = (answerDrafts[questionId] || "").trim();
    if (!answer) return;
    try {
      await answerItemQuestion(openItem.id, questionId, answer);
      setAnswerDrafts((prev) => ({ ...prev, [questionId]: "" }));
      toast.success("Respuesta enviada");
      fetchItemQuestions(openItem.id).then(setItemQuestions).catch(() => {});
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDeleteQuestion(questionId) {
    try {
      await deleteItemQuestion(openItem.id, questionId);
      setItemQuestions((prev) => prev.filter((q) => q.id !== questionId));
      toast.success("Pregunta eliminada");
    } catch (err) {
      toast.error(err.message);
    }
  }

  function closeItemView() {
    setOpenItem(null);
    navigate(-1);
  }
  function goHome() {
    setOpenItem(null);
    setShowProfile(false);
    setCategory("Para ti");
    setQuery("");
    navigate("/");
  }

  function startCropping(file, target, queue = []) {
    if (!file) return;
    const imageSrc = URL.createObjectURL(file);
    setCropperState({ imageSrc, target, aspect: target === "cover" ? 3 : 1, queue });
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
  }

  function onCropComplete(_croppedArea, pixels) {
    setCroppedAreaPixels(pixels);
  }

  function cancelCropping() {
    if (cropperState) URL.revokeObjectURL(cropperState.imageSrc);
    setCropperState(null);
  }

  async function confirmCrop() {
    if (!cropperState || !croppedAreaPixels) return;
    const { target, queue, imageSrc } = cropperState;
    try {
      const croppedFile = await getCroppedImageFile(imageSrc, croppedAreaPixels, `recorte-${Date.now()}.jpg`);
      URL.revokeObjectURL(imageSrc);

      if (target === "avatar") await uploadAvatarPhoto(croppedFile);
      else if (target === "cover") await uploadCoverPhoto(croppedFile);
      else if (target === "item") await uploadItemPhoto(croppedFile);

      if (queue.length > 0) {
        const [next, ...rest] = queue;
        startCropping(next, target, rest);
      } else {
        setCropperState(null);
      }
    } catch (err) {
      toast.error(err.message || "No se pudo recortar la imagen");
      setCropperState(null);
    }
  }

  async function uploadAvatarPhoto(file) {
    if (!file) return;
    try {
      const url = await uploadImage(file);
      await updateMyLocation({ avatarUrl: url });
      setMyAvatarUrl(url);
      localStorage.setItem("reloop_avatar", url);
      toast.success("Foto de perfil actualizada");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function uploadCoverPhoto(file) {
    if (!file) return;
    try {
      const url = await uploadImage(file);
      await updateMyLocation({ coverUrl: url });
      setMyCoverUrl(url);
      localStorage.setItem("reloop_cover", url);
      toast.success("Portada actualizada");
    } catch (err) {
      toast.error(err.message);
    }
  }

  function openEditProfile() {
    setEditProfileForm({ bio: myBio || "", city: myLocation?.city || "" });
    setShowEditProfile(true);
  }

  async function saveEditProfile() {
    try {
      await updateMyLocation({ bio: editProfileForm.bio, city: editProfileForm.city });
      setMyBio(editProfileForm.bio);
      if (editProfileForm.city) {
        const updatedLocation = { ...(myLocation || {}), city: editProfileForm.city };
        setMyLocation(updatedLocation);
        localStorage.setItem("reloop_location", JSON.stringify(updatedLocation));
      }
      toast.success("Perfil actualizado");
      setShowEditProfile(false);
    } catch (err) {
      toast.error(err.message);
    }
  }

  function detectMyLocation() {
    if (!navigator.geolocation) {
      toast.error("Tu navegador no permite compartir la ubicación");
      return;
    }
    setLocatingMe(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        let city = null;
        try {
          // Servicio gratuito, sin necesidad de clave, para convertir coordenadas en un nombre de ciudad
          const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=es`);
          const data = await res.json();
          city = data.city || data.locality || null;
        } catch {
          // Si falla, seguimos igualmente solo con las coordenadas
        }

        const location = { latitude, longitude, city };
        setMyLocation(location);
        localStorage.setItem("reloop_location", JSON.stringify(location));

        if (loggedIn) {
          try {
            await updateMyLocation(location);
          } catch (err) {
            toast.error(err.message);
          }
        }

        toast.success(city ? `Ubicación guardada: ${city}` : "Ubicación guardada");
        setLocatingMe(false);
      },
      () => {
        toast.error("No hemos podido acceder a tu ubicación. Revisa los permisos del navegador.");
        setLocatingMe(false);
      }
    );
  }

  function viewProfile() {
    openProfile(username);
    navigate(`/perfil/${username}`);
  }
  async function handleDeleteAccount() {
    if (deleteConfirmText !== username) {
      toast.error("Escribe tu nombre de usuario exactamente para confirmar");
      return;
    }
    setDeletingAccount(true);
    try {
      await deleteMyAccount();
      toast.success("Tu cuenta se ha eliminado");
      apiLogout();
      setLoggedIn(false);
      setUsername("");
      setUserRole("user");
      setShowDeleteAccount(false);
      setShowSettings(false);
      navigate("/");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeletingAccount(false);
    }
  }

  function handleCookieChoice(choice) {
    setCookieChoice(choice);
    localStorage.setItem("reloop_cookie_consent", choice);
  }

  async function handlePhotoSearch(file) {
    if (!file) return;
    setSearchingPhoto(true);
    try {
      const { keywords, items: results } = await searchByImage(file);
      if (!keywords || keywords.length === 0) {
        toast.error("No se pudo identificar qué hay en la foto");
        return;
      }
      setPhotoSearchKeywords(keywords);
      setPhotoSearchResults(results);
      toast.success(`Buscando: ${keywords.join(", ")}`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSearchingPhoto(false);
    }
  }

  function clearPhotoSearch() {
    setPhotoSearchResults(null);
    setPhotoSearchKeywords([]);
  }

  function handleNewsletterSubmit(e) {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(newsletterEmail)) {
      toast.error("Escribe un email válido");
      return;
    }
    subscribeNewsletter(newsletterEmail)
      .then(() => {
        setNewsletterSubscribed(true);
        toast.success("¡Te has suscrito!");
      })
      .catch((err) => toast.error(err.message));
  }

  function closeProfileView() {
    setShowProfile(false);
    navigate(-1);
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
    const alreadyFollowing = following.has(seller);
    setFollowing((prev) => {
      const next = new Set(prev);
      alreadyFollowing ? next.delete(seller) : next.add(seller);
      return next;
    });
    const action = alreadyFollowing ? unfollowUser(seller) : followUser(seller);
    action.catch((err) => {
      // Si falla de verdad en el servidor, revertimos el cambio visual
      setFollowing((prev) => {
        const next = new Set(prev);
        alreadyFollowing ? next.add(seller) : next.delete(seller);
        return next;
      });
      toast.error(err.message);
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
    if (!offerAmount || Number(offerAmount) <= 0) return;
    try {
      await sendChatMessage_(openItem.id, `Oferta: ${offerAmount}€`, Number(offerAmount));
      setOfferSent(true);
      setTimeout(() => { setShowOffer(false); setOfferSent(false); setOfferAmount(""); }, 1400);
    } catch (err) {
      toast.error(err.message);
    }
  }

  function startEdit(item) {
    setShowLegal(null);
    setOpenItem(null);
    setShowHelpCenter(false);
    setEditingItem(item);
    setForm({ title: item.title, category: item.category, size: item.size || "", isShoe: !!(item.size && SHOE_SIZES.includes(item.size)), price: String(item.price), description: item.description || "", condition: item.condition, images: item.images || [] });
    setShowProfile(false);
    setShowPost(true);
  }

  function handleImageSelect(e) {
    const files = Array.from(e.target.files || []).slice(0, 6 - form.images.length);
    e.target.value = ""; // permite volver a seleccionar el mismo archivo si se quita y se vuelve a añadir
    if (files.length === 0) return;
    const [first, ...rest] = files;
    startCropping(first, "item", rest);
  }

  async function uploadItemPhoto(file) {
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
  const [counterDrafts, setCounterDrafts] = useState({});
  const [respondingOfferId, setRespondingOfferId] = useState(null);

  async function handleOfferAction(itemId, messageId, action) {
    const counterAmount = action === "counter" ? counterDrafts[messageId] : undefined;
    if (action === "counter" && (!counterAmount || Number(counterAmount) <= 0)) {
      toast.error("Escribe una cantidad válida para la contraoferta");
      return;
    }
    setRespondingOfferId(messageId);
    try {
      await respondToOffer(itemId, messageId, action, counterAmount);
      const updated = await fetchChatMessages(itemId);
      setChatThreads((prev) => ({ ...prev, [itemId]: updated }));
      setCounterDrafts((prev) => ({ ...prev, [messageId]: "" }));
      toast.success(
        action === "accept" ? "Oferta aceptada" :
        action === "reject" ? "Oferta rechazada" :
        "Contraoferta enviada"
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setRespondingOfferId(null);
    }
  }

  async function payAcceptedOffer(itemId) {
    setCheckoutError(null);
    try {
      const url = await startCheckout(itemId);
      window.location.href = url;
    } catch (err) {
      toast.error(err.message);
    }
  }

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

  async function handleBoost(itemId) {
    try {
      const url = await boostItem(itemId);
      window.location.href = url; // redirige a Stripe para pagar el destacado
    } catch (err) {
      toast.error(err.message);
    }
  }

  function openAdminPanel() {
    setShowAdminPanel(true);
    setAdminSection(null); // al abrir, mostramos siempre el menú principal
    if (isAdmin) {
      fetchAdminStats().then(setAdminStats).catch(() => {});
    }
    fetchAdminDisputes().then(setAdminDisputes).catch(() => {});
    fetchAdminReports().then(setAdminReports).catch(() => {});
    fetchAdminSupport().then(setAdminSupport).catch(() => {});
  }

  async function loadAdminTab(tab, page = 1) {
    setAdminSection(tab);
    setAdminTab(tab);
    setAdminLoading(true);
    try {
      if (tab === "users") {
        const result = await fetchAdminUsers({ search: adminUserSearch, verified: adminUserFilters.verified, stripeConnected: adminUserFilters.stripeConnected, page });
        setAdminUsers(result.users);
        setAdminUserPage(result.page);
        setAdminUserPages(result.pages);
      }
      if (tab === "stats") {
        setAdminStats(await fetchAdminStats());
        setAdminTimeseries(await fetchAdminTimeseries());
        setAdminTop(await fetchAdminTop());
      }
      if (tab === "disputes") setAdminDisputes(await fetchAdminDisputes());
      if (tab === "reports") setAdminReports(await fetchAdminReports());
      if (tab === "logs") setAdminLogs(await fetchAdminLogs());
      if (tab === "support") setAdminSupport(await fetchAdminSupport());
      if (tab === "settings") setAdminSettingsForm(await fetchAdminSettings());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleUserSearch(e) {
    e.preventDefault();
    loadAdminTab("users", 1);
  }

  function handleUserFilterChange(key, value) {
    setAdminUserFilters((prev) => ({ ...prev, [key]: value }));
    setTimeout(() => loadAdminTab("users", 1), 0);
  }

  async function handleChangeUserRole(user, role) {
    try {
      await changeUserRole(user.id, role);
      toast.success(`@${user.username} ahora es ${role}`);
      loadAdminTab("users", adminUserPage);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function saveAdminSettings() {
    try {
      const updated = await updateAdminSettings(adminSettingsForm);
      setAdminSettingsForm(updated);
      setPlatformSettings(await fetchPublicSettings());
      toast.success("Configuración guardada");
    } catch (err) {
      toast.error(err.message);
    }
  }

  function openAdminItemEdit(item) {
    setEditingAdminItem(item);
    setAdminItemEditForm({ title: item.title, description: item.description || "" });
  }

  async function saveAdminItemEdit() {
    try {
      await adminEditItem(editingAdminItem.id, adminItemEditForm);
      toast.success("Publicación actualizada");
      setOpenItem((prev) => prev ? { ...prev, ...adminItemEditForm } : prev);
      setEditingAdminItem(null);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleExportUsers() {
    try {
      await exportUsersCsv();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleExportTransactions() {
    try {
      await exportTransactionsCsv();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function confirmBanUser() {
    try {
      await banUser(banningUser.id, banReason);
      toast.success(`@${banningUser.username} suspendido`);
      setBanningUser(null);
      setBanReason("");
      loadAdminTab("users");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleUnbanUser(user) {
    try {
      await unbanUser(user.id);
      toast.success(`@${user.username} reactivado`);
      loadAdminTab("users");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleResolveReport(id) {
    try {
      await resolveReport(id);
      toast.success("Denuncia marcada como revisada");
      loadAdminTab("reports");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function submitReportForm(e) {
    e.preventDefault();
    if (!reportReason.trim()) return;
    try {
      const { targetType, itemId, reportedUsername, questionId } = showReportForm;
      const payload = targetType === "item" ? itemId : targetType === "question" ? questionId : reportedUsername;
      await submitReport(targetType, payload, reportReason);
      toast.success("Denuncia enviada. Gracias por avisarnos.");
      setShowReportForm(null);
      setReportReason("");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function openHelpCenter() {
    setShowLegal(null);
    setOpenItem(null);
    setShowPost(false);
    setShowHelpCenter(true);
    setHelpTab("faq");
    if (loggedIn) {
      try {
        setMySupportMessages(await fetchMySupportMessages());
      } catch (err) {
        toast.error(err.message);
      }
    }
  }

  async function submitSupportForm(e) {
    e.preventDefault();
    if (!supportSubject.trim() || !supportMessage.trim()) return;
    try {
      await submitSupportMessage(supportSubject, supportMessage);
      toast.success("Mensaje enviado. Te responderemos pronto.");
      setSupportSubject("");
      setSupportMessage("");
      setMySupportMessages(await fetchMySupportMessages());
      setHelpTab("mine");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleReplySupport(id) {
    const reply = supportReplyDrafts[id];
    if (!reply?.trim()) return;
    try {
      await replySupportMessage(id, reply);
      toast.success("Respuesta enviada");
      setSupportReplyDrafts((prev) => ({ ...prev, [id]: "" }));
      setAdminSupport(await fetchAdminSupport());
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleAdminRefund(transactionId) {
    try {
      await refundTransaction(transactionId);
      toast.success("Reembolso procesado");
      loadAdminTab("disputes");
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

  async function handleGoogleCredential(response) {
    try {
      const data = await loginWithGoogle(response.credential);
      setUsername(data.user.username);
      setLoggedIn(true);
      setUserRole(data.user.role || "user");
      setShowAuth(false);
      toast.success(`¡Bienvenido, @${data.user.username}!`);
      if (data.needsCity) {
        toast("Añade tu ciudad desde tu perfil para ver la distancia a otros artículos", { icon: "📍", duration: 6000 });
      }
    } catch (err) {
      toast.error(err.message?.includes("pattern") ? "No se pudo completar el inicio de sesión con Google. Inténtalo de nuevo." : err.message);
    }
  }

  useEffect(() => {
    if (!showAuth) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google) return;
    window.google.accounts.id.initialize({ client_id: clientId, callback: handleGoogleCredential, itp_support: true, ux_mode: "popup" });
    const el = document.getElementById("google-signin-btn");
    if (el) {
      el.innerHTML = "";
      window.google.accounts.id.renderButton(el, { theme: "filled_black", size: "large", width: 320, text: "continue_with" });
    }
  }, [showAuth]);

  async function handleAuth(e) {
    e.preventDefault();
    setAuthError(null);
    try {
      const result = authMode === "login"
        ? await apiLogin(authForm.email, authForm.password)
        : await apiRegister(authForm.email, authForm.password, authForm.username, authForm.city);
      setUsername(result.username);
      setLoggedIn(true);
      setUserRole(result.role || "user");
      setShowAuth(false);
      setAuthForm({ email: "", password: "", username: "", city: "" });
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
              <button className="submit-btn" onClick={() => navigate("/")}>Ir a Ropelin</button>
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
            <button className="submit-btn" onClick={() => navigate("/")}>Ir a Ropelin</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {!cookieChoice && (
        <div className="cookie-banner">
          <p>
            Usamos cookies propias y de terceros para que la web funcione, recordar tu sesión y entender cómo la usas.{" "}
            <button className="cookie-link" onClick={() => setShowLegal("cookies")}>Más información</button>
          </p>
          <div className="cookie-actions">
            <button className="btn ghost" onClick={() => handleCookieChoice("rejected")}>Solo necesarias</button>
            <button className="btn primary" onClick={() => handleCookieChoice("accepted")}>Aceptar todo</button>
          </div>
        </div>
      )}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: { background: "#1A1A1E", color: "#F2F2F0", border: "1px solid #29292f", fontFamily: "'Helvetica Neue', Arial, sans-serif", fontSize: "13px" },
          success: { iconTheme: { primary: "#4DE1C1", secondary: "#1A1A1E" } },
          error: { iconTheme: { primary: "#FF4D6D", secondary: "#1A1A1E" } },
        }}
      />
      <style>{`
        :root {
          --bg: #121214; --bg-translucent: #121214ee; --card: #1A1A1E; --card-alt: #17171b; --surface: #26262c; --surface2: #1F1F24;
          --border: #29292f; --input-border: #333; --text: #F2F2F0; --body: #C8C8CE; --sub: #9A9AA3; --faint: #6A6A73;
        }
        [data-theme="light"] {
          --bg: #F7F7F8; --bg-translucent: #F7F7F8ee; --card: #FFFFFF; --card-alt: #F2F2F3; --surface: #ECECEF; --surface2: #EFEFF1;
          --border: #E2E2E6; --input-border: #D6D6DA; --text: #121214; --body: #3A3A40; --sub: #6A6A73; --faint: #9A9AA3;
        }
        * { box-sizing: border-box; }
        html, body { overflow-x: hidden; margin: 0; background: var(--bg); }
        .app { min-height: 100vh; max-width: 100vw; overflow-x: hidden; background: var(--bg); color: var(--text); font-family: 'Helvetica Neue', Arial, sans-serif; }
        header.top { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; row-gap: 10px; padding: 16px 20px; position: sticky; top: 0; background: var(--bg-translucent); backdrop-filter: blur(6px); z-index: 5; }
        .brand { display: flex; align-items: center; gap: 8px; }
        .brand-mark { width: 30px; height: 30px; border-radius: 9px; background: linear-gradient(135deg, #FF4D6D, #8C7CFF); display: flex; align-items: center; justify-content: center; }
        .brand h1 { font-size: 20px; font-weight: 800; letter-spacing: -0.5px; margin: 0; }
        .top-actions { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; justify-content: flex-end; }
        .mobile-bottom-nav { display: none; }
        @media (max-width: 780px) {
          .hide-on-mobile-nav { display: none !important; }
          .mobile-bottom-nav {
            display: flex; position: fixed; bottom: 0; left: 0; right: 0; z-index: 90;
            background: var(--card); border-top: 1px solid var(--border); padding: 8px 6px calc(8px + env(safe-area-inset-bottom));
            justify-content: space-around; align-items: center;
          }
          .mobile-bottom-nav button {
            background: none; border: none; color: var(--sub); display: flex; flex-direction: column; align-items: center;
            gap: 3px; font-size: 10px; font-family: inherit; cursor: pointer; padding: 4px 8px; position: relative; flex: 1;
          }
          .mobile-nav-sell {
            background: linear-gradient(135deg, #FF4D6D, #FF7A45) !important; color: var(--bg) !important; border-radius: 50%;
            width: 46px; height: 46px; flex: none !important; margin-top: -18px; box-shadow: 0 6px 16px rgba(255,77,109,0.4);
          }
          .mobile-nav-sell span { display: none; }
          .bottom-nav-avatar { width: 20px; height: 20px; font-size: 10px; margin: 0; }
          .bottom-nav-dot { position: absolute; top: -2px; right: 10px; }
          body { padding-bottom: 62px; }
        }
        .more-menu-wrap { position: relative; }
        .more-menu-backdrop { position: fixed; inset: 0; z-index: 59; }
        .more-menu-panel { position: absolute; top: calc(100% + 8px); right: 0; z-index: 60; background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 6px; min-width: 190px; box-shadow: 0 12px 32px rgba(0,0,0,0.4); display: flex; flex-direction: column; }
        .more-menu-panel button { display: flex; align-items: center; gap: 10px; width: 100%; padding: 10px 12px; background: none; border: none; color: var(--text); font-size: 13.5px; font-family: inherit; border-radius: 8px; cursor: pointer; text-align: left; position: relative; }
        .more-menu-panel button:hover { background: var(--border); }
        .notif-dot.inline { position: static; margin-left: auto; }
        @media (max-width: 640px) {
          .btn-label { display: none; }
          .league-btn, .admin-panel-btn, .top-actions > .btn.ghost:not(.league-btn):not(.admin-panel-btn) { width: 36px; height: 36px; padding: 0; border-radius: 50%; justify-content: center; }
        }
        .badge { font-size: 12px; background: var(--surface2); border: 1px solid var(--input-border); padding: 6px 12px; border-radius: 20px; color: #4DE1C1; }
        .profile-badge { display: flex; align-items: center; gap: 6px; cursor: pointer; color: var(--text); }
        .mini-avatar { width: 20px; height: 20px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; color: var(--bg); }
        .profile-modal { max-width: 400px; padding: 0; }
        .profile-banner { height: 100px; position: relative; overflow: hidden; border-radius: 22px 22px 0 0; }
        .banner-texture { position: absolute; inset: 0; background-image: radial-gradient(#ffffff22 1px, transparent 1px); background-size: 10px 10px; }
        .profile-content { padding: 0 22px 24px; text-align: center; margin-top: -30px; position: relative; z-index: 2; }
        .profile-avatar-lg { width: 84px; height: 84px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 32px; font-weight: 700; color: var(--bg); margin: 0 auto 10px; border: 5px solid var(--card); box-shadow: 0 0 0 2px var(--border), 0 4px 14px rgba(0,0,0,0.45); position: relative; z-index: 2; }
        .edit-avatar-row { display: flex; align-items: center; gap: 14px; margin: 14px 0 6px; }
        .profile-name { font-size: 18px; font-weight: 700; margin: 0; }
        .profile-sub { font-size: 12px; color: var(--sub); margin: 4px 0 14px; display: flex; align-items: center; justify-content: center; gap: 4px; }
        .profile-quick-actions { display: flex; justify-content: center; gap: 8px; margin: 4px 0 16px; }
        .edit-profile-btn { border: 1px solid var(--input-border); background: var(--surface2); color: var(--body); border-radius: 20px; padding: 7px 16px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .details-toggle { border: none; background: none; color: #4DE1C1; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .profile-details { text-align: left; margin-bottom: 6px; animation: fadeIn .15s ease; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .edit-profile-btn:hover { border-color: #4DE1C1; color: #4DE1C1; }
        .stats-row { display: flex; gap: 10px; margin-bottom: 18px; }
        .stat-box { flex: 1; background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 14px 10px; text-align: center; display: flex; flex-direction: column; align-items: center; gap: 4px; }
        .stat-box strong { display: block; font-size: 18px; }
        .stat-box span { font-size: 10px; color: var(--sub); text-transform: uppercase; letter-spacing: .5px; }
        .profile-tabs { margin-bottom: 16px; }
        .empty-tab { font-size: 12px; color: var(--faint); padding: 20px 0; }
        .mini-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; text-align: left; }
        .mini-row { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: thin; }
        .mini-row .mini-card { flex: 0 0 160px; }
        .related-heading { margin-top: 20px; }
        .mini-card { background: var(--bg); border: 1px solid var(--border); border-radius: 14px; overflow: hidden; cursor: pointer; transition: transform .12s ease, border-color .12s ease; }
        .mini-card:hover { transform: translateY(-2px); border-color: #4DE1C155; }
        .profile-section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--sub); margin: 4px 0 10px; }
        .mini-card.sold { opacity: 0.6; }
        .mini-swatch { height: 60px; position: relative; }
        .mini-featured-badge { position: absolute; top: 4px; left: 4px; background: linear-gradient(135deg, #FFC24D, #FF8A4D); color: var(--bg); font-size: 8px; font-weight: 800; text-transform: uppercase; padding: 2px 6px; border-radius: 6px; }
        .mini-title { font-size: 12px; font-weight: 600; margin: 8px 10px 2px; }
        .mini-price { font-size: 12px; font-weight: 700; color: #4DE1C1; margin: 0 10px 10px; }
        button { transition: transform .1s ease, opacity .1s ease; }
        button:active { transform: scale(0.96); }
        .btn { display: flex; align-items: center; gap: 6px; border: none; border-radius: 20px; padding: 10px 16px; font-size: 13px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .btn.primary { background: linear-gradient(135deg, #FF4D6D, #FF8A4D); color: var(--bg); }
        .btn.ghost { background: var(--surface2); color: var(--text); border: 1px solid var(--input-border); }
        .admin-toggle { display: flex; align-items: center; gap: 6px; border: 1px solid var(--input-border); background: var(--surface2); color: var(--sub); border-radius: 20px; padding: 9px 14px; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; }
        .admin-toggle.on { background: linear-gradient(135deg, #8C7CFF, #4DA8FF); color: var(--bg); border-color: transparent; }
        .admin-delete-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; margin-top: 10px; border: 1px solid #FF4D6D55; background: #FF4D6D15; color: #FF4D6D; border-radius: 14px; padding: 11px; font-weight: 600; font-size: 12px; cursor: pointer; font-family: inherit; }
        .admin-delete-btn:hover { background: #FF4D6D25; }

        .hero { padding: 46px 26px 10px; max-width: 640px; }
        .hero h2 { font-size: 36px; font-weight: 800; letter-spacing: -1px; line-height: 1.1; margin: 0 0 10px; }
        .hero span.accent { background: linear-gradient(135deg, #FF4D6D, #8C7CFF); -webkit-background-clip: text; background-clip: text; color: transparent; }
        .hero p { color: var(--sub); font-size: 14px; }

        .search-row { padding: 20px 26px 4px; display: flex; gap: 10px; align-items: center; }
        .filter-toggle-btn { flex-shrink: 0; width: 42px; height: 42px; border-radius: 50%; background: var(--surface2); border: 1px solid var(--input-border); color: var(--sub); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: border-color .15s ease, color .15s ease; }
        .filter-toggle-btn:disabled { opacity: 0.6; cursor: default; }
        .photo-search-banner { display: flex; align-items: center; gap: 8px; background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 10px 16px; margin: 0 26px 14px; font-size: 12.5px; color: var(--body); }
        .photo-search-banner strong { color: var(--text); }
        .photo-search-banner button { margin-left: auto; display: flex; align-items: center; gap: 4px; background: none; border: none; color: var(--sub); font-size: 12px; cursor: pointer; font-family: inherit; }
        .photo-search-banner button:hover { color: #FF4D6D; }
        @media (max-width: 640px) { .photo-search-banner { margin: 0 16px 14px; } }
        .filter-toggle-btn.active { border-color: #FF4D6D; color: #FF4D6D; background: #FF4D6D14; }
        .filter-panel { margin: 10px 26px 0; background: var(--surface2); border: 1px solid var(--border); border-radius: 16px; padding: 16px; display: flex; flex-direction: column; gap: 14px; }
        .filter-panel-row { display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .filter-panel-row label { font-size: 12.5px; font-weight: 600; color: var(--body); flex-shrink: 0; }
        .filter-panel-row select { background: var(--bg); border: 1px solid var(--input-border); color: var(--text); border-radius: 10px; padding: 7px 10px; font-size: 12.5px; font-family: inherit; }
        .filter-price-inputs { display: flex; align-items: center; gap: 6px; }
        .filter-price-inputs input { width: 68px; background: var(--bg); border: 1px solid var(--input-border); color: var(--text); border-radius: 10px; padding: 7px 10px; font-size: 12.5px; font-family: inherit; }
        .filter-price-inputs span { color: var(--faint); }
        .filter-clear-btn { background: none; border: none; color: #FF4D6D; font-size: 12px; font-weight: 600; cursor: pointer; font-family: inherit; align-self: flex-start; }
        .filter-location-prompt { display: flex; align-items: center; gap: 6px; background: #4DE1C114; border: 1px solid #4DE1C133; color: #4DE1C1; font-size: 12px; font-weight: 600; padding: 9px 12px; border-radius: 10px; cursor: pointer; font-family: inherit; }
        .cat-scroll { display: flex; gap: 8px; padding: 14px 26px 6px; overflow-x: auto; scrollbar-width: none; }
        .cat-scroll::-webkit-scrollbar { display: none; }
        .cat-circle { display: flex; flex-direction: column; align-items: center; gap: 6px; background: none; border: none; cursor: pointer; font-family: inherit; flex-shrink: 0; color: var(--sub); width: 68px; }
        .cat-icon-wrap { width: 52px; height: 52px; border-radius: 50%; background: var(--surface2); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 18px; transition: border-color .15s ease, transform .15s ease; }
        .cat-circle span:last-child { font-size: 10.5px; font-weight: 600; text-align: center; line-height: 1.25; }
        .cat-circle.active { color: var(--text); }
        .cat-circle.active .cat-icon-wrap { border-color: #FF4D6D; background: linear-gradient(135deg, #FF4D6D33, #FF8A4D33); transform: translateY(-2px); }
        .cat-circle.active .cat-icon-wrap.forYou { border-color: #FF4D6D; }
        .cat-circle:hover .cat-icon-wrap { border-color: #4A4A52; }
        .search-box { display: flex; align-items: center; gap: 8px; background: var(--surface2); border: 1px solid var(--input-border); border-radius: 20px; padding: 10px 16px; flex: 1; min-width: 200px; }
        .search-box input { border: none; outline: none; background: transparent; color: #fff; font-size: 13px; width: 100%; font-family: inherit; }
        .chip { border: 1px solid var(--input-border); background: var(--surface2); color: var(--body); border-radius: 20px; padding: 8px 14px; font-size: 12px; cursor: pointer; font-family: inherit; }
        .chip.active { background: var(--text); color: var(--bg); border-color: var(--text); }
        select.chip { appearance: none; }

        .two-col { display: flex; gap: 14px; padding: 10px 20px 110px; align-items: flex-start; }

        @media (min-width: 780px) {
          header.top, .hero, .search-row, .cat-scroll, .two-col {
            max-width: 1300px; margin-left: auto; margin-right: auto; width: 100%;
          }
          header.top { border-radius: 0 0 20px 20px; }
        }
        @media (min-width: 1500px) {
          header.top, .hero, .search-row, .cat-scroll, .two-col {
            max-width: 1600px;
          }
        }

        .col { flex: 1; min-width: 0; max-width: 300px; display: flex; flex-direction: column; gap: 14px; }
        .card { background: var(--card); border-radius: 18px; overflow: hidden; cursor: pointer; transition: transform .15s ease, border-color .15s ease, box-shadow .15s ease; border: 1px solid var(--border); }
        .card:hover { transform: translateY(-4px); border-color: #FF4D6D55; box-shadow: 0 12px 30px -14px #FF4D6D33; }
        .card-media { height: 150px; position: relative; background-size: cover; background-position: center; flex-shrink: 0; }
        .heart { border: none; background: #00000055; border-radius: 50%; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; cursor: pointer; z-index: 2; position: absolute; top: 10px; right: 10px; }
        .new-ribbon { position: absolute; top: 10px; left: 10px; background: #4DE1C1; color: var(--bg); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; padding: 4px 9px; border-radius: 10px; z-index: 2; }
        .featured-ribbon { position: absolute; left: 10px; background: linear-gradient(135deg, #FFC24D, #FF8A4D); color: var(--bg); font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; padding: 4px 9px; border-radius: 10px; z-index: 2; }
        .price-pill { position: absolute; bottom: 10px; left: 10px; background: #121214cc; border: 1px solid var(--input-border); border-radius: 14px; padding: 4px 10px; font-size: 13px; font-weight: 700; z-index: 2; color: #4DE1C1; }
        .card-info { padding: 12px 14px 14px; height: 96px; display: flex; flex-direction: column; justify-content: flex-start; overflow: hidden; }
        .card-info h3 { font-size: 14px; margin: 0 0 4px; font-weight: 600; line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 35px; }
        .card-info p { font-size: 12px; color: var(--sub); margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .card-city { display: flex; align-items: center; gap: 3px; margin-top: 3px !important; font-size: 10px !important; color: var(--faint) !important; }
        .chip.forYou.active { background: linear-gradient(135deg, #FF4D6D, #FF8A4D); color: var(--bg); border-color: transparent; }
        .sort-chip { min-width: 150px; }
        .price-filter { display: flex; align-items: center; gap: 8px; font-size: 11px; color: var(--body); background: var(--surface2); border: 1px solid var(--input-border); border-radius: 20px; padding: 7px 14px; }
        .price-filter input[type=range] { width: 90px; accent-color: #FF4D6D; }
        .follow-btn { display: flex; align-items: center; gap: 5px; border: 1px solid var(--input-border); background: var(--bg); color: var(--body); border-radius: 12px; padding: 7px 11px; font-size: 11px; font-weight: 600; cursor: pointer; font-family: inherit; white-space: nowrap; }
        .follow-btn.on { background: linear-gradient(135deg, #4DE1C1, #4DA8FF); color: var(--bg); border-color: transparent; }
        .offer-btn { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid #FFC24D55; background: #FFC24D15; color: #FFC24D; border-radius: 14px; padding: 11px; font-weight: 600; font-size: 12px; cursor: pointer; font-family: inherit; }
        .offer-modal { max-width: 340px; }
        .offer-sent { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 20px 0; font-weight: 700; }
        .league-btn { position: relative; }
        .league-modal { max-width: 400px; }
        .admin-modal { max-width: 560px; max-height: 84vh; overflow-y: auto; padding: 30px; }
        .admin-panel-btn { color: #8C7CFF; border-color: #8C7CFF55; }
        .admin-summary-row { display: grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: 8px; margin-top: 14px; }
        .admin-summary-box { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 10px 8px; text-align: center; }
        .admin-summary-box strong { display: block; font-size: 16px; font-weight: 800; color: var(--text); }
        .admin-summary-box span { font-size: 10px; color: var(--sub); }
        .admin-menu-list { display: flex; flex-direction: column; gap: 10px; margin-top: 10px; }
        .admin-menu-item { display: flex; align-items: center; gap: 14px; background: var(--bg); border: 1px solid var(--border); border-radius: 16px; padding: 16px 18px; cursor: pointer; font-family: inherit; text-align: left; transition: border-color .15s ease, background .15s ease; }
        .admin-menu-item:hover { border-color: #8C7CFF55; background: #17171c; }
        .admin-menu-icon { width: 36px; height: 36px; border-radius: 10px; background: var(--surface2); display: flex; align-items: center; justify-content: center; color: #8C7CFF; flex-shrink: 0; }
        .admin-menu-label { flex: 1; font-size: 14.5px; font-weight: 700; }
        .admin-menu-badge { background: #FF4D6D; color: var(--text); font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 10px; }
        .admin-menu-arrow { color: var(--faint); font-size: 18px; }
        .admin-back-btn { background: var(--surface2); border: 1px solid var(--border); color: var(--text); border-radius: 10px; width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; }
        .admin-user-list { display: flex; flex-direction: column; gap: 12px; max-height: 440px; overflow-y: auto; margin-top: 16px; padding-right: 4px; }
        .admin-user-row { display: flex; align-items: center; gap: 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px; }
        .admin-user-info { flex: 1; min-width: 0; }
        .admin-user-name { font-size: 13.5px; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 6px; }
        .admin-role-badge { background: linear-gradient(135deg, #8C7CFF, #4DA8FF); color: var(--bg); font-size: 9px; font-weight: 800; text-transform: uppercase; padding: 2px 7px; border-radius: 8px; }
        .admin-user-email { font-size: 11.5px; color: var(--sub); margin: 3px 0; }
        .admin-user-meta { font-size: 11px; color: var(--faint); margin: 0; line-height: 1.5; }
        .admin-user-date { font-size: 10px; color: var(--faint); flex-shrink: 0; white-space: nowrap; }
        .admin-stats-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 14px; }
        .admin-stat-box { background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 16px; display: flex; flex-direction: column; gap: 5px; }
        .admin-stat-box strong { font-size: 21px; font-weight: 800; }
        .admin-stat-box span { font-size: 11.5px; color: var(--sub); }
        .admin-stat-box.highlight { border-color: #4DE1C155; background: #4DE1C110; }
        .admin-stat-box.highlight strong { color: #4DE1C1; }
        .admin-stat-box.total { grid-column: 1 / -1; border-color: #FFC24D55; background: #FFC24D10; }
        .admin-stat-box.total strong { color: #FFC24D; font-size: 26px; }
        .admin-stat-box.warning { grid-column: 1 / -1; border-color: #FF4D6D55; background: #FF4D6D10; }
        .admin-stat-box.warning strong { color: #FF4D6D; }
        .admin-dispute-row { background: var(--bg); border: 1px solid #FF4D6D33; border-radius: 14px; padding: 16px 18px; margin-bottom: 12px; }
        .admin-dispute-reason { font-size: 12px; color: var(--body); font-style: italic; margin: 8px 0; line-height: 1.5; }
        .admin-refund-btn { width: 100%; margin-top: 10px; padding: 10px; font-size: 12.5px; }
        .admin-search-row { display: flex; gap: 8px; margin-bottom: 16px; margin-top: 4px; }
        .admin-filter-row { display: flex; gap: 8px; margin-bottom: 16px; flex-wrap: wrap; }
        .admin-filter-select { flex: 1; min-width: 120px; background: var(--bg); border: 1px solid var(--input-border); color: var(--text); border-radius: 10px; padding: 8px 10px; font-size: 12px; font-family: inherit; }
        .admin-export-btn { font-size: 12px; padding: 8px 14px; white-space: nowrap; }
        .admin-role-select { margin-top: 6px; background: var(--surface2); border: 1px solid var(--border); color: var(--text); border-radius: 8px; padding: 4px 8px; font-size: 11px; font-family: inherit; }
        .admin-pagination { display: flex; align-items: center; justify-content: center; gap: 14px; margin-top: 16px; }
        .admin-page-label { font-size: 12px; color: var(--sub); }
        .admin-settings-form label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: .4px; color: var(--sub); margin: 14px 0 6px; }
        .admin-settings-form label:first-child { margin-top: 6px; }
        .input-plain { width: 100%; border: 1px solid var(--input-border); border-radius: 12px; padding: 10px 12px; background: var(--bg); color: var(--text); font-size: 13px; font-family: inherit; margin-bottom: 12px; }
        .faq-list { display: flex; flex-direction: column; gap: 8px; margin-top: 12px; }
        .faq-item { background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 14px 16px; }
        .faq-item summary { font-size: 13.5px; font-weight: 700; cursor: pointer; list-style: none; }
        .faq-item summary::-webkit-details-marker { display: none; }
        .faq-item summary::before { content: "+ "; color: #4DE1C1; font-weight: 800; }
        .faq-item[open] summary::before { content: "− "; }
        .faq-item p { font-size: 12.5px; color: var(--sub); margin: 10px 0 0; line-height: 1.5; }
        .admin-search-row .search-box { flex: 1; padding: 8px 12px; }
        .admin-search-row .search-box input { font-size: 12px; }
        .admin-search-btn { padding: 0 16px; font-size: 12px; }
        .admin-user-row.banned { opacity: 0.7; border-color: #FF4D6D55; }
        .admin-user-actions { display: flex; flex-direction: column; align-items: flex-end; gap: 6px; flex-shrink: 0; }
        .admin-ban-btn, .admin-unban-btn { font-size: 10px; font-weight: 700; padding: 4px 10px; border-radius: 8px; cursor: pointer; border: none; font-family: inherit; }
        .admin-ban-btn { background: #FF4D6D22; color: #FF4D6D; }
        .admin-unban-btn { background: #4DE1C122; color: #4DE1C1; }
        .banned-badge { background: linear-gradient(135deg, #FF4D6D, #FF8A4D); }
        .admin-chart { display: flex; align-items: flex-end; gap: 3px; height: 64px; margin-bottom: 18px; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 8px 10px 4px; }
        .admin-chart-bar-wrap { flex: 1; display: flex; align-items: flex-end; height: 100%; cursor: default; }
        .admin-chart-bar { width: 100%; background: linear-gradient(180deg, #FF4D6D, #FF8A4D); border-radius: 2px 2px 0 0; min-height: 2px; }
        .admin-category-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 10px; }
        .admin-category-row { display: flex; justify-content: space-between; align-items: center; background: var(--bg); border: 1px solid var(--border); border-radius: 10px; padding: 8px 12px; font-size: 12.5px; }
        .admin-category-count { font-weight: 800; color: #4DE1C1; }
        .admin-log-row { background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 10px 12px; margin-bottom: 8px; }
        .admin-dispute-row.reviewed { opacity: 0.55; }
        .report-textarea { width: 100%; background: var(--bg); border: 1px solid var(--input-border); border-radius: 12px; padding: 10px 12px; color: var(--text); font-size: 13px; font-family: inherit; resize: none; margin-bottom: 10px; }
        .report-flag-btn { display: inline-flex; align-items: center; gap: 6px; background: var(--surface2); border: 1px solid var(--border); color: var(--sub); font-size: 11.5px; font-weight: 600; cursor: pointer; font-family: inherit; padding: 8px 14px; border-radius: 20px; }
        .report-flag-btn:hover { color: #FF4D6D; border-color: #FF4D6D55; background: #FF4D6D0F; }
        .report-modal-header { display: flex; align-items: center; gap: 12px; margin-bottom: 4px; }
        .report-modal-icon { width: 38px; height: 38px; border-radius: 12px; background: #FF4D6D18; display: flex; align-items: center; justify-content: center; color: #FF4D6D; flex-shrink: 0; }
        .report-submit-btn { width: 100%; margin-top: 10px; padding: 12px; font-size: 13px; font-weight: 700; border: none; border-radius: 14px; cursor: pointer; font-family: inherit; background: linear-gradient(135deg, #FF4D6D, #B23A55); color: var(--text); }
        .admin-toolbar { display: inline-flex; align-items: center; gap: 8px; margin-top: 10px; background: var(--surface2); border: 1px solid var(--border); border-radius: 20px; padding: 6px 8px 6px 14px; }
        .admin-toolbar-label { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .5px; color: var(--faint); }
        .admin-icon-action { width: 28px; height: 28px; border-radius: 50%; border: none; background: var(--border); color: var(--sub); display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .admin-icon-action:hover { background: var(--input-border); color: var(--text); }
        .admin-icon-action.danger:hover { background: #FF4D6D22; color: #FF4D6D; }
        .league-header { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
        .leaderboard { display: flex; flex-direction: column; gap: 8px; margin-bottom: 22px; max-height: 360px; overflow-y: auto; padding-right: 4px; }
        .lb-row { display: flex; align-items: center; gap: 10px; background: var(--bg); border: 1px solid var(--border); border-radius: 12px; padding: 9px 12px; }
        .lb-row.first { border-color: #FFC24D55; background: #FFC24D0d; }
        .lb-rank { font-size: 12px; font-weight: 800; color: var(--faint); width: 20px; }
        .lb-row.first .lb-rank { color: #FFC24D; }
        .lb-info { flex: 1; }
        .lb-name { font-size: 13px; font-weight: 700; margin: 0; }
        .lb-city { font-size: 10px; color: var(--sub); margin: 2px 0 0; display: flex; align-items: center; gap: 3px; }
        .lb-points { font-size: 12px; font-weight: 700; color: #4DE1C1; }
        .lb-right { display: flex; flex-direction: column; align-items: flex-end; gap: 3px; }
        .lb-benefit { font-size: 9px; font-weight: 800; text-transform: uppercase; letter-spacing: .3px; padding: 2px 7px; border-radius: 8px; }
        .lb-benefit.tier-gold { background: #FFC24D22; color: #FFC24D; }
        .lb-benefit.tier-silver { background: #C8C8CE22; color: var(--body); }
        .lb-benefit.tier-bronze { background: #FF4D6D22; color: #FF4D6D; }
        .icon-btn { position: relative; border: 1px solid var(--input-border); background: var(--surface2); color: var(--text); border-radius: 12px; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .notif-dot { position: absolute; top: -4px; right: -4px; min-width: 15px; height: 15px; padding: 0 3px; border-radius: 8px; background: #FF4D6D; color: var(--bg); font-size: 10px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
        .notif-modal { max-width: 360px; }
        .favorites-modal { max-width: 420px; }
        .favorites-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; }
        .fav-card { cursor: pointer; }
        .fav-swatch { height: 110px; border-radius: 14px; position: relative; background-size: cover; background-position: center; margin-bottom: 6px; }
        .fav-swatch .heart { top: 8px; right: 8px; }
        .fav-title { font-size: 12px; font-weight: 600; margin: 0 0 2px; }
        .fav-price { font-size: 12px; font-weight: 700; color: #4DE1C1; margin: 0; }
        .notif-row { display: flex; gap: 10px; align-items: flex-start; padding: 10px 0; border-bottom: 1px solid var(--border); }
        .notif-row.unread .notif-text { font-weight: 700; }
        .notif-row.unread .notif-icon { color: #FF4D6D; }
        .notif-row:last-child { border-bottom: none; }
        .notif-icon { width: 28px; height: 28px; border-radius: 50%; background: var(--surface2); display: flex; align-items: center; justify-content: center; flex-shrink: 0; color: #4DE1C1; }
        .notif-text { font-size: 13px; margin: 0; }
        .notif-time { font-size: 11px; color: var(--faint); margin: 2px 0 0; }
        .settings-modal { max-width: 380px; }
        .location-box { display: flex; align-items: center; justify-content: space-between; gap: 12px; background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 14px; margin-bottom: 16px; }
        .location-current { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; margin: 0; }
        .location-hint { font-size: 11px; color: var(--sub); margin: 4px 0 0; }
        .stripe-box { background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 14px; margin: 16px 0; }
        .stripe-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; margin: 0 0 8px; }
        .stripe-status { font-size: 12px; color: var(--sub); margin: 0 0 10px; line-height: 1.4; }
        .stripe-status.ok { display: flex; align-items: center; gap: 6px; color: #4DE1C1; margin: 0; }
        .stripe-connect-btn { width: 100%; border: none; border-radius: 12px; background: linear-gradient(135deg, #635BFF, #4A42E8); color: #fff; padding: 10px; font-weight: 700; font-size: 12px; cursor: pointer; font-family: inherit; }
        .orders-modal { max-width: 400px; }
        .profile-section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--sub); margin: 16px 0 10px; }
        .related-box { background: var(--card-alt); border: 1px solid #24242a; border-radius: 20px; padding: 20px 22px; margin-top: 16px; }
        .related-box .profile-section-title:first-child { margin-top: 0; }
        .order-card { background: var(--bg); border: 1px solid var(--border); border-radius: 16px; padding: 14px; margin-bottom: 10px; }
        .order-top { display: flex; justify-content: space-between; gap: 8px; }
        .order-title { font-size: 13px; font-weight: 700; margin: 0; }
        .order-price { font-size: 13px; font-weight: 800; color: #4DE1C1; margin: 0; flex-shrink: 0; }
        .order-seller { font-size: 11px; color: var(--sub); margin: 2px 0 12px; }
        .order-steps { display: flex; align-items: center; margin-bottom: 12px; }
        .order-step { display: flex; flex-direction: column; align-items: center; gap: 3px; color: #4A4A52; font-size: 9px; text-transform: uppercase; letter-spacing: .3px; flex-shrink: 0; }
        .order-step.done { color: #4DE1C1; }
        .order-step-line { flex: 1; height: 2px; background: var(--border); margin: 0 4px 14px; }
        .order-step-line.done { background: #4DE1C1; }
        .order-action-btn { display: flex; align-items: center; justify-content: center; gap: 6px; width: 100%; border: none; border-radius: 12px; background: linear-gradient(135deg, #FF4D6D, #FF8A4D); color: var(--bg); padding: 10px; font-weight: 700; font-size: 12px; cursor: pointer; font-family: inherit; }
        .order-hint { font-size: 11px; color: var(--faint); margin: 0 0 8px; }
        .dispute-link { font-size: 11px; color: var(--faint); text-decoration: underline; cursor: pointer; margin: 8px 0 0; text-align: center; }
        .dispute-link:hover { color: #FF4D6D; }
        .rating-modal { max-width: 340px; }
        .star-picker { display: flex; justify-content: center; gap: 8px; margin-bottom: 18px; }
        .star-picker button { background: none; border: none; cursor: pointer; padding: 2px; }
        .settings-toggle-row { display: flex; justify-content: space-between; align-items: center; font-size: 13px; margin: 14px 0; }
        .settings-toggle-row input { width: auto; accent-color: #FF4D6D; }
        .logout-btn { width: 100%; margin-top: 10px; border: 1px solid #FF4D6D55; background: transparent; color: #FF4D6D; border-radius: 14px; padding: 11px; font-weight: 600; font-size: 13px; cursor: pointer; font-family: inherit; }
        .danger-zone { margin-top: 26px; padding-top: 20px; border-top: 1px solid var(--border); }
        .danger-zone-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #FF4D6D; font-weight: 700; margin: 0 0 12px; }
        .danger-zone-btn { width: 100%; background: #FF4D6D; color: #fff; border: none; border-radius: 14px; padding: 12px; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; }
        .danger-zone-btn:disabled { opacity: 0.6; cursor: default; }
        .delete-confirm-box { display: flex; flex-direction: column; gap: 10px; }
        .delete-confirm-text { font-size: 12.5px; color: var(--body); line-height: 1.5; margin: 0; }
        .delete-confirm-input { width: 100%; border: 1px solid #FF4D6D55; border-radius: 12px; padding: 10px 12px; font-size: 13px; background: var(--bg); color: var(--text); font-family: inherit; }
        .delete-confirm-actions { display: flex; gap: 10px; }
        .delete-confirm-actions .btn { flex: 1; }
        .delete-confirm-actions .danger-zone-btn { flex: 1; }
        .checkout-modal { max-width: 380px; }
        .checkout-summary { background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 12px 14px; margin: 16px 0; }
        .checkout-note { font-size: 11px; color: var(--faint); margin: 0; line-height: 1.4; }
        .checkout-row { display: flex; justify-content: space-between; font-size: 12px; color: var(--sub); padding: 4px 0; }
        .checkout-row.total { color: var(--text); font-weight: 700; font-size: 14px; border-top: 1px solid var(--border); margin-top: 6px; padding-top: 10px; }
        .checkout-sub { font-size: 12px; color: var(--sub); text-align: center; font-weight: 400; }
        .own-card { position: relative; }
        .own-actions { position: absolute; top: 6px; right: 6px; display: flex; gap: 4px; }
        .own-actions button { border: none; background: #00000088; color: #fff; border-radius: 50%; width: 22px; height: 22px; display: flex; align-items: center; justify-content: center; cursor: pointer; }

        .skeleton-card { background: var(--card); border-radius: 18px; overflow: hidden; border: 1px solid var(--border); padding-bottom: 12px; }
        .skeleton-media { height: 150px; }
        .skeleton-line { height: 10px; border-radius: 5px; margin: 10px 14px 0; }
        .shimmer { background: linear-gradient(100deg, var(--surface2) 30%, #2A2A30 50%, var(--surface2) 70%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
        @keyframes shimmer { 0% { background-position: 150% 0; } 100% { background-position: -50% 0; } }

        .load-more-row { display: flex; justify-content: center; padding: 24px 0 8px; }
        .empty-state { display: flex; flex-direction: column; align-items: center; gap: 8px; padding: 70px 30px; text-align: center; }
        .cookie-banner { position: fixed; bottom: 0; left: 0; right: 0; z-index: 200; background: var(--card); border-top: 1px solid var(--border); padding: 16px 20px; display: flex; align-items: center; gap: 16px; flex-wrap: wrap; justify-content: space-between; box-shadow: 0 -8px 24px rgba(0,0,0,0.35); }
        .cookie-banner p { font-size: 12.5px; color: var(--body); margin: 0; max-width: 640px; line-height: 1.5; flex: 1; min-width: 220px; }
        .cookie-link { background: none; border: none; color: #4DE1C1; text-decoration: underline; cursor: pointer; font-size: 12.5px; font-family: inherit; padding: 0; }
        .cookie-actions { display: flex; gap: 10px; flex-shrink: 0; }
        @media (max-width: 600px) {
          .cookie-banner { flex-direction: column; align-items: stretch; }
          .cookie-actions { justify-content: stretch; }
          .cookie-actions .btn { flex: 1; justify-content: center; }
        }
        .site-footer { display: flex; justify-content: center; align-items: center; gap: 8px; flex-wrap: wrap; padding: 20px 26px 100px; color: var(--faint); font-size: 11px; }
        .site-footer button { background: none; border: none; color: var(--faint); font-size: 11px; cursor: pointer; font-family: inherit; text-decoration: underline; }
        .site-footer button:hover { color: var(--text); }
        .legal-modal { max-width: 460px; }
        .legal-text { font-size: 13px; color: var(--body); line-height: 1.6; max-height: 55vh; overflow-y: auto; }
        .about-impact-box { display: flex; align-items: center; gap: 10px; background: linear-gradient(135deg, #4DE1C114, #4DE1C108); border: 1px solid #4DE1C133; border-radius: 14px; padding: 14px 16px; margin: 4px 0 20px; }
        .about-impact-box p { margin: 0; font-size: 12.5px; color: var(--body); line-height: 1.5; }
        .about-impact-box strong { color: #4DE1C1; }
        .about-block { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 18px; }
        .about-block-icon { width: 34px; height: 34px; border-radius: 10px; background: var(--surface); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .about-block-title { margin: 0 0 3px; font-size: 13.5px; font-weight: 700; color: var(--text); }
        .about-block-text { margin: 0; font-size: 13px; color: var(--body); line-height: 1.5; }
        .about-block-link { background: none; border: none; padding: 0; margin: 0; font-size: 13px; color: #FF4D6D; font-weight: 600; cursor: pointer; text-decoration: underline; font-family: inherit; }
        .updates-counter { display: flex; align-items: center; gap: 6px; font-size: 12.5px; color: #4DE1C1; font-weight: 600; margin: 0 0 20px; }
        .update-entry { margin-bottom: 22px; }
        .update-date { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: #FF4D6D; font-weight: 700; margin: 0 0 10px; }
        .update-bubbles { display: flex; flex-direction: column; gap: 8px; }
        .update-bubble { display: flex; align-items: flex-start; gap: 10px; background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 12px 14px; }
        .update-bubble-icon { width: 30px; height: 30px; border-radius: 10px; background: var(--surface); display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .update-bubble p { margin: 3px 0 0; font-size: 13px; color: var(--body); line-height: 1.5; }
        .update-type-tag { font-size: 10px; font-weight: 700; border: 1px solid; border-radius: 999px; padding: 2px 8px; text-transform: uppercase; letter-spacing: 0.5px; }
        .updates-subscribe-box { background: linear-gradient(135deg, #8C7CFF14, #FF4D6D0a); border: 1px solid var(--border); border-radius: 16px; padding: 18px; margin-top: 4px; }
        .updates-subscribe-title { margin: 0 0 10px; font-size: 13px; color: var(--text); font-weight: 700; }
        .updates-subscribe-form { display: flex; gap: 8px; }
        .updates-subscribe-form input { flex: 1; border: 1px solid var(--input-border); border-radius: 10px; padding: 9px 12px; font-size: 12.5px; background: var(--bg); color: var(--text); font-family: inherit; }
        .updates-subscribe-form .btn.primary { padding: 9px 16px; font-size: 12.5px; border-radius: 10px; }
        .updates-subscribe-done { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 13px; color: #4DE1C1; font-weight: 700; justify-content: center; }
        .legal-text p { margin: 0 0 12px; }
        .empty-title { font-size: 14px; font-weight: 700; margin: 6px 0 0; }
        .empty-sub { font-size: 12px; color: var(--faint); margin: 0 0 14px; max-width: 260px; }

        .detail-media-actions { position: absolute; top: 14px; right: 14px; display: flex; gap: 8px; }
        .gallery-arrow { position: absolute; top: 50%; transform: translateY(-50%); background: #00000066; border: none; color: #fff; width: 30px; height: 30px; border-radius: 50%; font-size: 20px; line-height: 1; cursor: pointer; display: flex; align-items: center; justify-content: center; z-index: 2; }
        .gallery-arrow.left { left: 10px; }
        .gallery-arrow.right { right: 10px; }
        .gallery-dots { position: absolute; bottom: 10px; left: 50%; transform: translateX(-50%); display: flex; gap: 5px; z-index: 2; }
        .gallery-dot { width: 6px; height: 6px; border-radius: 50%; background: #ffffff66; cursor: pointer; }
        .gallery-dot.active { background: #fff; width: 16px; border-radius: 3px; }
        .detail-description { font-size: 13px; color: var(--body); line-height: 1.5; margin: 0 0 16px; white-space: pre-wrap; }
        .detail-icon-btn { position: static; }
        .trend-tag { display: flex; align-items: center; gap: 4px; font-size: 10px; color: #4DE1C1; margin: 3px 0 0; white-space: nowrap; }

        .profile-progress { background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 12px 14px; margin-bottom: 16px; text-align: left; }
        .progress-label { display: flex; justify-content: space-between; font-size: 11px; font-weight: 700; margin-bottom: 6px; }
        .progress-track { height: 6px; background: var(--border); border-radius: 4px; overflow: hidden; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #4DE1C1, #4DA8FF); border-radius: 4px; }
        .progress-hint { font-size: 10px; color: var(--faint); margin: 6px 0 0; }
        .cover-btn { position: absolute; bottom: 8px; right: 44px; display: flex; align-items: center; gap: 5px; background: #00000066; border: none; color: #fff; font-size: 10px; padding: 5px 10px; border-radius: 12px; cursor: pointer; font-family: inherit; }
        .share-profile-btn { position: absolute; bottom: 8px; right: 10px; background: #00000066; border: none; color: #fff; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; cursor: pointer; }
        .milestone-badges { display: inline-flex; gap: 4px; margin-left: 6px; vertical-align: middle; }
        .mstone { display: inline-flex; align-items: center; justify-content: center; width: 18px; height: 18px; background: var(--surface2); border: 1px solid var(--input-border); border-radius: 50%; font-size: 10px; color: #FFC24D; }
        .profile-meta-row { font-size: 11px; color: var(--sub); margin: 4px 0 0; }
        .streak-text { font-size: 11px; color: #FFC24D; margin: 4px 0 10px; font-weight: 600; }
        .verify-row { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; margin-bottom: 10px; }
        .profile-city-line { display: flex; align-items: center; justify-content: center; gap: 5px; font-size: 12.5px; color: var(--sub); margin: 0 0 16px; }
        .verify-chip { display: flex; align-items: center; gap: 4px; font-size: 10px; background: var(--bg); border: 1px solid var(--border); color: var(--faint); padding: 4px 9px; border-radius: 12px; }
        .seller-mini-verify { display: flex; gap: 6px; margin-top: 5px; }
        .seller-mini-verify .verify-chip { padding: 2px 7px; font-size: 9px; }
        .verify-chip.done { color: #4DE1C1; border-color: #4DE1C133; }
        .ig-link { display: block; font-size: 11px; color: var(--sub); text-decoration: none; margin-bottom: 16px; }
        .ig-link:hover { color: #FF4D6D; }
        .rating-breakdown { background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 12px 14px; margin-bottom: 16px; text-align: left; }
        .reviews-list { display: flex; flex-direction: column; gap: 10px; text-align: left; margin-bottom: 16px; }
        .review-row { background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 12px 14px; }
        .review-row-top { display: flex; align-items: center; justify-content: space-between; }
        .review-author { font-size: 12.5px; font-weight: 700; }
        .review-stars { display: flex; gap: 1px; }
        .review-comment { font-size: 12.5px; color: var(--body); margin: 6px 0 4px; line-height: 1.4; }
        .review-date { font-size: 10.5px; color: var(--faint); }
        .rb-row { font-size: 11px; margin-bottom: 8px; }
        .rb-row:last-child { margin-bottom: 0; }
        .rb-row span { display: block; margin-bottom: 4px; color: var(--body); }
        .rb-track { height: 5px; background: var(--border); border-radius: 3px; overflow: hidden; }
        .rb-fill { height: 100%; background: linear-gradient(90deg, #4DE1C1, #4DA8FF); border-radius: 3px; }
        .chat-modal { max-width: 380px; display: flex; flex-direction: column; height: 560px; max-height: 82vh; padding: 0; overflow: hidden; }
        .chat-header { display: flex; align-items: center; gap: 12px; padding: 16px 50px 16px 18px; border-bottom: 1px solid var(--border); position: relative; flex-shrink: 0; background: linear-gradient(180deg, var(--surface2), var(--card)); }
        .chat-close { position: static; margin-left: auto; order: 3; background: var(--border); }
        .chat-avatar-ring { padding: 2px; border-radius: 50%; background: linear-gradient(135deg, #FF4D6D, #FF8A4D); flex-shrink: 0; }
        .chat-avatar-ring .mini-avatar { border: 2px solid var(--card); }
        .chat-seller-name { font-size: 13.5px; font-weight: 700; margin: 0; }
        .chat-item-ref { font-size: 11px; color: var(--sub); margin: 2px 0 0; }
        .chat-item-strip { display: flex; align-items: center; gap: 10px; padding: 10px 14px; background: var(--card); border-bottom: 1px solid var(--border); cursor: pointer; flex-shrink: 0; transition: background .15s ease; }
        .chat-item-strip:hover { background: var(--surface2); }
        .chat-item-thumb { width: 42px; height: 42px; border-radius: 10px; background-size: cover; background-position: center; flex-shrink: 0; border: 1px solid var(--border); }
        .chat-item-strip-info { flex: 1; min-width: 0; }
        .chat-item-strip-title { font-size: 12px; font-weight: 600; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .chat-item-strip-price { font-size: 12px; font-weight: 800; color: #4DE1C1; margin: 1px 0 0; }
        .chat-item-strip-link { font-size: 11px; color: #FF8A4D; font-weight: 600; flex-shrink: 0; }
        .chat-thread { flex: 1; overflow-y: auto; padding: 18px; display: flex; flex-direction: column; gap: 2px; background: radial-gradient(circle at 15% 0%, #1F1F2444, transparent 60%); }
        .chat-msg-row { display: flex; flex-direction: column; margin-bottom: 14px; }
        .chat-msg-row.grouped { margin-top: -8px; }
        .chat-msg-row.me { align-items: flex-end; }
        .chat-msg-row.seller { align-items: flex-start; }
        .chat-bubble { max-width: 78%; padding: 10px 14px; border-radius: 18px; font-size: 13px; line-height: 1.45; box-shadow: 0 3px 10px -4px rgba(0,0,0,0.5); }
        .chat-bubble.seller { background: var(--surface2); border: 1px solid var(--border); border-bottom-left-radius: 5px; }
        .chat-bubble.me { background: linear-gradient(135deg, #FF4D6D, #FF8A4D); color: var(--bg); border-bottom-right-radius: 5px; font-weight: 500; }
        .chat-bubble.offer-bubble { font-weight: 800; border-color: #FFC24D; }
        .chat-bubble.seller.offer-bubble { background: #FFC24D14; color: #FFC24D; }
        .offer-actions { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: 6px; }
        .offer-btn { border: none; border-radius: 999px; padding: 6px 14px; font-size: 11.5px; font-weight: 700; cursor: pointer; font-family: inherit; }
        .offer-btn.accept { background: #4DE1C1; color: var(--bg); }
        .offer-btn.reject { background: var(--surface); color: var(--body); border: 1px solid var(--border); }
        .offer-btn.counter { background: var(--surface); color: var(--body); border: 1px solid var(--border); }
        .offer-btn:disabled { opacity: 0.6; cursor: default; }
        .offer-counter-row { display: flex; gap: 6px; width: 100%; margin-top: 4px; }
        .offer-counter-row input { flex: 1; min-width: 0; border: 1px solid var(--input-border); border-radius: 10px; padding: 6px 10px; font-size: 12px; background: var(--bg); color: var(--text); font-family: inherit; }
        .offer-status-tag { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; display: inline-flex; align-items: center; gap: 4px; }
        .offer-status-tag.pending { background: #FFC24D14; color: #FFC24D; }
        .offer-status-tag.accepted { background: #4DE1C114; color: #4DE1C1; }
        .offer-status-tag.rejected { background: #FF4D6D14; color: #FF4D6D; }
        .chat-msg-time { font-size: 10px; color: var(--faint); margin: 4px 4px 0; }
        .chat-input-row { display: flex; gap: 10px; padding: 14px 16px; border-top: 1px solid var(--border); flex-shrink: 0; align-items: center; background: #17171a; }
        .chat-input-row input { flex: 1; border: 1px solid var(--input-border); border-radius: 22px; padding: 11px 16px; background: var(--bg); color: var(--text); font-size: 13px; font-family: inherit; transition: border-color .15s ease; }
        .chat-input-row input:focus { outline: none; border-color: #FF4D6D66; }
        .chat-send-btn { border: none; background: linear-gradient(135deg, #FF4D6D, #FF8A4D); color: var(--bg); border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; flex-shrink: 0; box-shadow: 0 4px 14px -4px #FF4D6D88; transition: opacity .15s ease, transform .1s ease; }
        .chat-send-btn:disabled { opacity: 0.4; box-shadow: none; cursor: default; }
        .chat-send-btn:not(:disabled):active { transform: scale(0.92); }

        .overlay { position: fixed; inset: 0; background: rgba(10,10,12,0.85); display: flex; align-items: center; justify-content: center; padding: 20px; z-index: 10; }
        .cropper-overlay { z-index: 50; }
        .cropper-box { background: var(--card); border: 1px solid var(--border); border-radius: 20px; padding: 20px; width: 100%; max-width: 420px; }
        .cropper-canvas { position: relative; width: 100%; height: 320px; background: #000; border-radius: 12px; overflow: hidden; }
        .cropper-zoom-slider { width: 100%; margin: 16px 0 4px; accent-color: #FF4D6D; }
        .cropper-actions { display: flex; gap: 10px; margin-top: 14px; }
        .cropper-actions .btn { flex: 1; justify-content: center; }
        .overlay-top { z-index: 15; }
        .modal { background: var(--card); border: 1px solid var(--border); border-radius: 22px; max-width: 400px; width: 100%; padding: 26px; position: relative; max-height: 88vh; overflow-y: auto; -webkit-overflow-scrolling: touch; overscroll-behavior: contain; }
        .modal h3 { font-size: 19px; font-weight: 700; margin: 0 0 16px; display: flex; align-items: center; gap: 8px; }
        .close-btn { position: absolute; top: 16px; right: 16px; background: var(--border); border: none; border-radius: 50%; width: 28px; height: 28px; color: #fff; cursor: pointer; z-index: 5; }
        label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 14px 0 6px; color: var(--sub); }
        input, select { width: 100%; border: 1px solid var(--input-border); border-radius: 12px; padding: 10px 12px; font-size: 13px; background: var(--bg); color: var(--text); font-family: inherit; }
        .post-textarea { width: 100%; border: 1px solid var(--input-border); border-radius: 12px; padding: 10px 12px; font-size: 13px; background: var(--bg); color: var(--text); font-family: inherit; resize: vertical; margin-bottom: 4px; }
        .submit-btn { margin-top: 20px; width: 100%; border: none; border-radius: 14px; padding: 13px; background: linear-gradient(135deg, #FF4D6D, #FF8A4D); color: var(--bg); font-weight: 700; font-size: 13px; cursor: pointer; }
        .submit-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .detail-price { font-size: 30px; font-weight: 800; margin: 10px 0 14px; }
        .seller-row { font-size: 13px; color: var(--sub); margin-bottom: 18px; }
        .detail-modal { max-width: 400px; padding: 0; }
        @media (max-width: 780px) {
          .detail-overlay { padding: 0; align-items: stretch; }
          .detail-overlay .detail-modal { max-width: 100%; width: 100%; height: 100vh; height: 100dvh; border-radius: 0; margin: 0; max-height: none; }
          .detail-overlay .detail-modal.auth-modal { display: flex; flex-direction: column; justify-content: center; padding: 30px 32px; background: radial-gradient(circle at 50% 0%, #FF4D6D22, transparent 60%), var(--card); }
        }
        .item-page { padding: 20px 26px 100px; max-width: 1100px; margin: 0 auto; }
        @media (min-width: 1500px) {
          .item-page { max-width: 1400px; }
        }
        @media (min-width: 1900px) {
          .item-page { max-width: 1600px; }
        }
        .post-page { padding: 20px 26px 100px; max-width: 900px; margin: 0 auto; }
        .legal-page { padding: 20px 26px 100px; max-width: 700px; margin: 0 auto; }
        .legal-page .legal-text { max-height: none; }
        .back-btn { display: flex; align-items: center; gap: 6px; background: none; border: none; color: var(--body); font-size: 13px; font-weight: 600; cursor: pointer; padding: 8px 0; margin-bottom: 16px; font-family: inherit; }
        .back-btn:hover { color: var(--text); }
        .item-page-grid { display: flex; gap: 40px; align-items: flex-start; }
        .item-page-gallery { flex: 1.1; min-width: 0; }
        .community-impact { display: flex; align-items: center; gap: 10px; background: linear-gradient(135deg, #4DE1C114, #4DE1C108); border: 1px solid #4DE1C133; border-radius: 16px; padding: 14px 18px; margin: 20px auto 0; max-width: 700px; font-size: 12.5px; color: var(--body); line-height: 1.5; }
        .community-impact svg { flex-shrink: 0; }
        .community-impact strong { color: #4DE1C1; font-weight: 700; }
        .newsletter-outer { background: linear-gradient(120deg, #8C7CFF, #FF4D6D 70%); margin-top: 34px; }
        .newsletter-band { display: flex; align-items: center; justify-content: space-between; gap: 24px; flex-wrap: wrap; max-width: 1100px; margin: 0 auto; padding: 44px 40px; }
        .newsletter-title { color: var(--bg); font-size: 20px; font-weight: 800; margin: 0 0 5px; }
        .newsletter-sub { color: var(--bg); opacity: 0.75; font-size: 13.5px; margin: 0; }
        .newsletter-form { display: flex; gap: 10px; flex-wrap: wrap; }
        .newsletter-form input { width: 260px; border: none; border-radius: 12px; padding: 13px 16px; font-size: 13px; background: #ffffffee; color: var(--bg); font-family: inherit; }
        .newsletter-form input::placeholder { color: var(--faint); }
        .newsletter-form .btn.primary { background: var(--bg); color: #fff; border: none; padding: 13px 22px; border-radius: 12px; font-weight: 700; font-size: 13px; }
        .newsletter-thanks { display: flex; align-items: center; gap: 8px; font-size: 14px; color: var(--bg); font-weight: 700; }
        @media (max-width: 640px) {
          .newsletter-band { padding: 30px 20px; }
          .newsletter-form { width: 100%; }
          .newsletter-form input { flex: 1; min-width: 0; width: auto; }
        }

        .site-footer-rich { background: var(--card-alt); border-top: 1px solid var(--border); padding: 48px 40px 100px; }
        .footer-inner { max-width: 1100px; margin: 0 auto; }
        .footer-top-row { display: flex; align-items: center; justify-content: space-between; gap: 16px; flex-wrap: wrap; margin-bottom: 34px; padding-bottom: 24px; border-bottom: 1px solid var(--border); }
        .footer-brand-line { font-size: 12px; letter-spacing: 1.5px; color: var(--body); text-transform: uppercase; margin: 0; font-weight: 700; }
        .footer-social-row { display: flex; align-items: center; gap: 16px; }
        .footer-social-label { font-size: 11px; letter-spacing: 1px; color: var(--faint); text-transform: uppercase; }
        .footer-social-row a { color: var(--sub); display: flex; width: 30px; height: 30px; border-radius: 50%; background: var(--surface2); align-items: center; justify-content: center; transition: color .15s ease, background .15s ease; }
        .footer-social-row a:hover { color: var(--text); background: var(--border); }
        .footer-cols { display: flex; gap: 56px; flex-wrap: wrap; margin-bottom: 34px; }
        .footer-col { display: flex; flex-direction: column; gap: 12px; }
        .footer-col-title { font-size: 11px; letter-spacing: 1.2px; color: var(--faint); text-transform: uppercase; margin: 0 0 4px; font-weight: 700; }
        .footer-col button { background: none; border: none; color: var(--body); font-size: 13.5px; cursor: pointer; font-family: inherit; text-align: left; padding: 0; transition: color .15s ease; }
        .footer-col button:hover { color: #FF8A8F; }
        .footer-bottom-bar { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; padding-top: 22px; border-top: 1px solid var(--border); color: var(--faint); font-size: 11.5px; }
        .footer-bottom-bar button { background: none; border: none; color: var(--faint); font-size: 11.5px; cursor: pointer; font-family: inherit; text-decoration: none; }
        .footer-bottom-bar button:hover { color: var(--text); text-decoration: underline; }
        .footer-link-accent { color: #FF4D6D !important; font-weight: 600; }
        .footer-link-plain { color: var(--body); font-size: 13.5px; text-decoration: none; }
        .footer-link-plain:hover { color: var(--text); }
        .footer-trust-badge { display: flex; align-items: center; gap: 5px; background: var(--surface2); border: 1px solid var(--border); border-radius: 999px; padding: 5px 12px; margin-left: auto; font-size: 11px; }
        .footer-trust-badge strong { color: #635BFF; font-weight: 800; }
        @media (max-width: 640px) { .footer-trust-badge { margin-left: 0; } }
        @media (max-width: 640px) {
          .site-footer-rich { padding: 36px 20px 100px; }
          .footer-cols { gap: 34px; }
        }
        @media (max-width: 640px) {
          .community-impact { padding: 16px 20px; margin: 16px 16px 0; }
        }
        .related-full { margin-top: 30px; }
        .related-full .mini-row .mini-card { flex: 0 0 180px; }
        .item-page-info { flex: 1; min-width: 0; max-width: 440px; }
        @media (min-width: 1500px) {
          .item-page-info { max-width: 500px; }
        }
        @media (min-width: 781px) {
          .item-page-info { background: var(--card-alt); border: 1px solid #24242a; border-radius: 22px; padding: 26px 28px; }
          .item-page-gallery .detail-media { box-shadow: 0 20px 50px -20px rgba(0,0,0,0.6); }
          .item-page .detail-price { background: linear-gradient(135deg, #FF4D6D, #FF8A4D); -webkit-background-clip: text; background-clip: text; color: transparent; }
        }
        @media (max-width: 780px) {
          .item-page-grid { flex-direction: column; }
          .item-page-gallery { position: static; width: 100%; }
          .item-page-info { max-width: 100%; }
        }
        .item-page .detail-media { height: 480px; border-radius: 20px; position: sticky; top: 90px; }
        @media (max-width: 780px) {
          .item-page .detail-media { height: 340px; border-radius: 16px; }
        }
        .detail-media { height: 220px; position: relative; border-radius: 22px 22px 0 0; }
        .dark-close { top: 14px; right: 14px; background: #00000066; }
        .dark-close-left { top: 14px; left: 14px; right: auto; background: #00000066; z-index: 6; }
        .detail-heart { position: absolute; top: 14px; right: 14px; }
        .detail-body { padding: 20px 22px 24px; }
        .detail-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
        .detail-title { font-size: 18px; font-weight: 700; margin: 0; line-height: 1.25; }
        .detail-meta-row { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; font-size: 12px; color: var(--faint); margin: 6px 0 0; }
        .detail-meta-row span { display: flex; align-items: center; gap: 4px; }
        .detail-modal .detail-price { margin: 0; white-space: nowrap; }
        .tag-row { display: flex; flex-wrap: wrap; gap: 6px; margin: 12px 0 18px; }
        .info-tag { font-size: 11px; background: var(--bg); border: 1px solid var(--border); color: var(--body); padding: 5px 11px; border-radius: 20px; }
        .seller-card { display: flex; align-items: center; gap: 10px; background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 10px 14px; margin-bottom: 18px; }
        .seller-avatar { width: 34px; height: 34px; font-size: 14px; }
        .seller-name { font-size: 13px; font-weight: 700; margin: 0; }
        .seller-rating { font-size: 11px; color: var(--sub); margin: 2px 0 0; display: flex; align-items: center; gap: 4px; }
        .impact-box { display: flex; gap: 10px; align-items: flex-start; background: #4DE1C114; border: 1px solid #4DE1C133; border-radius: 14px; padding: 12px 14px; margin-bottom: 18px; }
        .mini-map { border-radius: 14px; overflow: hidden; border: 1px solid var(--border); margin-bottom: 18px; }
        .mini-map iframe { width: 100%; height: 160px; border: none; display: block; filter: grayscale(0.3) brightness(0.85) contrast(1.1); }
        .mini-map-note { font-size: 10.5px; color: var(--faint); text-align: center; padding: 6px 0; margin: 0; background: var(--bg); }
        .impact-title { font-size: 12px; font-weight: 700; margin: 0 0 3px; color: #4DE1C1; }
        .impact-sub { font-size: 11px; color: var(--sub); margin: 0; line-height: 1.4; }
        .shipping-box { display: flex; gap: 10px; align-items: flex-start; background: var(--card); border: 1px solid var(--border); border-radius: 14px; padding: 12px 14px; margin-bottom: 18px; }
        .shipping-title { font-size: 12px; font-weight: 700; margin: 0 0 3px; color: var(--text); }
        .shipping-sub { font-size: 11px; color: var(--sub); margin: 0; line-height: 1.4; }
        .questions-box { margin-bottom: 18px; }
        .questions-title { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--text); margin: 0 0 10px; }
        .questions-empty { font-size: 12px; color: var(--faint); margin: 0 0 10px; }
        .question-item { background: var(--card); border: 1px solid var(--border); border-radius: 12px; padding: 10px 12px; margin-bottom: 8px; }
        .question-text { font-size: 12.5px; color: var(--body); margin: 0; line-height: 1.5; }
        .question-header-row { display: flex; align-items: flex-start; justify-content: space-between; gap: 8px; }
        .question-mini-actions { display: flex; gap: 4px; flex-shrink: 0; }
        .question-mini-actions button { background: none; border: none; color: var(--faint); cursor: pointer; padding: 2px; display: flex; }
        .question-mini-actions button:hover { color: #FF4D6D; }
        .question-text strong { color: var(--text); }
        .answer-text { font-size: 12.5px; color: var(--sub); margin: 6px 0 0; line-height: 1.5; padding-top: 6px; border-top: 1px solid var(--border); }
        .answer-text strong { color: #4DE1C1; }
        .answer-pending { font-size: 11px; color: var(--faint); margin: 6px 0 0; font-style: italic; }
        .answer-form, .ask-form { display: flex; gap: 6px; margin-top: 8px; }
        .answer-form input, .ask-form input { flex: 1; border: 1px solid var(--input-border); border-radius: 10px; padding: 8px 12px; font-size: 12.5px; background: var(--bg); color: var(--text); font-family: inherit; }
        .answer-form button, .ask-form button { background: linear-gradient(135deg, #FF4D6D, #FF8A4D); border: none; border-radius: 10px; width: 34px; display: flex; align-items: center; justify-content: center; color: var(--bg); cursor: pointer; }
        .answer-form button:disabled, .ask-form button:disabled { opacity: 0.6; }
        .detail-actions { display: flex; gap: 10px; }
        .detail-actions .chat-btn { flex: 1; margin: 0; }
        .buy-btn { flex: 1; border: none; border-radius: 14px; background: linear-gradient(135deg, #FF4D6D, #FF8A4D); color: var(--bg); font-weight: 700; font-size: 13px; cursor: pointer; }
        .chat-btn { display: flex; align-items: center; justify-content: center; gap: 8px; width: 100%; border: 1px solid var(--input-border); border-radius: 14px; background: transparent; color: var(--text); padding: 12px; font-weight: 600; font-size: 13px; cursor: pointer; }
        .chat-btn:hover { background: var(--border); }
        .empty { padding: 60px 26px; text-align: center; color: var(--faint); font-size: 13px; }
        .toggle-link { font-size: 12px; margin-top: 14px; text-align: center; cursor: pointer; color: #4DE1C1; }
        .auth-modal { max-width: 400px; padding: 34px 30px; }
        .auth-brand { text-align: center; margin-bottom: 26px; }
        .social-auth-col { display: flex; flex-direction: column; gap: 12px; align-items: center; margin-bottom: 20px; }
        .google-signin-slot { display: flex; justify-content: center; width: 100%; min-height: 42px; }
        .auth-divider { display: flex; align-items: center; gap: 12px; margin: 22px 0; color: var(--faint); font-size: 11px; letter-spacing: 0.3px; }
        .auth-divider::before, .auth-divider::after { content: ""; flex: 1; height: 1px; background: var(--border); }
        .auth-mark { margin: 0 auto 16px; }
        @media (max-width: 780px) {
          .detail-overlay .auth-mark { width: 46px; height: 46px; }
          .detail-overlay .auth-mark svg, .detail-overlay .auth-mark img { width: 22px; height: 22px; }
        }
        .auth-title { font-size: 21px; font-weight: 700; margin: 0 0 6px; }
        .auth-subtitle { font-size: 13px; color: var(--sub); margin: 0; line-height: 1.5; }
        .tabs { display: flex; background: var(--bg); border: 1px solid var(--border); border-radius: 14px; padding: 4px; margin-bottom: 24px; }
        .tab { flex: 1; border: none; background: transparent; color: var(--sub); padding: 11px; border-radius: 10px; font-size: 13.5px; font-weight: 600; cursor: pointer; font-family: inherit; transition: background 0.15s; }
        .tab.active { background: var(--text); color: var(--bg); }
        .auth-modal label { margin: 18px 0 7px; }
        .auth-modal label:first-of-type { margin-top: 0; }
        .input-icon { display: flex; align-items: center; gap: 10px; border: 1px solid var(--input-border); border-radius: 13px; padding: 0 14px; background: var(--bg); transition: border-color 0.15s; }
        .input-icon:focus-within { border-color: #FF4D6D88; }
        .input-icon svg { color: var(--faint); flex-shrink: 0; }
        .input-icon input { border: none; padding: 13px 0; background: transparent; }
        .auth-modal .submit-btn { margin-top: 26px; padding: 15px; font-size: 14px; border-radius: 14px; }
        .auth-modal .toggle-link { margin-top: 16px; font-size: 12.5px; }
        .post-modal { max-width: 400px; }
        .post-mobile-header { display: none; }
        @media (max-width: 780px) {
          .post-mobile-header { display: flex; align-items: center; padding: 16px 14px; border-bottom: 1px solid var(--border); position: sticky; top: 0; background: var(--card); z-index: 3; }
          .post-mobile-close { background: none; border: none; color: var(--text); display: flex; padding: 4px; cursor: pointer; }
          .post-mobile-title { flex: 1; text-align: center; margin: 0; font-size: 16px; font-weight: 700; margin-right: 26px; }
          .post-modal .close-btn { display: none; }
          .post-modal .auth-title, .post-modal .auth-subtitle { display: none; }
          .post-modal { padding-top: 0; }
        }
        @media (min-width: 780px) {
          .post-modal { max-width: 760px; }
          .post-modal-grid { display: grid; grid-template-columns: 280px 1fr; gap: 32px; align-items: start; }
        }
        .post-section-label { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--faint); font-weight: 700; margin: 24px 0 10px; }
        .post-section-label:first-of-type { margin-top: 6px; }
        .upload-box { display: flex; flex-direction: column; align-items: center; gap: 6px; border: 1.5px dashed var(--input-border); border-radius: 16px; padding: 26px 16px; margin-bottom: 12px; color: var(--body); font-size: 13px; font-weight: 600; cursor: pointer; text-align: center; }
        .upload-box:hover { border-color: #FF4D6D; }
        .image-preview-row { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 4px; }
        .image-preview.uploading { display: flex; align-items: center; justify-content: center; background: var(--bg); color: var(--faint); }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .image-preview { position: relative; width: 100%; aspect-ratio: 1; border-radius: 12px; overflow: hidden; border: 1px solid var(--input-border); }
        .image-preview img { width: 100%; height: 100%; object-fit: cover; }
        .image-preview button { position: absolute; top: 4px; right: 4px; background: #000000aa; border: none; color: #fff; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; cursor: pointer; padding: 0; }
        .upload-hint { font-size: 11px; color: var(--faint); font-weight: 400; }
        .pill-group { display: flex; flex-wrap: wrap; gap: 6px; margin-bottom: 4px; }
        .pill { border: 1px solid var(--input-border); background: var(--bg); color: var(--body); border-radius: 20px; padding: 6px 12px; font-size: 12px; cursor: pointer; font-family: inherit; }
        .pill.active { background: linear-gradient(135deg, #FF4D6D, #FF8A4D); color: var(--bg); border-color: transparent; font-weight: 700; }
        .price-input { max-width: 140px; }
        .euro-prefix { color: var(--faint); font-weight: 700; font-size: 14px; }
        .post-preview-card { border: 1px solid var(--border); border-radius: 16px; overflow: hidden; background: var(--bg); margin-top: 18px; }
        .post-preview-media { height: 140px; background: var(--card); display: flex; align-items: center; justify-content: center; color: var(--faint); background-size: cover; background-position: center; }
        .post-preview-body { padding: 10px 12px; }
        .post-preview-price { color: #4DE1C1; font-weight: 700; font-size: 14px; margin: 0; }
        .post-preview-title { font-size: 12.5px; color: var(--body); margin: 3px 0 0; }
        .post-preview-meta { font-size: 11px; color: var(--faint); margin: 3px 0 0; }
      `}</style>

      <header className="top">
        <div className="brand" onClick={goHome} style={{ cursor: "pointer" }}>
          <div className="brand-mark">
            <svg width="18" height="18" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <path d="M 54 30 L 54 62 A 13 13 0 1 1 39 56" fill="none" stroke="#121214" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1>Ropelin</h1>
        </div>
        <div className="top-actions">
          <button className="icon-btn" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} title={theme === "dark" ? "Modo claro" : "Modo oscuro"}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {loggedIn && (
            <button className="icon-btn" onClick={() => setShowOrders(true)}>
              <Package size={16} />
            </button>
          )}
          {loggedIn && (
            <button className="icon-btn hide-on-mobile-nav" onClick={handleOpenNotifs}>
              <Bell size={16} />
              {notifications.some((n) => !n.read) && (
                <span className="notif-dot">{notifications.filter((n) => !n.read).length}</span>
              )}
            </button>
          )}
          {loggedIn && (
            <button className="icon-btn hide-on-mobile-nav" onClick={() => setShowFavorites(true)}>
              <Heart size={16} fill={saved.size > 0 ? "#FF4D6D" : "none"} color={saved.size > 0 ? "#FF4D6D" : "currentColor"} />
              {saved.size > 0 && <span className="notif-dot">{saved.size}</span>}
            </button>
          )}
          {loggedIn && (
            <span className="badge profile-badge hide-on-mobile-nav" onClick={viewProfile}>
              <span className="mini-avatar" style={{ background: avatarColor }}>{username[0]?.toUpperCase()}</span>
              @{username}
            </span>
          )}
          <button className="btn primary hide-on-mobile-nav" onClick={openPostForm}><Plus size={14} /> Vender</button>
          {!loggedIn && (
            <button className="btn ghost hide-on-mobile-nav" onClick={() => setShowAuth(true)}><LogIn size={14} /> <span className="btn-label">Entrar</span></button>
          )}

          <div className="more-menu-wrap">
            <button className="icon-btn more-menu-btn" onClick={() => setShowMoreMenu((v) => !v)}>
              <MoreHorizontal size={16} />
            </button>
            {showMoreMenu && (
              <>
                <div className="more-menu-backdrop" onClick={() => setShowMoreMenu(false)} />
                <div className="more-menu-panel">
                  {loggedIn && (
                    <button onClick={() => { setShowMoreMenu(false); setShowSettings(true); }}><Settings size={15} /> Ajustes</button>
                  )}
                  <button onClick={() => { setShowMoreMenu(false); setShowLeague(true); }}><Trophy size={15} /> Liga</button>
                  {isModerator && (
                    <button onClick={() => { setShowMoreMenu(false); openAdminPanel(); }}><ShieldCheck size={15} /> Admin</button>
                  )}
                  {loggedIn && (
                    <button onClick={() => { setShowMoreMenu(false); apiLogout(); setLoggedIn(false); setUsername(""); setUserRole("user"); toast("Sesión cerrada"); }}><LogOut size={15} /> Salir</button>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      {!anyModalOpen && !(showPost && numCols < 3) && (
      <div className="mobile-bottom-nav">
        <button onClick={() => { closeItemView(); setCategory("Para ti"); setQuery(""); }}>
          <Home size={20} />
          <span>Inicio</span>
        </button>
        {loggedIn && (
          <button onClick={() => setShowFavorites(true)}>
            <Heart size={20} fill={saved.size > 0 ? "#FF4D6D" : "none"} color={saved.size > 0 ? "#FF4D6D" : "currentColor"} />
            <span>Favoritos</span>
            {saved.size > 0 && <span className="notif-dot bottom-nav-dot">{saved.size}</span>}
          </button>
        )}
        <button
          className="mobile-nav-sell"
          onClick={openPostForm}
        >
          <Plus size={22} />
        </button>
        {loggedIn ? (
          <button onClick={handleOpenNotifs}>
            <Bell size={20} />
            <span>Avisos</span>
            {notifications.some((n) => !n.read) && <span className="notif-dot bottom-nav-dot">{notifications.filter((n) => !n.read).length}</span>}
          </button>
        ) : (
          <button onClick={() => setShowAuth(true)}>
            <LogIn size={20} />
            <span>Entrar</span>
          </button>
        )}
        {loggedIn && (
          <button onClick={viewProfile}>
            <span className="mini-avatar bottom-nav-avatar" style={{ background: avatarColor }}>{username[0]?.toUpperCase()}</span>
            <span>Perfil</span>
          </button>
        )}
      </div>
      )}

      {!hidesFeedOnDesktop && (
        <div className="hero">
          <h2>Lo que ya no usas, <span className="accent">alguien lo está buscando</span>.</h2>
          <p>Compra y vende de todo, de segunda mano. Busca, publica, negocia.</p>
        </div>
      )}

      <div className="search-row">
        <div className="search-box">
          <Search size={15} color="#9A9AA3" />
          <input
            placeholder="Buscar prendas..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); if (openItem) closeItemView(); if (photoSearchResults) clearPhotoSearch(); }}
          />
        </div>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          id="photo-search-input"
          style={{ display: "none" }}
          onChange={(e) => { if (e.target.files[0]) handlePhotoSearch(e.target.files[0]); e.target.value = ""; }}
        />
        <button
          className="filter-toggle-btn"
          onClick={() => document.getElementById("photo-search-input").click()}
          disabled={searchingPhoto}
          title="Buscar por foto"
        >
          {searchingPhoto ? <RefreshCw size={15} className="spin" /> : <Camera size={15} />}
        </button>
        <button className={"filter-toggle-btn" + (showFilters ? " active" : "")} onClick={() => setShowFilters(!showFilters)}>
          <SlidersHorizontal size={15} />
        </button>
      </div>

      {photoSearchResults !== null && (
        <div className="photo-search-banner">
          <Camera size={14} />
          <span>Resultados para: <strong>{photoSearchKeywords.join(", ")}</strong></span>
          <button onClick={clearPhotoSearch}><X size={13} /> Quitar</button>
        </div>
      )}

      {showFilters && (
        <div className="filter-panel">
          <div className="filter-panel-row">
            <label>Precio</label>
            <div className="filter-price-inputs">
              <input type="number" placeholder="Mín." value={priceFilter.min} onChange={(e) => { setPriceFilter((p) => ({ ...p, min: e.target.value })); if (openItem) closeItemView(); }} />
              <span>-</span>
              <input type="number" placeholder="Máx." value={priceFilter.max} onChange={(e) => { setPriceFilter((p) => ({ ...p, max: e.target.value })); if (openItem) closeItemView(); }} />
            </div>
          </div>
          <div className="filter-panel-row">
            <label>Talla</label>
            <select value={sizeFilter} onChange={(e) => { setSizeFilter(e.target.value); if (openItem) closeItemView(); }}>
              <option value="">Todas</option>
              {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div className="filter-panel-row">
            <label>Ordenar por</label>
            <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); if (openItem) closeItemView(); }}>
              <option value="recent">Más recientes</option>
              <option value="price_asc">Precio: menor a mayor</option>
              <option value="price_desc">Precio: mayor a menor</option>
              {myLocation && <option value="distance">Distancia: más cerca</option>}
            </select>
          </div>

          {myLocation ? (
            <div className="filter-panel-row">
              <label>Distancia máxima</label>
              <select value={distanceFilter} onChange={(e) => { setDistanceFilter(e.target.value); if (openItem) closeItemView(); }}>
                <option value="">Cualquier distancia</option>
                <option value="5">Menos de 5 km</option>
                <option value="10">Menos de 10 km</option>
                <option value="25">Menos de 25 km</option>
                <option value="50">Menos de 50 km</option>
                <option value="100">Menos de 100 km</option>
              </select>
            </div>
          ) : (
            <button className="filter-location-prompt" onClick={detectMyLocation} disabled={locatingMe}>
              <MapPin size={13} /> {locatingMe ? "Detectando..." : "Activar ubicación para ver la distancia"}
            </button>
          )}

          {(priceFilter.min || priceFilter.max || sizeFilter || distanceFilter || sortBy !== "recent") && (
            <button className="filter-clear-btn" onClick={() => { setPriceFilter({ min: "", max: "" }); setSizeFilter(""); setDistanceFilter(""); setSortBy("recent"); }}>
              Quitar filtros
            </button>
          )}
        </div>
      )}

      <div className="cat-scroll">
        <button className={"cat-circle" + (category === "Para ti" ? " active" : "")} onClick={() => { setCategory("Para ti"); if (openItem) closeItemView(); }}>
          <span className="cat-icon-wrap forYou">✨</span>
          <span>Para ti</span>
        </button>
        {["Todo", ...platformSettings.categories].map((c) => {
          const Icon = CATEGORY_ICONS[c] || Tag;
          const accent = CATEGORY_COLORS[c] || "#9A9AA3";
          return (
            <button key={c} className={"cat-circle" + (category === c ? " active" : "")} onClick={() => { setCategory(c); if (openItem) closeItemView(); }}>

              <span
                className="cat-icon-wrap"
                style={category === c ? {} : { borderColor: accent + "33", background: accent + "14", color: accent }}
              >
                <Icon size={18} />
              </span>
              <span>{c}</span>
            </button>
          );
        })}
      </div>

      {openItem && (() => {
        const isDesktop = numCols >= 3;

        const galleryEl = (
          <div
            className="detail-media"
            style={{ backgroundImage: `url(${(openItem.images && openItem.images[galleryIndex]) || openItem.photo})`, backgroundSize: "cover", backgroundPosition: "center" }}
          >
            {openItem.featured && <span className="featured-ribbon" style={{ top: 14 }}>Destacado</span>}
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
        );

        const relatedEl = (
          <>
            {allItems.filter((i) => i.seller === openItem.seller && i.id !== openItem.id).length > 0 && (
              <>
                <p className="profile-section-title related-heading">Más de @{openItem.seller}</p>
                <div className="mini-row">
                  {allItems.filter((i) => i.seller === openItem.seller && i.id !== openItem.id).slice(0, 7).map((i, idx) => (
                    <div key={i.id} className="mini-card" onClick={() => viewItem(i)}>
                      <div className="mini-swatch" style={miniSwatchStyle(i, idx)} />
                      <p className="mini-title">{i.title}</p>
                      <p className="mini-price">{i.price}€</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {allItems.filter((i) => i.category === openItem.category && i.id !== openItem.id && i.seller !== openItem.seller).length > 0 && (
              <>
                <p className="profile-section-title related-heading">Artículos parecidos</p>
                <div className="mini-row">
                  {allItems.filter((i) => i.category === openItem.category && i.id !== openItem.id && i.seller !== openItem.seller).slice(0, 7).map((i, idx) => (
                    <div key={i.id} className="mini-card" onClick={() => viewItem(i)}>
                      <div className="mini-swatch" style={miniSwatchStyle(i, idx)} />
                      <p className="mini-title">{i.title}</p>
                      <p className="mini-price">{i.price}€</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </>
        );

        const infoEl = (
          <>
            <div className="detail-top">
              <h3 className="detail-title">{openItem.title}</h3>
              <div>
                <p className="detail-price">{openItem.price}€</p>
                {openItem.price < 25 && <p className="trend-tag"><TrendingDown size={11} /> Por debajo de la media</p>}
              </div>
            </div>

            <p className="detail-meta-row">
              <span>Publicado {timeAgo(openItem.minutesAgo)}</span>
              {typeof openItem.views === "number" && <span>· <Eye size={12} /> {openItem.views} {openItem.views === 1 ? "vista" : "vistas"}</span>}
              {openItem.favoritesCount > 0 && <span>· <Heart size={12} /> {openItem.favoritesCount} en favoritos</span>}
            </p>

            <div className="tag-row">
              <span className="info-tag">{openItem.category}</span>
              {openItem.size && <span className="info-tag">Talla {openItem.size}</span>}
              <span className="info-tag">{openItem.condition}</span>
            </div>

            {openItem.description && (
              <p className="detail-description">{openItem.description}</p>
            )}

            <div className="seller-card">
              <div
                className="mini-avatar seller-avatar"
                style={{ background: PALETTE[openItem.seller.length % PALETTE.length], cursor: "pointer" }}
                onClick={() => { setOpenItem(null); openProfile(openItem.seller); }}
              >
                {openItem.seller[0]?.toUpperCase()}
              </div>
              <div style={{ flex: 1, cursor: "pointer" }} onClick={() => { setOpenItem(null); openProfile(openItem.seller); }}>
                <p className="seller-name">
                  @{openItem.seller}
                  {openItem.verified && <CheckCircle size={13} color="#4DE1C1" style={{ marginLeft: 5, verticalAlign: -2 }} />}
                </p>
                <p className="seller-rating">
                  <Star size={11} fill="#FFC24D" color="#FFC24D" /> 4.8 · 32 ventas
                  {openItem.distanceKm !== null && <> · <MapPin size={11} /> a {openItem.distanceKm < 1 ? "menos de 1" : Math.round(openItem.distanceKm)} km</>}
                  {openItem.distanceKm === null && openItem.city && <> · <MapPin size={11} /> {openItem.city}</>}
                </p>
                <div className="seller-mini-verify">
                  <span className="verify-chip done"><CheckCircle size={10} /> Email</span>
                  <span className="verify-chip done"><CheckCircle size={10} /> Teléfono</span>
                </div>
              </div>
              <button className={"follow-btn" + (following.has(openItem.seller) ? " on" : "")} onClick={() => toggleFollow(openItem.seller)}>
                {following.has(openItem.seller) ? <UserCheck size={13} /> : <UserPlus size={13} />}
                {following.has(openItem.seller) ? "Siguiendo" : "Seguir"}
              </button>
            </div>

            {loggedIn && openItem.seller !== username && (
              <button className="report-flag-btn" onClick={() => setShowReportForm({ targetType: "item", itemId: openItem.id })}>
                <FileWarning size={12} /> Denunciar este artículo
              </button>
            )}

            <div className="impact-box">
              <Leaf size={16} color="#4DE1C1" />
              <div>
                <p className="impact-title">Impacto de esta compra</p>
                <p className="impact-sub">Ahorras ~{(openItem.price * 2.1).toFixed(0)} kg de CO₂ y {(openItem.price * 90).toFixed(0)} L de agua frente a comprarlo nuevo</p>
              </div>
            </div>

            <div className="shipping-box">
              <Truck size={16} color="#9A9AA3" />
              <div>
                <p className="shipping-title">Cómo se entrega</p>
                <p className="shipping-sub">Por correo, con etiqueta de envío (~{platformSettings.shippingFee}€) o en mano si quedáis cerca — lo acordáis por chat</p>
              </div>
            </div>

            <div className="detail-actions">
              {openItem.seller === username ? (
                <>
                  <button className="chat-btn" onClick={() => { startEdit(openItem); }}><Pencil size={15} /> Editar</button>
                  {openItem.featured ? (
                    <button className="buy-btn" disabled style={{ opacity: 0.6 }}><TrendingUp size={15} /> Ya destacado</button>
                  ) : (
                    <button className="offer-btn" onClick={() => handleBoost(openItem.id)}><TrendingUp size={15} /> {`Destacar por ${platformSettings.boostPrice}€`}</button>
                  )}
                </>
              ) : (
                <>
                  <button className="chat-btn" onClick={() => openChat(openItem)}><MessageCircle size={15} /> Contactar</button>
                  <button className="offer-btn" onClick={() => loggedIn ? setShowOffer(true) : setShowAuth(true)}><HandCoins size={15} /> Ofertar</button>
                  <button className="buy-btn" onClick={() => loggedIn ? setShowCheckout(true) : setShowAuth(true)}>Comprar</button>
                </>
              )}
            </div>

            {isAdmin && (
              <div className="admin-toolbar">
                <span className="admin-toolbar-label">Admin</span>
                <button className="admin-icon-action" onClick={() => openAdminItemEdit(openItem)} title="Editar publicación">
                  <Pencil size={14} />
                </button>
                <button className="admin-icon-action danger" onClick={() => removeItem(openItem.id)} title="Eliminar publicación">
                  <Trash2 size={14} />
                </button>
              </div>
            )}
          </>
        );



        return isDesktop ? (
          <div className="item-page">
            <button className="back-btn" onClick={closeItemView}><ArrowLeft size={16} /> Volver</button>
            <div className="item-page-grid">
              <div className="item-page-gallery">
                {galleryEl}
              </div>
              <div className="item-page-info">
                {infoEl}
              </div>
            </div>
            <div className="related-full">
              {relatedEl}
            </div>
          </div>
        ) : (
          <div className="overlay detail-overlay" onClick={closeItemView}>
            <div className="modal detail-modal" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn dark-close-left" onClick={closeItemView}><X size={14} /></button>
              {galleryEl}
              <div className="detail-body">{infoEl}{relatedEl}</div>
            </div>
          </div>
        );
      })()}

      {showHelpCenter && (() => {
        const helpContentEl = (
          <>
            <div className="league-header">
              <MessageCircle size={20} color="#4DE1C1" />
              <p className="auth-title" style={{ margin: 0 }}>Centro de ayuda</p>
            </div>

            <div className="tabs profile-tabs">
              <button className={"tab" + (helpTab === "faq" ? " active" : "")} onClick={() => setHelpTab("faq")}>Preguntas frecuentes</button>
              <button className={"tab" + (helpTab === "contact" ? " active" : "")} onClick={() => setHelpTab("contact")}>Contactar</button>
              {loggedIn && (
                <button className={"tab" + (helpTab === "mine" ? " active" : "")} onClick={() => setHelpTab("mine")}>Mis mensajes</button>
              )}
            </div>

            {helpTab === "faq" && (
              <div className="faq-list">
                {buildFaqItems(platformSettings).map((item, i) => (
                  <details key={i} className="faq-item">
                    <summary>{item.q}</summary>
                    <p>{item.a}</p>
                  </details>
                ))}
              </div>
            )}

            {helpTab === "contact" && (
              loggedIn ? (
                <form onSubmit={submitSupportForm}>
                  <label>Asunto</label>
                  <input
                    className="input-plain"
                    placeholder="¿Sobre qué necesitas ayuda?"
                    value={supportSubject}
                    onChange={(e) => setSupportSubject(e.target.value)}
                    required
                  />
                  <label>Mensaje</label>
                  <textarea
                    className="report-textarea"
                    placeholder="Cuéntanos con detalle qué ha pasado..."
                    value={supportMessage}
                    onChange={(e) => setSupportMessage(e.target.value)}
                    rows={4}
                    required
                  />
                  <button type="submit" className="btn primary admin-refund-btn">Enviar mensaje</button>
                </form>
              ) : (
                <p className="empty-tab">Inicia sesión para poder escribirnos.</p>
              )
            )}

            {helpTab === "mine" && (
              mySupportMessages.length === 0
                ? <p className="empty-tab">Aún no has enviado ningún mensaje de soporte.</p>
                : <div className="admin-user-list">
                    {mySupportMessages.map((m) => (
                      <div key={m.id} className={"admin-dispute-row" + (m.status === "resolved" ? " reviewed" : "")}>
                        <p className="admin-user-name">
                          {m.subject}
                          {m.status === "resolved" ? <span className="admin-role-badge">Respondido</span> : <span className="admin-role-badge" style={{ background: "#FFC24D" }}>Pendiente</span>}
                        </p>
                        <p className="admin-user-meta">{new Date(m.createdAt).toLocaleDateString("es-ES")}</p>
                        <p className="admin-dispute-reason">{m.message}</p>
                        {m.adminReply && <p className="admin-dispute-reason" style={{ color: "#4DE1C1" }}>Respuesta de Ropelin: {m.adminReply}</p>}
                      </div>
                    ))}
                  </div>
            )}
          </>
        );

        return numCols >= 3 ? (
          <div className="legal-page">
            <button className="back-btn" onClick={() => setShowHelpCenter(false)}><ArrowLeft size={16} /> Volver</button>
            {helpContentEl}
          </div>
        ) : (
          <div className="overlay" onClick={() => setShowHelpCenter(false)}>
            <div className="modal admin-modal" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setShowHelpCenter(false)}><X size={14} /></button>
              {helpContentEl}
            </div>
          </div>
        );
      })()}

      {showLegal && (() => {
        const legalContentEl = (
          <>
            {showLegal === "updates" && (() => {
              const AGOSTO = [
                { Icon: Camera, type: "Nuevo", text: "Búsqueda por foto: haz una foto y te buscamos artículos parecidos" },
                { Icon: Tag, type: "Nuevo", text: "Nuevas categorías: Vehículos, Libros y música, Belleza, Bebé e infantil, Jardín y herramientas, Instrumentos musicales" },
                { Icon: UserPlus, type: "Nuevo", text: "Ahora puedes seguir a otros vendedores y te avisamos cuando publiquen algo nuevo" },
                { Icon: RefreshCw, type: "Mejora", text: "Scroll infinito en el feed, sin necesidad de pulsar \"cargar más\"" },
                { Icon: LogIn, type: "Nuevo", text: "Inicio de sesión con Google" },
                { Icon: Mail, type: "Nuevo", text: "Correo de bienvenida al registrarte" },
              ];
              const JULIO = [
                { Icon: Crop, type: "Mejora", text: "Editor de recorte al subir fotos de perfil, portada y artículos" },
                { Icon: MapPin, type: "Nuevo", text: "Ciudad y distancia aproximada en cada artículo" },
                { Icon: Shield, type: "Nuevo", text: "Banner de consentimiento de cookies" },
                { Icon: LayoutGrid, type: "Mejora", text: "Rediseño del formulario de publicar y del pie de página" },
              ];
              const TYPE_COLORS = { Nuevo: "#4DE1C1", Mejora: "#8C7CFF", Arreglo: "#FF8A4D" };
              const total = AGOSTO.length + JULIO.length;

              return (
                <>
                  <p className="auth-title">Novedades</p>
                  <div className="legal-text updates-list">
                    {platformSettings.updatesText ? (
                      <p style={{ whiteSpace: "pre-wrap" }}>{platformSettings.updatesText}</p>
                    ) : (
                      <>
                        <p className="updates-counter"><Sparkles size={13} color="#4DE1C1" /> {total} novedades este mes</p>

                        <div className="update-entry">
                          <p className="update-date">Agosto 2026</p>
                          <div className="update-bubbles">
                            {AGOSTO.map(({ Icon, type, text }) => (
                              <div className="update-bubble" key={text}>
                                <div className="update-bubble-icon"><Icon size={15} color="#9A9AA3" /></div>
                                <div>
                                  <span className="update-type-tag" style={{ color: TYPE_COLORS[type], borderColor: `${TYPE_COLORS[type]}55` }}>{type}</span>
                                  <p>{text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="update-entry">
                          <p className="update-date">Julio 2026</p>
                          <div className="update-bubbles">
                            {JULIO.map(({ Icon, type, text }) => (
                              <div className="update-bubble" key={text}>
                                <div className="update-bubble-icon"><Icon size={15} color="#9A9AA3" /></div>
                                <div>
                                  <span className="update-type-tag" style={{ color: TYPE_COLORS[type], borderColor: `${TYPE_COLORS[type]}55` }}>{type}</span>
                                  <p>{text}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="updates-subscribe-box">
                      {newsletterSubscribed ? (
                        <p className="updates-subscribe-done"><CheckCircle size={14} color="#4DE1C1" /> Te avisaremos por email de las novedades</p>
                      ) : (
                        <>
                          <p className="updates-subscribe-title">¿Quieres que te avisemos?</p>
                          <form className="updates-subscribe-form" onSubmit={handleNewsletterSubmit}>
                            <input
                              type="email" placeholder="Tu email"
                              value={newsletterEmail}
                              onChange={(e) => setNewsletterEmail(e.target.value)}
                            />
                            <button type="submit" className="btn primary">Avisarme</button>
                          </form>
                        </>
                      )}
                    </div>
                  </div>
                </>
              );
            })()}
            {showLegal === "about" && (
              <>
                <p className="auth-title">Quiénes somos</p>
                <div className="legal-text">
                  <p>Ropelin nació con una idea sencilla: lo que para ti ya no tiene uso, para otra persona puede ser justo lo que estaba buscando.</p>
                  <p>Somos un mercado de segunda mano donde puedes comprar y vender de todo — ropa, electrónica, artículos para el hogar y mucho más — de forma fácil, segura y a un clic de distancia.</p>

                  {allItems.length > 0 && (
                    <div className="about-impact-box">
                      <Leaf size={18} color="#4DE1C1" />
                      <p>
                        Entre toda la comunidad ya se han ahorrado{" "}
                        <strong>{Math.round(allItems.reduce((sum, i) => sum + i.price * 2.1, 0)).toLocaleString("es-ES")} kg de CO₂</strong>
                        {" "}y{" "}
                        <strong>{Math.round(allItems.reduce((sum, i) => sum + i.price * 90, 0)).toLocaleString("es-ES")} L de agua</strong>
                      </p>
                    </div>
                  )}

                  <div className="about-block">
                    <div className="about-block-icon"><User size={16} color="#9A9AA3" /></div>
                    <div>
                      <p className="about-block-title">Quién hay detrás</p>
                      <p className="about-block-text">Creado por una sola persona, con ganas de cambiar cómo compramos y vendemos de segunda mano.</p>
                    </div>
                  </div>

                  <div className="about-block">
                    <div className="about-block-icon"><ShieldCheck size={16} color="#9A9AA3" /></div>
                    <div>
                      <p className="about-block-title">Por qué confiar en Ropelin</p>
                      <p className="about-block-text">Los pagos se procesan con Stripe, y la comunidad está moderada para mantener la web segura para todos.</p>
                    </div>
                  </div>

                  <div className="about-block">
                    <div className="about-block-icon"><Sparkles size={16} color="#9A9AA3" /></div>
                    <div>
                      <p className="about-block-title">¿En qué estamos trabajando?</p>
                      <button className="about-block-link" onClick={() => openLegalPage("updates")}>Ver las Novedades →</button>
                    </div>
                  </div>

                  <div className="about-block">
                    <div className="about-block-icon"><Mail size={16} color="#9A9AA3" /></div>
                    <div>
                      <p className="about-block-title">¿Alguna duda?</p>
                      <button className="about-block-link" onClick={() => { setShowLegal(null); openHelpCenter(); }}>Escríbenos desde el Centro de ayuda →</button>
                    </div>
                  </div>
                </div>
              </>
            )}
            {showLegal === "terms" && (
              <>
                <p className="auth-title">Términos y condiciones</p>
                <div className="legal-text">
                  <p><strong>1. Objeto.</strong> Ropelin es una plataforma que conecta a compradores y vendedores de artículos de segunda mano. No somos propietarios de los artículos publicados ni parte de la compraventa entre usuarios.</p>
                  <p><strong>2. Registro.</strong> Debes ser mayor de edad y aportar datos veraces al crear tu cuenta.</p>
                  <p><strong>3. Comisiones.</strong> Ropelin cobra una comisión sobre cada venta completada a través de la plataforma, detallada antes de confirmar el pago.</p>
                  <p><strong>4. Responsabilidad.</strong> Cada vendedor es responsable de la veracidad de sus anuncios y del estado real de los artículos. Ropelin no garantiza la calidad de los productos.</p>
                  <p><strong>5. Envíos.</strong> Los envíos se gestionan a través de transportistas externos; Ropelin facilita la generación de etiquetas pero no es responsable de incidencias del transportista.</p>
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
          </>
        );

        const openAsPage = numCols >= 3;

        return openAsPage ? (
          <div className="legal-page">
            <button className="back-btn" onClick={() => setShowLegal(null)}><ArrowLeft size={16} /> Volver</button>
            {legalContentEl}
          </div>
        ) : (
          <div className="overlay" onClick={() => setShowLegal(null)}>
            <div className="modal legal-modal" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" onClick={() => setShowLegal(null)}><X size={14} /></button>
              {legalContentEl}
            </div>
          </div>
        );
      })()}

      {showPost && (() => {
        const postGridEl = (
          <div className="post-modal-grid">
            <div className="post-photos-col">
              <p className="post-section-label">Fotos</p>
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

              <p className="post-section-label">Vista previa</p>
              <div className="post-preview-card">
                <div className="post-preview-media" style={form.images[0] ? { backgroundImage: `url(${form.images[0]})` } : {}}>
                  {!form.images[0] && <ImagePlus size={20} />}
                </div>
                <div className="post-preview-body">
                  <p className="post-preview-price">{form.price ? `${form.price}€` : "0€"}</p>
                  <p className="post-preview-title">{form.title || "Título de tu prenda"}</p>
                  <p className="post-preview-meta">
                    {form.category}{form.size ? ` · Talla ${form.size}` : ""} · {form.condition}
                  </p>
                </div>
              </div>
            </div>

            <div className="post-form-col">
              <form onSubmit={handlePublish}>
                <p className="post-section-label">Detalles</p>
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
                  {platformSettings.categories.map((c) => (
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

                <p className="post-section-label">Precio</p>
                <label>Precio de venta</label>
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
        );

        return numCols >= 3 ? (
          <div className="post-page">
            <button className="back-btn" onClick={() => setShowPost(false)}><ArrowLeft size={16} /> Volver</button>
            <p className="auth-title">{editingItem ? "Editar prenda" : "Nueva prenda"}</p>
            <p className="auth-subtitle" style={{ marginBottom: 18 }}>{editingItem ? "Actualiza los datos de tu prenda" : "Rellena los datos y publícala en segundos"}</p>
            {postGridEl}
          </div>
        ) : (
          <div className="overlay detail-overlay" onClick={() => setShowPost(false)}>
            <div className="modal post-modal detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="post-mobile-header">
                <button className="post-mobile-close" onClick={() => setShowPost(false)}><X size={18} /></button>
                <p className="post-mobile-title">{editingItem ? "Editar" : "Vender"}</p>
              </div>
              <button className="close-btn" onClick={() => setShowPost(false)}><X size={14} /></button>
              <p className="auth-title">{editingItem ? "Editar prenda" : "Nueva prenda"}</p>
              <p className="auth-subtitle" style={{ marginBottom: 18 }}>{editingItem ? "Actualiza los datos de tu prenda" : "Rellena los datos y publícala en segundos"}</p>
              {postGridEl}
            </div>
          </div>
        );
      })()}

      {!hidesFeedOnDesktop && !hidesFeedCardsOnDesktop && (
      <>
      {loadError && !loading && (
        <div className="empty-state">
          <RefreshCw size={32} color="#FF4D6D" />
          <p className="empty-title">{loadError}</p>
          <button className="btn primary" onClick={loadAllItems}><RefreshCw size={14} /> Reintentar</button>
        </div>
      )}
      {loading && (
        <div className="two-col">
          {Array.from({ length: numCols }).map((_, col) => (
            <div className="col" key={col}>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="skeleton-card">
                  <div className="skeleton-media shimmer" />
                  <div className="skeleton-line shimmer" style={{ width: "70%" }} />
                  <div className="skeleton-line shimmer" style={{ width: "40%" }} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
      {!loading && !loadError && items.length === 0 && (
        <div className="empty-state">
          <PackageOpen size={38} color="#3A3A40" />
          <p className="empty-title">No hay prendas que coincidan</p>
          <p className="empty-sub">Prueba a cambiar los filtros, o sé el primero en publicar algo así.</p>
          <button className="btn primary" onClick={openPostForm}>
            <Plus size={14} /> Publicar la primera
          </button>
        </div>
      )}
      {!loading && (photoSearchResults !== null ? photoSearchResults : items).length > 0 && (() => {
        const displayItems = photoSearchResults !== null ? photoSearchResults : items;
        return (
        <>
        <div className="two-col">
          {Array.from({ length: Math.min(numCols, displayItems.length) }).map((_, col) => {
            const effectiveCols = Math.min(numCols, displayItems.length);
            const visibleItems = displayItems.slice(0, effectiveCols * feedRowsShown);
            return (
              <div className="col" key={col}>
                {visibleItems.filter((_, i) => i % effectiveCols === col).map((item) => {
                  const realIndex = displayItems.indexOf(item);
                  return (
                    <ItemCard key={item.id} item={item} index={realIndex} onOpen={viewItem} saved={saved.has(item.id)} toggleSave={toggleSave} />
                  );
                })}
              </div>
            );
          })}
        </div>
        {displayItems.length > numCols * feedRowsShown && (
          <div className="load-more-row">
            <RefreshCw size={16} className="spin" style={{ color: "#6A6A73" }} />
          </div>
        )}
        </>
        );
      })()}
      </>
      )}
      {!hidesFeedOnDesktop && (
        <>
        {category === "Para ti" && !query && allItems.length > 0 && (
          <div className="community-impact">
            <Leaf size={18} color="#4DE1C1" />
            <p>
              Entre toda la comunidad ya se han ahorrado{" "}
              <strong>{Math.round(allItems.reduce((sum, i) => sum + i.price * 2.1, 0)).toLocaleString("es-ES")} kg de CO₂</strong>
              {" "}y{" "}
              <strong>{Math.round(allItems.reduce((sum, i) => sum + i.price * 90, 0)).toLocaleString("es-ES")} L de agua</strong>
              {" "}frente a comprar todo nuevo
            </p>
          </div>
        )}
        {category === "Para ti" && !query && (
          <div className="newsletter-outer">
            <div className="newsletter-band">
              <div className="newsletter-text">
                <p className="newsletter-title">¡Suscríbete a nuestro boletín!</p>
                <p className="newsletter-sub">No vuelvas a perderte ninguna oferta.</p>
              </div>
              {newsletterSubscribed ? (
                <p className="newsletter-thanks"><CheckCircle size={16} color="#4DE1C1" /> ¡Ya estás suscrito!</p>
              ) : (
                <form className="newsletter-form" onSubmit={handleNewsletterSubmit}>
                  <input
                    type="email"
                    placeholder="Introduce tu correo electrónico"
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                  />
                  <button type="submit" className="btn primary">Suscribirme</button>
                </form>
              )}
            </div>
          </div>
        )}
        </>
      )}

      <footer className="site-footer-rich">
        <div className="footer-inner">
        <div className="footer-top-row">
          <p className="footer-brand-line">ROPELIN — COMPRA Y VENDE DE SEGUNDA MANO.</p>
          {(platformSettings.instagramUrl || platformSettings.tiktokUrl || platformSettings.facebookUrl || platformSettings.twitterUrl) && (
            <div className="footer-social-row">
              <span className="footer-social-label">SÍGUENOS</span>
              {platformSettings.facebookUrl && (
                <a href={platformSettings.facebookUrl} target="_blank" rel="noopener noreferrer"><Facebook size={15} /></a>
              )}
              {platformSettings.instagramUrl && (
                <a href={platformSettings.instagramUrl} target="_blank" rel="noopener noreferrer"><Instagram size={15} /></a>
              )}
              {platformSettings.tiktokUrl && (
                <a href={platformSettings.tiktokUrl} target="_blank" rel="noopener noreferrer"><TikTokIcon size={15} /></a>
              )}
              {platformSettings.twitterUrl && (
                <a href={platformSettings.twitterUrl} target="_blank" rel="noopener noreferrer"><Twitter size={15} /></a>
              )}
            </div>
          )}
        </div>
        <div className="footer-cols">
          <div className="footer-col">
            <p className="footer-col-title">Ropelin</p>
            <button onClick={() => openLegalPage("about")}>Quiénes somos</button>
            <button onClick={() => openLegalPage("updates")}>Novedades</button>
            <button onClick={openHelpCenter}>Ayuda</button>
          </div>
          <div className="footer-col">
            <p className="footer-col-title">Comprar y vender</p>
            <button onClick={openPostForm}>Publicar un artículo</button>
            <button onClick={() => { setOpenItem(null); setShowProfile(false); setCategory("Moda"); setQuery(""); navigate("/"); }}>Moda</button>
            <button onClick={() => { setOpenItem(null); setShowProfile(false); setCategory("Electrónica"); setQuery(""); navigate("/"); }}>Electrónica</button>
            <button onClick={() => { setOpenItem(null); setShowProfile(false); setCategory("Hogar"); setQuery(""); navigate("/"); }}>Hogar</button>
            <button className="footer-link-accent" onClick={() => { setOpenItem(null); setShowProfile(false); setCategory("Todo"); setQuery(""); navigate("/"); }}>Ver todas →</button>
          </div>
          <div className="footer-col">
            <p className="footer-col-title">Legal</p>
            <button onClick={() => setShowLegal("terms")}>Términos y condiciones</button>
            <button onClick={() => setShowLegal("privacy")}>Privacidad</button>
            <button onClick={() => setShowLegal("cookies")}>Cookies</button>
          </div>
          <div className="footer-col">
            <p className="footer-col-title">Contacto</p>
            <a href="mailto:hola@ropelin.com" className="footer-link-plain">hola@ropelin.com</a>
            <button onClick={openHelpCenter}>Centro de ayuda</button>
          </div>
        </div>
        <div className="footer-bottom-bar">
          <span>© Ropelin {new Date().getFullYear()}</span>
          <span>·</span>
          <button onClick={() => setShowLegal("terms")}>Términos y condiciones</button>
          <span>·</span>
          <button onClick={() => setShowLegal("privacy")}>Privacidad</button>
          <span>·</span>
          <button onClick={() => setShowLegal("cookies")}>Cookies</button>
          <span className="footer-trust-badge">🔒 Pagos seguros con <strong>stripe</strong></span>
        </div>
        </div>
      </footer>

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
        <div className="overlay detail-overlay" onClick={() => setShowAuth(false)}>
          <div className="modal auth-modal detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowAuth(false)}><X size={14} /></button>

            <div className="auth-brand">
              <div className="brand-mark auth-mark"><Zap size={18} color="#121214" /></div>
              <p className="auth-title">{authMode === "login" ? "Bienvenido de vuelta" : "Únete a Ropelin"}</p>
              <p className="auth-subtitle">{authMode === "login" ? "Entra para seguir comprando y vendiendo" : "Crea tu cuenta en unos segundos"}</p>
            </div>

            <div className="tabs">
              <button className={"tab" + (authMode === "login" ? " active" : "")} onClick={() => setAuthMode("login")}>Entrar</button>
              <button className={"tab" + (authMode === "register" ? " active" : "")} onClick={() => setAuthMode("register")}>Crear cuenta</button>
            </div>

            <div className="social-auth-col">
              <div id="google-signin-btn" className="google-signin-slot" />
            </div>

            <div className="auth-divider"><span>o con tu email</span></div>

            <form onSubmit={handleAuth}>
              {authMode === "register" && (
                <>
                  <label>Usuario</label>
                  <div className="input-icon">
                    <User size={14} />
                    <input value={authForm.username} onChange={(e) => setAuthForm({ ...authForm, username: e.target.value })} placeholder="tu_usuario" required />
                  </div>
                  <label>Ciudad</label>
                  <div className="input-icon">
                    <MapPin size={14} />
                    <input value={authForm.city} onChange={(e) => setAuthForm({ ...authForm, city: e.target.value })} placeholder="Ej. Madrid" required />
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

      {showProfile && (() => {
        const profileUsername = viewingProfile || username;
        const isOwnProfile = !viewingProfile;
        const profileItems = isOwnProfile ? allItems.filter((i) => i.seller === username) : (otherProfileData?.items || []);
        const profileSold = isOwnProfile ? soldItems : (otherProfileData?.soldItems || []);
        const profileRating = profileReviews?.average ? profileReviews.average.toFixed(1) : null;
        return (
        <div className="overlay detail-overlay" onClick={closeProfileView}>
          <div className="modal profile-modal detail-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn dark-close" onClick={closeProfileView}><X size={14} /></button>

            <div className="profile-banner" style={{ background: myCoverUrl && isOwnProfile ? undefined : `linear-gradient(135deg, ${PALETTE[profileUsername.length % PALETTE.length]}, #1A1A1E)`, backgroundImage: myCoverUrl && isOwnProfile ? `url(${myCoverUrl})` : undefined, backgroundSize: "cover", backgroundPosition: "center" }}>
              <div className="banner-texture" />
              {isOwnProfile && (
                <>
                  <input type="file" accept="image/*" id="cover-upload-input" style={{ display: "none" }} onChange={(e) => { if (e.target.files[0]) startCropping(e.target.files[0], "cover"); e.target.value = ""; }} />
                  <button className="cover-btn" onClick={() => document.getElementById("cover-upload-input").click()}><ImagePlus size={13} /> Cambiar portada</button>
                </>
              )}
              <button className="share-profile-btn"><Share2 size={14} /></button>
            </div>

            {otherProfileLoading ? (
              <div className="profile-content"><p className="empty-tab">Cargando perfil...</p></div>
            ) : (
            <div className="profile-content">
              <div
                className="profile-avatar-lg"
                style={
                  isOwnProfile && myAvatarUrl
                    ? { backgroundImage: `url(${myAvatarUrl})`, backgroundSize: "cover", backgroundPosition: "center", cursor: "pointer" }
                    : { background: PALETTE[profileUsername.length % PALETTE.length], cursor: isOwnProfile ? "pointer" : "default" }
                }
                onClick={() => isOwnProfile && document.getElementById("avatar-upload-input").click()}
                role={isOwnProfile ? "button" : undefined}
                title={isOwnProfile ? "Cambiar foto de perfil" : undefined}
              >
                {!(isOwnProfile && myAvatarUrl) && profileUsername[0]?.toUpperCase()}
              </div>
              {isOwnProfile && (
                <input type="file" accept="image/*" id="avatar-upload-input" style={{ display: "none" }} onChange={(e) => { if (e.target.files[0]) startCropping(e.target.files[0], "avatar"); e.target.value = ""; }} />
              )}
              <p className="profile-name">
                @{profileUsername}
                <span className="milestone-badges">
                  <span className="mstone" title="10 ventas"><Trophy size={11} /></span>
                </span>
              </p>
              <p className="profile-sub">
                {profileRating ? <><Star size={12} fill="#FFC24D" color="#FFC24D" /> {profileRating} ({profileReviews.total})</> : "Sin valoraciones todavía"} · miembro desde 2026
              </p>

              <div className="profile-quick-actions">
                {isOwnProfile ? (
                  <button className="edit-profile-btn" onClick={openEditProfile}>Editar perfil</button>
                ) : (
                  <button className={"follow-btn" + (following.has(profileUsername) ? " on" : "")} onClick={() => toggleFollow(profileUsername)}>
                    {following.has(profileUsername) ? <UserCheck size={13} /> : <UserPlus size={13} />}
                    {following.has(profileUsername) ? "Siguiendo" : "Seguir"}
                  </button>
                )}
                <button className="details-toggle" onClick={() => setShowProfileDetails(!showProfileDetails)}>
                  {showProfileDetails ? "Ocultar detalles" : "Ver más detalles"}
                </button>
              </div>

              {!isOwnProfile && (
                <button className="report-flag-btn" style={{ marginBottom: 10 }} onClick={() => setShowReportForm({ targetType: "user", reportedUsername: profileUsername })}>
                  <FileWarning size={12} /> Denunciar a @{profileUsername}
                </button>
              )}

              {showProfileDetails && (
                <div className="profile-details">
                  <div className="verify-row">
                    <span className="verify-chip done"><CheckCircle size={11} /> Email</span>
                    <span className="verify-chip done"><CheckCircle size={11} /> Teléfono</span>
                    <span className="verify-chip"><CheckCircle size={11} /> DNI</span>
                  </div>

                  {(isOwnProfile ? myLocation?.city : otherProfileData?.city) && (
                    <p className="profile-city-line"><MapPin size={12} /> {isOwnProfile ? myLocation?.city : otherProfileData?.city}</p>
                  )}

                  {profileReviews && profileReviews.reviews.length > 0 && (
                    <>
                      <p className="profile-section-title">Reseñas ({profileReviews.total})</p>
                      <div className="reviews-list">
                        {profileReviews.reviews.map((r) => (
                          <div key={r.id} className="review-row">
                            <div className="review-row-top">
                              <span className="review-author">@{r.authorUsername}</span>
                              <span className="review-stars">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} size={11} fill={i < r.rating ? "#FFC24D" : "none"} color="#FFC24D" />
                                ))}
                              </span>
                            </div>
                            {r.comment && <p className="review-comment">{r.comment}</p>}
                            <span className="review-date">{new Date(r.createdAt).toLocaleDateString("es-ES")}</span>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {profileReviews && profileReviews.reviews.length === 0 && (
                    <p className="empty-tab">Aún no tiene ninguna reseña.</p>
                  )}
                </div>
              )}

              <div className="stats-row">
                <div className="stat-box">
                  <Tag size={13} color="#9A9AA3" />
                  <strong>{profileItems.length}</strong>
                  <span>En venta</span>
                </div>
                <div className="stat-box">
                  <CheckCircle size={13} color="#9A9AA3" />
                  <strong>{profileSold.length}</strong>
                  <span>Vendidos</span>
                </div>
                {isOwnProfile && (
                  <div className="stat-box">
                    <Heart size={13} color="#9A9AA3" />
                    <strong>{saved.size}</strong>
                    <span>Favoritos</span>
                  </div>
                )}
              </div>

              <div className="tabs profile-tabs">
                <button className={"tab" + (profileTab === "venta" ? " active" : "")} onClick={() => setProfileTab("venta")}>En venta</button>
                <button className={"tab" + (profileTab === "vendidos" ? " active" : "")} onClick={() => setProfileTab("vendidos")}>Vendidos</button>
                {isOwnProfile && (
                  <button className={"tab" + (profileTab === "favoritos" ? " active" : "")} onClick={() => setProfileTab("favoritos")}>Favoritos</button>
                )}
              </div>

              {profileTab === "venta" && (
                profileItems.length === 0
                  ? <p className="empty-tab">{isOwnProfile ? "Aún no tienes prendas publicadas." : "Este vendedor no tiene prendas en venta ahora mismo."}</p>
                  : <div className="mini-grid">
                      {profileItems.map((i, idx) => (
                        <div key={i.id} className="mini-card own-card" onClick={() => { setShowProfile(false); viewItem(i); }}>
                          <div className="mini-swatch" style={miniSwatchStyle(i, idx)}>
                            {i.featured && <span className="mini-featured-badge">Destacado</span>}
                          </div>
                          <p className="mini-title">{i.title}</p>
                          <p className="mini-price">{i.price}€</p>
                          {isOwnProfile && (
                            <div className="own-actions">
                              {!i.featured && (
                                <button title={`Destacar por ${platformSettings.boostPrice}€`} onClick={(e) => { e.stopPropagation(); handleBoost(i.id); }}><TrendingUp size={12} /></button>
                              )}
                              <button onClick={(e) => { e.stopPropagation(); startEdit(i); }}><Pencil size={12} /></button>
                              <button onClick={(e) => { e.stopPropagation(); deleteOwnItem(i.id); }}><Trash2 size={12} /></button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
              )}

              {profileTab === "vendidos" && (
                profileSold.length === 0
                  ? <p className="empty-tab">Aún no hay ventas completadas.</p>
                  : <div className="mini-grid">
                      {profileSold.map((s, idx) => (
                        <div key={s.id} className="mini-card sold">
                          <div className="mini-swatch" style={miniSwatchStyle(s, idx)} />
                          <p className="mini-title">{s.title}</p>
                          <p className="mini-price">{s.price}€</p>
                        </div>
                      ))}
                    </div>
              )}

              {profileTab === "favoritos" && isOwnProfile && (
                saved.size === 0
                  ? <p className="empty-tab">Aún no has guardado ninguna prenda.</p>
                  : <div className="mini-grid">
                      {allItems.filter((i) => saved.has(i.id)).map((i, idx) => (
                        <div key={i.id} className="mini-card">
                          <div className="mini-swatch" style={miniSwatchStyle(i, idx)} />
                          <p className="mini-title">{i.title}</p>
                          <p className="mini-price">{i.price}€</p>
                        </div>
                      ))}
                    </div>
              )}
            </div>
            )}
          </div>
        </div>
        );
      })()}

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
                    if (found) {
                      if (n.type === "message" || n.type === "offer") {
                        openChat(found);
                      } else {
                        setShowLegal(null);
                        setShowPost(false);
                        setOpenItem(found);
                      }
                    }
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

            <label>Mi ubicación</label>
            <div className="location-box">
              <div>
                <p className="location-current">
                  <MapPin size={13} />
                  {myLocation ? (myLocation.city || "Ubicación guardada") : "Sin ubicación guardada"}
                </p>
                <p className="location-hint">Se usa para mostrarte prendas cerca de ti y quedar en persona sin envío.</p>
              </div>
              <button className="btn ghost" onClick={detectMyLocation} disabled={locatingMe}>
                {locatingMe ? "Detectando..." : myLocation ? "Actualizar" : "Detectar"}
              </button>
            </div>

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
            <button className="logout-btn" onClick={() => { apiLogout(); setLoggedIn(false); setUsername(""); setUserRole("user"); setShowSettings(false); toast("Sesión cerrada"); }}>Cerrar sesión</button>

            <div className="danger-zone">
              <p className="danger-zone-title">Zona de peligro</p>
              {!showDeleteAccount ? (
                <button className="danger-zone-btn" onClick={() => setShowDeleteAccount(true)}>Eliminar mi cuenta</button>
              ) : (
                <div className="delete-confirm-box">
                  <p className="delete-confirm-text">
                    Esto es permanente. Se borrarán tus favoritos, notificaciones y artículos aún no vendidos.
                    Para confirmar, escribe tu nombre de usuario (<strong>{username}</strong>) abajo:
                  </p>
                  <input
                    className="delete-confirm-input"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder={username}
                  />
                  <div className="delete-confirm-actions">
                    <button className="btn ghost" onClick={() => { setShowDeleteAccount(false); setDeleteConfirmText(""); }}>Cancelar</button>
                    <button className="danger-zone-btn" disabled={deletingAccount} onClick={handleDeleteAccount}>
                      {deletingAccount ? "Eliminando..." : "Eliminar cuenta definitivamente"}
                    </button>
                  </div>
                </div>
              )}
            </div>
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
              <div className="checkout-row"><span>Envío</span><span>{platformSettings.shippingFee.toFixed(2)}€</span></div>
              <div className="checkout-row total"><span>Total a pagar</span><span>{(Number(openItem.price) + platformSettings.shippingFee).toFixed(2)}€</span></div>
            </div>
            <p className="checkout-note">El envío se genera automáticamente al confirmar el pago. Pago seguro procesado por Stripe.</p>

            {checkoutError && <p style={{ color: "#FF4D6D", fontSize: 12, margin: "10px 0 0" }}>{checkoutError}</p>}

            <button className="submit-btn" onClick={confirmCheckout}>Pagar {(Number(openItem.price) + platformSettings.shippingFee).toFixed(2)}€ con Stripe</button>
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
            <p className="auth-subtitle" style={{ marginBottom: 18 }}>Gana puntos vendiendo y recibiendo buenas valoraciones</p>

            <p className="profile-section-title">Ranking esta semana</p>
            <div className="leaderboard">
              {LEADERBOARD.map((u) => {
                const benefit = leagueBenefit(u.rank);
                return (
                  <div
                    key={u.username}
                    className={"lb-row" + (u.rank === 1 ? " first" : "")}
                    style={{ cursor: "pointer" }}
                    onClick={() => { setShowLeague(false); openProfile(u.username); }}
                  >
                    <span className="lb-rank">#{u.rank}</span>
                    <div className="mini-avatar" style={{ background: PALETTE[u.rank % PALETTE.length] }}>{u.username[0].toUpperCase()}</div>
                    <div className="lb-info">
                      <p className="lb-name">@{u.username}</p>
                      <p className="lb-city"><MapPin size={10} /> {u.city}</p>
                    </div>
                    <div className="lb-right">
                      <span className="lb-points">{u.points} pts</span>
                      <span className={"lb-benefit " + benefit.className}>{benefit.label}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {showAdminPanel && (
        <div className="overlay" onClick={() => setShowAdminPanel(false)}>
          <div className="modal admin-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setShowAdminPanel(false)}><X size={14} /></button>

            {adminSection === null ? (
              <>
                <div className="league-header">
                  <ShieldCheck size={20} color="#8C7CFF" />
                  <p className="auth-title" style={{ margin: 0 }}>Panel de administración</p>
                </div>

                <div className="admin-summary-row">
                  {isAdmin && adminStats && (
                    <div className="admin-summary-box"><strong>{adminStats.totalCommission.toFixed(2)}€</strong><span>Ganado</span></div>
                  )}
                  <div className="admin-summary-box"><strong>{adminDisputes.length}</strong><span>Disputas</span></div>
                  <div className="admin-summary-box"><strong>{adminReports.filter((r) => r.status === "pending").length}</strong><span>Denuncias</span></div>
                  <div className="admin-summary-box"><strong>{adminSupport.filter((m) => m.status === "open").length}</strong><span>Soporte</span></div>
                </div>

                <div className="admin-menu-list">
                  {isAdmin && (
                    <button className="admin-menu-item" onClick={() => loadAdminTab("users")}>
                      <span className="admin-menu-icon"><User size={17} /></span>
                      <span className="admin-menu-label">Usuarios</span>
                      <span className="admin-menu-arrow">›</span>
                    </button>
                  )}
                  {isAdmin && (
                    <button className="admin-menu-item" onClick={() => loadAdminTab("stats")}>
                      <span className="admin-menu-icon"><HandCoins size={17} /></span>
                      <span className="admin-menu-label">Ganancias</span>
                      <span className="admin-menu-arrow">›</span>
                    </button>
                  )}
                  <button className="admin-menu-item" onClick={() => loadAdminTab("disputes")}>
                    <span className="admin-menu-icon"><Package size={17} /></span>
                    <span className="admin-menu-label">Disputas</span>
                    {adminDisputes.length > 0 && <span className="admin-menu-badge">{adminDisputes.length}</span>}
                    <span className="admin-menu-arrow">›</span>
                  </button>
                  <button className="admin-menu-item" onClick={() => loadAdminTab("reports")}>
                    <span className="admin-menu-icon"><FileWarning size={17} /></span>
                    <span className="admin-menu-label">Denuncias</span>
                    {adminReports.filter((r) => r.status === "pending").length > 0 && <span className="admin-menu-badge">{adminReports.filter((r) => r.status === "pending").length}</span>}
                    <span className="admin-menu-arrow">›</span>
                  </button>
                  <button className="admin-menu-item" onClick={() => loadAdminTab("support")}>
                    <span className="admin-menu-icon"><MessageCircle size={17} /></span>
                    <span className="admin-menu-label">Soporte</span>
                    {adminSupport.filter((m) => m.status === "open").length > 0 && <span className="admin-menu-badge">{adminSupport.filter((m) => m.status === "open").length}</span>}
                    <span className="admin-menu-arrow">›</span>
                  </button>
                  {isAdmin && (
                    <button className="admin-menu-item" onClick={() => loadAdminTab("settings")}>
                      <span className="admin-menu-icon"><Settings size={17} /></span>
                      <span className="admin-menu-label">Configuración</span>
                      <span className="admin-menu-arrow">›</span>
                    </button>
                  )}
                  {isAdmin && (
                    <button className="admin-menu-item" onClick={() => loadAdminTab("logs")}>
                      <span className="admin-menu-icon"><FileCheck size={17} /></span>
                      <span className="admin-menu-label">Historial</span>
                      <span className="admin-menu-arrow">›</span>
                    </button>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="league-header">
                  <button className="admin-back-btn" onClick={() => setAdminSection(null)}><ArrowLeft size={16} /></button>
                  <p className="auth-title" style={{ margin: 0 }}>
                    {{ users: "Usuarios", stats: "Ganancias", disputes: "Disputas", reports: "Denuncias", support: "Soporte", settings: "Configuración", logs: "Historial" }[adminSection]}
                  </p>
                </div>

                {adminLoading && <p className="empty-tab">Cargando...</p>}

                {!adminLoading && adminSection === "users" && (
                  <>
                    <form className="admin-search-row" onSubmit={handleUserSearch}>
                      <div className="search-box">
                        <Search size={14} color="#9A9AA3" />
                        <input placeholder="Buscar por usuario o email..." value={adminUserSearch} onChange={(e) => setAdminUserSearch(e.target.value)} />
                      </div>
                      <button type="submit" className="btn ghost admin-search-btn">Buscar</button>
                    </form>

                    <div className="admin-filter-row">
                      <select className="admin-filter-select" value={adminUserFilters.verified} onChange={(e) => handleUserFilterChange("verified", e.target.value)}>
                        <option value="">Email: todos</option>
                        <option value="true">Verificado</option>
                        <option value="false">Sin verificar</option>
                      </select>
                      <select className="admin-filter-select" value={adminUserFilters.stripeConnected} onChange={(e) => handleUserFilterChange("stripeConnected", e.target.value)}>
                        <option value="">Stripe: todos</option>
                        <option value="true">Conectado</option>
                        <option value="false">Sin conectar</option>
                      </select>
                      <button className="btn ghost admin-export-btn" onClick={handleExportUsers}>Exportar CSV</button>
                    </div>

                    {adminUsers.length === 0
                      ? <p className="empty-tab">No hay usuarios que coincidan.</p>
                      : <div className="admin-user-list">
                          {adminUsers.map((u) => (
                            <div key={u.id} className={"admin-user-row" + (u.banned ? " banned" : "")}>
                              <div className="mini-avatar" style={{ background: PALETTE[u.username.length % PALETTE.length] }}>{u.username[0].toUpperCase()}</div>
                              <div className="admin-user-info">
                                <p className="admin-user-name">
                                  @{u.username}
                                  {u.role === "admin" && <span className="admin-role-badge">Admin</span>}
                                  {u.role === "moderator" && <span className="admin-role-badge" style={{ background: "linear-gradient(135deg, #4DE1C1, #4DA8FF)" }}>Moderador</span>}
                                  {u.banned && <span className="admin-role-badge banned-badge">Suspendido</span>}
                                </p>
                                <p className="admin-user-email">{u.email}</p>
                                <p className="admin-user-meta">
                                  {u._count.items} publicadas · {u._count.sales} vendidas · {u._count.purchases} compradas
                                  {" · "}{u.emailVerified ? "Email verificado" : "Email sin verificar"}
                                  {u.stripeOnboarded ? " · Stripe conectado" : ""}
                                </p>
                                {u.banned && u.bannedReason && <p className="admin-dispute-reason">Motivo: {u.bannedReason}</p>}
                                {u.role !== "admin" && (
                                  <select className="admin-role-select" value={u.role} onChange={(e) => handleChangeUserRole(u, e.target.value)}>
                                    <option value="user">Usuario</option>
                                    <option value="moderator">Moderador</option>
                                    <option value="admin">Admin</option>
                                  </select>
                                )}
                              </div>
                              <div className="admin-user-actions">
                                <span className="admin-user-date">{new Date(u.createdAt).toLocaleDateString("es-ES")}</span>
                                {u.role !== "admin" && (
                                  u.banned
                                    ? <button className="admin-unban-btn" onClick={() => handleUnbanUser(u)}>Reactivar</button>
                                    : <button className="admin-ban-btn" onClick={() => setBanningUser(u)}>Suspender</button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                    }

                    {adminUserPages > 1 && (
                      <div className="admin-pagination">
                        <button className="btn ghost" disabled={adminUserPage <= 1} onClick={() => loadAdminTab("users", adminUserPage - 1)}>‹ Anterior</button>
                        <span className="admin-page-label">Página {adminUserPage} de {adminUserPages}</span>
                        <button className="btn ghost" disabled={adminUserPage >= adminUserPages} onClick={() => loadAdminTab("users", adminUserPage + 1)}>Siguiente ›</button>
                      </div>
                    )}
                  </>
                )}

                {!adminLoading && adminSection === "stats" && adminStats && (
                  <>
                    <div className="admin-stats-grid">
                      <div className="admin-stat-box"><strong>{adminStats.userCount}</strong><span>Usuarios registrados</span></div>
                      <div className="admin-stat-box"><strong>{adminStats.itemCount}</strong><span>Publicaciones totales</span></div>
                      <div className="admin-stat-box"><strong>{adminStats.availableItemCount}</strong><span>Disponibles ahora</span></div>
                      <div className="admin-stat-box"><strong>{adminStats.soldCount}</strong><span>Ventas pagadas</span></div>
                      <div className="admin-stat-box highlight"><strong>{adminStats.totalVolume.toFixed(2)}€</strong><span>Volumen total vendido</span></div>
                      <div className="admin-stat-box highlight"><strong>{adminStats.totalCommission.toFixed(2)}€</strong><span>Comisión ({platformSettings.commissionPercent}%) ganada</span></div>
                      <div className="admin-stat-box"><strong>{adminStats.estimatedBoostRevenue.toFixed(2)}€</strong><span>Destacados (estimado)</span></div>
                      <div className="admin-stat-box total"><strong>{adminStats.estimatedTotalRevenue.toFixed(2)}€</strong><span>Ganancia total estimada</span></div>
                      {adminStats.disputedCount > 0 && (
                        <div className="admin-stat-box warning"><strong>{adminStats.disputedCount}</strong><span>Disputas sin resolver</span></div>
                      )}
                      {adminStats.pendingReports > 0 && (
                        <div className="admin-stat-box warning"><strong>{adminStats.pendingReports}</strong><span>Denuncias sin revisar</span></div>
                      )}
                    </div>

                    {adminTimeseries.length > 0 && (
                      <>
                        <p className="profile-section-title">Comisión ganada (últimos 30 días)</p>
                        <div className="admin-chart">
                          {adminTimeseries.map((d) => {
                            const max = Math.max(...adminTimeseries.map((x) => x.commission), 1);
                            const h = Math.max(2, (d.commission / max) * 60);
                            return (
                              <div key={d.date} className="admin-chart-bar-wrap" title={`${d.date}: ${d.commission.toFixed(2)}€`}>
                                <div className="admin-chart-bar" style={{ height: `${h}px` }} />
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                    {adminTop && adminTop.topSellers.length > 0 && (
                      <>
                        <p className="profile-section-title">Mejores vendedores</p>
                        <div className="admin-user-list">
                          {adminTop.topSellers.slice(0, 5).map((s, i) => (
                            <div key={s.username} className="admin-user-row">
                              <span className="lb-rank">#{i + 1}</span>
                              <div className="mini-avatar" style={{ background: PALETTE[s.username.length % PALETTE.length] }}>{s.username[0].toUpperCase()}</div>
                              <div className="admin-user-info">
                                <p className="admin-user-name">@{s.username}</p>
                                <p className="admin-user-meta">{s.sales} ventas</p>
                              </div>
                              <span className="admin-user-date">{s.volume.toFixed(2)}€</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {adminTop && adminTop.topCategories.length > 0 && (
                      <>
                        <p className="profile-section-title">Categorías más vendidas</p>
                        <div className="admin-category-list">
                          {adminTop.topCategories.map((c) => (
                            <div key={c.category} className="admin-category-row">
                              <span>{c.category}</span>
                              <span className="admin-category-count">{c.sales}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {adminTop && adminTop.topViewedItems?.length > 0 && (
                      <>
                        <p className="profile-section-title">Artículos más vistos</p>
                        <div className="admin-category-list">
                          {adminTop.topViewedItems.map((i) => (
                            <div key={i.id} className="admin-category-row">
                              <span>{i.title}</span>
                              <span className="admin-category-count">{i.views} vistas</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {adminTop && adminTop.topSavedItems?.length > 0 && (
                      <>
                        <p className="profile-section-title">Artículos más guardados</p>
                        <div className="admin-category-list">
                          {adminTop.topSavedItems.map((i) => (
                            <div key={i.id} className="admin-category-row">
                              <span>{i.title}</span>
                              <span className="admin-category-count">{i.saves} guardados</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    <button className="btn ghost admin-export-btn" style={{ width: "100%", marginTop: 14 }} onClick={handleExportTransactions}>Exportar ventas a CSV</button>
                  </>
                )}

                {!adminLoading && adminSection === "settings" && adminSettingsForm && (
                  <div className="admin-settings-form">
                    <label>Comisión de la plataforma (%)</label>
                    <input
                      type="number" step="0.1" className="input-plain"
                      value={adminSettingsForm.commissionPercent}
                      onChange={(e) => setAdminSettingsForm((prev) => ({ ...prev, commissionPercent: e.target.value }))}
                    />
                    <label>Gastos de envío fijos (€)</label>
                    <input
                      type="number" step="0.1" className="input-plain"
                      value={adminSettingsForm.shippingFee}
                      onChange={(e) => setAdminSettingsForm((prev) => ({ ...prev, shippingFee: e.target.value }))}
                    />
                    <label>Precio de destacar una publicación (€)</label>
                    <input
                      type="number" step="0.1" className="input-plain"
                      value={adminSettingsForm.boostPrice}
                      onChange={(e) => setAdminSettingsForm((prev) => ({ ...prev, boostPrice: e.target.value }))}
                    />
                    <label>Duración del destacado (horas)</label>
                    <input
                      type="number" className="input-plain"
                      value={adminSettingsForm.boostDurationHours}
                      onChange={(e) => setAdminSettingsForm((prev) => ({ ...prev, boostDurationHours: e.target.value }))}
                    />
                    <label>Categorías (una por línea)</label>
                    <textarea
                      className="report-textarea"
                      rows={6}
                      value={adminSettingsForm.categories.join("\n")}
                      onChange={(e) => setAdminSettingsForm((prev) => ({ ...prev, categories: e.target.value.split("\n") }))}
                    />
                    <label>Instagram (URL completa, déjalo vacío para no mostrarlo)</label>
                    <input
                      type="text" className="input-plain" placeholder="https://instagram.com/tu_cuenta"
                      value={adminSettingsForm.instagramUrl || ""}
                      onChange={(e) => setAdminSettingsForm((prev) => ({ ...prev, instagramUrl: e.target.value }))}
                    />
                    <label>TikTok (URL completa)</label>
                    <input
                      type="text" className="input-plain" placeholder="https://tiktok.com/@tu_cuenta"
                      value={adminSettingsForm.tiktokUrl || ""}
                      onChange={(e) => setAdminSettingsForm((prev) => ({ ...prev, tiktokUrl: e.target.value }))}
                    />
                    <label>Facebook (URL completa)</label>
                    <input
                      type="text" className="input-plain" placeholder="https://facebook.com/tu_pagina"
                      value={adminSettingsForm.facebookUrl || ""}
                      onChange={(e) => setAdminSettingsForm((prev) => ({ ...prev, facebookUrl: e.target.value }))}
                    />
                    <label>X / Twitter (URL completa)</label>
                    <input
                      type="text" className="input-plain" placeholder="https://x.com/tu_cuenta"
                      value={adminSettingsForm.twitterUrl || ""}
                      onChange={(e) => setAdminSettingsForm((prev) => ({ ...prev, twitterUrl: e.target.value }))}
                    />
                    <label>Novedades (lo que se ve en "Novedades" del pie de página)</label>
                    <textarea
                      className="report-textarea"
                      rows={8}
                      placeholder={"Escribe aquí lo último que hayas añadido a la web, por ejemplo:\n\nAgosto 2026\n- Búsqueda por foto\n- Nuevas categorías"}
                      value={adminSettingsForm.updatesText || ""}
                      onChange={(e) => setAdminSettingsForm((prev) => ({ ...prev, updatesText: e.target.value }))}
                    />
                    <button className="btn primary admin-refund-btn" onClick={saveAdminSettings}>Guardar configuración</button>
                  </div>
                )}

                {!adminLoading && adminSection === "disputes" && (
                  adminDisputes.length === 0
                    ? <p className="empty-tab">No hay disputas pendientes ahora mismo.</p>
                    : <div className="admin-user-list">
                        {adminDisputes.map((d) => (
                          <div key={d.id} className="admin-dispute-row">
                            <p className="admin-user-name">{d.item.title} — {Number(d.item.price).toFixed(2)}€</p>
                            <p className="admin-user-meta">Comprador: @{d.buyer.username} · Vendedor: @{d.seller.username}</p>
                            {d.disputeReason && <p className="admin-dispute-reason">"{d.disputeReason}"</p>}
                            <button className="btn primary admin-refund-btn" onClick={() => handleAdminRefund(d.id)}>Procesar reembolso</button>
                          </div>
                        ))}
                      </div>
                )}

                {!adminLoading && adminSection === "reports" && (
                  adminReports.length === 0
                    ? <p className="empty-tab">No hay denuncias registradas.</p>
                    : <div className="admin-user-list">
                        {adminReports.map((r) => (
                          <div key={r.id} className={"admin-dispute-row" + (r.status === "reviewed" ? " reviewed" : "")}>
                            <p className="admin-user-name">
                              {r.targetType === "item" ? `Artículo: ${r.item?.title || "(eliminado)"}` : `Usuario: @${r.reportedUsername}`}
                              {r.status === "reviewed" && <span className="admin-role-badge">Revisada</span>}
                            </p>
                            <p className="admin-user-meta">Denunciado por @{r.reporter.username} · {new Date(r.createdAt).toLocaleDateString("es-ES")}</p>
                            <p className="admin-dispute-reason">"{r.reason}"</p>
                            {r.status === "pending" && (
                              <button className="btn primary admin-refund-btn" onClick={() => handleResolveReport(r.id)}>Marcar como revisada</button>
                            )}
                          </div>
                        ))}
                      </div>
                )}

                {!adminLoading && adminSection === "support" && (
                  adminSupport.length === 0
                    ? <p className="empty-tab">No hay mensajes de soporte.</p>
                    : <div className="admin-user-list">
                        {adminSupport.map((m) => (
                          <div key={m.id} className={"admin-dispute-row" + (m.status === "resolved" ? " reviewed" : "")}>
                            <p className="admin-user-name">
                              {m.subject}
                              {m.status === "resolved" && <span className="admin-role-badge">Resuelto</span>}
                            </p>
                            <p className="admin-user-meta">De @{m.user.username} ({m.user.email}) · {new Date(m.createdAt).toLocaleDateString("es-ES")}</p>
                            <p className="admin-dispute-reason">{m.message}</p>
                            {m.adminReply && <p className="admin-dispute-reason" style={{ color: "#4DE1C1" }}>Tu respuesta: {m.adminReply}</p>}
                            {m.status === "open" && (
                              <>
                                <textarea
                                  className="report-textarea"
                                  placeholder="Escribe tu respuesta..."
                                  value={supportReplyDrafts[m.id] || ""}
                                  onChange={(e) => setSupportReplyDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                                  rows={2}
                                />
                                <button className="btn primary admin-refund-btn" onClick={() => handleReplySupport(m.id)}>Enviar respuesta</button>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                )}

                {!adminLoading && adminSection === "logs" && (
                  adminLogs.length === 0
                    ? <p className="empty-tab">Aún no hay ninguna acción registrada.</p>
                    : <div className="admin-user-list">
                        {adminLogs.map((l) => (
                          <div key={l.id} className="admin-log-row">
                            <p className="admin-user-meta">{new Date(l.createdAt).toLocaleString("es-ES")} · @{l.adminUsername}</p>
                            <p className="admin-user-name" style={{ fontSize: 12.5 }}>{l.details}</p>
                          </div>
                        ))}
                      </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {banningUser && (
        <div className="overlay" onClick={() => setBanningUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 340 }}>
            <button className="close-btn" onClick={() => setBanningUser(null)}><X size={14} /></button>
            <p className="auth-title">Suspender a @{banningUser.username}</p>
            <p className="auth-subtitle" style={{ marginBottom: 14 }}>No podrá iniciar sesión hasta que reactives su cuenta.</p>
            <textarea
              className="report-textarea"
              placeholder="Motivo (se le mostrará al usuario)..."
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows={3}
            />
            <button className="btn primary admin-refund-btn" onClick={confirmBanUser}>Confirmar suspensión</button>
          </div>
        </div>
      )}

      {editingAdminItem && (
        <div className="overlay" onClick={() => setEditingAdminItem(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <button className="close-btn" onClick={() => setEditingAdminItem(null)}><X size={14} /></button>
            <p className="auth-title">Editar publicación (admin)</p>
            <p className="auth-subtitle" style={{ marginBottom: 14 }}>Corrige el título o la descripción sin borrar la publicación.</p>
            <label>Título</label>
            <input
              className="input-plain"
              value={adminItemEditForm.title}
              onChange={(e) => setAdminItemEditForm((prev) => ({ ...prev, title: e.target.value }))}
            />
            <label>Descripción</label>
            <textarea
              className="report-textarea"
              rows={4}
              value={adminItemEditForm.description}
              onChange={(e) => setAdminItemEditForm((prev) => ({ ...prev, description: e.target.value }))}
            />
            <button className="btn primary admin-refund-btn" onClick={saveAdminItemEdit}>Guardar cambios</button>
          </div>
        </div>
      )}

      {cropperState && (
        <div className="overlay cropper-overlay" onClick={(e) => e.stopPropagation()}>
          <div className="cropper-box">
            <p className="auth-title" style={{ textAlign: "center", marginBottom: 12 }}>Ajusta la foto</p>
            <div className="cropper-canvas">
              <Cropper
                image={cropperState.imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={cropperState.aspect}
                cropShape={cropperState.target === "avatar" ? "round" : "rect"}
                onCropChange={setCrop}
                onZoomChange={setZoom}
                onCropComplete={onCropComplete}
              />
            </div>
            <input
              type="range" min={1} max={3} step={0.05} value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="cropper-zoom-slider"
            />
            <div className="cropper-actions">
              <button className="btn ghost" onClick={cancelCropping}>Cancelar</button>
              <button className="btn primary" onClick={confirmCrop}>Usar esta foto</button>
            </div>
          </div>
        </div>
      )}

      {showEditProfile && (
        <div className="overlay" onClick={() => setShowEditProfile(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
            <button className="close-btn" onClick={() => setShowEditProfile(false)}><X size={14} /></button>
            <p className="auth-title">Editar perfil</p>

            <div className="edit-avatar-row">
              <div
                className="profile-avatar-lg"
                style={
                  myAvatarUrl
                    ? { backgroundImage: `url(${myAvatarUrl})`, backgroundSize: "cover", backgroundPosition: "center", margin: 0 }
                    : { background: PALETTE[username.length % PALETTE.length], margin: 0 }
                }
              >
                {!myAvatarUrl && username[0]?.toUpperCase()}
              </div>
              <div>
                <input type="file" accept="image/*" id="avatar-upload-input-modal" style={{ display: "none" }} onChange={(e) => { if (e.target.files[0]) startCropping(e.target.files[0], "avatar"); e.target.value = ""; }} />
                <button type="button" className="btn ghost" onClick={() => document.getElementById("avatar-upload-input-modal").click()}>
                  <ImagePlus size={13} /> Cambiar foto
                </button>
              </div>
            </div>

            <label>Sobre ti</label>
            <textarea
              className="report-textarea"
              rows={3}
              placeholder="Cuéntale algo a quien vea tu perfil..."
              value={editProfileForm.bio}
              onChange={(e) => setEditProfileForm((prev) => ({ ...prev, bio: e.target.value }))}
            />
            <label>Ciudad</label>
            <input
              className="input-plain"
              placeholder="Ej. Madrid"
              value={editProfileForm.city}
              onChange={(e) => setEditProfileForm((prev) => ({ ...prev, city: e.target.value }))}
            />
            <button className="btn ghost" style={{ width: "100%", marginBottom: 10 }} onClick={detectMyLocation} disabled={locatingMe}>
              <MapPin size={13} /> {locatingMe ? "Detectando..." : "Detectar mi ubicación automáticamente"}
            </button>
            <button className="btn primary admin-refund-btn" onClick={saveEditProfile}>Guardar cambios</button>
          </div>
        </div>
      )}

      {showReportForm && (
        <div className="overlay" onClick={() => setShowReportForm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 340 }}>
            <button className="close-btn" onClick={() => setShowReportForm(null)}><X size={14} /></button>
            <div className="report-modal-header">
              <div className="report-modal-icon"><FileWarning size={18} /></div>
              <div>
                <p className="auth-title" style={{ margin: 0 }}>Denunciar {showReportForm.targetType === "item" ? "artículo" : showReportForm.targetType === "question" ? "pregunta" : "usuario"}</p>
              </div>
            </div>
            <p className="auth-subtitle" style={{ marginBottom: 14 }}>Cuéntanos qué ha pasado, lo revisará el equipo de Ropelin.</p>
            <form onSubmit={submitReportForm}>
              <textarea
                className="report-textarea"
                placeholder="Describe el motivo de la denuncia..."
                value={reportReason}
                onChange={(e) => setReportReason(e.target.value)}
                rows={3}
                required
              />
              <button type="submit" className="report-submit-btn">Enviar denuncia</button>
            </form>
          </div>
        </div>
      )}


      {showChat && chatItem && (
        <div className="overlay" onClick={() => setShowChat(false)}>
          <div className="modal chat-modal" onClick={(e) => e.stopPropagation()}>
            <div className="chat-header">
              <button className="close-btn dark-close chat-close" onClick={() => setShowChat(false)}><X size={14} /></button>
              <div className="chat-avatar-ring">
                <div className="mini-avatar seller-avatar" style={{ background: PALETTE[chatItem.seller.length % PALETTE.length] }}>
                  {chatItem.seller[0]?.toUpperCase()}
                </div>
              </div>
              <div>
                <p className="chat-seller-name">@{chatItem.seller}</p>
                <p className="chat-item-ref">Activo recientemente</p>
              </div>
            </div>

            <div className="chat-item-strip" onClick={() => { setShowChat(false); viewItem(chatItem); }}>
              <div className="chat-item-thumb" style={{ backgroundImage: `url(${(chatItem.images && chatItem.images[0]) || chatItem.photo})` }} />
              <div className="chat-item-strip-info">
                <p className="chat-item-strip-title">{chatItem.title}</p>
                <p className="chat-item-strip-price">{chatItem.price}€</p>
              </div>
              <span className="chat-item-strip-link">Ver prenda ›</span>
            </div>

            <div className="chat-thread">
              {(chatThreads[chatItem.id] || []).length === 0 && (
                <p className="empty-tab">Aún no hay mensajes. Escribe el primero.</p>
              )}
              {(chatThreads[chatItem.id] || []).map((m, idx) => {
                const mine = m.sender.username === username;
                const prev = (chatThreads[chatItem.id] || [])[idx - 1];
                const grouped = prev && prev.sender.username === m.sender.username;
                return (
                  <div key={m.id} className={"chat-msg-row " + (mine ? "me" : "seller") + (grouped ? " grouped" : "")}>
                    <div className={"chat-bubble " + (mine ? "me" : "seller") + (m.offerAmount ? " offer-bubble" : "")}>
                      {m.offerAmount ? <><HandCoins size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Oferta: {Number(m.offerAmount).toFixed(2)}€</> : m.content}
                    </div>
                    {m.offerAmount && (
                      <div className="offer-actions">
                        {m.offerStatus === "pending" && !mine && (
                          <>
                            <button className="offer-btn accept" disabled={respondingOfferId === m.id} onClick={() => handleOfferAction(chatItem.id, m.id, "accept")}>Aceptar</button>
                            <button className="offer-btn reject" disabled={respondingOfferId === m.id} onClick={() => handleOfferAction(chatItem.id, m.id, "reject")}>Rechazar</button>
                            <div className="offer-counter-row">
                              <input
                                type="number" min="1" placeholder="Contraoferta €"
                                value={counterDrafts[m.id] || ""}
                                onChange={(e) => setCounterDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                              />
                              <button className="offer-btn counter" disabled={respondingOfferId === m.id} onClick={() => handleOfferAction(chatItem.id, m.id, "counter")}>Contraofertar</button>
                            </div>
                          </>
                        )}
                        {m.offerStatus === "pending" && mine && (
                          <span className="offer-status-tag pending">Pendiente de respuesta</span>
                        )}
                        {m.offerStatus === "accepted" && (
                          <span className="offer-status-tag accepted"><CheckCircle size={12} /> Aceptada</span>
                        )}
                        {m.offerStatus === "accepted" && chatItem.seller !== username && (
                          <button className="offer-btn accept" onClick={() => payAcceptedOffer(chatItem.id)}>Pagar {Number(m.offerAmount).toFixed(2)}€</button>
                        )}
                        {m.offerStatus === "rejected" && (
                          <span className="offer-status-tag rejected">Rechazada</span>
                        )}
                        {m.offerStatus === "countered" && (
                          <span className="offer-status-tag pending">Contraofertada</span>
                        )}
                      </div>
                    )}
                    <span className="chat-msg-time">{timeAgoFromDate(m.createdAt)}</span>
                  </div>
                );
              })}
            </div>

            <form className="chat-input-row" onSubmit={sendChatMessage}>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escribe un mensaje..."
              />
              <button type="submit" className="chat-send-btn" disabled={!chatInput.trim()}><Send size={15} /></button>
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

    </div>
  );
}
