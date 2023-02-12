/* header file for oscillator.c */
#ifndef OSCILLATOR_H
#define OSCILLATOR_H
#ifdef __cplusplus
extern "C" {
#endif

#include "wavetable.h"

#define MAX_POLYPHONY 16

typedef struct {
  float freqHz;
  float* waveTable;
  WaveType type;
} Oscillator;

typedef enum { ON, OFF } GATE;

typedef struct {
  Oscillator osc;
  GATE status;
  int midiNote;
} Voice;

void fillNotes(int numSamples, float* output, float amplitude);
void init(WaveType waveType);
void noteOn(float freqHz);
void noteOff(float freqHz);
void getVoices(float* voicesData);
void getStates(int* statesData);

#ifdef __cplusplus
}
#endif

#endif
