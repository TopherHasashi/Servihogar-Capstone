import { useNavigate } from 'react-router-dom'
import UserAuth from '../components/user/UserAuth'

export default function RegisterPage() {
  const navigate = useNavigate()
  const handleLogin = () => navigate('/')
  return <UserAuth onLogin={handleLogin} initialTab="register" />
}
