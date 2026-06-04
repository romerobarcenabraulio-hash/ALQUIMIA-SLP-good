"""Simple TF-IDF embeddings for document similarity (no external deps)."""

from __future__ import annotations

import json
import re
from collections import Counter
from typing import Optional

import logging

logger = logging.getLogger(__name__)


def _tokenize(text: str) -> list[str]:
    """Simple tokenization: lowercase, split on whitespace/punctuation."""
    text = text.lower()
    text = re.sub(r'[^\w\s]', ' ', text)
    tokens = text.split()
    # Remove common stop words
    stopwords = {
        'el', 'la', 'de', 'que', 'y', 'a', 'en', 'un', 'es', 'lo', 'se', 'no',
        'como', 'más', 'para', 'una', 'con', 'su', 'al', 'por', 'está',
        'o', 'tiene', 'del', 'este', 'los', 'las', 'son', 'fue', 'hay',
        'dos', 'tres', 'bien', 'muy', 'qué', 'donde', 'si', 'ahora',
        'the', 'and', 'a', 'of', 'to', 'in', 'is', 'that', 'it', 'for',
    }
    return [t for t in tokens if t and t not in stopwords and len(t) > 2]


def compute_tfidf_vector(text: str, corpus_idf: dict[str, float]) -> dict[str, float]:
    """Compute TF-IDF vector for a document.

    Args:
        text: Document text
        corpus_idf: Pre-computed IDF scores for all tokens in corpus

    Returns:
        dict of token -> tfidf score
    """
    tokens = _tokenize(text)
    term_freq = Counter(tokens)
    total_terms = sum(term_freq.values())

    tfidf = {}
    for token, count in term_freq.items():
        tf = count / total_terms if total_terms > 0 else 0
        idf = corpus_idf.get(token, 1.0)
        tfidf[token] = tf * idf

    return tfidf


def build_corpus_idf(documents: list[str], min_freq: int = 1) -> dict[str, float]:
    """Build IDF scores for a corpus of documents.

    Args:
        documents: List of document texts
        min_freq: Minimum number of documents a token must appear in

    Returns:
        dict of token -> idf score
    """
    import math

    doc_count = len(documents)
    if doc_count == 0:
        return {}

    # Count how many documents contain each token
    doc_freq = Counter()
    for doc in documents:
        tokens = set(_tokenize(doc))
        doc_freq.update(tokens)

    # Compute IDF = log(total_docs / docs_containing_token)
    idf = {}
    for token, freq in doc_freq.items():
        if freq >= min_freq:
            idf[token] = math.log(doc_count / freq)

    return idf


def cosine_similarity(vec1: dict[str, float], vec2: dict[str, float]) -> float:
    """Compute cosine similarity between two sparse vectors."""
    import math

    dot_product = sum(vec1.get(k, 0) * vec2.get(k, 0) for k in set(vec1) | set(vec2))
    mag1 = math.sqrt(sum(v * v for v in vec1.values())) or 1.0
    mag2 = math.sqrt(sum(v * v for v in vec2.values())) or 1.0

    return dot_product / (mag1 * mag2)


def encode_vector(vec: dict[str, float]) -> str:
    """Encode sparse vector to JSON string."""
    return json.dumps(vec)


def decode_vector(encoded: str) -> dict[str, float]:
    """Decode JSON string back to sparse vector."""
    try:
        return json.loads(encoded)
    except Exception as exc:
        logger.warning("decode_vector failed: %s", exc)
        return {}
