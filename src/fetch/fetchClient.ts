/**
 * Base URL for API requests
 * Uses environment variable VITE_BACKEND_URL or defaults to localhost:3000
 */
const API_URL = import.meta.env.VITE_BACKEND_URL ?? "http://localhost:3000";

/**
 * API client for making HTTP requests to the backend
 * Provides a centralized way to handle authentication and API calls
 */
export const apiClient = {
    /**
     * Generic request method that handles all HTTP calls
     * @param {string} method - HTTP method (GET, POST, PUT, DELETE, etc.)
     * @param {string} path - API endpoint path (e.g., "/users", "/auth/login")
     * @param {any} [body] - Request payload for POST/PUT requests
     * @param {string} [token] - JWT token for authenticated requests
     * @returns {Promise<any>} Parsed JSON response from the server
     * @throws {Error} If the request fails or returns a non-2xx status code
     */
    async request(method: string, path: string, body?: any, token?: string) {
        // Initialize headers with default Content-Type
        const headers: Record<string, string> = {
            "Content-Type": "application/json",
        };

        // Add Authorization header if token is provided
        // Format: "Bearer <token>" (standard JWT authentication)
        if (token) {
            headers["Authorization"] = `Bearer ${token}`;
        }

        // Make the HTTP request to the backend
        const response = await fetch(`${API_URL}${path}`, {
            method,
            headers,
            body: body ? JSON.stringify(body) : undefined, // Convert body to JSON string
            credentials: "include", // Include cookies for cross-origin requests
        });

        // Handle error responses (status codes outside 200-299 range)
        if (!response.ok) {
            // Try to parse error message from response, fallback to empty object
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || "Request failed");
        }

        // Parse and return the JSON response
        // If parsing fails, return empty object instead of throwing
        return response.json().catch(() => ({}));
    },

    /**
     * Performs a GET request to fetch data
     * @param {string} path - API endpoint path
     * @param {string} [token] - JWT token for authenticated requests
     * @returns {Promise<any>} Response data
     * @example
     * const users = await apiClient.get("/users", userToken);
     */
    async get(path: string, token?: string) {
        return this.request("GET", path, null, token);
    },

    /**
     * Performs a POST request to create new resources
     * @param {string} path - API endpoint path
     * @param {any} [body] - Data to send in the request body
     * @param {string} [token] - JWT token for authenticated requests
     * @returns {Promise<any>} Response data (usually the created resource)
     * @example
     * const newUser = await apiClient.post("/users", { name: "John" }, token);
     */
    async post(path: string, body?: any, token?: string) {
        return this.request("POST", path, body, token);
    },

    /**
     * Performs a PUT request to update existing resources
     * @param {string} path - API endpoint path
     * @param {any} [body] - Updated data to send
     * @param {string} [token] - JWT token for authenticated requests
     * @returns {Promise<any>} Response data (usually the updated resource)
     * @example
     * const updated = await apiClient.put("/users/123", { name: "Jane" }, token);
     */
    async put(path: string, body?: any, token?: string) {
        return this.request("PUT", path, body, token);
    },

    /**
     * Performs a DELETE request to remove resources
     * @param {string} path - API endpoint path
     * @param {string} [token] - JWT token for authenticated requests
     * @returns {Promise<any>} Response data (usually confirmation message)
     * @example
     * await apiClient.delete("/users/123", token);
     */
    async delete(path: string, token?: string) {
        return this.request("DELETE", path, null, token);
    },
};