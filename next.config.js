const isGithubPages = process.env.GITHUB_PAGES === 'true' || process.env.NEXT_PUBLIC_GITHUB_PAGES === 'true'
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || (isGithubPages ? '/Jarbees_the_game' : '')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Soporte de subdirectorio para GitHub Pages
  ...(basePath ? { basePath, assetPrefix: `${basePath}/` } : {}),

  // Configuración de imágenes (compatible con export estático para GitHub Pages)
  images: {
    unoptimized: true,
  },

  // Configuración para Three.js y React Three Fiber
  transpilePackages: ['three'],
  
  // Configuración de webpack para GLB/GLTF
  webpack: (config, { isServer }) => {
    // Soporte para archivos de audio
    config.module.rules.push({
      test: /\.(mp3|wav|ogg)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: `${basePath}/_next/static/audio/`,
          outputPath: 'static/audio/',
          name: '[name].[hash].[ext]',
          esModule: false,
        },
      },
    });

    // Soporte para modelos 3D
    config.module.rules.push({
      test: /\.(glb|gltf)$/,
      use: {
        loader: 'file-loader',
        options: {
          publicPath: `${basePath}/_next/static/models/`,
          outputPath: 'static/models/',
          name: '[name].[hash].[ext]',
          esModule: false,
        },
      },
    });

    return config;
  },

  // Headers para CORS (necesario para algunos assets en servidor)
  async headers() {
    return [
      {
        source: '/models/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET' },
        ],
      },
      {
        source: '/audio/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
        ],
      },
    ];
  },

  // Optimizaciones de producción
  compress: true,
  poweredByHeader: false,
  
  // Para GitHub Pages se utiliza 'export', de lo contrario standalone o por defecto
  output: isGithubPages ? 'export' : (process.env.OUTPUT_STANDALONE === 'true' ? 'standalone' : undefined),
}

// Configuración opcional de análisis de bundle
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
