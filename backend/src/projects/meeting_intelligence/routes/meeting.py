"""
Meeting Intelligence — Flask Blueprint.

Endpoints
---------
GET    /api/meetings/providers                        → Providers disponibles (Gemini / Groq / Ollama)
GET    /api/meetings                                  → Liste des réunions
POST   /api/meetings                                  → Créer une réunion
GET    /api/meetings/<id>                             → Détail d'une réunion
DELETE /api/meetings/<id>                             → Supprimer une réunion

POST   /api/meetings/<id>/transcribe                  → Upload audio + transcription WhisperX
GET    /api/meetings/<id>/transcription               → Récupérer la transcription

POST   /api/meetings/<id>/summarize                   → Résumé IA (choix du provider)
GET    /api/meetings/<id>/summary                     → Récupérer le dernier résumé
GET    /api/meetings/<id>/summaries                   → Tous les résumés (historique providers)
PUT    /api/meetings/<id>/summaries/<summary_id>      → Mettre à jour un résumé (édition)
GET    /api/meetings/<id>/pdf                         → Générer et télécharger le rapport PDF
"""

import os
import uuid
import threading
from datetime import datetime, timezone
from pathlib import Path
from flask import Blueprint, request, jsonify, g, current_app
from werkzeug.utils import secure_filename
from backend.src.app.configs.extensions import db
from backend.src.app.middlewares.access_security import require_auth, currentUserId
from backend.src.projects.meeting_intelligence.models.meeting import Meeting, MeetingSummary
from backend.src.projects.meeting_intelligence.services.summarization_service import get_summarization_service, SUPPORTED_PROVIDERS

from werkzeug.exceptions import BadRequest
from sqlalchemy.exc import IntegrityError

from backend.src.projects.analytics_manager.logger import get_backend_logger
from backend.src.projects.templates.docs_generetor.pdf_generator import IMG_DIR, pdf_response

logger = get_backend_logger(__name__)

bp = Blueprint("meeting_intelligence", __name__, url_prefix="/api/meetings")

# Audio formats accepted by WhisperX
ALLOWED_AUDIO_EXTENSIONS = {
    ".mp3", ".mp4", ".wav", ".m4a", ".ogg", ".flac", ".webm", ".aac",
}


def _uploads_dir() -> Path:
    """Returns (and creates if needed) the audio upload directory."""
    from backend.src.app.configs.environment import Config
    uploads = Config.PUBLIC_DIR / "uploads" / "meetings"
    uploads.mkdir(parents=True, exist_ok=True)
    return uploads


def _is_allowed_audio(filename: str) -> bool:
    return Path(filename).suffix.lower() in ALLOWED_AUDIO_EXTENSIONS


# ---------------------------------------------------------------------------
# Providers
# ---------------------------------------------------------------------------

@bp.get("/providers")
@require_auth
def list_providers():
    """Retourne les providers AI disponibles et leur statut de configuration."""
    service = get_summarization_service()
    return jsonify(service.available_providers()), 200


# ---------------------------------------------------------------------------
# Meetings — CRUD
# ---------------------------------------------------------------------------

@bp.get("")
@require_auth
def list_meetings():
    meetings = Meeting.query.order_by(Meeting.created_at.desc()).all()
    return jsonify([m.to_dict_safe() for m in meetings]), 200


@bp.post("")
@require_auth
def create_meeting():
    data = request.get_json(silent=True) or {}

    title = data.get("title", "").strip()
    if not title:
        raise BadRequest("title est requis", 400)

    user_id = currentUserId()

    meeting_date = None
    if data.get("meeting_date"):
        try:
            meeting_date = datetime.fromisoformat(data["meeting_date"])
        except ValueError:
            raise BadRequest("Format de meeting_date invalide (ISO 8601 attendu)", 400)

    meeting = Meeting(
        title=title,
        description=data.get("description", ""),
        meeting_date=meeting_date,
        created_by_id=user_id,
    )
    db.session.add(meeting)
    db.session.commit()
    return jsonify(meeting.to_dict_safe()), 201


@bp.get("/<int:meeting_id>")
@require_auth
def get_meeting(meeting_id: int):
    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        raise BadRequest("Réunion introuvable", 404)

    result = meeting.to_dict_safe()

    # Latest transcription (lightweight)
    if meeting.transcriptions:
        latest_t = sorted(meeting.transcriptions, key=lambda t: t.created_at)[-1]
        result["transcription"] = latest_t.to_dict_safe()

    # Latest summary (lightweight)
    if meeting.summaries:
        latest_s = sorted(meeting.summaries, key=lambda s: s.created_at)[-1]
        result["summary"] = latest_s.to_dict_safe()

    return jsonify(result), 200


@bp.delete("/<int:meeting_id>")
@require_auth
def delete_meeting(meeting_id: int):
    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        raise BadRequest("Réunion introuvable", 404)

    db.session.delete(meeting)
    db.session.commit()
    return jsonify({"message": "Réunion supprimée"}), 200


# ---------------------------------------------------------------------------
# Transcription — WhisperX
# ---------------------------------------------------------------------------

@bp.post("/<int:meeting_id>/transcribe")
@require_auth
def transcribe_meeting(meeting_id: int):
    """
    Multipart upload + WhisperX transcription.

    Form fields:
        audio    (file, required)  — audio file
        language (str, optional)   — ISO code, default "fr"
    """
    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        raise BadRequest("Réunion introuvable", 404)

    if "audio" not in request.files:
        raise BadRequest("Champ 'audio' manquant dans le formulaire", 400)

    audio_file = request.files["audio"]
    if not audio_file.filename:
        raise BadRequest("Aucun fichier sélectionné", 400)

    if not _is_allowed_audio(audio_file.filename):
        raise BadRequest(
            f"Format audio non supporté. Formats acceptés : "
            f"{', '.join(ALLOWED_AUDIO_EXTENSIONS)}",
            415,
        )

    language = request.form.get("language", "fr").strip() or "fr"

    # Save audio to disk
    safe_name   = secure_filename(audio_file.filename)
    unique_name = f"{uuid.uuid4().hex}_{safe_name}"
    save_path   = _uploads_dir() / unique_name

    audio_file.save(str(save_path))
    logger.info(f"Audio saved: {save_path}")

    # Mark as TRANSCRIBING and return immediately — WhisperX runs in background
    meeting.status = "TRANSCRIBING"
    db.session.commit()

    app = current_app._get_current_object()  # real app ref for the thread
    t = threading.Thread(
        target=_bg_transcribe,
        args=(app, meeting_id, str(save_path), unique_name, language),
        daemon=True,
    )
    t.start()

    logger.info(f"Transcription started in background — meeting_id={meeting_id}")
    return jsonify({"status": "TRANSCRIBING", "meeting_id": meeting_id}), 202


def _bg_transcribe(app, meeting_id: int, audio_path: str, audio_filename: str, language: str):
    """Background thread: runs WhisperX and persists result."""
    with app.app_context():
        from backend.src.app.configs.extensions import db as _db
        from backend.src.projects.meeting_intelligence.models.meeting import (
            Meeting as _Meeting, MeetingTranscription as _Transcription,
        )
        from backend.src.projects.meeting_intelligence.services.transcription_service import (
            get_transcription_service,
        )
        meeting = _Meeting.query.get(meeting_id)
        if not meeting:
            return
        try:
            svc    = get_transcription_service()
            result = svc.transcribe(audio_path, language=language)

            transcription = _Transcription(
                meeting_id=meeting_id,
                audio_filename=audio_filename,
                transcription_text=result["text"],
                language=result["language"],
                duration_seconds=result.get("duration_seconds"),
                word_segments=result.get("segments"),
            )
            _db.session.add(transcription)
            meeting.status = "TRANSCRIBED"   # ready for AI summarization
            _db.session.commit()
            logger.info(f"Background transcription OK — meeting_id={meeting_id}")
        except Exception as exc:
            meeting.status = "FAILED"
            _db.session.commit()
            logger.error(f"Background transcription failed — meeting_id={meeting_id}: {exc}", exc_info=True)


@bp.get("/<int:meeting_id>/transcription")
@require_auth
def get_transcription(meeting_id: int):
    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        raise BadRequest("Réunion introuvable", 404)

    if not meeting.transcriptions:
        raise BadRequest("Aucune transcription disponible", 404)

    latest = sorted(meeting.transcriptions, key=lambda t: t.created_at)[-1]
    return jsonify(latest.to_dict_safe()), 200


@bp.get("/<int:meeting_id>/status")
@require_auth
def get_status(meeting_id: int):
    """
    Endpoint de polling : retourne le statut courant de la réunion.
    Utilisé par le frontend pour savoir quand la transcription en background est terminée.
    """
    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        raise BadRequest("Réunion introuvable", 404)

    return jsonify({
        "id":               meeting.id,
        "status":           meeting.status,
        "has_transcription": bool(meeting.transcriptions),
        "has_summary":       bool(meeting.summaries),
    }), 200


# ---------------------------------------------------------------------------
# Summarization — Gemini / Groq / Ollama
# ---------------------------------------------------------------------------

@bp.post("/<int:meeting_id>/summarize")
@require_auth
def summarize_meeting(meeting_id: int):
    """
    Génère un résumé structuré de la réunion.

    Body JSON:
        provider   (str, required)  — "gemini" | "groq" | "ollama"
        model      (str, optional)  — override du modèle par défaut
        transcription_text (str, optional) — si non fourni, utilise la dernière transcription DB
    """
    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        raise BadRequest("Réunion introuvable", 404)

    data     = request.get_json(silent=True) or {}
    provider = data.get("provider", "").strip().lower()
    if not provider:
        raise BadRequest(
            f"Le champ 'provider' est requis. Valeurs acceptées : {SUPPORTED_PROVIDERS}", 400
        )
    if provider not in SUPPORTED_PROVIDERS:
        raise BadRequest(
            f"Provider '{provider}' invalide. Valeurs acceptées : {SUPPORTED_PROVIDERS}", 400
        )

    model_name = data.get("model") or None

    # Resolve transcription text
    transcription_text = data.get("transcription_text", "").strip()
    if not transcription_text:
        if not meeting.transcriptions:
            raise BadRequest(
                "Aucune transcription trouvée. Transcris d'abord le fichier audio "
                "via POST /api/meetings/<id>/transcribe",
                400,
            )
        latest_t           = sorted(meeting.transcriptions, key=lambda t: t.created_at)[-1]
        transcription_text = latest_t.transcription_text or ""

    if not transcription_text:
        raise BadRequest("La transcription est vide, impossible de résumer", 400)

    # Update meeting status
    meeting.status = "SUMMARIZING"
    db.session.commit()

    try:
        svc        = get_summarization_service()
        summary_data = svc.summarize(
            transcription=transcription_text,
            provider=provider,
            model_name=model_name,
        )

        used_model = model_name or {
            "gemini": "gemini-1.5-flash",
            "groq":   "llama-3.3-70b-versatile",
            "ollama": "mistral",
        }[provider]

        summary = MeetingSummary(
            meeting_id=meeting.id,
            provider=provider.upper(),
            model_used=used_model,
            titre=summary_data.get("titre"),
            ordre_du_jour=summary_data.get("ordre_du_jour"),
            discussions=summary_data.get("discussions"),
            prochaines_etapes=summary_data.get("prochaines_etapes"),
            recommandations=summary_data.get("recommandations"),
            participants=summary_data.get("participants", []),
            raw_json=summary_data,
        )
        db.session.add(summary)

        meeting.status = "DONE"
        db.session.commit()

        logger.info(f"Summary OK — meeting_id={meeting.id}, provider={provider}")
        return jsonify(summary.to_dict_safe()), 201

    except Exception as exc:
        meeting.status = "FAILED"
        db.session.commit()
        logger.error(f"Summarization failed for meeting {meeting_id}: {exc}", exc_info=True)
        raise BadRequest(f"Échec du résumé : {str(exc)}", 500)


@bp.get("/<int:meeting_id>/summary")
@require_auth
def get_latest_summary(meeting_id: int):
    """Retourne le dernier résumé généré (peu importe le provider)."""
    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        raise BadRequest("Réunion introuvable", 404)

    if not meeting.summaries:
        raise BadRequest("Aucun résumé disponible", 404)

    latest = sorted(meeting.summaries, key=lambda s: s.created_at)[-1]
    return jsonify(latest.to_dict_safe()), 200


@bp.get("/<int:meeting_id>/summaries")
@require_auth
def list_summaries(meeting_id: int):
    """Retourne l'historique complet de tous les résumés (multi-providers)."""
    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        raise BadRequest("Réunion introuvable", 404)

    summaries = sorted(meeting.summaries, key=lambda s: s.created_at, reverse=True)
    return jsonify([s.to_dict_safe() for s in summaries]), 200


# ---------------------------------------------------------------------------
# Summary update — allows the user to edit the AI-generated report
# ---------------------------------------------------------------------------

@bp.put("/<int:meeting_id>/summaries/<int:summary_id>")
@require_auth
def update_summary(meeting_id: int, summary_id: int):
    """
    Met à jour les champs d'un résumé existant (après édition utilisateur).

    Body JSON:
        titre, ordre_du_jour, discussions, prochaines_etapes,
        recommandations, participants
    """
    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        raise BadRequest("Réunion introuvable", 404)

    summary = MeetingSummary.query.get(summary_id)
    if not summary or summary.meeting_id != meeting_id:
        raise BadRequest("Résumé introuvable", 404)

    data = request.get_json(silent=True) or {}

    editable_fields = (
        "titre", "ordre_du_jour", "discussions",
        "prochaines_etapes", "recommandations",
    )
    for field in editable_fields:
        if field in data:
            setattr(summary, field, data[field])

    if "participants" in data:
        participants = data["participants"]
        if isinstance(participants, str):
            participants = [p.strip() for p in participants.split("\n") if p.strip()]
        summary.participants = participants

    db.session.commit()
    return jsonify(summary.to_dict_safe()), 200


# ---------------------------------------------------------------------------
# PDF generation — WeasyPrint report
# ---------------------------------------------------------------------------

@bp.get("/<int:meeting_id>/pdf")
@require_auth
def download_pdf(meeting_id: int):
    """Génère et télécharge le rapport de réunion en PDF (WeasyPrint)."""
    from base64 import b64encode
    from pathlib import Path

    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        raise BadRequest("Réunion introuvable", 404)

    if not meeting.summaries:
        raise BadRequest(
            "Aucun résumé disponible. Génère d'abord un résumé IA.", 400
        )

    summary = sorted(meeting.summaries, key=lambda s: s.created_at)[-1]
    transcription = (
        sorted(meeting.transcriptions, key=lambda t: t.created_at)[-1]
        if meeting.transcriptions else None
    )

    # Logo as data URI (embedded for WeasyPrint offline rendering)
    logo_path = IMG_DIR / "Logo_Integrate_Health.png"
    logo_uri = ""
    if logo_path.exists():
        b64 = b64encode(logo_path.read_bytes()).decode()
        logo_uri = f"data:image/png;base64,{b64}"

    # Duration formatting
    duration = "—"
    if transcription and transcription.duration_seconds:
        mins = int(transcription.duration_seconds // 60)
        secs = int(transcription.duration_seconds % 60)
        duration = f"{mins}min {secs:02d}s" if mins else f"{secs}s"

    # Meeting date formatting
    meeting_date = "—"
    if meeting.meeting_date:
        meeting_date = meeting.meeting_date.strftime("%d/%m/%Y")
    elif meeting.created_at:
        meeting_date = meeting.created_at.strftime("%d/%m/%Y")

    from datetime import datetime
    generated_at = datetime.now().strftime("%d/%m/%Y %H:%M")

    provider_labels = {
        "GEMINI": "Google Gemini Flash",
        "GROQ":   "Groq (Llama 3.3)",
        "OLLAMA": "Ollama (local)",
    }

    context = {
        "logo_uri":        logo_uri,
        "meeting_id":      meeting_id,
        "titre":           summary.titre or meeting.title,
        "meeting_date":    meeting_date,
        "duration":        duration,
        "ai_provider":     provider_labels.get(summary.provider, summary.provider),
        "generated_at":    generated_at,
        "ordre_du_jour":   summary.ordre_du_jour or "—",
        "discussions":     summary.discussions or "—",
        "prochaines_etapes": summary.prochaines_etapes or "—",
        "recommandations": summary.recommandations or "",
        "participants":    summary.participants or [],
    }

    filename = f"rapport_reunion_{meeting_id}.pdf"
    return pdf_response("rapport_reunion", context, filename=filename)
