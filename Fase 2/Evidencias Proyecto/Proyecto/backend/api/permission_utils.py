from typing import Optional


def get_user_role_by_email(cur, email: str) -> Optional[str]:
	"""Resolve current role for a user email across supported schemas."""
	try:
		cur.execute(
			"SELECT rol FROM usuario WHERE email = %s",
			[email],
		)
		row = cur.fetchone()
		if row and row[0]:
			return row[0]
	except Exception:
		pass

	try:
		cur.execute(
			"""
			SELECT r.nombre
			FROM historial_rol_usuario h
			JOIN rol r ON r.id_rol = h.id_rol
			JOIN usuario u ON u.rut = h.rut_usuario
			WHERE u.email = %s
			ORDER BY h.cambiado_en DESC
			LIMIT 1
			""",
			[email],
		)
		row = cur.fetchone()
		if row and row[0]:
			return row[0]
	except Exception:
		pass

	# Fallback: consultar Django auth_user + api_profile
	try:
		cur.execute(
			"""
			SELECT au.is_superuser, au.is_staff, ap.role
			FROM auth_user au
			LEFT JOIN api_profile ap ON ap.user_id = au.id
			WHERE au.email = %s
			LIMIT 1
			""",
			[email],
		)
		row = cur.fetchone()
		if row:
			is_superuser, is_staff, profile_role = row
			if is_superuser or is_staff:
				return 'administrador'
			if profile_role:
				return profile_role
	except Exception:
		pass

	return None
