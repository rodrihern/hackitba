function isTransientFetchError(error: unknown) {
  if (!(error instanceof Error)) return false

  const message = error.message.toLowerCase()
  return message.includes('failed to fetch') || message.includes('networkerror') || message.includes('load failed')
}

export async function retryOnTransientFetch<T>(
  operation: () => Promise<T>,
  attempts = 3,
  delayMs = 250
): Promise<T> {
  let lastError: unknown

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation()
    } catch (error) {
      lastError = error

      if (!isTransientFetchError(error) || attempt === attempts) {
        throw error
      }

      await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Unknown fetch error')
}
