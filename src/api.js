const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000/api";

function authHeaders() {
  const token = localStorage.getItem("reloop_token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function fetchItems({ query, category, size, minPrice, maxPrice, sortBy, lat, lng, maxDistanceKm } = {}) {
  const params = new URLSearchParams();
  if (query) params.set("query", query);
  if (category && category !== "Todo") params.set("category", category);
  if (size) params.set("size", size);
  if (minPrice) params.set("minPrice", minPrice);
  if (maxPrice) params.set("maxPrice", maxPrice);
  if (sortBy) params.set("sortBy", sortBy);
  if (lat) params.set("lat", lat);
  if (lng) params.set("lng", lng);
  if (maxDistanceKm) params.set("maxDistanceKm", maxDistanceKm);

  const res = await fetch(`${API_URL}/items?${params}`);
  if (!res.ok) throw new Error("No se pudieron cargar los artículos");
  return res.json();
}

export async function searchByImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_URL}/items/search-by-image`, {
    method: "POST",
    headers: { ...authHeaders() },
    body: formData,
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo analizar la foto");
  return res.json();
}

export async function fetchItem(id) {
  const res = await fetch(`${API_URL}/items/${id}`);
  if (!res.ok) throw new Error("Artículo no encontrado");
  return res.json();
}

export async function createItem(data) {
  const res = await fetch(`${API_URL}/items`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Error al publicar");
  return res.json();
}

export async function login(email, password) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Error al iniciar sesión");
  const data = await res.json();
  localStorage.setItem("reloop_token", data.token);
  localStorage.setItem("reloop_username", data.user.username);
  localStorage.setItem("reloop_role", data.user.role || "user");
  return data.user;
}

export async function loginWithGoogle(credential) {
  const res = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ credential }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Error al iniciar sesión con Google");
  const data = await res.json();
  localStorage.setItem("reloop_token", data.token);
  localStorage.setItem("reloop_username", data.user.username);
  localStorage.setItem("reloop_role", data.user.role || "user");
  return data;
}

export async function register(email, password, username, city, ref) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, username, city, ref }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Error al registrarse");
  const data = await res.json();
  localStorage.setItem("reloop_token", data.token);
  localStorage.setItem("reloop_username", data.user.username);
  localStorage.setItem("reloop_role", data.user.role || "user");
  return data.user;
}

export async function updateItem(id, data) {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Error al actualizar");
  return res.json();
}

export async function deleteItem(id) {
  const res = await fetch(`${API_URL}/items/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok && res.status !== 204) throw new Error("Error al eliminar");
  return true;
}

export async function fetchFavorites() {
  const res = await fetch(`${API_URL}/favorites`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error("No se pudieron cargar los favoritos");
  return res.json();
}

export async function addFavorite(itemId) {
  const res = await fetch(`${API_URL}/favorites/${itemId}`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!res.ok && res.status !== 409) throw new Error("Error al guardar favorito");
  return true;
}

export async function removeFavorite(itemId) {
  const res = await fetch(`${API_URL}/favorites/${itemId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok && res.status !== 204) throw new Error("Error al quitar favorito");
  return true;
}

export async function uploadImage(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`${API_URL}/uploads`, {
    method: "POST",
    headers: { ...authHeaders() }, // OJO: no poner Content-Type, el navegador lo define solo con el boundary correcto
    body: formData,
  });
  if (!res.ok) throw new Error((await res.json()).error || "Error al subir la imagen");
  const data = await res.json();
  return data.url;
}

export async function fetchProfile(username) {
  const res = await fetch(`${API_URL}/users/${username}`);
  if (!res.ok) throw new Error("Perfil no encontrado");
  return res.json();
}

export async function updateMyLocation({ city, latitude, longitude, bio, avatarUrl, coverUrl, firstName, lastName, shippingPhone } = {}) {
  const res = await fetch(`${API_URL}/users/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ city, latitude, longitude, bio, avatarUrl, coverUrl, firstName, lastName, shippingPhone }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo guardar la ubicación");
  return res.json();
}

export async function updateShippingAddress({ shippingStreet, shippingPostalCode, shippingPhone } = {}) {
  const res = await fetch(`${API_URL}/users/me`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ shippingStreet, shippingPostalCode, shippingPhone }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo guardar la dirección");
  return res.json();
}

export async function deleteMyAccount() {
  const res = await fetch(`${API_URL}/users/me`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo eliminar la cuenta");
  return res.json();
}

export async function subscribeNewsletter(email) {
  const res = await fetch(`${API_URL}/newsletter/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo completar la suscripción");
  return res.json();
}

export async function fetchItemQuestions(itemId) {
  const res = await fetch(`${API_URL}/items/${itemId}/questions`);
  if (!res.ok) throw new Error("No se pudieron cargar las preguntas");
  return res.json();
}

export async function askItemQuestion(itemId, question) {
  const res = await fetch(`${API_URL}/items/${itemId}/questions`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ question }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo enviar la pregunta");
  return res.json();
}

export async function answerItemQuestion(itemId, questionId, answer) {
  const res = await fetch(`${API_URL}/items/${itemId}/questions/${questionId}/answer`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ answer }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo enviar la respuesta");
  return res.json();
}

export async function deleteItemQuestion(itemId, questionId) {
  const res = await fetch(`${API_URL}/items/${itemId}/questions/${questionId}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo borrar la pregunta");
  return res.json();
}

export async function markItemSold(itemId) {
  const res = await fetch(`${API_URL}/items/${itemId}/mark-sold`, {
    method: "PATCH",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo marcar como vendido");
  return res.json();
}

export async function fetchItemConversations(itemId) {
  const res = await fetch(`${API_URL}/items/${itemId}/conversations`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error("No se pudieron cargar las conversaciones");
  return res.json();
}

export async function notifySaleBuyer(itemId, buyerUsername) {
  const res = await fetch(`${API_URL}/items/${itemId}/notify-buyer`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ buyerUsername }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo avisar al comprador");
  return res.json();
}

export async function respondToOffer(itemId, messageId, action, counterAmount) {
  const res = await fetch(`${API_URL}/messages/${itemId}/offer/${messageId}/respond`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ action, counterAmount }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo responder a la oferta");
  return res.json();
}

export async function fetchMyFollowing() {
  const res = await fetch(`${API_URL}/users/me/following`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error("No se pudo cargar a quién sigues");
  return res.json();
}

export async function fetchLeague() {
  const res = await fetch(`${API_URL}/users/league`);
  if (!res.ok) throw new Error("No se pudo cargar el ranking");
  return res.json();
}

export async function followUser(username) {
  const res = await fetch(`${API_URL}/users/${username}/follow`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo seguir a este usuario");
  return res.json();
}

export async function unfollowUser(username) {
  const res = await fetch(`${API_URL}/users/${username}/follow`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo dejar de seguir");
  return res.json();
}

// --- Stripe Connect (cobros del vendedor) ---

export async function connectStripe() {
  const res = await fetch(`${API_URL}/stripe/connect`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error((await res.json()).error || "Error al conectar con Stripe");
  const data = await res.json();
  return data.url; // redirige al usuario a este enlace para completar el onboarding
}

export async function fetchStripeStatus() {
  const res = await fetch(`${API_URL}/stripe/connect/status`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("No se pudo comprobar el estado de Stripe");
  return res.json(); // { connected, onboarded }
}

// --- Checkout de compra ---

export async function startCheckout(itemId) {
  const res = await fetch(`${API_URL}/stripe/checkout`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ itemId }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo iniciar el pago");
  const data = await res.json();
  return data.url; // redirige al usuario a Stripe Checkout
}

export async function boostItem(itemId) {
  const res = await fetch(`${API_URL}/stripe/boost/${itemId}`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo iniciar el pago del destacado");
  return res.json(); // { url } si es de pago, { freeBoostUsed: true } si se usó un destacado gratis
}

// --- Pedidos (compras/ventas) ---

export async function fetchTransactions() {
  const res = await fetch(`${API_URL}/transactions`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error("No se pudieron cargar tus pedidos");
  return res.json(); // { purchases, sales }
}

export async function fetchShippingRates(transactionId) {
  const res = await fetch(`${API_URL}/shipments/${transactionId}/rates`, {
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudieron consultar las tarifas de envío");
  return res.json(); // { rates: [{ rateId, provider, servicelevel, amount, currency, estimatedDays }] }
}

export async function createShipmentLabel(transactionId, rateId, provider) {
  const res = await fetch(`${API_URL}/shipments/${transactionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ rateId, provider }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo generar la etiqueta");
  return res.json();
}

export async function confirmReceived(transactionId) {
  const res = await fetch(`${API_URL}/shipments/${transactionId}/received`, {
    method: "PATCH",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo confirmar la recepción");
  return res.json();
}

export async function completeInPerson(transactionId) {
  const res = await fetch(`${API_URL}/transactions/${transactionId}/complete-in-person`, {
    method: "PATCH",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo confirmar la entrega en persona");
  return res.json();
}

export async function submitReview(transactionId, rating, comment) {
  const res = await fetch(`${API_URL}/reviews`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ transactionId, rating, comment }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo enviar la valoración");
  return res.json();
}

export async function fetchReviews(username) {
  const res = await fetch(`${API_URL}/reviews/${username}`);
  if (!res.ok) throw new Error("No se pudieron cargar las valoraciones");
  return res.json();
}

export function logout() {
  localStorage.removeItem("reloop_token");
  localStorage.removeItem("reloop_username");
  localStorage.removeItem("reloop_role");
}

export function isLoggedIn() {
  return !!localStorage.getItem("reloop_token");
}

export function getUsername() {
  return localStorage.getItem("reloop_username") || "";
}

export function getRole() {
  return localStorage.getItem("reloop_role") || "user";
}

export async function fetchAdminUsers({ search, verified, stripeConnected, page = 1 } = {}) {
  const params = new URLSearchParams();
  if (search) params.set("search", search);
  if (verified !== undefined && verified !== "") params.set("verified", verified);
  if (stripeConnected !== undefined && stripeConnected !== "") params.set("stripeConnected", stripeConnected);
  params.set("page", page);
  const res = await fetch(`${API_URL}/admin/users?${params.toString()}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo cargar la lista de usuarios");
  return res.json();
}

export async function changeUserRole(userId, role) {
  const res = await fetch(`${API_URL}/admin/users/${userId}/role`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ role }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo cambiar el rol");
  return res.json();
}

export async function adminDeleteItem(id, reason) {
  const res = await fetch(`${API_URL}/items/${id}/admin`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo eliminar el artículo");
  return res.json();
}

export async function banUser(userId, reason) {
  const res = await fetch(`${API_URL}/admin/users/${userId}/ban`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo suspender la cuenta");
  return res.json();
}

export async function unbanUser(userId) {
  const res = await fetch(`${API_URL}/admin/users/${userId}/unban`, {
    method: "PATCH",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo reactivar la cuenta");
  return res.json();
}

export async function fetchAdminReports(status) {
  const query = status ? `?status=${status}` : "";
  const res = await fetch(`${API_URL}/admin/reports${query}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudieron cargar las denuncias");
  return res.json();
}

export async function resolveReport(id) {
  const res = await fetch(`${API_URL}/admin/reports/${id}/resolve`, {
    method: "PATCH",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo actualizar la denuncia");
  return res.json();
}

export async function fetchAdminLogs() {
  const res = await fetch(`${API_URL}/admin/logs`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo cargar el historial");
  return res.json();
}

export async function fetchAdminTop() {
  const res = await fetch(`${API_URL}/admin/top`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo cargar el ranking");
  return res.json();
}

export async function fetchAdminTimeseries() {
  const res = await fetch(`${API_URL}/admin/stats/timeseries`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo cargar la evolución de ganancias");
  return res.json();
}

export async function submitReport(targetType, payload, reason) {
  const body =
    targetType === "item" ? { targetType, itemId: payload, reason } :
    targetType === "question" ? { targetType, questionId: payload, reason } :
    { targetType, reportedUsername: payload, reason };
  const res = await fetch(`${API_URL}/reports`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo enviar la denuncia");
  return res.json();
}

export async function submitSupportMessage(subject, message) {
  const res = await fetch(`${API_URL}/support`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ subject, message }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo enviar el mensaje");
  return res.json();
}

export async function fetchMySupportMessages() {
  const res = await fetch(`${API_URL}/support/mine`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudieron cargar tus mensajes");
  return res.json();
}

export async function fetchAdminSupport(status) {
  const query = status ? `?status=${status}` : "";
  const res = await fetch(`${API_URL}/admin/support${query}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudieron cargar los mensajes de soporte");
  return res.json();
}

export async function replySupportMessage(id, reply) {
  const res = await fetch(`${API_URL}/admin/support/${id}/reply`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ reply }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo enviar la respuesta");
  return res.json();
}

export async function fetchPublicSettings() {
  const res = await fetch(`${API_URL}/settings`);
  if (!res.ok) throw new Error("No se pudo cargar la configuración");
  return res.json();
}

export async function fetchAdminSettings() {
  const res = await fetch(`${API_URL}/admin/settings`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo cargar la configuración");
  return res.json();
}

export async function updateAdminSettings(data) {
  const res = await fetch(`${API_URL}/admin/settings`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo guardar la configuración");
  return res.json();
}

export async function adminEditItem(itemId, data) {
  const res = await fetch(`${API_URL}/items/${itemId}/admin-edit`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo editar el artículo");
  return res.json();
}

async function downloadCsv(path, filename) {
  const res = await fetch(`${API_URL}${path}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error("No se pudo generar el archivo");
  const blob = await res.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
}

export function exportUsersCsv() {
  return downloadCsv("/admin/export/users", "usuarios_jolvo.csv");
}

export function exportTransactionsCsv() {
  return downloadCsv("/admin/export/transactions", "ventas_jolvo.csv");
}
export async function fetchAdminStats() {
  const res = await fetch(`${API_URL}/admin/stats`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudieron cargar las estadísticas");
  return res.json();
}

export async function fetchAdminDisputes() {
  const res = await fetch(`${API_URL}/admin/disputes`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudieron cargar las disputas");
  return res.json();
}

export async function refundTransaction(transactionId) {
  const res = await fetch(`${API_URL}/stripe/refund/${transactionId}`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo procesar el reembolso");
  return res.json();
}

// --- Recuperar / restablecer contraseña, verificación de email ---

export async function forgotPassword(email) {
  const res = await fetch(`${API_URL}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Error al solicitar recuperación");
  return res.json();
}

export async function resetPassword(token, newPassword) {
  const res = await fetch(`${API_URL}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, newPassword }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "Error al restablecer la contraseña");
  return res.json();
}

export async function verifyEmail(token) {
  const res = await fetch(`${API_URL}/auth/verify-email?token=${token}`);
  if (!res.ok) throw new Error((await res.json()).error || "Enlace no válido");
  return res.json();
}

export async function resendVerification() {
  const res = await fetch(`${API_URL}/auth/resend-verification`, {
    method: "POST",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo reenviar el email");
  return res.json();
}

export async function changePassword(currentPassword, newPassword) {
  const res = await fetch(`${API_URL}/auth/me/password`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ currentPassword, newPassword }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo cambiar la contraseña");
  return res.json();
}

export async function changeEmail(newEmail, password) {
  const res = await fetch(`${API_URL}/auth/me/email`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ newEmail, password }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo cambiar el email");
  return res.json();
}

// --- Chat real ---

export async function fetchChatMessages(itemId) {
  const res = await fetch(`${API_URL}/messages/${itemId}`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error("No se pudo cargar la conversación");
  return res.json();
}

export async function sendChatMessage(itemId, content, offerAmount) {
  const res = await fetch(`${API_URL}/messages/${itemId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ content, offerAmount }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo enviar el mensaje");
  return res.json();
}

// --- Notificaciones reales ---

export async function fetchNotifications() {
  const res = await fetch(`${API_URL}/notifications`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error("No se pudieron cargar las notificaciones");
  return res.json();
}

export async function markAllNotificationsRead() {
  const res = await fetch(`${API_URL}/notifications/read-all`, {
    method: "PATCH",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error("No se pudo actualizar");
  return res.json();
}

// --- Disputas / reembolsos ---

export async function disputeTransaction(transactionId, reason) {
  const res = await fetch(`${API_URL}/transactions/${transactionId}/dispute`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo abrir la disputa");
  return res.json();
}

// --- Búsquedas guardadas ---

export async function fetchSavedSearches() {
  const res = await fetch(`${API_URL}/saved-searches`, { headers: { ...authHeaders() } });
  if (!res.ok) throw new Error("No se pudieron cargar tus búsquedas guardadas");
  return res.json();
}

export async function saveSearch(query, category) {
  const res = await fetch(`${API_URL}/saved-searches`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ query, category }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo guardar la búsqueda");
  return res.json();
}

export async function deleteSavedSearch(id) {
  const res = await fetch(`${API_URL}/saved-searches/${id}`, {
    method: "DELETE",
    headers: { ...authHeaders() },
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo borrar la búsqueda");
  return res.json();
}

// --- Notificaciones push ---

export async function fetchPushPublicKey() {
  const res = await fetch(`${API_URL}/push/public-key`);
  if (!res.ok) throw new Error((await res.json()).error || "Las notificaciones push no están disponibles");
  const data = await res.json();
  return data.publicKey;
}

export async function subscribeToPush(subscription) {
  const res = await fetch(`${API_URL}/push/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify(subscription),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo activar las notificaciones");
  return res.json();
}

export async function unsubscribeFromPush(endpoint) {
  const res = await fetch(`${API_URL}/push/unsubscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders() },
    body: JSON.stringify({ endpoint }),
  });
  if (!res.ok) throw new Error((await res.json()).error || "No se pudo desactivar las notificaciones");
  return res.json();
}
