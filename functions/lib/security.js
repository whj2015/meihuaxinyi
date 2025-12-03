
// 文本编码器
const enc = new TextEncoder();
const dec = new TextDecoder();

// --- 1. 辅助工具 ---
function base64UrlEncode(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function base64UrlDecode(str) {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) str += '=';
  return atob(str);
}

function bufferToHex(buffer) {
  return [...new Uint8Array(buffer)].map(x => x.toString(16).padStart(2, '0')).join('');
}

function hexToBuffer(hex) {
  const tokens = hex.match(/.{1,2}/g);
  return new Uint8Array(tokens.map(t => parseInt(t, 16)));
}

// --- 2. 密码哈希 (PBKDF2) ---
export async function hashPassword(password, saltHex = null) {
  const salt = saltHex ? hexToBuffer(saltHex) : crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey("raw", enc.encode(password), { name: "PBKDF2" }, false, ["deriveBits", "deriveKey"]);
  const key = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt, iterations: 100000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
  
  // 导出密钥作为哈希值存储
  const exported = await crypto.subtle.exportKey("raw", key);
  return {
    hash: bufferToHex(exported),
    salt: bufferToHex(salt)
  };
}

export async function verifyPassword(password, storedHash, storedSalt) {
  const result = await hashPassword(password, storedSalt);
  return result.hash === storedHash;
}

// --- 3. JWT (HMAC SHA-256) ---
async function importJwtKey(secret) {
  return crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false, ["sign", "verify"]
  );
}

export async function signJwt(payload, secret) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + (7 * 24 * 60 * 60) }; // 7天过期

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedBody = base64UrlEncode(JSON.stringify(body));
  const data = enc.encode(`${encodedHeader}.${encodedBody}`);

  const key = await importJwtKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, data);
  const encodedSig = base64UrlEncode(String.fromCharCode(...new Uint8Array(signature)));

  return `${encodedHeader}.${encodedBody}.${encodedSig}`;
}

export async function verifyJwt(token, secret) {
  try {
    const [h, b, s] = token.split('.');
    if (!h || !b || !s) return null;

    const key = await importJwtKey(secret);
    const data = enc.encode(`${h}.${b}`);
    const signature = Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));

    const isValid = await crypto.subtle.verify("HMAC", key, signature, data);
    if (!isValid) return null;

    const payload = JSON.parse(base64UrlDecode(b));
    if (payload.exp < Math.floor(Date.now() / 1000)) return null; // 过期

    return payload;
  } catch (e) {
    return null;
  }
}

// --- 4. 数据加密 (AES-GCM) ---
// 用于加密存储 API Keys
async function importEncryptKey(secret) {
  // 使用 SHA-256 将任意长度的 secret 转换为 32 字节的 Key
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(secret));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encryptData(text, secret) {
  if (!text) return null;
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importEncryptKey(secret);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    enc.encode(text)
  );
  
  return JSON.stringify({
    iv: bufferToHex(iv),
    data: bufferToHex(encrypted)
  });
}

export async function decryptData(encryptedJson, secret) {
  if (!encryptedJson) return null;
  try {
    const { iv, data } = JSON.parse(encryptedJson);
    const key = await importEncryptKey(secret);
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: hexToBuffer(iv) },
      key,
      hexToBuffer(data)
    );
    return dec.decode(decrypted);
  } catch (e) {
    console.error("Decrypt failed", e);
    return null;
  }
}
