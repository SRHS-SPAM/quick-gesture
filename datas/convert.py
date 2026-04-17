import tensorflow as tf
import numpy as np
import json
import os
import struct

print("모델 변환 시작...")

# ══════════════════════════════════════════════
# 1. 모델 로드
# ══════════════════════════════════════════════
model = tf.keras.models.load_model("gesture_model.h5")
print("모델 로드 완료")

os.makedirs("web_model", exist_ok=True)

# ══════════════════════════════════════════════
# 2. 가중치를 바이너리(.bin)로 저장
#    숫자 리스트 대신 바이너리로 저장 → 파일 크기 5~10배 감소
# ══════════════════════════════════════════════
all_bytes = bytearray()
weight_manifest = []
offset = 0

for layer in model.layers:
    weights = layer.get_weights()
    if not weights:
        continue
    for i, w in enumerate(weights):
        w = w.astype(np.float32)
        w_bytes = w.tobytes()
        weight_manifest.append({
            "layerName": layer.name,
            "index":     i,
            "shape":     list(w.shape),
            "dtype":     "float32",
            "offset":    offset,
            "byteLength":len(w_bytes)
        })
        all_bytes.extend(w_bytes)
        offset += len(w_bytes)
        print(f"  {layer.name}[{i}] shape={w.shape} size={w.size:,}")

# 바이너리 파일 저장
with open("web_model/weights.bin", "wb") as f:
    f.write(all_bytes)
print(f"\nweights.bin 저장: {len(all_bytes):,} bytes ({len(all_bytes)//1024} KB)")

# ══════════════════════════════════════════════
# 3. 레이어 구조만 JSON으로 저장 (가중치 제외 → 가벼움)
# ══════════════════════════════════════════════
with open("labels.json", encoding="utf-8") as f:
    labels = json.load(f)

layers_info = []
for layer in model.layers:
    layers_info.append({
        "name":       layer.name,
        "class_name": layer.__class__.__name__,
        "config":     layer.get_config()
    })

model_config = {
    "labels":          labels,
    "layers":          layers_info,
    "weightManifest":  weight_manifest
}

with open("web_model/model_config.json", "w", encoding="utf-8") as f:
    json.dump(model_config, f, indent=2)

# ══════════════════════════════════════════════
# 4. 결과 확인
# ══════════════════════════════════════════════
print("\n" + "="*50)
print("변환 완료!")
print("="*50)
print(f"labels: {labels}")
print("\nweb_model 폴더 내용:")
for fname in os.listdir("web_model"):
    size = os.path.getsize(f"web_model/{fname}")
    print(f"  {fname:<30s} {size:>10,} bytes  ({size//1024} KB)")

print("\n프로젝트에 복사할 파일:")
print("  web_model/model_config.json")
print("  web_model/weights.bin")