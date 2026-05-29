-- Correcciones faltantes en nombres de regiones
BEGIN;
UPDATE region SET nombre='Tarapacá' WHERE codigo='I' AND nombre <> 'Tarapacá';
UPDATE region SET nombre='Valparaíso' WHERE codigo='V' AND nombre <> 'Valparaíso';
UPDATE region SET nombre='Biobío' WHERE codigo='VIII' AND nombre <> 'Biobío';
UPDATE region SET nombre='La Araucanía' WHERE codigo='IX' AND nombre <> 'La Araucanía';
UPDATE region SET nombre='Los Ríos' WHERE codigo='XIV' AND nombre <> 'Los Ríos';
UPDATE region SET nombre='Aysén' WHERE codigo='XI' AND nombre <> 'Aysén';
UPDATE region SET nombre='Magallanes y Antártica Chilena' WHERE codigo='XII' AND nombre <> 'Magallanes y Antártica Chilena';
COMMIT;
