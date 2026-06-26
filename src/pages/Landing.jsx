import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { captureTechnicalData } from '../lib/tracking'
import './Landing.css'

const SECTEURS = [
  'Digital / Tech',
  'Finance / Banque',
  'Commerce / Vente',
  'Éducation / Formation',
  'Santé',
  'Communication / Marketing',
  'Industrie / Logistique',
  'Administration publique',
  'Autre',
]

const STATUTS = [
  { value: 'etudiant', label: 'Étudiant(e)' },
  { value: 'salarie', label: 'Salarié(e)' },
  { value: 'entrepreneur', label: 'Entrepreneur(se)' },
  { value: 'recherche_emploi', label: "En recherche d'emploi" },
  { value: 'autre', label: 'Autre' },
]

const SOURCES = [
  'Facebook',
  'LinkedIn',
  'WhatsApp',
  'Instagram',
  'Bouche-à-oreille',
  'Autre',
]

export default function Landing() {
  const [formData, setFormData] = useState({
    nom_complet: '',
    email: '',
    telephone: '',
    pays: '',
    ville: '',
    age: '',
    sexe: '',
    secteur_activite: '',
    statut: '',
    attente_principale: '',
    source_declaree: '',
  })
  const [technicalData, setTechnicalData] = useState({})
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('')

  // Capture les données techniques (UTM, device, referrer) au chargement de la page
  useEffect(() => {
    setTechnicalData(captureTechnicalData())
  }, [])

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('submitting')
    setErrorMsg('')

    const payload = {
      ...formData,
      age: formData.age ? parseInt(formData.age, 10) : null,
      ...technicalData,
      formulaire_complete: true,
    }

    const { error } = await supabase.from('inscriptions').insert([payload])

    if (error) {
      console.error(error)
      setErrorMsg("Une erreur est survenue. Merci de réessayer.")
      setStatus('error')
      return
    }

    setStatus('success')
  }

  if (status === 'success') {
    return (
      <div className="page">
        <div className="confirmation">
          <h1>Inscription confirmée ✅</h1>
          <p>Merci {formData.nom_complet.split(' ')[0]}, votre inscription au Forum Pratique ESCEN 2026 a bien été enregistrée.</p>
          <p className="confirmation-sub">Vous recevrez les informations pratiques par e-mail avant l'événement.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">29 JUIN — 10 JUILLET 2026 · EN LIGNE</p>
        <h1>Forum Pratique ESCEN 2026</h1>
        <p className="hero-sub">
          Un événement digital pensé pour les professionnels en reconversion et en montée de compétences.
          Inscrivez-vous pour réserver votre place.
        </p>
      </header>

      <main className="form-container">
        <form onSubmit={handleSubmit} className="form">
          <fieldset>
            <legend>Vos informations</legend>

            <div className="field">
              <label htmlFor="nom_complet">Nom et prénom *</label>
              <input
                id="nom_complet"
                name="nom_complet"
                type="text"
                required
                value={formData.nom_complet}
                onChange={handleChange}
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="email">E-mail *</label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="telephone">Téléphone</label>
                <input
                  id="telephone"
                  name="telephone"
                  type="tel"
                  placeholder="+229 ..."
                  value={formData.telephone}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="pays">Pays *</label>
                <input
                  id="pays"
                  name="pays"
                  type="text"
                  required
                  value={formData.pays}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="ville">Ville / zone</label>
                <input
                  id="ville"
                  name="ville"
                  type="text"
                  value={formData.ville}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div className="field-row">
              <div className="field">
                <label htmlFor="age">Âge</label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="15"
                  max="100"
                  value={formData.age}
                  onChange={handleChange}
                />
              </div>
              <div className="field">
                <label htmlFor="sexe">Sexe</label>
                <select id="sexe" name="sexe" value={formData.sexe} onChange={handleChange}>
                  <option value="">Sélectionner</option>
                  <option value="homme">Homme</option>
                  <option value="femme">Femme</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend>Votre profil</legend>

            <div className="field">
              <label htmlFor="secteur_activite">Secteur d'activité</label>
              <select
                id="secteur_activite"
                name="secteur_activite"
                value={formData.secteur_activite}
                onChange={handleChange}
              >
                <option value="">Sélectionner</option>
                {SECTEURS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="statut">Statut</label>
              <select id="statut" name="statut" value={formData.statut} onChange={handleChange}>
                <option value="">Sélectionner</option>
                {STATUTS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="attente_principale">Qu'attendez-vous principalement de cet événement ?</label>
              <textarea
                id="attente_principale"
                name="attente_principale"
                rows="3"
                value={formData.attente_principale}
                onChange={handleChange}
              />
            </div>

            <div className="field">
              <label htmlFor="source_declaree">Comment avez-vous entendu parler de cet événement ?</label>
              <select
                id="source_declaree"
                name="source_declaree"
                value={formData.source_declaree}
                onChange={handleChange}
              >
                <option value="">Sélectionner</option>
                {SOURCES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </fieldset>

          {status === 'error' && <p className="error-msg">{errorMsg}</p>}

          <button type="submit" disabled={status === 'submitting'} className="submit-btn">
            {status === 'submitting' ? 'Envoi en cours...' : "Je m'inscris"}
          </button>
        </form>
      </main>
    </div>
  )
}