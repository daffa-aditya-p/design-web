class SulingSundaAuthentic {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.reverbNode = null;

        this.notes = ['Do', 'Re', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Do'];
        this.frequencies = [261.63, 293.66, 329.63, 349.23, 392.00, 440.00, 493.88, 523.25];

        this.currentNote = document.getElementById('current-note');
        this.holes = document.querySelectorAll('.hole');
        this.keyLabels = document.querySelectorAll('.key-label');

        this.sustainedNotes = new Map();
        this.pressedKeys = new Set();

        this.initAudio();
        this.bindEvents();
    }

    async initAudio() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.setValueAtTime(0.35, this.audioContext.currentTime);

            await this.createSmoothReverb();

            this.masterGain.connect(this.reverbNode);
            this.reverbNode.connect(this.audioContext.destination);

        } catch (error) {
            console.error('Audio initialization failed:', error);
        }
    }

    async createSmoothReverb() {
        this.reverbNode = this.audioContext.createConvolver();

        const sampleRate = this.audioContext.sampleRate;
        const length = sampleRate * 1.5;
        const impulse = this.audioContext.createBuffer(2, length, sampleRate);

        for (let channel = 0; channel < 2; channel++) {
            const channelData = impulse.getChannelData(channel);
            for (let i = 0; i < length; i++) {
                const decay = Math.pow(1 - i / length, 2.5);
                channelData[i] = (Math.random() * 2 - 1) * decay * 0.15;
            }
        }

        this.reverbNode.buffer = impulse;
    }

    createAuthenticFluteSound(frequency, sustainMode = false) {
        if (!this.audioContext) return null;

        const startTime = this.audioContext.currentTime;
        const soundGroup = {};

        const fundamental = this.audioContext.createOscillator();
        fundamental.type = 'sine';
        fundamental.frequency.setValueAtTime(frequency, startTime);

        const harmonic2 = this.audioContext.createOscillator();
        harmonic2.type = 'sine';
        harmonic2.frequency.setValueAtTime(frequency * 2, startTime);

        const harmonic3 = this.audioContext.createOscillator();
        harmonic3.type = 'sine';
        harmonic3.frequency.setValueAtTime(frequency * 3, startTime);

        const noiseBuffer = this.createFluteNoise();
        const noiseSource = this.audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;
        noiseSource.loop = true;

        const fundamentalGain = this.audioContext.createGain();
        const harmonic2Gain = this.audioContext.createGain();
        const harmonic3Gain = this.audioContext.createGain();
        const noiseGain = this.audioContext.createGain();
        const masterGain = this.audioContext.createGain();

        fundamentalGain.gain.setValueAtTime(0.8, startTime);
        harmonic2Gain.gain.setValueAtTime(0.25, startTime);
        harmonic3Gain.gain.setValueAtTime(0.15, startTime);
        noiseGain.gain.setValueAtTime(0.08, startTime);

        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(frequency * 4, startTime);
        filter.Q.setValueAtTime(1.2, startTime);

        const noiseFilter = this.audioContext.createBiquadFilter();
        noiseFilter.type = 'highpass';
        noiseFilter.frequency.setValueAtTime(800, startTime);
        noiseFilter.Q.setValueAtTime(0.8, startTime);

        if (sustainMode) {
            masterGain.gain.setValueAtTime(0, startTime);
            masterGain.gain.linearRampToValueAtTime(1, startTime + 0.06);
        } else {
            masterGain.gain.setValueAtTime(0, startTime);
            masterGain.gain.linearRampToValueAtTime(1, startTime + 0.04);
            masterGain.gain.linearRampToValueAtTime(0.85, startTime + 0.08);
            masterGain.gain.setValueAtTime(0.85, startTime + 0.6);
            masterGain.gain.linearRampToValueAtTime(0, startTime + 0.8);
        }

        fundamental.connect(fundamentalGain);
        harmonic2.connect(harmonic2Gain);
        harmonic3.connect(harmonic3Gain);
        noiseSource.connect(noiseFilter);
        noiseFilter.connect(noiseGain);

        fundamentalGain.connect(filter);
        harmonic2Gain.connect(filter);
        harmonic3Gain.connect(filter);
        noiseGain.connect(filter);
        filter.connect(masterGain);
        masterGain.connect(this.masterGain);

        fundamental.start(startTime);
        harmonic2.start(startTime);
        harmonic3.start(startTime);
        noiseSource.start(startTime);

        if (!sustainMode) {
            const stopTime = startTime + 0.8;
            fundamental.stop(stopTime);
            harmonic2.stop(stopTime);
            harmonic3.stop(stopTime);
            noiseSource.stop(stopTime);
        }

        soundGroup.fundamental = fundamental;
        soundGroup.harmonic2 = harmonic2;
        soundGroup.harmonic3 = harmonic3;
        soundGroup.noiseSource = noiseSource;
        soundGroup.masterGain = masterGain;

        return soundGroup;
    }

    createFluteNoise() {
        const bufferSize = this.audioContext.sampleRate * 0.1;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.audioContext.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.05;
        }

        return buffer;
    }

    playNote(noteIndex, sustainMode = false) {
        if (noteIndex < 0 || noteIndex >= this.frequencies.length) return;

        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        const frequency = this.frequencies[noteIndex];
        const noteName = this.notes[noteIndex];

        if (sustainMode) {
            if (this.sustainedNotes.has(noteIndex)) return;

            const soundGroup = this.createAuthenticFluteSound(frequency, true);
            this.sustainedNotes.set(noteIndex, soundGroup);
        } else {
            this.createAuthenticFluteSound(frequency, false);
        }

        this.showNote(noteName);
        this.animateHole(noteIndex, sustainMode);
    }

    stopNote(noteIndex) {
        if (this.sustainedNotes.has(noteIndex)) {
            const soundGroup = this.sustainedNotes.get(noteIndex);
            const stopTime = this.audioContext.currentTime;

            soundGroup.masterGain.gain.linearRampToValueAtTime(0, stopTime + 0.08);

            setTimeout(() => {
                try {
                    soundGroup.fundamental.stop();
                    soundGroup.harmonic2.stop();
                    soundGroup.harmonic3.stop();
                    soundGroup.noiseSource.stop();
                } catch (e) { }
            }, 90);

            this.sustainedNotes.delete(noteIndex);
            this.stopHoleAnimation(noteIndex);
        }
    }

    showNote(noteName) {
        this.currentNote.textContent = `${noteName}`;
        this.currentNote.classList.add('playing');

        setTimeout(() => {
            if (this.sustainedNotes.size === 0) {
                this.currentNote.textContent = '';
                this.currentNote.classList.remove('playing');
            }
        }, 1000);
    }

    animateHole(noteIndex, sustained = false) {
        const hole = this.holes[noteIndex];
        const keyLabel = this.keyLabels[noteIndex];

        if (!hole) return;

        hole.classList.add(sustained ? 'pressed' : 'active');
        keyLabel.classList.add('active');

        this.createSoundWave(hole);

        if (!sustained) {
            setTimeout(() => {
                hole.classList.remove('active');
                keyLabel.classList.remove('active');
            }, 200);
        }
    }

    stopHoleAnimation(noteIndex) {
        const hole = this.holes[noteIndex];
        const keyLabel = this.keyLabels[noteIndex];

        if (!hole) return;

        hole.classList.remove('pressed', 'active');
        keyLabel.classList.remove('active');
    }

    createSoundWave(hole) {
        const wave = document.createElement('div');
        wave.className = 'sound-wave';
        hole.appendChild(wave);

        setTimeout(() => {
            if (wave.parentNode) {
                wave.parentNode.removeChild(wave);
            }
        }, 600);
    }

    bindEvents() {
        this.holes.forEach((hole, index) => {
            hole.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.playNote(index, true);
            });

            hole.addEventListener('mouseup', () => {
                this.stopNote(index);
            });

            hole.addEventListener('mouseleave', () => {
                this.stopNote(index);
            });

            hole.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.playNote(index, true);
            });

            hole.addEventListener('touchend', (e) => {
                e.preventDefault();
                this.stopNote(index);
            });
        });

        document.addEventListener('keydown', (e) => {
            const keyNumber = parseInt(e.key);
            if (keyNumber >= 1 && keyNumber <= 8 && !this.pressedKeys.has(keyNumber)) {
                this.pressedKeys.add(keyNumber);
                this.playNote(keyNumber - 1, true);
            }
        });

        document.addEventListener('keyup', (e) => {
            const keyNumber = parseInt(e.key);
            if (keyNumber >= 1 && keyNumber <= 8) {
                this.pressedKeys.delete(keyNumber);
                this.stopNote(keyNumber - 1);
            }
        });

        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.audioContext) {
                this.audioContext.resume();
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new SulingSundaAuthentic();
});