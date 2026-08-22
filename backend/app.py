from flask import Flask, jsonify, request
from flask_cors import CORS

import os
import base64
import json

from dotenv import load_dotenv
from openai import OpenAI


# ==================================================
# ENVIRONMENT VARIABLES
# ==================================================

load_dotenv()

print(
    "OpenAI API key loaded:",
    bool(os.getenv("OPENAI_API_KEY"))
)


# ==================================================
# OPENAI CLIENT
# ==================================================

client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY"),
    timeout=120.0,
    max_retries=1
)


# ==================================================
# FLASK
# ==================================================

app = Flask(__name__)
CORS(app)


# ==================================================
# HELPER FUNCTION
# Convert uploaded file into image data URL
# ==================================================

def file_to_data_url(file):

    file_bytes = file.read()

    encoded = base64.b64encode(
        file_bytes
    ).decode("utf-8")

    mime_type = file.mimetype

    # Move file cursor back to beginning
    file.seek(0)

    return f"data:{mime_type};base64,{encoded}"


# ==================================================
# HOME TEST
# ==================================================

@app.route("/")
def home():

    return jsonify({
        "message": "SmartCloset AI backend is running"
    })


# ==================================================
# OPENAI CONNECTION TEST
# ==================================================

@app.route("/test-openai")
def test_openai():

    try:

        print("Testing OpenAI connection...")

        response = client.responses.create(
            model="gpt-5-mini",
            input="Reply with only: SmartCloset AI is connected"
        )

        return jsonify({
            "message": response.output_text
        })

    except Exception as e:

        print("OPENAI TEST ERROR:")
        print(e)

        return jsonify({
            "error": str(e)
        }), 500


# ==================================================
# AI OUTFIT RECOMMENDATION
# ==================================================

@app.route("/recommend", methods=["POST"])
def recommend():

    try:

        print("\n==============================")
        print("NEW RECOMMENDATION REQUEST")
        print("==============================")


        # ==================================================
        # 1. GET USER PREFERENCES
        # ==================================================

        occasion = request.form.get("occasion")
        style = request.form.get("style")
        weather = request.form.get("weather")
        preference = request.form.get("preference")


        print("Occasion:", occasion)
        print("Style:", style)
        print("Weather:", weather)
        print("Preference:", preference)


        # ==================================================
        # 2. GET FILES
        # ==================================================

        user_photo = request.files.get("userPhoto")

        clothes = request.files.getlist("clothes")


        if user_photo:
            print(
                "User photo:",
                user_photo.filename
            )


        print(
            "Number of clothing items:",
            len(clothes)
        )


        # ==================================================
        # 3. BASIC VALIDATION
        # ==================================================

        if not user_photo:

            return jsonify({
                "error": "Please upload a photo of yourself."
            }), 400


        if len(clothes) == 0:

            return jsonify({
                "error": "Please upload at least one clothing item."
            }), 400


        if not occasion:

            return jsonify({
                "error": "Please select an occasion."
            }), 400


        if not style:

            return jsonify({
                "error": "Please select a style."
            }), 400


        if not weather:

            return jsonify({
                "error": "Please select the weather."
            }), 400


        # ==================================================
        # 4. GET CLOTHING CATEGORIES
        # ==================================================

        clothing_categories_raw = request.form.get(
            "clothingCategories"
        )


        if not clothing_categories_raw:

            return jsonify({
                "error": "Clothing categories were not received."
            }), 400


        clothing_categories = json.loads(
            clothing_categories_raw
        )


        print(
            "Categories:",
            clothing_categories
        )


        if len(clothing_categories) != len(clothes):

            return jsonify({
                "error":
                "Number of categories does not match number of clothes."
            }), 400


        # ==================================================
        # 5. CREATE WARDROBE ITEMS
        # ==================================================

        wardrobe_items = []


        for index, clothing in enumerate(clothes):

            item_id = f"item_{index}"

            category = clothing_categories[
                index
            ]["category"]


            wardrobe_items.append({
                "id": item_id,
                "filename": clothing.filename,
                "category": category,
                "file": clothing
            })


        print("\nWARDROBE ITEMS:")


        for item in wardrobe_items:

            print(
                item["id"],
                "|",
                item["filename"],
                "|",
                item["category"]
            )


        # ==================================================
        # 6. BUILD AI INPUT
        # ==================================================

        ai_content = []


        ai_content.append({
            "type": "input_text",

            "text": f"""
You are SmartCloset AI, an expert personal fashion stylist.

Your task is to create the best outfit possible using ONLY
the clothing items uploaded by the user.

USER REQUIREMENTS

Occasion:
{occasion}

Desired style:
{style}

Weather:
{weather}

Additional personal preference:
{preference if preference else "None"}

IMPORTANT RULES

1. You may ONLY select clothing items shown in this request.
2. Never invent a clothing item.
3. Every clothing item has an ID such as item_0 or item_1.
4. Return those exact IDs.
5. Respect the category assigned by the user.
6. Consider color coordination.
7. Consider outfit formality.
8. Consider weather suitability.
9. Consider the user's desired style.
10. A jacket and accessory are optional.
11. If an appropriate category is unavailable, return null.
12. Give the final outfit a match score from 0 to 100.
13. Give a short useful explanation of why the outfit works.
"""
        })


        # ==================================================
        # 7. ADD CLOTHING IMAGES
        # ==================================================

        for item in wardrobe_items:

            ai_content.append({
                "type": "input_text",

                "text": (
                    f"\nWARDROBE ITEM\n"
                    f"ID: {item['id']}\n"
                    f"Filename: {item['filename']}\n"
                    f"Category: {item['category']}"
                )
            })


            ai_content.append({
                "type": "input_image",

                "image_url": file_to_data_url(
                    item["file"]
                ),

                "detail": "low"
            })


        # ==================================================
        # 8. SEND TO OPENAI
        # ==================================================

        print("\nSending wardrobe to OpenAI...")


        response = client.responses.create(

            model="gpt-5-mini",

            input=[
                {
                    "role": "user",
                    "content": ai_content
                }
            ],

            text={
                "format": {

                    "type": "json_schema",

                    "name":
                    "smartcloset_outfit_recommendation",

                    "strict": True,

                    "schema": {

                        "type": "object",

                        "properties": {

                            "top": {
                                "type": [
                                    "string",
                                    "null"
                                ]
                            },

                            "bottom": {
                                "type": [
                                    "string",
                                    "null"
                                ]
                            },

                            "shoes": {
                                "type": [
                                    "string",
                                    "null"
                                ]
                            },

                            "jacket": {
                                "type": [
                                    "string",
                                    "null"
                                ]
                            },

                            "accessory": {
                                "type": [
                                    "string",
                                    "null"
                                ]
                            },

                            "score": {
                                "type": "integer",
                                "minimum": 0,
                                "maximum": 100
                            },

                            "reason": {
                                "type": "string"
                            }
                        },

                        "required": [
                            "top",
                            "bottom",
                            "shoes",
                            "jacket",
                            "accessory",
                            "score",
                            "reason"
                        ],

                        "additionalProperties": False
                    }
                }
            }
        )


        # ==================================================
        # 9. READ AI RESPONSE
        # ==================================================

        ai_response = response.output_text


        print("\nAI RESPONSE:")
        print(ai_response)


        recommendation = json.loads(
            ai_response
        )


        # ==================================================
        # 10. VERIFY AI IDs
        # ==================================================

        valid_ids = {
            item["id"]
            for item in wardrobe_items
        }


        wardrobe_lookup = {
            item["id"]: item
            for item in wardrobe_items
        }


        selected_fields = [
            "top",
            "bottom",
            "shoes",
            "jacket",
            "accessory"
        ]


        for field in selected_fields:

            selected_id = recommendation.get(
                field
            )


            if (
                selected_id is not None
                and selected_id not in valid_ids
            ):

                print(
                    "AI returned invalid ID:",
                    selected_id
                )

                recommendation[field] = None


        # ==================================================
        # 11. ADD ITEM INFORMATION FOR REACT
        # ==================================================

        selected_items = {}


        for field in selected_fields:

            selected_id = recommendation.get(
                field
            )


            if selected_id is None:

                selected_items[field] = None


            else:

                item = wardrobe_lookup[
                    selected_id
                ]


                selected_items[field] = {

                    "id":
                    item["id"],

                    "filename":
                    item["filename"],

                    "category":
                    item["category"]
                }


        recommendation[
            "selected_items"
        ] = selected_items


        # ==================================================
        # 12. FINAL RESPONSE
        # ==================================================

        print("\nVALIDATED RECOMMENDATION:")

        print(
            json.dumps(
                recommendation,
                indent=2
            )
        )


        return jsonify(
            recommendation
        )


    # ==================================================
    # ERROR HANDLING
    # ==================================================

    except Exception as e:

        print("\nERROR:")
        print(e)


        return jsonify({
            "error": str(e)
        }), 500


# ==================================================
# START SERVER
# ==================================================

if __name__ == "__main__":

    app.run(
        debug=True,
        port=5000
    )