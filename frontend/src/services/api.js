import axios from "axios";

// Use relative path so it works both locally and on Render
const API_BASE = "/api";

// AUTH
export const signupUser = (data) =>
  axios.post(`${API_BASE}/signup`, data);

export const loginUser = (data) =>
  axios.post(`${API_BASE}/login`, data);

export const forgotPassword = (data) =>
  axios.post(`${API_BASE}/forgot-password`, data);

export const verifyOTP = (data) =>
  axios.post(`${API_BASE}/verify-otp`, data);


// FETCH USER CRYPTOS
export const fetchCryptos = () => {
  const token = localStorage.getItem("token");

  return axios.get(`${API_BASE}/crypto`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
};


// SEARCH CRYPTO
export const searchCrypto = (query) => {
  const token = localStorage.getItem("token");

  return axios.get(
    `${API_BASE}/crypto/search?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );
};


// DELETE CRYPTO
export const deleteCrypto = async (symbol) => {
  const token = localStorage.getItem("token");

  const response = await axios.delete(
    `${API_BASE}/crypto/delete/${encodeURIComponent(symbol)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  return response.data;
};


// ADD CRYPTO
export const addCrypto = async (symbol) => {
  const token = localStorage.getItem("token");

  const response = await axios.post(
    `${API_BASE}/crypto/add`,
    { symbol },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  return response.data;
};