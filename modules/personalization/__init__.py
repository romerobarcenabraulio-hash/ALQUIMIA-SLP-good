"""POLIS — Personalización municipal ALQUIMIA."""
from modules.personalization.coherence_validator import validate_coherence
from modules.personalization.cross_contamination import detect_cross_contamination
from modules.personalization.profile_loader import load_legal_framework, load_profile
from modules.personalization.template_instantiator import instantiate_template

__all__ = [
    "load_profile",
    "load_legal_framework",
    "detect_cross_contamination",
    "validate_coherence",
    "instantiate_template",
]
