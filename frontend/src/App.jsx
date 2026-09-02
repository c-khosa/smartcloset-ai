import { useState } from 'react'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')

  const [userPhoto, setUserPhoto] = useState(null)
  const [clothes, setClothes] = useState([])

  const [occasion, setOccasion] = useState('')
  const [style, setStyle] = useState('')
  const [weather, setWeather] = useState('')
  const [preference, setPreference] = useState('')

  const [recommendation, setRecommendation] = useState(null)

  const [tryOnResult, setTryOnResult] = useState(null)
  const [tryOnLoading, setTryOnLoading] = useState(false)

  function handleUserPhoto(event) {
    const file = event.target.files[0]

    if (!file) return

    setUserPhoto({
      file,
      preview: URL.createObjectURL(file),
    })
  }

  function handleClothesUpload(event) {
    const files = Array.from(event.target.files)

    const newClothes = files.map((file) => ({
      id: crypto.randomUUID(),
      file,
      preview: URL.createObjectURL(file),
      category: 'Top',
    }))

    setClothes((previousClothes) => [
      ...previousClothes,
      ...newClothes,
    ])
  }

  function changeCategory(id, newCategory) {
    setClothes((previousClothes) =>
      previousClothes.map((item) =>
        item.id === id
          ? { ...item, category: newCategory }
          : item
      )
    )
  }

  function removeClothing(id) {
    setClothes((previousClothes) =>
      previousClothes.filter((item) => item.id !== id)
    )
  }

  async function getRecommendation() {
    try {
      const formData = new FormData()

      if (userPhoto) {
        formData.append('userPhoto', userPhoto.file)
      }

      clothes.forEach((item) => {
        formData.append('clothes', item.file)
      })

      const clothingCategories = clothes.map((item) => ({
        name: item.file.name,
        category: item.category,
      }))

      formData.append(
        'clothingCategories',
        JSON.stringify(clothingCategories)
      )

      formData.append('occasion', occasion)
      formData.append('style', style)
      formData.append('weather', weather)
      formData.append('preference', preference)

      const response = await fetch(
        'http://127.0.0.1:5000/recommend',
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Recommendation failed'
        )
      }

      console.log('Recommendation:', data)

      setRecommendation(data)
      setCurrentPage('recommendation')
    } catch (error) {
      console.error(error)
      alert(error.message)
    }
  }

  function findSelectedClothing() {
    if (!recommendation) return null

    const possibleIds = [
      recommendation.top,
      recommendation.jacket,
      recommendation.bottom,
      recommendation.shoes,
      recommendation.accessory,
    ]

    for (const recommendedId of possibleIds) {
      if (!recommendedId) continue

      const itemIndex = Number(
        recommendedId.replace('item_', '')
      )

      if (
        !Number.isNaN(itemIndex) &&
        clothes[itemIndex]
      ) {
        return clothes[itemIndex]
      }
    }

    return clothes[0] || null
  }

  function getPerfectCorpCategory(clothingItem) {
    if (!clothingItem) {
      return 'upper_body'
    }

    const category = clothingItem.category.toLowerCase()

    if (
      category === 'top' ||
      category === 'jacket'
    ) {
      return 'upper_body'
    }

    if (
      category === 'bottom'
    ) {
      return 'lower_body'
    }

    return 'upper_body'
  }

  async function handleTryOn() {
    try {
      if (!userPhoto) {
        alert('Please upload your photo first.')
        return
      }

      const selectedClothing = findSelectedClothing()

      if (!selectedClothing) {
        alert('No clothing item is available for try-on.')
        return
      }

      setTryOnLoading(true)

      const formData = new FormData()

      formData.append(
        'userPhoto',
        userPhoto.file
      )

      formData.append(
        'clothingPhoto',
        selectedClothing.file
      )

      formData.append(
        'garmentCategory',
        getPerfectCorpCategory(selectedClothing)
      )

      console.log(
        'Sending to Perfect Corp:',
        selectedClothing.file.name,
        selectedClothing.category
      )

      const response = await fetch(
        'http://127.0.0.1:5000/try-on',
        {
          method: 'POST',
          body: formData,
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.details ||
          data.error ||
          'Virtual try-on failed'
        )
      }

      console.log('Try-on result:', data)

      setTryOnResult(data.result_url)
      setCurrentPage('tryon')
    } catch (error) {
      console.error(error)
      alert(error.message)
    } finally {
      setTryOnLoading(false)
    }
  }

  if (currentPage === 'wardrobe') {
    return (
      <div className="app">
        <nav className="navbar">
          <h2
            className="logo"
            onClick={() => setCurrentPage('home')}
            style={{ cursor: 'pointer' }}
          >
            SmartCloset AI
          </h2>
        </nav>

        <main className="wardrobe-page">
          <p className="badge">STEP 1 OF 3</p>

          <h1>Build Your Wardrobe</h1>

          <p className="wardrobe-description">
            Upload a photo of yourself and the clothes
            you already own. Then organize each item by
            category.
          </p>

          <section className="upload-section">
            <h3>Your Photo</h3>

            <label className="upload-box">
              <span>Upload your photo</span>

              <input
                type="file"
                accept="image/*"
                onChange={handleUserPhoto}
                hidden
              />
            </label>

            {userPhoto && (
              <div className="user-photo-preview">
                <img
                  src={userPhoto.preview}
                  alt="User preview"
                />
              </div>
            )}
          </section>

          <section className="upload-section">
            <h3>Your Clothes</h3>

            <label className="upload-box">
              <span>+ Add clothing images</span>

              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleClothesUpload}
                hidden
              />
            </label>

            <div className="clothes-grid">
              {clothes.map((item) => (
                <div
                  className="clothing-card"
                  key={item.id}
                >
                  <img
                    src={item.preview}
                    alt="Uploaded clothing"
                  />

                  <select
                    value={item.category}
                    onChange={(event) =>
                      changeCategory(
                        item.id,
                        event.target.value
                      )
                    }
                  >
                    <option>Top</option>
                    <option>Bottom</option>
                    <option>Jacket</option>
                    <option>Shoes</option>
                    <option>Accessory</option>
                  </select>

                  <button
                    className="remove-button"
                    onClick={() =>
                      removeClothing(item.id)
                    }
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </section>

          <div className="page-actions">
            <button
              className="secondary-button"
              onClick={() =>
                setCurrentPage('home')
              }
            >
              ← Back
            </button>

            <button
              className="primary-button"
              disabled={
                !userPhoto ||
                clothes.length === 0
              }
              onClick={() =>
                setCurrentPage('preferences')
              }
            >
              Continue →
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (currentPage === 'preferences') {
    return (
      <div className="app">
        <nav className="navbar">
          <h2
            className="logo"
            onClick={() => setCurrentPage('home')}
            style={{ cursor: 'pointer' }}
          >
            SmartCloset AI
          </h2>
        </nav>

        <main className="preferences-page">
          <p className="badge">STEP 2 OF 3</p>

          <h1>What's the occasion?</h1>

          <p className="preferences-description">
            Tell SmartCloset where you're going and
            how you want to look.
          </p>

          <section className="preference-section">
            <h2>Occasion</h2>

            <div className="option-grid">
              {[
                'Job Interview',
                'College',
                'Presentation',
                'Date',
                'Party',
                'Casual Outing',
              ].map((item) => (
                <button
                  key={item}
                  className={
                    occasion === item
                      ? 'option-card selected'
                      : 'option-card'
                  }
                  onClick={() =>
                    setOccasion(item)
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="preference-section">
            <h2>Style</h2>

            <div className="option-grid">
              {[
                'Professional',
                'Smart Casual',
                'Casual',
                'Minimal',
                'Trendy',
                'Streetwear',
              ].map((item) => (
                <button
                  key={item}
                  className={
                    style === item
                      ? 'option-card selected'
                      : 'option-card'
                  }
                  onClick={() =>
                    setStyle(item)
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="preference-section">
            <h2>Weather</h2>

            <div className="option-grid weather-grid">
              {[
                'Hot',
                'Mild',
                'Cold',
                'Rainy',
              ].map((item) => (
                <button
                  key={item}
                  className={
                    weather === item
                      ? 'option-card selected'
                      : 'option-card'
                  }
                  onClick={() =>
                    setWeather(item)
                  }
                >
                  {item}
                </button>
              ))}
            </div>
          </section>

          <section className="preference-section">
            <h2>
              Anything else?
              <span className="optional">
                {' '}
                Optional
              </span>
            </h2>

            <textarea
              className="preference-input"
              placeholder="Example: I want to look professional but not overdressed."
              value={preference}
              onChange={(event) =>
                setPreference(
                  event.target.value
                )
              }
            />
          </section>

          <div className="page-actions">
            <button
              className="secondary-button"
              onClick={() =>
                setCurrentPage('wardrobe')
              }
            >
              ← Back
            </button>

            <button
              className="primary-button"
              disabled={!occasion || !style}
              onClick={getRecommendation}
            >
              Find My Outfit →
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (
    currentPage === 'recommendation' &&
    recommendation
  ) {
    const selectedClothing =
      findSelectedClothing()

    return (
      <div className="app">
        <nav className="navbar">
          <h2
            className="logo"
            onClick={() => setCurrentPage('home')}
            style={{ cursor: 'pointer' }}
          >
            SmartCloset AI
          </h2>
        </nav>

        <main className="recommendation-page">
          <p className="badge">STEP 3 OF 3</p>

          <h1>Your SmartCloset Outfit</h1>

          <p className="recommendation-intro">
            Based on your wardrobe, occasion,
            style, and preferences, here's the
            outfit SmartCloset recommends.
          </p>

          <div className="recommendation-card">
            <div className="score">
              {recommendation.score}% Match
            </div>

            <div className="recommendation-items">
              <div className="recommendation-item">
                <span>Top</span>
                <strong>
                  {recommendation.top || 'None'}
                </strong>
              </div>

              <div className="recommendation-item">
                <span>Bottom</span>
                <strong>
                  {recommendation.bottom || 'None'}
                </strong>
              </div>

              <div className="recommendation-item">
                <span>Shoes</span>
                <strong>
                  {recommendation.shoes || 'None'}
                </strong>
              </div>

              {recommendation.jacket && (
                <div className="recommendation-item">
                  <span>Jacket</span>
                  <strong>
                    {recommendation.jacket}
                  </strong>
                </div>
              )}

              {recommendation.accessory && (
                <div className="recommendation-item">
                  <span>Accessory</span>
                  <strong>
                    {recommendation.accessory}
                  </strong>
                </div>
              )}
            </div>

            <div className="reason-box">
              <h3>Why this works</h3>

              <p>
                {recommendation.reason}
              </p>
            </div>

            {selectedClothing && (
              <div
                style={{
                  marginTop: '24px',
                }}
              >
                <h3>
                  Item selected for virtual try-on
                </h3>

                <img
                  src={selectedClothing.preview}
                  alt="Selected clothing"
                  style={{
                    width: '180px',
                    borderRadius: '14px',
                  }}
                />

                <p>
                  {selectedClothing.category}
                  {' — '}
                  {selectedClothing.file.name}
                </p>
              </div>
            )}
          </div>

          <div className="page-actions">
            <button
              className="secondary-button"
              onClick={() =>
                setCurrentPage('preferences')
              }
            >
              ← Change Preferences
            </button>

            <button
              className="primary-button"
              onClick={handleTryOn}
              disabled={tryOnLoading}
            >
              {tryOnLoading
                ? 'Generating Try-On...'
                : 'Try It On →'}
            </button>
          </div>
        </main>
      </div>
    )
  }

  if (
    currentPage === 'tryon' &&
    tryOnResult
  ) {
    return (
      <div className="app">
        <nav className="navbar">
          <h2
            className="logo"
            onClick={() =>
              setCurrentPage('home')
            }
            style={{ cursor: 'pointer' }}
          >
            SmartCloset AI
          </h2>
        </nav>

        <main className="recommendation-page">
          <p className="badge">
            PERFECT CORP VIRTUAL TRY-ON
          </p>

          <h1>See Your Outfit</h1>

          <p className="recommendation-intro">
            Your selected wardrobe item has been
            virtually applied using Perfect Corp's
            AI Clothes Virtual Try-On technology.
          </p>

          <div className="tryon-result-card">
            <img
              src={tryOnResult}
              alt="Perfect Corp virtual try-on result"
              className="tryon-result-image"
            />
          </div>

          <div className="page-actions">
            <button
              className="secondary-button"
              onClick={() =>
                setCurrentPage(
                  'recommendation'
                )
              }
            >
              ← Back
            </button>

            <button
              className="primary-button"
              onClick={() => {
                setRecommendation(null)
                setTryOnResult(null)
                setCurrentPage('wardrobe')
              }}
            >
              Try Another Outfit
            </button>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="app">
      <nav className="navbar">
        <h2 className="logo">
          SmartCloset AI
        </h2>

        <div className="nav-right">
          <div className="nav-links">
            <a href="#">Home</a>
            <a href="#">My Wardrobe</a>
            <a href="#">Outfits</a>
            <a href="#">About</a>
          </div>

          <button
            className="nav-button"
            onClick={() =>
              setCurrentPage('wardrobe')
            }
          >
            Get Started
          </button>
        </div>
      </nav>

      <main className="hero">
        <div className="hero-content">
          <p className="badge">
            ✦ AI-POWERED PERSONAL STYLIST
          </p>

          <h1>
            Dress Better With
            <br />
            What You{' '}
            <span>Already Own.</span>
          </h1>

          <p className="hero-description">
            SmartCloset AI understands your wardrobe,
            your occasion, and your personal style
            to recommend the perfect outfit —
            without buying something new.
          </p>

          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={() =>
                setCurrentPage('wardrobe')
              }
            >
              Build My Outfit →
            </button>

            <button className="secondary-button">
              See How It Works
            </button>
          </div>

          <p className="social-proof">
            AI styling built around the clothes
            you already own.
          </p>
        </div>

        <div className="hero-visual">
          <div className="visual-glow"></div>

          <div className="wardrobe-card">
            <div className="card-heading">
              <h3>My Wardrobe</h3>

              <button className="add-item-button">
                + Add Item
              </button>
            </div>

            <div className="wardrobe-grid">
              <div className="clothing-item">Top</div>
              <div className="clothing-item">Jacket</div>
              <div className="clothing-item">Sweater</div>
              <div className="clothing-item">Pants</div>
              <div className="clothing-item">Shoes</div>
              <div className="clothing-item">Watch</div>
            </div>
          </div>

          <div className="outfit-card">
            <p className="outfit-label">
              Smart Recommendation
            </p>

            <h3>Your Outfit</h3>

            <div className="outfit-preview">
              Outfit preview
            </div>

            <div className="outfit-meta">
              <span>Business Casual</span>

              <span className="match-score">
                94% Match
              </span>
            </div>
          </div>
        </div>
      </main>

      <section className="features">
        <div className="feature">
          <div className="feature-icon">
            ◫
          </div>

          <div>
            <h4>
              Understand Your Wardrobe
            </h4>

            <p>
              Upload clothes and keep everything organized.
            </p>
          </div>
        </div>

        <div className="feature">
          <div className="feature-icon">
            ✦
          </div>

          <div>
            <h4>
              AI Outfit Recommendations
            </h4>

            <p>
              Get personalized outfit ideas for any occasion.
            </p>
          </div>
        </div>

        <div className="feature">
          <div className="feature-icon">
            ◷
          </div>

          <div>
            <h4>Any Occasion</h4>

            <p>
              From presentations to dates and casual outings.
            </p>
          </div>
        </div>

        <div className="feature">
          <div className="feature-icon">
            ♡
          </div>

          <div>
            <h4>
              Your Style, Your Way
            </h4>

            <p>
              Recommendations that match your own preferences.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App