import React, { useEffect, useState } from 'react';
import logo from './logo.svg';
import './App.css';


function App() {

  const [oscNode, setOscNode] = useState<AudioWorkletNode | null>(null);

  // useEffect(() => {
  //   fetch('synth.wasm').then((response) => {
  //     return response.arrayBuffer();
  //   }).then((wasmBuffer) => {
  //     return WebAssembly.instantiate(wasmBuffer);
  //   }).then(({ instance, module }) => {
  //     console.log(module);
  //   });
  // })


  const startAudioContext = () => {
    const audioContext = new AudioContext();
    audioContext.audioWorklet.addModule('worklet.js').then(() => {
      let oscNode: AudioWorkletNode | null = new AudioWorkletNode(audioContext, 'oscillator-processor');
      let volumeNode = new GainNode(audioContext, { gain: 0.25 });
      oscNode.connect(volumeNode).connect(audioContext.destination);
      console.log("DEEP", oscNode);
      setOscNode(oscNode);

    })
  }

  const setNoteData = (isNoteOn: boolean, freqHz: number) => {
    if (oscNode != null) {
      oscNode.port.postMessage({
        isOn: isNoteOn,
        freqHz: freqHz,
      });
    } else {
      throw new Error("No oscNode yet");
    }
  }

  return (
    <div className="App">
      <button onClick={startAudioContext}>
        Start context
      </button>
      <button onMouseDown={() => setNoteData(true, 440)} onMouseUp={() => setNoteData(false, 440)}>
        A
      </button>
      <button onMouseDown={() => setNoteData(true, 261.6)} onMouseUp={() => setNoteData(false, 261.6)}>
        C
      </button>
      <button onMouseDown={() => setNoteData(true, 329.63)} onMouseUp={() => setNoteData(false, 329.63)}>
        E
      </button>
    </div>
  );
}

export default App;
