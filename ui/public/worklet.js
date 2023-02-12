import Module from './synth.js';

class OscillatorWorklet extends AudioWorkletProcessor {
    constructor() {
        super();
        this.isInitialized = false;
        this.synth = Module;
        this.synth.init(this.synth.WaveType.sine);
        this.isInitialized = true;
        this.port.onmessage = (event) => {
            const data = event.data;
            this.setNote(data.isOn, data.freqHz);
        }
    }

    process(inputs, outputs, parameters) {
        if (this.isInitialized) {
            const output = outputs[0];
            for (let channel = 0; channel < output.length; ++channel) {
                const outputChannel = output[channel];
                const frames = this.synth.renderFrames(128, 1.0);
                for (let index = 0; index < frames.size(); index++) {
                    outputChannel[index] = frames.get(index);
                }
            }
        }
        return true;
    }

    setNote = (isNoteOn, freqHz) => {
        console.log("set note", freqHz);
        isNoteOn ? this.synth.noteOn(freqHz) : this.synth.noteOff(freqHz);
    }
}
registerProcessor("oscillator-processor", OscillatorWorklet);

