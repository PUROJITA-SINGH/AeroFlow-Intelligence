import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import axios from 'axios';
import LiveOverview from './pages/LiveOverview';

jest.mock('axios');

// mock canvas
beforeAll(() => {
  HTMLCanvasElement.prototype.getContext = () => ({
    clearRect: jest.fn(), beginPath: jest.fn(), arc: jest.fn(),
    stroke: jest.fn(), fill: jest.fn(), moveTo: jest.fn(), lineTo: jest.fn(),
    save: jest.fn(), restore: jest.fn(), translate: jest.fn(), rotate: jest.fn(),
    createLinearGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
    createRadialGradient: jest.fn(() => ({ addColorStop: jest.fn() })),
    setLineDash: jest.fn(),
  });
});

const MOCK_LIVE_DATA = [
  { id:1, location:'Security Checkpoint', passenger_count:120, queue_length:25, timestamp: new Date().toISOString() },
  { id:2, location:'Gate B',              passenger_count:45,  queue_length:10, timestamp: new Date().toISOString() },
  { id:3, location:'Baggage Claim',       passenger_count:80,  queue_length:15, timestamp: new Date().toISOString() },
  { id:4, location:'Check-in',            passenger_count:30,  queue_length:5,  timestamp: new Date().toISOString() },
];

const MOCK_HISTORY = [
  { timestamp: new Date().toISOString(), passenger_count: 90, queue_length: 12 },
  { timestamp: new Date().toISOString(), passenger_count: 95, queue_length: 14 },
];

// ── Test 1: Shows loading state ───────────────────────────
test('LiveOverview shows loading state initially', () => {
  axios.get.mockImplementation(() => new Promise(() => {})); // never resolves
  render(<MemoryRouter><LiveOverview /></MemoryRouter>);
  expect(screen.getByText(/ACQUIRING SIGNAL/i)).toBeInTheDocument();
});

// ── Test 2: Renders zone cards after data loads ───────────
test('LiveOverview renders zone cards after fetch', async () => {
  axios.get
    .mockResolvedValueOnce({ data: MOCK_LIVE_DATA })
    .mockResolvedValueOnce({ data: MOCK_HISTORY });

  render(<MemoryRouter><LiveOverview /></MemoryRouter>);

  await waitFor(() => {
    expect(screen.getByText('Security Checkpoint')).toBeInTheDocument();
    expect(screen.getByText('Gate B')).toBeInTheDocument();
    expect(screen.getByText('Baggage Claim')).toBeInTheDocument();
    expect(screen.getByText('Check-in')).toBeInTheDocument();
  });
});

// ── Test 3: Critical status for high passenger count ──────
test('LiveOverview shows CRITICAL status for count >= 100', async () => {
  axios.get
    .mockResolvedValueOnce({ data: MOCK_LIVE_DATA })
    .mockResolvedValueOnce({ data: MOCK_HISTORY });

  render(<MemoryRouter><LiveOverview /></MemoryRouter>);

  await waitFor(() => {
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
  });
});

// ── Test 4: Total passenger count displayed ───────────────
test('LiveOverview displays correct total passenger count', async () => {
  axios.get
    .mockResolvedValueOnce({ data: MOCK_LIVE_DATA })
    .mockResolvedValueOnce({ data: MOCK_HISTORY });

  render(<MemoryRouter><LiveOverview /></MemoryRouter>);

  await waitFor(() => {
    // Total = 120 + 45 + 80 + 30 = 275
    expect(screen.getByText('275')).toBeInTheDocument();
  });
});

// ── Test 5: Handles API error gracefully ──────────────────
test('LiveOverview handles fetch error without crashing', async () => {
  axios.get.mockRejectedValue(new Error('Network Error'));
  render(<MemoryRouter><LiveOverview /></MemoryRouter>);
  await waitFor(() => {
    // Should not crash — loading disappears
    expect(screen.queryByText(/ACQUIRING SIGNAL/i)).not.toBeInTheDocument();
  });
});