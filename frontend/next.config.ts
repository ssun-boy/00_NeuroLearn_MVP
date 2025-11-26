import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  webpack: (config, { isServer }) => {
    // react-pdf를 위한 설정
    config.resolve.alias = {
      ...config.resolve.alias,
      canvas: false,
      encoding: false,
    };

    // 클라이언트 사이드에서만 적용
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
        util: false,
      };
    }

    // react-pdf와 pdfjs-dist를 정상적으로 번들링하도록 설정
    config.optimization = {
      ...config.optimization,
      sideEffects: false,
    };

    return config;
  },
  // Turbopack 경고 해결을 위한 빈 설정
  // webpack 설정이 있으므로 webpack을 사용
  turbopack: {},
};

export default nextConfig;
