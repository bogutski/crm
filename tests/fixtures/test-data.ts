/**
 * Test data utilities for E2E tests
 */

export interface TestUserData {
  name: string;
  email: string;
  password: string;
}

/**
 * Generate unique test user data with random email
 */
export function generateTestUser(overrides?: Partial<TestUserData>): TestUserData {
  return {
    name: 'Test User',
    email: `test-${Date.now()}-${Math.random().toString(36).substring(7)}@example.com`,
    password: 'TestPassword123',
    ...overrides,
  };
}
