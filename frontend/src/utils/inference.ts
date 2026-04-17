import * as ort from 'onnxruntime-web';
import type { PredictionResult } from '../types/gesture';

let session: ort.InferenceSession | null = null;
let labels: string[] = [];

export async function loadModel(modelUrl: string, labelsUrl: string): Promise<void> {
  ort.env.wasm.numThreads = 1;
  const [sess, res] = await Promise.all([
    ort.InferenceSession.create(modelUrl, { executionProviders: ['wasm'] }),
    fetch(labelsUrl).then(r => r.json()),
  ]);
  session = sess;
  labels = res;
}

export async function predict(sequence: number[][][]): Promise<PredictionResult | null> {
  if (!session || sequence.length < 30) return null;

  const flat = new Float32Array(
    sequence.slice(-30).flatMap(frame => frame.flatMap(lm => lm.slice(0, 3)))
  );
  const tensor = new ort.Tensor('float32', flat, [1, 30, 99]);
  const inputName = session.inputNames[0];
  const outputName = session.outputNames[0];
  const result = await session.run({ [inputName]: tensor });
  const raw = Array.from(result[outputName].data as Float32Array);

  const maxVal = Math.max(...raw);
  const expArr = raw.map(v => Math.exp(v - maxVal));
  const sum = expArr.reduce((a, b) => a + b, 0);
  const softmax = expArr.map(v => v / sum);

  return Object.fromEntries(labels.map((label, i) => [label, softmax[i] ?? 0]));
}

export function isModelReady(): boolean {
  return session !== null;
}
