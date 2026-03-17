import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactCompiler: true,
  reactStrictMode: true,
  transpilePackages: ['@components/*', '@lib/*'],
  turbopack: {
    resolveAlias: {
      '@components': './components',
      '@lib': './lib',
      '@app': './app',
      '@hooks': './hooks',
      '@styles': './styles',
    },
  },
};

export default nextConfig;
