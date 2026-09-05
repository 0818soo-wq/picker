let sharedContext: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!sharedContext) {
    sharedContext = new AudioContext();
  }
  return sharedContext;
}

// AudioContext는 브라우저 정책상 사용자 제스처(클릭 등) 안에서 resume()해야
// 실제로 소리가 납니다. 음성을 미리 준비해두는 시점(마운트 시)에 resume을
// 시도하면 "재생은 성공했지만 소리는 안 나는" 상태가 될 수 있어, 재생
// 직전(클릭 핸들러 안)에 반드시 이 함수를 호출해야 합니다.
export function resumeAudioForPlayback(): void {
  const ctx = sharedContext;
  if (ctx && ctx.state === "suspended") {
    ctx.resume().catch(() => {});
  }
}

// 사장님 음성(TTS)이 인트로 영상 소리보다 작게 녹음되어 있어, Web Audio API의
// GainNode로 재생 볼륨을 원본보다 크게 증폭합니다. HTMLAudioElement의 volume은
// 최대 1(원본 크기)까지만 가능해 이 용도로는 부족합니다.
// 주의: 오디오 엘리먼트 하나당 한 번만 연결할 수 있으므로, 새로 만든
// Audio 객체에 한 번만 호출해야 합니다.
export function boostAudioVolume(audio: HTMLAudioElement, gain = 2): void {
  try {
    const ctx = getAudioContext();
    const source = ctx.createMediaElementSource(audio);
    const gainNode = ctx.createGain();
    gainNode.gain.value = gain;
    source.connect(gainNode).connect(ctx.destination);
  } catch (err) {
    console.error("[audioBoost] 볼륨 증폭 실패", err);
  }
}
