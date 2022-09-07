/* header file for oscillator.c */
#ifndef OSCILLATOR_H
#define OSCILLATOR_H
#ifdef __cplusplus
extern "C" {
#endif

typedef struct {
	float freqHz;
	float* waveTable;
} Oscillator;

void makeNote(Oscillator osc, int numSamples, float* output, float amplitude);

#ifdef __cplusplus
}
#endif

#endif
