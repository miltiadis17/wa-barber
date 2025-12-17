// API helper functions
const API_BASE = '/api/admin';

class API {
    // Check authentication
    static async checkAuth() {
        const response = await fetch(`${API_BASE}/auth/check`);
        const data = await response.json();

        if (!data.authenticated) {
            window.location.href = '/admin/';
        }

        return data;
    }

    // Logout
    static async logout() {
        await fetch(`${API_BASE}/auth/logout`, { method: 'POST' });
        window.location.href = '/admin/';
    }

    // Get statistics
    static async getStats() {
        const response = await fetch(`${API_BASE}/stats`);
        if (!response.ok) throw new Error('Failed to fetch stats');
        return response.json();
    }

    // Bookings
    static async getBookings(filters = {}) {
        const params = new URLSearchParams(filters);
        const response = await fetch(`${API_BASE}/bookings?${params}`);
        if (!response.ok) throw new Error('Failed to fetch bookings');
        return response.json();
    }

    static async getBooking(id) {
        const response = await fetch(`${API_BASE}/bookings/${id}`);
        if (!response.ok) throw new Error('Failed to fetch booking');
        return response.json();
    }

    static async updateBooking(id, data) {
        const response = await fetch(`${API_BASE}/bookings/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update booking');
        }
        return response.json();
    }

    static async cancelBooking(id) {
        const response = await fetch(`${API_BASE}/bookings/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to cancel booking');
        return response.json();
    }

    // Masters
    static async getMasters() {
        const response = await fetch(`${API_BASE}/masters`);
        if (!response.ok) throw new Error('Failed to fetch masters');
        return response.json();
    }

    static async getMaster(id) {
        const response = await fetch(`${API_BASE}/masters/${id}`);
        if (!response.ok) throw new Error('Failed to fetch master');
        return response.json();
    }

    static async createMaster(data) {
        const response = await fetch(`${API_BASE}/masters`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create master');
        }
        return response.json();
    }

    static async updateMaster(id, data) {
        const response = await fetch(`${API_BASE}/masters/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update master');
        }
        return response.json();
    }

    static async deleteMaster(id) {
        const response = await fetch(`${API_BASE}/masters/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) throw new Error('Failed to delete master');
        return response.json();
    }

    // Services
    static async getServices() {
        const response = await fetch(`${API_BASE}/services`);
        if (!response.ok) throw new Error('Failed to fetch services');
        return response.json();
    }

    static async getService(id) {
        const response = await fetch(`${API_BASE}/services/${id}`);
        if (!response.ok) throw new Error('Failed to fetch service');
        return response.json();
    }

    static async createService(data) {
        const response = await fetch(`${API_BASE}/services`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to create service');
        }
        return response.json();
    }

    static async updateService(id, data) {
        const response = await fetch(`${API_BASE}/services/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to update service');
        }
        return response.json();
    }

    static async deleteService(id) {
        const response = await fetch(`${API_BASE}/services/${id}`, {
            method: 'DELETE'
        });
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || 'Failed to delete service');
        }
        return response.json();
    }
}

// Helper functions
function formatDate(dateStr) {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function formatTime(timeStr) {
    return timeStr.substring(0, 5);
}

function showMessage(elementId, message, type = 'success') {
    const element = document.getElementById(elementId);
    if (!element) return;

    element.className = type === 'success' ? 'success-message' : 'error-message';
    element.textContent = message;
    element.style.display = 'block';

    setTimeout(() => {
        element.style.display = 'none';
    }, 5000);
}
