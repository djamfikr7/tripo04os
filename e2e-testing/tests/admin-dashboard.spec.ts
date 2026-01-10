import { test, expect } from '@playwright/test';
import { ApiMock } from '../utils/api-mock';

test.describe('Admin Dashboard - Authentication', () => {
  test.beforeEach(async ({ page }) => {
    const apiMock = new ApiMock(page);
    apiMock.setupMocks();
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/admin-dashboard');
    await expect(page).toHaveTitle(/Admin Dashboard/);
    await expect(page.locator('h1:has-text("Admin Dashboard")')).toBeVisible();
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Sign In")')).toBeVisible();
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/admin-dashboard');

    await page.locator('input[type="email"]').fill('admin@tripo04os.com');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button:has-text("Sign In")').click();

    await expect(page).toHaveURL(/.*\/admin-dashboard\/dashboard/);
    await expect(page.locator('text=Welcome back, Admin User')).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/admin-dashboard');

    await page.locator('input[type="email"]').fill('wrong@email.com');
    await page.locator('input[type="password"]').fill('wrongpassword');
    await page.locator('button:has-text("Sign In")').click();

    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should redirect to dashboard on already logged in', async ({ page, context }) => {
    await page.goto('/admin-dashboard');

    await page.locator('input[type="email"]').fill('admin@tripo04os.com');
    await page.locator('input[type="password"]').fill('admin123');
    await page.locator('button:has-text("Sign In")').click();

    await page.waitForURL(/.*\/admin-dashboard\/dashboard/);

    await context.storageState({ path: 'auth-state.json' });

    const newPage = await context.newPage();
    await newPage.goto('/admin-dashboard');

    await expect(newPage).toHaveURL(/.*\/admin-dashboard\/dashboard/);
  });
});

test.describe('Admin Dashboard - Dashboard Overview', () => {
  test.use({ storageState: 'auth-state.json' });

  test.beforeEach(async ({ page }) => {
    const apiMock = new ApiMock(page);
    apiMock.setupMocks();
  });

  test('should display dashboard metrics', async ({ page }) => {
    await page.goto('/admin-dashboard/dashboard');

    await expect(page.locator('text=Total Users')).toBeVisible();
    await expect(page.locator('text=12,453')).toBeVisible();

    await expect(page.locator('text=Active Drivers')).toBeVisible();
    await expect(page.locator('text=567')).toBeVisible();

    await expect(page.locator('text=Today Rides')).toBeVisible();
    await expect(page.locator('text=234')).toBeVisible();

    await expect(page.locator('text=Today Revenue')).toBeVisible();
    await expect(page.locator('text=$3,456.78')).toBeVisible();
  });

  test('should display revenue chart', async ({ page }) => {
    await page.goto('/admin-dashboard/dashboard');

    await expect(page.locator('text=Weekly Revenue')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
  });

  test('should display user growth chart', async ({ page }) => {
    await page.goto('/admin-dashboard/dashboard');

    await expect(page.locator('text=User Growth')).toBeVisible();
    await expect(page.locator('[data-testid="user-growth-chart"]')).toBeVisible();
  });
});

test.describe('Admin Dashboard - User Management', () => {
  test.use({ storageState: 'auth-state.json' });

  test.beforeEach(async ({ page }) => {
    const apiMock = new ApiMock(page);
    apiMock.setupMocks();
  });

  test('should display user list', async ({ page }) => {
    await page.goto('/admin-dashboard/users');

    await expect(page.locator('text=User Management')).toBeVisible();
    await expect(page.locator('text=Admin User')).toBeVisible();
    await expect(page.locator('text=Test Rider')).toBeVisible();
    await expect(page.locator('text=John Driver')).toBeVisible();
  });

  test('should search users', async ({ page }) => {
    await page.goto('/admin-dashboard/users');

    await page.locator('input[placeholder*="search"]').fill('admin');
    await page.keyboard.press('Enter');

    await expect(page.locator('text=Admin User')).toBeVisible();
    await expect(page.locator('text=Test Rider')).not.toBeVisible();
  });

  test('should filter users by role', async ({ page }) => {
    await page.goto('/admin-dashboard/users');

    await page.locator('select[name="role"]').selectOption('driver');

    await expect(page.locator('text=John Driver')).toBeVisible();
    await expect(page.locator('text=Admin User')).not.toBeVisible();
  });

  test('should open user detail modal', async ({ page }) => {
    await page.goto('/admin-dashboard/users');

    await page.locator('tr:has-text("Admin User")').getByRole('button', { name: /view/i }).click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=User Details')).toBeVisible();
    await expect(page.locator('text=admin@tripo04os.com')).toBeVisible();
  });

  test('should add new user', async ({ page }) => {
    await page.goto('/admin-dashboard/users');

    await page.locator('button:has-text("Add User")').click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();

    await page.locator('input[name="name"]').fill('New User');
    await page.locator('input[name="email"]').fill('newuser@example.com');
    await page.locator('input[name="password"]').fill('password123');
    await page.locator('select[name="role"]').selectOption('rider');

    await page.locator('button:has-text("Save")').click();

    await expect(page.locator('text=User created successfully')).toBeVisible();
  });

  test('should edit user', async ({ page }) => {
    await page.goto('/admin-dashboard/users');

    await page.locator('tr:has-text("Test Rider")').getByRole('button', { name: /edit/i }).click();

    await page.locator('input[name="name"]').fill('Updated Rider Name');
    await page.locator('button:has-text("Save")').click();

    await expect(page.locator('text=User updated successfully')).toBeVisible();
  });

  test('should delete user with confirmation', async ({ page }) => {
    await page.goto('/admin-dashboard/users');

    page.on('dialog', (dialog) => dialog.accept());

    await page.locator('tr:has-text("Test Rider")').getByRole('button', { name: /delete/i }).click();

    await expect(page.locator('text=User deleted successfully')).toBeVisible();
  });

  test('should navigate through pagination', async ({ page }) => {
    await page.goto('/admin-dashboard/users');

    const nextButton = page.locator('button:has-text("Next")');
    if (await nextButton.isEnabled()) {
      await nextButton.click();
      await expect(page.locator('text=Showing 11-20')).toBeVisible();
    }
  });
});

test.describe('Admin Dashboard - Navigation', () => {
  test.use({ storageState: 'auth-state.json' });

  test.beforeEach(async ({ page }) => {
    const apiMock = new ApiMock(page);
    apiMock.setupMocks();
  });

  test('should navigate between pages using sidebar', async ({ page }) => {
    await page.goto('/admin-dashboard/dashboard');

    await page.locator('a:has-text("Users")').click();
    await expect(page).toHaveURL(/.*\/admin-dashboard\/users/);

    await page.locator('a:has-text("Dashboard")').click();
    await expect(page).toHaveURL(/.*\/admin-dashboard\/dashboard/);

    await page.locator('a:has-text("Rides")').click();
    await expect(page).toHaveURL(/.*\/admin-dashboard\/rides/);

    await page.locator('a:has-text("Drivers")').click();
    await expect(page).toHaveURL(/.*\/admin-dashboard\/drivers/);
  });

  test('should logout successfully', async ({ page }) => {
    await page.goto('/admin-dashboard/dashboard');

    await page.locator('button[aria-label="Logout"]').click();
    await page.locator('button:has-text("Confirm")').click();

    await expect(page).toHaveURL(/.*\/admin-dashboard$/);
    await expect(page.locator('input[type="email"]')).toBeVisible();
  });
});
