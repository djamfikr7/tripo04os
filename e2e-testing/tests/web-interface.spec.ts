import { test, expect } from '@playwright/test';
import { ApiMock } from '../utils/api-mock';

test.describe('Web Interface - Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    const apiMock = new ApiMock(page);
    apiMock.setupMocks();
  });

  test('should display booking widget on home page', async ({ page }) => {
    await page.goto('/');

    await expect(page.locator('h1:has-text("Book Your Ride")')).toBeVisible();
    await expect(page.locator('[data-testid="booking-widget"]')).toBeVisible();
    await expect(page.locator('select[name="serviceType"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="pickup"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="dropoff"]')).toBeVisible();
    await expect(page.locator('button:has-text("Get Estimate")')).toBeVisible();
  });

  test('should select different service types', async ({ page }) => {
    await page.goto('/');

    const serviceSelect = page.locator('select[name="serviceType"]');

    await serviceSelect.selectOption('ride');
    await expect(serviceSelect).toHaveValue('ride');

    await serviceSelect.selectOption('moto');
    await expect(serviceSelect).toHaveValue('moto');

    await serviceSelect.selectOption('food');
    await expect(serviceSelect).toHaveValue('food');

    await serviceSelect.selectOption('grocery');
    await expect(serviceSelect).toHaveValue('grocery');
  });

  test('should display vehicle options for ride service', async ({ page }) => {
    await page.goto('/');

    await page.locator('select[name="serviceType"]').selectOption('ride');

    await expect(page.locator('text=Economy')).toBeVisible();
    await expect(page.locator('text=Comfort')).toBeVisible();
    await expect(page.locator('text=Premium')).toBeVisible();
  });

  test('should enter pickup and dropoff locations', async ({ page }) => {
    await page.goto('/');

    await page.locator('input[placeholder*="pickup"]').fill('123 Main St');
    await expect(page.locator('input[placeholder*="pickup"]')).toHaveValue('123 Main St');

    await page.locator('input[placeholder*="dropoff"]').fill('456 Oak Ave');
    await expect(page.locator('input[placeholder*="dropoff"]')).toHaveValue('456 Oak Ave');
  });

  test('should get fare estimate', async ({ page }) => {
    await page.goto('/');

    await page.locator('input[placeholder*="pickup"]').fill('123 Main St');
    await page.locator('input[placeholder*="dropoff"]').fill('456 Oak Ave');

    await page.locator('button:has-text("Get Estimate")').click();

    await expect(page.locator('text=Estimated Fare:')).toBeVisible();
    await expect(page.locator('text=Distance:')).toBeVisible();
    await expect(page.locator('text=Duration:')).toBeVisible();
  });

  test('should display map with route', async ({ page }) => {
    await page.goto('/');

    await page.locator('input[placeholder*="pickup"]').fill('123 Main St');
    await page.locator('input[placeholder*="dropoff"]').fill('456 Oak Ave');

    await page.locator('button:has-text("Get Estimate")').click();

    await expect(page.locator('[data-testid="map-container"]')).toBeVisible();
  });

  test('should proceed to booking confirmation', async ({ page }) => {
    await page.goto('/');

    await page.locator('input[placeholder*="pickup"]').fill('123 Main St');
    await page.locator('input[placeholder*="dropoff"]').fill('456 Oak Ave');
    await page.locator('button:has-text("Get Estimate")').click();

    await page.waitForTimeout(1000);

    await page.locator('button:has-text("Book Now")').click();

    await expect(page.locator('text=Confirm Booking')).toBeVisible();
  });
});

test.describe('Web Interface - Ride History', () => {
  test.use({ storageState: 'auth-state.json' });

  test.beforeEach(async ({ page }) => {
    const apiMock = new ApiMock(page);
    apiMock.setupMocks();
  });

  test('should display ride history', async ({ page }) => {
    await page.goto('/history');

    await expect(page.locator('text=Ride History')).toBeVisible();
    await expect(page.locator('text=RIDE-001')).toBeVisible();
    await expect(page.locator('text=RIDE-002')).toBeVisible();
  });

  test('should filter rides by status', async ({ page }) => {
    await page.goto('/history');

    await page.locator('select[name="status"]').selectOption('completed');

    await expect(page.locator('text=RIDE-001')).toBeVisible();
    await expect(page.locator('text=RIDE-002')).not.toBeVisible();

    await page.locator('select[name="status"]').selectOption('cancelled');

    await expect(page.locator('text=RIDE-002')).toBeVisible();
    await expect(page.locator('text=RIDE-001')).not.toBeVisible();
  });

  test('should sort rides by date', async ({ page }) => {
    await page.goto('/history');

    await page.locator('select[name="sortBy"]').selectOption('date-desc');

    await expect(page.locator('tbody tr').first()).toContainText('RIDE-001');
  });

  test('should sort rides by fare', async ({ page }) => {
    await page.goto('/history');

    await page.locator('select[name="sortBy"]').selectOption('fare-desc');

    await expect(page.locator('tbody tr').first()).toContainText('$15.50');
  });

  test('should open ride details', async ({ page }) => {
    await page.goto('/history');

    await page.locator('tr:has-text("RIDE-001")').click();

    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page.locator('text=Ride Details')).toBeVisible();
    await expect(page.locator('text=123 Main St')).toBeVisible();
    await expect(page.locator('text=456 Oak Ave')).toBeVisible();
  });

  test('should cancel ride', async ({ page }) => {
    await page.goto('/history');

    page.on('dialog', (dialog) => dialog.accept());

    await page.locator('tr:has-text("RIDE-002")').getByRole('button', { name: /cancel/i }).click();

    await expect(page.locator('text=Ride cancelled successfully')).toBeVisible();
  });
});

test.describe('Web Interface - Profile Management', () => {
  test.use({ storageState: 'auth-state.json' });

  test.beforeEach(async ({ page }) => {
    const apiMock = new ApiMock(page);
    apiMock.setupMocks();
  });

  test('should display profile tabs', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.locator('text=Profile')).toBeVisible();
    await expect(page.locator('text=Payment')).toBeVisible();
    await expect(page.locator('text=Settings')).toBeVisible();
  });

  test('should display profile information', async ({ page }) => {
    await page.goto('/profile');

    await expect(page.locator('text=Test Rider')).toBeVisible();
    await expect(page.locator('text=rider@example.com')).toBeVisible();
  });

  test('should update profile information', async ({ page }) => {
    await page.goto('/profile');

    await page.locator('button:has-text("Edit Profile")').click();

    await page.locator('input[name="name"]').fill('Updated Name');
    await page.locator('input[name="phone"]').fill('+0987654321');

    await page.locator('button:has-text("Save")').click();

    await expect(page.locator('text=Profile updated successfully')).toBeVisible();
  });

  test('should display payment methods', async ({ page }) => {
    await page.goto('/profile');
    await page.locator('button:has-text("Payment")').click();

    await expect(page.locator('text=Payment Methods')).toBeVisible();
    await expect(page.locator('text=**** 4242')).toBeVisible();
  });

  test('should add new payment method', async ({ page }) => {
    await page.goto('/profile');
    await page.locator('button:has-text("Payment")').click();

    await page.locator('button:has-text("Add Card")').click();

    await page.locator('input[name="cardNumber"]').fill('4111111111111111');
    await page.locator('input[name="expiry"]').fill('12/28');
    await page.locator('input[name="cvv"]').fill('123');
    await page.locator('input[name="name"]').fill('Test User');

    await page.locator('button:has-text("Save")').click();

    await expect(page.locator('text=Payment method added successfully')).toBeVisible();
  });

  test('should display settings', async ({ page }) => {
    await page.goto('/profile');
    await page.locator('button:has-text("Settings")').click();

    await expect(page.locator('text=Notification Preferences')).toBeVisible();
    await expect(page.locator('text=Email notifications')).toBeVisible();
    await expect(page.locator('text=Push notifications')).toBeVisible();
  });

  test('should toggle notification preferences', async ({ page }) => {
    await page.goto('/profile');
    await page.locator('button:has-text("Settings")').click();

    await page.locator('input[name="emailNotifications"]').check();
    await page.locator('input[name="pushNotifications"]').uncheck();

    await page.locator('button:has-text("Save")').click();

    await expect(page.locator('text=Settings saved successfully')).toBeVisible();
  });
});

test.describe('Web Interface - Responsive Design', () => {
  test.beforeEach(async ({ page }) => {
    const apiMock = new ApiMock(page);
    apiMock.setupMocks();
  });

  test('should display correctly on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/');

    await expect(page.locator('[data-testid="booking-widget"]')).toBeVisible();
    await expect(page.locator('[data-testid="navbar"]')).toBeVisible();
  });

  test('should display correctly on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/');

    await expect(page.locator('[data-testid="booking-widget"]')).toBeVisible();
  });

  test('should display correctly on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await expect(page.locator('[data-testid="booking-widget"]')).toBeVisible();
    await expect(page.locator('[data-testid="mobile-menu"]')).not.toBeVisible();
  });

  test('should open mobile menu', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/');

    await page.locator('button[aria-label="Open menu"]').click();

    await expect(page.locator('[data-testid="mobile-menu"]')).toBeVisible();
  });
});

test.describe('Web Interface - Navigation', () => {
  test.beforeEach(async ({ page }) => {
    const apiMock = new ApiMock(page);
    apiMock.setupMocks();
  });

  test('should navigate between pages', async ({ page }) => {
    await page.goto('/');

    await page.locator('a:has-text("Ride History")').click();
    await expect(page).toHaveURL(/.*\/history/);

    await page.locator('a:has-text("Profile")').click();
    await expect(page).toHaveURL(/.*\/profile/);

    await page.locator('a:has-text("Book a Ride")').click();
    await expect(page).toHaveURL(/.*\/$/);
  });

  test('should return to home page', async ({ page }) => {
    await page.goto('/history');

    await page.locator('a:has-text("Tripo04OS")').click();
    await expect(page).toHaveURL(/.*\/$/);
  });
});
