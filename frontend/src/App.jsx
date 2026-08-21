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

  function handleUserPhoto(event) {
    const file = event.target.files[0]

    if (!file) return

    const imageUrl = URL.createObjectURL(file)

    setUserPhoto({
      file,
      preview: imageUrl,
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
      const response = await fetch(
        'http://127.0.0.1:5000/recommend',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            occasion,
            style,
            weather,
            preference,
          }),
        }
      )

      const data = await response.json()

      setRecommendation(data)
      setCurrentPage('recommendation')
    } catch (error) {
      console.error(error)
      alert('Something went wrong.')
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
            Upload a photo of yourself and the clothes you already own.
            Then organize each clothing item by category.
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
              onClick={() => setCurrentPage('home')}
            >
              ← Back
            </button>

            <button
              className="primary-button"
              disabled={
                !userPhoto || clothes.length === 0
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
            Tell SmartCloset where you're going and how you want
            to look. We'll find the best match from your wardrobe.
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
                  onClick={() => setOccasion(item)}
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
                  onClick={() => setStyle(item)}
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
                  onClick={() => setWeather(item)}
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
                setPreference(event.target.value)
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
            Based on your wardrobe, occasion, style, and preferences,
            here's the outfit SmartCloset recommends.
          </p>

          <div className="recommendation-card">
            <div className="score">
              {recommendation.score}% Match
            </div>

            <div className="recommendation-items">
              <div className="recommendation-item">
                <span>Top</span>
                <strong>{recommendation.top}</strong>
              </div>

              <div className="recommendation-item">
                <span>Bottom</span>
                <strong>{recommendation.bottom}</strong>
              </div>

              <div className="recommendation-item">
                <span>Shoes</span>
                <strong>{recommendation.shoes}</strong>
              </div>
            </div>

            <div className="reason-box">
              <h3>Why this works</h3>
              <p>{recommendation.reason}</p>
            </div>
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

            <button className="primary-button">
              Try It On →
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
            What You <span>Already Own.</span>
          </h1>

          <p className="hero-description">
            SmartCloset AI understands your wardrobe,
            your occasion, and your personal style to
            recommend the perfect outfit — without
            buying something new.
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
            AI styling built around the clothes you
            already own.
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
              <div className="clothing-item">
                Jacket
              </div>
              <div className="clothing-item">
                Sweater
              </div>
              <div className="clothing-item">
                Pants
              </div>
              <div className="clothing-item">
                Shoes
              </div>
              <div className="clothing-item">
                Watch
              </div>
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
              Upload clothes and keep everything
              organized.
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
              Get personalized outfit ideas for
              any occasion.
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
              From presentations to dates and
              casual outings.
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
              Recommendations that match your own
              preferences.
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App