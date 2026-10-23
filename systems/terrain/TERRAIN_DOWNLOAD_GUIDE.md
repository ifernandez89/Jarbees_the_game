# 📥 Guía para Descargar Datos DEM Reales

Esta guía explica cómo obtener datos de elevación reales (DEM) para usar con JarBees.

## 🎯 Fuentes Recomendadas

### 1. Copernicus DEM GLO-30 (Recomendado)
- ✅ Cobertura mundial, Resolución: 30m
- ✅ Gratuito con atribución
- URL: https://dataspace.copernicus.eu/

### 2. USGS EarthExplorer
- ✅ Dominio público, sin atribución requerida
- URL: https://earthexplorer.usgs.gov/

## 📦 Estructura de Archivos

```
public/terrain/data/regions/[nombre]/
├── metadata.json
├── heightmap.bin
└── heightmap.png (opcional)
```

## 🔧 Procesamiento Básico

Con GDAL instalado:

```bash
# Convertir GeoTIFF a heightmap
gdalwarp -of PNG -ot UInt16 dem_raw.tif heightmap.png

# O formato binario
gdalwarp -of ENVI -ot Float32 dem_raw.tif heightmap.raw
```

## 📊 Regiones Recomendadas

**Aconcagua (20x20 km)**
- Bounds: -32.553,-32.753,-69.900,-70.100
- Elevación: 2,500m - 6,962m
- Tamaño: ~50 MB

## 🔐 Atribución

Copernicus: Requiere atribución "Copernicus DEM GLO-30 © ESA"
USGS: Dominio público, sin requisitos

Ver documentación completa en el sistema.
