from flask import Flask, render_template, request, jsonify
from characterai import sendCode, authUser

app = Flask(__name__)


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/send_code", methods=["POST"])
def send_code():
    email = request.json.get("email")
    if not email:
        return jsonify({"error": "Email is required"}), 400

    code = sendCode(email)
    return jsonify({"code": code})


@app.route("/generate_token", methods=["POST"])
def generate_token():
    link = request.json.get("link")
    email = request.json.get("email")
    if not link or not email:
        return jsonify({"error": "Link and email are required"}), 400

    token = authUser(link, email)
    return jsonify({"token": token})


if __name__ == "__main__":
    app.run(debug=True, host="0.0.0.0")
