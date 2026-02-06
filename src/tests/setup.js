import { afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.clearAllMocks();
});

// Mock window.location
delete window.location;
window.location = { href: '', reload: vi.fn() };

// Mock environment variables
vi.stubEnv('VITE_API_BASE_URL', 'http://localhost:4559');
