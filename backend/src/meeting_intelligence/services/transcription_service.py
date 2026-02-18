"""
TranscriptionService — WhisperX wrapper.

WhisperX pipeline:
  1. load_model         → Whisper large-v2 (or chosen size)
  2. model.transcribe() → raw segments
  3. load_align_model   → language-specific aligner
  4. whisperx.align()   → word-level timestamps

The model is lazy-loaded on first use and cached for the lifetime of the
process so subsequent calls are fast.
"""

import os
from pathlib import Path
from typing import Optional

from backend.src.logger import get_backend_logger

logger = get_backend_logger(__name__)

# ---------------------------------------------------------------------------
# Ensure ffmpeg is on PATH.
# If the system ffmpeg is missing, fall back to the binary bundled with
# imageio-ffmpeg (installed as a Python package, no sudo required).
# ---------------------------------------------------------------------------
def _ensure_ffmpeg_on_path() -> None:
    import shutil
    if shutil.which("ffmpeg"):
        return  # already available

    try:
        import imageio_ffmpeg
        ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
        ffmpeg_dir = str(Path(ffmpeg_exe).parent)
        os.environ["PATH"] = ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")
        logger.info(f"ffmpeg not found in PATH — using imageio-ffmpeg bundle: {ffmpeg_exe}")
    except Exception as exc:
        logger.warning(f"Could not locate ffmpeg via imageio-ffmpeg: {exc}")

_ensure_ffmpeg_on_path()

# Whisper model sizes: tiny | base | small | medium | large-v2 | large-v3
DEFAULT_MODEL_SIZE = os.getenv("WHISPERX_MODEL_SIZE", "large-v2")
DEFAULT_DEVICE      = os.getenv("WHISPERX_DEVICE", "cpu")        # "cuda" for GPU
DEFAULT_COMPUTE     = os.getenv("WHISPERX_COMPUTE_TYPE", "int8") # "float16" on GPU


class TranscriptionService:
    """Stateful service that lazily loads the WhisperX model."""

    def __init__(
        self,
        model_size: str = DEFAULT_MODEL_SIZE,
        device: str = DEFAULT_DEVICE,
        compute_type: str = DEFAULT_COMPUTE,
    ):
        self.model_size   = model_size
        self.device       = device
        self.compute_type = compute_type

        self._whisper_model = None
        self._align_models: dict = {}  # language_code → (model_a, metadata)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def transcribe(self, audio_path: str, language: str = "fr") -> dict:
        """
        Transcribe an audio file with WhisperX.

        Returns:
            {
                "text":             str,          # full concatenated transcript
                "language":         str,
                "duration_seconds": float | None,
                "segments":         list[dict],   # WhisperX word-level segments
            }
        """
        try:
            import whisperx
        except ImportError:
            raise RuntimeError(
                "whisperx is not installed. Run: pip install whisperx"
            )

        audio_path = str(audio_path)
        if not Path(audio_path).exists():
            raise FileNotFoundError(f"Audio file not found: {audio_path}")

        logger.info(f"Loading audio: {audio_path}")
        audio = whisperx.load_audio(audio_path)

        # Duration (seconds) from array length / sample rate (16 000 Hz)
        try:
            duration_seconds = float(len(audio)) / 16_000
        except Exception:
            duration_seconds = None

        # --- Step 1: Transcription ---
        model = self._get_whisper_model(language)
        logger.info(f"Transcribing with WhisperX ({self.model_size} / {self.device})")
        result = model.transcribe(audio, batch_size=16, language=language)

        detected_language = result.get("language", language)

        # --- Step 2: Word-level alignment ---
        model_a, metadata = self._get_align_model(detected_language)
        logger.info("Aligning word timestamps")
        result = whisperx.align(
            result["segments"],
            model_a,
            metadata,
            audio,
            self.device,
            return_char_alignments=False,
        )

        segments = result.get("segments", [])
        full_text = " ".join(seg.get("text", "").strip() for seg in segments)

        return {
            "text":             full_text,
            "language":         detected_language,
            "duration_seconds": duration_seconds,
            "segments":         segments,
        }

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _get_whisper_model(self, language: Optional[str] = None):
        if self._whisper_model is None:
            import whisperx
            logger.info(
                f"Loading Whisper model '{self.model_size}' on {self.device} "
                f"(compute={self.compute_type})"
            )
            self._whisper_model = whisperx.load_model(
                self.model_size,
                self.device,
                compute_type=self.compute_type,
                language=language,
            )
        return self._whisper_model

    def _get_align_model(self, language_code: str):
        if language_code not in self._align_models:
            import whisperx
            logger.info(f"Loading alignment model for language '{language_code}'")
            model_a, metadata = whisperx.load_align_model(
                language_code=language_code,
                device=self.device,
            )
            self._align_models[language_code] = (model_a, metadata)
        return self._align_models[language_code]


# Module-level singleton — shared across requests within one worker
_transcription_service: Optional[TranscriptionService] = None


def get_transcription_service() -> TranscriptionService:
    global _transcription_service
    if _transcription_service is None:
        _transcription_service = TranscriptionService()
    return _transcription_service
