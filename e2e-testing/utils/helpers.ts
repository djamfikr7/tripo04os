import { APIRequestContext, Page } from '@playwright/test';

export class ApiHelper {
  constructor(private request: APIRequestContext) {}

  async login(email: string, password: string) {
    const response = await this.request.post('/api/v1/auth/login', {
      data: { email, password },
    });
    return response.json();
  }

  async getUsers(params?: { page?: number; limit?: number; search?: string }) {
    const response = await this.request.get('/api/v1/users', { params });
    return response.json();
  }

  async getUserById(id: string) {
    const response = await this.request.get(`/api/v1/users/${id}`);
    return response.json();
  }

  async updateUser(id: string, data: Record<string, unknown>) {
    const response = await this.request.patch(`/api/v1/users/${id}`, { data });
    return response.json();
  }

  async deleteUser(id: string) {
    const response = await this.request.delete(`/api/v1/users/${id}`);
    return response.json();
  }

  async getAnalytics() {
    const response = await this.request.get('/api/v1/analytics/overview');
    return response.json();
  }

  async getRides(params?: { page?: number; limit?: number; status?: string }) {
    const response = await this.request.get('/api/v1/rides', { params });
    return response.json();
  }

  async getDrivers(params?: { page?: number; limit?: number; status?: string }) {
    const response = await this.request.get('/api/v1/drivers', { params });
    return response.json();
  }
}

export class PageHelper {
  constructor(private page: Page) {}

  async waitForApiCall(urlPattern: string) {
    return this.page.waitForResponse((response) =>
      response.url().includes(urlPattern),
    );
  }

  async waitForSuccessMessage() {
    return this.page.waitForSelector('[role="status"]:has-text("success"), .success:has-text("success")', { timeout: 5000 });
  }

  async takeScreenshotOnFailure() {
    return this.page.screenshot({ path: `failure-${Date.now()}.png` });
  }
}
