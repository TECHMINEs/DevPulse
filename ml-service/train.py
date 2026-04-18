"""
DevPulse ML Service — Train wellness prediction models
Generates synthetic training data and trains both a classifier and regressor.
Run this once to generate model_classifier.pkl and model_regressor.pkl

The synthetic data generation tries to mimic real developer patterns:
- bimodal commit hours (morning peak ~10am, evening peak ~11pm)
- night commits correlate with lower wellness
- weekend overwork correlates with burnout risk
- short commit messages = tired developer (anecdotal but feels right empirically)
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import Ridge
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report, mean_squared_error
import joblib
import json
import os

np.random.seed(42)

def generate_synthetic_data(n_samples=1000):
    """Generate realistic synthetic developer behavior data."""
    data = []

    for _ in range(n_samples):
        # determine the "type" of developer pattern
        pattern = np.random.choice(['healthy', 'moderate', 'burnout'], p=[0.4, 0.35, 0.25])

        if pattern == 'healthy':
            # good work-life balance
            avg_commit_hour = np.random.normal(14, 3)  # afternoon bias
            night_commit_pct = np.random.beta(1, 15)  # very low night %
            weekend_commit_pct = np.random.beta(2, 10)  # low weekend %
            avg_message_length = np.random.normal(55, 20)  # good commit messages
            lines_changed_stddev = np.random.exponential(80)  # steady output
            commits_per_day = np.random.normal(4, 1.5)
            streak_length = np.random.randint(0, 60)
            files_per_commit = np.random.normal(4, 2)
            score = np.random.uniform(70, 100)

        elif pattern == 'moderate':
            # some signs of strain
            avg_commit_hour = np.random.normal(17, 4)  # later in the day
            night_commit_pct = np.random.beta(3, 8)  # moderate night %
            weekend_commit_pct = np.random.beta(3, 6)  # some weekend work
            avg_message_length = np.random.normal(30, 15)  # shorter messages
            lines_changed_stddev = np.random.exponential(250)  # more variable
            commits_per_day = np.random.normal(5, 2)
            streak_length = np.random.randint(0, 30)
            files_per_commit = np.random.normal(6, 3)
            score = np.random.uniform(40, 69)

        else:  # burnout
            # classic burnout patterns
            avg_commit_hour = np.random.normal(22, 3)  # late night coding
            night_commit_pct = np.random.beta(6, 4)  # high night %
            weekend_commit_pct = np.random.beta(5, 3)  # lots of weekend work
            avg_message_length = np.random.normal(12, 8)  # lazy commit messages
            lines_changed_stddev = np.random.exponential(500)  # sprint/crash cycle
            commits_per_day = np.random.choice([
                np.random.normal(10, 3),  # overworking
                np.random.normal(1, 0.5),  # or barely working
            ])
            streak_length = np.random.randint(0, 15)
            files_per_commit = np.random.normal(12, 5)
            score = np.random.uniform(0, 39)

        # clamp values to valid ranges
        avg_commit_hour = np.clip(avg_commit_hour % 24, 0, 23.99)
        night_commit_pct = np.clip(night_commit_pct, 0, 1)
        weekend_commit_pct = np.clip(weekend_commit_pct, 0, 1)
        avg_message_length = np.clip(avg_message_length, 5, 200)
        lines_changed_stddev = np.clip(lines_changed_stddev, 0, 1000)
        commits_per_day = np.clip(commits_per_day, 0, 15)
        streak_length = int(np.clip(streak_length, 0, 90))
        files_per_commit = np.clip(files_per_commit, 0, 50)
        score = np.clip(score, 0, 100)

        # derive risk label from score
        if score >= 70:
            risk_flag = 'none'
        elif score >= 40:
            risk_flag = 'caution'
        else:
            risk_flag = 'high'

        data.append({
            'avg_commit_hour': round(avg_commit_hour, 2),
            'night_commit_pct': round(night_commit_pct, 4),
            'weekend_commit_pct': round(weekend_commit_pct, 4),
            'avg_message_length': round(avg_message_length, 2),
            'lines_changed_stddev': round(lines_changed_stddev, 2),
            'commits_per_day': round(commits_per_day, 2),
            'streak_length': streak_length,
            'files_per_commit': round(files_per_commit, 2),
            'score': round(score, 2),
            'risk_flag': risk_flag,
        })

    return pd.DataFrame(data)


def train_models():
    """Train classifier and regressor models."""
    print("🔧 Generating synthetic training data...")
    df = generate_synthetic_data(1000)

    print(f"📊 Dataset shape: {df.shape}")
    print(f"📊 Risk flag distribution:\n{df['risk_flag'].value_counts()}")
    print()

    feature_cols = [
        'avg_commit_hour', 'night_commit_pct', 'weekend_commit_pct',
        'avg_message_length', 'lines_changed_stddev', 'commits_per_day',
        'streak_length', 'files_per_commit',
    ]

    X = df[feature_cols].values
    y_class = df['risk_flag'].values
    y_score = df['score'].values

    # split data
    X_train, X_test, y_class_train, y_class_test, y_score_train, y_score_test = \
        train_test_split(X, y_class, y_score, test_size=0.2, random_state=42, stratify=y_class)

    # scale features
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)

    # ========================================================================
    # Train classifier (risk flag prediction)
    # ========================================================================
    print("🌲 Training RandomForestClassifier...")
    classifier = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        random_state=42,
        n_jobs=-1,
        class_weight='balanced',
    )
    classifier.fit(X_train_scaled, y_class_train)

    # evaluate classifier
    y_pred_class = classifier.predict(X_test_scaled)
    accuracy = accuracy_score(y_class_test, y_pred_class)
    print(f"✅ Classifier accuracy: {accuracy:.4f}")
    print("\nClassification Report:")
    print(classification_report(y_class_test, y_pred_class))

    # feature importance
    importances = dict(zip(feature_cols, classifier.feature_importances_.tolist()))
    print("📈 Feature importance:")
    for feat, imp in sorted(importances.items(), key=lambda x: -x[1]):
        print(f"  {feat}: {imp:.4f}")

    # ========================================================================
    # Train regressor (score prediction)
    # ========================================================================
    print("\n📈 Training Ridge Regressor...")
    regressor = Ridge(alpha=1.0)
    regressor.fit(X_train_scaled, y_score_train)

    y_pred_score = regressor.predict(X_test_scaled)
    rmse = np.sqrt(mean_squared_error(y_score_test, y_pred_score))
    print(f"✅ Regressor RMSE: {rmse:.4f}")

    # ========================================================================
    # Save models
    # ========================================================================
    model_dir = os.path.dirname(os.path.abspath(__file__))

    joblib.dump({
        'model': classifier,
        'scaler': scaler,
        'features': feature_cols,
        'accuracy': accuracy,
        'trained_on': len(X_train),
        'version': '1.0.0',
        'importances': importances,
    }, os.path.join(model_dir, 'model_classifier.pkl'))

    joblib.dump({
        'model': regressor,
        'scaler': scaler,
        'features': feature_cols,
        'rmse': rmse,
        'trained_on': len(X_train),
        'version': '1.0.0',
    }, os.path.join(model_dir, 'model_regressor.pkl'))

    # save model info as JSON for the API
    model_info = {
        'classifier_accuracy': round(accuracy, 4),
        'regressor_rmse': round(rmse, 4),
        'trained_on': len(X_train),
        'features': feature_cols,
        'feature_importances': {k: round(v, 4) for k, v in importances.items()},
        'version': '1.0.0',
    }
    with open(os.path.join(model_dir, 'model_info.json'), 'w') as f:
        json.dump(model_info, f, indent=2)

    print("\n✅ Models saved successfully!")
    print(f"  📁 model_classifier.pkl")
    print(f"  📁 model_regressor.pkl")
    print(f"  📁 model_info.json")


if __name__ == '__main__':
    train_models()
