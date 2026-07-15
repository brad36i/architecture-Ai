import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  experimental: {
    // 메모리 효율성을 위한 설정
    optimizePackageImports: ['lucide-react', 'react-markdown'],
  },
  // Turbopack 기본 설정 (Next.js 16+)
  turbopack: {},
  // 다른 PC/기기에서 개발 서버 접근 허용
  allowedDevOrigins: [
    'http://192.168.0.11:3000',
    'http://192.168.0.11',
    // 필요시 추가: 와일드카드로 전체 네트워크 허용
    // 'http://192.168.0.*:3000',
  ],
};

export default nextConfig;
