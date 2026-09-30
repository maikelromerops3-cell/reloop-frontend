import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import Cropper from "react-easy-crop";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./styles/fonts.css";
import "./styles/legacy.css";
import "./styles/theme.css";
import "./styles/home.css";
import "./styles/explore.css";
import ItemCard from "./components/ItemCard";
import HomeSections from "./components/HomeSections";
import FilterPanel from "./components/FilterPanel";
import { Search, Plus, X, MessageCircle, Heart, Zap, User, Star, Mail, Lock, ImagePlus, Tag, Trash2, CheckCircle, Leaf, MapPin, HandCoins, UserPlus, UserCheck, Send, Trophy, Pencil, Bell, Settings, ShoppingBag, RefreshCw, LayoutGrid, Shirt, Footprints, Watch, TrendingDown, TrendingUp, Share2, PackageOpen, Truck, Package, ArrowLeft, ShieldCheck, FileWarning, SlidersHorizontal, FileCheck, FileDown, LogOut, LogIn, MoreHorizontal, Home, Instagram, Facebook, Twitter, Camera, Car, BookOpen, Sparkles, Baby, Wrench, Guitar, Crop, Shield, Eye, Sun, Moon, ChevronRight, ChevronDown, Clock, Download } from "lucide-react";
import {
  fetchItems, fetchItem, createItem, updateItem, deleteItem,
  login as apiLogin, register as apiRegister, logout as apiLogout, isLoggedIn, getUsername, getRole,
  fetchFavorites, addFavorite, removeFavorite, uploadImage,
  connectStripe, fetchStripeStatus, startCheckout, boostItem,
  fetchTransactions, createShipmentLabel, downloadShipmentLabel, confirmReceived, completeInPerson, submitReview, fetchReviews,
  searchServicePoints, setServicePoint, fetchShippingQuote,
  fetchProfile, updateMyLocation, updateShippingAddress, updateMarketingOptIn, updateNotifPreference, fetchMyPreferences, fetchMyStats, loginWithGoogle, searchByImage, exportMyData, deleteMyAccount, resendVerification, changePassword, changeEmail,
  fetchSavedSearches, saveSearch, deleteSavedSearch,
  fetchPushPublicKey, subscribeToPush, unsubscribeFromPush,
  fetchMyFollowing, followUser, unfollowUser, subscribeNewsletter, fetchLeague,
  fetchItemQuestions, askItemQuestion, answerItemQuestion, deleteItemQuestion, respondToOffer, markItemSold, notifySaleBuyer, fetchItemConversations,
  forgotPassword, resetPassword, verifyEmail,
  fetchChatMessages, sendChatMessage as sendChatMessage_,
  fetchAllThreads, fetchNotifications, markAllNotificationsRead, setVacationMode,
  disputeTransaction,
  fetchAdminUsers, fetchAdminStats, fetchAdminDisputes, refundTransaction, rejectDispute, respondToDispute, requestReturn, markReturned, confirmReturnReceived,
  submitIdentityVerification, fetchAdminVerifications, approveVerification, rejectVerification,
  blockUser, unblockUser, fetchBlockedUsers, fetchSellerBalance, refundTransactionPartial,
  banUser, unbanUser, adminDeleteItem, fetchAdminReports, resolveReport, fetchAdminLogs, fetchAdminTop, fetchAdminTimeseries, submitReport,
  fetchAdminBroadcasts, sendAdminBroadcast,
  submitSupportMessage, fetchMySupportMessages, fetchAdminSupport, replySupportMessage,
  fetchPublicSettings, fetchAdminSettings, updateAdminSettings, adminEditItem, exportUsersCsv, exportTransactionsCsv, changeUserRole, changeUsernameAdmin,
} from "./api";

const CATEGORY_ICONS = { "Todo": LayoutGrid, "Moda": Shirt, "Electrónica": Zap, "Hogar": PackageOpen, "Deporte": Footprints, "Juguetes y ocio": Watch, "Vehículos": Car, "Libros y música": BookOpen, "Belleza y cuidado personal": Sparkles, "Bebé e infantil": Baby, "Jardín y herramientas": Wrench, "Instrumentos musicales": Guitar, "Otros": Tag };
const CATEGORY_COLORS = { "Todo": "#C8C8CE", "Moda": "var(--accent)", "Electrónica": "var(--info)", "Hogar": "var(--amber)", "Deporte": "var(--ok)", "Juguetes y ocio": "var(--sub)", "Vehículos": "#6A9BFF", "Libros y música": "#E0A458", "Belleza y cuidado personal": "var(--accent)", "Bebé e infantil": "#7FD8A6", "Jardín y herramientas": "#A3C96B", "Instrumentos musicales": "#C97BFF", "Otros": "var(--accent)" };
const CATEGORIES = ["Todo", "Moda", "Electrónica", "Hogar", "Deporte", "Juguetes y ocio", "Vehículos", "Libros y música", "Belleza y cuidado personal", "Bebé e infantil", "Jardín y herramientas", "Instrumentos musicales", "Otros"];

// Subcategorías más concretas dentro de cada categoría principal, para el formulario de venta.
// "Otros" no tiene, porque es precisamente el cajón de sastre para lo que no encaja en ninguna.
const SUBCATEGORIES = {
  "Moda": ["Camisetas", "Pantalones", "Vestidos", "Chaquetas y abrigos", "Zapatos", "Bolsos", "Accesorios"],
  "Electrónica": ["Móviles", "Ordenadores", "Videojuegos y consolas", "Audio", "Cámaras", "Televisores", "Accesorios"],
  "Hogar": ["Muebles", "Decoración", "Cocina", "Textil de hogar", "Iluminación", "Electrodomésticos"],
  "Deporte": ["Fitness", "Ciclismo", "Running", "Deportes de equipo", "Deportes acuáticos", "Ropa deportiva"],
  "Juguetes y ocio": ["Juguetes", "Juegos de mesa", "Puzzles", "Manualidades", "Coleccionismo"],
  "Vehículos": ["Coches", "Motos", "Bicicletas", "Patinetes", "Accesorios de vehículo"],
  "Libros y música": ["Libros", "Vinilos", "CDs", "Cómics y manga"],
  "Belleza y cuidado personal": ["Maquillaje", "Perfumes", "Cuidado de la piel", "Cuidado del cabello"],
  "Bebé e infantil": ["Ropa de bebé", "Juguetes infantiles", "Carritos y sillas", "Mobiliario infantil"],
  "Jardín y herramientas": ["Herramientas", "Jardinería", "Bricolaje", "Muebles de exterior"],
  "Instrumentos musicales": ["Guitarras", "Teclados y pianos", "Percusión", "Instrumentos de viento"],
};
function buildFaqItems(s) {
  return [
    { q: "¿Cómo publico un artículo?", a: "Dale al botón \"Vender\", añade fotos, título, precio y descripción, y publícalo. Aparecerá al momento en el feed." },
    { q: "¿Cómo recibo el dinero de una venta?", a: "Conecta tu cuenta de Stripe desde Ajustes. En cuanto se confirme el pago del comprador, el dinero (menos la comisión) se transfiere a tu cuenta." },
    { q: "¿Cuánto cobra Ropelin por cada venta?", a: `Una comisión del ${s.commissionPercent}% sobre el precio del artículo. El comprador paga además el gasto de envío real, calculado con el transportista en el momento de pagar (varía según destino).` },
    { q: "¿Qué hago si el comprador no genera la etiqueta o no responde?", a: "Puedes contactar con el comprador desde el chat de la compra. Si no se resuelve, escríbenos desde \"Contactar\" y lo revisamos." },
    { q: "¿Puedo devolver un artículo si no era como esperaba?", a: "Contacta primero con el vendedor. Si no llegáis a un acuerdo, puedes abrir una disputa desde tus compras y nuestro equipo lo revisará." },
    { q: "¿Qué es \"Destacar\" un artículo?", a: `Por ${s.boostPrice.toFixed(2)}€ tu artículo aparece arriba del todo del feed durante ${s.boostDurationHours} horas, para que lo vea más gente.` },
  ];
}
const SIZES = ["XS", "S", "M", "L", "XL"];
const SHOE_SIZES = ["35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "45", "46"];
// Tonos tierra para avatares y portadas de perfil (antes eran los colores chillones de la marca antigua)
const PALETTE = ["#B93E16", "#2F4A3D", "#3B3934", "#8A6F4E", "#4A6A85", "#7A4B3A"];
function miniSwatchStyle(item, idx) {
  const photo = (item.images && item.images[0]) || item.photo;
  return photo
    ? { backgroundImage: `url(${photo})`, backgroundSize: "cover", backgroundPosition: "center" }
    : { background: PALETTE[idx % PALETTE.length] };
}

// Genera un degradado de marca "aleatorio" pero estable para cada usuario (mismo resultado siempre
// para el mismo username, así la portada no cambia de color al recargar la página).
function usernameGradient(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  const first = hash % PALETTE.length;
  const second = (first + 1 + (hash >> 4) % (PALETTE.length - 1)) % PALETTE.length;
  const angle = 100 + (hash % 90);
  return `linear-gradient(${angle}deg, ${PALETTE[first]}, ${PALETTE[second]} 55%, #1A1A1E)`;
}

const AUTH_PAGE_STYLES = `
  * { box-sizing: border-box; }
  html, body { margin: 0; background: #121214; }
  .app { background: #121214; font-family: 'Helvetica Neue', Arial, sans-serif; color: #F2F2F0; }
  .modal { background: #1A1A1E; border: 1px solid #29292f; border-radius: 22px; max-width: 380px; width: 100%; padding: 30px 26px; margin: 20px; }
  .auth-title { font-family: Georgia, serif; font-size: 20px; font-weight: 700; margin: 0 0 18px; text-align: center; }
  label { display: block; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; margin: 14px 0 5px; color: var(--faint); }
  .input-icon { display: flex; align-items: center; gap: 8px; border: 1px solid #333; border-radius: 12px; padding: 0 12px; background: #121214; }
  .input-icon svg { color: var(--sub); flex-shrink: 0; }
  .input-icon input { border: none; padding: 10px 0; background: transparent; color: #F2F2F0; font-family: inherit; font-size: 16px; width: 100%; outline: none; }
  .submit-btn { margin-top: 20px; width: 100%; background: var(--accent); color: #121214; border: none; border-radius: 14px; padding: 13px; font-weight: 700; font-size: 13px; cursor: pointer; font-family: inherit; }
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
    sellerStripeOnboarded: raw.seller?.stripeOnboarded ?? null,
    sellerVacationMode: raw.seller?.vacationMode ?? false,
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
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [category, setCategory] = useState("Para ti");
  const [priceFilter, setPriceFilter] = useState({ min: "", max: "" });
  const [sizeFilter, setSizeFilter] = useState("");
  const [distanceFilter, setDistanceFilter] = useState("");
  const [sortBy, setSortBy] = useState("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [savedSearches, setSavedSearches] = useState([]);
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
  const [checkoutPostalCode, setCheckoutPostalCode] = useState("");
  const [checkoutCity, setCheckoutCity] = useState("");
  const [checkoutRates, setCheckoutRates] = useState([]);
  const [checkoutRatesLoading, setCheckoutRatesLoading] = useState(false);
  const [checkoutSelectedRateId, setCheckoutSelectedRateId] = useState(null);
  const [showAllShippingRates, setShowAllShippingRates] = useState(false);
  const [checkoutServicePoint, setCheckoutServicePoint] = useState(null); // { id, name, address }
  const [showNotifs, setShowNotifs] = useState(false);
  const [notifsTab, setNotifsTab] = useState("notifs");
  const [messageThreads, setMessageThreads] = useState([]);
  const [loadingThreads, setLoadingThreads] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [myEmailVerified, setMyEmailVerified] = useState(true);
  const [myIdVerification, setMyIdVerification] = useState({ status: null, uploading: false });
  const [blockedUsernames, setBlockedUsernames] = useState(new Set());
  const [sellerBalance, setSellerBalance] = useState(null);
  const [partialRefundAmounts, setPartialRefundAmounts] = useState({});
  const [shippingStreetInput, setShippingStreetInput] = useState("");
  const [shippingPostalInput, setShippingPostalInput] = useState("");
  const [shippingPhoneInput, setShippingPhoneInput] = useState("");
  const [firstNameInput, setFirstNameInput] = useState("");
  const [lastNameInput, setLastNameInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [savingBasicInfo, setSavingBasicInfo] = useState(false);
  const [savingShippingAddress, setSavingShippingAddress] = useState(false);
  const [myProfileExtra, setMyProfileExtra] = useState({ badges: [], avgSaleDays: null, followersCount: 0, followingCount: 0, freeBoosts: 0 });
  const [resendingVerification, setResendingVerification] = useState(false);
  const [newEmailInput, setNewEmailInput] = useState("");
  const [emailChangePassword, setEmailChangePassword] = useState("");
  const [currentPasswordInput, setCurrentPasswordInput] = useState("");
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [savingAccountSettings, setSavingAccountSettings] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [confirmingMarkSold, setConfirmingMarkSold] = useState(null); // itemId | null
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [stripeStatus, setStripeStatus] = useState(null);
  const [showOrders, setShowOrders] = useState(false);
  const [orders, setOrders] = useState({ purchases: [], sales: [] });
  const [myStats, setMyStats] = useState(null);
  const [myStatsLoading, setMyStatsLoading] = useState(false);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [pedidosTab, setPedidosTab] = useState("ventas"); // "ventas" | "compras"
  const [pedidosSubTab, setPedidosSubTab] = useState("curso"); // "curso" | "completadas"
  const [reviewingTx, setReviewingTx] = useState(null); // transacción que se está valorando
  const [disputingTx, setDisputingTx] = useState(null);
  const [disputeReason, setDisputeReason] = useState("");
  const [disputeEvidence, setDisputeEvidence] = useState(null); // { url, uploading }
  const [respondingTx, setRespondingTx] = useState(null);
  const [sellerResponseText, setSellerResponseText] = useState("");

  async function handleDisputeEvidenceUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setDisputeEvidence({ url: null, uploading: true });
    try {
      const { url } = await uploadImage(file);
      setDisputeEvidence({ url, uploading: false });
    } catch (err) {
      toast.error(err.message);
      setDisputeEvidence(null);
    }
  }

  async function handleSubmitSellerResponse(e) {
    e.preventDefault();
    if (!sellerResponseText.trim()) return;
    try {
      await respondToDispute(respondingTx.id, sellerResponseText);
      toast.success("Tu respuesta se ha enviado, la revisaremos junto con la reclamación");
      setRespondingTx(null);
      setSellerResponseText("");
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSubmitDispute(e) {
    e.preventDefault();
    if (!disputeReason.trim()) return;
    try {
      await disputeTransaction(disputingTx.id, disputeReason, disputeEvidence?.url || null);
      toast.success("Reembolso solicitado, lo revisaremos en breve");
      setDisputingTx(null);
      setDisputeReason("");
      setDisputeEvidence(null);
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
  const [marketingOptIn, setMarketingOptIn] = useState(true);
  const [messageAlerts, setMessageAlerts] = useState(true);
  const [offerAlerts, setOfferAlerts] = useState(true);
  const [priceDropAlerts, setPriceDropAlerts] = useState(true);
  const [vacationMode, setVacationModeState] = useState(false);
  const [savingVacation, setSavingVacation] = useState(false);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [showMaintenanceLogin, setShowMaintenanceLogin] = useState(false);
  const [secretTapCount, setSecretTapCount] = useState(0);
  const [maintenanceLoginEmail, setMaintenanceLoginEmail] = useState("");
  const [maintenanceLoginPassword, setMaintenanceLoginPassword] = useState("");
  const [maintenanceLoginError, setMaintenanceLoginError] = useState(null);

  async function handleMaintenanceGoogleCredential(response) {
    try {
      await loginWithGoogle(response.credential);
      window.location.reload();
    } catch (err) {
      setMaintenanceLoginError(err.message?.includes("pattern") ? "No se pudo completar el inicio de sesión con Google." : err.message);
    }
  }
  const [newsletterError, setNewsletterError] = useState(null);
  const [cropperState, setCropperState] = useState(null); // { imageSrc, target, aspect, queue } | null
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leagueLoading, setLeagueLoading] = useState(false);

  function leagueBenefit(rank) {
    if (rank <= 3) return { label: "Envío gratis", className: "tier-gold" };
    if (rank <= 10) return { label: "-50% envío", className: "tier-silver" };
    return { label: "-25% envío", className: "tier-bronze" };
  }

  async function openLeague() {
    setShowLegal(null);
    setOpenItem(null);
    setShowPost(false);
    setShowHelpCenter(false);
    setShowProfile(false);
    setShowLeague(true);
    setLeagueLoading(true);
    try {
      setLeaderboard(await fetchLeague());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLeagueLoading(false);
    }
  }
  const [chatItem, setChatItem] = useState(null);
  const [chatThreads, setChatThreads] = useState({});
  const [chatInput, setChatInput] = useState("");
  const [offerAmount, setOfferAmount] = useState("");
  const [offerSent, setOfferSent] = useState(false);
  const [showPost, setShowPost] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileMenuView, setProfileMenuView] = useState(null); // null = menú principal, o "venta"/"vendidos"/"favoritos"/"perfil"/"envios"/"contrasena"/"pagos"
  const [showHelpCenter, setShowHelpCenter] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [openItem, setOpenItem] = useState(null);
  const [itemQuestions, setItemQuestions] = useState([]);
  const [pickingBuyerFor, setPickingBuyerFor] = useState(null); // { itemId } | null
  const [buyerCandidates, setBuyerCandidates] = useState([]);
  const [manualBuyerName, setManualBuyerName] = useState("");
  const [sellerReviews, setSellerReviews] = useState(null);
  const [newQuestionText, setNewQuestionText] = useState("");
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [sendingQuestion, setSendingQuestion] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [saved, setSaved] = useState(new Set());
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [theme, setTheme] = useState(() => localStorage.getItem("reloop_theme") || "light");
  const [referralCode] = useState(() => {
    const fromUrl = new URLSearchParams(window.location.search).get("ref");
    if (fromUrl) { localStorage.setItem("reloop_ref", fromUrl); return fromUrl; }
    return localStorage.getItem("reloop_ref") || "";
  });
  const [installPrompt, setInstallPrompt] = useState(null);
  useEffect(() => {
    function handleBeforeInstall(e) {
      e.preventDefault();
      setInstallPrompt(e);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);
  async function handleInstallApp() {
    if (!installPrompt) return;
    installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }
  const [showIosInstallBanner, setShowIosInstallBanner] = useState(() => {
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    const isStandalone = window.navigator.standalone || window.matchMedia("(display-mode: standalone)").matches;
    const dismissed = localStorage.getItem("reloop_ios_install_dismissed");
    return isIOS && !isStandalone && !dismissed;
  });
  function dismissIosInstallBanner() {
    localStorage.setItem("reloop_ios_install_dismissed", "1");
    setShowIosInstallBanner(false);
  }

  const [pushStatus, setPushStatus] = useState("unknown"); // "unknown" | "unsupported" | "off" | "on" | "loading"
  useEffect(() => {
    if (!loggedIn) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) { setPushStatus("unsupported"); return; }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setPushStatus(sub ? "on" : "off"))
      .catch(() => setPushStatus("unsupported"));
  }, [loggedIn]);

  function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
    const raw = window.atob(base64);
    return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
  }

  async function handleEnablePush() {
    setPushStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") { toast.error("No has dado permiso para las notificaciones"); setPushStatus("off"); return; }
      const publicKey = await fetchPushPublicKey();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
      await subscribeToPush(sub.toJSON());
      setPushStatus("on");
      toast.success("Notificaciones activadas");
    } catch (err) {
      toast.error(err.message || "No se pudieron activar las notificaciones");
      setPushStatus("off");
    }
  }

  async function handleDisablePush() {
    setPushStatus("loading");
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await unsubscribeFromPush(sub.endpoint);
        await sub.unsubscribe();
      }
      setPushStatus("off");
      toast("Notificaciones desactivadas");
    } catch (err) {
      toast.error(err.message || "No se pudieron desactivar las notificaciones");
      setPushStatus("on");
    }
  }

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
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  useEffect(() => {
    fetchPublicSettings().then(setPlatformSettings).catch(() => {}).finally(() => setSettingsLoaded(true));
  }, []);

  useEffect(() => {
    if (loggedIn) {
      fetchSavedSearches().then(setSavedSearches).catch(() => {});
    } else {
      setSavedSearches([]);
    }
  }, [loggedIn]);

  useEffect(() => {
    if ((showSettings || showPost || showProfile) && loggedIn) {
      fetchStripeStatus().then(setStripeStatus).catch(() => {});
    }
    if (showSettings && loggedIn) {
      fetchSellerBalance().then(setSellerBalance).catch(() => {});
    }
    if ((showSettings || showProfile) && loggedIn) {
      fetchProfile(username).then((data) => {
        setMyEmailVerified(data.emailVerified !== false);
        setMyIdVerification((prev) => ({ ...prev, status: data.idVerificationStatus || null }));
        setShippingStreetInput(data.shippingStreet || "");
        setShippingPostalInput(data.shippingPostalCode || "");
        setShippingPhoneInput(data.shippingPhone || "");
        setFirstNameInput(data.firstName || "");
        setLastNameInput(data.lastName || "");
        setCityInput(data.city || "");
      }).catch(() => {});
      fetchMyPreferences().then((prefs) => {
        setMarketingOptIn(prefs.marketingOptIn !== false);
        setMessageAlerts(prefs.messageAlerts !== false);
        setOfferAlerts(prefs.offerAlerts !== false);
        setPriceDropAlerts(prefs.priceDropAlerts !== false);
        setVacationModeState(!!prefs.vacationMode);
      }).catch(() => {});
    }
    if (showProfile) {
      fetchLeague().then(setLeaderboard).catch(() => {});
    }
  }, [showSettings, showPost, showProfile, loggedIn]);

  useEffect(() => {
    if (loggedIn) {
      fetchNotifications().then(setNotifications).catch(() => {});
    } else {
      setNotifications([]);
    }
  }, [loggedIn]);

  // Vuelve a comprobar si hay notificaciones nuevas cada 45 segundos, mientras hay sesión iniciada
  useEffect(() => {
    if (!loggedIn) return;
    const interval = setInterval(() => {
      fetchNotifications().then(setNotifications).catch(() => {});
    }, 45000);
    return () => clearInterval(interval);
  }, [loggedIn]);

  useEffect(() => {
    if (showNotifs && loggedIn) {
      fetchNotifications().then(setNotifications).catch(() => {});
      setLoadingThreads(true);
      fetchAllThreads().then(setMessageThreads).catch(() => {}).finally(() => setLoadingThreads(false));
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
      // Nos defendemos de una respuesta con forma inesperada (un fallo del servidor, una
      // respuesta vacía...) — antes esto rompía toda la app con una pantalla en blanco justo
      // al intentar comprar, porque el código daba por hecho que "sales"/"purchases" siempre
      // existían.
      setOrders({ sales: Array.isArray(data?.sales) ? data.sales : [], purchases: Array.isArray(data?.purchases) ? data.purchases : [] });
    } catch {
      toast.error("No se pudieron cargar tus pedidos");
    } finally {
      setOrdersLoading(false);
    }
  }, [loggedIn]);

  useEffect(() => {
    if (showOrders) loadOrders();
  }, [showOrders, loadOrders]);

  useEffect(() => {
    if (profileMenuView === "stats" && loggedIn) {
      setMyStatsLoading(true);
      fetchMyStats().then(setMyStats).catch((err) => toast.error(err.message)).finally(() => setMyStatsLoading(false));
    }
  }, [profileMenuView, loggedIn]);

  // Autocompletar de la búsqueda: espera un momento tras dejar de escribir (para no lanzar una
  // petición por cada letra), y sugiere títulos reales de artículos que ya existen.
  useEffect(() => {
    if (!query || query.trim().length < 2) {
      setSearchSuggestions([]);
      return;
    }
    const handle = setTimeout(() => {
      fetchItems({ query: query.trim() })
        .then((results) => setSearchSuggestions(results.slice(0, 6)))
        .catch(() => setSearchSuggestions([]));
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  useEffect(() => {
    if (loggedIn) loadOrders();
  }, [loggedIn, loadOrders]);

  // Ventas pagadas por el comprador a las que todavía no se les ha generado el envío
  const pendingShipmentsCount = (orders.sales || []).filter((tx) => tx.status === "paid" && !tx.shipment).length;


  async function handleShare(url, title) {
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // el usuario canceló el diálogo nativo, no hacemos nada
      }
    } else {
      navigator.clipboard.writeText(url);
      toast("Enlace copiado", { icon: "🔗" });
    }
  }

  const [generatingLabelFor, setGeneratingLabelFor] = useState(null);
  async function handleGenerateLabel(transactionId) {
    setGeneratingLabelFor(transactionId);
    try {
      await createShipmentLabel(transactionId);
      toast.success("Etiqueta de envío generada");
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setGeneratingLabelFor(null);
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

  async function handleUploadIdVerification(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setMyIdVerification((prev) => ({ ...prev, uploading: true }));
    try {
      const { url } = await uploadImage(file);
      await submitIdentityVerification(url);
      setMyIdVerification({ status: "pending", uploading: false });
      toast.success("Documento enviado, lo revisaremos en breve");
    } catch (err) {
      toast.error(err.message);
      setMyIdVerification((prev) => ({ ...prev, uploading: false }));
    }
  }

  async function handleCompleteInPerson(transactionId) {
    try {
      await completeInPerson(transactionId);
      toast.success("Entrega en persona confirmada");
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const [lockerPicker, setLockerPicker] = useState(null); // { transactionId, postalCode, city, points, loading, searched, center }
  const lockerMapRef = useRef(null);
  const lockerMapInstance = useRef(null);
  const lockerMarkers = useRef([]);
  const lockerMapResizeObserver = useRef(null);

  function openLockerPicker(transactionId) {
    setLockerPicker({ transactionId, postalCode: "", city: "", points: [], loading: false, searched: false, center: null });
  }

  async function handleSearchLockers() {
    if (!lockerPicker.postalCode.trim() || !lockerPicker.city.trim()) {
      toast.error("Escribe tu código postal y tu ciudad");
      return;
    }
    setLockerPicker((prev) => ({ ...prev, loading: true }));
    try {
      const { points } = await searchServicePoints({ postalCode: lockerPicker.postalCode.trim(), city: lockerPicker.city.trim() });
      const center = points[0] ? { lat: points[0].latitude, lng: points[0].longitude } : null;
      setLockerPicker((prev) => ({ ...prev, points, loading: false, searched: true, center }));
    } catch (err) {
      toast.error(err.message);
      setLockerPicker((prev) => ({ ...prev, loading: false, searched: true, points: [] }));
    }
  }

  function handleUseMyLocation() {
    if (!navigator.geolocation) { toast.error("Tu navegador no permite compartir la ubicación"); return; }
    setLockerPicker((prev) => ({ ...prev, loading: true }));
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const { points } = await searchServicePoints({ latitude, longitude });
          setLockerPicker((prev) => ({ ...prev, points, loading: false, searched: true, center: { lat: latitude, lng: longitude } }));
        } catch (err) {
          toast.error(err.message);
          setLockerPicker((prev) => ({ ...prev, loading: false, searched: true, points: [] }));
        }
      },
      () => {
        toast.error("No se pudo obtener tu ubicación");
        setLockerPicker((prev) => ({ ...prev, loading: false }));
      }
    );
  }

  async function handleChooseLocker(point) {
    if (lockerPicker.transactionId === "precheckout") {
      setCheckoutServicePoint(point);
      setLockerPicker(null);
      return;
    }
    try {
      await setServicePoint(lockerPicker.transactionId, point.id, point.name, point.address);
      toast.success("Punto de recogida guardado");
      setLockerPicker(null);
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    }
  }

  // Dibuja el mapa y los marcadores cada vez que cambian los resultados de la búsqueda de taquillas
  useEffect(() => {
    if (!lockerPicker || !lockerPicker.center || !lockerMapRef.current) return;

    // Añade los pines de las taquillas encontradas — se llama tanto la primera vez que se crea
    // el mapa como cada vez que cambian los resultados de una búsqueda posterior.
    function addLockerMarkers() {
      lockerMarkers.current.forEach((m) => m.remove());
      lockerMarkers.current = [];

      const pinIcon = L.divIcon({
        className: "locker-pin",
        html: `<div style="width:30px;height:30px;border-radius:50% 50% 50% 0;background:var(--accent);border:1px solid var(--border);transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;"><div style="transform:rotate(45deg);width:8px;height:8px;border-radius:50%;background:#1A1A1A;"></div></div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 30],
      });

      lockerPicker.points.forEach((p) => {
        if (p.latitude == null || p.longitude == null) return;
        const marker = L.marker([p.latitude, p.longitude], { icon: pinIcon }).addTo(lockerMapInstance.current);
        const popupEl = document.createElement("div");
        popupEl.innerHTML = `<p style="font-weight:800;font-size:12.5px;margin:0 0 3px;">${p.name}</p><p style="font-size:11px;color:var(--sub);margin:0 0 8px;">${p.address}</p>`;
      const btn = document.createElement("button");
      btn.textContent = "Elegir este punto";
      btn.style.cssText = "border:1px solid var(--border);background:var(--accent);color:var(--on-accent);border-radius:8px;padding:6px 12px;font-weight:800;font-size:11px;cursor:pointer;font-family:inherit;";
      btn.onclick = () => handleChooseLocker(p);
      popupEl.appendChild(btn);
      marker.bindPopup(popupEl);
      lockerMarkers.current.push(marker);
      });
    }

    if (!lockerMapInstance.current) {
      lockerMapInstance.current = L.map(lockerMapRef.current).setView([lockerPicker.center.lat, lockerPicker.center.lng], 14);
      // Probamos ya tres proveedores "gratis sin clave" (OSM directo, CartoDB, OpenFreeMap) y los
      // tres fallaron de una forma distinta según el dispositivo/red de cada persona — ese patrón
      // en sí es la señal de que ninguno está pensado para sostener una app real. MapTiler sí lo
      // está: capa gratuita de 100.000 cargas de mapa al mes, sin tarjeta, y es la forma estándar
      // en la que casi cualquier app real resuelve esto en 2026. Necesita una clave gratuita —
      // ver VITE_MAPTILER_KEY en el .env.
      const maptilerKey = import.meta.env.VITE_MAPTILER_KEY;
      L.tileLayer(
        maptilerKey
          ? `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${maptilerKey}`
          : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", // respaldo si aún no has puesto la clave (puede salir marcado "API KEY REQUIRED")
        { attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://www.maptiler.com/copyright/">MapTiler</a>', maxZoom: 20 }
      ).addTo(lockerMapInstance.current);
      const resizeObserver = new ResizeObserver(() => lockerMapInstance.current?.invalidateSize());
      resizeObserver.observe(lockerMapRef.current);
      lockerMapResizeObserver.current = resizeObserver;
      setTimeout(() => lockerMapInstance.current?.invalidateSize(), 100);
      setTimeout(() => lockerMapInstance.current?.invalidateSize(), 400);
    } else {
      lockerMapInstance.current.setView([lockerPicker.center.lat, lockerPicker.center.lng], 14);
      lockerMapInstance.current.invalidateSize();
    }
    addLockerMarkers();
  }, [lockerPicker?.center, lockerPicker?.points]);

  // Limpia el mapa al cerrar el buscador de taquillas, para poder crear uno limpio la próxima vez
  useEffect(() => {
    if (!lockerPicker && lockerMapInstance.current) {
      lockerMapInstance.current.remove();
      lockerMapInstance.current = null;
      lockerMarkers.current = [];
      lockerMapResizeObserver.current?.disconnect();
      lockerMapResizeObserver.current = null;
    }
  }, [lockerPicker]);

  function renderPurchaseCard(tx) {
    return (
      <div key={tx.id} className="order-card">
        <div className="order-top">
          <div className="order-thumb" style={{ backgroundImage: `url(${tx.item.images?.[0] || ""})` }} />
          <div className="order-top-info">
            <p className="order-title">{tx.item.title}</p>
            <p className="order-price">{(Number(tx.amount) + Number(tx.commission || 0) + Number(tx.shippingFee || 3.5)).toFixed(2)}€</p>
            <p className="order-seller">Vendedor: @{tx.seller.username}</p>
          </div>
        </div>
        <div className="order-steps">
          <div className={"order-step" + (tx.status !== "pending" ? " done" : "")}><ShoppingBag size={13} /><span>Pagado</span></div>
          <div className={"order-step-line" + (tx.shipment ? " done" : "")} />
          <div className={"order-step" + (tx.shipment ? " done" : "")}><Truck size={13} /><span>Enviado</span></div>
          <div className={"order-step-line" + (tx.status === "completed" ? " done" : "")} />
          <div className={"order-step" + (tx.status === "completed" ? " done" : "")}><CheckCircle size={13} /><span>Recibido</span></div>
        </div>

        {tx.status === "disputed" && (
          <div className="seller-dispute-box">
            <p className="admin-dispute-reason">Tu reclamación está en revisión: "{tx.disputeReason}"</p>
            {tx.returnRequired && (
              tx.returnMarkedSentAt ? (
                <p className="order-hint">📦 Ya avisaste de que lo devolviste{tx.returnTrackingCode ? ` (seguimiento: ${tx.returnTrackingCode})` : ""} — esperando a que @{tx.seller.username} lo confirme.</p>
              ) : (
                <>
                  <p className="order-hint">Tienes que devolver el artículo antes de que se procese el reembolso.</p>
                  <div className="input-icon" style={{ marginTop: 8 }}>
                    <input placeholder="Nº de seguimiento (opcional)" value={returnTrackingInput} onChange={(e) => setReturnTrackingInput(e.target.value)} />
                  </div>
                  <button className="order-action-btn" onClick={() => handleMarkReturned(tx.id)}>Ya lo he enviado de vuelta</button>
                </>
              )
            )}
          </div>
        )}

        {tx.shipment && tx.shipment.trackingCode && (
          <p className="order-hint">Nº de seguimiento: {tx.shipment.trackingCode}</p>
        )}
        {!tx.shipment && tx.status === "paid" && (
          <>
            <p className="order-hint">Esperando a que @{tx.seller.username} genere el envío, o quedad en persona</p>
            {tx.buyerServicePointId && (
              <button className="order-action-btn secondary" onClick={() => openLockerPicker(tx.id)}>
                <MapPin size={13} /> 📍 Recogerás en: {tx.buyerServicePointName} — cambiar
              </button>
            )}
            <button className="order-action-btn secondary" onClick={() => handleCompleteInPerson(tx.id)}>
              Ya lo he recibido en persona
            </button>
          </>
        )}
        {tx.shipment && tx.status !== "completed" && tx.status !== "disputed" && (
          <button className="order-action-btn" onClick={() => handleConfirmReceived(tx.id)}>
            Confirmar que me ha llegado
          </button>
        )}
        {tx.status === "completed" && (
          <>
            <p className="order-delivery-tag">{tx.deliveryMethod === "in_person" ? "📍 Entregado en persona" : "📦 Entregado por correo"}</p>
            {tx.reviewedByMe ? (
              <p className="order-hint">✓ Ya has valorado a @{tx.seller.username}</p>
            ) : (
              <button className="order-action-btn" onClick={() => setReviewingTx({ id: tx.id, otherUsername: tx.seller.username })}>
                <Star size={13} /> Valorar a @{tx.seller.username}
              </button>
            )}
          </>
        )}
        {tx.status === "disputed" && (
          <p className="order-hint" style={{ color: "var(--accent)" }}>Reembolso solicitado, en revisión.</p>
        )}
        {["paid", "shipped"].includes(tx.status) && (
          <p className="dispute-link" onClick={() => setDisputingTx(tx)}>¿Algún problema con este pedido? Solicitar reembolso</p>
        )}
      </div>
    );
  }

  function renderSaleCard(tx) {
    return (
      <div key={tx.id} className="order-card">
        <div className="order-top">
          <div className="order-thumb" style={{ backgroundImage: `url(${tx.item.images?.[0] || ""})` }} />
          <div className="order-top-info">
            <p className="order-title">{tx.item.title}</p>
            <p className="order-price">{(Number(tx.amount) + Number(tx.shippingFee || 3.5)).toFixed(2)}€</p>
            <p className="order-seller">Comprador: @{tx.buyer.username}</p>
          </div>
        </div>
        <div className="order-steps">
          <div className={"order-step" + (tx.status !== "pending" ? " done" : "")}><ShoppingBag size={13} /><span>Pagado</span></div>
          <div className={"order-step-line" + (tx.shipment ? " done" : "")} />
          <div className={"order-step" + (tx.shipment ? " done" : "")}><Truck size={13} /><span>Enviado</span></div>
          <div className={"order-step-line" + (tx.status === "completed" ? " done" : "")} />
          <div className={"order-step" + (tx.status === "completed" ? " done" : "")}><CheckCircle size={13} /><span>Recibido</span></div>
        </div>

        {tx.status === "disputed" && (
          <div className="seller-dispute-box">
            <p className="admin-dispute-reason">⚠️ @{tx.buyer.username} ha abierto una reclamación: "{tx.disputeReason}"</p>
            {tx.disputeEvidenceUrl && (
              <img src={tx.disputeEvidenceUrl} alt="Prueba adjuntada" className="admin-dispute-evidence" onClick={() => window.open(tx.disputeEvidenceUrl, "_blank")} />
            )}
            {tx.returnRequired && (
              tx.returnConfirmedAt ? (
                <p className="order-hint">📦 Confirmaste la devolución — reembolso procesado.</p>
              ) : tx.returnMarkedSentAt ? (
                <>
                  <p className="order-hint">@{tx.buyer.username} dice que ya te lo ha devuelto{tx.returnTrackingCode ? ` (seguimiento: ${tx.returnTrackingCode})` : ""}.</p>
                  <button className="order-action-btn" onClick={() => handleConfirmReturnReceived(tx.id)}>Ya lo he recibido de vuelta</button>
                </>
              ) : (
                <p className="order-hint">Le hemos pedido a @{tx.buyer.username} que te devuelva el artículo antes de reembolsarle.</p>
              )
            )}
            {tx.sellerResponse ? (
              <p className="order-hint">Ya has enviado tu versión: "{tx.sellerResponse}" — la estamos revisando.</p>
            ) : (
              <button className="order-action-btn" onClick={() => { setRespondingTx(tx); setSellerResponseText(""); }}>
                Dar mi versión
              </button>
            )}
          </div>
        )}

        {!tx.shipment && tx.status === "paid" && tx.shippingRateId && (
          <>
            <button className="order-action-btn" onClick={() => handleGenerateLabel(tx.id)} disabled={generatingLabelFor === tx.id}>
              <Truck size={13} /> {generatingLabelFor === tx.id ? "Generando…" : `Generar etiqueta (${tx.shippingProvider || "envío"})`}
            </button>
            <p className="order-hint">O si quedáis en persona, que @{tx.buyer.username} lo confirme desde su lado</p>
          </>
        )}
        {!tx.shipment && tx.status === "paid" && !tx.shippingRateId && (
          <p className="order-hint">@{tx.buyer.username} eligió quedar en persona — esperad a que confirme la entrega</p>
        )}
        {tx.shipment && tx.shipment.trackingCode && (
          <p className="order-hint">Nº de seguimiento: {tx.shipment.trackingCode}</p>
        )}
        {tx.shipment && tx.shipment.labelUrl && (
          <button className="order-action-btn secondary" onClick={() => handleDownloadLabel(tx.id)}>
            <FileDown size={13} /> Descargar etiqueta (PDF)
          </button>
        )}
        {tx.status === "completed" && (
          <>
            <p className="order-delivery-tag">{tx.deliveryMethod === "in_person" ? "📍 Entregado en persona" : "📦 Entregado por correo"}</p>
            {tx.reviewedByMe ? (
              <p className="order-hint">✓ Ya has valorado a @{tx.buyer.username}</p>
            ) : (
              <button className="order-action-btn" onClick={() => setReviewingTx({ id: tx.id, otherUsername: tx.buyer.username })}>
                <Star size={13} /> Valorar a @{tx.buyer.username}
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  function handleMarkSold(itemId) {
    setConfirmingMarkSold(itemId);
  }

  async function confirmMarkSold() {
    const itemId = confirmingMarkSold;
    setConfirmingMarkSold(null);
    try {
      const updated = await markItemSold(itemId);
      setOpenItem((prev) => prev ? { ...prev, status: updated.status } : prev);
      setAllItems((prev) => prev.map((i) => (i.id === itemId ? { ...i, status: updated.status } : i)));
      toast.success("Marcado como vendido");

      const candidates = await fetchItemConversations(itemId).catch(() => []);
      setBuyerCandidates(candidates);
      setManualBuyerName("");
      setPickingBuyerFor({ itemId });
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function confirmBuyerAndReview(itemId, buyerUsername) {
    if (!buyerUsername.trim()) { setPickingBuyerFor(null); return; }
    try {
      const { transactionId } = await notifySaleBuyer(itemId, buyerUsername.trim());
      toast.success(`Avisado @${buyerUsername.trim()} para que también te valore`);
      setPickingBuyerFor(null);
      setReviewingTx({ id: transactionId, otherUsername: buyerUsername.trim() });
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSubmitReview(e) {
    e.preventDefault();
    try {
      await submitReview(reviewingTx.id, reviewStars, reviewComment);
      toast.success("¡Gracias por tu valoración!");
      setReviewingTx(null);
      setReviewStars(5);
      setReviewComment("");
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const [avatarColor] = useState(PALETTE[Math.floor(Math.random() * PALETTE.length)]);
  const [viewingProfile, setViewingProfile] = useState(null); // username que se está viendo (null = el tuyo)
  const [otherProfileData, setOtherProfileData] = useState(null);
  const [otherProfileLoading, setOtherProfileLoading] = useState(false);

  function openProfile(uname) {
    const targetUsername = uname || username;
    setShowLegal(null);
    setOpenItem(null);
    setShowPost(false);
    setShowHelpCenter(false);
    setShowLeague(false);
    setProfileReviews(null);
    fetchReviews(targetUsername).then(setProfileReviews).catch(() => {});

    if (!uname || uname === username) {
      fetchLeague().then(setLeaderboard).catch(() => {});
      setViewingProfile(null);
      setOtherProfileData(null);
      setProfileMenuView(numCols >= 3 ? "venta" : null);
      setShowProfile(true);
      fetchProfile(username).then((data) => {
        if (data.avatarUrl) { setMyAvatarUrl(data.avatarUrl); localStorage.setItem("reloop_avatar", data.avatarUrl); }
        if (data.coverUrl) { setMyCoverUrl(data.coverUrl); localStorage.setItem("reloop_cover", data.coverUrl); }
        if (data.bio) setMyBio(data.bio);
        setMyEmailVerified(data.emailVerified !== false);
        setMyIdVerification((prev) => ({ ...prev, status: data.idVerificationStatus || null }));
        setMyProfileExtra({ badges: data.badges || [], avgSaleDays: data.avgSaleDays, followersCount: data.followersCount || 0, followingCount: data.followingCount || 0, freeBoosts: data.freeBoosts || 0 });
      }).catch(() => {});
      return;
    }
    setViewingProfile(uname);
    setOtherProfileData(null);
    setProfileMenuView(null);
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
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const [userRole, setUserRole] = useState(getRole());
  const isAdmin = userRole === "admin";
  const isModerator = userRole === "admin" || userRole === "moderator";
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [platformSettings, setPlatformSettings] = useState({ commissionPercent: 8, shippingFee: 3.5, boostPrice: 1.99, boostDurationHours: 48, categories: CATEGORIES.filter((c) => c !== "Todo"), instagramUrl: "", tiktokUrl: "", facebookUrl: "", twitterUrl: "", updatesText: "", maintenanceMode: false });

  // Bloquea el scroll de la página de fondo mientras haya cualquier ventana/modal abierto,
  // para que en móvil arrastrar dentro del modal no mueva el feed de detrás.
  // El detalle del artículo (openItem) solo cuenta como "modal" en móvil: en escritorio es la página normal, no una ventana flotante, y necesita su propio scroll.
  const legalPageOpen = !!showLegal;
  // En escritorio, cuando se muestra el detalle de un artículo, el formulario de publicar, o Quiénes somos/Novedades como página, se oculta el feed de detrás (en vez de quedar apilado debajo)
  const hidesFeedOnDesktop = numCols >= 3 && openItem;
  // En Vender, Novedades, Quiénes somos, el apartado legal y la Ayuda se ocultan las tarjetas de artículos, pero el bloque de impacto y el boletín se quedan visibles
  const hidesFeedCardsOnDesktop = numCols >= 3 && (showPost || legalPageOpen || showHelpCenter || showLeague || showProfile);
  const anyModalOpen = !!(
    (openItem && numCols < 3) || (showAuth && !(platformSettings.maintenanceMode && !isModerator)) || (showProfile && numCols < 3) || showChat ||
    (showLegal && !(numCols >= 3 && legalPageOpen)) ||
    (showHelpCenter && numCols < 3) ||
    (showLeague && numCols < 3) ||
    showSettings || showOrders || showFavorites || showAdminPanel || cropperState
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
  const [adminVerifications, setAdminVerifications] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminUserSearch, setAdminUserSearch] = useState("");
  const [adminReports, setAdminReports] = useState([]);
  const [adminLogs, setAdminLogs] = useState([]);
  const [seoSitemapCount, setSeoSitemapCount] = useState(null);
  const [seoLoading, setSeoLoading] = useState(false);
  const [adminBroadcasts, setAdminBroadcasts] = useState([]);
  const [broadcastForm, setBroadcastForm] = useState({ title: "", message: "", link: "", channel: "both" });
  const [sendingBroadcast, setSendingBroadcast] = useState(false);
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

  useEffect(() => {
    if (!(platformSettings.maintenanceMode && !isModerator && showMaintenanceLogin)) return;
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || !window.google) return;
    window.google.accounts.id.initialize({ client_id: clientId, callback: handleMaintenanceGoogleCredential, itp_support: true, ux_mode: "popup" });
    const el = document.getElementById("google-signin-btn-maintenance");
    if (el) {
      el.innerHTML = "";
      window.google.accounts.id.renderButton(el, { theme: "filled_black", size: "large", width: 280, text: "continue_with" });
    }
  }, [platformSettings.maintenanceMode, isModerator, showMaintenanceLogin]);
  const footerEl = (
    <footer className="site-footer-rich">
      <div className="footer-inner">
      <div className="footer-top-row">
        <div className="footer-brand-group">
          <div className="footer-brand-mark">
            <svg width="32" height="32" viewBox="0 0 140 140" xmlns="http://www.w3.org/2000/svg">
              <rect width="140" height="140" rx="30" fill="var(--accent)" stroke="#1A1A1E" strokeWidth="2.5" />
              <rect x="92" y="25" width="21" height="21" fill="var(--accent)" />
              <text x="66" y="112" fontFamily="Manrope, Arial, sans-serif" fontSize="105" fontWeight="800" fill="#17171A" textAnchor="middle">R</text>
            </svg>
          </div>
          <p className="footer-brand-line">ROPELIN — COMPRA Y VENDE DE SEGUNDA MANO.</p>
        </div>
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
          <button onClick={() => openLegalPage("how-it-works")}>Cómo funciona</button>
          <button onClick={() => openLegalPage("guide")}>Cómo usar Ropelin</button>
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
          <button onClick={() => openLegal("terms")}>Términos y condiciones</button>
          <button onClick={() => openLegal("privacy")}>Privacidad</button>
          <button onClick={() => openLegal("cookies")}>Cookies</button>
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
        <button onClick={() => openLegal("terms")}>Términos y condiciones</button>
        <span>·</span>
        <button onClick={() => openLegal("privacy")}>Privacidad</button>
        <span>·</span>
        <button onClick={() => openLegal("cookies")}>Cookies</button>
        <span className="footer-trust-badge">🔒 Pagos seguros con <strong>stripe</strong></span>
      </div>
      </div>
    </footer>
  );
  const [adminSettingsForm, setAdminSettingsForm] = useState(null);
  const [adminUserFilters, setAdminUserFilters] = useState({ verified: "", stripeConnected: "" });
  const [adminUserPage, setAdminUserPage] = useState(1);
  const [adminUserPages, setAdminUserPages] = useState(1);
  const [editingAdminItem, setEditingAdminItem] = useState(null);
  const [adminItemEditForm, setAdminItemEditForm] = useState({ title: "", description: "" });
  const [form, setForm] = useState({ title: "", category: "Moda", subcategory: "", size: "", isShoe: false, price: "", description: "", condition: "Bueno", images: [] });
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

  // Carga a quién he bloqueado, para saber qué botón mostrar en cada perfil
  useEffect(() => {
    if (!loggedIn) { setBlockedUsernames(new Set()); return; }
    fetchBlockedUsers()
      .then((users) => setBlockedUsernames(new Set(users.map((u) => u.username))))
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
      // Quien está en modo vacaciones no aparece en el feed ni en búsquedas de nadie más —
      // pero si el que mira es él mismo (viendo su propio perfil, por ejemplo), sí se ve.
      const notOnVacation = !it.sellerVacationMode || it.seller === username;
      return matchQuery && matchCat && matchMin && matchMax && matchSize && matchDistance && notOnVacation;
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

  // Enlaces directos: si la URL es /item/:id o /perfil/:username, abre lo que corresponda.
  // Primero miramos si ya lo tenemos cargado en el feed (rápido), y si no aparece ahí —por
  // ejemplo, un artículo recién comprado que ya está marcado como vendido y por eso no sale
  // en el listado normal— lo pedimos directamente por su id, para no dejar al usuario mirando
  // solo la portada sin explicación (esto pasaba justo al volver de pagar con Stripe).
  useEffect(() => {
    if (!params.id) return;
    const found = allItems.find((i) => i.id === params.id);
    if (found) {
      setOpenItem(found);
    } else {
      fetchItem(params.id).then((raw) => setOpenItem(normalizeItem(raw))).catch(() => {});
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
    setShowLeague(false);
    setShowProfile(false);
    setOpenItem(item);
    setGalleryIndex(0);
    navigate(`/item/${item.id}`);
  }

  // Abre una página legal (Términos, Privacidad, Cookies, Quiénes somos...), cerrando antes
  // cualquier artículo u otra pantalla abierta — si no, la página legal aparecía apilada
  // debajo del artículo en vez de sustituirlo.
  function openLegal(page) {
    setOpenItem(null);
    setShowPost(false);
    setShowHelpCenter(false);
    setShowLeague(false);
    setShowProfile(false);
    setShowLegal(page);
    navigate("/");
  }

  // Abre el formulario para publicar un artículo nuevo, cerrando antes cualquier otra página abierta (para que no se apilen)
  function openPostForm() {
    setShowLegal(null);
    setOpenItem(null);
    setShowHelpCenter(false);
    setShowLeague(false);
    setShowProfile(false);
    setEditingItem(null);
    setForm({ title: "", category: "Moda", size: "", isShoe: false, price: "", description: "", condition: "Bueno", images: [] });
    setShowPost(true);
  }

  // Abre una página legal/informativa (Quiénes somos, Novedades...), cerrando antes las demás páginas
  function openLegalPage(type) {
    setShowPost(false);
    setOpenItem(null);
    setShowHelpCenter(false);
    setShowLeague(false);
    setShowProfile(false);
    setShowLegal(type);
  }

  // Menú lateral compartido (Centro de ayuda, legales, publicar) para escritorio — mismo patrón
  // que el menú del perfil, para que estas páginas sueltas se sientan como un solo sitio y no
  // como ventanas independientes cada vez que tocas un enlace del pie de página.
  function infoSidebarEl(active) {
    const items = [
      { key: "help", label: "Centro de ayuda", icon: <Mail size={16} />, action: openHelpCenter },
      { key: "about", label: "Quiénes somos", icon: <Sparkles size={16} />, action: () => openLegalPage("about") },
      { key: "how-it-works", label: "Cómo funciona", icon: <RefreshCw size={16} />, action: () => openLegalPage("how-it-works") },
      { key: "guide", label: "Cómo usar Ropelin", icon: <BookOpen size={16} />, action: () => openLegalPage("guide") },
      { key: "terms", label: "Términos y condiciones", icon: <FileCheck size={16} />, action: () => openLegal("terms") },
      { key: "privacy", label: "Privacidad", icon: <ShieldCheck size={16} />, action: () => openLegal("privacy") },
      { key: "cookies", label: "Cookies", icon: <Settings size={16} />, action: () => openLegal("cookies") },
    ];
    return (
      <div className="profile-sidebar-menu info-sidebar">
        {items.map((it) => (
          <button key={it.key} className={"profile-sidebar-item" + (active === it.key ? " active" : "")} onClick={it.action}>
            {it.icon} {it.label}
          </button>
        ))}
      </div>
    );
  }

  // Menú lateral del panel de admin en escritorio — mismo patrón que el perfil y el centro de
  // ayuda: la lista siempre visible a la izquierda, cambiando solo el contenido a la derecha,
  // en vez del "entra en una sección, vuelve al menú, entra en otra" de antes.
  function adminSidebarEl(active) {
    const items = [
      isAdmin && { key: "users", label: "Usuarios", icon: <User size={16} /> },
      isAdmin && { key: "stats", label: "Ganancias", icon: <HandCoins size={16} /> },
      { key: "disputes", label: "Disputas", icon: <Package size={16} />, badge: adminDisputes.length },
      isAdmin && { key: "verifications", label: "Verificaciones", icon: <ShieldCheck size={16} />, badge: adminVerifications.length },
      { key: "reports", label: "Denuncias", icon: <FileWarning size={16} />, badge: adminReports.filter((r) => r.status === "pending").length },
      { key: "support", label: "Soporte", icon: <MessageCircle size={16} />, badge: adminSupport.filter((m) => m.status === "open").length },
      isAdmin && { key: "broadcast", label: "Notificaciones", icon: <Send size={16} /> },
      isAdmin && { key: "settings", label: "Configuración", icon: <Settings size={16} /> },
      isAdmin && { key: "seo", label: "SEO", icon: <TrendingUp size={16} /> },
      isAdmin && { key: "logs", label: "Historial", icon: <FileCheck size={16} /> },
    ].filter(Boolean);
    return (
      <div className="profile-sidebar-menu info-sidebar">
        <p className="admin-sidebar-title">Administrador</p>
        {items.map((it) => (
          <button key={it.key} className={"profile-sidebar-item" + (active === it.key ? " active" : "")} onClick={() => loadAdminTab(it.key)}>
            {it.icon} {it.label}
            {!!it.badge && <span className="admin-menu-badge" style={{ marginLeft: "auto" }}>{it.badge}</span>}
          </button>
        ))}
      </div>
    );
  }

  function adminContentEl() {
    return (
          <>
            {adminLoading && <p className="empty-tab">Cargando...</p>}

            {!adminLoading && adminSection === "users" && (
                  <>
                    <form className="admin-search-row" onSubmit={handleUserSearch}>
                      <div className="search-box">
                        <Search size={14} color="var(--faint)" />
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
                                  <button className="admin-username-edit-btn" title="Cambiar nombre de usuario" onClick={() => handleChangeUsername(u)}><Pencil size={11} /></button>
                                  {u.role === "admin" && <span className="admin-role-badge">Admin</span>}
                                  {u.role === "moderator" && <span className="admin-role-badge" style={{ background: "var(--ok)" }}>Moderador</span>}
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
                    <div className="maintenance-toggle-row">
                      <div>
                        <p className="maintenance-toggle-title">Modo mantenimiento</p>
                        <p className="maintenance-toggle-sub">Muestra una pantalla de "volvemos enseguida" con lista de espera a todo el mundo (menos a moderadores/admins).</p>
                      </div>
                      <button
                        type="button"
                        className={"maintenance-toggle" + (adminSettingsForm.maintenanceMode ? " on" : "")}
                        onClick={() => setAdminSettingsForm((prev) => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))}
                      >
                        <span className="maintenance-toggle-knob" />
                      </button>
                    </div>

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
                            {d.shipment && (
                              <p className="admin-dispute-reason">🚚 Estado real del envío: <strong>{{ label_created: "Etiqueta generada", in_transit: "En camino", delivered: "Entregado", incident: "Incidencia" }[d.shipment.status] || d.shipment.status}</strong></p>
                            )}
                            {d.buyerFlag && <p className="admin-dispute-flag">⚠️ {d.buyerFlag} (comprador)</p>}
                            {d.sellerFlag && <p className="admin-dispute-flag">⚠️ {d.sellerFlag} (vendedor)</p>}
                            {d.disputeReason && <p className="admin-dispute-reason">"{d.disputeReason}"</p>}
                            {d.disputeEvidenceUrl && (
                              <img src={d.disputeEvidenceUrl} alt="Prueba adjuntada" className="admin-dispute-evidence" onClick={() => window.open(d.disputeEvidenceUrl, "_blank")} />
                            )}
                            {d.sellerResponse && (
                              <p className="admin-dispute-seller-response"><strong>Respuesta del vendedor:</strong> "{d.sellerResponse}"</p>
                            )}
                            {d.returnRequired && (
                              <p className="admin-dispute-reason">
                                📦 Devolución pedida{d.returnMarkedSentAt ? ` — el comprador dice que ya la envió${d.returnTrackingCode ? ` (seguimiento: ${d.returnTrackingCode})` : ""}` : ", esperando a que el comprador la envíe"}
                                {d.returnLabelUrl && <> · <a href={d.returnLabelUrl} target="_blank" rel="noreferrer" style={{ color: "var(--accent)", fontWeight: 700 }}>etiqueta generada</a></>}
                              </p>
                            )}
                            {d.stripeDisputeId && (
                              <p className="admin-dispute-reason">⚠️ Además hay un contracargo bancario abierto en Stripe ({d.stripeDisputeStatus})</p>
                            )}
                            {d.messages && d.messages.length > 0 && (
                              <details className="admin-dispute-chat">
                                <summary>Ver conversación ({d.messages.length} mensajes)</summary>
                                {d.messages.map((m) => (
                                  <p key={m.id} className="admin-dispute-chat-msg"><strong>@{m.sender.username}:</strong> {m.content || (m.imageUrl ? "[foto]" : "")}{m.offerAmount ? ` — oferta ${Number(m.offerAmount).toFixed(2)}€` : ""}</p>
                                ))}
                              </details>
                            )}
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8, alignItems: "center" }}>
                              {!d.returnRequired && (
                                <button className="order-action-btn secondary" onClick={() => handleAdminRequestReturn(d.id)}>Pedir devolución antes</button>
                              )}
                              <input
                                type="number" step="0.01" placeholder={`hasta ${Number(d.amount).toFixed(2)}€`}
                                value={partialRefundAmounts[d.id] || ""}
                                onChange={(e) => setPartialRefundAmounts((prev) => ({ ...prev, [d.id]: e.target.value }))}
                                style={{ width: 90, padding: "6px 8px", borderRadius: 8, border: "1.5px solid var(--input-border)", background: "var(--bg)", color: "var(--text)", fontSize: 12 }}
                              />
                              <button className="btn primary admin-refund-btn" onClick={() => handleAdminRefund(d.id, partialRefundAmounts[d.id])}>
                                {partialRefundAmounts[d.id] ? "Reembolso parcial" : "Reembolsar al comprador"}
                              </button>
                              <button className="danger-zone-btn" onClick={() => handleAdminRejectDispute(d.id)}>Rechazar, pagar al vendedor</button>
                            </div>
                          </div>
                        ))}
                      </div>
                )}

                {!adminLoading && adminSection === "verifications" && (
                  adminVerifications.length === 0
                    ? <p className="empty-tab">No hay solicitudes de verificación pendientes.</p>
                    : <div className="admin-user-list">
                        {adminVerifications.map((v) => (
                          <div key={v.id} className="admin-dispute-row">
                            <p className="admin-user-name">@{v.username}</p>
                            <p className="admin-user-meta">{v.email}</p>
                            <img src={v.idVerificationUrl} alt="Documento" className="admin-dispute-evidence" onClick={() => window.open(v.idVerificationUrl, "_blank")} />
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                              <button className="btn primary admin-refund-btn" onClick={() => handleApproveVerification(v.id)}>Aprobar</button>
                              <button className="danger-zone-btn" onClick={() => handleRejectVerification(v.id)}>Rechazar</button>
                            </div>
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
                            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
                              {r.status === "pending" && (
                                <button className="btn primary admin-refund-btn" onClick={() => handleResolveReport(r.id)}>Marcar como revisada</button>
                              )}
                              {r.targetType === "item" && r.itemId && (
                                <button className="danger-zone-btn" onClick={() => handleDeleteReportedItem(r)}>Eliminar artículo</button>
                              )}
                              <button className="admin-ban-btn" onClick={() => handleBanFromReport(r)}>Suspender usuario</button>
                            </div>
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
                            {m.adminReply && <p className="admin-dispute-reason" style={{ color: "var(--ok)" }}>Tu respuesta: {m.adminReply}</p>}
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

                {!adminLoading && adminSection === "broadcast" && (
                  <>
                    <form onSubmit={handleSendBroadcast} className="broadcast-form">
                      <label>Título</label>
                      <input
                        type="text" maxLength={60} placeholder="Ej: ¡Nueva función en Ropelin!"
                        value={broadcastForm.title}
                        onChange={(e) => setBroadcastForm((f) => ({ ...f, title: e.target.value }))}
                      />
                      <label>Mensaje</label>
                      <textarea
                        className="report-textarea" rows={4} placeholder="Escribe el aviso que verán tus usuarios..."
                        value={broadcastForm.message}
                        onChange={(e) => setBroadcastForm((f) => ({ ...f, message: e.target.value }))}
                      />
                      <label>Enlace (opcional)</label>
                      <input
                        type="text" placeholder="/item/123 o vacío"
                        value={broadcastForm.link}
                        onChange={(e) => setBroadcastForm((f) => ({ ...f, link: e.target.value }))}
                      />
                      <label>Canal</label>
                      <div className="broadcast-channel-row">
                        {[{ v: "push", l: "Solo push" }, { v: "email", l: "Solo email" }, { v: "both", l: "Push + email" }].map((c) => (
                          <button
                            type="button" key={c.v}
                            className={`chip-toggle ${broadcastForm.channel === c.v ? "active" : ""}`}
                            onClick={() => setBroadcastForm((f) => ({ ...f, channel: c.v }))}
                          >
                            {c.l}
                          </button>
                        ))}
                      </div>
                      <button type="submit" className="btn primary" disabled={sendingBroadcast} style={{ marginTop: 14 }}>
                        {sendingBroadcast ? "Enviando..." : "Enviar aviso"}
                      </button>
                      <p className="auth-subtitle" style={{ marginTop: 8, fontSize: 11.5 }}>Solo llega a usuarios activos que no hayan desactivado las comunicaciones de Ropelin en Ajustes.</p>
                    </form>

                    <label style={{ marginTop: 22, display: "block" }}>Historial</label>
                    {adminBroadcasts.length === 0
                      ? <p className="empty-tab">Aún no has enviado ningún aviso.</p>
                      : <div className="admin-user-list">
                          {adminBroadcasts.map((b) => (
                            <div key={b.id} className="admin-log-row">
                              <p className="admin-user-meta">{new Date(b.createdAt).toLocaleString("es-ES")} · {b.channel} · {b.pushSent + b.emailSent} destinatarios</p>
                              <p className="admin-user-name" style={{ fontSize: 12.5 }}>{b.title}</p>
                            </div>
                          ))}
                        </div>
                    }
                  </>
                )}

                {adminSection === "seo" && (
                  <div className="seo-panel">
                    <div className="seo-stat-row">
                      <div className="admin-summary-box">
                        <strong>{seoLoading ? "…" : seoSitemapCount === -1 ? "?" : seoSitemapCount}</strong>
                        <span>URLs en el sitemap</span>
                      </div>
                    </div>

                    <p className="checkout-section-label" style={{ marginTop: 20 }}>Páginas públicas</p>
                    <div className="seo-link-list">
                      <a href="/sitemap.xml" target="_blank" rel="noopener" className="seo-link-row">
                        <span>sitemap.xml</span><span className="seo-link-arrow">↗</span>
                      </a>
                      <a href="/robots.txt" target="_blank" rel="noopener" className="seo-link-row">
                        <span>robots.txt</span><span className="seo-link-arrow">↗</span>
                      </a>
                      <a href="/terminos" target="_blank" rel="noopener" className="seo-link-row">
                        <span>/terminos</span><span className="seo-link-arrow">↗</span>
                      </a>
                      <a href="/privacidad" target="_blank" rel="noopener" className="seo-link-row">
                        <span>/privacidad</span><span className="seo-link-arrow">↗</span>
                      </a>
                      <a href="/cookies" target="_blank" rel="noopener" className="seo-link-row">
                        <span>/cookies</span><span className="seo-link-arrow">↗</span>
                      </a>
                      <a href="/como-usar" target="_blank" rel="noopener" className="seo-link-row">
                        <span>/como-usar</span><span className="seo-link-arrow">↗</span>
                      </a>
                    </div>

                    <p className="checkout-section-label" style={{ marginTop: 20 }}>Qué está activo</p>
                    <div className="seo-check-list">
                      {[
                        "Sitemap dinámico (se genera solo con cada artículo publicado)",
                        "Datos estructurados de producto (precio y disponibilidad en Google)",
                        "Vista previa correcta al compartir en WhatsApp/Facebook",
                        "Enlace canónico por artículo",
                        "Páginas legales indexables sin necesidad de JavaScript",
                        "Artículos borrados devuelven un 404 de verdad a Google",
                      ].map((text, i) => (
                        <p key={i} className="seo-check-item"><CheckCircle size={14} color="var(--ok)" /> {text}</p>
                      ))}
                    </div>
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
    );
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

  // Carga las reseñas del vendedor del artículo abierto
  useEffect(() => {
    if (!openItem) { setSellerReviews(null); return; }
    fetchReviews(openItem.seller).then(setSellerReviews).catch(() => {});
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
  // Si cualquier petición al servidor descubre que el token de sesión ya no vale (caducado, o
  // manipulado), cerramos la sesión de verdad en vez de dejar a la persona viendo errores
  // sueltos por toda la app sin saber que en realidad ya no está conectada.
  useEffect(() => {
    function handleAuthExpired() {
      if (!loggedIn) return; // ya estaba desconectado, no hace falta hacer nada más
      apiLogout();
      setLoggedIn(false);
      setUsername("");
      setUserRole("user");
      setShowProfile(false);
      setShowSettings(false);
      setShowAdminPanel(false);
      toast.error("Tu sesión ha caducado. Vuelve a entrar para seguir.");
      navigate("/");
    }
    window.addEventListener("reloop:auth-expired", handleAuthExpired);
    return () => window.removeEventListener("reloop:auth-expired", handleAuthExpired);
  }, [loggedIn]);

  function goHome() {
    setOpenItem(null);
    setShowProfile(false);
    setCategory("Para ti");
    setQuery("");
    navigate("/");
    window.scrollTo({ top: 0, behavior: "smooth" });
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

  async function saveBasicInfo() {
    setSavingBasicInfo(true);
    try {
      await updateMyLocation({
        firstName: firstNameInput.trim(),
        lastName: lastNameInput.trim(),
        city: cityInput.trim() || undefined,
        shippingPhone: shippingPhoneInput.trim(),
      });
      if (cityInput.trim()) {
        const updatedLocation = { ...(myLocation || {}), city: cityInput.trim() };
        setMyLocation(updatedLocation);
        localStorage.setItem("reloop_location", JSON.stringify(updatedLocation));
      }
      toast.success("Datos actualizados");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingBasicInfo(false);
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
        setCityInput(city || "");
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

  function toggleBlock(uname) {
    const alreadyBlocked = blockedUsernames.has(uname);
    if (alreadyBlocked || window.confirm(`¿Bloquear a @${uname}? No podréis escribiros, y dejaréis de seguiros mutuamente.`)) {
      setBlockedUsernames((prev) => {
        const next = new Set(prev);
        alreadyBlocked ? next.delete(uname) : next.add(uname);
        return next;
      });
      const action = alreadyBlocked ? unblockUser(uname) : blockUser(uname);
      action
        .then(() => toast.success(alreadyBlocked ? `Has desbloqueado a @${uname}` : `Has bloqueado a @${uname}`))
        .catch((err) => {
          setBlockedUsernames((prev) => {
            const next = new Set(prev);
            alreadyBlocked ? next.add(uname) : next.delete(uname);
            return next;
          });
          toast.error(err.message);
        });
    }
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

  const [sendingChatPhoto, setSendingChatPhoto] = useState(false);
  async function handleSendChatPhoto(file) {
    if (!file || !chatItem) return;
    setSendingChatPhoto(true);
    try {
      const url = await uploadImage(file);
      const message = await sendChatMessage_(chatItem.id, "", null, url);
      setChatThreads((prev) => ({ ...prev, [chatItem.id]: [...(prev[chatItem.id] || []), message] }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingChatPhoto(false);
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
    setShowLeague(false);
    setEditingItem(item);
    setForm({ title: item.title, category: item.category, subcategory: item.subcategory || "", size: item.size || "", isShoe: !!(item.size && SHOE_SIZES.includes(item.size)), price: String(item.price), description: item.description || "", condition: item.condition, images: item.images || [] });
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

  async function handleFetchCheckoutRates() {
    if (!checkoutPostalCode.trim() || !checkoutCity.trim()) {
      toast.error("Escribe tu código postal y tu ciudad");
      return;
    }
    setCheckoutRatesLoading(true);
    setCheckoutError(null);
    try {
      const { rates } = await fetchShippingQuote(openItem.id, checkoutPostalCode.trim(), checkoutCity.trim());
      setCheckoutRates(rates);
      setShowAllShippingRates(false);
      setCheckoutSelectedRateId(rates.find((r) => !r.requiresServicePoint)?.rateId || rates[0]?.rateId || null);
      setCheckoutServicePoint(null);
    } catch (err) {
      setCheckoutRates([]);
      setCheckoutError(err.message);
    } finally {
      setCheckoutRatesLoading(false);
    }
  }

  async function confirmCheckout() {
    setCheckoutError(null);
    const chosen = checkoutRates.find((r) => r.rateId === checkoutSelectedRateId);
    if (!chosen) {
      setCheckoutError("Elige un método de envío antes de pagar");
      return;
    }
    if (chosen.requiresServicePoint && !checkoutServicePoint) {
      setCheckoutError("Elige tu punto de recogida antes de pagar");
      return;
    }
    try {
      const url = await startCheckout(openItem.id, {
        shippingRateId: chosen.rateId,
        shippingProvider: chosen.provider,
        shippingAmount: chosen.amount,
        servicePoint: chosen.requiresServicePoint ? checkoutServicePoint : null,
      });
      window.location.href = url; // redirige a la pasarela de pago de Stripe
    } catch (err) {
      setCheckoutError(err.message);
    }
  }

  async function handleSaveCurrentSearch() {
    if (!loggedIn) { setShowAuth(true); return; }
    try {
      const saved = await saveSearch(query || null, category !== "Para ti" && category !== "Todo" ? category : null);
      setSavedSearches((prev) => [saved, ...prev]);
      toast.success("Búsqueda guardada, te avisaremos si sale algo así");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleDeleteSavedSearch(id) {
    try {
      await deleteSavedSearch(id);
      setSavedSearches((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleSaveShippingAddress() {
    if (!shippingStreetInput.trim() || !shippingPostalInput.trim()) {
      toast.error("Rellena al menos la calle y el código postal");
      return;
    }
    setSavingShippingAddress(true);
    try {
      await updateShippingAddress({
        shippingStreet: shippingStreetInput.trim(),
        shippingPostalCode: shippingPostalInput.trim(),
        shippingPhone: shippingPhoneInput.trim(),
      });
      toast.success("Dirección de envío guardada");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingShippingAddress(false);
    }
  }

  async function handleResendVerification() {
    setResendingVerification(true);
    try {
      const res = await resendVerification();
      if (res.alreadyVerified) {
        setMyEmailVerified(true);
        toast.success("Tu email ya estaba verificado");
      } else {
        toast.success("Te hemos reenviado el correo de verificación");
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setResendingVerification(false);
    }
  }

  async function handleSaveAccountSettings() {
    if (!newEmailInput.trim() && !newPasswordInput.trim()) {
      setShowSettings(false);
      return;
    }
    setSavingAccountSettings(true);
    try {
      if (newEmailInput.trim()) {
        if (!emailChangePassword) { toast.error("Escribe tu contraseña actual para cambiar el email"); setSavingAccountSettings(false); return; }
        await changeEmail(newEmailInput.trim(), emailChangePassword);
        toast.success("Email actualizado. Revisa tu bandeja para confirmarlo");
        setMyEmailVerified(false);
      }
      if (newPasswordInput.trim()) {
        if (!currentPasswordInput) { toast.error("Escribe tu contraseña actual para cambiarla"); setSavingAccountSettings(false); return; }
        await changePassword(currentPasswordInput, newPasswordInput.trim());
        toast.success("Contraseña actualizada");
      }
      setNewEmailInput("");
      setEmailChangePassword("");
      setCurrentPasswordInput("");
      setNewPasswordInput("");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingAccountSettings(false);
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

  async function handleDownloadLabel(transactionId) {
    try {
      const blobUrl = await downloadShipmentLabel(transactionId);
      window.open(blobUrl, "_blank");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleBoost(itemId) {
    try {
      const result = await boostItem(itemId);
      if (result.freeBoostUsed) {
        toast.success("¡Artículo destacado con tu destacado gratis! 🎉");
        setMyProfileExtra((prev) => ({ ...prev, freeBoosts: Math.max(0, (prev.freeBoosts || 0) - 1) }));
        loadAllItems();
      } else {
        window.location.href = result.url; // redirige a Stripe para pagar el destacado
      }
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

  useEffect(() => {
    if (showAdminPanel && numCols >= 3 && adminSection === null) {
      loadAdminTab(isAdmin ? "users" : "disputes");
    }
  }, [showAdminPanel, numCols, isAdmin]);

  useEffect(() => {
    if (adminSection !== "seo" || seoSitemapCount !== null) return;
    setSeoLoading(true);
    fetch("/sitemap.xml")
      .then((res) => res.text())
      .then((xml) => setSeoSitemapCount((xml.match(/<url>/g) || []).length))
      .catch(() => setSeoSitemapCount(-1))
      .finally(() => setSeoLoading(false));
  }, [adminSection]);

  async function loadAdminTab(tab, page = 1) {
    setAdminSection(tab);
    setAdminTab(tab);
    setAdminLoading(true);
    try {
      if (tab === "users") {
        const result = await fetchAdminUsers({ search: adminUserSearch, verified: adminUserFilters.verified, stripeConnected: adminUserFilters.stripeConnected, page });
        // Igual que con los pedidos: si el servidor devuelve algo con forma inesperada, no
        // queremos que esto rompa toda la app — nos quedamos con una lista vacía en vez de crash.
        setAdminUsers(Array.isArray(result?.users) ? result.users : []);
        setAdminUserPage(result?.page || 1);
        setAdminUserPages(result?.pages || 1);
      }
      if (tab === "stats") {
        setAdminStats(await fetchAdminStats());
        setAdminTimeseries(await fetchAdminTimeseries());
        setAdminTop(await fetchAdminTop());
      }
      if (tab === "disputes") setAdminDisputes(await fetchAdminDisputes());
      if (tab === "verifications") setAdminVerifications(await fetchAdminVerifications());
      if (tab === "reports") setAdminReports(await fetchAdminReports());
      if (tab === "logs") setAdminLogs(await fetchAdminLogs());
      if (tab === "broadcast") setAdminBroadcasts(await fetchAdminBroadcasts());
      if (tab === "support") setAdminSupport(await fetchAdminSupport());
      if (tab === "settings") setAdminSettingsForm(await fetchAdminSettings());
    } catch (err) {
      toast.error(err.message);
    } finally {
      setAdminLoading(false);
    }
  }

  async function handleSendBroadcast(e) {
    e.preventDefault();
    if (!broadcastForm.title.trim() || !broadcastForm.message.trim()) {
      toast.error("Escribe un título y un mensaje");
      return;
    }
    if (!confirm(`¿Enviar este aviso a todos los usuarios que no hayan desactivado las comunicaciones? (canal: ${broadcastForm.channel})`)) return;
    setSendingBroadcast(true);
    try {
      const { broadcast } = await sendAdminBroadcast(broadcastForm);
      toast.success(`Enviado — ${broadcast.pushSent} notificaciones push, ${broadcast.emailSent} emails`);
      setBroadcastForm({ title: "", message: "", link: "", channel: "both" });
      setAdminBroadcasts((prev) => [broadcast, ...prev]);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSendingBroadcast(false);
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

  async function handleChangeUsername(user) {
    const nuevo = prompt(`Nuevo nombre de usuario para @${user.username}:`, user.username);
    if (!nuevo || nuevo.trim() === user.username) return;
    try {
      const { username } = await changeUsernameAdmin(user.id, nuevo.trim());
      toast.success(`Ahora es @${username}`);
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

  async function handleDeleteReportedItem(report) {
    if (!window.confirm(`¿Eliminar "${report.item?.title}"? Esta acción quedará registrada en el log de admin.`)) return;
    try {
      await adminDeleteItem(report.itemId, `Denuncia: ${report.reason}`);
      toast.success("Artículo eliminado");
      loadAdminTab("reports");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleBanFromReport(report) {
    if (report.targetType === "item" && report.item?.sellerId) {
      setBanningUser({ id: report.item.sellerId, username: report.item.seller?.username || "" });
      return;
    }
    if (report.reportedUsername) {
      try {
        const user = await fetchProfile(report.reportedUsername);
        setBanningUser({ id: user.id, username: report.reportedUsername });
      } catch {
        toast.error("No se pudo encontrar a ese usuario");
      }
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
    setShowLeague(false);
    setShowProfile(false);
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

  async function handleAdminRefund(transactionId, partialAmount) {
    try {
      if (partialAmount) {
        await refundTransactionPartial(transactionId, Number(partialAmount));
        toast.success(`Reembolso parcial de ${Number(partialAmount).toFixed(2)}€ procesado`);
      } else {
        await refundTransaction(transactionId);
        toast.success("Reembolso procesado");
      }
      setPartialRefundAmounts((prev) => ({ ...prev, [transactionId]: "" }));
      loadAdminTab("disputes");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleAdminRejectDispute(transactionId) {
    try {
      await rejectDispute(transactionId);
      toast.success("Reclamación rechazada, el pago se ha liberado al vendedor");
      loadAdminTab("disputes");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleAdminRequestReturn(transactionId) {
    try {
      await requestReturn(transactionId);
      toast.success("Hemos pedido al comprador que devuelva el artículo antes de reembolsar");
      loadAdminTab("disputes");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleApproveVerification(userId) {
    try {
      await approveVerification(userId);
      toast.success("Usuario verificado");
      loadAdminTab("verifications");
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleRejectVerification(userId) {
    const reason = window.prompt("¿Por qué la rechazas? (se lo enviamos al usuario)") || "";
    try {
      await rejectVerification(userId, reason);
      toast.success("Verificación rechazada");
      loadAdminTab("verifications");
    } catch (err) {
      toast.error(err.message);
    }
  }

  const [returnTrackingInput, setReturnTrackingInput] = useState("");
  async function handleMarkReturned(transactionId) {
    try {
      await markReturned(transactionId, returnTrackingInput || null);
      toast.success("Avisado al vendedor de que ya lo has devuelto");
      setReturnTrackingInput("");
      loadOrders();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function handleConfirmReturnReceived(transactionId) {
    try {
      await confirmReturnReceived(transactionId);
      toast.success("Devolución confirmada, reembolso procesado");
      loadOrders();
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
      subcategory: form.subcategory || null,
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
      setForm({ title: "", category: "Moda", subcategory: "", size: "", isShoe: false, price: "", description: "", condition: "Bueno", images: [] });
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
        setTimeout(() => {
          toast("Conecta Stripe desde tu perfil cuando quieras vender, para poder cobrar", { icon: "💳", duration: 6000 });
        }, 1800);
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
        : await apiRegister(authForm.email, authForm.password, authForm.username, authForm.city, referralCode);
      if (authMode === "register" && referralCode) localStorage.removeItem("reloop_ref");
      setUsername(result.username);
      setLoggedIn(true);
      setUserRole(result.role || "user");
      setShowAuth(false);
      setAuthForm({ email: "", password: "", username: "", city: "" });
      toast.success(authMode === "login" ? `¡Bienvenido, @${result.username}!` : "¡Cuenta creada!");
      if (authMode === "register") {
        setTimeout(() => {
          toast("Conecta Stripe desde tu perfil cuando quieras vender, para poder cobrar", { icon: "💳", duration: 6000 });
        }, 1200);
      }
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
              <CheckCircle size={26} color="var(--ok)" />
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
                {resetError && <p style={{ color: "var(--accent)", fontSize: 12, marginTop: 10 }}>{resetError}</p>}
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
            {verifyStatus === "loading" && <><RefreshCw size={26} color="var(--faint)" className="spin" /><p>Verificando...</p></>}
            {verifyStatus === "ok" && <><CheckCircle size={26} color="var(--ok)" /><p>¡Email confirmado!</p></>}
            {verifyStatus === "error" && <><X size={26} color="var(--accent)" /><p>Enlace no válido o caducado</p></>}
            <button className="submit-btn" onClick={() => navigate("/")}>Ir a Ropelin</button>
          </div>
        </div>
      </div>
    );
  }

  if (!settingsLoaded) {
    return (
      <div style={{ minHeight: "100vh", background: "#FFF8EC", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{
          width: 40, height: 40, borderRadius: "50%", border: "3px solid #1A1A1A22",
          borderTopColor: "var(--accent)", animation: "soon-spin 0.7s linear infinite",
        }} />
        <style>{`@keyframes soon-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (platformSettings.maintenanceMode && !isModerator) {
    const comingSoonSteps = [
      { color: "var(--accent)", title: "Encuentra o publica un artículo", text: "Busca por categoría, talla o cercanía. ¿Tienes algo que ya no usas? Publícalo en menos de un minuto con fotos y precio." },
      { color: "var(--sub)", title: "Habla, oferta o compra directamente", text: "Pregunta al vendedor, haz una oferta más baja, o compra al precio marcado. El pago se hace dentro de Ropelin con Stripe — nunca por fuera, para que quede constancia de todo." },
      { color: "var(--ok)", title: "El vendedor envía o quedáis en persona", text: "Tras el pago, el vendedor genera una etiqueta de envío con un par de clics, o podéis quedar en persona si os viene mejor." },
      { color: "var(--amber)", title: "Confirmas que lo has recibido", text: "En cuanto te llegue, confirmas la recepción desde tu perfil — así queda cerrado el pedido para las dos partes." },
      { color: "var(--accent)", title: "Valorad la compra", text: "Al confirmar la entrega, comprador y vendedor podéis valoraros mutuamente — así se construye la confianza de la comunidad." },
    ];

    return (
      <div className="soon-page">
        <style>{`
          html, body { overflow-y: auto !important; height: auto !important; position: static !important; }
          .soon-page { min-height: 100vh; background: var(--bg); font-family: var(--font-body); color: var(--text); overflow-y: auto; }
          .soon-header { display: flex; align-items: center; gap: 10px; padding: 22px 24px; max-width: 720px; margin: 0 auto; }
          .soon-logo { width: 34px; height: 34px; border-radius: 10px; background: var(--accent); border: none; color: var(--on-accent); font-weight: 900; font-size: 16px; display: flex; align-items: center; justify-content: center; }
          .soon-header-name { font-size: 18px; font-weight: 900; margin: 0; }
          .soon-hero { max-width: 720px; margin: 0 auto; padding: 20px 24px 56px; text-align: center; }
          .soon-badge { display: inline-block; background: #1A1A1A; color: #FFF8EC; font-size: 11px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; padding: 6px 16px; border-radius: 999px; margin-bottom: 20px; }
          .soon-title { font-size: 34px; font-weight: 900; line-height: 1.15; margin: 0 0 14px; }
          .soon-title .accent { background: var(--accent); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
          .soon-subtitle { font-size: 15px; color: var(--sub); line-height: 1.55; max-width: 480px; margin: 0 auto 28px; }
          .soon-form { display: flex; gap: 10px; max-width: 420px; margin: 0 auto; flex-wrap: wrap; justify-content: center; }
          .soon-form input { flex: 1; min-width: 220px; border: 1px solid var(--border); border-radius: 12px; padding: 13px 16px; font-size: 16px; font-family: inherit; background: var(--card); color: var(--text); }
          .soon-form input:focus { outline: none; border-color: var(--accent); }
          .soon-form button { border: 1px solid var(--border); background: var(--accent); color: var(--on-accent); border-radius: 12px; padding: 13px 22px; font-weight: 900; font-size: 13.5px; cursor: pointer; font-family: inherit; white-space: nowrap; }
          .soon-success { display: inline-flex; align-items: center; gap: 8px; color: var(--ok-ink); background: var(--ok-soft); border: 1px solid var(--border); border-radius: 12px; padding: 13px 20px; font-weight: 800; font-size: 13.5px; }
          .soon-section { max-width: 720px; margin: 0 auto; padding: 0 24px 56px; }
          .soon-section-title { font-size: 22px; font-weight: 900; text-align: center; margin: 0 0 28px; }
          .soon-steps { display: flex; flex-direction: column; gap: 12px; }
          .soon-step-card { display: flex; align-items: flex-start; gap: 14px; background: var(--card); border: 1px solid var(--border); border-radius: 16px; padding: 16px 18px; }
          .soon-step-num { width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 14px; color: #fff; border: none; flex-shrink: 0; }
          .soon-step-num[style*="--amber"] { color: var(--amber-ink); }
          .soon-step-title { font-size: 14px; font-weight: 800; margin: 0 0 4px; }
          .soon-step-text { font-size: 13px; color: var(--sub); line-height: 1.5; margin: 0; }
          .soon-footer { text-align: center; padding: 24px; color: var(--sub); font-size: 12px; }
          .soon-admin-link { background: none; border: none; color: var(--sub); font-size: 12px; font-weight: 700; text-decoration: underline; cursor: pointer; font-family: inherit; margin-top: 10px; }
          .soon-admin-title { font-size: 11px; font-weight: 800; letter-spacing: .6px; text-transform: uppercase; color: var(--sub); margin: 20px 0 0; }
          .soon-google-btn { display: flex; justify-content: center; margin-top: 10px; }
          .soon-or-divider { font-size: 11px; color: var(--sub); text-align: center; margin: 10px 0 0; }
          .soon-login-form { display: flex; flex-direction: column; gap: 8px; max-width: 280px; margin: 10px auto 0; }
          .soon-login-form input { border: 1px solid var(--border); border-radius: 10px; padding: 10px 12px; font-size: 16px; font-family: inherit; background: var(--card); color: var(--text); }
          .soon-login-form button { border: 1px solid var(--border); background: #1A1A1A; color: #FFF8EC; border-radius: 10px; padding: 10px; font-weight: 800; font-size: 13px; cursor: pointer; font-family: inherit; }
          @media (max-width: 480px) { .soon-title { font-size: 27px; } .soon-form { flex-direction: column; } .soon-form input, .soon-form button { width: 100%; } }
        `}</style>

        <div className="soon-header">
          <div className="soon-logo">R</div>
          <p className="soon-header-name">Ropelin</p>
        </div>

        <div className="soon-hero">
          <span className="soon-badge">Próximamente</span>
          <p className="soon-title">Lo que ya no usas,<br /><span className="accent">alguien lo está buscando.</span></p>
          <p className="soon-subtitle">Ropelin es el sitio para comprar y vender de todo, de segunda mano: ropa, electrónica, hogar y mucho más. Estamos terminando los últimos detalles — apúntate y te avisamos en cuanto abramos.</p>

          {newsletterSubscribed ? (
            <p className="soon-success"><CheckCircle size={16} /> ¡Apuntado! Te avisaremos por email en cuanto abramos.</p>
          ) : (
            <>
              <form
                className="soon-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  setNewsletterError(null);
                  if (!/^\S+@\S+\.\S+$/.test(newsletterEmail)) { setNewsletterError("Escribe un email válido"); return; }
                  subscribeNewsletter(newsletterEmail)
                    .then(() => setNewsletterSubscribed(true))
                    .catch((err) => setNewsletterError(err.message || "No se pudo apuntar"));
                }}
              >
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={newsletterEmail}
                  onChange={(e) => setNewsletterEmail(e.target.value)}
                />
                <button type="submit">Avísame</button>
              </form>
              {newsletterError && <p style={{ color: "var(--accent)", fontSize: 12.5, fontWeight: 700, marginTop: 10 }}>{newsletterError}</p>}
            </>
          )}
        </div>

        <div className="soon-section">
          <p className="soon-section-title">Así funcionará</p>
          <div className="soon-steps">
            {comingSoonSteps.map((step, i) => (
              <div className="soon-step-card" key={i}>
                <span className="soon-step-num" style={{ background: step.color }}>{i + 1}</span>
                <div>
                  <p className="soon-step-title">{step.title}</p>
                  <p className="soon-step-text">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="soon-footer">
          <p
            style={{ margin: 0, cursor: "default", userSelect: "none" }}
            onClick={() => {
              const next = secretTapCount + 1;
              setSecretTapCount(next);
              if (next >= 5) setShowMaintenanceLogin(true);
            }}
          >
            © Ropelin {new Date().getFullYear()}
          </p>
          {showMaintenanceLogin && (
            <>
              <p className="soon-admin-title">Acceso de administrador</p>
              <div id="google-signin-btn-maintenance" className="soon-google-btn"></div>
              <p className="soon-or-divider">o con tu email</p>
              <form
                className="soon-login-form"
                onSubmit={(e) => {
                  e.preventDefault();
                  setMaintenanceLoginError(null);
                  apiLogin(maintenanceLoginEmail, maintenanceLoginPassword)
                    .then(() => window.location.reload())
                    .catch((err) => setMaintenanceLoginError(err.message || "No se pudo iniciar sesión"));
                }}
              >
                <input
                  type="email"
                  placeholder="Tu email de admin"
                  value={maintenanceLoginEmail}
                  onChange={(e) => setMaintenanceLoginEmail(e.target.value)}
                />
                <input
                  type="password"
                  placeholder="Contraseña"
                  value={maintenanceLoginPassword}
                  onChange={(e) => setMaintenanceLoginPassword(e.target.value)}
                />
                {maintenanceLoginError && <p style={{ color: "var(--accent)", fontSize: 12, fontWeight: 700, margin: "-2px 0 2px" }}>{maintenanceLoginError}</p>}
                <button type="submit">Entrar</button>
              </form>
            </>
          )}
        </div>
      </div>
    );
  }

  // Buscador (con búsqueda por foto y filtros): en escritorio va dentro de la cabecera, en móvil justo debajo
  const searchEl = (
    <>
        <div className="search-box search-box-wrap">
          <Search size={15} color="var(--faint)" />
          <input
            placeholder="Buscar artículos..."
            value={query}
            onChange={(e) => { setQuery(e.target.value); setShowSuggestions(true); if (openItem) closeItemView(); if (photoSearchResults) clearPhotoSearch(); }}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          />
          {showSuggestions && searchSuggestions.length > 0 && (
            <div className="search-suggestions">
              {searchSuggestions.map((it) => (
                <button
                  key={it.id}
                  className="search-suggestion-row"
                  onMouseDown={() => { setQuery(it.title); setShowSuggestions(false); viewItem(normalizeItem(it)); }}
                >
                  <span className="search-suggestion-thumb" style={{ backgroundImage: `url(${(it.images && it.images[0]) || it.photo})` }} />
                  <span className="search-suggestion-text">
                    <span className="search-suggestion-title">{it.title}</span>
                    <span className="search-suggestion-price">{it.price}€</span>
                  </span>
                </button>
              ))}
            </div>
          )}
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
          aria-label="Buscar por foto"
        >
          {searchingPhoto ? <RefreshCw size={15} className="spin" /> : <Camera size={15} />}
        </button>
        <button className={"filter-toggle-btn" + (showFilters ? " active" : "")} onClick={() => setShowFilters(!showFilters)} aria-label={showFilters ? "Ocultar filtros" : "Mostrar filtros"}>
          <SlidersHorizontal size={15} />
        </button>
    </>
  );

  // La portada "de escaparate" solo se muestra sin búsqueda ni filtros; si no, se ve la lista de resultados
  const filtersActive = !!(priceFilter.min || priceFilter.max || sizeFilter || distanceFilter || sortBy !== "recent");
  const isHomeView = category === "Para ti" && !query && photoSearchResults === null && !filtersActive && !loading && !loadError && allItems.length > 0;
  // En escritorio, cuando NO estamos en la portada (es decir, se está buscando o navegando una
  // categoría), los filtros pasan de desplegable a barra lateral fija — como cualquier
  // marketplace real. En móvil siempre es la hoja deslizante, da igual la vista.
  const useExploreSidebar = numCols >= 3 && !isHomeView;
  const shownItems = photoSearchResults !== null ? photoSearchResults : items;
  const resultsTitle = query ? `Resultados para “${query}”` : photoSearchResults !== null ? "Resultados de tu foto" : category === "Para ti" || category === "Todo" ? "Todos los artículos" : category;

  return (
    <div className="app">
      {!cookieChoice && (
        <div className="cookie-banner">
          <p>
            Usamos cookies propias y de terceros para que la web funcione, recordar tu sesión y entender cómo la usas.{" "}
            <button className="cookie-link" onClick={() => openLegal("cookies")}>Más información</button>
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
          style: {
            background: "var(--card)", color: "var(--text)", border: "1px solid var(--border)",
            boxShadow: "var(--shadow-m)", borderRadius: "12px", fontFamily: "var(--font-body)", fontSize: "13.5px", fontWeight: 600,
          },
          success: { iconTheme: { primary: "var(--ok)", secondary: "var(--card)" } },
          error: { iconTheme: { primary: "var(--accent)", secondary: "var(--card)" } },
        }}
      />

      <div className="ann-bar">
        <b>Pago protegido</b> en todas tus compras<span>·</span>Envíos con seguimiento<span>·</span>Vendedores verificados
      </div>

      <header className="top">
        <div className="brand" onClick={goHome} style={{ cursor: "pointer" }}>
          <div className="brand-mark">
            <svg width="20" height="20" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
              <rect x="66" y="18" width="15" height="15" fill="var(--accent)" />
              <text x="47" y="80" fontFamily="Manrope, Arial, sans-serif" fontSize="75" fontWeight="800" fill="#17171A" textAnchor="middle">R</text>
            </svg>
          </div>
          <h1>Ropelin</h1>
        </div>
        {numCols >= 3 && <div className="hd-search">{searchEl}</div>}
        <div className="top-actions">
          <button className="icon-btn" onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))} title={theme === "dark" ? "Modo claro" : "Modo oscuro"} aria-label={theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}>
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          {loggedIn && (
            <button className="icon-btn" onClick={() => { setShowProfile(true); setProfileMenuView("pedidos"); }} aria-label={`Mis pedidos${pendingShipmentsCount > 0 ? ` (${pendingShipmentsCount} pendientes)` : ""}`}>
              <Package size={16} />
              {pendingShipmentsCount > 0 && <span className="notif-dot">{pendingShipmentsCount}</span>}
            </button>
          )}
          {loggedIn && (
            <button className="icon-btn hide-on-mobile-nav" onClick={handleOpenNotifs} aria-label={`Notificaciones${notifications.some((n) => !n.read) ? ` (${notifications.filter((n) => !n.read).length} sin leer)` : ""}`}>
              <Bell size={16} />
              {notifications.some((n) => !n.read) && (
                <span className="notif-dot">{notifications.filter((n) => !n.read).length}</span>
              )}
            </button>
          )}
          {loggedIn && (
            <button className="icon-btn hide-on-mobile-nav" onClick={() => setShowFavorites(true)} aria-label={`Favoritos${saved.size > 0 ? ` (${saved.size})` : ""}`}>
              <Heart size={16} fill={saved.size > 0 ? "var(--accent)" : "none"} color={saved.size > 0 ? "var(--accent)" : "currentColor"} />
              {saved.size > 0 && <span className="notif-dot">{saved.size}</span>}
            </button>
          )}
          {loggedIn && (
            <span className="badge profile-badge hide-on-mobile-nav" onClick={viewProfile} role="button" tabIndex={0} aria-label={`Ver mi perfil, @${username}`} onKeyDown={(e) => { if (e.key === "Enter") viewProfile(); }}>
              <span className="mini-avatar" style={{ background: avatarColor }}>{username[0]?.toUpperCase()}</span>
              @{username}
            </span>
          )}
          <button className="btn primary hide-on-mobile-nav" onClick={openPostForm}><Plus size={14} /> Vender</button>
          {!loggedIn && (
            <button className="btn ghost hide-on-mobile-nav" onClick={() => setShowAuth(true)}><LogIn size={14} /> <span className="btn-label">Entrar</span></button>
          )}

          {installPrompt && (
            <button className="icon-btn" onClick={handleInstallApp} title="Instalar app" aria-label="Instalar la app de Ropelin">
              <Download size={16} />
            </button>
          )}
        </div>
      </header>

      {showIosInstallBanner && (
        <div className="ios-install-banner">
          <button className="ios-install-close" onClick={dismissIosInstallBanner}><X size={13} /></button>
          <img src="/icon-192.png" alt="Ropelin" className="ios-install-icon" />
          <div className="ios-install-text">
            <p className="ios-install-title">Instala Ropelin</p>
            <p className="ios-install-steps">
              Toca <Share2 size={13} style={{ verticalAlign: "middle" }} /> y luego <strong>"Añadir a pantalla de inicio"</strong>
            </p>
          </div>
        </div>
      )}

      {!anyModalOpen && !(showPost && numCols < 3) && (
      <div className="mobile-bottom-nav">
        <button onClick={goHome}>
          <Home size={20} />
          <span>Inicio</span>
        </button>
        {loggedIn && (
          <button onClick={() => setShowFavorites(true)}>
            <Heart size={20} fill={saved.size > 0 ? "var(--accent)" : "none"} color={saved.size > 0 ? "var(--accent)" : "currentColor"} />
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

      {numCols < 3 && (
        <div className="search-row">{searchEl}</div>
      )}

      {photoSearchResults !== null && (
        <div className="photo-search-banner">
          <Camera size={14} />
          <span>Resultados para: <strong>{photoSearchKeywords.join(", ")}</strong></span>
          <button onClick={clearPhotoSearch}><X size={13} /> Quitar</button>
        </div>
      )}

      {showFilters && numCols < 3 && (
        <div className="fp-mobile-sheet" onClick={() => setShowFilters(false)}>
          <div className="fp-backdrop" />
          <div className="fp-card" onClick={(e) => e.stopPropagation()}>
            <div className="fp-mobile-head">
              <h3>Filtros y orden</h3>
              <button onClick={() => setShowFilters(false)} aria-label="Cerrar filtros"><X size={17} /></button>
            </div>
            <FilterPanel
              priceFilter={priceFilter} setPriceFilter={setPriceFilter}
              sizeFilter={sizeFilter} setSizeFilter={setSizeFilter}
              sortBy={sortBy} setSortBy={setSortBy}
              distanceFilter={distanceFilter} setDistanceFilter={setDistanceFilter}
              myLocation={myLocation} locatingMe={locatingMe} onDetectLocation={detectMyLocation}
              onClearFilters={() => { setPriceFilter({ min: "", max: "" }); setSizeFilter(""); setDistanceFilter(""); setSortBy("recent"); }}
              hasActiveFilters={!!(priceFilter.min || priceFilter.max || sizeFilter || distanceFilter || sortBy !== "recent")}
              onCloseItemView={() => { if (openItem) closeItemView(); }}
              canSaveSearch={loggedIn && !!(query || (category !== "Para ti" && category !== "Todo"))}
              onSaveSearch={handleSaveCurrentSearch}
              savedSearches={loggedIn ? savedSearches : null}
              onPickSavedSearch={(s) => { setQuery(s.query || ""); setCategory(s.category || "Todo"); }}
              onDeleteSavedSearch={handleDeleteSavedSearch}
            />
            <button className="fp-mobile-apply" onClick={() => setShowFilters(false)}>Ver resultados</button>
          </div>
        </div>
      )}

      <nav className="cat-tabs" aria-label="Categorías">
        {["Para ti", "Todo", ...platformSettings.categories].map((c) => (
          <button
            key={c}
            className={"cat-tab" + (category === c ? " active" : "")}
            onClick={() => { setCategory(c); if (openItem) closeItemView(); }}
          >
            {c}
          </button>
        ))}
      </nav>

      {showProfile && (() => {
        const profileUsername = viewingProfile || username;
        const isOwnProfile = !viewingProfile;
        const profileItems = isOwnProfile ? allItems.filter((i) => i.seller === username) : (otherProfileData?.items || []);
        const profileSold = isOwnProfile
          ? orders.sales.filter((tx) => tx.status === "completed").map((tx) => ({ id: tx.item.id, title: tx.item.title, price: tx.amount, images: tx.item.images }))
          : (otherProfileData?.soldItems || []);
        const profileRating = profileReviews?.average ? profileReviews.average.toFixed(1) : null;
        const profileContentEl = (
          <>
            <div className="profile-top-actions">
              <button className="icon-round-btn" onClick={() => handleShare(`${window.location.origin}/perfil/${profileUsername}`, `@${profileUsername} en Ropelin`)}>
                <Share2 size={14} />
              </button>
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
                {(isOwnProfile ? myIdVerification.status : otherProfileData?.idVerificationStatus) === "approved" && (
                  <span className="mstone verified-badge" title="Identidad verificada"><ShieldCheck size={11} /></span>
                )}
                {(isOwnProfile ? myProfileExtra.badges : otherProfileData?.badges || []).length > 0 && (
                  <span className="milestone-badges">
                    {(isOwnProfile ? myProfileExtra.badges : otherProfileData?.badges || []).map((b) => (
                      <span className="mstone" key={b} title={b}><Trophy size={11} /></span>
                    ))}
                  </span>
                )}
              </p>
              <p className="profile-sub">
                {profileRating ? <><Star size={12} fill="var(--amber)" color="var(--amber)" /> {profileRating} ({profileReviews.total})</> : "Sin valoraciones todavía"} · miembro desde 2026
              </p>
              {(() => {
                const avgSaleDays = isOwnProfile ? myProfileExtra.avgSaleDays : otherProfileData?.avgSaleDays;
                return avgSaleDays !== null && avgSaleDays !== undefined && (
                  <p className="profile-sub" style={{ marginTop: 2 }}>
                    <Zap size={12} /> Vende de media en {avgSaleDays} {avgSaleDays === 1 ? "día" : "días"}
                  </p>
                );
              })()}

              {!isOwnProfile && (
                <div className="profile-quick-actions">
                  <button className={"follow-btn" + (following.has(profileUsername) ? " on" : "")} onClick={() => toggleFollow(profileUsername)}>
                    {following.has(profileUsername) ? <UserCheck size={13} /> : <UserPlus size={13} />}
                    {following.has(profileUsername) ? "Siguiendo" : "Seguir"}
                  </button>
                </div>
              )}

              {!isOwnProfile && (
                <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                  <button className="report-flag-btn" onClick={() => setShowReportForm({ targetType: "user", reportedUsername: profileUsername })}>
                    <FileWarning size={12} /> Denunciar a @{profileUsername}
                  </button>
                  <button className="report-flag-btn" onClick={() => toggleBlock(profileUsername)}>
                    <Shield size={12} /> {blockedUsernames.has(profileUsername) ? "Desbloquear" : "Bloquear"}
                  </button>
                </div>
              )}

              <div className="about-me-box">
                <div className="about-me-col">
                  <p className="about-me-heading">Sobre mí</p>
                  {(isOwnProfile ? myLocation?.city : otherProfileData?.city) && (
                    <p className="about-me-line"><MapPin size={13} /> {isOwnProfile ? myLocation?.city : otherProfileData?.city}</p>
                  )}
                  <p className="about-me-line">
                    <UserPlus size={13} /> {(isOwnProfile ? myProfileExtra.followersCount : otherProfileData?.followersCount) || 0} seguidores, {(isOwnProfile ? myProfileExtra.followingCount : otherProfileData?.followingCount) || 0} siguiendo
                  </p>
                </div>
                <div className="about-me-col">
                  <p className="about-me-heading">Información verificada</p>
                  <p className="about-me-line"><CheckCircle size={13} color="var(--ok)" /> E-mail</p>
                </div>
              </div>

              <div className="stats-row">
                <button className="stat-box stat-box-clickable" onClick={() => setProfileMenuView("venta")}>
                  <Tag size={13} color="var(--faint)" />
                  <strong>{profileItems.length}</strong>
                  <span>En venta</span>
                </button>
                <button className="stat-box stat-box-clickable" onClick={() => setProfileMenuView("vendidos")}>
                  <CheckCircle size={13} color="var(--faint)" />
                  <strong>{profileSold.length}</strong>
                  <span>Vendidos</span>
                </button>
                {isOwnProfile && (
                  <button className="stat-box stat-box-clickable" onClick={() => setProfileMenuView("favoritos")}>
                    <Heart size={13} color="var(--faint)" />
                    <strong>{saved.size}</strong>
                    <span>Favoritos</span>
                  </button>
                )}
              </div>

              {isOwnProfile && loggedIn && stripeStatus && !stripeStatus.onboarded && (
                <div className="stripe-post-reminder">
                  <HandCoins size={18} color="var(--amber)" />
                  <div>
                    <p className="stripe-post-reminder-title">Conecta tu cuenta para poder cobrar</p>
                    <p className="stripe-post-reminder-text">Nadie podrá comprarte nada hasta que conectes Stripe (cuenta bancaria y algún dato de identidad). Solo se hace una vez.</p>
                  </div>
                  <button onClick={handleConnectStripe}>Conectar ahora</button>
                </div>
              )}

              <div className={"profile-desktop-flex" + (isOwnProfile && numCols >= 3 ? " has-sidebar" : "")}>
              {isOwnProfile ? (
                numCols >= 3 ? (
                  profileMenuView === "admin" ? (
                    adminSidebarEl(adminSection)
                  ) : (
                  <div className="profile-sidebar-menu">
                    <button className={"profile-sidebar-item" + ((profileMenuView || "pedidos") === "pedidos" ? " active" : "")} onClick={() => setProfileMenuView("pedidos")}>
                      <Package size={16} /> Mis pedidos
                    </button>
                    <button className={"profile-sidebar-item" + (profileMenuView === "stats" ? " active" : "")} onClick={() => setProfileMenuView("stats")}>
                      <TrendingUp size={16} /> Estadísticas
                    </button>
                    <button className={"profile-sidebar-item" + (profileMenuView === "favoritos" ? " active" : "")} onClick={() => setProfileMenuView("favoritos")}>
                      <Heart size={16} /> Favoritos
                    </button>
                    <button className={"profile-sidebar-item" + (profileMenuView === "resenas" ? " active" : "")} onClick={() => setProfileMenuView("resenas")}>
                      <Star size={16} /> Reseñas
                    </button>
                    {isOwnProfile && (
                      <>
                        <button className={"profile-sidebar-item" + (profileMenuView === "envios" ? " active" : "")} onClick={() => setProfileMenuView("envios")}>
                          <Truck size={16} /> Envíos
                        </button>
                        <button className={"profile-sidebar-item" + (profileMenuView === "pagos" ? " active" : "")} onClick={() => setProfileMenuView("pagos")}>
                          <HandCoins size={16} /> Pagos
                        </button>
                        <button className={"profile-sidebar-item" + (profileMenuView === "referido" ? " active" : "")} onClick={() => setProfileMenuView("referido")}>
                          <UserPlus size={16} /> Invita y gana
                        </button>
                        <button className={"profile-sidebar-item" + (profileMenuView === "ajustes" ? " active" : "")} onClick={() => setProfileMenuView("ajustes")}>
                          <Settings size={16} /> Ajustes
                        </button>
                      </>
                    )}
                    {isModerator && (
                      <button className="profile-sidebar-item" onClick={() => { setProfileMenuView("admin"); loadAdminTab(isAdmin ? "users" : "disputes"); }}>
                        <ShieldCheck size={16} /> Administrador
                      </button>
                    )}
                  </div>
                  )
                ) :
                profileMenuView === null ? (
                  <div className="profile-menu-list">
                    {(() => {
                      const myRanking = leaderboard.find((u) => u.username === username);
                      return (
                        <button className="profile-badges-card" style={{ width: "100%", textAlign: "left", cursor: "pointer", border: "1px solid var(--border)" }} onClick={openLeague}>
                          <div className="profile-badges-card-top">
                            <span className="profile-menu-icon"><Trophy size={17} color="var(--amber)" /></span>
                            <span className="profile-menu-label">Liga de vendedores</span>
                            <span className="profile-badges-count">
                              {myRanking ? `#${myRanking.rank} · ${myRanking.points} pts` : "Sin puntos todavía"}
                            </span>
                          </div>
                          <p className="location-hint" style={{ margin: "6px 0 0" }}>
                            {myRanking ? "Toca para ver el ranking completo" : "Vende y recibe reseñas para entrar en el ranking"}
                          </p>
                        </button>
                      );
                    })()}

                    <p className="profile-menu-section-title">Transacciones</p>
                    <button className="profile-menu-row" onClick={() => setProfileMenuView("pedidos")}>
                      <span className="profile-menu-icon"><Package size={17} /></span>
                      <span className="profile-menu-label">Mis pedidos</span>
                      <ChevronRight size={16} />
                    </button>
                    <button className="profile-menu-row" onClick={() => setProfileMenuView("stats")}>
                      <span className="profile-menu-icon"><TrendingUp size={17} /></span>
                      <span className="profile-menu-label">Estadísticas</span>
                      <ChevronRight size={16} />
                    </button>
                    <button className="profile-menu-row" onClick={() => setProfileMenuView("favoritos")}>
                      <span className="profile-menu-icon"><Heart size={17} /></span>
                      <span className="profile-menu-label">Favoritos</span>
                      <ChevronRight size={16} />
                    </button>
                    <button className="profile-menu-row" onClick={() => setProfileMenuView("resenas")}>
                      <span className="profile-menu-icon"><Star size={17} /></span>
                      <span className="profile-menu-label">Reseñas{profileReviews ? ` (${profileReviews.total})` : ""}</span>
                      <ChevronRight size={16} />
                    </button>
                    <button className="profile-menu-row" onClick={() => setProfileMenuView("envios")}>
                      <span className="profile-menu-icon"><Truck size={17} /></span>
                      <span className="profile-menu-label">Envíos</span>
                      <ChevronRight size={16} />
                    </button>
                    <button
                      className="profile-menu-row"
                      onClick={async () => {
                        const value = !vacationMode;
                        setVacationModeState(value);
                        setSavingVacation(true);
                        try {
                          await setVacationMode(value);
                          toast.success(value ? "Modo vacaciones activado" : "Modo vacaciones desactivado");
                        } catch (err) {
                          setVacationModeState(!value);
                          toast.error(err.message);
                        } finally {
                          setSavingVacation(false);
                        }
                      }}
                    >
                      <span className="profile-menu-icon"><Clock size={17} /></span>
                      <span className="profile-menu-label">
                        Modo vacaciones
                        {vacationMode && <span className="vacation-on-tag">Activado</span>}
                      </span>
                      <span className={"mini-switch" + (vacationMode ? " on" : "")} aria-hidden="true"><i /></span>
                    </button>
                    <button className="profile-menu-row" onClick={() => setProfileMenuView("pagos")}>
                      <span className="profile-menu-icon"><HandCoins size={17} /></span>
                      <span className="profile-menu-label">Pagos</span>
                      <ChevronRight size={16} />
                    </button>
                    <button className="profile-menu-row" onClick={() => setProfileMenuView("referido")}>
                      <span className="profile-menu-icon"><UserPlus size={17} /></span>
                      <span className="profile-menu-label">Invita y gana</span>
                      <ChevronRight size={16} />
                    </button>
                    <button className="profile-menu-row" onClick={() => setProfileMenuView("ajustes")}>
                      <span className="profile-menu-icon"><Settings size={17} /></span>
                      <span className="profile-menu-label">Ajustes</span>
                      <ChevronRight size={16} />
                    </button>
                    {isModerator && (
                      <button className="profile-menu-row" onClick={() => { setProfileMenuView("admin"); loadAdminTab(isAdmin ? "users" : "disputes"); }}>
                        <span className="profile-menu-icon"><ShieldCheck size={17} /></span>
                        <span className="profile-menu-label">Administrador</span>
                        <ChevronRight size={16} />
                      </button>
                    )}
                  </div>
                ) : (
                  <button className="back-btn" style={{ marginBottom: 10 }} onClick={() => setProfileMenuView(null)}><ArrowLeft size={16} /> Volver</button>
                )
              ) : (
                <div className="tabs profile-tabs">
                  <button className={"tab" + ((profileMenuView || "venta") === "venta" ? " active" : "")} onClick={() => setProfileMenuView("venta")}>En venta</button>
                  <button className={"tab" + (profileMenuView === "vendidos" ? " active" : "")} onClick={() => setProfileMenuView("vendidos")}>Vendidos</button>
                  <button className={"tab" + (profileMenuView === "resenas" ? " active" : "")} onClick={() => setProfileMenuView("resenas")}>Reseñas</button>
                </div>
              )}

              <div className="profile-desktop-content">
              {profileMenuView === "admin" && (
                <>
                  {numCols < 3 && (
                    <div className="admin-mobile-tabs">
                      {[
                        isAdmin && { key: "users", label: "Usuarios" },
                        isAdmin && { key: "stats", label: "Ganancias" },
                        { key: "disputes", label: "Disputas" },
                        isAdmin && { key: "verifications", label: "Verificaciones" },
                        { key: "reports", label: "Denuncias" },
                        { key: "support", label: "Soporte" },
                        isAdmin && { key: "broadcast", label: "Notificaciones" },
                        isAdmin && { key: "settings", label: "Configuración" },
                        isAdmin && { key: "seo", label: "SEO" },
                        isAdmin && { key: "logs", label: "Historial" },
                      ].filter(Boolean).map((it) => (
                        <button key={it.key} className={"admin-mobile-tab" + (adminSection === it.key ? " active" : "")} onClick={() => loadAdminTab(it.key)}>
                          {it.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <p className="auth-title" style={{ marginBottom: 14 }}>{{ users: "Usuarios", stats: "Ganancias", disputes: "Disputas", verifications: "Verificaciones", reports: "Denuncias", support: "Soporte", broadcast: "Notificaciones", settings: "Configuración", seo: "SEO", logs: "Historial" }[adminSection] || "Panel de administración"}</p>
                  {adminContentEl()}
                </>
              )}
              {(profileMenuView === "venta" || (!isOwnProfile && !profileMenuView)) && (
                profileItems.length === 0
                  ? (isOwnProfile ? (
                      <div className="empty-state-cta">
                        <span className="empty-state-icon"><Shirt size={22} /></span>
                        <p className="empty-state-title">Aún no tienes artículos publicados</p>
                        <p className="empty-state-text">Publica tu primer artículo y empieza a sumar puntos en tu liga.</p>
                        <button className="btn primary" onClick={openPostForm}><Plus size={14} /> Publicar artículo</button>
                      </div>
                    ) : <p className="empty-tab">Este vendedor no tiene artículos en venta ahora mismo.</p>)
                  : isOwnProfile
                  ? <div className="own-grid">
                      {profileItems.map((i, idx) => (
                        <div key={i.id} className="own-grid-item" onClick={() => { setShowProfile(false); viewItem(i); }}>
                          <div className="own-grid-photo" style={miniSwatchStyle(i, idx)}>
                            {i.featured && <span className="own-grid-featured"><TrendingUp size={11} /></span>}
                            <div className="own-grid-overlay">
                              <p className="own-grid-title">{i.title}</p>
                              <p className="own-grid-price">{i.price}€</p>
                            </div>
                          </div>
                          <div className="own-grid-actions">
                            {!i.featured && (
                              <button title={`Destacar por ${platformSettings.boostPrice}€`} onClick={(e) => { e.stopPropagation(); handleBoost(i.id); }}><TrendingUp size={13} /></button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); startEdit(i); }}><Pencil size={13} /></button>
                            <button onClick={(e) => { e.stopPropagation(); deleteOwnItem(i.id); }}><Trash2 size={13} /></button>
                          </div>
                        </div>
                      ))}
                    </div>
                  : <div className="mini-grid">
                      {profileItems.map((i, idx) => (
                        <div key={i.id} className="mini-card" onClick={() => { setShowProfile(false); viewItem(i); }}>
                          <div className="mini-swatch" style={miniSwatchStyle(i, idx)}>
                            {i.featured && <span className="mini-featured-badge">Destacado</span>}
                          </div>
                          <p className="mini-title">{i.title}</p>
                          <p className="mini-price">{i.price}€</p>
                        </div>
                      ))}
                    </div>
              )}

              {profileMenuView === "vendidos" && (
                profileSold.length === 0
                  ? <p className="empty-tab">Aún no hay ventas completadas.</p>
                  : isOwnProfile
                  ? <div className="own-grid">
                      {profileSold.map((s, idx) => (
                        <div key={s.id} className="own-grid-item own-grid-item-sold">
                          <div className="own-grid-photo" style={miniSwatchStyle(s, idx)}>
                            <div className="own-grid-overlay">
                              <p className="own-grid-title">{s.title}</p>
                              <p className="own-grid-price">{s.price}€</p>
                            </div>
                            <span className="own-grid-sold-tag">Vendido</span>
                          </div>
                        </div>
                      ))}
                    </div>
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

              {profileMenuView === "favoritos" && isOwnProfile && (
                saved.size === 0
                  ? <p className="empty-tab">Aún no has guardado ningún artículo.</p>
                  : <div className="own-grid">
                      {allItems.filter((i) => saved.has(i.id)).map((i, idx) => (
                        <div key={i.id} className="own-grid-item" onClick={() => { setShowProfile(false); viewItem(i); }}>
                          <div className="own-grid-photo" style={miniSwatchStyle(i, idx)}>
                            <div className="own-grid-overlay">
                              <p className="own-grid-title">{i.title}</p>
                              <p className="own-grid-price">{i.price}€</p>
                            </div>
                          </div>
                          <div className="own-grid-actions">
                            <button onClick={(e) => { e.stopPropagation(); toggleSave(i.id); }} title="Quitar de favoritos"><Heart size={13} fill="var(--accent)" color="var(--accent)" /></button>
                          </div>
                        </div>
                      ))}
                    </div>
              )}

              {profileMenuView === "resenas" && (
                !profileReviews ? null : profileReviews.reviews.length === 0
                  ? <p className="empty-tab">Aún no tiene ninguna reseña.</p>
                  : <div className="reviews-list">
                      {profileReviews.reviews.map((r) => (
                        <div key={r.id} className="review-row">
                          <div className="review-row-top">
                            <span className="review-author">@{r.authorUsername}</span>
                            <span className="review-stars">
                              {Array.from({ length: 5 }).map((_, i) => (
                                <Star key={i} size={11} fill={i < r.rating ? "var(--amber)" : "none"} color="var(--amber)" />
                              ))}
                            </span>
                          </div>
                          {r.comment && <p className="review-comment">{r.comment}</p>}
                          <span className="review-date">{new Date(r.createdAt).toLocaleDateString("es-ES")}</span>
                        </div>
                      ))}
                    </div>
              )}

              {isOwnProfile && (
                <>

                  {profileMenuView === "ajustes" && (
                    <div style={{ textAlign: "left", maxWidth: 480, margin: "0 auto" }}>
                      <div className="settings-avatar-row">
                        <input type="file" accept="image/*" id="avatar-upload-input-settings" style={{ display: "none" }} onChange={(e) => { if (e.target.files[0]) startCropping(e.target.files[0], "avatar"); e.target.value = ""; }} />
                        <div className="settings-avatar" style={myAvatarUrl ? { backgroundImage: `url(${myAvatarUrl})`, backgroundSize: "cover" } : { background: avatarColor }}>
                          {!myAvatarUrl && username[0]?.toUpperCase()}
                        </div>
                        <button className="btn ghost" onClick={() => document.getElementById("avatar-upload-input-settings").click()}>Editar foto de perfil</button>
                      </div>

                      <label>Nombre</label>
                      <div className="input-icon"><input value={firstNameInput} onChange={(e) => setFirstNameInput(e.target.value)} placeholder="Tu nombre" /></div>

                      <label>Apellidos</label>
                      <div className="input-icon"><input value={lastNameInput} onChange={(e) => setLastNameInput(e.target.value)} placeholder="Tus apellidos" /></div>

                      <label>Ciudad</label>
                      <div className="location-box" style={{ marginBottom: 14 }}>
                        <div className="input-icon" style={{ flex: 1, marginBottom: 0 }}><MapPin size={14} /><input value={cityInput} onChange={(e) => setCityInput(e.target.value)} placeholder="Madrid" /></div>
                        <button className="btn ghost" onClick={detectMyLocation} disabled={locatingMe} title="Detectar por GPS">
                          {locatingMe ? "..." : "Detectar"}
                        </button>
                      </div>

                      <label>Teléfono</label>
                      <div className="input-icon"><input value={shippingPhoneInput} onChange={(e) => setShippingPhoneInput(e.target.value)} placeholder="+34 600 000 000" /></div>

                      <button className="submit-btn" onClick={saveBasicInfo} disabled={savingBasicInfo} style={{ marginTop: 4, marginBottom: 20 }}>
                        {savingBasicInfo ? "Guardando..." : "Guardar cambios"}
                      </button>

                      <p className="settings-subheading">Notificaciones</p>
                      {pushStatus === "unsupported" && (
                        <p className="stripe-status-note" style={{ marginBottom: 20 }}>Tu navegador no admite notificaciones push.</p>
                      )}
                      {(pushStatus === "off" || pushStatus === "loading") && pushStatus !== "unsupported" && (
                        <button className="submit-btn" onClick={handleEnablePush} disabled={pushStatus === "loading"} style={{ marginBottom: 20 }}>
                          {pushStatus === "loading" ? "Activando..." : "Activar notificaciones"}
                        </button>
                      )}
                      {pushStatus === "on" && (
                        <button className="btn ghost" onClick={handleDisablePush} style={{ marginBottom: 20, width: "100%" }}>
                          <CheckCircle size={14} color="var(--ok)" /> Activadas — tocar para desactivar
                        </button>
                      )}

                      <p className="settings-subheading">Email y contraseña</p>
                      {!myEmailVerified && (
                        <div className="email-unverified-banner">
                          <p><FileWarning size={14} /> Tu email todavía no está verificado</p>
                          <button onClick={handleResendVerification} disabled={resendingVerification}>
                            {resendingVerification ? "Enviando..." : "Reenviar correo de verificación"}
                          </button>
                        </div>
                      )}
                      <label>Nuevo email</label>
                      <div className="input-icon"><Mail size={14} /><input placeholder={`Actual: ${username}`} value={newEmailInput} onChange={(e) => setNewEmailInput(e.target.value)} /></div>
                      {newEmailInput.trim() && (
                        <div className="input-icon"><Lock size={14} /><input type="password" placeholder="Tu contraseña actual, para confirmar" value={emailChangePassword} onChange={(e) => setEmailChangePassword(e.target.value)} /></div>
                      )}
                      <label>Nueva contraseña</label>
                      <div className="input-icon"><Lock size={14} /><input type="password" placeholder="••••••••" value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)} /></div>
                      {newPasswordInput.trim() && (
                        <div className="input-icon"><Lock size={14} /><input type="password" placeholder="Tu contraseña actual" value={currentPasswordInput} onChange={(e) => setCurrentPasswordInput(e.target.value)} /></div>
                      )}
                      <button className="submit-btn" onClick={handleSaveAccountSettings} disabled={savingAccountSettings || (!newPasswordInput.trim() && !newEmailInput.trim())} style={{ marginBottom: 20 }}>
                        {savingAccountSettings ? "Guardando..." : "Guardar email/contraseña"}
                      </button>

                      <button className="logout-btn" style={{ marginTop: 20 }} onClick={() => { apiLogout(); setLoggedIn(false); setUsername(""); setUserRole("user"); setShowProfile(false); toast("Sesión cerrada"); }}>Cerrar sesión</button>

                      <button className="logout-btn" style={{ marginTop: 10 }} onClick={async () => { try { await exportMyData(); toast.success("Descargando tus datos..."); } catch (err) { toast.error(err.message); } }}>Descargar mis datos</button>

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
                  )}

                  {(profileMenuView === "pedidos" || (isOwnProfile && numCols >= 3 && !profileMenuView)) && (
                    <div style={{ textAlign: "left" }}>
                      {ordersLoading && <p className="empty-tab">Cargando...</p>}

                      {!ordersLoading && orders.sales.length === 0 && orders.purchases.length === 0 && (
                        <p className="empty-tab">Todavía no tienes compras ni ventas.</p>
                      )}

                      {!ordersLoading && (orders.sales.length > 0 || orders.purchases.length > 0) && (() => {
                        const isVentas = pedidosTab === "ventas";
                        const source = isVentas ? orders.sales : orders.purchases;
                        const enCurso = source.filter((tx) => tx.status !== "completed");
                        const completadas = source.filter((tx) => tx.status === "completed");
                        const shown = pedidosSubTab === "curso" ? enCurso : completadas;
                        const renderCard = isVentas ? renderSaleCard : renderPurchaseCard;

                        return (
                          <>
                            <div className="tabs">
                              <button className={"tab" + (isVentas ? " active" : "")} onClick={() => { setPedidosTab("ventas"); setPedidosSubTab("curso"); }}>Ventas</button>
                              <button className={"tab" + (!isVentas ? " active" : "")} onClick={() => { setPedidosTab("compras"); setPedidosSubTab("curso"); }}>Compras</button>
                            </div>
                            <div className="pedidos-subtabs">
                              <button className={"pedidos-subtab" + (pedidosSubTab === "curso" ? " active" : "")} onClick={() => setPedidosSubTab("curso")}>
                                En curso {enCurso.length > 0 && `(${enCurso.length})`}
                              </button>
                              <button className={"pedidos-subtab" + (pedidosSubTab === "completadas" ? " active" : "")} onClick={() => setPedidosSubTab("completadas")}>
                                {isVentas ? "Completadas" : "Finalizadas"} {completadas.length > 0 && `(${completadas.length})`}
                              </button>
                            </div>

                            {shown.length > 0 ? (
                              shown.map((tx) => renderCard(tx))
                            ) : (
                              <p className="empty-tab">
                                {pedidosSubTab === "curso"
                                  ? `No tienes ${isVentas ? "ventas" : "compras"} en curso.`
                                  : `Aún no has ${isVentas ? "completado ninguna venta" : "finalizado ninguna compra"}.`}
                              </p>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  )}

                  {profileMenuView === "stats" && (
                    <div style={{ textAlign: "left" }}>
                      {myStatsLoading && <p className="empty-tab">Cargando...</p>}
                      {!myStatsLoading && (!myStats || myStats.length === 0) && (
                        <p className="empty-tab">Publica algún artículo para empezar a ver sus estadísticas aquí.</p>
                      )}
                      {!myStatsLoading && myStats && myStats.length > 0 && (
                        <div className="stats-list">
                          {myStats.map((it) => (
                            <div className="stats-row" key={it.id}>
                              <div className="stats-row-thumb" style={{ backgroundImage: it.image ? `url(${it.image})` : "none" }} />
                              <div className="stats-row-info">
                                <p className="stats-row-title">{it.title}</p>
                                <p className="stats-row-meta">
                                  <Eye size={12} /> {it.views} {it.views === 1 ? "vista" : "vistas"}
                                  <span style={{ margin: "0 6px" }}>·</span>
                                  <Heart size={12} /> {it.favoritesCount} {it.favoritesCount === 1 ? "favorito" : "favoritos"}
                                </p>
                                {it.needsAttention && (
                                  <p className="stats-row-tip"><TrendingDown size={12} /> Bastantes vistas pero ningún favorito — prueba a bajar el precio o mejorar las fotos</p>
                                )}
                              </div>
                              <p className="stats-row-price">{it.price}€</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {profileMenuView === "envios" && (
                    <div className="stripe-box" style={{ margin: 0 }}>
                      <p className="stripe-title"><Truck size={14} /> Dirección de envío (como vendedor)</p>
                      <p className="stripe-status">Se usa para generar las etiquetas de envío cuando te compren algo por correo.</p>
                      <label>Calle y número</label>
                      <div className="input-icon"><input value={shippingStreetInput} onChange={(e) => setShippingStreetInput(e.target.value)} placeholder="Calle Ejemplo, 12, 3ºB" /></div>
                      <label>Código postal</label>
                      <div className="input-icon"><input value={shippingPostalInput} onChange={(e) => setShippingPostalInput(e.target.value)} placeholder="28001" /></div>
                      <label>Teléfono de contacto</label>
                      <div className="input-icon"><input value={shippingPhoneInput} onChange={(e) => setShippingPhoneInput(e.target.value)} placeholder="+34 600 000 000" /></div>
                      <button className="stripe-connect-btn" onClick={handleSaveShippingAddress} disabled={savingShippingAddress}>
                        {savingShippingAddress ? "Guardando..." : "Guardar dirección de envío"}
                      </button>
                    </div>
                  )}

                  {profileMenuView === "pagos" && (

                    <div className="stripe-box" style={{ margin: 0 }}>
                      <p className="stripe-title"><HandCoins size={14} /> Cobros como vendedor</p>
                      {stripeStatus?.onboarded ? (
                        <p className="stripe-status ok"><CheckCircle size={13} /> Cuenta activa, ya puedes recibir pagos</p>
                      ) : (
                        <>
                          <p className="stripe-status">Activa Stripe para poder cobrar tus ventas directamente en tu cuenta bancaria.</p>
                          <p className="stripe-status-note">Te llevará a Stripe — te pedirá tu cuenta bancaria y algún dato de identidad. Es normal, lo exige la ley para poder pagarte, y solo se hace una vez.</p>
                          <button className="stripe-connect-btn" onClick={handleConnectStripe}>Conectar con Stripe</button>
                        </>
                      )}
                    </div>
                  )}

                  {profileMenuView === "referido" && (
                    <div className="stripe-box" style={{ margin: 0 }}>
                      <p className="stripe-title"><UserPlus size={14} /> Invita y gana</p>
                      <p className="stripe-status">Por cada amigo que se registre con tu enlace y publique su primer artículo, ganas <strong>1 destacado gratis</strong> para uno de tus artículos.</p>

                      <div className="referral-balance-box">
                        <TrendingUp size={20} color="var(--accent)" />
                        <div>
                          <p className="referral-balance-num">{myProfileExtra.freeBoosts || 0}</p>
                          <p className="referral-balance-label">destacado{myProfileExtra.freeBoosts === 1 ? "" : "s"} gratis disponible{myProfileExtra.freeBoosts === 1 ? "" : "s"}</p>
                        </div>
                      </div>

                      <div className="input-icon">
                        <input readOnly value={`ropelin.com/?ref=${username}`} onClick={(e) => e.target.select()} />
                      </div>
                      <button
                        className="stripe-connect-btn"
                        onClick={() => handleShare(`${window.location.origin}/?ref=${username}`, "Únete a Ropelin conmigo")}
                      >
                        Compartir enlace
                      </button>
                      <p className="stripe-status-note">
                        {(myProfileExtra.freeBoosts || 0) > 0
                          ? "La próxima vez que destaques un artículo, se usará uno de tus destacados gratis en vez de cobrarte."
                          : "En cuanto uses uno, lo verás reflejado automáticamente la próxima vez que destaques un artículo — no hace falta canjearlo a mano."}
                      </p>
                    </div>
                  )}
                </>
              )}
              </div>
              </div>

            </div>
            )}
          </>
        );

        return numCols >= 3 ? (
          <div className="legal-page profile-page-wide">
            <button className="back-btn" onClick={closeProfileView}><ArrowLeft size={16} /> Volver</button>
            <div className="profile-modal detail-modal" style={{ maxWidth: "none", padding: 0, background: "none", border: "none" }}>
              {profileContentEl}
            </div>
          </div>
        ) : (
          <div className="overlay detail-overlay" onClick={closeProfileView}>
            <div className="modal profile-modal detail-modal" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn dark-close-left" onClick={closeProfileView}><X size={14} /></button>
              {profileContentEl}
            </div>
          </div>
        );
      })()}

      {openItem && (() => {
        const isDesktop = numCols >= 3;

        const galleryEl = (
          <div
            className="detail-media"
            style={{ backgroundImage: `url(${(openItem.images && openItem.images[galleryIndex]) || openItem.photo})`, backgroundSize: "cover", backgroundPosition: "center" }}
          >
            <span className="pv-cond-chip">{openItem.condition}</span>
            {openItem.featured && <span className="featured-ribbon featured-ribbon-quiet">Destacado</span>}
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
                onClick={() => handleShare(`${window.location.origin}/item/${openItem.id}`, openItem.title)}
              ><Share2 size={16} /></button>
              <button className={"heart detail-icon-btn" + (saved.has(openItem.id) ? " on" : "")} onClick={() => toggleSave(openItem.id)}>
                <Heart size={18} fill={saved.has(openItem.id) ? "var(--accent)" : "none"} color={saved.has(openItem.id) ? "var(--accent)" : "#fff"} />
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
            <div className="pv-card">
              <p className="pv-eyebrow">{openItem.category}{openItem.subcategory ? ` · ${openItem.subcategory}` : ""} · @{openItem.seller}</p>
              <h3 className="detail-title">{openItem.title}</h3>
              <div className="pv-price-row">
                <p className="detail-price">
                  {openItem.originalPrice && Number(openItem.originalPrice) > openItem.price && (
                    <span className="detail-price-old">{Number(openItem.originalPrice)}€</span>
                  )}
                  {openItem.price}€
                </p>
                {openItem.price < 25 && <p className="trend-tag"><TrendingDown size={11} /> Por debajo de la media</p>}
              </div>

              <div className="pv-facts">
                {openItem.size && <div className="pv-fact"><small>Talla</small><span>{openItem.size}</span></div>}
                <div className="pv-fact"><small>Estado</small><span>{openItem.condition}</span></div>
                <div className="pv-fact"><small>Ubicación</small><span>{openItem.city || "España"}</span></div>
              </div>

              <p className="detail-meta-row">
                <span>Publicado {timeAgo(openItem.minutesAgo)}</span>
                {typeof openItem.views === "number" && openItem.views > 0 && <span>· <Eye size={12} /> {openItem.views} {openItem.views === 1 ? "vista" : "vistas"}</span>}
                {openItem.favoritesCount > 0 && <span>· <Heart size={12} /> {openItem.favoritesCount} en favoritos</span>}
              </p>
            </div>

            {openItem.description && (
              <div className="pv-sec">
                <p className="pv-sec-label">Descripción</p>
                <p className="detail-description">{openItem.description}</p>
              </div>
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
                  {openItem.verified && <CheckCircle size={13} color="var(--ok)" style={{ marginLeft: 5, verticalAlign: -2 }} />}
                </p>
                <p className="seller-rating">
                  <Star size={11} fill="var(--amber)" color="var(--amber)" /> 4.8 · 32 ventas
                  {openItem.distanceKm !== null && <> · <MapPin size={11} /> a {openItem.distanceKm < 1 ? "menos de 1" : Math.round(openItem.distanceKm)} km</>}
                  {openItem.distanceKm === null && openItem.city && <> · <MapPin size={11} /> {openItem.city}</>}
                </p>
                <div className="seller-mini-verify">
                  <span className="verify-chip done"><CheckCircle size={10} /> Email</span>
                </div>
              </div>
              <button className={"follow-btn" + (following.has(openItem.seller) ? " on" : "")} onClick={() => toggleFollow(openItem.seller)}>
                {following.has(openItem.seller) ? <UserCheck size={13} /> : <UserPlus size={13} />}
                {following.has(openItem.seller) ? "Siguiendo" : "Seguir"}
              </button>
            </div>

            <div className="shipping-box">
              <Truck size={16} color="var(--faint)" />
              <div>
                <p className="shipping-title">Cómo se entrega</p>
                <p className="shipping-sub">Por correo, con el precio real del transportista calculado al pagar (varía según destino), o en mano si quedáis cerca — lo acordáis por chat</p>
              </div>
            </div>

            {sellerReviews && sellerReviews.reviews && sellerReviews.reviews.length > 0 && (
              <details className="pv-sec pv-details" open={numCols < 3}>
                <summary className="pv-sec-label">Reseñas de @{openItem.seller} ({sellerReviews.total}) <ChevronDown size={14} className="pv-details-chev" /></summary>
                <div className="seller-reviews-box">
                <div className="reviews-list">
                  {sellerReviews.reviews.slice(0, 1).map((r) => (
                    <div key={r.id} className="review-row">
                      <div className="review-row-top">
                        <span className="review-author">@{r.authorUsername}</span>
                        <span className="review-stars">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={11} fill={i < r.rating ? "var(--amber)" : "none"} color="var(--amber)" />
                          ))}
                        </span>
                      </div>
                      {r.comment && <p className="review-comment">{r.comment}</p>}
                      <span className="review-date">{new Date(r.createdAt).toLocaleDateString("es-ES")}</span>
                    </div>
                  ))}
                </div>
                <button className="about-block-link seller-reviews-more" onClick={() => openProfile(openItem.seller)}>Ver {sellerReviews.total > 1 ? `las ${sellerReviews.total} reseñas` : "todas las reseñas"} →</button>
                </div>
              </details>
            )}

            {openItem.seller === username && openItem.status !== "sold" && !stripeStatus?.onboarded && (
              <div className="email-unverified-banner" style={{ marginBottom: 14 }}>
                <p><FileWarning size={14} /> Nadie puede comprarte este artículo por correo todavía</p>
                <button onClick={() => { setShowLegal(null); setShowProfile(true); setProfileMenuView("ajustes"); }}>Conectar Stripe</button>
              </div>
            )}

            <div className="detail-actions">
              {openItem.seller === username ? (
                <>
                  <button className="chat-btn" onClick={() => { startEdit(openItem); }}><Pencil size={15} /> Editar</button>
                  {openItem.status === "sold" ? (
                    <button className="buy-btn" disabled style={{ opacity: 0.6 }}><CheckCircle size={15} /> Vendido</button>
                  ) : openItem.featured ? (
                    <button className="buy-btn" disabled style={{ opacity: 0.6 }}><TrendingUp size={15} /> Ya destacado</button>
                  ) : (
                    <button className="offer-btn" onClick={() => handleBoost(openItem.id)}><TrendingUp size={15} /> {`Destacar por ${platformSettings.boostPrice}€`}</button>
                  )}
                  {openItem.status !== "sold" && (
                    <button className="chat-btn mark-sold-btn" onClick={() => handleMarkSold(openItem.id)}><CheckCircle size={15} /> Marcar como vendido</button>
                  )}
                </>
              ) : openItem.status === "sold" ? (
                <button className="buy-btn" disabled style={{ opacity: 0.6, flex: 1 }}><CheckCircle size={15} /> Este artículo ya se ha vendido</button>
              ) : openItem.sellerVacationMode ? (
                <button className="buy-btn" disabled title="Este vendedor está en modo vacaciones ahora mismo" style={{ opacity: 0.6, flex: 1 }}><Clock size={15} /> El vendedor está de vacaciones</button>
              ) : (
                <>
                  <button className="chat-btn" onClick={() => openChat(openItem)}><MessageCircle size={15} /> Contactar</button>
                  <button className="offer-btn" onClick={() => loggedIn ? setShowOffer(true) : setShowAuth(true)}><HandCoins size={15} /> Ofertar</button>
                  {openItem.sellerStripeOnboarded === false ? (
                    <button className="buy-btn" disabled title="Este vendedor todavía no puede recibir pagos por correo" style={{ opacity: 0.6 }}>No disponible por correo</button>
                  ) : (
                    <button className="buy-btn" onClick={() => { if (loggedIn) { setCheckoutPostalCode(""); setCheckoutCity(""); setCheckoutRates([]); setCheckoutSelectedRateId(null); setCheckoutServicePoint(null); setShowAllShippingRates(false); setShowCheckout(true); } else { setShowAuth(true); } }}>Comprar</button>
                  )}
                  <button
                    className="in-person-alt-btn"
                    onClick={() => {
                      if (!loggedIn) { setShowAuth(true); return; }
                      openChat(openItem);
                      setChatInput(`Hola, ¿quedamos en persona para "${openItem.title}"? Así el pago (Bizum o efectivo) lo acordáis directamente entre vosotros, sin pasar por Ropelin.`);
                    }}
                  >
                    <MapPin size={13} /> Prefiero quedar en persona (pago directo, sin comisión)
                  </button>
                </>
              )}
            </div>

            {(() => {
              if (openItem.seller !== username || openItem.status !== "sold") return null;
              const sale = orders.sales.find((tx) => tx.itemId === openItem.id);
              if (!sale) return null;
              return (
                <div className="item-shipping-box">
                  {!sale.shipment && sale.status === "paid" && sale.shippingRateId && (
                    <>
                      <button className="chat-btn mark-sold-btn" onClick={() => handleGenerateLabel(sale.id)} disabled={generatingLabelFor === sale.id}>
                        <Truck size={15} /> {generatingLabelFor === sale.id ? "Generando…" : `Generar etiqueta (${sale.shippingProvider || "envío"})`}
                      </button>
                      <p className="order-hint">O si quedáis en persona, que @{sale.buyer.username} lo confirme desde su lado</p>
                    </>
                  )}
                  {!sale.shipment && sale.status === "paid" && !sale.shippingRateId && (
                    <p className="order-hint">@{sale.buyer.username} eligió quedar en persona — esperad a que confirme la entrega</p>
                  )}
                  {sale.shipment && sale.shipment.labelUrl && (
                    <button className="chat-btn mark-sold-btn" onClick={() => handleDownloadLabel(sale.id)} style={{ justifyContent: "center" }}>
                      <FileDown size={15} /> Descargar etiqueta (PDF)
                    </button>
                  )}
                  {sale.shipment && sale.shipment.trackingCode && (
                    <p className="order-hint">Nº de seguimiento: {sale.shipment.trackingCode}</p>
                  )}
                </div>
              );
            })()}

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

            {loggedIn && openItem.seller !== username && (
              <button className="report-flag-link" onClick={() => setShowReportForm({ targetType: "item", itemId: openItem.id })}>
                <FileWarning size={11} /> Denunciar este artículo
              </button>
            )}
          </>
        );



        return isDesktop ? (
          <div className="item-page">
            <button className="back-btn" onClick={closeItemView}><ArrowLeft size={16} /> Volver</button>
            <div className="item-page-grid">
              <div className="item-page-gallery">
                {galleryEl}
                {openItem.images && openItem.images.length > 1 && (
                  <div className="gallery-thumbs">
                    {openItem.images.map((img, i) => (
                      <button
                        key={i}
                        className={"gallery-thumb" + (i === galleryIndex ? " on" : "")}
                        onClick={() => setGalleryIndex(i)}
                        style={{ backgroundImage: `url(${img})` }}
                        aria-label={`Ver foto ${i + 1}`}
                      />
                    ))}
                  </div>
                )}
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
              <div className="detail-body">{infoEl}{relatedEl}{footerEl}</div>
            </div>
          </div>
        );
      })()}

      {showLeague && (() => {
        const leagueContentEl = (
          <>
            <div className="league-header">
              <Trophy size={20} color="var(--amber)" />
              <p className="auth-title" style={{ margin: 0 }}>Liga de vendedores</p>
            </div>
            <p className="auth-subtitle" style={{ marginBottom: 18 }}>Gana puntos vendiendo y recibiendo buenas valoraciones</p>

            <div className="league-explainer">
              <p className="league-explainer-title">¿Cómo funciona el ranking?</p>
              <ul>
                <li><strong>+100 puntos</strong> por cada venta completada</li>
                <li><strong>+15 puntos</strong> por cada reseña que recibas</li>
                <li>Un pequeño extra según tu nota media de valoraciones</li>
              </ul>
              <p className="league-explainer-note">Es un ranking global de toda la plataforma, calculado en tiempo real — no hace falta hacer nada especial, solo vender bien y con buen trato.</p>
            </div>

            <p className="profile-section-title">Ranking esta semana</p>
            {leagueLoading && <p className="empty-tab">Cargando ranking...</p>}
            {!leagueLoading && leaderboard.length === 0 && (
              <p className="empty-tab">Todavía no hay suficientes ventas o reseñas para formar un ranking. ¡Sé el primero en aparecer aquí!</p>
            )}
            <div className="leaderboard">
              {leaderboard.map((u) => {
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
          </>
        );

        return numCols >= 3 ? (
          <div className="legal-page">
            <button className="back-btn" onClick={() => setShowLeague(false)}><ArrowLeft size={16} /> Volver</button>
            {leagueContentEl}
          </div>
        ) : (
          <div className="overlay" onClick={() => setShowLeague(false)}>
            <div className="modal league-modal" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" aria-label="Cerrar" onClick={() => setShowLeague(false)}><X size={14} /></button>
              {leagueContentEl}
            </div>
          </div>
        );
      })()}

      {showHelpCenter && (() => {
        const helpContentEl = (
          <>
            <div className="league-header">
              <MessageCircle size={20} color="var(--ok)" />
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
                          {m.status === "resolved" ? <span className="admin-role-badge">Respondido</span> : <span className="admin-role-badge" style={{ background: "var(--amber-soft)" }}>Pendiente</span>}
                        </p>
                        <p className="admin-user-meta">{new Date(m.createdAt).toLocaleDateString("es-ES")}</p>
                        <p className="admin-dispute-reason">{m.message}</p>
                        {m.adminReply && <p className="admin-dispute-reason" style={{ color: "var(--ok)" }}>Respuesta de Ropelin: {m.adminReply}</p>}
                      </div>
                    ))}
                  </div>
            )}
          </>
        );

        return numCols >= 3 ? (
          <div className="legal-page profile-page-wide">
            <button className="back-btn" onClick={() => setShowHelpCenter(false)}><ArrowLeft size={16} /> Volver</button>
            <div className="profile-desktop-flex has-sidebar">
              {infoSidebarEl("help")}
              <div className="profile-desktop-content">{helpContentEl}</div>
            </div>
          </div>
        ) : (
          <div className="overlay" onClick={() => setShowHelpCenter(false)}>
            <div className="modal admin-modal" onClick={(e) => e.stopPropagation()}>
              <button className="back-btn" onClick={() => setShowHelpCenter(false)} style={{ marginBottom: 14 }}><ArrowLeft size={16} /> Volver</button>
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
                { Icon: Sun, type: "Nuevo", text: "Modo claro y oscuro, con el botón en la cabecera" },
                { Icon: HandCoins, type: "Nuevo", text: "Ofertas negociables: acepta, rechaza o haz una contraoferta directamente en el chat" },
                { Icon: CheckCircle, type: "Nuevo", text: "Marcar un artículo como vendido aunque la venta se haya hecho fuera de la web" },
                { Icon: Trophy, type: "Mejora", text: "Liga de vendedores con ranking real, calculado por ventas y reseñas" },
                { Icon: Star, type: "Nuevo", text: "Reseñas del vendedor visibles directamente en el detalle de cada artículo" },
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
              const TYPE_COLORS = { Nuevo: "var(--ok)", Mejora: "var(--sub)", Arreglo: "var(--accent)" };
              const total = AGOSTO.length + JULIO.length;

              return (
                <>
                  <p className="auth-title">Novedades</p>
                  <div className="legal-text updates-list">
                    {platformSettings.updatesText ? (
                      <p style={{ whiteSpace: "pre-wrap" }}>{platformSettings.updatesText}</p>
                    ) : (
                      <>
                        <p className="updates-counter"><Sparkles size={13} color="var(--ok)" /> {total} novedades este mes</p>

                        <div className="update-entry">
                          <p className="update-date">Agosto 2026</p>
                          <div className="update-bubbles">
                            {AGOSTO.map(({ Icon, type, text }) => (
                              <div className="update-bubble" key={text}>
                                <div className="update-bubble-icon"><Icon size={15} color="var(--faint)" /></div>
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
                                <div className="update-bubble-icon"><Icon size={15} color="var(--faint)" /></div>
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
                        <p className="updates-subscribe-done"><CheckCircle size={14} color="var(--ok)" /> Te avisaremos por email de las novedades</p>
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
            {showLegal === "how-it-works" && (
              <>
                <p className="auth-title">Cómo funciona</p>
                <p className="how-it-works-intro">Comprar y vender de segunda mano en Ropelin es sencillo y está protegido en cada paso.</p>
                <div className="how-it-works-list">
                  {[
                    { color: "var(--accent)", title: "Encuentra o publica un artículo", text: "Busca por categoría, talla o cercanía. ¿Tienes algo que ya no usas? Publícalo en menos de un minuto con fotos y precio." },
                    { color: "var(--sub)", title: "Habla, oferta o compra directamente", text: "Pregunta al vendedor, haz una oferta más baja, o compra al precio marcado. El pago se hace dentro de Ropelin con Stripe — nunca por fuera, para que quede constancia de todo." },
                    { color: "var(--ok)", title: "El vendedor envía o quedáis en persona", text: "Tras el pago, el vendedor genera una etiqueta de envío con un par de clics, o podéis quedar en persona si os viene mejor." },
                    { color: "var(--amber)", title: "Confirmas que lo has recibido", text: "En cuanto te llegue, confirmas la recepción desde tu perfil — así queda cerrado el pedido para las dos partes." },
                    { color: "var(--accent)", title: "Valorad la compra", text: "Al confirmar la entrega, comprador y vendedor podéis valoraros mutuamente — así se construye la confianza de la comunidad." },
                  ].map((step, i) => (
                    <div className="how-it-works-card" key={i}>
                      <span className="how-it-works-num" style={{ background: step.color }}>{i + 1}</span>
                      <div>
                        <p className="how-it-works-title">{step.title}</p>
                        <p className="how-it-works-text">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {showLegal === "guide" && (
              <>
                <p className="auth-title">Cómo usar Ropelin</p>
                <p className="how-it-works-intro">Una guía rápida para sacarle partido a la app, paso a paso.</p>
                <div className="how-it-works-list">
                  {[
                    { color: "var(--accent)", title: "Crea tu cuenta", text: "Regístrate con tu email o con Google. Añade tu ciudad para ver artículos cerca de ti." },
                    { color: "var(--sub)", title: "Busca o publica", text: "Explora por categoría, o busca por texto o foto. Para vender, pulsa \"Vender\", sube fotos y pon un precio — lleva menos de un minuto." },
                    { color: "var(--ok)", title: "Habla y compra seguro", text: "Pregunta por chat, haz una oferta más baja, o compra directamente. El pago queda protegido hasta que confirmes que todo ha llegado bien." },
                    { color: "var(--amber)", title: "Recibe y valora", text: "Por correo, o en persona si quedáis cerca. Al recibirlo, confirmas desde tu perfil y podéis valoraros mutuamente." },
                  ].map((step, i) => (
                    <div className="how-it-works-card" key={i}>
                      <span className="how-it-works-num" style={{ background: step.color }}>{i + 1}</span>
                      <div>
                        <p className="how-it-works-title">{step.title}</p>
                        <p className="how-it-works-text">{step.text}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <a href="/como-usar" target="_blank" rel="noopener" className="about-block-link" style={{ display: "inline-block", marginTop: 14 }}>Ver como página completa →</a>
              </>
            )}
            {showLegal === "about" && (
              <>
                <p className="auth-title">Quiénes somos</p>
                <div className="legal-text">
                  <p>Ropelin nació con una idea sencilla: lo que para ti ya no tiene uso, para otra persona puede ser justo lo que estaba buscando.</p>
                  <p>Somos un mercado de segunda mano donde puedes comprar y vender de todo — ropa, electrónica, artículos para el hogar y mucho más — de forma fácil, segura y a un clic de distancia.</p>

                  {allItems.length > 0 && (
                    <div className="about-impact-box">
                      <Leaf size={18} color="var(--ok)" />
                      <p>
                        Entre toda la comunidad ya se han ahorrado{" "}
                        <strong>{Math.round(allItems.reduce((sum, i) => sum + i.price * 2.1, 0)).toLocaleString("es-ES")} kg de CO₂</strong>
                        {" "}y{" "}
                        <strong>{Math.round(allItems.reduce((sum, i) => sum + i.price * 90, 0)).toLocaleString("es-ES")} L de agua</strong>
                      </p>
                    </div>
                  )}

                  <div className="about-block">
                    <div className="about-block-icon" style={{ background: "var(--accent)" }}><User size={16} color="#1A1A1A" /></div>
                    <div>
                      <p className="about-block-title">Quién hay detrás</p>
                      <p className="about-block-text">Creado por una sola persona, con ganas de cambiar cómo compramos y vendemos de segunda mano.</p>
                    </div>
                  </div>

                  <div className="about-block">
                    <div className="about-block-icon" style={{ background: "var(--sub)" }}><ShieldCheck size={16} color="#1A1A1A" /></div>
                    <div>
                      <p className="about-block-title">Por qué confiar en Ropelin</p>
                      <p className="about-block-text">Los pagos se procesan con Stripe, y la comunidad está moderada para mantener la web segura para todos.</p>
                    </div>
                  </div>

                  <div className="about-block">
                    <div className="about-block-icon" style={{ background: "var(--amber-soft)" }}><Mail size={16} color="#1A1A1A" /></div>
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
                <a href="/terminos" target="_blank" rel="noopener" className="about-block-link" style={{ display: "inline-block", marginBottom: 14 }}>Ver el documento legal completo →</a>
                <div className="how-it-works-list">
                  {[
                    { color: "var(--accent)", title: "1. Objeto", text: "Ropelin es una plataforma que conecta a compradores y vendedores de artículos de segunda mano. Actuamos como intermediarios: no somos propietarios de los artículos publicados ni parte del contrato de compraventa entre usuarios, y no garantizamos la veracidad, calidad ni estado real de los artículos." },
                    { color: "var(--sub)", title: "2. Quién puede usar Ropelin", text: "Debes ser mayor de 18 años y aportar datos veraces al crear tu cuenta. Solo puedes tener una cuenta activa. Eres responsable de la confidencialidad de tu contraseña." },
                    { color: "var(--ok)", title: "3. Cómo funciona la compraventa", text: "El vendedor publica el artículo; el comprador puede preguntar, ofertar o comprar directamente. El pago se hace a través de Stripe, y el envío se gestiona a un precio real elegido por el comprador antes de pagar (o queda en persona)." },
                    { color: "var(--amber)", title: "4. Precio, comisiones y pago", text: "El vendedor fija el precio. Ropelin cobra una comisión sobre cada venta, mostrada antes de pagar, además del coste real del envío. No almacenamos datos de tarjetas ni cuentas bancarias — los procesa Stripe." },
                    { color: "var(--accent)", title: "5. Retención de fondos", text: "En envíos por correo, el pago se retiene 48 horas desde que el comprador confirma la recepción, por si quiere reclamar. En entregas en persona, se libera al vendedor al momento. Si hay una reclamación abierta, el pago queda retenido hasta resolverla." },
                    { color: "var(--sub)", title: "6. Reclamaciones y devoluciones", text: "El comprador puede reclamar con foto como prueba dentro de esas 48 horas. Podemos exigir que devuelva el artículo al vendedor (con etiqueta de devolución gratuita) antes de procesar cualquier reembolso. Ropelin decide en última instancia, revisando las pruebas de ambas partes." },
                    { color: "var(--accent)", title: "7. Envíos", text: "Los envíos se gestionan con transportistas externos (Correos, InPost...) a través de Sendcloud. Facilitamos la generación de etiquetas y el seguimiento, pero no respondemos de retrasos o daños causados por el transportista." },
                    { color: "var(--sub)", title: "8. Verificación de identidad", text: "Podemos ofrecer o pedir la verificación de tu identidad (subiendo un documento) como medida antifraude. Es una comprobación interna nuestra, no una verificación legal o notarial." },
                    { color: "var(--ok)", title: "9. Conducta prohibida", text: "No se permite publicar artículos falsificados, robados o de venta restringida; manipular reseñas o crear cuentas falsas; abrir reclamaciones fraudulentas; ni acordar la venta fuera de la plataforma para eludir la comisión." },
                    { color: "var(--amber)", title: "10. Suspensión de cuentas", text: "Podemos suspender, limitar o cerrar cuentas que incumplan estas condiciones, acumulen reclamaciones perdidas de forma reiterada, o muestren patrones de fraude." },
                    { color: "var(--accent)", title: "11. Bloqueo entre usuarios", text: "Cualquier usuario puede bloquear a otro. El bloqueo impide escribiros y deshace el seguimiento mutuo; no afecta a transacciones ya en curso." },
                    { color: "var(--sub)", title: "12. Propiedad intelectual", text: "Las fotos y descripciones que publiques deben ser tuyas o contar con tu autorización. Al publicarlas, nos concedes permiso para mostrarlas dentro del servicio y con fines promocionales del artículo." },
                    { color: "var(--accent)", title: "13. Limitación de responsabilidad", text: "Salvo lo relativo a pagos y reclamaciones descrito arriba, no respondemos de la calidad o legalidad real de los artículos, del comportamiento entre usuarios, ni de incidencias de terceros (Stripe, Sendcloud, transportistas)." },
                    { color: "var(--sub)", title: "14. Modificaciones", text: "Podemos modificar estas condiciones en cualquier momento; los cambios importantes se avisarán a los usuarios registrados." },
                    { color: "var(--ok)", title: "15. Ley aplicable", text: "Estas condiciones se rigen por la legislación española, sometiéndonos a los juzgados y tribunales que correspondan según la normativa de consumidores aplicable." },
                    { color: "var(--amber)", title: "16. Contacto", text: "Para cualquier duda sobre estas condiciones: hola@ropelin.com" },
                    { color: "var(--accent)", title: "17. Vendedores particulares y profesionales", text: "Si vendes fuera de una actividad empresarial eres un vendedor particular. Si vendes de forma profesional, debes identificarte como tal — te pediremos NIF y datos de contacto adicionales, y estarás sujeto a la normativa de consumidores que corresponda a los vendedores profesionales." },
                    { color: "var(--sub)", title: "18. Sistema de reclamaciones", text: "Puedes recurrir cualquier decisión de moderación (retirada de un anuncio, suspensión...) desde el Centro de ayuda, explicando los motivos. Revisaremos la decisión y te comunicaremos el resultado." },
                    { color: "var(--ok)", title: "19. Protección del comprador", text: "Cubre casos como artículo no recibido, diferente, falsificado, dañado o incompleto. No es un seguro — su aplicación depende de las pruebas disponibles y de las condiciones de Stripe." },
                  ].map((s, i) => (
                    <div className="how-it-works-card" key={i}>
                      <span className="how-it-works-num" style={{ background: s.color }}>{i + 1}</span>
                      <div>
                        <p className="how-it-works-title">{s.title}</p>
                        <p className="how-it-works-text">{s.text}</p>
                      </div>
                    </div>
                  ))}
                  <p style={{ color: "var(--faint)", fontSize: 11, marginTop: 4 }}>Este texto es un borrador. Antes de operar con usuarios reales, revísalo con un abogado o gestoría especializada en comercio electrónico y servicios de pago.</p>
                </div>
              </>
            )}
            {showLegal === "privacy" && (
              <>
                <p className="auth-title">Política de privacidad</p>
                <a href="/privacidad" target="_blank" rel="noopener" className="about-block-link" style={{ display: "inline-block", marginBottom: 14 }}>Ver el documento legal completo →</a>
                <div className="how-it-works-list">
                  {[
                    { color: "var(--accent)", title: "1. Responsable", text: "Ropelin es responsable del tratamiento de los datos personales recogidos a través de ropelin.com y la app. Contacto: hola@ropelin.com" },
                    { color: "var(--sub)", title: "2. Qué datos recogemos", text: "Cuenta (email, usuario, contraseña cifrada), perfil (foto, bio, ciudad), dirección de envío, fotos y mensajes, reseñas, y — solo si te verificas o te lo pedimos por prevención de fraude — una foto de tu documento de identidad. Los datos de pago los procesa Stripe directamente; nosotros no los almacenamos." },
                    { color: "var(--ok)", title: "3. Base legal", text: "Tratamos tus datos para ejecutar el contrato de uso de la plataforma, con tu consentimiento (verificación voluntaria, notificaciones, cookies no esenciales), por interés legítimo (prevenir fraude, resolver disputas) y por obligación legal cuando aplica." },
                    { color: "var(--amber)", title: "4. Para qué los usamos", text: "Gestionar tu cuenta y tus compras/ventas, procesar pagos y envíos, enviarte notificaciones, revisar reclamaciones y solicitudes de verificación, prevenir fraude, y cumplir obligaciones legales." },
                    { color: "var(--accent)", title: "5. Con quién los compartimos", text: "Stripe (pagos, verificación de vendedores, reembolsos), Sendcloud (etiquetas y seguimiento de envíos), y nuestros proveedores de alojamiento e imágenes — solo lo necesario para prestar el servicio. Nunca vendemos tus datos a terceros con fines publicitarios." },
                    { color: "var(--sub)", title: "6. Cuánto los conservamos", text: "Mientras tu cuenta esté activa, y el tiempo que exija la ley después de darte de baja (por ejemplo, datos fiscales de transacciones). Los documentos de identidad se conservan solo el tiempo necesario para revisar la solicitud." },
                    { color: "var(--accent)", title: "7. Tus derechos", text: "Puedes acceder, rectificar o suprimir tus datos, oponerte o limitar su uso, y pedir la portabilidad, escribiendo a hola@ropelin.com. También puedes reclamar ante la Agencia Española de Protección de Datos (AEPD)." },
                    { color: "var(--sub)", title: "8. Seguridad", text: "Aplicamos medidas técnicas y organizativas razonables (cifrado de contraseñas, conexiones seguras) para proteger tus datos. Si detectamos una brecha que te afecte, te lo notificaremos conforme a la normativa aplicable." },
                    { color: "var(--ok)", title: "9. Menores de edad", text: "Ropelin no está dirigido a menores de 18 años y no recogemos conscientemente datos de menores." },
                    { color: "var(--amber)", title: "10. Cambios y contacto", text: "Podemos actualizar esta política; los cambios importantes se avisarán a los usuarios registrados. Para cualquier duda: hola@ropelin.com" },
                  ].map((s, i) => (
                    <div className="how-it-works-card" key={i}>
                      <span className="how-it-works-num" style={{ background: s.color }}>{i + 1}</span>
                      <div>
                        <p className="how-it-works-title">{s.title}</p>
                        <p className="how-it-works-text">{s.text}</p>
                      </div>
                    </div>
                  ))}
                  <p style={{ color: "var(--faint)", fontSize: 11, marginTop: 4 }}>Este texto es un borrador. Antes de operar con usuarios reales, revísalo con un abogado especializado en protección de datos para cumplir el RGPD correctamente.</p>
                </div>
              </>
            )}
            {showLegal === "cookies" && (
              <>
                <p className="auth-title">Política de cookies</p>
                <a href="/cookies" target="_blank" rel="noopener" className="about-block-link" style={{ display: "inline-block", marginBottom: 14 }}>Ver el documento legal completo →</a>
                <div className="how-it-works-list">
                  {[
                    { color: "var(--accent)", title: "Cookies esenciales", text: "Necesarias para que funcione el inicio de sesión, el carrito y la seguridad de la plataforma. No se pueden desactivar porque la web no funcionaría sin ellas." },
                    { color: "var(--ok)", title: "Cookies de preferencia", text: "Recuerdan cosas como el tema claro/oscuro o el idioma elegido, para no tener que configurarlo cada vez." },
                    { color: "var(--amber)", title: "Cookies de análisis (opcionales)", text: "Nos ayudan a entender cómo se usa la web (páginas más visitadas, errores) para mejorarla. Solo se activan si aceptas todas las cookies." },
                    { color: "var(--sub)", title: "Cómo elegir", text: "Al entrar en Ropelin puedes aceptar todas las cookies o solo las necesarias, con el mismo peso para ambas opciones. Puedes cambiar tu elección en cualquier momento desde Ajustes." },
                  ].map((s, i) => (
                    <div className="how-it-works-card" key={i}>
                      <span className="how-it-works-num" style={{ background: s.color }}>{i + 1}</span>
                      <div>
                        <p className="how-it-works-title">{s.title}</p>
                        <p className="how-it-works-text">{s.text}</p>
                      </div>
                    </div>
                  ))}
                  <p style={{ color: "var(--faint)", fontSize: 11, marginTop: 4 }}>Este texto es un borrador. Antes de operar con usuarios reales, revísalo con un abogado para cumplir la normativa de cookies (LSSI-CE) correctamente.</p>
                </div>
              </>
            )}
          </>
        );

        const openAsPage = numCols >= 3;

        return openAsPage ? (
          <div className="legal-page profile-page-wide">
            <button className="back-btn" onClick={() => setShowLegal(null)}><ArrowLeft size={16} /> Volver</button>
            <div className="profile-desktop-flex has-sidebar">
              {infoSidebarEl(showLegal === "terms" ? "terms" : showLegal === "privacy" ? "privacy" : showLegal === "cookies" ? "cookies" : showLegal === "about" ? "about" : showLegal === "how-it-works" ? "how-it-works" : showLegal === "guide" ? "guide" : null)}
              <div className="profile-desktop-content">{legalContentEl}</div>
            </div>
          </div>
        ) : (
          <div className="overlay" onClick={() => setShowLegal(null)}>
            <div className="modal legal-modal" onClick={(e) => e.stopPropagation()}>
              <button className="back-btn" onClick={() => setShowLegal(null)} style={{ marginBottom: 14 }}><ArrowLeft size={16} /> Volver</button>
              {legalContentEl}
            </div>
          </div>
        );
      })()}

      {showPost && (() => {
        const postGridEl = (
          <div className="post-modal-grid">
            <div className="post-photos-col">
              <p className="post-section-label"><span className="post-step-num">1</span>Fotos</p>
              <label htmlFor="photo-upload" className="upload-box">
                <span className="upload-icon-badge"><ImagePlus size={20} color="#fff" /></span>
                <span className="upload-box-title">Añadir fotos</span>
                <span className="upload-hint">Hasta 6 imágenes · JPG o PNG</span>
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
                  <p className="post-preview-title">{form.title || "Título de tu artículo"}</p>
                  <p className="post-preview-meta">
                    {form.category}{form.size ? ` · Talla ${form.size}` : ""} · {form.condition}
                  </p>
                </div>
              </div>
            </div>

            <div className="post-form-col">
              <form onSubmit={handlePublish}>
                <p className="post-section-label"><span className="post-step-num">2</span>Tipo de artículo</p>
                <div className="post-form-card">
                  <label>Categoría</label>
                  <div className="pill-group">
                    {platformSettings.categories.map((c) => (
                      <button type="button" key={c} className={"pill" + (form.category === c ? " active" : "")} onClick={() => setForm({ ...form, category: c, subcategory: "", size: "", isShoe: false })}>{c}</button>
                    ))}
                  </div>

                  {SUBCATEGORIES[form.category] && (
                    <>
                      <label>Más concretamente</label>
                      <div className="pill-group">
                        {SUBCATEGORIES[form.category].map((sc) => (
                          <button type="button" key={sc} className={"pill" + (form.subcategory === sc ? " active" : "")} onClick={() => setForm({ ...form, subcategory: form.subcategory === sc ? "" : sc })}>{sc}</button>
                        ))}
                      </div>
                    </>
                  )}

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
                </div>

                <p className="post-section-label"><span className="post-step-num">3</span>Descríbelo</p>
                <div className="post-form-card">
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
                </div>

                <p className="post-section-label"><span className="post-step-num">4</span>Precio</p>
                <div className="post-form-card">
                  <label>Precio de venta</label>
                  <div className="input-icon price-input">
                    <span className="euro-prefix">€</span>
                    <input type="number" min="1" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="0" />
                  </div>
                </div>

                <div className="post-submit-bar">
                  {postError && <p style={{ color: "var(--accent)", fontSize: 12, margin: "0 0 8px" }}>{postError}</p>}
                  <button className="submit-btn" type="submit" disabled={uploadingImages.length > 0}>
                    {uploadingImages.length > 0 ? "Subiendo fotos..." : !loggedIn ? "Iniciar sesión para publicar" : editingItem ? "Guardar cambios" : "Publicar artículo"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

        const stripeReminderEl = loggedIn && stripeStatus && !stripeStatus.onboarded && (
          <div className="stripe-post-reminder">
            <HandCoins size={18} color="var(--amber)" />
            <div>
              <p className="stripe-post-reminder-title">Conecta tu cuenta para poder cobrar</p>
              <p className="stripe-post-reminder-text">Puedes publicar igualmente, pero necesitarás conectar Stripe (cuenta bancaria y algún dato de identidad, solo una vez) antes de que alguien pueda comprarte algo.</p>
            </div>
            <button onClick={handleConnectStripe}>Conectar ahora</button>
          </div>
        );

        return numCols >= 3 ? (
          <div className="post-page-solo profile-page-wide">
            <button className="back-btn" onClick={() => setShowPost(false)}><ArrowLeft size={16} /> Volver</button>
            <div className="post-solo-card">
              <div className="post-solo-header">
                <span className="post-solo-icon"><Tag size={20} /></span>
                <div>
                  <p className="auth-title" style={{ margin: 0 }}>{editingItem ? "Editar artículo" : "Publicar un artículo"}</p>
                  <p className="auth-subtitle" style={{ margin: "2px 0 0" }}>{editingItem ? "Actualiza los datos de tu artículo" : "Rellena los datos y publícalo en segundos"}</p>
                </div>
              </div>
              {stripeReminderEl}
              {postGridEl}
            </div>
          </div>
        ) : (
          <div className="overlay detail-overlay" onClick={() => setShowPost(false)}>
            <div className="modal post-modal detail-modal" onClick={(e) => e.stopPropagation()}>
              <div className="post-mobile-header">
                <button className="post-mobile-close" onClick={() => setShowPost(false)}><X size={18} /></button>
                <p className="post-mobile-title">{editingItem ? "Editar" : "Vender"}</p>
              </div>
              <button className="close-btn" aria-label="Cerrar" onClick={() => setShowPost(false)}><X size={14} /></button>
              <p className="auth-title">{editingItem ? "Editar artículo" : "Nuevo artículo"}</p>
              <p className="auth-subtitle" style={{ marginBottom: 18 }}>{editingItem ? "Actualiza los datos de tu artículo" : "Rellena los datos y publícalo en segundos"}</p>
              {stripeReminderEl}
              {postGridEl}
            </div>
          </div>
        );
      })()}

      {!hidesFeedOnDesktop && !hidesFeedCardsOnDesktop && (
      <div className={useExploreSidebar ? "explore-layout" : undefined}>
      {useExploreSidebar && (
        <aside className="explore-side">
          <div className="explore-side-title"><SlidersHorizontal size={15} /> Filtros y orden</div>
          <FilterPanel
            priceFilter={priceFilter} setPriceFilter={setPriceFilter}
            sizeFilter={sizeFilter} setSizeFilter={setSizeFilter}
            sortBy={sortBy} setSortBy={setSortBy}
            distanceFilter={distanceFilter} setDistanceFilter={setDistanceFilter}
            myLocation={myLocation} locatingMe={locatingMe} onDetectLocation={detectMyLocation}
            onClearFilters={() => { setPriceFilter({ min: "", max: "" }); setSizeFilter(""); setDistanceFilter(""); setSortBy("recent"); }}
            hasActiveFilters={!!(priceFilter.min || priceFilter.max || sizeFilter || distanceFilter || sortBy !== "recent")}
            onCloseItemView={() => { if (openItem) closeItemView(); }}
            canSaveSearch={loggedIn && !!(query || (category !== "Para ti" && category !== "Todo"))}
            onSaveSearch={handleSaveCurrentSearch}
            savedSearches={loggedIn ? savedSearches : null}
            onPickSavedSearch={(s) => { setQuery(s.query || ""); setCategory(s.category || "Todo"); }}
            onDeleteSavedSearch={handleDeleteSavedSearch}
          />
        </aside>
      )}
      <div className={useExploreSidebar ? "explore-main" : undefined}>
      <>
      {isHomeView && (
        <HomeSections
          items={allItems.filter((i) => i.status !== "sold")}
          categories={platformSettings.categories}
          isDesktop={numCols >= 3}
          hasLocation={!!myLocation}
          saved={saved}
          toggleSave={toggleSave}
          onOpen={viewItem}
          onSell={openPostForm}
          onPickCategory={(c) => { setCategory(c); if (openItem) closeItemView(); window.scrollTo({ top: 0, behavior: "smooth" }); }}
          onHowItWorks={() => openLegalPage("how-it-works")}
          onNearMe={() => {
            if (myLocation) { setCategory("Todo"); setSortBy("distance"); window.scrollTo({ top: 0, behavior: "smooth" }); }
            else detectMyLocation();
          }}
        />
      )}
      {!loading && !loadError && shownItems.length > 0 && (
        <div className="hm-head feed-head">
          <h2>{isHomeView ? "Recién subido" : resultsTitle}</h2>
          <span className="hm-sub">{shownItems.length.toLocaleString("es-ES")} artículo{shownItems.length === 1 ? "" : "s"}</span>
        </div>
      )}
      {loadError && !loading && (
        <div className="empty-state">
          <RefreshCw size={32} color="var(--accent)" />
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
          <PackageOpen size={38} color="var(--sub)" />
          <p className="empty-title">No hay artículos que coincidan</p>
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
            <RefreshCw size={16} className="spin" style={{ color: "var(--sub)" }} />
          </div>
        )}
        </>
        );
      })()}
      </>
      </div>
      </div>
      )}
      {!hidesFeedOnDesktop && (
        <>
        {category === "Para ti" && !query && allItems.length > 0 && (
          <div className="community-impact">
            <Leaf size={18} color="var(--ok)" />
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
                <p className="newsletter-thanks"><CheckCircle size={16} color="var(--ok)" /> ¡Ya estás suscrito!</p>
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

      {footerEl}

      {showForgotPassword && (
        <div className="overlay" onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotError(null); }}>
          <div className="modal auth-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" aria-label="Cerrar" onClick={() => { setShowForgotPassword(false); setForgotSent(false); setForgotError(null); }}><X size={14} /></button>
            {forgotSent ? (
              <div className="offer-sent">
                <Mail size={26} color="var(--ok)" />
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
                  {forgotError && <p style={{ color: "var(--accent)", fontSize: 12, marginTop: 10 }}>{forgotError}</p>}
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
            <button className="close-btn" aria-label="Cerrar" onClick={() => setShowAuth(false)}><X size={14} /></button>

            <div className="auth-brand">
              <div className="brand-mark auth-mark">
                <svg width="22" height="22" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
                  <rect x="66" y="18" width="15" height="15" fill="var(--accent)" />
                  <text x="47" y="80" fontFamily="Manrope, Arial, sans-serif" fontSize="75" fontWeight="800" fill="#17171A" textAnchor="middle">R</text>
                </svg>
              </div>
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
              {authError && <p style={{ color: "var(--accent)", fontSize: 12, marginTop: 10 }}>{authError}</p>}
              <button className="submit-btn" type="submit">{authMode === "login" ? "Entrar" : "Crear cuenta"}</button>
            </form>
            {authMode === "login" && (
              <p className="toggle-link" onClick={() => { setShowAuth(false); setShowForgotPassword(true); }}>¿Olvidaste tu contraseña?</p>
            )}
            <p className="toggle-link" onClick={() => setShowAuth(false)}>Explorar sin cuenta</p>
          </div>
        </div>
      )}


      {disputingTx && (
        <div className="overlay" onClick={() => setDisputingTx(null)}>
          <div className="modal rating-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" aria-label="Cerrar" onClick={() => setDisputingTx(null)}><X size={14} /></button>
            <p className="auth-title">Solicitar reembolso</p>
            <p className="auth-subtitle" style={{ marginBottom: 18 }}>{disputingTx.item.title}</p>
            <form onSubmit={handleSubmitDispute}>
              <label>Cuéntanos qué ha pasado</label>
              <div className="input-icon">
                <input value={disputeReason} onChange={(e) => setDisputeReason(e.target.value)} placeholder="Ej. No coincide con la descripción, parece falso..." />
              </div>
              <label style={{ marginTop: 14 }}>Foto como prueba (recomendado)</label>
              {disputeEvidence?.url ? (
                <div className="dispute-evidence-preview">
                  <img src={disputeEvidence.url} alt="Prueba" />
                  <button type="button" className="checkout-locker-change" onClick={() => setDisputeEvidence(null)}>Quitar</button>
                </div>
              ) : (
                <label className="dispute-evidence-upload">
                  <input type="file" accept="image/*" onChange={handleDisputeEvidenceUpload} style={{ display: "none" }} />
                  {disputeEvidence?.uploading ? "Subiendo…" : <><Camera size={14} /> Añadir foto del artículo recibido</>}
                </label>
              )}
              <p style={{ fontSize: 11, color: "var(--sub)", marginTop: 10 }}>Revisaremos tu caso y, si procede, se te devolverá el importe a través de Stripe. Tienes 48h desde que confirmaste la entrega para reclamar.</p>
              <button className="submit-btn" type="submit">Enviar solicitud</button>
            </form>
          </div>
        </div>
      )}

      {respondingTx && (
        <div className="overlay" onClick={() => setRespondingTx(null)}>
          <div className="modal rating-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" aria-label="Cerrar" onClick={() => setRespondingTx(null)}><X size={14} /></button>
            <p className="auth-title">Dar tu versión</p>
            <p className="auth-subtitle" style={{ marginBottom: 18 }}>{respondingTx.item.title}</p>
            <p className="admin-dispute-reason">Reclamación de @{respondingTx.buyer.username}: "{respondingTx.disputeReason}"</p>
            <form onSubmit={handleSubmitSellerResponse}>
              <label>Tu respuesta</label>
              <div className="input-icon">
                <input value={sellerResponseText} onChange={(e) => setSellerResponseText(e.target.value)} placeholder="Explica tu versión de lo ocurrido..." />
              </div>
              <p style={{ fontSize: 11, color: "var(--sub)", marginTop: 10 }}>Revisaremos las dos versiones antes de tomar una decisión — el pago se queda retenido mientras tanto.</p>
              <button className="submit-btn" type="submit">Enviar mi versión</button>
            </form>
          </div>
        </div>
      )}

      {confirmingMarkSold && (
        <div className="overlay" onClick={() => setConfirmingMarkSold(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 360 }}>
            <div className="report-modal-header">
              <div className="report-modal-icon" style={{ background: "color-mix(in srgb, var(--ok) 9%, transparent)", color: "var(--ok)" }}><CheckCircle size={18} /></div>
              <p className="auth-title" style={{ margin: 0 }}>¿Marcar como vendido?</p>
            </div>
            <p className="auth-subtitle" style={{ marginBottom: 20 }}>Ya no aparecerá disponible en la web. Esto no se puede deshacer.</p>
            <div style={{ display: "flex", gap: 10 }}>
              <button className="chat-btn" style={{ flex: 1 }} onClick={() => setConfirmingMarkSold(null)}>Cancelar</button>
              <button className="submit-btn" style={{ flex: 1 }} onClick={confirmMarkSold}>Marcar como vendido</button>
            </div>
          </div>
        </div>
      )}

      {pickingBuyerFor && (
        <div className="overlay" onClick={() => setPickingBuyerFor(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" aria-label="Cerrar" onClick={() => setPickingBuyerFor(null)}><X size={14} /></button>
            <p className="auth-title">¿A quién se lo vendiste?</p>
            <p className="auth-subtitle" style={{ marginBottom: 16 }}>Así le avisamos y podéis valoraros mutuamente</p>

            {buyerCandidates.length > 0 && (
              <>
                <p className="post-section-label" style={{ marginTop: 0 }}>Ha hablado contigo por chat de este artículo</p>
                <div className="pill-group" style={{ marginBottom: 16 }}>
                  {buyerCandidates.map((u) => (
                    <button key={u} type="button" className="pill" onClick={() => confirmBuyerAndReview(pickingBuyerFor.itemId, u)}>@{u}</button>
                  ))}
                </div>
              </>
            )}

            <p className="post-section-label" style={{ marginTop: 0 }}>O escribe su usuario a mano</p>
            <div className="input-icon" style={{ marginBottom: 16 }}>
              <User size={14} />
              <input
                placeholder="nombre_de_usuario"
                value={manualBuyerName}
                onChange={(e) => setManualBuyerName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && confirmBuyerAndReview(pickingBuyerFor.itemId, manualBuyerName)}
              />
            </div>

            <button className="submit-btn" onClick={() => confirmBuyerAndReview(pickingBuyerFor.itemId, manualBuyerName)}>Avisarle y valorar</button>
            <button className="chat-btn" style={{ width: "100%", marginTop: 8 }} onClick={() => setPickingBuyerFor(null)}>Prefiero no hacerlo ahora</button>
          </div>
        </div>
      )}

      {reviewingTx && (
        <div className="overlay" onClick={() => setReviewingTx(null)}>
          <div className="modal rating-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" aria-label="Cerrar" onClick={() => setReviewingTx(null)}><X size={14} /></button>
            <p className="auth-title">Valorar a @{reviewingTx.otherUsername}</p>
            <form onSubmit={handleSubmitReview}>
              <div className="star-picker">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button type="button" key={n} onClick={() => setReviewStars(n)}>
                    <Star size={26} fill={n <= reviewStars ? "var(--amber)" : "none"} color={n <= reviewStars ? "var(--amber)" : "var(--sub)"} />
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
            <button className="close-btn" aria-label="Cerrar" onClick={() => setShowFavorites(false)}><X size={14} /></button>
            <p className="auth-title" style={{ marginBottom: 4 }}>Tus favoritos</p>
            <p className="auth-subtitle" style={{ marginBottom: 16 }}>{saved.size} {saved.size === 1 ? "artículo guardado" : "artículos guardados"}</p>

            {saved.size === 0 ? (
              <p className="empty-tab">Aún no has guardado ningún artículo. Dale al corazón de cualquier artículo para verlo aquí.</p>
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
                        <Heart size={14} fill="var(--accent)" color="var(--accent)" />
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
            <button className="close-btn" aria-label="Cerrar" onClick={() => setShowNotifs(false)}><X size={14} /></button>
            <p className="auth-title" style={{ marginBottom: 12 }}>Avisos</p>
            <div className="notif-tabs">
              <button className={notifsTab === "notifs" ? "on" : ""} onClick={() => setNotifsTab("notifs")}>
                Notificaciones{notifications.some((n) => !n.read) && <em>{notifications.filter((n) => !n.read).length}</em>}
              </button>
              <button className={notifsTab === "messages" ? "on" : ""} onClick={() => setNotifsTab("messages")}>
                Mensajes{messageThreads.some((t) => t.unreadCount > 0) && <em>{messageThreads.reduce((s, t) => s + t.unreadCount, 0)}</em>}
              </button>
            </div>

            {notifsTab === "notifs" && <>
            {notifications.length === 0 && <p className="empty-tab">No tienes notificaciones todavía.</p>}
            {notifications.map((n) => (
              <div
                key={n.id}
                className={"notif-row" + (n.read ? "" : " unread")}
                style={{ cursor: n.link ? "pointer" : "default" }}
                onClick={async () => {
                  if (!n.link) return;
                  setShowNotifs(false);
                  if (n.link === "/pedidos") {
                    setShowProfile(true);
                    setProfileMenuView("pedidos");
                    return;
                  }
                  const match = n.link.match(/\/item\/(.+)/);
                  if (match) {
                    let found = allItems.find((i) => i.id === match[1]);
                    if (!found) {
                      try { found = normalizeItem(await fetchItem(match[1])); } catch { /* el artículo ya no existe */ }
                    }
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
            </>}

            {notifsTab === "messages" && <>
            {loadingThreads && <p className="empty-tab">Cargando tus conversaciones...</p>}
            {!loadingThreads && messageThreads.length === 0 && <p className="empty-tab">No tienes conversaciones todavía.</p>}
            {messageThreads.map((t) => (
              <div
                key={t.itemId}
                className={"thread-row" + (t.unreadCount > 0 ? " unread" : "")}
                onClick={async () => {
                  setShowNotifs(false);
                  try {
                    const found = normalizeItem(await fetchItem(t.itemId));
                    openChat(found);
                  } catch {
                    toast.error("No se pudo abrir esta conversación (puede que el artículo ya no exista)");
                  }
                }}
              >
                <div className="thread-avatar" style={t.itemImage ? { backgroundImage: `url(${t.itemImage})`, backgroundSize: "cover", backgroundPosition: "center" } : { background: PALETTE[t.itemTitle.length % PALETTE.length] }}>
                  {!t.itemImage && t.itemTitle[0]?.toUpperCase()}
                </div>
                <div className="thread-body">
                  <p className="thread-title">{t.itemTitle}{t.itemSold && <span className="thread-sold"> · Vendido</span>}</p>
                  <p className="thread-preview">{t.lastMessageIsMine ? "Tú: " : ""}{t.lastMessage}</p>
                </div>
                <div className="thread-meta">
                  <span className="notif-time">{timeAgoFromDate(t.lastMessageAt)}</span>
                  {t.unreadCount > 0 && <span className="notif-dot thread-unread-dot">{t.unreadCount}</span>}
                </div>
              </div>
            ))}
            </>}
          </div>
        </div>
      )}

      {showSettings && (
        <div className="overlay" onClick={() => setShowSettings(false)}>
          <div className="modal settings-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" aria-label="Cerrar" onClick={() => setShowSettings(false)}><X size={14} /></button>
            <p className="auth-title" style={{ marginBottom: 16 }}>Ajustes de cuenta</p>

            {!myEmailVerified && (
              <div className="email-unverified-banner">
                <p><FileWarning size={14} /> Tu email todavía no está verificado</p>
                <button onClick={handleResendVerification} disabled={resendingVerification}>
                  {resendingVerification ? "Enviando..." : "Reenviar correo de verificación"}
                </button>
              </div>
            )}

            <label>Nuevo email</label>
            <div className="input-icon"><Mail size={14} /><input placeholder={`Actual: ${username}`} value={newEmailInput} onChange={(e) => setNewEmailInput(e.target.value)} /></div>
            {newEmailInput.trim() && (
              <div className="input-icon"><Lock size={14} /><input type="password" placeholder="Tu contraseña actual, para confirmar" value={emailChangePassword} onChange={(e) => setEmailChangePassword(e.target.value)} /></div>
            )}

            <label>Nueva contraseña</label>
            <div className="input-icon"><Lock size={14} /><input type="password" placeholder="••••••••" value={newPasswordInput} onChange={(e) => setNewPasswordInput(e.target.value)} /></div>
            {newPasswordInput.trim() && (
              <div className="input-icon"><Lock size={14} /><input type="password" placeholder="Tu contraseña actual" value={currentPasswordInput} onChange={(e) => setCurrentPasswordInput(e.target.value)} /></div>
            )}

            <p className="settings-toggle-row">
              <span>Notificaciones de mensajes</span>
              <input
                type="checkbox"
                checked={messageAlerts}
                onChange={async (e) => {
                  const value = e.target.checked;
                  setMessageAlerts(value);
                  try {
                    await updateNotifPreference("messageAlerts", value);
                  } catch (err) {
                    setMessageAlerts(!value);
                    toast.error(err.message);
                  }
                }}
              />
            </p>
            <p className="settings-toggle-row">
              <span>Notificaciones de ofertas</span>
              <input
                type="checkbox"
                checked={offerAlerts}
                onChange={async (e) => {
                  const value = e.target.checked;
                  setOfferAlerts(value);
                  try {
                    await updateNotifPreference("offerAlerts", value);
                  } catch (err) {
                    setOfferAlerts(!value);
                    toast.error(err.message);
                  }
                }}
              />
            </p>
            <p className="settings-toggle-row">
              <span>Bajadas de precio en favoritos</span>
              <input
                type="checkbox"
                checked={priceDropAlerts}
                onChange={async (e) => {
                  const value = e.target.checked;
                  setPriceDropAlerts(value);
                  try {
                    await updateNotifPreference("priceDropAlerts", value);
                  } catch (err) {
                    setPriceDropAlerts(!value);
                    toast.error(err.message);
                  }
                }}
              />
            </p>

            <label>Privacidad</label>
            <div className="cookie-pref-row">
              <div>
                <p className="cookie-pref-current">Cookies: {cookieChoice === "accepted" ? "todas aceptadas" : "solo necesarias"}</p>
                <p className="cookie-pref-hint">Puedes cambiar tu elección cuando quieras.</p>
              </div>
              <button type="button" className="btn ghost" onClick={() => { setCookieChoice(null); localStorage.removeItem("reloop_cookie_consent"); }}>Cambiar</button>
            </div>
            <p className="settings-toggle-row">
              <span>Avisos y novedades de Ropelin</span>
              <input
                type="checkbox"
                checked={marketingOptIn}
                onChange={async (e) => {
                  const value = e.target.checked;
                  setMarketingOptIn(value);
                  try {
                    await updateMarketingOptIn(value);
                  } catch (err) {
                    setMarketingOptIn(!value);
                    toast.error(err.message);
                  }
                }}
              />
            </p>

            <label>Mi ubicación</label>
            <div className="location-box">
              <div>
                <p className="location-current">
                  <MapPin size={13} />
                  {myLocation ? (myLocation.city || "Ubicación guardada") : "Sin ubicación guardada"}
                </p>
                <p className="location-hint">Se usa para mostrarte artículos cerca de ti y quedar en persona sin envío.</p>
              </div>
              <button className="btn ghost" onClick={detectMyLocation} disabled={locatingMe}>
                {locatingMe ? "Detectando..." : myLocation ? "Actualizar" : "Detectar"}
              </button>
            </div>

            <div className="stripe-box">
              <p className="stripe-title"><Truck size={14} /> Dirección de envío (como vendedor)</p>
              <p className="stripe-status">Se usa para generar las etiquetas de envío cuando te compren algo por correo.</p>
              <label>Calle y número</label>
              <div className="input-icon"><input value={shippingStreetInput} onChange={(e) => setShippingStreetInput(e.target.value)} placeholder="Calle Ejemplo, 12, 3ºB" /></div>
              <label>Código postal</label>
              <div className="input-icon"><input value={shippingPostalInput} onChange={(e) => setShippingPostalInput(e.target.value)} placeholder="28001" /></div>
              <label>Teléfono de contacto</label>
              <div className="input-icon"><input value={shippingPhoneInput} onChange={(e) => setShippingPhoneInput(e.target.value)} placeholder="+34 600 000 000" /></div>
              <button className="stripe-connect-btn" onClick={handleSaveShippingAddress} disabled={savingShippingAddress}>
                {savingShippingAddress ? "Guardando..." : "Guardar dirección de envío"}
              </button>
            </div>

            <div className="stripe-box">
              <p className="stripe-title"><HandCoins size={14} /> Cobros como vendedor</p>
              {stripeStatus?.onboarded ? (
                <p className="stripe-status ok"><CheckCircle size={13} /> Cuenta activa, ya puedes recibir pagos</p>
              ) : (
                <>
                  <p className="stripe-status">Activa Stripe para poder cobrar tus ventas directamente en tu cuenta bancaria.</p>
                  <p className="stripe-status-note">Te llevará a Stripe — te pedirá tu cuenta bancaria y algún dato de identidad. Es normal, lo exige la ley para poder pagarte, y solo se hace una vez.</p>
                  <button className="stripe-connect-btn" onClick={handleConnectStripe}>Conectar con Stripe</button>
                </>
              )}
            </div>

            {sellerBalance && (sellerBalance.pendingTotal > 0 || sellerBalance.releasedTotal > 0) && (
              <div className="stripe-box">
                <p className="stripe-title"><HandCoins size={14} /> Tu saldo de ventas</p>
                <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
                  <div className="referral-balance-box" style={{ flex: 1 }}>
                    <div>
                      <p className="referral-balance-num">{sellerBalance.pendingTotal.toFixed(2)}€</p>
                      <p className="referral-balance-label">Retenido (por 48h de reclamación)</p>
                    </div>
                  </div>
                  <div className="referral-balance-box" style={{ flex: 1 }}>
                    <div>
                      <p className="referral-balance-num">{sellerBalance.releasedTotal.toFixed(2)}€</p>
                      <p className="referral-balance-label">Ya en tu cuenta</p>
                    </div>
                  </div>
                </div>
                {sellerBalance.pending.map((s) => (
                  <div key={s.id} style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", fontSize: 12 }}>
                    <span>{s.itemTitle}</span>
                    <span style={{ color: "var(--sub)" }}>
                      {Number(s.amount).toFixed(2)}€{s.releaseEstimate ? ` · libre el ${new Date(s.releaseEstimate).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}` : s.status === "disputed" ? " · en disputa" : " · en persona"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="stripe-box">
              <p className="stripe-title"><ShieldCheck size={14} /> Verificación de identidad</p>
              {myIdVerification.status === "approved" ? (
                <p className="stripe-status ok"><CheckCircle size={13} /> Identidad verificada</p>
              ) : myIdVerification.status === "pending" ? (
                <p className="stripe-status">Tu documento está en revisión, te avisaremos en cuanto lo veamos.</p>
              ) : (
                <>
                  <p className="stripe-status">Verifica tu identidad para desbloquear compras de más valor desde el primer día y dar más confianza al vender.</p>
                  {myIdVerification.status === "rejected" && (
                    <p style={{ color: "var(--accent)", fontSize: 12 }}>No se pudo verificar la última vez — puedes volver a intentarlo con otra foto.</p>
                  )}
                  <label className="dispute-evidence-upload">
                    <input type="file" accept="image/*" onChange={handleUploadIdVerification} style={{ display: "none" }} />
                    {myIdVerification.uploading ? "Subiendo…" : <><Camera size={14} /> Subir foto de un documento (DNI, pasaporte...)</>}
                  </label>
                </>
              )}
            </div>

            {blockedUsernames.size > 0 && (
              <div className="stripe-box">
                <p className="stripe-title"><Shield size={14} /> Usuarios bloqueados</p>
                {Array.from(blockedUsernames).map((u) => (
                  <div key={u} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "6px 0" }}>
                    <span style={{ fontSize: 13 }}>@{u}</span>
                    <button className="checkout-locker-change" onClick={() => toggleBlock(u)}>Desbloquear</button>
                  </div>
                ))}
              </div>
            )}

            <button className="submit-btn" onClick={handleSaveAccountSettings} disabled={savingAccountSettings}>
              {savingAccountSettings ? "Guardando..." : "Guardar cambios"}
            </button>
            <button className="logout-btn" onClick={() => { apiLogout(); setLoggedIn(false); setUsername(""); setUserRole("user"); setShowSettings(false); toast("Sesión cerrada"); }}>Cerrar sesión</button>

            <button className="logout-btn" style={{ marginTop: 10 }} onClick={async () => { try { await exportMyData(); toast.success("Descargando tus datos..."); } catch (err) { toast.error(err.message); } }}>Descargar mis datos</button>

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
            <button className="close-btn" aria-label="Cerrar" onClick={() => { setShowCheckout(false); setCheckoutError(null); }}><X size={14} /></button>
            <p className="auth-title">Confirmar compra</p>
            <p className="auth-subtitle" style={{ marginBottom: 18 }}>{openItem.title}</p>

            <p className="checkout-section-label">¿A dónde lo enviamos?</p>
            <div className="locker-search-row">
              <div className="input-icon" style={{ flex: 1, marginBottom: 0 }}>
                <input placeholder="Código postal" value={checkoutPostalCode} onChange={(e) => setCheckoutPostalCode(e.target.value)} />
              </div>
              <div className="input-icon" style={{ flex: 1, marginBottom: 0 }}>
                <input placeholder="Ciudad" value={checkoutCity} onChange={(e) => setCheckoutCity(e.target.value)} />
              </div>
              <button className="btn primary" onClick={handleFetchCheckoutRates} disabled={checkoutRatesLoading}>
                {checkoutRatesLoading ? "..." : "Ver precios"}
              </button>
            </div>

            {checkoutRatesLoading && (
              <div className="sheet-loading">
                <RefreshCw size={18} className="spin" />
                <p>Consultando tarifas disponibles…</p>
              </div>
            )}

            {!checkoutRatesLoading && checkoutRates.length > 0 && (() => {
              const chosen = checkoutRates.find((r) => r.rateId === checkoutSelectedRateId);
              // En vez de enseñar cada tarifa suelta (varias de "Correos", varias de
              // "Correos_express"...), agrupamos por transportista y mostramos solo la más barata
              // de cada uno por defecto — así la lista no se hace interminable con opciones muy
              // parecidas. El resto queda a un toque de distancia con "Ver X opciones más".
              const cheapestByProvider = {};
              checkoutRates.forEach((r) => {
                if (!cheapestByProvider[r.provider] || r.amount < cheapestByProvider[r.provider].amount) {
                  cheapestByProvider[r.provider] = r;
                }
              });
              const mainRates = Object.values(cheapestByProvider).sort((a, b) => a.amount - b.amount);
              const extraRates = checkoutRates.filter((r) => !mainRates.includes(r));
              const visibleRates = showAllShippingRates ? checkoutRates : mainRates;
              return (
                <>
                  <div className="sheet-rate-list" style={{ marginBottom: 10 }}>
                    {visibleRates.map((r) => {
                      const selected = checkoutSelectedRateId === r.rateId;
                      return (
                        <button
                          key={r.rateId}
                          className={"sheet-rate-card" + (selected ? " selected" : "")}
                          onClick={() => setCheckoutSelectedRateId(r.rateId)}
                        >
                          <span className="sheet-rate-icon"><Truck size={16} /></span>
                          <span className="sheet-rate-info">
                            <span className="sheet-rate-provider">{r.provider}</span>
                            <span className="sheet-rate-meta">
                              {r.requiresServicePoint
                                ? "Recogida en punto InPost"
                                : <>{r.servicelevel ? `${r.servicelevel} · ` : ""}{r.estimatedDays != null ? `${r.estimatedDays} día${r.estimatedDays === 1 ? "" : "s"}` : "Plazo no disponible"}</>
                              }
                            </span>
                          </span>
                          <span className="sheet-rate-price">{Number(r.amount).toFixed(2)}€</span>
                          <span className={"sheet-rate-radio" + (selected ? " on" : "")} />
                        </button>
                      );

                    })}
                  </div>

                  {!showAllShippingRates && extraRates.length > 0 && (
                    <button type="button" className="checkout-more-rates-btn" onClick={() => setShowAllShippingRates(true)}>
                      Ver {extraRates.length} opción{extraRates.length === 1 ? "" : "es"} más
                    </button>
                  )}

                  {chosen?.requiresServicePoint && (
                    checkoutServicePoint ? (
                      <div className="checkout-locker-chosen">
                        <div>
                          <p className="checkout-locker-name">📍 {checkoutServicePoint.name}</p>
                          <p className="checkout-locker-address">{checkoutServicePoint.address}</p>
                        </div>
                        <button className="checkout-locker-change" onClick={() => setLockerPicker({ transactionId: "precheckout", postalCode: checkoutPostalCode, city: checkoutCity, points: [], loading: false, searched: false, center: null })}>Cambiar</button>
                      </div>
                    ) : (
                      <button
                        className="order-action-btn secondary"
                        style={{ marginBottom: 14 }}
                        onClick={() => setLockerPicker({ transactionId: "precheckout", postalCode: checkoutPostalCode, city: checkoutCity, points: [], loading: false, searched: false, center: null })}
                      >
                        <MapPin size={13} /> Elegir tu punto de recogida InPost
                      </button>
                    )
                  )}
                </>
              );
            })()}

            {!checkoutRatesLoading && checkoutRates.length > 0 && (() => {
              const chosen = checkoutRates.find((r) => r.rateId === checkoutSelectedRateId);
              const shippingAmount = chosen ? Number(chosen.amount) : 0;
              const itemTotal = Number(openItem.price) * (1 + platformSettings.commissionPercent / 100);
              const total = itemTotal + shippingAmount;
              return (
                <>
                  <div className="checkout-summary">
                    <div className="checkout-row"><span>Precio artículo</span><span>{Number(openItem.price).toFixed(2)}€</span></div>
                    <div className="checkout-row">
                      <span>Tarifa Ropelin*</span>
                      <span>{(Number(openItem.price) * (platformSettings.commissionPercent / 100)).toFixed(2)}€</span>
                    </div>
                    <div className="checkout-row"><span>Envío{chosen ? ` (${chosen.provider})` : ""}</span><span>{shippingAmount.toFixed(2)}€</span></div>
                    <div className="checkout-row total"><span>Total a pagar</span><span>{total.toFixed(2)}€</span></div>
                  </div>
                  <p className="checkout-note">*Cubre la protección de tu compra: si el artículo no llega o no es como se describía, te ayudamos a resolverlo. El vendedor recibe el precio íntegro del artículo.</p>
                  <p className="checkout-note">Pago seguro procesado por Stripe.</p>

                  {checkoutError && <p style={{ color: "var(--accent)", fontSize: 12, margin: "10px 0 0" }}>{checkoutError}</p>}

                  <button className="submit-btn" onClick={confirmCheckout} disabled={!chosen}>Pagar {total.toFixed(2)}€ con Stripe</button>
                </>
              );
            })()}

            {!checkoutRatesLoading && checkoutRates.length === 0 && checkoutError && (
              <p style={{ color: "var(--accent)", fontSize: 12, margin: "10px 0 0" }}>{checkoutError}</p>
            )}
          </div>
        </div>
      )}


      {showAdminPanel && (() => {
        const adminSectionContentEl = adminContentEl();

        const sectionTitles = { users: "Usuarios", stats: "Ganancias", disputes: "Disputas", verifications: "Verificaciones", reports: "Denuncias", support: "Soporte", broadcast: "Notificaciones", settings: "Configuración", seo: "SEO", logs: "Historial" };

        const adminMenuListEl = (
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
            {isAdmin && (
              <button className="admin-menu-item" onClick={() => loadAdminTab("verifications")}>
                <span className="admin-menu-icon"><ShieldCheck size={17} /></span>
                <span className="admin-menu-label">Verificaciones</span>
                {adminVerifications.length > 0 && <span className="admin-menu-badge">{adminVerifications.length}</span>}
                <span className="admin-menu-arrow">›</span>
              </button>
            )}
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
              <button className="admin-menu-item" onClick={() => loadAdminTab("broadcast")}>
                <span className="admin-menu-icon"><Send size={17} /></span>
                <span className="admin-menu-label">Notificaciones</span>
                <span className="admin-menu-arrow">›</span>
              </button>
            )}
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
        );

        return numCols >= 3 ? (
          <div className="overlay overlay-top-most" onClick={() => setShowAdminPanel(false)}>
            <div className="modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" aria-label="Cerrar" onClick={() => setShowAdminPanel(false)}><X size={14} /></button>
              <div className="profile-desktop-flex has-sidebar">
                {adminSidebarEl(adminSection)}
                <div className="profile-desktop-content">
                  <p className="auth-title" style={{ marginBottom: 14 }}>{sectionTitles[adminSection] || "Panel de administración"}</p>
                  {adminSectionContentEl}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="overlay" onClick={() => setShowAdminPanel(false)}>
            <div className="modal admin-modal" onClick={(e) => e.stopPropagation()}>
              <button className="close-btn" aria-label="Cerrar" onClick={() => setShowAdminPanel(false)}><X size={14} /></button>

              {adminSection === null ? (
                <>
                  <div className="league-header">
                    <ShieldCheck size={20} color="var(--sub)" />
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

                  {adminMenuListEl}
                </>
              ) : (
                <>
                  <div className="league-header">
                    <button className="admin-back-btn" onClick={() => setAdminSection(null)}><ArrowLeft size={16} /></button>
                    <p className="auth-title" style={{ margin: 0 }}>{sectionTitles[adminSection]}</p>
                  </div>
                  {adminSectionContentEl}
                </>
              )}
            </div>
          </div>
        );
      })()}

      {banningUser && (
        <div className="overlay" onClick={() => setBanningUser(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 340 }}>
            <button className="close-btn" aria-label="Cerrar" onClick={() => setBanningUser(null)}><X size={14} /></button>
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
            <button className="close-btn" aria-label="Cerrar" onClick={() => setEditingAdminItem(null)}><X size={14} /></button>
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
            <button className="close-btn" aria-label="Cerrar" onClick={() => setShowEditProfile(false)}><X size={14} /></button>
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

      {lockerPicker && (
        <div className="overlay sheet-overlay overlay-top-most" onClick={() => setLockerPicker(null)}>
          <div className="sheet-modal" onClick={(e) => e.stopPropagation()}>
            <div className="sheet-handle" />
            <div className="sheet-header">
              <p className="sheet-title">Elige tu punto de recogida</p>
              <button className="close-btn" aria-label="Cerrar" onClick={() => setLockerPicker(null)}><X size={14} /></button>
            </div>

            <button className="locker-location-btn" onClick={handleUseMyLocation} disabled={lockerPicker.loading}>
              <MapPin size={13} /> Usar mi ubicación actual
            </button>
            <p className="locker-or-divider">o busca por dirección</p>

            <div className="locker-search-row">
              <div className="input-icon" style={{ flex: 1, marginBottom: 0 }}>
                <input placeholder="Código postal" value={lockerPicker.postalCode} onChange={(e) => setLockerPicker((prev) => ({ ...prev, postalCode: e.target.value }))} />
              </div>
              <div className="input-icon" style={{ flex: 1, marginBottom: 0 }}>
                <input placeholder="Ciudad" value={lockerPicker.city} onChange={(e) => setLockerPicker((prev) => ({ ...prev, city: e.target.value }))} />
              </div>
              <button className="btn primary" onClick={handleSearchLockers} disabled={lockerPicker.loading}>
                {lockerPicker.loading ? "..." : "Buscar"}
              </button>
            </div>

            {lockerPicker.loading && (
              <div className="sheet-loading">
                <RefreshCw size={18} className="spin" />
                <p>Buscando taquillas cercanas…</p>
              </div>
            )}

            {!lockerPicker.loading && lockerPicker.searched && lockerPicker.points.length === 0 && (
              <p className="order-hint" style={{ padding: "20px 0" }}>No se encontraron puntos de recogida cerca. Prueba con otra ubicación.</p>
            )}

            {!lockerPicker.loading && lockerPicker.center && lockerPicker.points.length > 0 && (
              <div ref={lockerMapRef} className="locker-map" />
            )}

            {!lockerPicker.loading && lockerPicker.points.length > 0 && (
              <div className="sheet-rate-list">
                {lockerPicker.points.map((p) => (
                  <button key={p.id} className="sheet-rate-card" onClick={() => handleChooseLocker(p)}>
                    <span className="sheet-rate-icon"><MapPin size={16} /></span>
                    <span className="sheet-rate-info">
                      <span className="sheet-rate-provider">{p.name}</span>
                      <span className="sheet-rate-meta">{p.address}</span>
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {showReportForm && (
        <div className="overlay" onClick={() => setShowReportForm(null)}>
          <div className="modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 340 }}>
            <button className="close-btn" aria-label="Cerrar" onClick={() => setShowReportForm(null)}><X size={14} /></button>
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
        <div className="overlay chat-overlay" onClick={() => setShowChat(false)}>
          <div className="modal chat-modal" onClick={(e) => e.stopPropagation()}>

            <div className="chat-item-strip" onClick={() => { setShowChat(false); viewItem(chatItem); }}>
              <div className="chat-item-thumb" style={{ backgroundImage: `url(${(chatItem.images && chatItem.images[0]) || chatItem.photo})` }} />
              <div className="chat-item-strip-info">
                <p className="chat-item-strip-title">{chatItem.title}</p>
                <p className="chat-item-strip-price">{chatItem.price}€</p>
              </div>
              <span className="chat-item-strip-link">Ver artículo ›</span>
            </div>

            <div className="chat-main-col">
            <div className="chat-header">
              <button className="chat-back-btn" onClick={() => { setShowChat(false); viewItem(chatItem); }}><ArrowLeft size={18} /></button>
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

            <div className="chat-thread">
              <div className="chat-safety-banner">
                <ShieldCheck size={14} />
                <span>Compra y paga siempre dentro de Ropelin. No compartas datos bancarios ni pagues fuera de la app.</span>
              </div>
              {(chatThreads[chatItem.id] || []).length === 0 && (
                <p className="empty-tab">Aún no hay mensajes. Escribe el primero.</p>
              )}
              {(chatThreads[chatItem.id] || []).map((m, idx) => {
                const mine = m.sender.username === username;
                const prev = (chatThreads[chatItem.id] || [])[idx - 1];
                const grouped = prev && prev.sender.username === m.sender.username;
                return (
                  <div key={m.id} className={"chat-msg-row " + (mine ? "me" : "seller") + (grouped ? " grouped" : "")}>
                    {m.imageUrl ? (
                      <a href={m.imageUrl} target="_blank" rel="noopener noreferrer" className="chat-photo-bubble">
                        <img src={m.imageUrl} alt="Foto enviada en el chat" />
                      </a>
                    ) : (
                      <div className={"chat-bubble " + (mine ? "me" : "seller") + (m.offerAmount ? " offer-bubble" : "")}>
                        {m.offerAmount ? <><HandCoins size={13} style={{ marginRight: 5, verticalAlign: -2 }} />Oferta: {Number(m.offerAmount).toFixed(2)}€</> : m.content}
                      </div>
                    )}
                    {m.offerAmount && (
                      <div className="offer-actions">
                        {m.offerStatus === "pending" && !mine && (
                          <>
                            <button className="offer-resp-btn accept" disabled={respondingOfferId === m.id} onClick={() => handleOfferAction(chatItem.id, m.id, "accept")}>Aceptar</button>
                            <button className="offer-resp-btn reject" disabled={respondingOfferId === m.id} onClick={() => handleOfferAction(chatItem.id, m.id, "reject")}>Rechazar</button>
                            <div className="offer-counter-row">
                              <input
                                type="number" min="1" placeholder="Contraoferta €"
                                value={counterDrafts[m.id] || ""}
                                onChange={(e) => setCounterDrafts((prev) => ({ ...prev, [m.id]: e.target.value }))}
                              />
                              <button className="offer-resp-btn counter" disabled={respondingOfferId === m.id} onClick={() => handleOfferAction(chatItem.id, m.id, "counter")}>Contraofertar</button>
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
                          <button className="offer-resp-btn accept" onClick={() => payAcceptedOffer(chatItem.id)}>Pagar {Number(m.offerAmount).toFixed(2)}€</button>
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

            <div className="chat-quick-replies">
              {(chatItem.seller === username
                ? ["Sí, sigue disponible", "Puedo enviarlo por correo", "¿Prefieres en persona?", "¡Gracias por tu interés!"]
                : ["¿Sigue disponible?", "¿Aceptas envío?", "¿Tienes más fotos?", "¿Quedamos en persona?"]
              ).map((phrase) => (
                <button key={phrase} type="button" className="chat-quick-reply-chip" onClick={() => setChatInput(phrase)}>{phrase}</button>
              ))}
            </div>

            <form className="chat-input-row" onSubmit={sendChatMessage}>
              <input type="file" accept="image/*" id="chat-photo-input" style={{ display: "none" }} onChange={(e) => { if (e.target.files[0]) handleSendChatPhoto(e.target.files[0]); e.target.value = ""; }} />
              <button type="button" className="chat-attach-btn" disabled={sendingChatPhoto} onClick={() => document.getElementById("chat-photo-input").click()}>
                <ImagePlus size={17} />
              </button>
              <input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Escribe un mensaje..."
              />
              <button type="submit" className="chat-send-btn" disabled={!chatInput.trim()}><Send size={15} /></button>
            </form>
            </div>
          </div>
        </div>
      )}

      {showOffer && openItem && (
        <div className="overlay overlay-top" onClick={() => setShowOffer(false)}>
          <div className="modal offer-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" aria-label="Cerrar" onClick={() => setShowOffer(false)}><X size={14} /></button>
            {offerSent ? (
              <div className="offer-sent">
                <HandCoins size={26} color="var(--ok)" />
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
