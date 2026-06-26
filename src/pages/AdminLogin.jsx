import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import './AdminLogin.css'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) {
      setError("Identifiants incorrects.")
    } else {
      navigate('/admin/dashboard') // Redirection vers votre dashboard
    }
  }

  return (
    <div className="login-page">
      <form onSubmit={handleLogin} className="login-form">
        <h2>Accès Administration</h2>
        {error && <p className="error">{error}</p>}
        <input 
          type="email" placeholder="Email admin" 
          onChange={(e) => setEmail(e.target.value)} required 
        />
        <input 
          type="password" placeholder="Mot de passe" 
          onChange={(e) => setPassword(e.target.value)} required 
        />
        <button type="submit">Se connecter</button>
      </form>
    </div>
  )
}