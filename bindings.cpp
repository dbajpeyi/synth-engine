#include "oscillator.h"
#include "wavetable.h"
#include <emscripten/bind.h>
#include <vector>

#define FRAMES_TO_RENDER_PER_LOOP 8

using namespace emscripten;

void initWrapper(WaveType waveType) { init(waveType); }

void noteOnWrapper(float freqHz) { noteOn(freqHz); }

void noteOffWrapper(float freqHz) { noteOff(freqHz); }

std::vector<float> renderFrames(int numSamples, float amplitude) {
  std::vector<float> buffer(numSamples);
  int startingFrames = numSamples;
  // while (startingFrames > FRAMES_TO_RENDER_PER_LOOP) {
  fillNotes(numSamples, buffer.data(), amplitude);
    // startingFrames -= FRAMES_TO_RENDER_PER_LOOP;
  // }
  return buffer;
}

std::vector<float> getVoicesWrapper() {
  std::vector<float> voices(MAX_POLYPHONY);
  getVoices(voices.data());
  return voices;
}

std::vector<int> getStatesWrapper() {
  std::vector<int> voices(MAX_POLYPHONY);
  getStates(voices.data());
  return voices;
}

EMSCRIPTEN_BINDINGS(module) {
  enum_<WaveType>("WaveType").value("sine", sine).value("saw", saw);
  function("renderFrames", &renderFrames);
  function("init", &initWrapper);
  function("noteOn", &noteOnWrapper);
  function("noteOff", &noteOffWrapper);
  function("getVoices", &getVoicesWrapper);
  function("getStates", &getStatesWrapper);

  register_vector<float>("vector<float>");
  register_vector<int>("vector<int>");
}
