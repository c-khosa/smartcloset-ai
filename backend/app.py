from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)


@app.route("/")
def home():
    return jsonify({
        "message": "SmartCloset AI backend is running"
    })


@app.route("/recommend", methods=["POST"])
def recommend():
    data = request.get_json()

    occasion = data.get("occasion")
    style = data.get("style")
    weather = data.get("weather")
    preference = data.get("preference")

    recommendation = {
        "top": "White Button-Up Shirt",
        "bottom": "Navy Trousers",
        "shoes": "White Sneakers",
        "score": 94,
        "reason": (
            f"This outfit works well for a {occasion} because it matches "
            f"your {style} style while staying comfortable for {weather} weather."
        )
    }

    return jsonify(recommendation)


if __name__ == "__main__":
    app.run(debug=True, port=5000)