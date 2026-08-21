import { useState } from 'react'
import './App.css'

function App() {
  const [currentPage, setCurrentPage] = useState('home')
  const [userPhoto, setUserPhoto] = useState(null)
const [clothes, setClothes] = useState([])
function handleUserPhoto(event) {
  const file = event.target.files[0]

  if (file) {
    setUserPhoto(URL.createObjectURL(file))
  }
}

function handleClothesUpload(event) {
  const files = Array.from(event.target.files)

  const newClothes = files.map((file) => ({
    id: crypto.randomUUID(),
    file,
    preview: URL.createObjectURL(file),
    category: 'Top'
  }))

  setClothes((previousClothes) => [
    ...previousClothes,
    ...newClothes
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
              <img src={userPhoto} alt="User preview" />
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
              <div className="clothing-card" key={item.id}>
                <img
                  src={item.preview}
                  alt="Uploaded clothing"
                />

                <select
                  value={item.category}
                  onChange={(event) =>
                    changeCategory(item.id, event.target.value)
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
                  onClick={() => removeClothing(item.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        <button
          className="primary-button"
          disabled={!userPhoto || clothes.length === 0}
        >
          Continue →
        </button>
      </main>
    </div>
  )
}
  return (
    <div className="app">
      <nav className="navbar">
        <h2 className="logo">SmartCloset AI</h2>

        <div className="nav-right">
          <div className="nav-links">
            <a href="#">Home</a>
            <a href="#">My Wardrobe</a>
            <a href="#">Outfits</a>
            <a href="#">About</a>
          </div>

          <button className="nav-button">
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
            SmartCloset AI understands your wardrobe, your occasion,
            and your personal style to recommend the perfect outfit —
            without buying something new.
          </p>

          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={() => setCurrentPage('wardrobe')}
            >
              Build My Outfit →
            </button>
            <button className="secondary-button">
              See How It Works
            </button>
          </div>

          <p className="social-proof">
            AI styling built around the clothes you already own.
          </p>
        </div>

        <div className="hero-visual">
          <div className="visual-glow"></div>

          <div className="wardrobe-card">
            <div className="card-heading">
              <h3>My Wardrobe</h3>
              <button className="add-item-button">+ Add Item</button>
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
            <p className="outfit-label">Smart Recommendation</p>
            <h3>Your Outfit</h3>

            <div className="outfit-preview">
              Outfit preview
            </div>

            <div className="outfit-meta">
              <span>Business Casual</span>
              <span className="match-score">94% Match</span>
            </div>
          </div>
        </div>
      </main>

      <section className="features">
        <div className="feature">
          <div className="feature-icon">◫</div>
          <div>
            <h4>Understand Your Wardrobe</h4>
            <p>Upload clothes and keep everything organized.</p>
          </div>
        </div>

        <div className="feature">
          <div className="feature-icon">✦</div>
          <div>
            <h4>AI Outfit Recommendations</h4>
            <p>Get personalized outfit ideas for any occasion.</p>
          </div>
        </div>

        <div className="feature">
          <div className="feature-icon">◷</div>
          <div>
            <h4>Any Occasion</h4>
            <p>From presentations to dates and casual outings.</p>
          </div>
        </div>

        <div className="feature">
          <div className="feature-icon">♡</div>
          <div>
            <h4>Your Style, Your Way</h4>
            <p>Recommendations that match your own preferences.</p>
          </div>
        </div>
      </section>
    </div>
  )
}

export default App