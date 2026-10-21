import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'marvel_auth_token';

/**
 * Lưu token xác thực vào SecureStore
 * @param {string} token 
 */
export async function saveToken(token) {
  try {
    await SecureStore.setItemAsync(TOKEN_KEY, token);
  } catch (err) {
    console.error('Lỗi khi lưu token bảo mật:', err);
  }
}

/**
 * Đọc token xác thực từ SecureStore
 * @returns {Promise<string|null>}
 */
export async function getToken() {
  try {
    return await SecureStore.getItemAsync(TOKEN_KEY);
  } catch (err) {
    console.error('Lỗi khi đọc token bảo mật:', err);
    return null;
  }
}

/**
 * Xóa token xác thực khỏi SecureStore
 */
export async function removeToken() {
  try {
    await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch (err) {
    console.error('Lỗi khi xóa token bảo mật:', err);
  }
}
