
#include "oscillator.h"
#include "wavetable.h"
#include <math.h>
#include <stdio.h>
#include <stdlib.h>

void makeNote(Oscillator osc, int numSamples, float *output, float amplitude) {

  float indexIncrement = osc.freqHz * TABLE_LENGTH / SAMPLE_RATE;
  float *wt = osc.waveTable;
  float tableIndex = 0;
  float tableValue;
  for (int i = 0; i < numSamples; i++) {
    tableValue = lookupTable(wt, tableIndex, TABLE_LENGTH);
    output[i] = amplitude * tableValue;
    tableIndex += indexIncrement;
    tableIndex = fmod(tableIndex, TABLE_LENGTH);
  }
}
