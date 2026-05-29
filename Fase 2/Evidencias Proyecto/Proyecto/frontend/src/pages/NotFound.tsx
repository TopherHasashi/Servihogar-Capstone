import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="w-full px-4 py-20 text-center">
      <h1 className="text-5xl text-gray-900 mb-4">404</h1>
      <p className="text-gray-600 mb-6">La página que buscas no existe.</p>
      <Link to="/" className="text-primary">Volver al inicio</Link>
    </div>
  )
}
