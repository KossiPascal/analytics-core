"""
Generic PDF generator — WeasyPrint + Jinja2.

Usage example (in a Flask route):
    from backend.src.docs_generetor.pdf_generator import pdf_response

    return pdf_response(
        template_name="fiche_reception",
        context={"equipment": eq, "employee": emp, "date": "17/02/2026"},
        filename="fiche_reception_123456.pdf",
    )
"""
from pathlib import Path
from flask import Response
from jinja2 import Environment, FileSystemLoader

DOCS_DIR = Path(__file__).parent
IMG_DIR = DOCS_DIR / "img"
HTML_DIR = DOCS_DIR / "html"


def _jinja_env() -> Environment:
    return Environment(loader=FileSystemLoader(str(HTML_DIR)), autoescape=True)


def generate_pdf(template_name: str, context: dict) -> bytes:
    """
    Render ``html/<template_name>.html`` with *context* and return PDF bytes.
    The matching ``html/<template_name>.css`` is automatically loaded if present.
    The ``html/`` directory is used as base_url so relative asset paths resolve correctly.
    """
    from weasyprint import HTML, CSS  # lazy import – weasyprint is heavy

    html_content = _jinja_env().get_template(f"{template_name}.html").render(**context)

    stylesheets = []
    css_path = HTML_DIR / f"{template_name}.css"
    if css_path.exists():
        stylesheets.append(CSS(filename=str(css_path)))

    return HTML(string=html_content, base_url=str(HTML_DIR)).write_pdf(
        stylesheets=stylesheets
    )


def pdf_response(template_name: str, context: dict, filename: str = "document.pdf") -> Response:
    """Generate a PDF and return a Flask download Response."""
    pdf_bytes = generate_pdf(template_name, context)
    return Response(
        pdf_bytes,
        mimetype="application/pdf",
        headers={
            "Content-Disposition": f'attachment; filename="{filename}"',
            "Content-Length": str(len(pdf_bytes)),
        },
    )
