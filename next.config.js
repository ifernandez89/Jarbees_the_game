/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
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
          publicPath: '/_next/static/audio/',
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
          publicPath: '/_next/static/models/',
          outputPath: 'static/models/',
          name: '[name].[hash].[ext]',
          esModule: false,
        },
      },
    });

    return config;
  },

  // Headers para CORS (necesario para algunos assets)
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
  
  // Output standalone para despliegue
  output: 'standalone',
}

// Configuración opcional de análisis de bundle
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

module.exports = withBundleAnalyzer(nextConfig)
