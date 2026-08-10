import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import Map, { Marker, NavigationControl, Popup } from 'react-map-gl/maplibre'
import 'maplibre-gl/dist/maplibre-gl.css'
import { apiErrorMessage, http } from '../api/http'
import {
  formatTagLabels,
  getPrimaryTagId,
  getTagLabel,
  getTagMeta,
  PLACE_TAGS,
} from '../constants/placeTags'
import { useI18n } from '../i18n/I18nProvider'
import { reverseGeocode, searchAddresses } from '../services/geocoding'
import { formatLocationLine, formatStreetLine } from '../utils/address'
import {
  distanceKm,
  formatDistanceKm,
  getCurrentPosition,
  NEARBY_RADIUS_KM,
} from '../utils/geo'
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
  const { t } = useI18n()

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
              <span aria-hidden="true">{tag.emoji}</span> {t(`tags.${tag.id}`)}
            </button>
          )
        })}
      </div>
      {selectedTags.length > 0 && (
        <p className="tag-hint">
          {t('places.pinHint', { tag: getTagLabel(getPrimaryTagId(selectedTags), t) })}
        </p>
      )}
    </div>
  )
}

export function PlacesPage() {
  const { t } = useI18n()
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
  const [csvBusy, setCsvBusy] = useState(false)
  const [csvMessage, setCsvMessage] = useState('')
  const [mapSearchQuery, setMapSearchQuery] = useState('')
  const [mapSearchResults, setMapSearchResults] = useState([])
  const [mapSearchOpen, setMapSearchOpen] = useState(false)
  const [mapSearching, setMapSearching] = useState(false)
  const [userLocation, setUserLocation] = useState(null)
  const [locationStatus, setLocationStatus] = useState('idle')
  const [mapReady, setMapReady] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [filtersOpen, setFiltersOpen] = useState(false)
  const importInputRef = useRef(null)
  const mapRef = useRef(null)
  const mapSearchRef = useRef(null)
  const autoFocusDoneRef = useRef(false)
  const focusedWithNearbyRef = useRef(false)

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
      setError(apiErrorMessage(err, t('places.failedLoad')))
    }
  }, [searchQuery, filterTags, t])

  useEffect(() => {
    loadPlaces()
  }, [loadPlaces])

  useEffect(() => {
    const query = mapSearchQuery.trim()
    if (query.length < 3) {
      setMapSearchResults([])
      setMapSearching(false)
      return undefined
    }

    const timeoutId = window.setTimeout(async () => {
      setMapSearching(true)
      try {
        const results = await searchAddresses(query)
        setMapSearchResults(results)
        setMapSearchOpen(true)
      } catch {
        setMapSearchResults([])
      } finally {
        setMapSearching(false)
      }
    }, 400)

    return () => window.clearTimeout(timeoutId)
  }, [mapSearchQuery])

  useEffect(() => {
    const onPointerDown = (event) => {
      if (!mapSearchRef.current?.contains(event.target)) {
        setMapSearchOpen(false)
      }
    }
    document.addEventListener('pointerdown', onPointerDown)
    return () => document.removeEventListener('pointerdown', onPointerDown)
  }, [])

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const onSubmit = async (event) => {
    event.preventDefault()
    if (form.tags.length === 0) {
      setError(t('places.selectAtLeastOneTag'))
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
      setDetailsOpen(false)
      await loadPlaces()
    } catch (err) {
      setError(
        apiErrorMessage(err, editingUuid ? t('places.failedUpdate') : t('places.failedCreate')),
      )
    } finally {
      setLoading(false)
    }
  }

  const focusPlaceOnMap = (place) => {
    const lat = Number(place.latitude)
    const lng = Number(place.longitude)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return

    flyToLocation(lat, lng, 16)
    setPopupInfo({
      type: 'place',
      place: {
        ...place,
        lat,
        lng,
        pinTagId: getPrimaryTagId(place.tags),
        distanceKm: userLocation ? distanceKm(userLocation.lat, userLocation.lng, lat, lng) : null,
        nearby: userLocation
          ? distanceKm(userLocation.lat, userLocation.lng, lat, lng) <= NEARBY_RADIUS_KM
          : false,
      },
    })
  }

  const openPlaceDetails = (place) => {
    focusPlaceOnMap(place)
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
    setFiltersOpen(false)
    setDetailsOpen(true)
  }

  const handleDelete = async (uuid) => {
    const confirmed = window.confirm(t('places.confirmDeleteOne'))
    if (!confirmed) return

    try {
      await http.delete(`/places/${uuid}`)
      if (editingUuid === uuid) {
        setEditingUuid(null)
        setForm(initialForm)
        setDetailsOpen(false)
      }
      await loadPlaces()
    } catch (err) {
      setError(apiErrorMessage(err, t('places.failedDelete')))
    }
  }

  const cancelEdit = () => {
    setEditingUuid(null)
    setForm(initialForm)
    setDetailsOpen(false)
    setPopupInfo(null)
  }

  const handleExportCsv = async () => {
    setCsvBusy(true)
    setCsvMessage('')
    setError('')
    try {
      const response = await http.get('/places/export', { responseType: 'blob' })
      const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'foodspots-places.csv'
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      setCsvMessage(t('places.exported'))
    } catch (err) {
      let message = t('places.failedExport')
      if (err?.response?.data instanceof Blob) {
        try {
          const text = await err.response.data.text()
          const parsed = JSON.parse(text)
          message = parsed.message || message
        } catch {
          // keep default message
        }
      } else {
        message = apiErrorMessage(err, message)
      }
      setError(message)
    } finally {
      setCsvBusy(false)
    }
  }

  const handleImportClick = () => {
    importInputRef.current?.click()
  }

  const handleImportCsv = async (event) => {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return

    setCsvBusy(true)
    setCsvMessage('')
    setError('')
    try {
      const formData = new FormData()
      formData.append('file', file)
      const { data } = await http.post('/places/import', formData)
      const errorPreview = (data.errors || []).slice(0, 3).join(' | ')
      setCsvMessage(
        t('places.imported', {
          imported: data.importedCount,
          skipped: data.skippedCount,
          errors: data.errorCount,
        }) + (errorPreview ? `. ${errorPreview}` : ''),
      )
      if (data.errorCount > 0 && data.importedCount === 0) {
        setError(errorPreview || t('places.importErrorsOnly'))
      }
      await loadPlaces()
    } catch (err) {
      setError(apiErrorMessage(err, t('places.failedImport')))
    } finally {
      setCsvBusy(false)
    }
  }

  const handleDeleteAll = async () => {
    if (places.length === 0) {
      setCsvMessage(t('places.noPlacesToDelete'))
      return
    }

    const confirmed = window.confirm(t('places.confirmDeleteAll', { count: places.length }))
    if (!confirmed) return

    setCsvBusy(true)
    setCsvMessage('')
    setError('')
    try {
      const { data } = await http.delete('/places')
      setEditingUuid(null)
      setForm(initialForm)
      setPopupInfo(null)
      setDetailsOpen(false)
      setCsvMessage(t('places.deletedCount', { count: data.deletedCount }))
      await loadPlaces()
    } catch (err) {
      setError(apiErrorMessage(err, t('places.failedDeleteAll')))
    } finally {
      setCsvBusy(false)
    }
  }

  const mapPoints = useMemo(() => {
    return places
      .filter((place) => Number.isFinite(Number(place.latitude)) && Number.isFinite(Number(place.longitude)))
      .map((place) => {
        const lat = Number(place.latitude)
        const lng = Number(place.longitude)
        const distance = userLocation ? distanceKm(userLocation.lat, userLocation.lng, lat, lng) : null
        return {
          ...place,
          lat,
          lng,
          pinTagId: getPrimaryTagId(place.tags),
          distanceKm: distance,
          nearby: distance != null && distance <= NEARBY_RADIUS_KM,
        }
      })
      .sort((a, b) => {
        if (a.distanceKm == null || b.distanceKm == null) return 0
        return a.distanceKm - b.distanceKm
      })
  }, [places, userLocation])

  const nearbyPlaces = useMemo(() => mapPoints.filter((place) => place.nearby), [mapPoints])

  const selectedPoint =
    Number.isFinite(Number(form.latitude)) && Number.isFinite(Number(form.longitude))
      ? {
          lat: Number(form.latitude),
          lng: Number(form.longitude),
        }
      : null

  const defaultCenter = userLocation
    ? userLocation
    : mapPoints.length > 0
      ? { lat: mapPoints[0].lat, lng: mapPoints[0].lng }
      : { lat: 37.9838, lng: 23.7275 }

  const initialViewState = useMemo(
    () => ({
      latitude: defaultCenter.lat,
      longitude: defaultCenter.lng,
      zoom: userLocation ? 13 : 12,
    }),
    [defaultCenter.lat, defaultCenter.lng, userLocation],
  )

  const flyToLocation = useCallback((lat, lng, zoom = 16) => {
    mapRef.current?.flyTo({
      center: [lng, lat],
      zoom,
      duration: 1600,
    })
    setMapZoom(zoom)
  }, [])

  const focusOnUserAndNearby = useCallback(
    (lat, lng) => {
      const map = mapRef.current
      if (!map) return

      const nearby = places
        .filter((place) => Number.isFinite(Number(place.latitude)) && Number.isFinite(Number(place.longitude)))
        .map((place) => ({
          lat: Number(place.latitude),
          lng: Number(place.longitude),
          distanceKm: distanceKm(lat, lng, Number(place.latitude), Number(place.longitude)),
        }))
        .filter((place) => place.distanceKm <= NEARBY_RADIUS_KM)

      if (nearby.length === 0) {
        flyToLocation(lat, lng, 14)
        setCsvMessage(t('places.locatedNoNearby', { radius: NEARBY_RADIUS_KM }))
        return
      }

      const lngs = [lng, ...nearby.map((place) => place.lng)]
      const lats = [lat, ...nearby.map((place) => place.lat)]
      map.fitBounds(
        [
          [Math.min(...lngs), Math.min(...lats)],
          [Math.max(...lngs), Math.max(...lats)],
        ],
        {
          padding: 70,
          maxZoom: 15,
          duration: 1600,
        },
      )
      setCsvMessage(
        t('places.locatedWithNearby', { count: nearby.length, radius: NEARBY_RADIUS_KM }),
      )
    },
    [flyToLocation, places, t],
  )

  useEffect(() => {
    let cancelled = false
    setLocationStatus('locating')

    getCurrentPosition()
      .then((position) => {
        if (cancelled) return
        setUserLocation({ lat: position.lat, lng: position.lng })
        setLocationStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setLocationStatus('denied')
      })

    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!userLocation || !mapReady) return

    const hasNearby = places.some((place) => {
      if (!Number.isFinite(Number(place.latitude)) || !Number.isFinite(Number(place.longitude))) return false
      return (
        distanceKm(userLocation.lat, userLocation.lng, Number(place.latitude), Number(place.longitude)) <=
        NEARBY_RADIUS_KM
      )
    })

    if (autoFocusDoneRef.current && (focusedWithNearbyRef.current || !hasNearby)) {
      return
    }

    autoFocusDoneRef.current = true
    if (hasNearby) {
      focusedWithNearbyRef.current = true
    }
    focusOnUserAndNearby(userLocation.lat, userLocation.lng)
  }, [userLocation, mapReady, places, focusOnUserAndNearby])

  const handleLocateMe = async () => {
    setLocationStatus('locating')
    setError('')
    try {
      const position = await getCurrentPosition()
      const next = { lat: position.lat, lng: position.lng }
      setUserLocation(next)
      setLocationStatus('ready')
      focusOnUserAndNearby(next.lat, next.lng)
      focusedWithNearbyRef.current = true
      autoFocusDoneRef.current = true
    } catch {
      setLocationStatus('denied')
      setError(t('places.locationAccessFailed'))
    }
  }

  const handleMapPick = async ({ lat, lng }) => {
    const latitude = lat.toFixed(6)
    const longitude = lng.toFixed(6)

    setError('')
    setEditingUuid(null)
    setFiltersOpen(false)
    setDetailsOpen(true)
    setForm({
      ...initialForm,
      latitude,
      longitude,
    })

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
      setError(t('places.geocodePartialFail'))
    } finally {
      setGeocoding(false)
    }
  }

  const handleAddressSelect = async (result) => {
    setMapSearchQuery(result.label)
    setMapSearchOpen(false)
    setMapSearchResults([])
    setError('')
    setEditingUuid(null)
    setFiltersOpen(false)
    setDetailsOpen(true)

    flyToLocation(result.lat, result.lng)
    setPopupInfo({ type: 'selected', lat: result.lat, lng: result.lng })

    setForm({
      ...initialForm,
      latitude: result.lat.toFixed(6),
      longitude: result.lng.toFixed(6),
      address: result.address,
      streetNumber: result.streetNumber,
      postalCode: result.postalCode,
      city: result.city,
      country: result.country,
    })
  }

  const handleMapSearchSubmit = async (event) => {
    event.preventDefault()
    const query = mapSearchQuery.trim()
    if (query.length < 3) return

    setMapSearching(true)
    setError('')
    try {
      const results = await searchAddresses(query, { limit: 1 })
      if (results.length === 0) {
        setError(t('places.noAddressFound'))
        setMapSearchResults([])
        return
      }
      await handleAddressSelect(results[0])
    } catch {
      setError(t('places.addressSearchFailed'))
    } finally {
      setMapSearching(false)
    }
  }

  const markerSize = Math.max(30, 58 - mapZoom * 2)

  const selectedPinTag = getPrimaryTagId(form.tags)

  const renderStars = (value, onClick) => (
    <div className="stars" role="group" aria-label={t('places.starsAria')}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={`star-button ${star <= value ? 'filled' : ''}`}
          onClick={() => onClick(star)}
          aria-label={t('places.starAria', { count: star })}
        >
          ★
        </button>
      ))}
    </div>
  )

  const activeFilterCount = (searchQuery.trim() ? 1 : 0) + filterTags.length

  return (
    <section className="card places-page">
      <div className="places-header">
        <h2>{t('places.title')}</h2>
        <div className="csv-actions">
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setDetailsOpen(false)
              setFiltersOpen(true)
            }}
            aria-expanded={filtersOpen}
          >
            {t('places.filters')}
            {activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </button>
          <button type="button" className="secondary" disabled={csvBusy} onClick={handleExportCsv}>
            {csvBusy ? t('places.working') : t('places.exportCsv')}
          </button>
          <button type="button" className="secondary" disabled={csvBusy} onClick={handleImportClick}>
            {t('places.importCsv')}
          </button>
          <button
            type="button"
            className="danger"
            disabled={csvBusy || places.length === 0}
            onClick={handleDeleteAll}
          >
            {t('places.deleteAll')}
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept=".csv,text/csv"
            className="csv-file-input"
            onChange={handleImportCsv}
          />
        </div>
      </div>
      {csvMessage && <p className="success csv-status">{csvMessage}</p>}
      {error && <p className="error">{error}</p>}

      <div className="places-layout">
        <div className="left-panel">
          <div className="map-wrapper">
            <div className="map-address-search" ref={mapSearchRef}>
              <form onSubmit={handleMapSearchSubmit} className="map-address-search-form">
                <input
                  type="search"
                  value={mapSearchQuery}
                  onChange={(event) => {
                    setMapSearchQuery(event.target.value)
                    setMapSearchOpen(true)
                  }}
                  onFocus={() => {
                    if (mapSearchResults.length > 0) setMapSearchOpen(true)
                  }}
                  placeholder={t('places.mapSearchPlaceholder')}
                  aria-label={t('places.mapSearchAria')}
                  autoComplete="off"
                />
                <button type="submit" className="secondary" disabled={mapSearching || mapSearchQuery.trim().length < 3}>
                  {mapSearching ? '...' : t('places.go')}
                </button>
                <button
                  type="button"
                  className="secondary"
                  disabled={locationStatus === 'locating'}
                  onClick={handleLocateMe}
                  title={t('places.nearMe')}
                >
                  {locationStatus === 'locating' ? '...' : t('places.nearMe')}
                </button>
              </form>
              {mapSearchOpen && mapSearchResults.length > 0 && (
                <ul className="map-address-suggestions" role="listbox">
                  {mapSearchResults.map((result) => (
                    <li key={result.id}>
                      <button type="button" onClick={() => handleAddressSelect(result)}>
                        {result.label}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <Map
              ref={mapRef}
              initialViewState={initialViewState}
              mapStyle={MAP_STYLE}
              style={{ width: '100%', height: '100%' }}
              onLoad={() => setMapReady(true)}
              onClick={(event) => {
                const { lat, lng } = event.lngLat
                handleMapPick({ lat, lng })
                setPopupInfo({ type: 'selected', lat, lng })
              }}
              onMoveEnd={(event) => setMapZoom(event.viewState.zoom)}
            >
              <NavigationControl position="top-right" />
              {userLocation && (
                <Marker longitude={userLocation.lng} latitude={userLocation.lat} anchor="center">
                  <span
                    className="user-location-dot"
                    title={t('places.yourLocation')}
                    aria-label={t('places.yourLocation')}
                  />
                </Marker>
              )}
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
                    openPlaceDetails(place)
                  }}
                >
                  <span className={place.nearby ? 'nearby-place-marker' : undefined}>
                    <TagPin tagId={place.pinTagId} size={markerSize} />
                  </span>
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
                  <strong>{t('places.newPlacePin')}</strong>
                  <br />
                  {getTagLabel(selectedPinTag, t)}
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
                  {popupInfo.place.nearby && (
                    <>
                      {t('places.nearby')} · {formatDistanceKm(popupInfo.place.distanceKm)}
                      <br />
                    </>
                  )}
                  {formatTagLabels(popupInfo.place.tags, t)}
                </Popup>
              )}
            </Map>
          </div>
          <p className="map-help">
            {locationStatus === 'locating' && `${t('places.detectingLocation')} `}
            {locationStatus === 'ready' && userLocation && (
              <>
                {nearbyPlaces.length > 0
                  ? `${t('places.showingLocationWithNearby', {
                      count: nearbyPlaces.length,
                      radius: NEARBY_RADIUS_KM,
                    })} `
                  : `${t('places.showingLocationNoNearby', { radius: NEARBY_RADIUS_KM })} `}
              </>
            )}
            {locationStatus === 'denied' && `${t('places.locationUnavailable')} `}
            {t('places.mapHelp')}
            {geocoding && <span className="geocoding-status">{t('places.lookingUpAddress')}</span>}
          </p>
        </div>

        <aside className="right-panel places-list-panel">
          <div className="places-list-header">
            <h3>{t('places.placesList')}</h3>
            <span className="places-list-count">{mapPoints.length}</span>
          </div>
          <p className="places-list-hint">{t('places.selectPlaceHint')}</p>
          <div className="list places-list-compact">
            {mapPoints.length === 0 && <p>{t('places.noPlaces')}</p>}
            {userLocation && nearbyPlaces.length > 0 && (
              <p className="nearby-list-hint">
                {t('places.nearbyFirst', { radius: NEARBY_RADIUS_KM, count: nearbyPlaces.length })}
              </p>
            )}
            {mapPoints.map((place) => (
              <article
                key={place.uuid}
                className={`place-card place-card-compact${place.nearby ? ' nearby' : ''}${
                  popupInfo?.type === 'place' && popupInfo.place.uuid === place.uuid ? ' selected' : ''
                }`}
              >
                <button
                  type="button"
                  className="place-card-main"
                  onClick={() => focusPlaceOnMap(place)}
                >
                  <div className="place-card-title-row">
                    <h3>{place.name}</h3>
                    {place.distanceKm != null && (
                      <span className={`distance-badge${place.nearby ? ' nearby' : ''}`}>
                        {formatDistanceKm(place.distanceKm)}
                      </span>
                    )}
                  </div>
                  <div className="place-tag-badges place-tag-badges-compact">
                    {(place.tags || []).slice(0, 3).map((tagId) => {
                      const tag = getTagMeta(tagId)
                      return (
                        <span
                          key={tagId}
                          className={`tag-badge tag-badge-compact ${tag.pinClass}`}
                          title={getTagLabel(tagId, t)}
                        >
                          {tag.emoji}
                        </span>
                      )
                    })}
                    {(place.tags || []).length > 3 && (
                      <span className="tag-badge tag-badge-compact tag-other">
                        +{(place.tags || []).length - 3}
                      </span>
                    )}
                    {(!place.tags || place.tags.length === 0) && (
                      <span className="tag-badge tag-badge-compact tag-other">📍</span>
                    )}
                  </div>
                </button>
                <div className="place-card-actions">
                  <button type="button" className="secondary" onClick={() => openPlaceDetails(place)}>
                    {t('places.edit')}
                  </button>
                  <button
                    type="button"
                    className="danger"
                    onClick={() => handleDelete(place.uuid)}
                  >
                    {t('places.delete')}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </div>

      {(filtersOpen || detailsOpen) && (
        <button
          type="button"
          className="drawer-backdrop"
          aria-label={filtersOpen ? t('places.closeFilters') : t('places.closeDetails')}
          onClick={() => {
            if (filtersOpen) setFiltersOpen(false)
            if (detailsOpen) cancelEdit()
          }}
        />
      )}

      <aside className={`side-drawer filter-drawer${filtersOpen ? ' open' : ''}`} aria-hidden={!filtersOpen}>
        <div className="side-drawer-header">
          <h3>{t('places.filters')}</h3>
          <button type="button" className="secondary" onClick={() => setFiltersOpen(false)}>
            {t('places.closeFilters')}
          </button>
        </div>
        <div className="side-drawer-body">
          <label className="search-field">
            {t('places.searchPlaces')}
            <input
              type="search"
              placeholder={t('places.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </label>
          <TagPicker
            label={t('places.filterByTag')}
            selectedTags={filterTags}
            onChange={setFilterTags}
          />
        </div>
        <div className="side-drawer-footer">
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setSearchQuery('')
              setFilterTags([])
            }}
          >
            {t('places.clearFilters')}
          </button>
          <button type="button" onClick={() => setFiltersOpen(false)}>
            {t('places.applyFilters')}
          </button>
        </div>
      </aside>

      <aside className={`side-drawer details-drawer${detailsOpen ? ' open' : ''}`} aria-hidden={!detailsOpen}>
        <div className="side-drawer-header">
          <h3>{editingUuid ? t('places.detailsTitle') : t('places.newPlaceTitle')}</h3>
          <button type="button" className="secondary" onClick={cancelEdit}>
            {t('places.closeDetails')}
          </button>
        </div>
        <div className="side-drawer-body">
          <form onSubmit={onSubmit} className="form-grid two-columns">
            <label>
              {t('places.name')}
              <input name="name" value={form.name} onChange={onChange} required />
            </label>
            <label>
              {t('places.streetAddress')}
              <input name="address" value={form.address} onChange={onChange} />
            </label>
            <label>
              {t('places.streetNumber')}
              <input name="streetNumber" value={form.streetNumber} onChange={onChange} />
            </label>
            <label>
              {t('places.postalCode')}
              <input name="postalCode" value={form.postalCode} onChange={onChange} />
            </label>
            <label>
              {t('places.city')}
              <input name="city" value={form.city} onChange={onChange} />
            </label>
            <label>
              {t('places.country')}
              <input name="country" value={form.country} onChange={onChange} />
            </label>
            <label>
              {t('places.latitude')}
              <input name="latitude" value={form.latitude} onChange={onChange} required />
            </label>
            <label>
              {t('places.longitude')}
              <input name="longitude" value={form.longitude} onChange={onChange} required />
            </label>
            <TagPicker
              label={t('places.tagsLabel')}
              selectedTags={form.tags}
              onChange={(tags) => setForm((prev) => ({ ...prev, tags }))}
            />
            <label className="full-width">
              {t('places.rating')}
              {renderStars(form.rating, (star) => setForm((prev) => ({ ...prev, rating: star })))}
            </label>
            <label className="full-width">
              {t('places.notes')}
              <textarea name="notes" value={form.notes} onChange={onChange} rows="3" />
            </label>
            {error && <p className="error full-width">{error}</p>}
            <button className="full-width" disabled={loading} type="submit">
              {loading ? t('places.saving') : editingUuid ? t('places.update') : t('places.save')}
            </button>
            {editingUuid && (
              <button
                className="full-width danger"
                type="button"
                onClick={() => handleDelete(editingUuid)}
              >
                {t('places.delete')}
              </button>
            )}
            <button className="full-width secondary" type="button" onClick={cancelEdit}>
              {t('places.cancelEditing')}
            </button>
          </form>
        </div>
      </aside>
    </section>
  )
}

