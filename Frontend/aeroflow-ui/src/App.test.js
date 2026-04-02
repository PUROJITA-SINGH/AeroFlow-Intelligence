import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from './App';
import Login from './pages/Login';
import Alerts from './pages/Alerts';

// ── Mock axios globally ───────────────────────────────────
jest.mock('axios', () => ({
  get:  jest.fn(() => Promise.resolve({ data: [] })),
  post: jest.fn(() => Promise.resolve({
    data: { access_token: 'mock_token', role: 'admin' }
  })),
}));

// ── Mock canvas (for radar animation) ────────────────────
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = () => ({
    clearRect:         jest.fn(),
    beginPath:         jest.fn(),
    arc:               jest.fn(),
    stroke:            jest.fn(),
    fill:              jest.fn(),
    moveTo:            jest.fn(),
    lineTo:            jest.fn(),
    save:              jest.fn(),
    restore:           jest.fn(),
    translate:         jest.fn(),
    rotate:            jest.fn(),
    fillText:          jest.fn(),
    createLinearGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    createRadialGradient: jest.fn(() => ({
      addColorStop: jest.fn(),
    })),
    setLineDash: jest.fn(),
  });
});

// ── Test 1: Login page renders ────────────────────────────
test('Login page renders key elements', () => {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>
  );
  expect(screen.getByText(/AEROFLOW INTELLIGENCE/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/enter username/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/enter password/i)).toBeInTheDocument();
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
  const usernameInput = screen.getByPlaceholderText(/enter username/i);
  const passwordInput = screen.getByPlaceholderText(/enter password/i);

  fireEvent.change(usernameInput, { target: { value: 'admin' } });
  fireEvent.change(passwordInput, { target: { value: 'admin123' } });

  expect(usernameInput.value).toBe('admin');
  expect(passwordInput.value).toBe('admin123');
});

// ── Test 4: Unauthenticated user redirected to login ──────
test('Unauthenticated user is redirected to /login', () => {
  localStorage.clear();
  render(
    <MemoryRouter initialEntries={['/live']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/AEROFLOW INTELLIGENCE/i)).toBeInTheDocument();
  expect(screen.getByText(/INITIATE SEQUENCE/i)).toBeInTheDocument();
});

// ── Test 5: Alerts renders loading state ─────────────────
test('Alerts page shows loading state initially', () => {
  render(
    <MemoryRouter>
      <Alerts />
    </MemoryRouter>
  );
  expect(screen.getByText(/SCANNING THREATS/i)).toBeInTheDocument();
});

// ── Test 6: Login button shows authenticating when loading ─
test('Login button shows AUTHENTICATING when clicked', async () => {
  const axios = require('axios');
  axios.post.mockImplementationOnce(
    () => new Promise(resolve => setTimeout(() => resolve({ data: { access_token: 'tok', role: 'admin' } }), 500))
  );

  render(
    <MemoryRouter initialEntries={['/login']}>
      <Login />
    </MemoryRouter>
  );

  fireEvent.change(screen.getByPlaceholderText(/enter username/i), { target: { value: 'admin' } });
  fireEvent.change(screen.getByPlaceholderText(/enter password/i), { target: { value: 'pass' } });
  fireEvent.click(screen.getByText(/INITIATE SEQUENCE/i));

  await waitFor(() => {
    expect(screen.getByText(/AUTHENTICATING/i)).toBeInTheDocument();
  });
});