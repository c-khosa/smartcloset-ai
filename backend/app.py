import os
import time
import json
import requests

from flask import Flask, jsonify, request
from flask_cors import CORS
from dotenv import load_dotenv
from openai import OpenAI


# =========================================================
# LOAD ENVIRONMENT VARIABLES
# =========================================================

load_dotenv()

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
PERFECTCORP_API_KEY = os.getenv("PERFECTCORP_API_KEY")

PERFECTCORP_BASE_URL = "https://yce-api-01.makeupar.com"


# =========================================================
# CREATE FLASK APP
# =========================================================

app = Flask(__name__)
CORS(app)


# =========================================================
# CREATE OPENAI CLIENT
# =========================================================

client = None

if OPENAI_API_KEY:
    client = OpenAI(api_key=OPENAI_API_KEY)


# =========================================================
# HOME ROUTE
# =========================================================

@app.route("/")
def home():
    return jsonify({
        "message": "SmartCloset AI backend is running"
    })


# =========================================================
# TEST OPENAI CONNECTION
# =========================================================

@app.route("/test-openai")
def test_openai():
    try:
        if not OPENAI_API_KEY:
            return jsonify({
                "error": "OPENAI_API_KEY is missing"
            }), 500

        response = client.responses.create(
            model="gpt-5-mini",
            input="Reply with exactly: SmartCloset AI is connected"
        )

        return jsonify({
            "message": response.output_text
        })

    except Exception as error:
        print("OpenAI test error:", error)

        return jsonify({
            "error": str(error)
        }), 500


# =========================================================
# PERFECT CORP HELPER:
# REQUEST UPLOAD URL + UPLOAD FILE
# =========================================================

def upload_file_to_perfectcorp(file):
    if not PERFECTCORP_API_KEY:
        raise Exception("PERFECTCORP_API_KEY is missing")

    content_type = file.content_type or "image/jpeg"

    # Find file size
    file.seek(0, 2)
    file_size = file.tell()
    file.seek(0)

    headers = {
        "Authorization": f"Bearer {PERFECTCORP_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "files": [
            {
                "content_type": content_type,
                "file_name": file.filename,
                "file_size": file_size
            }
        ]
    }

    print("Requesting Perfect Corp upload URL...")

    response = requests.post(
        f"{PERFECTCORP_BASE_URL}/s2s/v2.0/file",
        headers=headers,
        json=payload,
        timeout=30
    )

    if not response.ok:
        print("Perfect Corp file request error:")
        print(response.status_code)
        print(response.text)

    response.raise_for_status()

    data = response.json()

    file_data = data["data"]["files"][0]

    file_id = file_data["file_id"]

    upload_request = file_data["requests"][0]

    upload_url = upload_request["url"]

    upload_headers = upload_request.get("headers", {})

    print("Uploading image to Perfect Corp...")

    file.seek(0)

    upload_response = requests.put(
        upload_url,
        headers=upload_headers,
        data=file.read(),
        timeout=60
    )

    if not upload_response.ok:
        print("Perfect Corp actual upload error:")
        print(upload_response.status_code)
        print(upload_response.text)

    upload_response.raise_for_status()

    print("Upload successful. File ID:", file_id)

    return file_id


# =========================================================
# PERFECT CORP HELPER:
# CREATE VIRTUAL TRY-ON TASK
# =========================================================

def create_tryon_task(
    user_file_id,
    clothing_file_id,
    garment_category="upper_body"
):
    if not PERFECTCORP_API_KEY:
        raise Exception("PERFECTCORP_API_KEY is missing")

    headers = {
        "Authorization": f"Bearer {PERFECTCORP_API_KEY}",
        "Content-Type": "application/json"
    }

    payload = {
        "src_file_id": user_file_id,
        "ref_file_id": clothing_file_id,
        "garment_category": garment_category
    }

    print("Creating Perfect Corp try-on task...")
    print("Garment category:", garment_category)

    response = requests.post(
        f"{PERFECTCORP_BASE_URL}/s2s/v2.0/task/cloth-v4",
        headers=headers,
        json=payload,
        timeout=30
    )

    if not response.ok:
        print("Perfect Corp create task error:")
        print(response.status_code)
        print(response.text)

    response.raise_for_status()

    data = response.json()

    task_id = data["data"]["task_id"]

    print("Perfect Corp task created:", task_id)

    return task_id


# =========================================================
# PERFECT CORP HELPER:
# WAIT FOR RESULT
# =========================================================

def wait_for_tryon_result(task_id):
    headers = {
        "Authorization": f"Bearer {PERFECTCORP_API_KEY}"
    }

    # Check every 2 seconds
    # Maximum about 60 seconds
    for attempt in range(30):
        print(
            f"Checking Perfect Corp task "
            f"{attempt + 1}/30..."
        )

        response = requests.get(
            (
                f"{PERFECTCORP_BASE_URL}"
                f"/s2s/v2.0/task/cloth-v4/{task_id}"
            ),
            headers=headers,
            timeout=30
        )

        if not response.ok:
            print("Perfect Corp task status error:")
            print(response.status_code)
            print(response.text)

        response.raise_for_status()

        data = response.json()

        print("Perfect Corp status response:")
        print(data)

        task_data = data.get("data", {})

        status = task_data.get("task_status")

        print("Task status:", status)

        if status == "success":
            results = task_data.get("results", {})

            result_url = results.get("url")

            if not result_url:
                raise Exception(
                    "Perfect Corp succeeded but no result URL was returned"
                )

            return result_url

        if status in ["failed", "error"]:
            raise Exception(
                f"Perfect Corp task failed: {data}"
            )

        time.sleep(2)

    raise Exception(
        "Perfect Corp try-on task timed out"
    )


# =========================================================
# AI OUTFIT RECOMMENDATION
# =========================================================

@app.route("/recommend", methods=["POST"])
def recommend():
    try:
        print("\n========================================")
        print("NEW SMARTCLOSET RECOMMENDATION REQUEST")
        print("========================================")

        occasion = request.form.get("occasion", "")
        style = request.form.get("style", "")
        weather = request.form.get("weather", "")
        preference = request.form.get("preference", "")

        user_photo = request.files.get("userPhoto")

        clothes = request.files.getlist("clothes")

        clothing_categories_raw = request.form.get(
            "clothingCategories",
            "[]"
        )

        try:
            clothing_categories = json.loads(
                clothing_categories_raw
            )
        except json.JSONDecodeError:
            clothing_categories = []

        print("Occasion:", occasion)
        print("Style:", style)
        print("Weather:", weather)
        print("Preference:", preference)

        if user_photo:
            print(
                "User photo:",
                user_photo.filename
            )

        print(
            "Number of clothing images:",
            len(clothes)
        )

        # Build wardrobe item list
        wardrobe_items = []

        for index, clothing_file in enumerate(clothes):
            item_id = f"item_{index}"

            category = "Unknown"

            if index < len(clothing_categories):
                category = clothing_categories[index].get(
                    "category",
                    "Unknown"
                )

            wardrobe_items.append({
                "id": item_id,
                "filename": clothing_file.filename,
                "category": category
            })

            print(
                item_id,
                "|",
                clothing_file.filename,
                "|",
                category
            )

        # -------------------------------------------------
        # TEMPORARY / SAFE RECOMMENDATION LOGIC
        # -------------------------------------------------
        #
        # This selects the first uploaded item from each
        # category.
        #
        # You can replace this with your full image-aware
        # OpenAI recommendation later.
        # -------------------------------------------------

        selected_top = None
        selected_bottom = None
        selected_shoes = None
        selected_jacket = None
        selected_accessory = None

        for item in wardrobe_items:
            category = item["category"].lower()

            if category == "top" and selected_top is None:
                selected_top = item["id"]

            elif (
                category == "bottom"
                and selected_bottom is None
            ):
                selected_bottom = item["id"]

            elif (
                category == "shoes"
                and selected_shoes is None
            ):
                selected_shoes = item["id"]

            elif (
                category == "jacket"
                and selected_jacket is None
            ):
                selected_jacket = item["id"]

            elif (
                category == "accessory"
                and selected_accessory is None
            ):
                selected_accessory = item["id"]

        recommendation = {
            "top": selected_top,
            "bottom": selected_bottom,
            "shoes": selected_shoes,
            "jacket": selected_jacket,
            "accessory": selected_accessory,
            "score": 92,
            "reason": (
                f"This outfit was selected for your "
                f"{occasion or 'occasion'} with a "
                f"{style or 'balanced'} style"
                + (
                    f" and {weather} weather."
                    if weather
                    else "."
                )
            ),
            "wardrobe": wardrobe_items
        }

        print("Recommendation:")
        print(recommendation)

        return jsonify(recommendation)

    except Exception as error:
        print("Recommendation error:", error)

        return jsonify({
            "error": str(error)
        }), 500


# =========================================================
# PERFECT CORP VIRTUAL TRY-ON ENDPOINT
# =========================================================

@app.route("/try-on", methods=["POST"])
def try_on():
    try:
        print("\n========================================")
        print("NEW PERFECT CORP TRY-ON REQUEST")
        print("========================================")

        if not PERFECTCORP_API_KEY:
            return jsonify({
                "error": (
                    "PERFECTCORP_API_KEY is missing "
                    "from backend/.env"
                )
            }), 500

        user_photo = request.files.get(
            "userPhoto"
        )

        clothing_photo = request.files.get(
            "clothingPhoto"
        )

        garment_category = request.form.get(
            "garmentCategory",
            "upper_body"
        )

        if not user_photo:
            return jsonify({
                "error": "User photo is required"
            }), 400

        if not clothing_photo:
            return jsonify({
                "error": "Clothing photo is required"
            }), 400

        print(
            "User image:",
            user_photo.filename
        )

        print(
            "Clothing image:",
            clothing_photo.filename
        )

        # 1. Upload user photo
        print("\nSTEP 1: Uploading user photo")

        user_file_id = upload_file_to_perfectcorp(
            user_photo
        )

        # 2. Upload clothing image
        print("\nSTEP 2: Uploading clothing image")

        clothing_file_id = upload_file_to_perfectcorp(
            clothing_photo
        )

        # 3. Create virtual try-on task
        print("\nSTEP 3: Creating try-on task")

        task_id = create_tryon_task(
            user_file_id,
            clothing_file_id,
            garment_category
        )

        # 4. Wait for generated image
        print("\nSTEP 4: Waiting for result")

        result_url = wait_for_tryon_result(
            task_id
        )

        print("\nTRY-ON COMPLETE")
        print("Result URL:", result_url)

        return jsonify({
            "success": True,
            "task_id": task_id,
            "result_url": result_url
        })

    except requests.exceptions.HTTPError as error:
        print("\nPerfect Corp HTTP error:")
        print(error)

        details = str(error)

        if error.response is not None:
            print(
                "Status:",
                error.response.status_code
            )

            print(
                "Response:",
                error.response.text
            )

            details = error.response.text

        return jsonify({
            "error": "Perfect Corp API request failed",
            "details": details
        }), 500

    except requests.exceptions.RequestException as error:
        print(
            "Perfect Corp network error:",
            error
        )

        return jsonify({
            "error": "Could not connect to Perfect Corp",
            "details": str(error)
        }), 500

    except Exception as error:
        print("Try-on error:", error)

        return jsonify({
            "error": str(error)
        }), 500


# =========================================================
# RUN FLASK
# =========================================================

if __name__ == "__main__":
    print("\n========================================")
    print("SmartCloset AI")
    print("========================================")

    print(
        "OpenAI API key loaded:",
        bool(OPENAI_API_KEY)
    )

    print(
        "Perfect Corp API key loaded:",
        bool(PERFECTCORP_API_KEY)
    )

    print("Backend starting...\n")

    app.run(
        debug=True,
        port=5000
    )