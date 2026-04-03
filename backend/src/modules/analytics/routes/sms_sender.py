from flask import Blueprint, request, jsonify
from backend.src.modules.analytics.logger import get_backend_logger
from backend.src.app.middlewares.access_security import require_auth, currentUserId
from backend.src.app.configs.environment import Config

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import SQLAlchemyError, IntegrityError

logger = get_backend_logger(__name__)
bp = Blueprint("sms_providers", __name__, url_prefix="/api/sms")

# Twilio
try:
    from twilio.rest import Client as TwilioClient
    twilio_client = TwilioClient(Config.TWILIO_SID, Config.TWILIO_AUTH_TOKEN)
    TWILIO_PHONE_NUMBER = Config.TWILIO_PHONE_NUMBER
except ImportError:
    logger.warning("Twilio package not installed.")


@bp.route("/twilio/send", methods=["POST"])
@require_auth
def send_sms_twilio():
    """Send SMS via Twilio"""
    try:
        data = request.json
        phone_numbers = data.get("phoneNumbers")
        message = data.get("message")

        if not phone_numbers or not isinstance(phone_numbers, list) or len(phone_numbers) == 0:
            raise BadRequest("Recipient list is empty", 400)
        if not message or message.strip() == "":
            raise BadRequest("Message is empty", 400)

        responses = []
        errors = []
        for to in phone_numbers:
            try:
                msg = twilio_client.messages.create(
                    body=message,
                    from_=TWILIO_PHONE_NUMBER,
                    to=to
                )
                responses.append(msg.sid)
            except Exception as e:
                logger.error(f"Twilio failed for {to}: {e}")
                errors.append({"phone": to, "error": str(e)})

        return jsonify({"status": 200, "data": responses, "errors": errors})
    except Exception as e:
        logger.error(f"Twilio route error: {e}")
        raise

# # Vonage / Nexmo
# try:
#     import vonage
# except ImportError:
#     logger.warning("Vonage package not installed.")

# @bp.route("/vonage/send", methods=["POST"])
# @require_auth
# def send_sms_vonage():
#     """Send SMS via Vonage (Nexmo)"""
#     try:
#         data = request.json
#         api_key = Config.VONAGE_API_KEY
#         api_secret = Config.VONAGE_API_SECRET
#         from_number = Config.VONAGE_NUMBER
#         to_number = data.get("to")
#         message = data.get("message")
#         client = vonage.Client(key=api_key, secret=api_secret)
#         sms = vonage.Sms(client)
#         response = sms.send_message({"from": from_number, "to": to_number, "text": message})
#         return jsonify({"status": 200, "data": response})
#     except Exception as e:
#         logger.error(f"Vonage route error: {e}")
#         raise BadRequest(str(e)}), 500

# # Plivo
# try:
#     import plivo
# except ImportError:
#     logger.warning("Plivo package not installed.")


# @bp.route("/plivo/send", methods=["POST"])
# @require_auth
# def send_sms_plivo():
#     """Send SMS via Plivo"""
#     try:
#         data = request.json
#         auth_id = Config.PLIVO_AUTH_ID
#         auth_token = Config.PLIVO_AUTH_TOKEN
#         client = plivo.RestClient(auth_id, auth_token)
#         from_number = data.get("from")
#         to_number = data.get("to")
#         message = data.get("message")
#         response = client.messages.create(src=from_number, dst=to_number, text=message)
#         return jsonify({"status": 200, "data": response})
#     except Exception as e:
#         logger.error(f"Plivo route error: {e}")
#         raise BadRequest(str(e)}), 500

# # Africa's Talking
# try:
#     import africastalking
# except ImportError:
#     logger.warning("Africa's Talking package not installed.")


# @bp.route("/africastalking/send", methods=["POST"])
# @require_auth
# def send_sms_africastalking():
#     """Send SMS via Africa's Talking"""
#     try:
#         data = request.json
#         username = Config.AFRICASTALKING_USERNAME
#         api_key = Config.AFRICASTALKING_API_KEY
#         africastalking.initialize(username, api_key)
#         sms = africastalking.SMS
#         to_number = data.get("to")
#         message = data.get("message")
#         from_number = data.get("from", None)
#         response = sms.send(message=message, to=to_number, from_=from_number)
#         return jsonify({"status": 200, "data": response})
#     except Exception as e:
#         logger.error(f"Africa's Talking route error: {e}")
#         raise BadRequest(str(e)}), 500

# # Textlocal
# try:
#     from textlocal import Textlocal
# except ImportError:
#     logger.warning("Textlocal package not installed.")


# @bp.route("/textlocal/send", methods=["POST"])
# @require_auth
# def send_sms_textlocal():
#     try:
#         data = request.json
#         api_key = Config.TEXTLOCAL_API_KEY
#         api = Textlocal(api_key)
#         to_number = data.get("to")
#         message = data.get("message")
#         sender = data.get("from")
#         response = api.send_message(numbers=to_number, message=message, sender=sender)
#         return jsonify({"status": 200, "data": response})
#     except Exception as e:
#         logger.error(f"Textlocal route error: {e}")
#         raise BadRequest(str(e)}), 500

# # Sendinblue
# try:
#     import sib_api_v3_sdk
#     from sib_api_v3_sdk.rest import ApiException
# except ImportError:
#     logger.warning("Sendinblue package not installed.")


# @bp.route("/sendinblue/send", methods=["POST"])
# @require_auth
# def send_sms_sendinblue():
#     try:
#         data = request.json
#         api_key = Config.SENDINBLUE_API_KEY
#         api_instance = sib_api_v3_sdk.TransactionalSMSApi()
#         sib_api_v3_sdk.configuration.api_key['api-key'] = api_key
#         sms_data = sib_api_v3_sdk.SendTransacSms(sender=data.get("from"),recipient=data.get("to"),content=data.get("message"))
#         response = api_instance.send_transac_sms(sms_data)
#         return jsonify({"status": 200, "data": response})
#     except ApiException as e:
#         logger.error(f"Sendinblue API error: {e}")
#         raise BadRequest(str(e)}), 500

# # Telesign
# try:
#     from telesign.messaging import MessagingClient
# except ImportError:
#     logger.warning("Telesign package not installed.")


# @bp.route("/telesign/send", methods=["POST"])
# @require_auth
# def send_sms_telesign():
#     try:
#         data = request.json
#         customer_id = Config.TELESIGN_CUSTOMER_ID
#         api_key = Config.TELESIGN_API_KEY
#         client = MessagingClient(customer_id, api_key)
#         response = client.message(phone_number=data.get("to"), message=data.get("message"), message_type="ARN")
#         return jsonify({"status": 200, "data": response})
#     except Exception as e:
#         logger.error(f"Telesign route error: {e}")
#         raise BadRequest(str(e)}), 500
