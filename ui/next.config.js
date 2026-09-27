const path = require('path');
const fs = require('fs');

const mockFontsPath = path.resolve(__dirname, 'mock-fonts.json');
if (!process.env.NEXT_FONT_GOOGLE_MOCKED_RESPONSES && fs.existsSync(mockFontsPath)) {
  process.env.NEXT_FONT_GOOGLE_MOCKED_RESPONSES = mockFontsPath;
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  distDir: 'out',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
