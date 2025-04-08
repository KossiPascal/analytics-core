import json
from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import os
from pyxform import xls2xform, xls2json

import subprocess

# Initialisation de l'application Flask
app = Flask(__name__)
CORS(app)  # Activation de CORS pour permettre l'accès depuis Angular

# Répertoires pour stocker les fichiers
UPLOAD_FOLDER = "uploads"
OUTPUT_FOLDER = "converted_forms"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(OUTPUT_FOLDER, exist_ok=True)

OUTPUT_FILE_NAME = "form_output.xml"
# OUTPUT_FILE_NAME = "pcimne_register.xml"
# OUTPUT_FILE_NAME = "newborn_followup.xml"
# OUTPUT_FILE_NAME = "newborn_register.xml"

JS_OUTPUT_FILE_NAME = 'output_file.json'


def convertFile(data):
    if data['pyxform'] == True:
        cmd = f"xls2xform {data['file_path']} {data['output_path']} --json {OUTPUT_FOLDER}/form.json"
        subprocess.run(cmd, shell=True, check=True)
        return
    elif data['subprocess'] == True:
        subprocess.run(["xls2xform", data['file_path'], data['output_path']], check=True)
        return
    else:
        xls2xform.xls2xform_convert(data['file_path'], data['output_path'])



# Fonction pour corriger les namespaces dans l'XML
def fix_xml_namespaces(xml_content: str) -> str:
    if "xmlns=" not in xml_content:  # Vérifie si le namespace est manquant
        xml_content = xml_content.replace(
            "<model>",
            '<model xmlns="http://www.w3.org/2002/xforms" '
            'xmlns:orx="http://openrosa.org/xforms" '
            'xmlns:xsd="http://www.w3.org/2001/XMLSchema" '
            'xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">'
        )
    return xml_content

@app.route("/convert", methods=["POST", "GET"])
def convert_xlsform():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400
    
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    # Spécifiez un fichier de sortie au lieu d'un répertoire
    output_path = os.path.join(OUTPUT_FOLDER, OUTPUT_FILE_NAME)

    try:
        # Conversion du fichier XLSForm en XML
        data = {
            'simple': False,
            'pyxform': False,
            'subprocess': True,
            'file_path': file_path,
            'output_path': output_path,
        }
        convertFile(data)
                
        # Lire le fichier XML généré
        with open(output_path, "r", encoding="utf-8") as f:
            xml_content = f.read()
        
        xml_content = fix_xml_namespaces(xml_content)

        return jsonify({"xml": xml_content})

    # except Exception as e:
    except subprocess.CalledProcessError as e:
        # Gestion des erreurs avec un message d'erreur approprié
        # return jsonify({"error": str(e)}), 500
        return jsonify({"error": f"Conversion failed: {str(e)}"}), 500



@app.route("/convertjs", methods=["POST", "GET"])
def convert_xls_to_json():
    file = request.files.get("file")
    if not file:
        return jsonify({"error": "No file uploaded"}), 400

    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    try:
        # Convert the XLSForm to JSON
        json_data = xls2json.parse_file_to_json(file_path)

        # Write the JSON output to a file
        output_path = os.path.join(OUTPUT_FOLDER, JS_OUTPUT_FILE_NAME)
        
        with open(output_path, 'w', encoding='utf-8') as json_file:
            json.dump(json_data, json_file, indent=4, ensure_ascii=False)

        return jsonify({"json": json_data})

    except Exception as e:
        return jsonify({"error": f"Conversion failed: {str(e)}"}), 500




# Serve the converted XML file
@app.route("/get_xml", methods=["GET"])
def get_xml():
    return send_file(os.path.join(OUTPUT_FOLDER, OUTPUT_FILE_NAME), mimetype="application/xml")



@app.route("/submit", methods=["POST"])
def submit_form():
    data = request.json.get("data")
    if not data:
        return jsonify({"error": "No data received"}), 400

    # Save responses (for demo, we save in a file)
    with open(os.path.join(OUTPUT_FOLDER, "responses.json"), "w") as f:
        f.write(data)

    return jsonify({"message": "Form submitted successfully"}), 200


if __name__ == "__main__":
    app.run(debug=True, port=5000)