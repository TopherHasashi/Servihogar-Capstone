-- Correcciones de nombres con tildes y ñ para regiones y comunas
-- Ejecutar en UTF-8
BEGIN;

-- Regiones
UPDATE region SET nombre = 'Región Metropolitana' WHERE codigo = 'RM' AND nombre <> 'Región Metropolitana';
UPDATE region SET nombre = 'Ñuble' WHERE codigo = 'XVI' AND nombre <> 'Ñuble';

-- Comunas RM
WITH r AS (SELECT id_region FROM region WHERE codigo='RM')
UPDATE comuna c SET nombre='Maipú' FROM r WHERE c.id_region=r.id_region AND c.codigo='MAIP' AND c.nombre <> 'Maipú';
WITH r AS (SELECT id_region FROM region WHERE codigo='RM')
UPDATE comuna c SET nombre='Ñuñoa' FROM r WHERE c.id_region=r.id_region AND c.codigo='NUNO' AND c.nombre <> 'Ñuñoa';

-- Tarapacá (I)
WITH r AS (SELECT id_region FROM region WHERE codigo='I')
UPDATE comuna c SET nombre='Camiña' FROM r WHERE c.id_region=r.id_region AND c.codigo='CAMI' AND c.nombre <> 'Camiña';

-- Antofagasta (II)
WITH r AS (SELECT id_region FROM region WHERE codigo='II')
UPDATE comuna c SET nombre='Ollagüe' FROM r WHERE c.id_region=r.id_region AND c.codigo='OLL' AND c.nombre <> 'Ollagüe';
WITH r AS (SELECT id_region FROM region WHERE codigo='II')
UPDATE comuna c SET nombre='María Elena' FROM r WHERE c.id_region=r.id_region AND c.codigo='MEL' AND c.nombre <> 'María Elena';

-- Atacama (III)
WITH r AS (SELECT id_region FROM region WHERE codigo='III')
UPDATE comuna c SET nombre='Copiapó' FROM r WHERE c.id_region=r.id_region AND c.codigo='COP' AND c.nombre <> 'Copiapó';
WITH r AS (SELECT id_region FROM region WHERE codigo='III')
UPDATE comuna c SET nombre='Chañaral' FROM r WHERE c.id_region=r.id_region AND c.codigo='CHA' AND c.nombre <> 'Chañaral';

-- Coquimbo (IV)
WITH r AS (SELECT id_region FROM region WHERE codigo='IV')
UPDATE comuna c SET nombre='Vicuña' FROM r WHERE c.id_region=r.id_region AND c.codigo='VIC' AND c.nombre <> 'Vicuña';
WITH r AS (SELECT id_region FROM region WHERE codigo='IV')
UPDATE comuna c SET nombre='Combarbalá' FROM r WHERE c.id_region=r.id_region AND c.codigo='COM' AND c.nombre <> 'Combarbalá';
WITH r AS (SELECT id_region FROM region WHERE codigo='IV')
UPDATE comuna c SET nombre='Río Hurtado' FROM r WHERE c.id_region=r.id_region AND c.codigo='RH' AND c.nombre <> 'Río Hurtado';

-- Valparaíso (V)
WITH r AS (SELECT id_region FROM region WHERE codigo='V')
UPDATE comuna c SET nombre='Valparaíso' FROM r WHERE c.id_region=r.id_region AND c.codigo='VALP' AND c.nombre <> 'Valparaíso';
WITH r AS (SELECT id_region FROM region WHERE codigo='V')
UPDATE comuna c SET nombre='Viña del Mar' FROM r WHERE c.id_region=r.id_region AND c.codigo='VDM' AND c.nombre <> 'Viña del Mar';
WITH r AS (SELECT id_region FROM region WHERE codigo='V')
UPDATE comuna c SET nombre='Concón' FROM r WHERE c.id_region=r.id_region AND c.codigo='CONC' AND c.nombre <> 'Concón';
WITH r AS (SELECT id_region FROM region WHERE codigo='V')
UPDATE comuna c SET nombre='Puchuncaví' FROM r WHERE c.id_region=r.id_region AND c.codigo='PUC' AND c.nombre <> 'Puchuncaví';
WITH r AS (SELECT id_region FROM region WHERE codigo='V')
UPDATE comuna c SET nombre='Juan Fernández' FROM r WHERE c.id_region=r.id_region AND c.codigo='JF' AND c.nombre <> 'Juan Fernández';
WITH r AS (SELECT id_region FROM region WHERE codigo='V')
UPDATE comuna c SET nombre='Santa María' FROM r WHERE c.id_region=r.id_region AND c.codigo='SM' AND c.nombre <> 'Santa María';
WITH r AS (SELECT id_region FROM region WHERE codigo='V')
UPDATE comuna c SET nombre='Quilpué' FROM r WHERE c.id_region=r.id_region AND c.codigo='QPE' AND c.nombre <> 'Quilpué';
WITH r AS (SELECT id_region FROM region WHERE codigo='V')
UPDATE comuna c SET nombre='Olmué' FROM r WHERE c.id_region=r.id_region AND c.codigo='OLM' AND c.nombre <> 'Olmué';

-- O'Higgins (VI)
WITH r AS (SELECT id_region FROM region WHERE codigo='VI')
UPDATE comuna c SET nombre='Machalí' FROM r WHERE c.id_region=r.id_region AND c.codigo='MAC' AND c.nombre <> 'Machalí';
WITH r AS (SELECT id_region FROM region WHERE codigo='VI')
UPDATE comuna c SET nombre='Doñihue' FROM r WHERE c.id_region=r.id_region AND c.codigo='DON' AND c.nombre <> 'Doñihue';
WITH r AS (SELECT id_region FROM region WHERE codigo='VI')
UPDATE comuna c SET nombre='Requínoa' FROM r WHERE c.id_region=r.id_region AND c.codigo='REQ' AND c.nombre <> 'Requínoa';
WITH r AS (SELECT id_region FROM region WHERE codigo='VI')
UPDATE comuna c SET nombre='Marchigüe' FROM r WHERE c.id_region=r.id_region AND c.codigo='MAR' AND c.nombre <> 'Marchigüe';

-- Maule (VII)
WITH r AS (SELECT id_region FROM region WHERE codigo='VII')
UPDATE comuna c SET nombre='Constitución' FROM r WHERE c.id_region=r.id_region AND c.codigo='CON' AND c.nombre <> 'Constitución';
WITH r AS (SELECT id_region FROM region WHERE codigo='VII')
UPDATE comuna c SET nombre='Río Claro' FROM r WHERE c.id_region=r.id_region AND c.codigo='RCL' AND c.nombre <> 'Río Claro';
WITH r AS (SELECT id_region FROM region WHERE codigo='VII')
UPDATE comuna c SET nombre='Curicó' FROM r WHERE c.id_region=r.id_region AND c.codigo='CURC' AND c.nombre <> 'Curicó';
WITH r AS (SELECT id_region FROM region WHERE codigo='VII')
UPDATE comuna c SET nombre='Hualañé' FROM r WHERE c.id_region=r.id_region AND c.codigo='HUA2' AND c.nombre <> 'Hualañé';
WITH r AS (SELECT id_region FROM region WHERE codigo='VII')
UPDATE comuna c SET nombre='Licantén' FROM r WHERE c.id_region=r.id_region AND c.codigo='LIC' AND c.nombre <> 'Licantén';
WITH r AS (SELECT id_region FROM region WHERE codigo='VII')
UPDATE comuna c SET nombre='Vichuquén' FROM r WHERE c.id_region=r.id_region AND c.codigo='VIC2' AND c.nombre <> 'Vichuquén';
WITH r AS (SELECT id_region FROM region WHERE codigo='VII')
UPDATE comuna c SET nombre='Colbún' FROM r WHERE c.id_region=r.id_region AND c.codigo='COLB' AND c.nombre <> 'Colbún';
WITH r AS (SELECT id_region FROM region WHERE codigo='VII')
UPDATE comuna c SET nombre='Longaví' FROM r WHERE c.id_region=r.id_region AND c.codigo='LON' AND c.nombre <> 'Longaví';

-- Ñuble (XVI)
WITH r AS (SELECT id_region FROM region WHERE codigo='XVI')
UPDATE comuna c SET nombre='Chillán' FROM r WHERE c.id_region=r.id_region AND c.codigo='CHN' AND c.nombre <> 'Chillán';
WITH r AS (SELECT id_region FROM region WHERE codigo='XVI')
UPDATE comuna c SET nombre='Chillán Viejo' FROM r WHERE c.id_region=r.id_region AND c.codigo='CHV' AND c.nombre <> 'Chillán Viejo';
WITH r AS (SELECT id_region FROM region WHERE codigo='XVI')
UPDATE comuna c SET nombre='Quillón' FROM r WHERE c.id_region=r.id_region AND c.codigo='QUI2' AND c.nombre <> 'Quillón';
WITH r AS (SELECT id_region FROM region WHERE codigo='XVI')
UPDATE comuna c SET nombre='San Fabián' FROM r WHERE c.id_region=r.id_region AND c.codigo='SFB' AND c.nombre <> 'San Fabián';
WITH r AS (SELECT id_region FROM region WHERE codigo='XVI')
UPDATE comuna c SET nombre='Ñiquén' FROM r WHERE c.id_region=r.id_region AND c.codigo='NIQ' AND c.nombre <> 'Ñiquén';
WITH r AS (SELECT id_region FROM region WHERE codigo='XVI')
UPDATE comuna c SET nombre='San Nicolás' FROM r WHERE c.id_region=r.id_region AND c.codigo='SNI' AND c.nombre <> 'San Nicolás';
WITH r AS (SELECT id_region FROM region WHERE codigo='XVI')
UPDATE comuna c SET nombre='Ránquil' FROM r WHERE c.id_region=r.id_region AND c.codigo='RAN' AND c.nombre <> 'Ránquil';

-- Biobío (VIII)
WITH r AS (SELECT id_region FROM region WHERE codigo='VIII')
UPDATE comuna c SET nombre='Concepción' FROM r WHERE c.id_region=r.id_region AND c.codigo='CONC2' AND c.nombre <> 'Concepción';
WITH r AS (SELECT id_region FROM region WHERE codigo='VIII')
UPDATE comuna c SET nombre='Hualpén' FROM r WHERE c.id_region=r.id_region AND c.codigo='HUA4' AND c.nombre <> 'Hualpén';
WITH r AS (SELECT id_region FROM region WHERE codigo='VIII')
UPDATE comuna c SET nombre='Tomé' FROM r WHERE c.id_region=r.id_region AND c.codigo='TOM' AND c.nombre <> 'Tomé';
WITH r AS (SELECT id_region FROM region WHERE codigo='VIII')
UPDATE comuna c SET nombre='Los Ángeles' FROM r WHERE c.id_region=r.id_region AND c.codigo='LAN2' AND c.nombre <> 'Los Ángeles';
WITH r AS (SELECT id_region FROM region WHERE codigo='VIII')
UPDATE comuna c SET nombre='Mulchén' FROM r WHERE c.id_region=r.id_region AND c.codigo='MUL' AND c.nombre <> 'Mulchén';
WITH r AS (SELECT id_region FROM region WHERE codigo='VIII')
UPDATE comuna c SET nombre='Santa Bárbara' FROM r WHERE c.id_region=r.id_region AND c.codigo='SBA' AND c.nombre <> 'Santa Bárbara';
WITH r AS (SELECT id_region FROM region WHERE codigo='VIII')
UPDATE comuna c SET nombre='Alto Biobío' FROM r WHERE c.id_region=r.id_region AND c.codigo='ABI' AND c.nombre <> 'Alto Biobío';
WITH r AS (SELECT id_region FROM region WHERE codigo='VIII')
UPDATE comuna c SET nombre='Cañete' FROM r WHERE c.id_region=r.id_region AND c.codigo='CAN2' AND c.nombre <> 'Cañete';
WITH r AS (SELECT id_region FROM region WHERE codigo='VIII')
UPDATE comuna c SET nombre='Los Álamos' FROM r WHERE c.id_region=r.id_region AND c.codigo='LAL' AND c.nombre <> 'Los Álamos';
WITH r AS (SELECT id_region FROM region WHERE codigo='VIII')
UPDATE comuna c SET nombre='Tirúa' FROM r WHERE c.id_region=r.id_region AND c.codigo='TIR' AND c.nombre <> 'Tirúa';

-- La Araucanía (IX)
WITH r AS (SELECT id_region FROM region WHERE codigo='IX')
UPDATE comuna c SET nombre='Pitrufquén' FROM r WHERE c.id_region=r.id_region AND c.codigo='PIT' AND c.nombre <> 'Pitrufquén';
WITH r AS (SELECT id_region FROM region WHERE codigo='IX')
UPDATE comuna c SET nombre='Pucón' FROM r WHERE c.id_region=r.id_region AND c.codigo='PUC2' AND c.nombre <> 'Pucón';
WITH r AS (SELECT id_region FROM region WHERE codigo='IX')
UPDATE comuna c SET nombre='Toltén' FROM r WHERE c.id_region=r.id_region AND c.codigo='TOL' AND c.nombre <> 'Toltén';
WITH r AS (SELECT id_region FROM region WHERE codigo='IX')
UPDATE comuna c SET nombre='Vilcún' FROM r WHERE c.id_region=r.id_region AND c.codigo='VIL' AND c.nombre <> 'Vilcún';
WITH r AS (SELECT id_region FROM region WHERE codigo='IX')
UPDATE comuna c SET nombre='Curacautín' FROM r WHERE c.id_region=r.id_region AND c.codigo='CUR4' AND c.nombre <> 'Curacautín';
WITH r AS (SELECT id_region FROM region WHERE codigo='IX')
UPDATE comuna c SET nombre='Purén' FROM r WHERE c.id_region=r.id_region AND c.codigo='PUR' AND c.nombre <> 'Purén';
WITH r AS (SELECT id_region FROM region WHERE codigo='IX')
UPDATE comuna c SET nombre='Traiguén' FROM r WHERE c.id_region=r.id_region AND c.codigo='TRA' AND c.nombre <> 'Traiguén';

-- Los Ríos (XIV)
WITH r AS (SELECT id_region FROM region WHERE codigo='XIV')
UPDATE comuna c SET nombre='Máfil' FROM r WHERE c.id_region=r.id_region AND c.codigo='MAF' AND c.nombre <> 'Máfil';
WITH r AS (SELECT id_region FROM region WHERE codigo='XIV')
UPDATE comuna c SET nombre='La Unión' FROM r WHERE c.id_region=r.id_region AND c.codigo='LUN' AND c.nombre <> 'La Unión';
WITH r AS (SELECT id_region FROM region WHERE codigo='XIV')
UPDATE comuna c SET nombre='Río Bueno' FROM r WHERE c.id_region=r.id_region AND c.codigo='RBU' AND c.nombre <> 'Río Bueno';

-- Los Lagos (X)
WITH r AS (SELECT id_region FROM region WHERE codigo='X')
UPDATE comuna c SET nombre='Cochamó' FROM r WHERE c.id_region=r.id_region AND c.codigo='COC' AND c.nombre <> 'Cochamó';
WITH r AS (SELECT id_region FROM region WHERE codigo='X')
UPDATE comuna c SET nombre='Maullín' FROM r WHERE c.id_region=r.id_region AND c.codigo='MAU2' AND c.nombre <> 'Maullín';
WITH r AS (SELECT id_region FROM region WHERE codigo='X')
UPDATE comuna c SET nombre='Río Negro' FROM r WHERE c.id_region=r.id_region AND c.codigo='RNE' AND c.nombre <> 'Río Negro';
WITH r AS (SELECT id_region FROM region WHERE codigo='X')
UPDATE comuna c SET nombre='Quellón' FROM r WHERE c.id_region=r.id_region AND c.codigo='QUE' AND c.nombre <> 'Quellón';
WITH r AS (SELECT id_region FROM region WHERE codigo='X')
UPDATE comuna c SET nombre='Curaco de Vélez' FROM r WHERE c.id_region=r.id_region AND c.codigo='CDV' AND c.nombre <> 'Curaco de Vélez';
WITH r AS (SELECT id_region FROM region WHERE codigo='X')
UPDATE comuna c SET nombre='Puqueldón' FROM r WHERE c.id_region=r.id_region AND c.codigo='PUQ' AND c.nombre <> 'Puqueldón';
WITH r AS (SELECT id_region FROM region WHERE codigo='X')
UPDATE comuna c SET nombre='Queilén' FROM r WHERE c.id_region=r.id_region AND c.codigo='QEI' AND c.nombre <> 'Queilén';
WITH r AS (SELECT id_region FROM region WHERE codigo='X')
UPDATE comuna c SET nombre='Chaitén' FROM r WHERE c.id_region=r.id_region AND c.codigo='CHA3' AND c.nombre <> 'Chaitén';
WITH r AS (SELECT id_region FROM region WHERE codigo='X')
UPDATE comuna c SET nombre='Futaleufú' FROM r WHERE c.id_region=r.id_region AND c.codigo='FUT2' AND c.nombre <> 'Futaleufú';
WITH r AS (SELECT id_region FROM region WHERE codigo='X')
UPDATE comuna c SET nombre='Hualaihué' FROM r WHERE c.id_region=r.id_region AND c.codigo='HUA6' AND c.nombre <> 'Hualaihué';

-- Aysén (XI)
WITH r AS (SELECT id_region FROM region WHERE codigo='XI')
UPDATE comuna c SET nombre='Aysén' FROM r WHERE c.id_region=r.id_region AND c.codigo='AYS' AND c.nombre <> 'Aysén';
WITH r AS (SELECT id_region FROM region WHERE codigo='XI')
UPDATE comuna c SET nombre='Río Ibáñez' FROM r WHERE c.id_region=r.id_region AND c.codigo='RIB' AND c.nombre <> 'Río Ibáñez';

-- Magallanes (XII)
WITH r AS (SELECT id_region FROM region WHERE codigo='XII')
UPDATE comuna c SET nombre='Río Verde' FROM r WHERE c.id_region=r.id_region AND c.codigo='RVE' AND c.nombre <> 'Río Verde';
WITH r AS (SELECT id_region FROM region WHERE codigo='XII')
UPDATE comuna c SET nombre='Antártica' FROM r WHERE c.id_region=r.id_region AND c.codigo='ANTC' AND c.nombre <> 'Antártica';

COMMIT;
