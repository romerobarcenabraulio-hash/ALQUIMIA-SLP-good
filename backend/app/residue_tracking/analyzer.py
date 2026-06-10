"""Residue data analysis and validation engine."""

import math
from typing import Dict, Any, List, Tuple
from statistics import mean, stdev, StatisticsError


class OutlierDetector:
    """Detect outliers in residue data using statistical methods."""

    @staticmethod
    def is_outlier_iqr(values: List[float], new_value: float) -> Tuple[bool, float]:
        """Detect outlier using Interquartile Range (IQR) method.

        Returns (is_outlier, score) where score is how many IQRs away from median.
        """
        if len(values) < 4:  # Need at least 4 points for IQR
            return False, 0.0

        sorted_vals = sorted(values)
        n = len(sorted_vals)

        # Calculate quartiles
        q1_idx = n // 4
        q3_idx = 3 * n // 4
        q1 = sorted_vals[q1_idx]
        q3 = sorted_vals[q3_idx]

        iqr = q3 - q1
        if iqr == 0:
            return False, 0.0

        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr

        if new_value < lower_bound or new_value > upper_bound:
            # Calculate how many IQRs away
            if new_value < lower_bound:
                distance = abs(new_value - lower_bound) / iqr
            else:
                distance = (new_value - upper_bound) / iqr
            return True, distance
        return False, 0.0

    @staticmethod
    def is_outlier_zscore(values: List[float], new_value: float, threshold: float = 2.0) -> Tuple[bool, float]:
        """Detect outlier using Z-score method.

        Returns (is_outlier, zscore) where zscore is number of std devs from mean.
        Typically |z-score| > 2 is considered outlier.
        """
        if len(values) < 2:
            return False, 0.0

        try:
            avg = mean(values)
            std = stdev(values)

            if std == 0:
                return False, 0.0

            zscore = abs((new_value - avg) / std)
            return zscore > threshold, zscore
        except StatisticsError:
            return False, 0.0

    @staticmethod
    def detect_outlier(values: List[float], new_value: float) -> Dict[str, Any]:
        """Detect if value is outlier using multiple methods.

        Returns dict with:
        - is_outlier: bool
        - iqr_outlier: bool
        - zscore_outlier: bool
        - iqr_distance: float
        - zscore: float
        - confidence_pct: float
        """

        is_iqr_outlier, iqr_distance = OutlierDetector.is_outlier_iqr(values, new_value)
        is_zscore_outlier, zscore = OutlierDetector.is_outlier_zscore(values, new_value)

        # Combine methods: mark as outlier if at least one method detects it
        is_outlier = is_iqr_outlier or is_zscore_outlier

        # Calculate confidence based on agreement between methods
        method_agreement = (1 if is_iqr_outlier == is_zscore_outlier else 0) * 50 + 50

        return {
            "is_outlier": is_outlier,
            "iqr_outlier": is_iqr_outlier,
            "zscore_outlier": is_zscore_outlier,
            "iqr_distance": iqr_distance,
            "zscore": zscore,
            "confidence_pct": method_agreement,
        }


class ResidueValidator:
    """Validate residue records."""

    @staticmethod
    def validate_record(materiales: Dict[str, float], cantidad_total: float) -> Dict[str, Any]:
        """Validate a residue record.

        Returns dict with:
        - is_valid: bool
        - errors: list of error messages
        - warnings: list of warnings
        - suma_materiales: actual sum of materials
        - diferencia_pct: % difference between sum and total
        """

        errors = []
        warnings = []

        # Check for empty data
        if not materiales or cantidad_total <= 0:
            errors.append("No residue data provided")
            return {
                "is_valid": False,
                "errors": errors,
                "warnings": warnings,
                "suma_materiales": 0,
                "diferencia_pct": 100.0,
            }

        # Sum material quantities
        suma_materiales = sum(float(v) for v in materiales.values())

        if suma_materiales == 0:
            errors.append("Material quantities sum to zero")
            return {
                "is_valid": False,
                "errors": errors,
                "warnings": warnings,
                "suma_materiales": 0,
                "diferencia_pct": 100.0,
            }

        # Calculate difference percentage
        diferencia_pct = abs(suma_materiales - cantidad_total) / cantidad_total * 100

        # Validation checks
        if diferencia_pct > 10:
            warnings.append(f"Material sum ({suma_materiales}) differs {diferencia_pct:.1f}% from total ({cantidad_total})")

        if cantidad_total > 1000:
            warnings.append("Very high residue quantity - verify data")

        if suma_materiales > cantidad_total * 1.2:
            errors.append("Material quantities exceed total by more than 20%")

        is_valid = len(errors) == 0

        return {
            "is_valid": is_valid,
            "errors": errors,
            "warnings": warnings,
            "suma_materiales": suma_materiales,
            "diferencia_pct": diferencia_pct,
        }


class TrendAnalyzer:
    """Analyze trends in residue generation data."""

    @staticmethod
    def calculate_trend(daily_values: List[float]) -> Dict[str, Any]:
        """Calculate trend metrics from daily residue values.

        Returns dict with:
        - media_tons: average daily generation
        - desviacion_estandar: standard deviation
        - minimo_tons: minimum daily generation
        - maximo_tons: maximum daily generation
        - coef_variacion: coefficient of variation (std/mean * 100)
        - tendencia: "stable" | "increasing" | "decreasing"
        """

        if len(daily_values) < 2:
            return {
                "media_tons": daily_values[0] if daily_values else 0,
                "desviacion_estandar": 0,
                "minimo_tons": daily_values[0] if daily_values else 0,
                "maximo_tons": daily_values[0] if daily_values else 0,
                "coef_variacion": 0,
                "tendencia": "insufficient_data",
            }

        try:
            media = mean(daily_values)
            desv = stdev(daily_values)
            coef_var = (desv / media * 100) if media > 0 else 0

            # Simple trend: compare first half vs second half
            mid = len(daily_values) // 2
            primera_mitad = mean(daily_values[:mid])
            segunda_mitad = mean(daily_values[mid:])

            if abs(segunda_mitad - primera_mitad) / primera_mitad < 0.05:
                tendencia = "stable"
            elif segunda_mitad > primera_mitad:
                tendencia = "increasing"
            else:
                tendencia = "decreasing"

            return {
                "media_tons": round(media, 2),
                "desviacion_estandar": round(desv, 2),
                "minimo_tons": min(daily_values),
                "maximo_tons": max(daily_values),
                "coef_variacion": round(coef_var, 1),
                "tendencia": tendencia,
            }
        except StatisticsError:
            return {
                "media_tons": mean(daily_values),
                "desviacion_estandar": 0,
                "minimo_tons": min(daily_values),
                "maximo_tons": max(daily_values),
                "coef_variacion": 0,
                "tendencia": "error",
            }

    @staticmethod
    def project_monthly(daily_average: float, days_recorded: int) -> float:
        """Project monthly generation from daily average.

        Accounts for actual days of data recorded.
        """
        days_per_month = 30
        return round((daily_average / days_recorded) * days_per_month, 2)

    @staticmethod
    def calculate_completitud(total_days: int, days_with_data: int) -> float:
        """Calculate data completeness percentage."""
        if total_days == 0:
            return 0.0
        return round((days_with_data / total_days) * 100, 1)


class MaterialComposition:
    """Analyze material composition of residues."""

    @staticmethod
    def calculate_percentages(materiales: Dict[str, float]) -> Dict[str, float]:
        """Calculate percentage composition."""
        total = sum(materiales.values())
        if total == 0:
            return {mat: 0.0 for mat in materiales}
        return {mat: round((val / total) * 100, 1) for mat, val in materiales.items()}

    @staticmethod
    def identify_major_components(materiales: Dict[str, float], min_pct: float = 5.0) -> List[str]:
        """Identify major material components (above threshold)."""
        percentages = MaterialComposition.calculate_percentages(materiales)
        return [mat for mat, pct in percentages.items() if pct >= min_pct]

    @staticmethod
    def estimate_recyclable_potential(materiales: Dict[str, float]) -> Dict[str, Any]:
        """Estimate recyclable potential based on material composition.

        Returns dict with:
        - reciclable_tons: amount of recyclable material
        - reciclable_pct: percentage of total
        - materiales_reciclables: list of recyclable materials
        """

        # Define recyclability by material
        recyclable_materials = {
            "papel": 0.95,
            "carton": 0.95,
            "plastico": 0.80,
            "vidrio": 0.95,
            "metal": 0.95,
            "acero": 0.95,
            "aluminio": 0.95,
            "concreto": 0.50,
            "madera": 0.70,
            "inertes": 0.40,
        }

        total = sum(materiales.values())
        reciclable_tons = 0
        materiales_reciclables = []

        for material, cantidad in materiales.items():
            recyclability = recyclable_materials.get(material.lower(), 0)
            if recyclability > 0:
                reciclable_tons += cantidad * recyclability
                materiales_reciclables.append(material)

        reciclable_pct = (reciclable_tons / total * 100) if total > 0 else 0

        return {
            "reciclable_tons": round(reciclable_tons, 2),
            "reciclable_pct": round(reciclable_pct, 1),
            "materiales_reciclables": materiales_reciclables,
            "no_reciclables_tons": round(total - reciclable_tons, 2),
        }
