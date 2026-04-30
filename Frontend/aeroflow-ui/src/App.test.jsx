import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeAll, beforeEach, expect, test, vi } from 'vitest';
import axios from 'axios';
import App from './App';
import Login from './pages/Login';
import Alerts from './pages/Alerts';

// ── Mock axios globally ───────────────────────────────────
vi.mock('axios', () => ({
  default: {
    get: vi.fn(() => Promise.resolve({ data: [] })),
    post: vi.fn(() => Promise.resolve({
      data: { access_token: 'mock_token', role: 'admin' }
    })),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  },
}));

// ── Mock canvas (for radar animation) ────────────────────
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = () => ({
    clearRect:         vi.fn(),
    beginPath:         vi.fn(),
    arc:               vi.fn(),
    stroke:            vi.fn(),
    fill:              vi.fn(),
    closePath:         vi.fn(),
    moveTo:            vi.fn(),
    lineTo:            vi.fn(),
    save:              vi.fn(),
    restore:           vi.fn(),
    translate:         vi.fn(),
    rotate:            vi.fn(),
    fillText:          vi.fn(),
    createLinearGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    createRadialGradient: vi.fn(() => ({
      addColorStop: vi.fn(),
    })),
    setLineDash: vi.fn(),
  });
});

beforeEach(() => {
  axios.get.mockImplementation(() => Promise.resolve({ data: [] }));
  axios.post.mockImplementation(() => Promise.resolve({
    data: { access_token: 'mock_token', role: 'admin' }
  }));
  localStorage.clear();
});

// ── Test 1: Login page renders ────────────────────────────
test('Login page renders key elements', () => {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>
  );
  expect(screen.getByText(/AEROFLOW INTELLIGENCE/i)).toBeInTheDocument();
  expect(screen.getAllByPlaceholderText(/_____________/i)).toHaveLength(2);
  expect(screen.getByText(/INITIATE SEQUENCE/i)).toBeInTheDocument();
});

// ── Test 2: Login shows error on empty fields ─────────────
test('Login shows error when fields are empty', async () => {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>
  );
  fireEvent.click(screen.getByText(/INITIATE SEQUENCE/i));
  await waitFor(() => {
    expect(screen.getByText(/FIELD INPUT REQUIRED/i)).toBeInTheDocument();
  });
});

// ── Test 3: Login input fields accept text ────────────────
test('Login inputs accept user input', () => {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>
  );
  const [usernameInput, passwordInput] = screen.getAllByPlaceholderText(/_____________/i);

  fireEvent.change(usernameInput, { target: { value: 'admin' } });
  fireEvent.change(passwordInput, { target: { value: 'samplePass123' } });

  expect(usernameInput.value).toBe('admin');
  expect(passwordInput.value).toBe('samplePass123');
});

// ── Test 4: Unauthenticated user redirected to login ──────
test('Unauthenticated user is redirected to /login', () => {
  window.history.pushState({}, '', '/live');
  render(<App />);
  expect(screen.getByText(/AEROFLOW INTELLIGENCE/i)).toBeInTheDocument();
  expect(screen.getByText(/INITIATE SEQUENCE/i)).toBeInTheDocument();
});

// ── Test 5: Alerts renders loading state ─────────────────
test('Alerts page shows loading state initially', () => {
  axios.get.mockImplementationOnce(() => new Promise(() => {}));

  render(
    <MemoryRouter>
      <Alerts />
    </MemoryRouter>
  );
  expect(screen.getByText(/SCANNING THREATS/i)).toBeInTheDocument();
});

// ── Test 6: Login button shows verifying when loading ─
test('Login button shows VERIFYING when clicked', async () => {
  axios.post.mockImplementationOnce(
    () => new Promise(resolve => setTimeout(() => resolve({ data: { access_token: 'tok', role: 'admin' } }), 500))
  );

  render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>
  );

  const [usernameInput, passwordInput] = screen.getAllByPlaceholderText(/_____________/i);
  fireEvent.change(usernameInput, { target: { value: 'admin' } });
  fireEvent.change(passwordInput, { target: { value: 'pass' } });
  fireEvent.click(screen.getByText(/INITIATE SEQUENCE/i));

  await waitFor(() => {
    expect(screen.getByText(/VERIFYING/i)).toBeInTheDocument();
  });
});
