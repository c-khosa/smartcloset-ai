import { useState } from 'react'
import './App.css'


function App() {

  // ==================================================
  // PAGE STATE
  // ==================================================

  const [currentPage, setCurrentPage] = useState('home')


  // ==================================================
  // USER PHOTO
  // ==================================================

  const [userPhoto, setUserPhoto] = useState(null)


  // ==================================================
  // CLOTHING
  // ==================================================

  const [clothes, setClothes] = useState([])


  // ==================================================
  // PREFERENCES
  // ==================================================

  const [occasion, setOccasion] = useState('')
  const [style, setStyle] = useState('')
  const [weather, setWeather] = useState('')
  const [preference, setPreference] = useState('')


  // ==================================================
  // RECOMMENDATION
  // ==================================================

  const [recommendation, setRecommendation] = useState(null)

  const [loading, setLoading] = useState(false)

  const [error, setError] = useState('')


  // ==================================================
  // OPTIONS
  // ==================================================

  const categories = [
    'Top',
    'Bottom',
    'Jacket',
    'Shoes',
    'Accessory'
  ]


  const occasions = [
    'Job Interview',
    'College',
    'Presentation',
    'Date',
    'Party',
    'Casual Outing'
  ]


  const styles = [
    'Professional',
    'Smart Casual',
    'Casual',
    'Minimal',
    'Trendy',
    'Streetwear'
  ]


  const weatherOptions = [
    'Hot',
    'Mild',
    'Cold',
    'Rainy'
  ]


  // ==================================================
  // USER PHOTO UPLOAD
  // ==================================================

  function handleUserPhoto(event) {

    const file = event.target.files[0]

    if (!file) {
      return
    }


    if (userPhoto?.preview) {
      URL.revokeObjectURL(userPhoto.preview)
    }


    setUserPhoto({
      file: file,
      preview: URL.createObjectURL(file)
    })
  }


  // ==================================================
  // CLOTHING UPLOAD
  // ==================================================

  function handleClothesUpload(event) {

    const uploadedFiles = Array.from(
      event.target.files
    )


    const newItems = uploadedFiles.map(
      (file) => ({
        id: crypto.randomUUID(),

        file: file,

        preview:
          URL.createObjectURL(file),

        category: 'Top'
      })
    )


    setClothes(
      (previousClothes) => [
        ...previousClothes,
        ...newItems
      ]
    )


    event.target.value = ''
  }


  // ==================================================
  // CHANGE CLOTHING CATEGORY
  // ==================================================

  function changeCategory(id, category) {

    setClothes(
      clothes.map(
        (item) => {

          if (item.id === id) {

            return {
              ...item,
              category: category
            }
          }

          return item
        }
      )
    )
  }


  // ==================================================
  // REMOVE CLOTHING ITEM
  // ==================================================

  function removeClothing(id) {

    const itemToRemove = clothes.find(
      (item) => item.id === id
    )


    if (itemToRemove) {
      URL.revokeObjectURL(
        itemToRemove.preview
      )
    }


    setClothes(
      clothes.filter(
        (item) => item.id !== id
      )
    )
  }


  // ==================================================
  // MOVE TO PREFERENCES
  // ==================================================

  function goToPreferences() {

    setError('')


    if (!userPhoto) {

      setError(
        'Please upload a photo of yourself first.'
      )

      return
    }


    if (clothes.length === 0) {

      setError(
        'Please upload at least one clothing item.'
      )

      return
    }


    setCurrentPage('preferences')
  }


  // ==================================================
  // SEND DATA TO FLASK
  // ==================================================

  async function getRecommendation() {

    setError('')


    if (!occasion) {

      setError(
        'Please select an occasion.'
      )

      return
    }


    if (!style) {

      setError(
        'Please select a style.'
      )

      return
    }


    if (!weather) {

      setError(
        'Please select the weather.'
      )

      return
    }


    try {

      setLoading(true)


      const formData = new FormData()


      // User photo
      formData.append(
        'userPhoto',
        userPhoto.file
      )


      // Clothing images
      clothes.forEach(
        (item) => {

          formData.append(
            'clothes',
            item.file
          )
        }
      )


      // Clothing categories
      const clothingCategories =
        clothes.map(
          (item) => ({

            name:
              item.file.name,

            category:
              item.category

          })
        )


      formData.append(
        'clothingCategories',

        JSON.stringify(
          clothingCategories
        )
      )


      // Preferences
      formData.append(
        'occasion',
        occasion
      )


      formData.append(
        'style',
        style
      )


      formData.append(
        'weather',
        weather
      )


      formData.append(
        'preference',
        preference
      )


      // Send request to Flask
      const response = await fetch(
        'http://127.0.0.1:5000/recommend',
        {
          method: 'POST',
          body: formData
        }
      )


      const data = await response.json()


      if (!response.ok) {

        throw new Error(
          data.error ||
          'Something went wrong.'
        )
      }


      console.log(
        'AI Recommendation:',
        data
      )


      setRecommendation(data)

      setCurrentPage(
        'recommendation'
      )


    } catch (error) {

      console.error(error)

      setError(
        error.message
      )

    } finally {

      setLoading(false)
    }
  }


  // ==================================================
  // FIND PREVIEW FOR SELECTED AI ITEM
  // ==================================================

  function getSelectedPreview(itemData) {

    if (!itemData) {
      return null
    }


    const matchingItem =
      clothes.find(
        (item) =>
          item.file.name ===
          itemData.filename
      )


    return matchingItem
      ? matchingItem.preview
      : null
  }


  // ==================================================
  // RESET APP
  // ==================================================

  function startAgain() {

    setRecommendation(null)

    setOccasion('')
    setStyle('')
    setWeather('')
    setPreference('')

    setError('')

    setCurrentPage(
      'wardrobe'
    )
  }


  // ==================================================
  // HOME PAGE
  // ==================================================

  if (currentPage === 'home') {

    return (

      <div className="app">

        <nav className="navbar">

          <div className="logo">
            SmartCloset
            <span>AI</span>
          </div>

          <div className="nav-tag">
            AI Personal Stylist
          </div>

        </nav>


        <main className="hero">

          <div className="hero-badge">
            YOUR WARDROBE. SMARTER.
          </div>


          <h1>
            Dress Better With
            <span>
              {' '}What You Already Own.
            </span>
          </h1>


          <p className="hero-description">

            SmartCloset AI analyzes the clothes
            you already own and builds an outfit
            for your occasion, style and weather.

          </p>


          <button
            className="primary-button hero-button"

            onClick={() =>
              setCurrentPage(
                'wardrobe'
              )
            }
          >

            Build My Outfit →

          </button>


          <div className="hero-features">

            <div>
              <strong>01</strong>
              <span>
                Upload your wardrobe
              </span>
            </div>


            <div>
              <strong>02</strong>
              <span>
                Tell us your plans
              </span>
            </div>


            <div>
              <strong>03</strong>
              <span>
                Get your AI outfit
              </span>
            </div>

          </div>

        </main>

      </div>
    )
  }


  // ==================================================
  // WARDROBE PAGE
  // ==================================================

  if (currentPage === 'wardrobe') {

    return (

      <div className="app">

        <nav className="navbar">

          <button
            className="back-button"

            onClick={() =>
              setCurrentPage('home')
            }
          >

            ← Back

          </button>


          <div className="logo">
            SmartCloset
            <span>AI</span>
          </div>


          <div className="step-label">
            STEP 1 OF 2
          </div>

        </nav>


        <main className="page-container">

          <div className="page-heading">

            <p className="eyebrow">
              BUILD YOUR DIGITAL WARDROBE
            </p>

            <h2>
              Show us what you're
              working with.
            </h2>

            <p>
              Upload a photo of yourself,
              then add clothing from your
              closet.
            </p>

          </div>


          {error && (
            <div className="error-message">
              {error}
            </div>
          )}


          <section className="upload-section">

            <div className="section-heading">

              <div>
                <span className="section-number">
                  01
                </span>

                <h3>
                  Your Photo
                </h3>
              </div>

              <span className="required">
                REQUIRED
              </span>

            </div>


            <label className="photo-upload">

              {userPhoto ? (

                <img
                  src={userPhoto.preview}
                  alt="User preview"
                />

              ) : (

                <div className="upload-placeholder">

                  <div className="upload-icon">
                    +
                  </div>

                  <strong>
                    Upload your photo
                  </strong>

                  <span>
                    JPG or PNG
                  </span>

                </div>
              )}


              <input
                type="file"
                accept="image/*"
                onChange={
                  handleUserPhoto
                }
              />

            </label>

          </section>


          <section className="upload-section">

            <div className="section-heading">

              <div>

                <span className="section-number">
                  02
                </span>

                <h3>
                  Your Clothes
                </h3>

              </div>


              <span className="item-count">
                {clothes.length} ITEMS
              </span>

            </div>


            <label className="clothes-upload">

              <span className="upload-icon">
                +
              </span>

              <strong>
                Add clothing
              </strong>

              <span>
                Select multiple images
              </span>


              <input
                type="file"
                accept="image/*"
                multiple
                onChange={
                  handleClothesUpload
                }
              />

            </label>


            {clothes.length > 0 && (

              <div className="clothes-grid">

                {clothes.map(
                  (item) => (

                    <div
                      className="clothing-card"
                      key={item.id}
                    >

                      <div className="clothing-image">

                        <img
                          src={item.preview}
                          alt="Clothing"
                        />


                        <button
                          className="remove-button"

                          onClick={() =>
                            removeClothing(
                              item.id
                            )
                          }
                        >
                          ×
                        </button>

                      </div>


                      <select
                        value={item.category}

                        onChange={(event) =>
                          changeCategory(
                            item.id,
                            event.target.value
                          )
                        }
                      >

                        {categories.map(
                          (category) => (

                            <option
                              value={category}
                              key={category}
                            >
                              {category}
                            </option>

                          )
                        )}

                      </select>

                    </div>

                  )
                )}

              </div>
            )}

          </section>


          <div className="page-actions">

            <button
              className="primary-button"

              onClick={
                goToPreferences
              }
            >

              Continue →

            </button>

          </div>

        </main>

      </div>
    )
  }


  // ==================================================
  // PREFERENCES PAGE
  // ==================================================

  if (currentPage === 'preferences') {

    return (

      <div className="app">

        <nav className="navbar">

          <button
            className="back-button"

            onClick={() =>
              setCurrentPage(
                'wardrobe'
              )
            }
          >
            ← Back
          </button>


          <div className="logo">
            SmartCloset
            <span>AI</span>
          </div>


          <div className="step-label">
            STEP 2 OF 2
          </div>

        </nav>


        <main className="page-container preferences-page">

          <div className="page-heading">

            <p className="eyebrow">
              ALMOST THERE
            </p>

            <h2>
              What's the plan?
            </h2>

            <p>
              Give your AI stylist some
              context so it can choose the
              right outfit.
            </p>

          </div>


          {error && (
            <div className="error-message">
              {error}
            </div>
          )}


          <OptionSection
            number="01"
            title="Occasion"
            options={occasions}
            selected={occasion}
            onSelect={setOccasion}
          />


          <OptionSection
            number="02"
            title="Style"
            options={styles}
            selected={style}
            onSelect={setStyle}
          />


          <OptionSection
            number="03"
            title="Weather"
            options={
              weatherOptions
            }
            selected={weather}
            onSelect={setWeather}
          />


          <section className="preference-section">

            <div className="section-heading">

              <div>

                <span className="section-number">
                  04
                </span>

                <h3>
                  Anything else?
                </h3>

              </div>


              <span className="optional">
                OPTIONAL
              </span>

            </div>


            <textarea
              value={preference}

              onChange={(event) =>
                setPreference(
                  event.target.value
                )
              }

              placeholder="Example: I want to look professional but not overdressed."
            />

          </section>


          <div className="page-actions">

            <button
              className="primary-button"

              onClick={
                getRecommendation
              }

              disabled={loading}
            >

              {loading
                ? 'AI is building your outfit...'
                : 'Find My Outfit →'
              }

            </button>

          </div>


          {loading && (

            <div className="loading-box">

              <div className="spinner"></div>

              <p>
                SmartCloset AI is analyzing
                your wardrobe...
              </p>

            </div>
          )}

        </main>

      </div>
    )
  }


  // ==================================================
  // RECOMMENDATION PAGE
  // ==================================================

  if (
    currentPage === 'recommendation'
    && recommendation
  ) {

    const selected =
      recommendation.selected_items || {}


    const displayedItems = [
      ['Top', selected.top],
      ['Bottom', selected.bottom],
      ['Shoes', selected.shoes],
      ['Jacket', selected.jacket],
      ['Accessory', selected.accessory]
    ].filter(
      ([, item]) => item !== null
    )


    return (

      <div className="app">

        <nav className="navbar">

          <div className="logo">
            SmartCloset
            <span>AI</span>
          </div>


          <div className="step-label">
            YOUR OUTFIT
          </div>

        </nav>


        <main className="recommendation-container">

          <div className="recommendation-header">

            <p className="eyebrow">
              SMARTCLOSET AI PICK
            </p>


            <h2>
              Your outfit is ready.
            </h2>


            <p>
              Built entirely from clothes
              you already own.
            </p>

          </div>


          <div className="score-card">

            <span>
              MATCH SCORE
            </span>

            <strong>
              {recommendation.score}
              <small>/100</small>
            </strong>

          </div>


          <div className="selected-outfit-grid">

            {displayedItems.map(
              ([label, item]) => {

                const preview =
                  getSelectedPreview(
                    item
                  )


                return (

                  <div
                    className="selected-item-card"
                    key={label}
                  >

                    <div className="selected-image">

                      {preview ? (

                        <img
                          src={preview}
                          alt={label}
                        />

                      ) : (

                        <div className="no-preview">
                          {label}
                        </div>
                      )}

                    </div>


                    <span className="selected-category">
                      {label}
                    </span>


                    <strong>
                      {item.filename}
                    </strong>

                  </div>
                )
              }
            )}

          </div>


          <div className="reason-card">

            <span className="reason-label">
              WHY IT WORKS
            </span>

            <p>
              {recommendation.reason}
            </p>

          </div>


          <div className="recommendation-actions">

            <button
              className="secondary-button"

              onClick={
                startAgain
              }
            >
              Build Another Outfit
            </button>


            <button
              className="primary-button"
              onClick={() =>
                alert(
                  'Perfect Corp virtual try-on is the next milestone!'
                )
              }
            >
              Try It On →
            </button>

          </div>

        </main>

      </div>
    )
  }


  return null
}


// ==================================================
// REUSABLE OPTION COMPONENT
// ==================================================

function OptionSection({
  number,
  title,
  options,
  selected,
  onSelect
}) {

  return (

    <section className="option-section">

      <div className="section-heading">

        <div>

          <span className="section-number">
            {number}
          </span>

          <h3>
            {title}
          </h3>

        </div>

      </div>


      <div className="option-grid">

        {options.map(
          (option) => (

            <button
              type="button"

              key={option}

              className={
                selected === option
                  ? 'option-button selected'
                  : 'option-button'
              }

              onClick={() =>
                onSelect(option)
              }
            >

              {option}

            </button>

          )
        )}

      </div>

    </section>
  )
}


export default App