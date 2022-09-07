#include <emscripten/bind.h>
#include "oscillator.h"
#include "wavetable.h"
#include <vector>

using namespace emscripten;

std::vector<float> makeNoteWrapper(WaveType waveType, int numSamples, float amplitude, float freqHz) {
    std::vector<float> buffer(numSamples);
    Oscillator osc;
    float* waveTable = (float *)malloc(TABLE_LENGTH * sizeof(float));
    generateWaveTable(waveTable, waveType);
    osc.waveTable = waveTable;
    osc.freqHz = freqHz;
    makeNote(osc, numSamples, buffer.data(), amplitude);
    return buffer;
}

EMSCRIPTEN_BINDINGS(module) {
    enum_<WaveType>("WaveType")
        .value("sine", sine)
        .value("saw", saw)
        ;
    function("makeNote", &makeNoteWrapper);

    register_vector<float>("vector<float>");
}
