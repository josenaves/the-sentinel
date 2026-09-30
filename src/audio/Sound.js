// Tiny WebAudio synth for UI/game feedback. No dependencies; the context
// is created lazily so construction is safe anywhere.
export class Sound {
    context = null;
    // Call from a user gesture so the context is allowed to play.
    unlock() {
        try {
            if (!this.context) {
                const factory = window.AudioContext ?? window.webkitAudioContext;
                if (!factory)
                    return;
                this.context = new factory();
            }
            if (this.context.state === 'suspended') {
                void this.context.resume();
            }
        }
        catch {
            // Audio unavailable: stay silent, never break the game.
        }
    }
    tone(frequency, duration, type = 'square', volume = 0.04, delay = 0) {
        try {
            if (!this.context) {
                const factory = window.AudioContext ?? window.webkitAudioContext;
                if (!factory)
                    return;
                this.context = new factory();
            }
            if (this.context.state === 'suspended') {
                void this.context.resume();
            }
            const start = this.context.currentTime + delay;
            const oscillator = this.context.createOscillator();
            const gain = this.context.createGain();
            oscillator.type = type;
            oscillator.frequency.setValueAtTime(frequency, start);
            gain.gain.setValueAtTime(volume, start);
            gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
            oscillator.connect(gain);
            gain.connect(this.context.destination);
            oscillator.start(start);
            oscillator.stop(start + duration);
        }
        catch {
            // Audio unavailable: stay silent, never break the game.
        }
    }
    absorb() {
        this.tone(660, 0.08);
    }
    create() {
        this.tone(330, 0.1);
    }
    transfer() {
        this.tone(440, 0.08);
        this.tone(880, 0.12, 'square', 0.04, 0.08);
    }
    hyperspace() {
        this.tone(880, 0.1);
        this.tone(587, 0.1, 'square', 0.04, 0.1);
        this.tone(392, 0.16, 'square', 0.04, 0.2);
    }
    alarm() {
        this.tone(220, 0.15, 'sawtooth');
    }
    partial() {
        this.tone(880, 0.06, 'square', 0.03);
    }
    meanie() {
        this.tone(180, 0.12, 'sawtooth');
        this.tone(180, 0.12, 'sawtooth', 0.04, 0.16);
    }
    win() {
        this.tone(523, 0.1);
        this.tone(659, 0.1, 'square', 0.04, 0.1);
        this.tone(784, 0.2, 'square', 0.04, 0.2);
    }
    lose() {
        this.tone(392, 0.2, 'sawtooth');
        this.tone(196, 0.4, 'sawtooth', 0.04, 0.2);
    }
}
