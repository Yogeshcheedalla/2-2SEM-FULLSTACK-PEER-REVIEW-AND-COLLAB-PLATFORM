const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:2026";

/**
 * Custom fetch wrapper that automatically adds the Authorization header
 * and handles common response patterns.
 */
export const apiFetch = async (endpoint, options = {}) => {
  const token = localStorage.getItem("token");
  
  const defaultHeaders = {
    "Content-Type": "application/json",
  };

  if (token) {
    defaultHeaders["Authorization"] = `Bearer ${token}`;
  }

  const url = endpoint.startsWith("http") ? endpoint : `${BASE_URL}${endpoint}`;
  
  const mergedOptions = {
    ...options,
    headers: {
      ...defaultHeaders,
      ...options.headers,
    },
  };

  // If Content-Type is explicitly set to undefined (e.g. for FormData), 
  // remove it so the browser can set the correct boundary.
  if (options.headers && options.headers["Content-Type"] === undefined) {
    delete mergedOptions.headers["Content-Type"];
  }

  try {
    const response = await fetch(url, mergedOptions);

    // If unauthorized (401), we might want to trigger a refresh logic here in the future
    if (response.status === 401) {
      console.warn("Unauthorized request. Token might be expired.");
      // Optional: attempt refresh token flow here
    }

    return response;
  } catch (error) {
    console.error(`API Fetch Error [${mergedOptions.method || "GET"} ${url}]:`, error);
    throw error;
  }
};

export default apiFetch;
