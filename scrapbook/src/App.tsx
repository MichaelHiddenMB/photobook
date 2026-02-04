import { useMemo, useState } from 'react'
import './App.css'

type Place = {
  name: string
  lat: number
  lon: number
  address: string
  distance: number
}

function App() {
  const [origin, setOrigin] = useState('')
  const [submittedOrigin, setSubmittedOrigin] = useState('')
  const [coords, setCoords] = useState<{ lat: number; lon: number } | null>(null)
  const [place, setPlace] = useState<Place | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const directionsUrl = useMemo(() => {
    if (!submittedOrigin.trim() || !place) return ''
    const dest = encodeURIComponent(`${place.name} ${place.address}`)
    const orig = coords
      ? `${coords.lat},${coords.lon}`
      : encodeURIComponent(submittedOrigin.trim())
    return `https://www.google.com/maps/dir/?api=1&origin=${orig}&destination=${dest}`
  }, [submittedOrigin, place, coords])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!origin.trim()) return
    setCoords(null)
    setSubmittedOrigin(origin)
    await findNearest({ manualOrigin: origin })
  }

  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by this browser')
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords
        setCoords({ lat: latitude, lon: longitude })
        setSubmittedOrigin('Current location')
        findNearest({ coords: { lat: latitude, lon: longitude } })
      },
      (err) => {
        setError(err.message || 'Unable to get location')
        setLoading(false)
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const findNearest = async ({
    manualOrigin,
    coords: presetCoords,
  }: {
    manualOrigin?: string
    coords?: { lat: number; lon: number }
  }) => {
    setLoading(true)
    setError(null)
    setPlace(null)

    try {
      let lat: number
      let lon: number

      if (presetCoords) {
        lat = presetCoords.lat
        lon = presetCoords.lon
      } else {
        // Geocode origin via Nominatim
        const geoRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(manualOrigin || '')}&limit=1&addressdetails=1`,
        )
        if (!geoRes.ok) throw new Error('Geocoding failed')
        const geoJson = await geoRes.json()
        if (!geoJson || geoJson.length === 0) throw new Error('Location not found')
        lat = Number(geoJson[0].lat)
        lon = Number(geoJson[0].lon)
      }

      // 2) Overpass query for nearby chicken places (restaurant or fast_food)
      const radius = 2000 // meters
      const overpassQuery = `
        [out:json][timeout:25];
        (
          node(around:${radius},${lat},${lon})["amenity"~"restaurant|fast_food"]["name"~"chicken|wing|pollo|periperi", i];
          node(around:${radius},${lat},${lon})["amenity"~"restaurant|fast_food"]["cuisine"~"chicken|fried_chicken|wings", i];
        );
        out body;
      `
      const overpassRes = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        body: overpassQuery,
        headers: { 'Content-Type': 'text/plain' },
      })
      if (!overpassRes.ok) throw new Error('Menu lookup failed')
      const data = await overpassRes.json()
      const results: Place[] =
        data.elements?.map((el: any) => {
          const dLat = (Number(el.lat) - Number(lat)) * (Math.PI / 180)
          const dLon = (Number(el.lon) - Number(lon)) * (Math.PI / 180)
          const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(Number(lat) * (Math.PI / 180)) *
              Math.cos(Number(el.lat) * (Math.PI / 180)) *
              Math.sin(dLon / 2) ** 2
          const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
          const distance = 6371000 * c // meters
          const name = el.tags?.name || 'Unnamed spot'
          const addressParts = [
            el.tags?.['addr:housenumber'],
            el.tags?.['addr:street'],
            el.tags?.['addr:city'],
          ]
          const address = addressParts.filter(Boolean).join(' ') || 'Nearby'
          return { name, lat: el.lat, lon: el.lon, address, distance }
        }) ?? []

      const nearest = results.sort((a, b) => a.distance - b.distance)[0]
      if (!nearest) throw new Error('No chicken spots found within 2km')
      setPlace(nearest)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">Campus helper</p>
        <h1 className="headline">Find the nearest chicken spot</h1>
        <p className="lede">Enter where you are; we’ll locate the closest restaurant/fast food with “chicken” nearby.</p>
      </header>

      <main className="panel">
        <form className="card" onSubmit={handleSubmit}>
          <label className="field">
            <span>Your location (address, building, or landmark)</span>
            <input
              type="text"
              placeholder="e.g., McKeldin Library, College Park MD"
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
            />
          </label>
          <div className="actions">
            <button type="submit" disabled={loading}>
              {loading ? 'Searching…' : 'Find chicken'}
            </button>
            <button type="button" className="ghost" onClick={handleUseLocation} disabled={loading}>
              Use my current location
            </button>
          </div>
        </form>

        <section className="card result">
          <h2>Closest match</h2>
          {error && <p className="error">Error: {error}</p>}
          {!error && loading && <p className="muted">Searching nearby chicken spots…</p>}
          {!error && !loading && place && (
            <>
              <p className="dest-name">{place.name}</p>
              <p className="muted">{place.address}</p>
              <p className="muted">{(place.distance / 1000).toFixed(2)} km away</p>
              {directionsUrl && (
                <a className="directions" href={directionsUrl} target="_blank" rel="noreferrer">
                  Open directions in Google Maps
                </a>
              )}
            </>
          )}
          {!error && !loading && !place && <p className="muted">Enter a starting location to get a link.</p>}
        </section>
      </main>
    </div>
  )
}

export default App
