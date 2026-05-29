"""
Script de Prueba: Validaciones de Solapamiento de Horarios
Objetivo: Probar las validaciones implementadas en schedule_detail
"""

import sys
import io
# Fix Windows encoding issues
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

import requests
import json
from datetime import datetime, timedelta

BASE_URL = "http://localhost:8000/api"

# ====== CONFIGURACIÓN ======
# Usuario profesional con 2 servicios: 11.570.564-4
# Login como este usuario para obtener token
LOGIN_EMAIL = "sawrunner81@hotmail.com"  # Email asociado al RUT 11.570.564-4
LOGIN_PASSWORD = "12345678"  # Actualizar con la contraseña correcta

# ====== FUNCIONES AUXILIARES ======

def login():
    """Obtiene token de autenticación"""
    response = requests.post(f"{BASE_URL}/auth/login/", json={
        "username": LOGIN_EMAIL,
        "password": LOGIN_PASSWORD
    })
    if response.status_code == 200:
        data = response.json()
        print(f"✅ Login exitoso: {LOGIN_EMAIL}")
        return data.get("access")
    else:
        print(f"❌ Error en login: {response.status_code}")
        print(response.text)
        return None

def get_services(token):
    """Obtiene servicios del profesional autenticado"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/my/services/", headers=headers)
    if response.status_code == 200:
        data = response.json()
        services = data.get('servicios', [])
        print(f"✅ Servicios obtenidos: {len(services)}")
        for svc in services:
            print(f"  - {svc.get('id_servicio_profesional')}: {svc.get('categoria', 'N/A')} ({svc.get('estado_verificacion', 'N/A')})")
        return services
    else:
        print(f"❌ Error obteniendo servicios: {response.status_code}")
        return []

def get_schedule(token, service_id):
    """Obtiene horario actual de un servicio"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.get(f"{BASE_URL}/schedule/{service_id}/", headers=headers)
    if response.status_code == 200:
        print(f"✅ Horario obtenido para servicio {service_id}")
        return response.json()
    else:
        print(f"❌ Error obteniendo horario: {response.status_code}")
        return None

def update_schedule(token, service_id, schedule_data):
    """Actualiza horario de un servicio"""
    headers = {"Authorization": f"Bearer {token}"}
    response = requests.put(f"{BASE_URL}/schedule/{service_id}/", 
                           json=schedule_data, 
                           headers=headers)
    return response

# ====== CASOS DE PRUEBA ======

def test_1_valid_schedule(token, service_id):
    """✅ Caso 1: Horario válido sin conflictos"""
    print("\n" + "="*60)
    print("TEST 1: Crear horario válido (Lunes 09:00-13:00)")
    print("="*60)
    
    schedule = {
        "weekly_template": {
            "monday": {"enabled": True, "timeSlots": [{"start": "09:00", "end": "13:00"}]},
            "tuesday": {"enabled": False, "timeSlots": []},
            "wednesday": {"enabled": False, "timeSlots": []},
            "thursday": {"enabled": False, "timeSlots": []},
            "friday": {"enabled": False, "timeSlots": []},
            "saturday": {"enabled": False, "timeSlots": []},
            "sunday": {"enabled": False, "timeSlots": []}
        },
        "unavailabilities": [],
        "custom_periods": []
    }
    
    response = update_schedule(token, service_id, schedule)
    if response.status_code == 200:
        print("✅ ÉXITO: Horario creado correctamente")
    else:
        print(f"❌ ERROR: {response.status_code}")
        print(response.text)
    return response.status_code == 200

def test_2_intra_service_overlap(token, service_id):
    """❌ Caso 2: Solapamiento dentro del mismo servicio"""
    print("\n" + "="*60)
    print("TEST 2: Intentar crear franjas solapadas (Martes 08:00-12:00 y 10:00-14:00)")
    print("="*60)
    
    schedule = {
        "weekly_template": {
            "monday": {"enabled": False, "timeSlots": []},
            "tuesday": {
                "enabled": True, 
                "timeSlots": [
                    {"start": "08:00", "end": "12:00"},
                    {"start": "10:00", "end": "14:00"}  # ❌ Solapa con anterior
                ]
            },
            "wednesday": {"enabled": False, "timeSlots": []},
            "thursday": {"enabled": False, "timeSlots": []},
            "friday": {"enabled": False, "timeSlots": []},
            "saturday": {"enabled": False, "timeSlots": []},
            "sunday": {"enabled": False, "timeSlots": []}
        },
        "unavailabilities": [],
        "custom_periods": []
    }
    
    response = update_schedule(token, service_id, schedule)
    if response.status_code == 400:
        print("✅ ÉXITO: Validación funcionó - rechazó solapamiento intra-service")
        print(f"   Mensaje: {response.json().get('message')}")
    else:
        print(f"❌ ERROR: Debería rechazar con 400, pero devolvió {response.status_code}")
        print(response.text)
    return response.status_code == 400

def test_3_cross_service_overlap(token, service_ids):
    """❌ Caso 3: Solapamiento entre servicios del mismo profesional"""
    if len(service_ids) < 2:
        print("\n⚠️  TEST 3 OMITIDO: Se necesitan al menos 2 servicios")
        return True
    
    print("\n" + "="*60)
    print("TEST 3: Intentar crear horario que solape con otro servicio")
    print(f"         Servicio 1: Lunes 09:00-13:00")
    print(f"         Servicio 2: Lunes 10:00-14:00 (❌ solapa)")
    print("="*60)
    
    # Crear horario en servicio 1
    schedule1 = {
        "weekly_template": {
            "monday": {"enabled": True, "timeSlots": [{"start": "09:00", "end": "13:00"}]},
            "tuesday": {"enabled": False, "timeSlots": []},
            "wednesday": {"enabled": False, "timeSlots": []},
            "thursday": {"enabled": False, "timeSlots": []},
            "friday": {"enabled": False, "timeSlots": []},
            "saturday": {"enabled": False, "timeSlots": []},
            "sunday": {"enabled": False, "timeSlots": []}
        },
        "unavailabilities": [],
        "custom_periods": []
    }
    
    response1 = update_schedule(token, service_ids[0], schedule1)
    if response1.status_code != 200:
        print(f"❌ ERROR: No pudo crear horario base en servicio 1: {response1.status_code}")
        return False
    print(f"✅ Horario base creado en servicio 1")
    
    # Intentar crear horario solapado en servicio 2
    schedule2 = {
        "weekly_template": {
            "monday": {"enabled": True, "timeSlots": [{"start": "10:00", "end": "14:00"}]},
            "tuesday": {"enabled": False, "timeSlots": []},
            "wednesday": {"enabled": False, "timeSlots": []},
            "thursday": {"enabled": False, "timeSlots": []},
            "friday": {"enabled": False, "timeSlots": []},
            "saturday": {"enabled": False, "timeSlots": []},
            "sunday": {"enabled": False, "timeSlots": []}
        },
        "unavailabilities": [],
        "custom_periods": []
    }
    
    response2 = update_schedule(token, service_ids[1], schedule2)
    if response2.status_code == 409:
        print("✅ ÉXITO: Validación funcionó - rechazó solapamiento cross-service")
        print(f"   Mensaje: {response2.json().get('message')}")
    else:
        print(f"❌ ERROR: Debería rechazar con 409 CONFLICT, pero devolvió {response2.status_code}")
        print(response2.text)
    return response2.status_code == 409

def test_4_short_duration(token, service_id):
    """❌ Caso 4: Franja menor a 30 minutos"""
    print("\n" + "="*60)
    print("TEST 4: Intentar crear franja menor a 30 min (09:00-09:15)")
    print("="*60)
    
    schedule = {
        "weekly_template": {
            "monday": {"enabled": False, "timeSlots": []},
            "tuesday": {"enabled": False, "timeSlots": []},
            "wednesday": {"enabled": True, "timeSlots": [{"start": "09:00", "end": "09:15"}]},
            "thursday": {"enabled": False, "timeSlots": []},
            "friday": {"enabled": False, "timeSlots": []},
            "saturday": {"enabled": False, "timeSlots": []},
            "sunday": {"enabled": False, "timeSlots": []}
        },
        "unavailabilities": [],
        "custom_periods": []
    }
    
    response = update_schedule(token, service_id, schedule)
    if response.status_code == 400:
        print("✅ ÉXITO: Validación funcionó - rechazó franja muy corta")
        print(f"   Mensaje: {response.json().get('message')}")
    else:
        print(f"❌ ERROR: Debería rechazar con 400, pero devolvió {response.status_code}")
        print(response.text)
    return response.status_code == 400

def test_5_long_duration(token, service_id):
    """❌ Caso 5: Franja mayor a 12 horas"""
    print("\n" + "="*60)
    print("TEST 5: Intentar crear franja mayor a 12 horas (08:00-21:00)")
    print("="*60)
    
    schedule = {
        "weekly_template": {
            "monday": {"enabled": False, "timeSlots": []},
            "tuesday": {"enabled": False, "timeSlots": []},
            "wednesday": {"enabled": False, "timeSlots": []},
            "thursday": {"enabled": True, "timeSlots": [{"start": "08:00", "end": "21:00"}]},
            "friday": {"enabled": False, "timeSlots": []},
            "saturday": {"enabled": False, "timeSlots": []},
            "sunday": {"enabled": False, "timeSlots": []}
        },
        "unavailabilities": [],
        "custom_periods": []
    }
    
    response = update_schedule(token, service_id, schedule)
    if response.status_code == 400:
        print("✅ ÉXITO: Validación funcionó - rechazó franja muy larga")
        print(f"   Mensaje: {response.json().get('message')}")
    else:
        print(f"❌ ERROR: Debería rechazar con 400, pero devolvió {response.status_code}")
        print(response.text)
    return response.status_code == 400

def test_6_custom_period_cross_service(token, service_ids):
    """❌ Caso 6: Período personalizado que solapa con otro servicio"""
    if len(service_ids) < 2:
        print("\n⚠️  TEST 6 OMITIDO: Se necesitan al menos 2 servicios")
        return True
    
    print("\n" + "="*60)
    print("TEST 6: Período personalizado solapando con otro servicio")
    print("="*60)
    
    # Crear horario base en servicio 1 (Viernes 09:00-13:00)
    schedule1 = {
        "weekly_template": {
            "monday": {"enabled": False, "timeSlots": []},
            "tuesday": {"enabled": False, "timeSlots": []},
            "wednesday": {"enabled": False, "timeSlots": []},
            "thursday": {"enabled": False, "timeSlots": []},
            "friday": {"enabled": True, "timeSlots": [{"start": "09:00", "end": "13:00"}]},
            "saturday": {"enabled": False, "timeSlots": []},
            "sunday": {"enabled": False, "timeSlots": []}
        },
        "unavailabilities": [],
        "custom_periods": []
    }
    
    response1 = update_schedule(token, service_ids[0], schedule1)
    if response1.status_code != 200:
        print(f"❌ ERROR: No pudo crear horario base: {response1.status_code}")
        return False
    print(f"✅ Horario base creado (Servicio 1: Viernes 09:00-13:00)")
    
    # Intentar crear período personalizado en servicio 2 que solape
    start_date = (datetime.now() + timedelta(days=7)).date().isoformat()
    end_date = (datetime.now() + timedelta(days=14)).date().isoformat()
    
    schedule2 = {
        "weekly_template": {
            "monday": {"enabled": False, "timeSlots": []},
            "tuesday": {"enabled": False, "timeSlots": []},
            "wednesday": {"enabled": False, "timeSlots": []},
            "thursday": {"enabled": False, "timeSlots": []},
            "friday": {"enabled": False, "timeSlots": []},
            "saturday": {"enabled": False, "timeSlots": []},
            "sunday": {"enabled": False, "timeSlots": []}
        },
        "unavailabilities": [],
        "custom_periods": [{
            "name": "Promoción especial",
            "start_date": f"{start_date}T00:00:00",
            "end_date": f"{end_date}T23:59:59",
            "weekly_template": {
                "monday": {"enabled": False, "timeSlots": []},
                "tuesday": {"enabled": False, "timeSlots": []},
                "wednesday": {"enabled": False, "timeSlots": []},
                "thursday": {"enabled": False, "timeSlots": []},
                "friday": {"enabled": True, "timeSlots": [{"start": "10:00", "end": "14:00"}]},  # ❌ Solapa con servicio 1
                "saturday": {"enabled": False, "timeSlots": []},
                "sunday": {"enabled": False, "timeSlots": []}
            }
        }]
    }
    
    response2 = update_schedule(token, service_ids[1], schedule2)
    if response2.status_code == 409:
        print("✅ ÉXITO: Validación funcionó - rechazó período personalizado con solapamiento cross-service")
        print(f"   Mensaje: {response2.json().get('message')}")
    else:
        print(f"❌ ERROR: Debería rechazar con 409 CONFLICT, pero devolvió {response2.status_code}")
        print(response2.text)
    return response2.status_code == 409

# ====== EJECUCIÓN PRINCIPAL ======

def main():
    print("\n" + "="*60)
    print("  SUITE DE PRUEBAS: VALIDACIONES DE HORARIOS")
    print("="*60)
    
    # Login
    token = login()
    if not token:
        print("\n❌ No se pudo obtener token. Verifica credenciales.")
        return
    
    # Obtener servicios
    services = get_services(token)
    if not services:
        print("\n❌ No se encontraron servicios para este profesional.")
        return
    
    service_ids = [s.get('id_servicio_profesional') for s in services if s.get('id_servicio_profesional')]
    if not service_ids:
        print("\n❌ No hay servicios con ID válido.")
        return
    
    print(f"\n📋 Se probarán {len(service_ids)} servicio(s)")
    
    # Ejecutar tests
    results = []
    
    results.append(("Test 1: Horario válido", test_1_valid_schedule(token, service_ids[0])))
    results.append(("Test 2: Solapamiento intra-service", test_2_intra_service_overlap(token, service_ids[0])))
    
    if len(service_ids) >= 2:
        results.append(("Test 3: Solapamiento cross-service", test_3_cross_service_overlap(token, service_ids)))
    
    results.append(("Test 4: Duración < 30 min", test_4_short_duration(token, service_ids[0])))
    results.append(("Test 5: Duración > 12 horas", test_5_long_duration(token, service_ids[0])))
    
    if len(service_ids) >= 2:
        results.append(("Test 6: Período personalizado cross-service", test_6_custom_period_cross_service(token, service_ids)))
    
    # Resumen
    print("\n" + "="*60)
    print("  RESUMEN DE PRUEBAS")
    print("="*60)
    passed = sum(1 for _, r in results if r)
    total = len(results)
    for name, passed_test in results:
        status = "✅ PASS" if passed_test else "❌ FAIL"
        print(f"{status} - {name}")
    
    print(f"\n📊 Resultado: {passed}/{total} pruebas exitosas ({passed*100//total}%)")
    
    if passed == total:
        print("\n🎉 ¡TODAS LAS VALIDACIONES FUNCIONAN CORRECTAMENTE!")
    else:
        print("\n⚠️  Algunas validaciones fallaron. Revisar implementación.")

if __name__ == "__main__":
    main()
