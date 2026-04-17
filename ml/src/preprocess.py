"""
Raw JSON → 검증 → numpy 배열로 변환 후 processed/에 저장
"""
import json
import numpy as np
import yaml
from pathlib import Path
from collections import Counter
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

ROOT = Path(__file__).parent.parent


def load_config():
    with open(ROOT / "configs/train.yaml") as f:
        return yaml.safe_load(f)


def load_raw(path: Path) -> list[dict]:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)
    return data["samples"]


def validate_sample(sample: dict, frames: int, landmarks: int) -> bool:
    seq = sample.get("sequence", [])
    if len(seq) != frames:
        return False
    for frame in seq:
        if len(frame) != landmarks:
            return False
    return True


def to_feature_vector(sequence: list) -> np.ndarray:
    """sequence → (30, 99) float32"""
    return np.array(
        [[coord for lm in frame for coord in lm[:3]] for frame in sequence],
        dtype=np.float32,
    )


def preprocess(cfg: dict):
    frames    = cfg["model"]["frames"]
    landmarks = cfg["model"]["landmarks"]

    raw_path    = ROOT / cfg["data"]["raw_path"]
    labels_path = ROOT / cfg["data"]["labels_path"]
    out_dir     = ROOT / cfg["data"]["processed_path"]
    out_dir.mkdir(parents=True, exist_ok=True)

    samples = load_raw(raw_path)
    print(f"원본 샘플 수: {len(samples)}")

    valid_X, valid_y = [], []
    skipped = 0
    for s in samples:
        if not validate_sample(s, frames, landmarks):
            skipped += 1
            continue
        valid_X.append(to_feature_vector(s["sequence"]))
        valid_y.append(s["label"])

    print(f"유효: {len(valid_X)}개 / 제외: {skipped}개")
    print(f"라벨 분포: {Counter(valid_y)}")

    X = np.array(valid_X)  # (N, 30, 99)
    le = LabelEncoder()
    y = le.fit_transform(valid_y)

    # labels.json의 순서와 동기화
    with open(labels_path, encoding="utf-8") as f:
        saved_labels = json.load(f)
    if list(le.classes_) != saved_labels:
        print(f"[경고] 라벨 순서 불일치 — labels.json 업데이트")
        with open(labels_path, "w", encoding="utf-8") as f:
            json.dump(list(le.classes_), f, ensure_ascii=False, indent=2)

    seed = cfg["data"]["random_seed"]
    test_size = cfg["data"]["test_size"]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=test_size, random_state=seed, stratify=y
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=0.1, random_state=seed, stratify=y_train
    )

    np.savez(
        out_dir / "dataset.npz",
        X_train=X_train, y_train=y_train,
        X_val=X_val,     y_val=y_val,
        X_test=X_test,   y_test=y_test,
        classes=le.classes_,
    )

    print(f"\n저장 완료 → {out_dir / 'dataset.npz'}")
    print(f"  train: {len(X_train)} / val: {len(X_val)} / test: {len(X_test)}")
    return out_dir / "dataset.npz"


if __name__ == "__main__":
    cfg = load_config()
    preprocess(cfg)
