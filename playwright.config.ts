import { defineConfig, devices } from '@playwright/test'

import { E2E_STORAGE_STATE } from './e2e/utils/auth'

/**
 * Target viewport configurations for responsive testing
 * Based on common device sizes and breakpoint categories
 */
export const VIEWPORTS = {
  mobile_small: { width: 375, height: 667 }, // iPhone SE
  mobile_medium: { width: 393, height: 852 }, // iPhone 14 Pro
  mobile_large: { width: 430, height: 932 }, // iPhone 14 Pro Max
  tablet_small: { width: 768, height: 1024 }, // iPad Mini
  tablet_large: { width: 1024, height: 1366 }, // iPad Pro
  desktop: { width: 1280, height: 720 }, // Standard desktop
  desktop_large: { width: 1920, height: 1080 }, // Full HD desktop
} as const

/**
 * Remote target for the e2e suite, e.g. a Vercel Preview deployment.
 * When set, Playwright tests that URL and does not start a local dev server.
 */
const remoteBaseURL = process.env.PLAYWRIGHT_BASE_URL

/**
 * Vercel Deployment Protection bypass for the remote target. The header lets
 * each request through and asks Vercel to set a bypass cookie for the session.
 */
const vercelBypassSecret = process.env.VERCEL_AUTOMATION_BYPASS_SECRET

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: remoteBaseURL ?? 'http://localhost:3000',
    extraHTTPHeaders:
      remoteBaseURL && vercelBypassSecret
        ? {
            'x-vercel-protection-bypass': vercelBypassSecret,
            'x-vercel-set-bypass-cookie': 'true',
          }
        : undefined,
    trace: 'on-first-retry',
  },
  projects: [
    // Signs in once and saves the session for every other project
    {
      name: 'setup',
      testMatch: /auth\.setup\.ts/,
    },
    // Desktop browsers with various viewports
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: E2E_STORAGE_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'], storageState: E2E_STORAGE_STATE },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'], storageState: E2E_STORAGE_STATE },
      dependencies: ['setup'],
    },
    // Mobile viewports - Small
    {
      name: 'mobile_small',
      use: {
        ...devices['iPhone SE'],
        storageState: E2E_STORAGE_STATE,
        viewport: VIEWPORTS.mobile_small,
      },
      dependencies: ['setup'],
    },
    // Mobile viewports - Medium
    {
      name: 'mobile_medium',
      use: {
        ...devices['iPhone 14 Pro'],
        storageState: E2E_STORAGE_STATE,
        viewport: VIEWPORTS.mobile_medium,
      },
      dependencies: ['setup'],
    },
    // Mobile viewports - Large
    {
      name: 'mobile_large',
      use: {
        ...devices['iPhone 14 Pro Max'],
        storageState: E2E_STORAGE_STATE,
        viewport: VIEWPORTS.mobile_large,
      },
      dependencies: ['setup'],
    },
    // Tablet viewports - Small
    {
      name: 'tablet_small',
      use: {
        ...devices['iPad Mini'],
        storageState: E2E_STORAGE_STATE,
        viewport: VIEWPORTS.tablet_small,
      },
      dependencies: ['setup'],
    },
    // Tablet viewports - Large
    {
      name: 'tablet_large',
      use: {
        ...devices['iPad Pro 11'],
        storageState: E2E_STORAGE_STATE,
        viewport: VIEWPORTS.tablet_large,
      },
      dependencies: ['setup'],
    },
    // Desktop viewports
    {
      name: 'desktop',
      use: {
        ...devices['Desktop Chrome'],
        storageState: E2E_STORAGE_STATE,
        viewport: VIEWPORTS.desktop,
      },
      dependencies: ['setup'],
    },
    // Desktop large
    {
      name: 'desktop_large',
      use: {
        ...devices['Desktop Chrome'],
        storageState: E2E_STORAGE_STATE,
        viewport: VIEWPORTS.desktop_large,
      },
      dependencies: ['setup'],
    },
  ],
  webServer: remoteBaseURL
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3000',
        reuseExistingServer: !process.env.CI,
      },
})
