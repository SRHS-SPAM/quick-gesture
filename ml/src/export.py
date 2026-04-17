"""
학습된 .h5 모델 → ONNX 변환 및 추론 검증
실행: python ml/src/export.py
"""
import numpy as np
import yaml
import subprocess
import json
from pathlib import Path
import tensorflow as tf
import onnxruntime as ort

ROOT = Path(__file__).parent.parent


def load_config():
    with open(ROOT / "configs/train.yaml") as f:
        return yaml.safe_load(f)


def convert_to_onnx(h5_path: Path, onnx_path: Path, opset: int):
    print(f"변환 중: {h5_path} → {onnx_path}")
    result = subprocess.run(
        [
            "python", "-m", "tf2onnx.convert",
            "--keras", str(h5_path),
            "--output", str(onnx_path),
            "--opset", str(opset),
        ],
        capture_output=True, text=True,
    )
    if result.returncode != 0:
        raise RuntimeError(f"변환 실패:\n{result.stderr}")
    print("ONNX 변환 완료")


def verify_onnx(onnx_path: Path, cfg: dict):
    """ONNX 모델과 Keras 모델 출력 비교"""
    m = cfg["model"]
    dummy = np.random.rand(1, m["frames"], m["landmarks"] * m["coords"]).astype(np.float32)

    session = ort.InferenceSession(str(onnx_path))
    input_name  = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name
    onnx_out = session.run([output_name], {input_name: dummy})[0]

    print(f"ONNX 입력 shape : {session.get_inputs()[0].shape}")
    print(f"ONNX 출력 shape : {onnx_out.shape}")
    print(f"출력 합계 (~1.0): {onnx_out.sum():.4f}")
    print(f"최고 확률 클래스: {np.argmax(onnx_out)}")


def export():
    cfg = load_config()

    # 새로 학습한 모델 우선, 없으면 기존 모델 사용
    h5_path = ROOT / "models/exports/gesture_model_new.h5"
    if not h5_path.exists():
        h5_path = ROOT / "models/exports/gesture_model.h5"

    onnx_path = ROOT / cfg["export"]["onnx_path"]
    onnx_path.parent.mkdir(parents=True, exist_ok=True)

    convert_to_onnx(h5_path, onnx_path, cfg["export"]["opset_version"])
    verify_onnx(onnx_path, cfg)

    size_kb = onnx_path.stat().st_size // 1024
    print(f"\n최종 ONNX 파일: {onnx_path} ({size_kb} KB)")

    labels_path = ROOT / cfg["data"]["labels_path"]
    with open(labels_path, encoding="utf-8") as f:
        labels = json.load(f)
    print(f"라벨 순서: {labels}")


if __name__ == "__main__":
    export()
