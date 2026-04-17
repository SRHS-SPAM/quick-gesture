"""
학습된 모델 평가 — 혼동 행렬, 클래스별 정확도, MLflow 기록
실행: python ml/src/evaluate.py
"""
import numpy as np
import yaml
import mlflow
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
from tensorflow import keras
from sklearn.metrics import classification_report, confusion_matrix

ROOT = Path(__file__).parent.parent


def load_config():
    with open(ROOT / "configs/train.yaml") as f:
        return yaml.safe_load(f)


def evaluate():
    cfg = load_config()

    data_path = ROOT / cfg["data"]["processed_path"] / "dataset.npz"
    d = np.load(data_path, allow_pickle=True)
    X_test, y_test, classes = d["X_test"], d["y_test"], d["classes"]

    model_path = ROOT / "models/checkpoints/best_model.keras"
    if not model_path.exists():
        model_path = ROOT / "models/exports/gesture_model_new.h5"
    model = keras.models.load_model(str(model_path))
    print(f"모델 로드: {model_path}")

    y_pred_prob = model.predict(X_test, verbose=0)
    y_pred = np.argmax(y_pred_prob, axis=1)

    print("\n" + "=" * 50)
    print(classification_report(y_test, y_pred, target_names=classes))

    cm = confusion_matrix(y_test, y_pred)
    fig, ax = plt.subplots(figsize=(10, 8))
    sns.heatmap(
        cm, annot=True, fmt="d", cmap="Blues",
        xticklabels=classes, yticklabels=classes, ax=ax,
    )
    ax.set_xlabel("예측")
    ax.set_ylabel("실제")
    ax.set_title("Confusion Matrix")
    plt.tight_layout()

    cm_path = ROOT / "models/confusion_matrix.png"
    fig.savefig(cm_path)
    print(f"혼동 행렬 저장 → {cm_path}")

    mlflow.set_tracking_uri((ROOT / "mlruns").as_uri())
    mlflow.set_experiment("gesture-classification")
    with mlflow.start_run(run_name="evaluate"):
        acc = np.mean(y_pred == y_test)
        mlflow.log_metric("test_acc", acc)
        mlflow.log_artifact(str(cm_path))

        for i, cls in enumerate(classes):
            mask = y_test == i
            if mask.sum() > 0:
                cls_acc = np.mean(y_pred[mask] == y_test[mask])
                mlflow.log_metric(f"acc_{cls}", cls_acc)

        print(f"\nMLflow 기록 완료 (test_acc: {acc * 100:.1f}%)")


if __name__ == "__main__":
    evaluate()
