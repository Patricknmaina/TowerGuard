"""
TowerGuard Rule-Based Health Scoring

Implements transparent, deterministic scoring of water tower environmental health
based on extracted features. Scoring rules are explicitly defined and easily auditable.

Output format supports judge/stakeholder review with explanations.
"""

from typing import Dict, Optional, Any, List
from dataclasses import dataclass, asdict
from datetime import datetime
import numpy as np

from .features import SiteFeatures
from .utils import logger, build_feature_vector_from_site_features


# ==============================================================================
# Scoring Rules (Per ML_ENGINEER.md Section 2.4)
# ==============================================================================

@dataclass
class ScoringRule:
    """Represents a single scoring rule applied to a feature."""
    feature_name: str
    condition: str  # Human-readable condition description
    points_if_met: float
    points_if_not_met: float = 0.0


SCORING_RULES = [
    ScoringRule(
        feature_name='ndvi_mean',
        condition='NDVI mean > 0.5',
        points_if_met=40.0,
        points_if_not_met=0.0
    ),
    ScoringRule(
        feature_name='ndvi_std',
        condition='NDVI std < 0.2',
        points_if_met=10.0,
        points_if_not_met=0.0
    ),
    ScoringRule(
        feature_name='rainfall_mm',
        condition='Rainfall > 120 mm',
        points_if_met=20.0,
        points_if_not_met=0.0
    ),
    ScoringRule(
        feature_name='temp_mean_c',
        condition='Temperature 15-25°C',
        points_if_met=20.0,
        points_if_not_met=0.0
    ),
    ScoringRule(
        feature_name='elevation_m',
        condition='Elevation 1500-3000 m',
        points_if_met=10.0,
        points_if_not_met=0.0
    ),
]

# Maximum possible score
MAX_POINTS = sum(rule.points_if_met for rule in SCORING_RULES)  # 100 points


# ==============================================================================
# Health Score Categories
# ==============================================================================

@dataclass
class HealthCategory:
    """Defines a health score category and its range."""
    name: str
    description: str
    min_score: float
    max_score: float
    emoji: str = ""


HEALTH_CATEGORIES = [
    HealthCategory(
        name='Critical',
        description='Severe environmental degradation; immediate intervention needed',
        min_score=0.0,
        max_score=0.2,
        emoji='🔴'
    ),
    HealthCategory(
        name='Poor',
        description='Significant environmental stress; corrective action required',
        min_score=0.2,
        max_score=0.4,
        emoji='🟠'
    ),
    HealthCategory(
        name='Fair',
        description='Moderate environmental conditions; monitoring recommended',
        min_score=0.4,
        max_score=0.6,
        emoji='🟡'
    ),
    HealthCategory(
        name='Good',
        description='Healthy environmental conditions; favorable for ecosystem',
        min_score=0.6,
        max_score=0.8,
        emoji='🟢'
    ),
    HealthCategory(
        name='Excellent',
        description='Optimal environmental conditions; model water tower status',
        min_score=0.8,
        max_score=1.0,
        emoji='🟢'
    ),
]


def get_health_category(score: float) -> HealthCategory:
    """Get health category for a given normalized score (0-1)."""
    score = max(0.0, min(1.0, score))  # Clamp to [0, 1]
    
    for category in HEALTH_CATEGORIES:
        if category.min_score <= score <= category.max_score:
            return category
    
    # Fallback to last category (should not happen with proper clamping)
    return HEALTH_CATEGORIES[-1]


# ==============================================================================
# Rule Application Functions
# ==============================================================================

def apply_ndvi_mean_rule(ndvi_mean: Optional[float]) -> tuple:
    """
    Apply rule: NDVI mean > 0.5 → +40 points
    
    Returns: (points_earned, is_met, explanation)
    """
    rule = SCORING_RULES[0]  # NDVI mean rule
    
    if ndvi_mean is None:
        return 0.0, None, f"NDVI mean unavailable (treated as unmet)"
    
    is_met = ndvi_mean > 0.5
    points = rule.points_if_met if is_met else rule.points_if_not_met
    explanation = f"NDVI mean = {ndvi_mean:.3f} {'>' if is_met else '≤'} 0.5"
    
    return points, is_met, explanation


def apply_ndvi_std_rule(ndvi_std: Optional[float]) -> tuple:
    """
    Apply rule: NDVI std < 0.2 → +10 points
    
    Returns: (points_earned, is_met, explanation)
    """
    rule = SCORING_RULES[1]  # NDVI std rule
    
    if ndvi_std is None:
        return 0.0, None, f"NDVI std unavailable (treated as unmet)"
    
    is_met = ndvi_std < 0.2
    points = rule.points_if_met if is_met else rule.points_if_not_met
    explanation = f"NDVI std = {ndvi_std:.3f} {'<' if is_met else '≥'} 0.2"
    
    return points, is_met, explanation


def apply_rainfall_rule(rainfall_mm: Optional[float]) -> tuple:
    """
    Apply rule: Rainfall > 120 mm → +20 points
    
    Returns: (points_earned, is_met, explanation)
    """
    rule = SCORING_RULES[2]  # Rainfall rule
    
    if rainfall_mm is None:
        return 0.0, None, f"Rainfall unavailable (treated as unmet)"
    
    is_met = rainfall_mm > 120.0
    points = rule.points_if_met if is_met else rule.points_if_not_met
    explanation = f"Rainfall = {rainfall_mm:.1f} mm {'>' if is_met else '≤'} 120 mm"
    
    return points, is_met, explanation


def apply_temperature_rule(temp_mean_c: Optional[float]) -> tuple:
    """
    Apply rule: Temperature 15-25°C → +20 points
    
    Returns: (points_earned, is_met, explanation)
    """
    rule = SCORING_RULES[3]  # Temperature rule
    
    if temp_mean_c is None:
        return 0.0, None, f"Temperature unavailable (treated as unmet)"
    
    is_met = 15.0 <= temp_mean_c <= 25.0
    points = rule.points_if_met if is_met else rule.points_if_not_met
    explanation = f"Temperature = {temp_mean_c:.1f}°C {'∈' if is_met else '∉'} [15, 25]°C"
    
    return points, is_met, explanation


def apply_elevation_rule(elevation_m: Optional[float]) -> tuple:
    """
    Apply rule: Elevation 1500-3000 m → +10 points
    
    Returns: (points_earned, is_met, explanation)
    """
    rule = SCORING_RULES[4]  # Elevation rule
    
    if elevation_m is None:
        return 0.0, None, f"Elevation unavailable (treated as unmet)"
    
    is_met = 1500.0 <= elevation_m <= 3000.0
    points = rule.points_if_met if is_met else rule.points_if_not_met
    explanation = f"Elevation = {elevation_m:.0f} m {'∈' if is_met else '∉'} [1500, 3000] m"
    
    return points, is_met, explanation


# ==============================================================================
# Health Score Computation
# ==============================================================================

def compute_health_score(site_features: SiteFeatures) -> Dict[str, Any]:
    """
    Compute health score for a site using rule-based scoring.
    
    Applies all scoring rules, aggregates points, normalizes to 0-1 scale,
    and categorizes health status.
    
    Args:
        site_features: SiteFeatures object with extracted environmental data
    
    Returns:
        Dictionary with:
        - 'site_id': Site identifier
        - 'raw_points': Total points before normalization (0 to 100)
        - 'health_score': Normalized score (0 to 1)
        - 'category_name': Category name (Critical, Poor, Fair, Good, Excellent)
        - 'category_description': Category description
        - 'rule_results': List of detailed rule application results
        - 'timestamp': When score was computed
    """
    
    logger.info(f"Computing health score for site: {site_features.site_id}")
    
    # Apply all rules
    rule_results = []
    total_points = 0.0
    
    # NDVI mean rule
    points, is_met, explanation = apply_ndvi_mean_rule(site_features.ndvi_mean)
    total_points += points
    rule_results.append({
        'rule': SCORING_RULES[0].condition,
        'feature_value': site_features.ndvi_mean,
        'met': is_met,
        'points_earned': points,
        'explanation': explanation
    })
    
    # NDVI std rule
    points, is_met, explanation = apply_ndvi_std_rule(site_features.ndvi_std)
    total_points += points
    rule_results.append({
        'rule': SCORING_RULES[1].condition,
        'feature_value': site_features.ndvi_std,
        'met': is_met,
        'points_earned': points,
        'explanation': explanation
    })
    
    # Rainfall rule
    points, is_met, explanation = apply_rainfall_rule(site_features.rainfall_mm)
    total_points += points
    rule_results.append({
        'rule': SCORING_RULES[2].condition,
        'feature_value': site_features.rainfall_mm,
        'met': is_met,
        'points_earned': points,
        'explanation': explanation
    })
    
    # Temperature rule
    points, is_met, explanation = apply_temperature_rule(site_features.temp_mean_c)
    total_points += points
    rule_results.append({
        'rule': SCORING_RULES[3].condition,
        'feature_value': site_features.temp_mean_c,
        'met': is_met,
        'points_earned': points,
        'explanation': explanation
    })
    
    # Elevation rule
    points, is_met, explanation = apply_elevation_rule(site_features.elevation_m)
    total_points += points
    rule_results.append({
        'rule': SCORING_RULES[4].condition,
        'feature_value': site_features.elevation_m,
        'met': is_met,
        'points_earned': points,
        'explanation': explanation
    })
    
    # Normalize to 0-1 scale
    normalized_score = total_points / MAX_POINTS if MAX_POINTS > 0 else 0.0
    
    # Get category
    category = get_health_category(normalized_score)
    
    result = {
        'site_id': site_features.site_id,
        'raw_points': total_points,
        'max_points': MAX_POINTS,
        'health_score': normalized_score,
        'category_name': category.name,
        'category_description': category.description,
        'category_emoji': category.emoji,
        'rule_results': rule_results,
        'timestamp': datetime.utcnow().isoformat() + 'Z'
    }
    
    logger.info(
        f"[{site_features.site_id}] Health score computed: "
        f"{normalized_score:.3f} ({category.name})"
    )
    
    return result


# ==============================================================================
# Prediction/Output Creation
# ==============================================================================

def create_prediction_for_site_features(
    site_features: SiteFeatures,
    metadata: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Create a comprehensive prediction output combining features and health score.
    
    This is the high-level interface for judge/stakeholder review.
    Includes:
    - Extracted features
    - Health score and category
    - Detailed rule-by-rule breakdown
    - Interpretation text
    - Metadata/provenance
    
    Args:
        site_features: SiteFeatures object
        metadata: Optional metadata dictionary (e.g., from extract_features_for_site)
    
    Returns:
        Dictionary with complete prediction output:
        - 'site_id': Site identifier
        - 'timestamp': Prediction timestamp
        - 'features': Extracted environmental features
        - 'feature_vector': Ordered numerical vector [ndvi_mean, ndvi_std, ...]
        - 'health_score': Normalized score 0-1
        - 'category': Health category name
        - 'category_description': Human-readable category description
        - 'explanation': Generated interpretation text
        - 'rule_breakdown': Detailed per-rule scoring breakdown
        - 'metadata': Provenance and data sources
    """
    
    logger.info(f"Creating prediction output for site: {site_features.site_id}")
    
    # Compute health score
    score_result = compute_health_score(site_features)
    
    # Build feature vector
    features_dict = site_features.to_dict()
    feature_vector_result = build_feature_vector_from_site_features(features_dict)
    
    # Generate interpretation text
    explanation = _generate_explanation(site_features, score_result)
    
    # Aggregate rule breakdown
    rule_breakdown = {}
    for rule_result in score_result['rule_results']:
        rule_breakdown[rule_result['rule']] = {
            'met': rule_result['met'],
            'value': rule_result['feature_value'],
            'points': rule_result['points_earned'],
            'explanation': rule_result['explanation']
        }
    
    prediction = {
        'site_id': site_features.site_id,
        'timestamp': datetime.utcnow().isoformat() + 'Z',
        'features': features_dict,
        'feature_vector': feature_vector_result['feature_vector'].tolist(),  # numpy to list for JSON serialization
        'health_score': float(score_result['health_score']),
        'raw_points': float(score_result['raw_points']),
        'max_points': int(score_result['max_points']),
        'category': score_result['category_name'],
        'category_description': score_result['category_description'],
        'category_emoji': score_result['category_emoji'],
        'explanation': explanation,
        'rule_breakdown': rule_breakdown,
        'metadata': metadata or {},
        'missing_features': feature_vector_result['missing_fields']
    }
    
    logger.info(f"Prediction created for {site_features.site_id}")
    return prediction


def _generate_explanation(
    site_features: SiteFeatures,
    score_result: Dict[str, Any]
) -> str:
    """
    Generate human-readable interpretation of the health score.
    
    Args:
        site_features: Extracted features
        score_result: Output from compute_health_score
    
    Returns:
        Interpretation text suitable for judges/stakeholders
    """
    
    site_id = site_features.site_id.replace('_', ' ').title()
    category = score_result['category_name']
    score = score_result['health_score']
    
    lines = [
        f"Health Assessment for {site_id}",
        "=" * 50,
        f"",
        f"Overall Health Score: {score:.1%} ({category})",
        f"",
        f"Assessment Summary:",
        f"  The {site_id} water tower shows {category.lower()} environmental health.",
        f"  {score_result['category_description']}",
        f"",
        f"Feature Analysis:",
    ]
    
    # Add feature-specific insights
    if site_features.ndvi_mean is not None:
        ndvi_status = "strong" if site_features.ndvi_mean > 0.5 else "weak"
        lines.append(f"  • Vegetation Index (NDVI): {site_features.ndvi_mean:.3f} ({ndvi_status})")
    else:
        lines.append(f"  • Vegetation Index (NDVI): Not available")
    
    if site_features.rainfall_mm is not None:
        rainfall_status = "adequate" if site_features.rainfall_mm > 120 else "low"
        lines.append(f"  • Rainfall: {site_features.rainfall_mm:.0f} mm ({rainfall_status})")
    else:
        lines.append(f"  • Rainfall: Not available")
    
    if site_features.temp_mean_c is not None:
        temp_status = "optimal" if 15 <= site_features.temp_mean_c <= 25 else "suboptimal"
        lines.append(f"  • Temperature: {site_features.temp_mean_c:.1f}°C ({temp_status})")
    else:
        lines.append(f"  • Temperature: Not available")
    
    if site_features.elevation_m is not None:
        elev_status = "optimal" if 1500 <= site_features.elevation_m <= 3000 else "suboptimal"
        lines.append(f"  • Elevation: {site_features.elevation_m:.0f} m ({elev_status})")
    else:
        lines.append(f"  • Elevation: Not available")
    
    lines.extend([
        f"",
        f"Scoring Breakdown:",
    ])
    
    for rule_result in score_result['rule_results']:
        status = "✓" if rule_result['met'] else "✗"
        lines.append(
            f"  {status} {rule_result['rule']}: {rule_result['points_earned']:.0f} points"
        )
    
    lines.extend([
        f"",
        f"Total: {score_result['raw_points']:.0f} / {score_result['max_points']} points",
    ])
    
    return "\n".join(lines)


# ==============================================================================
# Batch Scoring
# ==============================================================================

def score_multiple_sites(sites_data: list) -> list:
    """
    Compute health scores for multiple sites.
    
    Args:
        sites_data: List of dictionaries, each with 'features' and 'metadata' keys
                   (as returned from extract_features_for_site)
    
    Returns:
        List of prediction dictionaries (one per site)
    """
    predictions = []
    
    for site_data in sites_data:
        try:
            features = site_data['features']
            metadata = site_data.get('metadata', {})
            
            prediction = create_prediction_for_site_features(features, metadata)
            predictions.append(prediction)
        
        except Exception as e:
            site_id = site_data.get('features', {}).site_id if 'features' in site_data else 'unknown'
            logger.error(f"Failed to score site {site_id}: {e}", exc_info=True)
    
    logger.info(f"Scoring complete for {len(predictions)} sites")
    return predictions
