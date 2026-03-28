'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeftRight, Trophy, Star } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

export default function Home() {
  const { currentUser, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading || !currentUser || typeof window === 'undefined') return

    const target = currentUser.role === 'brand' ? '/brand/dashboard' : '/home'

    if (window.location.pathname !== target) {
      window.location.replace(target)
    }
  }, [currentUser, isLoading])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (currentUser) return null

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-8 py-4 border-b border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">CS</span>
          </div>
          <span className="font-bold text-gray-900 text-lg">CollabSpace</span>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="text-gray-600 hover:text-gray-900 font-medium px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/signup"
            className="bg-indigo-600 text-white font-medium px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Registrarse
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-700 rounded-full px-4 py-1.5 text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse" />
          Plataforma N°1 de colaboraciones en Argentina
        </div>

        <h1 className="text-6xl font-extrabold text-gray-900 leading-tight mb-6 max-w-3xl">
          Conecta{' '}
          <span className="text-indigo-600">marcas</span>
          {' '}con{' '}
          <span className="text-violet-600">creadores</span>
        </h1>

        <p className="text-xl text-gray-500 max-w-xl mb-10 leading-relaxed">
          La plataforma donde las marcas encuentran a sus embajadores ideales y los creadores construyen carreras sostenibles.
        </p>

        <div className="flex items-center gap-4 flex-wrap justify-center">
          <Link
            href="/signup"
            className="bg-indigo-600 text-white font-semibold px-8 py-4 rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 text-lg"
            onClick={() => sessionStorage.setItem('signup_role', 'brand')}
          >
            Soy una Marca
          </Link>
          <Link
            href="/signup"
            className="border-2 border-violet-600 text-violet-600 font-semibold px-8 py-4 rounded-xl hover:bg-violet-50 transition-all text-lg"
            onClick={() => sessionStorage.setItem('signup_role', 'user')}
          >
            Soy Creador
          </Link>
        </div>

        <p className="text-sm text-gray-400 mt-6">
          Gratis para empezar · Sin tarjeta de crédito
        </p>
      </section>

      {/* Features */}
      <section className="bg-gray-50 py-20 px-8">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Todo lo que necesitás en un solo lugar
          </h2>
          <div className="grid grid-cols-3 gap-8">
            {[
              {
                icon: <ArrowLeftRight size={28} className="text-indigo-600" />,
                bg: 'bg-indigo-50',
                title: 'Canjes',
                desc: 'Las marcas ofrecen productos o dinero a cambio de contenido auténtico. Aplicá a los que te interesan.',
              },
              {
                icon: <Trophy size={28} className="text-orange-500" />,
                bg: 'bg-orange-50',
                title: 'Retos',
                desc: 'Participá en challenges con leaderboard. Mostrá tu creatividad y ganá premios exclusivos.',
              },
              {
                icon: <Star size={28} className="text-yellow-500" />,
                bg: 'bg-yellow-50',
                title: 'Sistema de Puntos',
                desc: 'Acumulá puntos con cada colaboración. Subí de nivel y accedé a recompensas premium.',
              },
            ].map((f) => (
              <div key={f.title} className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 ${f.bg}`}>{f.icon}</div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-20 px-8">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-8 text-center">
          {[
            { number: '2,500+', label: 'Creadores activos' },
            { number: '150+', label: 'Marcas registradas' },
            { number: '$4.2M', label: 'En colaboraciones' },
          ].map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-extrabold text-indigo-600 mb-2">{s.number}</div>
              <div className="text-gray-500">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="bg-indigo-600 py-16 px-8 text-center">
        <h2 className="text-3xl font-bold text-white mb-4">¿Listo para empezar?</h2>
        <p className="text-indigo-200 mb-8 text-lg">Unite a la comunidad de colaboraciones más grande de Argentina</p>
        <Link
          href="/signup"
          className="bg-white text-indigo-600 font-semibold px-8 py-4 rounded-xl hover:bg-indigo-50 transition-colors text-lg inline-block"
        >
          Crear cuenta gratis
        </Link>
      </section>

      {/* Footer */}
      <footer className="py-8 px-8 border-t border-gray-100 text-center text-gray-400 text-sm">
        © 2025 CollabSpace · Todos los derechos reservados
      </footer>
    </div>
  )
}
