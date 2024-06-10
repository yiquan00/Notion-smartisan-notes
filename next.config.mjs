

import withPWAInit from 'next-pwa';

// 配置 next-pwa
const withPWA = withPWAInit({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development', // 开发模式下禁用
});

/** @type {import('next').NextConfig} */
const nextConfig = withPWA({
  // 你其他的Next.js配置（如果有的话）
});

export default nextConfig;