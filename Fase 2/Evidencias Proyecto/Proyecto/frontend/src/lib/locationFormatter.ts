export const locationNameCorrections: Record<string, string> = {
  // Comunas
  'santiago': 'Santiago',
  'providencia': 'Providencia',
  'las condes': 'Las Condes',
  'maipu': 'Maipú',
  'nunoa': 'Ñuñoa',
  'arica': 'Arica',
  'iquique': 'Iquique',
  'alto hospicio': 'Alto Hospicio',
  'antofagasta': 'Antofagasta',
  'calama': 'Calama',
  'copiapo': 'Copiapó',
  'vallenar': 'Vallenar',
  'la serena': 'La Serena',
  'coquimbo': 'Coquimbo',
  'ovalle': 'Ovalle',
  'valparaiso': 'Valparaíso',
  'vina del mar': 'Viña del Mar',
  'quilpue': 'Quilpué',
  'villa alemana': 'Villa Alemana',
  'rancagua': 'Rancagua',
  'machali': 'Machalí',
  'talca': 'Talca',
  'curico': 'Curicó',
  'linares': 'Linares',
  'chillan': 'Chillán',
  'concepcion': 'Concepción',
  'talcahuano': 'Talcahuano',
  'los angeles': 'Los Ángeles',
  'temuco': 'Temuco',
  'padre las casas': 'Padre Las Casas',
  'valdivia': 'Valdivia',
  'puerto montt': 'Puerto Montt',
  'osorno': 'Osorno',
  'coyhaique': 'Coyhaique',
  'aysen': 'Aysén',
  'punta arenas': 'Punta Arenas',
  
  // Regiones
  'region metropolitana': 'Región Metropolitana',
  'arica y parinacota': 'Arica y Parinacota',
  'tarapaca': 'Tarapacá',
  'atacama': 'Atacama',
  'ohiggins': 'O\'Higgins',
  'maule': 'Maule',
  'nuble': 'Ñuble',
  'biobio': 'Biobío',
  'la araucania': 'La Araucanía',
  'los rios': 'Los Ríos',
  'los lagos': 'Los Lagos',
  'magallanes y antartica chilena': 'Magallanes y Antártica Chilena'
};

/**
 * Normaliza y devuelve el nombre de una ubicación (comuna o región) con sus tildes y mayúsculas correctas.
 * Si no está en el diccionario y está mal escrito, intenta capitalizarlo al menos.
 */
export function formatLocationName(name: string | null | undefined): string {
  if (!name) return '';
  
  const lowerName = name.toLowerCase().trim();
  
  if (locationNameCorrections[lowerName]) {
    return locationNameCorrections[lowerName];
  }

  // Intenta sin tildes (ej: "concepción" → "concepcion" para buscar en el diccionario)
  const normalized = lowerName.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  if (locationNameCorrections[normalized]) {
    return locationNameCorrections[normalized];
  }

  // Fallback: capitaliza solo después de espacio o al inicio (no después de caracteres acentuados)
  return lowerName.replace(/(^|\s)\S/g, (char) => char.toUpperCase());
}
