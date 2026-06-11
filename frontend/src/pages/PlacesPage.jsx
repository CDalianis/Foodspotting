import { useCallback, useEffect, useMemo, useState } from 'react'
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { http } from '../api/http'
import { formatTagLabels, getPrimaryTagId, getTagMeta, PLACE_TAGS } from '../constants/placeTags'
import { reverseGeocode } from '../services/geocoding'
import { formatLocationLine, formatStreetLine } from '../utils/address'
import { TagPin } from '../utils/mapPins'

const MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty'

const initialForm = {
  name: '',
  notes: '',
  latitude: '',
  longitude: '',
  address: '',
  streetNumber: '',
  postalCode: '',
  city: '',
  country: '',
  rating: 0,
  tags: [],
}

function TagPicker({ selectedTags, onChange, label }) {
  const toggleTag = (tagId) => {
    if (selectedTags.includes(tagId)) {
      onChange(selectedTags.filter((id) => id !== tagId))
      return
    }
    onChange([...selectedTags, tagId])
  }

  return (
    <div className="tag-picker full-width">
      <span className="tag-picker-label">{label}</span>
      <div className="tag-chip-row" role="group" aria-label={label}>
        {PLACE_TAGS.map((tag) => {
          const active = selectedTags.includes(tag.id)
          return (
            <button
              key={tag.id}
              type="button"
              className={`tag-chip ${tag.pinClass} ${active ? 'active' : ''}`}
              onClick={() => toggleTag(tag.id)}
            >
              <span aria-hidden="true">{tag.emoji}</span> {tag.label}
            </button>
          )
        })}
      </div>
      {selectedTags.length > 0 && (
        <p className="tag-hint">
          Pin icon uses the first selected tag: {getTagMeta(getPrimaryTagId(selectedTags)).label}
        </p>
      )}
    </div>
  )
}

export function PlacesPage() {
  const [form, setForm] = useState(initialForm)
  const [places, setPlaces] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [editingUuid, setEditingUuid] = useState(null)
  const [mapZoom, setMapZoom] = useState(12)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterTags, setFilterTags] = useState([])
  const [geocoding, setGeocoding] = useState(false)
  const [popupInfo, setPopupInfo] = useState(null)

  const loadPlaces = useCallback(async () => {
    try {
      const params = new URLSearchParams({
        page: '0',
        size: '50',
        sortBy: 'createdAt',
        sortDirection: 'desc',
      })
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim())
      }
      filterTags.forEach((tag) => params.append('tags', tag))

      const { data } = await http.get(`/places?${params.toString()}`)
      setPlaces(data.content || [])
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to load places')
    }
  }, [searchQuery, filterTags])

  useEffect(() => {
    loadPlaces()
  }, [loadPlaces])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    if (form.tags.length === 0) {
      setError('Select at least one tag')
      return
    }

    setLoading(true)
    setError('')
    try {
      const payload = {
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        rating: form.rating > 0 ? form.rating : null,
        tags: form.tags,
      }

      if (editingUuid) {
        await http.put(`/places/${editingUuid}`, payload)
      } else {
        await http.post('/places', payload)
      }

      setForm(initialForm)
      setEditingUuid(null)
      await loadPlaces()
    } catch (err) {
      setError(err?.response?.data?.message || (editingUuid ? 'Failed to update place' : 'Failed to create place'))
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (place) => {
    setEditingUuid(place.uuid)
    setForm({
      name: place.name || '',
      notes: place.notes || '',
      latitude: String(place.latitude ?? ''),
      longitude: String(place.longitude ?? ''),
      address: place.address || '',
      streetNumber: place.streetNumber || '',
      postalCode: place.postalCode || '',
      city: place.city || '',
      country: place.country || '',
      rating: place.rating || 0,
      tags: place.tags || [],
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (uuid) => {
    const confirmed = window.confirm('Delete this place?')
    if (!confirmed) return

    try {
      await http.delete(`/places/${uuid}`)
      if (editingUuid === uuid) {
        setEditingUuid(null)
        setForm(initialForm)
      }
      await loadPlaces()
    } catch (err) {
      setError(err?.response?.data?.message || 'Failed to delete place')
    }
  }

  const cancelEdit = () => {
    setEditingUuid(null)
    setForm(initialForm)
  }

  const mapPoints = places
    .filter((place) => Number.isFinite(Number(place.latitude)) && Number.isFinite(Number(place.longitude)))
    .map((place) => ({
      ...place,
      lat: Number(place.latitude),
      lng: Number(place.longitude),
      pinTagId: getPrimaryTagId(place.tags),
    }))

  const selectedPoint =
    Number.isFinite(Number(form.latitude)) && Number.isFinite(Number(form.longitude))
      ? {
          lat: Number(form.latitude),
          lng: Number(form.longitude),
        }
      : null

  const defaultCenter = mapPoints.length > 0 ? { lat: mapPoints[0].lat, lng: mapPoints[0].lng } : { lat: 37.9838, lng: 23.7275 }

  const initialViewState = useMemo(
    () => ({
      latitude: defaultCenter.lat,
      longitude: defaultCenter.lng,
      zoom: 12,
    }),
    [defaultCenter.lat, defaultCenter.lng],
  )

  const handleMapPick = async ({ lat, lng }) => {
    const latitude = lat.toFixed(6)
    const longitude = lng.toFixed(6)

    setError('')
    setForm((prev) => ({
      ...prev,
      latitude,
      longitude,
    }))

    setGeocoding(true)
    try {
      const location = await reverseGeocode(lat, lng)
      setForm((prev) => ({
        ...prev,
        latitude,
        longitude,
        address: location.address,
        streetNumber: location.streetNumber,
        postalCode: location.postalCode,
        city: location.city,
        country: location.country,
      }))
    } catch {
      setError('Coordinates set, but address lookup failed. You can fill address manually.')
    } finally {
      setGeocoding(false)
    }
  }

  const markerSize = Math.max(30, 58 - mapZoom * 2)

  const selectedPinTag = getPrimaryTagId(form.tags)

  const renderStars = (value, onClick) => (
    <div className="stars" role="group" aria-label="Rating in stars">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-button ${star <= value ? 'filled' : ''}`}
          onClick={() => onClick(star)}
          aria-label={`${star} star`}
        >
          ★
        </button>
      ))}
    </div>
  )

  return (
    <section className="card">
      <h2>My Favorite Food Places</h2>
      <div className="places-layout">
        <div className="left-panel">
          <div className="search-panel">
            <label className="search-field">
              Search places
              <input
                type="search"
                placeholder="Name, notes, address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </label>
            <TagPicker
              label="Filter by tag"
              selectedTags={filterTags}
              onChange={setFilterTags}
            />
          </div>

          <div className="map-wrapper">
            <Map
              initialViewState={initialViewState}
              mapStyle={MAP_STYLE}
              style={{ width: '100%', height: '100%' }}
              onClick={(event) => {
                const { lat, lng } = event.lngLat
                handleMapPick({ lat, lng })
                setPopupInfo({ type: 'selected', lat, lng })
              }}
              onMoveEnd={(event) => setMapZoom(event.viewState.zoom)}
            >
              <NavigationControl position="top-right" />
              {selectedPoint && (
                <Marker longitude={selectedPoint.lng} latitude={selectedPoint.lat} anchor="bottom">
                  <TagPin tagId={selectedPinTag} size={markerSize} selected />
                </Marker>
              )}
              {mapPoints.map((place) => (
                <Marker
                  key={place.uuid}
                  longitude={place.lng}
                  latitude={place.lat}
                  anchor="bottom"
                  onClick={(event) => {
                    event.originalEvent.stopPropagation()
                    setPopupInfo({ type: 'place', place })
                  }}
                >
                  <TagPin tagId={place.pinTagId} size={markerSize} />
                </Marker>
              ))}
              {popupInfo?.type === 'selected' && (
                <Popup
                  longitude={popupInfo.lng}
                  latitude={popupInfo.lat}
                  anchor="bottom"
                  onClose={() => setPopupInfo(null)}
                  closeOnClick={false}
                >
                  <strong>New place pin</strong>
                  <br />
                  {getTagMeta(selectedPinTag).label}
                  <br />
                  {popupInfo.lat.toFixed(6)}, {popupInfo.lng.toFixed(6)}
                </Popup>
              )}
              {popupInfo?.type === 'place' && (
                <Popup
                  longitude={popupInfo.place.lng}
                  latitude={popupInfo.place.lat}
                  anchor="bottom"
                  onClose={() => setPopupInfo(null)}
                  closeOnClick={false}
                >
                  <strong>{popupInfo.place.name}</strong>
                  <br />
                  {formatTagLabels(popupInfo.place.tags)}
                  <br />
                  {formatStreetLine(popupInfo.place.address, popupInfo.place.streetNumber) || 'No address'}
                  <br />
                  {formatLocationLine(popupInfo.place.city, popupInfo.place.postalCode, popupInfo.place.country) ||
                    '-'}
                  <br />
                  {popupInfo.place.rating ? `Rating: ${'★'.repeat(popupInfo.place.rating)}` : 'No rating'}
                  <br />
                  {popupInfo.place.notes || 'No notes'}
                </Popup>
              )}
            </Map>
          </div>
          <p className="map-help">
            Click the map to set latitude, longitude, and address instantly.
            {geocoding && <span className="geocoding-status"> Looking up address…</span>}
          </p>
        </div>

        <div className="right-panel">
          <form onSubmit={onSubmit} className="form-grid two-columns">
            <label>
              Name
              <input name="name" value={form.name} onChange={onChange} required />
            </label>
            <label>
              Street / Address
              <input name="address" value={form.address} onChange={onChange} />
            </label>
            <label>
              Street Number
              <input name="streetNumber" value={form.streetNumber} onChange={onChange} />
            </label>
            <label>
              Postal Code
              <input name="postalCode" value={form.postalCode} onChange={onChange} />
            </label>
            <label>
              City
              <input name="city" value={form.city} onChange={onChange} />
            </label>
            <label>
              Country
              <input name="country" value={form.country} onChange={onChange} />
            </label>
            <label>
              Latitude
              <input name="latitude" value={form.latitude} onChange={onChange} required />
            </label>
            <label>
              Longitude
              <input name="longitude" value={form.longitude} onChange={onChange} required />
            </label>
            <TagPicker
              label="Tags (pick one or more)"
              selectedTags={form.tags}
              onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
            />
            <label className="full-width">
              Rating
              {renderStars(form.rating, (star) => setForm((prev) => ({ ...prev, rating: star })))}
            </label>
            <label className="full-width">
              Notes
              <textarea name="notes" value={form.notes} onChange={onChange} rows="3" />
            </label>
            <button className="full-width" disabled={loading} type="submit">
              {loading ? 'Saving...' : editingUuid ? 'Update Place' : 'Save Place'}
            </button>
            {editingUuid && (
              <button className="full-width secondary" type="button" onClick={cancelEdit}>
                Cancel Editing
              </button>
            )}
          </form>

          {error && <p className="error">{error}</p>}

          <div className="list">
            {places.length === 0 && <p>No places saved yet.</p>}
            {places.map((place) => (
              <article key={place.uuid} className="place-card">
                <h3>{place.name}</h3>
                <div className="place-tag-badges">
                  {(place.tags || []).map((tagId) => {
                    const tag = getTagMeta(tagId)
                    return (
                      <span key={tagId} className={`tag-badge ${tag.pinClass}`}>
                        {tag.emoji} {tag.label}
                      </span>
                    )
                  })}
                  {(!place.tags || place.tags.length === 0) && (
                    <span className="tag-badge tag-other">📍 Untagged</span>
                  )}
                </div>
                <p>{formatStreetLine(place.address, place.streetNumber) || 'No address provided'}</p>
                <p>{formatLocationLine(place.city, place.postalCode, place.country) || '-'}</p>
                <p className="coords">
                  {place.latitude}, {place.longitude}
                </p>
                <p>{place.rating ? `Rating: ${'★'.repeat(place.rating)}` : 'Rating: -'}</p>
                <p>{place.notes || 'No notes yet'}</p>
                <div className="actions-row">
                  <button type="button" onClick={() => handleEdit(place)}>Edit</button>
                  <button type="button" className="danger" onClick={() => handleDelete(place.uuid)}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
