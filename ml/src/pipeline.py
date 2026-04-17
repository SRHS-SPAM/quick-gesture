"""
전체 ML 파이프라인 한 번에 실행
실행: python ml/src/pipeline.py
"""
from preprocess import preprocess, load_config
from train import train
from evaluate import evaluate
from export import export

if __name__ == "__main__":
    cfg = load_config()

    print("\n" + "=" * 50)
    print("STEP 1: 전처리")
    print("=" * 50)
    preprocess(cfg)

    print("\n" + "=" * 50)
    print("STEP 2: 학습")
    print("=" * 50)
    train()

    print("\n" + "=" * 50)
    print("STEP 3: 평가")
    print("=" * 50)
    evaluate()

    print("\n" + "=" * 50)
    print("STEP 4: ONNX 변환")
    print("=" * 50)
    export()

    print("\n파이프라인 완료!")
