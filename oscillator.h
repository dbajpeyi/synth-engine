/* header file for oscillator.c */
#ifndef OSCILLATOR_H
#define OSCILLATOR_H

typedef struct {
	float freqHz;
	float* waveTable;
} Oscillator;

void makeNote(Oscillator osc, int numSamples, float* output, float amplitude);

#endif
