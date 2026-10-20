import base from './playwright.config'

export default {
  ...base,
  reporter: 'list',
  outputDir: process.env.SLOT3_DIR + '/results',
  projects: base.projects
    ?.filter((p) => p.name === 'setup' || p.name === 'chromium')
    .map((p) => ({
      ...p,
      use: {
        ...p.use,
        launchOptions: {
          executablePath: '/run/current-system/sw/bin/chromium',
        },
      },
    })),
}
