"""
AESTHETE-1 · ALQUIMIA — Generación de diagramas institucionales
Reemplaza las imágenes vetadas del CAPITULO SAN LUIS POTOSÍ.docx

Imágenes a generar:
  image2.png — D3: 5 fracciones con colores reales
  image5.png — D4: Árbol decisión Modelo A/B (sin texto de borrador)
  image6.png — D11: Swimlane sistema digital (limpio)
  image7.png — Composición RSU: barras horizontales (reemplaza pie chart)
  image9.png — D10: Cadena de custodia (reconstruido, legible)
"""

import os
import zipfile
import shutil

os.environ["MPLCONFIGDIR"] = "/tmp/mpl_cache"
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt
import matplotlib.patches as mpatches
import matplotlib.patheffects as pe
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch
import numpy as np

# ─────────────────────────────────────────────────────────────
# PALETA INSTITUCIONAL ALQUIMIA
# ─────────────────────────────────────────────────────────────
BG       = "#FAF8F4"   # fondo warm ivory
PAPER    = "#FDFCFA"   # card background
BORDER   = "#C8C4BC"   # borders
TEXT_PRI = "#1C1B18"   # texto primario
TEXT_SEC = "#6B6760"   # texto secundario
TEXT_TER = "#A8A49C"   # texto terciario
GREEN    = "#3B6D11"   # verde institucional
GREEN_LT = "#EAF3DE"   # verde claro
AMBER    = "#D4881E"   # ámbar
RED      = "#C0392B"   # rojo/error
BLUE     = "#1A5FA8"   # azul

# Colores de fracción (señalética 5 fracciones)
FRAC_PLASTICO = "#F5A623"   # ámbar cálido → plásticos
FRAC_VIDRIO   = "#27AE60"   # verde → vidrio
FRAC_METAL    = "#7F8C8D"   # acero → metales
FRAC_PAPEL    = "#2980B9"   # azul → papel/cartón
FRAC_ORGANICO = "#639922"   # verde olivo → orgánico

OUT_DIR = os.path.join(os.path.dirname(__file__), "generated_images")
os.makedirs(OUT_DIR, exist_ok=True)

DPI = 150   # 150 dpi → buena resolución para Word
FONT = "DejaVu Sans"


def save(fig, name):
    path = os.path.join(OUT_DIR, name)
    fig.savefig(path, dpi=DPI, bbox_inches="tight",
                facecolor=BG, edgecolor="none")
    plt.close(fig)
    print(f"  ✓ {name}")
    return path


# ─────────────────────────────────────────────────────────────
# IMAGE 7 — Barras horizontales composición RSU (reemplaza pie)
# ─────────────────────────────────────────────────────────────
def gen_image7():
    datos = [
        ("Materia orgánica",  45.0, 326.6, FRAC_ORGANICO),
        ("Papel y cartón",    20.0, 145.2, FRAC_PAPEL),
        ("Plásticos (PET/HDPE)", 15.0, 108.9, FRAC_PLASTICO),
        ("Otros residuos",    10.0,  72.6, TEXT_TER),
        ("Vidrio",             5.0,  36.3, FRAC_VIDRIO),
        ("Metales (Al)",       5.0,  36.3, FRAC_METAL),
    ]
    labels = [d[0] for d in datos]
    pcts   = [d[1] for d in datos]
    tons   = [d[2] for d in datos]
    colors = [d[3] for d in datos]

    fig, ax = plt.subplots(figsize=(10, 4.5), facecolor=BG)
    ax.set_facecolor(BG)

    y = np.arange(len(labels))
    bars = ax.barh(y, pcts, height=0.55, color=colors, zorder=3)

    # Valores al final de cada barra
    for bar, pct, ton in zip(bars, pcts, tons):
        ax.text(pct + 0.5, bar.get_y() + bar.get_height() / 2,
                f"{pct:.0f}%  ·  {ton:.0f} t/d",
                va="center", ha="left",
                fontsize=9, color=TEXT_SEC, fontfamily=FONT)

    ax.set_yticks(y)
    ax.set_yticklabels(labels, fontsize=10, color=TEXT_PRI, fontfamily=FONT)
    ax.set_xlabel("% del flujo de RSU", fontsize=9, color=TEXT_SEC, fontfamily=FONT)
    ax.set_xlim(0, 60)
    ax.xaxis.set_tick_params(labelsize=8, colors=TEXT_TER)
    ax.tick_params(axis="y", length=0)

    # Grid suave
    ax.xaxis.grid(True, color=BORDER, linewidth=0.5, zorder=0)
    ax.set_axisbelow(True)
    for spine in ax.spines.values():
        spine.set_visible(False)

    # Título
    ax.set_title("Composición de RSU — Zona Metropolitana de San Luis Potosí\n"
                 "Vivienda particular · 725.76 ton/día totales",
                 fontsize=11, color=TEXT_PRI, fontfamily=FONT,
                 loc="left", pad=12)

    # Nota de fuente
    fig.text(0.01, 0.01, "Fuente: SEMARNAT DBGIR 2022 · Bootstrap §2.1 · Modelo_BASED.xlsx",
             fontsize=7, color=TEXT_TER, fontfamily=FONT, va="bottom")

    fig.tight_layout(rect=[0, 0.04, 1, 1])
    return save(fig, "image7.png")


# ─────────────────────────────────────────────────────────────
# IMAGE 2 — D3: Estándar 5 fracciones (colores reales)
# ─────────────────────────────────────────────────────────────
def gen_image2():
    fracciones = [
        {
            "nombre": "Plásticos\ny polímeros",
            "color":  FRAC_PLASTICO,
            "sí": ["Botellas PET", "Envases HDPE", "Bolsas limpias"],
            "no": ["EPS/unicel", "Plásticos con\nrestos orgánicos"],
        },
        {
            "nombre": "Vidrio",
            "color":  FRAC_VIDRIO,
            "sí": ["Botellas", "Frascos"],
            "no": ["Vidrio templado", "Espejos, focos", "Cristal pyrex"],
        },
        {
            "nombre": "Metales\nligeros",
            "color":  FRAC_METAL,
            "sí": ["Latas aluminio", "Hojalata", "Aluminio limpio"],
            "no": ["Aerosoles\npresur.", "Baterías"],
        },
        {
            "nombre": "Papel\ny cartón",
            "color":  FRAC_PAPEL,
            "sí": ["Periódicos", "Revistas", "Cajas cartón", "Papel oficina"],
            "no": ["Papel encerado", "Papel térmico", "Con restos org."],
        },
        {
            "nombre": "Materia\norgánica",
            "color":  FRAC_ORGANICO,
            "sí": ["Restos frutas\ny verduras", "Cáscaras", "Posos de café"],
            "no": ["Huesos grandes", "Aceite cocina", "Residuo animal\ncrudo"],
        },
    ]

    fig, axes = plt.subplots(1, 5, figsize=(14, 5.5), facecolor=BG)
    fig.subplots_adjust(wspace=0.04, left=0.01, right=0.99, top=0.88, bottom=0.04)

    for ax, f in zip(axes, fracciones):
        ax.set_facecolor(f["color"])
        ax.set_xlim(0, 1)
        ax.set_ylim(0, 1)
        for spine in ax.spines.values():
            spine.set_visible(False)
        ax.set_xticks([])
        ax.set_yticks([])

        # Título de fracción
        ax.text(0.5, 0.92, f["nombre"], ha="center", va="top",
                fontsize=10, fontweight="bold", color="white",
                fontfamily=FONT, multialignment="center",
                bbox=dict(facecolor="none", edgecolor="none"))

        # Separador
        ax.axhline(0.78, color="white", alpha=0.4, linewidth=0.8)

        # PERMITIDOS
        ax.text(0.5, 0.73, "Permitidos", ha="center", va="top",
                fontsize=7.5, fontweight="bold", color="white",
                fontfamily=FONT)
        y = 0.64
        for item in f["sí"]:
            ax.text(0.5, y, f"+ {item}", ha="center", va="top",
                    fontsize=7, color="white", fontfamily=FONT,
                    multialignment="center")
            y -= 0.10

        # NO PERMITIDOS
        ax.axhline(0.30, color="white", alpha=0.4, linewidth=0.8)
        ax.text(0.5, 0.27, "No permitidos", ha="center", va="top",
                fontsize=7.5, fontweight="bold", color="white",
                fontfamily=FONT)
        y = 0.18
        for item in f["no"]:
            ax.text(0.5, y, f"– {item}", ha="center", va="top",
                    fontsize=7, color="white", alpha=0.9,
                    fontfamily=FONT, multialignment="center")
            y -= 0.09

    # Flechas entre cajas
    for i in range(4):
        fig.text(0.205 * i + 0.20, 0.46, "→",
                 fontsize=14, color=BORDER, ha="center", va="center")

    fig.suptitle("D3. Estándar de separación en cinco fracciones\n"
                 "Señalética oficial · ZM San Luis Potosí",
                 fontsize=11, color=TEXT_PRI, fontfamily=FONT, y=0.97)

    return save(fig, "image2.png")


# ─────────────────────────────────────────────────────────────
# IMAGE 5 — D4: Árbol de decisión Modelo A vs Modelo B
# ─────────────────────────────────────────────────────────────
def box(ax, x, y, w, h, text, bg, border, fontsize=8.5, bold=False):
    rect = FancyBboxPatch((x - w/2, y - h/2), w, h,
                          boxstyle="round,pad=0.015",
                          facecolor=bg, edgecolor=border, linewidth=1.2, zorder=3)
    ax.add_patch(rect)
    ax.text(x, y, text, ha="center", va="center",
            fontsize=fontsize, color=TEXT_PRI,
            fontfamily=FONT, fontweight="bold" if bold else "normal",
            multialignment="center", zorder=4)


def arrow(ax, x0, y0, x1, y1, label="", color=BORDER):
    ax.annotate("", xy=(x1, y1), xytext=(x0, y0),
                arrowprops=dict(arrowstyle="-|>", color=color,
                                lw=1.2, mutation_scale=10), zorder=2)
    if label:
        mx, my = (x0+x1)/2, (y0+y1)/2
        ax.text(mx + 0.02, my, label, fontsize=7.5, color=GREEN,
                fontfamily=FONT, fontweight="bold", va="center", zorder=5)


def gen_image5():
    fig, ax = plt.subplots(figsize=(11, 7), facecolor=BG)
    ax.set_facecolor(BG)
    ax.set_xlim(0, 1)
    ax.set_ylim(0, 1)
    ax.axis("off")

    # ── FILTROS (cajas preguntas) ──────────────────────────────
    box(ax, 0.18, 0.78, 0.28, 0.10,
        "Filtro 1 – Espacio físico\n¿El condominio tiene área\ncomún para centro de acopio?",
        GREEN_LT, GREEN, fontsize=8)

    box(ax, 0.50, 0.78, 0.28, 0.10,
        "Filtro 2 – Escala\n¿Número de viviendas ≤ 200\nen un solo punto de acopio?",
        GREEN_LT, GREEN, fontsize=8)

    box(ax, 0.80, 0.78, 0.28, 0.10,
        "Filtro 3 – Accesibilidad\n¿El camión puede entrar\ny salir con seguridad?",
        GREEN_LT, GREEN, fontsize=8)

    # ── RESPUESTAS Sí/No ──────────────────────────────────────
    # Filtro 1 → Filtro 2 (Sí)
    arrow(ax, 0.32, 0.78, 0.36, 0.78, "Sí")
    # Filtro 2 → Filtro 3 (Sí)
    arrow(ax, 0.64, 0.78, 0.66, 0.78, "Sí")

    # Filtro 1 No → Caso especial (flecha hacia abajo izquierda)
    arrow(ax, 0.18, 0.73, 0.18, 0.28, "No")
    # Filtro 2 No → Caso especial
    arrow(ax, 0.50, 0.73, 0.38, 0.28, "No")
    # Filtro 3 No → Modelo B
    arrow(ax, 0.80, 0.73, 0.80, 0.48, "No")
    # Filtro 3 Sí → Modelo A
    arrow(ax, 0.80, 0.73, 0.80, 0.48)
    arrow(ax, 0.94, 0.78, 0.94, 0.60, "Sí (típico)")

    # ── MODELOS RESULTADO ────────────────────────────────────
    # Modelo A
    box(ax, 0.80, 0.60, 0.32, 0.10,
        "Modelo A\nCentro de acopio\ncondominial",
        "#D5F5E3", GREEN, fontsize=8.5, bold=True)

    ax.text(0.80, 0.52,
            "• Un punto de entrega en el condominio\n"
            "• Administración opera contenedores\n"
            "• Concesionario recolecta en CA interno",
            ha="center", va="top", fontsize=7.5,
            color=TEXT_SEC, fontfamily=FONT)

    # Modelo B
    box(ax, 0.80, 0.30, 0.32, 0.10,
        "Modelo B\nRecolección interna\nprogramada",
        "#D6EAF8", BLUE, fontsize=8.5, bold=True)

    ax.text(0.80, 0.22,
            "• Puntos de entrega en ruta interna\n"
            "• Administración coordina calendario\n"
            "• Concesionario recorre con itinerario",
            ha="center", va="top", fontsize=7.5,
            color=TEXT_SEC, fontfamily=FONT)

    # Caso especial
    box(ax, 0.25, 0.16, 0.30, 0.10,
        "Caso especial\n(evaluar a medida)",
        "#F2F3F4", BORDER, fontsize=8.5)

    ax.text(0.25, 0.08,
            "Condominios sin espacio ni accesibilidad\n"
            "suficiente · Solución mixta o infraestructura adicional",
            ha="center", va="top", fontsize=7.5,
            color=TEXT_SEC, fontfamily=FONT)

    # Flecha Filtro 3 No → Modelo B
    arrow(ax, 0.80, 0.73, 0.80, 0.35, "No")

    fig.suptitle("D4. Selección de esquema para condominios – Modelo A vs Modelo B",
                 fontsize=11, color=TEXT_PRI, fontfamily=FONT,
                 x=0.01, ha="left", y=0.97)

    fig.text(0.01, 0.01,
             "La asignación se hace mediante la Cédula de Evaluación de Idoneidad Residencial (Anexo 1).",
             fontsize=7.5, color=TEXT_TER, fontfamily=FONT)

    return save(fig, "image5.png")


# ─────────────────────────────────────────────────────────────
# IMAGE 9 — D10: Cadena de custodia del residuo separado
# ─────────────────────────────────────────────────────────────
def gen_image9():
    nodos = [
        ("Vivienda\nSeparación\n5 fracciones", GREEN_LT,    GREEN),
        ("Centro de Acopio\no Punto de\nrecolección",        "#EBF5FB", BLUE),
        ("Administración\nRevisión visual\ne incidencias",   GREEN_LT,   GREEN),
        ("Concesionario\nRecolección\ny pesaje/fracción",    "#EBF5FB",  BLUE),
        ("Evidencia\nfotográfica\nRegistro GPS",             "#FEF9E7",  AMBER),
        ("Sistema digital\nBase de datos\ndashboard",        "#FDEDEC",  RED),
        ("Autoridad\nMunicipal\nArt. 37 Bis",                "#F2F3F4",  BORDER),
        ("Infraestructura\nReciclaje /\nbiogás / compost",   "#D5F5E3",  GREEN),
    ]

    fig, ax = plt.subplots(figsize=(14, 3.8), facecolor=BG)
    ax.set_facecolor(BG)
    ax.set_xlim(-0.2, len(nodos) - 0.2)
    ax.set_ylim(-0.5, 1.5)
    ax.axis("off")

    W, H = 0.82, 0.70
    for i, (txt, bg, bd) in enumerate(nodos):
        rect = FancyBboxPatch((i - W/2, -H/2), W, H,
                              boxstyle="round,pad=0.04",
                              facecolor=bg, edgecolor=bd, linewidth=1.4, zorder=3)
        ax.add_patch(rect)
        ax.text(i, 0, txt, ha="center", va="center",
                fontsize=7.5, color=TEXT_PRI,
                fontfamily=FONT, multialignment="center", zorder=4)

        # Numeración
        ax.text(i, H/2 + 0.04, f"{i+1}", ha="center", va="bottom",
                fontsize=7, color=TEXT_TER, fontfamily=FONT, zorder=4)

        # Flecha al siguiente
        if i < len(nodos) - 1:
            ax.annotate("", xy=(i + W/2 + 0.04, 0),
                        xytext=(i + W/2 - 0.04 + 1 - W, 0),
                        arrowprops=dict(arrowstyle="-|>", color=BORDER,
                                        lw=1.2, mutation_scale=9), zorder=2)

    # Flecha punteada incidencias internas (Admin → Concesionario)
    ax.annotate("",
                xy=(3 - W/2, -0.38),
                xytext=(2 + W/2, -0.38),
                arrowprops=dict(arrowstyle="-|>", color=AMBER,
                                lw=1.0, linestyle="dashed",
                                mutation_scale=8,
                                connectionstyle="arc3,rad=0"), zorder=2)
    ax.text(2.5, -0.50, "Incidencias internas",
            ha="center", va="top", fontsize=6.5,
            color=AMBER, fontfamily=FONT, style="italic")

    fig.suptitle("D10. Cadena de custodia del residuo separado\n"
                 "Desde vivienda hasta infraestructura de aprovechamiento — ZM SLP",
                 fontsize=10, color=TEXT_PRI, fontfamily=FONT,
                 x=0.01, ha="left", y=1.0)

    fig.tight_layout(rect=[0, 0, 1, 0.88])
    return save(fig, "image9.png")


# ─────────────────────────────────────────────────────────────
# IMAGE 6 — D11: Swimlane sistema digital (limpio, sin draft)
# ─────────────────────────────────────────────────────────────
def gen_image6():
    pasos = [
        {
            "titulo": "Paso 1\nDetección y\ncaptura en app",
            "fe": "Camión / personal\ndetecta bolsa mezclada.\nToma foto, registra\nfracción y ubicación.",
            "be": "App envía foto,\nGPS, fracción y tipo\nde incumplimiento\nal servidor.",
        },
        {
            "titulo": "Paso 2\nValidación y\nfolio",
            "fe": "Usuario de campo\nve confirmación\nde que el reporte\nfue enviado.",
            "be": "Motor de reglas\nvalida y genera\nfolio de incumplimiento\ncon monto preliminar.",
            "be_highlight": True,
        },
        {
            "titulo": "Paso 3\nNotificación a\nadmin y residente",
            "fe": "Administración\ny residente reciben\nnotificación con\nevidencia.",
            "be": "Sistema emite\nnotificación automática\n(correo / app /\nimpresión).",
        },
        {
            "titulo": "Paso 4\nPago o\nrecurso",
            "fe": "Residente / admin\npaga la multa\no presenta recurso\nen portal.",
            "be": "Se registra el pago,\nconvenio o recurso;\nse actualiza el\nestado del folio.",
        },
        {
            "titulo": "Paso 5\nKPIs y ajustes\noperativos",
            "fe": "Municipio y\nconcesionario\nrevisan reportes\nresumidos.",
            "be": "Datos alimentan el\ntablero de KPIs y\nactivan recomendaciones\nde ajuste operativo.",
            "be_highlight": True,
        },
    ]

    fig, ax = plt.subplots(figsize=(14, 6.5), facecolor=BG)
    ax.set_facecolor(BG)
    ax.set_xlim(-0.3, 5.3)
    ax.set_ylim(-0.3, 3.5)
    ax.axis("off")

    COL_W   = 1.0
    ROW_H   = 1.10
    PAD     = 0.08

    # Swim-lane labels
    ax.text(-0.25, 2.75, "Front-end\n(campo)", ha="center", va="center",
            fontsize=8.5, color="white", fontfamily=FONT, fontweight="bold",
            bbox=dict(facecolor=BLUE, edgecolor="none",
                      boxstyle="round,pad=0.3"))
    ax.text(-0.25, 1.45, "Back-end\nmunicipal", ha="center", va="center",
            fontsize=8.5, color="white", fontfamily=FONT, fontweight="bold",
            bbox=dict(facecolor="#8E44AD", edgecolor="none",
                      boxstyle="round,pad=0.3"))

    # Divider horizontal
    ax.axhline(2.10, color=BORDER, linewidth=1.0, xmin=0.04, xmax=1.0, zorder=1)

    # Base de datos label en la parte inferior
    ax.add_patch(FancyBboxPatch((0.0, -0.22), 5.0, 0.38,
                                boxstyle="round,pad=0.04",
                                facecolor="#D6EAF8", edgecolor=BLUE,
                                linewidth=1.0, zorder=3))
    ax.text(2.5, -0.03, "Base de datos municipal de trazabilidad  ·  "
            "Evidencias (fotos, GPS), folios, pagos, recursos e históricos",
            ha="center", va="center", fontsize=8, color=BLUE,
            fontfamily=FONT, fontweight="bold", zorder=4)

    for i, p in enumerate(pasos):
        cx = i * COL_W + 0.5

        # Cabecera de columna
        ax.text(cx, 3.25, p["titulo"], ha="center", va="center",
                fontsize=7.5, color=TEXT_PRI, fontfamily=FONT,
                fontweight="bold", multialignment="center",
                bbox=dict(facecolor=GREEN_LT, edgecolor=GREEN,
                          boxstyle="round,pad=0.15", linewidth=0.8))

        # Caja front-end
        fe_bg = "#EBF5FB"
        rect_fe = FancyBboxPatch((cx - 0.44, 2.15), 0.88, 0.82,
                                 boxstyle="round,pad=0.04",
                                 facecolor=fe_bg, edgecolor="#AED6F1",
                                 linewidth=0.9, zorder=3)
        ax.add_patch(rect_fe)
        ax.text(cx, 2.57, p["fe"], ha="center", va="center",
                fontsize=6.5, color=TEXT_PRI, fontfamily=FONT,
                multialignment="center", zorder=4)

        # Caja back-end
        be_bg = "#FDEDEC" if p.get("be_highlight") else "#F5EEF8"
        be_bd = RED if p.get("be_highlight") else "#C39BD3"
        rect_be = FancyBboxPatch((cx - 0.44, 0.85), 0.88, 0.82,
                                 boxstyle="round,pad=0.04",
                                 facecolor=be_bg, edgecolor=be_bd,
                                 linewidth=0.9 if not p.get("be_highlight") else 1.4,
                                 zorder=3)
        ax.add_patch(rect_be)
        ax.text(cx, 1.27, p["be"], ha="center", va="center",
                fontsize=6.5, color=TEXT_PRI, fontfamily=FONT,
                multialignment="center", zorder=4)

        # Flecha vertical fe → be
        ax.annotate("", xy=(cx, 0.89), xytext=(cx, 2.13),
                    arrowprops=dict(arrowstyle="-|>", color=BORDER,
                                   lw=0.9, mutation_scale=7), zorder=2)

        # Flecha be → base de datos (vertical)
        ax.annotate("", xy=(cx, 0.18), xytext=(cx, 0.83),
                    arrowprops=dict(arrowstyle="-|>", color="#AED6F1",
                                   lw=0.9, mutation_scale=7), zorder=2)

        # Flecha horizontal al siguiente paso
        if i < len(pasos) - 1:
            ax.annotate("", xy=(cx + 0.56, 2.57),
                        xytext=(cx + 0.44, 2.57),
                        arrowprops=dict(arrowstyle="-|>", color=BORDER,
                                       lw=0.9, mutation_scale=7), zorder=5)
            ax.annotate("", xy=(cx + 0.56, 1.27),
                        xytext=(cx + 0.44, 1.27),
                        arrowprops=dict(arrowstyle="-|>", color=BORDER,
                                       lw=0.9, mutation_scale=7), zorder=5)

    # Ajuste → header (flecha superior punteada)
    ax.annotate("Ajustes operativos → mejoran el comportamiento en campo",
                xy=(0.10, 3.10), xytext=(4.90, 3.10),
                fontsize=7, color=TEXT_TER, fontfamily=FONT,
                ha="right", va="center",
                arrowprops=dict(arrowstyle="<-", color=TEXT_TER,
                                lw=0.8, linestyle="dashed",
                                mutation_scale=7), zorder=2)

    fig.suptitle("D11. Arquitectura y flujo de uso del sistema digital de trazabilidad\n"
                 "Cómo una bolsa mal separada se convierte en dato, multa y ajuste operativo",
                 fontsize=10, color=TEXT_PRI, fontfamily=FONT,
                 x=0.01, ha="left", y=1.0)

    fig.tight_layout(rect=[0, 0, 1, 0.90])
    return save(fig, "image6.png")


# ─────────────────────────────────────────────────────────────
# INSERTAR EN DOCX
# ─────────────────────────────────────────────────────────────
def replace_images_in_docx():
    src_docx = os.path.join(
        os.path.dirname(__file__),
        "..", "SLP ( contexto )  ", "DOCS",
        "CAPITULO SAN LUIS POTOSÍ.docx"
    )
    out_docx = os.path.join(
        os.path.dirname(__file__),
        "..", "SLP ( contexto )  ", "DOCS",
        "CAPITULO SAN LUIS POTOSÍ(1).docx"   # sobrescribimos la copia (1)
    )

    replacements = {
        "word/media/image2.png": os.path.join(OUT_DIR, "image2.png"),
        "word/media/image5.png": os.path.join(OUT_DIR, "image5.png"),
        "word/media/image6.png": os.path.join(OUT_DIR, "image6.png"),
        "word/media/image7.png": os.path.join(OUT_DIR, "image7.png"),
        "word/media/image9.png": os.path.join(OUT_DIR, "image9.png"),
    }

    # Copia base → salida
    shutil.copy2(src_docx, out_docx)

    # Reemplazo de imágenes dentro del zip
    tmp = out_docx + ".tmp"
    with zipfile.ZipFile(out_docx, "r") as zin:
        with zipfile.ZipFile(tmp, "w", zipfile.ZIP_DEFLATED) as zout:
            for item in zin.infolist():
                if item.filename in replacements:
                    print(f"  ↪ Reemplazando {item.filename}")
                    zout.write(replacements[item.filename], item.filename)
                else:
                    zout.writestr(item, zin.read(item.filename))

    os.replace(tmp, out_docx)
    print(f"\n  ✓ Documento guardado en: {os.path.basename(out_docx)}")
    return out_docx


# ─────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("AESTHETE-1 · Generando diagramas institucionales\n")

    print("Generando imágenes...")
    gen_image7()   # pie → barras horizontales
    gen_image2()   # D3 5 fracciones con colores reales
    gen_image5()   # D4 árbol decisión sin placeholders
    gen_image9()   # D10 cadena custodia legible
    gen_image6()   # D11 swimlane limpio

    print("\nInsertando en documento WORD...")
    replace_images_in_docx()

    print("\n✓ Pipeline completo. Imágenes en:", OUT_DIR)
