'use client'

interface AuthRecoveryScreenProps {
  title?: string
  message: string
  onReset?: () => void | Promise<void>
}

export default function AuthRecoveryScreen({
  title = 'No se pudo restaurar la sesión',
  message,
  onReset,
}: AuthRecoveryScreenProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-white px-6">
      <div className="w-full max-w-md rounded-3xl border border-red-100 bg-red-50 p-8 shadow-sm">
        <div className="mb-3 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600">
          <span className="text-lg font-bold">!</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
        <p className="mt-3 text-sm leading-6 text-gray-600">{message}</p>
        {onReset ? (
          <button
            onClick={() => void onReset()}
            className="mt-6 inline-flex rounded-xl bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Volver a iniciar sesión
          </button>
        ) : null}
      </div>
    </div>
  )
}
