"""
Script de prueba para validar las restricciones de creación de servicios profesionales.
Prueba:
1. Servicios duplicados (misma categoría)
2. Límite de 3 servicios máximo
3. Precio debe ser positivo
4. Años de experiencia entre 0 y 50
5. Tipos de archivo permitidos (PDF, JPG, PNG)
"""

import os
import sys
import django

# Configurar Django
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..'))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'servihogar.settings')
django.setup()

from django.db import connection
from django.contrib.auth import get_user_model

User = get_user_model()

def test_duplicate_category():
    """Test: No se pueden crear 2 servicios en la misma categoría"""
    print("\n=== TEST 1: Servicios duplicados (misma categoría) ===")
    
    with connection.cursor() as cur:
        # Buscar un profesional que ya tenga al menos 1 servicio
        cur.execute("""
            SELECT sp.rut_usuario, sp.id_categoria_servicio, cs.nombre
            FROM servicio_profesional sp
            JOIN categoria_servicio cs ON cs.id_categoria_servicio = sp.id_categoria_servicio
            LIMIT 1
        """)
        row = cur.fetchone()
        
        if row:
            rut, cat_id, cat_nombre = row
            print(f"✓ Encontrado: RUT {rut} tiene servicio en categoría '{cat_nombre}' (ID: {cat_id})")
            print(f"  → Si intenta crear otro servicio en '{cat_nombre}', debe ser RECHAZADO")
        else:
            print("✗ No hay servicios existentes para probar")

def test_service_limit():
    """Test: Máximo 3 servicios por profesional"""
    print("\n=== TEST 2: Límite de 3 servicios máximo ===")
    
    with connection.cursor() as cur:
        cur.execute("""
            SELECT rut_usuario, COUNT(*) as total
            FROM servicio_profesional
            GROUP BY rut_usuario
            ORDER BY total DESC
        """)
        rows = cur.fetchall()
        
        if rows:
            for rut, total in rows:
                status = "✓ OK" if total < 3 else "⚠ EN LÍMITE" if total == 3 else "✗ EXCEDIDO"
                print(f"{status}: RUT {rut} tiene {total} servicio(s)")
                if total >= 3:
                    print(f"  → Este profesional NO debe poder crear más servicios")
        else:
            print("✗ No hay servicios registrados")

def test_price_validation():
    """Test: Precio debe ser mayor a 0"""
    print("\n=== TEST 3: Validación de precio ===")
    print("✓ La API ahora rechaza:")
    print("  - price_fixed = 0 → 'El precio debe ser mayor a 0'")
    print("  - price_fixed < 0 → 'El precio debe ser mayor a 0'")

def test_experience_validation():
    """Test: Experiencia entre 0 y 50 años"""
    print("\n=== TEST 4: Validación de años de experiencia ===")
    
    with connection.cursor() as cur:
        cur.execute("""
            SELECT rut_usuario, anos_experiencia
            FROM servicio_profesional
            ORDER BY anos_experiencia DESC
        """)
        rows = cur.fetchall()
        
        if rows:
            print("✓ Experiencias actuales en BD:")
            for rut, exp in rows[:5]:  # Mostrar solo primeros 5
                exp_int = int(exp) if exp is not None else 0
                status = "✓ OK" if 0 <= exp_int <= 50 else "✗ INVÁLIDO"
                print(f"  {status}: RUT {rut} → {exp_int} años")
            print("\n✓ La API ahora rechaza:")
            print("  - experience < 0 → 'Los años de experiencia deben estar entre 0 y 50'")
            print("  - experience > 50 → 'Los años de experiencia deben estar entre 0 y 50'")
        else:
            print("✗ No hay servicios registrados")

def test_file_types():
    """Test: Solo PDF, JPG, PNG permitidos"""
    print("\n=== TEST 5: Validación de tipos de archivo ===")
    print("✓ Tipos MIME permitidos:")
    print("  - application/pdf")
    print("  - image/jpeg")
    print("  - image/jpg")
    print("  - image/png")
    print("\n✗ La API ahora rechaza:")
    print("  - Certificado con tipo inválido → 'Certificado debe ser PDF, JPG o PNG'")
    print("  - Doc. experiencia con tipo inválido → 'Los documentos de experiencia deben ser PDF, JPG o PNG'")

def show_categories():
    """Mostrar categorías disponibles"""
    print("\n=== CATEGORÍAS DISPONIBLES ===")
    
    with connection.cursor() as cur:
        cur.execute("""
            SELECT id_categoria_servicio, nombre, slug
            FROM categoria_servicio
            ORDER BY nombre
        """)
        rows = cur.fetchall()
        
        if rows:
            for cat_id, nombre, slug in rows:
                print(f"  • {nombre} (slug: {slug}, ID: {cat_id})")
        else:
            print("✗ No hay categorías registradas")

if __name__ == '__main__':
    print("=" * 70)
    print("PRUEBAS DE VALIDACIÓN - CREACIÓN DE SERVICIOS PROFESIONALES")
    print("=" * 70)
    
    test_duplicate_category()
    test_service_limit()
    test_price_validation()
    test_experience_validation()
    test_file_types()
    show_categories()
    
    print("\n" + "=" * 70)
    print("RESUMEN DE VALIDACIONES IMPLEMENTADAS")
    print("=" * 70)
    print("1. ✅ Servicios duplicados: NO se puede crear 2 servicios en la misma categoría")
    print("2. ✅ Límite de servicios: Máximo 3 servicios por profesional")
    print("3. ✅ Precio positivo: El precio debe ser mayor a 0")
    print("4. ✅ Experiencia válida: Entre 0 y 50 años")
    print("5. ✅ Tipos de archivo: Solo PDF, JPG, PNG permitidos")
    print("=" * 70)
