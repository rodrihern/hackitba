'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeftRight, Trophy, Star } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'
import AuthRecoveryScreen from '@/components/AuthRecoveryScreen'

export default function Home() {
  const { currentUser, isLoading, isRecoveringSession, session, authError, logout } = useAuth()

  useEffect(() => {
    if (isLoading || !currentUser || typeof window === 'undefined') return

    const target = currentUser.role === 'brand' ? '/brand/dashboard' : '/home'

    if (window.location.pathname !== target) {
      window.location.replace(target)
    }
  }, [currentUser, isLoading])

  if (isLoading || isRecoveringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (session && !currentUser) {
    return (
      <AuthRecoveryScreen
        message={
          authError ||
          'La sesión existe, pero no se pudo reconstruir el perfil de la app. Revisá migraciones, policies y que el frontend apunte al proyecto correcto de Supabase.'
        }
        onReset={() => logout('/login')}
      />
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

      {/* Pricing */}
      <section className="bg-gray-50 py-20 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Planes para empresas</h2>
            <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
              Elegí el plan ideal para lanzar challenges y ofrecer canjes a creadores cada mes.
            </p>
            <div className="bg-white border border-gray-200 rounded-xl p-4 inline-block">
              <p className="text-sm text-gray-600">
                ✓ Todos los planes permiten conectar marcas con creadores, lanzar campañas y medir participación.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end">
            {/* Starter Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col h-full">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Starter</h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-extrabold text-gray-900">$49</span>
                  <span className="text-gray-500">/mes</span>
                </div>
                <p className="text-sm text-gray-500">Ideal para comenzar</p>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">1 challenge por mes</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">2 canjes por mes</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Acceso a leaderboards</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Búsqueda de creadores</span>
                </div>
              </div>

              <Link
                href="/signup?plan=starter"
                onClick={() => sessionStorage.setItem('signup_role', 'brand')}
                className="w-full bg-gray-100 text-gray-900 font-semibold py-3 px-4 rounded-xl hover:bg-gray-200 transition-colors text-center"
              >
                Elegir starter
              </Link>
            </div>

            {/* Growth Plan (Destacado) */}
            <div className="bg-white rounded-2xl p-8 shadow-md hover:shadow-lg transition-shadow border-2 border-indigo-600 flex flex-col h-full md:scale-105 md:origin-center relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <span className="bg-indigo-600 text-white text-xs font-bold px-4 py-1 rounded-full">MÁS POPULAR</span>
              </div>

              <div className="mb-6 pt-4">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Growth</h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-extrabold text-indigo-600">$149</span>
                  <span className="text-gray-500">/mes</span>
                </div>
                <p className="text-sm text-gray-500">La opción más recomendada</p>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">3 challenges por mes</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">10 canjes por mes</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Acceso a leaderboards</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Búsqueda de creadores</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Analytics y reportes</span>
                </div>
              </div>

              <Link
                href="/signup?plan=growth"
                onClick={() => sessionStorage.setItem('signup_role', 'brand')}
                className="w-full bg-indigo-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-indigo-700 transition-colors text-center"
              >
                Elegir Growth
              </Link>
            </div>

            {/* Scale Plan */}
            <div className="bg-white rounded-2xl p-8 shadow-sm hover:shadow-md transition-shadow border border-gray-100 flex flex-col h-full">
              <div className="mb-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Scale</h3>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-extrabold text-gray-900">$499</span>
                  <span className="text-gray-500">/mes</span>
                </div>
                <p className="text-sm text-gray-500">Para grandes volúmenes</p>
              </div>

              <div className="space-y-4 mb-8 flex-1">
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">8 challenges por mes</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">30 canjes por mes</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Acceso a leaderboards</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Búsqueda de creadores</span>
                </div>
                <div className="flex items-center gap-3">
                  <svg className="w-5 h-5 text-indigo-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-700">Analytics avanzados y API</span>
                </div>
              </div>

              <a
                href="mailto:sales@collabspace.ar"
                className="w-full border-2 border-indigo-600 text-indigo-600 font-semibold py-3 px-4 rounded-xl hover:bg-indigo-50 transition-colors text-center"
              >
                Elegir scale
              </a>
            </div>
          </div>
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
