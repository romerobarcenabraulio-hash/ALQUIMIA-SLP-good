"""CLI POLIS — validadores de personalización municipal."""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from modules.personalization.coherence_validator import validate_coherence
from modules.personalization.cross_contamination import detect_cross_contamination
from modules.personalization.profile_loader import list_municipalities, load_profile
from modules.personalization.template_instantiator import instantiate_template


def _print_report(report) -> None:
    status = "PASS" if report.passed else "FAIL"
    print(f"\n[{status}] {report.validator} — {report.files_scanned} archivos")
    if report.findings:
        for f in report.findings[:50]:
            loc = f"{f.file_path}:{f.line}" if f.file_path else ""
            print(f"  {f.severity.value} {f.code} {loc}")
            print(f"    {f.message}")
            if f.expected and f.found:
                print(f"    esperado={f.expected} encontrado={f.found}")
        if len(report.findings) > 50:
            print(f"  ... y {len(report.findings) - 50} más")
    else:
        print("  Sin hallazgos.")


def cmd_contamination(_args: argparse.Namespace) -> int:
    report = detect_cross_contamination()
    _print_report(report)
    return 0 if report.passed else 1


def cmd_coherence(args: argparse.Namespace) -> int:
    report = validate_coherence(args.municipio)
    _print_report(report)
    return 0 if report.passed else 1


def cmd_validate_all(args: argparse.Namespace) -> int:
    contam = detect_cross_contamination()
    coher = validate_coherence(args.municipio)
    _print_report(contam)
    _print_report(coher)
    passed = contam.passed and coher.passed
    return 0 if passed else 1


def cmd_profile(args: argparse.Namespace) -> int:
    profile = load_profile(args.municipio)
    print(json.dumps(profile, indent=2, ensure_ascii=False))
    return 0


def cmd_list(_args: argparse.Namespace) -> int:
    for m in list_municipalities():
        print(m)
    return 0


def cmd_instantiate(args: argparse.Namespace) -> int:
    out = Path(args.output) if args.output else None
    content = instantiate_template(
        args.template,
        args.municipio,
        output_path=out,
    )
    if not args.output:
        print(content)
    else:
        print(f"Escrito: {args.output}")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(prog="polis", description="POLIS — personalización municipal")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("contamination", help="Detector de contaminación cruzada").set_defaults(
        func=cmd_contamination
    )

    p_coher = sub.add_parser("coherence", help="Validador de coherencia interna")
    p_coher.add_argument("--municipio", default="SLP")
    p_coher.set_defaults(func=cmd_coherence)

    p_all = sub.add_parser("validate", help="Ejecutar todos los validadores")
    p_all.add_argument("--municipio", default="SLP")
    p_all.set_defaults(func=cmd_validate_all)

    p_prof = sub.add_parser("profile", help="Mostrar perfil municipal")
    p_prof.add_argument("--municipio", default="SLP")
    p_prof.set_defaults(func=cmd_profile)

    sub.add_parser("list", help="Listar municipios con perfil").set_defaults(func=cmd_list)

    p_inst = sub.add_parser("instantiate", help="Instanciar plantilla")
    p_inst.add_argument("template", help="Nombre archivo en templates/")
    p_inst.add_argument("--municipio", default="SLP")
    p_inst.add_argument("--output", "-o", type=str, default=None)
    p_inst.set_defaults(func=cmd_instantiate)

    args = parser.parse_args(argv)
    return args.func(args)


if __name__ == "__main__":
    sys.exit(main())
