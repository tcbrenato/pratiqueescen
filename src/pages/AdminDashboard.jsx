import { useState, useEffect, useMemo } from 'react'
import { supabase } from '../lib/supabase'
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import './AdminDashboard.css'

const STATUS_OPTIONS = [
  { value: 'en_attente', label: 'En attente', color: '#F59E0B' },
  { value: 'valide',     label: 'Validée',    color: '#10B981' },
  { value: 'refuse',     label: 'Refusée',    color: '#EF4444' },
]

const COLORS = ['#0F8B8D', '#2DD4BF', '#1D4ED8', '#7C3AED', '#F59E0B', '#EF4444', '#10B981', '#EC4899', '#6B7280']

export default function AdminDashboard() {
  const [inscriptions, setInscriptions]   = useState([])
  const [loading, setLoading]             = useState(true)
  const [activeTab, setActiveTab]         = useState('dashboard')
  const [search, setSearch]               = useState('')
  const [selectedItem, setSelectedItem]   = useState(null)
  const [updatingId, setUpdatingId]       = useState(null)
  const [deletingId, setDeletingId]       = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [creatingParticipant, setCreatingParticipant] = useState(false)
  const [bulkSelectionMode, setBulkSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState([])
  const [newParticipant, setNewParticipant] = useState({
    nom_complet: '',
    email: '',
    pays: 'France',
    secteur_activite: 'Autre',
    source_declaree: 'Admin',
    validation_status: 'en_attente',
  })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const { data, error } = await supabase
      .from('inscriptions')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error && data) setInscriptions(data)
    setLoading(false)
  }

  // ── Stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total   = inscriptions.length
    const today   = inscriptions.filter(i =>
      new Date(i.created_at).toDateString() === new Date().toDateString()
    ).length
    const mobile  = inscriptions.filter(i => i.device_type === 'mobile').length
    const valides = inscriptions.filter(i => i.validation_status === 'valide').length
    return { total, today, mobile, valides }
  }, [inscriptions])

  // ── Chart data ─────────────────────────────────────────────────────────────
  const secteurData = useMemo(() => {
    const counts = {}
    inscriptions.forEach(i => {
      const k = i.secteur_activite || 'Non renseigné'
      counts[k] = (counts[k] || 0) + 1
    })
    return Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
  }, [inscriptions])

  const sourceData = useMemo(() => {
    const counts = {}
    inscriptions.forEach(i => {
      const k = i.source_declaree || 'Direct'
      counts[k] = (counts[k] || 0) + 1
    })
    return Object.entries(counts).map(([name, value]) => ({ name, value }))
  }, [inscriptions])

  // ── Filtered list ──────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    if (!q) return inscriptions
    return inscriptions.filter(i =>
      (i.nom_complet || '').toLowerCase().includes(q) ||
      (i.email       || '').toLowerCase().includes(q) ||
      (i.pays        || '').toLowerCase().includes(q)
    )
  }, [inscriptions, search])

  // ── Actions ────────────────────────────────────────────────────────────────
  async function updateStatus(id, status) {
    setUpdatingId(id)
    const { error } = await supabase
      .from('inscriptions')
      .update({ validation_status: status })
      .eq('id', id)
    if (!error) {
      setInscriptions(prev =>
        prev.map(i => i.id === id ? { ...i, validation_status: status } : i)
      )
      if (selectedItem?.id === id)
        setSelectedItem(prev => ({ ...prev, validation_status: status }))
    }
    setUpdatingId(null)
  }

  async function deleteInscription(id) {
    setDeletingId(id)
    const { error } = await supabase.from('inscriptions').delete().eq('id', id)
    if (!error) {
      setInscriptions(prev => prev.filter(i => i.id !== id))
      if (selectedItem?.id === id) setSelectedItem(null)
    }
    setDeletingId(null)
    setConfirmDelete(null)
  }

  async function createParticipant(event) {
    event.preventDefault()
    setCreatingParticipant(true)

    const payload = {
      nom_complet: newParticipant.nom_complet,
      email: newParticipant.email,
      pays: newParticipant.pays || 'France',
      secteur_activite: newParticipant.secteur_activite || 'Autre',
      statut: 'Nouveau',
      source_declaree: newParticipant.source_declaree || 'Admin',
      validation_status: newParticipant.validation_status || 'en_attente',
      created_at: new Date().toISOString(),
      device_type: 'web',
    }

    const { data, error } = await supabase.from('inscriptions').insert([payload]).select().single()
    if (!error && data) {
      setInscriptions(prev => [data, ...prev])
      setShowCreateModal(false)
      setNewParticipant({
        nom_complet: '',
        email: '',
        pays: 'France',
        secteur_activite: 'Autre',
        source_declaree: 'Admin',
        validation_status: 'en_attente',
      })
    }
    setCreatingParticipant(false)
  }

  function toggleSelectedId(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id])
  }

  async function deleteSelectedInscriptions() {
    if (!selectedIds.length) return
    const { error } = await supabase.from('inscriptions').delete().in('id', selectedIds)
    if (!error) {
      setInscriptions(prev => prev.filter(item => !selectedIds.includes(item.id)))
      setSelectedIds([])
      setBulkSelectionMode(false)
      if (selectedItem && selectedIds.includes(selectedItem.id)) setSelectedItem(null)
    }
  }

  async function clearAllInscriptions() {
    if (!inscriptions.length) return
    const ids = inscriptions.map(item => item.id)
    const { error } = await supabase.from('inscriptions').delete().in('id', ids)
    if (!error) {
      setInscriptions([])
      setSelectedIds([])
      setSelectedItem(null)
      setBulkSelectionMode(false)
    }
  }

  // ── Export CSV ─────────────────────────────────────────────────────────────
  const exportCSV = () => {
    const headers = "Nom,Email,Telephone,Pays,Ville,Age,Sexe,Secteur,Statut,Attente,Source,Validation,Date\n"
    const rows = inscriptions.map(i =>
      [
        i.nom_complet, i.email, i.telephone, i.pays, i.ville,
        i.age, i.sexe, i.secteur_activite, i.statut,
        `"${(i.attente_principale || '').replace(/"/g, "'")}"`,
        i.source_declaree, i.validation_status || 'en_attente',
        new Date(i.created_at).toLocaleDateString('fr-FR')
      ].join(',')
    ).join('\n')
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' })
    const url  = window.URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'export-escen-2026.csv'; a.click()
  }

  if (loading) return <div className="admin-loader">Chargement du panel...</div>

  return (
    <div className="admin-container">

      {/* ── Sidebar ─────────────────────────────────────────────────── */}
      <aside className="sidebar">
        <div className="logo">ESCEN ADMIN</div>
        <nav>
          {[
            { key: 'dashboard',     icon: '📊', label: 'Dashboard'     },
            { key: 'inscriptions',  icon: '👤', label: 'Inscriptions'  },
            { key: 'settings',      icon: '⚙️', label: 'Paramètres'    },
          ].map(({ key, icon, label }) => (
            <a key={key}
               onClick={() => setActiveTab(key)}
               className={activeTab === key ? 'active' : ''}>
              {icon} {label}
            </a>
          ))}
        </nav>
      </aside>

      {/* ── Main ────────────────────────────────────────────────────── */}
      <main className="admin-main">

        {/* ── DASHBOARD ───────────────────────────────────────────── */}
        {activeTab === 'dashboard' && (
          <>
            <header className="admin-header">
              <h2>Tableau de bord</h2>
              <button onClick={exportCSV} className="btn-export">Exporter CSV</button>
            </header>

            {/* Stat cards */}
            <section className="stats-grid">
              <div className="stat-card">
                <h3>Total inscrits</h3>
                <p className="stat-value">{stats.total}</p>
              </div>
              <div className="stat-card">
                <h3>Aujourd'hui</h3>
                <p className="stat-value blue">+{stats.today}</p>
              </div>
              <div className="stat-card">
                <h3>Mobile</h3>
                <p className="stat-value purple">
                  {stats.total ? Math.round((stats.mobile / stats.total) * 100) : 0}%
                </p>
              </div>
              <div className="stat-card">
                <h3>Validées</h3>
                <p className="stat-value green">{stats.valides}</p>
              </div>
            </section>

            {/* Charts */}
            <section className="charts-grid">
              <div className="chart-card">
                <h3 className="chart-title">Secteurs d'activité</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={secteurData} dataKey="value" nameKey="name"
                         cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) =>
                           `${name} ${(percent * 100).toFixed(0)}%`}>
                      {secteurData.map((_, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="chart-card">
                <h3 className="chart-title">Sources d'acquisition</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={sourceData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#0F8B8D" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>
          </>
        )}

        {/* ── INSCRIPTIONS ────────────────────────────────────────── */}
        {activeTab === 'inscriptions' && (
          <section className="table-section">
            <div className="table-header">
              <h3>Inscriptions ({filtered.length})</h3>
              <div className="table-actions">
                <input
                  className="search-input"
                  type="text"
                  placeholder="Rechercher nom, email, pays…"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
                <button onClick={exportCSV} className="btn-export">Exporter CSV</button>
              </div>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Nom complet</th>
                    <th>Email / Pays</th>
                    <th>Secteur / Statut</th>
                    <th>Source</th>
                    <th>Validation</th>
                    <th>Date</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.length === 0 && (
                    <tr><td colSpan={7} className="empty-row">Aucun résultat trouvé.</td></tr>
                  )}
                  {filtered.map(item => {
                    const vs = item.validation_status || 'en_attente'
                    const statusObj = STATUS_OPTIONS.find(s => s.value === vs) || STATUS_OPTIONS[0]
                    return (
                      <tr key={item.id}
                          className="clickable-row"
                          onClick={() => setSelectedItem(item)}>
                        <td><strong>{item.nom_complet}</strong></td>
                        <td>
                          <div className="sub-text">{item.email}</div>
                          <div className="tag">{item.pays}</div>
                        </td>
                        <td>
                          <div>{item.secteur_activite}</div>
                          <div className="sub-text">{item.statut}</div>
                        </td>
                        <td>
                          <div className="source-tag">{item.source_declaree || 'Direct'}</div>
                          {item.utm_source && <div className="utm-text">UTM: {item.utm_source}</div>}
                        </td>
                        <td onClick={e => e.stopPropagation()}>
                          <select
                            className="status-select"
                            style={{ borderColor: statusObj.color, color: statusObj.color }}
                            value={vs}
                            disabled={updatingId === item.id}
                            onChange={e => updateStatus(item.id, e.target.value)}>
                            {STATUS_OPTIONS.map(s => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </td>
                        <td>{new Date(item.created_at).toLocaleDateString('fr-FR')}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <button
                            className="btn-detail"
                            onClick={() => setSelectedItem(item)}>
                            Voir
                          </button>
                          <button
                            className="btn-delete"
                            disabled={deletingId === item.id}
                            onClick={() => setConfirmDelete(item)}>
                            {deletingId === item.id ? '…' : 'Suppr.'}
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {activeTab === 'settings' && (
          <div className="settings-panel">
            <header className="admin-header">
              <div>
                <h2>Paramètres</h2>
                <p>Centre de gestion du portail d’inscriptions ESCEN.</p>
              </div>
              <button className="btn-export" onClick={() => setShowCreateModal(true)}>
                Ajouter un participant
              </button>
            </header>

            <section className="settings-grid">
              <div className="settings-card">
                <h3>Actions rapides</h3>
                <div className="settings-actions">
                  <button className="btn-export" onClick={() => setShowCreateModal(true)}>
                    Ajouter un participant
                  </button>
                  <button
                    className="btn-detail"
                    onClick={() => {
                      setBulkSelectionMode(prev => !prev)
                      setSelectedIds([])
                    }}>
                    {bulkSelectionMode ? 'Annuler la sélection' : 'Sélectionner plusieurs'}
                  </button>
                  <button
                    className="btn-delete"
                    disabled={!selectedIds.length}
                    onClick={deleteSelectedInscriptions}>
                    {selectedIds.length ? `Supprimer ${selectedIds.length}` : 'Supprimer la sélection'}
                  </button>
                  <button
                    className="btn-delete-confirm"
                    disabled={!inscriptions.length}
                    onClick={clearAllInscriptions}>
                    Vider le tableau
                  </button>
                </div>
                <p className="settings-caption">
                  Gérez les inscriptions depuis un seul espace : ajout, suppression, sélection multiple et nettoyage du tableau.
                </p>
              </div>

              <div className="settings-card">
                <h3>Panneau d’administration complet</h3>
                <ul className="settings-list">
                  <li>Supprimer un participant en un clic.</li>
                  <li>Modifier les informations d’un inscrit depuis la fiche détaillée.</li>
                  <li>Valider, refuser ou mettre en attente une inscription.</li>
                  <li>Exporter les données et nettoyer le tableau en une action.</li>
                </ul>
              </div>

              <div className="settings-card">
                <h3>Participants récents</h3>
                <div className="settings-people">
                  {inscriptions.slice(0, 6).map(item => (
                    <label key={item.id} className="settings-person">
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(item.id)}
                        disabled={!bulkSelectionMode}
                        onChange={() => toggleSelectedId(item.id)}
                      />
                      <span>
                        <strong>{item.nom_complet || 'Participant'}</strong>
                        <small>{item.email || '—'}</small>
                      </span>
                      <button type="button" className="settings-link" onClick={() => setSelectedItem(item)}>
                        Voir
                      </button>
                    </label>
                  ))}
                  {!inscriptions.length && <p className="settings-empty">Aucun participant à afficher.</p>}
                </div>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* ── MODAL DETAIL ────────────────────────────────────────────── */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedItem(null)}>✕</button>
            <h2 className="modal-name">{selectedItem.nom_complet}</h2>

            <div className="modal-section">
              <h4>Contact</h4>
              <div className="modal-grid">
                <span className="modal-label">Email</span><span>{selectedItem.email}</span>
                <span className="modal-label">Téléphone</span><span>{selectedItem.telephone || '—'}</span>
                <span className="modal-label">Pays</span><span>{selectedItem.pays}</span>
                <span className="modal-label">Ville</span><span>{selectedItem.ville || '—'}</span>
              </div>
            </div>

            <div className="modal-section">
              <h4>Profil</h4>
              <div className="modal-grid">
                <span className="modal-label">Âge</span><span>{selectedItem.age || '—'}</span>
                <span className="modal-label">Sexe</span><span>{selectedItem.sexe || '—'}</span>
                <span className="modal-label">Secteur</span><span>{selectedItem.secteur_activite || '—'}</span>
                <span className="modal-label">Statut</span><span>{selectedItem.statut || '—'}</span>
              </div>
            </div>

            <div className="modal-section">
              <h4>Attente principale</h4>
              <p className="modal-attente">{selectedItem.attente_principale || 'Non renseignée'}</p>
            </div>

            <div className="modal-section">
              <h4>Acquisition</h4>
              <div className="modal-grid">
                <span className="modal-label">Source déclarée</span>
                <span>{selectedItem.source_declaree || 'Direct'}</span>
                <span className="modal-label">UTM source</span>
                <span>{selectedItem.utm_source || '—'}</span>
                <span className="modal-label">UTM medium</span>
                <span>{selectedItem.utm_medium || '—'}</span>
                <span className="modal-label">Appareil</span>
                <span>{selectedItem.device_type || '—'}</span>
              </div>
            </div>

            <div className="modal-footer">
              <div>
                <label className="modal-label">Statut de validation</label>
                <select
                  className="status-select"
                  value={selectedItem.validation_status || 'en_attente'}
                  disabled={updatingId === selectedItem.id}
                  onChange={e => updateStatus(selectedItem.id, e.target.value)}>
                  {STATUS_OPTIONS.map(s => (
                    <option key={s.value} value={s.value}>{s.label}</option>
                  ))}
                </select>
              </div>
              <button
                className="btn-delete modal-delete"
                onClick={() => { setSelectedItem(null); setConfirmDelete(selectedItem) }}>
                Supprimer cette inscription
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            <h2 className="modal-name">Ajouter un participant</h2>
            <form className="settings-form" onSubmit={createParticipant}>
              <label>
                Nom complet
                <input
                  type="text"
                  required
                  value={newParticipant.nom_complet}
                  onChange={e => setNewParticipant(prev => ({ ...prev, nom_complet: e.target.value }))}
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  required
                  value={newParticipant.email}
                  onChange={e => setNewParticipant(prev => ({ ...prev, email: e.target.value }))}
                />
              </label>
              <label>
                Pays
                <input
                  type="text"
                  value={newParticipant.pays}
                  onChange={e => setNewParticipant(prev => ({ ...prev, pays: e.target.value }))}
                />
              </label>
              <label>
                Secteur d’activité
                <input
                  type="text"
                  value={newParticipant.secteur_activite}
                  onChange={e => setNewParticipant(prev => ({ ...prev, secteur_activite: e.target.value }))}
                />
              </label>
              <label>
                Source
                <input
                  type="text"
                  value={newParticipant.source_declaree}
                  onChange={e => setNewParticipant(prev => ({ ...prev, source_declaree: e.target.value }))}
                />
              </label>
              <div className="confirm-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowCreateModal(false)}>Annuler</button>
                <button type="submit" className="btn-delete-confirm" disabled={creatingParticipant}>
                  {creatingParticipant ? 'Ajout…' : 'Ajouter'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── CONFIRM DELETE ──────────────────────────────────────────── */}
      {confirmDelete && (
        <div className="modal-overlay" onClick={() => setConfirmDelete(null)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <h2>Confirmer la suppression</h2>
            <p>Voulez-vous vraiment supprimer l'inscription de <strong>{confirmDelete.nom_complet}</strong> ? Cette action est irréversible.</p>
            <div className="confirm-actions">
              <button className="btn-cancel" onClick={() => setConfirmDelete(null)}>Annuler</button>
              <button
                className="btn-delete-confirm"
                disabled={deletingId === confirmDelete.id}
                onClick={() => deleteInscription(confirmDelete.id)}>
                {deletingId === confirmDelete.id ? 'Suppression…' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}