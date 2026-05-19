import '@testing-library/jest-dom/vitest'

// Recharts / responsive container requires ResizeObserver, which jsdom doesn't implement
if (typeof global.ResizeObserver === 'undefined') {
  global.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}
