-- Migration: Switch weekday index to Monday=0 .. Sunday=6
-- WARNING: Run once on existing databases that currently use 0=Domingo .. 6=Sábado.
-- Make a backup before running. This operation is fast and safe but not idempotent.

BEGIN;

-- Convert values: new = (old + 6) % 7
UPDATE horario_profesional
SET dia_semana = (dia_semana + 6) % 7;

-- Optional: update column comment for clarity (requires appropriate privileges)
COMMENT ON COLUMN horario_profesional.dia_semana IS '0=Lunes, 1=Martes, 2=Miércoles, 3=Jueves, 4=Viernes, 5=Sábado, 6=Domingo';

COMMIT;
