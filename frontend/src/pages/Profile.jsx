import { useState, useEffect } from 'react'
import { useAuth } from '../services/auth'
import { auth } from '../services/api'

export default function Profile() {
  const { user } = useAuth()
  const [twoFAEnabled, setTwoFAEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [setupMode, setSetupMode] = useState(false)
  const [qrCode, setQrCode] = useState(null)
  const [secret, setSecret] = useState(null)
  const [verificationCode, setVerificationCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    check2FAStatus()
  }, [])

  const check2FAStatus = async () => {
    try {
      const response = await auth.get2FAStatus()
      setTwoFAEnabled(response.data.enabled)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleSetup = async () => {
    setError('')
    setSuccess('')
    try {
      const response = await auth.setup2FA()
      setQrCode(response.data.qr_url)
      setSecret(response.data.secret)
      setSetupMode(true)
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при настройке 2FA')
    }
  }

  const handleVerify = async () => {
    setError('')
    setSuccess('')
    if (!verificationCode) {
      setError('Введите код из приложения')
      return
    }
    try {
      await auth.verify2FA(verificationCode)
      setTwoFAEnabled(true)
      setSetupMode(false)
      setQrCode(null)
      setSecret(null)
      setVerificationCode('')
      setSuccess('2FA успешно включена!')
    } catch (err) {
      setError(err.response?.data?.detail || 'Неверный код')
    }
  }

  const handleDisable = async () => {
    if (!confirm('Вы уверены, что хотите отключить двухфакторную аутентификацию?')) return
    try {
      await auth.disable2FA()
      setTwoFAEnabled(false)
      setSuccess('2FA отключена')
    } catch (err) {
      setError(err.response?.data?.detail || 'Ошибка при отключении')
    }
  }

  const cancelSetup = () => {
    setSetupMode(false)
    setQrCode(null)
    setSecret(null)
    setVerificationCode('')
    setError('')
    // Не нужно ничего очищать на бэкенде, т.к. секрет не сохранялся
  }

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold mb-6">Профиль</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Информация</h3>
          <div className="space-y-2 text-gray-700">
            <p><span className="font-medium">Email:</span> {user?.email}</p>
            <p><span className="font-medium">Имя:</span> {user?.name || 'Не указано'}</p>
            <p><span className="font-medium">Комната:</span> {user?.room || 'Не указана'}</p>
          </div>
        </div>

        <div className="border-t pt-6">
          <h3 className="text-lg font-semibold mb-4">Двухфакторная аутентификация (2FA)</h3>
          
          {error && (
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {success && (
            <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
              {success}
            </div>
          )}

          {!setupMode && (
            <div className="space-y-4">
              <p className="text-gray-600">
                {twoFAEnabled 
                  ? 'Двухфакторная аутентификация включена. Ваш аккаунт защищён.' 
                  : 'Двухфакторная аутентификация отключена. Рекомендуем включить для дополнительной защиты.'}
              </p>
              
              {twoFAEnabled ? (
                <button
                  onClick={handleDisable}
                  className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
                >
                  Отключить 2FA
                </button>
              ) : (
                <button
                  onClick={handleSetup}
                  className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                >
                  Включить 2FA
                </button>
              )}
            </div>
          )}

          {setupMode && (
            <div className="space-y-4">
              <p className="text-gray-600">
                1. Установите приложение для аутентификации (Google Authenticator, Microsoft Authenticator или любой другой TOTP-совместимый).
              </p>
              
              {qrCode && (
                <div className="flex flex-col items-center">
                  <img src={qrCode} alt="QR Code" className="border p-2 rounded" />
                  <p className="text-sm text-gray-500 mt-2">
                    Или введите код вручную: <code className="bg-gray-100 px-2 py-1 rounded">{secret}</code>
                  </p>
                </div>
              )}
              
              <p className="text-gray-600">
                2. Введите код из приложения для подтверждения:
              </p>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value)}
                  placeholder="6-значный код"
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="off"
                />
                <button
                  onClick={handleVerify}
                  className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition"
                >
                  Подтвердить
                </button>
                <button
                  onClick={cancelSetup}
                  className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
                >
                  Отмена
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}