import axios from "axios";

const API_BASE = "/api";


/* ================= AUTH ================= */

export const signupUser = (data) =>
  axios.post(`${API_BASE}/signup`, data);

export const loginUser = (data) =>
  axios.post(`${API_BASE}/login`, data);

export const forgotPassword = (data) =>
  axios.post(`${API_BASE}/forgot-password`, data);

export const verifyOTP = (data) =>
  axios.post(`${API_BASE}/verify-otp`, data);


/* ================= FETCH PORTFOLIO ================= */

export const fetchCryptos = () => {

  const token = localStorage.getItem("token");

  return axios.get(`${API_BASE}/crypto`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

};


/* ================= SEARCH CRYPTO ================= */

export const searchCrypto = (query) => {

  const token = localStorage.getItem("token");

  return axios.get(
    `${API_BASE}/crypto/search?query=${encodeURIComponent(query)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

};


/* ================= ADD CRYPTO ================= */

export const addCrypto = async (coinId) => {

  const token = localStorage.getItem("token");

  const response = await axios.post(
    `${API_BASE}/crypto/add`,
    { id: coinId },
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json"
      }
    }
  );

  return response.data;

};


/* ================= DELETE CRYPTO ================= */

export const deleteCrypto = async (coinId) => {

  const token = localStorage.getItem("token");

  const response = await axios.delete(
    `${API_BASE}/crypto/delete/${encodeURIComponent(coinId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  );

  return response.data;

};