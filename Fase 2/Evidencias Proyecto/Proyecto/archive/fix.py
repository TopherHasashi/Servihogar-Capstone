import os

filepaths = [
    't:/Github/ServiHogar/Fase 2/Evidencias Proyecto/Proyecto/frontend/src/components/AllServices.tsx',
    't:/Github/ServiHogar/Fase 2/Evidencias Proyecto/Proyecto/frontend/src/components/ServiceRequest.tsx',
    't:/Github/ServiHogar/Fase 2/Evidencias Proyecto/Proyecto/frontend/src/pages/ProfessionalAuth.tsx'
]

reps = {
    'RegiÃ³n de ValparaÃso':'Valparaíso',
    'ValparaÃso':'Valparaíso',
    'ViÃ±a del Mar':'Viña del Mar',
    'QuilpuÃ©':'Quilpué',
    'ConcÃ³n':'Concón',
    'RegiÃ³n del BiobÃo':'Biobío',
    'ConcepciÃ³n':'Concepción',
    'ChillÃ¡n':'Chillán',
    'Los Ãngeles':'Los Ángeles',
    'RegiÃ³n de la AraucanÃa':'La Araucanía',
    'PucÃ³n':'Pucón',
    'RegiÃ³n de Los Lagos':'Los Lagos',
    'RegiÃ³n de Antofagasta':'Antofagasta',
    'RegiÃ³n de Atacama':'Atacama',
    'CopiapÃ³':'Copiapó',
    'RegiÃ³n de Coquimbo':'Coquimbo',
    "RegiÃ³n del Libertador":"O'Higgins",
    'RegiÃ³n del Maule':'Maule',
    'CuricÃ³':'Curicó',
    'RegiÃ³n de AysÃ©n':'Aysén',
    'Puerto AysÃ©n':'Puerto Aysén',
    'RegiÃ³n de Magallanes':'Magallanes y Antártica Chilena',
    'RegiÃ³n de Arica y Parinacota':'Arica y Parinacota',
    'RegiÃ³n de TarapacÃ¡':'Tarapacá',
    'RegiÃ³n de Ã‘uble':'Ñuble',
    'Ã‘uÃ±oa':'Ñuñoa',
    'MaipÃº':'Maipú',
    'BIOBIO_REGION_NAME = "Región del Biobío"': 'BIOBIO_REGION_NAME = "Biobío"',
    'BIOBIO_REGION_NAME = "RegiÃ³n del BiobÃo"': 'BIOBIO_REGION_NAME = "Biobío"'
}

for fp in filepaths:
    if os.path.exists(fp):
        with open(fp, 'r', encoding='utf-8') as f:
            content = f.read()
        for k, v in reps.items():
            content = content.replace(k, v)
        with open(fp, 'w', encoding='utf-8') as f:
            f.write(content)
        print("Fixed", fp)
