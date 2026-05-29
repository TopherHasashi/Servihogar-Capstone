import fs from 'fs';
import path from 'path';

const filePaths = [
  path.join(__dirname, 'frontend/src/components/AllServices.tsx'),
  path.join(__dirname, 'frontend/src/components/ServiceRequest.tsx'),
  path.join(__dirname, 'frontend/src/pages/ProfessionalAuth.tsx')
]

const replacements = {
  'RegiÃ³n de ValparaÃso': 'Valparaíso',
  'ValparaÃso': 'Valparaíso',
  'ViÃ±a del Mar': 'Viña del Mar',
  'QuilpuÃ©': 'Quilpué',
  'ConcÃ³n': 'Concón',
  'RegiÃ³n del BiobÃo': 'Biobío',
  'ConcepciÃ³n': 'Concepción',
  'ChillÃ¡n': 'Chillán',
  'Los Ãngeles': 'Los Ángeles',
  'RegiÃ³n de la AraucanÃa': 'La Araucanía',
  'PucÃ³n': 'Pucón',
  'RegiÃ³n de Los Lagos': 'Los Lagos',
  'RegiÃ³n de Antofagasta': 'Antofagasta',
  'RegiÃ³n de Atacama': 'Atacama',
  'CopiapÃ³': 'Copiapó',
  'RegiÃ³n de Coquimbo': 'Coquimbo',
  'RegiÃ³n del Libertador': 'O\'Higgins',
  'RegiÃ³n del Maule': 'Maule',
  'CuricÃ³': 'Curicó',
  'RegiÃ³n de AysÃ©n': 'Aysén',
  'Puerto AysÃ©n': 'Puerto Aysén',
  'RegiÃ³n de Magallanes': 'Magallanes y Antártica Chilena',
  'RegiÃ³n de Arica y Parinacota': 'Arica y Parinacota',
  'RegiÃ³n de TarapacÃ¡': 'Tarapacá',
  'RegiÃ³n de Ã‘uble': 'Ñuble',
  'Ã‘uÃ±oa': 'Ñuñoa',
  'MaipÃº': 'Maipú',
  'BIOBIO_REGION_NAME = "Región del Biobío"': 'BIOBIO_REGION_NAME = "Biobío"'
};

for (const fp of filePaths) {
  if (fs.existsSync(fp)) {
    let content = fs.readFileSync(fp, 'utf-8');
    for (const [key, val] of Object.entries(replacements)) {
      content = content.replace(new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'), val);
    }
    fs.writeFileSync(fp, content, 'utf-8');
    console.log('Fixed', fp);
  }
}
