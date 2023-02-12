
#include "oscillator.h"
#include "wavetable.h"
#include <math.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>

Voice voices[MAX_POLYPHONY] = {{0}};

void getVoices(float *voicesData) {
  for (int i = 0; i < MAX_POLYPHONY; i++) {
    voicesData[i] = voices[i].osc.freqHz;
  }
}

void getStates(int *statesData) {
  for (int i = 0; i < MAX_POLYPHONY; i++) {
    statesData[i] = voices[i].status;
  }
}

void init(WaveType waveType) {
  for (int i = 0; i < MAX_POLYPHONY; i++) {
    // printf("Voices %f", voices[i].osc.freqHz);
    float *waveTable = (float *)malloc(TABLE_LENGTH * sizeof(float));
    generateWaveTable(waveTable, waveType);
    voices[i].osc.freqHz = 0.0;
    voices[i].status = OFF;
    voices[i].osc.waveTable = waveTable;
    voices[i].midiNote = -1;
  }
}

void noteOn(float freqHz) {
  int midiNote = getMidiNoteFromFreq(freqHz);
  for (int i = 0; i < MAX_POLYPHONY; i++) {
    if (voices[i].status == OFF) {
      voices[i].status = ON;
      voices[i].osc.freqHz = freqHz;
      voices[i].midiNote = midiNote;
      break;
    }
  }
}

void noteOff(float freqHz) {
  int midiNote = getMidiNoteFromFreq(freqHz);
  for (int i = 0; i < MAX_POLYPHONY; i++) {
    if (voices[i].midiNote == midiNote && voices[i].status == ON) {
      voices[i].status = OFF;
      voices[i].osc.freqHz = 0.0;
      voices[i].midiNote = -1;
      break;
    }
  }
}

void fillNotes(int numSamples, float *output, float amplitude) {
  for (int i = 0; i < MAX_POLYPHONY; i++) {
    if (voices[i].status == ON) {
      float indexIncrement = voices[i].osc.freqHz * (TABLE_LENGTH / SAMPLE_RATE);
      float tableIndex = 0;
      for (int k = 0; k < numSamples; k++) {
        float tableValue = lookupTable(voices[i].osc.waveTable, tableIndex, TABLE_LENGTH);
        output[k] += amplitude * tableValue;
        tableIndex += indexIncrement;
        tableIndex = fmod(tableIndex, TABLE_LENGTH);
      }
    }
  }
}

