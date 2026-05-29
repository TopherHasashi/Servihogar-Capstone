import { useNavigate } from 'react-router-dom'
import AllServices from '../components/AllServices'

export default function ServiciosPage() {
  const navigate = useNavigate()

  const handleServiceSelect = () => {
    // Redirigir al login cuando el usuario no ha iniciado sesión
    navigate('/login')
  }

  return (
    <AllServices 
      onServiceSelect={handleServiceSelect}
    />
  )
}
