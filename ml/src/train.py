"""
전처리된 데이터로 LSTM 모델 학습 + MLflow 실험 추적
실행: python ml/src/train.py
"""
import numpy as np
import yaml
import mlflow
import mlflow.keras
from pathlib import Path
from tensorflow import keras
from tensorflow.keras import layers
from sklearn.preprocessing import LabelBinarizer

ROOT = Path(__file__).parent.parent


def load_config():
    with open(ROOT / "configs/train.yaml") as f:
        return yaml.safe_load(f)


def load_data(cfg: dict):
    path = ROOT / cfg["data"]["processed_path"] / "dataset.npz"
    if not path.exists():
        raise FileNotFoundError(f"{path} 없음 — preprocess.py 먼저 실행하세요")
    d = np.load(path, allow_pickle=True)
    return d["X_train"], d["y_train"], d["X_val"], d["y_val"], d["X_test"], d["y_test"], d["classes"]


def build_model(cfg: dict, num_classes: int) -> keras.Model:
    m = cfg["model"]
    model = keras.Sequential([
        layers.LSTM(m["lstm_units"], return_sequences=True,
                    input_shape=(m["frames"], m["landmarks"] * m["coords"])),
        layers.Dropout(m["dropout"]),
        layers.LSTM(m["lstm_units"], return_sequences=False),
        layers.Dropout(m["dropout"]),
        layers.Dense(m["dense_units"], activation="relu"),
        layers.Dropout(0.2),
        layers.Dense(num_classes, activation="softmax"),
    ])
    model.compile(
        optimizer=cfg["training"]["optimizer"],
        loss="sparse_categorical_crossentropy",
        metrics=["accuracy"],
    )
    return model


def train():
    cfg = load_config()
    X_train, y_train, X_val, y_val, X_test, y_test, classes = load_data(cfg)
    num_classes = len(classes)

    mlflow.set_tracking_uri((ROOT / "mlruns").as_uri())
    mlflow.set_experiment("gesture-classification")

    with mlflow.start_run():
        mlflow.log_params({
            "lstm_units":  cfg["model"]["lstm_units"],
            "dropout":     cfg["model"]["dropout"],
            "dense_units": cfg["model"]["dense_units"],
            "epochs":      cfg["training"]["epochs"],
            "batch_size":  cfg["training"]["batch_size"],
            "optimizer":   cfg["training"]["optimizer"],
            "train_size":  len(X_train),
            "val_size":    len(X_val),
            "test_size":   len(X_test),
            "num_classes": num_classes,
        })

        model = build_model(cfg, num_classes)
        model.summary()

        ckpt_path = ROOT / "models/checkpoints/best_model.keras"
        ckpt_path.parent.mkdir(parents=True, exist_ok=True)

        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor="val_accuracy",
                patience=cfg["training"]["early_stopping_patience"],
                restore_best_weights=True,
                verbose=1,
            ),
            keras.callbacks.ModelCheckpoint(
                str(ckpt_path),
                monitor="val_accuracy",
                save_best_only=True,
                verbose=1,
            ),
            keras.callbacks.LambdaCallback(
                on_epoch_end=lambda epoch, logs: mlflow.log_metrics(
                    {
                        "train_loss": logs["loss"],
                        "train_acc":  logs["accuracy"],
                        "val_loss":   logs["val_loss"],
                        "val_acc":    logs["val_accuracy"],
                    },
                    step=epoch,
                )
            ),
        ]

        model.fit(
            X_train, y_train,
            validation_data=(X_val, y_val),
            epochs=cfg["training"]["epochs"],
            batch_size=cfg["training"]["batch_size"],
            callbacks=callbacks,
        )

        test_loss, test_acc = model.evaluate(X_test, y_test, verbose=0)
        print(f"\n테스트 정확도: {test_acc * 100:.1f}%")
        mlflow.log_metrics({"test_loss": test_loss, "test_acc": test_acc})

        h5_path = ROOT / "models/exports/gesture_model_new.h5"
        model.save(str(h5_path))
        mlflow.keras.log_model(model, "model")

        print(f"\n모델 저장 완료 → {h5_path}")
        print(f"MLflow run ID: {mlflow.active_run().info.run_id}")


if __name__ == "__main__":
    train()
