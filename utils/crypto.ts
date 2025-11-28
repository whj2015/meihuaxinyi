
// 生成加密密钥 (PBKDF2)
const getCryptoKey = async (password: string, salt: Uint8Array): Promise<CryptoKey> => {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
};

// 加密函数
export const encryptData = async (text: string, password: string): Promise<string> => {
  if (!text || !password) return "";
  try {
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));
    const key = await getCryptoKey(password, salt);
    
    const enc = new TextEncoder();
    const encrypted = await window.crypto.subtle.encrypt(
      { name: "AES-GCM", iv: iv },
      key,
      enc.encode(text)
    );

    // 将二进制数据转换为 Base64 字符串以便传输
    const bufferToBase64 = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf)));
    
    // 返回格式: JSON字符串 { iv, salt, data }
    return JSON.stringify({
      iv: bufferToBase64(iv),
      salt: bufferToBase64(salt),
      data: bufferToBase64(encrypted)
    });
  } catch (e) {
    console.error("Encryption failed:", e);
    return "";
  }
};

// 解密函数
export const decryptData = async (encryptedJson: string, password: string): Promise<string> => {
  if (!encryptedJson || !password) return "";
  try {
    // 尝试解析 JSON，如果不是 JSON 说明可能是旧数据的明文/Base64，直接返回空或原值
    let parsed;
    try {
        parsed = JSON.parse(encryptedJson);
    } catch (e) {
        return ""; // 格式不对，无法解密
    }

    if (!parsed.iv || !parsed.salt || !parsed.data) return "";

    const base64ToBuffer = (str: string) => Uint8Array.from(atob(str), c => c.charCodeAt(0));

    const salt = base64ToBuffer(parsed.salt);
    const iv = base64ToBuffer(parsed.iv);
    const data = base64ToBuffer(parsed.data);
    const key = await getCryptoKey(password, salt);

    const decrypted = await window.crypto.subtle.decrypt(
      { name: "AES-GCM", iv: iv },
      key,
      data
    );

    const dec = new TextDecoder();
    return dec.decode(decrypted);
  } catch (e) {
    console.error("Decryption failed:", e);
    return ""; // 密码错误或数据损坏
  }
};
